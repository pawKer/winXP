require('./content/build.cjs').buildContent();
const fs = require('fs');
const path = require('path');
const os = require('os');
const assert = require('assert');
const { spawn } = require('child_process');
const { createPreview } = require('./preview.cjs');
const { releases } = require('../src/content/catalogue');
const testRelease = releases.find(release => release.slug === 'forever');
const testAudioUrl = testRelease.webAudioUrl || testRelease.trackUrl;
const { getPage, structuredData } = require('../src/content/pages');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const artifactDir = fs.mkdtempSync(path.join(os.tmpdir(), 'winxp-blog-qa-'));
  const executable = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/chromium',
    '/usr/bin/google-chrome',
  ]
    .filter(Boolean)
    .find(file => fs.existsSync(file));
  if (!executable)
    throw new Error('Set CHROME_PATH to a Chrome/Chromium executable.');
  const missingMedia = process.env.QA_MISSING_MEDIA === '1';
  const hasTestMedia =
    !missingMedia &&
    fs.existsSync(
      path.resolve(
        __dirname,
        process.env.TEST_BASE_URL ? '../public' : '../build',
        '.' + testAudioUrl,
      ),
    );
  const server = process.env.TEST_BASE_URL
    ? null
    : createPreview({ missingMedia });
  if (server)
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin =
    process.env.TEST_BASE_URL || `http://127.0.0.1:${server.address().port}`;
  console.log(`Browser QA: ${origin}; artifacts: ${artifactDir}`);
  const browser = spawn(
    executable,
    [
      '--headless=new',
      ...(process.env.QA_VISUALIZER
        ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']
        : ['--disable-gpu']),
      '--mute-audio',
      '--no-first-run',
      '--no-default-browser-check',
      '--remote-debugging-port=0',
      '--remote-allow-origins=*',
      `--user-data-dir=${artifactDir}`,
      'about:blank',
    ],
    { windowsHide: true, stdio: 'ignore' },
  );
  let ws;
  try {
    let port;
    for (let i = 0; i < 150; i++) {
      try {
        port = fs
          .readFileSync(path.join(artifactDir, 'DevToolsActivePort'), 'utf8')
          .split('\n')[0];
        break;
      } catch (_) {}
      await delay(100);
    }
    assert(port, 'Chrome debugging port');
    const targets = await (
      await fetch(`http://127.0.0.1:${port}/json/list`, {
        signal: AbortSignal.timeout(10000),
      })
    ).json();
    ws = new WebSocket(
      targets.find(target => target.type === 'page').webSocketDebuggerUrl,
    );
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
      setTimeout(
        () => reject(new Error('Chrome connection timeout')),
        10000,
      ).unref();
    });
    const pending = new Map();
    let nextId = 0;
    const errors = [];
    const scripts = [];
    const mediaBytes = new Map();
    ws.onmessage = event => {
      const message = JSON.parse(event.data);
      if (message.method === 'Runtime.exceptionThrown')
        errors.push(
          message.params.exceptionDetails.exception?.description ||
            message.params.exceptionDetails.text,
        );
      if (message.method === 'Network.requestWillBeSent') {
        const url = message.params.request.url;
        if (url.startsWith(origin) && /\.js(?:\?|$)/.test(url))
          scripts.push(url);
        if (url === new URL(testAudioUrl, origin).href)
          mediaBytes.set(message.params.requestId, 0);
      }
      if (
        message.method === 'Network.dataReceived' &&
        mediaBytes.has(message.params.requestId)
      )
        mediaBytes.set(
          message.params.requestId,
          mediaBytes.get(message.params.requestId) + message.params.dataLength,
        );
      if (!message.id || !pending.has(message.id)) return;
      const item = pending.get(message.id);
      pending.delete(message.id);
      clearTimeout(item.timer);
      if (message.error) item.reject(new Error(JSON.stringify(message.error)));
      else item.resolve(message.result);
    };
    const cdp = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const id = ++nextId;
        const timer = setTimeout(() => {
          pending.delete(id);
          reject(new Error(`${method} timed out`));
        }, 20000);
        pending.set(id, { resolve, reject, timer });
        ws.send(JSON.stringify({ id, method, params }));
      });
    const evaluate = async expression => {
      const result = await cdp('Runtime.evaluate', {
        expression:
          typeof expression === 'function'
            ? `(${expression.toString()})()`
            : expression,
        returnByValue: true,
        awaitPromise: true,
        userGesture: true,
      });
      if (result.exceptionDetails)
        throw new Error(
          result.exceptionDetails.exception?.description ||
            result.exceptionDetails.text,
        );
      return result.result.value;
    };
    const waitFor = async (expression, label) => {
      for (let i = 0; i < 200; i++) {
        if (await evaluate(expression)) return;
        await delay(100);
      }
      console.error(
        JSON.stringify(
          {
            errors,
            snapshot: await evaluate(
              '({url:location.href,title:document.title,classes:document.documentElement.className,text:document.body.innerText.slice(0,600),webamp:[...document.querySelectorAll("#webamp")].map(el=>({tag:el.tagName,ids:[...el.querySelectorAll("[id]")].map(x=>x.id).slice(0,40)}))})',
            ),
          },
          null,
          2,
        ),
      );
      await screenshot('failure');
      throw new Error(`Timed out: ${label || expression}`);
    };
    const viewport = (width, height) =>
      cdp('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: false,
      });
    const assertHead = async pathname => {
      const page = getPage(pathname);
      const head = await evaluate(() => ({
        title: document.title,
        description: document.querySelector('meta[name=description]').content,
        canonical: document.querySelector('link[rel=canonical]').href,
        og: document.querySelector('meta[property="og:url"]').content,
        schema: JSON.parse(document.querySelector('#page-schema').textContent),
      }));
      assert.equal(head.title, page.title, pathname + ': current title');
      assert.equal(
        head.description,
        page.description,
        pathname + ': current description',
      );
      assert.equal(
        head.canonical,
        'https://reshra.xyz' + page.path,
        pathname + ': current canonical',
      );
      assert.equal(head.og, head.canonical, pathname + ': current social URL');
      assert.deepEqual(
        head.schema,
        structuredData(page),
        pathname + ': current schema',
      );
    };
    const navigate = async route => {
      await cdp('Page.navigate', { url: origin + route });
      await waitFor(
        'document.documentElement.classList.contains("app-ready")',
        'Application ready',
      );
      await delay(250);
    };
    const click = async selector => {
      await evaluate(
        `(() => {const element=document.querySelector(${JSON.stringify(
          selector,
        )});if(!element)throw new Error('Missing element: '+${JSON.stringify(
          selector,
        )});element.click();})()`,
      );
      await delay(200);
    };
    const screenshot = async name => {
      const capture = await cdp('Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: false,
      });
      fs.writeFileSync(
        path.join(artifactDir, `${name}.png`),
        Buffer.from(capture.data, 'base64'),
      );
    };
    const checkWinampMovement = async () => {
      const rootPosition = await evaluate(() => {
        const box = document.querySelector('#webamp').getBoundingClientRect();
        return { left: Math.round(box.left), top: Math.round(box.top) };
      });
      assert.deepEqual(
        rootPosition,
        { left: 0, top: 0 },
        'Webamp retains viewport coordinates without an extra DOM offset',
      );
      await evaluate(
        '[...document.querySelectorAll("button.footer__window")].find(button=>button.textContent.includes("Winamp")).click()',
      );
      const before = await evaluate(() => {
        const box = document
          .querySelector('#webamp #main-window')
          .getBoundingClientRect();
        return { left: box.left, top: box.top };
      });
      const start = { x: before.left + 110, y: before.top + 7 };
      const end = { x: start.x + 65, y: start.y + 30 };
      await cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', ...start });
      await cdp('Input.dispatchMouseEvent', {
        type: 'mousePressed',
        ...start,
        button: 'left',
        clickCount: 1,
      });
      await cdp('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        ...end,
        button: 'left',
        buttons: 1,
      });
      await cdp('Input.dispatchMouseEvent', {
        type: 'mouseReleased',
        ...end,
        button: 'left',
        clickCount: 1,
      });
      await delay(150);
      const after = await evaluate(() => {
        const box = document
          .querySelector('#webamp #main-window')
          .getBoundingClientRect();
        return { left: box.left, top: box.top };
      });
      assert.equal(
        Math.round(after.left - before.left),
        65,
        'Winamp follows horizontal dragging',
      );
      assert.equal(
        Math.round(after.top - before.top),
        30,
        'Winamp follows vertical dragging',
      );
      await viewport(800, 900);
      await waitFor(
        `Array.from(document.querySelectorAll('#webamp .window')).filter(panel=>panel.getClientRects().length).every(panel=>{const box=panel.getBoundingClientRect();return box.left>=-1&&box.top>=-1&&box.right<=innerWidth+1&&box.bottom<=innerHeight+1;})`,
        'Winamp keeps all open panels and controls inside the resized viewport',
      );
      await viewport(1366, 900);
      console.log('Verified native Winamp dragging and viewport boundaries.');
    };
    await cdp('Page.enable');
    await cdp('Runtime.enable');
    await cdp('Network.enable');
    await cdp('Network.setBlockedURLs', {
      urls: [
        '*://fonts.googleapis.com/*',
        '*://fonts.gstatic.com/*',
        '*://*.google-analytics.com/*',
        '*://www.googletagmanager.com/*',
        ...(process.env.QA_FAILED_DESKTOP
          ? [`${origin}/static/js/*chunk.js`]
          : []),
        ...(process.env.QA_LIVE_VIDEO
          ? []
          : [
              '*://www.youtube.com/iframe_api',
              '*://www.youtube-nocookie.com/*',
            ]),
      ],
    });
    await cdp('Page.addScriptToEvaluateOnNewDocument', {
      source:
        'window.__analytics=[];window.addEventListener("reshra:analytics",e=>window.__analytics.push(e.detail));',
    });

    if (process.env.QA_MOBILE_TASKBAR === '1') {
      await viewport(440, 740);
      await navigate('/');
      await waitFor(
        '!!document.querySelector(".ie__content")',
        'Mobile desktop',
      );
      // Model iOS's large 100vh while browser controls leave less visible space.
      await evaluate(() => {
        const style = document.createElement('style');
        style.textContent = '#root { min-height: 956px; }';
        document.head.appendChild(style);
      });
      const checkTaskbar = async label => {
        await delay(150);
        const geometry = await evaluate(() => {
          const bar = document
            .querySelector('.footer__start')
            .closest('footer')
            .getBoundingClientRect();
          const start = document
            .querySelector('.footer__start')
            .getBoundingClientRect();
          const reading = document
            .querySelector('#desktop-reading-toggle')
            .getBoundingClientRect();
          const ie = document
            .querySelector('.ie__content')
            .closest('[style*="translate"]')
            .getBoundingClientRect();
          const hit = document.elementFromPoint(
            start.left + start.width / 2,
            start.top + start.height / 2,
          );
          return {
            barBottom: bar.bottom,
            barTop: bar.top,
            startBottom: start.bottom,
            readingBottom: reading.bottom,
            visibleHeight: innerHeight,
            ieBottom: ie.bottom,
            startReachable: document
              .querySelector('.footer__start')
              .contains(hit),
          };
        });
        assert(
          geometry.barBottom <= geometry.visibleHeight + 1,
          label + ': taskbar inside the viewport ' + JSON.stringify(geometry),
        );
        assert(
          geometry.startBottom <= geometry.visibleHeight + 1 &&
            geometry.readingBottom <= geometry.visibleHeight + 1,
          label + ': Start and Reading View controls visible',
        );
        assert(
          geometry.startReachable,
          label + ': Start is reachable above IE',
        );
        assert(
          geometry.ieBottom <= geometry.barTop + 4,
          label + ': maximized IE leaves room for the taskbar',
        );
      };
      await checkTaskbar('Portrait with browser controls');
      const checkMobileStacking = async () => {
        await waitFor(
          '!!document.querySelector("#desktop-layer #webamp #main-window")',
          'Winamp attaches inside the desktop window stack',
        );
        await delay(500);
        assert(
          await evaluate(() => {
            const shell = node => node.closest('[style*="translate"]');
            const ie = shell(document.querySelector('.ie__content'));
            const winamp = shell(document.querySelector('#webamp'));
            const box = document
              .querySelector('#webamp #main-window')
              .getBoundingClientRect();
            const hit = document.elementFromPoint(
              Math.max(5, Math.min(innerWidth - 5, box.left + box.width / 2)),
              Math.max(5, Math.min(innerHeight - 40, box.top + box.height / 2)),
            );
            return (
              Number(ie.style.zIndex) > Number(winamp.style.zIndex) &&
              ie.contains(hit)
            );
          }),
          'IE stays above Winamp after asynchronous mobile startup',
        );
      };
      for (let load = 0; load < 3; load++) {
        if (load) {
          await navigate('/');
          await evaluate(() => {
            const style = document.createElement('style');
            style.textContent = '#root { min-height: 956px; }';
            document.head.appendChild(style);
          });
        }
        await checkMobileStacking();
      }

      assert(
        await evaluate(() => {
          const image = document.querySelector('.footer__start img');
          const box = image.getBoundingClientRect();
          return (
            Math.abs(
              box.width / box.height - image.naturalWidth / image.naturalHeight,
            ) < 0.01
          );
        }),
        'Mobile Start artwork keeps its full aspect ratio',
      );
      const tapStart = async () => {
        const point = await evaluate(() => {
          const box = document
            .querySelector('.footer__start')
            .getBoundingClientRect();
          return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
        });
        await cdp('Input.dispatchTouchEvent', {
          type: 'touchStart',
          touchPoints: [point],
        });
        await cdp('Input.dispatchTouchEvent', {
          type: 'touchEnd',
          touchPoints: [],
        });
      };
      await cdp('Emulation.setTouchEmulationEnabled', { enabled: true });
      await tapStart();
      await waitFor(
        '!!document.querySelector("#xp-start-menu .menu")',
        'Touch opens Start',
      );
      await tapStart();
      await waitFor(
        '!document.querySelector("#xp-start-menu .menu")',
        'Touch closes Start',
      );
      await cdp('Emulation.setTouchEmulationEnabled', { enabled: false });
      await delay(400);
      await evaluate('document.querySelector(".footer__start").focus()');

      await cdp('Input.dispatchKeyEvent', {
        type: 'keyDown',
        key: ' ',
        code: 'Space',
        windowsVirtualKeyCode: 32,
      });
      await cdp('Input.dispatchKeyEvent', {
        type: 'keyUp',
        key: ' ',
        code: 'Space',
        windowsVirtualKeyCode: 32,
      });
      await waitFor(
        '!!document.querySelector("#xp-start-menu .menu")',
        'Keyboard opens Start',
      );
      await click('.footer__start');
      await viewport(440, 860);
      await checkTaskbar('Browser controls collapsed');
      await viewport(874, 380);
      await checkTaskbar('Landscape');
      await click('#desktop-reading-toggle');
      assert(
        await evaluate(
          '!document.documentElement.classList.contains("desktop-mode")',
        ),
        'Reading mode keeps its own scrolling layout',
      );
      await click('#view-toggle');
      await checkTaskbar('Return from Reading View');
      await checkMobileStacking();
      console.log(
        'PASS: mobile taskbar and Start remain visible with a large-vh minimum, browser resizing, landscape and presentation switches; touch and keyboard toggle Start; IE stays above Winamp across repeated loads.',
      );
      return;
    }

    if (process.env.QA_STARTUP === '1') {
      await cdp('Network.setBlockedURLs', { urls: [`${origin}/static/js/*`] });
      await cdp('Page.navigate', { url: origin + '/' });
      await waitFor(
        'document.querySelector("#static-content main") && document.documentElement.classList.contains("desktop-starting")',
        'Homepage hides reading content during desktop startup',
      );
      assert(
        await evaluate(
          '!document.querySelector("#static-content").getClientRects().length',
        ),
        'Reading content never flashes before the desktop',
      );
      assert(
        await evaluate(
          '!document.querySelector("#desktop-startup, .xp-boot-screen")',
        ),
        'No loading screen is enabled',
      );
      await waitFor(
        'document.querySelector("#static-content")?.getClientRects().length',
        'Readable fallback returns when app scripts never load',
      );
      await cdp('Page.navigate', { url: origin + '/?view=read' });
      await waitFor(
        'document.querySelector("#static-content main")?.getClientRects().length',
        'Explicit reading view is visible immediately',
      );
      assert(
        await evaluate(
          '!document.documentElement.classList.contains("desktop-starting")',
        ),
        'Explicit reading view has no desktop loading screen',
      );
      await cdp('Emulation.setScriptExecutionDisabled', { value: true });
      await cdp('Page.navigate', { url: origin + '/' });
      await waitFor(
        'document.querySelector("#static-content main")?.getClientRects().length',
        'Homepage stays readable without JavaScript',
      );
      console.log(
        'PASS: no initial reading flash, timed script-failure fallback, explicit reading mode, and JavaScript-disabled homepage.',
      );
      return;
    }

    if (process.env.QA_VISUALIZER) {
      // Exercise the visualizer with real software WebGL in headless Chrome.
      // Only the renderer label is simulated to enter the hardware-GPU path.
      await cdp('Page.addScriptToEvaluateOnNewDocument', {
        source: `for (const Context of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) {
          if (!Context) continue;
          const original = Context.prototype.getParameter;
          Context.prototype.getParameter = function(parameter) {
            return parameter === 0x9246 ? 'QA hardware path' : original.call(this, parameter);
          };
        }`,
      });
    }

    await viewport(1366, 900);
    if (process.env.QA_POSITION_REFERENCE) {
      await cdp('Page.navigate', { url: origin + '/' });
      await waitFor(
        '!!document.querySelector("#webamp #main-window")',
        'Reference Winamp',
      );
      await delay(500);
      const geometry = await evaluate(() =>
        ['main-window', 'equalizer-window', 'playlist-window'].map(id => {
          const element = document.querySelector(`#webamp #${id}`);
          if (!element) return { id, absent: true };
          const box = element.getBoundingClientRect();
          return {
            id,
            left: box.left,
            top: box.top,
            width: box.width,
            height: box.height,
          };
        }),
      );
      await screenshot('winamp-position-reference');
      console.log(JSON.stringify({ origin, geometry, artifactDir }));
      return;
    }
    if (process.env.QA_VISUALIZER) {
      await navigate('/');
      await waitFor(
        '!!document.querySelector("#webamp canvas")',
        'Milkdrop canvas',
      );
      assert(
        await evaluate(
          'document.querySelector("#webamp canvas").getBoundingClientRect().width>100',
        ),
        'Milkdrop opens in its original layout',
      );
      const initialPosition = await evaluate(() => {
        const box = document
          .querySelector('#webamp #main-window')
          .getBoundingClientRect();
        return { left: box.left, top: box.top };
      });
      assert.deepEqual(
        initialPosition,
        { left: 321, top: 243 },
        'Winamp startup matches the measured production layout',
      );
      await checkWinampMovement();
      await click('.ie__content a[href="/music"]');
      await click('.ie__content a[href="/music/forever"]');
      await click('.ie__content button[data-play-winamp="forever"]');
      if (hasTestMedia) {
        await waitFor(
          'window.__analytics.some(e=>e.eventName==="music_play_start"&&e.parameters.player==="winamp"&&e.parameters.release==="forever")',
          'Visualizer and correct recording play',
        );
        await waitFor(
          'document.querySelector("#webamp #marquee").textContent.toLowerCase().includes("reshra - forever")',
          'Winamp metadata',
        );
      }
      await delay(5000);
      await screenshot('milkdrop-original-layout');
      assert(
        await evaluate('!!document.querySelector("#webamp #close")'),
        'Milkdrop preserves the player controls',
      );
      assert.deepEqual(errors, [], 'No visualizer exceptions');
      console.log(
        JSON.stringify({
          result: 'PASS',
          check:
            'Milkdrop default preset and original layout, correct track metadata',
          artifactDir,
        }),
      );
      return;
    }
    if (process.env.QA_REPORT_FILE) {
      const reportFile = path.resolve(process.env.QA_REPORT_FILE);
      const snapshot = JSON.parse(
        fs.readFileSync(
          path.join(path.dirname(reportFile), 'snapshot.json'),
          'utf8',
        ),
      );
      await cdp('Page.navigate', {
        url: require('url').pathToFileURL(reportFile).href,
      });
      await waitFor(
        'document.querySelectorAll("#cards article").length===5',
        'Historical report dashboard ready',
      );
      const first = snapshot.periods[0].reports.find(
        report => report.id === 'overview',
      ).rows[0];
      assert.equal(
        await evaluate(
          'document.querySelectorAll("#cards strong")[2].textContent.replaceAll(",","")',
        ),
        first.screenPageViews,
        'Dashboard defaults to public-site totals',
      );
      await screenshot('historical-report-desktop');
      await evaluate(() => {
        const select = document.querySelector('#period');
        select.value = 'history-all';
        select.dispatchEvent(new Event('change'));
      });
      assert(
        await evaluate(
          'document.querySelector("#scope").textContent.includes("All hosts")',
        ),
        'All-host diagnostic scope is explicit',
      );
      await evaluate(() => {
        const select = document.querySelector('#report');
        select.value = 'links';
        select.dispatchEvent(new Event('change'));
        const query = document.querySelector('#query');
        query.value = 'Midi Pedal';
        query.dispatchEvent(new Event('input'));
      });
      assert(
        await evaluate(
          'document.querySelectorAll("#rows tr").length>0 && document.querySelectorAll("#rows tr").length<6',
        ),
        'Historical link table search works',
      );
      assert(
        await evaluate(
          'document.querySelector("#csv").getAttribute("href")==="history-all-links.csv"',
        ),
        'CSV download matches selected scope/report',
      );
      await viewport(390, 844);
      assert(
        await evaluate('document.documentElement.scrollWidth<=innerWidth+1'),
        'Report dashboard fits a phone',
      );
      await screenshot('historical-report-phone');
      assert.deepEqual(errors, [], 'No report JavaScript exceptions');
      console.log(
        'PASS: historical dashboard public/all-host scope, table search, CSV links and mobile reflow.',
      );
      return;
    }
    if (process.env.QA_FAILED_DESKTOP) {
      await navigate('/blog/building-my-midi-pedal');
      await click('#view-toggle');
      await waitFor(
        '!!document.querySelector("[data-desktop-recovery]")',
        'Reading fallback after a failed desktop bundle',
      );
      assert.equal(
        await evaluate('document.querySelector("h1").textContent'),
        'Building a custom MIDI pedal',
        'Failed desktop preserves the requested article',
      );
      assert.equal(
        await evaluate('document.querySelector("link[rel=canonical]").href'),
        'https://reshra.xyz/blog/building-my-midi-pedal',
        'Recovery preserves canonical',
      );
      assert.equal(
        await evaluate(
          'window.__analytics.filter(e=>e.eventName==="page_view").length',
        ),
        1,
        'Recovery is not another content visit',
      );
      assert(
        await evaluate(
          'new URL(document.querySelector("#desktop-retry").href).searchParams.get("view")==="desktop"',
        ),
        'Retry opens the requested desktop presentation',
      );
      await cdp('Network.emulateNetworkConditions', {
        offline: true,
        latency: 0,
        downloadThroughput: -1,
        uploadThroughput: -1,
      });
      await evaluate(
        'window.__contentFetches=0;window.fetch=async()=>{window.__contentFetches++;return {ok:false,status:503,text:async()=>"<html>Unavailable</html>"};}',
      );
      await click('.site-nav a[href^="/notes"]');
      assert(
        await evaluate(
          'location.pathname==="/notes" && !!document.querySelector(".note-index")',
        ),
        'Content navigation works offline after desktop failure',
      );
      await click('.site-nav a[href="/blog"]');
      assert.equal(
        await evaluate('document.querySelectorAll(".post-preview").length'),
        6,
        'Blog stays readable offline',
      );
      assert.equal(
        await evaluate('window.__contentFetches'),
        0,
        'Content does not depend on failed/malformed page fetches',
      );
      assert(
        errors.every(error => /ChunkLoadError|Loading chunk/.test(error)),
        'Only the intentionally failed chunk may raise a browser exception',
      );
      await screenshot('desktop-recovery-offline');
      await cdp('Network.emulateNetworkConditions', {
        offline: false,
        latency: 0,
        downloadThroughput: -1,
        uploadThroughput: -1,
      });
      await navigate('/music/forever?utm_source=qa#listen');
      await waitFor(
        '!!document.querySelector("[data-desktop-recovery]")',
        'Direct desktop entry recovers to reading',
      );
      await assertHead('/music/forever');
      assert.equal(
        await evaluate('document.querySelector("h1").textContent'),
        'forever',
        'Direct failure keeps the requested recording',
      );
      assert(
        await evaluate(
          '(()=>{const retry=new URL(document.querySelector("#desktop-retry").href);return retry.searchParams.get("utm_source")==="qa" && retry.hash==="#listen";})()',
        ),
        'Retry keeps campaign parameters and fragment',
      );
      await cdp('Network.setBlockedURLs', {
        urls: [
          '*://*.google-analytics.com/*',
          '*://www.googletagmanager.com/*',
          '*://www.youtube.com/iframe_api',
          '*://www.youtube-nocookie.com/*',
        ],
      });
      await click('#desktop-retry');
      await waitFor(
        '!!document.querySelector("#desktop-reading-toggle")',
        'Reload retry starts the restored desktop bundle',
      );
      assert(
        await evaluate(
          '!document.querySelector("[data-desktop-recovery]") && document.documentElement.classList.contains("desktop-mode")',
        ),
        'Retry restores the desktop',
      );
      await assertHead('/music/forever');
      console.log(
        'PASS: failed desktop bundles preserve direct/song and article content, metadata and offline navigation; retry reloads the restored desktop and retains campaign parameters.',
      );
      return;
    }
    if (process.env.QA_LIVE_VIDEO) {
      await navigate('/music/forever?view=read');
      await evaluate(
        'document.querySelector("iframe[data-video-id]").scrollIntoView({block:"center"})',
      );
      await waitFor(
        'document.querySelector("iframe[data-video-id]").dataset.playerReady==="true"',
        'Live YouTube SDK handshake',
      );
      const center = await evaluate(
        '(()=>{const r=document.querySelector("iframe[data-video-id]").getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()',
      );
      await cdp('Input.dispatchMouseEvent', {
        type: 'mousePressed',
        ...center,
        button: 'left',
        clickCount: 1,
      });
      await cdp('Input.dispatchMouseEvent', {
        type: 'mouseReleased',
        ...center,
        button: 'left',
        clickCount: 1,
      });
      await waitFor(
        'window.__analytics.some(e=>e.eventName==="video_start")',
        'Live YouTube playback',
      );
      assert.equal(
        await evaluate(
          'window.__analytics.find(event=>event.eventName==="video_start").parameters.video_title',
        ),
        require('../src/content/videos.json').find(
          video => video.id === 'hsTri1x-pEE',
        ).title,
        'Manual video events include the verified title for GA reporting',
      );
      if (hasTestMedia) {
        await evaluate(
          '(async()=>{const a=document.querySelector("audio[data-native-audio]");a.muted=true;await a.play();})()',
        );
        await waitFor(
          'document.querySelector("iframe[data-video-id]").dataset.playerState==="2"',
          'Native playback pauses YouTube',
        );
      }
      await click('#view-toggle');
      await waitFor(
        '!!document.querySelector("#desktop-reading-toggle")',
        'Desktop after video playback',
      );
      assert.equal(
        await evaluate(
          'document.querySelectorAll(".standalone-surface iframe[data-video-id]").length',
        ),
        0,
        'Previous video removed on mode change',
      );
      assert.deepEqual(errors, [], 'No unhandled live-video exceptions');
      console.log(
        'PASS: live YouTube playback, video_start event, playback ownership and presentation switch.',
      );
      return;
    }
    await navigate('/blog');
    assert.equal(
      await evaluate('!!document.querySelector("#desktop-layer")'),
      false,
      'Direct blog skips desktop',
    );
    assert(
      await evaluate(
        'document.querySelector(".blog-page") && document.querySelectorAll(".post-preview").length===6',
      ),
      'Blog feed',
    );
    assert.equal(
      await evaluate(
        'window.__analytics.filter(e=>e.eventName==="page_view").length',
      ),
      1,
      'One initial page view',
    );
    const standaloneScripts = [...new Set(scripts)];
    await screenshot('blog-desktop');
    await click('.blog-sidebar a[href="/blog/category/projects"]');
    assert.equal(
      await evaluate('location.pathname'),
      '/blog/category/projects',
    );
    assert.equal(
      await evaluate('document.querySelectorAll(".post-preview").length'),
      3,
      'Project category',
    );
    await click('h2 a[href="/blog/building-my-midi-pedal"]');
    await assertHead('/blog/building-my-midi-pedal');
    assert.equal(
      await evaluate('document.querySelector("link[rel=canonical]").href'),
      'https://reshra.xyz/blog/building-my-midi-pedal',
    );
    assert(
      await evaluate(
        'document.querySelectorAll(".chapter-list li").length===5',
      ),
      'Verified chapter links',
    );
    await screenshot('article-desktop');
    for (const width of [390, 320]) {
      await viewport(width, 844);
      await navigate('/blog/building-my-midi-pedal');
      assert(
        await evaluate('document.documentElement.scrollWidth <= innerWidth+1'),
        `Article reflows at ${width}`,
      );
      await cdp('Input.dispatchMouseEvent', {
        type: 'mouseWheel',
        x: 150,
        y: 500,
        deltaX: 0,
        deltaY: 550,
      });
      await delay(250);
      assert(await evaluate('scrollY>0'), `Article scrolls at ${width}`);
      await evaluate('scrollTo(0,0)');
      await screenshot(`article-${width}`);
    }
    for (const pathname of [
      '/blog/building-my-midi-pedal',
      '/notes/guitar-parts?view=read',
    ]) {
      await navigate(pathname);
      await evaluate(
        '(()=>{const elements=[...document.querySelectorAll(".public-page *,.mode-controls *")];const sizes=elements.map(el=>parseFloat(getComputedStyle(el).fontSize));elements.forEach((el,i)=>{if(sizes[i]>0)el.style.fontSize=`${sizes[i]*2}px`;});})()',
      );
      assert(
        await evaluate('document.documentElement.scrollWidth<=innerWidth+1'),
        pathname + ': doubled text reflows at 320 CSS pixels',
      );
      await evaluate('document.querySelector("main").focus()');
      await cdp('Input.dispatchKeyEvent', {
        type: 'keyDown',
        key: 'End',
        code: 'End',
        windowsVirtualKeyCode: 35,
        modifiers: 2,
      });
      await cdp('Input.dispatchKeyEvent', {
        type: 'keyUp',
        key: 'End',
        code: 'End',
        windowsVirtualKeyCode: 35,
        modifiers: 0,
      });
      await waitFor(
        'Math.ceil(scrollY+innerHeight)>=document.documentElement.scrollHeight-2',
        'Keyboard reaches the document footer with doubled text',
      );
      await evaluate('scrollTo(0,0)');
      await cdp('Emulation.setTouchEmulationEnabled', { enabled: true });
      await cdp('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: 150, y: 550 }],
      });
      for (let step = 1; step <= 10; step++) {
        await cdp('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [{ x: 150, y: 550 - step * 40 }],
        });
        await delay(25);
      }
      await cdp('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: [],
      });
      await delay(150);
      assert(
        await evaluate('scrollY>0'),
        pathname + ': touch scrolls enlarged content',
      );
      await cdp('Emulation.setTouchEmulationEnabled', { enabled: false });
    }
    console.log(
      'Verified 2× text enlargement, 320 CSS-pixel reflow, keyboard footer access and touch scrolling.',
    );
    await navigate('/notes/guitar-parts?view=read');
    assert(
      await evaluate('document.documentElement.scrollWidth<=innerWidth+1'),
      'Reading note wraps URLs',
    );
    await cdp('Input.dispatchMouseEvent', {
      type: 'mouseWheel',
      x: 150,
      y: 500,
      deltaX: 0,
      deltaY: 550,
    });
    await delay(200);
    assert(await evaluate('scrollY>0'), 'Reading note scrolls');
    assert(
      await evaluate('!!document.querySelector("#view-toggle")'),
      'Mode switch survives reading mode',
    );

    await navigate('/notes/thank-you?view=read');
    await click('a[data-note-action="playMusic"]');
    const noteAction = await evaluate(
      'window.__analytics.find(event=>event.eventName==="notes_link_click")',
    );
    assert.equal(
      noteAction.parameters.action,
      'playMusic',
      'Legacy note action remains reportable',
    );
    assert.equal(noteAction.parameters.type, 'action');
    assert(
      noteAction.parameters.label.includes('Open my music archive'),
      'Legacy label is preserved alongside new context',
    );

    await viewport(1366, 900);
    await navigate('/notes/guitar-parts?source=shared#resources');
    await waitFor(
      '!!document.querySelector(".notepad-document")',
      'Direct note entry',
    );
    assert(
      await evaluate(
        'document.querySelector(".notepad-document").closest(".app__content").parentElement.getBoundingClientRect().width>=innerWidth',
      ),
      'Direct note entry maximizes only its target app',
    );
    assert(
      await evaluate(
        'document.querySelector(".ie__content").closest(".app__content").parentElement.getBoundingClientRect().width<800',
      ),
      'Unrelated IE startup window remains small',
    );
    await screenshot('direct-note-maximized');
    await navigate('/music/forever?source=shared#listen');
    await waitFor(
      '!!document.querySelector(".ie__content button[data-play-winamp=forever]")',
      'Direct song entry',
    );
    assert(
      await evaluate(
        'document.querySelector(".ie__content").closest(".app__content").parentElement.getBoundingClientRect().width>=innerWidth',
      ),
      'Direct song entry maximizes Internet Explorer',
    );
    assert.equal(
      await evaluate('document.querySelector("#ie-address").value'),
      origin + '/music/forever?source=shared#listen',
      'IE shows the full browser URL',
    );
    await navigate('/');
    await waitFor(
      `!!document.querySelector(${JSON.stringify(
        '.ie__content a[href="/music"]',
      )})`,
      'Desktop profile',
    );
    await waitFor('!!document.querySelector("#webamp")', 'Winamp startup');
    assert.equal(
      await evaluate('document.querySelector("#ie-address").value'),
      origin + '/',
      'IE homepage URL',
    );
    assert.equal(
      await evaluate(
        'document.querySelector(".ie__footer__status__text").textContent',
      ),
      'Done',
      'Original IE status text',
    );
    assert.equal(
      await evaluate('document.querySelectorAll(".ie-blog-shortcut").length'),
      0,
      'Blog link stays in page content',
    );
    assert(
      await evaluate(
        'document.querySelectorAll(".ie__function_bar img").length>=12',
      ),
      'Original IE toolbar icons are preserved',
    );
    assert(
      await evaluate(
        '(async()=>{const fonts=await document.fonts.load(\'700 12px "Noto Sans"\');return fonts.length>0&&fonts.every(font=>font.status==="loaded");})()',
      ),
      'Original title font loads locally with Google font servers blocked',
    );
    console.log('Verified desktop startup, including Winamp.');
    await checkWinampMovement();
    await click('.ie__content a[href="/music"]');
    await assertHead('/music');
    assert.equal(
      await evaluate('document.querySelector("link[rel=canonical]").href'),
      'https://reshra.xyz/music',
      'SPA canonical',
    );
    assert(await evaluate('document.title.includes("Archive")'), 'SPA title');
    assert.equal(
      await evaluate('document.querySelectorAll(".music-release").length'),
      10,
      'Full music archive',
    );
    assert(
      await evaluate(
        '!document.querySelector(".ie__function_bar button[aria-label=Back]").disabled',
      ),
      'IE Back reflects site history',
    );
    await click('.ie__content a[href="/notes"]');
    await click('.ie__content h2 a[href="/notes/guitar-parts"]');
    await waitFor(
      `!!document.querySelector(${JSON.stringify(
        'textarea[aria-label="Temporary scratchpad"]',
      )})`,
      'Notepad opened',
    );
    assert.equal(
      await evaluate(
        '[...document.querySelectorAll(".app__header__title")].filter(el=>el.textContent.includes("Guitar Parts.txt")).length',
      ),
      1,
      'Note deduplicates',
    );
    assert(
      await evaluate(
        'document.querySelector(".notepad-document").closest(".app__content").parentElement.getBoundingClientRect().width<800',
      ),
      'Internal note navigation keeps the normal smaller window',
    );
    await evaluate(() => {
      const link = document.querySelector(
        '.notepad-document a[data-note-type="external"]',
      );
      link.addEventListener('click', event => event.preventDefault(), {
        once: true,
      });
      link.click();
    });
    const noteLink = await evaluate(
      'window.__analytics.filter(event=>event.eventName==="notes_link_click").pop()',
    );
    assert.equal(
      noteLink.parameters.type,
      'external',
      'Legacy desktop note type is preserved',
    );
    assert(
      noteLink.parameters.label && noteLink.parameters.destination,
      'Legacy destination and label remain reportable',
    );
    await evaluate('document.querySelector("textarea").focus()');
    await cdp('Input.insertText', { text: 'Preserve this temporary note.' });
    await cdp('Input.dispatchKeyEvent', {
      type: 'keyDown',
      key: 'Tab',
      code: 'Tab',
      windowsVirtualKeyCode: 9,
    });
    await cdp('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key: 'Tab',
      code: 'Tab',
      windowsVirtualKeyCode: 9,
    });
    assert(
      await evaluate('document.activeElement.tagName!=="TEXTAREA"'),
      'Tab leaves the temporary scratchpad',
    );
    const scratchpad = await evaluate(
      'document.querySelector("textarea").value',
    );
    const pageViews = await evaluate(
      'window.__analytics.filter(e=>e.eventName==="page_view").length',
    );
    await click('#desktop-reading-toggle');
    assert.equal(
      await evaluate(
        'window.__analytics.filter(e=>e.eventName==="page_view").length',
      ),
      pageViews,
      'Mode change is not a page view',
    );
    await click('#view-toggle');
    assert.equal(
      await evaluate('document.querySelector("textarea").value'),
      scratchpad,
      'Scratchpad survives presentation changes',
    );
    await evaluate(() =>
      document
        .querySelector('.ie__content')
        .closest('.app__content')
        .parentElement.querySelector('button[aria-label="Close window"]')
        .click(),
    );
    await evaluate('history.back()');
    await delay(250);
    await waitFor('location.pathname==="/notes"', 'Back to notes index');
    await waitFor(
      '!!document.querySelector(".ie__content .note-index")',
      'Back reopens the closed Internet Explorer',
    );
    await assertHead('/notes');
    const topWindow = await evaluate(
      '[...document.querySelectorAll(".app__header__title")].filter(el=>el.getClientRects().length).sort((a,b)=>Number(b.parentElement.parentElement.style.zIndex)-Number(a.parentElement.parentElement.style.zIndex))[0].textContent',
    );
    assert(
      topWindow.includes('Internet Explorer'),
      'Back focuses corresponding IE window',
    );
    await click('.ie__content a[href="/blog"]');
    await assertHead('/blog');
    assert.equal(
      await evaluate(
        'document.documentElement.classList.contains("desktop-mode")',
      ),
      true,
      'Blog stays inside desktop session',
    );
    assert(
      await evaluate('!!document.querySelector(".ie__content .blog-page")'),
      'Shared embedded blog',
    );
    const expectNewTab = async (action, pathname) => {
      const previous = new Set(
        (await cdp('Target.getTargets')).targetInfos.map(
          target => target.targetId,
        ),
      );
      await action();
      let opened;
      for (let i = 0; i < 40; i++) {
        opened = (await cdp('Target.getTargets')).targetInfos.find(
          target =>
            target.type === 'page' &&
            !previous.has(target.targetId) &&
            target.url === origin + pathname,
        );
        if (opened) break;
        await delay(100);
      }
      assert(opened, 'New tab opens the clean content URL: ' + pathname);
      await cdp('Target.closeTarget', { targetId: opened.targetId });
      assert.equal(
        await evaluate('location.pathname'),
        '/blog',
        'New tab keeps the existing desktop URL',
      );
    };
    await expectNewTab(
      () =>
        evaluate(() =>
          document.querySelector('.embedded-page-tools a').click(),
        ),
      '/blog',
    );
    await expectNewTab(async () => {
      const center = await evaluate(() => {
        const r = document
          .querySelector('.ie__content .site-nav a[href="/music"]')
          .getBoundingClientRect();
        return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
      });
      await cdp('Input.dispatchMouseEvent', {
        type: 'mousePressed',
        ...center,
        button: 'left',
        clickCount: 1,
        modifiers: 2,
      });
      await cdp('Input.dispatchMouseEvent', {
        type: 'mouseReleased',
        ...center,
        button: 'left',
        clickCount: 1,
        modifiers: 2,
      });
    }, '/music');
    console.log(
      'Verified Open full page and Ctrl-click preserve the desktop and open real content URLs.',
    );
    await screenshot('blog-in-ie');
    const ieWindow =
      'document.querySelector(".ie__content").closest(".app__content").parentElement';
    const bounds = () =>
      evaluate(
        `(() => { const r=(${ieWindow}).getBoundingClientRect();return {left:r.left,top:r.top,width:r.width,height:r.height,right:r.right,bottom:r.bottom};})()`,
      );
    const drag = async (x, y, dx, dy) => {
      await cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
      await delay(80);
      await cdp('Input.dispatchMouseEvent', {
        type: 'mousePressed',
        x,
        y,
        button: 'left',
        clickCount: 1,
      });
      await cdp('Input.dispatchMouseEvent', {
        type: 'mouseMoved',
        x: x + dx,
        y: y + dy,
        buttons: 1,
      });
      await cdp('Input.dispatchMouseEvent', {
        type: 'mouseReleased',
        x: x + dx,
        y: y + dy,
        button: 'left',
        clickCount: 1,
      });
      await delay(100);
    };
    let rectangle = await bounds();
    await drag(rectangle.right - 110, rectangle.top + 12, 30, 20);
    let moved = await bounds();
    assert(
      Math.abs(moved.left - rectangle.left - 30) < 2 &&
        Math.abs(moved.top - rectangle.top - 20) < 2,
      'Window drag',
    );
    for (const edge of [
      'left',
      'right',
      'top',
      'bottom',
      'top-left',
      'top-right',
      'bottom-left',
      'bottom-right',
    ]) {
      rectangle = await bounds();
      const left = edge.includes('left'),
        right = edge.includes('right'),
        top = edge.includes('top'),
        bottom = edge.includes('bottom');
      const x = left
        ? rectangle.left + 2
        : right
        ? rectangle.right - 2
        : rectangle.left + rectangle.width / 2;
      const y = top
        ? rectangle.top + 2
        : bottom
        ? rectangle.bottom - 2
        : rectangle.top + rectangle.height / 2;
      await drag(
        x,
        y,
        left ? 15 : right ? -15 : 0,
        top ? 15 : bottom ? -15 : 0,
      );
      moved = await bounds();
      assert(
        (!left && !right) || moved.width < rectangle.width - 10,
        `Resize ${edge} width`,
      );
      assert(
        (!top && !bottom) || moved.height < rectangle.height - 10,
        `Resize ${edge} height`,
      );
    }
    const restoredWidth = (await bounds()).width;
    await evaluate(
      `(${ieWindow}).querySelector('button[aria-label="Maximize window"]').click()`,
    );
    await delay(100);
    assert((await bounds()).width > 1300, 'Maximize window');
    await evaluate(
      `(${ieWindow}).querySelector('button[aria-label="Restore window"]').click()`,
    );
    await delay(100);
    assert.equal((await bounds()).width, restoredWidth, 'Restore window size');
    await evaluate(
      `(${ieWindow}).querySelector('button[aria-label="Minimize window"]').click()`,
    );
    await delay(100);
    assert.equal(
      await evaluate(`(${ieWindow}).getClientRects().length`),
      0,
      'Minimize window',
    );
    await evaluate(
      '[...document.querySelectorAll("button.footer__window")].find(el=>el.textContent.includes("Internet Explorer")).click()',
    );
    await delay(100);
    assert(
      await evaluate(`(${ieWindow}).getClientRects().length>0`),
      'Taskbar restore',
    );
    console.log(
      'Verified window dragging, eight resize edges/corners, maximize, minimize and restore.',
    );
    await click('#desktop-reading-toggle');
    assert(
      await evaluate(
        'document.querySelectorAll("#desktop-layer iframe[data-video-id]").length===0',
      ),
      'No inactive hidden video iframe',
    );
    assert.equal(
      await evaluate('document.querySelectorAll("#page-main").length'),
      1,
      'Reading target ID is unique across both presentations',
    );
    await evaluate('document.querySelector(".skip-link").click()');
    assert(
      await evaluate(
        'document.activeElement===document.querySelector(".standalone-surface #page-main")',
      ),
      'Skip link focuses visible reading content after a presentation switch',
    );
    assert(
      await evaluate(
        '!JSON.stringify(window.__analytics).includes("Preserve this temporary note")',
      ),
      'Scratchpad text never enters analytics',
    );

    await navigate('/music/forever?view=read');
    let mediaTiming;
    await waitFor(
      'document.querySelector(".release-cover")?.complete && document.querySelector(".release-cover")?.naturalWidth === 800',
      'Album cover loads in reading view',
    );
    await cdp('Emulation.setDeviceMetricsOverride', {
      width: 320,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false,
    });
    assert(
      await evaluate(
        'document.documentElement.scrollWidth <= window.innerWidth',
      ),
      'Album artwork preserves narrow reading layout',
    );
    await cdp('Emulation.setDeviceMetricsOverride', {
      width: 1366,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    if (hasTestMedia) {
      await cdp('Network.emulateNetworkConditions', {
        offline: false,
        latency: 150,
        downloadThroughput: 125000,
        uploadThroughput: 62500,
      });
      mediaTiming = await evaluate(
        '(async()=>{const audio=document.querySelector("audio[data-native-audio]");window.__qaAudio=audio;audio.closest("details").open=true;audio.muted=true;const start=performance.now();await audio.play();return performance.now()-start;})()',
      );
      await waitFor(
        'window.__qaAudio.currentTime>.2',
        'Native MP3 playback advances',
      );
      assert.equal(
        await evaluate(
          'window.__analytics.filter(e=>e.eventName==="music_play_start"&&e.parameters.player==="native").length',
        ),
        1,
        'Successful native playback tracked once',
      );
      await cdp('Network.emulateNetworkConditions', {
        offline: false,
        latency: 0,
        downloadThroughput: -1,
        uploadThroughput: -1,
      });
      await click('#view-toggle');
      assert(
        await evaluate('window.__qaAudio.paused'),
        'Mode switch pauses native audio',
      );
      await waitFor(
        '!!document.querySelector("#webamp")',
        'Winamp available for explicit playback',
      );
      await click('.ie__content button[data-play-winamp="forever"]');
      await waitFor(
        'window.__analytics.some(event=>event.eventName==="music_play_start"&&event.parameters.player==="winamp"&&event.parameters.release==="forever")',
        'Winamp playback advances',
      );
      assert(
        await evaluate(
          '!document.querySelector(".winamp-feedback") && !document.querySelector("[data-play-status]").textContent',
        ),
        'No extra Winamp playing status box or inline success message',
      );
      await waitFor(
        'document.querySelector("#webamp #marquee").textContent.toLowerCase().includes("reshra - forever")',
        'Requested recording metadata is visible',
      );
      assert.equal(
        await evaluate(
          'window.__analytics.filter(e=>e.eventName==="music_play_start"&&e.parameters.player==="winamp").pop().parameters.release',
        ),
        'forever',
        'The requested recording actually plays',
      );
      assert.equal(
        await evaluate(
          'window.__analytics.filter(e=>e.eventName==="music_play_start"&&e.parameters.player==="winamp").length',
        ),
        1,
        'Successful Winamp playback tracked once',
      );
    } else {
      await click('#view-toggle');
      await waitFor(
        '!!document.querySelector("#webamp")',
        'Winamp startup without local media',
      );
      await click('.ie__content button[data-play-winamp="forever"]');
      await waitFor(
        'document.querySelector("[data-play-status]")?.textContent.includes("unavailable")',
        'Winamp explains missing media',
      );
      assert(
        await evaluate('!document.querySelector(".winamp-feedback")'),
        'Errors stay in the page without a floating Winamp box',
      );
      assert.equal(
        await evaluate(
          'window.__analytics.filter(e=>e.eventName==="music_play_start").length',
        ),
        0,
        'Missing media never reports a successful start',
      );
    }
    await waitFor(
      '!!document.querySelector("#webamp #minimize")',
      'Winamp controls ready',
    );
    await click('#webamp #minimize');
    await waitFor(
      'document.querySelector("#webamp").getClientRects().length===0',
      'Winamp minimize callback',
    );
    await evaluate(
      '[...document.querySelectorAll("button.footer__window")].find(el=>el.textContent.includes("Winamp")).click()',
    );
    await waitFor(
      'document.querySelector("#webamp").getClientRects().length>0',
      'Winamp taskbar restore',
    );
    await click('#webamp #close');
    await waitFor(
      '!document.querySelector("#webamp")',
      'Winamp close callback',
    );
    await click('.ie__content button[data-play-winamp="forever"]');
    await waitFor(
      '!!document.querySelector("#webamp")',
      'Playback request reopens Winamp',
    );
    if (hasTestMedia) {
      await waitFor(
        'window.__analytics.filter(e=>e.eventName==="music_play_start"&&e.parameters.player==="winamp"&&e.parameters.release==="forever").length===2',
        'Reopened player selects the correct recording with new track IDs',
      );
      await waitFor(
        'document.querySelector("#webamp #marquee").textContent.toLowerCase().includes("reshra - forever")',
        'Metadata survives reopening',
      );
    }
    await click('#desktop-reading-toggle');
    await evaluate(
      'window.__qaAudio=document.querySelector("audio[data-native-audio]");window.__qaAudio.src="/songs/intentionally-missing.mp3";window.__qaAudio.load()',
    );
    await waitFor(
      'document.querySelector("[data-audio-status]").textContent.includes("unavailable")',
      'Missing recording has a useful fallback',
    );
    console.log(
      hasTestMedia
        ? `Verified native/Winamp playback, media events and lifecycle, missing-file feedback; native start at throttled 1 Mbps: ${Math.round(
            mediaTiming,
          )} ms; ${[...mediaBytes.values()].reduce(
            (sum, bytes) => sum + bytes,
            0,
          )} audio bytes received during playback checks (local server).`
        : 'Verified empty-mount errors, no false playback starts, and Winamp minimize/restore/close/reopen. Successful playback requires the separately deployed recordings.',
    );

    // CRA can return the HTML app shell with 200 for an absent audio file.
    // It must never reach Webamp, which would skip to the following song.
    await navigate('/music/anii-2000?view=desktop');
    await waitFor(
      '!!document.querySelector("#webamp #marquee")',
      'Winamp ready for missing-file regression',
    );
    const previousTrackLabel = await evaluate(
      'document.querySelector("#webamp #marquee").textContent',
    );
    await evaluate(() => {
      window.__qaFetch = window.fetch;
      window.fetch = (input, options) => {
        if (options?.method === 'HEAD' && String(input).includes('/songs/'))
          return Promise.resolve(
            new Response('', {
              status: 200,
              headers: { 'Content-Type': 'text/html; charset=utf-8' },
            }),
          );
        return window.__qaFetch(input, options);
      };
    });
    await click('.ie__content button[data-play-winamp="anii-2000"]');
    await waitFor(
      'document.querySelector("[data-play-status]")?.textContent.includes("unavailable")',
      'HTML fallback rejected as missing audio',
    );
    assert.equal(
      await evaluate('document.querySelector("#webamp #marquee").textContent'),
      previousTrackLabel,
      'Missing recording does not select another song',
    );
    assert.equal(
      await evaluate(
        'window.__analytics.filter(event=>event.eventName==="music_play_start").length',
      ),
      0,
      'HTML fallback never starts music',
    );
    await evaluate('window.fetch = window.__qaFetch; delete window.__qaFetch');

    await viewport(390, 844);
    await navigate('/music/bruises');
    assert(
      await evaluate(
        'document.querySelector(".ie__content").getBoundingClientRect().width>=innerWidth-10',
      ),
      'Phone auto-maximizes content',
    );
    assert(
      await evaluate(
        'document.querySelector("#desktop-reading-toggle").getBoundingClientRect().right<=innerWidth',
      ),
      'Phone reading control stays reachable',
    );
    await screenshot('music-desktop-phone');

    await viewport(320, 700);
    if (!process.env.TEST_BASE_URL) {
      await cdp('Emulation.setScriptExecutionDisabled', { value: true });
      await cdp('Page.navigate', { url: origin + '/notes/guitar-parts' });
      await delay(600);
      assert(
        await evaluate('!!document.querySelector("#static-content h1")'),
        'No-JS note content',
      );
      assert(
        await evaluate('document.documentElement.scrollWidth<=innerWidth+1'),
        'No-JS note reflows',
      );
      await cdp('Input.dispatchMouseEvent', {
        type: 'mouseWheel',
        x: 150,
        y: 400,
        deltaX: 0,
        deltaY: 550,
      });
      await delay(200);
      assert(await evaluate('scrollY>0'), 'No-JS note scrolls');
      await screenshot('note-nojs-320');
      await cdp('Page.navigate', { url: origin + '/blog' });
      await delay(600);
      assert(
        await evaluate(
          'document.querySelectorAll("#static-content .post-preview").length===6',
        ),
        'No-JS blog index',
      );
      assert(
        await evaluate('document.documentElement.scrollWidth<=innerWidth+1'),
        'No-JS blog reflows',
      );
      await screenshot('blog-nojs-320');
    }
    assert.deepEqual(errors, [], 'No unhandled browser exceptions');
    console.log(
      JSON.stringify(
        {
          result: 'PASS',
          standaloneScripts,
          browserErrors: errors,
          artifactDir,
        },
        null,
        2,
      ),
    );
  } finally {
    if (ws) ws.close();
    browser.kill();
    if (server) {
      server.closeAllConnections();
      server.close();
    }
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

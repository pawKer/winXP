const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { createPreview } = require('./preview.cjs');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const captureOnly = process.argv.includes('--capture-only');
  const artifacts = fs.mkdtempSync(
    path.join(os.tmpdir(), 'winxp-mobile-content-'),
  );
  console.log(`Mobile content QA artifacts: ${artifacts}`);
  const executable = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/chromium',
    '/usr/bin/google-chrome',
  ]
    .filter(Boolean)
    .find(file => fs.existsSync(file));
  assert(executable, 'A local Chrome/Chromium executable is required.');
  const server = createPreview({ missingMedia: true });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = spawn(
    executable,
    [
      '--headless=new',
      '--disable-gpu',
      '--mute-audio',
      '--no-first-run',
      '--no-default-browser-check',
      '--remote-debugging-port=0',
      '--remote-allow-origins=*',
      `--user-data-dir=${artifacts}`,
      'about:blank',
    ],
    { windowsHide: true, stdio: 'ignore' },
  );
  let ws;
  try {
    let port;
    for (let i = 0; i < 100; i++) {
      const filename = path.join(artifacts, 'DevToolsActivePort');
      if (fs.existsSync(filename)) {
        port = fs.readFileSync(filename, 'utf8').split('\n')[0];
        break;
      }
      await delay(100);
    }
    assert(port, 'Chrome debugging port');
    const targets = await (
      await fetch(`http://127.0.0.1:${port}/json/list`)
    ).json();
    ws = new WebSocket(
      targets.find(target => target.type === 'page').webSocketDebuggerUrl,
    );
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });
    const pending = new Map();
    let nextId = 0;
    const errors = [];
    ws.onmessage = event => {
      const message = JSON.parse(event.data);
      if (message.method === 'Runtime.exceptionThrown')
        errors.push(message.params.exceptionDetails.text);
      const item = pending.get(message.id);
      if (!item) return;
      clearTimeout(item.timer);
      pending.delete(message.id);
      if (message.error) item.reject(new Error(JSON.stringify(message.error)));
      else item.resolve(message.result);
    };
    const cdp = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const id = ++nextId;
        const timer = setTimeout(() => {
          pending.delete(id);
          reject(new Error(method + ' timed out'));
        }, 15000);
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
      });
      assert(!result.exceptionDetails, JSON.stringify(result.exceptionDetails));
      return result.result.value;
    };
    await cdp('Page.enable');
    await cdp('Emulation.setFocusEmulationEnabled', { enabled: true });
    await cdp('Runtime.enable');
    await cdp('Network.enable');
    await cdp('Network.setBlockedURLs', {
      urls: [
        '*://*.google-analytics.com/*',
        '*://www.googletagmanager.com/*',
        '*://www.youtube.com/iframe_api',
        '*://www.youtube-nocookie.com/*',
      ],
    });
    const measurements = [];
    const routes = [
      '/blog',
      '/blog/modding-my-harley-benton',
      '/music?view=read',
      '/notes?view=read',
    ];
    const widths = captureOnly
      ? [390]
      : [320, 360, 390, 480, 600, 760, 1024, 1366];
    for (const width of widths) {
      await cdp('Emulation.setDeviceMetricsOverride', {
        width,
        height: 844,
        deviceScaleFactor: 1,
        mobile: width <= 760,
      });
      for (const route of routes) {
        await cdp('Page.navigate', { url: origin + route });
        let ready = false;
        for (let i = 0; i < 100; i++) {
          if (
            await evaluate(
              `location.href === ${JSON.stringify(
                origin + route,
              )} && document.readyState === 'complete' && document.documentElement.classList.contains("app-ready") && !!document.querySelector(".xp-site main")`,
            )
          ) {
            ready = true;
            break;
          }
          await delay(50);
        }
        assert(ready, route + ': readable application');
        await evaluate('document.fonts.ready.then(()=>true)');
        const geometry = await evaluate(`(() => {
          const main = document.querySelector('.xp-site main');
          const title = main.querySelector('h1');
          const entry = main.querySelector('[data-blog-entry]');
          const rowTitle = main.querySelector('.post-row h2');
          const rowText = main.querySelector('.post-row p');
          return { overflow: document.documentElement.scrollWidth > innerWidth + 1,
            mainTop: Math.round(main.getBoundingClientRect().top), mainWidth: main.clientWidth,
            titleTop: Math.round(title.getBoundingClientRect().top),
            entryTop: entry && Math.round(entry.getBoundingClientRect().top),
            rowTitleWidth: rowTitle && Math.round(rowTitle.getBoundingClientRect().width),
            rowFont: rowText && parseFloat(getComputedStyle(rowText).fontSize),
            menuToggleHeight: document.querySelector('[data-menu-toggle]').getBoundingClientRect().height,
            squareCovers: [...document.querySelectorAll('.music-feature img,.record-cover img')].every(img=>Math.abs(img.getBoundingClientRect().width-img.getBoundingClientRect().height)<1) };
        })()`);
        measurements.push({ width, route, geometry });
        if (!captureOnly) {
          assert(
            !geometry.overflow,
            `${width} ${route}: no horizontal page overflow`,
          );
          assert(geometry.squareCovers, `${width} ${route}: square artwork`);
          if (width <= 760) {
            assert(
              geometry.mainTop < 120,
              `${width} ${route}: compact navigation leaves room for content`,
            );
            assert(
              geometry.menuToggleHeight >= 44,
              `${width} ${route}: touch-sized menu control`,
            );
            if (route === '/blog') {
              assert(
                geometry.entryTop < 400,
                `${width}: first entry appears without scrolling`,
              );
              assert(
                geometry.rowTitleWidth >= width - 65,
                `${width}: article titles use the reading column`,
              );
              assert(
                geometry.rowFont >= 14,
                `${width}: legible article summaries`,
              );
            }
            assert(
              await evaluate(
                'getComputedStyle(document.querySelector("[data-site-menu]")).display === "none"',
              ),
              `${width} ${route}: menu starts collapsed`,
            );
            await evaluate(
              'document.querySelector("[data-menu-toggle]").click()',
            );
            assert(
              await evaluate(
                '(()=>{const nav=document.querySelector("[data-site-menu]");return getComputedStyle(nav).display!=="none" && nav.scrollWidth<=nav.clientWidth+1 && [...nav.querySelectorAll("a")].every(a=>a.getBoundingClientRect().height>=44);})()',
              ),
              `${width} ${route}: expanded menu has visible touch targets and no horizontal scrollbar`,
            );
            if (width === 390 && route === '/blog') {
              const menuShot = await cdp('Page.captureScreenshot', {
                format: 'png',
                captureBeyondViewport: false,
              });
              fs.writeFileSync(
                path.join(artifacts, 'menu-expanded-390.png'),
                Buffer.from(menuShot.data, 'base64'),
              );
            }
            await evaluate(
              '(()=>{const link=document.querySelector(".desktop-link");link.focus();link.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true}));})()',
            );
            assert(
              await evaluate(
                'document.activeElement.hasAttribute("data-menu-toggle") && document.querySelector("[data-menu-toggle]").getAttribute("aria-expanded")==="false"',
              ),
              `${width} ${route}: Escape closes the menu and restores focus`,
            );
            if (route === '/blog') {
              assert(
                await evaluate(
                  'getComputedStyle(document.querySelector("[data-search-field]")).display === "none"',
                ),
                `${width}: search is collapsed`,
              );
              await evaluate(
                'document.querySelector("[data-search-toggle]").click();new Promise(resolve=>requestAnimationFrame(resolve))',
              );
              assert(
                await evaluate(
                  'document.activeElement.hasAttribute("data-blog-search")',
                ),
                `${width}: search expands and receives focus`,
              );
              await evaluate(
                '(()=>{const input=document.querySelector("[data-blog-search]");input.value="forever";input.dispatchEvent(new Event("input",{bubbles:true}));})()',
              );
              assert(
                await evaluate(
                  () =>
                    document.querySelectorAll('[data-blog-entry]').length ===
                      1 &&
                    [...document.querySelectorAll('[data-blog-entry] a')].some(
                      link => link.getAttribute('href') === '/blog/forever',
                    ),
                ),
                `${width}: expanded search finds older articles`,
              );
              await evaluate(
                'document.querySelector("[data-blog-search]").dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true}));',
              );
              assert(
                await evaluate(
                  'document.activeElement.hasAttribute("data-search-toggle") && document.querySelectorAll("[data-blog-entry]").length===6 && document.querySelector("[data-blog-search]").value===""',
                ),
                `${width}: closing search clears the query and restores entries`,
              );
            }
          }
        }
        if (
          width === 390 ||
          (width === 320 && route === '/blog') ||
          (width === 1366 && route === '/blog')
        ) {
          await evaluate(
            'document.activeElement.blur();document.querySelector(".main-nav").scrollLeft=0;window.scrollTo(0,0)',
          );
          const shot = await cdp('Page.captureScreenshot', {
            format: 'png',
            captureBeyondViewport: false,
          });
          const name = route
            .split('?')[0]
            .split('/')
            .filter(Boolean)
            .pop();
          fs.writeFileSync(
            path.join(artifacts, `${name}-${width}.png`),
            Buffer.from(shot.data, 'base64'),
          );
        }
      }
    }
    fs.writeFileSync(
      path.join(artifacts, 'measurements.json'),
      JSON.stringify(measurements, null, 2),
    );
    assert.deepEqual(errors, [], 'No unhandled page errors');
    console.log(
      JSON.stringify({
        result: captureOnly ? 'captured baseline' : 'PASS',
        pages: measurements.length,
        artifacts,
      }),
    );
  } finally {
    if (ws) ws.close();
    browser.kill();
    server.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

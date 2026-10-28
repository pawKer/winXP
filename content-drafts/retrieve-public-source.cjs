// Public, anonymous YouTube source retrieval. No signed-in browser profile is used.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const id = process.argv[2] || 'xHmpTT-fVG4';
if (!/^[\w-]{11}$/.test(id)) throw new Error('Expected a YouTube video ID');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

async function run() {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'reshra-public-source-'));
  const child = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
    '--headless=new', '--no-first-run', '--no-default-browser-check',
    '--remote-debugging-port=0', '--remote-allow-origins=*',
    `--user-data-dir=${profile}`, 'about:blank',
  ], { windowsHide: true, stdio: 'ignore' });
  let ws;
  try {
    let port;
    for (let i = 0; i < 100; i++) {
      try { port = fs.readFileSync(path.join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0]; break; } catch (_) {}
      await wait(100);
    }
    if (!port) throw new Error('Chrome debugging port unavailable');
    const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(10000) })).json();
    ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve; ws.onerror = reject;
      setTimeout(() => reject(new Error('Browser connection timeout')), 10000).unref();
    });
    const pending = new Map();
    let nextId = 0;
    ws.onmessage = event => {
      const message = JSON.parse(event.data);
      const entry = pending.get(message.id);
      if (!entry) return;
      pending.delete(message.id); clearTimeout(entry.timer);
      message.error ? entry.reject(new Error(JSON.stringify(message.error))) : entry.resolve(message.result);
    };
    const cdp = (method, params = {}) => new Promise((resolve, reject) => {
      const messageId = ++nextId;
      const timer = setTimeout(() => { pending.delete(messageId); reject(new Error(method + ' timeout')); }, 25000);
      pending.set(messageId, { resolve, reject, timer });
      ws.send(JSON.stringify({ id: messageId, method, params }));
    });
    const evaluate = async expression => {
      const result = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
      return result.result.value;
    };
    await cdp('Page.enable');
    await cdp('Runtime.enable');
    await cdp('Network.enable');
    await cdp('Network.setBlockedURLs', { urls: ['*://*.googlevideo.com/*', '*://*.google-analytics.com/*'] });
    await cdp('Page.navigate', { url: 'https://www.youtube.com/watch?v=' + id });
    await wait(8000);
    const result = await evaluate(`(async () => {
      const initial = window.ytInitialData;
      let params;
      function walk(value) {
        if (!value || typeof value !== 'object') return;
        if (value.getTranscriptEndpoint) params = value.getTranscriptEndpoint.params;
        Object.values(value).forEach(walk);
      }
      walk(initial);
      const diagnostic = { url: location.href, title: document.title, hasInitial: !!initial, hasConfig: !!window.ytcfg, hasParams: !!params };
      if (!params || !window.ytcfg) return diagnostic;
      const response = await fetch('/youtubei/v1/get_transcript?prettyPrint=false', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: ytcfg.get('INNERTUBE_CONTEXT'), params }),
      });
      const data = await response.json();
      const segments = [];
      function extract(value) {
        if (!value || typeof value !== 'object') return;
        const segment = value.transcriptSegmentRenderer;
        if (segment) segments.push({ startMs: segment.startMs, endMs: segment.endMs, text: segment.snippet?.runs?.map(part => part.text).join('') });
        Object.values(value).forEach(extract);
      }
      extract(data);
      return { ...diagnostic, status: response.status, error: data.error, segments };
    })()`);
    console.log(JSON.stringify(result, null, 2));
    if (result.segments?.length) {
      fs.writeFileSync(path.join(__dirname, id + '.transcript.json'), JSON.stringify({ videoId: id, retrievedAt: new Date().toISOString(), ...result }, null, 2) + '\n');
    }
  } finally {
    if (ws) ws.close();
    child.kill();
  }
}
run().catch(error => { console.error(error.message); process.exitCode = 1; });

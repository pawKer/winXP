require('./content/build.cjs').buildContent();
const fs = require('fs');
const path = require('path');
const os = require('os');
const net = require('net');
const http = require('http');
const assert = require('assert');
const { spawn, spawnSync } = require('child_process');
const { pages } = require('../src/content/pages');
const { audioManifest = {} } = {
  audioManifest: require('../src/content/audioManifest.json'),
};

(async () => {
  const executable = process.env.NGINX_PATH || 'nginx';
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'winxp-nginx-qa-'));
  fs.mkdirSync(path.join(root, 'logs'));
  fs.mkdirSync(path.join(root, 'temp'));
  const socket = net.createServer();
  await new Promise(resolve => socket.listen(0, '127.0.0.1', resolve));
  const port = socket.address().port;
  await new Promise(resolve => socket.close(resolve));
  const slash = value => value.replace(/\\/g, '/');
  const mimePath =
    process.env.NGINX_MIME_PATH ||
    path.join(path.dirname(executable), 'conf/mime.types');
  const server = fs
    .readFileSync(path.resolve(__dirname, '../nginx.conf'), 'utf8')
    .replace('listen 80;', `listen 127.0.0.1:${port};`)
    .replace(
      'root /usr/share/nginx/html;',
      `root "${slash(path.resolve(__dirname, '../build'))}";`,
    );
  const config = `worker_processes 1;\nerror_log stderr;\npid "${slash(
    path.join(root, 'nginx.pid'),
  )}";\nevents { worker_connections 128; }\nhttp { include "${slash(
    mimePath,
  )}"; access_log off; ${server} }`;
  const configPath = path.join(root, 'qa.conf');
  fs.writeFileSync(configPath, config);
  const args = ['-p', slash(root) + '/', '-c', configPath];
  const check = spawnSync(executable, [...args, '-t'], {
    encoding: 'utf8',
    windowsHide: true,
  });
  if (check.status !== 0)
    throw new Error(
      check.stderr || check.error?.message || 'nginx configuration failed',
    );
  const child = spawn(
    executable,
    [...args, '-g', 'daemon off; master_process off;'],
    { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] },
  );
  let errorLog = '';
  child.stderr.on('data', chunk => {
    errorLog += chunk.toString();
  });
  const origin = `http://127.0.0.1:${port}`;
  try {
    let ready = false;
    for (let i = 0; i < 50; i++) {
      try {
        await fetch(origin, { signal: AbortSignal.timeout(500) });
        ready = true;
        break;
      } catch (_) {}
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert(ready, errorLog || 'nginx did not become ready');
    for (const page of pages) {
      const response = await fetch(origin + page.path);
      assert.equal(response.status, 200, page.path);
      assert(
        response.headers.get('content-type').includes('text/html'),
        page.path + ': HTML type',
      );
      assert(
        (await response.text()).includes(
          `href="https://reshra.xyz${page.path}"`,
        ),
        page.path + ': canonical',
      );
    }
    for (const route of [
      '/not-in-the-archive',
      '/blog/missing-post',
      '/static/missing.js',
      '/songs/missing.mp3',
    ]) {
      const response = await fetch(origin + route);
      assert.equal(response.status, 404, route);
    }
    for (const [route, type] of [
      ['/robots.txt', 'text/plain'],
      ['/sitemap.xml', 'text/xml'],
      ['/feed.xml', 'text/xml'],
    ]) {
      const response = await fetch(origin + route);
      assert.equal(response.status, 200, route);
      assert(
        response.headers.get('content-type').includes(type),
        route + ': correct type',
      );
    }
    const redirect = await new Promise((resolve, reject) => {
      const request = http.get(
        origin + '/music/anii-2000?utm_source=qa',
        { headers: { Host: 'www.reshra.xyz' } },
        response => {
          response.resume();
          resolve(response);
        },
      );
      request.on('error', reject);
    });
    assert.equal(redirect.statusCode, 301);
    assert.equal(
      redirect.headers.location,
      'https://reshra.xyz/music/anii-2000?utm_source=qa',
    );
    const trailing = await fetch(origin + '/blog/?utm_source=qa', {
      redirect: 'manual',
    });
    assert.equal(trailing.status, 301);
    assert(trailing.headers.get('location').endsWith('/blog?utm_source=qa'));
    assert.equal(
      trailing.headers.get('location'),
      '/blog?utm_source=qa',
      'Clean URLs remain relative behind an HTTPS proxy',
    );
    for (const query of [
      '?next=/',
      '?ref=sample.html',
      '?next=https://example.com/path/',
    ]) {
      const canonical = await fetch(origin + '/music' + query, {
        redirect: 'manual',
      });
      assert.equal(
        canonical.status,
        200,
        'Query text must not trigger a path redirect: ' + query,
      );
      for (const alias of ['/music/', '/music///', '/music.html']) {
        const response = await fetch(origin + alias + query, {
          redirect: 'manual',
        });
        assert.equal(response.status, 301, alias + query);
        const destination = new URL(response.headers.get('location'), origin);
        assert.equal(
          destination.pathname,
          '/music',
          'Only the path alias is normalized',
        );
        assert.equal(
          destination.search,
          query,
          'Query is preserved exactly once',
        );
        const follow = await fetch(destination, { redirect: 'manual' });
        assert.equal(
          follow.status,
          200,
          'Alias redirects terminate after one hop',
        );
      }
    }
    for (const page of pages) {
      const aliasPath = page.path === '/' ? '/index.html' : page.path + '.html';
      const alias = await fetch(origin + aliasPath + '?utm_source=qa', {
        redirect: 'manual',
      });
      assert.equal(alias.status, 301, aliasPath);
      assert(
        new URL(alias.headers.get('location'), origin).pathname === page.path,
        aliasPath + ': clean path',
      );
      assert(
        new URL(alias.headers.get('location'), origin).search ===
          '?utm_source=qa',
        aliasPath + ': preserves query',
      );
    }
    const audio = Object.values(audioManifest).find(item =>
      fs.existsSync(path.join(__dirname, '../build', item.url)),
    );
    if (audio) {
      const response = await fetch(origin + audio.url, {
        headers: { range: 'bytes=0-31' },
      });
      assert.equal(response.status, 206);
      assert.equal((await response.arrayBuffer()).byteLength, 32);
      assert(response.headers.get('content-type').includes('audio/mpeg'));
    }
    console.log(
      `Verified nginx: ${
        pages.length
      } routes, 404s, content types, www/trailing-slash/HTML-alias redirects${
        audio ? ', and MP3 range playback' : ''
      }.`,
    );
  } finally {
    child.kill();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

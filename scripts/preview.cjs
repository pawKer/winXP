const fs = require('fs');
const http = require('http');
const path = require('path');
const { pages } = require('../src/content/pages');

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
};

function createPreview({ missingMedia = false } = {}) {
  const root = path.resolve(__dirname, '../build');
  return http.createServer((request, response) => {
    let pathname;
    try {
      pathname = decodeURIComponent(
        new URL(request.url, 'http://localhost').pathname,
      );
    } catch (_) {
      response.writeHead(400);
      response.end();
      return;
    }
    if (pathname !== '/' && pathname.endsWith('/')) {
      response.writeHead(301, {
        Location:
          pathname.replace(/\/+$/, '') +
          new URL(request.url, 'http://localhost').search,
      });
      response.end();
      return;
    }
    if (pathname.endsWith('.html')) {
      response.writeHead(301, {
        Location:
          (pathname === '/index.html' ? '/' : pathname.slice(0, -5)) +
          new URL(request.url, 'http://localhost').search,
      });
      response.end();
      return;
    }
    const redirect = pages.find(
      page => page.path === pathname && page.redirectTo,
    );
    if (redirect) {
      response.writeHead(301, {
        Location:
          redirect.redirectTo + new URL(request.url, 'http://localhost').search,
      });
      response.end();
      return;
    }
    let filename = path.resolve(
      root,
      '.' + (pathname === '/' ? '/index.html' : pathname),
    );
    if (!filename.startsWith(root + path.sep)) {
      response.writeHead(403);
      response.end();
      return;
    }
    if (!fs.existsSync(filename) || !fs.statSync(filename).isFile())
      filename += '.html';
    let status = 200;
    if (
      (missingMedia && pathname.startsWith('/songs/')) ||
      !fs.existsSync(filename) ||
      !fs.statSync(filename).isFile()
    ) {
      filename = path.join(root, '404.html');
      status = 404;
    }
    if (!fs.existsSync(filename)) {
      response.writeHead(503);
      response.end('Run yarn build before previewing.');
      return;
    }
    const size = fs.statSync(filename).size;
    const headers = {
      'Content-Type':
        mime[path.extname(filename)] || 'application/octet-stream',
      'Accept-Ranges': 'bytes',
      'X-Content-Type-Options': 'nosniff',
    };
    let start = 0,
      end = size - 1;
    if (status === 200 && request.headers.range) {
      const match = request.headers.range.match(/^bytes=(\d+)-(\d*)$/);
      if (!match || Number(match[1]) >= size) {
        response.writeHead(416, { 'Content-Range': `bytes */${size}` });
        response.end();
        return;
      }
      start = Number(match[1]);
      end = match[2] ? Math.min(Number(match[2]), end) : end;
      if (start > end) {
        response.writeHead(416);
        response.end();
        return;
      }
      status = 206;
      headers['Content-Range'] = `bytes ${start}-${end}/${size}`;
    }
    headers['Content-Length'] = end - start + 1;
    response.writeHead(status, headers);
    if (request.method === 'HEAD') {
      response.end();
      return;
    }
    const stream = fs.createReadStream(filename, { start, end });
    stream.pipe(response);
    response.on('close', () => stream.destroy());
  });
}

if (require.main === module) {
  const server = createPreview();
  const port = Number(process.env.PORT || 4173);
  server.listen(port, '127.0.0.1', () =>
    console.log(`Local: http://127.0.0.1:${port}`),
  );
}
module.exports = { createPreview };

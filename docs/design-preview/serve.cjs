const fs = require('fs');
const http = require('http');
const path = require('path');

const port = Number(process.env.PORT || 4175);
const publicRoot = path.resolve(__dirname, '../../public');
const previewFiles = new Set([
  '/index.html',
  '/styles.css',
  '/preview.js',
  '/content.js',
  '/assets/windows.png',
]);
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

http
  .createServer((request, response) => {
    let pathname;
    try {
      pathname = decodeURIComponent(
        new URL(request.url, 'http://localhost').pathname,
      );
    } catch (_) {
      response.writeHead(400).end();
      return;
    }
    if (pathname === '/') pathname = '/index.html';
    let file;
    if (previewFiles.has(pathname)) {
      file = path.join(__dirname, pathname.slice(1));
    } else if (pathname.startsWith('/public/')) {
      file = path.resolve(publicRoot, pathname.slice('/public/'.length));
      if (
        !file.startsWith(publicRoot + path.sep) ||
        !/\.(png|jpg|ico)$/i.test(file)
      ) {
        response.writeHead(403).end();
        return;
      }
    }
    if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, {
      'Content-Type': mime[path.extname(file)],
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    if (request.method === 'HEAD') response.end();
    else fs.createReadStream(file).pipe(response);
  })
  .listen(port, '127.0.0.1', () => {
    console.log(`Design preview: http://127.0.0.1:${port}`);
  });

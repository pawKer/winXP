const fs = require('fs');
const path = require('path');
require('./content/build.cjs').buildContent();
const { pages } = require('../src/content/pages');
const { renderPage, renderNotFound } = require('./templates/document.cjs');
const {
  renderSitemap,
  renderFeed,
  renderRobots,
} = require('./templates/discovery.cjs');
const buildDir = path.resolve(__dirname, '../build');
const template = fs.readFileSync(path.join(buildDir, 'index.html'), 'utf8');
for (const page of pages) {
  const output = path.join(
    buildDir,
    page.path === '/' ? 'index.html' : page.path.slice(1) + '.html',
  );
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, renderPage(template, page));
}
for (const [filename, render] of Object.entries({
  'music-redirects.conf': () =>
    pages
      .filter(page => page.redirectTo)
      .map(
        page =>
          `location = ${page.path} { return 301 ${page.redirectTo}$is_args$args; }`,
      )
      .join('\n') + '\n',
  '404.html': () => renderNotFound(template),
  'sitemap.xml': renderSitemap,
  'feed.xml': renderFeed,
  'robots.txt': renderRobots,
})) {
  fs.writeFileSync(path.join(buildDir, filename), render());
}
console.log(
  'Generated ' +
    pages.length +
    ' content pages, sitemap, RSS, robots, and 404 page',
);

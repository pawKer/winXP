const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { siteUrl, notes, releases } = require('../src/content/site');

const buildDir = path.resolve(__dirname, '../build');
const paths = [
  '/',
  '/music',
  '/notes',
  ...notes.map(note => note.path),
  ...releases.map(release => release.path),
];
const sitemap = fs.readFileSync(path.join(buildDir, 'sitemap.xml'), 'utf8');

for (const pagePath of paths) {
  const file = path.join(
    buildDir,
    pagePath === '/' ? 'index.html' : `${pagePath.slice(1)}.html`,
  );
  const html = fs.readFileSync(file, 'utf8');
  const canonical = `${siteUrl}${pagePath}`;
  assert(
    html.includes(`<link rel="canonical" href="${canonical}">`),
    `${pagePath}: canonical`,
  );
  assert(
    html.includes('<main>') && html.includes('</main>'),
    `${pagePath}: readable content`,
  );
  assert(html.includes('id="static-content"'), `${pagePath}: static content`);
  assert(sitemap.includes(`<loc>${canonical}</loc>`), `${pagePath}: sitemap`);
  assert.equal((html.match(/<title>/g) || []).length, 1, `${pagePath}: title`);
  assert.equal(
    (html.match(/name="description"/g) || []).length,
    1,
    `${pagePath}: description`,
  );
}

for (const release of releases) {
  const html = fs.readFileSync(
    path.join(buildDir, `music/${release.slug}.html`),
    'utf8',
  );
  assert(
    html.includes(release.listeningUrl.replace(/&/g, '&amp;')),
    `${release.slug}: listening link`,
  );
  assert(html.includes(release.trackUrl), `${release.slug}: audio`);
}

const parts = fs.readFileSync(
  path.join(buildDir, 'notes/guitar-parts.html'),
  'utf8',
);
assert(
  parts.includes('rel="noopener noreferrer sponsored"'),
  'affiliate links are marked sponsored',
);
assert(parts.includes('affiliate links. I may earn'), 'affiliate disclosure');

const robots = fs.readFileSync(path.join(buildDir, 'robots.txt'), 'utf8');
assert(robots.includes('User-agent: GPTBot\nDisallow: /'), 'GPTBot opt-out');
assert(
  robots.includes('User-agent: ClaudeBot\nDisallow: /'),
  'ClaudeBot opt-out',
);
assert(robots.includes(`Sitemap: ${siteUrl}/sitemap.xml`), 'sitemap directive');

console.log(`Verified ${paths.length} generated pages and discovery files`);

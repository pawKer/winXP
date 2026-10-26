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
const seenTitles = new Set();
const seenDescriptions = new Set();

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
  const title = html.match(/<title>(.*?)<\/title>/)[1];
  const description = html.match(
    /<meta name="description" content="(.*?)">/,
  )[1];
  assert(!seenTitles.has(title), `${pagePath}: unique title`);
  assert(!seenDescriptions.has(description), `${pagePath}: unique description`);
  seenTitles.add(title);
  seenDescriptions.add(description);
  assert.equal((html.match(/<h1>/g) || []).length, 1, `${pagePath}: heading`);
  assert(
    html.includes(`<meta property="og:url" content="${canonical}">`),
    `${pagePath}: social URL`,
  );
  assert(
    !html.includes('name="robots" content="noindex"'),
    `${pagePath}: indexable`,
  );
  const jsonLd = html.match(
    /<script type="application\/ld\+json">(.*?)<\/script>/,
  );
  assert(jsonLd, `${pagePath}: structured data`);
  assert.equal(
    JSON.parse(jsonLd[1])['@context'],
    'https://schema.org',
    `${pagePath}: valid JSON-LD`,
  );
}

const homepage = fs.readFileSync(path.join(buildDir, 'index.html'), 'utf8');
const music = fs.readFileSync(path.join(buildDir, 'music.html'), 'utf8');
const notesIndex = fs.readFileSync(path.join(buildDir, 'notes.html'), 'utf8');
assert(homepage.includes('href="/music?view=read"'), 'homepage links to music');
assert(homepage.includes('href="/notes?view=read"'), 'homepage links to notes');

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
  for (const other of releases.filter(item => item.slug !== release.slug)) {
    assert(
      html.includes(`href="${other.path}?view=read"`),
      `${release.slug}: related release link`,
    );
  }
  assert(
    homepage.includes(release.listeningUrl.replace(/&/g, '&amp;')),
    `${release.slug}: direct homepage listening link`,
  );
  assert(
    music.includes(release.listeningUrl.replace(/&/g, '&amp;')),
    `${release.slug}: direct music listening link`,
  );
  assert(
    music.includes(`href="${release.path}?view=read"`),
    `${release.slug}: release detail link`,
  );
}

for (const note of notes) {
  assert(
    notesIndex.includes(`href="${note.path}?view=read"`),
    `${note.id}: note index link`,
  );
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

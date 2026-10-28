const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { pages, publishedPosts } = require('../src/content/pages');
const { siteUrl, releases } = require('../src/content/site');
const sourceVideos = require('../src/content/videos.json');

const buildDir = path.resolve(__dirname, '../build');
const sitemap = fs.readFileSync(path.join(buildDir, 'sitemap.xml'), 'utf8');
const feed = fs.readFileSync(path.join(buildDir, 'feed.xml'), 'utf8');
const titles = new Set();
const descriptions = new Set();
const routes = new Set(pages.map(page => page.path));

for (const page of pages) {
  const file = path.join(
    buildDir,
    page.path === '/' ? 'index.html' : `${page.path.slice(1)}.html`,
  );
  const html = fs.readFileSync(file, 'utf8');
  const canonical = `${siteUrl}${page.path}`;
  assert(
    html.includes('<meta name="reshra:analytics-mode" content="manual-v1">'),
    `${page.path}: analytics deployment marker`,
  );
  assert(
    html.includes(`<link rel="canonical" href="${canonical}">`),
    `${page.path}: canonical`,
  );
  assert(
    html.includes(`<meta property="og:url" content="${canonical}">`),
    `${page.path}: social URL`,
  );
  assert(sitemap.includes(`<loc>${canonical}</loc>`), `${page.path}: sitemap`);
  assert.equal(
    (html.match(/<h1(?:\s|>)/g) || []).length,
    1,
    `${page.path}: one main heading`,
  );
  assert.equal(
    (html.match(/<main(?:\s|>)/g) || []).length,
    1,
    `${page.path}: one main landmark`,
  );
  assert.equal(
    (html.match(/<title>/g) || []).length,
    1,
    `${page.path}: one title`,
  );
  const title = html.match(/<title>(.*?)<\/title>/)[1];
  const description = html.match(
    /<meta name="description" content="(.*?)">/,
  )[1];
  assert(!titles.has(title), `${page.path}: unique title`);
  assert(!descriptions.has(description), `${page.path}: unique description`);
  titles.add(title);
  descriptions.add(description);
  assert(!html.includes('content="noindex"'), `${page.path}: indexable`);
  const schema = JSON.parse(
    html.match(
      /<script id="page-schema" type="application\/ld\+json">(.*?)<\/script>/,
    )[1],
  );
  assert.equal(schema['@context'], 'https://schema.org');
  assert(
    schema['@graph'].some(
      entity => entity['@type'] === 'Person' && entity.name === 'reshra',
    ),
    `${page.path}: named artist`,
  );
  if (page.kind === 'post') {
    assert(
      schema['@graph'].some(
        entity =>
          entity['@type'] === 'BlogPosting' &&
          entity.headline === page.post.title,
      ),
      `${page.path}: article schema`,
    );
    const video = sourceVideos.find(item => item.id === page.post.videoId);
    if (video) {
      assert.equal(
        page.post.publishedAt,
        video.publishedAt,
        `${page.path}: main video's publication timestamp`,
      );
      assert(
        html.includes(
          `</span> Video published <time datetime="${video.publishedAt}">`,
        ),
        `${page.path}: date clearly identifies the source video`,
      );
      const article = schema['@graph'].find(
        entity => entity['@type'] === 'BlogPosting',
      );
      assert.equal(
        article.datePublished,
        video.publishedAt,
        `${page.path}: archived date in metadata`,
      );
      assert(
        article.dateModified &&
          new Date(article.dateModified) >= new Date(article.datePublished),
        `${page.path}: later editorial update is independent`,
      );
    }
  }
  for (const entity of schema['@graph'].filter(
    item => item['@type'] === 'VideoObject',
  )) {
    assert(
      entity.name &&
        entity.thumbnailUrl &&
        entity.uploadDate &&
        entity.embedUrl,
      `${page.path}: complete verified video metadata`,
    );
  }
  for (const match of html.matchAll(/href="(\/[^"#]*)"/g)) {
    const target = match[1].split(/[?#]/)[0];
    if (/\.[a-z0-9]+$/i.test(target))
      assert(
        fs.existsSync(path.join(buildDir, target.slice(1))),
        `${page.path}: file ${target}`,
      );
    else assert(routes.has(target), `${page.path}: linked route ${target}`);
  }
  assert(
    !html.includes('content-drafts'),
    `${page.path}: editorial drafts stay private`,
  );
}

for (const release of releases) {
  const html = fs.readFileSync(
    path.join(buildDir, `${release.path.slice(1)}.html`),
    'utf8',
  );
  assert(
    html.includes(release.listeningUrl.replace(/&/g, '&amp;')),
    `${release.slug}: listening destination`,
  );
  if (release.video)
    assert(
      html.includes(`youtube-nocookie.com/embed/${release.video.id}`),
      `${release.slug}: intended video`,
    );
  assert(
    !html.includes('autoplay=1'),
    `${release.slug}: no automatic video playback`,
  );
}
assert.equal(releases.length, 10, 'Full song archive');
assert.equal(
  (feed.match(/<item>/g) || []).length,
  publishedPosts.length,
  'RSS includes published posts',
);
const feedItems = [...feed.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(
  match => match[1],
);
let previousPostTime = Infinity;
publishedPosts.forEach((post, index) => {
  const postTime = new Date(post.publishedAt).getTime();
  assert(postTime <= previousPostTime, 'Archive runs newest first');
  previousPostTime = postTime;
  assert(
    feedItems[index].includes(`<link>${siteUrl}${post.path}</link>`),
    `${post.slug}: RSS follows archive order`,
  );
  const feedTime = new Date(
    feedItems[index].match(/<pubDate>(.*?)<\/pubDate>/)[1],
  );
  assert.equal(
    feedTime.toISOString().slice(0, 10),
    new Date(post.publishedAt).toISOString().slice(0, 10),
    `${post.slug}: RSS date`,
  );
  if (post.videoId)
    assert.equal(
      feedTime.getTime(),
      postTime,
      `${post.slug}: RSS preserves the video timestamp`,
    );
});
const parts = fs.readFileSync(
  path.join(buildDir, 'notes/guitar-parts.html'),
  'utf8',
);
assert(
  parts.includes('rel="noopener noreferrer sponsored"'),
  'Sponsored links',
);
assert(parts.includes('affiliate links. I may earn'), 'Disclosure');
const robots = fs.readFileSync(path.join(buildDir, 'robots.txt'), 'utf8');
assert(robots.includes('User-agent: GPTBot\nDisallow: /'), 'GPTBot policy');
assert(
  robots.includes('User-agent: ClaudeBot\nDisallow: /'),
  'ClaudeBot policy',
);
assert(
  robots.includes('User-agent: Google-Extended\nAllow: /'),
  'Google exception',
);
assert(
  fs
    .readFileSync(path.join(buildDir, '404.html'), 'utf8')
    .includes('content="noindex"'),
  '404 is not indexable',
);
console.log(
  `Verified ${pages.length} pages, ten recordings, ${publishedPosts.length} RSS entries, internal links, metadata, and crawler policy`,
);

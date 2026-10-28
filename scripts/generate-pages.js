const fs = require('fs');
const path = require('path');
const { siteUrl, profile } = require('../src/content/site');
const {
  pages,
  renderContent,
  structuredData,
  escapeHtml,
  absolute,
  publishedPosts,
} = require('../src/content/pages');

const buildDir = path.resolve(__dirname, '../build');
const template = fs.readFileSync(path.join(buildDir, 'index.html'), 'utf8');

function renderPage(page) {
  const canonical = absolute(page.path);
  const metadata = `<meta name="reshra:analytics-mode" content="manual-v1"><meta name="description" content="${escapeHtml(
    page.description,
  )}"><link rel="canonical" href="${canonical}"><meta property="og:title" content="${escapeHtml(
    page.title,
  )}"><meta property="og:description" content="${escapeHtml(
    page.description,
  )}"><meta property="og:url" content="${canonical}"><meta property="og:type" content="${
    page.kind === 'post'
      ? 'article'
      : page.kind === 'release'
      ? 'music.song'
      : 'website'
  }"><meta property="og:image" content="${escapeHtml(
    absolute(page.image || profile.avatarSrc),
  )}"><meta name="twitter:card" content="summary_large_image"><link rel="alternate" type="application/rss+xml" title="reshra’s Blog" href="${siteUrl}/feed.xml"><script id="page-schema" type="application/ld+json">${JSON.stringify(
    structuredData(page),
  ).replace(/</g, '\\u003c')}</script>`;
  return template
    .replace(
      /<title>[\s\S]*?<\/title>/,
      `<title>${escapeHtml(page.title)}</title>`,
    )
    .replace('</head>', `${metadata}</head>`)
    .replace(
      '<div id="root"></div>',
      `<div id="static-content" class="standalone-surface"><a class="skip-link" href="#page-main">Skip to content</a><div class="public-page">${renderContent(
        page,
        { reading: true },
      )}</div></div><div id="root"></div>`,
    );
}

for (const page of pages) {
  const output = path.join(
    buildDir,
    page.path === '/' ? 'index.html' : `${page.path.slice(1)}.html`,
  );
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, renderPage(page));
}

const notFound = template
  .replace(/<title>[\s\S]*?<\/title>/, '<title>Page not found — reshra</title>')
  .replace('</head>', '<meta name="robots" content="noindex"></head>')
  .replace(
    '<div id="root"></div>',
    `<div id="static-content" class="standalone-surface"><div class="public-page document-page">${renderContent(
      null,
    )}</div></div><div id="root"></div>`,
  );
fs.writeFileSync(path.join(buildDir, '404.html'), notFound);
fs.writeFileSync(
  path.join(buildDir, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages
    .map(
      page =>
        `<url><loc>${absolute(page.path)}</loc>${
          page.post?.updatedAt
            ? `<lastmod>${page.post.updatedAt}</lastmod>`
            : ''
        }</url>`,
    )
    .join('')}</urlset>`,
);
fs.writeFileSync(
  path.join(buildDir, 'feed.xml'),
  `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>reshra’s corner of the web</title><link>${siteUrl}/blog</link><description>Music, builds, and video notes from reshra.</description><language>en</language>${publishedPosts
    .map(
      post =>
        `<item><title>${escapeHtml(post.title)}</title><link>${absolute(
          post.path,
        )}</link><guid isPermaLink="true">${absolute(
          post.path,
        )}</guid><pubDate>${new Date(
          post.publishedAt.includes('T')
            ? post.publishedAt
            : `${post.publishedAt}T12:00:00Z`,
        ).toUTCString()}</pubDate><description>${escapeHtml(
          post.excerpt,
        )}</description><category>${post.type}</category></item>`,
    )
    .join('')}</channel></rss>`,
);
fs.writeFileSync(
  path.join(buildDir, 'robots.txt'),
  `User-agent: GPTBot\nDisallow: /\n\nUser-agent: ClaudeBot\nDisallow: /\n\nUser-agent: Google-Extended\nAllow: /\n\nUser-agent: OAI-SearchBot\nAllow: /\n\nUser-agent: Claude-SearchBot\nAllow: /\n\nUser-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
);
console.log(
  `Generated ${pages.length} content pages, sitemap, RSS, robots, and 404 page`,
);

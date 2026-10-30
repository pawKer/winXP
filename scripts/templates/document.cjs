const { siteUrl, profile } = require('../../src/content/site');
const {
  renderContent,
  structuredData,
  escapeHtml,
  absolute,
} = require('../../src/content/pages');
function renderPage(template, page) {
  if (page.redirectTo) {
    const target = escapeHtml(page.redirectTo);
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Continue to the article</title><meta name="robots" content="noindex"><link rel="canonical" href="${absolute(
      page.redirectTo,
    )}"><meta http-equiv="refresh" content="0;url=${target}"></head><body><p>This recording is now part of its article. <a href="${target}">Continue reading</a>.</p><script>window.location.replace(${JSON.stringify(
      page.redirectTo,
    )} + window.location.search + window.location.hash);</script></body></html>`;
  }
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
function renderNotFound(template) {
  return template
    .replace(
      /<title>[\s\S]*?<\/title>/,
      '<title>Page not found — reshra</title>',
    )
    .replace('</head>', '<meta name="robots" content="noindex"></head>')
    .replace(
      '<div id="root"></div>',
      `<div id="static-content" class="standalone-surface"><div class="public-page document-page">${renderContent(
        null,
      )}</div></div><div id="root"></div>`,
    );
}
module.exports = { renderPage, renderNotFound };

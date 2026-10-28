const { siteUrl } = require('../../src/content/site');
const {
  pages,
  publishedPosts,
  absolute,
  escapeHtml,
} = require('../../src/content/pages');
function renderSitemap() {
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages
    .map(
      page =>
        `<url><loc>${absolute(page.path)}</loc>${
          page.post?.updatedAt
            ? `<lastmod>${page.post.updatedAt}</lastmod>`
            : ''
        }</url>`,
    )
    .join('')}</urlset>`;
}
function renderFeed() {
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>reshra’s corner of the web</title><link>${siteUrl}/blog</link><description>Music, builds, and video notes from reshra.</description><language>en</language>${publishedPosts
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
        )}</description><category>${escapeHtml(post.type)}</category></item>`,
    )
    .join('')}</channel></rss>`;
}
function renderRobots() {
  return `User-agent: GPTBot\nDisallow: /\n\nUser-agent: ClaudeBot\nDisallow: /\n\nUser-agent: Google-Extended\nAllow: /\n\nUser-agent: OAI-SearchBot\nAllow: /\n\nUser-agent: Claude-SearchBot\nAllow: /\n\nUser-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`;
}
module.exports = { renderSitemap, renderFeed, renderRobots };

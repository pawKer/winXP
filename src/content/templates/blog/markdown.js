const { siteUrl } = require('../../site');
const { getPage } = require('../../registry');
const { escapeHtml } = require('../helpers');

// Keep resource links in reading mode, including when JavaScript is disabled.
function renderMarkdown(post, options) {
  return post.bodyHtml.replace(/href="(\/(?!\/)[^"]*)"/g, (attribute, href) => {
    const url = new URL(href.replace(/&amp;/g, '&'), siteUrl);
    const page = getPage(url.pathname);
    const redirected = page && page.path !== url.pathname;
    if (redirected) url.pathname = page.path;
    const browserNote = options.browserNotes && page && page.kind === 'note';
    if (browserNote) url.searchParams.set('app', 'ie');
    if (
      !options.reading ||
      !page ||
      url.pathname.startsWith('/blog') ||
      url.searchParams.has('view')
    )
      return redirected || browserNote
        ? `href="${escapeHtml(url.pathname + url.search + url.hash)}"`
        : attribute;
    url.searchParams.set('view', 'read');
    return `href="${escapeHtml(url.pathname + url.search + url.hash)}"`;
  });
}
module.exports = { renderMarkdown };

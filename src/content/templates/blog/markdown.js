const { siteUrl } = require('../../site');
const { getPage } = require('../../registry');
const { escapeHtml } = require('../helpers');

// Keep resource links in reading mode, including when JavaScript is disabled.
function renderMarkdown(post, options) {
  if (!options.reading) return post.bodyHtml;
  return post.bodyHtml.replace(/href="(\/(?!\/)[^"]*)"/g, (attribute, href) => {
    const url = new URL(href.replace(/&amp;/g, '&'), siteUrl);
    if (
      !getPage(url.pathname) ||
      url.pathname.startsWith('/blog') ||
      url.searchParams.has('view')
    )
      return attribute;
    url.searchParams.set('view', 'read');
    return `href="${escapeHtml(url.pathname + url.search + url.hash)}"`;
  });
}
module.exports = { renderMarkdown };

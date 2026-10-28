const { publishedPosts, pageSize } = require('../../registry');
const { escapeHtml, internal } = require('../helpers');
const { postPreview } = require('./partials');
function renderFeed(page, options) {
  const filtered = page.category
    ? publishedPosts.filter(post => post.type === page.category)
    : publishedPosts;
  const number = page.number || 1;
  const entries = page.category
    ? filtered
    : filtered.slice((number - 1) * pageSize, number * pageSize);
  return `<header class="feed-heading"><p class="eyebrow">music, builds & things worth keeping</p><h1 tabindex="-1">${
    page.category ? escapeHtml(page.category) : 'The latest from my desktop'
  }</h1><p>A little diary of songs, guitar projects, and experiments. Stay a while.</p></header><div class="blog-feed">${entries
    .map(post => postPreview(post, options))
    .join('')}</div>${
    !page.category
      ? `<nav class="post-pagination" aria-label="Blog pages">${
          number > 1
            ? internal(
                number === 2 ? '/blog' : `/blog/page/${number - 1}`,
                '← Newer posts',
                options,
              )
            : ''
        }<span>Page ${number} of ${Math.max(
          1,
          Math.ceil(publishedPosts.length / pageSize),
        )}</span>${
          number * pageSize < publishedPosts.length
            ? internal(`/blog/page/${number + 1}`, 'Older posts →', options)
            : ''
        }</nav>`
      : ''
  }`;
}
module.exports = { renderFeed };

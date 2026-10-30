const { publishedPosts, pageSize, categories } = require('../../registry');
const { categorySlug } = require('../../categories');
const { escapeHtml, internal } = require('../helpers');
const { postPreview } = require('./partials');
function renderBlogEntries(page, options, query = '') {
  const filtered = page.category
    ? publishedPosts.filter(post => post.type === page.category)
    : publishedPosts;
  const number = page.number || 1;
  const term = query.trim().toLowerCase();
  const entries = term
    ? filtered.filter(post =>
        `${post.title} ${post.excerpt} ${(post.topics || []).join(' ')}`
          .toLowerCase()
          .includes(term),
      )
    : page.category
    ? filtered
    : filtered.slice((number - 1) * pageSize, number * pageSize);
  return {
    count: entries.length,
    html: entries.length
      ? entries
          .map((post, index) =>
            postPreview(
              post,
              options,
              !term && !page.category && number === 1 && index === 0,
            ),
          )
          .join('')
      : '<p class="empty">No entries found. Try another word or category.</p>',
  };
}
function renderFeed(page, options) {
  const number = page.number || 1;
  return `<header class="page-heading feed-heading"><div><p class="eyebrow">The weblog</p><h1 tabindex="-1">${
    page.category ? escapeHtml(page.category) : 'From my corner of the web.'
  }</h1><p>Release stories, guitar builds, and experiments along the way.</p></div><img class="heading-icon" src="/icons/note.png" alt=""></header><div class="toolbar"><nav class="filters" aria-label="Article categories">${internal(
    '/blog',
    'All entries',
    options,
    !page.category ? 'aria-current="page"' : '',
  )}${categories
    .map(category =>
      internal(
        `/blog/category/${categorySlug(category)}`,
        category,
        options,
        page.category === category ? 'aria-current="page"' : '',
      ),
    )
    .join(
      '',
    )}</nav><label class="search js-only"><span class="sr-only">Search blog entries${
    page.category ? ` in ${escapeHtml(page.category)}` : ''
  }</span><input type="search" data-blog-search placeholder="Find an entry..."></label></div><p class="search-status" data-blog-search-status role="status"></p><div class="blog-feed" data-blog-results>${
    renderBlogEntries(page, options).html
  }</div>${
    !page.category
      ? `<nav class="post-pagination" aria-label="Blog pages">${
          number > 1
            ? internal(
                number === 2 ? '/blog' : `/blog/page/${number - 1}`,
                '\u2190 Newer posts',
                options,
              )
            : ''
        }<span>Page ${number} of ${Math.max(
          1,
          Math.ceil(publishedPosts.length / pageSize),
        )}</span>${
          number * pageSize < publishedPosts.length
            ? internal(
                `/blog/page/${number + 1}`,
                'Older posts \u2192',
                options,
              )
            : ''
        }</nav>`
      : ''
  }`;
}
module.exports = { renderFeed, renderBlogEntries };

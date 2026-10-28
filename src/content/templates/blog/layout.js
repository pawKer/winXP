const { renderPost } = require('./post');
const { renderFeed } = require('./feed');
const { internal } = require('../helpers');
const { navigation } = require('../partials');
const { blogSidebar } = require('./partials');
function renderBlog(page, options) {
  const body = page.post
    ? renderPost(page, options)
    : renderFeed(page, options);
  return `<div class="blog-page">${
    options.embedded
      ? `<div class="embedded-page-tools"><a href="${page.path}" target="_blank" rel="noopener noreferrer">Open full page ↗</a></div>`
      : ''
  }<header class="blog-masthead"><p class="blog-address">a personal homepage on the world wide web</p><p class="blog-title">${internal(
    '/blog',
    'reshra’s corner of the web',
    options,
  )}</p><p class="blog-tagline">songs, solder, and a few happy accidents <span aria-hidden="true">✦</span></p>${navigation(
    page.path,
    options,
  )}</header><div class="blog-layout">${blogSidebar(options)}<main id="${
    options.embedded ? 'desktop-page-main' : 'page-main'
  }" class="blog-main" tabindex="-1">${body}</main></div><footer class="blog-footer">© reshra · <a href="/feed.xml">RSS feed</a> · ${internal(
    '/?view=desktop',
    'Back to the desktop',
    {},
    '',
  )}<span class="footer-sticker" aria-hidden="true">★ thanks for dropping by ★</span></footer></div>`;
}
module.exports = { renderBlog };

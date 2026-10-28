const { renderHomeIndex } = require('./home-index');
const { renderMusicIndex } = require('./music-index');
const { renderNotesIndex } = require('./notes-index');
const { renderBlog } = require('./blog/layout');
const { renderRelease } = require('./music');
const { renderNote } = require('./notes');
const { internal } = require('./helpers');
const { navigation } = require('./partials');
function renderContent(page, options = {}) {
  if (!page)
    return '<main id="page-main" tabindex="-1"><h1>Page not found</h1><p>This page is not in the archive.</p><a href="/">Go home</a></main>';
  if (page.kind === 'blog' || page.kind === 'post')
    return renderBlog(page, options);
  let content;
  if (page.kind === 'release') content = renderRelease(page.release, options);
  if (page.kind === 'note') content = renderNote(page.note, options);
  if (page.kind === 'music') content = renderMusicIndex(options);
  if (page.kind === 'notes') content = renderNotesIndex(options);
  if (page.kind === 'home') content = renderHomeIndex(options);
  return `<div class="document-page">${navigation(
    page.path,
    options,
  )}<main id="${
    options.embedded ? 'desktop-page-main' : 'page-main'
  }" tabindex="-1">${content}</main><footer class="document-footer">© reshra · ${internal(
    '/blog',
    'Blog',
    options,
  )} · <a href="/feed.xml">RSS</a></footer></div>`;
}
module.exports = { renderContent };

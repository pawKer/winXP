const { renderHomeIndex } = require('./home-index');
const { renderMusicIndex } = require('./music-index');
const { renderFeed } = require('./blog/feed');
const { renderPost } = require('./blog/post');
const { renderNote } = require('./notes');
const { notes, settings } = require('../site');
const { escapeHtml } = require('./helpers');
const { renderLayout, notesBrowser } = require('./layout');
function renderContent(page, options = {}) {
  if (!page)
    return '<main id="page-main" tabindex="-1"><h1>Page not found</h1><p>This page is not in the archive.</p><a href="/">Go home</a></main>';
  let content;
  if (page.kind === 'post') content = renderPost(page, options);
  if (page.kind === 'blog') content = renderFeed(page, options);
  if (page.kind === 'music') content = renderMusicIndex(options);
  if (page.kind === 'home') content = renderHomeIndex(options);
  if (page.kind === 'notes' || page.kind === 'note') {
    const note =
      page.note || notes.find(item => item.id === 'midiPedal') || notes[0];
    const paneOptions = Object.assign({}, options, { notePane: true });
    content = `<header class="page-heading"><div><p class="eyebrow">The useful bits</p><h1>${
      page.note
        ? escapeHtml(note.title)
        : escapeHtml(settings.copy.notesHeading)
    }</h1><p>${escapeHtml(
      settings.copy.notesDescription,
    )}</p></div><img class="heading-icon" src="/icons/note.png" alt=""></header>${notesBrowser(
      note,
      renderNote(note, paneOptions),
      options,
    )}`;
  }
  return renderLayout(page, content, options);
}
module.exports = { renderContent };

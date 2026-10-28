const { notes } = require('../site');
const { icon, internal, escapeHtml } = require('./helpers');
function renderNotesIndex(options) {
  return `<header class="document-heading">${icon(
    'note',
  )}<div><h1>Notes & resources</h1><p>Parts lists, project files, and useful things from the desktop.</p></div></header><ul class="note-index">${notes
    .map(
      note =>
        `<li>${icon('note')}<div><h2>${internal(
          note.path,
          note.title,
          options,
        )}</h2><p>${escapeHtml(note.description)}</p></div></li>`,
    )
    .join('')}</ul>`;
}
module.exports = { renderNotesIndex };

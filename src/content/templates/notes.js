const { publishedPosts } = require('../registry');
const { icon, escapeHtml, internal } = require('./helpers');

function renderNote(note, options) {
  const hasAffiliate = note.sections.sections.some(section =>
    section.items.some(item => item.affiliate),
  );
  const related = publishedPosts.filter(post =>
    (post.noteIds || []).includes(note.id),
  );
  return `<header class="document-heading">${icon('note')}<div><${
    options.notePane ? 'h2' : 'h1'
  }>${escapeHtml(note.title)}</${
    options.notePane ? 'h2' : 'h1'
  }><p>${escapeHtml(note.description)}</p></div></header>${
    note.sections.title
      ? `<p class="welcome-note">${escapeHtml(note.sections.title)}</p>`
      : ''
  }${
    related.length
      ? `<aside class="related-note">Read the project: ${related
          .map(post => internal(post.path, post.title, options))
          .join(' · ')}</aside>`
      : ''
  }${
    hasAffiliate
      ? '<p class="disclosure">Some product links are affiliate links. I may earn a commission if you buy through them.</p>'
      : ''
  }${note.sections.sections
    .map(
      section =>
        `<section class="note-section"><h2>${escapeHtml(
          section.title,
        )}</h2><ul>${section.items
          .map(item => {
            const label = `${item.label || ''} ${item.displayText ||
              ''}`.trim();
            const analyticsAttributes = `data-note-link data-note-type="${escapeHtml(
              item.type,
            )}" data-note-label="${escapeHtml(
              item.displayText || item.label || '',
            )}"${
              item.action
                ? ` data-note-action="${escapeHtml(item.action)}"`
                : ''
            }${
              item.target.type === 'action'
                ? ` data-content-action="${escapeHtml(item.target.action)}"`
                : ''
            }`;
            if (item.type === 'external')
              return `<li><a href="${escapeHtml(
                item.url,
              )}" target="_blank" rel="noopener noreferrer${
                item.affiliate ? ' sponsored' : ''
              }" ${analyticsAttributes}>${escapeHtml(label)}</a></li>`;
            return `<li>${internal(
              item.url,
              label,
              options,
              analyticsAttributes,
            )}</li>`;
          })
          .join('')}</ul></section>`,
    )
    .join('')}`;
}

module.exports = { renderNote };

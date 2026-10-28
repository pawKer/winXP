const { releases } = require('../site');
const { icon, internal, escapeHtml, listenLink } = require('./helpers');
function renderMusicIndex(options) {
  return `<header class="document-heading">${icon(
    'music',
  )}<div><p class="eyebrow">reshra audio archive</p><h1>Music by reshra</h1><p>New recordings and old favourites, all in one folder.</p></div></header><ul class="music-releases">${releases
    .map(
      release =>
        `<li class="music-release">${
          release.video
            ? `<img class="release-thumbnail" src="https://i.ytimg.com/vi/${release.video.id}/hqdefault.jpg" width="120" height="90" alt="" loading="lazy">`
            : icon('music')
        }<div><p class="eyebrow">${
          release.releaseStatus === 'upcoming' ? 'Coming soon' : 'Recording'
        }</p><h2>${internal(
          release.path,
          release.title,
          options,
        )}</h2><p>${escapeHtml(
          release.description,
        )}</p><div class="music-actions">${listenLink(
          release,
          'catalogue',
        )}${internal(
          release.path,
          'Open recording',
          options,
        )}</div></div></li>`,
    )
    .join('')}</ul>`;
}
module.exports = { renderMusicIndex };

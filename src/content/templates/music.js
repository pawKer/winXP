const { escapeHtml, listenLink, dateLabel, external } = require('./helpers');
function renderRecording(release, options) {
  const nativeUrl = release.webAudioUrl || release.trackUrl;
  const article = require('../registry').publishedPosts.find(
    post => post.releaseId === release.slug,
  );
  return `<section class="recording-details" id="listen"><div class="recording-summary">${
    release.artwork
      ? `<img src="${escapeHtml(release.artwork)}" alt="${escapeHtml(
          release.title,
        )} cover artwork" width="88" height="88">`
      : ''
  }<div><span class="tiny-label">THE RECORDING</span><h2>${escapeHtml(
    release.title,
  )}</h2>${
    release.releaseDate
      ? `<p>${
          release.releaseStatus === 'upcoming' ? 'Available' : 'Released'
        } ${dateLabel(release.releaseDate)}</p>`
      : ''
  }</div></div><div class="release-actions music-actions">${listenLink(
    release,
    'blog',
    'small-button',
  )}${
    options.embedded
      ? `<button class="small-button" type="button" data-play-winamp="${release.slug}">Play in Winamp</button>`
      : `<a class="small-button" href="${escapeHtml(
          article.path,
        )}?view=desktop&amp;play=${release.slug}#listen" data-play-desktop="${
          release.slug
        }">Listen in Winamp</a>`
  }</div><p class="media-status" data-play-status role="status"></p>${
    release.alternateVideos
      ? `<section class="alternate-videos"><h3>More ways to watch</h3>${release.alternateVideos
          .map(video => external(video.sourceUrl, video.title))
          .join('')}</section>`
      : ''
  }${
    !options.embedded && nativeUrl
      ? `<details class="local-player"><summary>Listen in browser instead</summary><audio controls preload="none" src="${escapeHtml(
          nativeUrl,
        )}" data-native-audio="${
          release.slug
        }" aria-label="Listen to ${escapeHtml(
          release.title,
        )}"></audio><p class="media-status" role="status" data-audio-status>If this recording is unavailable, use the music-service or YouTube link above.</p></details>`
      : ''
  }${
    release.credits.length
      ? `<h3>Recording credits</h3><ul class="credits">${release.credits
          .map(credit => `<li>${escapeHtml(credit)}</li>`)
          .join('')}</ul>`
      : ''
  }${
    release.guitarHeroUrl
      ? `<h3>Play along</h3><p>${external(
          release.guitarHeroUrl,
          'Download Guitar Hero files',
        )}</p>`
      : ''
  }</section>`;
}
module.exports = { renderRecording };

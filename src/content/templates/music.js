const { publishedPosts } = require('../registry');
const {
  internal,
  escapeHtml,
  icon,
  listenLink,
  dateLabel,
  external,
} = require('./helpers');
const { renderVideo } = require('./partials');
const { releases } = require('../site');

function renderRelease(release, options) {
  const post = publishedPosts.find(item => item.releaseId === release.slug);
  const nativeUrl = release.webAudioUrl || release.trackUrl;
  return `<div class="breadcrumbs">${internal(
    '/music',
    'Music archive',
    options,
  )} / ${escapeHtml(release.title)}</div><header class="document-heading">${
    release.artwork
      ? `<img class="release-cover" src="${escapeHtml(
          release.artwork,
        )}" width="160" height="160" alt="${escapeHtml(
          release.title,
        )} cover artwork">`
      : icon('music')
  }<div><p class="eyebrow">${
    release.releaseStatus === 'upcoming'
      ? 'Upcoming recording'
      : 'From the music archive'
  }</p><h1>${escapeHtml(release.title)}</h1><p>${escapeHtml(
    release.description,
  )}</p></div></header><div class="music-actions">${listenLink(
    release,
    'release',
  )}${
    options.embedded
      ? `<button class="xp-button" type="button" data-play-winamp="${release.slug}">Play in Winamp</button>`
      : ''
  }</div><p class="media-status" data-play-status role="status"></p>${
    release.releaseDate
      ? `<p>${
          release.releaseStatus === 'upcoming' ? 'Available' : 'Released'
        } ${dateLabel(release.releaseDate)}</p>`
      : ''
  }${renderVideo(release.video, options, release.slug)}${
    release.alternateVideos
      ? `<section><h2>Other versions</h2><ul>${release.alternateVideos
          .map(video => `<li>${external(video.sourceUrl, video.title)}</li>`)
          .join('')}</ul></section>`
      : ''
  }${
    !options.embedded && nativeUrl
      ? `<details class="local-player"><summary>Listen to the local recording</summary><audio controls preload="none" src="${escapeHtml(
          nativeUrl,
        )}" data-native-audio="${
          release.slug
        }" aria-label="Listen to ${escapeHtml(
          release.title,
        )}"></audio><p class="media-status" role="status" data-audio-status>If this recording is unavailable, use the music-service or YouTube link above.</p></details>`
      : ''
  }${
    release.credits.length
      ? `<section class="xp-group"><h2>Credits</h2><ul>${release.credits
          .map(credit => `<li>${escapeHtml(credit)}</li>`)
          .join('')}</ul>${
          release.video
            ? `<p class="source-note">From the ${external(
                release.video.sourceUrl,
                'official video description',
              )}.</p>`
            : ''
        }</section>`
      : ''
  }${
    release.guitarHeroUrl
      ? `<section class="xp-group"><h2>Play along</h2><p>${external(
          release.guitarHeroUrl,
          'Guitar Hero files for anii 2000',
        )}</p></section>`
      : ''
  }${
    post
      ? `<aside class="related-note">From the blog: ${internal(
          post.path,
          post.title,
          options,
        )}</aside>`
      : ''
  }<section class="related-posts"><h2>Keep listening</h2><ul>${releases
    .filter(item => item.slug !== release.slug)
    .slice(0, 3)
    .map(item => `<li>${internal(item.path, item.title, options)}</li>`)
    .join('')}</ul>${internal('/music', 'All music', options)}</section>`;
}

module.exports = { renderRelease };

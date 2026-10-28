const { internal, external, escapeHtml, dateLabel } = require('./helpers');
const { siteUrl } = require('../site');

function navigation(path, options) {
  return `<nav class="site-nav" aria-label="Site">${[
    ['/', 'Home'],
    ['/music', 'Music'],
    ['/blog', 'Blog'],
    ['/notes', 'Notes'],
  ]
    .map(([url, label]) =>
      internal(
        url,
        label,
        options,
        path === url || (url !== '/' && path.startsWith(`${url}/`))
          ? 'aria-current="page"'
          : '',
      ),
    )
    .join('')}</nav>`;
}
function renderVideo(video, options, releaseId = '') {
  if (!video) return '';
  if (options.mediaActive === false)
    return `<p class="media-caption">${external(
      video.sourceUrl,
      video.title,
    )}</p>`;
  const id = `${options.prefix || 'static'}-${video.id}`;
  const origin = options.origin || siteUrl;
  const src = `https://www.youtube-nocookie.com/embed/${
    video.id
  }?enablejsapi=1&playsinline=1&rel=0&origin=${encodeURIComponent(origin)}`;
  return `<section class="video-section" aria-label="Music or project video"><h2>${escapeHtml(
    video.title,
  )}</h2><div class="video-frame" data-video-frame><iframe id="${id}" src="${escapeHtml(
    src,
  )}" title="${escapeHtml(video.title)}" data-video-id="${
    video.id
  }" data-release="${releaseId}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div><p class="media-caption">${external(
    video.sourceUrl,
    'Watch on YouTube',
  )} · Video published ${dateLabel(
    video.publishedAt,
  )}</p><p class="media-status" role="status" data-video-status></p></section>`;
}

module.exports = { navigation, renderVideo };

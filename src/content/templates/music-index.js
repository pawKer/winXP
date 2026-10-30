const { publishedPosts } = require('../registry');
const { releases, settings, artwork } = require('../site');
const { internal, escapeHtml } = require('./helpers');
const duration = seconds =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
function renderMusicIndex(options) {
  const music = publishedPosts
    .map(post => ({
      post,
      release: releases.find(release => release.slug === post.releaseId),
    }))
    .filter(item => item.release);
  const upcoming = music.find(
    item => item.release.releaseStatus === 'upcoming',
  );
  const archive = music.filter(item => item !== upcoming);
  const cover = release =>
    `<img src="${escapeHtml(
      release.artwork ||
        (artwork.drafts && artwork.drafts.url) ||
        '/icons/music.png',
    )}" alt="${escapeHtml(
      release.title,
    )} cover artwork" width="240" height="240" loading="lazy">`;
  return `<header class="page-heading"><div><p class="eyebrow">The recordings</p><h1>${escapeHtml(
    settings.copy.musicHeading,
  )}</h1><p>${escapeHtml(
    settings.copy.musicDescription,
  )}</p></div><img class="heading-icon" src="/icons/music.png" alt=""></header>${
    upcoming
      ? `<section class="music-feature music-release"><a href="${escapeHtml(
          upcoming.post.path,
        )}">${cover(
          upcoming.release,
        )}</a><div><span class="tiny-label">NEXT RELEASE${
          upcoming.release.releaseDate
            ? ` / ${escapeHtml(upcoming.release.releaseDate)}`
            : ''
        }</span><h2>${escapeHtml(
          upcoming.release.title,
        )}</h2><p>A new recording by reshra.</p>${internal(
          upcoming.post.path,
          'Read & listen \u2192',
          options,
          'class="small-button"',
        )}</div></section>`
      : ''
  }<div class="section-caption"><strong>Browse the archive</strong><span>${
    archive.length
  } music articles &middot; newest first</span></div><div class="record-grid">${archive
    .map(
      ({ post, release }) =>
        `<article class="record music-release"><a class="record-cover" href="${escapeHtml(
          post.path,
        )}">${cover(release)}</a><div class="record-title"><h2>${internal(
          post.path,
          release.title,
          options,
        )}</h2><span>${duration(release.duration)}</span></div><p>${escapeHtml(
          settings.profile.name,
        )} &middot; story, video &amp; links</p></article>`,
    )
    .join('')}</div>`;
}
module.exports = { renderMusicIndex };

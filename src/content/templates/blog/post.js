const { releases, notes } = require('../../site');
const { publishedPosts } = require('../../registry');
const {
  postDateLabel,
  escapeHtml,
  external,
  internal,
  listenLink,
} = require('../helpers');
const { renderVideo } = require('../partials');
const { videoById } = require('../../catalogue');
const { renderMarkdown } = require('./markdown');
function renderPost(page, options) {
  const post = page.post;
  const release =
    post.releaseId && releases.find(item => item.slug === post.releaseId);
  const current = publishedPosts.indexOf(post);
  const adjacent = [
    publishedPosts[current - 1],
    publishedPosts[current + 1],
  ].filter(Boolean);
  return `<article class="blog-article"><div class="post-meta"><span class="category-label">${escapeHtml(
    post.type,
  )}</span> ${postDateLabel(post)} · by ${escapeHtml(
    post.author,
  )}</div><h1 tabindex="-1">${escapeHtml(
    post.title,
  )}</h1><div class="post-intro">${
    release && release.artwork
      ? `<img class="article-cover" src="${escapeHtml(
          release.artwork,
        )}" alt="${escapeHtml(
          release.title,
        )} cover artwork" width="120" height="120">`
      : ''
  }<p class="article-intro">${escapeHtml(post.excerpt)}</p></div>${
    post.videoId
      ? renderVideo(videoById(post.videoId), options, post.releaseId || '')
      : ''
  }<div class="post-body">${renderMarkdown(post, options)}</div>${
    post.chapters
      ? `<section class="chapter-list"><h2>Jump into the video</h2><ol>${post.chapters
          .map(
            ([seconds, label]) =>
              `<li>${external(
                `${videoById(post.videoId).sourceUrl}&t=${seconds}s`,
                `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(
                  2,
                  '0',
                )} — ${label}`,
              )}</li>`,
          )
          .join('')}</ol></section>`
      : ''
  }${
    post.extraVideoIds
      ? `<section><h2>Continue watching</h2><ul>${post.extraVideoIds
          .map(
            id =>
              `<li>${external(
                videoById(id).sourceUrl,
                videoById(id).title,
              )}</li>`,
          )
          .join('')}</ul></section>`
      : ''
  }${
    release
      ? `<section class="related-note"><h2>The recording</h2><p>${internal(
          release.path,
          `${release.title}: listening links, credits & resources`,
          options,
        )}</p>${listenLink(release, 'blog')}</section>`
      : ''
  }${
    post.noteIds
      ? `<section class="related-note"><h2>Files, parts & resources</h2><ul>${post.noteIds
          .map(id => notes.find(note => note.id === id))
          .filter(Boolean)
          .map(
            note =>
              `<li>${internal(note.path, note.title, options)} — ${escapeHtml(
                note.description,
              )}</li>`,
          )
          .join('')}</ul></section>`
      : ''
  }<footer class="article-footer"><p>${[
    post.sourceUrl ? external(post.sourceUrl, 'Original source') : '',
    post.provenance
      ? escapeHtml(post.provenance)
      : post.releaseId
      ? 'Archive entry based on the official recording and video credits.'
      : '',
  ]
    .filter(Boolean)
    .join(
      ' · ',
    )}</p><button class="xp-button js-only" type="button" data-copy-link>Copy post link</button><span class="copy-status" role="status"></span></footer></article><nav class="post-pagination" aria-label="More posts">${internal(
    '/blog',
    '← All posts',
    options,
  )}${adjacent
    .map(item => internal(item.path, item.title, options))
    .join('')}</nav>`;
}
module.exports = { renderPost };

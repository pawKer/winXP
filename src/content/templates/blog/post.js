const { releases, notes } = require('../../site');
const { publishedPosts } = require('../../registry');
const { postDateLabel, escapeHtml, external, internal } = require('../helpers');
const { renderVideo } = require('../partials');
const { renderRecording } = require('../music');
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
  return `<article class="blog-article article"><div class="post-meta"><span class="category-label">${escapeHtml(
    post.type,
  )}</span> ${postDateLabel(post)} · by ${escapeHtml(
    post.author,
  )}</div><h1 tabindex="-1">${escapeHtml(
    post.title,
  )}</h1><p class="article-intro dek">${escapeHtml(post.excerpt)}</p>${
    post.videoId || (release && release.video)
      ? renderVideo(
          videoById(post.videoId) || release.video,
          options,
          post.releaseId || '',
        )
      : release && release.artwork
      ? `<figure class="article-artwork"><img class="release-cover" src="${escapeHtml(
          release.artwork,
        )}" width="260" height="260" alt="${escapeHtml(
          release.title,
        )} cover artwork"></figure>`
      : ''
  }<div class="post-body article-body">${renderMarkdown(post, options)}</div>${
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
  }${release ? renderRecording(release, options) : ''}${
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
  }</article><nav class="post-pagination" aria-label="More posts">${internal(
    '/blog',
    '← All posts',
    options,
  )}${adjacent
    .map(item => internal(item.path, item.title, options))
    .join('')}</nav>`;
}
module.exports = { renderPost };

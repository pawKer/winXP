const { videoById } = require('../../catalogue');
const { postDateLabel, internal, escapeHtml } = require('../helpers');
const { releases } = require('../../site');

function postPreview(post, options, featured = false) {
  const video = post.videoId && videoById(post.videoId);
  const release = releases.find(item => item.slug === post.releaseId);
  const cover = release && release.artwork;
  const image =
    cover || (video && `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`);
  const thumbnail = image
    ? `<a href="${escapeHtml(post.path)}" class="post-thumbnail ${
        cover ? 'music-thumbnail' : ''
      }" tabindex="-1" aria-hidden="true"><img src="${escapeHtml(
        image,
      )}" alt="" width="138" height="88" loading="lazy">${
        video
          ? '<span class="thumbnail-play" aria-hidden="true">&#9654;</span>'
          : ''
      }</a>`
    : '';
  const content = `<div class="post-copy"><div class="post-meta meta"><span class="category-label tag">${escapeHtml(
    post.type,
  )}</span> ${postDateLabel(post)}</div><h2>${internal(
    post.path,
    post.title,
    options,
  )}</h2><p>${escapeHtml(post.excerpt)}</p>${
    featured
      ? internal(
          post.path,
          'Read the entry \u2192',
          options,
          'class="read-link"',
        )
      : ''
  }</div>`;
  return `<article class="post-preview ${
    featured ? 'feature' : 'post-row'
  }" data-blog-entry>${
    featured
      ? '<div class="feature-label"><span>Pinned to the top</span><span>FROM THE BLOG</span></div><div class="feature-body">'
      : ''
  }${thumbnail}${content}${featured ? '</div>' : ''}</article>`;
}
module.exports = { postPreview };

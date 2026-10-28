const { categorySlug } = require('../../categories');
const { videoById } = require('../../catalogue');
const { postDateLabel, internal, escapeHtml, external } = require('../helpers');
const { profile, releases } = require('../../site');
const { publishedPosts, categories } = require('../../registry');

function postPreview(post, options) {
  const video = post.videoId && videoById(post.videoId);
  const release = releases.find(item => item.slug === post.releaseId);
  const cover = release && release.artwork;
  return `<article class="post-preview"><div class="post-meta"><span class="category-label">${escapeHtml(
    post.type,
  )}</span> ${postDateLabel(post)}</div><h2>${internal(
    post.path,
    post.title,
    options,
  )}</h2>${
    cover
      ? `<a href="${
          post.path
        }" class="post-thumbnail album-cover" tabindex="-1" aria-hidden="true"><img src="${escapeHtml(
          cover,
        )}" alt="" width="120" height="120" loading="lazy"></a>`
      : video
      ? `<a href="${post.path}" class="post-thumbnail" tabindex="-1" aria-hidden="true"><img src="https://i.ytimg.com/vi/${video.id}/hqdefault.jpg" alt="" width="480" height="360" loading="lazy"></a>`
      : ''
  }<p>${escapeHtml(post.excerpt)}</p><p>${internal(
    post.path,
    'Read post →',
    options,
  )}</p></article>`;
}
function blogSidebar(options) {
  return `<aside class="blog-sidebar" aria-label="About and archive"><section class="blog-box profile-box"><h2>about me.txt</h2><img class="blog-avatar" src="${
    profile.avatarSrc
  }" width="120" height="120" alt="reshra"><p><strong>reshra</strong></p><p>${escapeHtml(
    profile.bio,
  )}</p><p class="online-badge"><span aria-hidden="true">●</span> welcome to my corner</p><ul class="profile-links">${Object.entries(
    profile.socialLinks,
  )
    .map(([label, url]) => `<li>${external(url, label)}</li>`)
    .join(
      '',
    )}</ul></section><section class="blog-box"><h2>browse the diary</h2><ul><li>${internal(
    '/blog',
    'All posts',
    options,
  )}</li>${categories
    .map(
      category =>
        `<li>${internal(
          `/blog/category/${categorySlug(category)}`,
          category === 'Projects' ? 'Projects & tutorials' : category,
          options,
        )}</li>`,
    )
    .join('')}<li>${internal(
    '/music',
    'Music archive',
    options,
  )}</li><li>${internal(
    '/notes',
    'Parts & resources',
    options,
  )}</li></ul></section><section class="blog-box archive-box"><h2>recent entries</h2><ul>${publishedPosts
    .slice(0, 5)
    .map(post => `<li>${internal(post.path, post.title, options)}</li>`)
    .join(
      '',
    )}</ul><p><a href="/feed.xml">Subscribe via RSS</a></p></section><div class="web-badges" aria-label="Site details"><span>made on a desktop</span><span>music + experiments</span></div></aside>`;
}

module.exports = { postPreview, blogSidebar };

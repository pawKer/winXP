const { profile, releases } = require('../site');
const { publishedPosts } = require('../registry');
const { escapeHtml, internal, external, listenLink } = require('./helpers');
function renderHomeIndex(options) {
  return `<header class="profile-intro"><img class="portrait" src="${
    profile.avatarSrc
  }" alt="reshra" width="140" height="140"><div><p class="eyebrow">welcome to my desktop</p><h1>reshra</h1><p>${escapeHtml(
    profile.bio,
  )}</p></div></header><section><h2>Official profiles</h2><ul class="official-profiles">${Object.entries(
    profile.socialLinks,
  )
    .map(([label, url]) => `<li>${external(url, label)}</li>`)
    .join('')}</ul></section><section><h2>Featured music</h2><ul>${releases
    .slice(0, 2)
    .map(
      release =>
        `<li>${internal(release.path, release.title, options)} · ${listenLink(
          release,
          'homepage',
        )}</li>`,
    )
    .join('')}</ul><p>${internal(
    '/music',
    'Open the complete music archive →',
    options,
  )}</p></section><section><h2>From the blog</h2><ul>${publishedPosts
    .slice(0, 3)
    .map(post => `<li>${internal(post.path, post.title, options)}</li>`)
    .join('')}</ul><p>${internal(
    '/blog',
    'Visit my corner of the web →',
    options,
  )}</p></section><section><h2>Notes & projects</h2><p>${internal(
    '/notes',
    'Browse parts, tutorials, and resources',
    options,
  )}</p></section>`;
}
module.exports = { renderHomeIndex };

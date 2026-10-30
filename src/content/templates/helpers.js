const { siteUrl } = require('../site');

const escapeHtml = value =>
  String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
const absolute = url => new URL(url, siteUrl).href;
const formatDate = date =>
  new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(date));
const dateLabel = date =>
  date ? `<time datetime="${escapeHtml(date)}">${formatDate(date)}</time>` : '';
const postDateLabel = post =>
  `${post.dateSource === 'video' ? 'Video published ' : ''}${dateLabel(
    post.publishedAt,
  )}`;
const external = (url, label, attributes = '') =>
  `<a href="${escapeHtml(
    url,
  )}" target="_blank" rel="noopener noreferrer" ${attributes}>${escapeHtml(
    label,
  )}<span class="external-mark" aria-label=" (opens in new tab)"> ↗</span></a>`;
const internal = (path, label, options = {}, attributes = '') => {
  const url = new URL(path, siteUrl);
  const page = require('../registry').getPage(url.pathname);
  if (page && page.path !== url.pathname) url.pathname = page.path;
  if (
    options.reading &&
    !url.pathname.startsWith('/blog') &&
    !url.searchParams.has('view')
  )
    url.searchParams.set('view', 'read');
  const href = url.pathname + url.search + url.hash;
  return `<a href="${escapeHtml(href)}" ${attributes}>${escapeHtml(label)}</a>`;
};
const listenLink = (release, placement, className = 'xp-button primary') =>
  external(
    release.listeningUrl,
    release.listeningLabel,
    `class="${className}" data-listen="${release.slug}" data-placement="${placement}"`,
  );
const icon = type =>
  `<img class="file-icon" src="/icons/${type}.png" alt="" width="32" height="32">`;

module.exports = {
  escapeHtml,
  absolute,
  formatDate,
  dateLabel,
  postDateLabel,
  external,
  internal,
  listenLink,
  icon,
};

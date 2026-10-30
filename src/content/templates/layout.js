const { profile, releases, notes } = require('../site');
const { publishedPosts } = require('../registry');
const { categorySlug } = require('../categories');
const { internal, escapeHtml } = require('./helpers');
const socialIcons = require('./social-icons');

function renderLayout(page, body, options) {
  const section =
    page.kind === 'post' || page.kind === 'blog'
      ? 'blog'
      : page.kind === 'note'
      ? 'notes'
      : page.kind;
  const folder = {
    blog: 'Blog',
    music: 'Music',
    notes: 'Notes',
    home: 'My Documents',
  }[section];
  const upcoming = releases.find(
    release => release.releaseStatus === 'upcoming',
  );
  const announcement =
    upcoming && publishedPosts.find(post => post.releaseId === upcoming.slug);
  const nav = [
    ['/blog', 'Blog', '▤'],
    ['/music', 'Music archive', '♫'],
    ['/notes', 'Notes & files', '▱'],
  ];
  const breadcrumb = [internal('/blog', 'reshra.xyz', options)];
  if (page.kind === 'post') {
    breadcrumb.push(internal('/blog', 'Blog', options));
    breadcrumb.push(
      internal(
        `/blog/category/${categorySlug(page.post.type)}`,
        page.post.type,
        options,
      ),
    );
  } else if (page.kind === 'note') {
    breadcrumb.push(internal('/notes', 'Notes & files', options));
    breadcrumb.push(escapeHtml(page.note.title));
  } else breadcrumb.push(escapeHtml(folder));
  return `<div class="xp-site blog-page">${
    options.embedded
      ? `<div class="embedded-page-tools"><a href="${escapeHtml(
          page.path,
        )}" target="_blank" rel="noopener noreferrer">Open full page ↗</a></div>`
      : ''
  }
    <div class="window-title"><span>▣ &nbsp; reshra's corner of the web</span></div>
    <div class="explorer-address"><span>Address</span><span>📁 &nbsp; C:\\reshra\\${folder}</span><span aria-hidden="true">▾</span></div>
    <header class="masthead"><p class="wordmark">${internal(
      '/blog',
      'reshra',
      options,
    )}<span>.xyz</span></p><div class="masthead-copy"><span>A SMALL PLACE ON THE INTERNET</span><p>songs, solder &amp; things worth keeping.</p></div></header>
    <nav class="main-nav site-nav" aria-label="Main navigation">${nav
      .map(([path, label, glyph]) =>
        internal(
          path,
          `${glyph} ${label}`,
          options,
          section === path.slice(1) ? 'aria-current="page"' : '',
        ),
      )
      .join('')}<a class="desktop-link" id="${
    options.embedded ? 'embedded-desktop-link' : 'view-toggle'
  }" data-desktop-view href="${escapeHtml(
    page.path,
  )}?view=desktop"><img class="windows-icon" src="/icons/windows.png" alt=""><span>XP desktop</span><span class="desktop-arrow" aria-hidden="true">↗</span></a></nav>
    <div class="layout blog-layout"><aside class="sidebar blog-sidebar" aria-label="About and shortcuts"><section class="panel profile-panel"><h2 class="panel-heading">About reshra</h2><div class="profile-content"><img class="avatar" src="${escapeHtml(
      profile.avatarSrc,
    )}" alt="reshra" width="96" height="96"><h3>reshra</h3><p>Music, guitar projects, and experiments.</p></div><div class="profile-links">${[
    'youtube',
    'instagram',
    'spotify',
  ]
    .map(
      name =>
        `<a href="${escapeHtml(
          profile.socialLinks[name],
        )}" target="_blank" rel="noopener noreferrer"><span class="social-mark ${name}">${
          socialIcons[name]
        }</span><span class="social-name">${
          { youtube: 'YouTube', instagram: 'Instagram', spotify: 'Spotify' }[
            name
          ]
        }</span><span class="social-arrow" aria-label=" (opens in a new tab)">↗</span></a>`,
    )
    .join('')}</div></section>
    <section class="panel folder-panel"><h2 class="panel-heading">My folders</h2>${nav
      .map(([path, label]) => internal(path, `📁 ${label}`, options))
      .join('')}</section>
    ${
      announcement
        ? `<section class="panel release-panel"><h2 class="panel-heading">On the noticeboard</h2><div class="notice"><span class="tiny-label">NEXT RELEASE${
            upcoming.releaseDate ? ` · ${escapeHtml(upcoming.releaseDate)}` : ''
          }</span><h3>${escapeHtml(
            upcoming.title,
          )}</h3><p>A new recording.<br>A place to listen again.</p>${internal(
            announcement.path,
            'Read & listen →',
            options,
          )}</div></section>`
        : ''
    }
    <div class="web-buttons" aria-label="Homepage decoration"><span>handmade<br><b>on the web</b></span><span>best viewed<br><b>with curiosity</b></span></div></aside>
    <main id="${
      options.embedded ? 'desktop-page-main' : 'page-main'
    }" class="blog-main" tabindex="-1"><nav class="breadcrumb" aria-label="Breadcrumb">${breadcrumb.join(
    '<span aria-hidden="true">/</span>',
  )}</nav>${body}</main></div><footer class="site-footer"><span>© reshra · a personal homepage</span><a href="/feed.xml">RSS ↗</a><span>thanks for dropping by ✧</span></footer></div>`;
}

function notesBrowser(note, content, options) {
  return `<div class="notes-explorer"><nav class="file-list" aria-label="Choose a note"><p>My text documents / ${
    notes.length
  } files</p>${notes
    .map(item =>
      internal(
        item.path,
        item.title,
        options,
        item.id === note.id ? 'aria-current="page"' : '',
      )
        .replace(
          '>',
          '><img src="/icons/note.png" alt="" width="20" height="20"><span>',
        )
        .replace('</a>', '<small>Text document</small></span></a>'),
    )
    .join(
      '',
    )}</nav><article class="notepad"><div class="notepad-title">${escapeHtml(
    note.title,
  )} — Notepad</div><div class="note-body">${content}</div></article></div><div class="file-status">${
    notes.length
  } text documents · selected: ${escapeHtml(note.title)}</div>`;
}

module.exports = { renderLayout, notesBrowser };

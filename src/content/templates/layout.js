const { profile, releases, notes, settings, navigation } = require('../site');
const { publishedPosts } = require('../registry');
const { categorySlug } = require('../categories');
const { internal, escapeHtml } = require('./helpers');
const socialIcons = require('./social-icons');
const navigationIcons = {
  '/blog': '/icons/blog.png',
  '/music': '/icons/music.png',
  '/notes': '/icons/note.png',
  '/blog/about': '/icons/user.png',
};

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
  const copy = settings.copy;
  const upcoming = releases.find(
    release =>
      release.releaseStatus === 'upcoming' &&
      publishedPosts.some(post => post.releaseId === release.slug),
  );
  const announcement =
    upcoming && publishedPosts.find(post => post.releaseId === upcoming.slug);
  const nav = navigation.map(item => [item.path, item.label, item.glyph]);
  const menuId = `${options.prefix || 'static'}-site-menu`;
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
    <div class="window-title"><span>▣ &nbsp; ${escapeHtml(
      copy.windowTitle,
    )}</span></div>
    <div class="explorer-address"><span>Address</span><span>📁 &nbsp; C:\\reshra\\${folder}</span><span aria-hidden="true">▾</span></div>
    <header class="masthead"><p class="wordmark">${internal(
      '/blog',
      profile.name,
      options,
    )}<span>.xyz</span></p><div class="masthead-copy"><span>${escapeHtml(
    copy.mastheadEyebrow,
  )}</span><p>${escapeHtml(
    copy.tagline,
  )}</p></div><button class="mobile-menu-toggle" type="button" data-menu-toggle aria-expanded="false" aria-controls="${escapeHtml(
    menuId,
  )}" aria-label="Open navigation menu"><svg class="menu-open-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true" focusable="false"><path d="M4 6h16M4 12h16M4 18h16"></path></svg><svg class="menu-close-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true" focusable="false"><path d="m6 6 12 12M18 6 6 18"></path></svg><span data-menu-label>Menu</span></button></header>
    <nav class="main-nav site-nav" id="${escapeHtml(
      menuId,
    )}" data-site-menu aria-label="Main navigation">${nav
    .map(([path, label, glyph]) => {
      const current = section === path.slice(1);
      return internal(
        path,
        label,
        options,
        current ? 'aria-current="page"' : '',
      )
        .replace(
          '>',
          `><img class="nav-icon" src="${navigationIcons[path] ||
            '/icons/folder.png'}" alt="" width="24" height="24"><span class="nav-glyph" aria-hidden="true">${escapeHtml(
            glyph,
          )}</span><span class="nav-label">`,
        )
        .replace(
          '</a>',
          `</span><span class="nav-arrow" aria-hidden="true">${
            current ? '•' : '›'
          }</span></a>`,
        );
    })
    .join('')}<a class="desktop-link" id="${
    options.embedded ? 'embedded-desktop-link' : 'view-toggle'
  }" data-desktop-view href="${escapeHtml(
    page.path,
  )}?view=desktop"><img class="windows-icon" src="/icons/windows.png" alt=""><span>XP desktop</span><span class="desktop-arrow" aria-hidden="true">↗</span></a></nav>
    <div class="layout blog-layout"><aside class="sidebar blog-sidebar" aria-label="About and shortcuts"><section class="panel profile-panel"><h2 class="panel-heading">About ${escapeHtml(
      profile.name,
    )}</h2><div class="profile-content"><img class="avatar" src="${escapeHtml(
    profile.avatarSrc,
  )}" alt="${escapeHtml(profile.name)}" width="96" height="96"><h3>${escapeHtml(
    profile.name,
  )}</h3><p>${escapeHtml(
    settings.sidebar.bio,
  )}</p></div><div class="profile-links">${settings.sidebar.socialIds
    .map(
      name =>
        `<a href="${escapeHtml(
          profile.socialLinks[name],
        )}" target="_blank" rel="noopener noreferrer"><span class="social-mark ${name}">${
          socialIcons[name]
        }</span><span class="social-name">${escapeHtml(
          settings.profile.socialLinks.find(item => item.id === name).label,
        )}</span><span class="social-arrow" aria-label=" (opens in a new tab)">↗</span></a>`,
    )
    .join('')}</div></section>
    <section class="panel folder-panel"><h2 class="panel-heading">My folders</h2>${nav
      .map(([path, label]) => internal(path, `📁 ${label}`, options))
      .join('')}</section>
    ${
      announcement
        ? `<section class="panel release-panel"><h2 class="panel-heading">${escapeHtml(
            copy.noticeTitle,
          )}</h2><div class="notice"><span class="tiny-label">NEXT RELEASE${
            upcoming.releaseDate ? ` · ${escapeHtml(upcoming.releaseDate)}` : ''
          }</span><h3>${escapeHtml(
            upcoming.title,
          )}</h3><p>${copy.noticeLines
            .map(escapeHtml)
            .join('<br>')}</p>${internal(
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
  )}</nav>${body}</main></div><footer class="site-footer"><span>${escapeHtml(
    copy.footer,
  )}</span><a href="/feed.xml">RSS ↗</a><span>${escapeHtml(
    copy.footerThanks,
  )}</span></footer></div>`;
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

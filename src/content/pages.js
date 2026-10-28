const { siteUrl, profile, notes, releases } = require('./site');
const { posts } = require('./posts');
const { videoById } = require('./catalogue');

const publishedPosts = posts
  .filter(post => post.status === 'published')
  .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
const pageSize = 6;
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
  const href =
    options.reading && !path.startsWith('/blog')
      ? `${path}${path.includes('?') ? '&' : '?'}view=read`
      : path;
  return `<a href="${escapeHtml(href)}" ${attributes}>${escapeHtml(label)}</a>`;
};
const listenLink = (release, placement) =>
  external(
    release.listeningUrl,
    release.listeningLabel,
    `class="xp-button primary" data-listen="${release.slug}" data-placement="${placement}"`,
  );
const icon = type =>
  `<img class="file-icon" src="/icons/${type}.png" alt="" width="32" height="32">`;

const artist = {
  '@type': 'Person',
  '@id': `${siteUrl}/#artist`,
  name: profile.name,
  url: siteUrl,
  image: absolute(profile.avatarSrc),
  description: profile.bio,
  sameAs: Object.values(profile.socialLinks),
};
const videoData = video =>
  video && {
    '@type': 'VideoObject',
    '@id': `${video.sourceUrl}#video`,
    name: video.title,
    description: video.title,
    thumbnailUrl: `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`,
    uploadDate: video.publishedAt,
    duration: `PT${video.duration}S`,
    embedUrl: `https://www.youtube-nocookie.com/embed/${video.id}`,
    publisher: { '@id': artist['@id'] },
  };

function buildPages() {
  const pages = [
    {
      path: '/',
      kind: 'home',
      title: 'reshra — Music, Projects & Notes',
      description: profile.bio,
    },
    {
      path: '/music',
      kind: 'music',
      title: 'Music by reshra — The Archive',
      description:
        'Explore reshra’s recordings, official music videos, credits, and listening links, from new music to the archive.',
    },
    {
      path: '/notes',
      kind: 'notes',
      title: 'Notes & Project Resources — reshra',
      description:
        'Guitar parts, MIDI controller resources, NAM amp captures, and project notes from reshra.',
    },
    ...releases.map(release => ({
      path: release.path,
      kind: 'release',
      release,
      title: `${release.title} — reshra | ${
        release.releaseStatus === 'upcoming'
          ? 'Upcoming Release'
          : 'Music & Official Video'
      }`,
      description: release.description,
      image:
        release.artwork ||
        (release.video &&
          `https://i.ytimg.com/vi/${release.video.id}/hqdefault.jpg`),
    })),
    ...notes.map(note => ({
      path: note.path,
      kind: 'note',
      note,
      title: `${note.title} — reshra`,
      description: note.description,
    })),
    ...publishedPosts.map(post => ({
      path: post.path,
      kind: 'post',
      post,
      title: `${post.title} — reshra’s Blog`,
      description: post.excerpt,
      image: post.videoId
        ? `https://i.ytimg.com/vi/${post.videoId}/hqdefault.jpg`
        : null,
    })),
  ];
  const total = Math.ceil(publishedPosts.length / pageSize);
  for (let number = 1; number <= total; number++) {
    pages.push({
      path: number === 1 ? '/blog' : `/blog/page/${number}`,
      kind: 'blog',
      number,
      title: `reshra’s Blog — Music, Builds & Video Notes${
        number > 1 ? ` | Page ${number}` : ''
      }`,
      description: `Release stories, guitar projects, MIDI experiments, and video companions from reshra.${
        number > 1 ? ` Archive page ${number}.` : ''
      }`,
    });
  }
  ['Music', 'Projects'].forEach(category =>
    pages.push({
      path: `/blog/category/${category.toLowerCase()}`,
      kind: 'blog',
      category,
      title: `${category} — reshra’s Blog`,
      description: `${
        category === 'Music'
          ? 'Song releases and music archive entries'
          : 'Guitar modifications, MIDI pedal builds, and NAM experiments'
      } from reshra’s personal blog.`,
    }),
  );
  return pages;
}

const pages = buildPages();
const getPage = path => pages.find(page => page.path === path);
function structuredData(page) {
  const graph = [artist];
  if (page.release) {
    const release = page.release;
    const recording = {
      '@type': 'MusicRecording',
      '@id': `${absolute(release.path)}#recording`,
      name: release.title,
      byArtist: { '@id': artist['@id'] },
      url: absolute(release.path),
      sameAs: release.listeningUrl,
    };
    if (release.releaseDate && release.releaseStatus === 'released')
      recording.datePublished = release.releaseDate;
    if (release.video)
      recording.video = { '@id': `${release.video.sourceUrl}#video` };
    graph.push(recording);
    if (release.video) graph.push(videoData(release.video));
  }
  if (page.post) {
    const post = page.post;
    const article = {
      '@type': 'BlogPosting',
      '@id': `${absolute(post.path)}#article`,
      headline: post.title,
      description: post.excerpt,
      datePublished: post.publishedAt,
      author: { '@id': artist['@id'] },
      mainEntityOfPage: absolute(post.path),
      inLanguage: post.language,
    };
    if (post.updatedAt) article.dateModified = post.updatedAt;
    if (post.videoId)
      article.video = { '@id': `${videoById(post.videoId).sourceUrl}#video` };
    graph.push(article);
    if (post.videoId) graph.push(videoData(videoById(post.videoId)));
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}

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

function renderNote(note, options) {
  const hasAffiliate = note.sections.sections.some(section =>
    section.items.some(item => item.affiliate),
  );
  const actionDestinations = {
    playMusic: '/music',
    openGuitarParts: '/notes/guitar-parts',
  };
  const related = publishedPosts.filter(post =>
    (post.noteIds || []).includes(note.id),
  );
  return `<header class="document-heading">${icon('note')}<div><h1>${escapeHtml(
    note.title,
  )}</h1><p>${escapeHtml(note.description)}</p></div></header>${
    note.sections.title
      ? `<p class="welcome-note">${escapeHtml(note.sections.title)}</p>`
      : ''
  }${
    related.length
      ? `<aside class="related-note">Read the project: ${related
          .map(post => internal(post.path, post.title, options))
          .join(' · ')}</aside>`
      : ''
  }${
    hasAffiliate
      ? '<p class="disclosure">Some product links are affiliate links. I may earn a commission if you buy through them.</p>'
      : ''
  }${note.sections.sections
    .map(
      section =>
        `<section class="note-section"><h2>${escapeHtml(
          section.title,
        )}</h2><ul>${section.items
          .map(item => {
            const label = `${item.label || ''} ${item.displayText ||
              ''}`.trim();
            const analyticsAttributes = `data-note-link data-note-type="${escapeHtml(
              item.type,
            )}" data-note-label="${escapeHtml(
              item.displayText || item.label || '',
            )}"${
              item.action
                ? ` data-note-action="${escapeHtml(item.action)}"`
                : ''
            }`;
            if (item.type === 'external')
              return `<li><a href="${escapeHtml(
                item.url,
              )}" target="_blank" rel="noopener noreferrer${
                item.affiliate ? ' sponsored' : ''
              }" ${analyticsAttributes}>${escapeHtml(label)}</a></li>`;
            return `<li>${internal(
              actionDestinations[item.action] || '/music',
              label,
              options,
              analyticsAttributes,
            )}</li>`;
          })
          .join('')}</ul></section>`,
    )
    .join('')}`;
}

function renderRelease(release, options) {
  const post = publishedPosts.find(item => item.releaseId === release.slug);
  const nativeUrl = release.webAudioUrl || release.trackUrl;
  return `<div class="breadcrumbs">${internal(
    '/music',
    'Music archive',
    options,
  )} / ${escapeHtml(
    release.title,
  )}</div><header class="document-heading">${icon(
    'music',
  )}<div><p class="eyebrow">${
    release.releaseStatus === 'upcoming'
      ? 'Upcoming recording'
      : 'From the music archive'
  }</p><h1>${escapeHtml(release.title)}</h1><p>${escapeHtml(
    release.description,
  )}</p></div></header><div class="music-actions">${listenLink(
    release,
    'release',
  )}${
    options.embedded
      ? `<button class="xp-button" type="button" data-play-winamp="${release.slug}">Play in Winamp</button>`
      : ''
  }</div><p class="media-status" data-play-status role="status"></p>${
    release.releaseDate
      ? `<p>${
          release.releaseStatus === 'upcoming' ? 'Available' : 'Released'
        } ${dateLabel(release.releaseDate)}</p>`
      : ''
  }${renderVideo(release.video, options, release.slug)}${
    release.alternateVideos
      ? `<section><h2>Other versions</h2><ul>${release.alternateVideos
          .map(video => `<li>${external(video.sourceUrl, video.title)}</li>`)
          .join('')}</ul></section>`
      : ''
  }${
    !options.embedded && nativeUrl
      ? `<details class="local-player"><summary>Listen to the local recording</summary><audio controls preload="none" src="${escapeHtml(
          nativeUrl,
        )}" data-native-audio="${
          release.slug
        }" aria-label="Listen to ${escapeHtml(
          release.title,
        )}"></audio><p class="media-status" role="status" data-audio-status>If this recording is unavailable, use the music-service or YouTube link above.</p></details>`
      : ''
  }${
    release.credits.length
      ? `<section class="xp-group"><h2>Credits</h2><ul>${release.credits
          .map(credit => `<li>${escapeHtml(credit)}</li>`)
          .join('')}</ul>${
          release.video
            ? `<p class="source-note">From the ${external(
                release.video.sourceUrl,
                'official video description',
              )}.</p>`
            : ''
        }</section>`
      : ''
  }${
    release.guitarHeroUrl
      ? `<section class="xp-group"><h2>Play along</h2><p>${external(
          release.guitarHeroUrl,
          'Guitar Hero files for anii 2000',
        )}</p></section>`
      : ''
  }${
    post
      ? `<aside class="related-note">From the blog: ${internal(
          post.path,
          post.title,
          options,
        )}</aside>`
      : ''
  }<section class="related-posts"><h2>Keep listening</h2><ul>${releases
    .filter(item => item.slug !== release.slug)
    .slice(0, 3)
    .map(item => `<li>${internal(item.path, item.title, options)}</li>`)
    .join('')}</ul>${internal('/music', 'All music', options)}</section>`;
}

function postPreview(post, options) {
  const video = post.videoId && videoById(post.videoId);
  return `<article class="post-preview"><div class="post-meta"><span class="category-label">${
    post.type
  }</span> ${postDateLabel(post)}</div><h2>${internal(
    post.path,
    post.title,
    options,
  )}</h2>${
    video
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
  )}</li><li>${internal(
    '/blog/category/music',
    'Music',
    options,
  )}</li><li>${internal(
    '/blog/category/projects',
    'Projects & tutorials',
    options,
  )}</li><li>${internal('/music', 'Music archive', options)}</li><li>${internal(
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

function renderBlog(page, options) {
  let body;
  if (page.post) {
    const post = page.post;
    const release =
      post.releaseId && releases.find(item => item.slug === post.releaseId);
    const current = publishedPosts.indexOf(post);
    const adjacent = [
      publishedPosts[current - 1],
      publishedPosts[current + 1],
    ].filter(Boolean);
    body = `<article class="blog-article"><div class="post-meta"><span class="category-label">${
      post.type
    }</span> ${postDateLabel(post)} · by ${escapeHtml(
      post.author,
    )}</div><h1 tabindex="-1">${escapeHtml(
      post.title,
    )}</h1><p class="article-intro">${escapeHtml(post.excerpt)}</p>${
      post.videoId
        ? renderVideo(videoById(post.videoId), options, post.releaseId || '')
        : ''
    }${post.sections
      .map(
        (section, index) =>
          `<section id="section-${index}"><h2>${escapeHtml(
            section.title,
          )}</h2>${section.paragraphs
            .map(text => `<p>${escapeHtml(text)}</p>`)
            .join('')}</section>`,
      )
      .join('')}${
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
    }<footer class="article-footer"><p>${external(
      post.sourceUrl,
      'Original source',
    )} · ${
      post.provenance
        ? escapeHtml(post.provenance)
        : 'Archive entry based on the official recording and video credits.'
    }</p><button class="xp-button js-only" type="button" data-copy-link>Copy post link</button><span class="copy-status" role="status"></span></footer></article><nav class="post-pagination" aria-label="More posts">${internal(
      '/blog',
      '← All posts',
      options,
    )}${adjacent
      .map(item => internal(item.path, item.title, options))
      .join('')}</nav>`;
  } else {
    const filtered = page.category
      ? publishedPosts.filter(post => post.type === page.category)
      : publishedPosts;
    const number = page.number || 1;
    const entries = page.category
      ? filtered
      : filtered.slice((number - 1) * pageSize, number * pageSize);
    body = `<header class="feed-heading"><p class="eyebrow">music, builds & things worth keeping</p><h1 tabindex="-1">${
      page.category ? escapeHtml(page.category) : 'The latest from my desktop'
    }</h1><p>A little diary of songs, guitar projects, and experiments. Stay a while.</p></header><div class="blog-feed">${entries
      .map(post => postPreview(post, options))
      .join('')}</div>${
      !page.category
        ? `<nav class="post-pagination" aria-label="Blog pages">${
            number > 1
              ? internal(
                  number === 2 ? '/blog' : `/blog/page/${number - 1}`,
                  '← Newer posts',
                  options,
                )
              : ''
          }<span>Page ${number} of ${Math.ceil(
            publishedPosts.length / pageSize,
          )}</span>${
            number * pageSize < publishedPosts.length
              ? internal(`/blog/page/${number + 1}`, 'Older posts →', options)
              : ''
          }</nav>`
        : ''
    }`;
  }
  return `<div class="blog-page">${
    options.embedded
      ? `<div class="embedded-page-tools"><a href="${page.path}" target="_blank" rel="noopener noreferrer">Open full page ↗</a></div>`
      : ''
  }<header class="blog-masthead"><p class="blog-address">a personal homepage on the world wide web</p><p class="blog-title">${internal(
    '/blog',
    'reshra’s corner of the web',
    options,
  )}</p><p class="blog-tagline">songs, solder, and a few happy accidents <span aria-hidden="true">✦</span></p>${navigation(
    page.path,
    options,
  )}</header><div class="blog-layout">${blogSidebar(options)}<main id="${
    options.embedded ? 'desktop-page-main' : 'page-main'
  }" class="blog-main" tabindex="-1">${body}</main></div><footer class="blog-footer">© reshra · <a href="/feed.xml">RSS feed</a> · ${internal(
    '/?view=desktop',
    'Back to the desktop',
    {},
    '',
  )}<span class="footer-sticker" aria-hidden="true">★ thanks for dropping by ★</span></footer></div>`;
}

function renderContent(page, options = {}) {
  if (!page)
    return '<main id="page-main" tabindex="-1"><h1>Page not found</h1><p>This page is not in the archive.</p><a href="/">Go home</a></main>';
  if (page.kind === 'blog' || page.kind === 'post')
    return renderBlog(page, options);
  let content;
  if (page.kind === 'release') content = renderRelease(page.release, options);
  if (page.kind === 'note') content = renderNote(page.note, options);
  if (page.kind === 'music')
    content = `<header class="document-heading">${icon(
      'music',
    )}<div><p class="eyebrow">reshra audio archive</p><h1>Music by reshra</h1><p>New recordings and old favourites, all in one folder.</p></div></header><ul class="music-releases">${releases
      .map(
        release =>
          `<li class="music-release">${
            release.video
              ? `<img class="release-thumbnail" src="https://i.ytimg.com/vi/${release.video.id}/hqdefault.jpg" width="120" height="90" alt="" loading="lazy">`
              : icon('music')
          }<div><p class="eyebrow">${
            release.releaseStatus === 'upcoming' ? 'Coming soon' : 'Recording'
          }</p><h2>${internal(
            release.path,
            release.title,
            options,
          )}</h2><p>${escapeHtml(
            release.description,
          )}</p><div class="music-actions">${listenLink(
            release,
            'catalogue',
          )}${internal(
            release.path,
            'Open recording',
            options,
          )}</div></div></li>`,
      )
      .join('')}</ul>`;
  if (page.kind === 'notes')
    content = `<header class="document-heading">${icon(
      'note',
    )}<div><h1>Notes & resources</h1><p>Parts lists, project files, and useful things from the desktop.</p></div></header><ul class="note-index">${notes
      .map(
        note =>
          `<li>${icon('note')}<div><h2>${internal(
            note.path,
            note.title,
            options,
          )}</h2><p>${escapeHtml(note.description)}</p></div></li>`,
      )
      .join('')}</ul>`;
  if (page.kind === 'home')
    content = `<header class="profile-intro"><img class="portrait" src="${
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
  return `<div class="document-page">${navigation(
    page.path,
    options,
  )}<main id="${
    options.embedded ? 'desktop-page-main' : 'page-main'
  }" tabindex="-1">${content}</main><footer class="document-footer">© reshra · ${internal(
    '/blog',
    'Blog',
    options,
  )} · <a href="/feed.xml">RSS</a></footer></div>`;
}

module.exports = {
  pages,
  getPage,
  structuredData,
  renderContent,
  renderNote,
  escapeHtml,
  absolute,
  publishedPosts,
  videoData,
};

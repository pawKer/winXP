/* Local design study. Content is a snapshot of the site's published registry. */
(() => {
  'use strict';

  const { posts: sourcePosts, releases, notes } = window.previewContent;
  // One article per story. Music is a view of articles with recording metadata.
  const posts = sourcePosts.map(post =>
    Object.assign({}, post, {
      recording:
        releases.find(release => release.slug === post.releaseId) || null,
    }),
  );
  const musicPosts = posts.filter(post => post.recording);
  const main = document.getElementById('main');
  let category = 'All';
  let query = '';
  const escape = value =>
    String(value == null ? '' : value).replace(
      /[&<>"']/g,
      char =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        }[char]),
    );
  const asset = path => `../../public${path}`;
  const date = value =>
    new Date(value).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    });
  const duration = seconds =>
    `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  const external = (url, label, className = '') =>
    `<a class="${className}" href="${escape(
      url,
    )}" target="_blank" rel="noopener noreferrer">${escape(label)} ↗</a>`;
  const art = release => asset(release.artwork || '/artwork/drafts.jpg');
  const metadata = post =>
    `<div class="meta"><span class="tag">${escape(
      post.type,
    )}</span><time datetime="${escape(post.publishedAt)}">${date(
      post.publishedAt,
    )}</time><span>by reshra</span></div>`;
  const heading = (eyebrow, title, description, icon) =>
    `<header class="page-heading"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p>${description}</p></div><img class="heading-icon" src="${asset(
      `/icons/${icon}.png`,
    )}" alt=""></header>`;
  const crumbs = label =>
    `<div class="breadcrumb"><a href="#blog">reshra.xyz</a><span>/</span>${label}</div>`;
  const linkToPost = post => `#article/${post.slug}`;
  const thumbnail = post => {
    const recording = post.recording;
    if (recording && recording.artwork) return art(recording);
    if (post.videoId)
      return `https://i.ytimg.com/vi/${post.videoId}/hqdefault.jpg`;
    return asset('/artwork/drafts.jpg');
  };
  const videoEmbed = (id, label) =>
    `<section class="article-video" aria-label="${escape(
      label,
    )}"><div class="video-frame"><iframe src="https://www.youtube-nocookie.com/embed/${escape(
      id,
    )}?playsinline=1&amp;rel=0" title="${escape(
      label,
    )}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div><p>${external(
      `https://www.youtube.com/watch?v=${id}`,
      'Watch on YouTube',
    )}</p></section>`;
  function recordingDetails(release) {
    if (!release) return '';
    return `<section class="recording-details"><div class="recording-summary"><img src="${art(
      release,
    )}" alt="${escape(
      release.title,
    )} cover artwork" width="88" height="88"><div><span class="tiny-label">THE RECORDING</span><h2>${escape(
      release.title,
    )}</h2><p>reshra · ${duration(release.duration)}${
      release.releaseDate
        ? ` · ${release.releaseStatus === 'upcoming' ? 'Out ' : ''}${date(
            release.releaseDate,
          )}`
        : ''
    }</p></div></div><div class="release-actions">${external(
      release.listeningUrl,
      release.listeningLabel,
      'small-button',
    )}${
      release.guitarHeroUrl
        ? external(
            release.guitarHeroUrl,
            'Download Guitar Hero files',
            'small-button',
          )
        : ''
    }</div>${
      release.alternateVideos && release.alternateVideos.length
        ? `<div class="alternate-videos"><h3>More ways to watch</h3>${release.alternateVideos
            .map(video => external(video.sourceUrl, video.title))
            .join('')}</div>`
        : ''
    }${
      release.credits.length
        ? `<h3>Recording credits</h3><ul class="credits">${release.credits
            .map(credit => `<li>${escape(credit)}</li>`)
            .join('')}</ul>`
        : ''
    }</section>`;
  }

  function applyTheme(theme) {
    theme = theme === 'personal' ? 'personal' : 'explorer';
    document.body.dataset.theme = theme;
    document.querySelectorAll('[data-theme-choice]').forEach(button => {
      button.setAttribute(
        'aria-pressed',
        String(button.dataset.themeChoice === theme),
      );
    });
    document.getElementById('concept-note').innerHTML =
      theme === 'personal'
        ? '<b>01 / Personal Web.</b> The earlier alternative, kept for comparison. The same articles, thumbnails, and music collection in a personal-homepage frame.'
        : '<b>02 / My Documents — refined.</b> One article per story. Browse everything in Blog, or open the same music articles from an artwork shelf. All listening links live inside the article.';
    const url = new URL(window.location.href);
    url.searchParams.set('theme', theme);
    window.history.replaceState(null, '', url);
  }

  function renderBlog() {
    const featured =
      posts.find(post => post.releaseId === 'bruises') || posts[0];
    const release = featured.recording;
    main.innerHTML = `${crumbs('Blog')}${heading(
      'The weblog',
      'From my corner of the web.',
      'Release stories, guitar builds, and experiments along the way.',
      'note',
    )}
      <div class="toolbar"><div class="filters" role="group" aria-label="Filter posts">${[
        'All',
        'Music',
        'Projects',
      ]
        .map(
          value =>
            `<button type="button" data-filter="${value}" aria-pressed="${category ===
              value}">${value === 'All' ? 'All entries' : value}</button>`,
        )
        .join(
          '',
        )}</div><label class="search"><span class="sr-only">Search blog entries</span><input id="search" type="search" placeholder="Find an entry…" value="${escape(
      query,
    )}"></label></div>
      <section class="feature" id="featured" aria-label="Featured entry"><div class="feature-label"><span>✧ Pinned to the top</span><span>FROM THE MUSIC FOLDER</span></div><div class="feature-body"><a href="${linkToPost(
        featured,
      )}"><img class="feature-art" src="${art(release)}" alt="${escape(
      release.title,
    )} cover artwork"></a><div>${metadata(featured)}<h2><a href="${linkToPost(
      featured,
    )}">${escape(featured.title)}</a></h2><p>${escape(
      featured.excerpt,
    )}</p><a class="read-link" href="${linkToPost(
      featured,
    )}">Read the entry →</a></div></div></section>
      <section aria-label="Blog entries"><div class="section-caption"><strong>The entries</strong><span id="result-count" role="status"></span></div><div id="post-list"></div></section>`;
    main.querySelectorAll('[data-filter]').forEach(button => {
      button.addEventListener('click', () => {
        category = button.dataset.filter;
        main
          .querySelectorAll('[data-filter]')
          .forEach(item =>
            item.setAttribute('aria-pressed', String(item === button)),
          );
        updatePosts(featured);
      });
    });
    document.getElementById('search').addEventListener('input', event => {
      query = event.target.value;
      updatePosts(featured);
    });
    updatePosts(featured);
  }

  function updatePosts(featured) {
    const isFiltered = category !== 'All' || query.trim();
    const matches = posts.filter(
      post =>
        (!isFiltered ? post !== featured : true) &&
        (category === 'All' || post.type === category) &&
        `${post.title} ${post.excerpt}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
    );
    document.getElementById('featured').hidden = Boolean(isFiltered);
    document.getElementById('result-count').textContent = `${matches.length} ${
      isFiltered ? 'matching' : 'more'
    } ${matches.length === 1 ? 'entry' : 'entries'}`;
    document.getElementById('post-list').innerHTML = matches.length
      ? matches
          .map(post => {
            return `<article class="post-row"><a class="post-thumbnail ${
              post.recording ? 'music-thumbnail' : ''
            }" href="${linkToPost(post)}" aria-label="Read ${escape(
              post.title,
            )}"><img src="${thumbnail(post)}" alt="${escape(
              post.recording
                ? `${post.recording.title} cover artwork`
                : `${post.title} video thumbnail`,
            )}" loading="lazy">${
              post.videoId
                ? '<span class="thumbnail-play" aria-hidden="true">▶</span>'
                : ''
            }</a><div><div class="meta"><span class="tag">${escape(
              post.type,
            )}</span><span>${
              post.recording ? 'Music article' : 'Video companion'
            }</span><time datetime="${escape(post.publishedAt)}">${date(
              post.publishedAt,
            )}</time></div><h2><a href="${linkToPost(post)}">${escape(
              post.title,
            )}</a></h2><p>${escape(
              post.excerpt,
            )}</p></div><a class="post-arrow" href="${linkToPost(
              post,
            )}" aria-label="Read ${escape(post.title)}">↗</a></article>`;
          })
          .join('')
      : '<p class="empty">No entries found. Try another word or choose All entries.</p>';
  }

  function renderArticle(slug) {
    const post = posts.find(item => item.slug === slug);
    if (!post) return renderMissing();
    const release = post.recording;
    const videoId =
      post.videoId || (release && release.video && release.video.id);
    const related = (post.noteIds || [])
      .map(id => notes.find(note => note.id === id))
      .filter(Boolean);
    main.innerHTML = `${crumbs(
      `<a href="#blog">Blog</a><span>/</span>${escape(post.type)}`,
    )}<article class="article">${metadata(post)}<h1>${escape(
      post.title,
    )}</h1><p class="dek">${escape(post.excerpt)}</p>${
      videoId
        ? videoEmbed(videoId, post.title)
        : release
        ? `<figure class="article-artwork"><img src="${art(
            release,
          )}" alt="${escape(release.title)} cover artwork"><figcaption>${escape(
            release.title,
          )} · ${
            release.releaseDate ? `Out ${date(release.releaseDate)}` : 'reshra'
          }</figcaption></figure>`
        : ''
    }<div class="article-body">${post.bodyHtml}</div>
      ${recordingDetails(release)}
      ${
        post.chapters && post.chapters.length
          ? `<div class="resource-callout"><h2>${
              post.chapters && post.chapters.length
                ? 'Video chapters'
                : 'Video link'
            }</h2>${external(
              `https://www.youtube.com/watch?v=${post.videoId}`,
              'Open the original video on YouTube',
            )}${(post.chapters || [])
              .map(([seconds, label]) =>
                external(
                  `https://www.youtube.com/watch?v=${post.videoId}&t=${seconds}s`,
                  `${duration(seconds)} · ${label}`,
                ),
              )
              .join('')}</div>`
          : ''
      }
      ${
        related.length
          ? `<section class="resource-callout"><h2>Keep the useful bits</h2>${related
              .map(
                note =>
                  `<a href="#notes/${note.id}">▱ ${escape(note.title)} →</a>`,
              )
              .join('')}</section>`
          : ''
      }
      <footer class="article-tools"><a href="#blog">← All blog entries</a>${
        release ? '<a href="#music">♫ Music archive</a>' : ''
      }${
      post.sourceUrl ? external(post.sourceUrl, 'Original source') : ''
    }</footer></article>`;
    main.querySelectorAll('.article-body a').forEach(link => {
      const href = link.getAttribute('href');
      if (href.startsWith('https://') || href.startsWith('http://')) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      } else if (href.startsWith('/music/')) {
        const musicPost = musicPosts.find(item => item.recording.path === href);
        if (musicPost) link.href = linkToPost(musicPost);
      } else if (href.startsWith('/notes/')) {
        const note = notes.find(item => item.path === href);
        if (note) link.href = `#notes/${note.id}`;
      }
    });
  }

  function renderMusic() {
    const upcoming = musicPosts.find(
      post => post.recording.releaseStatus === 'upcoming',
    );
    const archive = musicPosts.filter(post => post !== upcoming);
    main.innerHTML = `${crumbs('Music archive')}${heading(
      'The recordings',
      'The music folder.',
      'The music articles, collected by cover. Open one for the story, videos, and listening links.',
      'music',
    )}
      ${
        upcoming
          ? `<section class="music-feature"><a href="${linkToPost(
              upcoming,
            )}"><img src="${art(upcoming.recording)}" alt="${escape(
              upcoming.recording.title,
            )} cover artwork"></a><div><span class="tiny-label">NEXT RELEASE / ${date(
              upcoming.recording.releaseDate,
            ).toUpperCase()}</span><h2>${escape(
              upcoming.recording.title,
            )}</h2><p>A new recording by reshra.<br>Out ${date(
              upcoming.recording.releaseDate,
            )}.</p><a class="small-button" href="${linkToPost(
              upcoming,
            )}">Read &amp; listen →</a></div></section>`
          : ''
      }
      <div class="section-caption"><strong>Browse the archive</strong><span>${
        archive.length
      } music articles · newest first</span></div><div class="record-grid">${archive
      .map(
        post =>
          `<article class="record"><a class="record-cover" href="${linkToPost(
            post,
          )}"><img src="${art(post.recording)}" alt="${escape(
            post.recording.title,
          )} cover artwork" loading="lazy"></a><div class="record-title"><h2><a href="${linkToPost(
            post,
          )}">${escape(post.recording.title)}</a></h2><span>${duration(
            post.recording.duration,
          )}</span></div><p>reshra · ${
            post.videoId ? 'story, video & links' : 'story & listening links'
          }</p></article>`,
      )
      .join('')}</div>`;
  }

  function renderNotes(id) {
    const note =
      notes.find(item => item.id === id) ||
      notes.find(item => item.id === 'midiPedal') ||
      notes[0];
    const actions = {
      playMusic: '#music',
      openGuitarParts: '#notes/guitarParts',
      openMidiPedal: '#notes/midiPedal',
    };
    main.innerHTML = `${crumbs('Notes &amp; files')}${heading(
      'The useful bits',
      'Notes, links & little files.',
      'Parts lists, project resources, and things to come back to.',
      'note',
    )}
      <div class="notes-explorer"><nav class="file-list" aria-label="Choose a note"><p>My text documents / ${
        notes.length
      } files</p>${notes
      .map(
        item =>
          `<a href="#notes/${item.id}" ${
            item.id === note.id ? 'aria-current="page"' : ''
          }><img src="${asset('/icons/note.png')}" alt=""><span>${escape(
            item.title,
          )}<small>Text document</small></span></a>`,
      )
      .join(
        '',
      )}</nav><article class="notepad"><div class="notepad-title">${escape(
      note.title,
    )} — Notepad</div><div class="note-body"><h2>${escape(
      note.title,
    )}</h2><p class="note-description">${escape(
      note.description,
    )}</p>${note.sections.sections
      .map(
        section =>
          `<section><h3>${escape(section.title)}</h3>${section.items
            .map(item =>
              item.url
                ? `<div>${
                    item.label ? `<span>${escape(item.label)} </span>` : ''
                  }${external(item.url, item.displayText || item.url)}${
                    item.affiliate ? '<small>affiliate link</small>' : ''
                  }</div>`
                : item.action && actions[item.action]
                ? `<a href="${actions[item.action]}">${escape(
                    item.displayText,
                  )} →</a>`
                : '',
            )
            .join('')}</section>`,
      )
      .join('')}</div></article></div><div class="file-status">${
      notes.length
    } text documents · selected: ${escape(note.title)}${
      note.sections.sections.some(section =>
        section.items.some(item => item.affiliate),
      )
        ? ' · Contains affiliate links'
        : ''
    }</div>`;
  }

  function renderMissing() {
    main.innerHTML =
      '<h1>File not found.</h1><p class="empty">This preview has no entry at that address.</p><a href="#blog">Return to the blog →</a>';
  }

  function render(focus = false) {
    let [requestedPage, id] = window.location.hash.slice(1).split('/');
    // Keep links from the first mockup working without a second detail page.
    if (requestedPage === 'release') {
      const post = musicPosts.find(item => item.recording.slug === id);
      if (post) {
        requestedPage = 'article';
        id = post.slug;
        window.history.replaceState(null, '', linkToPost(post));
      }
    }
    const page = requestedPage || 'blog';
    const section = page === 'article' ? 'blog' : page;
    document.querySelectorAll('[data-nav]').forEach(link => {
      if (link.dataset.nav === section)
        link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    document.getElementById('folder-path').textContent =
      {
        blog: 'Blog',
        article: 'Blog\\Article',
        music: 'Music',
        notes: 'Notes',
      }[section] || 'Blog';
    if (page === 'article') renderArticle(id || 'building-my-midi-pedal');
    else if (page === 'music') renderMusic();
    else if (page === 'notes') renderNotes(id);
    else if (page === 'blog') renderBlog();
    else renderMissing();
    document.title = `${
      main.querySelector('h1').textContent
    } — reshra design preview`;
    if (focus) main.focus({ preventScroll: true });
  }

  document.querySelectorAll('[data-theme-choice]').forEach(button => {
    button.addEventListener('click', () =>
      applyTheme(button.dataset.themeChoice),
    );
  });
  window.addEventListener('hashchange', () => render(true));
  applyTheme(new URLSearchParams(window.location.search).get('theme'));
  render();
})();

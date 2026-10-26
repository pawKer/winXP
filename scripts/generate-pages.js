const fs = require('fs');
const path = require('path');
const { siteUrl, profile, notes, releases } = require('../src/content/site');

const buildDir = path.resolve(__dirname, '../build');
const template = fs.readFileSync(path.join(buildDir, 'index.html'), 'utf8');

const escapeHtml = value =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const link = (href, label) =>
  `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`;

const internal = (pagePath, label) => link(`${pagePath}?view=read`, label);

const external = (href, label, sponsored = false) =>
  `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer${
    sponsored ? ' sponsored' : ''
  }">${escapeHtml(label)}</a>`;

const nav = `<nav aria-label="Site"><ul><li>${internal(
  '/',
  'Home',
)}</li><li>${internal('/music', 'Music')}</li><li>${internal(
  '/notes',
  'Notes',
)}</li></ul></nav>`;

const profileLinks = Object.entries(profile.socialLinks)
  .map(([label, url]) => `<li>${external(url, label)}</li>`)
  .join('');

const homepage = `<h1>reshra</h1><p>${escapeHtml(
  profile.bio,
)}</p><img class="portrait" src="/reshra_low_res.jpg" alt="reshra" width="180" height="180"><h2>Official profiles</h2><ul>${profileLinks}</ul><h2>Music</h2><ul>${releases
  .map(
    release =>
      `<li>${internal(release.path, release.title)} - ${external(
        release.listeningUrl,
        'Listen now',
      )}</li>`,
  )
  .join('')}</ul><p>${internal(
  '/music',
  'Browse all releases',
)}</p><h2>Notes</h2><p>${internal('/notes', 'Browse notes and resources')}</p>`;

const musicIndex = `<header class="music-hero"><p>reshra audio archive</p><h1>Music by reshra</h1><p>Listen now, or open a release for more information.</p></header><ul class="music-releases">${releases
  .map(
    release =>
      `<li class="music-release"><span class="music-disc" aria-hidden="true"></span><div><h2>${escapeHtml(
        release.title,
      )}</h2><p>${escapeHtml(
        release.description,
      )}</p><div class="music-actions">${external(
        release.listeningUrl,
        'Listen now',
      )}${internal(release.path, 'Release details')}</div></div></li>`,
  )
  .join('')}</ul>`;

const releasePage = release =>
  `<header class="music-hero"><p>reshra release</p><h1>${escapeHtml(
    release.title,
  )}</h1><p>${escapeHtml(release.description)}</p></header>${
    release.artwork
      ? `<img class="portrait" src="${escapeHtml(
          release.artwork,
        )}" alt="${escapeHtml(release.title)} cover artwork">`
      : ''
  }${
    release.releaseDate
      ? `<p>Released ${escapeHtml(release.releaseDate)}</p>`
      : ''
  }${
    release.credits.length
      ? `<p>Credits: ${escapeHtml(release.credits.join(', '))}</p>`
      : ''
  }<div class="music-actions">${external(
    release.listeningUrl,
    'Listen now',
  )}</div><section class="music-player"><h2>Listen here</h2><audio controls preload="none" src="${escapeHtml(
    release.trackUrl,
  )}">Your browser does not support audio playback.</audio></section>${
    release.guitarHeroUrl
      ? `<p>${external(
          release.guitarHeroUrl,
          'Guitar Hero files for anii 2000',
        )}</p>`
      : ''
  }<section class="music-related"><h2>More from reshra</h2><ul>${releases
    .filter(item => item.slug !== release.slug)
    .map(
      item =>
        `<li>${internal(item.path, item.title)} - ${external(
          item.listeningUrl,
          'Listen now',
        )}</li>`,
    )
    .join('')}</ul></section><p>${internal('/music', 'All music')}</p>`;

const notesIndex = `<h1>Notes from reshra</h1><p>Music and guitar project resources shared from reshra’s desktop.</p><ul>${notes
  .map(
    note =>
      `<li>${internal(note.path, note.title)} — ${escapeHtml(
        note.description,
      )}</li>`,
  )
  .join('')}</ul>`;

const actionDestinations = {
  playMusic: '/music',
  openGuitarParts: '/notes/guitar-parts',
};

const notePage = note => {
  const sections = note.sections.sections
    .map(section => {
      const items = section.items
        .map(item => {
          const destination = item.url || actionDestinations[item.action];
          if (!destination) return '';
          const affiliate = !!item.affiliate;
          const label = `${item.label || ''} ${item.displayText || ''}`.trim();
          return `<li>${
            item.url
              ? external(destination, label, affiliate)
              : internal(destination, label)
          }</li>`;
        })
        .join('');
      return `<section><h2>${escapeHtml(
        section.title,
      )}</h2><ul>${items}</ul></section>`;
    })
    .join('');
  const hasAffiliate = note.sections.sections.some(section =>
    section.items.some(item => item.affiliate),
  );
  return `<h1>${escapeHtml(note.title)}</h1><p>${escapeHtml(
    note.description,
  )}</p>${
    hasAffiliate
      ? '<p class="disclosure">Some product links are affiliate links. I may earn a commission if you buy through them.</p>'
      : ''
  }${sections}<p>${internal('/notes', 'All notes')}</p>`;
};

const pages = [
  {
    pagePath: '/',
    title: 'reshra - Official Music, Links & Notes',
    description: profile.bio,
    content: homepage,
  },
  {
    pagePath: '/music',
    title: 'Music by reshra | Official Releases',
    description:
      'Published music by reshra, with release information and listening links.',
    content: musicIndex,
  },
  {
    pagePath: '/notes',
    title: 'Notes and Resources | reshra',
    description: 'Music, guitar, and MIDI resources from reshra.',
    content: notesIndex,
  },
  ...releases.map(release => ({
    pagePath: release.path,
    title: `${release.title} - reshra | Official Release`,
    description: release.description,
    image: release.artwork || profile.avatarSrc,
    content: releasePage(release),
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'MusicRecording',
      name: release.title,
      byArtist: { '@id': `${siteUrl}/#artist` },
      url: `${siteUrl}${release.path}`,
      sameAs: release.listeningUrl,
      ...(release.releaseDate ? { datePublished: release.releaseDate } : {}),
      ...(release.artwork ? { image: `${siteUrl}${release.artwork}` } : {}),
    },
  })),
  ...notes.map(note => ({
    pagePath: note.path,
    title: `${note.title} | reshra`,
    description: note.description,
    content: notePage(note),
  })),
];

const artistData = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': `${siteUrl}/#artist`,
  name: profile.name,
  url: siteUrl,
  image: `${siteUrl}${profile.avatarSrc}`,
  description: profile.bio,
  sameAs: Object.values(profile.socialLinks),
};

const styles = `<style>
  #root { display: none; }
  #static-content { min-height: 100vh; box-sizing: border-box; padding: 22px; background: #dce8ff; color: #14213d; font: 16px/1.5 Tahoma, Arial, sans-serif; }
  #static-content .reading-inner { max-width: 760px; margin: auto; padding: 22px; background: #fff; border: 2px solid #426bbb; box-shadow: 4px 4px #183d7d; }
  #static-content a { color: #0645ad; }
  #static-content a:focus-visible { outline: 3px solid #ffbf00; }
  #static-content ul { padding-left: 24px; }
  #static-content li { margin: 8px 0; }
  #static-content .portrait { object-fit: cover; max-width: 100%; }
  #static-content audio { max-width: 100%; }
  #static-content .disclosure { background: #fff4ce; padding: 10px; }
  #static-content nav ul { display: flex; gap: 18px; flex-wrap: wrap; list-style: none; padding: 0; }
  #static-content .music-hero { margin: 18px -22px; padding: 18px 22px; color: #fff; background: linear-gradient(#3266b8, #173c82); border-bottom: 3px solid #ffbb46; }
  #static-content .music-hero h1 { margin: 4px 0; }
  #static-content .music-hero p { margin: 0 0 5px; }
  #static-content .music-releases { list-style: none; padding: 0; }
  #static-content .music-release { display: flex; gap: 14px; margin: 12px 0; padding: 16px; border: 1px solid #96add7; background: #f5f9ff; box-shadow: 2px 2px 0 #acc4ed; }
  #static-content .music-release h2 { margin: 0 0 4px; }
  #static-content .music-release p { margin: 0 0 12px; }
  #static-content .music-disc { display: block; flex: none; width: 54px; height: 54px; border-radius: 50%; background: radial-gradient(circle, #e9f3ff 0 7px, #18377d 8px 11px, #4f7dcb 12px 100%); border: 2px solid #18377d; }
  #static-content .music-actions { display: flex; gap: 10px; flex-wrap: wrap; margin: 14px 0; }
  #static-content .music-actions a { display: inline-block; padding: 7px 12px; border: 1px solid #7c9aca; background: #fff; text-decoration: none; font-weight: bold; box-shadow: 1px 1px 0 #afc4eb; }
  #static-content .music-actions a:first-child { color: #fff; background: #1c56ab; border-color: #0c3983; }
  #static-content .music-player { padding: 12px; background: #f5f9ff; border: 1px solid #96add7; }
  #static-content .music-player h2 { margin: 0 0 12px; font-size: 18px; }
  #static-content .music-related { margin-top: 18px; padding: 12px; background: #f5f9ff; border: 1px solid #96add7; }
  #static-content .music-related h2 { margin: 0; font-size: 18px; }
  html.desktop-ready:not(.reading-view) #root { display: block; }
  html.desktop-ready:not(.reading-view) #static-content { display: none; }
  html.reading-view #root { display: none; }
  html.reading-view #static-content { display: block; }
  #view-toggle { position: fixed; z-index: 999999; right: 12px; bottom: 45px; padding: 7px 10px; border: 1px solid #163987; background: #fff; color: #163987; font: bold 12px Tahoma, sans-serif; cursor: pointer; }
</style>`;

function renderPage(page) {
  const canonical = `${siteUrl}${page.pagePath}`;
  const data = page.structuredData || artistData;
  const metadata = `<meta name="description" content="${escapeHtml(
    page.description,
  )}"><link rel="canonical" href="${escapeHtml(
    canonical,
  )}"><meta property="og:type" content="${
    page.structuredData ? 'music.song' : 'website'
  }"><meta property="og:title" content="${escapeHtml(
    page.title,
  )}"><meta property="og:description" content="${escapeHtml(
    page.description,
  )}"><meta property="og:url" content="${escapeHtml(
    canonical,
  )}"><meta property="og:image" content="${siteUrl}${page.image ||
    profile.avatarSrc}"><meta name="twitter:card" content="summary_large_image"><script type="application/ld+json">${JSON.stringify(
    data,
  ).replace(/</g, '\\u003c')}</script>${styles}`;
  return template
    .replace(/<meta name="description"[^>]*>/, '')
    .replace(/<meta name="og:[^>]*>/g, '')
    .replace(/<meta\s+name="og:[\s\S]*?\/>/g, '')
    .replace(/<meta\s+name="description"[\s\S]*?\/>/g, '')
    .replace(
      /<title>[\s\S]*?<\/title>/,
      `<title>${escapeHtml(page.title)}</title>`,
    )
    .replace('</head>', `${metadata}</head>`)
    .replace(
      '<div id="root"></div>',
      `<div id="static-content" data-page-path="${escapeHtml(
        page.pagePath,
      )}"><div class="reading-inner"><p><a href="${escapeHtml(
        page.pagePath,
      )}?view=desktop">Desktop view</a></p>${nav}<main>${
        page.content
      }</main><footer><p>© reshra · ${internal(
        '/',
        'Home',
      )}</p></footer></div></div><div id="root"></div>`,
    );
}

for (const page of pages) {
  const output = path.join(
    buildDir,
    page.pagePath === '/' ? 'index.html' : `${page.pagePath.slice(1)}.html`,
  );
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, renderPage(page));
}

fs.writeFileSync(
  path.join(buildDir, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages
    .map(
      page =>
        `<url><loc>${escapeHtml(`${siteUrl}${page.pagePath}`)}</loc></url>`,
    )
    .join('')}</urlset>`,
);
fs.writeFileSync(
  path.join(buildDir, 'robots.txt'),
  `User-agent: GPTBot\nDisallow: /\n\nUser-agent: ClaudeBot\nDisallow: /\n\nUser-agent: Google-Extended\nAllow: /\n\nUser-agent: OAI-SearchBot\nAllow: /\n\nUser-agent: Claude-SearchBot\nAllow: /\n\nUser-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
);
console.log(
  `Generated ${pages.length} content pages, sitemap.xml, and robots.txt`,
);

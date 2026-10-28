const videos = require('./videos.json');
const audioManifest = require('./audioManifest.json');

const videoById = id => videos.find(video => video.id === id);
const archive = [
  [
    'forever',
    'forever',
    'hsTri1x-pEE',
    228,
    [
      'Written and produced by reshra',
      'Video by reshra',
      'Mix and master: Kol and Vlad Moaga at KAOL Music',
    ],
  ],
  [
    'oh-doamne',
    'oh, doamne',
    'DVcsbZbeAFg',
    200,
    [
      'Written and produced by reshra',
      'Video by reshra',
      'Special thanks to Vlad Moaga at KAOL Music',
    ],
  ],
  [
    'somn',
    'somn',
    'LmNphSW-lpo',
    184,
    [
      'Written and produced by reshra',
      'Video by reshra',
      'Special thanks to Vlad Moaga at KAOL Music',
    ],
  ],
  [
    'minimal',
    'minimal',
    'W60LQyHnwvM',
    152,
    [
      'Written and produced by reshra',
      'Video by reshra',
      'Sample from @chrispetramelodies on TikTok',
    ],
  ],
  [
    'phantom',
    'phantom',
    'n0h8LX_wvA8',
    141,
    [
      'Written and produced by reshra',
      'Video by reshra',
      'Mixed and mastered by Vlad Moaga',
    ],
  ],
  [
    'muzica',
    'muzica',
    '1ZsxDTzM4jk',
    144,
    ['Written and produced by reshra', 'Video by reshra'],
  ],
  [
    'vise',
    'vise',
    'CudDHVhmgLw',
    144,
    [
      'Written and produced by reshra',
      'Video by reshra',
      'Mix and master: Vlad Moaga',
    ],
  ],
  [
    'down',
    'down',
    'H1dNPvf6fP4',
    167,
    [
      'Written and produced by reshra',
      'Video by reshra',
      'Special thanks to Vlad Moaga',
    ],
  ],
];

const releases = [
  {
    slug: 'bruises',
    title: 'bruises',
    path: '/music/bruises',
    listeningUrl:
      'https://distrokid.com/hyperfollow/reshra/bruises?ref=release',
    listeningLabel: 'Pre-save bruises',
    releaseStatus: 'upcoming',
    releaseDate: '2026-11-01',
    duration: 273,
    trackUrl: '/songs/reshra - bruises.wav',
    description:
      'bruises by reshra. Pre-save for 1 November 2026, or listen to the recording on this desktop.',
    artwork: null,
    video: null,
    credits: [],
  },
  {
    slug: 'anii-2000',
    title: 'anii 2000',
    path: '/music/anii-2000',
    listeningUrl:
      'https://distrokid.com/hyperfollow/reshra/anii-2000?ref=release',
    listeningLabel: 'Listen on music services',
    releaseStatus: 'released',
    trackUrl: '/songs/reshra - anii 2000.wav',
    duration: 195,
    guitarHeroUrl:
      'https://drive.google.com/drive/folders/1g7SefzKNeO9_EjYc6GEQu-hWvagXgfV9?usp=drive_link',
    description:
      'anii 2000 by reshra: official visualizer, lyric video, Guitar Hero files, and listening links.',
    artwork: null,
    releaseDate: null,
    video: videoById('V0aUEGCaFjk'),
    alternateVideos: [videoById('Wbu7dbqYGY0'), videoById('9mNxrLwROfs')],
    credits: [
      'Written, produced, mixed and mastered by reshra',
      'Bass: Dragotoiu Alex',
      'Video by reshra',
    ],
  },
  ...archive.map(([slug, title, videoId, duration, credits]) => ({
    slug,
    title,
    path: `/music/${slug}`,
    duration,
    credits,
    trackUrl: `/songs/reshra - ${title}.wav`,
    listeningUrl: `https://distrokid.com/hyperfollow/reshra/${
      slug === 'down' ? 'down-3' : slug
    }`,
    listeningLabel: 'Listen on music services',
    releaseStatus: 'released',
    description: `${title} by reshra. Watch the official ${
      ['muzica', 'vise', 'down'].includes(slug) ? 'video' : 'visualizer'
    }, find the credits, and listen again.`,
    artwork: null,
    releaseDate: null,
    video: videoById(videoId),
  })),
];

releases.forEach(release => {
  if (audioManifest[release.slug])
    release.webAudioUrl = audioManifest[release.slug].url;
});

module.exports = { releases, videoById };

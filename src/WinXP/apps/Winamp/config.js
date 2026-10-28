import { releases } from 'content/site';

const order = [
  'bruises',
  'forever',
  'anii-2000',
  'somn',
  'oh-doamne',
  'phantom',
  'minimal',
  'muzica',
  'vise',
  'down',
];
export const initialTracks = [
  ...order
    .map(slug => releases.find(release => release.slug === slug))
    .map(release => ({
      url: release.webAudioUrl || release.trackUrl,
      duration: release.duration,
      metaData: { title: release.title, artist: 'reshra' },
    })),
  ...[
    ['twilight', 'wav', 167],
    ['love4rent', 'wav', 89],
    ['biñe', 'mp3', 13],
  ].map(([title, extension, duration]) => ({
    url: `/songs/(drafts) reshra - ${title}.${extension}`,
    duration,
    metaData: { title, artist: '(drafts) reshra' },
  })),
];

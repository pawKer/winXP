const {
  socialMediaConfig,
  guitarPartsConfig,
  midiPedalConfig,
  namAmpCaptureLinksConfig,
} = require('./noteSections');

const siteUrl = 'https://reshra.xyz';

const profile = {
  name: 'reshra',
  handle: 'reshra',
  bio: 'Links, projects, and notes.',
  avatarSrc: '/reshra_low_res.jpg',
  socialLinks: {
    instagram: 'https://instagram.com/reshnocash',
    tiktok: 'https://tiktok.com/@reshra',
    youtube: 'https://youtube.com/reshra',
    spotify: 'https://open.spotify.com/artist/781EBVicrg3Ry3uWjwQLD8',
  },
};

const notes = [
  {
    id: 'thankYou',
    title: 'Thank You.txt',
    path: '/notes/thank-you',
    description: 'Official social links and a welcome note from reshra.',
    sections: socialMediaConfig,
  },
  {
    id: 'guitarParts',
    title: 'Guitar Parts.txt',
    path: '/notes/guitar-parts',
    description: 'Guitar parts and wiring resources used in reshra’s projects.',
    sections: guitarPartsConfig,
  },
  {
    id: 'midiPedal',
    title: 'Midi Pedal.txt',
    path: '/notes/midi-pedal',
    description: 'Parts, tutorials, and mapping resources for a MIDI pedal.',
    sections: midiPedalConfig,
  },
  {
    id: 'namAmpCaptureLinks',
    title: 'NAM Amp Capture Links.txt',
    path: '/notes/nam-amp-capture-links',
    description:
      'Neural Amp Modeler capture, tutorials, and recording resources.',
    sections: namAmpCaptureLinksConfig,
  },
];

const releases = [
  // Add artwork, releaseDate, credits, and longer descriptions here when ready.
  {
    slug: 'bruises',
    title: 'bruises',
    path: '/music/bruises',
    listeningUrl:
      'https://distrokid.com/hyperfollow/reshra/bruises?ref=release',
    trackUrl: '/songs/reshra - bruises.wav',
    description: 'Listen to bruises by reshra.',
    artwork: null,
    releaseDate: null,
    credits: [],
  },
  {
    slug: 'anii-2000',
    title: 'anii 2000',
    path: '/music/anii-2000',
    listeningUrl:
      'https://distrokid.com/hyperfollow/reshra/anii-2000?ref=release',
    trackUrl: '/songs/reshra - anii 2000.wav',
    guitarHeroUrl:
      'https://drive.google.com/drive/folders/1g7SefzKNeO9_EjYc6GEQu-hWvagXgfV9?usp=drive_link',
    description: 'Listen to anii 2000 by reshra and find Guitar Hero files.',
    artwork: null,
    releaseDate: null,
    credits: [],
  },
];

module.exports = { siteUrl, profile, notes, releases };

const {
  socialMediaConfig,
  guitarPartsConfig,
  midiPedalConfig,
  namAmpCaptureLinksConfig,
} = require('./noteSections');

const siteUrl = 'https://reshra.xyz';
const { releases } = require('./catalogue');

const profile = {
  name: 'reshra',
  handle: 'reshra',
  bio: 'Music, guitar projects, and experiments by reshra.',
  avatarSrc: '/reshra_low_res.jpg',
  socialLinks: {
    instagram: 'https://instagram.com/reshnocash',
    tiktok: 'https://tiktok.com/@reshra',
    youtube: 'https://www.youtube.com/@reshra',
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

module.exports = { siteUrl, profile, notes, releases };

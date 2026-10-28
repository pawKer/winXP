const { releases, videoById } = require('./catalogue');

// These are factual companions to the artist's public videos, not invented
// first-person stories. Longer transcript-based tutorials remain separate drafts.
const publicationDate = '2026-10-27';
const archiveUpdatedAt = '2026-10-28';
const releasePosts = releases.map(release => ({
  id: `release-${release.slug}`,
  slug: release.slug,
  path: `/blog/${release.slug}`,
  type: 'Music',
  status: 'published',
  title:
    release.slug === 'anii-2000'
      ? 'anii 2000: visualizer, lyrics & Guitar Hero'
      : release.releaseStatus === 'upcoming'
      ? 'Next up: bruises'
      : `From the archive: ${release.title}`,
  excerpt:
    release.slug === 'anii-2000'
      ? 'Three official videos, one recording, and the files to play along in Guitar Hero.'
      : release.releaseStatus === 'upcoming'
      ? 'A new recording, a pre-save, and a place to listen before release day.'
      : `Revisit ${release.title}, with its official video and the people credited on the recording.`,
  publishedAt: release.video ? release.video.publishedAt : publicationDate,
  dateSource: release.video ? 'video' : 'article',
  updatedAt: release.video ? archiveUpdatedAt : undefined,
  author: 'reshra',
  language: 'en',
  releaseId: release.slug,
  videoId: release.video ? release.video.id : null,
  topics: ['music'],
  sourceUrl: release.video ? release.video.sourceUrl : release.listeningUrl,
  sections:
    release.slug === 'anii-2000'
      ? [
          {
            title: 'Choose your way to watch',
            paragraphs: [
              'The official visualizer, lyric video, and Guitar Hero playthrough give anii 2000 three different presentations. The main player below uses the visualizer; the other versions are linked alongside it.',
              'The video description credits Dragotoiu Alex on bass, with writing, production, mixing, mastering, and video by reshra.',
            ],
          },
          {
            title: 'Play along',
            paragraphs: [
              'The Guitar Hero files have their own shared folder. You can watch the playthrough first, then use the linked files to play the song yourself. The song page keeps those resources and the listening links together.',
            ],
          },
        ]
      : release.releaseStatus === 'upcoming'
      ? [
          {
            title: 'Before release day',
            paragraphs: [
              'bruises is listed for 1 November 2026 on the official pre-save page. The music-services link is a pre-save at the time this post was written; the local recording is available separately in the desktop player.',
              'An official music video has not been added here yet. This post links to the recording and pre-save without substituting a different song or a placeholder player.',
            ],
          },
        ]
      : [
          {
            title: 'Back in the archive',
            paragraphs: [
              `${release.title} has an official ${
                release.video.title.includes('Visualizer')
                  ? 'visualizer'
                  : 'video'
              } on reshra’s channel. This entry brings the video and its published credits back together, alongside the wider music archive.`,
              'The video upload date below identifies this version of the video. It is kept separate from the recording’s original release date.',
            ],
          },
          {
            title: 'From the video credits',
            paragraphs: [
              release.credits.join('. ') + '.',
              release.slug === 'minimal'
                ? 'The official description also identifies @chrispetramelodies on TikTok as the sample source.'
                : 'These credits are taken from the official video description; the source is linked below.',
            ],
          },
        ],
}));

const projectPosts = [
  {
    id: 'midi-pedal-build',
    slug: 'building-my-midi-pedal',
    type: 'Projects',
    title: 'Building a custom MIDI pedal',
    excerpt:
      'A Pedalino Mini 6 build, the TRS wiring abstraction, and a chapter guide to using it with the HX Stomp.',
    videoId: 'xHmpTT-fVG4',
    noteIds: ['midiPedal'],
    topics: ['midi', 'diy'],
    sections: [
      {
        title: 'One controller, several jobs',
        paragraphs: [
          'The build video brings together a Pedalino Mini 6 controller, 3D-printed parts, wiring, and practical HX Stomp use. Its description also points out that a USB MIDI pedal can trigger OBS scene changes or other computer shortcuts, as well as control music gear.',
        ],
      },
      {
        title: 'Making sense of the TRS abstraction',
        paragraphs: [
          'The description clarifies that a “pedal” in the Pedalino software represents a TRS connection: tip, ring, and sleeve/ground. That abstraction can represent different physical controls. A single momentary footswitch does not need to use every available connection.',
          'Use the wiring chapter and linked GPIO mapping for the connector assignments in this specific build.',
        ],
      },
      {
        title: 'Using it with the HX Stomp',
        paragraphs: [
          'The artist describes mostly staying on one preset, changing gain settings with snapshots, and using the extra switches to toggle effects or parameters. The description notes that display and LED-state synchronization used custom Pedalino-specific code and is not covered as a general recipe.',
        ],
      },
    ],
    chapters: [
      [0, 'Introduction'],
      [86, 'Parts overview'],
      [167, 'Wiring deep dive'],
      [450, 'Wiring timelapse'],
      [670, 'Using it with the HX Stomp'],
    ],
  },
  {
    id: 'guitar-modding',
    slug: 'modding-my-harley-benton',
    type: 'Projects',
    title: 'The Harley Benton guitar-modding diary',
    excerpt:
      'Shielding, parts, wiring, setup, and a before-and-after comparison in one chaptered build video.',
    videoId: 'cL6FpPPRb8k',
    noteIds: ['guitarParts'],
    topics: ['guitar', 'diy'],
    sections: [
      {
        title: 'The project in one place',
        paragraphs: [
          'This video collects the guitar-modding series into one longer walkthrough. The guitar is described as the 25th-anniversary version of the Harley Benton JA-60, in firemist copper.',
          'The sequence covers shielding, component selection and mounting, a wiring overview, setup, and the finished instrument. The parts note keeps the resource links separate so they remain easy to find.',
        ],
      },
      {
        title: 'Compare the result',
        paragraphs: [
          'The before-and-after tone comparison begins at 15:18. The final learning section starts at 17:38, after the reveal and comparison. Those chapters make useful return points when revisiting the project.',
        ],
      },
    ],
    chapters: [
      [0, 'Introduction'],
      [93, 'Shielding'],
      [246, 'Parts overview'],
      [344, 'Mounting components'],
      [495, 'Wiring overview'],
      [613, 'Wiring timelapse'],
      [716, 'Setup'],
      [866, 'Reveal'],
      [918, 'Tone comparison'],
      [1058, 'Lessons learned'],
    ],
  },
  {
    id: 'vox-ac15-capture',
    slug: 'capturing-my-vox-ac15',
    type: 'Projects',
    title: 'A Vox AC15, captured with NAM',
    excerpt:
      'A two-part experiment: capture the amp, compare it with the recording, then load the model in a DAW.',
    videoId: 'Ies6tZhKJwk',
    extraVideoIds: ['axaDts9Rjeg'],
    noteIds: ['namAmpCaptureLinks'],
    topics: ['guitar', 'recording'],
    sections: [
      {
        title: 'From amp to model',
        paragraphs: [
          'Part 1 documents making a NAM A2 capture of the Vox AC15. The original description explains that the project was a learning exercise and links to the amp capture through this site.',
          'The description distinguishes an optional calibration step from reamping the sweep signal. The original demonstration and linked project resources explain the procedure and signal chain.',
        ],
      },
      {
        title: 'Listen to both versions',
        paragraphs: [
          'Part 2 compares the real amp recording with the NAM capture and demonstrates loading the capture in a DAW. The description notes an attempt to match the recordings in LUFS, while acknowledging that the match could be refined further.',
          'The NAM resource note links to the capture and supporting tutorials. The comparison video is linked below rather than loading a second player at the same time.',
        ],
      },
    ],
  },
];

const posts = [
  ...projectPosts.map(post =>
    Object.assign({}, post, {
      path: `/blog/${post.slug}`,
      status: 'published',
      publishedAt: videoById(post.videoId).publishedAt,
      dateSource: 'video',
      updatedAt: archiveUpdatedAt,
      author: 'reshra',
      language: 'en',
      sourceUrl: videoById(post.videoId).sourceUrl,
      provenance:
        'Video companion adapted from the official description and chapter list.',
    }),
  ),
  ...releasePosts,
];

module.exports = { posts };

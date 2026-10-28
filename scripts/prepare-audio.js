const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { releases } = require('../src/content/catalogue');

const root = path.resolve(__dirname, '..');
const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
const check = spawnSync(ffmpeg, ['-version'], {
  encoding: 'utf8',
  windowsHide: true,
});
if (check.error || check.status !== 0) {
  console.error(
    'FFmpeg is required. Put it on PATH or set FFMPEG_PATH to its executable.',
  );
  process.exit(1);
}
const destination = path.join(root, 'public/songs/web');
fs.mkdirSync(destination, { recursive: true });
const manifest = {};
for (const release of releases) {
  const source = path.join(root, 'public', release.trackUrl);
  if (!fs.existsSync(source)) {
    console.warn(
      `Missing local master: ${release.title}. External listening remains available.`,
    );
    continue;
  }
  const output = path.join(destination, `${release.slug}.mp3`);
  if (
    !fs.existsSync(output) ||
    fs.statSync(output).mtimeMs < fs.statSync(source).mtimeMs
  ) {
    const result = spawnSync(
      ffmpeg,
      [
        '-nostdin',
        '-y',
        '-hide_banner',
        '-loglevel',
        'error',
        '-i',
        source,
        '-vn',
        '-codec:a',
        'libmp3lame',
        '-b:a',
        '192k',
        output,
      ],
      { stdio: 'inherit', windowsHide: true },
    );
    if (result.status !== 0) process.exit(result.status || 1);
  }
  manifest[release.slug] = {
    url: `/songs/web/${release.slug}.mp3`,
    sourceBytes: fs.statSync(source).size,
    webBytes: fs.statSync(output).size,
  };
  console.log(
    `${release.title}: ${manifest[release.slug].sourceBytes} → ${
      manifest[release.slug].webBytes
    } bytes`,
  );
}
fs.writeFileSync(
  path.join(root, 'src/content/audioManifest.json'),
  JSON.stringify(manifest, null, 2) + '\n',
);
console.log(
  'Updated the playback manifest. Masters are unchanged; compressed files remain inside gitignored public/songs.',
);

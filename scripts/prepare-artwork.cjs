const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const artwork = require('../src/content/artwork.json');

const root = path.resolve(__dirname, '..');
const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
let total = 0;
for (const { source: filename, url } of Object.values(artwork)) {
  const source = path.join(root, 'public/songs', filename);
  const output = path.join(root, 'public', url);
  if (!fs.existsSync(source)) {
    if (!fs.existsSync(output))
      throw new Error(`Missing artwork source and web copy: ${filename}`);
    continue;
  }
  fs.mkdirSync(path.dirname(output), { recursive: true });
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
        '-vf',
        'scale=800:800:force_original_aspect_ratio=decrease',
        '-frames:v',
        '1',
        '-q:v',
        '3',
        '-map_metadata',
        '-1',
        '-update',
        '1',
        output,
      ],
      { stdio: 'inherit', windowsHide: true },
    );
    if (result.error)
      throw new Error('FFmpeg is required: put it on PATH or set FFMPEG_PATH.');
    if (result.status !== 0) process.exit(result.status || 1);
  }
  total += fs.statSync(output).size;
}
console.log(
  `Prepared ${Object.keys(artwork).length} web covers (${Math.round(
    total / 1024,
  )} KiB). Originals are unchanged.`,
);

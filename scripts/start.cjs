const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { buildContent, sourceDir } = require('./content/build.cjs');

buildContent();
let timer;
const refresh = () => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    try {
      if (buildContent()) console.log('Updated Markdown posts');
    } catch (error) {
      console.error(
        `Content error: ${error.message}\nKeeping the last valid content until corrected.`,
      );
    }
  }, 150);
};
const watchers = [
  fs.watch(sourceDir, refresh),
  fs.watch(path.resolve(__dirname, '../src/content'), (_, filename) => {
    if (
      [
        'site.js',
        'catalogue.js',
        'categories.js',
        'noteSections.js',
        'videos.json',
        'audioManifest.json',
      ].includes(String(filename))
    )
      refresh();
  }),
];
const child = spawn(
  process.execPath,
  [require.resolve('react-scripts/bin/react-scripts'), 'start'],
  {
    stdio: 'inherit',
    env: process.env,
    windowsHide: true,
  },
);
function closeWatchers() {
  clearTimeout(timer);
  watchers.forEach(watcher => watcher.close());
}
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, () => {
    closeWatchers();
    child.kill(signal);
  });
child.on('error', error => {
  closeWatchers();
  console.error(error.message);
  process.exitCode = 1;
});
child.on('exit', code => {
  closeWatchers();
  process.exitCode = code || 0;
});

const { spawn } = require('child_process');
const { buildContent } = require('./content/build.cjs');
const { watchContent } = require('./content/watch.cjs');

buildContent();
const refresh = () => {
  try {
    if (buildContent()) console.log('Updated public content');
  } catch (error) {
    console.error(
      `Content error: ${error.message}\nKeeping the last valid content until corrected.`,
    );
  }
};
const watcher = watchContent(refresh);
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
  watcher.close();
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

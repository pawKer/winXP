const fs = require('fs');
const { contentDir } = require('./sources.cjs');

// Generated output is outside content/, so successful builds cannot trigger a loop.
function watchContent(onChange, directory = contentDir, delay = 150) {
  let timer;
  const watcher = fs.watch(directory, { recursive: true }, (_, filename) => {
    const file = String(filename || '').replace(/\\/g, '/');
    if (file.startsWith('templates/') || file.startsWith('schemas/')) return;
    if (file && !/\.(json|md)$/.test(file)) return;
    clearTimeout(timer);
    timer = setTimeout(onChange, delay);
  });
  return {
    close() {
      clearTimeout(timer);
      watcher.close();
    },
  };
}

module.exports = { watchContent };

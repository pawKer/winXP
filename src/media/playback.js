const players = new Map();
let owner = null;

export function registerPlayer(id, pause) {
  players.set(id, pause);
  return () => {
    if (players.get(id) === pause) players.delete(id);
    if (owner === id) owner = null;
  };
}

export function claimPlayback(id) {
  players.forEach((pause, key) => {
    if (key !== id) pause();
  });
  owner = id;
}

export function pauseAll() {
  players.forEach(pause => pause());
  owner = null;
}

let apiPromise;
export function loadYouTube() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!apiPromise)
    apiPromise = new Promise((resolve, reject) => {
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (previous) previous();
        resolve(window.YT);
      };
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.onerror = () => {
        apiPromise = null;
        reject(new Error('YouTube is unavailable.'));
      };
      document.head.appendChild(script);
    });
  return apiPromise;
}

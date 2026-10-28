import { registerPlayer, claimPlayback, pauseAll } from './playback';

test('starting one player pauses the other registered players', () => {
  const nativePause = jest.fn();
  const winampPause = jest.fn();
  const removeNative = registerPlayer('native-test', nativePause);
  const removeWinamp = registerPlayer('winamp-test', winampPause);
  claimPlayback('native-test');
  expect(winampPause).toHaveBeenCalledTimes(1);
  expect(nativePause).not.toHaveBeenCalled();
  removeNative();
  removeWinamp();
});

test('a mode change pauses every player', () => {
  const pause = jest.fn();
  const remove = registerPlayer('mode-test', pause);
  pauseAll();
  expect(pause).toHaveBeenCalledTimes(1);
  remove();
});

test('cleanup of an older registration cannot unregister its replacement', () => {
  const oldPause = jest.fn();
  const newPause = jest.fn();
  const oldCleanup = registerPlayer('strict-mode-test', oldPause);
  const newCleanup = registerPlayer('strict-mode-test', newPause);
  oldCleanup();
  pauseAll();
  expect(newPause).toHaveBeenCalledTimes(1);
  expect(oldPause).not.toHaveBeenCalled();
  newCleanup();
});

import React, { useCallback, useEffect, useRef } from 'react';
import Webamp from 'webamp';
import WebampWithVisualizers from 'webamp/butterchurn';
import { initialTracks } from './config';
import { releases } from 'content/site';
import { registerPlayer, claimPlayback } from 'media/playback';
import { trackEvent } from 'hooks/useGA';

const IS_DEV = process.env.NODE_ENV === 'development';
function hasWebGL() {
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (
      !context ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return false;
    const debug = context.getExtension('WEBGL_debug_renderer_info');
    const renderer = debug
      ? context.getParameter(debug.UNMASKED_RENDERER_WEBGL)
      : '';
    // A software WebGL context can exist even when visualizers are unreliable.
    return !/swiftshader|llvmpipe|software|basic render/i.test(renderer);
  } catch (_) {
    return false;
  }
}

export default function Winamp({
  onClose,
  onMinimize,
  playRequest,
  desktopActive = true,
}) {
  const target = useRef(null);
  const instance = useRef(null);
  const ready = useRef(false);
  const didInit = useRef(false);
  const pending = useRef(null);
  const latestRequest = useRef(null);
  const active = useRef(desktopActive);
  const callbacks = useRef({ onClose, onMinimize });
  callbacks.current = { onClose, onMinimize };
  const playPending = useRef(null);

  const announce = useCallback((url, message) => {
    window.dispatchEvent(
      new CustomEvent('reshra:playback-status', { detail: { url, message } }),
    );
  }, []);

  playPending.current = async () => {
    const request = pending.current;
    if (!ready.current || !instance.current || !request || !active.current)
      return;
    pending.current = null;
    const current = instance.current;
    announce(request.url, 'Loading the recording in Winamp…');
    try {
      const response = await fetch(request.url, { method: 'HEAD' });
      // SPA development servers can return index.html with status 200 for
      // absent media. Loading it makes Webamp skip to the following song.
      const contentType = response.headers.get('content-type') || '';
      if (
        !response.ok ||
        /(?:text\/html|application\/xhtml\+xml)/i.test(contentType)
      )
        throw new Error('Missing recording');
      if (
        instance.current !== current ||
        !active.current ||
        latestRequest.current !== request
      )
        return;
      let tracks = current.getPlaylistTracks();
      let index = tracks.findIndex(
        track =>
          new URL(track.url, window.location.origin).pathname ===
          new URL(request.url, window.location.origin).pathname,
      );
      if (index < 0) {
        const track = initialTracks.find(item => item.url === request.url);
        if (!track) throw new Error('Unknown recording');
        current.appendTracks([track]);
        index = tracks.length;
        tracks = current.getPlaylistTracks();
      }
      claimPlayback('winamp');
      // Webamp 2.2 dispatches this value as a track ID, despite documenting an
      // index. IDs also change after reopening or reordering the playlist.
      current.setCurrentTrack(tracks[index].id);
      current.play();
    } catch (_) {
      if (latestRequest.current !== request || instance.current !== current)
        return;
      announce(
        request.url,
        'This local recording is unavailable. Use its YouTube or music-service link.',
      );
    }
  };

  useEffect(() => {
    active.current = desktopActive;
    if (!desktopActive) {
      pending.current = null;
      latestRequest.current = null;
      if (instance.current?.getMediaStatus() === 'PLAYING')
        instance.current.pause();
    }
  }, [desktopActive]);

  useEffect(() => {
    if (!playRequest) return;
    latestRequest.current = playRequest;
    pending.current = playRequest;
    playPending.current();
  }, [playRequest]);

  useEffect(() => {
    // Preserve the existing React 18 development guard and DOM reparenting.
    if (IS_DEV && !didInit.current) {
      didInit.current = true;
      return;
    }
    if (!target.current) return;
    let disposed = false;
    let renderFrame;
    const Ctor = hasWebGL() ? WebampWithVisualizers : Webamp;
    const current = new Ctor({
      initialSkin: { url: '/winamp_skin/modern.wsz', name: 'Modern' },
      initialTracks,
      // Use Webamp's original layout and open Milkdrop on supported GPUs.
      // Start with the first preset rather than an untested random selection;
      // visitors can still choose presets or enable cycling in Milkdrop.
      __initialState: { milkdrop: { randomize: false, cycling: false } },
    });
    instance.current = current;
    let currentUrl = initialTracks[0].url;
    let previousStatus;
    let started = false;
    let previousTime = 0;
    let loadingSince = 0;
    const unregister = registerPlayer('winamp', () => {
      // Webamp's pause() toggles playback when already paused/stopped.
      if (current.getMediaStatus() === 'PLAYING') current.pause();
    });
    const unsubscribeTrack = current.onTrackDidChange(track => {
      currentUrl = track?.url || '';
      started = false;
      previousTime = 0;
      loadingSince = Date.now();
    });
    const detach = () => {
      const node = document.getElementById('webamp');
      if (node && node.parentElement !== document.body)
        document.body.appendChild(node);
    };
    const unsubscribeClose = current.onClose(() => {
      detach();
      callbacks.current.onClose();
    });
    const unsubscribeMinimize = current.onMinimize(() =>
      callbacks.current.onMinimize(),
    );
    const timer = setInterval(() => {
      if (disposed || !ready.current) return;
      const status = current.getMediaStatus();
      const time = current.media.timeElapsed();
      if (status === 'PLAYING' && previousStatus !== 'PLAYING') {
        claimPlayback('winamp');
        loadingSince = Date.now();
      }
      if (status === 'PLAYING' && time > previousTime + 0.01 && !started) {
        const release = releases.find(item =>
          [item.trackUrl, item.webAudioUrl]
            .filter(Boolean)
            .some(
              url =>
                new URL(url, window.location.origin).pathname ===
                new URL(currentUrl, window.location.origin).pathname,
            ),
        );
        if (release)
          trackEvent('music_play_start', {
            release: release.slug,
            player: 'winamp',
            view_mode: 'desktop',
          });
        announce(currentUrl, '');
        started = true;
      }
      if (
        status === 'PLAYING' &&
        !started &&
        loadingSince &&
        Date.now() - loadingSince > 15000
      ) {
        announce(
          currentUrl,
          'Playback has not started. Try Play again or use the YouTube/music-service link.',
        );
        loadingSince = 0;
      }
      previousStatus = status;
      previousTime = time;
    }, 300);
    function renderWhenVisible() {
      if (disposed) return;
      const mount = target.current;
      // Unlike master, the lazy desktop initially hides #root. Let Webamp
      // measure the visible mount and own all window coordinates/boundaries.
      if (!mount?.getClientRects().length) {
        renderFrame = requestAnimationFrame(renderWhenVisible);
        return;
      }
      const initialBounds = mount.getBoundingClientRect();
      current
        .renderWhenReady(mount)
        .then(() => {
          if (disposed) return;
          const node = document.getElementById('webamp');
          if (node && node.parentElement !== mount) {
            const outer = mount.getClientRects().length
              ? mount.getBoundingClientRect()
              : initialBounds;
            const inner = node.getBoundingClientRect();
            // Preserve master's reparenting without adding a visual offset
            // that Webamp's dragging/viewport constraints cannot see.
            mount.appendChild(node);
            node.style.left = `${Math.round(inner.left - outer.left)}px`;
            node.style.top = `${Math.round(inner.top - outer.top)}px`;
          }
          ready.current = true;
          playPending.current();
        })
        .catch(() => {
          if (!disposed)
            announce(
              '',
              'Winamp could not start. You can still use the music links.',
            );
        });
    }
    renderFrame = requestAnimationFrame(renderWhenVisible);
    return () => {
      disposed = true;
      ready.current = false;
      cancelAnimationFrame(renderFrame);
      clearInterval(timer);
      unregister();
      unsubscribeTrack();
      unsubscribeClose();
      unsubscribeMinimize();
      detach();
      current.dispose();
      if (instance.current === current) instance.current = null;
    };
  }, [announce]);

  return (
    <div
      ref={target}
      style={{ width: '100%', height: '100%', position: 'relative' }}
    />
  );
}

import React, { useEffect, useMemo, useRef, useId } from 'react';
import pageContent from 'content/pages';
import { releases } from 'content/site';
import { useSiteNavigation } from 'navigation/SiteNavigation';
import { trackEvent } from 'hooks/useGA';
import { claimPlayback, registerPlayer, loadYouTube } from 'media/playback';

const { getPage, renderContent, renderBlogEntries } = pageContent;

export default function PublicPage({
  path,
  embedded = false,
  active = true,
  onPlayTrack,
}) {
  const ref = useRef(null);
  const prefix = useId().replace(/:/g, '');
  const { mode, navigate, setMode } = useSiteNavigation();
  const page = getPage(path);
  const focusedPath = useRef(null);
  const html = useMemo(
    () =>
      renderContent(page, {
        embedded,
        reading: !embedded,
        prefix,
        origin: window.location.origin,
        mediaActive: active,
      }),
    [page, embedded, prefix, active],
  );

  useEffect(() => {
    const update = event => {
      const release = page?.release;
      if (
        !release ||
        event.detail.url !== (release.webAudioUrl || release.trackUrl)
      )
        return;
      const status = ref.current?.querySelector('[data-play-status]');
      if (status) status.textContent = event.detail.message;
    };
    window.addEventListener('reshra:playback-status', update);
    return () => window.removeEventListener('reshra:playback-status', update);
  }, [page]);

  useEffect(() => {
    const target = ref.current;
    if (!target || !active) return;
    const cleanup = [];
    let cancelled = false;
    target.querySelectorAll('audio[data-native-audio]').forEach(audio => {
      const release = audio.dataset.nativeAudio;
      const id = `${prefix}-audio-${release}`;
      const status = audio.parentElement.querySelector('[data-audio-status]');
      cleanup.push(registerPlayer(id, () => audio.pause()));
      let started = false;
      const onPlay = () => {
        claimPlayback(id);
        trackEvent('music_play_request', {
          release,
          player: 'native',
          view_mode: mode,
        });
      };
      const onPlaying = () => {
        if (!started)
          trackEvent('music_play_start', {
            release,
            player: 'native',
            view_mode: mode,
          });
        started = true;
        status.textContent = 'Playing the local recording.';
      };
      const onError = () => {
        status.textContent =
          'This local recording is unavailable. Use the YouTube or music-service link above.';
      };
      audio.addEventListener('play', onPlay);
      audio.addEventListener('playing', onPlaying);
      audio.addEventListener('error', onError);
      cleanup.push(() => {
        audio.pause();
        audio.removeEventListener('play', onPlay);
        audio.removeEventListener('playing', onPlaying);
        audio.removeEventListener('error', onError);
      });
    });
    target.querySelectorAll('iframe[data-video-id]').forEach(iframe => {
      let player;
      let progressTimer;
      let started = false;
      const milestones = new Set();
      const videoId = iframe.dataset.videoId;
      const id = `${prefix}-youtube-${videoId}`;
      const parameters = {
        video_provider: 'youtube',
        video_title: iframe.title,
        video_url: `https://www.youtube.com/watch?v=${videoId}`,
        release: iframe.dataset.release || undefined,
        player: 'youtube',
        view_mode: mode,
      };
      const pause = () => {
        try {
          player?.pauseVideo();
        } catch (_) {}
      };
      const status = iframe
        .closest('.video-section')
        .querySelector('[data-video-status]');
      cleanup.push(registerPlayer(id, pause));
      loadYouTube()
        .then(YT => {
          if (cancelled || !iframe.isConnected) return;
          player = new YT.Player(iframe.id, {
            events: {
              onReady: () => {
                iframe.dataset.playerReady = 'true';
              },
              onStateChange: event => {
                if (cancelled) return;
                iframe.dataset.playerState = String(event.data);
                if (event.data === YT.PlayerState.PLAYING) {
                  claimPlayback(id);
                  if (!started) trackEvent('video_start', parameters);
                  started = true;
                  clearInterval(progressTimer);
                  progressTimer = setInterval(() => {
                    const duration = player.getDuration();
                    const position = player.getCurrentTime();
                    [10, 25, 50, 75].forEach(percent => {
                      if (
                        duration &&
                        (position / duration) * 100 >= percent &&
                        !milestones.has(percent)
                      ) {
                        milestones.add(percent);
                        trackEvent('video_progress', {
                          ...parameters,
                          video_percent: percent,
                          video_current_time: position,
                          video_duration: duration,
                        });
                      }
                    });
                  }, 1000);
                } else {
                  clearInterval(progressTimer);
                }
                if (event.data === YT.PlayerState.ENDED) {
                  trackEvent('video_complete', parameters);
                  started = false;
                  milestones.clear();
                }
              },
              onError: () => {
                status.textContent =
                  'The embedded video is unavailable here. You can still open it on YouTube.';
              },
            },
          });
        })
        .catch(() => {
          if (!cancelled)
            status.textContent =
              'Player controls could not connect. Use “Watch on YouTube” if playback is unavailable.';
        });
      cleanup.push(() => {
        pause();
        clearInterval(progressTimer);
        queueMicrotask(() => {
          if (!iframe.isConnected) {
            try {
              player?.destroy();
            } catch (_) {}
          }
        });
      });
    });
    return () => {
      cancelled = true;
      cleanup.forEach(dispose => dispose());
    };
  }, [html, active, mode, prefix]);

  function onClick(event) {
    const button = event.target.closest('button');
    const listen = event.target.closest('[data-listen]');
    if (listen)
      trackEvent('music_listen_click', {
        release: listen.dataset.listen,
        destination: listen.href,
        placement: listen.dataset.placement,
        view_mode: mode,
      });
    if (button?.hasAttribute('data-play-winamp')) {
      const release = releases.find(
        item => item.slug === button.dataset.playWinamp,
      );
      if (release && onPlayTrack) {
        trackEvent('music_play_request', {
          release: release.slug,
          player: 'winamp',
          view_mode: mode,
        });
        onPlayTrack(release.webAudioUrl || release.trackUrl);
        ref.current.querySelector('[data-play-status]').textContent =
          'Opening the recording in Winamp…';
      }
    }
    const link = event.target.closest('a');
    if (!link) return;
    if (
      link.hasAttribute('data-desktop-view') &&
      event.button === 0 &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.shiftKey &&
      !event.altKey
    ) {
      event.preventDefault();
      trackEvent('view_mode_change', { view_mode: 'desktop' });
      setMode('desktop');
      requestAnimationFrame(() =>
        document.getElementById('desktop-reading-toggle')?.focus(),
      );
      return;
    }
    if (link.hasAttribute('data-note-link'))
      trackEvent('notes_link_click', {
        destination: link.href,
        label: link.dataset.noteLabel,
        type: link.dataset.noteType,
        action: link.dataset.noteAction || undefined,
        view_mode: mode,
      });
    const url = new URL(link.href);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      link.target === '_blank' ||
      url.origin !== window.location.origin ||
      !getPage(url.pathname)
    )
      return;
    event.preventDefault();
    if (link.hasAttribute('data-play-desktop')) {
      const destination = new URL(window.location.href);
      destination.searchParams.set('view', 'desktop');
      destination.searchParams.set('play', link.dataset.playDesktop);
      if (mode !== 'desktop')
        trackEvent('view_mode_change', { view_mode: 'desktop' });
      navigate(
        `${destination.pathname}${destination.search}${destination.hash}`,
        { mode: 'desktop' },
      );
      return;
    }
    navigate(`${url.pathname}${url.search}${url.hash}`);
  }

  useEffect(() => {
    if (!active) return;
    if (focusedPath.current === path) return;
    focusedPath.current = path;
    ref.current?.querySelector('main')?.focus({ preventScroll: true });
    if (embedded) ref.current?.closest('.ie__content')?.scrollTo(0, 0);
    else window.scrollTo(0, 0);
  }, [path, active, embedded]);

  return (
    <div
      ref={ref}
      className={`public-page${embedded ? ' embedded-public' : ''}`}
      onClick={onClick}
      onInput={event => {
        if (!event.target.hasAttribute('data-blog-search')) return;
        const query = event.target.value.trim().toLowerCase();
        const result = renderBlogEntries(
          page,
          { embedded, reading: !embedded },
          query,
        );
        ref.current.querySelector('[data-blog-results]').innerHTML =
          result.html;
        const pagination = ref.current.querySelector(
          '[aria-label="Blog pages"]',
        );
        if (pagination) pagination.hidden = Boolean(query);
        ref.current.querySelector(
          '[data-blog-search-status]',
        ).textContent = query
          ? `${result.count} matching ${
              result.count === 1 ? 'entry' : 'entries'
            }.`
          : '';
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

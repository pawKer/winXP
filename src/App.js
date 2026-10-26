import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';

import WinXP from 'WinXP';
import { useGA, trackEvent } from 'hooks';
import { getAllNotes } from 'WinXP/apps/notesConfig';
import { releases } from 'content/site';

const AppContent = () => {
  const measurementId = process.env.REACT_APP_GA_MEASUREMENT_ID;
  useGA(measurementId);
  const { pathname } = useLocation();
  useEffect(() => {
    const staticContent = document.getElementById('static-content');
    if (!staticContent || staticContent.dataset.pagePath === pathname) return;
    let cancelled = false;
    staticContent.innerHTML = '<div class="reading-inner">Loading page…</div>';
    fetch(pathname)
      .then(response => response.text())
      .then(html => {
        if (cancelled) return;
        const next = new DOMParser().parseFromString(html, 'text/html');
        const content = next.getElementById('static-content');
        if (content) {
          staticContent.innerHTML = content.innerHTML;
          staticContent.dataset.pagePath = pathname;
        }
      })
      .catch(() => {
        if (!cancelled) {
          staticContent.innerHTML =
            '<div class="reading-inner"><p>Unable to load this page.</p></div>';
        }
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);
  const knownPaths = [
    '/',
    '/music',
    '/notes',
    ...releases.map(release => release.path),
    ...getAllNotes().map(note => note.path),
  ];
  if (!knownPaths.includes(pathname)) {
    return (
      <main>
        <h1>Page not found</h1>
        <a href="/">Go home</a>
      </main>
    );
  }
  return <WinXP defaultPath={pathname} />;
};

const App = () => {
  const hasReadingContent = !!document.getElementById('static-content');
  const [reading, setReading] = useState(
    () =>
      hasReadingContent &&
      new URLSearchParams(window.location.search).get('view') === 'read',
  );

  useEffect(() => {
    document.documentElement.classList.toggle('reading-view', reading);
    document.documentElement.classList.add('desktop-ready');
    return () => document.documentElement.classList.remove('desktop-ready');
  }, [reading]);

  useEffect(() => {
    const staticContent = document.getElementById('static-content');
    if (!staticContent) return;
    const trackReadingLink = event => {
      const link = event.target.closest('a');
      const release = releases.find(item => item.listeningUrl === link?.href);
      if (!release) return;
      try {
        trackEvent('music_listen_click', {
          release: release.slug,
          destination: release.listeningUrl,
        });
      } catch (error) {
        // Analytics must not block a listening link.
      }
    };
    staticContent.addEventListener('click', trackReadingLink);
    return () => staticContent.removeEventListener('click', trackReadingLink);
  }, []);

  function toggleReading() {
    const next = !reading;
    const url = new URL(window.location.href);
    if (next) url.searchParams.set('view', 'read');
    else url.searchParams.delete('view');
    window.history.replaceState(window.history.state, '', url);
    setReading(next);
  }

  return (
    <Router>
      <AppContent />
      {hasReadingContent && (
        <button id="view-toggle" type="button" onClick={toggleReading}>
          {reading ? 'Desktop view' : 'Reading view'}
        </button>
      )}
    </Router>
  );
};

export default App;

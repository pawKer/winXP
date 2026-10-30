import React, {
  lazy,
  Suspense,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  BrowserRouter as Router,
  Redirect,
  useLocation,
} from 'react-router-dom';
import PublicPage from 'components/PublicPage';
import pageContent from 'content/pages';
import useGA, { trackEvent } from 'hooks/useGA';
import usePageHead from 'hooks/usePageHead';
import {
  SiteNavigationProvider,
  useSiteNavigation,
} from 'navigation/SiteNavigation';
import { pauseAll } from 'media/playback';
import windowsIcon from 'assets/windowsIcons/windows.png';

const { getPage } = pageContent;

const Desktop = lazy(() => import('WinXP'));

class DesktopBoundary extends React.Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onFailure();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function AppContent() {
  const location = useLocation();
  const initialPath = useRef(location.pathname);
  const page = getPage(location.pathname);
  const { mode, setMode, navigate } = useSiteNavigation();
  const [desktopMounted, setDesktopMounted] = useState(
    mode === 'desktop' && !!page,
  );
  const [desktopReady, setDesktopReady] = useState(false);
  const [desktopFailed, setDesktopFailed] = useState(false);
  const reading = mode === 'read' || !page || desktopFailed;
  const retryQuery = new URLSearchParams(location.search);
  retryQuery.set('view', 'desktop');
  const retryPath = `${location.pathname}?${retryQuery}${location.hash}`;
  usePageHead(page);
  useGA(
    process.env.REACT_APP_GA_MEASUREMENT_ID,
    page?.path || location.pathname,
  );

  useEffect(() => {
    pauseAll();
    if (!reading) setDesktopMounted(true);
  }, [reading]);

  useLayoutEffect(() => {
    document.documentElement.classList.toggle('desktop-mode', !reading);
    if (reading || desktopReady) {
      clearTimeout(window.__desktopStartupTimer);
      document.documentElement.classList.remove('desktop-starting');
      document.documentElement.classList.add('app-ready');
      document.getElementById('static-content')?.remove();
    }
  }, [reading, desktopReady]);

  function changeMode(next) {
    pauseAll();
    if (!page) {
      navigate('/?view=desktop', { mode: 'desktop' });
      return;
    }
    trackEvent('view_mode_change', { view_mode: next });
    setMode(next);
    requestAnimationFrame(() =>
      document
        .querySelector(
          next === 'read'
            ? '.standalone-surface #page-main'
            : '#desktop-reading-toggle',
        )
        ?.focus(),
    );
  }

  if (page && page.path !== location.pathname)
    return (
      <Redirect
        to={{
          pathname: page.path,
          search: location.search,
          hash: location.hash,
          state: location.state,
        }}
      />
    );

  return (
    <>
      <a
        className="skip-link"
        href="#page-main"
        onClick={() => {
          if (!reading) changeMode('read');
        }}
      >
        Skip to page content
      </a>
      {desktopMounted && !desktopFailed && (
        <div id="desktop-layer" hidden={reading}>
          <DesktopBoundary
            onFailure={() => {
              pauseAll();
              setDesktopFailed(true);
              setMode('read');
            }}
          >
            <Suspense fallback={<p role="status">Starting the desktop…</p>}>
              <Desktop
                defaultPath={location.pathname}
                initialPath={initialPath.current}
                active={!reading}
                onReady={() => setDesktopReady(true)}
                onReadingView={() => changeMode('read')}
              />
            </Suspense>
          </DesktopBoundary>
        </div>
      )}
      {reading && (
        <div className="standalone-surface">
          {desktopFailed && (
            <div className="mode-controls">
              <a className="xp-button" id="desktop-retry" href={retryPath}>
                <img className="desktop-view-icon" src={windowsIcon} alt="" />
                Try desktop again
              </a>
            </div>
          )}
          {desktopFailed && (
            <p className="desktop-recovery" role="alert" data-desktop-recovery>
              The desktop could not load. You can keep reading here, or try it
              again.
            </p>
          )}
          <PublicPage path={location.pathname} />
        </div>
      )}
    </>
  );
}

export default function App() {
  return (
    <Router>
      <SiteNavigationProvider>
        <AppContent />
      </SiteNavigationProvider>
    </Router>
  );
}

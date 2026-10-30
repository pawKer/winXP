import React, { createContext, useContext, useRef } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import pageContent from 'content/pages';

const Navigation = createContext(null);

export function SiteNavigationProvider({ children }) {
  const history = useHistory();
  const location = useLocation();
  const historyIndex = location.state?.siteHistoryIndex || 0;
  const maximumIndex = useRef(historyIndex);
  const explicitMode = new URLSearchParams(location.search).get('view');
  const mode =
    explicitMode === 'read'
      ? 'read'
      : explicitMode === 'desktop'
      ? 'desktop'
      : location.state?.presentation ||
        (location.pathname.startsWith('/blog') ? 'read' : 'desktop');

  function navigate(destination, options = {}) {
    const url = new URL(destination, window.location.origin);
    const page = pageContent.getPage(url.pathname);
    if (page) url.pathname = page.path;
    if (
      url.pathname === location.pathname &&
      url.search === location.search &&
      url.hash === location.hash &&
      (!options.mode || options.mode === mode)
    )
      return;
    maximumIndex.current = historyIndex + 1;
    history.push({
      pathname: url.pathname,
      search: url.search,
      hash: url.hash,
      state: {
        presentation: options.mode || mode,
        siteHistoryIndex: maximumIndex.current,
      },
    });
  }

  function setMode(next) {
    const query = new URLSearchParams(location.search);
    query.set('view', next);
    history.replace({
      ...location,
      search: `?${query}`,
      state: { ...location.state, presentation: next },
    });
  }

  return (
    <Navigation.Provider
      value={{
        mode,
        navigate,
        setMode,
        canGoBack: historyIndex > 0,
        canGoForward: historyIndex < maximumIndex.current,
        goBack: () => {
          if (historyIndex > 0) history.goBack();
        },
        goForward: () => {
          if (historyIndex < maximumIndex.current) history.goForward();
        },
      }}
    >
      {children}
    </Navigation.Provider>
  );
}

export const useSiteNavigation = () => useContext(Navigation);

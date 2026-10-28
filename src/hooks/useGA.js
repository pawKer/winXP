import { useEffect, useRef } from 'react';
import ReactGA from 'react-ga4';
import { siteUrl } from 'content/site';

const initialized = new Set();

export function shouldSendAnalytics(hostname, debug = false) {
  const canonical = new URL(siteUrl).hostname;
  return debug || hostname === canonical || hostname.endsWith(`.${canonical}`);
}

export const trackEvent = (eventName, parameters = {}) => {
  window.dispatchEvent(
    new CustomEvent('reshra:analytics', { detail: { eventName, parameters } }),
  );
  if (!initialized.size) return;
  try {
    ReactGA.event(eventName, parameters);
  } catch (_) {
    /* Best effort. */
  }
};

export default function useGA(measurementId, pathname) {
  const previous = useRef(null);
  useEffect(() => {
    const enabled = shouldSendAnalytics(
      window.location.hostname,
      process.env.REACT_APP_GA_DEBUG === 'true',
    );
    if (measurementId && enabled && !initialized.has(measurementId)) {
      ReactGA.initialize(measurementId, {
        gtagOptions: { send_page_view: false },
      });
      initialized.add(measurementId);
    }
    if (previous.current?.pathname === pathname) return;
    const url = new URL(window.location.href);
    url.searchParams.delete('view');
    const parameters = {
      page_location: url.href,
      page_title: document.title,
      page_referrer: previous.current?.url || document.referrer,
    };
    previous.current = { pathname, url: url.href };
    trackEvent('page_view', parameters);
  }, [measurementId, pathname]);
}

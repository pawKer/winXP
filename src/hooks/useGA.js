import { useEffect } from 'react';
import ReactGA from 'react-ga4';

function useGA(measurementId) {
  useEffect(() => {
    if (!measurementId) return;

    // GA4 sends the initial page_view during configuration and, when enabled,
    // Enhanced Measurement tracks subsequent browser-history changes.
    ReactGA.initialize(measurementId);
  }, [measurementId]);
}

// Use the GA4 event API so all supplied event parameters are sent.
export const trackEvent = (eventName, parameters = {}) => {
  ReactGA.event(eventName, parameters);
};

export default useGA;

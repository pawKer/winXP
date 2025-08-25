import { useEffect } from 'react';
import ReactGA from 'react-ga4';

function useGA(measurementId, route) {
  useEffect(() => {
    if (!measurementId) return;

    // Initialize GA4
    ReactGA.initialize(measurementId);

    // Send pageview
    ReactGA.send({
      hitType: 'pageview',
      page: route || window.location.pathname,
    });
  }, [measurementId, route]);
}

// Utility function to track custom events
export const trackEvent = (eventName, parameters = {}) => {
  ReactGA.event({
    category: 'User Interaction',
    action: eventName,
    ...parameters,
  });
};

export default useGA;

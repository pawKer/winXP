import React, { useEffect, useRef } from 'react';
import Webamp from 'webamp/butterchurn';
import { initialTracks } from './config';

function Winamp({ onClose, onMinimize }) {
  const ref = useRef(null);
  const webamp = useRef(null);
  useEffect(() => {
    const target = ref.current;
    if (!target) {
      return;
    }
    webamp.current = new Webamp({
      initialSkin: {
        url: '/winamp_skin/modern.wsz',
        name: 'Modern',
      },
      initialTracks,
      windowLayout: {
        main: {
          position: {},
          shadeMode: false,
          closed: false,
        },
        equalizer: {
          position: {},
          shadeMode: false,
          closed: false,
        },
        playlist: {
          position: {},
          shadeMode: false,
          // Number of additional sprites by which to expand the window.
          size: { extraHeight: 4 },
          closed: false,
        },
        milkdrop: {
          position: {},
          // Number of additional sprites by which to expand the window.
          size: { extraHeight: 5, extraWidth: 5 },
          closed: false,
        },
      },
    });
    webamp.current.renderWhenReady(target).then(() => {
      target.appendChild(document.querySelector('#webamp'));
    });
    return () => {
      webamp.current.dispose();
      webamp.current = null;
    };
  }, []);
  useEffect(() => {
    if (webamp.current) {
      webamp.current.onClose(onClose);
      webamp.current.onMinimize(onMinimize);
    }
  });
  return (
    <div
      style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0 }}
      ref={ref}
    />
  );
}

export default Winamp;

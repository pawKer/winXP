import React, { useEffect, useRef } from 'react';
import Webamp from 'webamp/butterchurn';
import { initialTracks } from './config';

function Winamp({ onClose, onMinimize }) {
  const ref = useRef(null);
  const webamp = useRef(null);
  const movedToContainer = useRef(false);

  function getWebampNode() {
    return document.getElementById('webamp');
  }

  function attachToContainer() {
    const container = ref.current;
    const node = getWebampNode();
    if (container && node && node.parentElement !== container) {
      const containerRect = container.getBoundingClientRect();
      const nodeRect = node.getBoundingClientRect();
      container.appendChild(node);
      // Adjust top/left so visual position remains the same, now relative to container
      const newLeft = nodeRect.left - containerRect.left;
      const newTop = nodeRect.top - containerRect.top;
      node.style.left = `${Math.round(newLeft)}px`;
      node.style.top = `${Math.round(newTop)}px`;
      movedToContainer.current = true;
    }
  }

  function detachToBody() {
    const node = getWebampNode();
    if (node && node.parentElement && node.parentElement !== document.body) {
      document.body.appendChild(node);
      movedToContainer.current = false;
    }
  }

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
      // windowLayout: {
      //   main: {
      //     position: {},
      //     shadeMode: false,
      //     closed: false,
      //   },
      //   equalizer: {
      //     position: {},
      //     shadeMode: false,
      //     closed: false,
      //   },
      //   playlist: {
      //     position: {},
      //     shadeMode: false,
      //     // Number of additional sprites by which to expand the window.
      //     size: { extraHeight: 4 },
      //     closed: false,
      //   },
      //   milkdrop: {
      //     position: {},
      //     // Number of additional sprites by which to expand the window.
      //     size: { extraHeight: 5, extraWidth: 5 },
      //     closed: false,
      //   },
      // },
    });
    webamp.current.renderWhenReady(target).then(() => {
      attachToContainer();
    });
    return () => {
      detachToBody();
      if (webamp.current) {
        webamp.current.dispose();
        webamp.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!webamp.current) return;
    webamp.current.onClose(() => {
      try {
        detachToBody();
      } catch (e) {}
      onClose();
    });
    webamp.current.onMinimize(() => {
      onMinimize();
    });
  }, [onClose, onMinimize]);

  return (
    <div
      style={{ width: '100%', height: '100%', position: 'relative' }}
      ref={ref}
    />
  );
}

export default Winamp;

import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { notes } from 'content/site';
import pageContent from 'content/pages';
import { useSiteNavigation } from 'navigation/SiteNavigation';
import { trackEvent } from 'hooks/useGA';

const { renderNote } = pageContent;

export default function HeaderRenderer({ config }) {
  const { navigate } = useSiteNavigation();
  const location = useLocation();
  const documentRef = useRef(null);
  const note = notes.find(item => item.sections === config);
  const isCurrent = note?.path === location.pathname;
  useEffect(() => {
    if (isCurrent) documentRef.current?.focus({ preventScroll: true });
  }, [isCurrent]);
  if (!note) return null;
  function onClick(event) {
    const link = event.target.closest('a');
    if (!link) return;
    if (link.hasAttribute('data-note-link')) {
      trackEvent('notes_link_click', {
        destination: link.href,
        label: link.dataset.noteLabel,
        type: link.dataset.noteType,
        action: link.dataset.noteAction || undefined,
        view_mode: 'desktop',
      });
    }
    if (link.target === '_blank') return;
    if (
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    navigate(link.getAttribute('href'));
  }
  return (
    <div
      ref={documentRef}
      role={isCurrent ? 'main' : undefined}
      tabIndex={isCurrent ? -1 : undefined}
      aria-label={note.title}
      className="public-page notepad-document"
      onClick={onClick}
      dangerouslySetInnerHTML={{ __html: renderNote(note, { embedded: true }) }}
    />
  );
}

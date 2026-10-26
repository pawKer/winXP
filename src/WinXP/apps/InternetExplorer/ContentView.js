import React from 'react';
import { Link } from 'react-router-dom';
import { notes, releases } from 'content/site';
import { trackEvent } from 'hooks';

const trackListen = release => {
  try {
    trackEvent('music_listen_click', {
      release: release.slug,
      destination: release.listeningUrl,
    });
  } catch (error) {
    // Analytics must not block a listening link.
  }
};

export default function ContentView({ path, onPlayTrack }) {
  if (path === '/music') {
    return (
      <article className="ie-page">
        <h1>Music by reshra</h1>
        <p>Published releases and listening links.</p>
        <ul>
          {releases.map(release => (
            <li key={release.slug}>
              <Link to={release.path}>{release.title}</Link> —{' '}
              <a
                href={release.listeningUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackListen(release)}
              >
                Listen on music services
              </a>
            </li>
          ))}
        </ul>
      </article>
    );
  }

  const release = releases.find(item => item.path === path);
  if (release) {
    return (
      <article className="ie-page">
        <h1>{release.title}</h1>
        <p>Music by reshra. {release.description}</p>
        {release.artwork && (
          <img
            src={release.artwork}
            alt={`${release.title} cover artwork`}
            width="180"
          />
        )}
        {release.releaseDate && <p>Released {release.releaseDate}</p>}
        {release.credits.length > 0 && (
          <p>Credits: {release.credits.join(', ')}</p>
        )}
        <p>
          <a
            href={release.listeningUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackListen(release)}
          >
            Listen on music services
          </a>
        </p>
        <button type="button" onClick={() => onPlayTrack(release.trackUrl)}>
          Play in Winamp
        </button>
        {release.guitarHeroUrl && (
          <p>
            <a
              href={release.guitarHeroUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Guitar Hero files for anii 2000
            </a>
          </p>
        )}
        <Link to="/music">All music</Link>
      </article>
    );
  }

  if (path === '/notes') {
    return (
      <article className="ie-page">
        <h1>Notes from reshra</h1>
        <p>Music and guitar project resources shared from reshra’s desktop.</p>
        <ul>
          {notes.map(note => (
            <li key={note.id}>
              <Link to={note.path}>{note.title}</Link> — {note.description}
            </li>
          ))}
        </ul>
      </article>
    );
  }

  return null;
}

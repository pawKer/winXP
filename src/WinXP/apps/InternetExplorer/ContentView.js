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
      <article className="ie-page ie-page--music">
        <header className="music-hero">
          <span className="music-eyebrow">reshra audio archive</span>
          <h1>Music by reshra</h1>
          <p>Listen now, or open a release to play it in Winamp.</p>
        </header>
        <ul className="music-releases">
          {releases.map(release => (
            <li className="music-release" key={release.slug}>
              <span className="music-disc" aria-hidden="true" />
              <div>
                <h2>{release.title}</h2>
                <p>{release.description}</p>
                <div className="music-actions">
                  <a
                    className="music-primary"
                    href={release.listeningUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackListen(release)}
                  >
                    Listen now
                  </a>
                  <Link to={release.path}>Release details</Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </article>
    );
  }

  const release = releases.find(item => item.path === path);
  if (release) {
    return (
      <article className="ie-page ie-page--music">
        <header className="music-hero">
          <Link to="/music">Music</Link>
          <span className="music-eyebrow">reshra release</span>
          <h1>{release.title}</h1>
          <p>{release.description}</p>
        </header>
        {release.artwork && (
          <img
            className="music-artwork"
            src={release.artwork}
            alt={`${release.title} cover artwork`}
          />
        )}
        <div className="music-actions music-actions--release">
          <a
            className="music-primary"
            href={release.listeningUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackListen(release)}
          >
            Listen now
          </a>
          <button type="button" onClick={() => onPlayTrack(release.trackUrl)}>
            Play in Winamp
          </button>
        </div>
        {(release.releaseDate || release.credits.length > 0) && (
          <section className="music-details">
            <h2>Release information</h2>
            {release.releaseDate && <p>Released {release.releaseDate}</p>}
            {release.credits.length > 0 && (
              <p>Credits: {release.credits.join(', ')}</p>
            )}
          </section>
        )}
        {release.guitarHeroUrl && (
          <p className="music-resource">
            <a
              href={release.guitarHeroUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Guitar Hero files for anii 2000
            </a>
          </p>
        )}
        <section className="music-related">
          <h2>More from reshra</h2>
          <ul>
            {releases
              .filter(item => item.slug !== release.slug)
              .map(item => (
                <li key={item.slug}>
                  <Link to={item.path}>{item.title}</Link>
                  <a
                    href={item.listeningUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackListen(item)}
                  >
                    Listen now
                  </a>
                </li>
              ))}
          </ul>
        </section>
        <p className="music-back">
          <Link to="/music">All music</Link>
        </p>
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

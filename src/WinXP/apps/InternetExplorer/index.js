import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { WindowDropDowns, RetroLinktree } from 'components';
import PublicPage from 'components/PublicPage';
import { useSiteNavigation } from 'navigation/SiteNavigation';
import pageContent from 'content/pages';
import { profile, releases, notes } from 'content/site';
import { FaBookOpen, FaMusic, FaEnvelope, FaFolderOpen } from 'react-icons/fa';
import dropDownData from './dropDownData';
import NewsletterView from './NewsletterView';
import Div from './styles';
import './xpScrollbar.css';
import back from 'assets/windowsIcons/back.png';
import forward from 'assets/windowsIcons/forward.png';
import home from 'assets/windowsIcons/home.png';
import refresh from 'assets/windowsIcons/refresh.png';
import ie from 'assets/windowsIcons/ie-paper.png';
import earth from 'assets/windowsIcons/earth.png';
import windows from 'assets/windowsIcons/windows.png';
import stop from 'assets/windowsIcons/stop.png';
import search from 'assets/windowsIcons/299(32x32).png';
import favorite from 'assets/windowsIcons/744(32x32).png';
import history from 'assets/windowsIcons/history.png';
import mail from 'assets/windowsIcons/mail.png';
import printer from 'assets/windowsIcons/17(32x32).png';
import edit from 'assets/windowsIcons/edit.png';
import msn from 'assets/windowsIcons/msn.png';
import go from 'assets/windowsIcons/290.png';
import links from 'assets/windowsIcons/links.png';
import dropdown from 'assets/windowsIcons/dropdown.png';

const { getPage } = pageContent;

export default function InternetExplorer({
  onClose,
  onOpenNote,
  onFocusWinamp,
  onPlayTrack,
  isVisible = true,
}) {
  const location = useLocation();
  const {
    navigate,
    goBack,
    goForward,
    canGoBack,
    canGoForward,
  } = useSiteNavigation();
  const [newsletter, setNewsletter] = useState(false);
  const currentAddress = new URL(
    `${location.pathname}${location.search}${location.hash}`,
    window.location.origin,
  ).href;
  const [address, setAddress] = useState(currentAddress);
  useEffect(() => {
    setNewsletter(false);
    setAddress(currentAddress);
  }, [currentAddress]);
  const page = getPage(location.pathname);
  const showContent = page && !['home', 'note'].includes(page.kind);

  function goHome() {
    setNewsletter(false);
    navigate('/');
  }
  function menuAction(item) {
    if (item === 'Close') onClose();
    else if (item === 'Home Page') goHome();
    else if (item === 'Back') goBack();
    else if (item === 'Forward') goForward();
  }
  function submitAddress(event) {
    event.preventDefault();
    try {
      const url = new URL(address, window.location.origin);
      if (
        (url.origin === window.location.origin ||
          url.hostname === 'reshra.xyz') &&
        getPage(url.pathname)
      )
        navigate(`${url.pathname}${url.search}${url.hash}`);
      else setAddress(currentAddress);
    } catch (_) {
      setAddress(currentAddress);
    }
  }

  return (
    <Div>
      <section className="ie__toolbar">
        <div className="ie__options">
          <WindowDropDowns
            items={dropDownData}
            onClickItem={menuAction}
            height={21}
          />
        </div>
        <img className="ie__windows-logo" src={windows} alt="" />
      </section>
      <nav className="ie__function_bar" aria-label="Browser controls">
        <button
          className="ie__function_bar__button"
          type="button"
          disabled={!canGoBack}
          onClick={goBack}
          aria-label="Back"
        >
          <img src={back} className="ie__function_bar__icon" alt="" />
          <span>Back</span>
          <span className="ie__function_bar__arrow" aria-hidden="true" />
        </button>
        <button
          className="ie__function_bar__button"
          type="button"
          disabled={!canGoForward}
          onClick={goForward}
          aria-label="Forward"
        >
          <img src={forward} className="ie__function_bar__icon" alt="" />
          <span className="ie__function_bar__arrow" aria-hidden="true" />
        </button>
        <button
          className="ie__function_bar__button"
          type="button"
          disabled
          aria-label="Stop loading"
        >
          <img src={stop} className="ie__function_bar__icon--margin-1" alt="" />
        </button>
        <button
          className="ie__function_bar__button"
          type="button"
          onClick={() => {
            setNewsletter(false);
            document.querySelector('.ie__content')?.scrollTo(0, 0);
          }}
          aria-label="Return to top"
        >
          <img src={refresh} className="ie__function_bar__icon" alt="" />
        </button>
        <button
          className="ie__function_bar__button"
          type="button"
          onClick={goHome}
          aria-label="Home"
        >
          <img src={home} className="ie__function_bar__icon" alt="" />
        </button>
        <span className="ie__function_bar__separate" />
        {/* Preserve the original chrome; unsupported tools are decorative. */}
        <span className="ie__function_bar__decoration" aria-hidden="true">
          <img
            src={search}
            className="ie__function_bar__icon--normalize"
            alt=""
          />
          <span className="ie__function_bar__text">Search</span>
        </span>
        <span className="ie__function_bar__decoration" aria-hidden="true">
          <img
            src={favorite}
            className="ie__function_bar__icon--normalize"
            alt=""
          />
          <span className="ie__function_bar__text">Favorites</span>
        </span>
        <span className="ie__function_bar__decoration" aria-hidden="true">
          <img src={history} className="ie__function_bar__icon" alt="" />
        </span>
        <span className="ie__function_bar__separate" />
        <span className="ie__function_bar__decoration" aria-hidden="true">
          <img src={mail} className="ie__function_bar__icon--margin-1" alt="" />
          <span className="ie__function_bar__arrow--margin-11" />
        </span>
        {[printer, edit, msn].map((icon, index) => (
          <span
            className="ie__function_bar__decoration"
            aria-hidden="true"
            key={icon}
          >
            <img
              src={icon}
              className={
                index === 1
                  ? 'ie__function_bar__icon'
                  : 'ie__function_bar__icon--margin12'
              }
              alt=""
            />
          </span>
        ))}
      </nav>
      <form className="ie__address_bar" onSubmit={submitAddress}>
        <label className="ie__address_bar__title" htmlFor="ie-address">
          Address
        </label>
        <div className="ie__address_bar__content">
          <img src={ie} alt="" className="ie__address_bar__content__img" />
          <input
            id="ie-address"
            aria-label="Page address"
            value={address}
            onChange={event => setAddress(event.target.value)}
          />
          <img
            src={dropdown}
            alt=""
            className="ie__address_bar__content__img"
          />
        </div>
        <button className="ie__address_bar__go" type="submit">
          <img src={go} alt="" className="ie__address_bar__go__img" />
          <span>Go</span>
        </button>
        <span className="ie__address_bar__separate" />
        <span className="ie__address_bar__links" aria-hidden="true">
          <span className="ie__address_bar__links__text">Links</span>
          <img src={links} alt="" className="ie__address_bar__links__img" />
        </span>
      </form>
      <div className="ie__content">
        <div className="ie__content__inner">
          {newsletter ? (
            <NewsletterView onBack={goHome} />
          ) : showContent ? (
            <PublicPage
              path={location.pathname}
              embedded
              active={isVisible}
              onPlayTrack={onPlayTrack}
            />
          ) : (
            <div role={page?.kind === 'home' ? 'main' : undefined}>
              <RetroLinktree
                profile={profile}
                links={[
                  ...releases.slice(0, 2).map((release, index) => ({
                    title: `reshra - ${release.title}`,
                    subtitle: release.listeningLabel,
                    url: release.listeningUrl,
                    analyticsEvent: 'music_listen_click',
                    releaseSlug: release.slug,
                    highlight: index === 0,
                  })),
                  {
                    title: 'My blog',
                    subtitle: 'Songs, guitar builds & experiments',
                    url: '/blog',
                    onClick: () => navigate('/blog'),
                    iconNode: <FaBookOpen />,
                  },
                  {
                    title: 'Music archive',
                    subtitle: 'All recordings, videos & credits',
                    url: '/music',
                    onClick: () => navigate('/music'),
                    iconNode: <FaMusic />,
                  },
                  {
                    title: 'Winamp',
                    subtitle: 'Play my music',
                    onClick: onFocusWinamp,
                    iconNode: <FaMusic />,
                  },
                  {
                    title: 'anii 2000 (Guitar Hero Files)',
                    subtitle: 'Google Drive folder',
                    url: releases.find(item => item.slug === 'anii-2000')
                      .guitarHeroUrl,
                    iconNode: <FaFolderOpen />,
                  },
                  {
                    title: 'Subscribe to my newsletter',
                    subtitle: 'Get updates in your inbox',
                    onClick: () => setNewsletter(true),
                    iconNode: <FaEnvelope />,
                  },
                  {
                    title: 'Notes & resources',
                    subtitle: 'Parts lists, files & tutorials',
                    url: '/notes',
                    onClick: () => navigate('/notes'),
                    iconNode: <FaFolderOpen />,
                  },
                  ...notes
                    .filter(note => note.id !== 'thankYou')
                    .map(note => ({
                      title: note.title,
                      subtitle: 'Open in Notepad',
                      url: note.path,
                      onClick: () => onOpenNote(note.id),
                      iconNode: <FaBookOpen />,
                    })),
                ]}
                footer="Made with Notepad"
              />
            </div>
          )}
        </div>
      </div>
      <footer className="ie__footer">
        <div className="ie__footer__status">
          <img className="ie__footer__status__img" src={ie} alt="" />
          <span className="ie__footer__status__text">Done</span>
        </div>
        <div className="ie__footer__right">
          <img className="ie__footer__right__img" src={earth} alt="" />
          <span className="ie__footer__right__text">Internet</span>
        </div>
      </footer>
    </Div>
  );
}

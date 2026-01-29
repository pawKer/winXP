import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  FaHome,
  FaBookOpen,
  FaImages,
  FaPenNib,
  FaInstagram,
  FaTiktok,
  FaYoutube,
  FaSpotify,
} from 'react-icons/fa';
import { trackEvent } from 'hooks';

import spinningGlobe from 'assets/spinning-globe.gif';

const DEFAULT_PROFILE = {
  name: 'Your Name',
  bio:
    'Welcome to my homepage! This is where I share links, projects, and other cool stuff.',
  handle: '@yourhandle',
  avatarSrc: '',
  socialLinks: {},
};

const SOCIAL_CONFIG = [
  {
    key: 'instagram',
    Icon: FaInstagram,
    baseUrl: 'https://instagram.com/',
    normalize: v => (v && !/^https?:\/\//i.test(v) ? v.replace(/^@/, '') : v),
  },
  {
    key: 'tiktok',
    Icon: FaTiktok,
    baseUrl: 'https://tiktok.com/@',
    normalize: v => (v && !/^https?:\/\//i.test(v) ? v.replace(/^@/, '') : v),
  },
  {
    key: 'youtube',
    Icon: FaYoutube,
    baseUrl: 'https://youtube.com/',
    normalize: v => (v && !/^https?:\/\//i.test(v) ? v.replace(/^@/, '') : v),
  },
  {
    key: 'spotify',
    Icon: FaSpotify,
    baseUrl: 'https://open.spotify.com/artist/',
    normalize: v => (v && !/^https?:\/\//i.test(v) ? v : v),
  },
];

const DEFAULT_LINKS = [
  {
    title: 'My Homepage',
    url: 'https://example.com',
  },
  {
    title: 'Guestbook',
    url: 'https://example.com/guestbook',
  },
  {
    title: 'Photo Gallery',
    url: 'https://example.com/photos',
  },
  {
    title: 'Sign My Guestbook',
    url: 'https://example.com/sign',
  },
];

function normalizeUrl(url) {
  if (!url) return '';
  if (/^(mailto:|tel:|https?:\/\/|\/)/i.test(url)) return url;
  return `https://${url}`;
}

function getInitials(name) {
  if (!name) return '?';
  const parts = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const first = parts[0]?.[0] || '?';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return `${first}${last}`.toUpperCase();
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function isExternalHref(href) {
  return /^https?:\/\//i.test(href);
}

function RetroLinktree({
  profile = DEFAULT_PROFILE,
  links = DEFAULT_LINKS,
  footer = 'Best viewed in 800x600 with Internet Explorer',
  className,
}) {
  const mergedProfile = { ...DEFAULT_PROFILE, ...(profile || {}) };
  const linkItems = safeArray(links).filter(
    l => l && l.title && (l.url || typeof l.onClick === 'function'),
  );
  const [counter, setCounter] = useState(123);

  useEffect(() => {
    let timeoutId;
    let cancelled = false;

    function scheduleNext() {
      if (cancelled) return;
      const delay = 1000 + Math.random() * 9000; // 1-10 seconds
      timeoutId = setTimeout(() => {
        setCounter(prev => prev + 1);
        scheduleNext();
      }, delay);
    }

    scheduleNext();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const formattedCounter = String(counter).padStart(6, '0');

  return (
    <Shell className={className}>
      <Page>
        <PageHeader>
          <TitleBar>
            <TitleGlow>
              <TitleGlobe src={spinningGlobe} alt="" aria-hidden="true" />
              {mergedProfile.name}'s world
            </TitleGlow>
          </TitleBar>
          <HeaderInner>
            <AvatarWrap aria-hidden="true">
              {mergedProfile.avatarSrc ? (
                <AvatarImg src={mergedProfile.avatarSrc} alt="" />
              ) : (
                <AvatarFallback>
                  {getInitials(mergedProfile.name)}
                </AvatarFallback>
              )}
            </AvatarWrap>

            <TitleBlock>
              <Name>{mergedProfile.name}</Name>
              {mergedProfile.handle ? (
                <Handle>@{mergedProfile.handle}</Handle>
              ) : null}
              {mergedProfile.bio ? <Bio>{mergedProfile.bio}</Bio> : null}
              {mergedProfile.socialLinks &&
              Object.keys(mergedProfile.socialLinks).length > 0 ? (
                <SocialLinksRow>
                  {SOCIAL_CONFIG.map(({ key, Icon, baseUrl, normalize }) => {
                    const value = mergedProfile.socialLinks[key];
                    if (!value) return null;
                    const href = /^https?:\/\//i.test(value)
                      ? value
                      : `${baseUrl}${normalize(value)}`;
                    return (
                      <SocialLink
                        key={key}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={key}
                      >
                        <Icon />
                      </SocialLink>
                    );
                  })}
                </SocialLinksRow>
              ) : null}
            </TitleBlock>
          </HeaderInner>
        </PageHeader>

        <Main>
          <MarqueeLike>
            <span>Welcome to my corner of the web!</span>
          </MarqueeLike>

          <Links aria-label="Links">
            {linkItems.map((item, idx) => {
              const hasUrl = !!item.url;
              const href = hasUrl ? normalizeUrl(item.url) : undefined;
              const external = href ? isExternalHref(href) : false;
              const isActionOnly = !href && typeof item.onClick === 'function';
              const asElement = isActionOnly ? 'button' : 'a';
              const defaultIcons = [FaHome, FaBookOpen, FaImages, FaPenNib];
              const FallbackIcon = defaultIcons[idx % defaultIcons.length];

              function handleClick(e) {
                // Track GA event for all link interactions
                try {
                  trackEvent('retro_link_click', {
                    label: item.title,
                    destination: href || null,
                    index: idx,
                    type: isActionOnly
                      ? 'action'
                      : external
                      ? 'external'
                      : 'internal',
                  });
                } catch (err) {
                  // Best-effort tracking; don't break navigation
                }

                if (typeof item.onClick === 'function') {
                  // For action links, prevent navigation and run callback
                  e.preventDefault();
                  item.onClick();
                }
              }

              let iconContent;
              if (item.iconNode) {
                iconContent = item.iconNode;
              } else if (item.icon) {
                iconContent = <LinkIconImg src={item.icon} alt="" />;
              } else {
                iconContent = <FallbackIcon />;
              }

              return (
                <LinkRow key={`${item.title}-${idx}`}>
                  <LinkButton
                    as={asElement}
                    href={href}
                    target={external ? '_blank' : undefined}
                    rel={external ? 'noreferrer noopener' : undefined}
                    type={asElement === 'button' ? 'button' : undefined}
                    onClick={handleClick}
                  >
                    {item.highlight && <StarGif aria-hidden="true">★</StarGif>}
                    {item.iconNode && (
                      <LinkIcon aria-hidden="true">{iconContent}</LinkIcon>
                    )}
                    <LinkText>
                      <LinkTitle>{item.title}</LinkTitle>
                      {item.subtitle ? (
                        <LinkSubtitle>{item.subtitle}</LinkSubtitle>
                      ) : null}
                    </LinkText>
                    {item.highlight && <StarGif aria-hidden="true">★</StarGif>}
                  </LinkButton>
                </LinkRow>
              );
            })}
          </Links>
        </Main>

        {footer ? (
          <Footer>
            <FooterText>{footer}</FooterText>
            <FooterMeta>
              <CounterLabel>Visitors today: </CounterLabel>
              <CounterDigits>{formattedCounter}</CounterDigits>
            </FooterMeta>
          </Footer>
        ) : null}
      </Page>
    </Shell>
  );
}

const Shell = styled.div`
  min-height: 100%;
  width: 100%;
  display: grid;
  place-items: center;
  padding: 24px 12px;
  background-color: #a9c8ff;
  background-image: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.4) 0%,
    transparent 40%,
    transparent 60%,
    rgba(255, 255, 255, 0.4) 100%
  );
  background-attachment: fixed;
`;

const Page = styled.div`
  width: 100%;
  max-width: 520px;
  background-color: #f7fbff;
  border-radius: 12px;
  border: 2px solid #9db7e0;
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.45);
  padding: 10px;
  color: #10213a;
  font-family: 'Tahoma', 'Verdana', 'Arial', sans-serif;
  box-sizing: border-box;
`;

const PageHeader = styled.header`
  background: linear-gradient(180deg, #4f7ac9 0%, #3059a3 55%, #22427e 100%);
  border-radius: 9px;
  border: 1px solid #22427e;
  padding: 6px;
  margin-bottom: 10px;
  color: #fff;
`;

const TitleBar = styled.div`
  text-align: center;
  margin-bottom: 4px;
`;

const TitleGlow = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 2px 12px;
  font-weight: 700;
  font-size: 18px;
  letter-spacing: 0.5px;
  color: #ffffff;
  text-shadow: 1px 1px 0 #00316e;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  background: linear-gradient(90deg, #7fb4ff, #b3d5ff, #7fb4ff);
`;

const TitleGlobe = styled.img`
  width: 18px;
  height: 18px;
  margin-right: 6px;
  vertical-align: middle;
`;

const HeaderInner = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 4px 4px;
  background-color: rgba(0, 0, 40, 0.1);

  @media (max-width: 560px) {
    flex-direction: column;
    text-align: center;
  }
`;

const AvatarWrap = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 6px;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.85);
  background-color: #d4e5ff;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const AvatarImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const AvatarFallback = styled.div`
  font-weight: 800;
  letter-spacing: 0.5px;
  color: #245493;
  text-shadow: 1px 1px 0 rgba(255, 255, 255, 0.8);
`;

const TitleBlock = styled.div`
  min-width: 0;
`;

const Name = styled.h1`
  margin: 0;
  font-size: 18px;
  color: #ffffff;
  text-shadow: 1px 1px 0 #00316e;
`;

const Handle = styled.div`
  margin-top: 2px;
  font-size: 12px;
  color: #d9e7ff;
`;

const Bio = styled.p`
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.4;
  color: #e0e0ff;
`;

const SocialLinksRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
`;

const SocialLink = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.15);
  color: #d9e7ff;
  border: 1px solid rgba(255, 255, 255, 0.3);
  text-decoration: none;
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
    color: #fff;
  }

  &:focus-visible {
    outline: 2px dotted #ffff00;
    outline-offset: 2px;
  }

  svg {
    font-size: 14px;
  }
`;

const Main = styled.main`
  background: linear-gradient(180deg, #f7fbff 0%, #edf4ff 40%, #e3ecff 100%);
  border-radius: 10px;
  border: 1px solid #d0def5;
  padding: 10px 10px 8px;
  box-sizing: border-box;
`;

const MarqueeLike = styled.div`
  border-radius: 6px;
  border: 1px solid #c0d5f7;
  padding: 4px 8px;
  margin-bottom: 8px;
  background: linear-gradient(90deg, #e5f0ff, #f5f9ff);
  color: #204170;
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Links = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
`;

const LinkRow = styled.li`
  margin-top: 4px;
  & + & {
    margin-top: 12px;
  }
`;

const LinkButton = styled.a`
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;

  border-radius: 999px;
  border-width: 1px;
  border-style: solid;
  border-color: #a4bff0;
  background: linear-gradient(180deg, #ffffff 0%, #edf3ff 40%, #d7e5ff 100%);
  color: #17396d;
  padding: 9px 18px;
  font-size: 12px;
  box-shadow: 0 2px 0 rgba(16, 33, 58, 0.4);
  cursor: pointer;

  &:hover {
    background: linear-gradient(180deg, #ffffff 0%, #e3ecff 40%, #ccdcff 100%);
  }

  &:active {
    box-shadow: 0 1px 0 rgba(16, 33, 58, 0.5) inset;
    transform: translateY(1px);
  }

  &:focus-visible {
    outline: 2px dotted #ffff00;
    outline-offset: 2px;
  }
`;

const LinkText = styled.div`
  min-width: 0;
`;

const LinkTitle = styled.div`
  font-weight: 700;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.8);
`;

const LinkSubtitle = styled.div`
  margin-top: 2px;
  font-size: 11px;
  color: #001144;
`;

const Footer = styled.footer`
  margin-top: 8px;
  padding-top: 4px;
  border-top: 1px solid #d0def5;
  font-size: 10px;
  text-align: center;
  color: #5c75a5;
`;

const FooterText = styled.div`
  margin-bottom: 3px;
`;

const FooterMeta = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

const CounterLabel = styled.span`
  font-size: 10px;
`;

const CounterDigits = styled.span`
  display: inline-block;
  padding: 2px 4px;
  background-color: #000000;
  color: #00ff00;
  font-family: 'Courier New', monospace;
  font-size: 10px;
  letter-spacing: 1px;
  border-radius: 2px;
  box-shadow: inset 0 0 2px rgba(0, 0, 0, 0.8);
`;

const LinkIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  margin-right: 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.85);
  box-shadow: inset 0 0 0 1px rgba(64, 42, 122, 0.22);
  font-size: 11px;
`;

const LinkIconImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const StarGif = styled.span`
  display: inline-block;
  margin: 0 4px;
  font-size: 14px;
  color: #ffd700;
  text-shadow: 0 0 4px rgba(255, 215, 0, 0.8);
  animation: sparkle 1.5s ease-in-out infinite;

  @keyframes sparkle {
    0%,
    100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.6;
      transform: scale(1.2);
    }
  }

  &:nth-child(2) {
    animation-delay: 0.3s;
  }
`;

export default RetroLinktree;

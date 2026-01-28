import React from 'react';
import styled from 'styled-components';

const DEFAULT_PROFILE = {
  name: 'Your Name',
  bio:
    'A short bio goes here. Add what you do, what you share, and why people should click.',
  handle: '@yourhandle',
  avatarSrc: '',
};

const DEFAULT_LINKS = [
  { title: 'Website', url: 'https://example.com' },
  { title: 'YouTube', url: 'https://youtube.com' },
  { title: 'GitHub', url: 'https://github.com' },
  { title: 'Newsletter', url: 'https://example.com/newsletter' },
];

function normalizeUrl(url) {
  if (!url) return '';
  // Allow mailto:, tel:, http(s):// and relative paths.
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

function Linktree({
  profile = DEFAULT_PROFILE,
  links = DEFAULT_LINKS,
  footer = '© ' + new Date().getFullYear(),
  className,
}) {
  const mergedProfile = { ...DEFAULT_PROFILE, ...(profile || {}) };
  const linkItems = safeArray(links).filter(
    l => l && l.title && (l.url || typeof l.onClick === 'function'),
  );

  return (
    <Shell className={className}>
      <Card>
        <Header>
          <AvatarWrap aria-hidden="true">
            {mergedProfile.avatarSrc ? (
              <AvatarImg src={mergedProfile.avatarSrc} alt="" />
            ) : (
              <AvatarFallback>{getInitials(mergedProfile.name)}</AvatarFallback>
            )}
          </AvatarWrap>

          <TitleBlock>
            <Name>{mergedProfile.name}</Name>
            {mergedProfile.handle ? (
              <Handle>{mergedProfile.handle}</Handle>
            ) : null}
            {mergedProfile.bio ? <Bio>{mergedProfile.bio}</Bio> : null}
          </TitleBlock>
        </Header>

        <Links aria-label="Links">
          {linkItems.map((item, idx) => {
            const hasUrl = !!item.url;
            const href = hasUrl ? normalizeUrl(item.url) : undefined;
            const external = href ? isExternalHref(href) : false;
            const isActionOnly = !href && typeof item.onClick === 'function';
            const asElement = isActionOnly ? 'button' : 'a';

            function handleClick(e) {
              if (typeof item.onClick === 'function') {
                e.preventDefault();
                item.onClick();
              }
            }
            return (
              <LinkRow key={`${item.title}-${idx}`}>
                <LinkButton
                  as={asElement}
                  href={href}
                  target={external ? '_blank' : undefined}
                  rel={external ? 'noreferrer noopener' : undefined}
                  type={asElement === 'button' ? 'button' : undefined}
                  onClick={item.onClick ? handleClick : undefined}
                >
                  <LinkText>
                    <LinkTitle>{item.title}</LinkTitle>
                    {item.subtitle ? (
                      <LinkSubtitle>{item.subtitle}</LinkSubtitle>
                    ) : null}
                  </LinkText>
                  <Chevron aria-hidden="true">›</Chevron>
                </LinkButton>
              </LinkRow>
            );
          })}
        </Links>

        {footer ? <Footer>{footer}</Footer> : null}
      </Card>
    </Shell>
  );
}

const Shell = styled.div`
  min-height: 100%;
  width: 100%;
  display: grid;
  place-items: center;
  padding: calc(32px + env(safe-area-inset-top))
    calc(16px + env(safe-area-inset-right))
    calc(32px + env(safe-area-inset-bottom))
    calc(16px + env(safe-area-inset-left));
  background: radial-gradient(
      1200px 600px at 20% 0%,
      rgba(255, 255, 255, 0.22) 0%,
      rgba(255, 255, 255, 0) 55%
    ),
    radial-gradient(
      900px 500px at 80% 10%,
      rgba(0, 153, 255, 0.22) 0%,
      rgba(0, 153, 255, 0) 55%
    ),
    linear-gradient(180deg, #0b1220 0%, #090e1a 60%, #070a12 100%);

  @media (max-width: 420px) {
    padding: calc(22px + env(safe-area-inset-top))
      calc(12px + env(safe-area-inset-right))
      calc(22px + env(safe-area-inset-bottom))
      calc(12px + env(safe-area-inset-left));
  }
`;

const Card = styled.div`
  width: 100%;
  max-width: 520px;
  border-radius: 18px;
  padding: 22px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 18px 60px rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(10px);

  @media (max-width: 420px) {
    border-radius: 16px;
    padding: 16px;
  }
`;

const Header = styled.header`
  display: grid;
  grid-template-columns: 64px 1fr;
  gap: 14px;
  align-items: center;
  margin-bottom: 16px;

  @media (max-width: 360px) {
    grid-template-columns: 1fr;
    justify-items: center;
    text-align: center;
  }
`;

const AvatarWrap = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 999px;
  overflow: hidden;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.25);

  @media (max-width: 420px) {
    width: 56px;
    height: 56px;
  }
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
  color: rgba(255, 255, 255, 0.92);
`;

const TitleBlock = styled.div`
  min-width: 0;
`;

const Name = styled.h1`
  margin: 0;
  font-size: clamp(16px, 4.6vw, 18px);
  line-height: 1.2;
  color: rgba(255, 255, 255, 0.96);
`;

const Handle = styled.div`
  margin-top: 4px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.68);
`;

const Bio = styled.p`
  margin: 10px 0 0;
  font-size: 13px;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.78);

  @media (max-width: 420px) {
    margin-top: 8px;
    font-size: 12.5px;
    line-height: 1.4;
  }
`;

const Links = styled.ul`
  list-style: none;
  padding: 0;
  margin: 18px 0 0;

  @media (max-width: 420px) {
    margin-top: 14px;
  }
`;

const LinkRow = styled.li`
  & + & {
    margin-top: 10px;
  }

  @media (max-width: 420px) {
    & + & {
      margin-top: 9px;
    }
  }
`;

const LinkButton = styled.a`
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  width: 100%;
  border-radius: 14px;
  padding: 14px 14px;
  min-height: 48px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.92);
  -webkit-tap-highlight-color: transparent;

  transition: transform 120ms ease, background 120ms ease,
    border-color 120ms ease;

  &:hover {
    transform: translateY(-1px);
    background: rgba(255, 255, 255, 0.09);
    border-color: rgba(255, 255, 255, 0.22);
  }

  &:active {
    transform: translateY(0px);
    background: rgba(255, 255, 255, 0.075);
  }

  &:focus-visible {
    outline: 2px solid rgba(0, 153, 255, 0.8);
    outline-offset: 2px;
  }

  @media (max-width: 420px) {
    padding: 13px 12px;
    border-radius: 13px;
  }
`;

const LinkText = styled.div`
  min-width: 0;
`;

const LinkTitle = styled.div`
  font-weight: 700;
  font-size: 14px;
  line-height: 1.2;
  color: rgba(255, 255, 255, 0.96);
`;

const LinkSubtitle = styled.div`
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.2;
  color: rgba(255, 255, 255, 0.66);
`;

const Chevron = styled.span`
  flex: 0 0 auto;
  font-size: 18px;
  line-height: 1;
  color: rgba(255, 255, 255, 0.6);
`;

const Footer = styled.footer`
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 12px;
  color: rgba(255, 255, 255, 0.55);
  text-align: center;

  @media (max-width: 420px) {
    margin-top: 16px;
    padding-top: 12px;
  }
`;

export default Linktree;

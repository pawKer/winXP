import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';

import FooterMenu from './FooterMenu';
import Balloon from 'components/Balloon';
import startButton from 'assets/windowsIcons/start.png';
import sound from 'assets/windowsIcons/690(16x16).png';
import usb from 'assets/windowsIcons/394(16x16).png';
import risk from 'assets/windowsIcons/229(16x16).png';
import readingIcon from 'assets/windowsIcons/ie-book.png';

const getTime = () => {
  const date = new Date();
  let hour = date.getHours();
  let hourPostFix = 'AM';
  let min = date.getMinutes();
  if (hour >= 12) {
    hour -= 12;
    hourPostFix = 'PM';
  }
  if (hour === 0) {
    hour = 12;
  }
  if (min < 10) {
    min = '0' + min;
  }
  return `${hour}:${min} ${hourPostFix}`;
};

function Footer({
  onMouseDownApp,
  apps,
  focusedAppId,
  onMouseDown,
  onClickMenuItem,
  onReadingView,
}) {
  const [time, setTime] = useState(getTime);
  const [menuOn, setMenuOn] = useState(false);
  const menu = useRef(null);
  function toggleMenu() {
    setMenuOn(on => !on);
  }
  function _onMouseDown(e) {
    if (e.target.closest('.footer__window')) return;
    onMouseDown();
  }
  function _onClickMenuItem(name) {
    onClickMenuItem(name);
    setMenuOn(false);
  }
  useEffect(() => {
    const timer = setInterval(() => {
      const newTime = getTime();
      newTime !== time && setTime(newTime);
    }, 1000);
    return () => clearInterval(timer);
  }, [time]);
  useEffect(() => {
    const target = menu.current;
    if (!target) return;
    function onMouseDown(e) {
      if (!target.contains(e.target) && menuOn) setMenuOn(false);
    }
    window.addEventListener('mousedown', onMouseDown);
    return () => window.removeEventListener('mousedown', onMouseDown);
  }, [menuOn]);

  return (
    <Container onMouseDown={_onMouseDown}>
      <div className="footer__items left">
        <div ref={menu} className="footer__start-group">
          <div className="footer__start__menu" id="xp-start-menu">
            {menuOn && <FooterMenu onClick={_onClickMenuItem} />}
          </div>
          <button
            type="button"
            className="footer__start"
            aria-label="Start"
            aria-expanded={menuOn}
            aria-controls="xp-start-menu"
            onClick={toggleMenu}
          >
            <img src={startButton} alt="" draggable={false} />
          </button>
        </div>
        {[...apps].map(
          app =>
            !app.header.noFooterWindow && (
              <FooterWindow
                key={app.id}
                id={app.id}
                icon={app.header.icon}
                title={app.header.title}
                onMouseDown={onMouseDownApp}
                isFocus={focusedAppId === app.id}
              />
            ),
        )}
      </div>

      <button
        id="desktop-reading-toggle"
        className="footer__reading"
        type="button"
        aria-label="Open reading view"
        title="Open reading view"
        onClick={onReadingView}
      >
        <img src={readingIcon} alt="" />
        <span className="footer__reading-full">Reading view</span>
      </button>
      <div className="footer__items right">
        <img className="footer__icon" src={sound} alt="" />
        <img className="footer__icon" src={usb} alt="" />
        <img className="footer__icon" src={risk} alt="" />
        <div style={{ position: 'relative', width: 0, height: 0 }}>
          <Balloon />
        </div>
        <div className="footer__time">{time}</div>
      </div>
    </Container>
  );
}

function FooterWindow({ id, icon, title, onMouseDown, isFocus }) {
  function _onMouseDown() {
    onMouseDown(id);
  }
  return (
    <button
      type="button"
      onClick={_onMouseDown}
      className={`footer__window ${isFocus ? 'focus' : 'cover'}`}
    >
      <img className="footer__icon" src={icon} alt={title} />
      <div className="footer__text">{title}</div>
    </button>
  );
}

const Container = styled.footer`
  height: 30px;
  background: linear-gradient(
    to bottom,
    #1f2f86 0,
    #3165c4 3%,
    #3682e5 6%,
    #4490e6 10%,
    #3883e5 12%,
    #2b71e0 15%,
    #2663da 18%,
    #235bd6 20%,
    #2258d5 23%,
    #2157d6 38%,
    #245ddb 54%,
    #2562df 86%,
    #245fdc 89%,
    #2158d4 92%,
    #1d4ec0 95%,
    #1941a5 98%
  );
  position: absolute;
  bottom: 0;
  right: 0;
  left: 0;
  display: flex;
  .footer__reading {
    flex: none;
    align-self: center;
    display: flex;
    align-items: center;
    gap: 5px;
    height: 24px;
    padding: 0 9px;
    margin-left: 6px;
    border: 1px solid #174cb1;
    border-radius: 3px;
    background: linear-gradient(#5b9af7, #347bdf 15%, #2462c9 45%, #2058b8);
    box-shadow: inset 1px 1px 0 #80b4ff, inset -1px -1px 0 #2052a9;
    color: #fff;
    text-shadow: 1px 1px #2454a1;
    font: 11px Tahoma, sans-serif;
    cursor: pointer;
    &:hover {
      background: linear-gradient(#78b1ff, #4388e8 15%, #2b6ed3 45%, #2461c4);
    }
    &:active {
      background: #1e52b7;
      box-shadow: inset 1px 1px 2px #12377c;
    }
    img {
      width: 16px;
      height: 16px;
    }
  }
  @media (max-width: 600px) {
    .footer__reading-full {
      display: none;
    }
    .footer__reading {
      justify-content: center;
      padding-inline: 6px;
      width: 30px;
    }
    .footer__items.right {
      margin-left: 4px;
      padding: 0 7px;
    }
    .footer__items.right .footer__icon {
      display: none;
    }
    .footer__window {
      min-width: 28px;
      padding-inline: 4px;
    }
  }
  button:focus-visible {
    outline: 2px dotted white;
    outline-offset: -3px;
  }
  .footer__items.left {
    height: 100%;
    flex: 1;
    overflow: hidden;
  }
  .footer__items.right {
    background-color: #0b77e9;
    flex-shrink: 0;
    background: linear-gradient(
      to bottom,
      #0c59b9 1%,
      #139ee9 6%,
      #18b5f2 10%,
      #139beb 14%,
      #1290e8 19%,
      #0d8dea 63%,
      #0d9ff1 81%,
      #0f9eed 88%,
      #119be9 91%,
      #1392e2 94%,
      #137ed7 97%,
      #095bc9 100%
    );
    border-left: 1px solid #1042af;
    box-shadow: inset 1px 0 1px #18bbff;
    padding: 0 10px;
    margin-left: 10px;
  }
  .footer__items {
    display: flex;
    align-items: center;
  }
  .footer__start {
    flex: none;
    border: 0;
    padding: 0;
    background: transparent;
    cursor: pointer;
    height: 100%;
    margin-right: 10px;
    position: relative;
    img {
      display: block;
      height: 100%;
      width: auto;
    }
    &:hover {
      filter: brightness(105%);
    }
    &:active {
      filter: brightness(85%);
    }
  }
  .footer__start-group {
    display: flex;
    flex: none;
    height: 100%;
  }
  .footer__start__menu {
    position: absolute;
    left: 0;
    box-shadow: 2px 4px 2px rgba(0, 0, 0, 0.5);
    bottom: 100%;
  }
  .footer__window {
    border: 0;
    min-width: 28px;
    cursor: pointer;
    flex: 1;
    max-width: 150px;
    color: #fff;
    border-radius: 2px;
    margin-top: 2px;
    padding: 0 8px;
    height: 22px;
    font-size: 11px;
    background-color: #3c81f3;
    box-shadow: inset -1px 0px rgba(0, 0, 0, 0.3),
      inset 1px 1px 1px rgba(255, 255, 255, 0.2);
    position: relative;
    display: flex;
    align-items: center;
  }
  .footer__icon {
    height: 15px;
    width: 15px;
  }
  .footer__text {
    position: absolute;
    left: 27px;
    right: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    right: 8px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .footer__window.cover:hover {
    background-color: #53a3ff;
    box-shadow: inset -1px 0px rgba(0, 0, 0, 0.3),
      inset 1px 1px 1px rgba(255, 255, 255, 0.2);
  }
  .footer__window.cover:before {
    display: block;
    content: '';
    position: absolute;
    left: -2px;
    top: -2px;
    width: 10px;
    height: 1px;
    border-bottom-right-radius: 50%;
    box-shadow: 2px 2px 3px rgba(255, 255, 255, 0.5);
  }
  .footer__window.cover:hover:active {
    background-color: #1e52b7;
    box-shadow: inset 0 0 1px 1px rgba(0, 0, 0, 0.3),
      inset 1px 0 1px rgba(0, 0, 0, 0.7);
  }
  .footer__window.focus:hover {
    background-color: #3576f3;
  }
  .footer__window.focus:hover:active {
    background-color: #1e52b7;
  }
  .footer__window.focus {
    background-color: #1e52b7;
    box-shadow: inset 0 0 1px 1px rgba(0, 0, 0, 0.2),
      inset 1px 0 1px rgba(0, 0, 0, 0.7);
  }
  .footer__time {
    margin: 0 5px;
    color: #fff;
    font-size: 11px;
    font-weight: lighter;
    text-shadow: none;
  }
`;

export default Footer;

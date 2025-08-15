import React from 'react';
import styled from 'styled-components';

const HeaderText = styled.div`
  font-family: 'Lucida Console', monospace;
  font-size: 13px;
  line-height: 14px;
  color: #000;
  white-space: pre;
  outline: none;
  resize: none;
  a {
    color: #0000ff;
    text-decoration: underline;
    cursor: pointer;

    &:hover {
      color: #800080;
    }

    &:visited {
      color: #800080;
    }
  }
`;

export const SocialMediaHeader = ({ onOpenNewNotepad, onFocusWinamp }) => (
  <HeaderText>
    {'╔════════════════════════════════════════════╗\n'}
    {'║           Thank you for visiting!          ║\n'}
    {'╚════════════════════════════════════════════╝\n\n'}
    {'╔══════════════════[ Links ]═════════════════╗\n║\n'}
    {'║ ▶ Instagram:    '}
    <a
      href="https://instagram.com/reshnocash"
      target="_blank"
      rel="noopener noreferrer"
    >
      @reshnocash
    </a>
    {'\n║\n'}
    {'║ ▶ Youtube:      '}
    <a
      href="https://youtube.com/reshra"
      target="_blank"
      rel="noopener noreferrer"
    >
      https://youtube.com/reshra
    </a>
    {'\n║\n'}
    {'║ ▶ TikTok:       '}
    <a
      href="https://tiktok.com/@reshra"
      target="_blank"
      rel="noopener noreferrer"
    >
      https://tiktok.com/@reshra
    </a>
    {'\n║\n'}
    {'╚════════════════════════════════════════════╝\n\n'}

    {'╔═════════════════[ Actions ]════════════════╗\n║\n'}
    {'║ '}
    <a
      href="#"
      onClick={e => {
        e.preventDefault();
        if (onFocusWinamp) {
          onFocusWinamp();
        }
      }}
    >
      {'>>>'} Play my music {'<<<'}
    </a>
    {'\n║\n'}
    {'║ '}
    <a
      href="#"
      onClick={e => {
        e.preventDefault();
        if (onOpenNewNotepad) {
          onOpenNewNotepad();
        }
      }}
    >
      {'>>>'} Open Parts List.txt {'<<<'}
    </a>
    {'\n║\n'}
    {'╚════════════════════════════════════════════╝\n\n\n'}
  </HeaderText>
);

export const PartsListHeader = () => (
  <HeaderText>
    Pickups -{' '}
    <a
      href="https://s.click.aliexpress.com/e/_EJ0db1o"
      target="_blank"
      rel="noopener noreferrer"
    >
      https://s.click.aliexpress.com/e/_EJ0db1o
    </a>
    {'\n\n'}
    Roller bridge -{' '}
    <a
      href="https://s.click.aliexpress.com/e/_EIGnDN0"
      target="_blank"
      rel="noopener noreferrer"
    >
      https://s.click.aliexpress.com/e/_EIGnDN0
    </a>
    {'\n\n'}
    Push-Push Potentiometers -{' '}
    <a
      href="https://s.click.aliexpress.com/e/_Exo98qq"
      target="_blank"
      rel="noopener noreferrer"
    >
      https://s.click.aliexpress.com/e/_Exo98qq
    </a>
    {'\n\n'}
    3-way Toggle -{' '}
    <a
      href="https://s.click.aliexpress.com/e/_EvvmiWq"
      target="_blank"
      rel="noopener noreferrer"
    >
      https://s.click.aliexpress.com/e/_EvvmiWq
    </a>
    {'\n\n'}
    Guitar Jack -{' '}
    <a
      href="https://s.click.aliexpress.com/e/_Ez24I94"
      target="_blank"
      rel="noopener noreferrer"
    >
      https://s.click.aliexpress.com/e/_Ez24I94
    </a>
    {'\n\n'}
    Volume/Tone knobs -{' '}
    <a
      href="https://s.click.aliexpress.com/e/_EHBVnuO"
      target="_blank"
      rel="noopener noreferrer"
    >
      https://s.click.aliexpress.com/e/_EHBVnuO
    </a>
    {'\n\n'}
    Capacitors -{' '}
    <a
      href="https://s.click.aliexpress.com/e/_EuXuhHY"
      target="_blank"
      rel="noopener noreferrer"
    >
      https://s.click.aliexpress.com/e/_EuXuhHY
    </a>
    {'\n\n'}
    Spanner guitar tool -{' '}
    <a
      href="https://s.click.aliexpress.com/e/_Ex7wIwm"
      target="_blank"
      rel="noopener noreferrer"
    >
      https://s.click.aliexpress.com/e/_Ex7wIwm
    </a>
    {'\n\n'}
    22AWG wire -{' '}
    <a
      href="https://s.click.aliexpress.com/e/_EzKZi6e"
      target="_blank"
      rel="noopener noreferrer"
    >
      https://s.click.aliexpress.com/e/_EzKZi6e
    </a>
    {'\n\n'}
    Feeler gauge -{' '}
    <a
      href="https://s.click.aliexpress.com/e/_EwoJdlg"
      target="_blank"
      rel="noopener noreferrer"
    >
      https://s.click.aliexpress.com/e/_EwoJdlg
    </a>
    {'\n\n'}
    Step Drill Bit -{' '}
    <a
      href="https://s.click.aliexpress.com/e/_EQk4Dn8"
      target="_blank"
      rel="noopener noreferrer"
    >
      https://s.click.aliexpress.com/e/_EQk4Dn8
    </a>
  </HeaderText>
);

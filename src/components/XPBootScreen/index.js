import React, { useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

// Optional presentation only: the caller decides when startup is complete.
export default function XPBootScreen({
  label = 'reshra',
  status = 'Starting the desktop…',
  onSkip,
}) {
  useEffect(() => {
    if (!onSkip) return undefined;
    const handleKeyDown = event => {
      if (event.key === 'Escape') onSkip();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onSkip]);

  return (
    <Screen className="xp-boot-screen">
      <div className="xp-boot__flag" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="xp-boot__wordmark" aria-hidden="true">
        <span>Windows</span>
        <strong>XP</strong>
      </div>
      <p className="xp-boot__label">{label}</p>
      <div className="xp-boot__track" aria-hidden="true">
        {Array.from({ length: 8 }, (_, index) => (
          <Pill key={index} style={{ animationDelay: `${index * 110}ms` }} />
        ))}
      </div>
      <p className="xp-boot__status" role="status" aria-live="polite">
        {status}
      </p>
      {onSkip && (
        <button className="xp-boot__skip" type="button" onClick={onSkip}>
          Click or press Esc to skip
        </button>
      )}
    </Screen>
  );
}

const pulse = keyframes`
  0%, 24%, 100% { opacity: 0; }
  1%, 12% { opacity: 1; }
`;

const Pill = styled.span`
  flex: 1;
  height: 9px;
  border-radius: 5px;
  background: linear-gradient(180deg, #5aabff 0%, #1a5cb8 50%, #5aabff 100%);
  opacity: 0;
  animation: ${pulse} 880ms linear infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: 0.75;
  }
`;

const Screen = styled.div`
  position: fixed;
  inset: 0;
  z-index: 999999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  padding: 24px 16px 72px;
  overflow-y: auto;
  background: #000;
  color: #fff;
  font-family: Tahoma, 'Microsoft Sans Serif', sans-serif;
  user-select: none;

  &::after {
    content: '';
    position: fixed;
    inset: 0;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0, 0, 0, 0.07) 2px,
      rgba(0, 0, 0, 0.07) 4px
    );
    pointer-events: none;
  }

  p {
    margin: 0;
  }

  .xp-boot__flag {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px;
    width: 60px;
    height: 60px;
    flex-shrink: 0;
    margin-bottom: 16px;
  }
  .xp-boot__flag span {
    border-radius: 2px;
  }
  .xp-boot__flag span:nth-child(1) {
    background: #f25022;
  }
  .xp-boot__flag span:nth-child(2) {
    background: #7fba00;
  }
  .xp-boot__flag span:nth-child(3) {
    background: #00a4ef;
  }
  .xp-boot__flag span:nth-child(4) {
    background: #ffb900;
  }

  .xp-boot__wordmark {
    display: flex;
    align-items: baseline;
    margin-bottom: 5px;
    font-size: 32px;
    letter-spacing: -0.5px;
  }
  .xp-boot__wordmark strong {
    margin-left: 7px;
    color: #ff8c00;
    font-size: 20px;
    font-style: italic;
  }
  .xp-boot__label {
    margin-bottom: 48px;
    color: #999;
    font-size: 11px;
    letter-spacing: 0.8px;
    text-transform: uppercase;
  }
  .xp-boot__track {
    display: flex;
    align-items: center;
    gap: 3px;
    width: 240px;
    max-width: 100%;
    min-height: 15px;
    box-sizing: border-box;
    padding: 2px 4px;
    border: 1px solid #555;
    border-radius: 8px;
    overflow: hidden;
    background: #1a1a1a;
  }
  .xp-boot__status {
    margin-top: 12px;
    color: #888;
    font-size: 10px;
    line-height: 1.5;
    letter-spacing: 0.3px;
    text-align: center;
  }
  .xp-boot__skip {
    position: absolute;
    bottom: 20px;
    max-width: calc(100% - 32px);
    padding: 8px;
    border: 0;
    background: transparent;
    color: #999;
    font: inherit;
    font-size: 14px;
    cursor: pointer;
  }
  .xp-boot__skip:hover {
    color: #fff;
  }
  .xp-boot__skip:focus-visible {
    outline: 1px dotted #fff;
  }
`;

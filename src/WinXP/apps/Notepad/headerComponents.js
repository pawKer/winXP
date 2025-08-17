import React from 'react';
import HeaderRenderer from './components/HeaderRenderer';
import { socialMediaConfig, guitarPartsConfig } from './headerConfig';

// Wrapper components that maintain the same API for backward compatibility
export const SocialMediaHeader = ({ onOpenNewNotepad, onFocusWinamp }) => {
  const handleAction = action => {
    switch (action) {
      case 'playMusic':
        if (onFocusWinamp) {
          onFocusWinamp();
        }
        break;
      case 'openGuitarParts':
        if (onOpenNewNotepad) {
          onOpenNewNotepad();
        }
        break;
      default:
        break;
    }
  };

  return <HeaderRenderer config={socialMediaConfig} onAction={handleAction} />;
};

export const PartsListHeader = () => {
  return <HeaderRenderer config={guitarPartsConfig} />;
};

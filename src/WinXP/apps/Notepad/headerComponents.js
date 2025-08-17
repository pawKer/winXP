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

// Export the configs and helper functions for easy customization
export { socialMediaConfig, guitarPartsConfig } from './headerConfig';

// Export the HeaderRenderer for custom headers
export { default as HeaderRenderer } from './components/HeaderRenderer';

# Optional XP boot screen

Adapted from the supplied boot-screen design, without AzuraCast integration.
This component is not enabled or imported by the application.

```jsx
import XPBootScreen from 'components/XPBootScreen';

// Unmount as soon as the desktop is ready; there is no fixed animation delay.
<XPBootScreen
  label="reshra"
  status="Starting the desktop…"
  onSkip={openReadingView}
/>;
```

`label` and `status` are optional. Omit `onSkip` to hide the skip button; when
provided, the button and Escape key invoke it. The parent supplies the action
and controls when the screen unmounts. The animation respects reduced-motion
preferences and does not claim to measure download progress or load drivers.

A React component can cover desktop initialization after React has loaded.
The initial pre-React reading-content suppression remains in `public/startup.js`.

# Optional XP boot screen

Adapted from the supplied boot-screen design, without AzuraCast integration.
This component is currently disabled and is not imported by the application.
It remains available for future use. Desktop startup still falls back to readable
content with a retry link if loading has not completed after 12 seconds.

```jsx
import XPBootScreen from 'components/XPBootScreen';

// App controls readiness; the component only renders.
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

# AGENTS.md

## Project at a glance

This is a client-only Windows XP desktop recreation built with Create React App, React 18, React Router 5, styled-components 4, and react-use. It includes draggable/resizable windows, desktop icons, a Start menu, and app simulations for Internet Explorer, Notepad, Minesweeper, My Computer, Winamp, and Paint.

The project is also customized as `reshra`'s personal desktop. Preserve that identity and the retro Windows XP aesthetic unless a task explicitly asks for a redesign.

## Commands

Use Yarn because `yarn.lock` is the committed lockfile.

```powershell
yarn install --frozen-lockfile
yarn start
yarn build
yarn test --watchAll=false
yarn lint
```

Notes:

- There are currently no repository test files. `yarn build`, `yarn lint`, and focused manual testing are the useful checks.
- `react-scripts` is only available after dependencies are installed.
- The local development server normally runs at `http://localhost:3000`.
- `yarn start` is a long-running process. Start it in the background when working through an agent shell.
- `.env` provides `REACT_APP_GA_MEASUREMENT_ID`. CRA embeds this at build time.
- The Docker production app is exposed at `http://localhost:14567` by `docker-compose.yml`.

## Repository map

```text
public/                         Static files served from site root
  songs/                        Local Winamp tracks; intentionally gitignored
  winamp_skin/modern.wsz        Winamp skin
src/
  App.js                        BrowserRouter and generated note routes
  index.js                      React 18 entry point; StrictMode enabled
  hooks/                        Analytics and drag/resize helpers
  components/                   Shared UI, including RetroLinktree
  WinXP/
    index.js                    Desktop reducer, focus/window orchestration
    apps/index.js               Startup windows, desktop icons, app settings
    apps/notesConfig.js         Central note registry
    apps/InternetExplorer/      RetroLinktree and newsletter browser views
    apps/Notepad/               Editable Notepad plus configured link headers
    apps/Winamp/                Webamp integration and playlist
    Windows/                    Generic draggable/resizable window shell
    Icons/                      Desktop icon rendering and selection
    Footer/                     Taskbar and Start menu
    constants/                  Reducer action and state constants
```

Imports such as `WinXP`, `components`, `hooks`, and `assets/...` are absolute from `src`, enabled by `jsconfig.json`. Follow that style for cross-tree imports; use relative imports within a feature directory.

## Runtime architecture

### Routing and startup

- `src/index.js` renders `App` in `React.StrictMode`; effects run twice in development.
- `src/App.js` creates one React Router route for every note in `NOTES`, then falls back to `/`.
- Every route renders the same `WinXP` desktop. A note route passes `defaultPath`, and `WinXP` opens the matching Notepad window in an effect.
- `defaultAppState` in `src/WinXP/apps/index.js` controls windows open at startup. Currently Minesweeper, Winamp, and Internet Explorer start open.

### Desktop and windows

- `src/WinXP/index.js` owns desktop state through a reducer: open apps, z-indexes, focus, minimization/maximization, icon selection, and power modal state.
- `ADD_APP` deduplicates by component unless the app setting has `multiInstance: true`.
- Notes are a special case: `openNote(noteId)` deduplicates by `noteId` even though Notepad itself supports multiple instances.
- `src/WinXP/Windows/index.js` is the generic window shell. It injects app callbacks (`onClose`, `onOpenNote`, `onFocusWinamp`, etc.) into app components.
- Drag/resize behavior lives in `src/hooks/useElementResize.js`. It relies on real browser geometry and global mouse listeners; test it in a browser after changing it.
- Many initial sizes and offsets read `window.innerWidth` during module evaluation. The app assumes a browser environment, not SSR.

### App registration

`src/WinXP/apps/index.js` has three related but distinct concepts:

- `defaultAppState`: instantiated windows present on initial load.
- `defaultIconState`: desktop shortcuts. Note shortcuts are appended automatically.
- `appSettings`: reusable templates used when launching apps from icons, the Start menu, or actions.

Adding a completely new app normally requires all of the following:

1. Create the component under `src/WinXP/apps/<AppName>/`.
2. Import it in `src/WinXP/apps/index.js`.
3. Add an `appSettings` entry with header, size, offset, resize, and instance behavior.
4. Add a desktop icon and/or Start menu entry if required.
5. Handle the Start menu label in `onClickMenuItem` in `src/WinXP/index.js`.
6. Export the component from `src/WinXP/apps/index.js` when other modules need it.

Keep app labels consistent across Start menu data, `onClickMenuItem`, and `appSettings`; this code uses string matching rather than a shared app ID.

## Notes system

Configured `.txt` documents use a central registry:

- `src/WinXP/apps/notesConfig.js`: note ID, window title, URL path, desktop title, and header component.
- `src/content/site.js`: canonical profile, releases, notes, and their URL paths.
- `src/content/noteSections.js`: structured note sections, external links, and actions rendered above the textarea.
- `src/WinXP/apps/Notepad/headerComponents.js`: small React wrappers connecting configs to `HeaderRenderer` and translating action names into callbacks.
- `src/WinXP/apps/Notepad/components/HeaderRenderer.js`: shared ASCII-style rendering and link analytics.

Adding a note to `NOTES` automatically creates:

- a direct route through `App.js`;
- a desktop `.txt` shortcut through `defaultIconState`;
- lookup support for `openNote(noteId)`.

It does **not** automatically create a RetroLinktree entry. Add that separately to the `links` array in `src/WinXP/apps/InternetExplorer/index.js`:

```jsx
{
  title: 'Example.txt',
  subtitle: 'Open in Notepad',
  onClick: () => onOpenNote('exampleNoteId'),
  iconNode: <FaBookOpen />,
}
```

A typical external link item in `src/content/noteSections.js` is:

```js
{
  label: 'Capture name -',
  url: 'https://example.com/full-destination',
  displayText: 'https://example.com/display-text',
  type: 'external',
}
```

Important behavior:

- `src/content/noteSections.js` is the source of persistent, predefined note content.
- The Notepad textarea starts empty and is local React state. User edits are lost when the window closes or the page reloads.
- `HeaderRenderer` supports `external` and `action` item types. New action names need handling in the appropriate wrapper in `headerComponents.js`.
- A header component receives callbacks because Notepad clones it with `onOpenNewNotepad` and `onFocusWinamp`.
- Keep note IDs unique and paths stable. Changing a path breaks saved/shared links.

## Internet Explorer and RetroLinktree

- `src/WinXP/apps/InternetExplorer/index.js` owns the actual profile and link list shown in Internet Explorer.
- `src/components/RetroLinktree/index.js` is a reusable presentation component. Do not hard-code personal links there; pass them from Internet Explorer.
- A link item may have either `url` or `onClick`, plus optional `subtitle`, `iconNode`, and `highlight`.
- External links open in a new tab. Action-only entries render as buttons.
- Clicks are tracked through `trackEvent`; analytics is best-effort and should never block navigation.
- Newsletter and Substack views are internal `contentView` states, not React Router pages.
- The custom sword cursor is `/sword.png` from `public/`.

## Winamp, media, and external content

- Playlist metadata is in `src/WinXP/apps/Winamp/config.js`.
- Audio URLs point to `/songs/...`; `public/songs` is gitignored and may be absent in a checkout.
- Docker Compose mounts `./public/songs` read-only into nginx, so do not bake large/private audio into source without explicit direction.
- The Winamp integration has deliberate React 18 StrictMode guards and DOM reparenting. Preserve these when changing lifecycle code.
- Paint embeds `https://jspaint.app` in an iframe and therefore requires network access to work.
- The desktop imports a Google-hosted Noto Sans font from styled-components, so offline rendering can fall back to Tahoma/sans-serif.

## Styling and assets

- Most feature styling is colocated in JavaScript with styled-components.
- Global resets/fonts are in `src/index.css`, `src/assets/clear.css`, and `src/assets/font.css`.
- Windows XP icons live in `src/assets/windowsIcons`; Minesweeper assets have their own directory.
- Files needed by absolute browser URLs belong in `public/`; imported build assets belong in `src/assets/`.
- Preserve the established Tahoma/Lucida Console typography, compact spacing, bitmap icons, and Windows XP interaction patterns.
- Check both desktop and narrow/mobile layouts. App windows auto-maximize when `window.innerWidth < 800`.

## Code conventions and cautions

- JavaScript and JSX only; there is no TypeScript setup.
- Prettier uses single quotes and trailing commas. Existing code generally uses two-space indentation.
- Do not add package manager lockfiles other than `yarn.lock`.
- Do not edit generated `build/` output.
- Do not commit `node_modules`, local environment overrides, or `public/songs`.
- Preserve unrelated work in a dirty worktree. Check `git status --short` before and after editing.
- Some source and documentation text currently contains visible mojibake (for example `â...` or `đ...`). Do not perform broad encoding cleanup as part of an unrelated task; it creates noisy diffs and may change intentionally displayed retro text. Fix only text explicitly in scope and verify the rendered result.
- CRA's cached ESLint results can report old Prettier errors after formatting on Windows. If build output disagrees with the file on disk, remove only `node_modules/.cache/.eslintcache` before rebuilding.
- Several components contain legacy or commented code. Prefer the active centralized patterns over reviving old per-icon `headerContent` code.
- Avoid adding `console.log`; there is currently a debug log in the direct-note opening effect, but it is not a convention to copy.

## Verification checklist

Choose checks proportional to the change:

1. Run `git diff --check` for every change.
2. Run `yarn build` for source/config changes when dependencies are installed.
3. Run `yarn lint` for JavaScript/JSX changes. Expect possible pre-existing warnings; distinguish them from new failures.
4. For note changes, manually verify:
   - its desktop shortcut opens the correct titled window;
   - its `/notes/...` URL opens the same note;
   - its RetroLinktree action opens/focuses the note;
   - external links open in a new tab.
5. For window-shell changes, test dragging, all resize edges, maximize/restore, minimize/taskbar restore, focus ordering, and mobile auto-maximize.
6. For Winamp changes, test in development StrictMode and verify close/minimize callbacks and missing-song behavior.
7. Review `git status --short` so dependency installation or build artifacts are not accidentally included.

## Deployment

- `Dockerfile` builds with Yarn in Node Alpine and serves the CRA build from nginx.
- `scripts/generate-pages.js` runs after CRA build and writes route-specific HTML, sitemap.xml, and robots.txt. `scripts/verify-pages.js` checks the generated output.
- `nginx.conf` resolves extensionless content URLs to generated `.html` files and returns 404 for unknown paths.
- `docker-compose.yml` builds the app, forwards host port `14567` to nginx port `80`, and mounts local songs.
- `docker-compose.pi.yml` is the Raspberry Pi deployment variant; inspect it before changing container assumptions.
- `now.json` is a legacy Vercel/Now deployment configuration and also rewrites all non-static routes to `index.html`.

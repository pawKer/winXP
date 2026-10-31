# AGENTS.md

## Project at a glance

This is a client-only Windows XP desktop recreation built with Create React App, React 18, React Router 5, styled-components 4, and react-use. It includes draggable/resizable windows, desktop icons, a Start menu, and app simulations for Internet Explorer, Notepad, Minesweeper, My Computer, Winamp, and Paint.

The project is also customized as `reshra`'s personal desktop. Preserve that identity and the retro Windows XP aesthetic unless a task explicitly asks for a redesign.

Project plans, reviews, analytics and release notes are indexed in [docs/README.md](docs/README.md). Keep this agent instruction file at the repository root; editorial drafts and asset-specific documentation stay with their related files.

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

- `apply_patch` rejects multiple operations for the same path within one patch, including separate Update File blocks. Group edits into one block per file; use separate calls for deleting and recreating a file.

- Playback/analytics unit tests and isolated GA tooling tests are available. Use `yarn test --watchAll=false --runInBand`, `yarn test:ga4`, build/lint, and focused browser/nginx checks as appropriate.
- `react-scripts` is only available after dependencies are installed.
- If PowerShell blocks `yarn.ps1`, use `yarn.cmd` with the same arguments; no execution-policy change is needed.
- The local development server normally runs at `http://localhost:3000`.
- `yarn start` is a long-running process. Start it in the background when working through an agent shell.
- `.env` provides `REACT_APP_GA_MEASUREMENT_ID`. CRA embeds this at build time.
- WAV playback is the default. Set `REACT_APP_PREFER_MP3=true` at build time only after the compressed songs have been deployed; `audioManifest.json` records local preparation rather than server availability.
- The Docker production app is exposed at `http://localhost:14567` by `docker-compose.yml`.

## Repository map

```text
content/                        Editable JSON records, Markdown posts, schemas, templates
scripts/
  content/                      Content compiler, validator, watcher, and tests
  analytics/                    GA setup, login, report tools, and tests
  media/                        Audio conversion and artwork preparation
docs/                           Plans, implementation status, deployment and analytics
  editorial/                    Drafts, research, and saved source/baseline evidence
  assets/                       Documentation/demo artwork
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
- `src/content/registry.js` derives public routes from compiled content; `App.js` selects the reading or lazy desktop view.
- Recording articles are canonical at `/blog/<slug>`; legacy `/music/<slug>` paths redirect to their published article. Within the desktop, note paths open/focus the corresponding generic Notepad document.
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

## Content data and notes

- Author structured content in `content/*.json`, `content/notes/*.json`, and `content/releases/*.json`; posts stay in `content/posts/*.md`.
- `content/schemas/content.schema.json` defines the machine-readable JSON contracts. `scripts/content/sources.cjs` validates references, paths, media, and publication boundaries; `scripts/content/build.cjs` compiles the whole public snapshot.
- `src/content/generated/content.json` is ignored output. Never hand-edit it. `site.js`, `catalogue.js`, and `posts.js` are browser/Node adapters, not editable content registries.
- Run `yarn content:validate` without writing output; `yarn content:build` compiles. `yarn start` watches source edits, additions, and removals, retaining the last valid complete snapshot on errors. Restart the dev server after changing schema/tooling code.
- Notes use explicit stable IDs and paths, structured section items with typed targets, and optional `desktop`/`homepage` flags. Their order is the optional numeric `order`, followed by unranked filenames. Title edits never rename URLs.
- Adding a published note automatically supplies its public route, notes browser entry, desktop shortcut, and homepage group entry unless its placement flags disable them. No React header/import registration is required.
- `notesConfig.js` reads compiled notes; `Notepad/components/HeaderRenderer.js` receives a note explicitly and shares `templates/notes.js` with reading/static rendering. `content/site.json` sets `defaultNoteId` for the notes browser.
- Targets support external URLs, shared link IDs, note IDs, release slugs, post IDs, known page paths, and allowlisted Winamp/newsletter actions. Icon keys/actions are mapped in code; JSON never contains JSX or callbacks.
- Keep official social destinations in `content/links.json`; profile and note records reference those IDs. `content/home.json` owns XP homepage order and featured release IDs; `content/navigation.json` owns shared layout navigation.
- Publication `status: draft|published` is distinct from release `releaseStatus: upcoming|released`. Editorial drafts never enter the snapshot. Public Winamp WIP tracks remain intentionally public and are not editorial drafts.
- Notepad's textarea is a temporary scratchpad. Published note content is edited in files; visitor changes do not write to the repository.
- Copy examples from `content/templates/note.json` and `content/templates/release.json`; follow [content authoring](docs/content-authoring.md).

## Blog content and templates

- Author posts in `content/posts/*.md` with YAML frontmatter. Run `yarn post:new my-slug` for a draft and see `docs/content-authoring.md` for the field reference.
- `yarn start` compiles and watches posts; `yarn build` compiles before CRA bundles the shared renderer. Only published posts enter the ignored `src/content/generated/content.json`; do not edit or commit that file.
- `src/content/registry.js` supplies routes/order/categories, `schema.js` supplies structured data, and `templates/` supplies shared HTML functions. `pages.js` is the compatibility entry point for browser and Node consumers.
- `scripts/templates/` owns full HTML and discovery documents; `scripts/generate-pages.js` only writes their output. Keep shared browser templates in CommonJS `.js` files and avoid object spread in them because CRA can otherwise mix ESM helpers with CommonJS exports.
- Run `yarn test:content` for Markdown validation, draft exclusion, automatic route/category discovery, and reading-link checks. Notes and music catalogue records compile from JSON under `content/`.
- When checking documentation links, ignore fenced and inline code examples; example post URLs and assets need not exist in the repository.

## Internet Explorer and RetroLinktree

- `content/site.json`, `content/links.json`, and `content/home.json` own profile and link data. `src/WinXP/apps/InternetExplorer/index.js` adapts compiled entries into navigation and app callbacks.
- `src/components/RetroLinktree/index.js` is a reusable presentation component. Do not hard-code personal links there; pass them from Internet Explorer.
- A link item may have either `url` or `onClick`, plus optional `subtitle`, `iconNode`, and `highlight`.
- External links open in a new tab. Action-only entries render as buttons.
- Clicks are tracked through `trackEvent`; analytics is best-effort and should never block navigation.
- Newsletter and Substack views are internal `contentView` states, not React Router pages.
- The custom sword cursor is `/sword.png` from `public/`.

## Winamp, media, and external content

- Playlist order and public WIP metadata live in `content/playlist.json`. Release metadata comes from `content/releases/*.json`; `Winamp/config.js` adapts compiled tracks. Media scripts read validated source data independently of generated browser output.
- Audio URLs point to `/songs/...`; `public/songs` is gitignored and may be absent in a checkout.
- Docker Compose mounts `./public/songs` read-only into nginx, so do not bake large/private audio into source without explicit direction.
- The Winamp integration has deliberate React 18 StrictMode guards and DOM reparenting. Preserve these when changing lifecycle code.
- Paint embeds `https://jspaint.app` in an iframe and therefore requires network access to work.
- Window titles use locally served Noto Sans bold subsets from `src/assets/fonts`, with their SIL license included. Tahoma remains the desktop/fallback font; Google font servers are not required.

## Styling and assets

- Most feature styling is colocated in JavaScript with styled-components.
- Global resets/fonts are in `src/index.css`, `src/assets/clear.css`, and `src/assets/font.css`.
- Windows XP icons live in `src/assets/windowsIcons`; Minesweeper assets have their own directory.
- Files needed by absolute browser URLs belong in `public/`; imported build assets belong in `src/assets/`.
- Preserve the established Tahoma/Lucida Console typography, compact spacing, bitmap icons, and Windows XP interaction patterns.
- Check both desktop and narrow/mobile layouts. App windows auto-maximize when `window.innerWidth < 800`.

## Code conventions and cautions

- JavaScript and JSX only; there is no TypeScript setup.
- Build/browser-shared content renderers use CommonJS in `.js` files so the generator can load them directly. Avoid object spread in these CommonJS modules: CRA injects ESM helper imports and then fails to expose the CommonJS exports. Use `Object.assign` or property assignments instead. CRA treats `.cjs` source as an asset URL, so do not rename shared renderers to `.cjs`. Prettier 1 needs `--parser babel` for standalone `.cjs` tooling scripts.
- Prettier uses single quotes and trailing commas. Existing code generally uses two-space indentation.
- Do not add package manager lockfiles other than `yarn.lock`.
- Do not edit generated `build/` output.
- Do not commit `node_modules`, local environment overrides, or `public/songs`.
- Preserve unrelated work in a dirty worktree. Check `git status --short` before and after editing.
- Some source and documentation text currently contains visible mojibake (for example `â...` or `đ...`). Do not perform broad encoding cleanup as part of an unrelated task; it creates noisy diffs and may change intentionally displayed retro text. Fix only text explicitly in scope and verify the rendered result.
- CRA's cached ESLint results can report old Prettier errors after formatting on Windows. If build output disagrees with the file on disk, remove only `node_modules/.cache/.eslintcache` before rebuilding. Switching between development and production checks can recreate stale results, so clear it immediately before the necessary rebuild if old source text reappears.
- A successful CRA build recreates `.eslintcache`; after further source edits, stale formatting errors can recur. Check direct lint/the file on disk and clear that same cache again before the next necessary build. Chrome regression checks can also connect to a debug port but time out at `Page.enable` in the sandbox; rerun the necessary browser command with scoped approval when this happens.
- Concurrent CRA development compilers for this workspace can restore stale shared ESLint-cache results during production builds. If direct `yarn lint` passes but cache errors keep returning, leave unrelated dev servers running, verify lint separately, and use `DISABLE_ESLINT_PLUGIN=true` for that build invocation only. Do not persist the override in project configuration.
- For headless CDP keyboard/focus checks, enable `Emulation.setFocusEmulationEnabled`. An unfocused headless tab can update `document.activeElement` without dispatching the React focus handlers, producing misleading scroll/focus failures.
- GA Realtime accepts a narrower set of dimension/metric combinations than the core reporting API. For ingestion checks, start with `eventName` and `eventCount`; combining `unifiedScreenName` with that event report returned `INVALID_ARGUMENT` here despite the fields being individually documented.
- A running CRA development compiler can also retain stale lint errors in `node_modules/.cache/default-development`. If direct lint and the build pass but dev still reports old line contents, stop only the task-owned QA server, verify the cache paths are within this workspace, clear that development cache and `.eslintcache`, then restart it. Do not stop unrelated development servers.
- CRA clears `build/` while rebuilding. Wait for the active build to finish before browser/nginx checks; running them concurrently creates misleading 404s.
- Use literal PowerShell here-strings piped to Node for scripts containing quote-heavy regular expressions. Shell-escaped JavaScript strings are easy to misparse. Keep piped script text ASCII and use Unicode escapes for non-ASCII literals: Windows PowerShell can replace literal glyphs with question marks while piping. Use UTF-8 files or apply_patch for authored Unicode content.
- Several components contain legacy or commented code. Prefer the active centralized patterns over reviving old per-icon `headerContent` code.
- Avoid adding `console.log`; there is currently a debug log in the direct-note opening effect, but it is not a convention to copy.
- Keep Webamp's imperative mount in an empty, dedicated DOM node. Rendering conditional React feedback into that same node can remove the player controls while its audio continues; render feedback as a sibling and verify the actual controls after playback starts.
- Let Webamp own its viewport coordinates and movement boundaries. Wait until the lazy desktop mount is visible before `renderWhenReady`, then use master's original reparenting offset only. An extra DOM centering offset is invisible to Webamp's internal coordinates and breaks dragging/viewport clamping. Verify actual dragging and shrinking the browser with both the basic and Milkdrop players.
- Webamp 2.2's bundled Milkdrop presets can throw `float unrepresentable in integer range` in WASM and tear down its separate React root. Start with the built-in default preset and automatic randomization/cycling off; use the basic player on software WebGL/reduced-motion systems. Test visible controls after actual playback rather than only the `#webamp` root's existence.
- Webamp 2.2 documents `setCurrentTrack` as accepting an index, but its implementation dispatches that argument as a track ID. Use the selected entry's `id` from `getPlaylistTracks()`, including after reopening/reordering. Its `pause()` also toggles to play when already paused/stopped: check `getMediaStatus()` before pausing programmatically. Verify the requested song's marquee and actual playback event, not just any playing state.

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

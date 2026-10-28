# SEO implementation review and follow-ups

Reviewed 27 October 2026 against [SEO plan](plan.md), on `feat/seo-static-pages` at `a58de15`. The implementation reviewed spans `608be07` through `a58de15`. This document proposes follow-up work; it does not change application behavior.

Local implementation now includes the direct/embedded blog, full identified music archive, shared XP content styling, navigation and playback repairs. See [implementation status](../implementation-status.md) for verification evidence and remaining account, editorial and deployment work; the findings below describe the original reviewed state.

The static-page foundation is sound, but the HTML-to-desktop prototype still needs usability fixes before it meets the plan's completion criteria. Keep the architecture and the personal XP desktop. Prioritize readable pages, reliable mode switching, and coherent navigation, then refine the new content views around the existing XP controls.

**Expanded content direction:** The requested follow-up now includes the older song catalogue and a Myspace/Piczo-inspired blog at `/blog`, available both inside IE and as a standalone website with direct post URLs. Release posts, tutorials, and other original videos can use reviewed AI-assisted article drafts. See [blog plan](../blog-plan.md) for the page structure, design, publishing workflow, and acceptance criteria.

## What is working

- The build generates nine substantive HTML pages, including the two confirmed releases and all four existing note paths. Draft tracks remain outside the public release catalogue.
- Direct requests have page-specific titles, descriptions, canonicals, social metadata, ordinary links, and JSON-LD. The sitemap uses clean canonical paths.
- Shared content records supply both the generator and desktop views. Affiliate flags and disclosures are explicit.
- Direct external listening links remain prominent. Local playback requires a visitor action, and reading-view release pages offer native audio controls.
- nginx now attempts generated content files and returns 404 for missing paths. Production behavior still needs verification.

These are useful improvements over the original empty application container. They do not establish production indexability, ranking, or completion of the entire plan.

## Evidence and review limits

| Check | Result |
| --- | --- |
| `yarn.cmd build` | Passed; generated nine pages. CRA reports a **1.1 MB gzip JavaScript bundle** and existing lint warnings. |
| `yarn.cmd test:seo` | Passed all current generated-page assertions. |
| `yarn.cmd lint` | Passed with **14 warnings, zero errors** in the reviewed tree. |
| Chrome, production build | Inspected desktop at 1366 × 900, narrow layouts at 390 × 844 and 320 × 700, internal navigation, Back, reading mode, and a JavaScript-disabled note. |
| Local media inventory | `bruises` WAV is 104,667,578 bytes, approximately 100 MiB. The configured `anii 2000` WAV is absent locally. |

Browser checks used a temporary local static server with extensionless HTML lookup, not nginx or Cloudflare. Third-party fonts and analytics were blocked during those checks. Real device touch interaction, development StrictMode playback, successful audio playback, production media availability, edge responses, Search Console, and Bing were not verified. This was not a full accessibility audit.

PowerShell blocks `yarn.ps1` in this environment; `yarn.cmd` ran the same Yarn scripts successfully.

## Plan coverage

| Plan milestone | Assessment |
| --- | --- |
| Identity, crawl access, baseline | Preferred host is recorded. Artist introduction, production crawler access, redirects, and account baselines remain outstanding. |
| HTML-to-desktop prototype | Implemented, but reading-view scrolling, mode switching, and navigation prevent calling it complete. |
| Artist and music pages | Minimal release pages exist as requested. Verified release metadata and measured loading/playback improvements remain follow-ups. |
| Navigation, notes, delivery | HTML generation and nginx changes exist. Browser metadata, window focus, keyboard access, and deployment verification need work. |
| AI access and measurement | Generated robots rules reflect the chosen policy. Effective edge policy and discovery outcomes remain unverified. |

## Functional follow-ups, in priority order

P1 means a core visitor journey is broken or misleading. P2 means a usability, accessibility, or maintenance improvement. These priorities describe impact, not an assertion that every underlying issue was introduced by the other agent.

### F1 — P1: Restore scrolling and reflow in reading view

**Evidence:** [src/index.css](../../src/index.css) sets `body { overflow-y: hidden; }`. The generated reading styles in [scripts/generate-pages.js](../../scripts/generate-pages.js) never restore document scrolling. In Chrome, `/notes/guitar-parts?view=read` was about 1500 px tall in an 844 px viewport; a 650 px wheel gesture left `scrollY` at zero. The JavaScript-disabled page inherits the same restriction.

Long resource URLs also widened that note to **449 px in a 390 px viewport**. At 320 px, the music catalogue's nested padding and horizontal icon layout turn each release into a very tall, cramped card.

**Follow-up:** Scope the desktop scroll lock to desktop mode. Make the generated reading view scroll before JavaScript starts. Wrap long links with `overflow-wrap: anywhere`, allow flex children to shrink, reduce narrow-screen gutters, and stack release content when necessary. Scope reading typography and spacing so the global desktop reset cannot collapse document spacing.

**Acceptance:** With JavaScript enabled and disabled, reach the final resource and footer using wheel, touch, and keyboard. At 320 and 390 CSS px, ordinary text and links fit without horizontal scrolling. Also check 200% text enlargement and the equivalent of 400% zoom. This aligns with [W3C's reflow guidance](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html).

### F2 — P1: Keep the presentation switch available in both modes

**Evidence:** [src/App.js](../../src/App.js) renders `#view-toggle` inside `#root`, while the generator hides `#root` in reading mode. Chrome confirmed that clicking “Reading view” hides the toggle itself. The remaining “Desktop view” anchor performs a full page load, discarding the live desktop session. Its apparent reversibility therefore differs from the first switch.

Reading links also perform document navigations, so browsing notes and returning to the desktop loses open windows and unsaved Notepad text. The mode state is initialized from the query string once and changed with raw `history.replaceState`, outside the router's location updates.

**Follow-up:** Put one mode control in a shared shell outside both view containers. Synchronize its state with routing, handle Back/Forward, and preserve the desktop session when switching. Enhance ordinary reading links for same-session navigation while keeping their real destinations and modified-click behavior. Optionally remember a preference locally; explicit URL mode should take precedence.

**Acceptance:** Open a note, type text, switch to reading view, visit another content page, and switch back without a reload or lost text. Both mode controls remain keyboard reachable, clearly expose the current mode, and preserve the canonical content path. Without JavaScript, avoid presenting a desktop action that only reloads the same reading page.

### F3 — P1: Update document metadata after internal navigation

**Evidence:** Navigating `/` → `/music` → `/music/bruises` changed the visible page and fetched reading content, but Chrome still reported the homepage title and `https://reshra.xyz/` canonical. [src/App.js](../../src/App.js) copies only the fetched `#static-content` body; it never updates the document head.

Directly loading a release has the correct metadata. This is an SPA consistency defect, not a claim that the generated release files lack SEO metadata.

**Follow-up:** Share a portable page registry containing path, title, description, canonical, social image, and structured data. Use it for both build generation and a route-aware head updater. Replace previous page metadata rather than accumulating tags, including when navigating Back/Forward.

**Acceptance:** After each internal transition and browser-history navigation, assert the expected title, description, canonical, Open Graph URL, and JSON-LD. A release must never retain the homepage canonical. [Google's JavaScript SEO guidance](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics) covers route-specific metadata and canonical handling.

### F4 — P1: Make browser history select the corresponding XP window

**Evidence:** In Chrome, opening Guitar Parts from `/notes` and pressing browser Back returned the URL to `/notes`, but Notepad remained over the index. [src/WinXP/index.js](../../src/WinXP/index.js) opens notes on path changes but does not restore/focus Internet Explorer for index or music routes. Desktop note shortcuts and header callbacks can open documents without updating the URL at all.

The simulated IE Back control in [InternetExplorer/index.js](../../src/WinXP/apps/InternetExplorer/index.js) calls `goMain()`, which pushes `/`; it does not go back. It also appears disabled while browsing new content routes because its appearance still depends on the old `state.route` value.

**Follow-up:** Establish one route-to-window navigation helper: note paths open/focus the matching Notepad, and home/music/index paths open/restore/focus IE. Use it from links, shortcuts, and browser history. Keep other open windows intact. Wire IE Back/Forward to real supported history behavior and use actual disabled buttons when unavailable.

**Acceptance:** `/` → `/music` → release → Back restores the catalogue. `/notes` → note → Back exposes the index. Repeat with IE minimized or closed, multiple notes open, and a phone-sized viewport. Copying the URL of a note opened from a shortcut should identify that note.

### F5 — P2: Make reading content refresh recover from failures

**Evidence:** [src/App.js](../../src/App.js) fetches an entire HTML document after every path change, even while reading content is hidden. It does not check `response.ok`. If a 404, challenge page, or development-server response lacks `#static-content`, the page can stay on “Loading page…” indefinitely. CRA's `yarn start` does not run the generator, so that workflow also lacks the production reading view and toggle.

**Follow-up:** Prefer shared content rendering or route-specific content output over fetching a whole second page. If retaining this approach, check status and the returned page identity, preserve useful content during loading, and provide a retry/open-page fallback. Make the production-like preview command explicit in the README and development workflow.

**Acceptance:** Exercise slow responses, an offline request, a non-200 response, and HTML without the expected content container. No permanent loading placeholder or silent substitution of homepage content; the desktop remains usable.

### F6 — P2: Coordinate playback across presentations

**Evidence:** Reading mode hides the desktop with CSS; it still mounts Winamp and its visualizer. The native `<audio>` element and Webamp are independent, and mode switching does not pause either. Consequently, hidden playback or competing players is a source-level risk; simultaneous playback was not exercised in this review. New Winamp play requests also have no visitor-facing loading/error feedback.

**Follow-up:** Define one active playback owner. Pause or deliberately transfer playback on a mode change, and pause the previous player before starting another. Initialize heavy desktop apps only when the chosen presentation needs them, preserving their startup windows when entering the desktop. Provide a useful missing-file or failed-playback state with the external listening link still available.

**Acceptance:** Test native audio → desktop, Winamp → reading, repeated release selection, Winamp closed/minimized, initialization delays, and rejected playback. There should be one audible recording and visible controls for it. Repeat in development StrictMode without removing existing lifecycle guards.

### F7 — P2: Give published pages a dependable media delivery path

**Evidence:** Both public release records in [src/content/site.js](../../src/content/site.js) use WAV URLs. The local `bruises` file is approximately 100 MiB; the local `anii 2000` file is missing. Songs are intentionally gitignored and mounted separately in Docker, so this does **not** establish a production outage.

**Follow-up:** Verify both published files in the deployment media mount. Add compressed web playback versions and point public playback at them while retaining masters in the existing storage workflow. Centralize release-to-playlist mapping so changing a URL cannot silently break Winamp selection. Keep `preload="none"` for native audio and inspect actual network loading before choosing further optimizations.

**Acceptance:** Both releases play from a production-like media mount, seek correctly, and fail gracefully with an empty mount. Verify content type and range responses. Record transferred bytes and time to first audio on a throttled connection; do not infer those from file size alone.

### F8 — P2: Make public notes understandable and keyboard usable

**Evidence:** The XP [HeaderRenderer](../../src/WinXP/apps/Notepad/components/HeaderRenderer.js) renders sections as ASCII text inside a `div`, with `white-space: pre`. The newly added disclosure becomes one long unwrapped line; it was clipped horizontally even in the inspected desktop Notepad. Note descriptions exist in shared data but are not shown in Notepad. The reading renderer also omits the optional configured welcome title.

The existing [Notepad textarea](../../src/WinXP/apps/Notepad/index.js) is unlabeled and intercepts Tab to insert a character. This is inherited behavior that the new public routes now expose more directly; a keyboard escape path needs verification and documentation.

**Follow-up:** Preserve the monospace identity while rendering real headings, paragraphs, and lists. Keep decorative borders out of the accessibility tree. Wrap disclosures and long URLs independently of the textarea's Word Wrap setting. Show the same introduction in both modes. Label the scratchpad, explain that edits are temporary, and provide a standard keyboard exit if Tab insertion remains.

**Acceptance:** A keyboard visitor can enter and leave every control, discover note sections through headings, read the full disclosure, and reach every resource at phone width. Compare substantive text and destinations across modes. See [W3C keyboard guidance](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html).

## Proposed XP design direction

The current music views use a blue hero, orange divider, floating cards, and flat rectangular calls to action. They suggest the XP palette, but their proportions and controls read as a separate modern site inside IE. The reading view adds another visual system: a centered white card, hard blue shadow, and plain navigation.

Use one small content design system based on the existing desktop. The website content can feel like a personal early-2000s homepage; XP should be clearest in the surrounding controls, task panes, borders, and icons. Keep content readable instead of reducing all text to operating-system label size.

### D1 — P2: Share the visual primitives between both renderers

| Element | Proposed treatment |
| --- | --- |
| Application chrome | Retain existing Luna title bars, beige toolbars, and status bars. In reading view, use a lightweight static XP frame; include only controls that work. |
| Content surface | White document area, warm `#ece9d8` control surfaces, restrained blue task-pane headers, and thin inset/outset borders. |
| Typography | Tahoma for navigation and controls; roughly 14–16 px readable content, 20–24 px page headings, Lucida Console for note identity and technical snippets. |
| Buttons | Reuse XP border, bevel, hover, pressed, disabled, and focus treatments. Style external listening anchors as buttons while retaining link semantics. |
| Icons | Reuse existing 16/32 px bitmap folder, document, and music assets where appropriate. Replace the generic CSS disc with actual artwork or a neutral XP audio-file icon. |
| Spacing | Use a small consistent spacing scale and compact rows. Reserve more padding for reading text, rather than repeating large hero/card gutters. |
| Links | Ordinary text links stay visibly underlined, with a visited state. Distinguish external services from opening a local application. |

Extract tokens and content styles into shared build-consumable assets. Currently the generator embeds a large CSS string while IE separately defines related styles in styled-components. Shared data is a good start, but separate markup and styling still drift. Shared presentational components or partials should avoid importing browser-only desktop modules.

**Acceptance:** Review the same release and note side by side in desktop and reading mode. Buttons, typography, section headings, and link treatments should agree, with intentional differences limited to their surrounding presentation.

### D2 — P2: Make the catalogue feel like an XP music folder

Use a compact header with a music-folder icon, “Music by reshra,” and a short introduction. Below it, use file-style release rows: artwork/icon, title, one sentence, external listening link, and release-details link. An optional left task pane can hold “Music tasks” and navigation when there is enough space.

The default IE window is only about 550 px wide. Use its **available content width**, not just the browser viewport, to decide whether a task pane fits. A resized narrow window should receive the same stacked layout as a phone. Avoid a mandatory sidebar or tiny multi-column details table for a two-release catalogue.

**Acceptance:** Both releases and their actions are easy to compare in the default IE window. At 320 px, release names and actions remain readable without a tall decorative banner consuming the first screen.

### D3 — P2: Give release pages a clear listening hierarchy

Suggested content order:

1. Breadcrumb: Home → Music → release title.
2. Artwork or audio-file icon, release title, artist, and an accurate short description.
3. Primary link: **Listen on music services**. Secondary action: **Play in Winamp** in desktop mode, or labeled native playback in reading mode.
4. Confirmed release information, then project resources such as Guitar Hero files.
5. Related release and a clear route back to all music.

“Listen now” currently leads to a service-selection page, whereas “Play in Winamp” starts local playback. Naming those outcomes explicitly makes the choice easier. Where practical, indicate that external services open in another tab. Give playback an in-progress/success/error state so pressing it does not feel unresponsive while Winamp initializes.

The current metadata placeholders are intentional. Fill them with approved artwork, dates, credits, and artist copy when available; omit empty sections and invented release details. Avoid replacing the personal homepage with a large promotional hero.

### D4 — P2: Add consistent navigation and a better mode control

Every public content view should expose **Home, Music, Notes**, a current-page indication, and the mode switch. `/music` and `/notes` currently lack that shared navigation inside IE; relying on a simulated Back/Home toolbar makes the content harder to explore.

Give the reading switch an XP button treatment and a stable location in the shared shell. The current fixed bottom-right button uses an extremely high z-index and can overlap content. On narrow screens, put it in normal flow or a compact toolbar with sufficient reserved space.

Name the IE window for its current content, for example “bruises — Internet Explorer.” On an intentional route change, expose the requested window and move keyboard focus to an appropriate heading or document container. Preserve unrelated desktop state and avoid announcing background window activity as navigation.

### D5 — P2: Preserve nostalgia while improving input access

- Keep a single clear main content landmark for the active public page and provide a skip link. Chrome found no visible `main` on the music desktop view; the static one is hidden.
- Use native buttons for functional toolbar actions. Label icon-only controls and make unavailable actions genuinely disabled. This is especially relevant to the existing IE toolbar's clickable `div` elements.
- Use visible keyboard focus, adequate contrast, and larger hit areas on touch screens. Aim for 44 px touch controls where space permits; WCAG 2.2's minimum criterion is 24 px with defined exceptions, not a blanket 44 px requirement. See [W3C target-size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).
- Respect reduced motion for marquee/globe decoration and keep decorative counters out of live announcements. Offer an ordinary pointer option if the sword cursor makes precise selection difficult.
- Keep the planned mobile XP presentation, with the requested content prominent and other apps reachable from the taskbar. A visitor should not need to drag a window to reach a release's primary action.

## SEO and delivery follow-ups

### S1 — P2: Strengthen confirmed artist and release content

The homepage bio is still “Links, projects, and notes.” Add an approved sentence identifying reshra as the artist and describing the music in their own words. Expand release copy only with verified facts that help someone decide to listen. Add artwork with explicit dimensions and use appropriate social images; both releases currently fall back to the profile portrait.

Keep each release's artist entity understandable when that page is read alone. Consider including the named artist definition alongside `MusicRecording`, and validate actual schema relationships rather than only successful JSON parsing. These are content and clarity improvements, not guarantees of a particular search display.

### S2 — P2: Turn verification into a repeatable gate

[scripts/verify-pages.js](../../scripts/verify-pages.js) checks useful static strings, but it cannot detect the scrolling, hidden-toggle, stale-head, or window-focus defects above. Its JSON-LD check validates parsing and `@context`, not full schema correctness.

Add a small browser smoke suite around those visitor journeys, and a production-like nginx status check. Keep these outcome-focused: assert what visitors can read, activate, and navigate to. Include JavaScript-disabled output, content/link parity, one missing-media case, and a failed reading-content request.

Run generation and the SEO assertions in the normal CI/release gate. `yarn lint` currently targets only `src`; generator and verification scripts also merit syntax/lint coverage. Document that CRA's suggested `serve -s build` fallback does not prove nginx's unknown-path 404 behavior.

### S3 — Deployment gate: Verify the effective public responses

Use the existing [SEO evaluation](evaluation.md) checklist after deployment. Record raw and rendered evidence for a home, release, and note URL; preferred-host and HTTPS redirects; correct discovery-file content types; missing assets and unknown content returning 404; and updated HTML reaching visitors through Cloudflare.

Also check `.html` aliases and trailing slashes, choosing either a deliberate redirect to the clean URL or a documented canonical policy. Verify media availability on the actual mount. Confirm that Cloudflare's effective robots and bot rules preserve the already-approved search/training policy; this review proposes no policy change.

The legacy `now-build` script bypasses generation and `now.json` still rewrites unknown paths to the homepage. Since Docker/nginx is the intended target, explicitly mark the legacy deployment unsupported or bring it into parity if it remains in use.

### S4 — P2: Measure useful listening actions consistently

[useGA.js](../../src/hooks/useGA.js) relies on GA4 Enhanced Measurement for history page views. Verify that setting in the actual property and use DebugView to check initial loads, internal navigation, Back/Forward, and mode changes. Decide whether a presentation-only switch should count as another page view before comparing results.

External `music_listen_click` events exist, but Winamp and native playback are not represented by the same listening funnel. Add distinct playback-request and playback-start events, including release, player, and presentation/source. Keep external clicks separate from successful local starts, and ensure one action is not double-counted by overlapping listeners. Compare these outcomes with the planned search baseline after deployment.

## Addendum: YouTube, GA4 account setup, and wider improvements

Added 27 October 2026 after inspecting the public [reshra channel](https://www.youtube.com/@reshra/videos). Channel upload metadata was retrieved directly from YouTube; the three anii 2000 titles and channel ownership were also checked through YouTube's oEmbed endpoint. Public availability can change, and actual embedded playback still needs testing.

### V1 — P2: Add one official YouTube video to each song page

This would give visitors a familiar way to hear the music without depending on the site's large WAV files. Keep Winamp as an optional part of the desktop experience, alongside external music-service links. Choose one main video per song; show alternate versions as labeled links rather than loading multiple players.

| Existing song page | Proposed main video | Other versions / remaining input |
| --- | --- | --- |
| `/music/anii-2000` | [Official Visualizer](https://www.youtube.com/watch?v=V0aUEGCaFjk) — `V0aUEGCaFjk` | [Official Lyric Video](https://www.youtube.com/watch?v=Wbu7dbqYGY0), [Guitar Hero Playthrough Visualizer](https://www.youtube.com/watch?v=9mNxrLwROfs). The lyric video could be the primary version instead. |
| `/music/bruises` | Video URL pending | No matching video was found in the public uploads retrieved. An unlisted or scheduled video may still exist; supply its watch URL when ready. |

Add optional video metadata to the release record in `src/content/site.js`, starting with a validated video ID and title. Keep video upload dates separate from music release dates. Use the same record for the generated HTML, desktop view, and structured data. Do not perform a YouTube channel lookup on every visitor's page load or automatically publish every channel upload as a release.

**XP presentation:** Put the player in a white inset panel labeled “Music video,” with a small film/media icon and a “Watch on YouTube” link below it. Style the surrounding panel and controls; retain the standard YouTube player and its unobscured controls. On the song page, place it close to the title and listening actions so visitors can find it immediately.

**Playback and layout requirements:**

- No autoplay on page entry. Retain keyboard controls, fullscreen, a descriptive iframe title, and mobile inline playback.
- Reserve the player's space to avoid layout shifts. Use a responsive layout with a minimum 200 × 200 px player viewport; a strict 16:9 ratio alone would make the player too short on narrow screens. Show the direct watch link if a resized pane cannot accommodate the minimum.
- Prefer the `youtube-nocookie.com` embed domain for YouTube's privacy-enhanced mode. This changes personalization behavior; it is not a promise that the player makes no network requests or collects no data. See [YouTube's embed guidance](https://support.google.com/youtube/answer/171780?hl=en).
- Use `enablejsapi=1` and the actual site's `origin` when controlling playback through the IFrame API. Preserve an HTTP Referer; a blanket `no-referrer` iframe policy can cause YouTube error 153. See the [player parameters](https://developers.google.com/youtube/player_parameters) and [embedding guidance](https://support.google.com/youtube/answer/171780?hl=en).
- Extend F6's playback coordinator to include YouTube. Starting a video pauses Winamp/native audio; starting local audio pauses the video. A mode switch must not leave a hidden player running. Avoid mounting separate active players in the static and desktop trees.
- Keep an ordinary watch link available when embedding is disabled, playback is restricted, JavaScript is unavailable, or a blocker prevents the player from loading. Missing video metadata should simply omit the player.

**Performance versus video discovery:** A click-to-load thumbnail is a useful performance option, but Google says not to require a click to load a video that should be discoverable. For a prominent, indexable music video, render a normal iframe in the active page and check the rendered result in URL Inspection. Lazy-load secondary/offscreen embeds where appropriate; do not advertise a click-gated player as equivalent for video discovery. Add accurate `VideoObject` metadata when its title, thumbnail, and upload date are known, linked to the release's `MusicRecording`. Video-specific search features depend on the page meeting watch-page criteria; adding an embed to a release page does not guarantee them. [Google video guidance](https://developers.google.com/search/docs/appearance/video).

**Acceptance:** Verify the intended recording in both modes at desktop and phone sizes, keyboard access into and out of the iframe, fullscreen, no autoplay, a blocked/unavailable video, and all transitions among YouTube, Winamp, and native audio. Confirm only one player is audible and that returning to another mode does not restart playback unexpectedly.

### V2 — P2: Extend the catalogue beyond current releases

The requested scope now includes older songs, expanding the original two-page milestone into a fuller archive. The channel exposes the following official video candidates. Confirm missing release details and preferred videos as content is added. Keep drafts clearly labeled and separate from released music. Each song can also have a blog post with its story or release context, linked to its evergreen listening page; see [blog plan](../blog-plan.md).

| Song | Video found on the channel |
| --- | --- |
| forever | [Official Visualizer](https://www.youtube.com/watch?v=hsTri1x-pEE) |
| oh, doamne | [Official Visualizer](https://www.youtube.com/watch?v=DVcsbZbeAFg) |
| somn | [Official Visualizer](https://www.youtube.com/watch?v=LmNphSW-lpo) |
| minimal | [Official Visualizer](https://www.youtube.com/watch?v=W60LQyHnwvM) |
| phantom | [Official Visualizer](https://www.youtube.com/watch?v=n0h8LX_wvA8) |
| muzica | [Official Video](https://www.youtube.com/watch?v=1ZsxDTzM4jk) |
| vise | [Official Video](https://www.youtube.com/watch?v=CudDHVhmgLw) |
| down | [Official Video](https://www.youtube.com/watch?v=H1dNPvf6fP4) |

### A1 — GA4 account access: Current capability and boundary

No authenticated GA4 account connection was available during this review, and no account settings were read or changed. Integration discovery found **Windsor.ai**, available but not connected, for GA4/Search Console/YouTube reporting. Its advertised GA4 access is for reporting; it does not provide the property-configuration writes needed for this setup. Connecting it would help analyze results, but would not finish GA4 administration.

Direct configuration is possible through Google's authenticated [Analytics Admin API](https://developers.google.com/analytics/devguides/config/admin/v1/rest), using an identity with sufficient access to the intended property. Before applying anything, identify the exact property and web stream, match them to the site's measurement ID, inspect existing settings, and prepare only the required changes. An authorized Admin API connection is the missing prerequisite; a public measurement ID alone does not grant account access. Relevant property changes generally require Editor or higher permissions. [Google's custom-dimension instructions](https://support.google.com/analytics/answer/14239696?hl=en).

Site instrumentation and account configuration are separate tasks. `useGA.js` can send correctly named events, but adding those calls does not create custom definitions or configure key events in the property.

### A2 — P2: Concrete GA4 setup to apply once access is available

| Area | Proposed target | Validation |
| --- | --- | --- |
| Page views | One `page_view` on initial load and each content-path change, including Back/Forward. Treat a presentation-only switch as `view_mode_change`, not another content view. Choose one owner for automatic/history or manual page views and disable the competing mechanism. | In DebugView, `/` → `/music` → release produces three page views, with current titles and locations. A mode toggle adds no page view. Repeat in development StrictMode. |
| External listening | Retain `music_listen_click` for intentional music-service clicks; label which release and placement caused them. | One event per click from homepage, catalogue, release, and reading view. An outbound click is not proof of a stream on Spotify or another platform. |
| Local playback | Add `music_play_request` for intent and `music_play_start` only after successful Winamp/native playback, with `release`, `player`, and `view_mode`. | Failed playback produces no successful-start event. Repeated callbacks do not duplicate a single start. |
| YouTube engagement | Enable and verify Enhanced Measurement's video engagement for JS-API-enabled embeds: `video_start`, `video_progress`, and `video_complete`. | Test a dynamically inserted embed in DebugView. If automatic collection is unreliable, use one controlled IFrame API event implementation and disable overlapping automatic video tracking. |
| Custom definitions | Register only needed event-scoped parameters: `release`, `player`, `view_mode`, and `placement`. Reuse built-in video dimensions for video URL/title/provider. | Match exact parameter names sent by the code; first verify events are arriving. Map automatic video's `video_url` to a release rather than assuming it includes the custom release parameter. |
| Key events | Use `music_listen_click` and successful local `music_play_start` as distinct initial outcomes, after checking their implementation. Keep video starts/progress as engagement first. | Verify counts before marking events as key events. Do not equate a player loading with someone listening, or add both requests and starts into a single “listeners” total. |
| Reports | Compare landing page and acquisition source with release clicks, local starts, and video engagement; split desktop/reading mode where custom context is available. | Preserve a pre-change baseline and compare complete reporting periods. Avoid adding outbound-click counts to playback-start counts as if they were distinct people. |

For event parameters, send release slugs and controlled context values, never scratchpad text or newsletter form contents. Register definitions early in the rollout; Google notes that new custom-dimension reporting takes time to appear. [Custom-dimension guidance](https://support.google.com/analytics/answer/14240153?hl=en).

Automatic video events apply to supported YouTube embeds with JavaScript API support; they are not guaranteed merely because an iframe exists. Keep their verification separate from local-audio instrumentation. [Enhanced Measurement documentation](https://support.google.com/analytics/answer/9216061?hl=en), [SPA measurement guidance](https://developers.google.com/analytics/devguides/collection/ga4/single-page-applications).

The account change report should record the selected property/stream, settings before and after, dimensions and key events created or reused, and DebugView evidence. Do not create a replacement property simply because an existing configuration is unclear.

### G1 — P1: Distinguish pre-release and released music

On 27 October 2026, the configured [bruises HyperFollow destination](https://distrokid.com/hyperfollow/reshra/bruises) returned **“Available November 1, 2026”** and a Spotify pre-save action. The page was fetched directly to confirm this. This means the current “Listen now”/“published release” presentation can promise a different action from the destination at this date.

Add an explicit release state and destination label to the shared content record. Upcoming tracks can say “Pre-save” with a confirmed availability date; released tracks can say “Listen on music services.” A site-hosted preview or full recording can remain separately labeled if intentionally available. Verify the destination at launch and rebuild/redeploy when release state changes; a date passing does not update static HTML by itself. Do not automatically derive a YouTube upload date or streaming availability from the music release date.

### G2 — P2: Connect the project notes to reshra's own demonstrations

The channel provides original material that can make the existing notes more useful than bare resource lists:

- MIDI Pedal note: [Building a Custom Pedalino Mini 6 MIDI Controller](https://www.youtube.com/watch?v=xHmpTT-fVG4).
- NAM note: [Vox AC15 capture, Part 1](https://www.youtube.com/watch?v=Ies6tZhKJwk) and [comparison, Part 2](https://www.youtube.com/watch?v=axaDts9Rjeg).
- Guitar Parts note: [Harley Benton JA-25th transformation](https://www.youtube.com/watch?v=cL6FpPPRb8k).

Add a short personal explanation, the relevant tutorial link, and what each parts/resource list supports. Pair the reference note with a fuller blog tutorial when it adds a distinct explanation, using the transcript-grounded drafting workflow in [blog plan](../blog-plan.md). Start with links or one optional embed rather than loading a video for every section. For Romanian-language tutorials, label the language in English navigation. Link video descriptions back to the matching canonical article, note, or song page when updating the channel; these external edits have not been made.

### G3 — Later: Add useful artist context and small everyday conveniences

Prioritize an approved artist introduction, real artwork, and short song/project notes over decorative content. Optional lyrics, credits, or a story behind a recording can give its page substance when supplied by the artist. A small About/contact area could make collaborations easier without exposing an address the artist has not chosen to publish.

For everyday use, consider “Copy page link,” an explicit scratchpad save/download action, and a clear indication of whether text is temporary. Retain the single desktop session and existing note URLs. A small repeatable performance/accessibility check in CI will protect these improvements as more releases are added; compare measured results before selecting further optimizations.

## Suggested implementation batches

| Batch | Scope | Completion evidence |
| --- | --- | --- |
| 1. Repair the prototype | F1–F4, G1; minimal shared navigation and mode-control placement from D4 | Long notes scroll, both modes remain reachable, head metadata follows the route, Back exposes the right window, and release actions match availability. |
| 2. Unify the XP content design | D1–D3, D5, F8 | Catalogue, release, and note layouts reviewed at default IE size, resized narrow windows, 320/390 px, and zoom; keyboard checks pass. |
| 3. Make listening and loading dependable | F5–F7, V1, S4, A2 once account access exists | One intended recording per player, useful YouTube embeds, no permanent loading states or competing hidden players; media and event counts verified. |
| 4. Complete discovery evidence | S1–S3 | Confirmed content added, repeatable checks run, public edge responses recorded, and search baselines established. |
| 5. Build the blog and full archive | [Blog plan](../blog-plan.md), V2, G2 | A Myspace/Piczo-inspired blog works inside IE and at direct URLs; an older song and a transcript-grounded tutorial establish the format before expanding the catalogue. |

Implement the relevant regression checks from S2 alongside each batch. Release metadata and source transcripts can be collected in parallel with the usability repairs. The blog/archive is now a requested content direction, with its own rollout in the [blog plan](../blog-plan.md). G3 contains optional convenience work. Keep optional AI-specific exports and a framework migration below these concrete visitor improvements.

# Blog and SEO implementation status

## My Documents design, 30 October 2026

The approved My Documents design is now implemented locally in the shared
production templates. Blog, article, music, note and readable homepage views use
one XP frame, profile panel with social icons, folder rail and desktop control.
Articles keep source-video dates, thumbnails, embeds, chapters and resource links.
Music is an artwork view of the same articles; recording links, credits, alternate
videos, downloads and native/Winamp controls live inside those articles.

The comparison refinements restore note-file icons and article/category
breadcrumbs, keep the folder rail to its three main destinations, and match
the mockup's small listening buttons. All articles omit the source/copy-link
footer. Listening from reading view can open the requested recording directly
in Winamp; its one-time URL request is consumed after opening, and browser audio
remains available as a secondary option. The desktop reading control uses a book
icon to distinguish it from Notepad.

The 35 generated HTML routes now comprise 25 canonical pages and ten music URL
aliases. nginx sends aliases to their existing `/blog/...` articles with HTTP 301;
the preview server, static fallback documents and client navigation also resolve
them. Sitemap and RSS expose canonical content. No audio files, article prose,
source dates, note URLs or desktop window behavior were migrated.

Build, lint (five existing warnings), unit/content checks and nginx routing
checks pass. Browser checks cover shared reading/desktop navigation, phone widths,
200% text reflow, keyboard/touch scrolling, note scratchpad preservation, window
controls and missing-media fallbacks. Browser screenshots were visually reviewed.
Deployment is still manual; these changes have not been published.

Updated 28 October 2026. This tracks the full objective in [blog plan](blog-plan.md) and [SEO follow-ups](seo/followups.md). The user deployed the initial release on 28 October. Live browser/edge checks and GA activation with verified realtime ingestion and key events are complete. Homepage startup, default-WAV playback and proxy-redirect fixes are ready locally for the next manual deployment. Search-account inspection and Bing verification remain outstanding; see [release verification](release-verification.md).

## What is available

- `/blog` and its post URLs open a standalone Myspace/Piczo-inspired personal site. Ordinary navigation from Internet Explorer keeps the same content inside its existing XP window. Real links also support sharing and new tabs.
- The build generates **35 public pages**, including **10 recordings** and **13 blog entries**, category indexes, linked pagination, four existing note paths, and RSS. Published articles and recording release states are separate. Existing music and note URLs are preserved.
- Music pages contain official videos where available, confirmed credits, music-service links, and local playback alternatives. anii 2000 groups its visualizer, lyric video, Guitar Hero video, and files together. No public bruises video was found.
- Supplied covers, including anii 2000, now appear on song pages, music/blog archives and music articles, with matching share/schema images and Winamp artwork metadata. Draft tracks share the supplied draft cover. Optimized JPEG copies ship in the build.
- The initial project posts are factual companions to the MIDI-pedal, guitar-modding, and NAM videos, with chapters/resources where the original descriptions supplied them. Older music posts are short archive entries, not invented personal retrospectives. They should gain artist context when that is available.
- Shared semantic markup supplies the browser and generated HTML. Metadata, canonicals, article/video/artist schema, sitemap, and RSS come from the same records. Draft material is excluded from public output.
- Posts now live in `content/posts/*.md`, with `yarn post:new` for draft creation and live development updates. Shared page/blog templates and separate document/discovery templates replace the monolithic renderer. See the [authoring guide](content-authoring.md); all thirteen existing posts retain their prose, URLs, publication dates and related resources.
- As requested on 28 October, the twelve video-based posts use their main YouTube video's publication date, labeled **Video published**. The archive, category pages, adjacent-post links and RSS are ordered newest first. The bruises announcement has no source video and keeps its 27 October date; music release dates remain separate. Article edit metadata records the later archive update.

## Follow-up coverage

| Requirements | Local result | Remaining evidence or input |
| --- | --- | --- |
| F1–F4: scrolling, mode switch, metadata, history | Normal reading-page scrolling/reflow; taskbar reading control and standalone return; route-specific head updates; route changes restore/focus the matching IE or Notepad window while preserving other desktop state. | Verify representative deployed URLs after enhancement. |
| F5: reading-content failures | Replaced per-navigation HTML fetching with shared rendering, removing the failing-request/loading dependency. Unknown paths have a useful page and noindex metadata. A failed desktop bundle now preserves the requested article/song in reading view and provides a real reload retry. Recovery and continued content navigation are verified offline. | The origin and public edge must serve the generated 404 with HTTP 404. |
| F6, V1: playback ownership and videos | Native audio, Winamp and YouTube share a coordinator. Mode changes pause playback and remove inactive video frames. Playback requests, real starts, and errors have separate behavior. Winamp uses an empty imperative mount, with loading/errors shown in the song page; stale file checks cannot override a newer selection. Webamp's panel layout and centering are restored against a measured production reference. Milkdrop opens on supported GPUs with the built-in default preset and automatic randomization/cycling off; software WebGL and reduced-motion systems use the basic player. Track selection uses the actual Webamp track ID, including after reopening. | Regional/embed restrictions and blockers can vary; direct watch/listening links remain available. Other Milkdrop presets still depend on the bundled visualizer and have not all been tested. |
| F7: media delivery | Compressed nine available masters to 192 kbps MP3 without changing masters. Manifest maps releases to those files; native audio uses preload none. Local nginx range/type and throttled playback checks are provided. | Deploy `public/songs/web/` in the separate songs mount. The anii 2000 local master is missing, so its official video/services remain the available alternatives. Actual production media delivery is unverified. |
| F8, D1–D5: XP design and input | Shared XP controls, compact music-folder rows, clearer listening hierarchy, wrapped semantic notes/disclosures, labeled temporary scratchpad, standard Tab exit, save-text button, native toolbar/taskbar buttons, focus styles, reduced motion, responsive container layouts and selectable article text. Blog content uses an ordinary pointer inside IE; the profile retains its sword cursor. | Final visual/content approval belongs to the artist; no guestbook/comments service is included. |
| S1: artist and recording facts | Factual bio, named artist entity, official-video metadata and published credits. Video thumbnails are labeled as video imagery rather than cover artwork. | Approved artwork, original release dates, genre/bio wording and personal stories still need artist input; unknown fields are omitted. |
| S2: repeatable checks | Build now runs generation **and** generated-page assertions. Lint also checks scripts and standalone tool syntax. Browser and actual nginx checks are included; GitHub Actions runs lint, unit, build, browser and nginx checks on a fresh checkout with missing media. | The workflow is newly added and has not run on GitHub during this session. Successful media playback is additionally checked locally when the separately stored recordings exist. |
| S3: effective delivery | nginx serves extensionless generated pages, explicit root, real 404s, discovery MIME types, asset caching, www and trailing-slash redirects. HTML aliases redirect to clean paths before React starts. Legacy Vercel deployment is documented as unsupported. A pre-deployment public-response baseline is saved. | Deploy, purge stale edge discovery files, verify HTTP/HTTPS/host redirects, Cloudflare crawler rules and caches, and inspect indexing through Search Console/Bing. |
| S4, A1–A2: analytics | Site sends one page view per content-path change, separates mode changes, tracks external listening, actual native/Winamp starts and YouTube engagement, and excludes scratchpad text. The approved OAuth connection verified property 502513568 and stream 12074125440 against the existing measurement ID. Four missing reporting dimensions were created and read back. Legacy note parameters are preserved, and localhost/preview delivery is disabled by default. The CLI provides read-only planning, idempotent preparation, configuration readback, and staged activation with a live-version gate. | Automatic history/video collection remains enabled until manual deployment. Verify real deployed counts before marking the two new music key events. See [GA4 setup](analytics/setup.md) and [GA4 change report](analytics/change-report.md). |
| Historical metrics requested on 28 October | Created an offline dashboard, JSON snapshot, and 28 CSV tables covering legacy interactions, raw event names, pages, acquisition, daily trends and automatic outbound clicks. Recent/full-history views separate public hostnames from all-host data. Private generated data are excluded from Git and Docker. | Old capitalized events lack custom parameter values in the returned data. Saved GA Report Library screens cannot be created with the connected APIs; equivalent manual configurations are documented in [historical GA4 reports](analytics/reports.md). |
| G1: release availability | bruises is labeled upcoming with a pre-save for **1 November 2026**, based on the official destination inspected on 27 October. | Confirm availability, update its state/action and rebuild on release. This intentionally does not guess a release transition from the clock. |
| V2, G2 and blog rollout | Full identified public song archive, release/video companions, MIDI/guitar/NAM project links, related resources, categories, pagination, RSS, copy links, and direct/embedded presentations are implemented. On 28 October the user chose to keep the current description-based article draft for now. | Current concise companions explicitly identify their description/chapter basis. A detailed transcript-based tutorial is deferred by that user decision; no author review or transcript grounding is claimed. |
| G3: optional conveniences | Copy-post-link and scratchpad download are included. | Optional comments, guestbook, search, richer author notes and AI-specific exports remain future work, not launch requirements. |

## Requested desktop refinements, 28 October

- Restored the original **Noto Sans bold window title font**, now served locally with its SIL license and a Tahoma fallback. Removing the old Google import had unintentionally changed the title-bar fallback.
- Restored the original IE toolbar/address-bar icons, removed the duplicate toolbar Blog link, and restored **Done** in the status bar. Unsupported historical toolbar tools remain decorative. The editable address now matches the full browser URL, including query and fragment; submitting a supported local URL preserves both.
- Lowered IE's normal startup position from 90 px to 200 px on taller desktops so more of Minesweeper remains visible. Shorter screens use a smaller offset, and the initial height fits below it with room for the taskbar.
- Direct non-home desktop entry maximizes the target Notepad or IE window once. Internal launches use normal desktop window sizes; already-open windows keep their current sizes. Mobile auto-maximization and standalone direct blog entry remain supported.
- Restored master's native Webamp positioning and reparenting, removing the later DOM centering offset that restricted movement and confused viewport boundaries. Initialization waits until the lazy desktop mount is visible so Webamp measures its original placement correctly. The measured 1366×900 production reference still places the main player at **321, 243**; [content-sources/desktop-layout-baseline.json](../content-sources/desktop-layout-baseline.json) records it. Real dragging and shrinking to an 800 px viewport are verified with both basic and Milkdrop players. The floating Winamp status box remains removed; loading/errors stay within the song page. Milkdrop uses the default preset with automatic cycling/randomization off, and software WebGL/reduced-motion systems retain the basic player.
- Restyled the reading-view taskbar control with a document icon, blue Luna bevel, white label, and hover/pressed/focus states. The standalone **Open desktop view** button and desktop retry now include the Windows flag. On 28 October the user clarified that pausing playback when switching between Reading and Desktop views is acceptable, so that behavior remains in place.
- Corrected Webamp 2.2 track selection to use the selected playlist entry's ID. This preserves the requested recording and visible artist/title after reopening or reordering. Programmatic pauses now check playback state because Webamp otherwise toggles paused/stopped playback back on.
- Kept the notes' resource lists and existing URLs. Their related-article links already connect them to the blog. Moving complete resource sections into reviewed articles, with shorter Notepad launchers, is a possible later editorial change; it has not been done implicitly.

## Video sources and article draft

[content-sources/youtube.json](../content-sources/youtube.json) records retrieved official metadata and descriptions. [content-drafts/building-my-midi-pedal.md](../content-drafts/building-my-midi-pedal.md) is a longer AI-assisted **unpublished, unreviewed draft**, grounded in the creator's description, chapters and existing project note.

Public timedtext attempts returned empty bodies; the transcript-panel endpoint returned `FAILED_PRECONDITION`, including in an anonymous browser. No transcript text was obtained. A read-only local Premiere connection check on 28 October also timed out before any project/media could be inspected. The user then explicitly chose: **“Keep the current description-based draft for now.”** Further source/transcript retrieval is deferred. The draft stays unpublished and does not claim to summarize spoken instructions, explain unverified wiring, or have author approval. See [content-drafts/README.md](../content-drafts/README.md) for retrieval evidence and the claim-review boundary.

## Verification evidence

| Check | Result |
| --- | --- |
| `yarn.cmd build` | Passed: 35 pages, ten recordings, 13 RSS entries, internal links, metadata/schema assertions, draft exclusion and crawler policy. Video-based post dates are checked against the main video's saved metadata, with chronological archive/feed order and matching RSS timestamps. |
| `yarn.cmd lint` and tool syntax checks | Zero errors; five inherited warnings in untouched dropdown data/My Computer code. |
| `yarn.cmd test --watchAll=false --runInBand` | Six tests passed: playback ownership/StrictMode cleanup and public-host analytics gating, including localhost/lookalike rejection and explicit debug opt-in. |
| `yarn.cmd test:ga4` | Seventeen isolated API/authentication/report tests passed: read-only plans/discovery, unique stream selection, staged preparation/activation/key-event deferral, idempotency, live-version gate, preserved settings, readback, partial failures, scoped SDK wiring and sanitized errors. Simulated OAuth tests cover state/PKCE, safe credential storage and secret-free logs; report tests cover pagination, every public-host filter, raw case variants and CSV safety. These tests do not establish production ingestion. |
| Authenticated GA preparation and baseline | Real API calls verified the intended property/stream and four created dimensions. Historical reporting returned four views and 28 tables. Public-site history contains 349 page views; the all-host view contains 1,242, including 893 from localhost. See the separate change/report documents for dates and limitations. |
| Historical dashboard browser check | Passed report/scope switching, search, local CSV links, and 390 px reflow without JavaScript exceptions. |
| Production browser suite | Passed direct/embedded navigation; title/description/canonical/social/schema updates; Back reopening a closed IE; real Open full page/Ctrl-click tabs; 320/390 px reflow; doubled computed text sizes; keyboard footer access and native touch scrolling; Tab exit; preserved scratchpad state; mobile controls; all eight resize edges/corners; maximize/minimize/restore; native/Winamp playback; Winamp close/reopen and missing-media feedback. Added direct-entry maximization versus smaller internal note launches, full IE URL/status/original icons, locally loaded title font, and requested song title/release after reopening. No unhandled browser exceptions. |
| Development browser suite | Same journeys passed under React development StrictMode, including actual playback and the visible Winamp controls. |
| Forced empty songs mount | Passed the fresh-checkout/CI path: useful native/Winamp errors, no false playback-start events, and working player close/reopen controls. |
| Failed desktop bundle and offline navigation | Before the fix, deliberately blocked chunks produced a blank body and ChunkLoadError. After the fix, direct song entry and a blog-to-desktop switch retain the correct content/head, expose reading navigation, and avoid duplicate page views. Content navigation works with the network offline and a deliberately failed/malformed fetch stub. Restoring the chunks and activating the retry successfully reloads the desktop with campaign parameters/fragments preserved. This separate check is included in CI. |
| Live YouTube | Official player SDK handshake and actual playback passed, with `video_start`, native-audio takeover pausing the video, and removal of the previous iframe on mode change. This network-dependent run is separate from routine blocked-third-party QA. |
| Milkdrop startup | Separate `QA_VISUALIZER=1` check asserted the measured production startup coordinates (321, 243 at 1366×900), rendered the built-in default preset, played the requested recording with its metadata, and preserved player controls without exceptions. Uses real software WebGL with a simulated renderer label to enter the hardware branch; physical GPU compatibility is not established by that test. |
| Actual local nginx | All 35 generated routes and HTML-alias redirects passed, along with root/unknown/missing-asset statuses, discovery MIME types, www/trailing-slash redirects, preserved queries, and MP3 range/type checks. Docker was not used because its daemon was unavailable. |
| Worktree checks | `git diff --check` passed; new source/docs have no trailing whitespace. No generated build output, dependencies, audio masters or compressed audio are included in the changes. |

Direct blog entry requested only CRA's main entry bundle, approximately **78.27 kB gzip** in the current build; desktop/Webamp chunks remain deferred until desktop entry. This measures requested bundles, not a field Core Web Vitals result.

In the latest production-build playback run, native audio's play promise resolved in **428 ms** with a local preview throttled to 1 Mbps and 150 ms latency; playback then advanced. The whole native/Winamp lifecycle sequence received 6,553,600 MP3 bytes across its media requests, including restarts. Those bytes are not a single song's full size or a production transfer measurement. nginx independently returned HTTP 206 and 32 bytes for the requested MP3 range.

The user confirmed the initial release is live on 28 October; no deployment was performed by the agent. [Release verification](release-verification.md) records actual public responses, WAV availability, real event collection and GA realtime counts. The older [production baseline](../content-sources/production-baseline.json) remains historical evidence. GA activation and key-event marking have now been applied and read back. Search indexing has not been established. The small follow-up fixes remain local until the user deploys them manually.

## Next inputs and actions

The pre-commit review's findings **1, 3 and 5** are addressed: alias redirects exclude query strings from their path captures; desktop and reading mains use separate IDs so the skip link focuses visible content; manual YouTube events carry the verified `video_title`. Finding **2** is now addressed by restoring master's native Webamp movement/viewport coordinates, with dragging and viewport-shrink regression checks. Finding **4** (completed native-audio replay not sending another successful-start event) remains a follow-up.

1. Review the blog copy and unpublished MIDI draft. Keep the description-based draft as requested; transcript-based expansion is deferred.
2. Artwork is supplied. Add approved artist context, original release dates and a bruises video if available. The anii 2000 WAV exists in production but is still absent from the local checkout.
3. Use [historical GA4 reports](analytics/reports.md) as the pre-release event baseline. Keep the frozen snapshot; compare later periods using the same hostname scope and event definitions.
4. Manually deploy the tested startup/WAV-default/proxy-redirect follow-ups, then recheck those fixes publicly. WAV is the default; MP3 deployment is optional. GA activation and key-event marking are complete. Search Console sitemap/URL Inspection and Bing verification/submission still need account access or user confirmation.

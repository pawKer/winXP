# Content data foundation

Proposed and implemented locally on 30 October 2026. The content data migration
is complete; no CMS/admin UI, hosting, or deployment changes were added.

## Implementation status

All five phases below are implemented. Editable JSON records now live under
`content/`, alongside the existing Markdown posts. Machine-readable schemas and
source validation feed one ignored `src/content/generated/content.json` snapshot.
Generic note rendering replaces per-note React registrations; the homepage,
profile, shared layout copy/navigation, recordings, and playlist use that data.

Use [content authoring](content-authoring.md) for the current file contracts and
step-by-step workflows. The remaining sections preserve the reviewed plan and
its pre-migration inventory; paths described there as old sources may have been
removed or moved into `content/`.

Verification includes 18 content/compiler tests, six playback/analytics unit
tests, 17 GA tooling tests, production build/page validation, and browser journeys
in both production and development StrictMode. Lint/build retain five inherited
warnings in unchanged XP app files. The frozen migration audit confirms all four
notes, ten recordings, 13 playlist tracks, 35 routes, and normalized reading-page
DOM match the original content/design. Source compilation also passed with no
pre-existing generated snapshot.

Browser checks exposed and verified two related startup fixes: canonicalizing
the initial alias path preserves direct-entry maximization, and replayed
StrictMode effects restore Winamp focus without repeating playback/analytics.
No Webamp mount/lifecycle implementation was replaced. Local nginx execution was
not repeated because no nginx executable was available on PATH; existing nginx
redirect checks remain in CI. No deployment was performed.

The migration audit is historical: intentional future content edits can change
its frozen expectations. Normal authoring should pass `yarn content:validate`,
`yarn test:content`, and `yarn build`.

## Reviewed plan

Reviewed against the recording consolidation (`552b399`) and shared My Documents
design (`5f42ac1`) on 30 October 2026. The data-first approach and implementation
order still fit. The plan below incorporates the current canonical article
routes, shared layout, note browser, and derived archive/search behavior.

## Outcome and scope

Make routine publishing possible by editing Markdown and JSON files. Adding a
note, link, post, or music release should require no JavaScript imports, React
components, switch cases, or manual route registration. Existing code continues
to control rendering and desktop behavior.

Keep the client-only site, Git review workflow, reshra identity, XP appearance,
current URLs, analytics, and shared desktop/reading/static rendering. This work
creates a content contract that a future local editor could read and write.
Choosing or building that editor is a separate project.

Preserving URLs includes maintaining existing redirects: `/blog/<slug>` is now
the canonical public recording article; `/music/<slug>` is a legacy alias. Do not
reintroduce a separate evergreen recording page during the content migration.

## What the repository already supports

The inspected checkout has 13 published Markdown posts, four notes, ten music
release records, 15 video records, and three additional Winamp draft recordings.
These counts are migration baselines, not limits on future content.

### Posts: retain the existing authoring model

- Sources: `content/posts/*.md`, with YAML frontmatter; template at
  `content/templates/post.md`.
- `scripts/content/build.cjs` already validates published posts, compiles safe
  Markdown, resolves note/release/video references, and excludes drafts.
- `src/content/registry.js` already discovers routes, categories, pagination,
  and publication ordering. New posts do not need JavaScript registration.
- `src/content/posts.js` loads ignored, generated JSON. Preserve the distinction
  between editable source and build output.
- A post's `releaseId` attaches recording details to the article. `/music` is a
  cover-art view of published recording articles, not a second set of song pages.
  `registry.js` derives old-song redirects from these published relationships.
- Blog search in `templates/blog/feed.js` uses title, excerpt, and topics across
  all published posts within the selected category. Without a query it restores
  normal pagination. The entry labeled "Pinned to the top" is currently the
  newest post on the unfiltered first page, not a separate editorial pin field.

The work here is integration with the other content types and their validation,
not replacing the post system.

### Notes: structured content still depends on per-note code

- `src/content/site.js` supplies note IDs, titles, paths, and descriptions;
  `src/content/noteSections.js` supplies headings, links, and named actions.
- `src/WinXP/apps/notesConfig.js` maps each ID to a bespoke header component in
  `src/WinXP/apps/Notepad/headerComponents.js`.
- `HeaderRenderer.js` identifies a note through section-object identity. An
  unknown note has no registered header and can open without its document.
- `src/content/templates/notes.js` contains a hard-coded action-to-URL map.
  It currently sends `playMusic` to `/music` and `openGuitarParts` to the guitar
  note; an unknown action silently falls back to `/music`.
- Desktop shortcuts and routes are derived from notes. The current IE homepage
  also automatically lists notes, except `thankYou`. The earlier advice to
  manually register every note in the homepage list is now out of date.
- Notepad's textarea is a temporary scratchpad, separate from published content.
- The shared `templates/layout.js` renders a note-file list; `templates/index.js`
  chooses `midiPedal` as the initial `/notes` document, falling back to the first
  note. The initial selection should become a validated note reference in data.

### Links and profile: destinations and placement are mixed with rendering

- `src/content/site.js` contains the profile and social URLs. Some social URLs
  are repeated in the welcome note.
- `src/WinXP/apps/InternetExplorer/index.js` constructs homepage links using
  JSX icons, callbacks, literal text, special release lookups, and array order.
  Its first two releases are featured, with the first highlighted.
- `src/content/templates/home-index.js` independently features the first two
  releases; shared link helpers resolve recording links to their articles.
  Reading view has a different homepage layout and does not expose every XP
  action. Keep placement data separate from view-specific presentation.
- `templates/layout.js` now owns the shared My Documents masthead, sidebar,
  navigation, breadcrumbs, and footer across blog, music, notes, and reading
  homepage. `templates/blog/layout.js` is a compatibility wrapper. The new
  sidebar hard-codes profile copy and three social platforms rather than using
  the full profile list; its noticeboard selects an upcoming recording/article.
- Editorial archive text and metadata also live in `registry.js`,
  `templates/blog/feed.js`, `templates/music-index.js`, and `templates/index.js`.
  The active newsletter form URL is a constant in
  `InternetExplorer/NewsletterView.js`; `SubstackView.js` is not imported by the
  active IE component.

### Music: records are assembled through code and several files

- `src/content/catalogue.js` mixes full release objects, positional archive
  arrays, generated descriptions/filenames, and special cases such as `down-3`.
- Video records are already JSON in `src/content/videos.json`; catalogue code
  embeds resolved video objects into releases.
- `src/content/artwork.json` is an editable source-to-web-cover mapping used by
  `scripts/media/prepare-artwork.cjs`. `audioManifest.json` is generated by
  `scripts/media/prepare-audio.js` and records local preparation, not deployment.
- `src/WinXP/apps/Winamp/config.js` separately hard-codes release order and the
  three draft recording entries. The music grid now follows published article
  dates, with the first eligible upcoming recording featured separately.
- `templates/music.js` now renders the recording section within its article,
  including a generic Guitar Hero download label. Optional download labels can
  still become editable data, with this existing label as the default.
- Legacy aliases are emitted as nginx redirects and static redirect documents;
  sitemap generation excludes aliases. `schema.js` attaches MusicRecording and
  BlogPosting entities to the same canonical article without duplicate videos.

## Proposed editable files

Use UTF-8 JSON for structured records and retain Markdown with YAML frontmatter
for articles. One file per note/release makes individual changes easy to review
and gives a future editor a direct file to save. Use array order for ordered
lists; avoid maintaining both numeric positions and array order.

```text
content/
  posts/*.md                     Existing articles; keep filenames and fields
  notes/<slug>.json              Note metadata and structured sections
  releases/<slug>.json           Release metadata and media references
  site.json                      Profile, shared editorial copy and selections
  links.json                     Shared external destinations keyed by ID
  navigation.json                Ordered site navigation
  home.json                      Ordered homepage items and featured release IDs
  playlist.json                  Ordered release references and WIP recordings
  videos.json                    Existing video records, moved without rewrites
  artwork.json                   Existing editable artwork mapping
  templates/                     Post template plus note/release JSON examples
src/content/generated/
  content.json                   Proposed compiled public content snapshot
src/content/audioManifest.json   Existing generated media-preparation manifest
```

These locations are proposed. Existing filenames under `src/content/` can remain
as compatibility modules while their consumers migrate. No runtime filesystem
access, remote content fetch, database, or new CMS dependency is needed.

### Record contracts

- **Site:** profile name, handle, bio, avatar URL; ordered references to official
  profiles and the subset shown in the shared sidebar; editable shared
  masthead/tagline/footer and noticeboard copy; archive headings/descriptions;
  newsletter form destination; default note ID, initially `midiPedal`.
  Preserve the current sidebar summary as an explicit short bio or derive it
  from the main bio by an agreed rule, rather than leaving duplicated literal
  copy. Keep integration scripts, iframe behavior, styles, breadcrumb mechanics,
  social SVGs, and generic interface text in code. Keep the canonical origin as
  one validated configuration value, preserving its existing consumers.
- **Shared links:** stable ID and exact destination URL. Notes/profile/homepage
  entries can reference the same destination while retaining their own label,
  short display text, and affiliate flag. Allow an inline external URL for a
  one-off link; reject records that supply both URL and reference.
- **Notes:** existing stable `id`, explicit `path`, `title`, `description`,
  `status`, optional introductory text, ordered sections/items, and desktop/
  homepage visibility. Default icon/title behavior comes from the generic note
  adapter; permit a desktop title override. Keep structured sections for this
  migration rather than introducing another rich-text format.
- **Releases:** preserve the slug as the stable release ID used by existing
  `releaseId` references. Include title, description, explicit legacy path, publication
  `status`, `releaseStatus`, optional factual release date, duration in seconds,
  optional audio URL, artwork reference, main/alternate video IDs, credits,
  listening links, and optional downloads with editable labels. Retain a primary
  listening URL/label for current templates and analytics. Multiple service
  links may be optional; migrating existing records must not require new URLs.
  Derive the canonical article URL from its published post's `releaseId`; do not
  duplicate a canonical article path/title/body on the release. Retain existing
  release descriptions losslessly while the post excerpt remains article metadata.
- **Home:** ordered entries with stable IDs, title/subtitle overrides, a known
  icon key, highlight flag, and destination. Represent generated note/release
  groups as typed entries with a defined order, so a new visible note appears
  automatically. Store featured release IDs explicitly and share them between
  the desktop and reading homepage. Preserve each view's existing layout.
- **Playlist:** an ordered list of release references and explicitly public
  work-in-progress recordings. WIP records hold their own ID/title/artist/audio/
  duration/artwork data. A playlist reference resolves release metadata instead
  of duplicating it. Playlist order stays explicit; music archive order remains
  derived from article publication dates, with the upcoming feature separated.
- **Videos/artwork:** keep today's video IDs and factual dates. Preserve artwork
  source filename/web URL records, including the shared draft cover. Conversion
  sizes, FFmpeg flags, and audio format preference remain tooling/configuration.
- **Posts:** keep today's fields and date rules. `videoId`, `releaseId`, and
  `noteIds` reference the same stable entities used by other content.

Do not add an editable search index or a manually maintained music-article list.
Both are derived from published posts. Preserve the current latest-post feature
as a rule; a future explicit `pinnedPostId` is optional, not required by the
"Pinned" label. Likewise, preserve upcoming-release selection as a rule unless
explicit editorial control is wanted. If a noticeboard release override is
added, validate it against a published canonical article and keep it distinct
from homepage featured-release IDs and the blog's latest-post treatment.

Publication `status: draft|published` is separate from a release being
`upcoming|released`. Preserve public upcoming pages. Existing playlist recordings
labeled “drafts” are public works in progress, not private editorial drafts.
No date-based automatic publishing or automatic release-status changes.

### Destinations and actions

Replace per-item callbacks and note-specific action strings with a small typed
destination vocabulary. For example, a note item can target:

```json
{
  "id": "guitar-parts-link",
  "label": ">>> Open Guitar Parts.txt <<<",
  "target": { "type": "note", "id": "guitarParts" }
}
```

Supported targets should cover external URL/shared link, note ID, release slug,
post ID, known internal page path, and the existing Winamp/newsletter actions.
Use a fixed icon registry and action registry in code; JSON cannot contain JSX,
functions, imports, arbitrary script URLs, or executable HTML.

Resolve content references to canonical URLs in shared code. The desktop adapter
adds the existing note-opening, Winamp, and newsletter behavior. Static/reading
views receive useful links: `/music` for Winamp and the configured newsletter
form destination for newsletter. Keep normal `href` semantics, modifier-clicks,
external new tabs, affiliate disclosure, and analytics attributes.

A release target resolves directly to its canonical article, not through a
legacy alias. Preserve old aliases with query/fragment handling in the existing
server/static/client paths. Keep the article's `#listen` anchor and the explicit
`?view=desktop&play=<release>` playback action; a generic Winamp fallback does
not replace the existing action that opens and plays a specific recording.

Preserve the current welcome note's music-archive navigation when migrating
`playMusic`; do not turn it into a different interaction based on its old name.
Reject unknown targets instead of silently sending them to `/music`.

## Build and validation design

Extend the existing Node content compiler into an explicit sequence:

1. Read source JSON and Markdown metadata; discover IDs before resolving links.
2. Validate shapes, unique IDs/paths, references, placement order, and URLs.
3. Resolve entities and compile Markdown using the existing safe renderer.
4. Exclude editorial drafts and validate references from published content.
5. Write one deterministic public `content.json` snapshot only after the complete
   compilation succeeds. Keep generated files ignored and out of manual editing.

After published posts are known, derive release-to-article lookup, legacy
redirects, search input, and music-archive eligibility. Do not load the page
registry to obtain those relationships during source compilation.

Load that snapshot through thin `site.js`, `catalogue.js`, and `posts.js` adapters
to minimize consumer changes. Keep route construction in `registry.js` and HTML
rendering in templates. The compiler must not import those adapters or the page
registry to resolve references: that would create a generated-data dependency
cycle. Media preparation must read validated source release records so it can
run independently of an existing generated snapshot.

Validation requirements:

- Precise source filename and field errors; reject unknown fields and malformed
  types, duplicate JSON keys, invalid dates/durations, and unknown icons/actions.
- Unique IDs within each collection and unique public paths across all content,
  archives, categories, pagination, and reserved site routes.
- Preserve paths explicitly; title edits must not rename URLs. Use stable IDs for
  references, and report missing/deleted targets. Drafts may be incomplete, but
  published records cannot reference omitted draft entities.
- Allow at most one published canonical article with a given `releaseId`, so
  redirects and recording placement cannot depend on an ambiguous `.find()`.
  Other posts can link to that article normally. Release metadata can exist
  without a published article, but it must not produce a music archive entry,
  public article target, noticeboard feature, or dangling redirect. Playlist
  audio references can still resolve metadata without fabricating a page.
- Validate the default note and sidebar/featured selections against visible
  public entities. Draft/unpublished notes must be omitted from the shared file
  list and its counts, as well as routes, desktop shortcuts, and indexes.
- Validate targets embedded in Markdown as well as structured links. Support
  query strings/fragments and the existing root-relative URL conventions.
- Allow intended URL schemes only; validate local asset paths stay under the
  public asset root. Escape editorial strings in the existing HTML templates;
  keep raw article HTML disabled.
- Require committed public artwork/images when referenced. Missing gitignored
  audio masters must not break a normal checkout build; reserve local audio
  existence checks for explicit media/release verification.
- Keep WAV as the default. An audio-manifest entry must not enable MP3 by itself;
  retain the explicit `REACT_APP_PREFER_MP3` deployment choice.
- Verify ordered references exist and are not duplicated. Preserve deterministic
  discovery order for newly added notes and date order for music articles;
  playlist ordering is explicit.

Expose machine-readable schemas for the JSON records and reuse them in compiler
validation, with semantic checks for references/routes. Keep one field contract
for future tooling. Pin any schema-validator dependency in `yarn.lock`.

Extend `scripts/start.cjs` to watch every new collection for edits, additions,
and removals. Rebuild all dependent content together, retain the last complete
valid snapshot on edit errors, and avoid watching generated output as input.
Production builds fail on invalid public content. Preserve `yarn content:build`,
`yarn start`, `yarn build`, and `yarn post:new`; add a validation-only command.

## Implementation sequence

Each phase should be independently reviewable and preserve public behavior.

### 1. Contracts and migration baseline

Define schemas, default/required fields, destination types, visibility rules,
and editorial versus generated ownership. Capture existing routes, note text,
link destinations, release values, featured items, and both music orders.
Include canonical article relationships, legacy redirects, upcoming feature,
latest-post treatment, sidebar social subset, and initial note selection.
Preserve literal text/encoding during extraction; unrelated mojibake cleanup is
outside scope. Add validation fixtures and a normalized parity comparison.

**Complete when:** every existing record has a lossless representation and the
baseline makes accidental content/URL changes visible.

### 2. Generic notes as the first working slice

Move the four notes into JSON. Replace the header map and individual wrappers
with a single note renderer receiving `note`/`noteId` explicitly. Remove section
object-identity lookup. Update `notesConfig.js`, the `openNote` setup in
`src/WinXP/index.js`, and shared note templates to consume normalized records
and targets. Apply data-driven desktop/homepage visibility.
Update `templates/index.js` and `layout.js` for initial selection and the shared
file list, keeping the existing split-pane note browser intact.

**Complete when:** a fifth note can be added through one JSON file, then appears
in the notes index, desktop, applicable homepage group, direct URL, and generated
HTML without a component/import change. Notepad's scratchpad stays temporary.

### 3. Profile, links, and editorial site settings

Extract shared destinations, profile/social data, navigation, homepage groups,
featured release IDs, editorial metadata, and active newsletter destination.
Extract current shared-layout copy, sidebar social selections, and noticeboard
selection rules. Update IE, `templates/layout.js`, feed/music/note heading
templates, homepage rendering, `registry.js`, and structured-data
consumers to read normalized content. Keep the existing URL/configuration
consumers such as GA tooling working. Use generic icon/action adapters.

**Complete when:** changing an official social URL updates all its references;
adding/reordering a homepage link or changing featured releases requires only
data edits. Unused Substack code needs no new integration.

### 4. Release catalogue and playlist

Extract all ten releases as named JSON records, materializing today's generated
values and special URL cases exactly. Move video/artwork inputs and update both
media scripts. Extract playlist order and public WIP recordings; retain music
article date ordering. Adapt the recording-section renderer, `Winamp/config.js`,
compiler references, canonical article lookup, and direct JSON
consumers such as `scripts/verify-pages.js` and `scripts/test-browser.cjs`.
Keep `registry.js`, helpers, `scripts/generate-pages.js`,
`scripts/templates/document.cjs`, `scripts/templates/discovery.cjs`, and the
preview/nginx redirect consumers using the same derived aliases. Preserve the
article's combined recording/article schema and single video player.
Keep Webamp lifecycle and playback control code outside this refactor.

**Complete when:** adding a release, attaching known video/artwork, linking a
canonical published article, adding a labeled download, and selecting
playlist/featured placement need only data files. The new article is discoverable
in the blog and music views, and its old-style song path redirects correctly.
Missing optional video/artwork/audio are handled intentionally.

### 5. Complete the shared pipeline and authoring workflow

Consolidate compilation to the public snapshot, finish cross-content/draft/link
checks and all collection watchers, and remove superseded literal registries.
Keep compatibility adapters where they still simplify consumers. Expand
`docs/content-authoring.md` with exact edit/add/reorder/publish/media examples
and source/generated ownership. Update repository guidance to match.

**Complete when:** a clean checkout can validate/build all content and routine
authoring changes never require application code. A future editor only needs to
write the documented source files and invoke the same validator.

## Verification and acceptance

Use meaningful content/compiler tests for duplicate IDs/routes, broken targets,
publication boundaries, ordering, escaping, missing optional media, and watcher
add/remove behavior. Extend `yarn test:content`; run the existing appropriate
playback/analytics tests when their data contracts are touched. Run `yarn lint`,
`yarn build`, and `git diff --check` for the eventual implementation.

Perform disposable data-only authoring trials for a note, external/internal
homepage link, standalone post, release with a companion post, and public WIP
track. Exercise both a new category and an initially incomplete editorial draft.
Remove trial content before completing the migration.

Compare baseline content/paths and generated titles, canonicals, structured
data, sitemap, RSS, affiliate attributes, and analytics payloads. Verify direct
URLs and internal navigation in reading view and XP windows, note focus/dedup,
external/modifier clicks, homepage ordering, and narrow/mobile layouts. Use the
existing browser/nginx checks where applicable. For playlist migration verify
the requested title and actual playback, plus missing-song feedback and
StrictMode reopen behavior.

Retain the current design/consolidation tests for canonical recording articles,
alias exclusions from sitemap, combined schema without duplicate videos,
reading-to-Winamp playback, shared layout, note panes, and full-archive category
search. Add draft/duplicate-reference cases for these relationships. Verify
search clearing restores pagination, the latest-post feature remains correct,
and every shared layout uses the migrated profile/noticeboard data. Confirm
alias redirects preserve supported queries/fragments across nginx, preview,
static documents, and client navigation. CSS and component layout stay intact.

Plan-impact review on 30 October: `yarn.cmd test:content` passed all ten current
tests. This is focused content/rendering evidence; a full visual/browser or
deployment review was not needed for this documentation-only update.

Final acceptance: all four everyday operations—new note, new link, new post,
new release—are file edits with validation and preview. Their publication still
uses the existing manual Git/deployment workflow. Admin forms, authentication,
uploads, draft-preview UI, persistence of visitor scratchpads, and deployment
automation remain future work.

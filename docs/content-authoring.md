# Writing posts and editing templates

Blog posts live in [`content/posts/`](../content/posts/), one Markdown file per
post. No JavaScript registry needs editing when you add a post. The same content
and templates serve the standalone blog, Internet Explorer, and generated HTML.

## Create and preview a post

```sh
yarn post:new my-new-post
yarn start
```

Edit `content/posts/my-new-post.md`. Its filename becomes `/blog/my-new-post`;
keep it stable once published so saved links continue to work. The creation
command makes a draft and refuses to overwrite an existing file. You can also
copy [`content/templates/post.md`](../content/templates/post.md) manually.

The YAML header between the first two `---` lines describes the post. The rest
is ordinary Markdown:

```markdown
---
title: "A new studio project"
excerpt: "A short description for the archive and search results."
category: Projects
status: published
publishedAt: "2026-10-28"
---

## What I built

Write paragraphs, **bold text**, lists, tables, quotes and fenced code blocks.

Find the [parts and resources](/notes/guitar-parts).
```

Start body headings at `##`; the layout supplies the post's main title. Quote
header values containing colons. Use root-relative internal links such as
`/blog/my-other-post` or `/notes/guitar-parts`, rather than `.md` filenames.
External links open in a new tab. Images use normal Markdown syntax, for
example `![A useful description](/images/my-build.jpg)`; put that file in
`public/images/`. Raw HTML and pasted iframe embeds are escaped. The video
player is supplied by the template instead.

`yarn start` watches post edits, additions and removals. When you change a draft
to `status: published`, its direct URL and archive entries appear automatically.
Drafts are omitted from generated JSON, browser bundles, routes, sitemap and RSS.
There is no public draft preview yet: review the Markdown locally, or temporarily
publish it in your local checkout and revert the status before sharing a build.
The longer unreviewed MIDI-pedal material remains in `content-drafts/`.

Content errors name the offending file. Development keeps the last valid
content until the error is fixed; production builds fail on invalid published
posts. A missing status defaults to draft.

## Videos, dates and related resources

Music uses one public article per recording. Add `releaseId` to that article's
frontmatter to attach its cover, listening links, credits, alternate videos,
downloads, and local/Winamp playback options from the catalogue. `/music` is an
artwork view of these published articles; both archive views open `/blog/<slug>`.
Existing `/music/<slug>` URLs redirect to the corresponding article, preserving
queries. The generated `music-redirects.conf` supplies nginx's permanent redirects;
portable static HTML and client navigation provide fallback redirects.

For a video companion, add `videoId` using the YouTube ID from
[`src/content/videos.json`](../src/content/videos.json). The shared template
adds the player and uses that video's publication timestamp as the post date,
labeled "Video published". You can omit `publishedAt` for these posts. To date
an original article separately while still embedding a video, set
`dateSource: article` and supply `publishedAt`. `updatedAt` records a later edit;
it does not reorder the archive. Dates use `YYYY-MM-DD` or full ISO timestamps.

Song covers are mapped in `src/content/artwork.json`. Put originals in
`public/songs/` and run `yarn media:artwork` with FFmpeg available (or set
`FFMPEG_PATH`). This creates 800-pixel JPEG copies in `public/artwork/` for
song pages, music/blog archives, related articles and share metadata. Commit
these small web copies with the mapping; the originals stay local. The shared
draft entry supplies artwork metadata for all draft tracks in Winamp. Missing
song artwork falls back to the existing video thumbnail where available.

For a new video, first add its real title, publication timestamp and other
metadata to `videos.json`, following an existing entry. Do not invent metadata
or first-person claims from an unseen video. The current companions are based
on public descriptions and chapters, not transcripts.

Optional header fields:

| Field | Purpose |
| --- | --- |
| `id` | Stable internal identifier; defaults to the filename without `.md`. |
| `releaseId` | Song slug from `catalogue.js`; adds recording and listening links. |
| `noteIds: [guitarParts]` | Note IDs from `site.js`; adds files, parts and resource links. |
| `extraVideoIds: [anotherId]` | Other catalogue videos linked under "Continue watching". |
| `chapters: [[0, Intro], [90, Wiring]]` | Timed YouTube links; needs `videoId`. |
| `topics: [guitar, diy]` | Topic metadata for future filtering. |
| `sourceUrl` | Original source link; defaults to the selected video's URL. |
| `provenance` | A short, accurate explanation of the source material. |
| `author`, `language` | Default to `reshra` and `en`. |

Categories create their own archive URLs and sidebar links automatically.
For example, `category: Studio Diary` creates `/blog/category/studio-diary`.
Use consistent spelling and capitalization. Do not name posts `page.md` or
`category.md`; those paths are reserved for blog navigation.

## Templates and generation

| Location | Responsibility |
| --- | --- |
| `src/content/registry.js` | Public route list, categories, ordering and pagination. |
| `src/content/schema.js` | Structured data for songs, videos and posts. |
| `src/content/templates/index.js` | Page selection and note-pane composition. |
| `src/content/templates/layout.js` | Shared My Documents masthead, sidebar, navigation and footer. |
| `src/content/templates/blog/layout.js` | Compatibility wrapper around the shared layout. |
| `src/content/templates/blog/post.js` | Article layout, player and related resources. |
| `src/content/templates/blog/feed.js` | Archive feed and pagination. |
| `src/content/templates/blog/partials.js` | Article previews and pinned-entry thumbnails. |
| `src/content/templates/` | Music, note, homepage and shared partial templates. |
| `scripts/templates/document.cjs` | Full static HTML, metadata and 404 document. |
| `scripts/templates/discovery.cjs` | Sitemap, RSS and robots templates. |
| `scripts/content/build.cjs` | YAML validation and Markdown compilation. |
| `scripts/generate-pages.js` | Writes rendered pages and discovery files to `build/`. |

Templates are small JavaScript functions returning HTML, shared with the
browser to keep the embedded and static views consistent. The Markdown/YAML
parsers run only in Node, outside the browser bundle. `src/content/pages.js`
is the compatibility entry point; `src/content/posts.js` loads the compiled
data. Do not edit `src/content/generated/posts.json`: it is ignored and rebuilt
automatically. Notes and song catalogue data retain their existing formats.

Run `yarn test:content` for authoring/compiler checks, `yarn lint`, and
`yarn build` to compile posts and verify all generated pages, metadata and feeds.
Use `yarn preview` to inspect that production build. Adding a post requires the
normal manual deployment; editing Markdown does not publish the site by itself.

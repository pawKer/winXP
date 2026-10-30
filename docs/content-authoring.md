# Editing site content

Edit JSON and Markdown in `content/`. New posts, notes, and recordings need no
React components or route registration. Keep published IDs and URL paths stable.

## Preview and publish

```sh
yarn start                 # Preview; watches content changes
yarn content:validate      # Check files without writing output
yarn test:content          # Check the content pipeline
yarn build                # Build and verify the production site
yarn preview              # Preview that production build
```

Use `yarn.cmd` if PowerShell blocks `yarn.ps1`. Invalid edits report their source
file and leave the last valid preview running. Restart after changing compiler
or schema code. Commit and deploy through the [normal workflow](deployment.md).

`status: draft` excludes a post, note, or release from public content. Change it
to `published` when ready. There is no private draft-preview UI. Never edit the
generated `src/content/generated/content.json`.

## Profile, links, and homepage

- `content/site.json`: profile, sidebar socials, editorial copy, archive metadata,
  newsletter URL, and the notes browser's `defaultNoteId`.
- `content/links.json`: shared destinations. Updating an official social URL here
  updates its profile and note references.
- `content/home.json`: XP homepage entries, their order, icons, highlights, and
  `featuredReleaseIds`. Supported icons: `book`, `music`, `folder`, `mail`.
- `content/navigation.json`: shared navigation labels, paths, and order.

Reorder arrays to reorder links. Homepage `featuredReleases` and `notes` groups
expand automatically; reading view uses the same featured recording IDs in its
own layout. The blog features the latest article, and the noticeboard finds an
upcoming recording with a published article.

## Posts

Run `yarn post:new my-post`, then edit `content/posts/my-post.md`. Its filename
defines `/blog/my-post`. The [post template](../content/templates/post.md) includes
optional fields. A basic post starts with:

```markdown
---
title: "A studio project"
excerpt: "A short description for the archive and search results."
category: Projects
status: published
publishedAt: "2026-10-30"
---

## What I made

Write the article in Markdown.
```

Start body headings at `##`. Use root-relative links such as `/notes/guitar-parts`
and images such as `![Description](/images/build.jpg)` from `public/images/`.
Raw HTML and pasted iframe embeds are escaped. Categories create their archive
URLs automatically; `page` and `category` are reserved post filenames.

Useful frontmatter fields:

- `releaseId`: attach a recording's artwork, listening links, credits, and player.
- `noteIds: [guitarParts]`: add related resources.
- `videoId`, `extraVideoIds`, `chapters: [[0, Intro]]`: embed/link known videos.
- `topics`, `updatedAt`, `sourceUrl`, `provenance`, `author`, `language`: optional
  search, editorial, and source metadata.

A `videoId` uses that video's saved publication timestamp by default. To date
the article separately, set `dateSource: article` and `publishedAt`. `updatedAt`
does not reorder the archive. Use quoted ISO dates/timestamps and factual video
metadata from `content/videos.json`.

## Notes

Copy [note.json](../content/templates/note.json) to `content/notes/my-note.json`.
Set its stable ID, `/notes/...` path, title, description, sections, and status.
Published notes appear automatically in the notes browser, desktop, and homepage.

`desktop: false` or `homepage: false` hides that placement without unpublishing
the note. `desktopIconTitle` overrides its shortcut label. Optional numeric
`order` sorts notes first; unranked notes follow in filename order.

Each section contains ordered items with unique IDs and typed targets:

```json
{
  "id": "instagram",
  "displayText": "Instagram",
  "target": { "type": "link", "id": "instagram" }
}
```

Other targets are `external` with a `url`, `note`/`post`/`release` with an `id`,
or `page` with a `path`. App actions use `type: action` and `action: winamp` or
`newsletter`. Set `affiliate: true` on product links where appropriate.

Blog and notes-browser links show notes as web pages, inside IE on the desktop.
Desktop/homepage note shortcuts and ordinary direct URLs still open Notepad.
Its visitor scratchpad is temporary and does not edit published content.

## Recordings and playlists

1. Copy [release.json](../content/templates/release.json) to
   `content/releases/my-song.json`. Fill in its slug, title, description, duration
   in seconds, credits, and primary listening URL/label.
2. Add optional `trackUrl`, `artworkId`, `videoId`, `alternateVideoIds`,
   `releaseDate`, `downloads`, or `serviceLinks`. Downloads/service links use
   `{ "label": "...", "url": "..." }`.
3. Create a post with `releaseId: my-song` and publish both records. Only one
   published article may attach a recording. It appears at `/blog/<post-slug>`;
   the release's `/music/...` path redirects there.
4. Add its slug to homepage `featuredReleaseIds` if wanted. To play it in Winamp,
   add `{ "releaseId": "my-song" }` to `content/playlist.json`; this needs a
   `trackUrl`. Array order controls the playlist; article dates order the archive.

`releaseStatus: upcoming|released` is separate from editorial publication status.
Dates never publish content automatically. A release without a published article
can supply playlist metadata but cannot be a featured/public article target.

Public WIP playlist entries provide `id`, `title`, `artist`, `trackUrl`, `duration`,
and `artworkId`. These intentionally public recordings are distinct from private
editorial drafts.

## Media and detailed reference

Keep video metadata in `content/videos.json` and cover mappings in
`content/artwork.json`. Put artwork originals in `public/songs/`, run
`yarn media:artwork` with FFmpeg, and commit the small `public/artwork/` copies.
Referenced web images must exist before validation passes.

Audio stays in gitignored `public/songs/` and is deployed separately.
`yarn media:prepare` creates compressed copies and the generated audio manifest.
Missing local audio does not block a checkout build. WAV remains the default;
enable `REACT_APP_PREFER_MP3=true` only after deploying the compressed files.

Use the [JSON schemas](../content/schemas/content.schema.json) for complete
structured field definitions and the [data plan](content-data-plan.md) for
implementation details. Editorial research/drafts live in [editorial/](editorial/README.md),
outside publishable content. `yarn content:parity` is a historical migration audit;
intentional content or navigation changes can make its frozen baseline differ.

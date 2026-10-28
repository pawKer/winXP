# reshra's blog and music archive

Proposed 27 October 2026, following the review in [SEO follow-ups](seo/followups.md). The direct/embedded blog and archive are implemented locally; [implementation status](implementation-status.md) records current evidence, source limitations, and external work still required. The requirements below preserve the plan rather than declaring every acceptance gate complete.

## Direction

Build a blog inspired by early-2000s Myspace/Piczo personal sites. Link it from the profile in Internet Explorer, render it inside that window when browsing the desktop, and make the same content available as a standalone website at direct URLs.

Cover older music as well as current releases. Posts can introduce a song, tell its story, explain a tutorial, document guitar modifications or the MIDI pedal, or accompany another relevant video. Use AI to turn the artist's existing video material into useful article drafts, with factual review before publication.

This expands the initial SEO plan's two-song scope. The public channel inventory already provides eight additional official song-video candidates; see V2 in the follow-up document. Draft recordings can have clearly labeled work-in-progress posts if wanted, without being presented as released music.

## Page structure and entry behavior

| URL | Purpose | Entry behavior |
| --- | --- | --- |
| `/` | Personal XP desktop and profile | Keep the current desktop homepage; add a visible Blog link. |
| `/blog` | Latest posts, categories, and archive | Direct entry opens the standalone blog. Normal navigation from within the XP site displays it inside IE. |
| `/blog/<post-slug>` | One complete article | Shareable standalone page on direct entry; the same article component can render inside IE. |
| `/music` and `/music/<song-slug>` | Evergreen song catalogue and listening pages | Preserve existing paths and expand to the older published catalogue. |
| Existing `/notes/...` paths | Stable parts lists, mappings, downloads, and reference links | Preserve the current URLs and Notepad behavior; link to the relevant blog tutorial. |

Suggested posts include `/blog/anii-2000`, `/blog/building-my-midi-pedal`, `/blog/modding-my-harley-benton`, and `/blog/capturing-my-vox-ac15`. These are proposed new paths, not routes that exist today.

Use one reusable blog page and article renderer with two surrounding layouts: standalone and embedded. Keep content, article links, titles, canonicals, and analytics consistent. A shared URL identifies the article, not which window displays it.

Inside the desktop, ordinary clicks should preserve open windows and playback state. Real `href` links must still allow copying, opening in a new tab, and direct navigation; a newly opened blog URL should work independently. Use session navigation context or an explicit presentation preference for the shell, without changing the canonical article path. Do not recreate the entire desktop on every blog link click.

Direct blog pages must contain meaningful generated HTML before JavaScript runs. They should not need to initialize Minesweeper, Webamp, or the desktop to become readable. Avoid the existing eager desktop imports on that entry path, and verify the actual bundle requests after splitting the code.

## Content types and boundaries

| Content | What belongs in it | Related content |
| --- | --- | --- |
| Release post | Main video, introduction, confirmed release context, artist notes, credits, and listening links | Link to the song's evergreen `/music/...` page and any relevant production post. |
| Tutorial/build post | Goal, result, video, timestamped steps, parts/tools, files, decisions, and lessons learned | Link to the matching `/notes/...` resource list and related builds. |
| Video note | A useful explanation or commentary around another original video | Link to the source video and related music/projects. |
| Update | A short studio or project update with something concrete to share | Link to the release or project it concerns. |

Each song can have a release post, including older songs. Write older entries as retrospectives when appropriate. **Artist update, 28 October:** use the main YouTube video's publication date for video-based archive posts, label it "Video published", and order the archive/feed by that date. Keep the later article edit in `updatedAt`; posts without a video retain their own publication date. Track the original song release date independently.

Keep different pages useful for different reasons. A song page answers “What is this recording and where can I hear it?” A release post can answer “What went into it?” A resource note answers “Where are the files and parts?” Avoid publishing the identical summary under both `/music` and `/blog`; cross-link instead. If an article has little to add yet, keep its draft unpublished and make the song reachable through the catalogue in the meantime.

Group visualizer, lyric-video, and Guitar Hero versions within the same song/post context rather than automatically creating three near-identical articles. A separate Guitar Hero tutorial is useful when it explains a distinct activity or supplies project files.

## Visual design

Give the blog its own personal-homepage identity inside the XP environment. The outer IE window remains Luna-themed; the page inside it can use the user's Myspace/Piczo references more freely.

| Area | Proposed treatment |
| --- | --- |
| Masthead | “reshra's corner of the web” or another artist-chosen title; custom artwork, a small badge, and compact navigation. |
| Background | A restrained tiled texture or artist graphic around a readable central page. Reuse reshra's visual identity where it works. |
| Profile sidebar | Avatar, short bio, social links, topic links, and a compact archive. Clearly separate site navigation from external profiles. |
| Feed | Boxed post previews with a title, real date, category, short excerpt, optional thumbnail, and “Read post.” |
| Article | A clear title, date/category, short introduction, main media, body sections, related notes, and previous/next links. |
| Details | Thin borders, small bitmap icons, stickers/badges, underlined links, and a few expressive colors. Decorative elements should not look like functional controls. |
| Reading | Legible text, generous line height, a moderate line length, and a quieter article background even when the surrounding page is decorative. |

Suggested desktop arrangement:

```text
+------------------------------------------------------+
| reshra's corner of the web        Music | Blog | Notes |
+---------------+--------------------------------------+
| avatar + bio  | latest posts                         |
| official     | [release] anii 2000                   |
| profiles     | excerpt + thumbnail + read post       |
|              |                                      |
| categories   | [build] My MIDI pedal                 |
| archive      | excerpt + thumbnail + read post       |
+---------------+--------------------------------------+
```

The default IE window is around 550 px wide, so a two-column layout must be conditional on the **available container width**. At narrow window sizes and on phones, move the profile/navigation into a compact section above or below a single-column feed. Keep categories and the main reading area reachable without sideways scrolling.

Borrow the atmosphere of personal sites while keeping modern input behavior: visible focus, meaningful headings, real buttons and links, readable contrast, touch-sized targets, and reduced-motion support. Keep decorative audio off by default. Any guestbook/comments feature is a separate later feature requiring storage and moderation; it is unnecessary for the first blog.

## AI-assisted video-to-article workflow

AI can help structure and summarize this material because it is based on the artist's own work. The useful output is a written companion that saves viewers time and supplies project details they can refer back to. Google recommends accuracy, quality, relevance, and review of AI-generated text and metadata. [Google's AI-content guidance](https://developers.google.com/search/docs/fundamentals/using-gen-ai-content).

1. **Collect sources.** Use the actual captions/transcript, video description, timestamped chapters, and existing project notes. Obtain the source recording when captions are missing. Keep the source video ID and language with the working material.
2. **Extract grounded notes.** Identify the demonstrated outcome, mentioned tools/parts, decisions, steps, limitations, and relevant timestamps. Keep unclear names or numbers marked as unknown.
3. **Review visual information.** Diagrams, wiring, on-screen code, settings, and comparisons may not appear in speech. Inspect the relevant frames or ask for the original diagrams/files before describing those details.
4. **Generate a structured draft.** Produce an introduction, useful summary, sections/steps, resource links, and a suggested excerpt. Tie technical claims and chapter links to the supplied sources. Preserve the difference between what the artist demonstrated and any later editorial advice.
5. **Review as the author.** Correct transcription, names, values, and links; add personal context that the source does not contain. Only use first-person claims that reflect the artist's actual words or supplied notes. Review the title, description, and structured data too.
6. **Publish saved content.** Store the reviewed article in the repository and generate its HTML at build time. Readers should not wait for an AI call, and a rebuild should not silently rewrite the published text.

YouTube Studio subtitle exports or an authorized owner workflow can supply transcripts. Public video metadata alone is insufficient for a reliable summary. The official captions-download API requires authorization and permission to edit the video; a public channel URL does not provide that permission. [YouTube captions API](https://developers.google.com/youtube/data/reference/rest/v3/captions/download).

For English pages based on Romanian tutorials, preserve the source language in the metadata, translate the explanation carefully, and leave code identifiers and part names intact. Add separately indexed Romanian versions only when there is reviewed content for both languages; they would need their own stable URLs and language relationships.

For music videos, a transcript may only contain lyrics or no speech. AI must not invent a song's meaning, production process, equipment, collaborators, release date, or personal backstory from the title or visuals. Use artist-supplied notes and verified metadata instead. The music page can be concise when that is all the confirmed material available.

Suggested generation instruction:

> Draft a written companion to this video using only the supplied transcript, timestamped visual notes, description, and project resources. State the result and organize the explanation around what a reader can learn or do. Preserve exact names and values where verified. Attach source timestamps to technical steps. Mark missing information for review; do not invent facts, personal experiences, dates, or quotations. Return the article, a short excerpt, and a separate list of claims that need checking.

Where useful to readers, identify a piece as adapted from the linked video with AI assistance and reviewed by reshra. Never claim author review happened before it has. Keep draft provenance internally even when the public article simply links its source video.

## Shared content and publishing model

Use a build-consumable registry for posts, alongside the existing release and note records. Markdown/MDX is an optional authoring choice, not a reason to migrate the application or add a server. The initial implementation can use structured content sections compatible with the current generator.

Recommended fields:

- Identity and routing: `id`, `slug`, `path`, `title`, `excerpt`, `type`, and a publication state.
- Editorial metadata: `author`, `language`, `publishedAt`, `updatedAt`, and a small list of topics.
- Content: body sections, optional hero image and alt text, source video IDs, and verified video metadata.
- Relationships: release ID, resource-note IDs, and related-post IDs.
- Draft provenance: transcript/source references, timestamp evidence, AI-assisted status, and whether factual review is complete.

Keep the article's publication state separate from the recording's release state. An upcoming song can have a published announcement; an older released song can have an unfinished article draft. Generate public routes and sitemap entries only for published articles. Update `updatedAt` and sitemap modification dates only after substantive changes.

Generate the blog index, post pages, metadata, ordinary navigation links, and an RSS feed from the same records. Start with a small category filter and archive; add linked pagination when the post count needs it. The full published feed should remain navigable without JavaScript. Empty tag/category pages and a separate search service are unnecessary at launch.

Use semantic article markup and accurate author/date information. `BlogPosting`/`Article` can describe posts, with `MusicRecording` or `VideoObject` where relevant to actual page content. Structured data should describe the page, not be added just to seek a particular search display.

## Search and visitor value

The archive can give each older song a stable destination for song/title searches and sharing. Project posts can address concrete topics such as the MIDI controller build, guitar modification, or NAM capture. That is a reasonable discovery opportunity; more pages alone do not guarantee more search traffic.

Prefer original explanations, verified files and settings, useful chapter links, and lessons learned. There is no SEO minimum word count. Publish enough detail to satisfy the page's purpose; avoid expanding a short song announcement with generic filler. [Google's helpful-content guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content).

Review posts individually rather than automatically publishing every channel upload. Turning the artist's work into useful articles is different from generating large numbers of repetitive pages with little added value. [Google's scaled-content guidance](https://developers.google.com/search/docs/essentials/spam-policies#scaled-content).

Measure blog landings, useful navigation to notes/files, external listening clicks, and verified playback starts. Keep video engagement separate from actual external streaming outcomes. Use article ID/type for reporting context without sending transcript text or draft notes to analytics.

## Suggested rollout and acceptance

1. Repair the reading/navigation defects from the SEO review that would also affect blog pages.
2. Build the shared blog index/article layouts and one direct, generated HTML post. Add the Blog link to IE's profile navigation.
3. Pilot one older song post and one transcript-based project article, such as the MIDI pedal build. Confirm the writing format and the Myspace/Piczo styling before filling the archive.
4. Expand to the remaining song pages/posts and original tutorials, adding RSS, related links, and verified metadata as part of publication.

Acceptance checks:

- Open `/blog` and a post directly, refresh them, and share their URLs. Content, title, canonical, and navigation work without JavaScript and after enhancement. Unknown slugs return HTTP 404.
- Open those same pages from IE. They render inside the existing window with the same substantive content; Back/Forward, modified clicks, and “Open full page” work without losing unrelated desktop state.
- Check a 550 px IE window, a resized narrower window, phone widths, zoom, and keyboard navigation. The article remains readable and scrollable in every context.
- Verify the source recording, timestamps, resource links, release state, and dates. Missing transcript details stay out of published instructions until resolved.
- Ensure only one active media player is audible, and direct blog entry does not load heavy desktop apps unnecessarily.
- Verify generated post/index links, sitemap/RSS entries, metadata, and exclusion of drafts. Blog posts and song pages have distinct purposes and link to each other.

Content needed for the pilot: the preferred song/video, its confirmed artist notes, and the tutorial transcript/captions plus any diagrams or project files. No summaries have been generated from titles alone as part of this planning work.

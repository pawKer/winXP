# Content-page design study

Open `index.html` in a browser directly, or run from the repository root:

```powershell
node docs/design-preview/serve.cjs
```

Visit http://127.0.0.1:4175. No install or build is required. This is a local
proposal; it does not change the production templates or publish a redesign.

## Selected direction: My Documents

My Documents is now the default. It uses a Luna title bar, address strip, blue
task rail, folder links, and compact sans-serif index titles. Article body text
keeps a quieter serif reading treatment. Personal Web remains available through
the top switch for comparison.

- Blog: one pinned entry, then chronological rows with artwork or YouTube
  thumbnails. Categories and search help visitors find entries. Dates sit with
  the other metadata instead of occupying a separate column.
- Articles: one reading column, clear headings, and an embedded YouTube video
  after the introduction when a video exists. Articles without video use cover
  artwork. Videos do not autoplay. Chapters and related notes remain available.
- Music: an upcoming-article strip followed by an artwork shelf of the music
  articles. Both views open exactly the same article URL. Listening links,
  recording credits, alternate videos, and downloads live inside that article.
- Notes: selectable `.txt` documents with a persistent file list and a readable
  monospace pane. Keep their original resource links and affiliate disclosures.
- Profile: a centered portrait, name, short bio, and three consistently aligned
  social links. No floated text or extra welcome paragraph.
- XP desktop: a visible navigation link with the repository's Windows icon,
  including on narrow screens.

The key change is that all content pages share the same masthead, navigation,
width, sidebar, spacing, and footer. Each content type has its own presentation
inside that shared frame. On small screens the main content comes first and the
profile/noticeboard follows it. The note picker sits above the document.

## One article, two ways to browse

The blog shows all articles chronologically. The music archive filters the same
collection to articles with recording metadata and presents them by cover.
There is no separate release-detail page in this proposal. For example, both the
blog entry and the music cover for `anii 2000` open `#article/anii-2000`.

The prototype joins the existing content snapshot by `releaseId` to demonstrate
this model. A production implementation could move music fields into article
frontmatter or retain linked metadata; either way, it should expose one public
article per song. Existing `/music/<slug>` URLs would need redirects to preserve
shared links. No production content migration or redirects are implemented here.
The earlier prototype's `#release/<slug>` links already resolve to its article.

## Try the mockup

- Switch between both directions; the current view stays open.
- Open Blog, Music archive, and Notes & files. Open articles from either list.
- Filter blog entries by Music/Projects and search their titles/descriptions.
- Open a music cover and find its story, video, credits, and listening links in
  the same article shown in Blog. Try `anii 2000` for alternate videos/downloads.
- Open a project to see its YouTube thumbnail, embedded video, and chapters.
- Switch between the four notes.
- Use browser Back/Forward. The hash records the page; `?theme=explorer` records
  the selected direction. Example: `/?theme=explorer#notes/midiPedal`.
- Resize below 600px to see the single-column composition.

`content.js` is an intentional snapshot of the current published content registry,
not a new production content source. Covers reuse the repository's public assets;
project thumbnails load from YouTube. `assets/windows.png` copies the existing
Windows icon for this standalone preview. YouTube embeds use youtube-nocookie.com.
External links open in a new tab. The prototype does not implement local audio
playback, editable notes, newsletter signup, or an actual operating-system window.

## Verification

The prototype is isolated from the app's runtime and build. JavaScript syntax,
formatting, and `git diff --check` passed. The revised DOM smoke check passed 26
article views (24 with video embeds), eight note views across both directions,
all ten music article destinations, ten old release links, thumbnails, default
Explorer selection, category filters, search/empty states, and missing routes.
Music article checks covered listening links, credits, alternate videos, and
downloads. HTTP checks cover the local preview and Windows icon. Browser access
remains unavailable, so rendering, mobile overflow, remote thumbnails, and actual
YouTube playback still require visual review.

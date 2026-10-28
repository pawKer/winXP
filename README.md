# WinXP

🏁 Web based Windows XP desktop recreation.

Features:

- Drag and resize, minimize, maximize windows
- Open applications from desktop icons or start menu
- Minesweeper, Internet Explorer, My Computer, Notepad, Winamp, Paint
- Power off menu

## Site content and SEO

The production build generates 35 HTML pages: the desktop reading view, ten
recordings, the existing notes, thirteen blog entries, category indexes, and
linked pagination. Direct `/blog` URLs open a standalone personal blog; opening
the Blog link in Internet Explorer uses the same content inside the desktop.
Both modes have readable HTML before JavaScript. The reading switch lives in
the taskbar, with a return control on standalone pages.

Edit `src/content/site.js` for the profile and notes, `catalogue.js` for song
records, `posts.js` for blog entries, and `noteSections.js` for reference links.
`pages.js` supplies shared semantic markup, metadata, and public routes to both
the generator and browser. Posts have a publication state; only published
entries receive public routes, sitemap entries, and RSS items. Video-based archive
posts use their main YouTube video's publication timestamp as the post date and
are labeled "Video published"; the archive, related-post navigation and RSS run
newest first. `updatedAt` records the later article edit. Posts without a video
use their own publication date. Music release dates remain independent. Draft
tracks remain in Winamp and are not presented as released songs.

The initial posts are factual video companions based on the artist's official
descriptions, chapter lists, and credits. `content-sources/youtube.json` records
that source evidence. `content-drafts/` contains a longer, unpublished MIDI-pedal
article and transcript-retrieval results; captions could not be retrieved, so
the draft does not claim transcript grounding or author review.

Useful commands are `yarn preview`, `yarn test:seo`, `yarn test:browser`, and
`yarn media:prepare` (requires FFmpeg). PowerShell users can use `yarn.cmd` if
the script execution policy blocks `yarn.ps1`. Browser QA uses a fresh temporary
Chrome profile, with `CHROME_PATH` available for a non-default executable.
Use Node 22.4 or newer. Build includes generation and SEO assertions; GitHub
Actions also runs lint, playback unit tests, isolated GA tool tests, browser
journeys, and nginx checks. `yarn test:ga4` checks the admin tool with simulated
responses and no real account credentials. The server-side tool uses Google's
official authentication library; that dependency is outside the browser bundle.
Browser QA checks successful playback when local media exist and missing-file
feedback otherwise. Set `QA_MISSING_MEDIA=1` to exercise an empty songs mount,
or `QA_LIVE_VIDEO=1` for the separate live YouTube check (network required).
Use `QA_FAILED_DESKTOP=1` for the separate failed-bundle/offline recovery check,
including a real desktop retry after network access is restored.
`QA_VISUALIZER=1` runs the separate Milkdrop default-preset/rendering check.
Direct note/music URLs maximize their target window; ordinary internal launches
use the normal window sizes, with existing window sizes preserved. Direct blog
URLs continue to open the standalone blog. Window titles use the original Noto
Sans typeface, now served locally.
See [GA4_SETUP.md](GA4_SETUP.md) for instrumentation and account setup and
[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) for media and server checks.

`yarn ga4:reports` creates the historical analytics dashboard and CSV tables with
the approved local GA credentials. See [GA4_REPORTS.md](GA4_REPORTS.md) for the
actual pre-release baseline. Generated data stay in `.local/analytics/`, excluded
from Git and Docker. Analytics delivery is limited to the canonical public host
and its subdomains; an explicit `REACT_APP_GA_DEBUG=true` build enables deliberate
local tracking. Routine browser QA uses local diagnostics without Google delivery.

The canonical host is `https://reshra.xyz`. nginx redirects the `www` host to
it and serves generated HTML at extensionless paths. Cloudflare must also
redirect HTTP to HTTPS, and its crawler, caching, and robots settings need
verification after deployment. Search Console and Bing property setup and
baseline measurements require access to those accounts.
See `SEO_EVALUATION.md` for the local, production, and search performance checks.

## [Try it!](https://winxp.now.sh)

Windows XP 👉 https://winxp.now.sh

[![](demo/demo.gif)](https://winxp.now.sh)

## Contributing

Generally open an issue (or comment on an issue if there's one already) before starting work on a PR.

## License

The Windows XP name, artwork, trademark are surely property of Microsoft. This project is provided for educational purposes only. It is not affiliated with and has not been approved by Microsoft.

## Thanks
- [Webamp](https://github.com/captbaritone/webamp), Winamp 2 reimplementation by: [captbaritone](https://github.com/captbaritone)
- [JS Paint](https://github.com/1j01/jspaint), Paint reimplementation by: [1j01](https://github.com/1j01)

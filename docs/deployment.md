# Deployment and discovery checks

The implementation targets the existing Docker/nginx deployment. It has not been deployed to the public site during this work. The legacy `now.json` deployment is unsupported for the new route/status behavior; `now-build` now generates content, but the old Vercel rewrites still do not provide nginx parity.

**User-confirmed release workflow, 28 October:** production is `https://reshra.xyz`. Finish local implementation, verification and GA preparation first; then ask the user to deploy manually at the very end. Do not deploy automatically. After the user confirms deployment, perform the public-edge checks below and coordinate any GA automatic-measurement switches with the released code.

## Before deployment

```powershell
yarn.cmd lint
yarn.cmd test --watchAll=false --runInBand
yarn.cmd test:ga4
yarn.cmd build
yarn.cmd test:seo
yarn.cmd test:browser
# With a local nginx executable and its mime.types file available:
yarn.cmd test:nginx
```

`yarn.cmd preview` serves the build at http://127.0.0.1:4173 with extensionless pages, real 404s, and range requests. This preview is useful for browser checks; the separate nginx test verifies the actual server configuration.

Use Node 22.4 or newer for the verification tools. Build now includes generation and generated-page assertions. `.github/workflows/checks.yml` runs lint, unit, build, browser and nginx checks on pull requests and pushes; its first remote run is still pending. It uses the supported action interfaces documented by [checkout](https://github.com/actions/checkout) and [setup-node](https://github.com/actions/setup-node).

Browser QA uses successful playback when the local recordings are present, and explicitly checks missing-file feedback otherwise. Set `QA_MISSING_MEDIA=1` for a forced empty-mount run against the preview, or `QA_LIVE_VIDEO=1` for the separate live YouTube SDK/playback check. Third-party analytics are blocked during these browser checks; local event capture is not proof of GA ingestion.

`QA_VISUALIZER=1` runs a separate Milkdrop/default-preset check with real software WebGL in headless Chrome; the renderer label is simulated to exercise the hardware-GPU branch. This verifies rendering and player survival, not physical GPU compatibility. The normal suite exercises the basic-player fallback. Window titles use locally served Noto Sans files, including their font license, and are checked with Google font hosts blocked.

`QA_FAILED_DESKTOP=1` runs the separate desktop-bundle failure and offline-content check. It verifies the article/song remains readable, preserves canonical metadata and campaign parameters, and tests an actual reload retry after the chunks become reachable. CI includes this recovery check. The regular browser suite also covers doubled text size, native touch scrolling, keyboard footer access, complete route metadata and real Open full page/Ctrl-click tabs.

Compressed media are produced with `yarn.cmd media:prepare`, using FFmpeg on PATH or `FFMPEG_PATH`. The command leaves masters untouched and writes compressed copies to `public/songs/web/`, still gitignored. Deploy those files to the corresponding directory in the existing songs mount. Docker excludes songs from the image; the manifest is not a substitute for deploying the audio files. The missing local anii 2000 master remains a missing-file case, with its official video and external listening links available.

The songs mount already exists; no new service or volume is needed. It makes a server folder available inside nginx as `/songs`. Copy the local **`public/songs/web/` folder into that existing server songs folder**, producing `songs/web/forever.mp3`, for example. Leave the existing WAV files alongside it. A Git update or Docker image rebuild alone does not transfer these gitignored music files.

| Compose configuration | Existing server folder | Where to copy the MP3s |
| --- | --- | --- |
| `docker-compose.yml` | `./public/songs` relative to the checkout | `./public/songs/web/` |
| `docker-compose.pi.yml` | `/srv/dev-disk-by-uuid-4E1AEA7B1AEA6007/AppData/reshra-xyz/songs` | The `web/` subfolder of that directory |

In either setup, nginx then serves the example file at `https://reshra.xyz/songs/web/forever.mp3`. Confirm the configuration used by the manual deployment before choosing the copy destination.

## Public edge checks

- Verify Home, `/music`, an older recording, `/blog`, a post, and an existing note as raw HTML and after JavaScript.
- Unknown content and missing assets must return 404. `/robots.txt` must be plain text; `/sitemap.xml` and `/feed.xml` must be XML.
- Verify the HTTP-to-HTTPS redirect and the `www`-to-preferred-host redirect, preserving path and query parameters.
- Trailing slashes and `.html` aliases redirect to clean paths, preserving query parameters. `/index.html` redirects to `/`; the sitemap and navigation use clean URLs.
- Confirm fingerprinted assets are cached immutably and HTML/discovery files refresh. Purge stale cached discovery files when switching from the old fallback behavior.
- Verify both published-media availability and byte-range seeking on the actual songs mount, including a deliberately missing-file case.
- Confirm Cloudflare's effective robots/bot policy matches the approved policy. Do not infer crawler access from a successful browser visit alone.
- Run URL Inspection in Google Search Console and Bing for representative URLs, submit the sitemap, and record the selected canonicals and indexing state. Keep the search baseline and later listening outcomes separate from crawler visits.

## Analytics release stages

The approved connection to property **502513568** has prepared four dimensions; [GA4 change report](analytics/change-report.md) records the readback. [historical GA4 reports](analytics/reports.md) provides the pre-release baseline, including the legacy event names and public-host scope. Existing automatic tracking remains enabled until the manual release.

After the user confirms deployment and the public analytics-version marker is present:

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS='C:\Users\Rares\.config\reshra\ga4-authorized-user.json'
$env:GA4_PROPERTY_ID='502513568'
yarn.cmd ga4:plan --after-deploy
yarn.cmd ga4:plan --apply --after-deploy
```

This disables automatic history/video collection that would overlap the released instrumentation. Verify actual deployed page-view and media/link event counts, including failures and presentation changes, before marking the music events as key events:

```powershell
yarn.cmd ga4:plan --after-deploy --mark-key-events
yarn.cmd ga4:plan --apply --after-deploy --mark-key-events
```

Neither stage proves ingestion merely by succeeding. Record live-event evidence separately; preserve the frozen historical snapshot when creating later reports. Localhost/preview traffic is now excluded by default, and private reports are excluded from both Git and the Docker build context.

## Baseline obtained during implementation

[content-sources/production-baseline.json](../content-sources/production-baseline.json) records raw responses checked on 27 October 2026 before deployment. At that time:

- Home, music, blog, and a note all returned the old shared `reshra's desktop` HTML.
- Unknown paths returned 200 rather than 404.
- robots.txt and sitemap.xml returned HTML rather than discovery files.
- The `www` host returned 200 rather than redirecting to the preferred host.
- HTTP redirected to HTTPS while retaining the music path.

This baseline diagnoses delivery work still required at deployment. It does not prove Cloudflare is blocking crawlers, and it does not verify the new local pages in production.

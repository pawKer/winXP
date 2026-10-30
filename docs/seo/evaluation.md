# Evaluating reshra.xyz search discovery

There is no useful single "SEO score." Check that pages can be fetched and understood, then measure whether they are indexed and lead people to music. A passing local build is only the first gate.

## 1. Local technical gate

Run `yarn build`, `yarn lint`, the playback unit tests, `yarn test:browser`, and `yarn test:nginx` (with nginx installed). Build includes the generated-page assertions; `yarn test:seo` can rerun them independently. They validate unique metadata, artist/article/video relationships, canonical and social URLs, public links, the sitemap, RSS, and draft exclusion. Inspect `/`, `/music`, a release, a note, `/blog`, and a post with JavaScript disabled and enabled at desktop and phone widths. The same substantive text and links should be available both ways.

## 2. Production crawl gate

After deployment, check actual HTTP responses from the public edge:

| URL or test | Expected result |
| --- | --- |
| `https://reshra.xyz/`, `/music`, `/music/bruises`, `/notes/guitar-parts`, `/blog`, `/blog/building-my-midi-pedal` | HTTP 200, HTML with the correct title, canonical, heading, and ordinary links in the raw response |
| `https://reshra.xyz/does-not-exist` | HTTP 404 |
| `https://www.reshra.xyz/music/bruises` | Redirect to the same path on `https://reshra.xyz` |
| `http://reshra.xyz/music/bruises` | Redirect to HTTPS, preserving the path |
| `/robots.txt`, `/sitemap.xml`, `/feed.xml` | HTTP 200, current content and appropriate text/XML content types |

Use Google Search Console's [URL Inspection](https://support.google.com/webmasters/answer/9012289?hl=en) live test on the homepage, `/music`, a release, and a note. Check the fetched HTML, rendered screenshot, resources, indexability, and later the Google-selected canonical. Run [Bing URL Inspection](https://www.bing.com/webmasters/help/URL-Inspection-55a30305) for the same representative URLs. Validate the MusicRecording JSON-LD with the [Schema Markup Validator](https://developers.google.com/search/docs/appearance/structured-data); a valid schema type does not by itself promise a Google rich result.

Cloudflare challenge pages, stale cached HTML, or blocked crawlers must be diagnosed from the edge response and security events. The repository build cannot verify those settings.

## 3. Discovery and listening outcomes

Record a baseline in Search Console before deployment if available. Then compare complete 28-day periods after pages have had time to be crawled. Segment branded queries such as `reshra`, music queries such as `reshra bruises`, and results for `/music` and each release. Track indexed URL count, impressions, clicks, click-through rate, and Google-selected canonical. Search Console's [Performance report](https://support.google.com/webmasters/answer/17011364?hl=en) distinguishes property totals from per-page totals, so use the same grouping when comparing periods.

In analytics, count `music_listen_click` by release and destination from the linktree, music catalogue, release pages, and JavaScript-enabled reading view. Compare those clicks with search visits and actual platform outcomes where available. Keep bot visits separate from human listening clicks.

## Current evidence and limits

The local generator now produces 35 pages, including ten recordings and thirteen blog entries. Generated-page assertions, browser journeys, playback tests, and actual nginx checks provide local technical evidence. [implementation status](../implementation-status.md) records their scope and remaining inputs. The new GitHub Actions workflow runs these checks without private audio; a local run with the media files additionally verifies successful playback.

The pre-deployment public-response baseline is saved in [docs/editorial/sources/production-baseline.json](../editorial/sources/production-baseline.json). It shows the old shared HTML, fallback-200 responses and incorrect discovery MIME types at the public edge; the user has now deployed the new implementation. [Release verification](../release-verification.md) records current public checks. Search Console/Bing indexing checks remain outstanding. Local results do not establish indexing or ranking.

The approved GA connection has now verified property 502513568 and prepared four reporting dimensions; [GA4 change report](../analytics/change-report.md) records the actual changes. [historical GA4 reports](../analytics/reports.md) contains the historical event baseline and downloadable reports, separating the public site from substantial localhost activity. Compare later periods with the same hostname scope and distinguish legacy link events from the new music events. Automatic collection switches and key-event marking are now complete following live browser counts and GA realtime confirmation; see the release report. Approved artwork, original release dates, and personal artist notes remain useful editorial additions to `src/content/catalogue.js` and `src/content/posts.js`.

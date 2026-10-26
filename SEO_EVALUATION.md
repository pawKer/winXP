# Evaluating reshra.xyz search discovery

There is no useful single "SEO score." Check that pages can be fetched and understood, then measure whether they are indexed and lead people to music. A passing local build is only the first gate.

## 1. Local technical gate

Run `yarn build`, `yarn test:seo`, and `yarn lint`. The SEO check validates the generated pages, unique titles and descriptions, canonical and social URLs, structured data syntax, the sitemap, and direct listening links from the homepage and music catalogue. Also inspect `/`, `/music`, one release, and one note with JavaScript disabled and enabled at desktop and phone widths. The same substantive text and links should be available both ways.

## 2. Production crawl gate

After deployment, check actual HTTP responses from the public edge:

| URL or test | Expected result |
| --- | --- |
| `https://reshra.xyz/`, `/music`, `/music/bruises`, `/notes/guitar-parts` | HTTP 200, HTML with the correct title, canonical, heading, and ordinary links in the raw response |
| `https://reshra.xyz/does-not-exist` | HTTP 404 |
| `https://www.reshra.xyz/music/bruises` | Redirect to the same path on `https://reshra.xyz` |
| `http://reshra.xyz/music/bruises` | Redirect to HTTPS, preserving the path |
| `/robots.txt` and `/sitemap.xml` | HTTP 200, current content and appropriate text/XML content types |

Use Google Search Console's [URL Inspection](https://support.google.com/webmasters/answer/9012289?hl=en) live test on the homepage, `/music`, a release, and a note. Check the fetched HTML, rendered screenshot, resources, indexability, and later the Google-selected canonical. Run [Bing URL Inspection](https://www.bing.com/webmasters/help/URL-Inspection-55a30305) for the same representative URLs. Validate the MusicRecording JSON-LD with the [Schema Markup Validator](https://developers.google.com/search/docs/appearance/structured-data); a valid schema type does not by itself promise a Google rich result.

Cloudflare challenge pages, stale cached HTML, or blocked crawlers must be diagnosed from the edge response and security events. The repository build cannot verify those settings.

## 3. Discovery and listening outcomes

Record a baseline in Search Console before deployment if available. Then compare complete 28-day periods after pages have had time to be crawled. Segment branded queries such as `reshra`, music queries such as `reshra bruises`, and results for `/music` and each release. Track indexed URL count, impressions, clicks, click-through rate, and Google-selected canonical. Search Console's [Performance report](https://support.google.com/webmasters/answer/17011364?hl=en) distinguishes property totals from per-page totals, so use the same grouping when comparing periods.

In analytics, count `music_listen_click` by release and destination from the linktree, music catalogue, release pages, and JavaScript-enabled reading view. Compare those clicks with search visits and actual platform outcomes where available. Keep bot visits separate from human listening clicks.

## Current evidence and limits

The local generator produces nine pages and `yarn test:seo` checks their structure. This is evidence of technical readiness in the repository, not evidence of indexing or ranking. Production responses and Search Console/Bing properties have not yet been verified. The release pages intentionally have minimal copy; adding accurate artwork, dates, credits, and descriptions in `src/content/site.js` will give visitors and search engines more useful information.

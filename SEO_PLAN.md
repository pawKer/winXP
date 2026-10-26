# SEO and AI discovery plan for reshra

Prepared 26 October 2026. Repository implementation is in progress on `feat/seo-static-pages`; Cloudflare, Search Console, and Bing settings have not been changed.

**Goal:** make https://reshra.xyz/ the clear home for searches for reshra, followed by discovery of reshra's original music. English is the main language. Notes and affiliate resources remain useful secondary content.

Keep the current desktop homepage: Internet Explorer containing the profile/link list, Minesweeper, and Winamp. Keep the existing mobile presentation, where the profile is initially prominent and other apps remain available. Docker/nginx behind Cloudflare remains the deployment target.

## Recommended architecture

Generate real HTML for each public content URL at build time, then enhance that content into the XP experience with JavaScript. Visitors and crawlers receive the same HTML and substantive content. A visible reading-view toggle can offer a simpler presentation of the current page.

One shared content source should supply the HTML renderer, XP views, metadata, structured data, and sitemap. Profile edits and release updates should not require maintaining two websites.

| URL | Content delivered in HTML | Default experience with JavaScript |
| --- | --- | --- |
| `/` | Artist introduction, official profiles, featured releases, navigation | Current XP desktop and LinkTree-style profile |
| `/music` | Published release catalogue with real links | Catalogue inside Internet Explorer, with Winamp available |
| `/music/bruises` | Release information, artwork, listening links | Release view with an explicit Play in Winamp control |
| `/music/anii-2000` | Release information and relevant Guitar Hero resources | Equivalent release view inside Internet Explorer |
| `/notes` | Linked index of public notes | Notes index inside Internet Explorer |
| Existing `/notes/...` paths | The requested note and resource links | The same note opened in Notepad |

The user requested minimal public pages for `bruises` and `anii 2000`; artwork, dates, credits, and fuller descriptions can be filled in later in `src/content/site.js`. Existing playlist entries labelled as drafts remain in Winamp and have no release pages.

Each content path is its own canonical page. Presentation modes, if expressed in query parameters, canonicalize to the corresponding content path. Note and release pages must not canonicalize to the homepage.

The build renderer should consume content without importing the complete desktop. Desktop modules currently access `window` during module evaluation, so rendering the entire existing application in Node would require additional work. A framework migration is not required for the proposed first implementation. Google recommends static/server rendering or hydration over maintaining a crawler-specific dynamic renderer. [Google rendering guidance](https://developers.google.com/search/docs/crawling-indexing/javascript/dynamic-rendering).

## Repository findings

These findings come from source inspection. The browsing tool could not access the live site, so current response headers, Cloudflare settings, indexing, and production rendering remain unverified. That failure does not establish that Cloudflare is blocking crawlers.

| Location | Finding | Planned response |
| --- | --- | --- |
| `public/index.html` | Empty app container; shared title and description; Open Graph tags use `name` | Generate content and metadata per page; use the appropriate Open Graph properties |
| `src/App.js` | Note routes render the desktop; catch-all route accepts unknown paths | Preserve known paths and implement explicit route handling |
| `src/WinXP/apps/notesConfig.js` | Stable note IDs and paths already exist, but records import UI components | Separate portable content/route data from component wiring |
| `src/WinXP/apps/InternetExplorer/index.js` | Profile and release links live inside component props; note links use callbacks | Extract shared data and provide real destination URLs alongside XP actions |
| `src/WinXP/apps/Notepad/headerConfig.js` | Resource content is structured, mostly as lists of links | Reuse it and support descriptive copy, dates, and affiliate flags |
| `src/WinXP/apps/Winamp/config.js` | Track information exists; catalogue includes drafts and WAV files | Map published releases to tracks; inspect delivery cost before changing audio |
| `nginx.conf` | Unknown routes fall back to the app HTML | Serve generated pages and return real 404 responses for missing content |
| `public/` | No tracked sitemap or robots.txt found | Generate discovery files and verify what Cloudflare actually serves |

## Implementation order

### 1. Establish identity, crawl access, and a baseline

- Use the user-confirmed preferred host `https://reshra.xyz`. Redirect HTTP and the non-preferred host consistently, preserving paths and useful query parameters. Check existing edge redirect rules before adding any.
- Verify the domain in Google Search Console and Bing Webmaster Tools, or use existing properties. Record current indexed pages, branded queries, impressions, clicks, and music-platform outbound clicks.
- Inspect the homepage and a note URL both as raw HTTP responses and after browser rendering. Check redirects, status codes, content types, response headers, and any robots directives.
- Review Cloudflare bot policies, security events, cache rules, and managed robots.txt behavior. Allow intended search and user-requested retrieval traffic; diagnose actual blocks before introducing exceptions. Keep origin and edge policies consistent. [Cloudflare bot policies](https://developers.cloudflare.com/bots/additional-configurations/block-ai-bots/), [Cloudflare robots.txt behavior](https://developers.cloudflare.com/bots/additional-configurations/managed-robots-txt/).
- Write a short approved artist bio and establish consistent artist name, image, and official Spotify, YouTube, Instagram, and TikTok destinations. Use the website in public profiles where those platforms support it.

**Completion evidence:** documented preferred domain, a baseline report, and verified crawler access or a specific diagnosed production blocker.

### 2. Prove the HTML-to-desktop approach

- Extract shared profile and note data, keeping stable IDs and paths.
- Generate meaningful homepage HTML and one representative note page during the normal build. Include the content itself and ordinary anchor links, rather than relying on a noscript message.
- Keep the profile visible inside Internet Explorer after React starts; keep the note visible inside Notepad on its direct route. The static and enhanced versions must agree on substantive content and destinations.
- Prototype the transition into the desktop on wide and narrow screens. Reserve appropriate layout space and check for content flashes, disappearing content, layout shifts, duplicate main content, or duplicate players.
- Add a visible reading-view option. Presentation preference may be remembered locally, while the default remains the current XP experience.

**Completion evidence:** both prototype pages are usable without JavaScript, show the same content after enhancement, and preserve the current desktop/mobile behavior. Resolve this prototype before expanding the catalogue.

### 3. Publish the artist and music pages

- Extend the shared records with confirmed release title, slug, artwork, release date, credits, short description, streaming URLs, and the matching local playback track.
- Generate `/music` and individual pages for confirmed releases. Link featured songs from the homepage to these pages; keep direct listening links available.
- Give each page a unique title, description, canonical URL, and social preview. A proposed homepage title is `reshra - Official Music, Links & Notes`; release titles can follow `bruises - reshra | Official Release`.
- Add structured data describing the artist and actual releases, using stable identifiers and official-profile links. Choose Person/MusicGroup according to the artist identity, and MusicRecording for recordings. Include only verified facts also available to visitors. Structured data does not guarantee a special search display. [MusicRecording vocabulary](https://schema.org/MusicRecording).
- Connect Play in Winamp to the selected recording. Keep native links and an accessible playback alternative in reading view. Playback should follow an explicit visitor action.
- Inspect bundle and media loading before optimizing. Load heavy apps when needed while preserving their visible startup behavior. If WAV transfers materially slow listening, consider compressed web versions while retaining masters in their existing storage workflow.

**Completion evidence:** homepage and release pages have complete raw HTML and share previews, and selecting a release plays the intended track without breaking Winamp lifecycle behavior.

### 4. Complete navigation, notes, and delivery

- Extend generation to `/notes` and existing note routes. Use semantic titles, sections, descriptive link text, and a short explanation of what each resource list is for.
- Use real `href` destinations for content navigation. JavaScript can enhance normal clicks into XP actions; opening a link in a new tab must still work. Keep browser URLs and Back/Forward behavior coherent without unnecessarily resetting desktop state.
- Add an explicit affiliate field to relevant links, a clear disclosure, and `rel="sponsored"` alongside existing security attributes. Regular reference and social links remain ordinary links. [Google outbound-link guidance](https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links).
- Generate a sitemap from public canonical records. Use modification dates only when substantive content changed. Serve robots.txt, sitemap.xml, and missing assets with correct content types and statuses.
- Update nginx to serve generated content paths before the desktop fallback, with explicit handling for any remaining app routes. Return HTTP 404 for unknown content.
- Cache fingerprinted assets for long periods; use updateable caching for HTML and discovery files. Confirm Cloudflare does not retain obsolete HTML or a previous crawler policy after deployment.

**Completion evidence:** all public content is reachable through HTML links, existing note URLs still work, invalid paths return 404, and deployment serves fresh route-specific pages.

### 5. Apply the chosen AI policy and measure discovery

- Keep important facts in readable text: who reshra is, official profiles, release names, credits, and dates. Use clear summaries and stable URLs so a retrieved page makes sense on its own.
- Use native links, labelled controls, and keyboard access so browser agents can navigate content and activate playback. A custom agent server is unnecessary for this content-focused first phase.
- Apply the confirmed policy below to robots.txt and Cloudflare, then verify the effective edge responses: allow search and user-requested retrieval, disallow dedicated training crawlers, and allow Google-Extended for broader Gemini discovery. Avoid blanket policies that would also block the selected search, agent, or Google access. Keep Google Search generative-AI inclusion enabled if available in the Search Console property. [Google's inclusion control](https://support.google.com/webmasters/answer/16908024?hl=en).
- Consider a generated `/llms.txt` directory or Markdown exports later, if useful to actual agent workflows. Keep them synchronized with canonical HTML. These are optional conveniences; Google AI search does not require special AI text files or special schema. [Google AI guidance](https://developers.google.com/search/docs/appearance/ai-features).
- Inspect important deployed URLs in Search Console, submit the sitemap, and monitor crawl/indexing results. Compare branded search performance, release-page visits, listening clicks, and identifiable AI referrals after sufficient data accumulates. Log crawler visits separately from human conversions.

## Confirmed AI access policy

Confirmed by the user on 26 October 2026: **allow search and user-requested visits, opt out of dedicated training crawlers, and prioritize broader Gemini discovery.** This choice is recorded for implementation; production settings have not been changed.

| Crawler or control | Planned setting | Purpose |
| --- | --- | --- |
| Googlebot and Bingbot | Allow public content | Ordinary search discovery |
| OAI-SearchBot | Allow | ChatGPT search discovery |
| ChatGPT-User | Allow access | User-requested retrieval; OpenAI notes that robots.txt rules may not apply to these requests |
| GPTBot | Disallow | Opt out of OpenAI's dedicated training crawler |
| Claude-SearchBot and Claude-User | Allow | Claude search and user-requested retrieval |
| ClaudeBot | Disallow | Opt out of Anthropic's dedicated training crawler |
| Google-Extended product token | Allow | Broader Gemini grounding, accepting the associated Gemini training permission |
| Google Search generative-AI inclusion | Include | Eligibility for supported Google Search AI features |
| Other AI crawlers | Classify before adding rules | Preserve search and user-requested access; disallow dedicated training crawlers once identified |

OpenAI separates OAI-SearchBot from GPTBot. Anthropic separates Claude-SearchBot and Claude-User from its training crawler ClaudeBot. These providers therefore offer a useful search/training distinction. [OpenAI crawler documentation](https://developers.openai.com/api/docs/bots), [Anthropic crawler documentation](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler).

The user selected the Google exception for broader discovery: Google-Extended covers both Gemini training and grounding in specified Gemini products, so allowing it also permits those training uses. It is a robots.txt product token, not a separate HTTP crawler user agent. Google's Search generative-AI inclusion setting is a separate control and should also remain enabled. [Google crawler controls](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers#google-extended).

Robots rules express preferences to compliant services; they do not retract earlier training data or technically prevent all scraping. Cloudflare can enforce selected access restrictions, but the effective behavior still needs checking. Search services can also answer questions without sending a visitor, so assess music clicks and useful referrals as well as visibility.

## Validation and remaining inputs

For implementation, run `git diff --check`, `yarn build`, and `yarn lint`, distinguishing existing warnings. Add focused checks for generated HTML, canonical paths, sitemap entries, and status handling. Test production-like nginx routing, JavaScript-disabled reading, share previews, keyboard navigation, desktop/mobile layouts, Back/Forward, and XP app behavior. Do not count successful local builds as verification of Cloudflare settings or production indexing.

Remaining inputs can be collected without delaying the technical prototype:

- Short artist bio and preferred genre/self-description.
- Release metadata and which tracks should have public release pages, especially playlist drafts.
- Existing Search Console/Bing property status and baseline availability.

The first implementation milestone is the homepage plus one existing note rendered as real HTML while retaining the XP presentation. Once that works reliably, prioritize music pages before expanding note content.

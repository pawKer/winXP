# Release verification — 28 October 2026

The user confirmed the initial release is live at `https://reshra.xyz`.
This report separates checks on that release from follow-up fixes prepared
locally. No deployment was performed by the agent.

## Live website

- All 35 public content URLs returned readable HTML with page-specific titles,
  canonical metadata and the manual-analytics deployment marker.
- Sitemap and RSS returned XML; robots returned plain text with the approved
  crawler directives. Unknown pages and missing media returned real 404s.
- All eleven optimized covers returned JPEG images.
- All ten original WAV URLs, including anii 2000, returned HTTP 206 and exactly
  the requested 32 bytes. The nine prepared MP3 URLs returned 404. The user
  confirmed that production still uses WAV recordings.
- HTTP and www requests redirect to the preferred HTTPS host. Clean-path
  redirects currently produce an intermediate HTTP URL behind the TLS proxy;
  the local nginx fix described below removes that downgrade.
- Requests using Googlebot, Bingbot, OAI-SearchBot and Claude-SearchBot user-agent
  strings received readable blog HTML. These tests do not establish access
  from verified crawler IPs, the full Cloudflare rule configuration, or indexing.

The initial edge sweep had 68 checks: 59 passed and nine MP3 checks identified
the media-deployment mismatch. All ten subsequent WAV range checks passed.
Detailed response evidence is stored privately under `.local/analytics/`.

## Live browser and analytics

A fresh browser session opened the anii 2000 reading page, played its deployed
WAV, clicked the listening link, switched to the desktop, opened the embedded
blog and then the MIDI-pedal article. No application exceptions were observed.
The listening link's external navigation was suppressed during the test.

| Event | Expected and observed in the successful session |
| --- | --- |
| `page_view` | 3: song, blog archive, project article |
| `music_play_request` | 1 |
| `music_play_start` | 1, after playback advanced |
| `music_listen_click` | 1 |
| `view_mode_change` | 1; switching presentations added no page view |

Actual Google collection requests carried those events to the intended stream
and received HTTP 204. After a reporting delay, the authenticated GA realtime
report showed the same counts, plus one first visit and session start.
Earlier headless verification attempts did not appear in that report; this
does not establish why those attempts were absent. Test traffic was tagged
with `utm_source=release_verification` and should not be treated as organic
release performance.

The planned GA activation was applied and read back: automatic history-change
and video-engagement collection are disabled, avoiding overlap with manual
events. After ingestion was confirmed, `music_listen_click` and
`music_play_start` were marked as key events, each counted once per event.
Existing reporting dimensions and other settings were preserved. The frozen
historical reports were not overwritten.

## Local fixes awaiting the next manual deployment

1. Homepage startup now temporarily hides the static reading content before
   rendering the desktop, preventing the brief Reading View flash. No loading
   screen or artificial delay is enabled. Explicit Reading View and
   JavaScript-disabled visits remain readable immediately. If application
   scripts never start, the static reading fallback returns after 12 seconds.
   The supplied XP boot design is saved as an optional, currently unused React
   component in `src/components/XPBootScreen/` for later use.
2. WAV playback is the default, matching the existing songs mount. Prepared
   MP3s are selected only with `REACT_APP_PREFER_MP3=true` at build time, after
   their files have been deployed. Both Compose variants pass this build option.
3. nginx uses relative clean-path redirects so TLS termination at the public
   proxy does not produce an HTTP downgrade.

Build and generated-page assertions, lint, content/compiler checks, normal
browser journeys with actual WAV playback, startup/no-JavaScript checks,
desktop-bundle failure recovery, and actual nginx routing checks passed.
Lint retains the same five inherited warnings. Docker image execution was not
tested locally because its daemon was previously unavailable.

## Remaining release actions

- Review and manually deploy the local follow-up fixes, then recheck homepage
  first paint, ordinary song playback and HTTPS clean-path redirects publicly.
- Google Search Console verification is confirmed by the user. Sitemap
  submission and representative URL Inspection results have not been read
  from that account. The existing OAuth connection has Analytics scopes only.
  A discovered third-party Search Console reporting integration was not
  connected and does not establish sitemap-submission access.
- Bing verification and sitemap submission remain outstanding. The public
  sitemap is `https://reshra.xyz/sitemap.xml`.
- Search-account inspection, indexing, ranking and later organic listening
  performance remain separate from these technical and test-event checks.
- The longer MIDI article remains an unpublished description-based draft, as
  requested; transcript expansion is deferred. Completed native-audio replay
  counting remains the previously documented follow-up.

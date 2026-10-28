# Historical GA4 reports

Reports were retrieved from property **502513568 — reshra-xyz** using the user's approved OAuth connection. The snapshot ends on **27 October 2026**, the last complete calendar day when this baseline was created. The website changes have not been deployed. These reports cover the event types already present before those changes; they do not infer deployment dates from Git commits.

## Open the dashboard

Open [.local/analytics/2026-10-27/index.html](.local/analytics/2026-10-27/index.html) in a browser. It contains a period/scope selector, totals, a daily trend, searchable tables, and CSV/JSON downloads. It works offline and contains no credentials.

Seven report types are available for each of four views, yielding **28 CSV tables** plus the dashboard and a complete [snapshot.json](.local/analytics/2026-10-27/snapshot.json):

| Report | Dimensions / grouping | Metrics |
| --- | --- | --- |
| Traffic overview | Entire selected period and hostname scope | Users, sessions, page views, engaged sessions, event count |
| Event inventory | Exact raw event name, including case variants | Event count, users per event |
| Legacy interactions | Event, hostname, destination, label, type, note action | Event count, users per row |
| Daily trend | Date and raw event name | Event count |
| Pages | Hostname, page path, page title; page_view events | Page-view event count, users per row |
| Acquisition | Hostname, session source/medium, device | Sessions, users, engaged sessions |
| Automatic outbound | Hostname, link URL/text; automatic click events | Event count, users per row |

The date windows are **30 September–27 October 2026** and **25 August 2025–27 October 2026** (since property creation). Each has a public-site view matching `reshra.xyz` and its subdomains, and an all-hosts view including development traffic. The default is the recent public-site view. All dates use the property's `Etc/GMT` reporting timezone.

## Findings from the actual reports

| Metric | Recent public-site period | Public site since property creation | All hosts since property creation |
| --- | ---: | ---: | ---: |
| Users | 14 | 120 | 124 |
| Sessions | 15 | 151 | 183 |
| Page views | 27 | 349 | 1,242 |
| Profile/linktree events, grouping case variants | 11 | 76 | 297 |
| Note events, grouping case variants | 1 | 11 | 12 |

**893 historical page views came from localhost.** Including development activity would therefore materially overstate public-site page views. All-host data are retained as a diagnostic view; the website now suppresses GA delivery on local/preview hosts by default. An explicit `REACT_APP_GA_DEBUG=true` build can enable deliberate local verification.

The recent raw event counts include `retro_link_click` (6), `Retro_link_click` (5), and `Notes_link_click` (1). The dashboard groups the first two as Profile/linktree **event counts**, while preserving their original names in the underlying tables. It does not rewrite GA history or sum overlapping user counts.

The recent lowercase profile events contain two bruises pre-save destination clicks, one Guitar Hero folder click, two MIDI-note actions and one Guitar Parts action. The older capitalized events return `(not set)` for their custom parameters. Counts are still reportable; their exact destination/label cannot be reconstructed from these returned rows. Automatic outbound data provide a separate signal and may overlap the custom events.

The existing `destination`, `label`, `type`, and `action` custom dimensions were reused. Standard GA metrics supply the numeric counts, so no duplicate numeric counter definitions were added. The new note renderer now preserves these legacy parameters as well as its new presentation context.

User and session counts can overlap across dimensions/days. Overview totals are queried separately rather than calculated by adding table rows. Click events do not establish a music-platform stream, and a pre-save link remains distinct from a verified listen. API sampling, thresholding or other-row metadata are retained in the JSON and surfaced by the dashboard when reported. Empty and `(not set)` parameter values remain explicit. The snapshot records its retrieval time; a complete calendar day does not guarantee GA processing has finished, so later queries may return revised counts.

## Refresh or create a later snapshot

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS='C:\Users\Rares\.config\reshra\ga4-authorized-user.json'
$env:GA4_PROPERTY_ID='502513568'
yarn.cmd ga4:reports
# Optional later complete-day cutoff, saved in a different dated folder:
$env:GA4_REPORT_END_DATE='2026-11-30'
yarn.cmd ga4:reports
```

The default cutoff is intentionally frozen at `2026-10-27`. Choose another date only after that day is complete. The generator paginates all returned rows, queries GA read-only, and saves data under `.local/analytics/`, which is excluded from Git and Docker. The report code and template are tracked; generated analytics data are private local artifacts.

## Equivalent saved reports inside GA4

The connected Admin/Data APIs provide configuration and report queries, but do not expose creation of saved GA4 Report Library screens. Those UI reports have **not** been created by this work. The generated reports above are real data-backed artifacts, and these are the equivalent Library configurations:

| Saved report name | Dimension choices | Metrics | Event inclusion |
| --- | --- | --- | --- |
| Legacy — Profile/linktree | Event name, Link label, Link destination, Link type, Hostname | Event count, Total users | Both `Retro_link_click` and `retro_link_click` |
| Legacy — Notes | Event name, Link label, Link destination, Note action, Hostname | Event count, Total users | `Notes_link_click` and `notes_link_click`, where present |
| Legacy — Automatic outbound | Link URL, Link text, Hostname | Event count, Total users | `click`; keep separate from custom click totals |
| Historical — Acquisition | Session source/medium, Device category, Hostname | Sessions, Total users, Engaged sessions | All events in the selected host scope |

In **Reports → Library → Create new report → Create detail report**, use these dimensions/metrics and inclusion filters, select the historical date range, and save the reports. Add them to a collection if desired. Restrict the website view to the relevant public hostnames; keep development traffic in a separate diagnostic view. These steps follow Google's [detail-report guide](https://support.google.com/analytics/answer/13844077?hl=en) and [report-navigation guide](https://support.google.com/analytics/answer/10460557?hl=en).

API references: [dimensions and metrics](https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema), [custom dimensions](https://support.google.com/analytics/answer/14240153?hl=en), [Admin API surface](https://developers.google.com/analytics/devguides/config/admin/v1/rest).

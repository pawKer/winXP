# GA4 preparation change report

Authenticated and applied on **28 October 2026**, with configuration readback completed before this report was written. Authentication uses the user's approved Desktop OAuth login; credentials remain outside this repository.

| Identity | Verified value |
| --- | --- |
| Property | `502513568` — reshra-xyz |
| Web stream | `12074125440` — My Website |
| Measurement ID | `G-W085VX12Y0`, matching the website's existing configuration |
| Stream URI | `https://reshra.xyz` |
| Reporting timezone | `Etc/GMT` |

## Applied and confirmed

Created four event-scoped custom dimensions: **Release** (`release`), **Player** (`player`), **View mode** (`view_mode`), and **Placement** (`placement`). All four were absent from the intended definitions before preparation and present in the subsequent API readback. Each was configured with ads personalization disabled.

Existing legacy dimensions **Link destination**, **Link label**, **Link type**, and **Note action** were preserved and reused for the historical reports. No property or stream was created or replaced.

## Deferred until the manual release and verification

| Setting | Before preparation | Confirmed after preparation | Later action |
| --- | --- | --- | --- |
| Automatic history changes | Enabled | Enabled | Disable after the matching website is deployed |
| Automatic video engagement | Enabled | Enabled | Disable after the matching website is deployed |
| `music_listen_click` key-event marker | Not present | Not present | Mark only after deployed event counts are verified |
| `music_play_start` key-event marker | Not present | Not present | Mark only after deployed event counts are verified |

The old production site's automatic tracking stays active until deployment. The current historical report has no rows for either new music event, so key-event marking is intentionally deferred. The after-deployment tool checks the live analytics version before activation; key-event marking is a separate subsequent phase.

The actual historical baseline and refresh instructions are in [historical GA4 reports](reports.md). GA4 preparation, live-site analytics compatibility, event ingestion, and final key-event marking are separate pieces of evidence. DebugView and deployed-event counts are still pending the user's manual deployment.


## Post-deployment verification ? 28 October 2026

The user confirmed deployment. The live manual-tracking marker was verified,
automatic history-change/video-engagement collection was disabled, and the
settings were read back. A live browser session and the later GA realtime
report matched: three page views, one music playback request/start, one
listening click and one presentation change. Mode switching added no view.
The intended two music events were then marked as key events, counted once
per event, with successful readback. Existing dimensions were preserved.
See [release verification](../release-verification.md) for test traffic,
evidence limits, current media deployment and remaining search-account work.
The preparation-stage table above is historical; its activation deferrals
have now been completed. Frozen historical reports remain unchanged.

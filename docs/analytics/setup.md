# GA4 setup for the blog and music archive

The approved Desktop OAuth connection has been verified against property **502513568** (`reshra-xyz`) and web stream **12074125440** (`G-W085VX12Y0`). Four reporting dimensions have been created and read back. Automatic page-history/video collection and key-event markers remain unchanged until the manual release and event verification. See the actual [change report](change-report.md) and [historical reports](reports.md).

## Alternative service account access

The user created `aiaccount@reshraxyz.iam.gserviceaccount.com` on 28 October. The current connection signs in as the approving Google user; switching to this service account is optional. Its email alone does not authenticate a local process.

1. In the existing GA4 property, open **Admin → Property access management → Add users**. Add that service-account email with the **Editor** role. This role can manage property settings; Administrator access is unnecessary for the planned changes. Assign this in Analytics itself, rather than relying on the Cloud project's IAM role. See [Analytics access management](https://support.google.com/analytics/answer/9305587?hl=en).
2. Enable the **Google Analytics Admin API** in Cloud project `reshraxyz`. See the [Admin API quickstart](https://developers.google.com/analytics/devguides/config/admin/v1/quickstart).
3. Authenticate locally. [Service-account impersonation](https://docs.cloud.google.com/docs/authentication/use-service-account-impersonation) uses short-lived credentials and avoids a persistent key. For a JSON-key handoff, use the service account's **Keys → Add key → Create new key → JSON**, following [Google's key instructions](https://docs.cloud.google.com/iam/docs/keys-create-delete). Store the downloaded file outside the repository, for example `C:\Users\Rares\.config\reshra\ga4-service-account.json`, and share its local path rather than its contents. The tool uses Google's official authentication library to obtain short-lived tokens in memory from that file or explicitly configured ADC; it also accepts an existing scoped access token.
4. Supply the numeric GA4 property ID from **Admin → Property details**. Inspect the authorized property/streams and match the site's measurement ID before preparing changes.

No service-account key or token belongs in the React application, source files or chat. Account inspection and the change proposal come before writes. Create/reuse definitions as preparation; coordinate overlapping automatic-measurement changes with the manual website deployment so the old production code keeps its current tracking until release.

The user confirmed that production is `https://reshra.xyz` and that they will deploy manually at the very end, after being asked. Do not deploy automatically or request a production shell connection for this workflow. Run the remaining public verification after the user confirms the manual deployment.

## Desktop OAuth client handoff

The user subsequently supplied property **502513568** and a **Desktop OAuth client JSON** shown in their IDE. This file identifies an OAuth app and contains no service-account private key or user refresh token. This route signs in as the Google user who approves consent; that user needs access to the property. It does not use the service-account identity above.

`scripts/ga4-login.cjs` uses Google's official OAuth client with PKCE and a random state, binds a callback only on `127.0.0.1`, and waits for the user to complete browser consent. It requests Analytics read/edit scopes for the requested inspection/setup. No authorization codes or tokens need to be pasted into chat. See [Google's Desktop OAuth flow](https://developers.google.com/identity/protocols/oauth2/native-app).

```powershell
$env:GA4_OAUTH_CLIENT_FILE='C:\path\to\downloaded-desktop-client.json'
yarn.cmd ga4:login
# After completing the printed Google sign-in link:
$env:GOOGLE_APPLICATION_CREDENTIALS='C:\Users\Rares\.config\reshra\ga4-authorized-user.json'
$env:GA4_PROPERTY_ID='502513568'
yarn.cmd ga4:plan --discover
yarn.cmd ga4:plan
```

The helper creates the authorized-user credential outside the repository, refuses to overwrite an existing output, and closes the callback after completion or a 15-minute timeout. `GA4_CREDENTIAL_OUTPUT` can choose a new output path outside the checkout. It logs the sign-in URL, granted scopes and output path, never the client secret, code verifier, authorization code or refresh/access tokens. Existing user OAuth grants retain their granted scopes; the planning command remains read-only through its request behavior.

Browser consent is complete. Authenticated property/stream inspection, dimension creation/readback, and historical reporting succeeded on 28 October 2026. The authorized-user file is at `C:\Users\Rares\.config\reshra\ga4-authorized-user.json`; it stays outside the repository. Existing user OAuth grants retain their granted read/edit scopes even when a command makes only read requests. Production event ingestion remains unverified.

## Site instrumentation

- `page_view`: initial load and content-path changes, including Back/Forward. Presentation-only changes use `view_mode_change`.
- `music_listen_click`: external music-service actions, with release, placement, destination, and view mode.
- `music_play_request`: local playback intent. `music_play_start` is separate and requires playback to advance/start.
- `video_start`, `video_progress`, `video_complete`: controlled YouTube IFrame API events, with video URL/provider and release context when available.
- `notes_link_click`: external note resources and note actions, retaining the legacy `destination`, `label`, `type`, and `action` parameters alongside `view_mode`. Scratchpad and newsletter text are not event payloads.

GA delivery is limited to `reshra.xyz` and its actual subdomains. Localhost and preview hosts are excluded unless the build explicitly sets `REACT_APP_GA_DEBUG=true`. Local browser diagnostics remain available without sending traffic to Google. The historical reports identified 893 localhost page views; this gate prevents further accidental development traffic.

YouTube events are sent by the site's player integration. Disable automatic Enhanced Measurement video engagement to avoid duplicate events. Disable automatic history-based page changes because the site sends pathname page views itself. Initial automatic tag page views are disabled in the site's initialization.

## Apply only to the matching property and stream

Provide the target identity in the local process environment, not browser configuration or committed files:

```text
GA4_PROPERTY_ID
GA4_MEASUREMENT_ID
```

`GA4_STREAM_ID` is optional: the measurement ID must uniquely select one web stream. The CLI reads the existing project `.env` if present and can use `REACT_APP_GA_MEASUREMENT_ID` instead; shell values take precedence. It never writes the environment file. `--discover` can list authorized properties and web streams with no writes, optionally limited by `GA4_PROPERTY_ID`.

Choose one authentication method:

- `GOOGLE_APPLICATION_CREDENTIALS`: absolute local path to the authorized-user file, service-account credential file, or supported credential configuration. The file stays outside this checkout.
- `GA4_USE_ADC=1`: explicit opt-in to already configured Application Default Credentials, such as service-account impersonation. The tool does not silently select a developer's default Google identity.
- `GA4_ACCESS_TOKEN`: an existing scoped short-lived token in the process environment, when supplied by an authorized workflow.

The official [Google authentication library](https://github.com/googleapis/google-auth-library-nodejs) handles credentials and token refresh. The tool requests `analytics.readonly` for discovery/plans and `analytics.edit` for apply commands. Pre-supplied tokens need the appropriate scope. Credential content, signed assertions, and bearer tokens are not logged or written to reports.

The script checks the property/stream's measurement ID before writes. It reads existing dimensions, key events, and Enhanced Measurement settings before proposing changes, reuses existing definitions, and reads the resulting configuration back after applying.

```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS='C:\Users\Rares\.config\reshra\ga4-authorized-user.json'
$env:GA4_PROPERTY_ID='502513568'
# Discover or inspect; both commands are read-only:
yarn.cmd ga4:plan --discover
yarn.cmd ga4:plan
# Prepare only missing reporting dimensions (already completed):
yarn.cmd ga4:plan --apply
# Only after the user confirms the manual production deployment:
yarn.cmd ga4:plan --after-deploy
yarn.cmd ga4:plan --apply --after-deploy
# Only after real deployed event counts have been verified:
yarn.cmd ga4:plan --after-deploy --mark-key-events
yarn.cmd ga4:plan --apply --after-deploy --mark-key-events
```

The default command makes no writes. `--apply` prepares only missing event-scoped definitions (`release`, `player`, `view_mode`, `placement`); all four are already confirmed on this property. Automatic history/video measurement and key-event markers are left unchanged until the later stages. No replacement property or stream is created.

`--apply --after-deploy` additionally disables overlapping automatic history/video measurement. Before making any writes in that stage, it fetches the public `/blog` and requires the generated `reshra:analytics-mode=manual-v1` metadata. Public requests never receive Google authorization headers. The marker tolerates edge HTML formatting; it is a deployment-compatibility check, not proof that GA received events. A stale/challenged/failed response stops activation with no settings changed.

This staging preserves the old production code's automatic tracking until the user completes the manual deployment. The change report records the stream, measurement ID, previous values, definitions created/reused, deferred changes, successfully applied actions, and observed readback. Partial failures stop further writes and report the successful prefix; inspect that report before retrying.

`--apply --after-deploy --mark-key-events` is a separate final stage for `music_listen_click` and `music_play_start`. Use it only after checking real deployed event counts. It requires manual tracking to be active and refuses key-event writes while overlapping automatic collection is still enabled. The compatibility marker does not establish ingestion, and the tool cannot substitute for that count verification.

## Historical metrics and reports

`yarn.cmd ga4:reports` uses the same approved credentials and queries the account read-only. It creates an offline dashboard and 28 CSV tables for legacy events, with public-site and all-host scopes. The default cutoff is frozen at 27 October 2026. See [historical GA4 reports](reports.md) for the dashboard, actual baseline, refresh command, missing-parameter limits, and equivalent manual GA Report Library configurations. No saved Report Library screens were created through the APIs.

`yarn.cmd test:ga4` runs isolated API/authentication tests for read-only plans, correct stream selection, idempotent preparation, post-deployment activation, preserved unrelated settings, failed deployment checks, readback and partial failures. It also exercises the loopback OAuth callback with simulated credentials: state/PKCE validation, correct credential output, graceful response/close, secret-free logs and refusal to overwrite/write inside the checkout. These tests do not use real credentials and do not prove production account access or ingestion.

## Verification after configuration and deployment

1. Use DebugView with the actual property and deployed measurement ID.
2. Confirm exactly one initial page view; navigating Home → Music → recording adds one event per content path with the current title/location.
3. Confirm Back/Forward behavior and no extra page view for switching presentations.
4. Activate one external listening link from each placement and confirm the release/context parameters.
5. Test a local recording that plays, a missing recording, and YouTube playback. A failed player must not send a successful-start event; YouTube events must not be doubled by automatic collection.
6. Check custom definitions and key events in reports after processing. Count external clicks and local/video playback separately; they do not prove a stream occurred on an external platform.

The local browser test captures the same event payloads through a local diagnostic event while third-party analytics are blocked. That verifies site behavior, not successful ingestion by the production property.

Official references: [Admin API](https://developers.google.com/analytics/devguides/config/admin/v1/rest), [SPA measurement](https://developers.google.com/analytics/devguides/collection/ga4/single-page-applications), [Enhanced Measurement](https://support.google.com/analytics/answer/9216061?hl=en).

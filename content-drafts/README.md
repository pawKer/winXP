# Video article sources and drafts

These files are working editorial material. They are outside `public/` and `src/` and are not intended to be generated into public routes, RSS, or the sitemap automatically.

- [video-sources.json](video-sources.json) records public watch-page metadata, creator descriptions, available caption languages, and transcript-retrieval evidence for the MIDI, guitar modification, and NAM videos.
- [building-my-midi-pedal.md](building-my-midi-pedal.md) is an AI-assisted article draft based on the MIDI video's description, supplied chapter times, and the existing repository reference note. It explicitly lacks transcript grounding and author review.
- [retrieve-public-source.cjs](retrieve-public-source.cjs) reproduces the anonymous-browser transcript attempt for a supplied video ID. It uses a new temporary Chrome profile and never reads the user's signed-in profile. It writes a transcript artifact only if actual segments are returned.

## Retrieval result, 27 October 2026

All four public watch pages returned usable metadata and advertised an English auto-generated caption track. That establishes that the site describes a track; it does not establish that its text was retrieved.

The MIDI video's signed timedtext endpoints returned HTTP 200 with empty bodies in the tested JSON3, SRV3, VTT, and default formats. The public transcript-panel endpoint returned HTTP 400 `FAILED_PRECONDITION`, both from an anonymous HTTP context and from a fresh browser running the public page. Repeating the same requests is unlikely to help without a changed access condition. No caption text, transcript segments, or spoken-step timestamps were obtained.

The next useful input is a YouTube Studio subtitle export, a supplied transcript, or the original recording for transcription. The existing public description and chapter times are sufficient for a clearly attributed overview, but not for reconstructing wiring details or exact MIDI assignments.

On 28 October a read-only connection check for local Premiere source discovery returned a bridge timeout, before any project or media could be inspected. The user then chose **“Keep the current description-based draft for now.”** Further transcript/source retrieval is deferred; the draft and its unpublished/unreviewed status remain unchanged.

## Publication boundary

Review the exact sources and the draft's claim checklist before publishing. Keep the recording's upload/publication date separate from the article's first publication date. Do not claim the text is transcript-generated, author-reviewed, or a verified technical build guide until those statements are true.

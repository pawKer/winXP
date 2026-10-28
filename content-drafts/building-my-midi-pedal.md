---
title: 'A six-switch MIDI controller: Pedalino Mini 6 and HX Stomp'
suggestedPath: /blog/building-my-midi-pedal
publicationStatus: draft
author: reshra
sourceVideoId: xHmpTT-fVG4
sourceVideoUrl: https://www.youtube.com/watch?v=xHmpTT-fVG4
sourceLanguage: en
sourceVideoPublishedAt: 2026-08-05T01:00:15-07:00
draftCreatedAt: 2026-10-27
aiAssisted: true
authorReviewComplete: false
transcriptRetrieved: false
sourceBasis: public video description, creator-supplied chapters, existing repository resource note
---

> Editorial status: AI-assisted, unreviewed draft. This is a description-grounded companion, **not a transcript summary**. Caption tracks were advertised by YouTube, but no transcript text could be retrieved. Technical procedures and unverified values have deliberately been left out. Do not publish as an author-reviewed tutorial until the checks below are resolved.

# A six-switch MIDI controller: Pedalino Mini 6 and HX Stomp

This project brings six extra footswitches to a guitar setup using a custom Pedalino Mini 6 controller. The video follows the build from the parts overview through wiring and a timelapse, then shows how the controller fits into an HX Stomp workflow.

The project also documents reshra's first experience using 3D-printed parts. The accompanying [MIDI Pedal resource note](/notes/midi-pedal) collects the parts, project links, and GPIO mapping associated with the build.

## Watch the build

[Building a Custom Pedalino Mini 6 MIDI Controller](https://www.youtube.com/watch?v=xHmpTT-fVG4) — 18 minutes 40 seconds.

The chapter times supplied in the video's description are:

| Time | Section |
| --- | --- |
| [00:00](https://www.youtube.com/watch?v=xHmpTT-fVG4&t=0s) | Part 1 — Intro |
| [01:26](https://www.youtube.com/watch?v=xHmpTT-fVG4&t=86s) | Parts overview |
| [02:47](https://www.youtube.com/watch?v=xHmpTT-fVG4&t=167s) | Part 2 — Wiring deep dive |
| [07:30](https://www.youtube.com/watch?v=xHmpTT-fVG4&t=450s) | Part 3 — Wiring timelapse |
| [11:10](https://www.youtube.com/watch?v=xHmpTT-fVG4&t=670s) | Part 4 — How I use it with the HX Stomp |

## What the extra switches are for

In the setup described alongside the video, the HX Stomp mostly stays on one preset. Snapshots change between different gain settings, while the additional switches are available to toggle effects or parameter values.

The useful starting point is the set of changes needed during playing: which changes should happen together, and which should stay available independently. The video description also raises other possibilities, such as using a separate MIDI bank for each HX Stomp preset or sending a sequence of MIDI messages to change several things together. These are possibilities to explore, rather than a tested configuration supplied by this article.

USB MIDI control is not limited to guitar equipment. The creator also points to computer uses such as triggering OBS scene changes, shortcuts, or macros. The software and message mapping needed for those uses still have to be chosen for the intended setup.

## Understanding Pedalino's “pedal” abstraction

The video's description includes a clarification that helps explain the software's terminology. A configured “pedal” represents a TRS-style connection rather than necessarily one physical footswitch.

A TRS connection has tip, ring, and sleeve contacts. Depending on the configuration, those contacts can support a single momentary footswitch, two footswitches, an expression pedal, or another compatible device. If only one momentary switch is used, one control is assigned and the remaining signal connection may be unused.

This explains why counting configured pedals and counting physical switches can produce different numbers. It is not a wiring diagram: the exact connector pins, board GPIO assignments, electrical requirements, and firmware settings need to be checked against the project files before building.

## Parts, mapping, and further reading

Use the [MIDI Pedal.txt resource list](/notes/midi-pedal) for the maintained links to PedalinoMini/PedalinoMini-6, the parts list, GPIO mapping, and HX MIDI references. Keeping these references together makes it possible to update a resource without changing the video's historical description.

The on-screen display and LED behavior deserve a separate explanation. The creator says this synchronization includes custom code particular to the Pedalino setup and was not covered in detail in the video. This article therefore does not present that behavior as a stock feature or give an invented synchronization procedure.

## Next addition

After checking the transcript and build files, this companion can gain the exact switch-to-GPIO table, the demonstrated message assignments, and a small diagram showing how the controller connects to the HX Stomp. Until those sources are verified, the original video and linked mapping remain the references for implementation details.

---

## Editorial claim-check list — not public article copy

- [x] Confirmed source title, author/channel, duration, video publication date, and advertised English auto-caption track from the public watch-page metadata.
- [x] Chapter names and start times are copied from the creator's public description, not estimated from generated text.
- [x] The six-extra-switches, snapshot/preset workflow, TRS abstraction, first use of 3D-printed parts, and custom display/LED caveat are supported by the public description.
- [ ] Obtain the full transcript or a YouTube Studio subtitle export. The draft currently has no transcript evidence.
- [ ] Verify exact board and shield variants against the video/build files before listing them as the demonstrated hardware.
- [ ] Inspect the on-screen wiring, connector contacts, GPIO table, power arrangement, and firmware settings before turning the overview into build instructions.
- [ ] Verify the three demonstrated HX Stomp scenarios, exact MIDI message types/numbers, and any sequences. Do not fill these gaps from guesses.
- [ ] Check whether display/LED synchronization code is publicly available and link it only if the artist intends to share it.
- [ ] Confirm the preferred article title, author voice, and whether any later changes should be distinguished from the original build.
- [ ] Verify resource links and affiliate labels in the linked note before publication.
- [ ] Have reshra review the draft; only then set `authorReviewComplete` and a real article publication date.

Source metadata and retrieval limitations are recorded in [video-sources.json](video-sources.json).

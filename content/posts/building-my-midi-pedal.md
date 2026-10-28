---
id: midi-pedal-build
title: Building a custom MIDI pedal
excerpt: A Pedalino Mini 6 build, the TRS wiring abstraction, and a chapter guide to using it with the HX Stomp.
videoId: xHmpTT-fVG4
noteIds:
  - midiPedal
topics:
  - midi
  - diy
chapters:
  - - 0
    - Introduction
  - - 86
    - Parts overview
  - - 167
    - Wiring deep dive
  - - 450
    - Wiring timelapse
  - - 670
    - Using it with the HX Stomp
status: published
publishedAt: 2026-08-05T01:00:15-07:00
dateSource: video
updatedAt: 2026-10-28
author: reshra
language: en
sourceUrl: https://www.youtube.com/watch?v=xHmpTT-fVG4
provenance: Video companion adapted from the official description and chapter list.
category: Projects
---

## One controller, several jobs

The build video brings together a Pedalino Mini 6 controller, 3D-printed parts, wiring, and practical HX Stomp use. Its description also points out that a USB MIDI pedal can trigger OBS scene changes or other computer shortcuts, as well as control music gear.

## Making sense of the TRS abstraction

The description clarifies that a “pedal” in the Pedalino software represents a TRS connection: tip, ring, and sleeve/ground. That abstraction can represent different physical controls. A single momentary footswitch does not need to use every available connection.

Use the wiring chapter and linked GPIO mapping for the connector assignments in this specific build.

## Using it with the HX Stomp

The artist describes mostly staying on one preset, changing gain settings with snapshots, and using the extra switches to toggle effects or parameters. The description notes that display and LED-state synchronization used custom Pedalino-specific code and is not covered as a general recipe.

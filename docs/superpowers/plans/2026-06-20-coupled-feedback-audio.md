# Coupled Feedback Audio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make both local desktop pet windows visibly and audibly react to interactions, with clearer role naming and stronger visual distinction.

**Architecture:** Extend the existing pure `demoState` mood values to distinguish sender and receiver feedback, then map those moods to CSS animations and speech. Add a tiny Web Audio helper in `App.tsx` that plays generated tones only when the current viewer is not muted.

**Tech Stack:** React, TypeScript, CSS animations, Web Audio API, Vitest.

---

## Tasks

- [x] Add failing state tests for sender/receiver moods.
- [x] Extend `demoState` mood values and send/playback logic.
- [x] Update pet speech, CSS feedback states, and role labels.
- [x] Add generated interaction sounds respecting mute.
- [x] Run `npm.cmd test`, `npm.cmd run build`, and desktop preview smoke test.
- [ ] Commit and push.

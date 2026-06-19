# Local Dual Window Desktop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing web demo into a local Electron desktop demo with two synced windows and local JSON persistence.

**Architecture:** Electron main owns the canonical `DemoState`, applies typed actions, persists JSON under `app.getPath("userData")`, and broadcasts snapshots to both renderer windows. React renderers use a small sync hook that talks to Electron IPC when available and falls back to local state in browser mode.

**Tech Stack:** React, TypeScript, Vite, Tailwind CSS, Vitest, Electron.

---

## File Structure

- Modify `package.json`: add Electron dependency and desktop scripts.
- Modify `tsconfig.node.json`: compile Vite config and Electron sources.
- Create `electron/main.ts`: desktop shell, IPC, persistence, state store.
- Create `electron/preload.ts`: safe renderer API.
- Create `src/desktopApi.ts`: renderer-side API types and guards.
- Create `src/appActions.ts`: typed actions and reducer-like state application.
- Create `src/appActions.test.ts`: action behavior tests.
- Modify `src/App.tsx`: consume sync hook and render browser or desktop mode.
- Modify `src/demoState.ts`: add state validation and clone helpers if needed.
- Create `README.md`: setup, dev, desktop, test, build, and GitHub notes.

## Task 1: Shared Action Layer

**Files:**
- Create: `src/appActions.ts`
- Create: `src/appActions.test.ts`

- [x] Define a `DemoAction` union with `sendInteraction`, `setUserStatus`, `toggleUserFlag`, `clearHistory`, `resetDemo`, and `setFullscreenSimulation`.
- [x] Implement `applyDemoAction(state, action)` by delegating to existing pure functions.
- [x] Add Vitest tests for online, focus, offline, reset, and fullscreen action behavior.
- [x] Run `npm.cmd test`.

## Task 2: Electron Shell

**Files:**
- Create: `electron/main.ts`
- Create: `electron/preload.ts`
- Modify: `package.json`
- Modify: `tsconfig.node.json`

- [x] Add Electron as a dev dependency.
- [x] Add scripts: `desktop:dev`, `desktop:preview`, `build`.
- [x] Create two BrowserWindows with `?viewer=me` and `?viewer=partner`.
- [x] Expose `getState`, `dispatch`, `subscribe`, and `getViewerId` from preload.
- [x] Wire IPC handlers in main.

## Task 3: Persistence

**Files:**
- Modify: `electron/main.ts`
- Modify: `src/demoState.ts`
- Test: `src/appActions.test.ts`

- [x] Persist `DemoState` to `demo-state.json`.
- [x] Load persisted state on startup.
- [x] Fall back to `createInitialState()` when persisted data is missing or invalid.
- [x] Keep persistence failures non-fatal.

## Task 4: Renderer Sync

**Files:**
- Create: `src/desktopApi.ts`
- Modify: `src/App.tsx`

- [x] Add a hook that uses Electron IPC when `window.desktopPet` exists.
- [x] Keep browser fallback using local state.
- [x] In Electron mode, current window actions use its `viewerId`.
- [x] In browser mode, keep the existing three-panel demo behavior.

## Task 5: Documentation and Verification

**Files:**
- Create: `README.md`

- [x] Document install, browser dev, desktop dev, tests, build, and persistence location.
- [x] Run `npm.cmd test`.
- [x] Run `npm.cmd run build`.
- [x] Run desktop command far enough to confirm Electron starts or report the exact blocker.
- [x] Commit and push the completed changes to GitHub.

## Self-Review

- Spec coverage: desktop shell, dual-window sync, persistence, browser fallback, tests, docs, and non-goals are covered.
- Placeholder scan: no TBD/TODO placeholders.
- Type consistency: action names match the approved spec and planned IPC API.

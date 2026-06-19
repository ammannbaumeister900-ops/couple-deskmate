# Local Dual Window Desktop Design

## Scope

Build the next product stage as a local-only desktop demo. The app opens two independent desktop windows on the same computer:

- `me`: Xiao Yu's window.
- `partner`: A Shu's window.

The two windows share one local state model. Interactions, status changes, message cards, pending queues, offline capsules, and shared-home metrics sync between the windows in real time. This stage does not include accounts, public networking, mobile clients, chat, payments, Live2D, or a deployed backend.

## Recommended Architecture

Use Electron as the desktop shell.

- Electron main process owns the canonical `DemoState`.
- Each renderer window receives a `viewerId` through its URL query string.
- Renderers send typed actions to the main process through IPC.
- The main process applies actions using the existing pure state functions in `src/demoState.ts`.
- After each action, the main process broadcasts the updated state to both windows.
- State is persisted to a local JSON file under Electron `app.getPath("userData")`.

The existing Vite React app remains usable in browser dev mode. When Electron APIs are unavailable, the UI falls back to local in-memory demo state.

## Components

### Electron Main

Responsibilities:

- Create two BrowserWindows.
- Load Vite dev server in desktop development.
- Load built `dist/index.html` in desktop production.
- Read persisted state at startup.
- Save state after every successful action.
- Handle reset by restoring `createInitialState()`.
- Broadcast state snapshots to all windows.

### Electron Preload

Expose a minimal API on `window.desktopPet`:

- `getState()`
- `dispatch(action)`
- `subscribe(listener)`
- `getViewerId()`

No Node APIs are exposed directly to renderer code.

### Renderer Sync Layer

Add a small state hook that hides the runtime difference:

- Electron runtime: use IPC state from the main process.
- Browser runtime: use existing local React state behavior.

Renderer components should dispatch intent-level actions rather than mutating state directly.

### State Actions

Minimum action set:

- `sendInteraction`
- `setUserStatus`
- `toggleUserFlag`
- `clearHistory`
- `resetDemo`
- `setFullscreenSimulation`

Queued playback stays in the pure state layer: switching a user back to `online` plays pending and capsule messages.

## Persistence

Persist the whole `DemoState` as JSON. On startup:

1. Try to read persisted JSON.
2. Validate that it has the basic expected shape.
3. Fall back to `createInitialState()` on missing, invalid, or unreadable data.

This keeps the demo robust without adding a database.

## UI Behavior

Each desktop window should feel like one user's own desktop pet:

- The current user's desktop panel is primary.
- The partner's presence can be shown compactly or as a secondary panel.
- Shared home remains visible.
- Interaction buttons always send from the current window's user to the other user.
- Status and mode toggles update the current user's state.
- The existing browser three-column demo can remain as a fallback demo view.

## Error Handling

- Failed persistence should not crash the app; log and continue in memory.
- Failed IPC calls should show a small UI fallback/error state only if needed.
- Invalid persisted state should be ignored and replaced with initial state.

## Testing

Automated tests:

- Existing `demoState` tests must keep passing.
- Add tests for action application:
  - online interaction updates the shared state.
  - focus interaction creates pending messages.
  - offline interaction creates capsules.
  - switching back to online plays queued messages.
  - reset restores initial state.

Verification commands:

- `npm.cmd test`
- `npm.cmd run build`
- Desktop development run command opens two windows and syncs them.

Manual acceptance:

- Launch desktop app.
- Confirm two windows open.
- Send each of the four interactions from one window and see the other update.
- Set partner to focus, send an interaction, then return online and see it play.
- Set partner offline, send interactions, restart app, return online and see capsules preserved and played.
- Reset demo and confirm both windows return to initial state.

## Non-Goals

- No real remote networking.
- No account or login system.
- No full IM/chat.
- No cloud persistence.
- No asset pipeline or Live2D integration.
- No payment, marketplace, or social features.

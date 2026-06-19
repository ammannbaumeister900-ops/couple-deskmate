# Couple Deskmate

Local-first desktop pet demo for couples. The current build supports both the original browser demo and an Electron desktop mode with two local windows that sync through the Electron main process.

## Requirements

- Node.js 20+
- npm

## Install

```powershell
npm install
```

## Browser Demo

```powershell
npm run dev
```

Open the Vite URL shown in the terminal. Browser mode keeps the original three-column demo in one page.

## Desktop Demo

```powershell
npm run desktop:dev
```

This starts Vite, then opens two Electron windows:

- `me`: Xiao Yu's desktop pet window.
- `partner`: A Shu's desktop pet window.

Actions sent in one window are applied in the Electron main process and broadcast to both windows.

The app also exposes a desktop-only `退出` button in the header. It saves the current demo snapshot and exits both windows.

## Windows Desktop Launcher

For this workspace, a desktop launcher can run the production preview:

```text
C:\Users\admin\Desktop\Couple Deskmate.cmd
```

The tracked helper script is `scripts/start-desktop-preview.cmd`.

## Production Preview

```powershell
npm run desktop:preview
```

This builds the web and Electron code, then opens the desktop app from the generated `dist/` files.

## Tests

```powershell
npm test
```

## Build

```powershell
npm run build
```

The build compiles Electron sources into `electron-dist/` and the web app into `dist/`.

## Local Persistence

Electron mode stores the demo snapshot in:

```text
<Electron userData>/demo-state.json
```

If the file is missing or invalid, the app falls back to the initial demo state. Persistence errors are logged and do not crash the app.

## Non-Goals

- No real remote networking.
- No account system.
- No full chat.
- No cloud database.
- No mobile client.

import { app, BrowserWindow, ipcMain } from "electron";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  applyDemoAction,
  AppSnapshot,
  createInitialSnapshot,
  DemoAction,
  isAppSnapshot,
} from "../src/appActions.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const isDev = process.argv.includes("--dev");
const devServerUrl = process.env.ELECTRON_VITE_DEV_SERVER_URL ?? "http://127.0.0.1:5173";
const windows = new Set<BrowserWindow>();

let snapshot: AppSnapshot = createInitialSnapshot();

function statePath() {
  return join(app.getPath("userData"), "demo-state.json");
}

function loadSnapshot() {
  try {
    const parsed = JSON.parse(readFileSync(statePath(), "utf8")) as unknown;
    snapshot = isAppSnapshot(parsed) ? parsed : createInitialSnapshot();
  } catch {
    snapshot = createInitialSnapshot();
  }
}

function saveSnapshot() {
  try {
    writeFileSync(statePath(), JSON.stringify(snapshot, null, 2), "utf8");
  } catch (error) {
    console.error("Failed to persist demo state", error);
  }
}

function broadcastSnapshot() {
  for (const win of windows) {
    if (!win.isDestroyed()) {
      win.webContents.send("desktop-pet:state-changed", snapshot);
    }
  }
}

async function loadWindow(win: BrowserWindow, viewer: "me" | "partner") {
  if (isDev) {
    await win.loadURL(`${devServerUrl}?viewer=${viewer}`);
    return;
  }

  await win.loadFile(join(__dirname, "../../dist/index.html"), {
    query: { viewer },
  });
}

function createPetWindow(viewer: "me" | "partner", x: number) {
  const win = new BrowserWindow({
    width: 720,
    height: 900,
    x,
    y: 60,
    title: viewer === "me" ? "Couple Deskmate - Me" : "Couple Deskmate - Partner",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: join(__dirname, "preload.js"),
    },
  });

  windows.add(win);
  win.on("closed", () => windows.delete(win));
  void loadWindow(win, viewer);
}

ipcMain.handle("desktop-pet:get-state", () => snapshot);

ipcMain.handle("desktop-pet:dispatch", (_event, action: DemoAction) => {
  snapshot = applyDemoAction(snapshot, action);
  saveSnapshot();
  broadcastSnapshot();
  return snapshot;
});

app.whenReady().then(() => {
  loadSnapshot();
  createPetWindow("me", 80);
  createPetWindow("partner", 840);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createPetWindow("me", 80);
      createPetWindow("partner", 840);
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

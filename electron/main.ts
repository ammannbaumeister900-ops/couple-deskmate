import { app, BrowserWindow, ipcMain } from "electron";
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
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
const isRoleVerification = process.argv.includes("--verify-visible-roles");
const devServerUrl = process.env.ELECTRON_VITE_DEV_SERVER_URL ?? "http://127.0.0.1:5173";
const windows = new Set<BrowserWindow>();

let snapshot: AppSnapshot = createInitialSnapshot();

app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

function verificationLog(message: string) {
  if (!isRoleVerification) return;
  const tmpDir = join(__dirname, "../../tmp");
  mkdirSync(tmpDir, { recursive: true });
  appendFileSync(join(tmpDir, "visible-roles.log"), `${message}\n`);
  console.log(message);
}

if (isRoleVerification) {
  const tmpDir = join(__dirname, "../../tmp");
  mkdirSync(tmpDir, { recursive: true });
  writeFileSync(join(tmpDir, "visible-roles.log"), "verify-start=true\n");
  setTimeout(() => {
    verificationLog("verify-timeout=true");
    app.exit(2);
  }, 20000);
}

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

async function verifyVisibleRoles(win: BrowserWindow) {
  verificationLog("verify-window-loaded=true");
  await new Promise((resolve) => setTimeout(resolve, 1500));
  const bodyText = (await win.webContents.executeJavaScript("document.body.innerText")) as string;
  const roleVisibility = (await win.webContents.executeJavaScript(`(() => {
    const headings = [...document.querySelectorAll("h2")].map((node) => {
      const rect = node.getBoundingClientRect();
      return {
        text: node.textContent ?? "",
        visible: rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth,
      };
    });
    return {
      xiaoyu: headings.some((item) => item.text.includes("小鱼") && item.visible),
      ashu: headings.some((item) => item.text.includes("阿树") && item.visible),
    };
  })()`)) as { xiaoyu: boolean; ashu: boolean };
  const tmpDir = join(__dirname, "../../tmp");
  const hasXiaoyu = bodyText.includes("小鱼");
  const hasAshu = bodyText.includes("阿树");
  const hasDesktopApi = bodyText.includes("退出");

  mkdirSync(tmpDir, { recursive: true });
  verificationLog(hasXiaoyu ? "has-xiaoyu=true" : "has-xiaoyu=false");
  verificationLog(hasAshu ? "has-ashu=true" : "has-ashu=false");
  verificationLog(hasDesktopApi ? "has-desktop-api=true" : "has-desktop-api=false");
  verificationLog(roleVisibility.xiaoyu ? "xiaoyu-visible=true" : "xiaoyu-visible=false");
  verificationLog(roleVisibility.ashu ? "ashu-visible=true" : "ashu-visible=false");

  try {
    const image = await win.capturePage();
    writeFileSync(join(tmpDir, "visible-roles.png"), image.toPNG());
    verificationLog(`screenshot=${join(tmpDir, "visible-roles.png")}`);
  } catch (error) {
    verificationLog(`screenshot-error=${String(error)}`);
  }

  app.exit(hasXiaoyu && hasAshu && hasDesktopApi && roleVisibility.xiaoyu && roleVisibility.ashu ? 0 : 1);
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
      preload: join(__dirname, "preload.cjs"),
    },
  });

  windows.add(win);
  win.on("closed", () => windows.delete(win));
  void loadWindow(win, viewer).then(() => {
    if (isRoleVerification && viewer === "me") {
      void verifyVisibleRoles(win);
    }
  });
}

ipcMain.handle("desktop-pet:get-state", () => snapshot);

ipcMain.handle("desktop-pet:dispatch", (_event, action: DemoAction) => {
  snapshot = applyDemoAction(snapshot, action);
  saveSnapshot();
  broadcastSnapshot();
  return snapshot;
});

ipcMain.handle("desktop-pet:quit", () => {
  saveSnapshot();
  app.quit();
});

app.whenReady().then(() => {
  verificationLog("app-ready=true");
  loadSnapshot();
  createPetWindow("me", 80);
  if (!isRoleVerification) {
    createPetWindow("partner", 840);
  }

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

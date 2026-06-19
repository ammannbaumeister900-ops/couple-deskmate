import { contextBridge, ipcRenderer } from "electron";
import { AppSnapshot, DemoAction } from "../src/appActions.js";
import { UserId } from "../src/demoState.js";

function getViewerId(): UserId {
  const viewer = new URLSearchParams(window.location.search).get("viewer");
  return viewer === "partner" ? "partner" : "me";
}

contextBridge.exposeInMainWorld("desktopPet", {
  getViewerId,
  getState: () => ipcRenderer.invoke("desktop-pet:get-state") as Promise<AppSnapshot>,
  dispatch: (action: DemoAction) => ipcRenderer.invoke("desktop-pet:dispatch", action) as Promise<AppSnapshot>,
  quit: () => ipcRenderer.invoke("desktop-pet:quit") as Promise<void>,
  subscribe: (listener: (snapshot: AppSnapshot) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, snapshot: AppSnapshot) => listener(snapshot);
    ipcRenderer.on("desktop-pet:state-changed", handler);
    return () => ipcRenderer.removeListener("desktop-pet:state-changed", handler);
  },
});

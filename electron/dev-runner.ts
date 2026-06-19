import { spawn } from "node:child_process";
import { createConnection } from "node:net";
import electronPath from "electron";

const devServerUrl = "http://127.0.0.1:5173";

function waitForPort(port: number, host: string) {
  return new Promise<void>((resolve) => {
    const tryConnect = () => {
      const socket = createConnection(port, host);
      socket.once("connect", () => {
        socket.end();
        resolve();
      });
      socket.once("error", () => {
        socket.destroy();
        setTimeout(tryConnect, 250);
      });
    };
    tryConnect();
  });
}

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const vite = spawn(npmCommand, ["run", "dev", "--", "--host", "127.0.0.1"], {
  stdio: "inherit",
  shell: false,
});

await waitForPort(5173, "127.0.0.1");

const electron = spawn(electronPath as unknown as string, ["electron-dist/electron/main.js", "--dev"], {
  env: {
    ...process.env,
    ELECTRON_VITE_DEV_SERVER_URL: devServerUrl,
  },
  stdio: "inherit",
});

electron.on("exit", (code) => {
  vite.kill();
  process.exit(code ?? 0);
});

process.on("SIGINT", () => {
  electron.kill();
  vite.kill();
});

import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import config from "../vite.config";

describe("vite production asset paths", () => {
  it("uses relative asset paths so Electron loadFile can render dist/index.html", () => {
    expect(config.base).toBe("./");
  });

  it("does not leave a stale root vite.config.js that shadows vite.config.ts", () => {
    expect(existsSync("vite.config.js")).toBe(false);
  });
});

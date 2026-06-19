import { afterEach, describe, expect, it } from "vitest";
import { DesktopPetApi, getDesktopPetApi } from "./desktopApi";

const originalWindow = globalThis.window;

afterEach(() => {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: originalWindow,
  });
});

describe("desktop API access", () => {
  it("returns undefined when no browser window exists", () => {
    Reflect.deleteProperty(globalThis, "window");

    expect(getDesktopPetApi()).toBeUndefined();
  });

  it("exposes the desktop quit command when Electron provides it", () => {
    const api: DesktopPetApi = {
      getViewerId: () => "me",
      getState: async () => ({ isFullscreen: false, state: {} as never }),
      dispatch: async () => ({ isFullscreen: false, state: {} as never }),
      subscribe: () => () => undefined,
      quit: async () => undefined,
    };

    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { desktopPet: api },
    });

    expect(getDesktopPetApi()?.quit).toBe(api.quit);
  });
});

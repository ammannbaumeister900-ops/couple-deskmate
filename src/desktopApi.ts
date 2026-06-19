import { AppSnapshot, DemoAction } from "./appActions.js";
import { UserId } from "./demoState.js";

export interface DesktopPetApi {
  getViewerId: () => UserId;
  getState: () => Promise<AppSnapshot>;
  dispatch: (action: DemoAction) => Promise<AppSnapshot>;
  subscribe: (listener: (snapshot: AppSnapshot) => void) => () => void;
}

declare global {
  interface Window {
    desktopPet?: DesktopPetApi;
  }
}

export function getDesktopPetApi(): DesktopPetApi | undefined {
  return window.desktopPet;
}

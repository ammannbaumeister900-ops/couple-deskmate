import {
  clearHistory,
  createInitialState,
  DemoState,
  InteractionType,
  playQueuedMessages,
  sendInteraction,
  setUserStatus,
  toggleUserFlag,
  UserId,
  UserStatus,
} from "./demoState.js";

export type DemoAction =
  | { type: "sendInteraction"; fromUserId: UserId; interactionType: InteractionType }
  | { type: "setUserStatus"; userId: UserId; status: UserStatus }
  | { type: "toggleUserFlag"; userId: UserId; flag: "isMuted" | "isWorkMode" | "isClickThrough" }
  | { type: "clearHistory" }
  | { type: "resetDemo" }
  | { type: "setFullscreenSimulation"; isFullscreen: boolean };

export interface AppSnapshot {
  state: DemoState;
  isFullscreen: boolean;
}

export function createInitialSnapshot(): AppSnapshot {
  return {
    state: createInitialState(),
    isFullscreen: false,
  };
}

export function isAppSnapshot(value: unknown): value is AppSnapshot {
  if (!value || typeof value !== "object") return false;
  const snapshot = value as Partial<AppSnapshot>;
  if (typeof snapshot.isFullscreen !== "boolean") return false;
  if (!snapshot.state || typeof snapshot.state !== "object") return false;
  const state = snapshot.state as Partial<DemoState>;
  return Boolean(state.users && state.messages && state.timeline && state.sharedHome);
}

export function applyDemoAction(snapshot: AppSnapshot, action: DemoAction): AppSnapshot {
  if (action.type === "sendInteraction") {
    const toUserId = action.fromUserId === "me" ? "partner" : "me";
    return {
      ...snapshot,
      state: sendInteraction(snapshot.state, action.fromUserId, toUserId, action.interactionType),
    };
  }

  if (action.type === "setUserStatus") {
    const changed = setUserStatus(snapshot.state, action.userId, action.status);
    return {
      ...snapshot,
      state: action.status === "online" ? playQueuedMessages(changed, action.userId) : changed,
    };
  }

  if (action.type === "toggleUserFlag") {
    return {
      ...snapshot,
      state: toggleUserFlag(snapshot.state, action.userId, action.flag),
    };
  }

  if (action.type === "clearHistory") {
    return {
      ...snapshot,
      state: clearHistory(snapshot.state),
    };
  }

  if (action.type === "resetDemo") {
    return createInitialSnapshot();
  }

  return {
    ...snapshot,
    isFullscreen: action.isFullscreen,
  };
}

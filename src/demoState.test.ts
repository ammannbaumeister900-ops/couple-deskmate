import { describe, expect, it } from "vitest";
import {
  createInitialState,
  playQueuedMessages,
  sendInteraction,
  setUserStatus,
} from "./demoState";

describe("couple desktop pet interaction state", () => {
  it("plays an interaction immediately when the receiver is online", () => {
    const state = sendInteraction(createInitialState(), "me", "partner", "pat");

    expect(state.messages.at(-1)?.status).toBe("played");
    expect(state.users.me.mood).toBe("patSent");
    expect(state.users.partner.mood).toBe("patReceived");
    expect(state.sharedHome.todayInteractionCount).toBe(1);
  });

  it("queues an interaction when the receiver is focused", () => {
    const focused = setUserStatus(createInitialState(), "partner", "focus");
    const state = sendInteraction(focused, "me", "partner", "hug");

    expect(state.messages.at(-1)?.status).toBe("pending");
    expect(state.users.partner.pendingCount).toBe(1);
    expect(state.users.partner.mood).toBe("focus");
  });

  it("stores an offline capsule and plays it after returning online", () => {
    const offline = setUserStatus(createInitialState(), "partner", "offline");
    const withCapsule = sendInteraction(offline, "me", "partner", "miss");

    expect(withCapsule.messages.at(-1)?.status).toBe("capsule");
    expect(withCapsule.users.partner.capsuleCount).toBe(1);

    const online = setUserStatus(withCapsule, "partner", "online");
    const played = playQueuedMessages(online, "partner");

    expect(played.messages.at(-1)?.status).toBe("played");
    expect(played.users.partner.capsuleCount).toBe(0);
    expect(played.users.partner.mood).toBe("missReceived");
  });
});

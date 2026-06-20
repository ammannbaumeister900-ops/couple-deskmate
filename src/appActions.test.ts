import { describe, expect, it } from "vitest";
import { applyDemoAction, createInitialSnapshot } from "./appActions";

describe("app action layer", () => {
  it("plays online interactions into the shared state", () => {
    const snapshot = applyDemoAction(createInitialSnapshot(), {
      type: "sendInteraction",
      fromUserId: "me",
      interactionType: "pat",
    });

    expect(snapshot.state.messages.at(-1)?.status).toBe("played");
    expect(snapshot.state.users.me.mood).toBe("patSent");
    expect(snapshot.state.users.partner.mood).toBe("patReceived");
    expect(snapshot.state.sharedHome.todayInteractionCount).toBe(1);
  });

  it("queues focus interactions until the receiver returns online", () => {
    const focused = applyDemoAction(createInitialSnapshot(), {
      type: "setUserStatus",
      userId: "partner",
      status: "focus",
    });
    const queued = applyDemoAction(focused, {
      type: "sendInteraction",
      fromUserId: "me",
      interactionType: "hug",
    });
    const played = applyDemoAction(queued, {
      type: "setUserStatus",
      userId: "partner",
      status: "online",
    });

    expect(queued.state.messages.at(-1)?.status).toBe("pending");
    expect(queued.state.users.partner.pendingCount).toBe(1);
    expect(played.state.messages.at(-1)?.status).toBe("played");
    expect(played.state.users.partner.pendingCount).toBe(0);
  });

  it("keeps offline capsules in state until the receiver returns online", () => {
    const offline = applyDemoAction(createInitialSnapshot(), {
      type: "setUserStatus",
      userId: "partner",
      status: "offline",
    });
    const capsule = applyDemoAction(offline, {
      type: "sendInteraction",
      fromUserId: "me",
      interactionType: "miss",
    });
    const played = applyDemoAction(capsule, {
      type: "setUserStatus",
      userId: "partner",
      status: "online",
    });

    expect(capsule.state.messages.at(-1)?.status).toBe("capsule");
    expect(capsule.state.users.partner.capsuleCount).toBe(1);
    expect(played.state.messages.at(-1)?.status).toBe("played");
    expect(played.state.users.partner.capsuleCount).toBe(0);
  });

  it("resets the demo snapshot", () => {
    const changed = applyDemoAction(createInitialSnapshot(), {
      type: "setFullscreenSimulation",
      isFullscreen: true,
    });
    const reset = applyDemoAction(changed, { type: "resetDemo" });

    expect(reset.isFullscreen).toBe(false);
    expect(reset.state.messages).toHaveLength(0);
  });
});

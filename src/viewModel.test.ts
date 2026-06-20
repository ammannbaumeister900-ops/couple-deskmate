import { describe, expect, it } from "vitest";
import { desktopUserOrder } from "./viewModel";

describe("desktop user order", () => {
  it("shows both roles with the current viewer first", () => {
    expect(desktopUserOrder("me")).toEqual(["me", "partner"]);
    expect(desktopUserOrder("partner")).toEqual(["partner", "me"]);
  });
});

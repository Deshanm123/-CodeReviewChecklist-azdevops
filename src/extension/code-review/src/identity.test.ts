import { describe, expect, it } from "vitest";
import { isSameIdentity } from "./identity";

describe("isSameIdentity", () => {
  it("matches stable Azure DevOps identity IDs", () => {
    expect(isSameIdentity("user-1", "user-1")).toBe(true);
  });

  it("does not match different or missing IDs", () => {
    expect(isSameIdentity("user-1", "user-2")).toBe(false);
    expect(isSameIdentity("user-1", null)).toBe(false);
    expect(isSameIdentity(null, "user-1")).toBe(false);
  });
});


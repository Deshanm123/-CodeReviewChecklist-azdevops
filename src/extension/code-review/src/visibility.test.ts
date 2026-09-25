import { describe, expect, it } from "vitest";
import { isCodeReviewVisible } from "./visibility";

const config = {
  supportedWorkItemType: "Product Backlog Item",
  supportedStates: ["In Progress", "Code Review Pending"],
};

describe("isCodeReviewVisible", () => {
  it.each(["In Progress", "Code Review Pending"])("shows a PBI in %s", (state) => {
    expect(isCodeReviewVisible({ workItemType: "Product Backlog Item", state }, config)).toBe(true);
  });

  it.each(["Task", "Bug", "Feature", "Epic"])("hides a %s", (workItemType) => {
    expect(isCodeReviewVisible({ workItemType, state: "In Progress" }, config)).toBe(false);
  });

  it.each(["New", "Done", "Removed"])("hides a PBI in %s", (state) => {
    expect(isCodeReviewVisible({ workItemType: "Product Backlog Item", state }, config)).toBe(false);
  });
});


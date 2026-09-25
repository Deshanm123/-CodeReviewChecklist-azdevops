import { describe, expect, it } from "vitest";
import { isReviewVisible } from "./visibility";

const config = {
  supportedWorkItemType: "Product Backlog Item",
};

describe("isReviewVisible", () => {
  it("shows a PBI without checking its state", () => {
    expect(isReviewVisible({ workItemType: "Product Backlog Item" }, config)).toBe(true);
  });

  it.each(["Task", "Bug", "Feature", "Epic"])("hides a %s", (workItemType) => {
    expect(isReviewVisible({ workItemType }, config)).toBe(false);
  });
});

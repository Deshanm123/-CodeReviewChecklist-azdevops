import { describe, expect, it } from "vitest";
import { AppError } from "../../errors.js";
import { parseCreateRequest, parseDoneRequest } from "./validation.js";

const validRequest = {
  organizationId: "org-1",
  projectId: "project-1",
  workItemId: 42,
  reviewType: "Code",
  task: "Fix retry limit",
  severity: "Critical",
};

describe("review finding validation", () => {
  it("accepts a valid create request", () => {
    expect(parseCreateRequest(validRequest)).toEqual(validRequest);
  });

  it("rejects empty task text", () => {
    expectValidationError(() => parseCreateRequest({ ...validRequest, task: "  " }), "task");
  });

  it("rejects an unsupported severity", () => {
    expectValidationError(
      () => parseCreateRequest({ ...validRequest, severity: "Blocker" }),
      "severity",
    );
  });

  it("rejects an unsupported review type", () => {
    expectValidationError(
      () => parseCreateRequest({ ...validRequest, reviewType: "UX" }),
      "reviewType",
    );
  });

  it("accepts close and reopen status requests", () => {
    expect(parseDoneRequest({ done: true })).toEqual({ done: true });
    expect(parseDoneRequest({ done: false })).toEqual({ done: false });
  });
});

function expectValidationError(action: () => unknown, field: string): void {
  try {
    action();
    throw new Error("Expected validation to fail.");
  } catch (error) {
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe("REVIEW_FINDING_VALIDATION_FAILED");
    expect((error as AppError).errors).toHaveProperty(field);
  }
}

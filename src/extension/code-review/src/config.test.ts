import { describe, expect, it } from "vitest";
import { normalizeApiUrl } from "./config";

describe("normalizeApiUrl", () => {
  it("adds the API prefix to a deployment root URL", () => {
    expect(normalizeApiUrl("https://codereviewchecklistazdevops.vercel.app/")).toBe(
      "https://codereviewchecklistazdevops.vercel.app/api",
    );
  });

  it("does not duplicate an existing API prefix", () => {
    expect(normalizeApiUrl("https://codereviewchecklistazdevops.vercel.app/api/")).toBe(
      "https://codereviewchecklistazdevops.vercel.app/api",
    );
  });
});

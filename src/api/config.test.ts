import { describe, expect, it } from "vitest";
import { isAllowedOrigin } from "./config.js";

describe("isAllowedOrigin", () => {
  const allowed = ["https://dev.azure.com", "https://*.gallerycdn.vsassets.io"];

  it("allows exact and configured subdomain origins", () => {
    expect(isAllowedOrigin("https://dev.azure.com", allowed)).toBe(true);
    expect(isAllowedOrigin("https://publisher.gallerycdn.vsassets.io", allowed)).toBe(true);
  });

  it("rejects lookalike and insecure origins", () => {
    expect(isAllowedOrigin("https://gallerycdn.vsassets.io.example.com", allowed)).toBe(false);
    expect(isAllowedOrigin("http://publisher.gallerycdn.vsassets.io", allowed)).toBe(false);
  });
});

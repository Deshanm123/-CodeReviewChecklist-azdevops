import { describe, expect, it } from "vitest";
import { configureDatabaseUrl } from "./database-url.js";

describe("configureDatabaseUrl", () => {
  it("keeps an explicit DATABASE_URL", () => {
    const environment = {
      DATABASE_URL: "postgresql://primary.example/reviews",
      dev_DATABASE_URL: "postgresql://fallback.example/reviews",
    };

    expect(configureDatabaseUrl(environment)).toBe("DATABASE_URL");
    expect(environment.DATABASE_URL).toBe("postgresql://primary.example/reviews");
  });

  it("promotes a managed prefixed URL when DATABASE_URL is blank", () => {
    const environment = {
      DATABASE_URL: "   ",
      dev_DATABASE_URL: "postgresql://managed.example/reviews",
    };

    expect(configureDatabaseUrl(environment)).toBe("dev_DATABASE_URL");
    expect(environment.DATABASE_URL).toBe("postgresql://managed.example/reviews");
  });

  it("fails before Prisma starts when every supported URL is empty", () => {
    expect(() => configureDatabaseUrl({ DATABASE_URL: "" })).toThrow(
      "A non-empty database URL is required.",
    );
  });
});

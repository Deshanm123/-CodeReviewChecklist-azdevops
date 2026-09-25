import { describe, expect, it, vi } from "vitest";
import type { DeveloperResolver } from "../../azure-devops.js";
import { AppError } from "../../errors.js";
import type { ReviewFindingRepository } from "./repository.js";
import { ReviewFindingService } from "./service.js";
import type { NewReviewFinding, ReviewFinding } from "./types.js";

class MemoryRepository implements ReviewFindingRepository {
  findings: ReviewFinding[];
  markDoneCalls = 0;

  constructor(findings: ReviewFinding[] = []) {
    this.findings = findings;
  }

  async create(input: NewReviewFinding): Promise<ReviewFinding> {
    const finding = makeFinding({ ...input });
    this.findings.push(finding);
    return finding;
  }

  async findAll(): Promise<ReviewFinding[]> {
    return [...this.findings];
  }

  async findById(id: string): Promise<ReviewFinding | null> {
    return this.findings.find((finding) => finding.id === id) ?? null;
  }

  async markDone(id: string, _version: number, actorId: string): Promise<ReviewFinding> {
    this.markDoneCalls += 1;
    const finding = await this.findById(id);
    if (!finding) throw new Error("not found");
    finding.done = true;
    finding.doneBy = actorId;
    finding.doneAt = new Date("2026-09-25T03:00:00.000Z");
    return finding;
  }
}

function resolver(developerId = "developer-1"): DeveloperResolver {
  return {
    verifyWorkItemAccess: vi.fn().mockResolvedValue(undefined),
    resolveDeveloperId: vi.fn().mockResolvedValue(developerId),
  };
}

describe("ReviewFindingService", () => {
  it("orders findings Critical to Minor, then by creation time", async () => {
    const repository = new MemoryRepository([
      makeFinding({ id: "minor", severity: "Minor", createdAt: new Date("2026-09-25T00:00:00Z") }),
      makeFinding({ id: "critical-later", severity: "Critical", createdAt: new Date("2026-09-25T02:00:00Z") }),
      makeFinding({ id: "high", severity: "High", createdAt: new Date("2026-09-25T00:00:00Z") }),
      makeFinding({ id: "critical-earlier", severity: "Critical", createdAt: new Date("2026-09-25T01:00:00Z") }),
    ]);
    const service = new ReviewFindingService(repository, resolver(), "org-1");

    const findings = await service.list({ organizationId: "org-1", projectId: "project-1", workItemId: 42 });

    expect(findings.map((finding) => finding.id)).toEqual([
      "critical-earlier",
      "critical-later",
      "high",
      "minor",
    ]);
  });

  it("lets the live assigned Developer resolve a finding", async () => {
    const repository = new MemoryRepository([makeFinding()]);
    const service = new ReviewFindingService(repository, resolver("developer-1"), "org-1");

    const finding = await service.markDone("finding-1", "developer-1", "token");

    expect(finding.done).toBe(true);
    expect(finding.doneBy).toBe("developer-1");
    expect(repository.markDoneCalls).toBe(1);
  });

  it("rejects a non-Developer even if the client attempted a direct call", async () => {
    const repository = new MemoryRepository([makeFinding()]);
    const service = new ReviewFindingService(repository, resolver("developer-1"), "org-1");

    await expect(service.markDone("finding-1", "reviewer-1", "token")).rejects.toMatchObject({
      statusCode: 403,
      code: "DEVELOPER_PERMISSION_REQUIRED",
    });
    expect(repository.markDoneCalls).toBe(0);
  });

  it("does not resolve a finding from another configured organization", async () => {
    const repository = new MemoryRepository([
      makeFinding({ organizationId: "another-org" }),
    ]);
    const developerResolver = resolver("developer-1");
    const service = new ReviewFindingService(repository, developerResolver, "org-1");

    await expect(service.markDone("finding-1", "developer-1", "token")).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(developerResolver.resolveDeveloperId).not.toHaveBeenCalled();
  });

  it("fails closed when live Developer resolution fails", async () => {
    const repository = new MemoryRepository([makeFinding()]);
    const failedResolver: DeveloperResolver = {
      verifyWorkItemAccess: vi.fn().mockResolvedValue(undefined),
      resolveDeveloperId: vi.fn().mockRejectedValue(
        new AppError(503, "AZURE_DEVOPS_UNAVAILABLE", "Unavailable"),
      ),
    };
    const service = new ReviewFindingService(repository, failedResolver, "org-1");

    await expect(service.markDone("finding-1", "developer-1", "token")).rejects.toMatchObject({
      statusCode: 503,
    });
    expect(repository.markDoneCalls).toBe(0);
  });

  it("calculates progress from persisted findings", async () => {
    const repository = new MemoryRepository([
      makeFinding({ id: "one", done: true }),
      makeFinding({ id: "two" }),
      makeFinding({ id: "three", done: true }),
    ]);
    const service = new ReviewFindingService(repository, resolver(), "org-1");

    await expect(
      service.summary({ organizationId: "org-1", projectId: "project-1", workItemId: 42 }),
    ).resolves.toEqual({ resolved: 2, total: 3 });
  });
});

function makeFinding(overrides: Partial<ReviewFinding> = {}): ReviewFinding {
  return {
    id: "finding-1",
    organizationId: "org-1",
    projectId: "project-1",
    workItemId: 42,
    task: "Fix retry limit",
    severity: "Medium",
    description: null,
    done: false,
    createdBy: "reviewer-1",
    createdAt: new Date("2026-09-25T00:00:00.000Z"),
    doneBy: null,
    doneAt: null,
    updatedAt: new Date("2026-09-25T00:00:00.000Z"),
    version: 1,
    idempotencyKey: "idempotency-key",
    ...overrides,
  };
}

import { Prisma, type PrismaClient } from "@prisma/client";
import type { WorkItemScope } from "../../../shared/review-findings.js";
import { AppError } from "../../errors.js";
import type { NewReviewFinding, ReviewFinding } from "./types.js";

export interface ReviewFindingRepository {
  create(input: NewReviewFinding): Promise<ReviewFinding>;
  findAll(scope: WorkItemScope): Promise<ReviewFinding[]>;
  findById(id: string): Promise<ReviewFinding | null>;
  setDone(id: string, version: number, actorId: string, done: boolean): Promise<ReviewFinding>;
}

export class PrismaReviewFindingRepository implements ReviewFindingRepository {
  constructor(private readonly database: PrismaClient) {}

  async create(input: NewReviewFinding): Promise<ReviewFinding> {
    try {
      return await this.database.reviewFinding.create({ data: input });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const existing = await this.database.reviewFinding.findUnique({
          where: {
            organizationId_projectId_workItemId_idempotencyKey: {
              organizationId: input.organizationId,
              projectId: input.projectId,
              workItemId: input.workItemId,
              idempotencyKey: input.idempotencyKey,
            },
          },
        });
        if (existing) return existing;
      }
      throw error;
    }
  }

  async findAll(scope: WorkItemScope): Promise<ReviewFinding[]> {
    return this.database.reviewFinding.findMany({
      where: scope,
      orderBy: { createdAt: "asc" },
    });
  }

  async findById(id: string): Promise<ReviewFinding | null> {
    return this.database.reviewFinding.findUnique({ where: { id } });
  }

  async setDone(
    id: string,
    version: number,
    actorId: string,
    done: boolean,
  ): Promise<ReviewFinding> {
    const result = await this.database.reviewFinding.updateMany({
      where: { id, version, done: !done },
      data: done
        ? {
            done: true,
            doneBy: actorId,
            doneAt: new Date(),
            resolutionAttempts: { increment: 1 },
            version: { increment: 1 },
          }
        : {
            done: false,
            doneBy: null,
            doneAt: null,
            version: { increment: 1 },
          },
    });

    const finding = await this.findById(id);
    if (!finding) {
      throw new AppError(404, "REVIEW_FINDING_NOT_FOUND", "The review finding was not found.");
    }
    if (result.count === 0 && finding.done !== done) {
      throw new AppError(
        409,
        "REVIEW_FINDING_CONFLICT",
        "The review finding changed while its status was being updated. Refresh and try again.",
      );
    }
    return finding;
  }
}

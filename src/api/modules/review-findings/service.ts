import {
  compareFindingsBySeverity,
  type CreateReviewFindingRequest,
  type ReviewFindingDto,
  type ReviewFindingSummary,
  type WorkItemScope,
} from "../../../shared/review-findings.js";
import type { DeveloperResolver } from "../../azure-devops.js";
import { AppError } from "../../errors.js";
import type { ReviewFindingRepository } from "./repository.js";
import type { ReviewFinding } from "./types.js";

export class ReviewFindingService {
  constructor(
    private readonly repository: ReviewFindingRepository,
    private readonly developerResolver: DeveloperResolver,
    private readonly organizationId: string,
  ) {}

  async create(
    input: CreateReviewFindingRequest,
    actorId: string,
    idempotencyKey: string,
  ): Promise<ReviewFindingDto> {
    const finding = await this.repository.create({
      ...input,
      description: input.description ?? null,
      createdBy: actorId,
      idempotencyKey,
    });
    return toDto(finding);
  }

  async list(scope: WorkItemScope): Promise<ReviewFindingDto[]> {
    const findings = (await this.repository.findAll(scope)).map(toDto);
    return findings.sort(compareFindingsBySeverity);
  }

  async summary(scope: WorkItemScope): Promise<ReviewFindingSummary> {
    const findings = await this.repository.findAll(scope);
    return {
      resolved: findings.filter((finding) => finding.done).length,
      total: findings.length,
    };
  }

  async markDone(
    id: string,
    actorId: string,
    bearerToken: string,
  ): Promise<ReviewFindingDto> {
    const finding = await this.repository.findById(id);
    if (!finding) {
      throw new AppError(404, "REVIEW_FINDING_NOT_FOUND", "The review finding was not found.");
    }
    if (finding.organizationId !== this.organizationId) {
      throw new AppError(404, "REVIEW_FINDING_NOT_FOUND", "The review finding was not found.");
    }

    const developerId = await this.developerResolver.resolveDeveloperId(scopeOf(finding), bearerToken);
    if (developerId !== actorId) {
      throw new AppError(
        403,
        "DEVELOPER_PERMISSION_REQUIRED",
        "Only the assigned Developer can resolve findings.",
      );
    }

    if (finding.done) return toDto(finding);
    return toDto(await this.repository.markDone(id, finding.version, actorId));
  }
}

function scopeOf(finding: ReviewFinding): WorkItemScope {
  return {
    organizationId: finding.organizationId,
    projectId: finding.projectId,
    workItemId: finding.workItemId,
  };
}

function toDto(finding: ReviewFinding): ReviewFindingDto {
  return {
    id: finding.id,
    organizationId: finding.organizationId,
    projectId: finding.projectId,
    workItemId: finding.workItemId,
    task: finding.task,
    severity: finding.severity,
    description: finding.description,
    done: finding.done,
    createdBy: finding.createdBy,
    createdAt: finding.createdAt.toISOString(),
    doneBy: finding.doneBy,
    doneAt: finding.doneAt?.toISOString() ?? null,
    updatedAt: finding.updatedAt.toISOString(),
    version: finding.version,
  };
}

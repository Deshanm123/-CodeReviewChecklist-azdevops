import type { ReviewType, Severity, WorkItemScope } from "../../../shared/review-findings.js";

export interface ReviewFinding extends WorkItemScope {
  id: string;
  reviewType: ReviewType;
  task: string;
  severity: Severity;
  description: string | null;
  done: boolean;
  resolutionAttempts: number;
  createdBy: string;
  createdAt: Date;
  doneBy: string | null;
  doneAt: Date | null;
  updatedAt: Date;
  version: number;
  idempotencyKey: string;
}

export interface NewReviewFinding extends WorkItemScope {
  reviewType: ReviewType;
  task: string;
  severity: Severity;
  description: string | null;
  createdBy: string;
  idempotencyKey: string;
}

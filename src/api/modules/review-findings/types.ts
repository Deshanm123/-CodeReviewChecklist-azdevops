import type { Severity, WorkItemScope } from "../../../shared/review-findings.js";

export interface ReviewFinding extends WorkItemScope {
  id: string;
  task: string;
  severity: Severity;
  description: string | null;
  done: boolean;
  createdBy: string;
  createdAt: Date;
  doneBy: string | null;
  doneAt: Date | null;
  updatedAt: Date;
  version: number;
  idempotencyKey: string;
}

export interface NewReviewFinding extends WorkItemScope {
  task: string;
  severity: Severity;
  description: string | null;
  createdBy: string;
  idempotencyKey: string;
}


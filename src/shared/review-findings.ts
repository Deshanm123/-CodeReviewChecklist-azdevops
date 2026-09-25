export const SEVERITIES = ["Minor", "Low", "Medium", "High", "Critical"] as const;

export type Severity = (typeof SEVERITIES)[number];

export interface WorkItemScope {
  organizationId: string;
  projectId: string;
  workItemId: number;
}

export interface ReviewFindingDto extends WorkItemScope {
  id: string;
  task: string;
  severity: Severity;
  description: string | null;
  done: boolean;
  createdBy: string;
  createdAt: string;
  doneBy: string | null;
  doneAt: string | null;
  updatedAt: string;
  version: number;
}

export interface ReviewFindingSummary {
  resolved: number;
  total: number;
}

export interface CreateReviewFindingRequest extends WorkItemScope {
  task: string;
  severity: Severity;
  description?: string;
}

const SEVERITY_RANK: Record<Severity, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
  Minor: 4,
};

export function isSeverity(value: unknown): value is Severity {
  return typeof value === "string" && SEVERITIES.includes(value as Severity);
}

export function compareFindingsBySeverity(
  left: Pick<ReviewFindingDto, "severity" | "createdAt">,
  right: Pick<ReviewFindingDto, "severity" | "createdAt">,
): number {
  const severityDifference = SEVERITY_RANK[left.severity] - SEVERITY_RANK[right.severity];
  return severityDifference || left.createdAt.localeCompare(right.createdAt);
}


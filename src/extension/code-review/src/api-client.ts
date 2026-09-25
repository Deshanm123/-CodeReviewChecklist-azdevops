import * as SDK from "azure-devops-extension-sdk";
import type {
  CreateReviewFindingRequest,
  ReviewFindingDto,
  ReviewFindingSummary,
  WorkItemScope,
} from "../../../shared/review-findings";

interface ApiErrorBody {
  code?: string;
  message?: string;
  errors?: Record<string, string[]>;
  correlationId?: string;
}

export class ReviewFindingsApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly correlationId?: string,
  ) {
    super(message);
    this.name = "ReviewFindingsApiError";
  }
}

export class ReviewFindingsApiClient {
  constructor(private readonly apiUrl: string) {}

  async list(scope: WorkItemScope): Promise<ReviewFindingDto[]> {
    const response = await this.request<{ findings: ReviewFindingDto[] }>(
      `/review-findings?${scopeQuery(scope)}`,
    );
    return response.findings;
  }

  async summary(scope: WorkItemScope): Promise<ReviewFindingSummary> {
    return this.request(`/review-findings/summary?${scopeQuery(scope)}`);
  }

  async create(
    input: CreateReviewFindingRequest,
    idempotencyKey: string,
  ): Promise<ReviewFindingDto> {
    return this.request("/review-findings", {
      method: "POST",
      headers: { "Idempotency-Key": idempotencyKey },
      body: JSON.stringify(input),
    });
  }

  async markDone(id: string): Promise<ReviewFindingDto> {
    return this.request(`/review-findings/${encodeURIComponent(id)}/done`, {
      method: "PATCH",
      body: JSON.stringify({ done: true }),
    });
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await SDK.getAccessToken();
    const response = await fetch(`${this.apiUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...init.headers,
      },
    });

    const body = (await response.json().catch(() => ({}))) as T & ApiErrorBody;
    if (!response.ok) {
      throw new ReviewFindingsApiError(
        body.message ?? "The Code Review service request failed.",
        response.status,
        body.code ?? "UNKNOWN_API_ERROR",
        body.correlationId,
      );
    }
    return body;
  }
}

function scopeQuery(scope: WorkItemScope): string {
  return new URLSearchParams({
    organizationId: scope.organizationId,
    projectId: scope.projectId,
    workItemId: String(scope.workItemId),
  }).toString();
}


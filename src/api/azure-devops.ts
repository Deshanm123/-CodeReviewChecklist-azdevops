import type { WorkItemScope } from "../shared/review-findings.js";
import { AppError, dependencyError } from "./errors.js";

interface IdentityFieldValue {
  id?: string;
}

interface WorkItemResponse {
  fields?: Record<string, unknown>;
}

export interface DeveloperResolver {
  verifyWorkItemAccess(scope: WorkItemScope, bearerToken: string): Promise<void>;
  resolveDeveloperId(scope: WorkItemScope, bearerToken: string): Promise<string>;
}

export class AzureDevOpsWorkItemGateway implements DeveloperResolver {
  constructor(
    private readonly organizationUrl: string,
    private readonly developerFieldReferenceName: string,
  ) {}

  async verifyWorkItemAccess(scope: WorkItemScope, bearerToken: string): Promise<void> {
    await this.fetchWorkItem(scope, bearerToken, ["System.Id"]);
  }

  async resolveDeveloperId(scope: WorkItemScope, bearerToken: string): Promise<string> {
    const workItem = await this.fetchWorkItem(scope, bearerToken, [this.developerFieldReferenceName]);
    const fieldValue = workItem.fields?.[this.developerFieldReferenceName];

    if (!isIdentityFieldValue(fieldValue) || !fieldValue.id) {
      throw new AppError(
        403,
        "DEVELOPER_NOT_RESOLVED",
        "The work item's Developer field does not contain a stable Azure DevOps identity.",
      );
    }
    return fieldValue.id;
  }

  private async fetchWorkItem(
    scope: WorkItemScope,
    bearerToken: string,
    fields: string[],
  ): Promise<WorkItemResponse> {
    const project = encodeURIComponent(scope.projectId);
    const url = new URL(
      `${this.organizationUrl}/${project}/_apis/wit/workitems/${scope.workItemId}`,
    );
    url.searchParams.set("fields", fields.join(","));
    url.searchParams.set("api-version", "7.1");

    let response: Response;
    try {
      response = await fetch(url, {
        headers: { Authorization: `Bearer ${bearerToken}`, Accept: "application/json" },
      });
    } catch {
      throw dependencyError("The work item could not be verified with Azure DevOps.");
    }

    if (response.status === 401) {
      throw new AppError(401, "INVALID_ACCESS_TOKEN", "The Azure DevOps access token is invalid or expired.");
    }
    if (response.status === 403) {
      throw new AppError(403, "WORK_ITEM_ACCESS_DENIED", "You do not have access to this work item.");
    }
    if (response.status === 404) {
      throw new AppError(404, "WORK_ITEM_NOT_FOUND", "The Azure DevOps work item was not found.");
    }
    if (!response.ok) {
      throw dependencyError("The work item could not be verified with Azure DevOps.");
    }

    return (await response.json()) as WorkItemResponse;
  }
}

function isIdentityFieldValue(value: unknown): value is IdentityFieldValue {
  return typeof value === "object" && value !== null;
}


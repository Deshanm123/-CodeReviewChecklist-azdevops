import {
  isSeverity,
  type CreateReviewFindingRequest,
  type WorkItemScope,
} from "../../../shared/review-findings.js";
import { AppError } from "../../errors.js";

type UnknownRecord = Record<string, unknown>;

export function parseScope(input: unknown): WorkItemScope {
  const value = asRecord(input);
  const errors: Record<string, string[]> = {};
  const organizationId = requiredString(value.organizationId, "organizationId", errors, 200);
  const projectId = requiredString(value.projectId, "projectId", errors, 200);
  const workItemId = positiveInteger(value.workItemId, "workItemId", errors);
  throwIfErrors(errors);
  return { organizationId, projectId, workItemId };
}

export function parseCreateRequest(input: unknown): CreateReviewFindingRequest {
  const value = asRecord(input);
  const scope = parseScope(value);
  const errors: Record<string, string[]> = {};
  const task = requiredString(value.task, "task", errors, 500);
  const description = optionalString(value.description, "description", errors, 4_000);

  const severity = isSeverity(value.severity) ? value.severity : null;
  if (!severity) {
    errors.severity = ["Severity must be one of Minor, Low, Medium, High, Critical."];
  }
  throwIfErrors(errors);

  return {
    ...scope,
    task,
    severity: severity!,
    ...(description === undefined ? {} : { description }),
  };
}

export function parseDoneRequest(input: unknown): { done: true } {
  const value = asRecord(input);
  if (value.done !== true) {
    throw validationError({ done: ["Done must be true. Reopening is not supported in the MVP."] });
  }
  return { done: true };
}

export function parseFindingId(input: unknown): string {
  const value = asRecord(input);
  const id = typeof value.id === "string" ? value.id.trim() : "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    throw validationError({ id: ["A valid review finding ID is required."] });
  }
  return id;
}

export function parseIdempotencyKey(input: string | string[] | undefined): string {
  const value = Array.isArray(input) ? input[0] : input;
  if (!value || value.length < 8 || value.length > 128) {
    throw validationError({ idempotencyKey: ["An Idempotency-Key header of 8 to 128 characters is required."] });
  }
  return value;
}

function asRecord(input: unknown): UnknownRecord {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw validationError({ request: ["A JSON object is required."] });
  }
  return input as UnknownRecord;
}

function requiredString(
  input: unknown,
  field: string,
  errors: Record<string, string[]>,
  maxLength: number,
): string {
  if (typeof input !== "string" || !input.trim()) {
    errors[field] = [`${field} is required.`];
    return "";
  }
  const value = input.trim();
  if (value.length > maxLength) errors[field] = [`${field} must be ${maxLength} characters or fewer.`];
  return value;
}

function optionalString(
  input: unknown,
  field: string,
  errors: Record<string, string[]>,
  maxLength: number,
): string | undefined {
  if (input === undefined || input === null || input === "") return undefined;
  if (typeof input !== "string") {
    errors[field] = [`${field} must be text.`];
    return undefined;
  }
  const value = input.trim();
  if (value.length > maxLength) errors[field] = [`${field} must be ${maxLength} characters or fewer.`];
  return value || undefined;
}

function positiveInteger(
  input: unknown,
  field: string,
  errors: Record<string, string[]>,
): number {
  const value = typeof input === "string" && input.trim() ? Number(input) : input;
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    errors[field] = [`${field} must be a positive integer.`];
    return 0;
  }
  return value;
}

function throwIfErrors(errors: Record<string, string[]>): void {
  if (Object.keys(errors).length > 0) throw validationError(errors);
}

function validationError(errors: Record<string, string[]>): AppError {
  return new AppError(
    422,
    "REVIEW_FINDING_VALIDATION_FAILED",
    "The review finding request is invalid.",
    errors,
  );
}

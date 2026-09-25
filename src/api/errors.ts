export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly errors: Record<string, string[]> | undefined;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
  }
}

export function dependencyError(message: string): AppError {
  return new AppError(503, "AZURE_DEVOPS_UNAVAILABLE", message);
}

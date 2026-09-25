import { AppError } from "./errors.js";

export interface ApiConfig {
  port: number;
  azureDevOpsOrganizationUrl: string;
  azureDevOpsOrganizationId: string;
  developerFieldReferenceName: string;
  allowedOrigins: string[];
}

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required.`);
  }
  return value;
}

export function loadConfig(): ApiConfig {
  const organizationUrl = required("AZURE_DEVOPS_ORGANIZATION_URL").replace(/\/$/, "");
  if (!organizationUrl.startsWith("https://")) {
    throw new Error("AZURE_DEVOPS_ORGANIZATION_URL must use HTTPS.");
  }

  const port = Number(process.env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("PORT must be a valid TCP port.");
  }

  return {
    port,
    azureDevOpsOrganizationUrl: organizationUrl,
    azureDevOpsOrganizationId: required("AZURE_DEVOPS_ORGANIZATION_ID"),
    developerFieldReferenceName: required("DEVELOPER_FIELD_REFERENCE_NAME"),
    allowedOrigins: (process.env.ALLOWED_ORIGINS ?? "https://dev.azure.com")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  };
}

export function assertOrganizationScope(actual: string, expected: string): void {
  if (actual !== expected) {
    throw new AppError(403, "ORGANIZATION_SCOPE_MISMATCH", "The requested organization is not allowed.");
  }
}

export function isAllowedOrigin(origin: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    if (origin === pattern) return true;
    if (!pattern.includes("*.")) return false;

    try {
      const originUrl = new URL(origin);
      const patternUrl = new URL(pattern.replace("*.", "placeholder."));
      const suffix = patternUrl.hostname.replace(/^placeholder\./, "");
      return originUrl.protocol === patternUrl.protocol && originUrl.hostname.endsWith(`.${suffix}`);
    } catch {
      return false;
    }
  });
}


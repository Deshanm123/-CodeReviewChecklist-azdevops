import type { FastifyRequest } from "fastify";
import { AppError, dependencyError } from "./errors.js";

export interface AuthenticatedUser {
  id: string;
  displayName: string;
}

interface ConnectionDataResponse {
  authenticatedUser?: {
    id?: string;
    providerDisplayName?: string;
  };
}

export function readBearerToken(request: FastifyRequest): string {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    throw new AppError(401, "AUTHENTICATION_REQUIRED", "A valid Azure DevOps access token is required.");
  }

  const token = authorization.slice("Bearer ".length).trim();
  if (!token) {
    throw new AppError(401, "AUTHENTICATION_REQUIRED", "A valid Azure DevOps access token is required.");
  }
  return token;
}

export class AzureDevOpsAuthenticator {
  constructor(private readonly organizationUrl: string) {}

  async authenticate(token: string): Promise<AuthenticatedUser> {
    let response: Response;
    try {
      const url = new URL(`${this.organizationUrl}/_apis/connectionData`);
      url.searchParams.set("connectOptions", "1");
      url.searchParams.set("lastChangeId", "-1");
      url.searchParams.set("lastChangeId64", "-1");
      response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
    } catch {
      throw dependencyError("Azure DevOps identity verification is temporarily unavailable.");
    }

    if (response.status === 401 || response.status === 403) {
      throw new AppError(401, "INVALID_ACCESS_TOKEN", "The Azure DevOps access token is invalid or expired.");
    }
    if (!response.ok) {
      throw dependencyError("Azure DevOps identity verification is temporarily unavailable.");
    }

    const data = (await response.json()) as ConnectionDataResponse;
    const id = data.authenticatedUser?.id;
    if (!id) {
      throw new AppError(401, "IDENTITY_NOT_RESOLVED", "The signed-in Azure DevOps identity could not be resolved.");
    }

    return {
      id,
      displayName: data.authenticatedUser?.providerDisplayName ?? "Azure DevOps user",
    };
  }
}


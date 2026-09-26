import type { FastifyInstance, FastifyRequest } from "fastify";
import type { WorkItemScope } from "../../../shared/review-findings.js";
import type { AzureDevOpsAuthenticator } from "../../auth.js";
import { readBearerToken } from "../../auth.js";
import type { DeveloperResolver } from "../../azure-devops.js";
import { assertOrganizationScope } from "../../config.js";
import type { ReviewFindingService } from "./service.js";
import {
  parseCreateRequest,
  parseDoneRequest,
  parseFindingId,
  parseIdempotencyKey,
  parseScope,
} from "./validation.js";

export interface ReviewFindingRouteDependencies {
  service: ReviewFindingService;
  authenticator: AzureDevOpsAuthenticator;
  workItems: DeveloperResolver;
  organizationId: string;
}

export async function registerReviewFindingRoutes(
  app: FastifyInstance,
  dependencies: ReviewFindingRouteDependencies,
): Promise<void> {
  const { service, authenticator, workItems, organizationId } = dependencies;

  app.get("/review-findings", async (request) => {
    const { scope, token } = await authenticateScope(request, request.query);
    await workItems.verifyWorkItemAccess(scope, token);
    return { findings: await service.list(scope) };
  });

  app.get("/review-findings/summary", async (request) => {
    const { scope, token } = await authenticateScope(request, request.query);
    await workItems.verifyWorkItemAccess(scope, token);
    return service.summary(scope);
  });

  app.post("/review-findings", async (request, reply) => {
    const token = readBearerToken(request);
    const user = await authenticator.authenticate(token);
    const input = parseCreateRequest(request.body);
    assertOrganizationScope(input.organizationId, organizationId);
    await workItems.verifyWorkItemAccess(input, token);
    const idempotencyKey = parseIdempotencyKey(request.headers["idempotency-key"]);
    const finding = await service.create(input, user.id, idempotencyKey);
    return reply.code(201).send(finding);
  });

  app.patch("/review-findings/:id/done", async (request) => {
    const token = readBearerToken(request);
    const user = await authenticator.authenticate(token);
    const id = parseFindingId(request.params);
    const { done } = parseDoneRequest(request.body);
    return service.setDone(id, user.id, token, done);
  });

  async function authenticateScope(
    request: FastifyRequest,
    input: unknown,
  ): Promise<{ scope: WorkItemScope; token: string }> {
    const token = readBearerToken(request);
    await authenticator.authenticate(token);
    const scope = parseScope(input);
    assertOrganizationScope(scope.organizationId, organizationId);
    return { scope, token };
  }
}

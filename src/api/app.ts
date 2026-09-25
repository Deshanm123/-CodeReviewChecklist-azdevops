import cors from "@fastify/cors";
import Fastify, { type FastifyInstance } from "fastify";
import { AzureDevOpsAuthenticator } from "./auth.js";
import { AzureDevOpsWorkItemGateway, type DeveloperResolver } from "./azure-devops.js";
import { isAllowedOrigin, loadConfig, type ApiConfig } from "./config.js";
import { AppError } from "./errors.js";
import {
  PrismaReviewFindingRepository,
  type ReviewFindingRepository,
} from "./modules/review-findings/repository.js";
import { registerReviewFindingRoutes } from "./modules/review-findings/routes.js";
import { ReviewFindingService } from "./modules/review-findings/service.js";
import { prisma } from "./prisma.js";

export interface AppOverrides {
  config?: ApiConfig;
  repository?: ReviewFindingRepository;
  authenticator?: AzureDevOpsAuthenticator;
  workItems?: DeveloperResolver;
  logger?: boolean;
}

export async function buildApp(overrides: AppOverrides = {}): Promise<FastifyInstance> {
  const config = overrides.config ?? loadConfig();
  const app = Fastify({
    logger:
      overrides.logger === false
        ? false
        : {
            redact: ["req.headers.authorization"],
          },
  });

  await app.register(cors, {
    origin(origin, callback) {
      if (!origin || isAllowedOrigin(origin, config.allowedOrigins)) {
        callback(null, true);
      } else {
        callback(new Error("Origin is not allowed."), false);
      }
    },
    allowedHeaders: ["Authorization", "Content-Type", "Idempotency-Key"],
    methods: ["GET", "POST", "PATCH", "OPTIONS"],
  });

  const repository = overrides.repository ?? new PrismaReviewFindingRepository(prisma);
  const authenticator =
    overrides.authenticator ?? new AzureDevOpsAuthenticator(config.azureDevOpsOrganizationUrl);
  const workItems =
    overrides.workItems ??
    new AzureDevOpsWorkItemGateway(
      config.azureDevOpsOrganizationUrl,
      config.developerFieldReferenceName,
    );
  const service = new ReviewFindingService(repository, workItems, config.azureDevOpsOrganizationId);

  app.get("/health", async () => ({ status: "ok" }));
  await app.register(
    async (api) => {
      await registerReviewFindingRoutes(api, {
        service,
        authenticator,
        workItems,
        organizationId: config.azureDevOpsOrganizationId,
      });
    },
    { prefix: "/api" },
  );

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      request.log.warn({ code: error.code, statusCode: error.statusCode }, error.message);
      return reply.code(error.statusCode).send({
        code: error.code,
        message: error.message,
        ...(error.errors ? { errors: error.errors } : {}),
        correlationId: request.id,
      });
    }

    const statusCode = clientErrorStatus(error);
    request.log.error({ err: error, correlationId: request.id }, "Unhandled request failure");
    return reply.code(statusCode).send({
      code: statusCode === 400 ? "INVALID_REQUEST" : "INTERNAL_SERVER_ERROR",
      message: statusCode === 400 ? "The request could not be parsed." : "An unexpected error occurred.",
      correlationId: request.id,
    });
  });

  return app;
}

function clientErrorStatus(error: unknown): number {
  if (typeof error !== "object" || error === null || !("statusCode" in error)) return 500;
  const statusCode = (error as { statusCode?: unknown }).statusCode;
  return typeof statusCode === "number" && statusCode >= 400 && statusCode < 500
    ? statusCode
    : 500;
}

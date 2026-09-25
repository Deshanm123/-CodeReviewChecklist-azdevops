CREATE TYPE "ReviewFindingSeverity" AS ENUM ('Minor', 'Low', 'Medium', 'High', 'Critical');

CREATE TABLE "ReviewFindings" (
    "id" UUID NOT NULL,
    "organizationId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "workItemId" INTEGER NOT NULL,
    "task" TEXT NOT NULL,
    "severity" "ReviewFindingSeverity" NOT NULL,
    "description" TEXT,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "doneBy" TEXT,
    "doneAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "idempotencyKey" TEXT NOT NULL,

    CONSTRAINT "ReviewFindings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ReviewFindings_organizationId_projectId_workItemId_severity_idx"
ON "ReviewFindings"("organizationId", "projectId", "workItemId", "severity");

CREATE UNIQUE INDEX "ReviewFindings_organizationId_projectId_workItemId_idempotencyKey_key"
ON "ReviewFindings"("organizationId", "projectId", "workItemId", "idempotencyKey");

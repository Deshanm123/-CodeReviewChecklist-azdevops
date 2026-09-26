CREATE TYPE "ReviewType" AS ENUM ('QA', 'Code', 'BA');

ALTER TABLE "ReviewFindings"
ADD COLUMN "reviewType" "ReviewType" NOT NULL DEFAULT 'Code',
ADD COLUMN "resolutionAttempts" INTEGER NOT NULL DEFAULT 0;

UPDATE "ReviewFindings"
SET "resolutionAttempts" = 1
WHERE "done" = true;

CREATE INDEX "ReviewFindings_organizationId_projectId_workItemId_reviewType_idx"
ON "ReviewFindings"("organizationId", "projectId", "workItemId", "reviewType");

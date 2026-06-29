-- Add project-level DMP responsibility reference
ALTER TABLE "ResearchProject" ADD COLUMN "dataManagerMemberId" TEXT;

-- Add funding metadata used by template selection and DMP generation
ALTER TABLE "Funding" ADD COLUMN "agencyType" TEXT NOT NULL DEFAULT 'other';
ALTER TABLE "Funding" ADD COLUMN "projectNumber" TEXT;
ALTER TABLE "Funding" ADD COLUMN "periodStart" DATETIME;
ALTER TABLE "Funding" ADD COLUMN "periodEnd" DATETIME;

-- Preserve existing grant numbers under the new domain terminology when available
UPDATE "Funding"
SET "projectNumber" = "grantNumber"
WHERE "projectNumber" IS NULL AND "grantNumber" IS NOT NULL;

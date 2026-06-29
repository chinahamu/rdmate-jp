-- AlterTable
ALTER TABLE "ResearchMember" ADD COLUMN "affiliationDepartment" TEXT;
ALTER TABLE "ResearchMember" ADD COLUMN "affiliationFaculty" TEXT;
ALTER TABLE "ResearchMember" ADD COLUMN "affiliationGraduateSchool" TEXT;
ALTER TABLE "ResearchMember" ADD COLUMN "affiliationInstitution" TEXT;
ALTER TABLE "ResearchMember" ADD COLUMN "affiliationLaboratory" TEXT;
ALTER TABLE "ResearchMember" ADD COLUMN "affiliationMajor" TEXT;
ALTER TABLE "ResearchMember" ADD COLUMN "nameEn" TEXT;
ALTER TABLE "ResearchMember" ADD COLUMN "nameJa" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ResearchProject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "expectedEndDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "projectNumber" TEXT,
    "institutionLocalProjectCode" TEXT,
    "preferredDmpLanguage" TEXT NOT NULL DEFAULT 'ja',
    "dataManagerName" TEXT,
    "dataManagerMemberId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ResearchProject" ("createdAt", "dataManagerMemberId", "dataManagerName", "expectedEndDate", "field", "id", "projectNumber", "startDate", "status", "summary", "title", "updatedAt") SELECT "createdAt", "dataManagerMemberId", "dataManagerName", "expectedEndDate", "field", "id", "projectNumber", "startDate", "status", "summary", "title", "updatedAt" FROM "ResearchProject";
DROP TABLE "ResearchProject";
ALTER TABLE "new_ResearchProject" RENAME TO "ResearchProject";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Funding_projectId_idx" ON "Funding"("projectId");

-- CreateIndex
CREATE INDEX "Funding_agencyType_idx" ON "Funding"("agencyType");

-- CreateIndex
CREATE INDEX "Funding_projectNumber_idx" ON "Funding"("projectNumber");

-- CreateIndex
CREATE INDEX "ResearchMember_projectId_idx" ON "ResearchMember"("projectId");

-- CreateIndex
CREATE INDEX "ResearchMember_affiliationInstitution_idx" ON "ResearchMember"("affiliationInstitution");

-- CreateIndex
CREATE INDEX "ResearchMember_affiliationFaculty_idx" ON "ResearchMember"("affiliationFaculty");

-- CreateIndex
CREATE INDEX "ResearchMember_affiliationDepartment_idx" ON "ResearchMember"("affiliationDepartment");

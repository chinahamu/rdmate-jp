-- CreateTable
CREATE TABLE "ResearchProject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "expectedEndDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "projectNumber" TEXT,
    "dataManagerName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ResearchMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "affiliation" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "orcid" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ResearchMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ResearchProject" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Funding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "agencyName" TEXT NOT NULL,
    "programName" TEXT NOT NULL,
    "grantNumber" TEXT,
    "fiscalYear" TEXT,
    "url" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Funding_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ResearchProject" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

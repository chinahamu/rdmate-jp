-- CreateTable
CREATE TABLE "Dataset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dataType" TEXT NOT NULL,
    "generatedDate" DATETIME NOT NULL,
    "lastUpdatedDate" DATETIME,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "status" TEXT NOT NULL DEFAULT 'unchecked',
    "createdBy" TEXT NOT NULL,
    "responsibleMemberId" TEXT NOT NULL,
    "publicationStatus" TEXT NOT NULL DEFAULT 'undecided',
    "plannedPublicationDate" DATETIME,
    "publicUrl" TEXT,
    "doi" TEXT,
    "license" TEXT,
    "usageTerms" TEXT,
    "citation" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Dataset_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ResearchProject" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DatasetStorageLocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "datasetId" TEXT NOT NULL,
    "label" TEXT,
    "uri" TEXT NOT NULL,
    "storageType" TEXT NOT NULL,
    "accessScope" TEXT,
    "hasBackup" BOOLEAN NOT NULL DEFAULT false,
    "isEncrypted" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DatasetStorageLocation_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DatasetFileManifestEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "datasetId" TEXT NOT NULL,
    "storageLocationId" TEXT,
    "fileName" TEXT NOT NULL,
    "relativePath" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "hashAlgorithm" TEXT NOT NULL DEFAULT 'none',
    "hashValue" TEXT,
    "mimeType" TEXT NOT NULL,
    "modifiedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DatasetFileManifestEntry_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DatasetFileManifestEntry_storageLocationId_fkey" FOREIGN KEY ("storageLocationId") REFERENCES "DatasetStorageLocation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DatasetMetadata" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "datasetId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "researchField" TEXT NOT NULL,
    "acquisitionMethod" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'ja',
    "publisher" TEXT,
    "rightsHolder" TEXT,
    "temporalStartDate" DATETIME,
    "temporalEndDate" DATETIME,
    "spatialPlaceName" TEXT,
    "spatialWest" REAL,
    "spatialSouth" REAL,
    "spatialEast" REAL,
    "spatialNorth" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DatasetMetadata_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DatasetMetadataCreator" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "metadataId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "affiliation" TEXT NOT NULL,
    "orcid" TEXT,
    "role" TEXT,
    CONSTRAINT "DatasetMetadataCreator_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "DatasetMetadata" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DatasetMetadataKeyword" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "metadataId" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    CONSTRAINT "DatasetMetadataKeyword_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "DatasetMetadata" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DatasetMetadataVariable" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "metadataId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT,
    "description" TEXT NOT NULL,
    "dataType" TEXT NOT NULL DEFAULT 'unknown',
    "unit" TEXT,
    "missingValue" TEXT,
    "vocabulary" TEXT,
    CONSTRAINT "DatasetMetadataVariable_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "DatasetMetadata" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DatasetRelatedPaper" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "metadataId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "paperType" TEXT NOT NULL DEFAULT 'journal_article',
    "doi" TEXT,
    "url" TEXT,
    "journalName" TEXT,
    "publicationYear" TEXT,
    "relation" TEXT NOT NULL DEFAULT 'isSupplementTo',
    CONSTRAINT "DatasetRelatedPaper_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "DatasetMetadata" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DatasetRelatedSoftware" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "metadataId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "softwareType" TEXT NOT NULL DEFAULT 'source_code',
    "url" TEXT,
    "version" TEXT,
    "license" TEXT,
    "runtimeEnvironment" TEXT,
    "relation" TEXT NOT NULL DEFAULT 'isSourceOf',
    CONSTRAINT "DatasetRelatedSoftware_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "DatasetMetadata" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DatasetRelatedOutput" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "datasetId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "doi" TEXT,
    "arxivId" TEXT,
    "arxivUrl" TEXT,
    "url" TEXT,
    "journalName" TEXT,
    "publicationYear" TEXT,
    "repositoryUrl" TEXT,
    "releaseTag" TEXT,
    "license" TEXT,
    "runtimeEnvironment" TEXT,
    "protocolId" TEXT,
    "protocolUrl" TEXT,
    "version" TEXT,
    "responsibleMemberId" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DatasetRelatedOutput_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProtocolChangeRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "relatedOutputId" TEXT NOT NULL,
    "changedAt" DATETIME NOT NULL,
    "version" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    CONSTRAINT "ProtocolChangeRecord_relatedOutputId_fkey" FOREIGN KEY ("relatedOutputId") REFERENCES "DatasetRelatedOutput" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DatasetPublicationDecision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "datasetId" TEXT NOT NULL,
    "containsPersonalInformation" BOOLEAN NOT NULL DEFAULT false,
    "hasCollaborativeAgreement" BOOLEAN NOT NULL DEFAULT false,
    "hasPatentPlan" BOOLEAN NOT NULL DEFAULT false,
    "nonPublicationReason" TEXT,
    "personalInformationHandling" TEXT,
    "collaborativeAgreementNote" TEXT,
    "patentPublicationNote" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DatasetPublicationDecision_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
CREATE INDEX "Dataset_projectId_idx" ON "Dataset"("projectId");

-- CreateIndex
CREATE INDEX "Dataset_dataType_idx" ON "Dataset"("dataType");

-- CreateIndex
CREATE INDEX "Dataset_status_idx" ON "Dataset"("status");

-- CreateIndex
CREATE INDEX "Dataset_publicationStatus_idx" ON "Dataset"("publicationStatus");

-- CreateIndex
CREATE INDEX "Dataset_responsibleMemberId_idx" ON "Dataset"("responsibleMemberId");

-- CreateIndex
CREATE INDEX "DatasetStorageLocation_datasetId_idx" ON "DatasetStorageLocation"("datasetId");

-- CreateIndex
CREATE INDEX "DatasetStorageLocation_storageType_idx" ON "DatasetStorageLocation"("storageType");

-- CreateIndex
CREATE INDEX "DatasetFileManifestEntry_datasetId_idx" ON "DatasetFileManifestEntry"("datasetId");

-- CreateIndex
CREATE INDEX "DatasetFileManifestEntry_storageLocationId_idx" ON "DatasetFileManifestEntry"("storageLocationId");

-- CreateIndex
CREATE INDEX "DatasetFileManifestEntry_relativePath_idx" ON "DatasetFileManifestEntry"("relativePath");

-- CreateIndex
CREATE UNIQUE INDEX "DatasetMetadata_datasetId_key" ON "DatasetMetadata"("datasetId");

-- CreateIndex
CREATE INDEX "DatasetMetadata_datasetId_idx" ON "DatasetMetadata"("datasetId");

-- CreateIndex
CREATE INDEX "DatasetMetadata_researchField_idx" ON "DatasetMetadata"("researchField");

-- CreateIndex
CREATE INDEX "DatasetMetadataCreator_metadataId_idx" ON "DatasetMetadataCreator"("metadataId");

-- CreateIndex
CREATE INDEX "DatasetMetadataKeyword_metadataId_idx" ON "DatasetMetadataKeyword"("metadataId");

-- CreateIndex
CREATE INDEX "DatasetMetadataKeyword_keyword_idx" ON "DatasetMetadataKeyword"("keyword");

-- CreateIndex
CREATE INDEX "DatasetMetadataVariable_metadataId_idx" ON "DatasetMetadataVariable"("metadataId");

-- CreateIndex
CREATE INDEX "DatasetMetadataVariable_name_idx" ON "DatasetMetadataVariable"("name");

-- CreateIndex
CREATE INDEX "DatasetRelatedPaper_metadataId_idx" ON "DatasetRelatedPaper"("metadataId");

-- CreateIndex
CREATE INDEX "DatasetRelatedPaper_doi_idx" ON "DatasetRelatedPaper"("doi");

-- CreateIndex
CREATE INDEX "DatasetRelatedSoftware_metadataId_idx" ON "DatasetRelatedSoftware"("metadataId");

-- CreateIndex
CREATE INDEX "DatasetRelatedSoftware_url_idx" ON "DatasetRelatedSoftware"("url");

-- CreateIndex
CREATE INDEX "DatasetRelatedOutput_datasetId_idx" ON "DatasetRelatedOutput"("datasetId");

-- CreateIndex
CREATE INDEX "DatasetRelatedOutput_kind_idx" ON "DatasetRelatedOutput"("kind");

-- CreateIndex
CREATE INDEX "DatasetRelatedOutput_relation_idx" ON "DatasetRelatedOutput"("relation");

-- CreateIndex
CREATE INDEX "DatasetRelatedOutput_doi_idx" ON "DatasetRelatedOutput"("doi");

-- CreateIndex
CREATE INDEX "DatasetRelatedOutput_repositoryUrl_idx" ON "DatasetRelatedOutput"("repositoryUrl");

-- CreateIndex
CREATE INDEX "DatasetRelatedOutput_protocolId_idx" ON "DatasetRelatedOutput"("protocolId");

-- CreateIndex
CREATE INDEX "ProtocolChangeRecord_relatedOutputId_idx" ON "ProtocolChangeRecord"("relatedOutputId");

-- CreateIndex
CREATE INDEX "ProtocolChangeRecord_version_idx" ON "ProtocolChangeRecord"("version");

-- CreateIndex
CREATE UNIQUE INDEX "DatasetPublicationDecision_datasetId_key" ON "DatasetPublicationDecision"("datasetId");

-- CreateIndex
CREATE INDEX "DatasetPublicationDecision_datasetId_idx" ON "DatasetPublicationDecision"("datasetId");

-- CreateIndex
CREATE INDEX "DatasetPublicationDecision_hasCollaborativeAgreement_idx" ON "DatasetPublicationDecision"("hasCollaborativeAgreement");

-- CreateIndex
CREATE INDEX "DatasetPublicationDecision_hasPatentPlan_idx" ON "DatasetPublicationDecision"("hasPatentPlan");

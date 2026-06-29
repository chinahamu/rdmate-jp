import { evaluateReproducibility } from '../domain/code-repository';
import { applyProjectMetadataAutofill } from '../domain/metadata';
import { createRepositoryExportBundle } from '../domain/repository-export';
import { validateStorageReferences } from '../domain/storage-reference';
import { listDmpTemplates, getDefaultDmpTemplateId } from './template-registry';
import { getSampleDatasets } from './sample-datasets';
import { getSampleResearchProject } from './sample-project';
import { createSampleFunderCheckReport } from './funder-check-rules';

export type ApiEnvelope<T> = Readonly<{
  apiVersion: 'v1';
  generatedAt: string;
  data: T;
}>;

export function apiEnvelope<T>(data: T): ApiEnvelope<T> {
  return {
    apiVersion: 'v1',
    generatedAt: '2026-06-29T00:00:00.000Z',
    data,
  };
}

export function listApiProjects() {
  const project = getSampleResearchProject();
  return [
    {
      ...project,
      datasetCount: getSampleDatasets().length,
      templateId: getDefaultDmpTemplateId(),
    },
  ];
}

export function listApiDmps() {
  const project = getSampleResearchProject();

  return [
    {
      id: 'sample-dmp',
      projectId: project.id,
      templateId: getDefaultDmpTemplateId(),
      title: `${project.title} DMP`,
      status: 'review_ready',
      answers: {
        dataTypes: ['survey_data', 'source_code'],
        storageLocations: ['GakuNin RDM', 'GitHub'],
        sharingPolicy: 'restricted',
        dataManagerMemberId: project.dataManagerMemberId,
      },
      updatedAt: '2026-06-29T00:00:00.000Z',
    },
  ];
}

export function listApiDatasets() {
  return getSampleDatasets();
}

export function listApiTemplates() {
  return listDmpTemplates({ includeDeprecated: true });
}

export function listApiExports() {
  const project = getSampleResearchProject();
  const dataset = getSampleDatasets()[0];

  if (!dataset) return [];

  const metadata = applyProjectMetadataAutofill(dataset, project);
  return createRepositoryExportBundle({ dataset, metadata, project }).map((output) => ({
    datasetId: output.datasetId,
    format: output.format,
    fileName: output.fileName,
    mimeType: output.mimeType,
    size: output.content.length,
  }));
}

export function listApiValidators() {
  const project = getSampleResearchProject();
  const datasets = getSampleDatasets();
  const storageIssues = validateStorageReferences(datasets);
  const funderReport = createSampleFunderCheckReport();
  const reproducibilityReports = project.codeRepositories.map((repository) =>
    evaluateReproducibility(repository),
  );

  return {
    storage: {
      status: storageIssues.length === 0 ? 'passed' : 'warning',
      issueCount: storageIssues.length,
      issues: storageIssues,
    },
    funderCheck: {
      status: funderReport.summary.status,
      score: funderReport.summary.score,
      issueCount: funderReport.summary.failedCount,
    },
    reproducibility: reproducibilityReports,
  };
}

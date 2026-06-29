import { getSampleDatasets } from './sample-datasets';
import { getSampleResearchProject } from './sample-project';
import {
  applyProjectMetadataAutofill,
  createDatasetMetadata,
  type DatasetMetadata,
} from '../domain/metadata';
import {
  createRepositoryExport,
  createRepositoryExportBundle,
  generateJairoCloudCsv,
  type RepositoryExport,
  type RepositoryExportContext,
  type RepositoryExportFormat,
} from '../domain/repository-export';

export function getSampleRepositoryExportContext(): RepositoryExportContext {
  const project = getSampleResearchProject();
  const dataset = getSampleDatasets().find((candidate) => candidate.id === 'dataset-analysis-code') ?? getSampleDatasets()[0];

  if (!dataset) {
    throw new Error('Sample dataset not found.');
  }

  const baseMetadata = applyProjectMetadataAutofill(dataset, project);
  const metadata: DatasetMetadata = createDatasetMetadata({
    ...baseMetadata,
    title: dataset.name,
    description: dataset.description,
    keywords: ['RDM', 'DMP', '研究データ管理', project.field],
    relatedPapers: [
      {
        id: 'paper-rdm-workflow-2026',
        title: 'RDM workflow paper',
        paperType: 'journal_article',
        doi: '10.1234/rdm.workflow.2026',
        journalName: 'Journal of Research Data Management',
        publicationYear: '2026',
        relation: 'IsSupplementTo',
      },
    ],
    relatedSoftware: [
      {
        id: 'software-rdmate-jp',
        name: 'RDMate JP',
        softwareType: 'source_code',
        url: 'https://github.com/chinahamu/rdmate-jp',
        version: dataset.version,
        license: dataset.license,
        runtimeEnvironment: 'TypeScript / Next.js',
        relation: 'IsSourceOf',
      },
    ],
  });

  return { dataset, metadata, project };
}

export function getSampleRepositoryExportBundle(): RepositoryExport[] {
  return createRepositoryExportBundle(getSampleRepositoryExportContext());
}

export function getSampleRepositoryExport(format: RepositoryExportFormat): RepositoryExport {
  return createRepositoryExport(format, getSampleRepositoryExportContext());
}

export function getSampleJairoCloudCsvForAllDatasets(): string {
  const project = getSampleResearchProject();
  const contexts = getSampleDatasets().map((dataset) => ({
    dataset,
    project,
    metadata: applyProjectMetadataAutofill(dataset, project),
  }));

  return generateJairoCloudCsv(contexts);
}

export function getRepositoryExportFormatLabel(format: RepositoryExportFormat): string {
  const labels: Record<RepositoryExportFormat, string> = {
    datacite_json: 'DataCite風JSON',
    jairo_cloud_csv: 'JAIRO Cloud想定CSV',
    dataverse_json: 'Dataverse JSON風',
    zenodo_json: 'Zenodo metadata JSON風',
  };

  return labels[format];
}

import { generateDatasetCsv } from '../domain/dataset';
import {
  createCompleteJsonExport,
  createRepositoryCsvExport,
  generateCompleteJson,
  previewDatasetCsvImport,
} from '../domain/import-export';
import { getSampleDmpExportContext } from './dmp-export-sample';
import { getSampleDatasets } from './sample-datasets';
import { getSampleManifestEntries } from './sample-storage-reference';
import { getSampleDatasetMetadata } from './sample-metadata';
import { getSampleRelatedOutputs } from './sample-related-outputs';
import { getSampleResearchProject } from './sample-project';

export function getSampleDatasetImportCsv(): string {
  const [surveyDataset, screenshotDataset] = getSampleDatasets();

  if (!surveyDataset || !screenshotDataset) {
    throw new Error('Sample datasets are not available.');
  }

  return generateDatasetCsv([
    {
      ...surveyDataset,
      id: 'dataset-import-preview-1',
      name: 'インポートプレビュー用データセット',
      doi: undefined,
      publicUrl: undefined,
    },
    {
      ...screenshotDataset,
      id: 'dataset-import-preview-1',
      name: 'インポートプレビュー用データセット',
      generatedDate: '2026-06-09',
      lastUpdatedDate: '2026-06-01',
    },
  ]);
}

export function getSampleDatasetImportPreview() {
  return previewDatasetCsvImport(getSampleDatasetImportCsv(), getSampleDatasets());
}

export function getSampleCompleteJsonExport(generatedAt = '2026-06-29T00:00:00.000Z') {
  return createCompleteJsonExport(
    getSampleDmpExportContext(generatedAt),
    getSampleDatasets(),
    getSampleDatasetMetadata(),
    getSampleManifestEntries(),
    getSampleRelatedOutputs(),
    generatedAt,
  );
}

export function getSampleCompleteJson(generatedAt = '2026-06-29T00:00:00.000Z'): string {
  return generateCompleteJson(getSampleCompleteJsonExport(generatedAt));
}

export function getSampleRepositoryCsvExport(generatedAt = '2026-06-29T00:00:00.000Z') {
  const project = getSampleResearchProject();
  const fundingSummary = project.funding
    .map((funding) => [funding.agencyName, funding.programName, funding.projectNumber].filter(Boolean).join(' '))
    .join('; ');

  return createRepositoryCsvExport(
    getSampleDatasets(),
    getSampleDatasetMetadata(),
    getSampleManifestEntries(),
    getSampleRelatedOutputs(),
    fundingSummary,
    generatedAt,
  );
}

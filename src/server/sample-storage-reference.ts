import { createFileManifestEntry } from '../domain/storage-reference';
import { getSampleDatasets } from './sample-datasets';

export function getSampleManifestEntries() {
  const datasets = getSampleDatasets();
  const surveyDataset = datasets.find((dataset) => dataset.id === 'dataset-user-test-raw');
  const codeDataset = datasets.find((dataset) => dataset.id === 'dataset-analysis-code');

  return [
    createFileManifestEntry({
      id: 'manifest-user-test-csv',
      datasetId: surveyDataset?.id ?? 'dataset-user-test-raw',
      fileName: 'responses_anonymized.csv',
      relativePath: 'survey/responses_anonymized.csv',
      sizeBytes: 248576,
      hashAlgorithm: 'sha256',
      hashValue: 'a6f2d7337d3f2c65f1674f6ed9ed60d7bb02d7aa9f1e03dd9cf8a2079e7d85ce',
      mimeType: 'text/csv',
      modifiedAt: '2026-06-10T10:30:00.000Z',
      storageLocationId: surveyDataset?.storageLocations[0]?.id,
    }),
    createFileManifestEntry({
      id: 'manifest-user-test-codebook',
      datasetId: surveyDataset?.id ?? 'dataset-user-test-raw',
      fileName: 'codebook.json',
      relativePath: 'survey/codebook.json',
      sizeBytes: 12890,
      hashAlgorithm: 'sha256',
      hashValue: '0b2d45887a4b69f0d7e16f2a5339d0f3b23bd08f2dfc9e8a8f3f3ec2b76d18aa',
      mimeType: 'application/json',
      modifiedAt: '2026-06-10T10:45:00.000Z',
      storageLocationId: surveyDataset?.storageLocations[0]?.id,
    }),
    createFileManifestEntry({
      id: 'manifest-analysis-script',
      datasetId: codeDataset?.id ?? 'dataset-analysis-code',
      fileName: 'aggregate-responses.ts',
      relativePath: 'scripts/aggregate-responses.ts',
      sizeBytes: 4380,
      hashAlgorithm: 'sha256',
      hashValue: 'fc32d997b7d8d93d23ef21dd7a11257b7d8e0b1bcf995d7b1e6b9e7b1ce9ecf0',
      mimeType: 'text/typescript',
      modifiedAt: '2026-06-20T12:00:00.000Z',
      storageLocationId: codeDataset?.storageLocations[0]?.id,
    }),
  ];
}

export function getSampleManifestForDataset(datasetId: string) {
  return getSampleManifestEntries().filter((entry) => entry.datasetId === datasetId);
}

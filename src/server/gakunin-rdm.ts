import {
  attachGakuninRdmStorageLocation,
  createGakuninRdmConnection,
  createGakuninRdmStorageLocation,
  ReferenceOnlyGakuninRdmConnector,
  type GakuninRdmConnection,
  type GakuninRdmFile,
} from '../domain/gakunin-rdm';
import { applyProjectMetadataAutofill, toDataCiteMetadata } from '../domain/metadata';
import { getSampleDatasets } from './sample-datasets';
import { getSampleResearchProject } from './sample-project';

export function getSampleGakuninRdmConnection(): GakuninRdmConnection {
  return createGakuninRdmConnection({
    id: 'sample-gakunin-rdm-reference',
    mode: 'reference_only',
    projectUrl: 'https://rdm.nii.ac.jp/rdmate-demo/',
    displayName: 'RDMate JP 実証研究 GakuNin RDMプロジェクト',
    lastValidatedAt: '2026-06-29T00:00:00.000Z',
  });
}

export function getSampleGakuninRdmFiles(): GakuninRdmFile[] {
  return [
    {
      id: 'gakunin-file-1',
      projectId: 'rdmate-demo',
      name: 'metadata/datacite.json',
      path: '/metadata/datacite.json',
      sizeBytes: 4096,
      mimeType: 'application/json',
      modifiedAt: '2026-06-29T00:00:00.000Z',
    },
    {
      id: 'gakunin-file-2',
      projectId: 'rdmate-demo',
      name: 'manifest/manifest.csv',
      path: '/manifest/manifest.csv',
      sizeBytes: 2048,
      mimeType: 'text/csv',
      modifiedAt: '2026-06-29T00:00:00.000Z',
    },
  ];
}

export function getSampleGakuninRdmConnector() {
  return new ReferenceOnlyGakuninRdmConnector(getSampleGakuninRdmConnection(), getSampleGakuninRdmFiles());
}

export function getSampleDatasetWithGakuninRdmReference() {
  const dataset = getSampleDatasets()[0];

  if (!dataset) {
    throw new Error('Sample dataset not found.');
  }

  return attachGakuninRdmStorageLocation(
    dataset,
    createGakuninRdmStorageLocation({
      id: 'storage-user-test-gakunin-rdm',
      label: 'GakuNin RDM 実証研究プロジェクト',
      projectUrl: getSampleGakuninRdmConnection().projectUrl ?? 'https://rdm.nii.ac.jp/rdmate-demo/',
      accessScope: '研究代表者・データ管理担当者・URA',
    }),
  );
}

export async function getSampleGakuninRdmDashboard() {
  const connection = getSampleGakuninRdmConnection();
  const connector = getSampleGakuninRdmConnector();
  const project = await connector.getProject(connection.projectId ?? 'rdmate-demo');
  const files = await connector.listFiles(connection.projectId ?? 'rdmate-demo');
  const validation = await connector.validateConnection();
  const dataset = getSampleDatasetWithGakuninRdmReference();
  const researchProject = getSampleResearchProject();
  const metadata = applyProjectMetadataAutofill(dataset, researchProject);
  const exportPayload = await connector.exportMetadata(connection.projectId ?? 'rdmate-demo', {
    datasetId: dataset.id,
    dataCite: toDataCiteMetadata(metadata, dataset),
  });

  return {
    connection,
    project,
    files,
    validation,
    dataset,
    exportPayload,
  };
}

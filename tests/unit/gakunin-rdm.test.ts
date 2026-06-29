import { describe, expect, it } from 'vitest';
import { createDataset } from '../../src/domain/dataset';
import {
  attachGakuninRdmStorageLocation,
  createGakuninRdmConnection,
  createGakuninRdmStorageLocation,
  extractGakuninRdmProjectId,
  getGakuninRdmConnectionStatusLabel,
  ReferenceOnlyGakuninRdmConnector,
} from '../../src/domain/gakunin-rdm';
import {
  getSampleDatasetWithGakuninRdmReference,
  getSampleGakuninRdmConnection,
  getSampleGakuninRdmConnector,
  getSampleGakuninRdmDashboard,
} from '../../src/server/gakunin-rdm';

describe('GakuNin RDM integration domain', () => {
  it('creates a reference-only connection from a project URL', () => {
    const connection = createGakuninRdmConnection({
      id: 'conn-1',
      mode: 'reference_only',
      projectUrl: 'https://rdm.nii.ac.jp/abc123/',
    });

    expect(connection.projectId).toBe('abc123');
    expect(connection.status).toBe('reference_registered');
    expect(getGakuninRdmConnectionStatusLabel(connection.status)).toBe('参照登録済み');
    expect(extractGakuninRdmProjectId('https://rdm.nii.ac.jp/abc123/files')).toBe('abc123');
  });

  it('creates and attaches a GakuNin RDM storage location to a dataset', () => {
    const dataset = createDataset({
      id: 'dataset-1',
      projectId: 'project-1',
      name: '調査データ',
      description: '調査データ一式。',
      dataType: 'survey_data',
      generatedDate: '2026-06-01',
      version: '1.0.0',
      createdBy: '佐藤 花子',
      responsibleMemberId: 'member-1',
      storageLocations: [],
    });
    const location = createGakuninRdmStorageLocation({
      id: 'storage-gakunin',
      projectUrl: 'https://rdm.nii.ac.jp/abc123/',
    });
    const updated = attachGakuninRdmStorageLocation(dataset, location);

    expect(updated.storageLocations).toHaveLength(1);
    expect(updated.storageLocations[0]?.storageType).toBe('gakunin_rdm_url');
    expect(updated.storageLocations[0]?.uri).toBe('https://rdm.nii.ac.jp/abc123/');
  });

  it('implements listProjects, getProject, listFiles, exportMetadata, and validateConnection', async () => {
    const connection = getSampleGakuninRdmConnection();
    const connector = getSampleGakuninRdmConnector();
    const projects = await connector.listProjects();
    const project = await connector.getProject(connection.projectId ?? 'rdmate-demo');
    const files = await connector.listFiles(connection.projectId ?? 'rdmate-demo');
    const exportPayload = await connector.exportMetadata(connection.projectId ?? 'rdmate-demo', { title: 'Dataset metadata' });
    const validation = await connector.validateConnection();

    expect(projects[0]?.id).toBe('rdmate-demo');
    expect(project?.url).toBe('https://rdm.nii.ac.jp/rdmate-demo/');
    expect(files.map((file) => file.name)).toContain('metadata/datacite.json');
    expect(exportPayload.destinationUrl).toBe('https://rdm.nii.ac.jp/rdmate-demo/');
    expect(exportPayload.metadata.title).toBe('Dataset metadata');
    expect(validation.ok).toBe(true);
  });

  it('reports not configured when a connector has no reference URL', async () => {
    const connection = createGakuninRdmConnection({ id: 'empty-connection' });
    const connector = new ReferenceOnlyGakuninRdmConnector(connection);
    const validation = await connector.validateConnection();

    expect(validation.ok).toBe(false);
    expect(validation.status).toBe('not_configured');
    await expect(connector.exportMetadata('unknown', {})).rejects.toThrow('GakuNin RDM project not found');
  });

  it('builds the sample dashboard used by the UI and API', async () => {
    const dataset = getSampleDatasetWithGakuninRdmReference();
    const dashboard = await getSampleGakuninRdmDashboard();

    expect(dataset.storageLocations.some((location) => location.storageType === 'gakunin_rdm_url')).toBe(true);
    expect(dashboard.connection.status).toBe('reference_registered');
    expect(dashboard.exportPayload.metadata).toHaveProperty('dataCite');
  });
});

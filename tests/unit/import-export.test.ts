import { describe, expect, it } from 'vitest';
import { generateDatasetCsv } from '../../src/domain/dataset';
import {
  createCompleteJsonExport,
  generateCompleteJson,
  generateDatasetImportTemplateCsv,
  previewDatasetCsvImport,
} from '../../src/domain/import-export';
import { getSampleDmpExportContext } from '../../src/server/dmp-export-sample';
import { getSampleDatasets } from '../../src/server/sample-datasets';
import { getSampleDatasetMetadata } from '../../src/server/sample-metadata';
import { getSampleManifestEntries } from '../../src/server/sample-storage-reference';
import { getSampleRelatedOutputs } from '../../src/server/sample-related-outputs';
import {
  getSampleCompleteJsonExport,
  getSampleDatasetImportPreview,
  getSampleRepositoryCsvExport,
} from '../../src/server/sample-import-export';

describe('import export domain', () => {
  it('previews dataset CSV import with validation issues', () => {
    const preview = getSampleDatasetImportPreview();

    expect(preview.schemaVersion).toBe('1.0.0');
    expect(preview.totalRows).toBe(2);
    expect(preview.issues.some((issue) => issue.message.includes('更新日は'))).toBe(true);
  });

  it('detects duplicate dataset names and external identifiers before import', () => {
    const [first, second] = getSampleDatasets();
    if (!first || !second) throw new Error('Sample datasets are not available.');

    const csv = generateDatasetCsv([
      { ...first, id: 'import-1', name: '重複データセット', doi: '10.1234/import.1' },
      { ...second, id: 'import-2', name: '重複データセット', doi: '10.1234/import.1' },
    ]);
    const preview = previewDatasetCsvImport(csv);

    expect(preview.issues.some((issue) => issue.field === 'name' && issue.severity === 'error')).toBe(true);
    expect(preview.issues.some((issue) => issue.field === 'doi' && issue.severity === 'error')).toBe(true);
  });

  it('generates a CSV template with dataset ledger columns', () => {
    const template = generateDatasetImportTemplateCsv();

    expect(template).toContain('id,project_id,name,description,data_type');
    expect(template).toContain('storage_locations');
  });

  it('creates a complete JSON export for backup and migration', () => {
    const exportData = createCompleteJsonExport(
      getSampleDmpExportContext(),
      getSampleDatasets(),
      getSampleDatasetMetadata(),
      getSampleManifestEntries(),
      getSampleRelatedOutputs(),
    );
    const json = generateCompleteJson(exportData);

    expect(exportData.exportType).toBe('rdmate_complete_backup');
    expect(exportData.datasets.length).toBeGreaterThan(0);
    expect(exportData.metadata.length).toBeGreaterThan(0);
    expect(exportData.fileManifestEntries.length).toBeGreaterThan(0);
    expect(exportData.relatedOutputs.length).toBeGreaterThan(0);
    expect(json).toContain('rawAnswers');
  });

  it('creates repository registration CSV and missing-field issues', () => {
    const exportData = getSampleRepositoryCsvExport();

    expect(exportData.preset).toBe('jairo-cloud-datacite');
    expect(exportData.csv).toContain('dataset_id,title,creators,description');
    expect(exportData.csv).toContain('missing_fields');
    expect(exportData.issues.some((issue) => issue.field === 'identifier' || issue.field === 'rights')).toBe(true);
  });

  it('builds sample complete JSON export', () => {
    const exportData = getSampleCompleteJsonExport();

    expect(exportData.project.title).toBe('研究データ管理支援ツールの実証研究');
  });
});

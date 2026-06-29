import { describe, expect, it } from 'vitest';
import { migrateDmpTemplateAnswers } from '../../src/server/template-registry';
import { createSampleFunderCheckReport } from '../../src/server/funder-check-rules';
import {
  generateJairoCloudCsv,
  toDataCiteRepositoryJson,
  toDataverseMetadataJson,
  toZenodoMetadataJson,
} from '../../src/domain/repository-export';
import { getSampleRepositoryExportContext } from '../../src/server/repository-exports';
import {
  normalizeDoi,
  normalizeOrcidId,
  normalizeRorId,
} from '../../src/domain/external-identifier';
import {
  createGakuninRdmConnection,
  ReferenceOnlyGakuninRdmConnector,
} from '../../src/domain/gakunin-rdm';

describe('Phase 3 unit test plan coverage', () => {
  it('covers template version migration from generic v1 to v2', () => {
    const report = migrateDmpTemplateAnswers('generic-jp-v1', 'generic-jp-v2', {
      'data_description.data_types': ['survey_data'],
      'storage_and_sharing.storage_location': '大学提供クラウド',
      'legacy.field': '旧テンプレートのみの回答',
    });

    expect(report.fromTemplateId).toBe('generic-jp-v1');
    expect(report.toTemplateId).toBe('generic-jp-v2');
    expect(report.migratedAnswers['data_description.data_types']).toEqual(['survey_data']);
    expect(report.migratedAnswers['storage_and_sharing.storage_locations']).toEqual([
      '大学提供クラウド',
    ]);
    expect(report.unmappedSourceFieldIds).toContain('legacy.field');
  });

  it('covers funder-specific rule checks', () => {
    const report = createSampleFunderCheckReport();

    expect(['compliant', 'needs_review', 'non_compliant']).toContain(report.summary.status);
    expect(report.summary.score).toBeGreaterThanOrEqual(0);
    expect(report.results.length).toBeGreaterThan(0);
    expect(report.reviewCommentPrompts.length).toBeGreaterThan(0);
  });

  it('covers DataCite, JAIRO Cloud, Dataverse, and Zenodo transformations', () => {
    const context = getSampleRepositoryExportContext();
    const dataCite = toDataCiteRepositoryJson(context);
    const csv = generateJairoCloudCsv([context]);
    const dataverse = toDataverseMetadataJson(context);
    const zenodo = toZenodoMetadataJson(context);

    expect(dataCite.titles[0]?.title).toBe(context.metadata.title);
    expect(dataCite.fundingReferences[0]?.awardNumber).toBe('26K00001');
    expect(csv.split('\n')[0]).toContain('title_ja,title_en');
    expect(csv).toContain('grant_number');
    expect(
      dataverse.datasetVersion.metadataBlocks.citation.fields.some(
        (field) => field.typeName === 'grantNumber',
      ),
    ).toBe(true);
    expect(zenodo.metadata.upload_type).toBe('dataset');
  });

  it('covers DOI, ORCID, and ROR format normalization', () => {
    expect(normalizeOrcidId('https://orcid.org/0000-0002-1825-0097')).toBe('0000-0002-1825-0097');
    expect(normalizeRorId('https://ror.org/03yrm5c26')).toBe('03yrm5c26');
    expect(normalizeDoi('https://doi.org/10.1234/RDM.Workflow.2026')).toBe(
      '10.1234/rdm.workflow.2026',
    );
  });

  it('covers a mock Connector Interface implementation', async () => {
    const connection = createGakuninRdmConnection({
      id: 'test-connector',
      mode: 'reference_only',
      projectUrl: 'https://rdm.nii.ac.jp/mock-project/',
    });
    const connector = new ReferenceOnlyGakuninRdmConnector(connection, [
      {
        id: 'file-1',
        projectId: 'mock-project',
        name: 'metadata/datacite.json',
        path: '/metadata/datacite.json',
        mimeType: 'application/json',
      },
    ]);

    const projects = await connector.listProjects();
    const files = await connector.listFiles('mock-project');
    const exported = await connector.exportMetadata('mock-project', { title: 'Mock metadata' });
    const validation = await connector.validateConnection();

    expect(projects[0]?.id).toBe('mock-project');
    expect(files[0]?.name).toBe('metadata/datacite.json');
    expect(exported.metadata.title).toBe('Mock metadata');
    expect(validation.ok).toBe(true);
  });
});

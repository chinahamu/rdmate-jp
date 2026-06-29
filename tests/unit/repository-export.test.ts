import { describe, expect, it } from 'vitest';
import {
  createRepositoryExport,
  createRepositoryExportBundle,
  generateJairoCloudCsv,
  toDataCiteRepositoryJson,
  toDataverseMetadataJson,
  toJairoCloudCsvRow,
  toZenodoMetadataJson,
} from '../../src/domain/repository-export';
import {
  getSampleJairoCloudCsvForAllDatasets,
  getSampleRepositoryExport,
  getSampleRepositoryExportBundle,
  getSampleRepositoryExportContext,
} from '../../src/server/repository-exports';

describe('repository export presets', () => {
  const context = getSampleRepositoryExportContext();

  it('exports DataCite-like JSON with title, creators, publication year, institution, description, keywords, funding, related outputs, and rights', () => {
    const dataCite = toDataCiteRepositoryJson(context);

    expect(dataCite.titles[0]?.title).toBe(context.metadata.title);
    expect(dataCite.creators[0]?.name).toBe(context.metadata.creators[0]?.name);
    expect(dataCite.creators[0]?.affiliation[0]?.name).toBe(context.metadata.creators[0]?.affiliation);
    expect(dataCite.publicationYear).toBe('2027');
    expect(dataCite.descriptions[0]?.description).toContain('TypeScript');
    expect(dataCite.subjects.map((subject) => subject.subject)).toContain('研究データ管理');
    expect(dataCite.fundingReferences[0]?.awardNumber).toBe('26K00001');
    expect(dataCite.relatedIdentifiers.map((identifier) => identifier.relatedIdentifier)).toContain('10.1234/rdm.workflow.2026');
    expect(dataCite.rightsList.map((right) => right.rights)).toContain('MIT');
  });

  it('exports JAIRO Cloud CSV with repository-friendly columns and Japanese/English titles', () => {
    const row = toJairoCloudCsvRow(context);
    const csv = generateJairoCloudCsv([context]);

    expect(row.title_ja).toBe(context.metadata.title);
    expect(row.title_en).toContain(context.metadata.title);
    expect(row.doi).toBe(context.dataset.doi);
    expect(row.uri).toBe(context.dataset.publicUrl);
    expect(row.creators).toContain(context.metadata.creators[0]?.name);
    expect(row.creator_affiliations).toContain(context.metadata.creators[0]?.affiliation);
    expect(row.grant_number).toBe('26K00001');
    expect(row.publication_date).toBe('2027-04-01');
    expect(csv.split('\n')[0]).toContain('title_ja,title_en');
    expect(csv).toContain('related_software');
  });

  it('exports Dataverse and Zenodo metadata JSON presets without API submission', () => {
    const dataverse = toDataverseMetadataJson(context);
    const zenodo = toZenodoMetadataJson(context);

    expect(dataverse.datasetVersion.metadataBlocks.citation.fields.some((field) => field.typeName === 'grantNumber')).toBe(true);
    expect(dataverse.datasetVersion.license).toBe('MIT');
    expect(zenodo.metadata.upload_type).toBe('dataset');
    expect(zenodo.metadata.license).toBe('mit-license');
    expect(zenodo.metadata.related_identifiers[0]?.identifier).toBe('10.1234/rdm.workflow.2026');
    expect(zenodo.metadata.grants[0]?.id).toBe('26K00001');
  });

  it('creates export files for all repository formats', () => {
    const bundle = createRepositoryExportBundle(context);
    const formats = bundle.map((item) => item.format);

    expect(formats).toEqual(['datacite_json', 'jairo_cloud_csv', 'dataverse_json', 'zenodo_json']);
    expect(createRepositoryExport('datacite_json', context).fileName).toBe(`${context.dataset.id}.datacite.json`);
    expect(createRepositoryExport('jairo_cloud_csv', context).mimeType).toContain('text/csv');
  });

  it('builds sample server exports used by the UI and API', () => {
    const bundle = getSampleRepositoryExportBundle();
    const datacite = getSampleRepositoryExport('datacite_json');
    const csv = getSampleJairoCloudCsvForAllDatasets();

    expect(bundle).toHaveLength(4);
    expect(datacite.content).toContain('fundingReferences');
    expect(csv.split('\n')).toHaveLength(4);
    expect(csv).toContain('grant_number');
  });
});

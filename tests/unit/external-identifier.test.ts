import { describe, expect, it } from 'vitest';
import {
  createDoiExternalIdentifier,
  createExternalIdentifier,
  createInstitutionExternalIdentifier,
  createInstitutionRorIdentifier,
  createResearcherOrcidIdentifier,
  doiIdentifierSchema,
  getExternalIdentifierResolveUrl,
  isValidOrcidChecksum,
  normalizeDoi,
  normalizeOrcidId,
  normalizeRorId,
  orcidIdentifierSchema,
  rorIdentifierSchema,
  toDataCiteCreatorIdentifierPayload,
} from '../../src/domain/external-identifier';
import { getSampleExternalIdentifierRegistry } from '../../src/server/external-identifiers';

describe('external identifier domain', () => {
  it('normalizes and validates ORCID with checksum', () => {
    expect(normalizeOrcidId('https://orcid.org/0000-0002-1825-0097')).toBe('0000-0002-1825-0097');
    expect(orcidIdentifierSchema.parse('0000-0002-1825-0097')).toBe('0000-0002-1825-0097');
    expect(isValidOrcidChecksum('0000-0002-1825-0097')).toBe(true);
    expect(() => orcidIdentifierSchema.parse('0000-0002-1825-0098')).toThrow('チェックディジット');
  });

  it('normalizes ROR and DOI values and builds resolver URLs', () => {
    expect(normalizeRorId('https://ror.org/03yrm5c26')).toBe('03yrm5c26');
    expect(normalizeDoi('https://doi.org/10.1234/RDM.Workflow.2026')).toBe('10.1234/rdm.workflow.2026');
    expect(rorIdentifierSchema.parse('03yrm5c26')).toBe('03yrm5c26');
    expect(doiIdentifierSchema.parse('doi:10.1234/RDM.Workflow.2026')).toBe('10.1234/rdm.workflow.2026');
    expect(getExternalIdentifierResolveUrl('ror', '03yrm5c26')).toBe('https://ror.org/03yrm5c26');
    expect(getExternalIdentifierResolveUrl('doi', '10.1234/rdm.workflow.2026')).toBe('https://doi.org/10.1234/rdm.workflow.2026');
  });

  it('creates researcher, institution, and DOI identifiers with entity constraints', () => {
    const orcid = createResearcherOrcidIdentifier({
      entityId: 'member-1',
      name: '山田 太郎',
      orcid: '0000-0002-1825-0097',
      connection: { status: 'oauth_ready', provider: 'orcid', scope: ['/read-limited'] },
    });
    const institution = createInstitutionRorIdentifier({ id: 'meta-university', name: 'メタ大学', rorId: '03yrm5c26' });
    const ror = createInstitutionExternalIdentifier(institution);
    const doi = createDoiExternalIdentifier({ entityType: 'dataset', entityId: 'dataset-1', label: 'Dataset', doi: '10.1234/rdmate.demo.2026' });

    expect(orcid.resolveUrl).toBe('https://orcid.org/0000-0002-1825-0097');
    expect(orcid.connection.status).toBe('oauth_ready');
    expect(ror.resolveUrl).toBe('https://ror.org/03yrm5c26');
    expect(doi.resolveUrl).toBe('https://doi.org/10.1234/rdmate.demo.2026');
    expect(() =>
      createExternalIdentifier({
        id: 'bad-orcid',
        type: 'orcid',
        entityType: 'institution',
        entityId: 'institution-1',
        value: '0000-0002-1825-0097',
      }),
    ).toThrow('ORCIDはresearcher');
  });

  it('exports DataCite creator identifiers with ORCID and ROR affiliation identifiers', () => {
    const creator = toDataCiteCreatorIdentifierPayload({
      name: '山田 太郎',
      orcid: '0000-0002-1825-0097',
      affiliation: 'メタ大学 情報学部',
      affiliationRorId: '03yrm5c26',
    });

    expect(creator.nameIdentifiers?.[0]).toEqual({
      nameIdentifier: 'https://orcid.org/0000-0002-1825-0097',
      nameIdentifierScheme: 'ORCID',
      schemeUri: 'https://orcid.org/',
    });
    expect(creator.affiliation[0]).toEqual({
      name: 'メタ大学 情報学部',
      affiliationIdentifier: 'https://ror.org/03yrm5c26',
      affiliationIdentifierScheme: 'ROR',
      schemeUri: 'https://ror.org/',
    });
  });

  it('builds the sample identifier registry used by UI and API', () => {
    const registry = getSampleExternalIdentifierRegistry();

    expect(registry.identifiers.map((identifier) => identifier.type)).toEqual(expect.arrayContaining(['orcid', 'ror', 'doi']));
    expect(registry.institutions[0]?.rorId).toBe('03yrm5c26');
    expect(registry.dataCiteCreators.some((creator) => creator.affiliation[0]?.affiliationIdentifierScheme === 'ROR')).toBe(true);
  });
});

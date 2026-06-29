import { z } from 'zod';
import type { Dataset } from './dataset';
import type { Funding } from './funding';
import type { DatasetMetadata, RelatedPaper, RelatedSoftware } from './metadata';
import { toDataCiteMetadata } from './metadata';
import type { ResearchProject } from './research-project';

export const repositoryExportFormatValues = [
  'datacite_json',
  'jairo_cloud_csv',
  'dataverse_json',
  'zenodo_json',
] as const;
export type RepositoryExportFormat = (typeof repositoryExportFormatValues)[number];

export const repositoryExportSchema = z.object({
  datasetId: z.string().min(1),
  format: z.enum(repositoryExportFormatValues),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  content: z.string().min(1),
});

export type RepositoryExport = z.infer<typeof repositoryExportSchema>;

export type RepositoryExportContext = Readonly<{
  dataset: Dataset;
  metadata: DatasetMetadata;
  project: ResearchProject;
}>;

export type RepositoryDataCiteMetadata = ReturnType<typeof toDataCiteRepositoryJson>;
export type JairoCloudCsvRow = ReturnType<typeof toJairoCloudCsvRow>;
export type DataverseMetadataJson = ReturnType<typeof toDataverseMetadataJson>;
export type ZenodoMetadataJson = ReturnType<typeof toZenodoMetadataJson>;

export function toDataCiteRepositoryJson(context: RepositoryExportContext) {
  const { dataset, metadata, project } = context;
  const base = toDataCiteMetadata(metadata, dataset);

  return {
    schema: 'DataCite-like JSON for institutional repositories',
    ...base,
    identifiers: [
      dataset.doi ? { identifier: dataset.doi, identifierType: 'DOI' as const } : undefined,
      dataset.publicUrl
        ? { identifier: dataset.publicUrl, identifierType: 'URL' as const }
        : undefined,
    ].filter(Boolean),
    creators: metadata.creators.map((creator) => ({
      name: creator.name,
      affiliation: [{ name: creator.affiliation }],
      nameIdentifiers: creator.orcid
        ? [
            {
              nameIdentifier: `https://orcid.org/${creator.orcid}`,
              nameIdentifierScheme: 'ORCID' as const,
              schemeUri: 'https://orcid.org/',
            },
          ]
        : undefined,
    })),
    contributors: project.members
      .filter((member) => !metadata.creators.some((creator) => creator.name === member.name))
      .map((member) => ({
        contributorName: member.name,
        contributorType: member.role === 'DATA_STEWARD' ? 'DataCurator' : 'Researcher',
        affiliation: [{ name: member.affiliation }],
      })),
    fundingReferences: project.funding.map((funding) => toFundingReference(funding)),
    relatedIdentifiers: buildRelatedIdentifiers(metadata),
    rightsList: [
      ...(dataset.license
        ? [{ rights: dataset.license, rightsUri: licenseToUri(dataset.license) }]
        : []),
      ...(dataset.usageTerms ? [{ rights: dataset.usageTerms }] : []),
      ...(metadata.rightsHolder ? [{ rights: `Rights holder: ${metadata.rightsHolder}` }] : []),
    ],
  };
}

export function toJairoCloudCsvRow(context: RepositoryExportContext) {
  const { dataset, metadata, project } = context;
  const primaryFunding = project.funding[0];

  return {
    item_type: 'データセット',
    title_ja: metadata.title,
    title_en: createEnglishTitleFallback(metadata.title),
    description_ja: metadata.description,
    description_en: metadata.description,
    creators: metadata.creators.map((creator) => creator.name).join('; '),
    creator_affiliations: metadata.creators.map((creator) => creator.affiliation).join('; '),
    keywords: metadata.keywords.join('; '),
    publisher:
      metadata.publisher ??
      primaryFunding?.agencyName ??
      metadata.creators[0]?.affiliation ??
      'RDMate JP',
    publication_year: (dataset.plannedPublicationDate ?? dataset.generatedDate).slice(0, 4),
    publication_date: dataset.plannedPublicationDate ?? dataset.generatedDate,
    doi: dataset.doi ?? '',
    uri: dataset.publicUrl ?? dataset.storageLocations[0]?.uri ?? '',
    language: metadata.language,
    resource_type: dataset.dataType,
    license: dataset.license ?? '',
    rights: dataset.usageTerms ?? metadata.rightsHolder ?? '',
    funding_agency: primaryFunding?.agencyName ?? '',
    funding_program: primaryFunding?.programName ?? '',
    grant_number: primaryFunding?.projectNumber ?? project.projectNumber ?? '',
    related_papers: metadata.relatedPapers.map(formatRelatedPaper).join('; '),
    related_software: metadata.relatedSoftware.map(formatRelatedSoftware).join('; '),
  };
}

export function generateJairoCloudCsv(contexts: RepositoryExportContext[]): string {
  const rows = contexts.map(toJairoCloudCsvRow);
  const headers = [
    'item_type',
    'title_ja',
    'title_en',
    'description_ja',
    'description_en',
    'creators',
    'creator_affiliations',
    'keywords',
    'publisher',
    'publication_year',
    'publication_date',
    'doi',
    'uri',
    'language',
    'resource_type',
    'license',
    'rights',
    'funding_agency',
    'funding_program',
    'grant_number',
    'related_papers',
    'related_software',
  ] as const;

  return [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => escapeCsvCell(row[header])).join(',')),
  ].join('\n');
}

export function toDataverseMetadataJson(context: RepositoryExportContext) {
  const { dataset, metadata, project } = context;
  const primaryFunding = project.funding[0];

  return {
    datasetVersion: {
      license: dataset.license ?? 'Custom Dataset Terms',
      termsOfUse: dataset.usageTerms,
      metadataBlocks: {
        citation: {
          fields: [
            { typeName: 'title', value: metadata.title },
            {
              typeName: 'author',
              value: metadata.creators.map((creator) => ({
                authorName: { value: creator.name },
                authorAffiliation: { value: creator.affiliation },
                ...(creator.orcid
                  ? {
                      authorIdentifierScheme: { value: 'ORCID' },
                      authorIdentifier: { value: creator.orcid },
                    }
                  : {}),
              })),
            },
            {
              typeName: 'datasetContact',
              value: metadata.creators.map((creator) => ({
                datasetContactName: { value: creator.name },
              })),
            },
            {
              typeName: 'dsDescription',
              value: [{ dsDescriptionValue: { value: metadata.description } }],
            },
            { typeName: 'subject', value: [metadata.researchField] },
            {
              typeName: 'keyword',
              value: metadata.keywords.map((keyword) => ({ keywordValue: { value: keyword } })),
            },
            {
              typeName: 'publicationDate',
              value: dataset.plannedPublicationDate ?? dataset.generatedDate,
            },
            ...(primaryFunding
              ? [
                  {
                    typeName: 'grantNumber',
                    value: [
                      {
                        grantNumberAgency: { value: primaryFunding.agencyName },
                        grantNumberValue: {
                          value: primaryFunding.projectNumber ?? project.projectNumber ?? '',
                        },
                      },
                    ],
                  },
                ]
              : []),
            ...(dataset.doi
              ? [
                  {
                    typeName: 'relatedDataset',
                    value: [
                      {
                        relatedDatasetIDType: { value: 'DOI' },
                        relatedDatasetIDNumber: { value: dataset.doi },
                      },
                    ],
                  },
                ]
              : []),
          ],
        },
      },
    },
  };
}

export function toZenodoMetadataJson(context: RepositoryExportContext) {
  const { dataset, metadata, project } = context;

  return {
    metadata: {
      upload_type: 'dataset',
      title: metadata.title,
      description: metadata.description,
      creators: metadata.creators.map((creator) => ({
        name: creator.name,
        affiliation: creator.affiliation,
        orcid: creator.orcid,
      })),
      keywords: metadata.keywords,
      publication_date: dataset.plannedPublicationDate ?? dataset.generatedDate,
      access_right: mapPublicationStatusToZenodoAccess(dataset.publicationStatus),
      license: mapLicenseToZenodoLicense(dataset.license),
      version: dataset.version,
      related_identifiers: buildRelatedIdentifiers(metadata).map((identifier) => ({
        identifier: identifier.relatedIdentifier,
        relation: identifier.relationType,
        resource_type:
          identifier.relatedIdentifierType === 'DOI' ? 'publication-article' : 'software',
      })),
      grants: project.funding.flatMap((funding) =>
        funding.projectNumber
          ? [
              {
                id: funding.projectNumber,
                title: `${funding.agencyName} ${funding.programName}`,
              },
            ]
          : [],
      ),
      notes: dataset.usageTerms,
    },
  };
}

export function createRepositoryExport(
  format: RepositoryExportFormat,
  context: RepositoryExportContext,
): RepositoryExport {
  if (format === 'datacite_json') {
    return repositoryExportSchema.parse({
      datasetId: context.dataset.id,
      format,
      fileName: `${context.dataset.id}.datacite.json`,
      mimeType: 'application/json',
      content: JSON.stringify(toDataCiteRepositoryJson(context), null, 2),
    });
  }

  if (format === 'jairo_cloud_csv') {
    return repositoryExportSchema.parse({
      datasetId: context.dataset.id,
      format,
      fileName: `${context.dataset.id}.jairo-cloud.csv`,
      mimeType: 'text/csv; charset=utf-8',
      content: generateJairoCloudCsv([context]),
    });
  }

  if (format === 'dataverse_json') {
    return repositoryExportSchema.parse({
      datasetId: context.dataset.id,
      format,
      fileName: `${context.dataset.id}.dataverse.json`,
      mimeType: 'application/json',
      content: JSON.stringify(toDataverseMetadataJson(context), null, 2),
    });
  }

  return repositoryExportSchema.parse({
    datasetId: context.dataset.id,
    format,
    fileName: `${context.dataset.id}.zenodo.json`,
    mimeType: 'application/json',
    content: JSON.stringify(toZenodoMetadataJson(context), null, 2),
  });
}

export function createRepositoryExportBundle(context: RepositoryExportContext): RepositoryExport[] {
  return repositoryExportFormatValues.map((format) => createRepositoryExport(format, context));
}

function buildRelatedIdentifiers(metadata: DatasetMetadata): {
  relatedIdentifier: string;
  relatedIdentifierType: 'DOI' | 'URL';
  relationType: string;
}[] {
  const result: {
    relatedIdentifier: string;
    relatedIdentifierType: 'DOI' | 'URL';
    relationType: string;
  }[] = [];

  for (const paper of metadata.relatedPapers) {
    if (paper.doi) {
      result.push({
        relatedIdentifier: paper.doi,
        relatedIdentifierType: 'DOI',
        relationType: paper.relation,
      });
    } else if (paper.url) {
      result.push({
        relatedIdentifier: paper.url,
        relatedIdentifierType: 'URL',
        relationType: paper.relation,
      });
    }
  }

  for (const software of metadata.relatedSoftware) {
    if (software.url) {
      result.push({
        relatedIdentifier: software.url,
        relatedIdentifierType: 'URL',
        relationType: software.relation,
      });
    }
  }

  return result;
}

function toFundingReference(funding: Funding) {
  return {
    funderName: funding.agencyName,
    awardTitle: funding.programName,
    awardNumber: funding.projectNumber,
    funderIdentifier: funding.url,
    awardURI: funding.url,
  };
}

function formatRelatedPaper(paper: RelatedPaper): string {
  return [paper.title, paper.doi ? `DOI:${paper.doi}` : paper.url].filter(Boolean).join(' ');
}

function formatRelatedSoftware(software: RelatedSoftware): string {
  return [software.name, software.version, software.license, software.url]
    .filter(Boolean)
    .join(' ');
}

function escapeCsvCell(value: string | undefined): string {
  const text = value ?? '';
  if (!/[",\n]/.test(text)) return text;

  return `"${text.replace(/"/g, '""')}"`;
}

function createEnglishTitleFallback(title: string): string {
  return title.match(/[A-Za-z]/) ? title : `${title} (Japanese title)`;
}

function licenseToUri(license: string): string | undefined {
  const map: Record<string, string> = {
    'CC BY 4.0': 'https://creativecommons.org/licenses/by/4.0/',
    'CC BY-SA 4.0': 'https://creativecommons.org/licenses/by-sa/4.0/',
    'CC0 1.0': 'https://creativecommons.org/publicdomain/zero/1.0/',
    MIT: 'https://opensource.org/license/mit/',
    'Apache-2.0': 'https://www.apache.org/licenses/LICENSE-2.0',
    'GPL-3.0': 'https://www.gnu.org/licenses/gpl-3.0.html',
  };

  return map[license];
}

function mapPublicationStatusToZenodoAccess(status: Dataset['publicationStatus']): string {
  const map: Record<Dataset['publicationStatus'], string> = {
    open: 'open',
    embargoed: 'embargoed',
    restricted: 'restricted',
    closed: 'closed',
    undecided: 'restricted',
  };

  return map[status];
}

function mapLicenseToZenodoLicense(license?: Dataset['license']): string | undefined {
  const map: Partial<Record<NonNullable<Dataset['license']>, string>> = {
    'CC BY 4.0': 'cc-by-4.0',
    'CC BY-SA 4.0': 'cc-by-sa-4.0',
    'CC0 1.0': 'cc-zero',
    MIT: 'mit-license',
    'Apache-2.0': 'apache-2.0',
    'GPL-3.0': 'gpl-3.0',
  };

  return license ? map[license] : undefined;
}

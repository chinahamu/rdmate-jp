import { z } from 'zod';
import type { Dataset } from './dataset';
import type { ResearchProject } from './research-project';

const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: '日付はYYYY-MM-DD形式で入力してください。',
});

const urlSchema = z.string().url('URLの形式が正しくありません。');
const orcidSchema = z.string().regex(/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/, {
  message: 'ORCIDは0000-0000-0000-0000形式で入力してください。',
});
const doiSchema = z.string().regex(/^10\.\d{4,9}\/\S+$/i, {
  message: 'DOIは10.xxxx/xxxxx形式で入力してください。',
});

export const metadataFieldRequirementValues = ['required', 'recommended', 'optional'] as const;
export type MetadataFieldRequirement = (typeof metadataFieldRequirementValues)[number];

export const metadataFieldRequirementLabels: Record<MetadataFieldRequirement, string> = {
  required: '必須',
  recommended: '推奨',
  optional: '任意',
};

export const variableDataTypeValues = [
  'string',
  'integer',
  'number',
  'boolean',
  'date',
  'datetime',
  'category',
  'geometry',
  'file',
  'unknown',
] as const;

export type VariableDataType = (typeof variableDataTypeValues)[number];

export const relatedPaperTypeValues = ['journal_article', 'preprint', 'conference_paper', 'report', 'thesis'] as const;
export const relatedSoftwareTypeValues = ['source_code', 'package', 'workflow', 'notebook', 'container'] as const;

export const metadataCreatorSchema = z.object({
  name: z.string().min(1, '作成者名は必須です。'),
  affiliation: z.string().min(1, '所属機関は必須です。'),
  orcid: orcidSchema.optional(),
  role: z.string().min(1).optional(),
});

export const temporalCoverageSchema = z
  .object({
    startDate: dateStringSchema,
    endDate: dateStringSchema,
  })
  .superRefine((coverage, context) => {
    if (new Date(coverage.startDate).getTime() > new Date(coverage.endDate).getTime()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: '時間範囲の終了日は開始日以降にしてください。',
      });
    }
  });

export const spatialCoverageSchema = z.object({
  placeName: z.string().min(1).optional(),
  boundingBox: z
    .object({
      west: z.number().min(-180).max(180),
      south: z.number().min(-90).max(90),
      east: z.number().min(-180).max(180),
      north: z.number().min(-90).max(90),
    })
    .optional(),
});

export const datasetVariableSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, '変数名・カラム名は必須です。'),
  label: z.string().min(1).optional(),
  description: z.string().min(1, '変数・カラム説明は必須です。'),
  dataType: z.enum(variableDataTypeValues).default('unknown'),
  unit: z.string().min(1).optional(),
  missingValue: z.string().min(1).optional(),
  vocabulary: z.array(z.string().min(1)).default([]),
});

export const relatedPaperSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1, '関連論文タイトルは必須です。'),
  paperType: z.enum(relatedPaperTypeValues).default('journal_article'),
  doi: doiSchema.optional(),
  url: urlSchema.optional(),
  journalName: z.string().min(1).optional(),
  publicationYear: z.string().regex(/^\d{4}$/).optional(),
  relation: z.string().min(1).default('isSupplementTo'),
});

export const relatedSoftwareSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, '関連ソフトウェア名は必須です。'),
  softwareType: z.enum(relatedSoftwareTypeValues).default('source_code'),
  url: urlSchema.optional(),
  version: z.string().min(1).optional(),
  license: z.string().min(1).optional(),
  runtimeEnvironment: z.string().min(1).optional(),
  relation: z.string().min(1).default('isSourceOf'),
});

export const datasetMetadataSchema = z.object({
  datasetId: z.string().min(1),
  title: z.string().min(1, 'タイトルは必須です。'),
  description: z.string().min(1, '説明は必須です。'),
  creators: z.array(metadataCreatorSchema).min(1, '作成者を1名以上登録してください。'),
  keywords: z.array(z.string().min(1)).min(1, 'キーワードを1件以上登録してください。'),
  researchField: z.string().min(1, '研究分野は必須です。'),
  acquisitionMethod: z.string().min(1, '取得方法は必須です。'),
  temporalCoverage: temporalCoverageSchema.optional(),
  spatialCoverage: spatialCoverageSchema.optional(),
  variables: z.array(datasetVariableSchema).default([]),
  relatedPapers: z.array(relatedPaperSchema).default([]),
  relatedSoftware: z.array(relatedSoftwareSchema).default([]),
  language: z.string().min(2).default('ja'),
  publisher: z.string().min(1).optional(),
  rightsHolder: z.string().min(1).optional(),
  updatedAt: z.string().datetime().optional(),
});

export type MetadataCreator = z.infer<typeof metadataCreatorSchema>;
export type TemporalCoverage = z.infer<typeof temporalCoverageSchema>;
export type SpatialCoverage = z.infer<typeof spatialCoverageSchema>;
export type DatasetVariable = z.infer<typeof datasetVariableSchema>;
export type RelatedPaper = z.infer<typeof relatedPaperSchema>;
export type RelatedSoftware = z.infer<typeof relatedSoftwareSchema>;
export type DatasetMetadataInput = z.input<typeof datasetMetadataSchema>;
export type DatasetMetadata = z.infer<typeof datasetMetadataSchema>;

export type MetadataCompletionItem = Readonly<{
  field: string;
  label: string;
  requirement: MetadataFieldRequirement;
  completed: boolean;
}>;

export type MetadataCompletion = Readonly<{
  score: number;
  completedCount: number;
  totalCount: number;
  items: MetadataCompletionItem[];
}>;

export type RepositoryMetadataIssue = Readonly<{
  field: string;
  requirement: MetadataFieldRequirement;
  message: string;
}>;

export type DublinCoreMetadata = Readonly<{
  title: string;
  description: string;
  creator: string[];
  subject: string[];
  publisher?: string;
  contributor: string[];
  date?: string;
  type: string;
  format: string[];
  identifier?: string;
  source?: string;
  language: string;
  relation: string[];
  coverage: string[];
  rights?: string;
}>;

export type DataCiteMetadata = Readonly<{
  titles: Array<{ title: string }>;
  descriptions: Array<{ description: string; descriptionType: 'Abstract' | 'Methods' }>;
  creators: Array<{ name: string; affiliation: string[]; nameIdentifiers?: Array<{ nameIdentifier: string; nameIdentifierScheme: 'ORCID' }> }>;
  subjects: Array<{ subject: string }>;
  publisher: string;
  publicationYear: string;
  resourceType: { resourceTypeGeneral: 'Dataset'; resourceType: string };
  dates: Array<{ date: string; dateType: 'Collected' | 'Updated' | 'Available' }>;
  geoLocations: Array<{ geoLocationPlace?: string; geoLocationBox?: { westBoundLongitude: number; eastBoundLongitude: number; southBoundLatitude: number; northBoundLatitude: number } }>;
  relatedIdentifiers: Array<{ relatedIdentifier: string; relatedIdentifierType: 'DOI' | 'URL'; relationType: string }>;
  rightsList: Array<{ rights: string }>;
}>;

export const metadataFieldDefinitions: MetadataCompletionItem[] = [
  { field: 'title', label: 'タイトル', requirement: 'required', completed: false },
  { field: 'description', label: '説明', requirement: 'required', completed: false },
  { field: 'creators', label: '作成者・所属機関', requirement: 'required', completed: false },
  { field: 'keywords', label: 'キーワード', requirement: 'required', completed: false },
  { field: 'researchField', label: '研究分野', requirement: 'required', completed: false },
  { field: 'acquisitionMethod', label: '取得方法', requirement: 'required', completed: false },
  { field: 'temporalCoverage', label: '時間範囲', requirement: 'recommended', completed: false },
  { field: 'spatialCoverage', label: '空間範囲', requirement: 'recommended', completed: false },
  { field: 'variables', label: '変数・カラム説明', requirement: 'recommended', completed: false },
  { field: 'relatedPapers', label: '関連論文', requirement: 'optional', completed: false },
  { field: 'relatedSoftware', label: '関連ソフトウェア', requirement: 'optional', completed: false },
];

export function createDatasetMetadata(input: DatasetMetadataInput): DatasetMetadata {
  return datasetMetadataSchema.parse(input);
}

export function applyProjectMetadataAutofill(dataset: Dataset, project: ResearchProject): DatasetMetadata {
  const dataManager = project.members.find((member) => member.id === project.dataManagerMemberId);
  const primaryInvestigator = project.members.find((member) => member.role === 'PI');
  const creatorSource = dataManager ?? primaryInvestigator ?? project.members[0];
  const primaryFunding = project.funding[0];

  return createDatasetMetadata({
    datasetId: dataset.id,
    title: dataset.name,
    description: dataset.description,
    creators: creatorSource
      ? [
          {
            name: creatorSource.name,
            affiliation: creatorSource.affiliation,
            orcid: creatorSource.orcid,
            role: creatorSource.role,
          },
        ]
      : [],
    keywords: getKeywordCandidates(project, [dataset]).slice(0, 5),
    researchField: project.field,
    acquisitionMethod: `${datasetTypeToMethodLabel(dataset.dataType)}として研究期間中に生成・収集`,
    temporalCoverage: {
      startDate: dataset.generatedDate,
      endDate: dataset.lastUpdatedDate ?? dataset.generatedDate,
    },
    variables: inferVariablesForDataset(dataset),
    relatedSoftware: dataset.dataType === 'source_code'
      ? [
          {
            id: `software-${dataset.id}`,
            name: dataset.name,
            softwareType: 'source_code',
            url: dataset.publicUrl,
            version: dataset.version,
            license: dataset.license,
            runtimeEnvironment: 'TypeScript / Node.js',
          },
        ]
      : [],
    language: 'ja',
    publisher: primaryFunding?.agencyName ?? creatorSource?.affiliation,
    rightsHolder: creatorSource?.affiliation,
    updatedAt: new Date('2026-06-29T00:00:00.000Z').toISOString(),
  });
}

export function calculateMetadataCompletion(metadata: DatasetMetadata): MetadataCompletion {
  const items = metadataFieldDefinitions.map((definition) => ({
    ...definition,
    completed: isMetadataFieldCompleted(metadata, definition.field),
  }));
  const weightedItems = items.filter((item) => item.requirement !== 'optional');
  const completedCount = weightedItems.filter((item) => item.completed).length;
  const totalCount = weightedItems.length;

  return {
    score: totalCount === 0 ? 100 : Math.round((completedCount / totalCount) * 100),
    completedCount,
    totalCount,
    items,
  };
}

export function validateRepositoryMetadata(metadata: DatasetMetadata): RepositoryMetadataIssue[] {
  return calculateMetadataCompletion(metadata).items
    .filter((item) => item.requirement !== 'optional' && !item.completed)
    .map((item) => ({
      field: item.field,
      requirement: item.requirement,
      message: `${item.label}が未入力です。リポジトリ登録前に入力してください。`,
    }));
}

export function getKeywordCandidates(project: ResearchProject, datasets: Dataset[], existingMetadata: DatasetMetadata[] = []): string[] {
  const candidates = [
    project.field,
    ...datasets.map((dataset) => dataset.dataType),
    ...datasets.flatMap((dataset) => dataset.name.split(/[\s　_-]+/)),
    ...existingMetadata.flatMap((metadata) => metadata.keywords),
  ];

  return Array.from(new Set(candidates.map((candidate) => candidate.trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, 'ja'),
  );
}

export function toDublinCoreMetadata(metadata: DatasetMetadata, dataset: Dataset): DublinCoreMetadata {
  const coverage = [
    metadata.temporalCoverage ? `${metadata.temporalCoverage.startDate}/${metadata.temporalCoverage.endDate}` : '',
    metadata.spatialCoverage?.placeName ?? '',
  ].filter(Boolean);

  return {
    title: metadata.title,
    description: metadata.description,
    creator: metadata.creators.map((creator) => creator.name),
    subject: metadata.keywords,
    publisher: metadata.publisher,
    contributor: metadata.creators.map((creator) => creator.affiliation),
    date: metadata.temporalCoverage?.startDate ?? dataset.generatedDate,
    type: 'Dataset',
    format: dataset.storageLocations.map((location) => location.storageType),
    identifier: dataset.doi ?? dataset.publicUrl,
    source: dataset.publicUrl,
    language: metadata.language,
    relation: [
      ...metadata.relatedPapers.map((paper) => paper.doi ?? paper.url ?? paper.title),
      ...metadata.relatedSoftware.map((software) => software.url ?? software.name),
    ],
    coverage,
    rights: dataset.license ?? metadata.rightsHolder,
  };
}

export function toDataCiteMetadata(metadata: DatasetMetadata, dataset: Dataset): DataCiteMetadata {
  return {
    titles: [{ title: metadata.title }],
    descriptions: [
      { description: metadata.description, descriptionType: 'Abstract' },
      { description: metadata.acquisitionMethod, descriptionType: 'Methods' },
    ],
    creators: metadata.creators.map((creator) => ({
      name: creator.name,
      affiliation: [creator.affiliation],
      nameIdentifiers: creator.orcid
        ? [{ nameIdentifier: `https://orcid.org/${creator.orcid}`, nameIdentifierScheme: 'ORCID' }]
        : undefined,
    })),
    subjects: metadata.keywords.map((subject) => ({ subject })),
    publisher: metadata.publisher ?? metadata.creators[0]?.affiliation ?? 'RDMate JP',
    publicationYear: (dataset.plannedPublicationDate ?? dataset.generatedDate).slice(0, 4),
    resourceType: { resourceTypeGeneral: 'Dataset', resourceType: dataset.dataType },
    dates: [
      { date: dataset.generatedDate, dateType: 'Collected' },
      ...(dataset.lastUpdatedDate ? [{ date: dataset.lastUpdatedDate, dateType: 'Updated' as const }] : []),
      ...(dataset.plannedPublicationDate ? [{ date: dataset.plannedPublicationDate, dateType: 'Available' as const }] : []),
    ],
    geoLocations: metadata.spatialCoverage
      ? [
          {
            geoLocationPlace: metadata.spatialCoverage.placeName,
            geoLocationBox: metadata.spatialCoverage.boundingBox
              ? {
                  westBoundLongitude: metadata.spatialCoverage.boundingBox.west,
                  eastBoundLongitude: metadata.spatialCoverage.boundingBox.east,
                  southBoundLatitude: metadata.spatialCoverage.boundingBox.south,
                  northBoundLatitude: metadata.spatialCoverage.boundingBox.north,
                }
              : undefined,
          },
        ]
      : [],
    relatedIdentifiers: [
      ...metadata.relatedPapers.flatMap<{ relatedIdentifier: string; relatedIdentifierType: 'DOI' | 'URL'; relationType: string }>((paper) =>
        paper.doi
          ? [{ relatedIdentifier: paper.doi, relatedIdentifierType: 'DOI' as const, relationType: paper.relation }]
          : paper.url
            ? [{ relatedIdentifier: paper.url, relatedIdentifierType: 'URL' as const, relationType: paper.relation }]
            : [],
      ),
      ...metadata.relatedSoftware.flatMap<{ relatedIdentifier: string; relatedIdentifierType: 'DOI' | 'URL'; relationType: string }>((software) =>
        software.url
          ? [{ relatedIdentifier: software.url, relatedIdentifierType: 'URL' as const, relationType: software.relation }]
          : [],
      ),
    ],
    rightsList: dataset.license ? [{ rights: dataset.license }] : [],
  };
}

export function getRdmateMetadataJsonSchema() {
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'https://rdmate.jp/schemas/dataset-metadata.schema.json',
    title: 'RDMate Dataset Metadata',
    type: 'object',
    required: ['datasetId', 'title', 'description', 'creators', 'keywords', 'researchField', 'acquisitionMethod'],
    properties: {
      datasetId: { type: 'string' },
      title: { type: 'string', minLength: 1 },
      description: { type: 'string', minLength: 1 },
      creators: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          required: ['name', 'affiliation'],
          properties: {
            name: { type: 'string' },
            affiliation: { type: 'string' },
            orcid: { type: 'string' },
            role: { type: 'string' },
          },
        },
      },
      keywords: { type: 'array', minItems: 1, items: { type: 'string' } },
      researchField: { type: 'string' },
      acquisitionMethod: { type: 'string' },
      temporalCoverage: { type: 'object' },
      spatialCoverage: { type: 'object' },
      variables: { type: 'array' },
      relatedPapers: { type: 'array' },
      relatedSoftware: { type: 'array' },
      language: { type: 'string' },
      publisher: { type: 'string' },
      rightsHolder: { type: 'string' },
    },
  } as const;
}

function isMetadataFieldCompleted(metadata: DatasetMetadata, field: string): boolean {
  const value = metadata[field as keyof DatasetMetadata];

  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0;

  return Boolean(value);
}

function datasetTypeToMethodLabel(dataType: Dataset['dataType']): string {
  const labels: Record<Dataset['dataType'], string> = {
    experimental_data: '実験データ',
    observational_data: '観測データ',
    simulation_data: 'シミュレーションデータ',
    survey_data: '調査データ',
    image_video: '画像・動画データ',
    audio: '音声データ',
    text_corpus: 'テキストコーパス',
    source_code: 'ソースコード',
    processed_data: '解析済みデータ',
    metadata_only: 'メタデータ',
  };

  return labels[dataType];
}

function inferVariablesForDataset(dataset: Dataset): DatasetVariable[] {
  if (dataset.dataType === 'survey_data') {
    return [
      {
        id: `${dataset.id}-respondent-id`,
        name: 'respondent_id',
        label: '回答者ID',
        description: '匿名化済み回答者識別子。個人を直接識別できないIDを使用する。',
        dataType: 'string',
        vocabulary: [],
      },
      {
        id: `${dataset.id}-submitted-at`,
        name: 'submitted_at',
        label: '回答日時',
        description: '回答が送信された日時。',
        dataType: 'datetime',
        vocabulary: [],
      },
    ];
  }

  if (dataset.dataType === 'source_code') {
    return [
      {
        id: `${dataset.id}-file-path`,
        name: 'file_path',
        label: 'ファイルパス',
        description: 'リポジトリ内の相対パス。',
        dataType: 'string',
        vocabulary: [],
      },
    ];
  }

  return [];
}

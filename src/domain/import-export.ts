import {
  generateDatasetCsv,
  parseDatasetCsv,
  type Dataset,
  type DatasetCsvImportError,
} from './dataset';
import type { DmpAnswerMap } from './dmp-answer';
import { createDmpJsonExport, type DmpExportContext, type DmpJsonExport } from './dmp-export';
import {
  toDataCiteMetadata,
  validateRepositoryMetadata,
  type DatasetMetadata,
} from './metadata';
import type { FileManifestEntry } from './storage-reference';
import type { RelatedOutput } from './related-output';

export type DatasetCsvImportPreviewIssue = Readonly<{
  rowNumber: number;
  severity: 'error' | 'warning' | 'info';
  field: string;
  message: string;
}>;

export type DatasetCsvImportPreview = Readonly<{
  schemaVersion: '1.0.0';
  totalRows: number;
  validRows: number;
  invalidRows: number;
  datasets: Dataset[];
  issues: DatasetCsvImportPreviewIssue[];
}>;

export type CompleteJsonExport = Readonly<{
  schemaVersion: '1.0.0';
  generatedAt: string;
  exportType: 'rdmate_complete_backup';
  project: DmpJsonExport['project'];
  dmp: {
    template: DmpJsonExport['template'];
    answers: DmpJsonExport['answers'];
    rawAnswers: DmpAnswerMap;
  };
  datasets: Dataset[];
  metadata: DatasetMetadata[];
  fileManifestEntries: FileManifestEntry[];
  relatedOutputs: RelatedOutput[];
}>;

export type RepositoryCsvIssue = Readonly<{
  datasetId: string;
  field: string;
  severity: 'error' | 'warning';
  message: string;
}>;

export type RepositoryCsvExport = Readonly<{
  schemaVersion: '1.0.0';
  generatedAt: string;
  preset: 'jairo-cloud-datacite';
  csv: string;
  issues: RepositoryCsvIssue[];
}>;

const repositoryCsvColumns = [
  'dataset_id',
  'title',
  'creators',
  'description',
  'keywords',
  'publisher',
  'publication_year',
  'resource_type',
  'identifier',
  'rights',
  'related_identifiers',
  'funding',
  'temporal_coverage',
  'spatial_coverage',
  'file_count',
  'missing_fields',
] as const;

export function previewDatasetCsvImport(
  csvContent: string,
  existingDatasets: Dataset[] = [],
): DatasetCsvImportPreview {
  const parsed = parseDatasetCsv(csvContent);
  const importedIssues = parsed.errors.flatMap(toPreviewIssues);
  const duplicateIssues = detectDuplicateDatasetIssues(parsed.datasets, existingDatasets);
  const totalRows = countDataRows(csvContent);
  const invalidRows = new Set([...importedIssues, ...duplicateIssues].filter((issue) => issue.severity === 'error').map((issue) => issue.rowNumber)).size;

  return {
    schemaVersion: '1.0.0',
    totalRows,
    validRows: Math.max(0, totalRows - invalidRows),
    invalidRows,
    datasets: parsed.datasets,
    issues: [...importedIssues, ...duplicateIssues],
  };
}

export function createCompleteJsonExport(
  context: DmpExportContext,
  datasets: Dataset[],
  metadata: DatasetMetadata[],
  fileManifestEntries: FileManifestEntry[],
  relatedOutputs: RelatedOutput[],
  generatedAt = '2026-06-29T00:00:00.000Z',
): CompleteJsonExport {
  const dmpExport = createDmpJsonExport(context);

  return {
    schemaVersion: '1.0.0',
    generatedAt,
    exportType: 'rdmate_complete_backup',
    project: dmpExport.project,
    dmp: {
      template: dmpExport.template,
      answers: dmpExport.answers,
      rawAnswers: context.answers,
    },
    datasets,
    metadata,
    fileManifestEntries,
    relatedOutputs,
  };
}

export function generateCompleteJson(exportData: CompleteJsonExport): string {
  return `${JSON.stringify(exportData, null, 2)}\n`;
}

export function createRepositoryCsvExport(
  datasets: Dataset[],
  metadataList: DatasetMetadata[],
  fileManifestEntries: FileManifestEntry[],
  relatedOutputs: RelatedOutput[],
  fundingSummary: string,
  generatedAt = '2026-06-29T00:00:00.000Z',
): RepositoryCsvExport {
  const issues = createRepositoryCsvIssues(datasets, metadataList);
  const rows = datasets.map((dataset) => {
    const metadata = metadataList.find((entry) => entry.datasetId === dataset.id);
    const dataCite = metadata ? toDataCiteMetadata(metadata, dataset) : undefined;
    const related = relatedOutputs
      .filter((output) => output.datasetId === dataset.id)
      .map((output) => output.doi ?? output.arxivUrl ?? output.url ?? output.repositoryUrl ?? output.protocolUrl ?? output.title);
    const manifestCount = fileManifestEntries.filter((entry) => entry.datasetId === dataset.id).length;
    const missingFields = issues
      .filter((issue) => issue.datasetId === dataset.id)
      .map((issue) => issue.field)
      .join('; ');

    return [
      dataset.id,
      metadata?.title ?? dataset.name,
      metadata?.creators.map((creator) => creator.name).join('; ') ?? '',
      metadata?.description ?? dataset.description,
      metadata?.keywords.join('; ') ?? '',
      dataCite?.publisher ?? metadata?.publisher ?? '',
      dataCite?.publicationYear ?? (dataset.plannedPublicationDate ?? dataset.generatedDate).slice(0, 4),
      dataCite?.resourceType.resourceType ?? dataset.dataType,
      dataset.doi ?? dataset.publicUrl ?? '',
      dataset.license ?? '',
      related.join('; '),
      fundingSummary,
      metadata?.temporalCoverage ? `${metadata.temporalCoverage.startDate}/${metadata.temporalCoverage.endDate}` : '',
      metadata?.spatialCoverage?.placeName ?? '',
      String(manifestCount),
      missingFields,
    ];
  });

  return {
    schemaVersion: '1.0.0',
    generatedAt,
    preset: 'jairo-cloud-datacite',
    csv: toCsv([[...repositoryCsvColumns], ...rows]),
    issues,
  };
}

export function createRepositoryCsvIssues(datasets: Dataset[], metadataList: DatasetMetadata[]): RepositoryCsvIssue[] {
  return datasets.flatMap((dataset) => {
    const metadata = metadataList.find((entry) => entry.datasetId === dataset.id);

    if (!metadata) {
      return [
        {
          datasetId: dataset.id,
          field: 'metadata',
          severity: 'error' as const,
          message: 'リポジトリ登録用CSVに必要なメタデータがありません。',
        },
      ];
    }

    const metadataIssues = validateRepositoryMetadata(metadata).map((issue) => ({
      datasetId: dataset.id,
      field: issue.field,
      severity: issue.requirement === 'required' ? 'error' as const : 'warning' as const,
      message: issue.message,
    }));
    const identifierIssue = !dataset.doi && !dataset.publicUrl
      ? [
          {
            datasetId: dataset.id,
            field: 'identifier',
            severity: 'warning' as const,
            message: 'DOIまたは公開URLが未設定です。',
          },
        ]
      : [];
    const rightsIssue = !dataset.license
      ? [
          {
            datasetId: dataset.id,
            field: 'rights',
            severity: 'warning' as const,
            message: 'ライセンスが未設定です。',
          },
        ]
      : [];

    return [...metadataIssues, ...identifierIssue, ...rightsIssue];
  });
}

export function generateDatasetImportTemplateCsv(): string {
  return generateDatasetCsv([]);
}

function toPreviewIssues(error: DatasetCsvImportError): DatasetCsvImportPreviewIssue[] {
  return error.messages.map((message) => ({
    rowNumber: error.rowNumber,
    severity: 'error' as const,
    field: 'csv',
    message,
  }));
}

function detectDuplicateDatasetIssues(datasets: Dataset[], existingDatasets: Dataset[]): DatasetCsvImportPreviewIssue[] {
  return [
    ...detectDuplicateField(datasets, existingDatasets, 'id', 'id', 'データセットID'),
    ...detectDuplicateField(datasets, existingDatasets, 'name', 'name', 'データセット名'),
    ...detectDuplicateField(datasets, existingDatasets, 'doi', 'doi', 'DOI'),
    ...detectDuplicateField(datasets, existingDatasets, 'publicUrl', 'publicUrl', '公開URL'),
  ];
}

function detectDuplicateField(
  datasets: Dataset[],
  existingDatasets: Dataset[],
  field: keyof Pick<Dataset, 'id' | 'name' | 'doi' | 'publicUrl'>,
  issueField: string,
  label: string,
): DatasetCsvImportPreviewIssue[] {
  const issues: DatasetCsvImportPreviewIssue[] = [];
  const seen = new Map<string, number>();
  const existingValues = new Set(existingDatasets.map((dataset) => dataset[field]).filter(Boolean));

  datasets.forEach((dataset, index) => {
    const value = dataset[field];
    if (!value) return;

    const rowNumber = index + 2;
    if (seen.has(value)) {
      issues.push({
        rowNumber,
        severity: 'error',
        field: issueField,
        message: `${label}がCSV内で重複しています: ${value}`,
      });
    }
    if (existingValues.has(value)) {
      issues.push({
        rowNumber,
        severity: 'warning',
        field: issueField,
        message: `${label}が既存Datasetと重複しています: ${value}`,
      });
    }
    seen.set(value, rowNumber);
  });

  return issues;
}

function countDataRows(csvContent: string): number {
  const rows = csvContent
    .split(/\r?\n/)
    .slice(1)
    .filter((row) => row.trim().length > 0);
  return rows.length;
}

function toCsv(rows: string[][]): string {
  return `${rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n')}\n`;
}

function escapeCsvCell(value: string): string {
  const escaped = value.replaceAll('"', '""');
  return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
}

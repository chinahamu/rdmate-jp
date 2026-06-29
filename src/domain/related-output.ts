import { z } from 'zod';
import type { Dataset } from './dataset';
import type { ResearchProject } from './research-project';

const yearSchema = z.string().regex(/^\d{4}$/, '出版年はYYYY形式で入力してください。');
const urlSchema = z.string().url('URLの形式が正しくありません。');
const doiSchema = z.string().regex(/^10\.\d{4,9}\/\S+$/i, 'DOIは10.xxxx/xxxxx形式で入力してください。');
const arxivSchema = z.string().regex(/^(arXiv:)?\d{4}\.\d{4,5}(v\d+)?$/i, 'arXiv IDの形式が正しくありません。');
const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日付はYYYY-MM-DD形式で入力してください。');

export const relatedOutputKindValues = ['paper', 'presentation', 'software', 'protocol'] as const;
export type RelatedOutputKind = (typeof relatedOutputKindValues)[number];

export const relatedOutputRelationValues = [
  'uses_dataset',
  'generated_dataset',
  'supplements_dataset',
  'reanalyzes_dataset',
  'generates_dataset',
  'analyzes_dataset',
  'visualizes_dataset',
  'documents_protocol',
] as const;
export type RelatedOutputRelation = (typeof relatedOutputRelationValues)[number];

export const relatedOutputIssueSeverityValues = ['error', 'warning', 'info'] as const;
export type RelatedOutputIssueSeverity = (typeof relatedOutputIssueSeverityValues)[number];

export const relatedOutputKindLabels: Record<RelatedOutputKind, string> = {
  paper: '論文・発表',
  presentation: '発表',
  software: 'ソフトウェア・コード',
  protocol: '実験・調査手順',
};

export const relatedOutputRelationLabels: Record<RelatedOutputRelation, string> = {
  uses_dataset: 'Datasetを使用',
  generated_dataset: 'Datasetを生成',
  supplements_dataset: 'Datasetを補足',
  reanalyzes_dataset: 'Datasetを再解析',
  generates_dataset: '生成コード',
  analyzes_dataset: '解析コード',
  visualizes_dataset: '可視化コード',
  documents_protocol: '手順・プロトコル',
};

export type RelatedOutputIssue = Readonly<{
  outputId: string;
  datasetId?: string;
  severity: RelatedOutputIssueSeverity;
  field: string;
  message: string;
}>;

export const protocolChangeRecordSchema = z.object({
  id: z.string().min(1),
  changedAt: dateStringSchema,
  version: z.string().min(1, '変更後バージョンは必須です。'),
  changedBy: z.string().min(1, '変更者は必須です。'),
  summary: z.string().min(1, '変更内容は必須です。'),
});

export const relatedOutputSchema = z.object({
  id: z.string().min(1),
  datasetId: z.string().min(1),
  kind: z.enum(relatedOutputKindValues),
  relation: z.enum(relatedOutputRelationValues),
  title: z.string().min(1, '成果物タイトルは必須です。'),
  doi: doiSchema.optional(),
  arxivUrl: z.string().regex(/^https:\/\/arxiv\.org\/(abs|pdf)\/.+/i, 'arXiv URLの形式が正しくありません。').optional(),
  arxivId: arxivSchema.optional(),
  url: urlSchema.optional(),
  journalName: z.string().min(1).optional(),
  publicationYear: yearSchema.optional(),
  repositoryUrl: urlSchema.optional(),
  releaseTag: z.string().min(1).optional(),
  license: z.string().min(1).optional(),
  runtimeEnvironment: z.string().min(1).optional(),
  protocolId: z.string().min(1).optional(),
  protocolUrl: urlSchema.optional(),
  version: z.string().min(1).optional(),
  responsibleMemberId: z.string().min(1).optional(),
  changeHistory: z.array(protocolChangeRecordSchema).default([]),
  notes: z.string().min(1).optional(),
});

export type ProtocolChangeRecord = z.infer<typeof protocolChangeRecordSchema>;
export type RelatedOutputInput = z.input<typeof relatedOutputSchema>;
export type RelatedOutput = z.infer<typeof relatedOutputSchema>;

export type RelatedOutputSummary = Readonly<{
  total: number;
  paperCount: number;
  presentationCount: number;
  softwareCount: number;
  protocolCount: number;
  issueCount: number;
}>;

export type RelatedOutputExport = Readonly<{
  schemaVersion: '1.0.0';
  generatedAt: string;
  projectId: string;
  projectTitle: string;
  summary: RelatedOutputSummary;
  outputs: RelatedOutput[];
  issues: RelatedOutputIssue[];
}>;

const relationRules: Record<RelatedOutputKind, RelatedOutputRelation[]> = {
  paper: ['uses_dataset', 'generated_dataset', 'supplements_dataset', 'reanalyzes_dataset'],
  presentation: ['uses_dataset', 'generated_dataset', 'supplements_dataset', 'reanalyzes_dataset'],
  software: ['generates_dataset', 'analyzes_dataset', 'visualizes_dataset'],
  protocol: ['documents_protocol', 'generated_dataset'],
};

export function createRelatedOutput(input: RelatedOutputInput): RelatedOutput {
  return relatedOutputSchema.parse(input);
}

export function validateRelatedOutputs(
  outputs: RelatedOutput[],
  datasets: Dataset[],
  project: Pick<ResearchProject, 'members'>,
): RelatedOutputIssue[] {
  const issues: RelatedOutputIssue[] = [];
  const datasetIds = new Set(datasets.map((dataset) => dataset.id));
  const memberIds = new Set(project.members.map((member) => member.id));

  for (const output of outputs) {
    if (!datasetIds.has(output.datasetId)) {
      issues.push(createIssue(output, 'datasetId', 'error', 'Datasetに紐付いていない関連成果物です。'));
    }

    if (!relationRules[output.kind].includes(output.relation)) {
      issues.push(createIssue(output, 'relation', 'error', `${relatedOutputKindLabels[output.kind]}に対して関係種別 ${relatedOutputRelationLabels[output.relation]} は使用できません。`));
    }

    if ((output.kind === 'paper' || output.kind === 'presentation') && !output.doi && !output.arxivUrl && !output.arxivId && !output.url) {
      issues.push(createIssue(output, 'identifier', 'warning', '論文・発表にはDOI、arXiv URL/ID、またはURLを登録してください。'));
    }

    if (output.kind === 'paper' && !output.publicationYear) {
      issues.push(createIssue(output, 'publicationYear', 'info', '論文の出版年が未設定です。'));
    }

    if (output.kind === 'software' && !output.repositoryUrl) {
      issues.push(createIssue(output, 'repositoryUrl', 'error', 'ソフトウェア・コードにはGitHub/GitLab等のリポジトリURLを登録してください。'));
    }

    if (output.kind === 'software' && !output.releaseTag) {
      issues.push(createIssue(output, 'releaseTag', 'warning', 'ソフトウェア・コードには再現性のためリリースタグを登録してください。'));
    }

    if (output.kind === 'software' && !output.runtimeEnvironment) {
      issues.push(createIssue(output, 'runtimeEnvironment', 'warning', 'ソフトウェア・コードには実行環境を登録してください。'));
    }

    if (output.kind === 'protocol') {
      if (!output.protocolId) {
        issues.push(createIssue(output, 'protocolId', 'error', '手順書にはプロトコルIDを登録してください。'));
      }
      if (!output.protocolUrl) {
        issues.push(createIssue(output, 'protocolUrl', 'warning', '手順書URLを登録してください。'));
      }
      if (!output.version) {
        issues.push(createIssue(output, 'version', 'warning', 'プロトコルのバージョンを登録してください。'));
      }
      if (!output.responsibleMemberId || !memberIds.has(output.responsibleMemberId)) {
        issues.push(createIssue(output, 'responsibleMemberId', 'error', '手順書の責任者は研究メンバーから選択してください。'));
      }
      if (output.changeHistory.length === 0) {
        issues.push(createIssue(output, 'changeHistory', 'info', 'プロトコル変更履歴が未登録です。'));
      }
    }
  }

  return issues;
}

export function summarizeRelatedOutputs(outputs: RelatedOutput[], issues: RelatedOutputIssue[] = []): RelatedOutputSummary {
  return {
    total: outputs.length,
    paperCount: outputs.filter((output) => output.kind === 'paper').length,
    presentationCount: outputs.filter((output) => output.kind === 'presentation').length,
    softwareCount: outputs.filter((output) => output.kind === 'software').length,
    protocolCount: outputs.filter((output) => output.kind === 'protocol').length,
    issueCount: issues.length,
  };
}

export function groupRelatedOutputsByDataset(outputs: RelatedOutput[]): Record<string, RelatedOutput[]> {
  return outputs.reduce<Record<string, RelatedOutput[]>>((groups, output) => {
    groups[output.datasetId] = [...(groups[output.datasetId] ?? []), output];
    return groups;
  }, {});
}

export function createRelatedOutputExport(
  outputs: RelatedOutput[],
  datasets: Dataset[],
  project: Pick<ResearchProject, 'id' | 'title' | 'members'>,
  generatedAt = '2026-06-29T00:00:00.000Z',
): RelatedOutputExport {
  const issues = validateRelatedOutputs(outputs, datasets, project);

  return {
    schemaVersion: '1.0.0',
    generatedAt,
    projectId: project.id,
    projectTitle: project.title,
    summary: summarizeRelatedOutputs(outputs, issues),
    outputs,
    issues,
  };
}

export function generateRelatedOutputsJson(exportData: RelatedOutputExport): string {
  return `${JSON.stringify(exportData, null, 2)}\n`;
}

export function generateRelatedOutputsCsv(outputs: RelatedOutput[]): string {
  return toCsv([
    [
      'id',
      'dataset_id',
      'kind',
      'relation',
      'title',
      'doi',
      'arxiv_id',
      'arxiv_url',
      'url',
      'journal_name',
      'publication_year',
      'repository_url',
      'release_tag',
      'license',
      'runtime_environment',
      'protocol_id',
      'protocol_url',
      'version',
      'responsible_member_id',
      'change_history_count',
      'notes',
    ],
    ...outputs.map((output) => [
      output.id,
      output.datasetId,
      output.kind,
      output.relation,
      output.title,
      output.doi ?? '',
      output.arxivId ?? '',
      output.arxivUrl ?? '',
      output.url ?? '',
      output.journalName ?? '',
      output.publicationYear ?? '',
      output.repositoryUrl ?? '',
      output.releaseTag ?? '',
      output.license ?? '',
      output.runtimeEnvironment ?? '',
      output.protocolId ?? '',
      output.protocolUrl ?? '',
      output.version ?? '',
      output.responsibleMemberId ?? '',
      String(output.changeHistory.length),
      output.notes ?? '',
    ]),
  ]);
}

function createIssue(
  output: RelatedOutput,
  field: string,
  severity: RelatedOutputIssueSeverity,
  message: string,
): RelatedOutputIssue {
  return {
    outputId: output.id,
    datasetId: output.datasetId,
    field,
    severity,
    message,
  };
}

function toCsv(rows: string[][]): string {
  return `${rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n')}\n`;
}

function escapeCsvCell(value: string): string {
  const escaped = value.replaceAll('"', '""');
  return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
}

import { formatAnswerValue, type DmpExportContext } from './dmp-export';
import {
  datasetTypeLabels,
  type Dataset,
  type DatasetType,
  type PublicationStatus,
} from './dataset';
import { getDataManager } from './research-project';

export const dmpDiffSeverityValues = ['error', 'warning', 'info'] as const;
export type DmpDiffSeverity = (typeof dmpDiffSeverityValues)[number];

export const dmpDiffActionTargetValues = ['dmp_update', 'dataset_update'] as const;
export type DmpDiffActionTarget = (typeof dmpDiffActionTargetValues)[number];

export type DmpDatasetPolicy = Readonly<{
  plannedDataTypes: DatasetType[];
  storageKeywords: string[];
  publicationStatuses: PublicationStatus[];
  retentionPolicy?: string;
  disposalPolicy?: string;
  responsibleParties: string[];
}>;

export type DmpDiffIssue = Readonly<{
  id: string;
  projectId: string;
  datasetId?: string;
  datasetName?: string;
  field: string;
  severity: DmpDiffSeverity;
  actionTarget: DmpDiffActionTarget;
  message: string;
  dmpValue: string;
  datasetValue: string;
}>;

export type DmpDiffSummary = Readonly<{
  errorCount: number;
  warningCount: number;
  infoCount: number;
  dmpUpdateCount: number;
  datasetUpdateCount: number;
}>;

export type DmpDiffReport = Readonly<{
  schemaVersion: '1.0.0';
  generatedAt: string;
  projectId: string;
  projectTitle: string;
  policy: DmpDatasetPolicy;
  summary: DmpDiffSummary;
  issues: DmpDiffIssue[];
}>;

type DmpAnswerEntry = Readonly<{
  fieldId: string;
  sectionId: string;
  questionId: string;
  label: string;
  text: string;
}>;

const dataTypePatterns: Array<Readonly<{ type: DatasetType; patterns: string[] }>> = [
  { type: 'experimental_data', patterns: ['experimental_data', '実験', '実験データ'] },
  { type: 'observational_data', patterns: ['observational_data', '観測', '観測データ'] },
  { type: 'simulation_data', patterns: ['simulation_data', 'シミュレーション'] },
  { type: 'survey_data', patterns: ['survey_data', '調査', '調査票', 'アンケート', '回答'] },
  { type: 'image_video', patterns: ['image_video', '画像', '動画', 'スクリーンショット'] },
  { type: 'audio', patterns: ['audio', '音声'] },
  { type: 'text_corpus', patterns: ['text_corpus', 'テキスト', 'コーパス'] },
  { type: 'source_code', patterns: ['source_code', 'コード', 'ソースコード', 'script', 'スクリプト'] },
  { type: 'processed_data', patterns: ['processed_data', '解析済み', '加工済み', '集計'] },
  { type: 'metadata_only', patterns: ['metadata_only', 'メタデータ'] },
];

const storageKeywordPatterns = [
  '機関リポジトリ',
  '大学提供クラウド',
  'クラウド',
  '研究室サーバ',
  '外部データリポジトリ',
  'GitHub',
  'GakuNin RDM',
  'ネットワークドライブ',
  'ローカル',
];

export function extractDmpDatasetPolicy(context: Pick<DmpExportContext, 'template' | 'answers' | 'project'>): DmpDatasetPolicy {
  const entries = getDmpAnswerEntries(context);
  const allText = entries.map((entry) => entry.text).join('\n');
  const dataTypeText = getTextsForQuestions(entries, ['data_type', 'data_types', 'データの種類', 'データ種別']).join('\n') || allText;
  const storageText = getTextsForQuestions(entries, ['storage', 'repository', '保存場所', 'リポジトリ']).join('\n');
  const sharingText = getTextsForQuestions(entries, ['sharing', 'publication', '公開', '共有']).join('\n');
  const retentionText = getTextsForQuestions(entries, ['retention', 'preservation', '保持期間', '保存期間']).join('\n');
  const disposalText = getTextsForQuestions(entries, ['disposal', 'destruction', '廃棄', '削除']).join('\n');
  const responsibleText = getTextsForQuestions(entries, ['data_manager', 'data_owner', 'responsible', '責任者']).join('\n');
  const projectDataManager = getDataManager(context.project)?.name ?? '';
  const projectMemberNames = context.project.members.map((member) => member.name);

  return {
    plannedDataTypes: detectDataTypes(dataTypeText),
    storageKeywords: detectStorageKeywords(storageText),
    publicationStatuses: detectPublicationStatuses(sharingText),
    retentionPolicy: normalizeOptionalText(retentionText),
    disposalPolicy: normalizeOptionalText(disposalText),
    responsibleParties: uniqueValues([
      ...extractNames(responsibleText),
      projectDataManager,
      ...projectMemberNames.filter((name) => responsibleText.includes(name)),
    ]),
  };
}

export function createDmpDiffReport(
  context: DmpExportContext,
  datasets: Dataset[],
  generatedAt = '2026-06-29T00:00:00.000Z',
): DmpDiffReport {
  const policy = extractDmpDatasetPolicy(context);
  const issues = validateDmpDatasetDiff(context, datasets, policy);

  return {
    schemaVersion: '1.0.0',
    generatedAt,
    projectId: context.project.id,
    projectTitle: context.project.title,
    policy,
    summary: summarizeDmpDiffIssues(issues),
    issues,
  };
}

export function validateDmpDatasetDiff(
  context: Pick<DmpExportContext, 'project'>,
  datasets: Dataset[],
  policy: DmpDatasetPolicy,
): DmpDiffIssue[] {
  const issues: DmpDiffIssue[] = [];

  if (policy.plannedDataTypes.length === 0) {
    issues.push(createProjectIssue(context, 'dataTypes', 'warning', 'dmp_update', 'DMPに予定データ種別が明確に記載されていません。', '未設定', '複数データセットあり'));
  }

  if (!policy.retentionPolicy) {
    issues.push(createProjectIssue(context, 'retentionPolicy', 'warning', 'dmp_update', 'DMPで定めた保持期間が未入力です。', '未設定', 'Dataset側では保持期間を判定できません'));
  }

  if (!policy.disposalPolicy) {
    issues.push(createProjectIssue(context, 'disposalPolicy', 'info', 'dmp_update', 'DMPで定めた廃棄方針が未入力です。必要に応じてDMPを更新してください。', '未設定', 'Dataset側では廃棄方針を判定できません'));
  }

  for (const dataset of datasets) {
    if (policy.plannedDataTypes.length > 0 && !policy.plannedDataTypes.includes(dataset.dataType)) {
      issues.push(createDatasetIssue(context, dataset, 'dataType', 'warning', 'dmp_update', 'DMPで予定したデータ種別とDatasetのデータ種別が一致していません。DMPに追記するかDataset種別を修正してください。', formatDataTypes(policy.plannedDataTypes), datasetTypeLabels[dataset.dataType]));
    }

    if (policy.storageKeywords.length > 0 && dataset.storageLocations.length === 0) {
      issues.push(createDatasetIssue(context, dataset, 'storageLocations', 'error', 'dataset_update', 'DMPでは保存場所が定められていますが、Datasetに保存場所が登録されていません。', policy.storageKeywords.join(' / '), '未設定'));
    }

    if (policy.storageKeywords.length > 0 && dataset.storageLocations.length > 0 && !datasetMatchesStoragePolicy(dataset, policy.storageKeywords)) {
      issues.push(createDatasetIssue(context, dataset, 'storageLocations', 'warning', 'dataset_update', 'DMPの保存場所方針とDatasetの保存場所が一致していない可能性があります。', policy.storageKeywords.join(' / '), dataset.storageLocations.map((location) => location.label ?? location.uri).join(' / ')));
    }

    if (policy.publicationStatuses.length > 0 && !policy.publicationStatuses.includes(dataset.publicationStatus)) {
      issues.push(createDatasetIssue(context, dataset, 'publicationStatus', 'warning', 'dataset_update', 'DMPで定めた公開方針とDatasetの公開区分が矛盾している可能性があります。', policy.publicationStatuses.map(formatPublicationStatus).join(' / '), formatPublicationStatus(dataset.publicationStatus)));
    }

    if (policy.responsibleParties.length > 0 && !datasetResponsibleMatchesPolicy(dataset, context.project, policy.responsibleParties)) {
      issues.push(createDatasetIssue(context, dataset, 'responsibleMemberId', 'warning', 'dataset_update', 'DMPで定めた責任者がDataset責任者と一致していない可能性があります。', policy.responsibleParties.join(' / '), getDatasetResponsibleName(dataset, context.project) ?? dataset.responsibleMemberId));
    }
  }

  return issues;
}

export function summarizeDmpDiffIssues(issues: DmpDiffIssue[]): DmpDiffSummary {
  return {
    errorCount: issues.filter((issue) => issue.severity === 'error').length,
    warningCount: issues.filter((issue) => issue.severity === 'warning').length,
    infoCount: issues.filter((issue) => issue.severity === 'info').length,
    dmpUpdateCount: issues.filter((issue) => issue.actionTarget === 'dmp_update').length,
    datasetUpdateCount: issues.filter((issue) => issue.actionTarget === 'dataset_update').length,
  };
}

export function generateDmpDiffMarkdown(report: DmpDiffReport): string {
  const lines = [
    `# DMP差分レポート: ${report.projectTitle}`,
    '',
    '| 項目 | 値 |',
    '|---|---|',
    `| 生成日時 | ${escapeMarkdown(report.generatedAt)} |`,
    `| エラー | ${report.summary.errorCount} |`,
    `| 警告 | ${report.summary.warningCount} |`,
    `| 情報 | ${report.summary.infoCount} |`,
    `| DMP更新候補 | ${report.summary.dmpUpdateCount} |`,
    `| Dataset修正候補 | ${report.summary.datasetUpdateCount} |`,
    '',
    '## DMP抽出方針',
    '',
    '| 方針 | DMP値 |',
    '|---|---|',
    `| 予定データ種別 | ${escapeMarkdown(formatDataTypes(report.policy.plannedDataTypes) || '未設定')} |`,
    `| 保存場所 | ${escapeMarkdown(report.policy.storageKeywords.join(' / ') || '未設定')} |`,
    `| 公開方針 | ${escapeMarkdown(report.policy.publicationStatuses.map(formatPublicationStatus).join(' / ') || '未設定')} |`,
    `| 保持期間 | ${escapeMarkdown(report.policy.retentionPolicy ?? '未設定')} |`,
    `| 廃棄方針 | ${escapeMarkdown(report.policy.disposalPolicy ?? '未設定')} |`,
    `| 責任者 | ${escapeMarkdown(report.policy.responsibleParties.join(' / ') || '未設定')} |`,
    '',
    '## 差分一覧',
    '',
    '| 重大度 | 対象 | Dataset | 項目 | DMP値 | Dataset値 | メッセージ |',
    '|---|---|---|---|---|---|---|',
  ];

  if (report.issues.length === 0) {
    lines.push('| info | - | - | - | - | - | 差分は検出されませんでした。 |');
  } else {
    for (const issue of report.issues) {
      lines.push(
        `| ${issue.severity} | ${issue.actionTarget} | ${escapeMarkdown(issue.datasetName ?? '-')} | ${escapeMarkdown(issue.field)} | ${escapeMarkdown(issue.dmpValue)} | ${escapeMarkdown(issue.datasetValue)} | ${escapeMarkdown(issue.message)} |`,
      );
    }
  }

  return `${lines.join('\n')}\n`;
}

export function generateDmpDiffCsv(report: DmpDiffReport): string {
  const rows = report.issues.map((issue) => [
    issue.id,
    issue.projectId,
    issue.datasetId ?? '',
    issue.datasetName ?? '',
    issue.field,
    issue.severity,
    issue.actionTarget,
    issue.dmpValue,
    issue.datasetValue,
    issue.message,
  ]);

  return toCsv([
    ['id', 'project_id', 'dataset_id', 'dataset_name', 'field', 'severity', 'action_target', 'dmp_value', 'dataset_value', 'message'],
    ...rows,
  ]);
}

function getDmpAnswerEntries(context: Pick<DmpExportContext, 'template' | 'answers'>): DmpAnswerEntry[] {
  return context.template.sections.flatMap((section) =>
    section.questions.map((question) => {
      const fieldId = `${section.id}.${question.id}`;
      return {
        fieldId,
        sectionId: section.id,
        questionId: question.id,
        label: question.label,
        text: formatAnswerValue(context.answers[fieldId] ?? null),
      };
    }),
  );
}

function getTextsForQuestions(entries: DmpAnswerEntry[], keywords: string[]): string[] {
  return entries
    .filter((entry) => {
      const haystack = `${entry.fieldId} ${entry.questionId} ${entry.label}`.toLowerCase();
      return keywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
    })
    .map((entry) => entry.text)
    .filter(Boolean);
}

function detectDataTypes(text: string): DatasetType[] {
  const normalized = text.toLowerCase();
  return dataTypePatterns
    .filter((entry) => entry.patterns.some((pattern) => normalized.includes(pattern.toLowerCase())))
    .map((entry) => entry.type);
}

function detectStorageKeywords(text: string): string[] {
  return storageKeywordPatterns.filter((keyword) => text.toLowerCase().includes(keyword.toLowerCase()));
}

function detectPublicationStatuses(text: string): PublicationStatus[] {
  const statuses: PublicationStatus[] = [];
  if (text.includes('制限')) statuses.push('restricted');
  if (text.includes('非公開')) statuses.push('closed');
  if (text.includes('一定期間') || text.toLowerCase().includes('embargo')) statuses.push('embargoed');
  if ((text.includes('公開') || text.toLowerCase().includes('open')) && !text.includes('制限') && !text.includes('非公開')) statuses.push('open');
  if (text.includes('未定')) statuses.push('undecided');
  return uniqueValues(statuses);
}

function normalizeOptionalText(text: string): string | undefined {
  const normalized = text.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function extractNames(text: string): string[] {
  return text
    .split(/[、,;／/\n]/)
    .map((value) => value.trim())
    .filter((value) => value.length > 0 && value.length <= 40);
}

function datasetMatchesStoragePolicy(dataset: Dataset, storageKeywords: string[]): boolean {
  const storageText = dataset.storageLocations
    .map((location) => `${location.label ?? ''} ${location.uri} ${location.storageType} ${location.notes ?? ''}`)
    .join('\n')
    .toLowerCase();
  return storageKeywords.some((keyword) => storageText.includes(keyword.toLowerCase()));
}

function datasetResponsibleMatchesPolicy(
  dataset: Dataset,
  project: DmpExportContext['project'],
  responsibleParties: string[],
): boolean {
  const responsibleName = getDatasetResponsibleName(dataset, project);
  if (!responsibleName) return false;
  return responsibleParties.some((party) => responsibleName.includes(party) || party.includes(responsibleName));
}

function getDatasetResponsibleName(dataset: Dataset, project: DmpExportContext['project']): string | undefined {
  return project.members.find((member) => member.id === dataset.responsibleMemberId)?.name;
}

function createProjectIssue(
  context: Pick<DmpExportContext, 'project'>,
  field: string,
  severity: DmpDiffSeverity,
  actionTarget: DmpDiffActionTarget,
  message: string,
  dmpValue: string,
  datasetValue: string,
): DmpDiffIssue {
  return {
    id: `project-${field}`,
    projectId: context.project.id,
    field,
    severity,
    actionTarget,
    message,
    dmpValue,
    datasetValue,
  };
}

function createDatasetIssue(
  context: Pick<DmpExportContext, 'project'>,
  dataset: Dataset,
  field: string,
  severity: DmpDiffSeverity,
  actionTarget: DmpDiffActionTarget,
  message: string,
  dmpValue: string,
  datasetValue: string,
): DmpDiffIssue {
  return {
    id: `${dataset.id}-${field}`,
    projectId: context.project.id,
    datasetId: dataset.id,
    datasetName: dataset.name,
    field,
    severity,
    actionTarget,
    message,
    dmpValue,
    datasetValue,
  };
}

function formatDataTypes(dataTypes: DatasetType[]): string {
  return dataTypes.map((type) => datasetTypeLabels[type]).join(' / ');
}

function formatPublicationStatus(status: PublicationStatus): string {
  const labels: Record<PublicationStatus, string> = {
    open: '公開可能',
    embargoed: '一定期間後に公開',
    restricted: '制限付き公開',
    closed: '非公開',
    undecided: '未定',
  };
  return labels[status];
}

function uniqueValues<T extends string>(values: T[]): T[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function toCsv(rows: string[][]): string {
  return `${rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n')}\n`;
}

function escapeCsvCell(value: string): string {
  const escaped = value.replaceAll('"', '""');
  return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
}

function escapeMarkdown(value: string): string {
  return value.replaceAll('|', '\\|').replaceAll('\n', '<br>');
}

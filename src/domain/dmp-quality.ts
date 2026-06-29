import type { DmpAnswerMap, DmpAnswerValue, DmpValidationIssueSeverity } from './dmp-answer';
import { getFieldId, isAnswered, validateDmpAnswers } from './dmp-answer';
import type { DmpTemplate, DmpTemplateQuestion, DmpTemplateSection } from './dmp-template';
import type { ResearchProject } from './research-project';

export type DmpQualityCategory = 'basic' | 'risk' | 'export';

export type DmpQualityIssue = Readonly<{
  id: string;
  category: DmpQualityCategory;
  severity: DmpValidationIssueSeverity;
  fieldId?: string;
  sectionId?: string;
  questionId?: string;
  title: string;
  message: string;
  remediation: string;
}>;

export type DmpQualitySummary = Readonly<{
  errorCount: number;
  warningCount: number;
  infoCount: number;
  canExport: boolean;
  canExportWithWarnings: boolean;
}>;

export type DmpQualityReport = Readonly<{
  issues: DmpQualityIssue[];
  summary: DmpQualitySummary;
}>;

type QuestionMatch = Readonly<{
  section: DmpTemplateSection;
  question: DmpTemplateQuestion;
  fieldId: string;
  value: DmpAnswerValue;
}>;

const sensitiveDataKeywords = ['個人情報', '要配慮', '健康', '医療', '患者', '位置情報', 'メールアドレス'];
const externalSharingKeywords = ['外部', '共同研究', '第三者', '委託', '企業'];
const commercializationKeywords = ['商用化', '特許', '知財', '共同研究契約', '企業連携'];

export function createDmpQualityReport(
  template: DmpTemplate,
  project: ResearchProject,
  answers: DmpAnswerMap,
): DmpQualityReport {
  const issues = dedupeIssues([
    ...createBasicQualityIssues(template, project, answers),
    ...createRiskQualityIssues(template, project, answers),
  ]);
  const summary = summarizeQualityIssues(issues);

  return { issues, summary };
}

export function createBasicQualityIssues(
  template: DmpTemplate,
  project: ResearchProject,
  answers: DmpAnswerMap,
): DmpQualityIssue[] {
  const issues: DmpQualityIssue[] = validateDmpAnswers(template, answers, project).map((issue) => ({
    id: `validation.${issue.fieldId}.${issue.message}`,
    category: 'basic' as const,
    severity: issue.severity,
    fieldId: issue.fieldId,
    sectionId: issue.sectionId,
    questionId: issue.questionId,
    title: issue.severity === 'error' ? '入力エラー' : '入力警告',
    message: issue.message,
    remediation: '該当する設問に移動し、回答内容を修正してください。',
  }));

  pushMissingIssue(issues, findQuestion(template, answers, (question) => question.id.includes('storage_location')), {
    id: 'basic.storage_location',
    title: '保存場所未設定',
    message: '保存場所が未設定です。',
    remediation: '機関リポジトリ、クラウドストレージ、研究室サーバなど主な保存場所を入力してください。',
  });

  pushMissingIssue(issues, findQuestion(template, answers, (question) => question.id.includes('sharing_policy')), {
    id: 'basic.sharing_policy',
    title: '公開区分未設定',
    message: '公開区分が未設定です。',
    remediation: '公開、制限付き公開、非公開のいずれかを選択してください。',
  });

  pushMissingIssue(issues, findQuestion(template, answers, (question) => question.id.includes('license')), {
    id: 'basic.license',
    title: 'ライセンス未設定',
    message: 'ライセンスが未設定です。',
    remediation: 'CC BY、CC0、独自条件、未定など、現時点のライセンス候補を入力してください。',
  });

  const managerMatch = findQuestion(template, answers, (question) =>
    ['data_manager', 'data_owner', 'responsible_party'].some((keyword) => question.id.includes(keyword)),
  );
  if (!project.dataManagerMemberId || (managerMatch && !isAnswered(managerMatch.value))) {
    issues.push({
      id: 'basic.data_manager',
      category: 'basic',
      severity: 'error',
      fieldId: managerMatch?.fieldId,
      sectionId: managerMatch?.section.id,
      questionId: managerMatch?.question.id,
      title: '研究データ管理責任者未設定',
      message: '研究データ管理責任者が未設定です。',
      remediation: 'PI、Data Steward、共同研究者など、DMP上の責任者を指定してください。',
    });
  }

  pushMissingIssue(issues, findQuestion(template, answers, (question) => question.id.includes('retention_period')), {
    id: 'basic.retention_period',
    title: '保持期間未設定',
    message: '研究データの保持期間が未設定です。',
    remediation: '研究終了後5年間、論文公開後10年間など、保持期間を明記してください。',
  });

  return issues;
}

export function createRiskQualityIssues(
  template: DmpTemplate,
  project: ResearchProject,
  answers: DmpAnswerMap,
): DmpQualityIssue[] {
  const issues: DmpQualityIssue[] = [];
  const combinedAnswerText = Object.values(answers).map(formatValueForSearch).join('\n');

  if (containsAny(combinedAnswerText, sensitiveDataKeywords)) {
    issues.push({
      id: 'risk.sensitive_data',
      category: 'risk',
      severity: 'warning',
      title: '個人情報・要配慮情報の可能性',
      message: '回答内容に個人情報・要配慮情報に関連する語が含まれています。',
      remediation: '倫理審査、同意取得、匿名化、アクセス制限、保存場所を確認してください。',
    });
  }

  const externalMemberExists = project.members.some((member) => member.role === 'EXTERNAL_COLLABORATOR');
  if (externalMemberExists || containsAny(combinedAnswerText, externalSharingKeywords)) {
    const accessControl = findQuestion(template, answers, (question) =>
      ['access_control', 'access_limitations', 'sharing_policy'].some((keyword) => question.id.includes(keyword)),
    );
    issues.push({
      id: 'risk.external_sharing',
      category: 'risk',
      severity: accessControl && isAnswered(accessControl.value) ? 'info' : 'warning',
      fieldId: accessControl?.fieldId,
      sectionId: accessControl?.section.id,
      questionId: accessControl?.question.id,
      title: '外部共有・共同研究の確認',
      message: '外部機関または共同研究者とのデータ共有が想定されます。',
      remediation: 'アクセス制御、共有範囲、契約上の制約、共有ログ管理を確認してください。',
    });
  }

  if (containsAny(combinedAnswerText, commercializationKeywords)) {
    issues.push({
      id: 'risk.commercialization',
      category: 'risk',
      severity: 'warning',
      title: '商用化・特許・契約の確認',
      message: '商用化、特許、知財、共同研究契約に関係する可能性があります。',
      remediation: '公開時期、公開範囲、特許出願前の公開禁止事項、契約条件を確認してください。',
    });
  }

  return issues;
}

export function summarizeQualityIssues(issues: DmpQualityIssue[]): DmpQualitySummary {
  const errorCount = issues.filter((issue) => issue.severity === 'error').length;
  const warningCount = issues.filter((issue) => issue.severity === 'warning').length;
  const infoCount = issues.filter((issue) => issue.severity === 'info').length;

  return {
    errorCount,
    warningCount,
    infoCount,
    canExport: errorCount === 0 && warningCount === 0,
    canExportWithWarnings: errorCount === 0,
  };
}

export function getExportDecisionMessage(summary: DmpQualitySummary, includeWarnings: boolean): string {
  if (summary.errorCount > 0) {
    return 'エラーが残っているため、エクスポート前に修正してください。';
  }

  if (summary.warningCount > 0 && !includeWarnings) {
    return '警告が残っています。警告を含めてエクスポートするか、先に解消してください。';
  }

  if (summary.warningCount > 0) {
    return '警告を含めてエクスポートできます。出力時に未解決警告を記録してください。';
  }

  return 'エクスポート可能です。';
}

function findQuestion(
  template: DmpTemplate,
  answers: DmpAnswerMap,
  predicate: (question: DmpTemplateQuestion) => boolean,
): QuestionMatch | undefined {
  for (const section of template.sections) {
    for (const question of section.questions) {
      if (!predicate({ ...question, id: question.id.toLowerCase() })) continue;
      const fieldId = getFieldId(section.id, question.id);
      return { section, question, fieldId, value: answers[fieldId] ?? null };
    }
  }

  return undefined;
}

function pushMissingIssue(
  issues: DmpQualityIssue[],
  match: QuestionMatch | undefined,
  issue: Pick<DmpQualityIssue, 'id' | 'title' | 'message' | 'remediation'>,
) {
  if (match && isAnswered(match.value)) return;

  issues.push({
    ...issue,
    category: 'basic',
    severity: 'error',
    fieldId: match?.fieldId,
    sectionId: match?.section.id,
    questionId: match?.question.id,
  });
}

function containsAny(value: string, keywords: string[]): boolean {
  return keywords.some((keyword) => value.includes(keyword));
}

function formatValueForSearch(value: DmpAnswerValue): string {
  if (value === null) return '';
  if (Array.isArray(value)) return value.join('\n');

  return String(value);
}

function dedupeIssues(issues: DmpQualityIssue[]): DmpQualityIssue[] {
  const seen = new Set<string>();
  return issues.filter((issue) => {
    const key = `${issue.id}:${issue.fieldId ?? ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

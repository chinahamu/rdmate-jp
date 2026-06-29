import { z } from 'zod';
import {
  datasetLicenseValues,
  publicationStatusLabels,
  publicationStatusValues,
  type Dataset,
  type DatasetLicense,
  type PublicationStatus,
} from './dataset';

const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: '日付はYYYY-MM-DD形式で入力してください。',
});

export const publicationDecisionIssueSeverityValues = ['error', 'warning', 'info'] as const;
export type PublicationDecisionIssueSeverity = (typeof publicationDecisionIssueSeverityValues)[number];

export type PublicationDecisionIssue = Readonly<{
  datasetId: string;
  field: string;
  severity: PublicationDecisionIssueSeverity;
  message: string;
}>;

export const publicationDecisionSchema = z.object({
  datasetId: z.string().min(1),
  publicationStatus: z.enum(publicationStatusValues),
  license: z.enum(datasetLicenseValues).optional(),
  plannedPublicationDate: dateStringSchema.optional(),
  publicUrl: z.string().url().optional(),
  doi: z.string().regex(/^10\.\d{4,9}\/\S+$/i).optional(),
  usageTerms: z.string().min(1).optional(),
  citation: z.string().min(1).optional(),
  containsPersonalInformation: z.boolean().default(false),
  hasCollaborativeAgreement: z.boolean().default(false),
  hasPatentPlan: z.boolean().default(false),
  nonPublicationReason: z.string().min(1).optional(),
  personalInformationHandling: z.string().min(1).optional(),
  collaborativeAgreementNote: z.string().min(1).optional(),
  patentPublicationNote: z.string().min(1).optional(),
});

export type PublicationDecisionInput = z.input<typeof publicationDecisionSchema>;
export type PublicationDecision = z.infer<typeof publicationDecisionSchema>;

export type PublicationReadiness = 'ready' | 'needs_review' | 'blocked';

export type PublicationLicenseCatalogItem = Readonly<{
  value: DatasetLicense;
  label: string;
  recommendedFor: string;
  notes: string;
}>;

export type PublicationStatusOption = Readonly<{
  value: PublicationStatus;
  label: string;
  description: string;
}>;

export const publicationStatusOptions: PublicationStatusOption[] = [
  {
    value: 'open',
    label: publicationStatusLabels.open,
    description: '公開URLまたはDOIを付与して広く共有できるデータセット。',
  },
  {
    value: 'embargoed',
    label: publicationStatusLabels.embargoed,
    description: '一定期間は非公開または制限付きとし、公開予定日以後に公開するデータセット。',
  },
  {
    value: 'restricted',
    label: publicationStatusLabels.restricted,
    description: '申請制、共同研究者限定、匿名化済み集計のみ等の条件付きで共有するデータセット。',
  },
  {
    value: 'closed',
    label: publicationStatusLabels.closed,
    description: '個人情報、契約、知財、倫理上の理由などで公開しないデータセット。理由の記録が必須。',
  },
  {
    value: 'undecided',
    label: publicationStatusLabels.undecided,
    description: '公開可否をまだ判断していないデータセット。責任者によるレビューが必要。',
  },
];

export const publicationLicenseCatalog: PublicationLicenseCatalogItem[] = [
  {
    value: 'CC BY 4.0',
    label: 'CC BY 4.0',
    recommendedFor: 'データセット、図表、メタデータ',
    notes: '出典表示を条件に再利用を許可する。汎用的な公開データ向け。',
  },
  {
    value: 'CC BY-SA 4.0',
    label: 'CC BY-SA 4.0',
    recommendedFor: '派生物にも同一ライセンスを求めたいデータ',
    notes: '出典表示と継承を条件に再利用を許可する。',
  },
  {
    value: 'CC0 1.0',
    label: 'CC0 1.0',
    recommendedFor: 'メタデータ、制限なく流通させたいデータ',
    notes: '権利主張を可能な限り放棄する。公開前に権利関係を確認する。',
  },
  {
    value: 'MIT',
    label: 'MIT',
    recommendedFor: 'ソースコード、解析スクリプト',
    notes: '著作権表示と許諾表示を条件に広い再利用を許可する。',
  },
  {
    value: 'Apache-2.0',
    label: 'Apache-2.0',
    recommendedFor: '特許条項を明示したいソフトウェア',
    notes: '特許ライセンス条項を含む。ソースコード公開時に有用。',
  },
  {
    value: 'GPL-3.0',
    label: 'GPL-3.0',
    recommendedFor: 'コピーレフトを求めるソフトウェア',
    notes: '派生物にも同じライセンス条件を求める。',
  },
  {
    value: 'Custom / Not specified',
    label: 'Custom / Not specified',
    recommendedFor: '契約・申請制・未確定のデータ',
    notes: '利用条件を別途明記する。公開前に標準ライセンスへ寄せられるか確認する。',
  },
];

export function createPublicationDecision(input: PublicationDecisionInput): PublicationDecision {
  return publicationDecisionSchema.parse(input);
}

export function derivePublicationDecision(
  dataset: Dataset,
  overrides: Partial<Omit<PublicationDecisionInput, 'datasetId'>> = {},
): PublicationDecision {
  return createPublicationDecision({
    datasetId: dataset.id,
    publicationStatus: dataset.publicationStatus,
    license: dataset.license,
    plannedPublicationDate: dataset.plannedPublicationDate,
    publicUrl: dataset.publicUrl,
    doi: dataset.doi,
    usageTerms: dataset.usageTerms,
    citation: dataset.citation,
    ...overrides,
  });
}

export function assessPublicationDecisions(decisions: PublicationDecision[]): PublicationDecisionIssue[] {
  return decisions.flatMap((decision) => assessPublicationDecision(decision));
}

export function assessPublicationDecision(decision: PublicationDecision): PublicationDecisionIssue[] {
  const issues: PublicationDecisionIssue[] = [];

  if (decision.publicationStatus === 'open' && decision.containsPersonalInformation) {
    issues.push({
      datasetId: decision.datasetId,
      field: 'publicationStatus',
      severity: 'warning',
      message: '個人情報を含む可能性があります。公開区分 open のまま公開してよいか確認してください。',
    });
  }

  if (decision.publicationStatus === 'open' && !decision.publicUrl && !decision.doi) {
    issues.push({
      datasetId: decision.datasetId,
      field: 'publicUrl',
      severity: 'warning',
      message: '公開可能データには公開URLまたはDOIを登録してください。',
    });
  }

  if ((decision.publicationStatus === 'open' || decision.publicationStatus === 'embargoed') && !decision.license) {
    issues.push({
      datasetId: decision.datasetId,
      field: 'license',
      severity: 'warning',
      message: '公開・公開予定データにはライセンスを設定してください。',
    });
  }

  if (decision.publicationStatus === 'embargoed' && !decision.plannedPublicationDate) {
    issues.push({
      datasetId: decision.datasetId,
      field: 'plannedPublicationDate',
      severity: 'error',
      message: '一定期間後に公開する場合は公開予定日を入力してください。',
    });
  }

  if (decision.publicationStatus === 'restricted' && !decision.usageTerms) {
    issues.push({
      datasetId: decision.datasetId,
      field: 'usageTerms',
      severity: 'warning',
      message: '制限付き公開の場合は申請条件・利用条件を入力してください。',
    });
  }

  if (decision.publicationStatus === 'closed' && !decision.nonPublicationReason) {
    issues.push({
      datasetId: decision.datasetId,
      field: 'nonPublicationReason',
      severity: 'error',
      message: '非公開の場合は非公開理由を入力してください。',
    });
  }

  if (decision.hasCollaborativeAgreement && (!decision.plannedPublicationDate || !decision.usageTerms)) {
    issues.push({
      datasetId: decision.datasetId,
      field: 'collaborativeAgreement',
      severity: 'warning',
      message: '共同研究契約ありの場合は公開予定日と利用条件の入力を確認してください。',
    });
  }

  if (decision.hasPatentPlan && !decision.patentPublicationNote) {
    issues.push({
      datasetId: decision.datasetId,
      field: 'patentPublicationNote',
      severity: 'warning',
      message: '特許出願予定ありの場合は公開タイミング確認メモを入力してください。',
    });
  }

  if (decision.license === 'Custom / Not specified' && decision.publicationStatus === 'open') {
    issues.push({
      datasetId: decision.datasetId,
      field: 'license',
      severity: 'info',
      message: '公開可能データに独自/未指定ライセンスが設定されています。標準ライセンスの採用可否を確認してください。',
    });
  }

  if (decision.publicationStatus === 'undecided') {
    issues.push({
      datasetId: decision.datasetId,
      field: 'publicationStatus',
      severity: 'info',
      message: '公開区分が未定です。責任者による公開可否判断が必要です。',
    });
  }

  return issues;
}

export function getPublicationReadiness(issues: PublicationDecisionIssue[]): PublicationReadiness {
  if (issues.some((issue) => issue.severity === 'error')) return 'blocked';
  if (issues.some((issue) => issue.severity === 'warning' || issue.severity === 'info')) return 'needs_review';

  return 'ready';
}

export function summarizePublicationDecisions(decisions: PublicationDecision[]) {
  const issues = assessPublicationDecisions(decisions);
  const countsByStatus = publicationStatusValues.reduce(
    (accumulator, status) => ({
      ...accumulator,
      [status]: decisions.filter((decision) => decision.publicationStatus === status).length,
    }),
    {} as Record<PublicationStatus, number>,
  );

  return {
    total: decisions.length,
    countsByStatus,
    blocked: decisions.filter((decision) => getPublicationReadiness(assessPublicationDecision(decision)) === 'blocked').length,
    needsReview: decisions.filter((decision) => getPublicationReadiness(assessPublicationDecision(decision)) === 'needs_review').length,
    issues,
  };
}

export function getLicenseCatalogItem(license: DatasetLicense | undefined): PublicationLicenseCatalogItem | undefined {
  if (!license) return undefined;

  return publicationLicenseCatalog.find((item) => item.value === license);
}

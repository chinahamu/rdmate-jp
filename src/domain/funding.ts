import { z } from 'zod';

const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: '日付はYYYY-MM-DD形式で入力してください。',
});

export const fundingAgencyTypeValues = [
  'kakenhi',
  'jst',
  'amed',
  'nih',
  'university',
  'foundation',
  'other',
] as const;

export type FundingAgencyType = (typeof fundingAgencyTypeValues)[number];

export const fundingAgencyTypeLabels: Record<FundingAgencyType, string> = {
  kakenhi: '科研費',
  jst: 'JST',
  amed: 'AMED',
  nih: 'NIH',
  university: '大学・学内助成',
  foundation: '民間財団',
  other: 'その他',
};

export const kakenhiProjectNumberSchema = z
  .string()
  .transform((value) => normalizeKakenhiProjectNumber(value))
  .refine((value) => isKakenhiProjectNumber(value), {
    message: '科研費課題番号は 26K00001 のような形式で入力してください。',
  });

export const fundingPeriodSchema = z
  .object({
    startDate: dateStringSchema,
    endDate: dateStringSchema,
  })
  .superRefine((period, context) => {
    if (new Date(period.startDate).getTime() > new Date(period.endDate).getTime()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: '助成期間の終了日は開始日以降にしてください。',
      });
    }
  });

export const fundingSchema = z
  .object({
    id: z.string().min(1),
    agencyName: z.string().min(1, '助成機関名は必須です。'),
    agencyType: z.enum(fundingAgencyTypeValues).default('other'),
    programName: z.string().min(1, '助成プログラム名は必須です。'),
    projectNumber: z.string().min(1).optional(),
    grantNumber: z.string().min(1).optional(),
    fiscalYear: z.string().min(1).optional(),
    period: fundingPeriodSchema.optional(),
    url: z.string().url('URLの形式が正しくありません。').optional(),
  })
  .superRefine((funding, context) => {
    if (funding.agencyType !== 'kakenhi' || !funding.projectNumber) return;

    const normalized = normalizeKakenhiProjectNumber(funding.projectNumber);
    if (!isKakenhiProjectNumber(normalized)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['projectNumber'],
        message: `科研費課題番号は 26K00001 のような形式で入力してください。正規化候補: ${normalized}`,
      });
    }
  });

export type FundingPeriod = z.infer<typeof fundingPeriodSchema>;
export type FundingInput = z.input<typeof fundingSchema>;
export type Funding = z.infer<typeof fundingSchema>;

const templateHintsByAgencyType: Record<FundingAgencyType, string> = {
  nih: 'nih-style-v1',
  university: 'university-basic-v1',
  kakenhi: 'japanese-funder-jp-v1',
  jst: 'japanese-funder-jp-v1',
  amed: 'japanese-funder-jp-v1',
  foundation: 'generic-jp-v2',
  other: 'generic-jp-v2',
};

export function createFunding(input: FundingInput): Funding {
  return fundingSchema.parse(input);
}

export function getFundingAgencyTypeLabel(agencyType: FundingAgencyType): string {
  return fundingAgencyTypeLabels[agencyType];
}

export function getTemplateHintForFunding(funding: Pick<Funding, 'agencyType'>): string {
  return templateHintsByAgencyType[funding.agencyType];
}

export function selectTemplateHintForFundingList(fundingList: Funding[]): string {
  const priority: FundingAgencyType[] = ['nih', 'university', 'kakenhi', 'jst', 'amed', 'foundation', 'other'];
  const matchedType = priority.find((agencyType) =>
    fundingList.some((funding) => funding.agencyType === agencyType),
  );

  return templateHintsByAgencyType[matchedType ?? 'other'];
}

export function normalizeKakenhiProjectNumber(value: string): string {
  return value.trim().replaceAll(/[\s-]/g, '').toUpperCase();
}

export function isKakenhiProjectNumber(value: string | undefined): boolean {
  if (!value) return false;
  return /^\d{2}[A-ZK]\d{5}$/.test(normalizeKakenhiProjectNumber(value));
}

export function getKakenhiProjectNumberHint(value: string | undefined): string {
  if (!value) {
    return '科研費課題番号は 26K00001 のような形式で入力します。';
  }

  const normalized = normalizeKakenhiProjectNumber(value);
  return isKakenhiProjectNumber(normalized)
    ? `科研費課題番号として扱えます: ${normalized}`
    : `科研費課題番号の形式を確認してください。正規化候補: ${normalized}`;
}

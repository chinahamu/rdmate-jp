import { z } from 'zod';
import type { Dataset } from './dataset';
import type { RelatedPaper, RelatedSoftware } from './metadata';

export const codeRepositoryProviderValues = ['github', 'gitlab', 'other'] as const;
export type CodeRepositoryProvider = (typeof codeRepositoryProviderValues)[number];

export const codeRepositoryRelationTypeValues = ['is_source_of', 'is_supplement_to', 'documents', 'reproduces'] as const;
export type CodeRepositoryRelationType = (typeof codeRepositoryRelationTypeValues)[number];

export const reproducibilityCheckStatusValues = ['passed', 'warning', 'failed'] as const;
export type ReproducibilityCheckStatus = (typeof reproducibilityCheckStatusValues)[number];

const repositoryUrlSchema = z.string().url('リポジトリURLの形式が正しくありません。');

export const codeRepositoryRelationSchema = z.object({
  id: z.string().min(1),
  relationType: z.enum(codeRepositoryRelationTypeValues),
  datasetId: z.string().min(1).optional(),
  paperId: z.string().min(1).optional(),
  softwareId: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
});

export const repositoryFilePresenceSchema = z.object({
  readme: z.boolean().default(false),
  license: z.boolean().default(false),
  requirements: z.boolean().default(false),
  environment: z.boolean().default(false),
  dockerfile: z.boolean().default(false),
  dataAcquisitionInstructions: z.boolean().default(false),
});

export const codeRepositorySchema = z
  .object({
    id: z.string().min(1),
    provider: z.enum(codeRepositoryProviderValues),
    name: z.string().min(1, 'リポジトリ名は必須です。'),
    url: repositoryUrlSchema,
    license: z.string().min(1).optional(),
    defaultBranch: z.string().min(1, '主要ブランチは必須です。').default('main'),
    releaseTags: z.array(z.string().min(1)).default([]),
    commitHash: z.string().min(7).optional(),
    archivedAt: z.string().datetime().optional(),
    filePresence: repositoryFilePresenceSchema.default({}),
    relations: z.array(codeRepositoryRelationSchema).default([]),
  })
  .superRefine((repository, context) => {
    if (repository.provider === 'github' && !/github\.com/i.test(repository.url)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['url'],
        message: 'GitHub連携ではgithub.comのURLを指定してください。',
      });
    }

    if (repository.provider === 'gitlab' && !/gitlab/i.test(repository.url)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['url'],
        message: 'GitLab連携ではGitLabのURLを指定してください。',
      });
    }
  });

export const reproducibilityCheckItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  status: z.enum(reproducibilityCheckStatusValues),
  message: z.string().min(1),
});

export const reproducibilityCheckReportSchema = z.object({
  repositoryId: z.string().min(1),
  score: z.number().int().min(0).max(100),
  status: z.enum(reproducibilityCheckStatusValues),
  items: z.array(reproducibilityCheckItemSchema),
  generatedAt: z.string().datetime(),
});

export type CodeRepositoryRelationInput = z.input<typeof codeRepositoryRelationSchema>;
export type CodeRepositoryRelation = z.infer<typeof codeRepositoryRelationSchema>;
export type RepositoryFilePresence = z.infer<typeof repositoryFilePresenceSchema>;
export type CodeRepositoryInput = z.input<typeof codeRepositorySchema>;
export type CodeRepository = z.infer<typeof codeRepositorySchema>;
export type ReproducibilityCheckItem = z.infer<typeof reproducibilityCheckItemSchema>;
export type ReproducibilityCheckReport = z.infer<typeof reproducibilityCheckReportSchema>;

export function createCodeRepository(input: CodeRepositoryInput): CodeRepository {
  return codeRepositorySchema.parse(input);
}

export function inferRepositoryProvider(url: string): CodeRepositoryProvider {
  if (/github\.com/i.test(url)) return 'github';
  if (/gitlab/i.test(url)) return 'gitlab';

  return 'other';
}

export function createCodeRepositoryFromUrl(input: Omit<CodeRepositoryInput, 'provider'> & { provider?: CodeRepositoryProvider }): CodeRepository {
  return createCodeRepository({
    ...input,
    provider: input.provider ?? inferRepositoryProvider(input.url),
  });
}

export function createDatasetRepositoryRelation(input: {
  id: string;
  dataset: Pick<Dataset, 'id' | 'name'>;
  relationType?: CodeRepositoryRelationType;
}): CodeRepositoryRelation {
  return codeRepositoryRelationSchema.parse({
    id: input.id,
    relationType: input.relationType ?? 'is_source_of',
    datasetId: input.dataset.id,
    description: `データセット「${input.dataset.name}」との関係`,
  });
}

export function createPaperRepositoryRelation(input: {
  id: string;
  paper: Pick<RelatedPaper, 'id' | 'title'>;
  relationType?: CodeRepositoryRelationType;
}): CodeRepositoryRelation {
  return codeRepositoryRelationSchema.parse({
    id: input.id,
    relationType: input.relationType ?? 'is_supplement_to',
    paperId: input.paper.id,
    description: `論文「${input.paper.title}」との関係`,
  });
}

export function createSoftwareRepositoryRelation(input: {
  id: string;
  software: Pick<RelatedSoftware, 'id' | 'name'>;
  relationType?: CodeRepositoryRelationType;
}): CodeRepositoryRelation {
  return codeRepositoryRelationSchema.parse({
    id: input.id,
    relationType: input.relationType ?? 'documents',
    softwareId: input.software.id,
    description: `ソフトウェア「${input.software.name}」との関係`,
  });
}

export function evaluateReproducibility(repository: CodeRepository, generatedAt = '2026-06-29T00:00:00.000Z'): ReproducibilityCheckReport {
  const items: ReproducibilityCheckItem[] = [
    buildItem('readme', 'README有無', repository.filePresence.readme, 'READMEが確認できます。', 'READMEが未確認です。利用方法と再現手順を記載してください。'),
    buildItem('license', 'LICENSE有無', Boolean(repository.filePresence.license && repository.license), 'LICENSEとライセンス情報が確認できます。', 'LICENSEまたはライセンス情報が不足しています。'),
    buildItem(
      'environment',
      'requirements / environment / Dockerfile 有無',
      Boolean(repository.filePresence.requirements || repository.filePresence.environment || repository.filePresence.dockerfile),
      '実行環境ファイルが確認できます。',
      'requirements、environment、Dockerfileのいずれかを追加してください。',
    ),
    buildItem(
      'data-acquisition',
      'データ取得手順の記載有無',
      repository.filePresence.dataAcquisitionInstructions,
      'データ取得手順が確認できます。',
      'README等にデータ取得手順を明記してください。',
    ),
    buildItem(
      'fixed-version',
      'リリースタグまたはコミットハッシュの固定有無',
      repository.releaseTags.length > 0 || Boolean(repository.commitHash),
      'リリースタグまたはコミットハッシュでバージョン固定されています。',
      'リリースタグまたはコミットハッシュで参照バージョンを固定してください。',
    ),
  ];
  const passed = items.filter((item) => item.status === 'passed').length;
  const score = Math.round((passed / items.length) * 100);
  const status: ReproducibilityCheckStatus = score === 100 ? 'passed' : score >= 60 ? 'warning' : 'failed';

  return reproducibilityCheckReportSchema.parse({
    repositoryId: repository.id,
    score,
    status,
    items,
    generatedAt,
  });
}

export function createRdmateCliMetadataJson(input: {
  projectId: string;
  repositories: CodeRepository[];
  reports: ReproducibilityCheckReport[];
}) {
  return {
    schemaVersion: '1.0.0',
    generatedBy: 'rdmate validate --format json',
    generatedAt: '2026-06-29T00:00:00.000Z',
    projectId: input.projectId,
    repositories: input.repositories.map((repository) => ({
      id: repository.id,
      provider: repository.provider,
      name: repository.name,
      url: repository.url,
      license: repository.license,
      defaultBranch: repository.defaultBranch,
      releaseTags: repository.releaseTags,
      commitHash: repository.commitHash,
      relations: repository.relations,
    })),
    reproducibility: input.reports,
  };
}

export function createGitHubActionsWorkflowYaml(input: { command?: string } = {}): string {
  const command = input.command ?? 'pnpm rdmate validate --project sample-project --format json';

  return [
    'name: RDMate Validate',
    '',
    'on:',
    '  pull_request:',
    '    branches: [main]',
    '',
    'jobs:',
    '  rdmate-validate:',
    '    runs-on: ubuntu-latest',
    '    steps:',
    '      - uses: actions/checkout@v4',
    '      - uses: pnpm/action-setup@v4',
    '      - uses: actions/setup-node@v4',
    '        with:',
    '          node-version: 22',
    '          cache: pnpm',
    '      - run: pnpm install --frozen-lockfile',
    `      - run: ${command}`,
  ].join('\n');
}

export function createReproducibilityPrComment(report: ReproducibilityCheckReport, repository: CodeRepository): string {
  const rows = report.items
    .map((item) => `| ${item.label} | ${item.status} | ${item.message} |`)
    .join('\n');

  return [
    `## RDMate reproducibility check: ${repository.name}`,
    '',
    `Score: **${report.score}/100** (${report.status})`,
    '',
    '| Check | Status | Message |',
    '|---|---|---|',
    rows,
  ].join('\n');
}

function buildItem(id: string, label: string, passed: boolean, passedMessage: string, failedMessage: string): ReproducibilityCheckItem {
  return {
    id,
    label,
    status: passed ? 'passed' : 'failed',
    message: passed ? passedMessage : failedMessage,
  };
}

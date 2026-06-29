import { z } from 'zod';
import type { Dataset, StorageLocation } from './dataset';
import { createDataset } from './dataset';

export const gakuninRdmConnectionStatusValues = ['not_configured', 'reference_registered', 'api_connected'] as const;
export type GakuninRdmConnectionStatus = (typeof gakuninRdmConnectionStatusValues)[number];

export const gakuninRdmConnectionModeValues = ['reference_only', 'api'] as const;
export type GakuninRdmConnectionMode = (typeof gakuninRdmConnectionModeValues)[number];

const gakuninRdmUrlSchema = z
  .string()
  .url('GakuNin RDM URLの形式が正しくありません。')
  .refine((value) => /rdm\.nii\.ac\.jp|gakunin|osf\.io/i.test(value), {
    message: 'GakuNin RDMまたはOSF互換プロジェクトURLを指定してください。',
  });

export const gakuninRdmConnectionSchema = z
  .object({
    id: z.string().min(1),
    mode: z.enum(gakuninRdmConnectionModeValues).default('reference_only'),
    status: z.enum(gakuninRdmConnectionStatusValues).default('not_configured'),
    projectId: z.string().min(1).optional(),
    projectUrl: gakuninRdmUrlSchema.optional(),
    apiBaseUrl: z.string().url().optional(),
    accessTokenRef: z.string().min(1).optional(),
    displayName: z.string().min(1).optional(),
    lastValidatedAt: z.string().datetime().optional(),
  })
  .superRefine((connection, context) => {
    if (connection.status !== 'not_configured' && !connection.projectUrl) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['projectUrl'],
        message: '参照登録済みまたはAPI連携済みの場合はprojectUrlが必要です。',
      });
    }

    if (connection.mode === 'api' && (!connection.apiBaseUrl || !connection.accessTokenRef)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['apiBaseUrl'],
        message: 'API連携モードではapiBaseUrlとaccessTokenRefが必要です。',
      });
    }
  })
  .transform((connection) => ({
    ...connection,
    projectId: connection.projectId ?? (connection.projectUrl ? extractGakuninRdmProjectId(connection.projectUrl) : undefined),
    status: connection.mode === 'api' ? 'api_connected' as const : connection.projectUrl ? 'reference_registered' as const : connection.status,
  }));

export const gakuninRdmFileSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  name: z.string().min(1),
  path: z.string().min(1),
  sizeBytes: z.number().int().nonnegative().optional(),
  mimeType: z.string().min(1).optional(),
  modifiedAt: z.string().datetime().optional(),
});

export const gakuninRdmProjectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  url: gakuninRdmUrlSchema,
  description: z.string().min(1).optional(),
  status: z.enum(gakuninRdmConnectionStatusValues),
  storageLocationId: z.string().min(1).optional(),
});

export const gakuninRdmMetadataExportSchema = z.object({
  projectId: z.string().min(1),
  exportedAt: z.string().datetime(),
  metadata: z.record(z.unknown()),
  destinationUrl: gakuninRdmUrlSchema,
});

export type GakuninRdmConnectionInput = z.input<typeof gakuninRdmConnectionSchema>;
export type GakuninRdmConnection = z.infer<typeof gakuninRdmConnectionSchema>;
export type GakuninRdmProject = z.infer<typeof gakuninRdmProjectSchema>;
export type GakuninRdmFile = z.infer<typeof gakuninRdmFileSchema>;
export type GakuninRdmMetadataExport = z.infer<typeof gakuninRdmMetadataExportSchema>;

export type GakuninRdmValidationResult = Readonly<{
  ok: boolean;
  status: GakuninRdmConnectionStatus;
  message: string;
  checkedAt: string;
}>;

export interface GakuninRdmConnector {
  listProjects(): Promise<GakuninRdmProject[]>;
  getProject(projectId: string): Promise<GakuninRdmProject | undefined>;
  listFiles(projectId: string): Promise<GakuninRdmFile[]>;
  exportMetadata(projectId: string, payload: Record<string, unknown>): Promise<GakuninRdmMetadataExport>;
  validateConnection(): Promise<GakuninRdmValidationResult>;
}

export function createGakuninRdmConnection(input: GakuninRdmConnectionInput): GakuninRdmConnection {
  return gakuninRdmConnectionSchema.parse(input);
}

export function createGakuninRdmStorageLocation(input: {
  id: string;
  label?: string;
  projectUrl: string;
  accessScope?: string;
  notes?: string;
}): StorageLocation {
  const projectId = extractGakuninRdmProjectId(input.projectUrl);

  return {
    id: input.id,
    label: input.label ?? `GakuNin RDM ${projectId}`,
    uri: input.projectUrl,
    storageType: 'gakunin_rdm_url',
    accessScope: input.accessScope ?? 'GakuNin RDMプロジェクト参加者',
    hasBackup: true,
    isEncrypted: true,
    notes: input.notes ?? `GakuNin RDM projectId=${projectId} の参照登録。Phase 3ではファイル本体を取得しません。`,
  };
}

export function attachGakuninRdmStorageLocation(
  dataset: Dataset,
  location: StorageLocation,
): Dataset {
  const existing = dataset.storageLocations.filter((candidate) => candidate.id !== location.id);

  return createDataset({
    ...dataset,
    storageLocations: [...existing, location],
  });
}

export function extractGakuninRdmProjectId(projectUrl: string): string {
  try {
    const url = new URL(projectUrl);
    const parts = url.pathname.split('/').filter(Boolean);
    return parts[0] ?? 'unknown-project';
  } catch {
    return 'unknown-project';
  }
}

export function getGakuninRdmConnectionStatusLabel(status: GakuninRdmConnectionStatus): string {
  const labels: Record<GakuninRdmConnectionStatus, string> = {
    not_configured: '未設定',
    reference_registered: '参照登録済み',
    api_connected: 'API連携済み',
  };

  return labels[status];
}

export class ReferenceOnlyGakuninRdmConnector implements GakuninRdmConnector {
  constructor(
    private readonly connection: GakuninRdmConnection,
    private readonly files: GakuninRdmFile[] = [],
  ) {}

  async listProjects(): Promise<GakuninRdmProject[]> {
    const project = await this.getProject(this.connection.projectId ?? 'unknown-project');
    return project ? [project] : [];
  }

  async getProject(projectId: string): Promise<GakuninRdmProject | undefined> {
    if (!this.connection.projectUrl || this.connection.projectId !== projectId) return undefined;

    return gakuninRdmProjectSchema.parse({
      id: this.connection.projectId,
      name: this.connection.displayName ?? `GakuNin RDM project ${this.connection.projectId}`,
      url: this.connection.projectUrl,
      status: this.connection.status,
      storageLocationId: `gakunin-rdm-${this.connection.projectId}`,
    });
  }

  async listFiles(projectId: string): Promise<GakuninRdmFile[]> {
    if (this.connection.projectId !== projectId) return [];
    return this.files.map((file) => gakuninRdmFileSchema.parse(file));
  }

  async exportMetadata(projectId: string, payload: Record<string, unknown>): Promise<GakuninRdmMetadataExport> {
    const project = await this.getProject(projectId);
    if (!project) {
      throw new Error(`GakuNin RDM project not found: ${projectId}`);
    }

    return gakuninRdmMetadataExportSchema.parse({
      projectId,
      destinationUrl: project.url,
      exportedAt: '2026-06-29T00:00:00.000Z',
      metadata: {
        ...payload,
        exportMode: this.connection.mode,
        note: 'Phase 3 reference-only export. Submit this payload manually or via a future API connector.',
      },
    });
  }

  async validateConnection(): Promise<GakuninRdmValidationResult> {
    const ok = Boolean(this.connection.projectUrl && this.connection.projectId);

    return {
      ok,
      status: this.connection.status,
      message: ok
        ? `${getGakuninRdmConnectionStatusLabel(this.connection.status)}: ${this.connection.projectUrl}`
        : 'GakuNin RDMプロジェクトURLが未設定です。',
      checkedAt: '2026-06-29T00:00:00.000Z',
    };
  }
}

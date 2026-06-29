import { describe, expect, it } from 'vitest';
import {
  createLogicalDeleteRecord,
  createProjectJsonSnapshot,
  detectSensitiveSignals,
  getBackupPlans,
  parseOperationEnv,
  parseSessionConfig,
  validateInstitutionalOperation,
  validateProjectJsonImport,
  validateProtectedMetadata,
  validateServerOperation,
} from '../../src/domain/data-protection';
import { createAppUser, createProjectPermissionAssignment } from '../../src/domain/access-control';

const projectId = 'project-1';

const steward = createAppUser({
  id: 'steward',
  username: 'steward',
  email: 'steward@example.ac.jp',
  affiliation: '図書館',
  role: 'DATA_STEWARD',
  mode: 'institution',
});

const viewer = createAppUser({
  id: 'viewer',
  username: 'viewer',
  email: 'viewer@example.ac.jp',
  affiliation: '研究倫理支援室',
  role: 'VIEWER',
  mode: 'institution',
});

const assignments = [
  createProjectPermissionAssignment({
    id: 'steward-project',
    projectId,
    userId: steward.id,
    role: 'DATA_STEWARD',
    permissions: {},
  }),
  createProjectPermissionAssignment({
    id: 'viewer-project',
    projectId,
    userId: viewer.id,
    role: 'VIEWER',
    permissions: {},
  }),
];

describe('data protection operations domain', () => {
  it('warns when metadata may contain sensitive or raw data references', () => {
    const issues = validateProtectedMetadata({
      projectId,
      title: 'contact@example.invalid',
      description: '学生番号と健康情報を含む可能性があるメタデータ。',
      dataType: 'text_corpus',
      storageUri: '/Users/example/raw.csv',
      publicationStatus: 'open',
      containsPersonalInformation: true,
      containsSensitiveInformation: true,
      rawDataStoredInRDMate: true,
      freeText: 'GPS 緯度 経度',
    });

    expect(issues.some((issue) => issue.field === 'rawDataStoredInRDMate' && issue.severity === 'error')).toBe(true);
    expect(issues.some((issue) => issue.field === 'publicationStatus' && issue.severity === 'error')).toBe(true);
    expect(issues.some((issue) => issue.signal === 'raw_file_path')).toBe(true);
  });

  it('detects sensitive signals in free text', () => {
    expect(detectSensitiveSignals('contact@example.invalid 学籍番号 GPS')).toEqual([
      'email_address',
      'student_id',
      'location_data',
    ]);
  });

  it('combines server-side validation and permission checks', () => {
    const allowed = validateServerOperation({
      mode: 'institution',
      user: steward,
      assignments,
      projectId,
      action: 'edit_dataset',
      metadata: {
        projectId,
        title: '安全なメタデータ',
        description: '参照情報のみを保持する。',
        dataType: 'survey_data',
        publicationStatus: 'restricted',
        rawDataStoredInRDMate: false,
      },
    });

    const denied = validateServerOperation({
      mode: 'institution',
      user: viewer,
      assignments,
      projectId,
      action: 'edit_dataset',
      metadata: {
        projectId,
        title: '閲覧者による更新',
        description: '権限チェックテスト。',
        dataType: 'survey_data',
        publicationStatus: 'restricted',
        rawDataStoredInRDMate: false,
      },
    });

    expect(allowed.allowed).toBe(true);
    expect(denied.allowed).toBe(false);
    expect(denied.issues.some((issue) => issue.field === 'permission')).toBe(true);
  });

  it('validates session and institutional operation settings', () => {
    const session = parseSessionConfig({
      sessionSecret: 'abcdefghijklmnopqrstuvwxyz1234567890',
      cookieSecure: true,
      maxAgeMinutes: 480,
      sameSite: 'lax',
    });
    const env = parseOperationEnv({
      databaseUrl: 'file:./dev.db',
      usageMode: 'institution',
      sessionSecret: 'abcdefghijklmnopqrstuvwxyz1234567890',
      enforceHttps: false,
      backupDirectory: './backups',
      allowRawDataUpload: true,
    });
    const issues = validateInstitutionalOperation(env);

    expect(session.cookieSecure).toBe(true);
    expect(issues.some((issue) => issue.field === 'enforceHttps' && issue.severity === 'error')).toBe(true);
    expect(issues.some((issue) => issue.field === 'allowRawDataUpload' && issue.severity === 'error')).toBe(true);
  });

  it('builds backup plans for sqlite, postgresql, and project json', () => {
    const plans = getBackupPlans('file:./dev.db', './backups');

    expect(plans.map((plan) => plan.target)).toEqual(['sqlite', 'postgresql', 'project_json']);
    expect(plans[0]?.command).toContain('db:backup:sqlite');
  });

  it('validates project json import previews', () => {
    const snapshot = createProjectJsonSnapshot({
      projectId,
      project: { id: projectId, title: '研究課題A' },
      dmpAnswers: [],
      datasets: [],
      auditLogs: [],
    });
    const issues = validateProjectJsonImport(snapshot);

    expect(snapshot.schemaVersion).toBe('1.0.0');
    expect(issues.some((issue) => issue.field === 'datasets' && issue.severity === 'info')).toBe(true);
  });

  it('requires confirmation text before logical delete', () => {
    const pending = createLogicalDeleteRecord({
      id: 'delete-1',
      entityType: 'dataset',
      entityId: 'dataset-1',
      requestedBy: 'steward',
      requestedAt: '2026-06-29T09:00:00+09:00',
      confirmationText: 'wrong text',
    });
    const confirmed = createLogicalDeleteRecord({
      ...pending,
      confirmationText: 'DELETE dataset:dataset-1',
    });

    expect(pending.mode).toBe('confirm_required');
    expect(confirmed.mode).toBe('logical_delete');
  });
});

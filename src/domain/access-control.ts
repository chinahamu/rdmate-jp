import { z } from 'zod';

export const usageModeValues = ['local', 'team', 'institution'] as const;

export type UsageMode = (typeof usageModeValues)[number];

export const usageModeLabels: Record<UsageMode, string> = {
  local: 'ローカル利用',
  team: '研究室共有',
  institution: '学内サーバ運用',
};

export const userRoleValues = ['PI', 'DATA_STEWARD', 'MEMBER', 'VIEWER', 'ADMIN'] as const;

export type UserRole = (typeof userRoleValues)[number];

export const userRoleLabels: Record<UserRole, string> = {
  PI: '研究代表者',
  DATA_STEWARD: 'データスチュワード',
  MEMBER: 'メンバー',
  VIEWER: '閲覧者',
  ADMIN: '管理者',
};

export const permissionActionValues = [
  'view_project',
  'edit_dmp',
  'edit_dataset',
  'export',
  'manage_settings',
] as const;

export type PermissionAction = (typeof permissionActionValues)[number];

export const permissionActionLabels: Record<PermissionAction, string> = {
  view_project: 'プロジェクト閲覧',
  edit_dmp: 'DMP編集',
  edit_dataset: 'データセット編集',
  export: 'エクスポート',
  manage_settings: '管理者設定',
};

export type PermissionSet = Readonly<Record<PermissionAction, boolean>>;

const permissionOverridesSchema = z
  .object({
    view_project: z.boolean().optional(),
    edit_dmp: z.boolean().optional(),
    edit_dataset: z.boolean().optional(),
    export: z.boolean().optional(),
    manage_settings: z.boolean().optional(),
  })
  .default({});

export type PermissionOverrides = z.infer<typeof permissionOverridesSchema>;

export const appUserSchema = z.object({
  id: z.string().min(1),
  username: z.string().min(1, 'ユーザー名は必須です。'),
  email: z.string().email('メールアドレスの形式が正しくありません。'),
  affiliation: z.string().min(1, '所属は必須です。'),
  role: z.enum(userRoleValues).default('VIEWER'),
  mode: z.enum(usageModeValues).default('local'),
});

export type AppUserInput = z.input<typeof appUserSchema>;
export type AppUser = z.infer<typeof appUserSchema>;

export const projectPermissionAssignmentSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1, '研究課題IDは必須です。'),
  userId: z.string().min(1, 'ユーザーIDは必須です。'),
  role: z.enum(userRoleValues).optional(),
  permissions: permissionOverridesSchema,
});

export type ProjectPermissionAssignmentInput = z.input<typeof projectPermissionAssignmentSchema>;
export type ProjectPermissionAssignment = z.infer<typeof projectPermissionAssignmentSchema>;

export type ProjectPermissionContext = Readonly<{
  mode: UsageMode;
  user: AppUser;
  projectId: string;
  action: PermissionAction;
  assignment?: ProjectPermissionAssignment;
}>;

export type AccessControlIssueSeverity = 'error' | 'warning' | 'info';

export type AccessControlIssue = Readonly<{
  field: string;
  severity: AccessControlIssueSeverity;
  message: string;
}>;

export type AccessControlSummary = Readonly<{
  mode: UsageMode;
  userCount: number;
  assignmentCount: number;
  roles: Record<UserRole, number>;
  projectCount: number;
  manageableProjectCount: number;
}>;

export const defaultRolePermissions: Record<UserRole, PermissionSet> = {
  ADMIN: {
    view_project: true,
    edit_dmp: true,
    edit_dataset: true,
    export: true,
    manage_settings: true,
  },
  PI: {
    view_project: true,
    edit_dmp: true,
    edit_dataset: true,
    export: true,
    manage_settings: false,
  },
  DATA_STEWARD: {
    view_project: true,
    edit_dmp: true,
    edit_dataset: true,
    export: true,
    manage_settings: false,
  },
  MEMBER: {
    view_project: true,
    edit_dmp: true,
    edit_dataset: true,
    export: false,
    manage_settings: false,
  },
  VIEWER: {
    view_project: true,
    edit_dmp: false,
    edit_dataset: false,
    export: false,
    manage_settings: false,
  },
};

export function createAppUser(input: AppUserInput): AppUser {
  return appUserSchema.parse(input);
}

export function createProjectPermissionAssignment(
  input: ProjectPermissionAssignmentInput,
): ProjectPermissionAssignment {
  return projectPermissionAssignmentSchema.parse(input);
}

export function getUsageModeCapabilities(mode: UsageMode) {
  if (mode === 'local') {
    return {
      label: usageModeLabels[mode],
      description: '個人PC・研究室PCでの単一ユーザー運用。明示的なロール設定がない場合も利用者ロールに基づき操作できます。',
      requiresProjectAssignment: false,
      expectedAdministrators: 1,
    };
  }

  if (mode === 'team') {
    return {
      label: usageModeLabels[mode],
      description: '研究室内共有向けの複数ユーザー運用。研究課題ごとにメンバーとロールを割り当てます。',
      requiresProjectAssignment: true,
      expectedAdministrators: 1,
    };
  }

  return {
    label: usageModeLabels[mode],
    description: '学内サーバ向けの複数研究課題運用。管理者がユーザー、ロール、研究課題権限を統制します。',
    requiresProjectAssignment: true,
    expectedAdministrators: 2,
  };
}

export function resolveProjectPermissions(
  user: AppUser,
  assignment?: ProjectPermissionAssignment,
): PermissionSet {
  const role = assignment?.role ?? user.role;
  const basePermissions = defaultRolePermissions[role];
  const overrides = assignment?.permissions ?? {};

  return permissionActionValues.reduce((resolved, action) => {
    resolved[action] = overrides[action] ?? basePermissions[action];
    return resolved;
  }, {} as Record<PermissionAction, boolean>);
}

export function canPerformProjectAction(context: ProjectPermissionContext): boolean {
  if (context.user.role === 'ADMIN') {
    return true;
  }

  if (context.assignment && context.assignment.projectId !== context.projectId) {
    return false;
  }

  if (context.mode !== 'local' && !context.assignment) {
    return false;
  }

  return resolveProjectPermissions(context.user, context.assignment)[context.action];
}

export function canViewProject(context: Omit<ProjectPermissionContext, 'action'>): boolean {
  return canPerformProjectAction({ ...context, action: 'view_project' });
}

export function getProjectAssignmentForUser(
  assignments: ProjectPermissionAssignment[],
  projectId: string,
  userId: string,
): ProjectPermissionAssignment | undefined {
  return assignments.find((assignment) => assignment.projectId === projectId && assignment.userId === userId);
}

export function summarizeAccessControl(
  mode: UsageMode,
  users: AppUser[],
  assignments: ProjectPermissionAssignment[],
): AccessControlSummary {
  const roles = userRoleValues.reduce((counts, role) => {
    counts[role] = users.filter((user) => user.role === role).length;
    return counts;
  }, {} as Record<UserRole, number>);
  const projectIds = Array.from(new Set(assignments.map((assignment) => assignment.projectId)));
  const manageableProjectCount = projectIds.filter((projectId) =>
    users.some((user) =>
      canPerformProjectAction({
        mode,
        user,
        projectId,
        assignment: getProjectAssignmentForUser(assignments, projectId, user.id),
        action: 'manage_settings',
      }),
    ),
  ).length;

  return {
    mode,
    userCount: users.length,
    assignmentCount: assignments.length,
    roles,
    projectCount: projectIds.length,
    manageableProjectCount,
  };
}

export function validateAccessControlSetup(
  mode: UsageMode,
  users: AppUser[],
  assignments: ProjectPermissionAssignment[],
): AccessControlIssue[] {
  const issues: AccessControlIssue[] = [];
  const userIds = new Set(users.map((user) => user.id));
  const assignmentKeys = new Set<string>();
  const projectIds = Array.from(new Set(assignments.map((assignment) => assignment.projectId)));

  if (users.length === 0) {
    issues.push({
      field: 'users',
      severity: 'error',
      message: 'ユーザーを1名以上登録してください。',
    });
  }

  if (mode !== 'local' && !users.some((user) => user.role === 'ADMIN')) {
    issues.push({
      field: 'role',
      severity: 'error',
      message: '複数ユーザー運用では管理者（Admin）を1名以上登録してください。',
    });
  }

  for (const assignment of assignments) {
    if (!userIds.has(assignment.userId)) {
      issues.push({
        field: 'assignment.userId',
        severity: 'error',
        message: `存在しないユーザーID ${assignment.userId} が研究課題権限に設定されています。`,
      });
    }

    const key = `${assignment.projectId}:${assignment.userId}`;
    if (assignmentKeys.has(key)) {
      issues.push({
        field: 'assignment',
        severity: 'warning',
        message: `研究課題 ${assignment.projectId} に対するユーザー ${assignment.userId} の権限が重複しています。`,
      });
    }
    assignmentKeys.add(key);
  }

  for (const projectId of projectIds) {
    const projectAssignments = assignments.filter((assignment) => assignment.projectId === projectId);
    const hasProjectPi = projectAssignments.some((assignment) => {
      const user = users.find((candidate) => candidate.id === assignment.userId);
      return (assignment.role ?? user?.role) === 'PI';
    });

    if (!hasProjectPi) {
      issues.push({
        field: 'assignment.role',
        severity: 'warning',
        message: `研究課題 ${projectId} に研究代表者（PI）の権限割当がありません。`,
      });
    }

    const hasSettingsManager = users.some((user) =>
      canPerformProjectAction({
        mode,
        user,
        projectId,
        assignment: getProjectAssignmentForUser(assignments, projectId, user.id),
        action: 'manage_settings',
      }),
    );

    if (!hasSettingsManager) {
      issues.push({
        field: 'manage_settings',
        severity: 'warning',
        message: `研究課題 ${projectId} の管理者設定権限を持つユーザーがいません。`,
      });
    }
  }

  if (mode === 'institution') {
    const adminCount = users.filter((user) => user.role === 'ADMIN').length;
    if (adminCount < getUsageModeCapabilities(mode).expectedAdministrators) {
      issues.push({
        field: 'role',
        severity: 'info',
        message: '学内サーバ運用では、代理対応のため管理者を2名以上にすることを推奨します。',
      });
    }
  }

  return issues;
}

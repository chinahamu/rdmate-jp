import {
  createAppUser,
  createProjectPermissionAssignment,
  type AppUser,
  type ProjectPermissionAssignment,
  type UsageMode,
} from '@/domain/access-control';

const sampleUsers = [
  createAppUser({
    id: 'user-admin',
    username: 'admin.tanaka',
    email: 'admin.tanaka@example.ac.jp',
    affiliation: 'メタ大学 研究推進部',
    role: 'ADMIN',
    mode: 'institution',
  }),
  createAppUser({
    id: 'sample-pi',
    username: 'taro.yamada',
    email: 'taro.yamada@example.ac.jp',
    affiliation: 'メタ大学 情報学部',
    role: 'PI',
    mode: 'institution',
  }),
  createAppUser({
    id: 'sample-data-steward',
    username: 'hanako.sato',
    email: 'hanako.sato@example.ac.jp',
    affiliation: 'メタ大学 図書館',
    role: 'DATA_STEWARD',
    mode: 'institution',
  }),
  createAppUser({
    id: 'user-member',
    username: 'member.suzuki',
    email: 'member.suzuki@example.ac.jp',
    affiliation: 'メタ大学 情報学部',
    role: 'MEMBER',
    mode: 'institution',
  }),
  createAppUser({
    id: 'user-viewer',
    username: 'viewer.ito',
    email: 'viewer.ito@example.ac.jp',
    affiliation: 'メタ大学 研究倫理支援室',
    role: 'VIEWER',
    mode: 'institution',
  }),
] satisfies AppUser[];

const sampleAssignments = [
  createProjectPermissionAssignment({
    id: 'access-admin-sample-project',
    projectId: 'sample-project',
    userId: 'user-admin',
    role: 'ADMIN',
    permissions: {},
  }),
  createProjectPermissionAssignment({
    id: 'access-pi-sample-project',
    projectId: 'sample-project',
    userId: 'sample-pi',
    role: 'PI',
    permissions: {
      manage_settings: true,
    },
  }),
  createProjectPermissionAssignment({
    id: 'access-steward-sample-project',
    projectId: 'sample-project',
    userId: 'sample-data-steward',
    role: 'DATA_STEWARD',
    permissions: {},
  }),
  createProjectPermissionAssignment({
    id: 'access-member-sample-project',
    projectId: 'sample-project',
    userId: 'user-member',
    role: 'MEMBER',
    permissions: {},
  }),
  createProjectPermissionAssignment({
    id: 'access-viewer-sample-project',
    projectId: 'sample-project',
    userId: 'user-viewer',
    role: 'VIEWER',
    permissions: {},
  }),
] satisfies ProjectPermissionAssignment[];

export function getSampleUsageMode(): UsageMode {
  return 'institution';
}

export function getSampleAccessControlUsers(): AppUser[] {
  return sampleUsers;
}

export function getSampleProjectPermissionAssignments(): ProjectPermissionAssignment[] {
  return sampleAssignments;
}

import { describe, expect, it } from 'vitest';
import {
  canPerformProjectAction,
  createAppUser,
  createProjectPermissionAssignment,
  getProjectAssignmentForUser,
  permissionActionValues,
  resolveProjectPermissions,
  summarizeAccessControl,
  validateAccessControlSetup,
} from '../../src/domain/access-control';

const projectId = 'project-1';

const admin = createAppUser({
  id: 'admin',
  username: 'admin',
  email: 'admin@example.ac.jp',
  affiliation: '研究推進部',
  role: 'ADMIN',
  mode: 'institution',
});

const pi = createAppUser({
  id: 'pi',
  username: 'pi',
  email: 'pi@example.ac.jp',
  affiliation: '情報学部',
  role: 'PI',
  mode: 'institution',
});

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
    id: 'admin-project',
    projectId,
    userId: admin.id,
    role: 'ADMIN',
    permissions: {},
  }),
  createProjectPermissionAssignment({
    id: 'pi-project',
    projectId,
    userId: pi.id,
    role: 'PI',
    permissions: { manage_settings: true },
  }),
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

describe('access control domain', () => {
  it('defines all required permission actions', () => {
    expect(permissionActionValues).toEqual([
      'view_project',
      'edit_dmp',
      'edit_dataset',
      'export',
      'manage_settings',
    ]);
  });

  it('resolves default role permissions', () => {
    expect(resolveProjectPermissions(admin).manage_settings).toBe(true);
    expect(resolveProjectPermissions(steward).edit_dataset).toBe(true);
    expect(resolveProjectPermissions(viewer).edit_dmp).toBe(false);
  });

  it('supports project-level permission overrides', () => {
    const piAssignment = getProjectAssignmentForUser(assignments, projectId, pi.id);

    expect(piAssignment).toBeDefined();
    expect(
      canPerformProjectAction({
        mode: 'institution',
        user: pi,
        projectId,
        assignment: piAssignment,
        action: 'manage_settings',
      }),
    ).toBe(true);
  });

  it('requires explicit project assignment outside local mode', () => {
    expect(
      canPerformProjectAction({
        mode: 'team',
        user: steward,
        projectId,
        action: 'edit_dataset',
      }),
    ).toBe(false);

    expect(
      canPerformProjectAction({
        mode: 'local',
        user: steward,
        projectId,
        action: 'edit_dataset',
      }),
    ).toBe(true);
  });

  it('blocks viewers from editing and exporting', () => {
    const viewerAssignment = getProjectAssignmentForUser(assignments, projectId, viewer.id);

    expect(
      canPerformProjectAction({
        mode: 'institution',
        user: viewer,
        projectId,
        assignment: viewerAssignment,
        action: 'view_project',
      }),
    ).toBe(true);
    expect(
      canPerformProjectAction({
        mode: 'institution',
        user: viewer,
        projectId,
        assignment: viewerAssignment,
        action: 'edit_dmp',
      }),
    ).toBe(false);
    expect(
      canPerformProjectAction({
        mode: 'institution',
        user: viewer,
        projectId,
        assignment: viewerAssignment,
        action: 'export',
      }),
    ).toBe(false);
  });

  it('summarizes roles and project assignments', () => {
    const summary = summarizeAccessControl('institution', [admin, pi, steward, viewer], assignments);

    expect(summary.userCount).toBe(4);
    expect(summary.assignmentCount).toBe(4);
    expect(summary.roles.ADMIN).toBe(1);
    expect(summary.projectCount).toBe(1);
    expect(summary.manageableProjectCount).toBe(1);
  });

  it('validates missing admin and unknown assignment users', () => {
    const issues = validateAccessControlSetup('team', [pi], [
      createProjectPermissionAssignment({
        id: 'unknown-user-assignment',
        projectId,
        userId: 'missing-user',
        role: 'VIEWER',
        permissions: {},
      }),
    ]);

    expect(issues.some((issue) => issue.field === 'role' && issue.severity === 'error')).toBe(true);
    expect(issues.some((issue) => issue.field === 'assignment.userId' && issue.severity === 'error')).toBe(true);
  });
});

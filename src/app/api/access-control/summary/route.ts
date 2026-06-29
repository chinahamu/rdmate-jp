import {
  permissionActionLabels,
  permissionActionValues,
  resolveProjectPermissions,
  summarizeAccessControl,
  validateAccessControlSetup,
} from '@/domain/access-control';
import {
  getSampleAccessControlUsers,
  getSampleProjectPermissionAssignments,
  getSampleUsageMode,
} from '@/server/sample-access-control';

export function GET() {
  const mode = getSampleUsageMode();
  const users = getSampleAccessControlUsers();
  const assignments = getSampleProjectPermissionAssignments();
  const summary = summarizeAccessControl(mode, users, assignments);
  const issues = validateAccessControlSetup(mode, users, assignments);

  return Response.json({
    schemaVersion: '1.0.0',
    mode,
    summary,
    roles: users.map((user) => ({
      userId: user.id,
      username: user.username,
      affiliation: user.affiliation,
      role: user.role,
      defaultPermissions: resolveProjectPermissions(user),
    })),
    permissionActions: permissionActionValues.map((action) => ({
      value: action,
      label: permissionActionLabels[action],
    })),
    assignments,
    issues,
  });
}

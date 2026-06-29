import type { Metadata } from 'next';
import { AccessControlDashboard } from '@/components/access-control-dashboard';
import { AppShell } from '@/components/app-shell';
import {
  getSampleAccessControlUsers,
  getSampleProjectPermissionAssignments,
  getSampleUsageMode,
} from '@/server/sample-access-control';

export const metadata: Metadata = {
  title: '利用モードと権限管理 | RDMate JP',
};

export default function AccessControlPage() {
  const mode = getSampleUsageMode();
  const users = getSampleAccessControlUsers();
  const assignments = getSampleProjectPermissionAssignments();

  return (
    <AppShell>
      <section className="hero">
        <p className="eyebrow">Operations</p>
        <h1>利用モードと権限管理</h1>
        <p>
          個人利用、研究室共有、学内サーバ運用に対応するため、ユーザー、ロール、研究課題ごとの操作権限を管理します。
        </p>
      </section>

      <AccessControlDashboard mode={mode} users={users} assignments={assignments} />
    </AppShell>
  );
}

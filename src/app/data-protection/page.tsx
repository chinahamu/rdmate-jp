import type { Metadata } from 'next';
import { AppShell } from '@/components/app-shell';
import { DataProtectionDashboard } from '@/components/data-protection-dashboard';
import {
  getSampleBackupPlans,
  getSampleInstitutionalIssues,
  getSampleLogicalDeleteRecord,
  getSampleOperationEnv,
  getSampleProjectJsonImportIssues,
  getSampleProjectJsonSnapshot,
  getSampleProtectedMetadataIssues,
  getSampleSafeMetadataIssues,
  getSampleServerValidationResult,
  getSampleSessionConfig,
} from '@/server/sample-data-protection';

export const metadata: Metadata = {
  title: 'データ保護・運用設計 | RDMate JP',
};

export default function DataProtectionPage() {
  const serverValidation = getSampleServerValidationResult();

  return (
    <AppShell>
      <section className="hero">
        <p className="eyebrow">Operations</p>
        <h1>データ保護・運用設計</h1>
        <p>
          RDMate JPが実データ本体を保持しない前提で、個人情報・要配慮情報の警告、サーバ側検証、権限強制、セッション、バックアップ、論理削除を管理します。
        </p>
      </section>

      <DataProtectionDashboard
        riskyIssues={getSampleProtectedMetadataIssues()}
        safeIssues={getSampleSafeMetadataIssues()}
        institutionalIssues={getSampleInstitutionalIssues()}
        backupPlans={getSampleBackupPlans()}
        sessionConfig={getSampleSessionConfig()}
        operationEnv={getSampleOperationEnv()}
        projectSnapshot={getSampleProjectJsonSnapshot()}
        importIssues={getSampleProjectJsonImportIssues()}
        logicalDelete={getSampleLogicalDeleteRecord()}
        serverValidationAllowed={serverValidation.allowed}
      />
    </AppShell>
  );
}

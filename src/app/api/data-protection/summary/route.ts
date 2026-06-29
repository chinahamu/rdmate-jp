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

export function GET() {
  const riskyIssues = getSampleProtectedMetadataIssues();
  const safeIssues = getSampleSafeMetadataIssues();
  const institutionalIssues = getSampleInstitutionalIssues();
  const importIssues = getSampleProjectJsonImportIssues();
  const allIssues = [...riskyIssues, ...safeIssues, ...institutionalIssues, ...importIssues];

  return Response.json({
    schemaVersion: '1.0.0',
    summary: {
      issueCount: allIssues.length,
      errorCount: allIssues.filter((issue) => issue.severity === 'error').length,
      warningCount: allIssues.filter((issue) => issue.severity === 'warning').length,
      serverValidationAllowed: getSampleServerValidationResult().allowed,
    },
    riskyIssues,
    safeIssues,
    institutionalIssues,
    backupPlans: getSampleBackupPlans(),
    sessionConfig: {
      ...getSampleSessionConfig(),
      sessionSecret: '***masked***',
    },
    operationEnv: {
      ...getSampleOperationEnv(),
      sessionSecret: '***masked***',
    },
    projectSnapshot: getSampleProjectJsonSnapshot(),
    importIssues,
    logicalDelete: getSampleLogicalDeleteRecord(),
  });
}

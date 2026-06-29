import { validateProjectJsonImport, type ProjectJsonSnapshot } from '@/domain/data-protection';

export async function POST(request: Request) {
  const snapshot = (await request.json()) as ProjectJsonSnapshot;
  const issues = validateProjectJsonImport(snapshot);

  return Response.json({
    schemaVersion: '1.0.0',
    projectId: snapshot.projectId,
    importable: issues.every((issue) => issue.severity !== 'error'),
    counts: {
      dmpAnswers: snapshot.dmpAnswers?.length ?? 0,
      datasets: snapshot.datasets?.length ?? 0,
      auditLogs: snapshot.auditLogs?.length ?? 0,
    },
    issues,
  });
}

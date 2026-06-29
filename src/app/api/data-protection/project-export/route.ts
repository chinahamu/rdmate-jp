import { getSampleProjectJsonSnapshot } from '@/server/sample-data-protection';

export function GET(request: Request) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get('projectId');
  const snapshot = getSampleProjectJsonSnapshot();

  if (projectId && projectId !== snapshot.projectId) {
    return Response.json(
      {
        error: 'project_not_found',
        message: '指定された研究課題のサンプルエクスポートはありません。',
      },
      { status: 404 },
    );
  }

  return Response.json(snapshot);
}

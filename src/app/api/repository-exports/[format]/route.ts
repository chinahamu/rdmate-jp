import { repositoryExportFormatValues, type RepositoryExportFormat } from '@/domain/repository-export';
import { getSampleJairoCloudCsvForAllDatasets, getSampleRepositoryExport } from '@/server/repository-exports';

type RouteContext = Readonly<{
  params: Promise<{ format: string }>;
}>;

export async function GET(_request: Request, context: RouteContext) {
  const { format } = await context.params;

  if (!isRepositoryExportFormat(format)) {
    return Response.json({ error: `Unsupported repository export format: ${format}` }, { status: 404 });
  }

  if (format === 'jairo_cloud_csv') {
    const content = getSampleJairoCloudCsvForAllDatasets();
    return new Response(content, {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': 'attachment; filename="rdmate-jairo-cloud.csv"',
      },
    });
  }

  const output = getSampleRepositoryExport(format);
  return new Response(output.content, {
    headers: {
      'content-type': output.mimeType,
      'content-disposition': `attachment; filename="${output.fileName}"`,
    },
  });
}

function isRepositoryExportFormat(value: string): value is RepositoryExportFormat {
  return repositoryExportFormatValues.includes(value as RepositoryExportFormat);
}

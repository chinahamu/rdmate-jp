import {
  generateRelatedOutputsCsv,
  generateRelatedOutputsJson,
} from '@/domain/related-output';
import { getSampleRelatedOutputExport } from '@/server/sample-related-outputs';

const contentTypes = {
  json: 'application/json; charset=utf-8',
  csv: 'text/csv; charset=utf-8',
} as const;

type RelatedOutputExportFormat = keyof typeof contentTypes;

type RouteContext = Readonly<{
  params: Promise<{
    format: string;
  }>;
}>;

export async function GET(_request: Request, context: RouteContext) {
  const { format } = await context.params;

  if (!isRelatedOutputExportFormat(format)) {
    return new Response('Unsupported related output export format', { status: 400 });
  }

  const exportData = getSampleRelatedOutputExport();
  const body = format === 'json'
    ? generateRelatedOutputsJson(exportData)
    : generateRelatedOutputsCsv(exportData.outputs);

  return new Response(body, {
    headers: {
      'Content-Type': contentTypes[format],
      'Content-Disposition': `attachment; filename="related-outputs.${format}"`,
    },
  });
}

function isRelatedOutputExportFormat(value: string): value is RelatedOutputExportFormat {
  return value === 'json' || value === 'csv';
}

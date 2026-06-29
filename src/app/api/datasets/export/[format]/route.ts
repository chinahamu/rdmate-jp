import { generateDatasetCsv } from '@/domain/dataset';
import { getSampleDatasets } from '@/server/sample-datasets';

const contentTypes = {
  csv: 'text/csv; charset=utf-8',
  json: 'application/json; charset=utf-8',
} as const;

type DatasetExportFormat = keyof typeof contentTypes;

type RouteContext = Readonly<{
  params: Promise<{
    format: string;
  }>;
}>;

export async function GET(_request: Request, context: RouteContext) {
  const { format } = await context.params;

  if (!isDatasetExportFormat(format)) {
    return new Response('Unsupported dataset export format', { status: 400 });
  }

  const datasets = getSampleDatasets();
  const body = format === 'csv' ? generateDatasetCsv(datasets) : `${JSON.stringify({ schemaVersion: '1.0.0', datasets }, null, 2)}\n`;

  return new Response(body, {
    headers: {
      'Content-Type': contentTypes[format],
      'Content-Disposition': `attachment; filename="dataset-ledger.${format}"`,
    },
  });
}

function isDatasetExportFormat(value: string): value is DatasetExportFormat {
  return value === 'csv' || value === 'json';
}

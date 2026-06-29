import { previewDatasetCsvImport } from '@/domain/import-export';
import { getSampleDatasets } from '@/server/sample-datasets';

export async function POST(request: Request) {
  const contentType = request.headers.get('content-type') ?? '';
  const csvContent = contentType.includes('application/json')
    ? String((await request.json()).csv ?? '')
    : await request.text();

  return Response.json(previewDatasetCsvImport(csvContent, getSampleDatasets()));
}

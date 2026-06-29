import { generateDatasetCsv } from '@/domain/dataset';
import { getSampleDatasets } from '@/server/sample-datasets';

export function GET() {
  const csv = generateDatasetCsv(getSampleDatasets());
  const headers = new Headers({
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': 'attachment; filename="dataset-ledger.csv"',
  });

  return new Response(csv, { headers });
}

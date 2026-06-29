import {
  generateManifestCsv,
  generateManifestJson,
  getManifestFileName,
} from '@/domain/storage-reference';
import { getSampleDatasets } from '@/server/sample-datasets';
import { getSampleManifestEntries } from '@/server/sample-storage-reference';

const contentTypes = {
  csv: 'text/csv; charset=utf-8',
  json: 'application/json; charset=utf-8',
} as const;

type ManifestFormat = keyof typeof contentTypes;

type RouteContext = Readonly<{
  params: Promise<{
    format: string;
  }>;
}>;

export async function GET(request: Request, context: RouteContext) {
  const { format } = await context.params;

  if (!isManifestFormat(format)) {
    return new Response('Unsupported manifest format', { status: 400 });
  }

  const datasets = getSampleDatasets();
  const manifestEntries = getSampleManifestEntries();
  const url = new URL(request.url);
  const datasetId = url.searchParams.get('datasetId') ?? datasets[0]?.id;
  const dataset = datasets.find((candidate) => candidate.id === datasetId) ?? datasets[0];

  if (!dataset) {
    return new Response('Dataset not found', { status: 404 });
  }

  const entries =
    format === 'csv'
      ? manifestEntries
      : manifestEntries.filter((entry) => entry.datasetId === dataset.id);
  const body =
    format === 'csv'
      ? generateManifestCsv(entries)
      : generateManifestJson({ datasetId: dataset.id, entries });
  const fileName = format === 'csv' ? 'manifest.csv' : getManifestFileName(dataset, 'json');
  const headers = new Headers({
    'Content-Type': contentTypes[format],
    'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
  });

  return new Response(body, { headers });
}

function isManifestFormat(value: string): value is ManifestFormat {
  return value === 'csv' || value === 'json';
}

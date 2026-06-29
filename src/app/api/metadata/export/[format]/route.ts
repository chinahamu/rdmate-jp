import {
  toDataCiteMetadata,
  toDublinCoreMetadata,
} from '@/domain/metadata';
import { getSampleDatasets } from '@/server/sample-datasets';
import { getSampleDatasetMetadata } from '@/server/sample-metadata';

const contentTypes = {
  datacite: 'application/json; charset=utf-8',
  'dublin-core': 'application/json; charset=utf-8',
} as const;

type MetadataExportFormat = keyof typeof contentTypes;

type RouteContext = Readonly<{
  params: Promise<{
    format: string;
  }>;
}>;

export async function GET(_request: Request, context: RouteContext) {
  const { format } = await context.params;

  if (!isMetadataExportFormat(format)) {
    return new Response('Unsupported metadata export format', { status: 400 });
  }

  const datasets = getSampleDatasets();
  const metadataList = getSampleDatasetMetadata();
  const records =
    format === 'datacite'
      ? metadataList.flatMap((metadata) => {
          const dataset = datasets.find((candidate) => candidate.id === metadata.datasetId);
          if (!dataset) return [];
          return [toDataCiteMetadata(metadata, dataset)];
        })
      : metadataList.flatMap((metadata) => {
          const dataset = datasets.find((candidate) => candidate.id === metadata.datasetId);
          if (!dataset) return [];
          return [toDublinCoreMetadata(metadata, dataset)];
        });
  const fileName = format === 'datacite' ? 'metadata-datacite.json' : 'metadata-dublin-core.json';

  return new Response(`${JSON.stringify(records, null, 2)}\n`, {
    headers: {
      'Content-Type': contentTypes[format],
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  });
}

function isMetadataExportFormat(value: string): value is MetadataExportFormat {
  return value === 'datacite' || value === 'dublin-core';
}

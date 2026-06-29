import {
  generateDmpCsv,
  generateDmpJson,
  generateDmpMarkdown,
  getDmpExportFileName,
} from '@/domain/dmp-export';
import { generateDmpDocxBuffer } from '@/server/dmp-docx';
import { getSampleDmpExportContext } from '@/server/dmp-export-sample';

const contentTypes = {
  md: 'text/markdown; charset=utf-8',
  json: 'application/json; charset=utf-8',
  csv: 'text/csv; charset=utf-8',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
} as const;

type ExportFormat = keyof typeof contentTypes;

type RouteContext = Readonly<{
  params: Promise<{
    format: string;
  }>;
}>;

export async function GET(_request: Request, context: RouteContext) {
  const { format } = await context.params;

  if (!isExportFormat(format)) {
    return new Response('Unsupported export format', { status: 400 });
  }

  const exportContext = getSampleDmpExportContext(new Date().toISOString());
  const fileName = getDmpExportFileName(exportContext, format);
  const headers = new Headers({
    'Content-Type': contentTypes[format],
    'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
  });

  if (format === 'docx') {
    const buffer = await generateDmpDocxBuffer(exportContext);
    return new Response(new Uint8Array(buffer), { headers });
  }

  const body =
    format === 'md'
      ? generateDmpMarkdown(exportContext)
      : format === 'json'
        ? generateDmpJson(exportContext)
        : generateDmpCsv(exportContext);

  return new Response(body, { headers });
}

function isExportFormat(value: string): value is ExportFormat {
  return value === 'md' || value === 'json' || value === 'csv' || value === 'docx';
}

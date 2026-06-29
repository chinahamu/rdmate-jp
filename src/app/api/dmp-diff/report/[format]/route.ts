import {
  generateDmpDiffCsv,
  generateDmpDiffMarkdown,
} from '@/domain/dmp-diff';
import { getSampleDmpDiffReport } from '@/server/sample-dmp-diff';

const contentTypes = {
  markdown: 'text/markdown; charset=utf-8',
  csv: 'text/csv; charset=utf-8',
  json: 'application/json; charset=utf-8',
} as const;

type DmpDiffReportFormat = keyof typeof contentTypes;

type RouteContext = Readonly<{
  params: Promise<{
    format: string;
  }>;
}>;

export async function GET(_request: Request, context: RouteContext) {
  const { format } = await context.params;

  if (!isDmpDiffReportFormat(format)) {
    return new Response('Unsupported DMP diff report format', { status: 400 });
  }

  const report = getSampleDmpDiffReport();
  const body = format === 'markdown'
    ? generateDmpDiffMarkdown(report)
    : format === 'csv'
      ? generateDmpDiffCsv(report)
      : `${JSON.stringify(report, null, 2)}\n`;
  const extension = format === 'markdown' ? 'md' : format;

  return new Response(body, {
    headers: {
      'Content-Type': contentTypes[format],
      'Content-Disposition': `attachment; filename="dmp-diff-report.${extension}"`,
    },
  });
}

function isDmpDiffReportFormat(value: string): value is DmpDiffReportFormat {
  return value === 'markdown' || value === 'csv' || value === 'json';
}

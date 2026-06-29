import { getSampleCompleteJson, getSampleRepositoryCsvExport } from '@/server/sample-import-export';

type RouteContext = Readonly<{
  params: Promise<{
    format: string;
  }>;
}>;

export async function GET(_request: Request, context: RouteContext) {
  const { format } = await context.params;

  if (format === 'complete-json') {
    return new Response(getSampleCompleteJson(), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': 'attachment; filename="rdmate-complete-export.json"',
      },
    });
  }

  if (format === 'repository-csv') {
    return new Response(getSampleRepositoryCsvExport().csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="repository-registration.csv"',
      },
    });
  }

  return new Response('Unsupported import/export format', { status: 400 });
}

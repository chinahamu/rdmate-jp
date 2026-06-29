import { createSampleFunderCheckMarkdownReport } from '@/server/funder-check-rules';

export async function GET() {
  return new Response(createSampleFunderCheckMarkdownReport(), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': 'attachment; filename="funder-check-report.md"',
    },
  });
}

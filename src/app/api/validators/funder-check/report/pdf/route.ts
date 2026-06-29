import { createSampleFunderCheckPdfReport } from '@/server/funder-check-rules';

export async function GET() {
  return new Response(createSampleFunderCheckPdfReport(), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="funder-check-report.pdf"',
    },
  });
}

import { generateDatasetImportTemplateCsv } from '@/domain/import-export';

export function GET() {
  return new Response(generateDatasetImportTemplateCsv(), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="dataset-import-template.csv"',
    },
  });
}

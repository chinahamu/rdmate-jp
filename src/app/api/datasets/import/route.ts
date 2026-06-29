import { parseDatasetCsv } from '@/domain/dataset';

export async function POST(request: Request) {
  const csv = await readCsvPayload(request);
  const result = parseDatasetCsv(csv);

  return Response.json(result, {
    status: result.errors.length > 0 ? 422 : 200,
  });
}

async function readCsvPayload(request: Request): Promise<string> {
  const contentType = request.headers.get('content-type') ?? '';

  if (
    contentType.includes('application/x-www-form-urlencoded') ||
    contentType.includes('multipart/form-data')
  ) {
    const formData = await request.formData();
    return String(formData.get('csv') ?? '');
  }

  const body = await request.text();

  return body.startsWith('csv=') ? body.slice('csv='.length) : body;
}

import { apiEnvelope, listApiDatasets } from '@/server/api-resources';

export function GET() {
  const data = listApiDatasets();
  return Response.json(apiEnvelope(data));
}

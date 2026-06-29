import { apiEnvelope, listApiExports } from '@/server/api-resources';

export function GET() {
  return Response.json(apiEnvelope(listApiExports()));
}

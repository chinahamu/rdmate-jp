import { apiEnvelope, listApiDmps } from '@/server/api-resources';

export function GET() {
  return Response.json(apiEnvelope(listApiDmps()));
}

import { apiEnvelope, listApiValidators } from '@/server/api-resources';

export function GET() {
  return Response.json(apiEnvelope(listApiValidators()));
}

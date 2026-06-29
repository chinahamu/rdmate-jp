import { apiEnvelope, listApiTemplates } from '@/server/api-resources';

export function GET() {
  return Response.json(apiEnvelope(listApiTemplates()));
}

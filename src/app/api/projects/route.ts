import { apiEnvelope, listApiProjects } from '@/server/api-resources';

export async function GET() {
  return Response.json(apiEnvelope(listApiProjects()));
}

import { getSampleExternalIdentifierRegistry } from '@/server/external-identifiers';

export async function GET() {
  return Response.json(getSampleExternalIdentifierRegistry());
}

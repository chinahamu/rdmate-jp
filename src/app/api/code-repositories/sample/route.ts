import { getSampleCodeRepositoryDashboard } from '@/server/code-repository-integration';

export async function GET() {
  return Response.json(getSampleCodeRepositoryDashboard());
}

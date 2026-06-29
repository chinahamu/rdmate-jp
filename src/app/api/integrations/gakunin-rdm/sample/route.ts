import { getSampleGakuninRdmDashboard } from '@/server/gakunin-rdm';

export async function GET() {
  return Response.json(await getSampleGakuninRdmDashboard());
}

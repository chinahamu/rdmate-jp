import { assessPublicationDecisions, summarizePublicationDecisions } from '@/domain/publication-license';
import { getSamplePublicationDecisions } from '@/server/sample-publication-license';

export function GET() {
  const decisions = getSamplePublicationDecisions();
  const issues = assessPublicationDecisions(decisions);
  const summary = summarizePublicationDecisions(decisions);

  return Response.json({
    schemaVersion: '1.0.0',
    summary: {
      total: summary.total,
      countsByStatus: summary.countsByStatus,
      blocked: summary.blocked,
      needsReview: summary.needsReview,
    },
    decisions,
    issues,
  });
}

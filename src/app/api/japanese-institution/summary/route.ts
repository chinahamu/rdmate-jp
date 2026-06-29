import {
  createJapaneseInstitutionDmpHints,
  getKakenhiInputHints,
  normalizeKakenhiProjectNumber,
  summarizeJapaneseInstitutionSupport,
  toJapaneseInstitutionProfile,
} from '@/domain/japanese-institution';
import { getSampleResearchProject } from '@/server/sample-project';

export function GET() {
  const project = getSampleResearchProject();
  const profiles = project.members.map(toJapaneseInstitutionProfile);
  const summary = summarizeJapaneseInstitutionSupport(project);

  return Response.json({
    schemaVersion: '1.0.0',
    project: {
      id: project.id,
      title: project.title,
      institutionLocalProjectCode: project.institutionLocalProjectCode,
      preferredDmpLanguage: project.preferredDmpLanguage,
    },
    summary,
    profiles,
    kakenhi: project.funding
      .filter((funding) => funding.agencyType === 'kakenhi')
      .map((funding) => ({
        fundingId: funding.id,
        agencyName: funding.agencyName,
        programName: funding.programName,
        projectNumber: funding.projectNumber,
        normalizedProjectNumber: funding.projectNumber ? normalizeKakenhiProjectNumber(funding.projectNumber) : undefined,
        hints: getKakenhiInputHints(funding.projectNumber),
      })),
    dmpExportHints: createJapaneseInstitutionDmpHints(project),
  });
}

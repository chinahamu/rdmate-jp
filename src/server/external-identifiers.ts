import {
  createDoiExternalIdentifier,
  createInstitutionExternalIdentifier,
  createInstitutionRorIdentifier,
  getExternalIdentifierResolveUrl,
  toDataCiteCreatorIdentifierPayload,
  type DataCiteCreatorIdentifierPayload,
  type ExternalIdentifier,
  type InstitutionIdentifier,
} from '../domain/external-identifier';
import { getResearchMemberExternalIdentifiers } from '../domain/research-member';
import { getSampleDatasets } from './sample-datasets';
import { getSampleResearchProject } from './sample-project';

export type ExternalIdentifierRegistrySample = Readonly<{
  identifiers: ExternalIdentifier[];
  institutions: InstitutionIdentifier[];
  dataCiteCreators: DataCiteCreatorIdentifierPayload[];
}>;

export function getSampleExternalIdentifierRegistry(): ExternalIdentifierRegistrySample {
  const project = getSampleResearchProject();
  const datasets = getSampleDatasets();
  const institutionMap = new Map<string, InstitutionIdentifier>();

  for (const member of project.members) {
    if (!member.affiliationRorId) continue;
    institutionMap.set(
      member.affiliation,
      createInstitutionRorIdentifier({
        id: slugifyInstitution(member.affiliation),
        name: member.affiliation,
        rorId: member.affiliationRorId,
        aliases: [member.affiliation.replace(/\s+/g, '')],
        countryCode: 'JP',
      }),
    );
  }

  const institutions = [...institutionMap.values()];
  const identifiers = [
    ...project.members.flatMap((member) => getResearchMemberExternalIdentifiers(member)),
    ...institutions.map((institution) => createInstitutionExternalIdentifier(institution)),
    ...datasets.flatMap((dataset) =>
      dataset.doi
        ? [
            createDoiExternalIdentifier({
              entityType: dataset.dataType === 'source_code' ? 'software' : 'dataset',
              entityId: dataset.id,
              label: dataset.name,
              doi: dataset.doi,
            }),
          ]
        : [],
    ),
    createDoiExternalIdentifier({
      entityType: 'paper',
      entityId: 'paper-rdm-workflow-2026',
      label: 'RDM workflow paper',
      doi: 'https://doi.org/10.1234/rdm.workflow.2026',
    }),
  ];

  return {
    identifiers,
    institutions,
    dataCiteCreators: project.members.map((member) =>
      toDataCiteCreatorIdentifierPayload({
        name: member.name,
        orcid: member.orcid,
        affiliation: member.affiliation,
        affiliationRorId: member.affiliationRorId,
      }),
    ),
  };
}

export function getExternalIdentifierSummaryRows() {
  return getSampleExternalIdentifierRegistry().identifiers.map((identifier) => ({
    id: identifier.id,
    type: identifier.type,
    entityType: identifier.entityType,
    label: identifier.label ?? identifier.entityId,
    value: identifier.value,
    resolveUrl: identifier.resolveUrl ?? getExternalIdentifierResolveUrl(identifier.type, identifier.value),
    connectionStatus: identifier.connection.status,
  }));
}

function slugifyInstitution(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9一-龠ぁ-んァ-ヶー]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'institution';
}

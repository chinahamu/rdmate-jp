import {
  createGitHubActionsWorkflowYaml,
  createRdmateCliMetadataJson,
  createReproducibilityPrComment,
  evaluateReproducibility,
  type CodeRepository,
  type ReproducibilityCheckReport,
} from '../domain/code-repository';
import { getSampleResearchProject } from './sample-project';

export type CodeRepositoryIntegrationDashboard = Readonly<{
  repositories: CodeRepository[];
  reports: ReproducibilityCheckReport[];
  cliMetadataJson: ReturnType<typeof createRdmateCliMetadataJson>;
  githubActionsWorkflow: string;
  prComments: string[];
}>;

export function getSampleCodeRepositoryDashboard(): CodeRepositoryIntegrationDashboard {
  const project = getSampleResearchProject();
  const repositories = project.codeRepositories;
  const reports = repositories.map((repository) => evaluateReproducibility(repository));

  return {
    repositories,
    reports,
    cliMetadataJson: createRdmateCliMetadataJson({
      projectId: project.id,
      repositories,
      reports,
    }),
    githubActionsWorkflow: createGitHubActionsWorkflowYaml(),
    prComments: repositories.map((repository) => {
      const report = reports.find((candidate) => candidate.repositoryId === repository.id) ?? evaluateReproducibility(repository);
      return createReproducibilityPrComment(report, repository);
    }),
  };
}

export function getReproducibilityStatusLabel(status: ReproducibilityCheckReport['status']): string {
  const labels: Record<ReproducibilityCheckReport['status'], string> = {
    passed: '合格',
    warning: '要確認',
    failed: '要対応',
  };

  return labels[status];
}

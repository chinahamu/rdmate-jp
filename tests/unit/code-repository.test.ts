import { describe, expect, it } from 'vitest';
import { createDataset } from '../../src/domain/dataset';
import {
  createCodeRepositoryFromUrl,
  createDatasetRepositoryRelation,
  createGitHubActionsWorkflowYaml,
  createPaperRepositoryRelation,
  createRdmateCliMetadataJson,
  createReproducibilityPrComment,
  createSoftwareRepositoryRelation,
  evaluateReproducibility,
  inferRepositoryProvider,
} from '../../src/domain/code-repository';
import type { RelatedPaper, RelatedSoftware } from '../../src/domain/metadata';
import { createResearchProject, getProjectCodeRepositories } from '../../src/domain/research-project';
import { getSampleCodeRepositoryDashboard } from '../../src/server/code-repository-integration';
import { getSampleResearchProject } from '../../src/server/sample-project';

describe('code repository integration domain', () => {
  it('creates a GitHub repository link with repository metadata and relationships', () => {
    const dataset = createDataset({
      id: 'dataset-analysis-code',
      projectId: 'project-1',
      name: '回答集計スクリプト',
      description: '集計コード。',
      dataType: 'source_code',
      generatedDate: '2026-06-12',
      version: '1.0.0',
      createdBy: '山田 太郎',
      responsibleMemberId: 'member-1',
      storageLocations: [],
    });
    const paper: RelatedPaper = { id: 'paper-1', title: 'RDM workflow paper', paperType: 'journal_article', relation: 'IsSupplementTo' };
    const software: RelatedSoftware = { id: 'software-1', name: 'RDMate JP', softwareType: 'source_code', relation: 'IsSourceOf' };
    const repository = createCodeRepositoryFromUrl({
      id: 'repo-1',
      name: 'rdmate-jp',
      url: 'https://github.com/chinahamu/rdmate-jp',
      license: 'MIT',
      defaultBranch: 'main',
      releaseTags: ['v0.1.0'],
      commitHash: '455a3463a18a0be873766e73fbf8a60cb27156cd',
      relations: [
        createDatasetRepositoryRelation({ id: 'relation-dataset', dataset }),
        createPaperRepositoryRelation({ id: 'relation-paper', paper }),
        createSoftwareRepositoryRelation({ id: 'relation-software', software }),
      ],
    });

    expect(repository.provider).toBe('github');
    expect(repository.license).toBe('MIT');
    expect(repository.defaultBranch).toBe('main');
    expect(repository.releaseTags).toEqual(['v0.1.0']);
    expect(repository.relations.map((relation) => relation.datasetId ?? relation.paperId ?? relation.softwareId)).toEqual([
      'dataset-analysis-code',
      'paper-1',
      'software-1',
    ]);
  });

  it('infers GitHub and GitLab providers and validates provider URLs', () => {
    expect(inferRepositoryProvider('https://github.com/chinahamu/rdmate-jp')).toBe('github');
    expect(inferRepositoryProvider('https://gitlab.com/example/project')).toBe('gitlab');
    expect(() =>
      createCodeRepositoryFromUrl({
        id: 'bad-github',
        provider: 'github',
        name: 'bad',
        url: 'https://example.com/project',
      }),
    ).toThrow('github.com');
  });

  it('evaluates reproducibility checks for README, LICENSE, environment, data instructions, and fixed version', () => {
    const repository = createCodeRepositoryFromUrl({
      id: 'repo-1',
      name: 'rdmate-jp',
      url: 'https://github.com/chinahamu/rdmate-jp',
      license: 'MIT',
      defaultBranch: 'main',
      releaseTags: ['v0.1.0'],
      filePresence: {
        readme: true,
        license: true,
        requirements: false,
        environment: true,
        dockerfile: false,
        dataAcquisitionInstructions: true,
      },
    });
    const report = evaluateReproducibility(repository);

    expect(report.score).toBe(100);
    expect(report.status).toBe('passed');
    expect(report.items.map((item) => item.id)).toEqual(['readme', 'license', 'environment', 'data-acquisition', 'fixed-version']);
  });

  it('generates RDMate CLI metadata JSON, GitHub Actions workflow, and PR comment body', () => {
    const repository = createCodeRepositoryFromUrl({
      id: 'repo-1',
      name: 'rdmate-jp',
      url: 'https://github.com/chinahamu/rdmate-jp',
      license: 'MIT',
      defaultBranch: 'main',
      releaseTags: ['v0.1.0'],
      filePresence: { readme: true, license: true, environment: true, dataAcquisitionInstructions: true },
    });
    const report = evaluateReproducibility(repository);
    const cliJson = createRdmateCliMetadataJson({ projectId: 'project-1', repositories: [repository], reports: [report] });
    const workflow = createGitHubActionsWorkflowYaml();
    const comment = createReproducibilityPrComment(report, repository);

    expect(cliJson.generatedBy).toBe('rdmate validate --format json');
    expect(cliJson.repositories[0]?.url).toBe('https://github.com/chinahamu/rdmate-jp');
    expect(workflow).toContain('pull_request');
    expect(workflow).toContain('rdmate validate');
    expect(comment).toContain('RDMate reproducibility check');
    expect(comment).toContain('| README有無 |');
  });

  it('attaches code repositories to research projects and exposes sample dashboard', () => {
    const sample = getSampleResearchProject();
    const minimalProject = createResearchProject({
      id: 'project-1',
      title: '研究課題',
      summary: '概要',
      field: '情報学',
      startDate: '2026-04-01',
      expectedEndDate: '2027-03-31',
      members: sample.members,
      funding: [],
      codeRepositories: sample.codeRepositories,
      dataManagerMemberId: sample.dataManagerMemberId,
    });
    const dashboard = getSampleCodeRepositoryDashboard();

    expect(getProjectCodeRepositories(minimalProject)).toHaveLength(1);
    expect(sample.codeRepositories[0]?.relations.some((relation) => relation.datasetId === 'dataset-analysis-code')).toBe(true);
    expect(dashboard.cliMetadataJson.repositories[0]?.releaseTags).toContain('v0.1.0');
    expect(dashboard.prComments[0]).toContain('Score:');
  });
});

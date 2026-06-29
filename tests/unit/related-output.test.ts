import { describe, expect, it } from 'vitest';
import {
  createRelatedOutput,
  createRelatedOutputExport,
  generateRelatedOutputsCsv,
  generateRelatedOutputsJson,
  groupRelatedOutputsByDataset,
  summarizeRelatedOutputs,
  validateRelatedOutputs,
} from '../../src/domain/related-output';
import { getSampleDatasets } from '../../src/server/sample-datasets';
import { getSampleRelatedOutputs } from '../../src/server/sample-related-outputs';
import { getSampleResearchProject } from '../../src/server/sample-project';

describe('related output domain', () => {
  it('creates and groups paper, software, and protocol outputs', () => {
    const outputs = getSampleRelatedOutputs();
    const summary = summarizeRelatedOutputs(outputs);
    const groups = groupRelatedOutputsByDataset(outputs);

    expect(summary.total).toBe(5);
    expect(summary.paperCount).toBe(1);
    expect(summary.presentationCount).toBe(1);
    expect(summary.softwareCount).toBe(2);
    expect(summary.protocolCount).toBe(1);
    expect(groups['dataset-user-test-raw']).toHaveLength(3);
  });

  it('validates identifiers, repository metadata, and protocol responsibility', () => {
    const project = getSampleResearchProject();
    const datasets = getSampleDatasets();
    const invalidOutputs = [
      createRelatedOutput({
        id: 'invalid-paper',
        datasetId: 'dataset-user-test-raw',
        kind: 'paper',
        relation: 'supplements_dataset',
        title: 'No identifier paper',
      }),
      createRelatedOutput({
        id: 'invalid-software',
        datasetId: 'dataset-user-test-raw',
        kind: 'software',
        relation: 'analyzes_dataset',
        title: 'No repository code',
      }),
      createRelatedOutput({
        id: 'invalid-protocol',
        datasetId: 'unknown-dataset',
        kind: 'protocol',
        relation: 'documents_protocol',
        title: 'No owner protocol',
      }),
    ];
    const issues = validateRelatedOutputs(invalidOutputs, datasets, project);

    expect(issues.some((issue) => issue.outputId === 'invalid-paper' && issue.field === 'identifier')).toBe(true);
    expect(issues.some((issue) => issue.outputId === 'invalid-software' && issue.field === 'repositoryUrl')).toBe(true);
    expect(issues.some((issue) => issue.outputId === 'invalid-protocol' && issue.field === 'datasetId')).toBe(true);
    expect(issues.some((issue) => issue.outputId === 'invalid-protocol' && issue.field === 'responsibleMemberId')).toBe(true);
  });

  it('rejects relation types that do not match the output kind', () => {
    const project = getSampleResearchProject();
    const datasets = getSampleDatasets();
    const outputs = [
      createRelatedOutput({
        id: 'invalid-relation',
        datasetId: 'dataset-user-test-raw',
        kind: 'software',
        relation: 'supplements_dataset',
        title: 'Wrong relation code',
        repositoryUrl: 'https://github.com/chinahamu/rdmate-jp',
        releaseTag: 'v1.0.0',
        runtimeEnvironment: 'Node.js',
      }),
    ];

    expect(validateRelatedOutputs(outputs, datasets, project).some((issue) => issue.field === 'relation')).toBe(true);
  });

  it('exports related outputs as JSON and CSV', () => {
    const project = getSampleResearchProject();
    const datasets = getSampleDatasets();
    const outputs = getSampleRelatedOutputs();
    const exportData = createRelatedOutputExport(outputs, datasets, project);
    const json = generateRelatedOutputsJson(exportData);
    const csv = generateRelatedOutputsCsv(outputs);

    expect(exportData.schemaVersion).toBe('1.0.0');
    expect(json).toContain('schemaVersion');
    expect(json).toContain('outputs');
    expect(csv).toContain('dataset_id,kind,relation');
    expect(csv).toContain('change_history_count');
  });
});

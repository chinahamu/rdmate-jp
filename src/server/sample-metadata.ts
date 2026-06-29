import {
  applyProjectMetadataAutofill,
  createDatasetMetadata,
  type DatasetMetadata,
} from '../domain/metadata';
import { getSampleDatasets } from './sample-datasets';
import { getSampleResearchProject } from './sample-project';

export function getSampleDatasetMetadata(): DatasetMetadata[] {
  const project = getSampleResearchProject();
  const datasets = getSampleDatasets();

  return datasets.map((dataset) => {
    const autofilled = applyProjectMetadataAutofill(dataset, project);

    if (dataset.id === 'dataset-user-test-raw') {
      return createDatasetMetadata({
        ...autofilled,
        keywords: ['DMP', '研究データ管理', 'ユーザーテスト', 'survey_data'],
        spatialCoverage: {
          placeName: '日本',
        },
        relatedPapers: [
          {
            id: 'paper-rdm-workflow',
            title: 'Research data management workflow for Japanese laboratories',
            paperType: 'conference_paper',
            doi: '10.1234/rdm.workflow.2026',
            publicationYear: '2026',
            relation: 'isSupplementTo',
          },
        ],
      });
    }

    if (dataset.id === 'dataset-analysis-code') {
      return createDatasetMetadata({
        ...autofilled,
        keywords: ['RDMate JP', 'TypeScript', '解析コード', 'source_code'],
        relatedSoftware: [
          {
            id: 'software-rdmate-jp',
            name: 'RDMate JP',
            softwareType: 'source_code',
            url: 'https://github.com/chinahamu/rdmate-jp',
            version: dataset.version,
            license: 'MIT',
            runtimeEnvironment: 'Node.js / Next.js',
            relation: 'isSourceOf',
          },
        ],
      });
    }

    return autofilled;
  });
}

export function getSampleMetadataForDataset(datasetId: string): DatasetMetadata | undefined {
  return getSampleDatasetMetadata().find((metadata) => metadata.datasetId === datasetId);
}

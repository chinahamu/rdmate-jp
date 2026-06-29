import { derivePublicationDecision, type PublicationDecision } from '../domain/publication-license';
import { getSampleDatasets } from './sample-datasets';

export function getSamplePublicationDecisions(): PublicationDecision[] {
  const datasets = getSampleDatasets();

  return datasets.map((dataset) => {
    if (dataset.id === 'dataset-user-test-raw') {
      return derivePublicationDecision(dataset, {
        containsPersonalInformation: true,
        hasCollaborativeAgreement: true,
        personalInformationHandling: '共有対象は匿名化済み集計データに限定する。',
        collaborativeAgreementNote: '共同研究契約に基づき、研究代表者の承認後に申請制で共有する。',
      });
    }

    if (dataset.id === 'dataset-ui-screenshots') {
      return derivePublicationDecision(dataset, {
        publicationStatus: 'closed',
        containsPersonalInformation: false,
        hasPatentPlan: true,
      });
    }

    return derivePublicationDecision(dataset, {
      hasPatentPlan: true,
      patentPublicationNote: 'ソースコード部分は特許対象外。論文公開後にMITで公開予定。',
    });
  });
}

export function getSamplePublicationDecision(datasetId: string): PublicationDecision | undefined {
  return getSamplePublicationDecisions().find((decision) => decision.datasetId === datasetId);
}

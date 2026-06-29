import { applyProjectAutofill } from '../domain/dmp-answer';
import {
  createDmpDiffReport,
  type DmpDiffReport,
} from '../domain/dmp-diff';
import type { DmpExportContext } from '../domain/dmp-export';
import { getSampleDatasets } from './sample-datasets';
import { getSampleResearchProject } from './sample-project';
import { getDmpTemplateById } from './template-registry';

export function getSampleDmpDiffContext(generatedAt = '2026-06-29T00:00:00.000Z'): DmpExportContext {
  const project = getSampleResearchProject();
  const template = getDmpTemplateById('generic-jp-v1');

  if (!template) {
    throw new Error('DMP template not found.');
  }

  return {
    project,
    template,
    answers: {
      ...applyProjectAutofill(template, project),
      'data_description.data_types': '調査データ、ソースコードを生成・収集する。UI評価資料はDMP更新時に追記予定。',
      'storage_and_sharing.storage_location': '大学提供クラウド、GitHub',
      'storage_and_sharing.sharing_policy': '制限付き公開',
      'storage_and_sharing.retention_period': '研究終了後5年間',
      'responsibility.data_manager': '佐藤 花子',
    },
    generatedAt,
  };
}

export function getSampleDmpDiffReport(generatedAt = '2026-06-29T00:00:00.000Z'): DmpDiffReport {
  return createDmpDiffReport(getSampleDmpDiffContext(generatedAt), getSampleDatasets(), generatedAt);
}

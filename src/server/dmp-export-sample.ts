import { applyProjectAutofill } from '../domain/dmp-answer';
import type { DmpExportContext } from '../domain/dmp-export';
import { getSampleResearchProject } from './sample-project';
import { getDmpTemplateById } from './template-registry';

export function getSampleDmpExportContext(generatedAt = '2026-06-29T00:00:00.000Z'): DmpExportContext {
  const project = getSampleResearchProject();
  const template = getDmpTemplateById('generic-jp-v1');

  if (!template) {
    throw new Error('DMP template not found.');
  }

  return {
    project,
    template,
    answers: applyProjectAutofill(template, project),
    generatedAt,
  };
}

import { describe, expect, it } from 'vitest';
import genericTemplateJson from '../../templates/dmp/generic-jp-v1.json';
import { validateDmpTemplate } from '../../src/domain/dmp-template';
import {
  applyProjectAutofill,
  dmpCandidateLists,
  dmpLabelDefinitions,
  generateDmpFormSections,
  getExamplePhrasesForQuestion,
  getFieldId,
  getSectionAnswers,
  validateDmpAnswers,
} from '../../src/domain/dmp-answer';
import { getSampleResearchProject } from '../../src/server/sample-project';

describe('DMP answer and generated form domain', () => {
  const template = validateDmpTemplate(genericTemplateJson);

  it('generates section forms from a template definition', () => {
    const sections = generateDmpFormSections(template, {
      [getFieldId('data_description', 'data_types')]: '観測データと分析コード',
    });

    expect(sections).toHaveLength(3);
    expect(sections[0]?.fields.map((field) => field.type)).toEqual(['textarea', 'text']);
    expect(sections[0]?.completedRequiredCount).toBe(1);
    expect(sections[0]?.requiredCount).toBe(2);
  });

  it('extracts section-level answers for saving', () => {
    const sections = generateDmpFormSections(template);
    const answers = {
      [getFieldId('data_description', 'data_types')]: '実験データ',
      [getFieldId('data_description', 'data_formats')]: 'CSV',
      [getFieldId('storage_and_sharing', 'storage_location')]: '機関リポジトリ',
    };

    expect(getSectionAnswers(sections[0]!, answers)).toEqual({
      [getFieldId('data_description', 'data_types')]: '実験データ',
      [getFieldId('data_description', 'data_formats')]: 'CSV',
    });
  });

  it('autofills answers from research project metadata', () => {
    const answers = applyProjectAutofill(template, getSampleResearchProject());

    expect(answers[getFieldId('storage_and_sharing', 'storage_location')]).toBe('機関リポジトリ');
    expect(answers[getFieldId('responsibility', 'data_manager')]).toBe('佐藤 花子');
  });

  it('validates required fields and conditional non-public reason', () => {
    const issues = validateDmpAnswers(template, {
      [getFieldId('data_description', 'data_types')]: '',
      [getFieldId('data_description', 'data_formats')]: 'CSV',
      [getFieldId('storage_and_sharing', 'storage_location')]: '機関リポジトリ',
      [getFieldId('storage_and_sharing', 'sharing_policy')]: '非公開',
      [getFieldId('storage_and_sharing', 'retention_period')]: '研究終了後5年間',
      [getFieldId('responsibility', 'data_manager')]: '佐藤 花子',
    });

    expect(issues.map((issue) => issue.message)).toContain('生成・収集するデータの種類は必須です。');
    expect(issues.map((issue) => issue.message)).toContain('非公開を選択した場合は、非公開理由の入力が必要です。');
  });

  it('provides helper examples, candidate lists, and label definitions', () => {
    expect(getExamplePhrasesForQuestion('backup_policy')).toHaveLength(1);
    expect(dmpCandidateLists.storageLocations).toContain('機関リポジトリ');
    expect(dmpLabelDefinitions.en.saveSection).toBe('Save section');
  });
});

import { describe, expect, it } from 'vitest';
import genericTemplateV1 from '../../templates/dmp/generic-jp-v1.json';
import genericTemplateV2 from '../../templates/dmp/generic-jp-v2.json';
import nihStyleTemplate from '../../templates/dmp/nih-style-v1.json';
import universityBasicTemplate from '../../templates/dmp/university-basic-v1.json';
import {
  countTemplateQuestions,
  findRequiredTemplateQuestions,
  migrateTemplateAnswers,
  summarizeDmpTemplate,
  validateDmpTemplate,
  validateDmpTemplateMigrationPlan,
} from '../../src/domain/dmp-template';

describe('DMP template domain', () => {
  it('validates bundled template metadata including locale and registry type', () => {
    const templates = [genericTemplateV1, genericTemplateV2, universityBasicTemplate, nihStyleTemplate].map((template) =>
      validateDmpTemplate(template),
    );

    expect(templates.map((template) => template.id)).toEqual([
      'generic-jp-v1',
      'generic-jp-v2',
      'university-basic-v1',
      'nih-style-v1',
    ]);
    expect(templates.map((template) => template.locale)).toEqual(['ja', 'ja', 'ja', 'ja-en']);
    expect(templates.every((template) => template.maintainer === 'RDMate JP project')).toBe(true);
  });

  it('summarizes template metadata for list UI', () => {
    const template = validateDmpTemplate(genericTemplateV2);
    const summary = summarizeDmpTemplate(template);

    expect(summary.id).toBe('generic-jp-v2');
    expect(summary.templateType).toBe('generic');
    expect(summary.templateTypeLabel).toBe('汎用DMP');
    expect(summary.sectionCount).toBe(3);
    expect(summary.questionCount).toBe(countTemplateQuestions(template));
    expect(summary.targetFundingAgencyTypes).toContain('kakenhi');
    expect(summary.lastReviewedAt).toBe('2026-06-29');
  });

  it('collects required questions', () => {
    const template = validateDmpTemplate(nihStyleTemplate);
    const requiredQuestions = findRequiredTemplateQuestions(template);

    expect(requiredQuestions.length).toBeGreaterThan(0);
    expect(requiredQuestions.every((question) => question.required)).toBe(true);
  });

  it('migrates answers with question ID mapping and keeps unmapped history', () => {
    const targetTemplate = validateDmpTemplate(genericTemplateV2);
    const migrationPlan = validateDmpTemplateMigrationPlan({
      fromTemplateId: 'generic-jp-v1',
      toTemplateId: 'generic-jp-v2',
      preserveUnmappedAnswers: true,
      mappings: [
        {
          fromFieldId: 'storage_and_sharing.storage_location',
          toFieldId: 'storage_and_sharing.storage_locations',
          transform: 'string_to_array',
        },
        {
          fromFieldId: 'responsibility.data_manager',
          toFieldId: 'responsibility.data_manager',
        },
      ],
    });

    const report = migrateTemplateAnswers(
      {
        'storage_and_sharing.storage_location': '研究室サーバ',
        'responsibility.data_manager': '山田太郎',
        'legacy.old_question': '旧回答',
      },
      migrationPlan,
      targetTemplate,
    );

    expect(report.migratedAnswers['storage_and_sharing.storage_locations']).toEqual(['研究室サーバ']);
    expect(report.migratedAnswers['responsibility.data_manager']).toBe('山田太郎');
    expect(report.unmappedSourceFieldIds).toEqual(['legacy.old_question']);
    expect(report.history.some((entry) => entry.status === 'unmapped')).toBe(true);
  });

  it('rejects select questions without options', () => {
    expect(() =>
      validateDmpTemplate({
        id: 'invalid-template',
        name: 'Invalid Template',
        version: '1.0.0',
        locale: 'ja',
        templateType: 'generic',
        targetFundingAgencyTypes: ['other'],
        lastUpdated: '2026-06-29',
        sections: [
          {
            id: 'section-1',
            title: 'Section 1',
            order: 1,
            questions: [
              {
                id: 'question-1',
                label: 'Question 1',
                type: 'select',
                required: true,
                order: 1,
              },
            ],
          },
        ],
      }),
    ).toThrow('select / multi_select 型の質問には options が必要です。');
  });
});

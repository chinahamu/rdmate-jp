import { describe, expect, it } from 'vitest';
import {
  getDefaultDmpTemplateId,
  getDmpTemplateById,
  getDmpTemplateMigrationPlan,
  listAllDmpTemplates,
  listDeprecatedDmpTemplates,
  listDmpTemplates,
  listDmpTemplatesByDiscipline,
  listDmpTemplatesByFundingAgencyType,
  listDmpTemplatesByType,
  migrateDmpTemplateAnswers,
} from '../../src/server/template-registry';

describe('template registry', () => {
  it('lists active templates with Phase 3 metadata for UI', () => {
    const templates = listDmpTemplates();

    expect(templates).toHaveLength(8);
    expect(templates.map((template) => template.id)).toEqual([
      'generic-jp-v2',
      'university-basic-v1',
      'japanese-funder-jp-v1',
      'nih-style-v1',
      'human-subjects-jp-v1',
      'life-science-medical-jp-v1',
      'humanities-social-science-jp-v1',
      'computational-ai-jp-v1',
    ]);
    expect(templates.every((template) => template.questionCount > 0)).toBe(true);
    expect(templates.every((template) => template.locale.length > 0)).toBe(true);
  });

  it('returns the default and id-selected template including deprecated entries', () => {
    expect(getDefaultDmpTemplateId()).toBe('generic-jp-v2');
    expect(getDmpTemplateById('university-basic-v1')?.name).toBe(
      '大学研究室向け簡易DMPテンプレート',
    );
    expect(getDmpTemplateById('generic-jp-v1')?.deprecated?.replacedBy).toBe('generic-jp-v2');
  });

  it('manages deprecated templates separately from active listings', () => {
    expect(listAllDmpTemplates()).toHaveLength(9);
    expect(listDeprecatedDmpTemplates().map((template) => template.id)).toEqual(['generic-jp-v1']);
    expect(listDmpTemplates().map((template) => template.id)).not.toContain('generic-jp-v1');
  });

  it('filters templates by funding agency type, template type, and discipline', () => {
    expect(listDmpTemplatesByFundingAgencyType('nih').map((template) => template.id)).toEqual([
      'nih-style-v1',
    ]);
    expect(listDmpTemplatesByFundingAgencyType('university').map((template) => template.id)).toContain(
      'university-basic-v1',
    );
    expect(listDmpTemplatesByFundingAgencyType('kakenhi').map((template) => template.id)).toContain(
      'japanese-funder-jp-v1',
    );
    expect(listDmpTemplatesByType('human_subjects').map((template) => template.id)).toEqual([
      'human-subjects-jp-v1',
    ]);
    expect(listDmpTemplatesByDiscipline('computational_ai').map((template) => template.id)).toEqual([
      'computational-ai-jp-v1',
    ]);
  });

  it('migrates generic v1 answers to generic v2 using registry migration definitions', () => {
    expect(getDmpTemplateMigrationPlan('generic-jp-v1', 'generic-jp-v2')).toBeDefined();

    const report = migrateDmpTemplateAnswers('generic-jp-v1', 'generic-jp-v2', {
      'data_description.data_types': '画像データ',
      'storage_and_sharing.storage_location': '研究室サーバ',
      'legacy.free_text': '旧テンプレート固有メモ',
    });

    expect(report.migratedAnswers['data_description.data_types']).toBe('画像データ');
    expect(report.migratedAnswers['storage_and_sharing.storage_locations']).toEqual(['研究室サーバ']);
    expect(report.unmappedSourceFieldIds).toEqual(['legacy.free_text']);
  });
});

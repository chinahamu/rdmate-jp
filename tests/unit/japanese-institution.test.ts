import { describe, expect, it } from 'vitest';
import {
  createJapaneseDmpExportHeader,
  formatAffiliationHierarchy,
  formatBilingualName,
  getKakenhiInputHints,
  normalizeKakenhiProjectNumber,
  summarizeJapaneseInstitutionSupport,
  toJapaneseInstitutionProfile,
} from '../../src/domain/japanese-institution';
import { getSampleResearchProject } from '../../src/server/sample-project';

describe('Japanese institution support', () => {
  it('formats bilingual names and affiliation hierarchy', () => {
    const project = getSampleResearchProject();
    const profile = toJapaneseInstitutionProfile(project.members[0]!);

    expect(formatBilingualName(profile.name)).toBe('山田 太郎 / Taro Yamada');
    expect(formatAffiliationHierarchy(profile.affiliation)).toContain('メタ大学 / 情報学部');
  });

  it('normalizes and validates KAKENHI project number hints', () => {
    expect(normalizeKakenhiProjectNumber('26-k00001')).toBe('26K00001');
    expect(getKakenhiInputHints('26-k00001')[0]).toContain('26K00001');
  });

  it('summarizes Japanese institution readiness', () => {
    const project = getSampleResearchProject();
    const summary = summarizeJapaneseInstitutionSupport(project);

    expect(summary.defaultDmpExportLanguage).toBe('ja');
    expect(summary.memberCount).toBe(2);
    expect(summary.bilingualNameCount).toBe(2);
    expect(summary.hierarchicalAffiliationCount).toBe(2);
    expect(summary.validKakenhiProjectNumberCount).toBe(1);
    expect(summary.issues).toEqual([]);
  });

  it('creates Japanese DMP header with bilingual name and KAKENHI number', () => {
    const header = createJapaneseDmpExportHeader(getSampleResearchProject()).join('\n');

    expect(header).toContain('| 出力言語 | 日本語 |');
    expect(header).toContain('山田 太郎 / Taro Yamada');
    expect(header).toContain('26K00001');
  });
});

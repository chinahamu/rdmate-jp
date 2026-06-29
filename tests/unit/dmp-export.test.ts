import { describe, expect, it } from 'vitest';
import {
  createDmpJsonExport,
  dmpJsonExportSchema,
  generateDmpCsv,
  generateDmpJson,
  generateDmpMarkdown,
  getDmpExportFileName,
} from '../../src/domain/dmp-export';
import { markdownToDocxChildren } from '../../src/server/dmp-docx';
import { getSampleDmpExportContext } from '../../src/server/dmp-export-sample';

describe('DMP export', () => {
  const context = getSampleDmpExportContext('2026-06-29T00:00:00.000Z');

  it('generates Markdown in section order with tables', () => {
    const markdown = generateDmpMarkdown(context);

    expect(markdown).toContain('# 研究データ管理支援ツールの実証研究');
    expect(markdown).toContain('## 研究データの概要');
    expect(markdown).toContain('| 設問 | 回答 | 必須 | 状態 |');
    expect(markdown.indexOf('## 研究データの概要')).toBeLessThan(
      markdown.indexOf('## 保存・共有方針'),
    );
  });

  it('generates complete JSON export data and validates it', () => {
    const jsonExport = createDmpJsonExport(context);
    const serialized = generateDmpJson(context);

    expect(jsonExport.template.id).toBe('generic-jp-v1');
    expect(jsonExport.template.version).toBe('1.0.0');
    expect(jsonExport.project.id).toBe('sample-project');
    expect(jsonExport.answers.length).toBeGreaterThan(0);
    expect(dmpJsonExportSchema.parse(JSON.parse(serialized))).toEqual(jsonExport);
  });

  it('generates one-row-per-question CSV', () => {
    const csv = generateDmpCsv(context);
    const lines = csv.trim().split('\n');

    expect(lines[0]).toBe('section_id,question_id,question_label,answer,required,status');
    expect(lines.some((line) => line.includes('data_description,data_types'))).toBe(true);
    expect(lines.length).toBe(createDmpJsonExport(context).answers.length + 1);
  });

  it('generates stable export filenames', () => {
    expect(getDmpExportFileName(context, 'md')).toBe(
      '研究データ管理支援ツールの実証研究_generic-jp-v1_ja.md',
    );
  });

  it('converts Markdown headings and tables into DOCX children', () => {
    const children = markdownToDocxChildren(generateDmpMarkdown(context));

    expect(children.length).toBeGreaterThan(3);
  });
});

import { describe, expect, it } from 'vitest';
import genericTemplateJson from '../../templates/dmp/generic-jp-v1.json';
import { getFieldId, validateDmpAnswers } from '../../src/domain/dmp-answer';
import {
  dmpTemplateSchema,
  validateDmpTemplate,
} from '../../src/domain/dmp-template';
import {
  createDmpJsonExport,
  generateDmpCsv,
  generateDmpMarkdown,
} from '../../src/domain/dmp-export';
import { getSampleDmpExportContext } from '../../src/server/dmp-export-sample';

describe('Phase 1 test plan coverage', () => {
  it('validates template definitions with Zod and rejects duplicate section ids', () => {
    expect(dmpTemplateSchema.safeParse(genericTemplateJson).success).toBe(true);
    expect(() =>
      validateDmpTemplate({
        ...genericTemplateJson,
        sections: [genericTemplateJson.sections[0], genericTemplateJson.sections[0]],
      }),
    ).toThrow('セクションIDが重複しています');
  });

  it('detects missing required DMP answers', () => {
    const template = validateDmpTemplate(genericTemplateJson);
    const issues = validateDmpAnswers(template, {
      [getFieldId('data_description', 'data_types')]: '',
      [getFieldId('data_description', 'data_formats')]: '',
    });

    expect(issues.map((issue) => issue.message)).toEqual(
      expect.arrayContaining([
        '生成・収集するデータの種類は必須です。',
        '主なファイル形式は必須です。',
      ]),
    );
  });

  it('keeps Markdown, JSON, and CSV export snapshots stable', () => {
    const context = getSampleDmpExportContext('2026-06-29T00:00:00.000Z');
    const jsonExport = createDmpJsonExport(context);

    expect(generateDmpMarkdown(context)).toMatchInlineSnapshot(`
      "# 研究データ管理支援ツールの実証研究

      | 項目 | 内容 |
      |---|---|
      | 出力言語 | 日本語 |
      | 研究分野 | 情報学 |
      | 研究期間 | 2026-04-01 - 2027-03-31 |
      | 研究代表者 | 山田 太郎 / Taro Yamada |
      | 研究データ管理責任者 | 佐藤 花子 / Hanako Sato |
      | 所属階層 | メタ大学 / 情報学部 / 情報システム学科 / 研究データ管理研究室 |
      | 科研費課題番号 | 26K00001 |
      | テンプレート | 汎用DMP 日本語テンプレート v1.0.0 |
      | 生成日時 | 2026-06-29T00:00:00.000Z |

      ## 研究データの概要

      研究で生成・収集するデータの内容を整理します。

      | 設問 | 回答 | 必須 | 状態 |
      |---|---|---|---|
      | 生成・収集するデータの種類 | 研究データ管理支援ツールの実証研究で生成・収集する研究データ | 必須 | 入力済み |
      | 主なファイル形式 |  | 必須 | 未入力 |

      ## 保存・共有方針

      研究期間中・終了後の保存場所、公開区分、共有範囲を定義します。

      | 設問 | 回答 | 必須 | 状態 |
      |---|---|---|---|
      | 主な保存場所 | 機関リポジトリ | 必須 | 入力済み |
      | 公開・共有方針 | 制限付き公開 | 必須 | 入力済み |
      | 保持期間 |  | 必須 | 未入力 |

      ## 責任体制

      | 設問 | 回答 | 必須 | 状態 |
      |---|---|---|---|
      | 研究データ管理責任者 | 佐藤 花子 | 必須 | 入力済み |
      "
    `);
    expect(jsonExport.template).toMatchInlineSnapshot(`
      {
        "id": "generic-jp-v1",
        "name": "汎用DMP 日本語テンプレート",
        "version": "1.0.0",
      }
    `);
    expect(generateDmpCsv(context).split('\n').slice(0, 3)).toMatchInlineSnapshot(`
      [
        "section_id,question_id,question_label,answer,required,status",
        "data_description,data_types,生成・収集するデータの種類,研究データ管理支援ツールの実証研究で生成・収集する研究データ,true,answered",
        "data_description,data_formats,主なファイル形式,,true,missing",
      ]
    `);
  });

  it('requires non-public reason when sharing policy is non-public', () => {
    const template = validateDmpTemplate(genericTemplateJson);
    const issues = validateDmpAnswers(template, {
      [getFieldId('data_description', 'data_types')]: '匿名化済みデータ',
      [getFieldId('data_description', 'data_formats')]: 'CSV',
      [getFieldId('storage_and_sharing', 'storage_location')]: '研究室サーバ',
      [getFieldId('storage_and_sharing', 'sharing_policy')]: '非公開',
      [getFieldId('storage_and_sharing', 'retention_period')]: '研究終了後5年間',
      [getFieldId('responsibility', 'data_manager')]: '佐藤 花子',
    });

    expect(issues.map((issue) => issue.message)).toContain(
      '非公開を選択した場合は、非公開理由の入力が必要です。',
    );
  });
});

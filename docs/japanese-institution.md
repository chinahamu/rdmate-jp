# 日本の研究機関向け配慮

RDMate JPでは、日本の大学・研究機関でDMPや研究データ台帳を扱いやすくするため、日本語氏名・英語氏名の併記、所属階層、科研費課題番号、 日本語DMP出力を標準機能として扱います。

## 1. 対象機能

| 機能 | 内容 |
| --- | --- |
| 氏名併記 | 日本語氏名と英語氏名を同時に管理します。 |
| 所属階層 | 機関、研究科、学部、学科、専攻、研究室を階層として管理します。 |
| 科研費入力補助 | 科研費課題番号の正規化候補と形式チェックを表示します。 |
| 日本語DMP出力 | DMP Markdown/JSON出力で日本語項目名を標準にします。 |

確認画面は `/japanese-institution`、JSON APIは `/api/japanese-institution/summary` です。

## 2. 氏名併記

研究メンバーには、既存の `name` に加えて、次の項目を持てます。

- `nameJa`: 日本語氏名
- `nameEn`: 英語氏名

DMP出力では、次のように併記します。

```text
山田 太郎 / Taro Yamada
```

日本語DMPを学内で共有しつつ、英語メタデータや国際共同研究にも転用しやすくするための項目です。

## 3. 所属階層

所属は自由記述の `affiliation` に加えて、階層項目で管理できます。

| 項目 | 例 |
| --- | --- |
| `institution` | メタ大学 |
| `graduateSchool` | 情報学研究科 |
| `faculty` | 情報学部 |
| `department` | 情報システム学科 |
| `major` | データサイエンス専攻 |
| `laboratory` | 研究データ管理研究室 |

表示時は次のように連結します。

```text
メタ大学 / 情報学部 / 情報システム学科 / 研究データ管理研究室
```

階層項目が未設定の場合は、既存の所属文字列から推定表示します。ただし、正式な学内登録やDMP提出前には明示的な階層入力を推奨します。

## 4. 科研費課題番号入力補助

科研費の助成情報では、課題番号を `projectNumber` または `grantNumber` に保持します。

入力補助では、空白やハイフンを除去し、大文字化した正規化候補を表示します。

例:

| 入力 | 正規化候補 |
| --- | --- |
| `26-k00001` | `26K00001` |
| `26 K 00001` | `26K00001` |

標準形式例に合わない場合は警告を表示します。最終的な制度上の正確性は、助成機関や学内の登録情報で確認してください。

## 5. 日本語DMP出力

研究課題の `preferredDmpLanguage` は既定で `ja` です。DMP Markdown出力では、次を日本語のヘッダーに含めます。

- 出力言語
- 研究分野
- 研究期間
- 研究代表者の日本語/英語氏名
- 研究データ管理責任者の日本語/英語氏名
- 所属階層
- 科研費課題番号
- テンプレート名
- 生成日時

## 6. Prismaモデル

Prismaでは、主に次の項目を追加しています。

### `ResearchProject`

- `institutionLocalProjectCode`
- `preferredDmpLanguage`

### `ResearchMember`

- `nameJa`
- `nameEn`
- `affiliationInstitution`
- `affiliationGraduateSchool`
- `affiliationFaculty`
- `affiliationDepartment`
- `affiliationMajor`
- `affiliationLaboratory`

### `Funding`

- `agencyType`
- `projectNumber`
- `grantNumber`

## 7. API

```bash
curl http://localhost:3000/api/japanese-institution/summary
```

レスポンスには、研究課題、サマリー、メンバーの氏名/所属プロファイル、科研費入力補助、DMP出力ヒントが含まれます。

## 8. 運用チェックリスト

- [ ] PIとData Stewardの日本語氏名・英語氏名を登録している。
- [ ] 所属階層を機関、研究科/学部、学科/専攻、研究室単位で整理している。
- [ ] 科研費課題番号を正規化候補で確認している。
- [ ] DMP出力既定言語が `ja` になっている。
- [ ] 学内提出前に正式な所属名・課題番号と照合している。

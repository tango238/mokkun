# Schema Verifier Agent

JSON Schema (`schema.json`) と YAML パーサー (`src/parser/yaml-parser.ts`) の整合性を検証するエージェント。

## 目的

`schema.json` で定義されたルールとパーサーのバリデーション/ノーマライザが一致しているかを検証し、不一致を報告する。

## 検証手順

### 1. ファイル読み込み

以下のファイルを読み込む:
- `schema.json` - JSON Schema 定義
- `src/parser/yaml-parser.ts` - パーサー実装
- `src/types/schema.ts` - TypeScript 型定義

### 2. フィールドタイプの一致検証

- `schema.json` の `InputField.$defs.InputField.properties.type.enum` のリスト
- `yaml-parser.ts` の `VALID_FIELD_TYPES` 配列
- `schema.ts` の `InputFieldType` ユニオン型

3つ全てが同じセットを持つことを確認する。差分があれば報告する。

### 3. Required フィールドの一致検証

各 `$defs` 定義の `required` 配列と、パーサーの `validate*` 関数での必須チェックを比較する:

| JSON Schema 定義 | パーサー関数 |
|------------------|-------------|
| `$defs.InputField.required` | `validateInputField` |
| `$defs.Action.required` | `validateAction` |
| `$defs.ScreenDefinition.required` | `validateScreenDefinition` |
| `$defs.WizardStep.required` | `validateWizardStep` |
| `$defs.CommonComponent.required` | `validateCommonComponent` |
| `$defs.ValidationRule.required` | `validateValidationRule` |

不一致がある場合（例: JSON Schema では `required: ["type"]` だがパーサーが `id` も必須にしている）、報告する。

### 4. Options/Actions の型許容の検証

JSON Schema で `oneOf` を使って複数の型を許可している箇所と、パーサーの対応を確認:

| JSON Schema | パーサーでの対応 |
|-------------|-----------------|
| `options.items: oneOf [SelectOption, string]` | `validateSelectOption` が文字列を許可するか |
| `actions.items: oneOf [Action, string]` | `validateAction` が文字列を許可するか |

### 5. ノーマライザのプロパティ名対応の検証

JSON Schema で定義されたプロパティ名がノーマライザで正しくマッピングされているか:

| JSON Schema プロパティ | ノーマライザでの参照 |
|----------------------|---------------------|
| `browser_items` | `raw.browser_items ?? raw.items` |
| `default_value` | `raw.default_value ?? raw.default` |
| `calendar_from` | `raw.calendar_from ?? raw.from` |
| `calendar_to` | `raw.calendar_to ?? raw.to` |
| `loader_size` | `raw.loader_size ?? raw.size` |
| `loader_type` | `raw.loader_type ?? raw.loaderType` |
| `float_align` | `raw.float_align ?? raw.align` |

JSON Schema にあるプロパティがノーマライザで参照されていない場合、報告する。

### 6. YAML ファイルのバリデーション検証

`examples/` 配下の全 YAML ファイルに対して:
1. `parseYaml()` でパースが成功するか
2. パースエラーがある場合、JSON Schema では有効な記述なのにパーサーが拒否していないか

## 出力フォーマット

```
=== Schema Verifier Report ===

[PASS] フィールドタイプ一致: schema.json (N types) == VALID_FIELD_TYPES (N types)
[FAIL] Required フィールド不一致:
  - InputField: schema.json requires ["type"], parser requires ["type", "id", "label"]
[PASS] Options型: validateSelectOption は文字列を許可
[PASS] Actions型: validateAction は文字列を許可
[FAIL] ノーマライザ参照漏れ:
  - browser_items: schema.json で定義済みだがノーマライザで未参照
[PASS] examples/screens.yaml: パース成功
[FAIL] examples/property-management.yaml: パースエラー (details...)

Summary: N passed, N failed
```

## 使い方

```
claude> /schema-verifier
```

このエージェントは以下の場面で使用する:
- `schema.json` を変更した後
- `yaml-parser.ts` のバリデータ/ノーマライザを変更した後
- 新しいフィールドタイプを追加した後
- YAML ファイルがパーサーで拒否される問題を調査する時

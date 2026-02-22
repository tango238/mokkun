# Mokkun Project

YAML駆動のフォームレンダリングライブラリ。

## プロジェクト構成

```
src/
├── types/
│   ├── schema.ts              # 型定義 (InputField union: 44タイプ)
│   ├── field-renderable.ts    # FieldRenderable インターフェース
│   └── theme.ts               # テーマ型定義
├── parser/
│   └── yaml-parser.ts         # VALID_FIELD_TYPES 定義
├── loader/
│   └── file-loader.ts         # YAML読み込み (ファイル/URL/D&D)
├── renderer/
│   ├── screen-renderer.ts     # 画面レンダリング
│   ├── action-handler.ts      # ボタンアクション処理
│   ├── components/            # UIコンポーネント (53ファイル + dialog/4ファイル)
│   │   ├── form-fields.ts     # ファサード (switch文で委譲)
│   │   ├── input.ts, select.ts, checkbox.ts ...
│   │   └── dialog/            # ダイアログ系 (base-dialog, action-dialog等)
│   └── utils/
│       ├── field-helpers.ts   # createFieldWrapper, escapeHtml
│       ├── dummy-data.ts      # ダミーデータ生成
│       └── dom.ts             # DOM操作ユーティリティ
├── theme/
│   ├── theme-manager.ts       # テーマ管理
│   └── theme-selector.ts      # テーマ切替UI
└── __tests__/                 # テスト (38ファイル)
    └── render-verification.test.ts  # コンポーネント検証

examples/
├── screens.yaml               # 基本フォーム例
├── admin-dashboard.yaml       # 管理画面例
├── teamkit-compat.yaml        # teamkit ui.yml 互換形式
└── index.html                 # ビルド済みライブラリのビューアー
```

## コンポーネントパターン

全コンポーネントは以下のパターンに従う:

```typescript
export class MyComponent {
  private state: MyComponentState      // イミュータブル
  private config: MyComponentConfig
  private callbacks: MyComponentCallbacks

  constructor(container, config = {}, callbacks = {}) { ... }

  // インスタンスメソッド: インタラクティブDOM操作
  render(): void { ... }

  // 静的メソッド: SSR/初期HTML生成
  static renderField(field: InputField): string {
    const html = `...`
    return createFieldWrapper(field, html)
  }
}

export function createMyComponent(...): MyComponent { ... }
```

## 新しいコンポーネントを追加する手順

1. **型定義** (`src/types/schema.ts`)
   - `XxxField` インターフェースを追加
   - `InputField` union に追加

2. **VALID_FIELD_TYPES** (`src/parser/yaml-parser.ts`)
   - 配列に新しいタイプを追加

3. **コンポーネント実装** (`src/renderer/components/xxx.ts`)
   - `static renderField(field: InputField): string` を実装
   - `createFieldWrapper(field, html)` を使用

4. **ファサード登録** (`src/renderer/components/form-fields.ts`)
   - import 追加
   - switch 文に case 追加

5. **検証テスト実行**
   ```bash
   pnpm test src/__tests__/render-verification.test.ts
   ```

## 検証テスト

`render-verification.test.ts` が以下を自動検証:

| 検証項目 | 説明 |
|----------|------|
| VALID_FIELD_TYPES ↔ switch | 相互に登録されているか |
| schema.ts ↔ VALID_FIELD_TYPES | InputField union との整合性 |
| unknown-field 検出 | レンダリング漏れがないか |
| YAML フィールドレンダリング | 全フィールドが正常に出力されるか |

### 検出される漏れパターン

- 新コンポーネント追加 → VALID_FIELD_TYPES 追加忘れ → **テスト失敗**
- 新コンポーネント追加 → form-fields.ts switch 追加忘れ → **テスト失敗**
- schema.ts に型追加 → 上記どちらか忘れ → **テスト失敗**

## コマンド

```bash
# 開発
pnpm dev

# テスト
pnpm test                                      # 全テスト
pnpm test src/__tests__/render-verification.test.ts  # 検証のみ

# ビルド
pnpm build

# 型チェック
pnpm tsc --noEmit
```

## YAMLサンプル

### 標準形式

```yaml
view:
  login:
    title: "ログイン"
    fields:
      - id: email
        type: text
        label: "メールアドレス"
        required: true
      - id: password
        type: text
        label: "パスワード"
        input_type: password
    actions:
      - id: submit
        type: submit
        label: "ログイン"
        style: primary
```

### teamkit ui.yml 互換形式

teamkit の `generate-ui` が出力する `sections` + `input_fields` 形式にも対応:

```yaml
view:
  order_list:
    title: "受注一覧"
    sections:
      - section_name: "検索・フィルター"
        input_fields:
          - id: "search_keyword"
            type: "text"
            label: "キーワード検索"
    actions:
      - id: "add_order"
        type: "navigate"
        label: "新規受注"
        style: "primary"
        to: "order_form"
```

`sections[].input_fields` は内部で `fields` と同様に処理される。

## 現在のフィールドタイプ (44種類)

text, number, textarea, select, multi_select, combobox, radio_group, checkbox, checkbox_group, date_picker, time_picker, duration_picker, duration_input, file_upload, repeater, data_table, google_map_embed, photo_manager, toggle, image_uploader, badge, browser, calendar, heading, tooltip, pagination, float_area, loader, notification_bar, response_message, timeline, chip, status_label, segmented_control, tabs, line_clamp, disclosure, accordion_panel, section_nav, stepper, information_panel, dropdown, delete_confirm_dialog, definition_list

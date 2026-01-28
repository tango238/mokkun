# Mokkun Project

YAML駆動のフォームレンダリングライブラリ。

## プロジェクト構成

```
src/
├── types/
│   ├── schema.ts              # 型定義 (InputField union: 44タイプ)
│   └── field-renderable.ts    # FieldRenderable インターフェース
├── design-system/
│   ├── types.ts               # DesignSystem インターフェース
│   ├── registry.ts            # デザインシステムレジストリ (切り替え管理)
│   ├── default.ts             # デフォルトデザインシステム (既存コンポーネント)
│   └── index.ts               # エクスポート + 自動登録
├── parser/
│   └── yaml-parser.ts         # VALID_FIELD_TYPES 定義
├── renderer/
│   ├── screen-renderer.ts     # 画面レンダリング
│   ├── components/            # UIコンポーネント (54ファイル)
│   │   ├── form-fields.ts     # ファサード (デザインシステムレジストリに委譲)
│   │   ├── input.ts, select.ts, checkbox.ts ...
│   │   └── dialog/
│   └── utils/
│       └── field-helpers.ts   # createFieldWrapper, escapeHtml
└── __tests__/
    └── render-verification.test.ts  # コンポーネント検証
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

4. **デフォルトデザインシステム登録** (`src/design-system/default.ts`)
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
| VALID_FIELD_TYPES ↔ default.ts switch | 相互に登録されているか |
| schema.ts ↔ VALID_FIELD_TYPES | InputField union との整合性 |
| unknown-field 検出 | レンダリング漏れがないか |
| YAML フィールドレンダリング | 全フィールドが正常に出力されるか |

### 検出される漏れパターン

- 新コンポーネント追加 → VALID_FIELD_TYPES 追加忘れ → **テスト失敗**
- 新コンポーネント追加 → design-system/default.ts switch 追加忘れ → **テスト失敗**
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

## デザインシステム切り替え

コンポーネントのレンダリングをデザインシステム単位で切り替え可能。

### アーキテクチャ

```
form-fields.ts (renderField/renderFields)
    ↓ 委譲
designSystemRegistry (シングルトン)
    ↓ アクティブなデザインシステムを選択
DesignSystem.renderField(field)
    ↓
HTML文字列
```

### 使い方

```typescript
import { Mokkun, type DesignSystem } from 'mokkun'

// カスタムデザインシステムを定義
const materialDesign: DesignSystem = {
  name: 'material',
  renderField(field) {
    switch (field.type) {
      case 'text':
        return `<div class="mdc-text-field">
          <input class="mdc-text-field__input" id="${field.id}" />
          <label class="mdc-floating-label">${field.label}</label>
        </div>`
      // ... 他のフィールドタイプ
      default:
        return `<div>Unsupported: ${field.type}</div>`
    }
  },
}

// 方法1: init時に指定
const app = await Mokkun.init({
  container: '#app',
  yamlUrl: '/form.yaml',
  designSystem: materialDesign,  // DesignSystemオブジェクトまたは名前
})

// 方法2: 後から切り替え
Mokkun.designSystem.register(materialDesign)
Mokkun.designSystem.setActive('material')

// 方法3: インスタンスから切り替え（画面が自動的に再レンダリングされる）
app.setDesignSystem('material')
app.setDesignSystem(materialDesign)  // オブジェクトも可

// 利用可能なデザインシステム一覧
Mokkun.designSystem.getAvailable()  // ['default', 'material']
```

### 部分的なオーバーライド

特定のフィールドタイプだけカスタマイズし、残りはデフォルトにフォールバック:

```typescript
Mokkun.designSystem.registerPartial({
  name: 'custom-inputs',
  fieldRenderers: {
    text: (field) => `<custom-input label="${field.label}"></custom-input>`,
    select: (field) => `<custom-select id="${field.id}"></custom-select>`,
    // 未定義のタイプはデフォルトデザインシステムが処理
  },
}, 'default')  // フォールバック先
```

### 主要ファイル

| ファイル | 役割 |
|----------|------|
| `src/design-system/types.ts` | `DesignSystem`, `PartialDesignSystem` インターフェース |
| `src/design-system/registry.ts` | `designSystemRegistry` シングルトン |
| `src/design-system/default.ts` | `defaultDesignSystem` (既存コンポーネント) |
| `src/design-system/index.ts` | エクスポート + デフォルト自動登録 |

## 現在のフィールドタイプ (44種類)

text, number, textarea, select, multi_select, combobox, radio_group, checkbox, checkbox_group, date_picker, time_picker, duration_picker, duration_input, file_upload, repeater, data_table, google_map_embed, photo_manager, toggle, image_uploader, badge, browser, calendar, heading, tooltip, pagination, float_area, loader, notification_bar, response_message, timeline, chip, status_label, segmented_control, tabs, line_clamp, disclosure, accordion_panel, section_nav, stepper, information_panel, dropdown, delete_confirm_dialog, definition_list

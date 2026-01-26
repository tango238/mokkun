# mokkun

YAML形式のUI構造定義から画面モックアップを生成・表示するブラウザツール

## 概要

| 項目 | 内容 |
|------|------|
| 実行環境 | ブラウザのみ（サーバー不要） |
| YAML読込 | ファイル選択、URLパラメータ、ドラッグ&ドロップ |
| テーマ管理 | Light / Dark |
| 画面遷移 | リンククリックで遷移 |

## 技術スタック

| カテゴリ | 技術 |
|----------|------|
| 言語 | TypeScript |
| ビルド | Vite |
| テスト | Vitest |
| YAMLパーサー | js-yaml |
| スタイル | CSS Variables + テーマファイル |

## セットアップ

```bash
# 依存関係のインストール
pnpm install

# 開発サーバー起動
pnpm dev

# ビルド
pnpm build

# テスト実行
pnpm test
```

## ディレクトリ構造

```
mokkun/
├── src/
│   ├── main.ts              # エントリーポイント
│   ├── lib.ts               # ライブラリエクスポート
│   ├── parser/              # YAMLパーサー
│   ├── renderer/            # レンダリングエンジン
│   │   ├── screen-renderer.ts
│   │   ├── action-handler.ts
│   │   ├── components/      # UIコンポーネント
│   │   └── utils/           # ユーティリティ
│   ├── theme/               # テーマ管理
│   ├── loader/              # ファイル読み込み
│   ├── types/               # 型定義
│   └── __tests__/           # テスト
├── themes/                  # テーマ設定
├── schema.json              # JSON Schema定義
└── index.html
```

## サポートコンポーネント

### フォーム要素

| コンポーネント | 説明 |
|---------------|------|
| text | テキスト入力 |
| number | 数値入力 |
| textarea | テキストエリア |
| select | セレクトボックス |
| multi_select | 複数選択セレクト |
| combobox | 検索可能なセレクト |
| radio_group | ラジオボタングループ |
| checkbox | チェックボックス |
| checkbox_group | チェックボックスグループ |
| toggle | トグルスイッチ |
| date_picker | 日付選択 |
| time_picker | 時間選択 |
| duration_picker | 期間選択 |
| duration_input | 期間入力 |
| file_upload | ファイルアップロード |
| image_uploader | 画像アップローダー |
| calendar | カレンダー日付選択 |
| browser | 階層構造データの単一選択 |

### データ表示

| コンポーネント | 説明 |
|---------------|------|
| data_table | データテーブル |
| pagination | ページネーション |
| badge | バッジ |
| chip | チップ |
| status_label | ステータスラベル |
| timeline | タイムライン |
| definition_list | 定義リスト |

### レイアウト・ナビゲーション

| コンポーネント | 説明 |
|---------------|------|
| app_header | アプリケーションヘッダー（ロゴ、テナント切替、ユーザーメニュー） |
| app_navi | アプリナビゲーション（主要機能の切り替え） |
| heading | 見出し |
| tabs | タブ |
| accordion_panel | アコーディオン |
| disclosure | 開閉コンテンツ |
| wizard / stepper | ウィザード / ステッパー |
| section_nav | セクションナビゲーション |
| float_area | フローティング領域 |
| segmented_control | セグメントコントロール |

### フィードバック

| コンポーネント | 説明 |
|---------------|------|
| tooltip | ツールチップ |
| loader | ローダー |
| notification_bar | 通知バー |
| response_message | レスポンスメッセージ |
| information_panel | 情報パネル |
| line_clamp | 行数制限テキスト |

### その他

| コンポーネント | 説明 |
|---------------|------|
| dropdown | ドロップダウンメニュー |
| repeater | 動的フィールドグループ |
| google_map_embed | Googleマップ埋め込み |
| photo_manager | 写真管理 |
| delete_confirm_dialog | 削除確認ダイアログ |

## YAML構造

```yaml
view:
  screen_name:
    title: "画面タイトル"
    description: "画面の説明"
    fields:
      - id: "field_id"
        type: "text"
        label: "ラベル"
        required: true
    actions:
      - id: "submit"
        type: "submit"
        label: "送信"
        style: "primary"

common_components:
  component_name:
    type: "field_group"
    fields: []

validations:
  rule_name:
    rules:
      required: true
      min: 1
```

## 使用方法

### ライブラリビルド

```bash
# ライブラリとしてビルド
pnpm build:lib
```

### HTMLでの使用例

```html
<!DOCTYPE html>
<html>
<head>
  <title>画面モックアップ</title>
  <!-- CSSを読み込む -->
  <link rel="stylesheet" href="./dist/mokkun.css">
</head>
<body>
  <div id="mokkun-app"></div>
  <script type="module">
    import { Mokkun } from './dist/mokkun.esm.js';

    // init()はPromiseを返す
    Mokkun.init({
      container: '#mokkun-app',
      yamlUrl: './screens.yaml',
      theme: 'light',
      onReady: (instance) => {
        console.log('Mokkun ready:', instance.getScreenNames());
      },
      onError: (error) => {
        console.error('Mokkun error:', error);
      }
    });
  </script>
</body>
</html>
```

### UMD形式（グローバル変数として使用）

```html
<!DOCTYPE html>
<html>
<head>
  <title>画面モックアップ</title>
  <link rel="stylesheet" href="./dist/mokkun.css">
</head>
<body>
  <div id="mokkun-app"></div>
  <script src="./dist/mokkun.js"></script>
  <script>
    // グローバル変数Mokkunが利用可能
    Mokkun.init({
      container: '#mokkun-app',
      yamlUrl: './screens.yaml',
      theme: 'light'
    });
  </script>
</body>
</html>
```

### インラインYAMLの使用

```javascript
const yamlContent = `
view:
  login:
    title: ログイン
    fields:
      - id: email
        type: text
        label: メールアドレス
        required: true
      - id: password
        type: text
        label: パスワード
        required: true
    actions:
      - id: submit
        type: submit
        label: ログイン
        style: primary
`;

const instance = await Mokkun.init({
  container: '#mokkun-app',
  yamlContent: yamlContent,
  theme: 'dark'
});

// 画面を切り替える
instance.showScreen('login');

```

### サンプルファイル

`examples/`フォルダに動作するサンプルが用意されています：

| ファイル | 説明 |
|---------|------|
| `esm-example.html` | ESM形式でMokkunを読み込むサンプル |
| `umd-example.html` | UMD形式（グローバル変数）でMokkunを読み込むサンプル |
| `inline-yaml-example.html` | JavaScriptでYAMLを直接定義するサンプル |
| `screens.yaml` | サンプル画面定義（ログイン、新規登録、ダッシュボード） |

```bash
# ローカルで確認する場合
python3 -m http.server 8080
# http://localhost:8080/examples/esm-example.html を開く
```

## ライセンス

MIT

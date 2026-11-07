# 新フォーマット v2 仕様

01-layer-criteria.md の6層（App / Flow / View / Section / Field / Component）を
そのまま YAML の入れ子にしたもの。各層は自分の層に閉じる UX 判断だけを書く。

- 正規形は camelCase。
- 先頭に `mokkun: 2` を置き、旧フォーマット（`view:` 直下）と判別する。
- v2 は内部で旧フォーマット（`MokkunSchema`）にコンパイルされ、既存レンダラーで描画する。
  コンパイル規則は末尾の表。

## トップレベル

```yaml
mokkun: 2
app:      # App 層。1つだけ
flows:    # Flow 層。name → Flow
views:    # View 層。name → View
patterns: # 再利用可能な Section（任意）
rules:    # 共通バリデーション（任意）
```

## App

| キー | 型 | 必須 | 意味 |
|---|---|---|---|
| name | string | ○ | アプリ名 |
| layout | `shell` \| `plain` | | 共通レイアウト。既定 `shell` |
| header | object | | systemName, userName, userEmail, tenantName, helpUrl |
| roles | string[] | | ロール一覧。flows / views の `role` が参照 |
| navigation | NavGroup[] | | グローバルナビの中身 |
| notifications | Notice[] | | 全画面共通の通知。variant, message, dismissible |

```yaml
navigation:
  - group: "受注"
    items:
      - view: order_list          # 必須。views のキー
        label: "受注一覧"          # 省略時は view の title
        icon: list
```

## Flow

| キー | 型 | 必須 | 意味 |
|---|---|---|---|
| name | string | ○ | 業務名 |
| outcome | string | ○ | 業務成果。完了条件を一文で |
| role | string | | 担当ロール |
| steps | Step[] | ○ | 画面の順序 |
| progress | `stepper` \| `none` | | 手順ナビを出すか。既定 `stepper` |
| resumable | boolean | | 途中保存して再開できるか |

```yaml
steps:
  - view: order_form
    label: "入力"                 # 省略時は view の title
  - view: order_confirm
    label: "確認"
  - view: order_done
    label: "完了"
```

## View

| キー | 型 | 必須 | 意味 |
|---|---|---|---|
| title | string | ○ | 画面タイトル |
| goal | string | ○ | ユーザーのゴール。「注文を作る」 |
| nav | string | | 現在地。navigation 内の view 名 |
| role | string | | 利用ロール |
| layout | `stack` \| `tabs` \| `sectioned` | | sections の束ね方。既定 `stack` |
| description | string | | 説明 |
| primaryAction | Action | | 主アクション。1つだけ |
| secondaryActions | Action[] | | 副アクション |
| states | object | | empty / loading / success / error それぞれ `{ message }` |
| sections | Section[] | ○ | まとまり |

### Action

| キー | 型 | 意味 |
|---|---|---|
| id | string | 必須 |
| label | string | 必須 |
| kind | `submit` \| `navigate` \| `custom` \| `reset` | 既定 `submit` |
| to | string | navigate の遷移先 view |
| placement | `header` \| `footer` \| `sticky` | 既定 `footer`。sticky は float_area |
| style | `primary` \| `secondary` \| `danger` | primaryAction の既定は `primary` |
| confirm | `{ message, danger? }` | 実行前の確認（Flow の判断） |

## Section

| キー | 型 | 必須 | 意味 |
|---|---|---|---|
| id | string | ○ | |
| title | string | ○ | 動詞＋名詞。「配送先を指定する」 |
| purpose | string | | なぜこのまとまりが必要か |
| kind | `form` \| `list` \| `readonly` \| `summary` | | 既定 `form` |
| reveal | `open` \| `collapsed` | | 段階的開示。既定 `open` |
| repeatable | `{ min?, max?, addLabel? }` | | 繰り返し可能なまとまり |
| note | string | | 補足説明（information_panel） |
| columns | 1 \| 2 \| 3 | | 項目の配置 |
| visibleWhen | Condition | | 表示条件 |
| use | string | | patterns のキー。fields を継承 |
| fields | Field[] | | kind が form / readonly / summary のとき |
| list | List | | kind が list のとき |

### List（kind: list）

```yaml
list:
  columns:
    - id: orderId
      label: "受注ID"
      sortable: true
  rowActions:
    - id: open
      label: "開く"
      kind: navigate
      to: order_form
  search: true
  paging: { pageSize: 20 }
  selection: none | single | multiple
  empty: "該当する受注はありません"
```

## Field

| キー | 型 | 必須 | 意味 |
|---|---|---|---|
| item | string | ○ | 業務の名詞。id として使う |
| label | string | ○ | ラベル文言 |
| component | Component | ○ | 下表 |
| required | boolean | | |
| whyRequired | string | | 必須の理由。help に併記 |
| example | string | | 例示。placeholder として使う |
| help | string | | ヘルプ |
| format | string | | 入力形式の説明 |
| default | any | | 既定値 |
| options | `{ value, label }[]` | | select / radio / checkbox / combobox / browser |
| multiple | boolean | | select / checkbox で複数 |
| variant | string | | component ごとの表示 variant |
| inline | boolean | | date のカレンダー表示 |
| accept | string | | file の種別。`image` で画像 |
| value | any | | 表示系 component の表示値 |
| readonly | boolean | | |
| rules | string[] \| Rule[] | | バリデーション。文字列は rules のキー |
| visibleWhen | Condition | | |
| props | object | | component 固有の追加設定（既存フィールド属性をそのまま渡す） |

### Component と旧タイプの対応

| component | 条件 | 旧タイプ |
|---|---|---|
| text | | text |
| number | | number |
| textarea | | textarea |
| date | | date_picker |
| date | inline: true | calendar |
| time | | time_picker |
| duration | | duration_input |
| file | | file_upload |
| file | accept: image | image_uploader |
| photo_grid | | photo_manager |
| select | | select |
| select | multiple: true | multi_select |
| select | variant: segmented | segmented_control |
| combobox | | combobox |
| radio | | radio_group |
| checkbox | | checkbox |
| checkbox | multiple: true | checkbox_group |
| toggle | | toggle |
| browser | | browser |
| badge | | badge |
| chip | | chip |
| status | | status_label |
| timeline | | timeline |
| map | | google_map_embed |

### Condition

```yaml
visibleWhen:
  item: deliveryType
  equals: other
```

## コンパイル規則（v2 → 旧フォーマット）

| v2 | 旧フォーマット |
|---|---|
| app.header + app.navigation | 各 view の app_header（navigations に group の items を展開、view.nav と一致する項目を active） |
| app.navigation の group | app_navi の items（current は view.nav が属する group） |
| app.notifications | 各 view 先頭の notification_bar |
| flow.steps（progress: stepper） | 該当 view 先頭の stepper（現在 step は view の位置） |
| view.title / goal / description | title / purpose / description |
| view.layout: tabs | sections を tabs フィールド1つにまとめる |
| view.layout: sectioned | 先頭に section_nav を自動生成 |
| view.states.success / error | response_message（variant に対応） |
| view.states.empty | list の emptyState |
| primaryAction / secondaryActions | actions。primary は style: primary。placement: sticky は float_area |
| action.confirm | delete_confirm_dialog（danger のとき）。それ以外は action の confirm_message |
| section.title / purpose / note | section_name / 先頭の information_panel |
| section.reveal: collapsed | accordion_panel に fields を内包 |
| section.repeatable | repeater に fields を内包 |
| section.kind: list | data_table 1つ |
| section.kind: readonly | definition_list |
| section.use | patterns の fields を先頭に展開 |
| field.item / label / example / help / whyRequired | id / label / placeholder / description（help と whyRequired を結合） |
| field.rules | validation |
| field.props | そのままフィールドに merge |

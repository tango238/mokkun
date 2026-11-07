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
| style | `primary` \| `secondary` \| `tertiary` \| `danger` | primaryAction の既定は `primary`。`tertiary` は中止などのテキストボタン（旧レンダラーへは secondary として変換） |
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
| visibleWhen | Condition | | 表示条件。v2 レンダラーではセクション全体（見出しごと）の表示を切り替える。旧フォーマットへの変換ではセクション内の各フィールドの条件になる（見出しは隠れない） |
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
| inline | boolean | | date のカレンダー表示（月表示をそのまま出す） |
| width | `xs` \| `sm` \| `md` \| `lg` \| `full` | | 入力欄の幅（約 6 / 10 / 20 / 30rem / 100%）。v2 レンダラーのみ。旧フォーマットへは出力しない |
| accept | string | | file の種別。`image` で画像 |
| value | any | | 表示系 component の表示値 |
| readonly | boolean | | |
| rules | string[] \| Rule[] | | バリデーション。文字列は rules のキー |
| visibleWhen | Condition | | |
| props | object | | component 固有の追加設定（既存フィールド属性をそのまま渡す）。`date` の `props.calendar: true` はカレンダーボタン（v2 レンダラー: 静的ボタン、ポップオーバーなし）を入力欄の横に付ける |

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

「未対応」は v2 では書けるが、現状のレンダラー/旧スキーマに受け皿がなく出力に反映されないもの。

| v2 | 旧フォーマット |
|---|---|
| app.header + app.navigation | 各 view の app_header（navigations に group の items を展開、view.nav と一致する項目を active。id は `nav-<通し番号>-<view>`）。`app.layout: plain` では出力しない。navigation の `icon` は AppHeader が持たないため未対応 |
| app.navigation の group | app_navi の items（current は view.nav が属する group） |
| app.notifications | 各 view の「お知らせ」セクション（notification_bar） |
| flow.steps（progress: stepper） | 該当 view 先頭の「進行状況」セクション（stepper のみ。現在 step は view の位置、前の step は completed）。`progress: none` では出さない |
| view.states.success / error | 「お知らせ」セクションの response_message（variant に対応）。通知と状態メッセージが無ければ「お知らせ」は出さない |
| view.states.empty | list の empty_state（`list.empty` が無いときのフォールバック） |
| view.states.loading | 未対応 |
| view.title / goal / description | title / purpose(=goal) / description（description が無ければ goal を description にも使う） |
| view.layout: tabs | sections を tabs フィールド1つにまとめる |
| view.layout: sectioned | 先頭に「画面の構成」セクション（section_nav。本体セクションだけを列挙）を自動生成 |
| primaryAction / secondaryActions | actions。primary は style: primary |
| action.placement（sticky / header / footer） | 未対応（shell レイアウトは全アクションを画面ヘッダーに置く。float_area は子を持てないため生成しない） |
| action.confirm | action の confirm（title=label, message）。`confirm.danger: true` は action の `style: danger`。ダイアログ用の追加フィールドやセクションは出さない |
| section.title / note | section_name / 先頭の information_panel |
| section.purpose | 未対応（出力先がない） |
| section.columns | 未対応（FormSection にレイアウト指定がない） |
| section.visibleWhen | セクション内の各トップレベルフィールドの visible_when（フィールド自身の visibleWhen が優先）。フィールド単位であり、セクションの見出しは隠れない |
| section.reveal: collapsed（kind: form のみ） | accordion_panel に fields を内包（トリガー文言は「入力欄を開く」） |
| section.repeatable（kind: form のみ） | repeater に fields を内包 |
| section.kind: list | data_table 1つ（columns は sortable 未指定を false にする） |
| section.kind: readonly / summary | definition_list（`{term: label, description: 値}`。options があれば表示ラベルに置換、値なしは `-`） |
| section.use | patterns の fields を先頭に展開。id は `<section.id>_<item>`、pattern 内の visibleWhen は書き換える。pattern は `fields` と `note` のみ（use のネストは不可） |
| list.rowActions[].to | 未対応（data_table の行アクションに遷移先がない） |
| list.search / paging / selection | filters.show_search / pagination / selection |
| field.item / label / example / help / whyRequired / format | id / label / placeholder / description（help・whyRequired・「入力形式: format」を「。」で結合） |
| field.value | badge / chip / status は `value`（表示テキスト）。それ以外は `default` |
| field.rules | validation（文字列は top-level rules のキーで、無ければエラー。オブジェクトはそのまま。複数は順にマージ） |
| field.props | camelCase を内部 snake_case に正規化して最後に merge |
| 合成フィールドの id | `_v2_` 接頭辞（item は `_v2_` で始められない）。同一 view で item が重複するとエラー |
| visibleWhen `{item, equals}` | `visible_when: {field, operator: eq, value}`。item は同じ view のフィールド id でなければならない |
| view の fields | sections の input_fields を平坦化して screen.fields にも持つ（旧フォーマットの正規化と同じ） |

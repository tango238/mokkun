# 新フォーマット v2 仕様

01-layer-criteria.md の6層（App / Flow / View / Section / Field / Component）を
そのまま YAML の入れ子にしたもの。各層は自分の層に閉じる UX 判断だけを書く。

- 正規形は camelCase。
- 各オブジェクトに書けるキーは `schema-v2.json` の `additionalProperties: false` と同じで、パーサーも未知のキーをエラー（path 付き）にする（`props` の中だけ自由）。
- YAML で引用符を付けない日付（`until: 2026-11-20`、`default: 2026-11-14`、`equals: 2026-04-01`、`rows` の値）は js-yaml が Date にするため、
  パーサーが検証の前に `YYYY-MM-DD`（UTC）の文字列へそろえる。
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
| roles | string[] | | ロール一覧。flows / views の `role`、`Action.role`、`NavGroup.role`、`Notice.role` が参照する。定義されているとき、これらの値は roles の中の値でなければならない（パーサーが検証） |
| navigation | NavGroup[] | | グローバルナビの中身 |
| notifications | Notice[] | | 全画面共通の通知。variant, message, dismissible, role, until |

```yaml
navigation:
  - group: "受注"
    role: "営業担当"               # 任意。省略は全ロール。文字列または配列
    items:
      - view: order_list          # 必須。views のキー
        label: "受注一覧"          # 省略時は view の title
        icon: list
```

### NavGroup

| キー | 型 | 必須 | 意味 |
|---|---|---|---|
| group | string | ○ | グループ名 |
| items | NavItem[] | ○ | `{ view, label?, icon? }` |
| role | string \| string[] | | このロールにだけ表示する。省略は全ロール。v2 レンダラーのロール切替（現在のロール）に一致しない group はグローバルナビに描かない。ロールが未選択なら常に描く |

### Notice

| キー | 型 | 必須 | 意味 |
|---|---|---|---|
| message | string | ○ | 本文 |
| variant | `info` \| `success` \| `warning` \| `error` | | 既定 `info` |
| dismissible | boolean | | 閉じられるか |
| role | string \| string[] | | このロールにだけ表示する。省略は全ロール |
| until | string（`YYYY-MM-DD`） | | 掲示期限。今日がこれより後（`until` < 今日）なら描かない。当日までは描く。判定には実行時の日付を使う（`renderViewV2` の `today` オプションで差し替えられる） |

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

states のメッセージは、ビューアー（`Mokkun.init` / `renderViewV2` / `mountViewV2`）の「状態」で選んだ 1 つだけを描く。
既定（通常）では success / error のバナーを出さず、同時にも出さない。`loading` は DADS の progress-indicator（スピナー）を、
`empty` は一覧が行の代わりに空の文言を出す。詳細は 03-renderer-v2.md。

### Action

`primaryAction` / `secondaryActions` のほか、`Section.actions`（見出し行の操作）と `list.bulkActions`（選択行への操作）も同じ形。
action の `id` は View の中で一意（主・副・`list.rowActions`・`list.bulkActions`・`Section.actions` をまたいで）。

| キー | 型 | 意味 |
|---|---|---|
| id | string | 必須 |
| label | string | 必須 |
| kind | `submit` \| `navigate` \| `custom` \| `reset` | 既定 `submit` |
| to | string | navigate の遷移先 view |
| placement | `header` \| `footer` \| `sticky` | 既定 `footer`。sticky は float_area |
| style | `primary` \| `secondary` \| `tertiary` \| `danger` | primaryAction の既定は `primary`。`tertiary` は中止などのテキストボタン（旧レンダラーへは secondary として変換） |
| role | string \| string[] | このロールにだけ表示する。省略は全ロール。現在のロールに含まれない操作（とその確認ダイアログ）は描かない。ロールが未選択なら常に描く。旧レンダラーへは出力しない |
| confirm | `{ message, danger? }` | 実行前の確認（Flow の判断）。危険な操作は `style: danger` で示す。`danger` は旧フォーマット変換用で、新しく書かない |

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
| actions | Action[] | | 見出し行に置く操作（確認画面の「〇〇を修正する」、絞り込み Section の「検索」「リセット」）。`style: primary` は不可（primary を持てるのは View だけ。パーサーがエラーにする）。style の既定は secondary で、`tertiary` はテキストボタン、`danger` は危険色。`kind: navigate` は View のアクションと同じ遷移、`kind: reset` はその Section の項目だけを初期値に戻す、`kind: custom`（と submit）は `onAction(id, kind, { section })`。`role` が使える。折りたたみ（`reveal: collapsed`）の Section では中身の先頭に置く。旧レンダラーへは出力しない |

### List（kind: list）

```yaml
list:
  columns:
    - { id: orderId, label: "受注ID", sortable: true, to: order_detail }   # セルが詳細へのリンクになる
    - { id: orderedAt, label: "受注日", type: date }
    - { id: status, label: "ステータス", type: status }
    - { id: total, label: "金額（円）", type: number }
  rows:                          # 代表行。キーは列 id
    - { orderId: "10234", orderedAt: "2026-11-07", status: "処理中", total: 125000 }
  rowActions:
    - id: open
      label: "開く"
      kind: navigate
      to: order_form
  selection: none | single | multiple
  bulkActions:                   # selection: multiple のときだけ
    - { id: add_to_order, label: "発注候補に追加する", kind: custom }
  search: true
  paging: { pageSize: 20 }
  empty: "該当する受注はありません"
```

| キー | 型 | 意味 |
|---|---|---|
| columns | Column[] | 必須。下表 |
| rows | object[] | 代表行（キーは列 id、値は文字列・数値・真偽値・null のスカラー。日付は `"2026-11-07"` か引用符なしの `2026-11-07`）。あればダミー行の代わりに使う。行の `id` キー（なければ先頭列の値）が行 ID になり、`bulkActions` の `selectedRows` と入力列の name に使う。ID が空・重複する行には `#<行の添字（0 始まり）>` を付けて一意にする（例: `A`, `A#1`, `#2`）。`paging.pageSize` があるときは全行を並べ替えてから先頭 `pageSize` 件だけを表示し（2 ページ目以降は `hidden`）、ページ数も実際の行数から出す。`rows` がなければ、列の id / ラベル / type から推測したダミー 3 行（状態列は、同じ view の status / select / radio の選択肢のラベルを借りる。無ければ「処理中 / 出荷済み / 完了」） |
| rowActions | `{ id, label, kind?, to? }[]` | 行ごとの操作（テキストボタン）。`role` / `confirm` / `style` / `placement` は持てない（パーサーとスキーマが拒否する） |
| selection | `none` \| `single` \| `multiple` | 行選択 |
| bulkActions | Action[] | 選択した行への操作。`selection: multiple` のときだけ（それ以外はパーサーがエラー）。表の上の検索と同じ行に outline ボタンで並ぶ。押すと `onAction(id, kind, { section, selectedRows })`（選択なしは空配列。ボタンは無効化しない）。`role`・`confirm` が使える |
| search / paging / empty | | 検索欄 / ページ送り / 空の文言 |

#### Column

| キー | 型 | 意味 |
|---|---|---|
| id | string | 必須。rows のキー |
| label | string | 必須 |
| sortable | boolean | 並べ替えできる列 |
| type | `text` \| `status` \| `date` \| `number` | セルの型。既定 `text`（未指定のときは従来どおり id / ラベルからダミー値の種類を推測）。status は DADS の chip-label（状態名から色を決める。完了・承認＝緑、要対応・却下・欠品＝赤、処理中・審査中＝水色、間近・保留＝黄、それ以外＝灰）、date は「2026年11月7日」（`YYYY-MM` は「2026年11月」）、number は右寄せ・桁区切り |
| to | string | views のキー。セルの値を DADS リンクにし、ナビと同じ navigate で遷移する（存在しない view はパーサーがエラー） |
| field | Field（item・label なし） | セルに入力欄を置く（固定行の表）。`list.rows` が必要（なければパーサーがエラー）。component は text / number / select / checkbox だけ。name は `<行 ID>.<列 id>`、値は rows の値（なければ `field.default`）。`unit`・`width`・`options` が使える。`visibleWhen` などの条件は持てない |

## Field

| キー | 型 | 必須 | 意味 |
|---|---|---|---|
| item | string | ○ | 業務の名詞。id として使う |
| label | string | ○ | ラベル文言 |
| component | Component | ○ | 下表 |
| required | boolean | | |
| whyRequired | string | | 必須の理由。help に併記 |
| example | string | | 例示。v2 レンダラーではサポートテキストに「例: …」として描画する（placeholder は使わない）。旧フォーマットへの変換でも placeholder にはせず、description の末尾に「例: …」として連結する |
| help | string | | ヘルプ。file では、形式・容量をすでに書いているとき、`accept` / `maxSize` から自動で足す「形式: …／1ファイル 10MB まで」を重ねない |
| format | string | | 入力形式の説明 |
| default | any | | 既定値 |
| options | `{ value, label }[]` | | select / radio / checkbox / combobox / browser |
| multiple | boolean | | select / checkbox で複数選択、file で複数ファイル（`props.multiple: true` も従来どおり使える） |
| variant | string | | component ごとの表示 variant |
| inline | boolean | | date のカレンダー表示（月表示をそのまま出す） |
| width | `xs` \| `sm` \| `md` \| `lg` \| `full` | | 入力欄の幅（約 6 / 10 / 20 / 30rem / 100%）。v2 レンダラーのみ。旧フォーマットへは出力しない |
| accept | `image` \| `pdf` \| `document` \| string[] | | file の種別。`image`（画像）/ `pdf` / `document`（PDF・Word・Excel・PowerPoint・テキスト）、または拡張子・MIME タイプの配列（`[".pdf", "image/png"]`）。旧来の HTML accept 文字列（`".pdf"`）も受け付ける。`<input accept>` に出す。`image` は旧レンダラーでは image_uploader |
| maxSize | string | | file の 1 ファイルあたりの上限。`^\d+(KB\|MB\|GB)$`（例 `"10MB"`） |
| unit | string | | 入力欄の後ろに付ける単位（円・件・時間）。v2 レンダラーは同じ control 内の `.mk2-unit`（上流の input-text に単位の部品はないため、DADS のトークンだけで整えた補助スタイル）。text / number / time / combobox / duration で使える。readonly / summary の number の値にも付く |
| precision | `day` \| `month` | | date の精度（既定 `day`）。`month` は年と月の入力だけ。値は `YYYY-MM`（`YYYY-MM-DD` でも読む）、visibleWhen / requiredWhen の比較値は `y-m`（`2026-04`）。date 以外に書くとパーサーがエラー |
| autocomplete | string | | HTML の autocomplete トークン（`email` `tel` `postal-code` など）。input / textarea / select に出す。date では `bday` が 3 つの入力の `bday-year` / `bday-month` / `bday-day` になる |
| links | `{ label, href }[]` | | サポートテキストの後ろに出す DADS リンク（規約・手引きなど）。http(s) は新規タブで開き、危険な URL（javascript: など）は `#` にする |
| requiredWhen | Condition | | この条件が成り立つときだけ必須。「※必須」は成り立つあいだだけ出て、それ以外は「※任意」（描画時に既定値で、操作に合わせて評価し直す）。`required: true` とは併用できない（`required: false` と書く）。参照先の検証は visibleWhen と同じ |
| to | string | | summary / readonly の値を、その view へ遷移する DADS リンクにする（KPI から一覧への導線）。views のキー。それ以外の Section の項目に書くとパーサーがエラー |
| value | any | | 表示系 component の表示値。timeline は `{ at, label, text? }[]` |
| readonly | boolean | | |
| rules | string[] \| Rule[] | | バリデーション。文字列は rules のキー |
| visibleWhen | Condition | | 表示条件。非表示のあいだは required を評価しない（表示されているときだけ必須は required: true + visibleWhen。表示とは別の条件で必須にするときは requiredWhen） |
| props | object | | component 固有の追加設定（既存フィールド属性をそのまま渡す）。`date` の `props.calendar: true` はカレンダーボタン（v2 レンダラー: 静的ボタン、ポップオーバーなし）を入力欄の横に付ける |

### キーを使う component

次の component だけが各キーを描画に使う。それ以外に書いても何も起きない（エラーにはせず、`compileV2Warnings` が「使われません」と警告する）。

| キー | 使う component |
|---|---|
| `unit` | text / number / time / combobox / duration（readonly・summary の Section では number の値だけ） |
| `autocomplete` | text / number / time / combobox / textarea / select / browser、date（`bday` のみ） |
| `accept` / `maxSize` | file / photo_grid（`multiple` は file） |
| `precision` | date（それ以外はパーサーがエラー。`inline: true` では使われない） |
| `links` | すべて（サポートテキストの後ろ） |
| `requiredWhen` | 入力系（readonly・表示系では使われない） |

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
| timeline | value: `[{ at, label, text? }]`（`props.items: [{ time, title, description? }]` も可） | timeline |
| map | | google_map_embed |

### Condition

`visibleWhen`（Field / Section）と `requiredWhen`（Field）で使う。`equals` / `notEquals` / `in` のうち**ちょうど 1 つ**を書く（パーサーが検証）。

```yaml
visibleWhen:
  item: deliveryType
  equals: other                  # item の値が等しい
visibleWhen:
  item: needReason
  notEquals: other               # 等しくない
visibleWhen:
  item: needReason
  in: [work, seeking]            # 配列のどれかと等しい（複数選択の項目は「どれかを含む」）
```

比較する値は、単一値は文字列、複数選択は選択値の配列、単一 checkbox / toggle は `true` / `false`、date は `YYYY-MM-DD`（`precision: month` は `YYYY-MM`。入力欄が空の部分は落ち、年月だけなら `2026-11`）。
比較は `String()` に直した文字列どうしの一致で、型は区別しない（`true` と `'true'`、`1` と `'1'` は同じ）。
複数選択の項目に対する `equals` / `in` は「選ばれた値のどれかを含む」、`notEquals` は「含まない」。

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
| view.states.loading | 未対応（旧レンダラーは描画しない） |
| view.title / goal / description | title / purpose(=goal) / description（description が無ければ goal を description にも使う） |
| view.layout: tabs | sections を tabs フィールド1つにまとめる |
| view.layout: sectioned | 先頭に「画面の構成」セクション（section_nav。本体セクションだけを列挙）を自動生成 |
| primaryAction / secondaryActions | actions。primary は style: primary |
| action.role / navigation[].role / notifications[].role・until | 未対応（旧レンダラーにロール・掲示期限の概念がなく、出力しない） |
| action.placement（sticky / header / footer） | 未対応（shell レイアウトは全アクションを画面ヘッダーに置く。float_area は子を持てないため生成しない） |
| action.confirm | action の confirm（title=label, message）。`confirm.danger: true` は action の `style: danger`。ダイアログ用の追加フィールドやセクションは出さない |
| section.title / note | section_name / 先頭の information_panel |
| section.purpose | 未対応（出力先がない） |
| section.actions | 未対応（FormSection に見出し行の操作がない。出力しない） |
| section.columns | 未対応（FormSection にレイアウト指定がない） |
| section.visibleWhen | セクション内の各トップレベルフィールドの visible_when（フィールド自身の visibleWhen が優先）。フィールド単位であり、セクションの見出しは隠れない |
| section.reveal: collapsed（kind: form のみ） | accordion_panel に fields を内包（トリガー文言は「入力欄を開く」） |
| section.repeatable（kind: form のみ） | repeater に fields を内包 |
| section.kind: list | data_table 1つ（columns は sortable 未指定を false にする。キーを明示して写すので、列の `to` / `field` は旧スキーマの `field`（データキー）と取り違えずに落ちる） |
| list.columns[].type | 列の `format`（text / status / date / number）。number は `align: right` |
| list.columns[].to / list.columns[].field | 未対応（リンク・セルの入力欄は旧 data_table に受け皿がない） |
| list.rows | data_table の `data`（`id` が無い行は 1 始まりの通し番号を足す）。旧レンダラーは静的データとして表示する |
| list.bulkActions | 未対応（出力しない） |
| section.kind: readonly / summary | definition_list（`{term: label, description: 値}`。options があれば表示ラベルに置換、値なしは `-`） |
| section.use | patterns の fields を先頭に展開。id は `<section.id>_<item>`、pattern 内の visibleWhen は書き換える。pattern は `fields` と `note` のみ（use のネストは不可） |
| list.rowActions[].to | 未対応（data_table の行アクションに遷移先がない） |
| list.search / paging / selection | filters.show_search / pagination / selection |
| field.item / label / example / help / whyRequired / format | id / label / description（help・whyRequired・「入力形式: format」・「例: example」を「。」で結合。example を placeholder にはしない） |
| field.unit | number の `unit`。それ以外の component では未対応 |
| field.accept / maxSize / multiple（file） | file_upload の `accept`（image は image_uploader。pdf は `application/pdf`、document は拡張子の配列、配列はそのまま）/ `max_size`（バイト数に換算）/ `multiple` |
| field.precision: month / autocomplete / links / requiredWhen / to | 未対応（旧スキーマに受け皿がない。出力しない） |
| field.value（timeline） | `items`（`{ time: at, title: label, description: text }`）。readonly / summary の definition_list では「日時 ラベル 本文」を ` / ` でつなぐ |
| field.value | badge / chip / status は `value`（表示テキスト）。それ以外は `default` |
| field.rules | validation（文字列は top-level rules のキーで、無ければエラー。オブジェクトはそのまま。複数は順にマージ） |
| field.props | camelCase を内部 snake_case に正規化して最後に merge |
| 合成フィールドの id | `_v2_` 接頭辞（item は `_v2_` で始められない）。同一 view で item が重複するとエラー |
| visibleWhen / requiredWhen の `{item, equals}` | visibleWhen は `visible_when: {field, operator: eq, value}`。item は同じ view のフィールド id でなければならない。requiredWhen は未対応 |
| visibleWhen の `notEquals` / `in` | `operator: ne` / `operator: in`（value は配列）。旧スキーマの SimpleCondition が持つ演算子をそのまま使う（旧レンダラーは条件を `data-visible-when` に JSON で埋め込む） |
| view の fields | sections の input_fields を平坦化して screen.fields にも持つ（旧フォーマットの正規化と同じ） |

### 警告（`compileV2Warnings`）

旧フォーマットへ変換するときに**落ちる**キー（上の表の「未対応」）は `compileV2Warnings(schema)` が
`{ path, key, message }[]` として列挙する（検証済みの v2 スキーマを渡す。変換結果は変えない）。
対象: `placement` / `section.columns` / `section.purpose` / `rowActions[].to` / `states.loading` / `field.width`、
および `role` / `until` / `Section.actions` / `list.bulkActions` / 列の `to`・`field` / `unit`（number 以外）/ `precision: month` /
`autocomplete` / `links` / `requiredWhen` / 項目の `to`、`accept: image` の file の `multiple`・`maxSize`、photo_grid の `accept`・`maxSize`。
「キーを使う component」の表に当たらない書き方（select の `unit`、radio の `autocomplete`、text の `accept` など）は
「component では使われません」という警告になる。ビューアーはコンソールにだけ出し、画面には出さない。
`lib.ts` の `Mokkun.utils.compileV2Warnings` からも使える。

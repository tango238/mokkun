# v2 専用レンダラー（DADS 準拠）設計

v2 フォーマットを、既存 v1 への変換を経ずに直接描画するレンダラー。
見た目と部品はデジタル庁デザインシステム（DADS）v2 の公式 HTML 参照実装に従う。

## 一次資料

| 資料 | 入手元 | 用途 |
|---|---|---|
| デザイントークン | npm `@digital-go-jp/design-tokens` 2.1.0 | 色・文字・余白・エレベーション |
| HTML 参照実装 | github.com/digital-go-jp/design-system-example-components-html（MIT） | 各部品の HTML 構造と CSS（`dads-` BEM、`data-*` で状態） |
| React 参照実装 | github.com/digital-go-jp/design-system-example-components（MIT） | 部品仕様 `component-spec.md`（補助） |

HTML 参照実装の CSS は **改変せずに** `src/renderer-v2/dads/` に取り込む（LICENSE と取得元コミットを `NOTICE.md` に記す）。
mokkun 側の都合はすべて `src/renderer-v2/mokkun-v2.css` に書き、DADS の CSS には手を入れない。

## 配置

```
src/renderer-v2/
├── index.ts            renderViewV2 / mountViewV2 / V2Controller
├── app-shell.ts        App 層: ヘッダー、グローバルナビ、パンくず、通知
├── view.ts             View 層: 見出し、ゴール、手順ナビ、アクション、レイアウト
├── view-state.ts       状態表示（success / error バナー、loading のスピナー）と availableStates
├── context.ts          描画文脈（現在の状態・ロール・今日）
├── condition.ts        visibleWhen / requiredWhen の評価（equals / notEquals / in）
├── role.ts             ロール（Action.role / NavGroup.role / Notice.role）と掲示期限の判定
├── section.ts          Section 層: kind / reveal / repeatable の出し分け、Section.actions
├── section-list.ts     kind: list（table / 検索 / 一括操作）。list-data.ts（行データ・整形）、list-cells.ts（セル）
├── fields/             Field 層: DADS 部品ごとの描画（form-control-label でラップ）
├── icons.ts            DADS が使う SVG アイコン
├── dads/               取り込んだ DADS CSS（無改変）+ NOTICE.md + LICENSE
├── dads.css            dads/ の必要ファイルを @import する束ね
└── mokkun-v2.css       レイアウト専用（ページ幅、グリッド、余白）。DADS トークンのみ使用
```

v1 の `src/renderer/` には触れない。`compileV2` は旧レンダラーでの描画用に残す。

## 層ごとの描画

### App
- ヘッダー: 左にシステム名とアプリ名、右に利用者名とテナント名。DADS の `utility-link` と `horizontal-menu` を使う。
- グローバルナビ: `horizontal-menu`。navigation の group が 1 項目ならリンク、複数ならサブメニューボタン + `menu-list`。現在地は `aria-current="page"`。
- パンくず: `breadcrumb`。アプリ名 › グループ › 画面タイトル。
- 通知: `notification-banner`（app.notifications の variant に対応）をメイン領域の先頭に。`role` が現在のロールに含まれないもの、`until`（YYYY-MM-DD）が今日より前のものは描かない（当日までは描く。今日は実行時の日付）。
- グローバルナビ: `NavGroup.role` が現在のロールに含まれない group は描かない。
- モバイル（ハンバーガー + ドロワー）は今回対象外。

### Flow
- 画面が flow.steps に含まれ progress が stepper なら、見出しの下に `step-navigation`（horizontal）。
  手前の step は `completed`、現在の step は `reached`、以降は状態なし。
- action.confirm は `modal-dialog`。静的 HTML に `<dialog>` を含め、mount 時にボタンから開く。
  danger のときは確定ボタンを危険色にする（button.css のカスタムプロパティ `--button-color` を上書き）。

### View
- `heading` の h1 にタイトル。goal は見出し直下の補足文（`dads-heading` の shoulder/説明の仕組みに従う）。description はその下。
- states は「状態の切替」（下記）で選んだ 1 つだけを描く。success / error は `notification-banner`、loading は `progress-indicator`。
- primaryAction は `button` solid-fill、lg。secondaryActions は outline、md（tertiary は text）。placement: header は見出し行の右、footer と sticky はフォーム末尾（sticky は下端固定。`mokkun-v2.css` で実装）。`Action.role` が現在のロールに含まれない操作は（確認ダイアログも）描かない。
- layout: tabs は `tab`、sectioned は `toc` を右（または上）に置く。stack は縦並び。

### Section
- 見出しは `heading` の h2（レベルは View 内で固定）。`Section.actions` は同じ行の右に `button`（outline md、tertiary は text md、danger は危険色。`data-section` を持つ）。折りたたみ（disclosure / accordion）の Section は中身の先頭に置く。purpose は見出し下の補足文、note は `notification-banner` の info ではなく **support-text 相当の段落**（うるさくしない）。
- kind: form → `fields` をグリッドに。`columns` でグリッド列数（1〜3）。各 Field は自身の幅（DADS の `data-size` や `width`）を優先。
- kind: list → `table`（ソート可能列は sortable-header の見出し）。行は `list.rows`（代表行）があればそれ、なければ `renderer/utils/dummy-data.ts` による 3 行のダミー（状態列は同じ view の status / select / radio の選択肢のラベルを借りる）。rowActions は各行末尾の `button` text sm。下に `page-navigation`（ページが 1 つなら出さない）。`empty` は行が 0 のときの表示文。
  - 列の `type`: status は `chip-label`（状態名から色を決める。下の「状態ラベルの色」）、date は「2026年11月7日」、number は右寄せ（`mk2-cell--number`）・桁区切り。数値・日付のセルは `data-sort-value`（数・ISO 日付）を持ち、並べ替えは表示文字列ではなくこの値で比べる。`rows` と `pageSize` があるときは全行を持ち、並べ替えたあとで先頭 `pageSize` 件だけを見せる（2 ページ目以降は `hidden`）。
  - 列の `to`: セルが `link`（`dads-link`、`data-nav-view`）。クリックはナビと同じ navigate になる。
  - `bulkActions`（`selection: multiple`）: 表の上の `mk2-list__controls` に検索と同じ行で outline `button`。行の選択チェックボックスの value は行 ID（`data-row-id`）。押すと `onAction(id, kind, { section, selectedRows })`。
  - 列の `field`（固定行の表）: セルに input-text / select / checkbox（ラベルなし。`aria-label` は「列名（行 ID）」）。name は `<行 ID>.<列 id>`。
- kind: readonly / summary → `description-list`。date の値は `2026年11月14日`（`YYYY-MM-DD` / `YYYY-MM` / Date を日本語にし、すでに表示用の書式の文字列はそのまま）。値は `Field.to` があれば `link`、status / badge / chip は `chip-label`、timeline は `list`（時刻・ラベル・本文）、number に `unit` があれば値の後ろに付ける。
- reveal: collapsed → `accordion`（見出しがアコーディオンのサマリーになるので、重複見出しは出さない）。
- repeatable → 各繰り返しを枠付きグループ（h3「#n」+ 削除ボタン outline sm）、末尾に「追加」ボタン outline md。min 件を初期表示。
- visibleWhen → `data-visible-when` を付け、mount 時に参照先の値で表示・非表示を切り替える（初期表示は参照先の default で評価）。

### Field
- すべて `form-control-label` でラップ（label / requirement / support-text / field）。
  required は `data-required="true"`。任意表示の有無は form-control-label.md の指針に従う。
- support-text には help、whyRequired、format、example を「例: …」の形で結合する。**placeholder は使わない**（DADS の指針に合わせ、例示はサポートテキストに置く）。
- エラー表示は `props.error`（文字列）があり、かつ**ビューの状態が error のとき**だけ、その部品の error-text に出す（通常の状態では項目のエラーを出さない。バナーと同じく選んだ状態だけを描く）。`renderFieldV2` を単体で呼ぶときの `FieldOpts.showError` は既定 true。
- `links` はサポートテキストの後ろに `link`（`dads-link`）。http(s) は新規タブ（アイコン付き）。
- `requiredWhen` は項目ラッパーの `data-required-when` に条件を持ち、「※必須」「※任意」と `required` 属性を既定値で評価し、入力のたびに評価し直す。
- `visibleWhen` の `equals` / `notEquals` / `in` は静的描画（既定値）と mount 後（現在値）で同じ関数（`condition.ts`）で評価する。

| component | 条件 | DADS 部品 |
|---|---|---|
| text | | input-text（`unit` は同じ control 内の `.mk2-unit`、`autocomplete` は input に） |
| number | | input-text type=number（inputmode=numeric。`unit` 同上） |
| textarea | | textarea |
| date | | date-picker（consolidated）。`precision: month` は年・月の 2 入力だけ。`autocomplete: bday` は bday-year / month / day |
| date | inline | calendar |
| time | | input-text type=time |
| duration | | input-text type=number + 単位（props.unit、既定「分」） |
| file | | file-upload（`multiple`・`accept`・`maxSize` を属性に。形式と容量はサポートテキストへ自動で足す） |
| file | accept image | file-upload（accept=image/*） |
| photo_grid | | file-upload + 画像グリッド（mokkun-v2.css） |
| select | | select |
| select | multiple | checkbox の fieldset（複数選択はチェックボックスにする、DADS の指針） |
| select | variant segmented | radio の横並び fieldset |
| combobox | | input-text + datalist |
| radio | | radio の fieldset |
| checkbox | | checkbox 1 つ |
| checkbox | multiple | checkbox の fieldset |
| toggle | | switch（on-off） |
| browser | | select（階層は optgroup） |
| badge / chip / status | | chip-label（variant → 色） |
| timeline | | list（ol）に日時・ラベル・本文（`value: [{ at, label, text? }]`、または `props.items`） |
| map | | image の枠に「地図」プレースホルダー |

## 公開 API

```ts
renderViewV2(schema: MokkunV2Schema, viewName: string, options?: V2RenderOptions): string
mountViewV2(container: HTMLElement, schema: MokkunV2Schema, viewName: string,
            callbacks?: V2Callbacks, options?: V2RenderOptions): V2Controller
interface V2RenderOptions {
  state?: 'normal' | 'success' | 'error' | 'empty' | 'loading'   // 既定 normal
  role?: string                                                  // app.roles の値。未指定は全ロール分を描く
  today?: Date | string                                          // Notice.until の判定用（既定は実行時の日付）
}
interface V2Callbacks {
  onNavigate?: (view: string) => void
  onAction?: (actionId: string, kind: string, payload?: { section?: string; selectedRows?: string[] }) => void
  syncHash?: boolean
}
interface V2Controller { destroy(): void }
availableStates(schema, viewName): V2ViewState[]   // 選べる状態（normal は常に）
```

`onAction` の payload は Section 内の操作だけが持つ: `Section.actions` は `{ section }`、`list.bulkActions` は `{ section, selectedRows }`。
`Mokkun.init` は `role` と `initialState` を受け取り、インスタンスは `setRole(role)` / `setState(state)` / `getAvailableStates()` を持つ。
状態は画面ごとの見え方なので、**画面を移ると（ナビ・navigate アクション・画面セレクト・`showScreen` のどれでも）通常に戻る**。
`Mokkun.init` の `initialState` は最初の画面にだけ使う。`initialState` / `setState` / `role` / `setRole` は、ビューアーの URL パラメータと同じ解決を通す
（不正な状態・その画面で選べない状態は通常、`app.roles` にないロールは未選択）ので、`instance.viewState` / `instance.role` は解決後の値を返す。
`today` は `YYYY-MM-DD` か有効な `Date` だけ受け付け、それ以外は実行時の日付にする。

`parseV2Document(yamlText)` が検証済みの `MokkunV2Schema` を返す。`lib.ts` の `Mokkun.init` と `main.ts` のビューアーは、
文書が v2 なら v2 レンダラーを使う。画面切替セレクタはそのまま使える。

## 状態の切替

ビューアー（`bin/viewer.html`、開発用の `src/main.ts`）のツールバーに「状態」セレクト（通常 / 成功 / エラー / 空 / 読み込み中）がある。
view が持つ `states.*` に対応するものだけ選べる（それ以外は disabled）。空は `states.empty` か、`list.empty` を持つ一覧があるとき
（一覧の空文言は `list.empty` が正なので）。

| 状態 | 描画 |
|---|---|
| 通常（既定） | 状態バナーも項目のエラー文も出さない。success と error は決して同時に出さない |
| 成功 | `states.success` の `notification-banner` だけ |
| エラー | `states.error` の `notification-banner` と、項目の `props.error`（error-text・`aria-invalid`） |
| 空 | 一覧が行の代わりに空の文言（`list.empty`、なければ `states.empty`）を出す |
| 読み込み中 | `states.loading` のメッセージ（なければ「読み込み中」）を `progress-indicator`（stacked の spinner、不確定進捗）で。フォーム・操作（見出し行の操作も）・確認ダイアログは描かない（押せるボタンを残さない）。上流の `progress-indicator.css` を無改変で取り込む（`dads/NOTICE.md` に記載）。上流の JS（カスタム要素）は取り込まないため、`role="progressbar"` / `aria-labelledby` / `data-indeterminate` は静的に付ける |

`?state=error` のような URL パラメータでも指定できる（通常と空のロールは URL から外す）。

### 状態ラベルの色（一覧の status 列）

ラベルを上から順に見て、最初に当たった行の色にする（`list-data.ts` の `statusColor`）。

| 順 | 当たるラベル | 色 | 例 |
|---|---|---|---|
| 1 | 不承認・不承諾・非承認・不可・却下 | error（red） | 不承認、却下 |
| 2 | 未・不・非で始まる、予定・なしで終わる | neutral（gray） | 未完了、完了予定、エラーなし、不備 |
| 3 | 待ちで終わる | warning（yellow） | 承認待ち、キャンセル待ち |
| 4 | 間近・保留・注意・期限・差戻 を含む | warning（yellow） | 欠品間近、保留 |
| 5 | 要確認・要対応・エラー・欠品・失敗・取下・無効・廃番 を含む | error（red） | 要確認、エラー、欠品 |
| 6 | 済・完了・承認・内定・有効・適正・販売中・成功・受理 を含む | success（green） | 対応済み、送信済み、受付済、完了 |
| 7 | 処理中・審査中・確認中・準備中・対応中・配送中・進行中 を含む | info（light-blue） | 処理中、審査中 |
| 8 | それ以外 | neutral（gray） | 受付、下書き、キャンセル |

否定（未・不・非・なし・予定）を先に見るので、「未完了」が緑に、「エラーなし」が赤になることはない。

## ロールのプレビュー

ツールバーの「ロール」セレクト（「すべて」+ `app.roles`。roles が無い文書では出さない）が現在のロールになる。
未選択（すべて）はすべてを描く。選ぶと、`role` に含まれない `Action`（View・Section・一括操作）、`NavGroup`、`Notice` を描かない。
`?role=本部管理者` のような URL パラメータでも指定できる。View の `role` と Flow の `role` は表示の切り替えには使わない。

## 旧フォーマットへの変換警告

ビューアーは v2 文書を読み込んだとき、旧フォーマットに変換すると落ちるキーを `compileV2Warnings` で列挙し、コンソールにだけ出す（画面には出さない）。
対応表は 02-schema-v2.md の「コンパイル規則」。

## CSS の読み込み方

- DADS の `global.css` は `html` / `a` / `:focus-visible` などの要素セレクタと `:root` のトークンを含む。ライブラリの `mokkun.css` に含めると v1 画面まで再スタイルされるため、`dads.css` と `mokkun-v2.css` は `?inline` で文字列として取り込み、v2 を mount している間だけ `<style id="mokkun-v2-styles">` として挿入する（最後の view を destroy すると外れる。画面遷移では古い view を外す間も保持し、付け直さない）。
- `dads.css` の先頭は Google Fonts（Noto Sans JP）の `@import url(...)`。mount 時にこの外部 URL へ接続するため、CSP を設定する環境では `style-src` に `https://fonts.googleapis.com`、`font-src` に `https://fonts.gstatic.com` が必要。取得できなければ OS のサンセリフにフォールバックする。
- `:where(.mokkun-v2)` によるリセットは詳細度が v1 の要素セレクタ（`p` / `h1-h6`）と同じで、「後から挿入される v2 の `<style>` が勝つ」ことに依存する。そのため `mokkun.css` は `<head>` の `<link>` で読み込むこと（v2 の `<style>` は mount 時に `<head>` の末尾へ追加される）。
- v1 の `style.css` には `p` / `h1-h6` / `input[type=number]` などの非スコープ規則がある。`mokkun-v2.css` は `.mokkun-v2` 配下でそれらを打ち消す。

## 同じ container への二重 mount

同じ container に、前の `V2Controller` を `destroy()` せずに続けて `mountViewV2` すると、前の mount が付けたイベントが残って重複して結線される
（ボタンを 1 回押すと `onAction` が 2 回呼ばれる、など）。作り直すときは先に `destroy()` を呼ぶ（`Mokkun.init` と ビューアーは行っている）。

## 判断の記録

- v1 のテーマ機構は v2 では使わない。見た目は DADS のトークンで決まる。
- 確認画面など sticky のボタンが 1 つだけのときは、帯を右寄せの小さな箱（`data-compact`）にして、左側に大きな空白ができないようにする。
- 状態は「画面ごとに 1 つ選んで見る」もの。success と error を常に同時に描くと、実際には起きない画面を見せることになるため、既定は何も出さない。
- 上流の input-text に単位の部品はないため、`unit` は DADS のトークンだけで整えた `.mk2-unit`（`mokkun-v2.css`）で描く。
- フォントは Noto Sans JP を Google Fonts から読み、取得できなければ OS のサンセリフに落ちる。
- 例示（example）を placeholder にしないのは DADS の入力欄ガイドラインに沿うため。

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
├── view.ts             View 層: 見出し、ゴール、手順ナビ、状態バナー、アクション
├── section.ts          Section 層: kind / reveal / repeatable の出し分け
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
- 通知: `notification-banner`（app.notifications の variant に対応）をメイン領域の先頭に。
- モバイル（ハンバーガー + ドロワー）は今回対象外。

### Flow
- 画面が flow.steps に含まれ progress が stepper なら、見出しの下に `step-navigation`（horizontal）。
  手前の step は `completed`、現在の step は `reached`、以降は状態なし。
- action.confirm は `modal-dialog`。静的 HTML に `<dialog>` を含め、mount 時にボタンから開く。
  danger のときは確定ボタンを危険色にする（button.css のカスタムプロパティ `--button-color` を上書き）。

### View
- `heading` の h1 にタイトル。goal は見出し直下の補足文（`dads-heading` の shoulder/説明の仕組みに従う）。description はその下。
- states.success / error / warning / info は `notification-banner`。
- primaryAction は `button` solid-fill、lg。secondaryActions は outline、md。placement: header は見出し行の右、footer と sticky はフォーム末尾（sticky は下端固定。`mokkun-v2.css` で実装）。
- layout: tabs は `tab`、sectioned は `toc` を右（または上）に置く。stack は縦並び。

### Section
- 見出しは `heading` の h2（レベルは View 内で固定）。purpose は見出し下の補足文、note は `notification-banner` の info ではなく **support-text 相当の段落**（うるさくしない）。
- kind: form → `fields` をグリッドに。`columns` でグリッド列数（1〜3）。各 Field は自身の幅（DADS の `data-size` や `width`）を優先。
- kind: list → `table`（ソート可能列は sortable-header の見出し）。行は `renderer/utils/dummy-data.ts` を使って 3 行のダミー。rowActions は各行末尾の `button` text sm。下に `page-navigation`。`empty` は行が 0 のときの表示文。
- kind: readonly / summary → `description-list`。
- reveal: collapsed → `accordion`（見出しがアコーディオンのサマリーになるので、重複見出しは出さない）。
- repeatable → 各繰り返しを枠付きグループ（h3「#n」+ 削除ボタン outline sm）、末尾に「追加」ボタン outline md。min 件を初期表示。
- visibleWhen → `data-visible-when` を付け、mount 時に参照先の値で表示・非表示を切り替える（初期表示は参照先の default で評価）。

### Field
- すべて `form-control-label` でラップ（label / requirement / support-text / field）。
  required は `data-required="true"`。任意表示の有無は form-control-label.md の指針に従う。
- support-text には help、whyRequired、format、example を「例: …」の形で結合する。**placeholder は使わない**（DADS の指針に合わせ、例示はサポートテキストに置く）。
- エラー表示は `props.error`（文字列）があるときのみ、その部品の error-text に出す。

| component | 条件 | DADS 部品 |
|---|---|---|
| text | | input-text |
| number | | input-text type=number（inputmode=numeric） |
| textarea | | textarea |
| date | | date-picker（consolidated）|
| date | inline | calendar |
| time | | input-text type=time |
| duration | | input-text type=number + 単位（props.unit、既定「分」） |
| file | | file-upload |
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
| timeline | | list（ol）に日時とタイトル |
| map | | image の枠に「地図」プレースホルダー |

## 公開 API

```ts
renderViewV2(schema: MokkunV2Schema, viewName: string): string
mountViewV2(container: HTMLElement, schema: MokkunV2Schema, viewName: string,
            callbacks?: { onNavigate?: (view: string) => void }): V2Controller
interface V2Controller { destroy(): void }
```

`parseV2Document(yamlText)` が検証済みの `MokkunV2Schema` を返す。`lib.ts` の `Mokkun.init` と `main.ts` のビューアーは、
文書が v2 なら v2 レンダラーを使う。画面切替セレクタはそのまま使える。

## CSS の読み込み方

- DADS の `global.css` は `html` / `a` / `:focus-visible` などの要素セレクタと `:root` のトークンを含む。ライブラリの `mokkun.css` に含めると v1 画面まで再スタイルされるため、`dads.css` と `mokkun-v2.css` は `?inline` で文字列として取り込み、v2 を mount している間だけ `<style id="mokkun-v2-styles">` として挿入する（最後の view を destroy すると外れる。画面遷移では古い view を外す間も保持し、付け直さない）。
- `dads.css` の先頭は Google Fonts（Noto Sans JP）の `@import url(...)`。mount 時にこの外部 URL へ接続するため、CSP を設定する環境では `style-src` に `https://fonts.googleapis.com`、`font-src` に `https://fonts.gstatic.com` が必要。取得できなければ OS のサンセリフにフォールバックする。
- `:where(.mokkun-v2)` によるリセットは詳細度が v1 の要素セレクタ（`p` / `h1-h6`）と同じで、「後から挿入される v2 の `<style>` が勝つ」ことに依存する。そのため `mokkun.css` は `<head>` の `<link>` で読み込むこと（v2 の `<style>` は mount 時に `<head>` の末尾へ追加される）。
- v1 の `style.css` には `p` / `h1-h6` / `input[type=number]` などの非スコープ規則がある。`mokkun-v2.css` は `.mokkun-v2` 配下でそれらを打ち消す。

## 判断の記録

- v1 のテーマ機構は v2 では使わない。見た目は DADS のトークンで決まる。
- フォントは Noto Sans JP を Google Fonts から読み、取得できなければ OS のサンセリフに落ちる。
- 例示（example）を placeholder にしないのは DADS の入力欄ガイドラインに沿うため。

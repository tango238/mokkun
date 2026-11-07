# 新フォーマット: レイヤー基準と振り分け表

TeamKit の ui.yaml を起点にした旧フォーマットは、Component と View の間に
UX 判断を置く層がなく、部品を列挙するだけのモックになりやすかった。
新フォーマットは「目的の抽象度」で6層に分け、各層に固有の UX 判断を割り当てる。

## 6層

| 層 | 目的の種類（動詞） | 名前の付け方 | 「完了」の単位 | 知ってよいこと |
|---|---|---|---|---|
| App | 横断。「どこへでも行ける」「今どこにいるか分かる」 | アプリ名 | なし | 全 View、ロール、共通レイアウト、メニュー |
| Flow | 業務成果。「受注を登録し確定する」 | 業務プロセス名 | 業務上の状態が変わった | 画面の順序、分岐、確認、完了、中断と再開 |
| View | 1つのゴール。「注文を作る」 | ゴール名 | 画面を離れる | 主アクション、画面内ナビ、空・エラー・読込状態 |
| Section | 小タスク。「配送先を指定する」 | 動詞＋名詞 | ユーザーが一息つき確認できる | 項目同士の関係、順序、条件表示、既定値 |
| Field | 情報の授受。「住所を伝える」 | 業務の名詞 | 1つの値が埋まった | データ項目1つ分。形式、必須、例、ヘルプ、エラー文言 |
| Component | UI操作。「入力する」「押す」 | UIの名詞 | なし | 見た目と操作だけ。業務語彙を持たない |

### 層を決めるルール

1. **動詞テスト**: 目的を一文で書いたときの動詞がどの層の種類か。
2. **共設計ルール**: 互いを知らないと設計できない2要素は、1つ上の層の同じ親に入れる。子の個数は判定に使わない。
3. **UX判断の割当**: 各層に閉じる UX 判断を固定する。

| 層 | その層に閉じるUX判断 |
|---|---|
| App | 情報設計（メニューの分類・命名・深さ）、現在地の示し方、要素の定位置、ロール別表示 |
| Flow | 手順数、確認と完了の有無、取り消し、途中保存、戻れる場所 |
| View | 情報の優先順位、主アクションは1つ、初期表示で見える範囲、空状態 |
| Section | 項目の順序とグルーピング、必須と任意の分離、段階的開示、既定値 |
| Field | ラベル文言、入力形式、例示、必須理由、エラー文の言い回し |
| Component | アフォーダンス、状態表現、アクセシビリティ |

ナビゲーションは3種類あり、別の層に住む。

| 種類 | 目的 | 層 | 中身を決めるもの |
|---|---|---|---|
| グローバルナビ | アプリ内のどこへでも行ける | App | メニュー定義 |
| 手順ナビ（ステッパー） | 業務の何歩目かが分かる | Flow | 画面の順序 |
| 画面内ナビ（タブ、セクションナビ） | 画面内のどこを見るか | View | Section の並び |

## 既存44タイプの振り分け

「層」は新フォーマットでその定義が置かれる場所。描画に使う部品は別途 Component として残る。

### Component に残るもの（32）

| タイプ | 区分 | 新フォーマットでの扱い | 根拠 |
|---|---|---|---|
| text | 入力 | Field の `component: text` | 動詞は「入力する」。業務語彙なし |
| number | 入力 | Field の `component: number` | 同上 |
| textarea | 入力 | Field の `component: textarea` | 同上 |
| date_picker | 入力 | Field の `component: date` | 同上 |
| calendar | 入力 | date の `inline: true` variant に統合 | 目的が date_picker と同じ。表示方法の違いだけ |
| time_picker | 入力 | Field の `component: time` | 同上 |
| duration_picker | 入力 | Field の `component: duration` に統合 | duration_input と目的が同じ |
| duration_input | 入力 | 同上 | 同上 |
| file_upload | 入力 | Field の `component: file` | 同上 |
| image_uploader | 入力 | file の `accept: image` variant に統合 | 目的が file_upload と同じ |
| photo_manager | 入力（複合） | Field の `component: photo_grid` | 追加・並べ替え・削除を共設計するので1部品。目的は「写真を伝える」で Field |
| select | 選択 | Field の `component: select` | 動詞は「選ぶ」 |
| multi_select | 選択 | Field の `component: select` + `multiple` | 同上 |
| combobox | 選択 | Field の `component: combobox` | 同上 |
| radio_group | 選択 | Field の `component: radio` | 同上 |
| checkbox | 選択 | Field の `component: checkbox` | 同上 |
| checkbox_group | 選択 | Field の `component: checkbox` + `multiple` | 同上 |
| toggle | 選択 | Field の `component: toggle` | 同上 |
| segmented_control | 選択 | select の `variant: segmented` | 目的は単一選択。表示方法の違いだけ |
| browser | 選択 | Field の `component: browser` | 階層から1つ選ぶ。選択部品 |
| dropdown | 操作 | アクション群の `variant: menu` | 中身はアクション。Field ではなく View の actions に付属 |
| pagination | 操作 | data_table Section の内部部品 | 単独で目的を持たない |
| badge | 表示 | 表示 Field の `component: badge` | 状態を示す。chip / status_label と役割重複 |
| chip | 表示 | 表示 Field の `component: chip` | 同上。統合候補 |
| status_label | 表示 | 表示 Field の `component: status` | 同上。統合候補 |
| line_clamp | 表示 | 表示 Field の `clamp: n` 属性 | テキスト表示のオプション |
| definition_list | 表示 | Section の `mode: readonly` の既定描画 | 項目群の読み取り表示。定義は Section 側 |
| timeline | 表示 | 表示 Field の `component: timeline` | 「経緯を知る」情報の授受。項目は業務データ |
| google_map_embed | 表示 | 表示 Field の `component: map` | 所在地という Field の表示方法 |
| information_panel | 補助 | Section の `note` または Field の `help` | Section 内の補足説明 |
| tooltip | 補助 | Field の `help` の表示方法 | 単独で fields に並べるものではない |
| loader | 補助 | View の `state: loading` の描画部品 | 状態は View が持つ。部品は内部 |

### Section の属性に吸収されるもの（5）

| タイプ | 新フォーマットでの扱い | 根拠 |
|---|---|---|
| heading | Section の `title` | 見出しはまとまりの名前。fields に並ぶのは層違い |
| disclosure | Section の `reveal: collapsed` | 段階的開示は Section の UX 判断 |
| accordion_panel | Section の `reveal: collapsed`（複数 Section の束ね） | 同上 |
| repeater | Section の `repeatable: true` | 「明細を追加する」小タスク。項目群の繰り返し |
| data_table | Section 種別 `list`（検索・並び替え・行アクションを内包） | 「探して選ぶ」小タスク。列と行アクションを共設計する |

### View に移るもの（4）

| タイプ | 新フォーマットでの扱い | 根拠 |
|---|---|---|
| tabs | View の `sections` の束ね方 `layout: tabs` | 画面内ナビ。中身は Section の並び |
| section_nav | View の `layout: sectioned` から自動生成 | 同上。手書きしない |
| float_area | View の `primary_action.placement: sticky` | 主アクションの置き場は View の UX 判断 |
| response_message | View の `states.success / error` | 送信結果は画面の状態 |

### Flow に移るもの（2）

| タイプ | 新フォーマットでの扱い | 根拠 |
|---|---|---|
| stepper | Flow の `steps` から自動生成 | 手順ナビ。中身は画面の順序 |
| delete_confirm_dialog | アクションの `confirm:` 設定 | 取り消せない操作の確認は Flow の UX 判断 |

### App に移るもの（1）

| タイプ | 新フォーマットでの扱い | 根拠 |
|---|---|---|
| notification_bar | App の `notifications`（枠の領域） | 全画面共通の通知。View の中に置けない |

## fields 以外の既存概念

| 既存概念 | 層 | 新フォーマットでの扱い |
|---|---|---|
| app_header, app_navi, navigation | App | `app.layout` と `app.navigation` に集約。View は現在地 `nav:` のみ申告 |
| common_components.layout / template | App | 共通レイアウト |
| common_components.action_group | View | アクション群のプリセット |
| common_components.field_group | Section | 再利用可能な Section パターン（住所、氏名など） |
| wizard, WizardStep | Flow | `flow.steps`。各 step は View を指す |
| actions (submit / navigate / custom / reset) | View | `primary_action` 1つと `secondary_actions`。navigate の遷移先は Flow が持つ |
| sections (FormSection) | Section | そのまま Section |
| layout (columns / type / gap) | Section | 項目の配置は Section の判断 |
| validations | Field | Field の `rules`。共通定義は参照 |
| actor | App / Flow | ロールとして App に定義、Flow が参照 |
| purpose | View | `goal` に改名 |
| description | View / Section | 説明文 |
| themes | 層外（テーマ） | DADS のスタイル層に対応 |

## 統合候補

同じ目的に複数の部品があるものは、Field の目的で1つにまとめ、部品側の variant で表現する。

- duration_picker + duration_input
- date_picker + calendar
- file_upload + image_uploader
- badge + chip + status_label
- select + segmented_control

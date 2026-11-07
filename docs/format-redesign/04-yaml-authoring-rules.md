# v2 YAML 生成ルール（DADS の UX 指針に基づく）

mokkun v2 フォーマット（`02-schema-v2.md`）で画面モックを **生成する側**（人でも LLM でも）が守るルール。
根拠はデジタル庁デザインシステム（DADS）β版 v2 の公式文書で、出典は `reference/` の抽出ノートに対応する。
各ルールには ID を振る。`[必須]` は違反するとモックとして成立しないもの、`[推奨]` はよほどの理由がなければ守るもの。

出典の略記: `C:<component>` は `reference/dads-components-ux.md` の該当コンポーネント、
`F:<section>` は `reference/dads-foundations-ux.md` の該当セクション。DADS に記述がない事項は「実務慣行」と明記し、DADS を根拠にしない。

改訂履歴: 第2版（2026-11-07）。2 つの業務シナリオ（住民向け申請、業務システム管理画面）でこの文書だけを渡して生成し、
出てきた迷い・DADS 違反 90 件を §13 の手順で反映した。
第2版の追補（2026-11-07）: 文書が前提としていたスキーマ・レンダラーの機能（§11）とビューアーの機能（§12）を実装し、
暫定の書き方を本文から外して、新しいキー（`list.bulkActions`、`Action.role`、`Section.actions` ほか）で直接書く形にした。

---

## 0. 生成の手順

YAML は上の層から順に決める。下の層を先に書くと部品の列挙になり、旧 TeamKit 形式と同じ失敗をする。

1. **Flow を決める。** 業務成果（outcome）を一文で書き、画面の順序に分ける。入力→確認→完了が基本形（R-F01）。1 画面で完結する操作は Flow にしない（R-F11）。
2. **View を決める。** 画面ごとにゴールを一文で書き、§9 の「画面の型」から型を選ぶ。1 画面の主アクションは 1 つ以下（R-V01）。
3. **Section を決める。** ゴールに至る小タスクに分け、入力 Section は動詞＋名詞、表示 Section は名詞句で名付ける（R-S01）。関連の強い項目は同じ Section に置く。
4. **Field を決める。** 項目ごとに「何を聞くか」を決めてから、§5.1 の表で component を選ぶ。定番項目は §8 のパターンをそのまま使う。
5. **文言を書く。** ラベル、サポートテキスト（help / format / example / whyRequired）、ボタンラベル（R-W09 の定型）、エラー文を §6 の規則で書く。
6. **自己点検。** §7 のチェックリストを通す。

---

## 1. App 層のルール

| ID | ルール | YAML での表現 | 出典 |
|---|---|---|---|
| R-A01 [必須] | グローバルナビに載せるのは入口になる View（一覧・ダッシュボード・新規作成・設定）だけ。詳細・編集・確認・完了のように対象や途中の状態を前提とする View は載せない。ラベルは遷移先の画面名にし、title が長いときだけ短くした `label` を書く。「詳細」「その他」のような抽象語を使わない | `navigation[].items[]` は入口 View のみ。`label` は省略して title を使うか、その短縮形 | C:水平メニュー |
| R-A02 [推奨] | メニューの階層は group → view の 2 段までにし、3 段以上作らない | `navigation` は group と items の 2 段のみ | C:モバイルメニュー, C:水平メニュー |
| R-A03 [推奨] | 項目数が多いときは group で整理する。1 つの group に view を詰め込みすぎない | group を目的別に分ける | C:水平メニュー |
| R-A04 [必須] | 全画面共通の通知は、メンテナンスや制度変更など全利用者に関係する常設・長期の情報に限る。処理完了やステータス変化は通知に使わない。毎日の定常処理は通知にせず、影響を受ける画面の description か note に書く。期限のある通知には `until`（掲示期限。過ぎると描かれない）、特定のロールにだけ関係する通知には `role` を付ける | `app.notifications` はメンテナンス予告など。処理結果は View の `states` に書く。`until: "2026-11-20"`、`role: "本部管理者"` | C:ノティフィケーションバナー |
| R-A05 [推奨] | 通知の文言は内容が一目で分かる具体的な文にし、日付は「本日」ではなく「2026年11月20日」のように絶対日付で書く。期限のある情報は期限を本文に入れる | `notifications[].message` | C:ノティフィケーションバナー, C:緊急時バナー |
| R-A06 [推奨] | 閉じられる通知にするのは、閉じた状態を記憶でき再表示の手段がある場合だけ | `dismissible: true` は乱用しない | C:ノティフィケーションバナー |
| R-A07 [推奨] | ヘッダーにはシステム名・利用者名・テナントなど、どの画面でも必要な情報だけを置く | `app.header` | C:ヘッダーコンテナ, C:ユーティリティリンク |
| R-A08 [推奨] | 通知の variant は内容の性質で選ぶ（失敗＝error、注意喚起＝warning、案内＝info）。success は通知に使わず View の states に書く | `notifications[].variant` | C:ノティフィケーションバナー（タイプ） |
| R-A09 [必須] | role はロールが 2 つ以上あるときだけ書く。`role` の省略は「全ロールが使える」を意味する。Flow に role があれば steps の View は同じ role を継承するので View には書かない。ロール専用の操作・ナビは共有 View・共通ナビに置いたまま `Action.role` / `NavGroup.role` で絞る（View ごと別にする必要があるのは、画面の中身が違うときだけ）。値は `app.roles` にあるものだけで、省略は全ロール | `app.roles`, `flows.*.role`, `views.*.role`, `Action.role`（Section.actions・list.bulkActions の action も）, `NavGroup.role` | 実務慣行 |
| R-A10 [推奨] | 命名規則。view 名は `<対象>_<画面の型>`（`_list` / `_detail` / `_form` / `_edit` / `_confirm` / `_done`）。item は英語の camelCase の業務名詞にし、主体が複数ある画面では主体を接頭辞にする（`applicantName`, `childName`）。同じ業務項目は入力・確認・一覧列・詳細で同じ item／列 id を使う。Section id は短い名詞、Action id は動詞（`save`, `submit`, `cancel`, `back`） | `views` のキー, `item`, `list.columns[].id`, `Action.id` | 実務慣行 |

## 2. Flow 層のルール

| ID | ルール | YAML での表現 | 出典 |
|---|---|---|---|
| R-F01 [必須] | 複数画面にまたがる手続きは、論理的なステップに分けて提示する。入力→確認→完了が基本形 | `flows.<name>.steps` に view を順に並べる | C:ステップナビゲーション |
| R-F02 [必須] | ステップ名は中身が分かる具体名にする（「申込者の情報」「本人確認」）。番号だけにしない | `steps[].label` | C:ステップナビゲーション |
| R-F03 [推奨] | 自動変換や正規化した入力値（郵便番号から補完した住所など）は確認画面で見せ、ユーザーが承認または修正できるようにする | 確認 View を §9 の型で作る | C:インプットテキスト |
| R-F04 [必須] | 完了やステータス変化はモーダルで知らせない。完了画面か成功バナーで伝える | 完了 View に `states.success` を書く | C:モーダルダイアログ, C:ノティフィケーションバナー |
| R-F05 [必須] | 確認ダイアログ（`confirm`）は、取り消せない操作の押し間違い防止に限って使う。確認画面の直後の確定ボタンに重ねない。入力の破棄（キャンセル）に付けるのは、入力内容が失われ下書きにも残らない場合だけで、`resumable: true` の Flow や下書き保存がある画面では付けない。message には失われる対象と行き先を書く | `confirm: { message }` | C:モーダルダイアログ |
| R-F06 [推奨] | 確認ダイアログだけを安全対策にしない。取り消し・復元できる設計を先に検討し、できるなら `confirm` を省く | 削除後に「元に戻す」導線を置けるなら `confirm` を省く | C:モーダルダイアログ |
| R-F07 [推奨] | `resumable: true` にするのは、入力項目が 20 を超える／書類の添付がある／入力ステップが 2 つ以上ある／現場作業と並行して入力する、のいずれかに当たる手続き。付けたら各入力 View に「下書き保存する」を secondary で置く | `resumable`, `secondaryActions` | C:ステップナビゲーション。閾値は実務慣行 |
| R-F08 [推奨] | 一時的な処理待ちはステップではなくローディング状態で表す | `states.loading` | C:プログレスインジケーター |
| R-F09 [推奨] | 入力の多い手続きは、主体（申込者／対象者）、準備物（書類の添付）、同意など意味のまとまりで入力ステップを分ける。1 入力画面の目安は Section 5 つ・入力項目 15 個まで | 入力 View を複数の step に分け、`label` を具体名にする | C:ステップナビゲーション。数値は実務慣行 |
| R-F10 [必須] | 同じ形の入力の繰り返し（棚卸し・明細）をページで区切っても、ページを step にしない。step は意味の違う段階に限る。行が決まった作業表は 1 画面の固定行の表（`columns[].field`）にする | `steps[].label` に「1ページ目」を使わない | C:ステップナビゲーション, C:ページナビゲーション |
| R-F11 [推奨] | 1 画面で完結する操作（編集・招待・ロール変更）は Flow にしない。保存後は戻り先の View（詳細か一覧）に遷移する前提で、その View の `states.success` に対象名入りの結果を書く | `primaryAction.kind: submit`、戻り先 View の `states.success` | C:ノティフィケーションバナー。戻り先は実務慣行 |
| R-F12 [必須] | 破壊的な操作は `style: danger` を書き、`confirm` には `message` だけを書く。`confirm.danger` は旧フォーマットへの変換用で、新しく書かない | `style: danger` + `confirm: { message }` | 実務慣行（記法の一本化） |

## 3. View 層のルール

| ID | ルール | YAML での表現 | 出典 |
|---|---|---|---|
| R-V01 [必須] | 主アクション（塗りボタン）は 1 画面に最大 1 つ。閲覧専用の画面（詳細・ダッシュボード）で、ナビと同じ遷移しか候補がないときは省略してよい。破壊的な操作を主アクションにしない | `primaryAction` は 0 または 1 | C:ボタン |
| R-V02 [必須] | `style: secondary` の副アクションは同時に 3 つまで。tertiary と danger はこの数に含めず、それぞれ 1 つまで。4 つ以上になるならフローを見直す | `secondaryActions` | C:ボタン |
| R-V03 [必須] | tertiary（テキストボタン）は手続きをやめる「キャンセル」だけに使い、1 画面 1 つまで。確認画面の「入力に戻る」や「前のページに戻る」は修正のための遷移なので secondary にする（View の副アクションのときの文言。Section の見出し行に置く修正は R-T04 の「〇〇を修正する」） | `style: tertiary` / `style: secondary` | C:ボタン |
| R-V04 [推奨] | 進む操作は右、キャンセルは左に置く。配置は描画側が担うので、生成側は style を正しく付けるだけでよい | `style` | C:ボタン |
| R-V05 [必須] | ボタンを無効化しない。押せない理由があるなら、押下時にエラーで何をすべきか案内する | `disabled` 相当のキーを使わない。`states.error` に案内文を書く | C:ボタン |
| R-V06 [必須] | ボタンにはテキストラベルを必ず付ける | `label` は必須 | C:ボタン, F:色とアイコン |
| R-V07 [必須] | 画面タイトル（h1）はページの主題。ゴールは別に `goal` として書き、タイトルに混ぜない | `title`, `goal` | C:見出し |
| R-V08 [推奨] | 画面の説明は、ユーザーがこれから何をするかを 1〜2 文で書く。読まなくても進める補足は Section の note に回す | `description` | C:注釈ブロック |
| R-V09 [必須] | 画面のエラーメッセージは、何件のどの項目に問題があるかを書く（「＊2件の項目を確認してください。保護者の電話番号、勤務先名」）。「入力に誤りがあります」「赤字の項目」のように、曖昧な文や色だけで場所を示さない。項目ごとの `props.error` は代表的な 1〜2 項目に書けば足りる。`props.error` は error の状態のときだけ描かれる（通常の状態では出ない。ビューアーの「状態」で確かめる） | `states.error.message`, `props.error` | C:インプットテキスト, F:色とアイコン |
| R-V10 [推奨] | 成功メッセージは何が完了したかを対象名・件数入りで書く（「受注 #10234 を登録しました」） | `states.success.message` | C:ノティフィケーションバナー |
| R-V11 [推奨] | layout の選び方。入力画面で Section が 4 つ以上なら `sectioned`。詳細画面は `stack` を既定とし、各観点が長く同時に見比べる必要がないときだけ `tabs`。最初に見る情報（状態・基本情報）を 2 枚目以降のタブに置かない。絞り込みや手続きの進行にタブを使わない | `layout` | C:タブ, C:目次。閾値は実務慣行 |
| R-V12 [推奨] | 一覧画面の主アクションは新規作成。新規作成がない一覧では主アクションを省略し、選択した行への操作は一括操作（`list.bulkActions`、`selection: multiple` のとき）として書く。絞り込み Section は、想定件数が 1 ページ（pageSize）を超えるときだけ置き、条件がキーワード 1 つで済むなら `list.search: true` だけにする | `primaryAction`, `list.bulkActions`, 絞り込み Section, `list.search` | C:テーブルコントロール, C:テーブル |
| R-V13 [必須] | 破壊的な操作（取り下げ・削除・廃番・無効化）は、対象の詳細画面に `style: danger` の副アクションとして 1 つ置く。一覧の行や別タスクの画面には置かない。confirm の message には対象名、起きること、元に戻せるかを書く。ラベルは「申込を取り下げる」のように動詞で具体的に書く（ダイアログの確定ボタンにも使われる）。理由の入力が要るなら confirm ではなく別 View にする。操作できる状態が限られるなら、その条件を description に書く | `secondaryActions[]` + `style: danger` + `confirm.message` | C:モーダルダイアログ。置き場所は実務慣行 |
| R-V14 [推奨] | placement はアプリ内で統一する。入力・確認・完了画面は `footer`（項目の多い入力画面だけ `sticky`）、一覧の新規作成は `header` | `placement` | C:ボタン。割当は実務慣行 |
| R-V15 [必須] | goal を達成する Section と操作が画面にあるかを確かめる。description はデータの有無を前提にしない（「締切が近い店舗があります」ではなく「締切まで 3 日以内の店舗を表示します」）。同じ業務状態を変える操作を 2 か所に作らない | `goal`, `description`, `sections` | 実務慣行 |
| R-V16 [推奨] | ダミー値は架空の氏名、`example.jp` などの例示用ドメイン、実在しない番号で書く。入力画面の `example` と、確認・完了・詳細の `value` を同じ値にする。条件分岐がある手続きでは表示項目がいちばん多いケースを確認画面に書き、description に「就労の場合の表示例」と添える。仮に置いた制限値は help と rules の両方に書く | `example`, `value`, `description`, `rules` | 実務慣行 |

## 4. Section 層のルール

| ID | ルール | YAML での表現 | 出典 |
|---|---|---|---|
| R-S01 [必須] | Section の title は、入力 Section（kind: form）は「動詞＋名詞」（「申込者の情報を入力する」）、readonly／summary／list は名詞句（「申込者の情報」「受け付けた申込」）にする。入力と確認で同じ名詞部分を使い、step の label・View の title・ナビのラベルも同じ呼称にそろえる。見出しレベルは描画側が固定するので YAML で階層を作らない | `title`, `steps[].label` | C:見出し, C:目次 |
| R-S02 [推奨] | 関係の異なる項目群（本人情報と連絡先、商品情報と販売設定）は Section を分ける。1 Section の項目は目安 7 個以内（repeatable の 1 行は 1 項目と数える）。1 項目だけの Section は作らず近い Section に入れる（同意は例外）。1 View の Section は 5 つまでを目安とし、超えるならステップ分割（R-F09） | `fields`, `sections` | F:余白（関係性の明示）。数の目安は実務慣行 |
| R-S03 [必須] | 重要な情報や入力必須の項目を折りたたまない。折りたたみは「読まなくても手続きを進められる補足」や「詳細オプション」に限る | `reveal: collapsed` は任意項目だけの Section に限る | C:アコーディオン, C:ディスクロージャー, C:注釈ブロック |
| R-S04 [必須] | 折りたたむ Section の title は中身を要約した名詞句にする。「詳細を見る」「もっと見る」のような動作だけの表現にしない | `title` | C:ディスクロージャー |
| R-S05 [推奨] | 表示領域を小さくするためだけに折りたたまない。任意の 1 項目のためだけに `reveal: collapsed` の Section を作らない | `reveal` の濫用禁止 | C:アコーディオン, C:ディスクロージャー |
| R-S06 [必須] | 名前と値のペアを見せる画面（確認画面、詳細画面）は `kind: readonly`（説明リスト）で作り、入力欄の readonly で代用しない | `kind: readonly` + `fields[].value` | C:説明リスト, C:インプットテキスト |
| R-S07 [必須] | 行と列で比較・一覧するデータは `kind: list`（テーブル）。名前と値のペアにはテーブルを使わない | `kind: list` | C:テーブル |
| R-S08 [推奨] | テーブルの列は 1 行 1 レコードで、入れ子や結合を避ける。並び替えできる列だけ `sortable: true` | `list.columns` | C:テーブル |
| R-S09 [推奨] | 一覧の絞り込みはキーワード検索と少数の条件（3 つまで）に留め、複雑な検索は別 Section にする | `list.search`, 絞り込み Section | C:テーブルコントロール, C:検索ボックス |
| R-S10 [推奨] | 一覧の空状態には「何がないか」と「次にできること」を書く（「申込はまだありません。「新規に申し込む」から申し込めます」）。絞り込みで 0 件の文言と分ける。`list.empty` を正とし、同じ文言を `states.empty` に重ねない | `list.empty` | C:テーブル, C:ページナビゲーション。次の行動の案内は実務慣行 |
| R-S11 [推奨] | 繰り返し入力（明細など）は `repeatable` にし、追加ボタンのラベルに対象を入れる（「明細を追加」）。行が決まっていて値だけ入力する表（棚卸しの実数入力）は `repeatable` ではなく `kind: list` の `rows` と、入力列（`columns[].field`、text / number / select / checkbox）で書く | `repeatable.addLabel`, `list.rows`, `columns[].field` | C:ボタン |
| R-S12 [推奨] | Section の note は「読まなくても進める補足」に限り、入力条件や制約は Field の help / format に書く | `note` vs `help` | C:注釈ブロック |
| R-S13 [推奨] | columns は 1 を基本とする。2〜3 を使ってよいのは (1) 郵便番号＋住所のような一組、(2) 一覧の絞り込み Section（3 項目まで）、(3) repeatable の 1 行（text・number・select・combobox だけ。radio・textarea を含む行は 1 列） | `columns` | C:インプットテキスト（整列）, F:余白 |
| R-S14 [推奨] | 条件で表示する項目が 2 つ以上のまとまりなら Section の visibleWhen、1 つなら Field の visibleWhen にする。参照先の help には、どの選択肢で何が出るかをすべて書く。複数の選択肢で出すなら `in`、「〇〇以外」なら `notEquals` を使う（1 つの条件に `equals` / `notEquals` / `in` のどれか 1 つ） | `visibleWhen`（`equals` / `notEquals` / `in`）, 参照先の `help` | C:インプットテキスト。使い分けは実務慣行 |
| R-S15 [推奨] | `kind: summary` は集計値（件数・合計・KPI）を見せるときに使い、label に単位を入れる。名前と値のペアは `kind: readonly` にする | `kind` | C:説明リスト。summary の定義は実務慣行 |

## 5. Field 層のルール

### 5.1 component の選び方

選択肢の数は、画面に出る選択肢（「すべて」「あてはまるものはない」を含む）で数える。

| 聞きたいこと | 条件 | component | 出典 |
|---|---|---|---|
| 1 行の文字 | | `text` | C:インプットテキスト |
| 数値 | | `number` | C:インプットテキスト |
| 自由記述 | まず質問を分割できないか検討する | `textarea` | C:テキストエリア |
| 1 つを選ぶ | 選択肢 5 個以下 | `radio` | C:セレクトボックス, C:ラジオボタン |
| 1 つを選ぶ | 選択肢 6 個以上 | `select` | C:セレクトボックス |
| 1 つを選ぶ | 6 個以上で利用者が名前を知っていて文字で探す対象（施設名・商品・カテゴリ）、またはおおむね 20 個を超える | `combobox` | C:コンボボックス。20 の目安は実務慣行 |
| 複数を選ぶ | | `checkbox` + `multiple: true`（`select` + `multiple` は使わない） | C:チェックボックス |
| はい／いいえ | 保存・送信で確定する | `checkbox` | C:チェックボックス, C:スイッチ |
| オン／オフ | 切り替えた瞬間に反映され、その場で結果が見える | `toggle` | C:スイッチ |
| 表示形式の切替 | 2〜3 択でその場で表示が変わる（リスト／カレンダー） | `select` + `variant: segmented`。絞り込みや入力には使わない | C:タブ, C:スイッチ |
| 日付 | 既知の日付（生年月日、有効期限） | `date`（calendar・inline なし） | C:日付ピッカー |
| 日付 | 近い期間から曜日を見て選ぶ（予約日、希望日） | `date` + `props.calendar: true` | C:日付ピッカー |
| 時刻 | | `time` | — |
| ファイル | | `file`（画像は `accept: image`） | C:ファイルアップロード |
| 状態・分類の表示 | | `status` / `badge` / `chip` + `value` | C:チップラベル |

長いリストは、地域などで先に絞る質問を置けないか検討する（C:セレクトボックス）。

### 5.2 項目のルール

| ID | ルール | YAML での表現 | 出典 |
|---|---|---|---|
| R-I01 [必須] | すべての項目にラベルを付ける。ラベルは項目を端的に表す名詞 | `label` | C:インプットテキスト, C:テキストエリア |
| R-I02 [必須] | `required` は全項目に true／false を書く（省略しない）。描画側が「※必須」「※任意」を付けるので、help や label に「任意です」「必須」と書かない | `required` | C:インプットテキスト, C:日付ピッカー |
| R-I03 [推奨] | whyRequired は、個人情報・センシティブ情報（生年月日・電話・性別・勤務先など）や、用途を想像しにくい必須項目に書く。手続きの目的から明らかな項目には書かない | `whyRequired` | C:インプットテキスト。線引きは実務慣行 |
| R-I04 [必須] | 入力形式の条件はサポートテキストに書く。`example` には入力値の例だけを書き（「1000001」）、対象の説明（「商品名、SKU」）は label か help に書く。placeholder は使わない（v2 では `example` はサポートテキストに「例: 」付きで描画される） | `format`, `example`, `help` | C:インプットテキスト, C:日付ピッカー, C:コンボボックス |
| R-I05 [推奨] | 入力できる文字種を限定しない。全角・ハイフン有無などは受け入れて正規化する前提で、format には「全角でも可」「ハイフンなしでも可」のように書く | `format` | C:インプットテキスト, C:日付ピッカー |
| R-I06 [必須] | 文字数制限があるときは上限をラベルかサポートテキストに書き、同じ上限を rules にも書く。エラーで初めて上限が分かる状態にしない | `label` または `help` に「100文字以内」, `rules` | C:テキストエリア |
| R-I07 [必須] | 選択肢ラベルは具体的に。任意のラジオには「あてはまるものはない」のような無選択の選択肢を加える | `options` | C:ラジオボタン |
| R-I08 [必須] | `readonly` の入力欄は原則使わない。編集できない値は `kind: readonly` の Section か表示系 component で見せる | `readonly` を避ける | C:インプットテキスト |
| R-I09 [推奨] | やむを得ず `readonly` にするのは、同じ行に編集可能な項目と自動入力の項目が並ぶ場合などに限り、help に編集できない理由を書く | `readonly: true` + `help` | C:インプットテキスト |
| R-I10 [必須] | 文字入力欄を分割しない。メールアドレスを `@` の前後で分けず、電話番号・郵便番号も 1 項目にする。date の年・月・日 3 欄は DADS 日付ピッカーの標準構成で、分割には当たらない | 1 Field | C:インプットテキスト, C:日付ピッカー |
| R-I11 [推奨] | 日付はサポートテキストに「西暦で」と入力例を書く | `help: "西暦で入力してください。例）2026年11月14日"` | C:日付ピッカー |
| R-I12 [推奨] | 表示系（status / badge / chip）は色だけに頼らず `value` に状態の名前を入れる。variant は状態の意味で固定し（完了・承認＝success、要対応・却下＝error、処理中＝info、受付・下書き＝neutral）、同じ状態名には同じ variant を使い、色の種類を増やしすぎない。一覧の status 列は状態名から色を自動で決める（対応表は `03-renderer-v2.md` の「状態ラベルの色」。未〜・〜待ち・〜予定のような否定・保留は緑にも赤にもならない） | `value`, `variant` | C:チップラベル。割当例は実務慣行 |
| R-I13 [必須] | 条件表示（`visibleWhen`）は参照先の項目より後ろに置き、参照先の help で分岐を予告する。visibleWhen 付きの項目の `required: true` は「表示されているときだけ必須」を意味する。分岐先の required を書き忘れない。表示とは別の条件で必須になる項目（就労の場合だけ勤務先が必須で、求職でも欄は出る、など）は `required: false` + `requiredWhen` と書き、「※必須」が条件の成立中だけ出るようにする（`required: true` とは併用しない） | `visibleWhen`, `required`, `requiredWhen` | C:インプットテキスト。required の解釈は実務慣行 |
| R-I14 [推奨] | 項目ごとのエラー文は「＊」で始め、何をどう直すかを書く（「＊氏名をカタカナで入力してください」） | `props.error` | C:インプットテキスト |
| R-I15 [推奨] | 入力欄の幅は内容に見合わせる。目安: xs＝数量・時間数・年齢、sm＝郵便番号・金額・短いコード、md＝氏名・フリガナ・電話・SKU・短い select、lg＝メール・会社名・商品名・combobox、full＝住所・textarea。date・radio・checkbox・file には付けない | `width` | C:インプットテキスト（横幅）。対応表は実務慣行 |
| R-I16 [必須] | 選択肢に「その他」を置いたら、「その他」を選んだときだけ表示する記述欄を続ける。label に対象と上限を書く（「その他の理由（200文字以内）」） | `visibleWhen: { item: <選択項目>, equals: other }` | C:テキストエリア |
| R-I17 [推奨] | ほかの回答や既知の値から決まる項目を聞かない。理由から入庫・出庫が決まるなら理由だけを聞く | Field を作らない | C:テキストエリア。適用範囲は実務慣行 |
| R-I18 [推奨] | ログイン中の利用者や所属から分かる値（氏名・所属店舗）は `default` で初期入力し、変更できる入力欄にする。readonly にしない | `default` | C:インプットテキスト。初期入力は実務慣行 |
| R-I19 [必須] | file には、受け付ける形式（`accept`）・1 ファイルの容量上限（`maxSize`）・複数可か（`multiple`）を書く。形式と容量は描画側がサポートテキストに「形式: PDF・JPEG・PNG／1ファイル 10MB まで」と自動で足すので、help には足りない情報（ファイル数の上限、必要な書類が条件で変わるときの条件ごとの説明）だけを書く。help に形式・容量をすでに書いたときは重ねて足されない | `accept: [".pdf", "image/jpeg", "image/png"]`（または `image` / `pdf` / `document`）, `maxSize: "10MB"`, `multiple: true`, `help: "5ファイルまで"` | C:ファイルアップロード。記載項目は実務慣行 |
| R-I20 [推奨] | readonly・summary の value は表示用の書式で書く。日付「2026年11月7日」、電話「090-1234-5678」、金額「1,280円（税込）」、数量は単位付き。ISO 形式や単位のない数値を書かない | `value` | C:日付ピッカー。他の書式は実務慣行 |
| R-I21 [必須] | 同じ View の中で、同じ label の入力欄を複数作らない。繰り返す項目には対象名を入れる | `label` | 実務慣行 |

## 6. 文言のルール

| ID | ルール | 出典 |
|---|---|---|
| R-W01 [必須] | ボタンは動詞で終える具体名（「確認へ進む」「確定する」「明細を追加」）。「OK」「送信」だけで済ませず、「〜へ」で止めない | C:ボタン |
| R-W02 [必須] | 同じ意味のボタンは全画面で同じ文言にする。R-W09 の定型を使う | F:リンクテキストと文言 |
| R-W03 [必須] | リンクや遷移のラベルは行き先が分かる文にする。「こちら」「詳細」を単独で使わない | F:リンクテキストと文言, C:水平メニュー |
| R-W04 [必須] | エラー文は具体的に。「入力に誤りがあります」「正しく入力してください」を使わない | C:インプットテキスト |
| R-W05 [推奨] | サポートテキストは 1〜2 文、全角 40 文字程度まで。長い補足は Section の note へ | F:タイポグラフィ（行長） |
| R-W06 [推奨] | 通知・バナーのタイトルは内容そのもの（「登録期間が延長されました」）。「お知らせ」「重要」だけにしない | C:ノティフィケーションバナー, C:緊急時バナー |
| R-W07 [推奨] | 見出しと目次・ナビ・step のラベルは同じ文言にする | C:目次 |
| R-W08 [推奨] | 敬体で統一し、ユーザーへの依頼は「〜してください」、システムの状態は「〜しました」で書く | 実務慣行 |
| R-W09 [必須] | 定型のボタン文言。確認へ: 「確認へ進む」／確定: 「申し込む」「登録する」「確定する」（対象を入れてもよい）／保存: 「保存する」／下書き: 「下書き保存する」／中止: 「キャンセル」（「やめる」と混ぜない）／修正（View の副アクション）: 「入力に戻る」「前のページに戻る」。修正（Section の `actions`）: 「〇〇を修正する」。この 2 つは置き場所で使い分け、View の副アクションに「〇〇を修正する」を、Section の actions に「入力に戻る」を書かない／一覧へ: 「〇〇一覧に戻る」「〇〇一覧を開く」／続けて: 「続けて〇〇する」／追加: 「〇〇を追加」。CSV・SKU など業務で通じる英字略語はそのまま使ってよい | C:ボタン（ラベル例）, F:リンクテキストと文言 |
| R-W10 [推奨] | checkbox の label は「〜する」の肯定形（「この商品を販売する」）。help で状態変更を説明するときは「チェックを外して保存すると」と書き、「オン／オフ」は使わない。業務で「オン／オフ」と呼ぶ項目でも、保存で確定するなら checkbox にする | C:チェックボックス, C:スイッチ |
| R-W11 [推奨] | ファイルを出力する操作は、ラベルに対象範囲と形式を入れる（「絞り込み結果を CSV でダウンロードする」） | F:リンクテキストと文言 |

## 7. 生成後のチェックリスト

- [ ] 各 Flow に outcome があり、steps が入力→確認→完了の形か。ページ分割を step にしていないか（R-F01, R-F10）
- [ ] 各 View の primaryAction が 1 つ以下、secondary が 3 つ以内、tertiary と danger が各 1 つ以内か（R-V01〜03）
- [ ] 確認画面の直後の確定ボタンに `confirm` を重ねていないか。danger は `style: danger` + `confirm.message` で書いたか（R-F05, R-F12）
- [ ] 破壊的操作が詳細画面の副アクションにあり、一覧の行や主アクションにないか（R-V13）
- [ ] 折りたたんだ Section に必須項目がないか（R-S03）
- [ ] 確認・詳細画面が `kind: readonly` で、入力欄の readonly で代用していないか（R-S06, R-I08）
- [ ] 確認画面に入力画面の全 Section・全項目（条件表示分を含む）があるか（R-T04）
- [ ] 選択肢 2〜5 個の select がないか。6 個以上の radio がないか。複数選択が checkbox か（§5.1）
- [ ] toggle の項目は切り替えた瞬間に反映されるものか。保存ボタンのある画面に toggle がないか（§5.1, R-T07）
- [ ] 全項目に label と required（true／false）があるか（R-I01, R-I02）
- [ ] 入力条件・例が help / format / example にあり、example が入力値の例だけか（R-I04）
- [ ] format／help が「半角」だけに限定せず、全角も受け付ける書き方か（R-I05）
- [ ] 文字数の上限を label／help に書いた項目は、rules にも同じ上限があるか（R-I06）
- [ ] visibleWhen の参照先 help にすべての分岐を予告し、分岐先の required を書いたか（R-I13, R-S14）
- [ ] 「その他」の選択肢に記述欄が続いているか（R-I16）
- [ ] すべてのボタンラベルが動詞で終わり、R-W09 の定型と一致するか（R-W01, R-W02）
- [ ] error メッセージに「入力に誤りがあります」「赤字の」がないか（R-V09, R-W04）
- [ ] success メッセージに件数か対象名が入っているか（R-V10）
- [ ] ナビのラベルが画面名と一致し、入口 View だけが載っているか（R-A01）
- [ ] 同じ業務項目の item／列 id が全 View で同じか（R-A10）
- [ ] 各 View の goal を達成する Section と操作があるか（R-V15）
- [ ] 一覧に `empty` があるか（R-S10）
- [ ] 一覧の先頭列に `to`、状態列に `type: status`、`rows` に業務の状態名があるか（R-T01）
- [ ] 選択行への操作が `list.bulkActions` で、主アクションにしていないか（R-V12）
- [ ] 確認画面の各 readonly Section に「〇〇を修正する」の `actions` があるか（R-T04）
- [ ] ロール専用の操作・ナビ・通知に `role` があり、値が `app.roles` にあるか。ロールが 1 つの文書に `role` を書いていないか（R-A09, R-A04）
- [ ] 金額・件数・時間の項目に `unit` があり、label に単位を入れていないか（R-P06）
- [ ] 規約への同意に `links` があるか（R-P07）
- [ ] file に `accept` と `maxSize` があるか（R-I19）
- [ ] 年月だけの日付が `precision: month` か（R-P05）
- [ ] 表示と別の条件で必須になる項目が `requiredWhen` か（R-I13）
- [ ] 定番項目（氏名・メール・住所・電話・生年月日・同意）が §8 のパターンどおりか

## 8. 定番項目パターン

| ID | ルール | YAML での表現 | 出典 |
|---|---|---|---|
| R-P01 [必須] | 氏名は 1 項目にし、姓と名に分けない。help「氏と名を空白で区切ってください」。フリガナも 1 項目で、format「全角カタカナ（ひらがな・半角でも可）」。主体が複数ある画面では label に主体を入れる（「保護者の氏名」）。width: md | 下の例 | C:インプットテキスト（サポートテキスト例、文字種を限定しない） |
| R-P02 [必須] | メールアドレスは 1 項目。確認用の再入力欄を置かず、@ の前後で分けない。入力ミスは確認メールで確かめる前提にし、help にその旨を書く。width: lg | `help: "入力したアドレスに確認のメールを送ります"` | C:インプットテキスト |
| R-P03 [推奨] | 郵便番号（width: sm、format「ハイフンなしでも可」）→住所（width: full）→建物名・部屋番号（任意、width: lg）の順に置く。郵便番号と住所は columns: 2 で並べてよい。郵便番号から住所を補完するなら、住所の help で予告し、補完した値を確認画面で見せる。都道府県・市区町村を別の select に分けない | 下の例 | C:インプットテキスト（変化の事前告知、自動変換の結果の確認）。建物名の分離は実務慣行 |
| R-P04 [推奨] | 電話番号は 1 項目、format「ハイフンなしでも可」、width: md。必須にするなら whyRequired に用途を書く（「審査の連絡に使います」）。複数が要るなら項目を分け、label に種類を入れる | `component: text`, `format`, `whyRequired` | C:インプットテキスト。複数番号は実務慣行 |
| R-P05 [必須] | 生年月日など既知の日付は `component: date`（calendar・inline なし）、help「西暦で入力してください。例）1990年4月1日」。例示年は対象に合わせる。年月だけでよい項目（希望入所月、有効期限の年月）は `precision: month`（年と月の入力だけ）にし、help は「西暦で入力してください。例）2026年12月」。生年月日・氏名・住所・電話・メールの入力目的は `autocomplete`（`bday` `name` `street-address` `tel` `email` `postal-code`）で指定してよい | `component: date`, `precision: month`, `autocomplete`, `help` | C:日付ピッカー |
| R-P06 [推奨] | 金額は number で単位を `unit`（「円」）に書く（label に「（円）」を入れない）。税込か税抜かを label か help に書く。数量は number＋下限の rules（「＊1 以上の数を入力してください」）。width は金額 sm、数量 xs | `component: number`, `unit`, `rules` | C:インプットテキスト（単位の付随）。税込／税抜は実務慣行 |
| R-P07 [必須] | 同意は checkbox 1 つ（required: true）、label「利用規約に同意する」、規約へのリンクを `links`（`{ label, href }`）で付ける。置き場所は入力の最後の Section か、確認画面の確定ボタンの直前。確定ボタンに含めるなら「利用規約に同意して申し込む」として checkbox を置かない | 下の例 | C:ボタン（例「利用規約に同意して新規登録する」）, F:リンクテキストと文言。置き場所は実務慣行 |
| R-P08 [推奨] | 性別などのセンシティブな項目は、業務上必要な場合だけ聞く。聞くなら whyRequired で用途を書き、選択肢に「回答しない」を置く | `component: radio`, `whyRequired` | 実務慣行 |

```yaml
# R-P01 / P03 / P07 の例
- item: applicantName
  label: "保護者の氏名"
  component: text
  required: true
  help: "氏と名を空白で区切ってください"
  example: "鈴木 花子"
  width: md
- item: postalCode
  label: "郵便番号"
  component: text
  required: true
  format: "ハイフンなしでも可"
  example: "1000001"
  width: sm
- item: address
  label: "住所"
  component: text
  required: true
  help: "郵便番号を入力すると市区町村まで自動で入ります。番地まで入力してください"
  example: "東京都千代田区千代田1-1"
  width: full
- item: building
  label: "建物名・部屋番号"
  component: text
  required: false
  width: lg
- item: agreeTerms
  label: "利用規約に同意する"
  component: checkbox
  required: true
  help: "「保育所入所申込の利用規約」を確認のうえ同意してください"
```

## 9. 画面の型

| ID | ルール | YAML での表現 | 出典 |
|---|---|---|---|
| R-T01 一覧 [推奨] | 構成は (1) 絞り込み Section（R-V12 の条件を満たすときだけ）と (2) `kind: list`。列の先頭に識別子（受付番号・商品名）を置き、その列に `to`（詳細 View）を付けてリンクにする。状態列は `type: status`（チップで描かれる。状態名と色の対応は R-I12）、日付列は `type: date`、数値列は `type: number`（右寄せ）にする。`list.rows` に業務の状態名を使った代表行を 3〜5 行書く（ダミー値の規則は R-V16。書かなければ同じ View の選択肢から状態名を借りたダミー行が出る）。sortable は日付・数値・識別子の列に付ける。識別子のセルを詳細へのリンクにしたら、行の「開く」は置かない（rowActions は `id` / `label` / `kind` / `to` だけで、`role`・`confirm` は持てない）。rowActions を置くなら 2 つまでとし、破壊的操作は置かない。pageSize は 20 を既定にする。empty は R-S10 に従う | `filter` Section（`actions` の「検索する」「条件をリセットする」。どちらも secondary で、tertiary はキャンセルだけ）＋`results`（`kind: list`、`columns[].type` / `to`、`rows`） | C:テーブル, C:テーブルコントロール。数値は実務慣行 |
| R-T02 詳細 [推奨] | 構成は (1) 状態 Section（識別子・状態の status・日付）、(2) 内容 Section（確認画面と同じ分け方と項目）、(3) 履歴（あれば。`component: timeline` の `value: [{ at, label, text }]` で、日時・出来事・補足を分けて書く）。layout は stack。編集できるなら「〇〇を編集する」を primary にし、破壊的操作は R-V13 に従う。nav は一覧 View にする | `kind: readonly` の Section を状態→内容→履歴の順に | C:説明リスト。構成は実務慣行 |
| R-T03 新規・編集 [推奨] | 新規と編集は同じ Section 構成・同じ item にする（`patterns` を `use` で共有してよい）。編集画面はナビに載せない。キャンセルは tertiary。保存後は詳細か一覧に戻る前提で、戻り先の states.success に対象名入りの結果を書く | `patterns`, `use` | 実務慣行 |
| R-T04 確認 [必須] | 入力画面と同じ Section 構成・同じ名詞の見出しで `kind: readonly` にし、条件表示で出た項目も含め全項目を載せる。選択肢の項目は value に表示ラベルを書く。repeatable の入力は `kind: list` で列に分け、1 つの値に「/」で詰めない。修正の導線は Section ごとの `actions`（「〇〇を修正する」、`kind: navigate` で入力 View へ。primary にはしない）として見出し行に置く。Section が 1 つだけの確認画面は、View の secondary「入力に戻る」でもよい（文言の使い分けは R-W09 と R-V03）。description に、確定すると何が起きるかを書く。確定ボタンに confirm を付けない | `kind: readonly` / `kind: list`, `Section.actions`, `description` | C:説明リスト（申請内容の確認画面）, C:テーブル, C:インプットテキスト。修正導線は実務慣行 |
| R-T05 完了 [必須] | title は完了した事実にする（「保育所入所の申込を受け付けました」）。states.success に、何が完了したかを対象名・件数入りで 1 文。控えるべき値（受付番号など）は `kind: readonly` に置く。「今後の流れ」Section に、次に起きること・時期・連絡の手段・問い合わせ先を書く。primary は次の行動（「〇〇一覧に戻る」か「続けて登録する」のどちらか。もう一方は secondary） | `states.success`, `kind: readonly`, `note` | C:ノティフィケーションバナー, C:モーダルダイアログ。「今後の流れ」は実務慣行 |
| R-T06 ダッシュボード [推奨] | goal を 1 つに絞り、それを達成する一覧を置く（例: 欠品間近の商品一覧）。KPI は `kind: summary` で単位付き（`unit`）にし、詳しく見る先があれば項目に `to`（View 名）を付けて値をリンクにする。主アクションは省略してよく、ナビと同じ遷移を primary にしない | `kind: summary`（`unit`, `to`）+ `kind: list` | 実務慣行 |
| R-T07 設定 [推奨] | 保存ボタンで確定する設定は checkbox／radio＋primary「保存する」。切り替えた瞬間に反映される設定だけ toggle にし、その画面には保存ボタンを置かない。両方を 1 画面に混ぜない | `component: checkbox` または `toggle` | C:スイッチ |

## 10. サンプル `examples/v2/` への適用

第 1 版の指摘（toggle に保存ボタン、確認画面直後の confirm、tertiary、readonly の理由、日付の入力例、width）は反映済み。
第 2 版で追加した定型文言（R-W09）により「やめる」を「キャンセル」に改めた。
第 2 版の追補で、`order-entry.yaml` は新しいキーで書き直した（一覧の列 `type` / `to` と `rows`、確認画面の `Section.actions`、単価の `unit`、
R-V09 に沿ったエラー文言、R-S10 に沿った空状態）。ルール全体を使った 2 つのサンプルを加えた。

| サンプル | 内容 | 主に使うキー |
|---|---|---|
| `order-entry.yaml` | 受注登録（営業向けの業務画面） | `list.columns[].type`・`to`、`list.rows`、`Section.actions`、`unit` |
| `childcare-application.yaml` | 保育所入所申込（住民向け。ロールなし） | `precision: month`、`autocomplete`、`links`、file の `accept`・`maxSize`・`multiple`、`visibleWhen` の `in`、`requiredWhen`、timeline の `value` |
| `inventory-admin.yaml` | 小売チェーンの在庫管理（店舗担当者・本部管理者） | `Action.role`、`NavGroup.role`、`Notice.role`・`until`、`list.bulkActions`、`Section.actions`（検索・リセット）、summary の `to`、固定行の表（`columns[].field`）、`notEquals` |

## 11. スキーマへの反映

2026-11-07 にすべて反映済み（スキーマ `schema-v2.json`、型 `src/types/schema-v2.ts`、パーサー、v2 レンダラー、旧フォーマットへの変換）。
仕様は `02-schema-v2.md`、描画は `03-renderer-v2.md`。

| 状態 | キー | 理由 | 依存するルール |
|---|---|---|---|
| 反映済み（2026-11-07） | `list.columns[].type`（text / status / date / number）と `list.columns[].to` | 状態列をチップで、識別子セルを詳細へのリンクで出す | R-T01 |
| 反映済み（2026-11-07） | `list.bulkActions: Action[]`（`selection: multiple` のときだけ） | 一括操作を主アクションに置くしかなかった | R-V12 |
| 反映済み（2026-11-07） | `Action.role` と `NavGroup.role`（省略＝全ロール） | 共有画面のロール専用操作・ナビが全員に見えた | R-A09 |
| 反映済み（2026-11-07） | `Section.actions: Action[]` | 確認画面の「〇〇を修正する」、絞り込みの「検索」「リセット」 | R-T01, R-T04 |
| 反映済み（2026-11-07） | `Field.unit` | 単位を label に押し込んでいた | R-P06 |
| 反映済み（2026-11-07） | `Field.precision: day / month`（date） | 年月入力が書けなかった | R-P05 |
| 反映済み（2026-11-07） | `Field.autocomplete` | 入力目的の指定（DADS 日付ピッカーが推奨） | R-P01〜P05 |
| 反映済み（2026-11-07） | file の `multiple`、`accept` の列挙、`maxSize` | 複数添付と PDF が書けなかった | R-I19 |
| 反映済み（2026-11-07） | `list.rows: object[]` | 一覧の中身がダミー生成で業務の状態名を見せられなかった | R-T01 |
| 反映済み（2026-11-07） | Condition の `in` と `notEquals` | 「就労または求職」の分岐が書けなかった | R-S14 |
| 反映済み（2026-11-07） | `Field.links: { label, href }[]` | 規約・手引きへのリンクが書けなかった | R-P07 |
| 反映済み（2026-11-07） | `Notice.role`, `Notice.until` | ロール限定・期限付きの告知 | R-A04 |
| 反映済み（2026-11-07） | 固定行の表（`list.columns[].field` + `list.rows`） | 棚卸しの作業表が書けなかった | R-F10, R-S11 |
| 反映済み（2026-11-07） | summary 項目の `to`（readonly でも使える） | KPI から一覧への導線 | R-T06 |
| 反映済み（2026-11-07） | timeline の `value: { at, label, text? }[]` | 履歴を文字列に詰めていた | R-T02 |
| 反映済み（2026-11-07） | `Field.requiredWhen` | 表示とは別の条件付き必須 | R-I13 |

反映済み（それ以前）: `Action.style` の `tertiary`、`Field.width`、date の `props.calendar`。

### 未対応

実装しなかったもの、実装したが範囲を限ったもの。

- `View.role` / `Flow.role` による表示の切り替え。ロール切替のプレビューは操作・ナビ・通知（`Action.role` / `NavGroup.role` / `Notice.role`）だけに効く。View ごと表示を変えたいときは、画面の中身が違う場合に限って View を分ける（R-A09）。
- `list.rowActions` の `role` と `confirm`。行ごとの操作は 2 つまで・破壊的操作を置かない（R-T01）ので、必要が出ていない。
- file の `maxSize` / `accept` の実行時チェック（選ばれたファイルの容量・形式の検証）。モックなので `data-max-size` と `accept` 属性を出すだけで、超過のエラー表示はしない。エラー文言は `props.error` で見せる。
- `requiredWhen` / `visibleWhen` の旧フォーマットでの再現。旧スキーマに必須条件がなく、`visible_when` は評価されない。`compileV2Warnings` が警告する（§12）。
- 列の入力欄（`columns[].field`）の `visibleWhen` / `requiredWhen`、text / number / select / checkbox 以外の component。表のセルとしては単純な入力に限る。
- 一覧の全選択チェックボックスと、ページ送りの実際の動作（ページ送りは 1 ページ目の見え方だけを示す）。
- `precision: month` に `inline: true`（カレンダー表示）は対応しない。inline の date は従来どおり月カレンダー。

追加しないもの: `confirm.confirmLabel`（action の label で足りる）、`Action.kind: download`（文言で足りる）、遷移先への対象 ID・絞り込み条件・値の連動・相関バリデーション・外部 options（モックの範囲外。help と description の文言で伝える）。

## 12. ツール側の課題

2026-11-07 に対応済み。

| 課題 | 以前 | 現在 |
|---|---|---|
| 状態の切り替え表示 | `states.success` と `states.error` を同時に描画し、loading は描画しなかった | ビューアーのツールバーに「状態」（通常 / 成功 / エラー / 空 / 読み込み中）。view が持つ `states.*` に対応するものだけ選べ、選んだ状態だけ描画する。既定の通常は状態バナーなし（success と error は同時に出ない）。読み込み中は DADS の progress-indicator、空は一覧の空の文言。`renderViewV2` / `mountViewV2` の `state`、`Mokkun.init` の `initialState` |
| 一覧のダミー値 | 状態列が固定の「処理中／出荷済み／完了」 | `list.rows` を優先。ない場合は同じ View の status / select / radio の選択肢から状態名を借り、それもなければ従来の既定 |
| ロール別プレビュー | role はナビ・操作の表示に使われなかった | ビューアーのツールバーに「ロール」（すべて + `app.roles`）。`Action.role` / `NavGroup.role` / `Notice.role` を現在のロールで絞る。`renderViewV2` の `role`、`Mokkun.init` の `role` |
| 旧フォーマット変換の未対応 | placement・columns・purpose・rowActions.to が黙って落ち、`example` が placeholder になった | `compileV2Warnings(schema)` が落ちるキーを列挙し、ビューアーはコンソールにだけ出す。`example` は description の「例: …」に連結する |

## 13. 検証の記録

第 2 版の改訂は次の手順で行った。

1. 第 1 版の文書と `02-schema-v2.md` だけを渡し、DADS の資料を見せずに 2 つのシナリオ（住民向け保育所入所申込、小売チェーン在庫管理）の YAML を生成させ、「ルールが沈黙した点」「曖昧・矛盾した点」「スキーマで表現できない点」を全件記録させた。
2. 生成された YAML を DADS の抽出ノートと突き合わせ、違反 95 件（既存ルールの無視、既存ルールの不明瞭、ルールの不在に分類）を洗い出した。
3. 両者を統合した 90 件を「ルール追加 40／ルール修正 21／スキーマ追加 16／ツール課題 5／対象外 8」に分類し、追加・修正を本文に、スキーマ追加を §11 に、ツール課題を §12 に反映した。

よく無視されたルール（R-W01、R-W02、R-I05、R-I13、R-V10、§5.1 の選択肢数）はチェックリストに項目を足した。

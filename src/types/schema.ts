/**
 * Mokkun YAML Schema Type Definitions
 * YAML構造のTypeScript型定義
 */

// =============================================================================
// Top-Level Structure / トップレベル構造
// =============================================================================

/**
 * YAMLファイルのルート構造（正規化後）
 */
export interface MokkunSchema {
  /** ビュー/画面定義のマップ */
  view: Record<string, ScreenDefinition>
  /** 共通コンポーネント定義 */
  common_components?: Record<string, CommonComponent>
  /** 共通バリデーション定義 */
  validations?: Record<string, ValidationRule>
}

/**
 * YAMLファイルの生データ構造（配列形式もサポート）
 */
export interface MokkunSchemaRaw {
  /** ビュー/画面定義（オブジェクト形式または配列形式） */
  view: Record<string, ScreenDefinitionRaw> | ScreenDefinitionRaw[]
  /** 共通コンポーネント定義（オブジェクト形式または配列形式） */
  common_components?: Record<string, CommonComponent> | CommonComponentRaw[]
  /** 共通バリデーション定義（オブジェクト形式または配列形式） */
  validations?: Record<string, ValidationRule> | ValidationRuleRaw[]
}

/**
 * 画面定義（配列形式用、nameプロパティを持つ）
 */
export interface ScreenDefinitionRaw extends Omit<ScreenDefinition, 'fields' | 'app_header' | 'app_navi'> {
  /** 画面名（配列形式の場合のキー） */
  name?: string
  /** アクター（この画面を使用するユーザー種別） */
  actor?: string
  /** 画面の目的 */
  purpose?: string
  /** ナビゲーション設定 */
  navigation?: NavigationSetting
  /** アプリケーションヘッダー設定 */
  app_header?: AppHeaderConfigSchema
  /** アプリケーションナビゲーション設定 */
  app_navi?: AppNaviConfigSchema
  /** セクション（統合フォーム用） */
  sections?: FormSection[]
  /** 入力フィールドのリスト（配列形式でも対応） */
  fields?: InputFieldRaw[]
  /** 入力フィールド（配列形式の別名） */
  input_fields?: InputFieldRaw[]
  /** 表示フィールド */
  display_fields?: string[]
  /** フィルター */
  filters?: string[]
  /** タブ設定 */
  tabs?: string[]
  /** 連携サービス */
  integration?: string[]
  /** 関連モデル */
  related_models?: string[]
  /** 関連ユースケース */
  related_usecases?: string[]
  /** バリデーション（画面固有） */
  validations?: ScreenValidation[]
}

/**
 * ナビゲーション設定
 */
export interface NavigationSetting {
  /** ナビゲーションタイプ */
  type: string
  /** 説明 */
  description?: string
}

/**
 * フォームセクション
 */
export interface FormSection {
  /** セクション名 */
  section_name: string
  /** アイコン */
  icon?: string
  /** 公開トグル */
  publish_toggle?: boolean
  /** 入力フィールド */
  input_fields?: InputFieldRaw[]
}

/**
 * 入力フィールド（配列形式用、field_nameプロパティを持つ）
 */
export interface InputFieldRaw {
  /** フィールド名（配列形式のIDとして使用） */
  field_name?: string
  /** フィールドID */
  id?: string
  /** フィールドタイプ */
  type: string
  /** ラベル */
  label?: string
  /** 説明 */
  description?: string
  /** 必須かどうか */
  required?: boolean
  /** バリデーション（文字列形式） */
  validation?: string
  /** プレースホルダー */
  placeholder?: string
  /** 選択肢（配列形式：文字列の配列） */
  options?: string[] | SelectOption[]
  /** 単位 */
  unit?: string
  /** 許可するファイルタイプ（文字列形式） */
  accepted_types?: string
  /** ストレージパス */
  storage?: string
  /** その他のプロパティ */
  [key: string]: unknown
}

/**
 * 画面固有バリデーション
 */
export interface ScreenValidation {
  /** フィールド名 */
  field: string
  /** ルール */
  rule: string
}

/**
 * 共通コンポーネント（配列形式用）
 */
export interface CommonComponentRaw {
  /** コンポーネント名 */
  component_name: string
  /** 説明 */
  description?: string
  /** 使用箇所 */
  used_in?: string[]
}

/**
 * バリデーションルール（配列形式用）
 */
export interface ValidationRuleRaw {
  /** フィールド名 */
  field: string
  /** ルール */
  rule: string
}

// =============================================================================
// Screen Definition / 画面定義
// =============================================================================

/**
 * 画面定義
 */
export interface ScreenDefinition {
  /** 画面タイトル */
  title: string
  /** 画面の説明 */
  description?: string
  /** アプリケーションヘッダー設定 */
  app_header?: AppHeaderConfigSchema
  /** アプリケーションナビゲーション設定 */
  app_navi?: AppNaviConfigSchema
  /** ウィザード設定（複数ステップの場合） */
  wizard?: WizardConfig
  /** セクション（統合フォーム用、SectionNavで表示） */
  sections?: FormSection[]
  /** 入力フィールドのリスト */
  fields?: InputField[]
  /** 画面上のアクション */
  actions?: Action[]
  /** レイアウト設定 */
  layout?: LayoutConfig
}

// =============================================================================
// AppHeader Config for YAML / アプリヘッダー設定
// =============================================================================

/**
 * テナント情報
 */
export interface TenantSchema {
  /** テナントID */
  id: string
  /** テナント名 */
  name: string
}

/**
 * ユーザー情報
 */
export interface UserInfoSchema {
  /** ユーザー名 */
  name: string
  /** メールアドレス（オプション） */
  email?: string
  /** アバターURL（オプション） */
  avatarUrl?: string
}

/**
 * ナビゲーションドロップダウンアイテム
 */
export interface HeaderNavDropdownItemSchema {
  /** アイテムID */
  id: string
  /** ラベル */
  label: string
  /** リンク先URL */
  href?: string
  /** 区切り線 */
  divider?: boolean
}

/**
 * ナビゲーションアイテム
 */
export interface HeaderNavItemSchema {
  /** アイテムID */
  id: string
  /** ラベル */
  label: string
  /** リンク先URL */
  href?: string
  /** アクティブ状態 */
  active?: boolean
  /** 無効化 */
  disabled?: boolean
  /** ドロップダウンメニュー */
  dropdown?: HeaderNavDropdownItemSchema[]
}

/**
 * アプリランチャーアイテム
 */
export interface AppLauncherItemSchema {
  /** アプリID */
  id: string
  /** アプリ名 */
  name: string
  /** アプリURL */
  url: string
  /** アイコン（SVG HTML文字列） */
  icon?: string
}

/**
 * AppHeader設定
 */
export interface AppHeaderConfigSchema {
  /** ロゴ（SVG HTML文字列） */
  logo?: string
  /** ロゴの代替テキスト */
  logoAlt?: string
  /** ロゴのリンク先 */
  logoHref?: string
  /** アプリ名 */
  appName: string
  /** テナント一覧 */
  tenants?: TenantSchema[]
  /** 現在のテナントID */
  currentTenantId?: string
  /** ユーザー情報 */
  userInfo: UserInfoSchema
  /** ナビゲーション一覧 */
  navigations?: HeaderNavItemSchema[]
  /** アプリランチャー一覧 */
  appLauncher?: AppLauncherItemSchema[]
  /** ヘルプページURL */
  helpPageUrl?: string
  /** リリースノート表示 */
  showReleaseNote?: boolean
  /** リリースノートテキスト */
  releaseNoteText?: string
  /** データ同期ボタン表示 */
  showDataSync?: boolean
}

// =============================================================================
// AppNavi Config for YAML / アプリナビゲーション設定
// =============================================================================

/**
 * ドロップダウンメニューアイテム
 */
export interface AppNaviDropdownMenuItemSchema {
  /** アイテムID */
  id: string
  /** 表示ラベル */
  label: string
  /** アイコン（HTML文字列） */
  icon?: string
  /** 無効化 */
  disabled?: boolean
  /** リンク先URL */
  href?: string
}

/**
 * ナビゲーションアイテム
 */
export interface AppNaviItemSchema {
  /** アイテムID */
  id: string
  /** 表示ラベル */
  label: string
  /** タイプ（button, anchor, dropdown） */
  type: 'button' | 'anchor' | 'dropdown'
  /** アイコン（HTML文字列） */
  icon?: string
  /** 無効化 */
  disabled?: boolean
  /** 現在のページ/セクションを示す */
  current?: boolean
  /** リンク先URL（anchorタイプ用） */
  href?: string
  /** ターゲット属性（anchorタイプ用） */
  target?: '_blank' | '_self' | '_parent' | '_top'
  /** ドロップダウンメニュー項目（dropdownタイプ用） */
  dropdownItems?: AppNaviDropdownMenuItemSchema[]
}

/**
 * AppNavi設定（YAML用）
 */
export interface AppNaviConfigSchema {
  /** ナビゲーションラベル（アクセシビリティ用） */
  label?: string
  /** ナビゲーションアイテム */
  items: AppNaviItemSchema[]
}

/**
 * ウィザード/ステッパーのレイアウトタイプ
 * 
 */
export type StepperLayoutType = 'horizontal' | 'vertical'

/**
 * ステップのステータス
 * 
 */
export type StepStatus =
  | 'pending'      // 未着手
  | 'completed'    // 完了
  | 'error'        // エラー
  | 'warning'      // 警告
  | 'closed'       // 終了/クローズ

/**
 * 拡張ステップステータス（テキスト付き）
 * 
 */
export interface StepStatusWithText {
  type: StepStatus
  text: string
}

/**
 * ウィザード設定
 * 
 */
export interface WizardConfig {
  /** ウィザードのステップ */
  steps: WizardStep[]
  /** レイアウトタイプ（水平/垂直） */
  layout?: StepperLayoutType
  /** ステップ間でのバリデーション */
  validate_on_step?: boolean
  /** 戻るボタンを許可するか */
  allow_back?: boolean
  /** プログレスバーを表示するか */
  show_progress?: boolean
  /** クリック可能なステップ（過去ステップへの戻り） */
  clickable_steps?: boolean
  /** 現在のステップインデックス（0始まり） */
  activeIndex?: number
}

/**
 * ウィザードのステップ
 * 
 */
export interface WizardStep {
  /** ステップID */
  id: string
  /** ステップ名（メインラベル） */
  title: string
  /** サブタイトル（補足テキスト） */
  subtitle?: string
  /** ステップの説明 */
  description?: string
  /** このステップの入力フィールド */
  fields: InputField[]
  /** 次のステップに進む条件 */
  next_condition?: Condition
  /** ステップのステータス */
  status?: StepStatus | StepStatusWithText
  /** スキップ可能か */
  skippable?: boolean
}

/**
 * レイアウト設定
 */
export interface LayoutConfig {
  /** カラム数 */
  columns?: number
  /** レイアウトタイプ */
  type?: 'form' | 'grid' | 'stack' | 'tabs'
  /** 余白 */
  gap?: string
}

// =============================================================================
// Input Fields / 入力フィールド
// =============================================================================

/**
 * 入力フィールドの基本インターフェース
 */
interface BaseInputField {
  /** フィールドID */
  id: string
  /** ラベル */
  label: string
  /** 説明/ヘルプテキスト */
  description?: string
  /** 必須かどうか */
  required?: boolean
  /** 無効化 */
  disabled?: boolean
  /** 読み取り専用 */
  readonly?: boolean
  /** プレースホルダー */
  placeholder?: string
  /** デフォルト値 */
  default?: unknown
  /** バリデーションルール */
  validation?: FieldValidation | string
  /** 表示条件 */
  visible_when?: Condition
  /** CSSクラス */
  class?: string
}

/**
 * テキスト入力フィールド
 */
export interface TextField extends BaseInputField {
  type: 'text'
  /** 最小文字数 */
  min_length?: number
  /** 最大文字数 */
  max_length?: number
  /** 入力パターン（正規表現） */
  pattern?: string
  /** 入力タイプ（email, url, tel等） */
  input_type?: 'text' | 'email' | 'url' | 'tel' | 'password'
}

/**
 * 数値入力フィールド
 */
export interface NumberField extends BaseInputField {
  type: 'number'
  /** 最小値 */
  min?: number
  /** 最大値 */
  max?: number
  /** ステップ */
  step?: number
  /** 単位表示 */
  unit?: string
}

/**
 * テキストエリアフィールド
 */
export interface TextareaField extends BaseInputField {
  type: 'textarea'
  /** 行数 */
  rows?: number
  /** 最小文字数 */
  min_length?: number
  /** 最大文字数 */
  max_length?: number
  /** リサイズ可能か */
  resizable?: boolean
}

/**
 * セレクトフィールド（単一選択）
 */
export interface SelectField extends BaseInputField {
  type: 'select'
  /** 選択肢 */
  options: SelectOption[] | string
  /** 検索可能か */
  searchable?: boolean
  /** クリア可能か */
  clearable?: boolean
  /** サイズ (s/default) */
  size?: 's' | 'default'
  /** name属性（フォーム用） */
  name?: string
}

/**
 * マルチセレクトフィールド（複数選択）
 */
export interface MultiSelectField extends BaseInputField {
  type: 'multi_select'
  /** 選択肢 */
  options: SelectOption[] | string
  /** 最小選択数 */
  min_selections?: number
  /** 最大選択数 */
  max_selections?: number
  /** 検索可能か */
  searchable?: boolean
}

/**
 * コンボボックスフィールド（検索可能な単一/複数選択）
 */
export interface ComboboxField extends BaseInputField {
  type: 'combobox'
  /** 選択モード */
  mode?: 'single' | 'multi'
  /** 静的選択肢 */
  options?: SelectOption[] | string
  /** 非同期ローダーエンドポイント */
  async_loader?: string
  /** 最小検索文字数 */
  min_search_length?: number
  /** デバウンス遅延（ms） */
  debounce_ms?: number
  /** クリア可能か */
  clearable?: boolean
  /** 最大選択数（multiモード） */
  max_selections?: number
  /** オプションなしメッセージ */
  no_options_message?: string
  /** ローディングメッセージ */
  loading_message?: string
}

/**
 * ラジオグループフィールド
 */
export interface RadioGroupField extends BaseInputField {
  type: 'radio_group'
  /** 選択肢 */
  options: SelectOption[] | string
  /** レイアウト方向 */
  direction?: 'horizontal' | 'vertical'
}

/**
 * チェックボックスグループフィールド
 */
export interface CheckboxGroupField extends BaseInputField {
  type: 'checkbox_group'
  /** 選択肢 */
  options: SelectOption[] | string
  /** 最小選択数 */
  min_selections?: number
  /** 最大選択数 */
  max_selections?: number
  /** レイアウト方向 */
  direction?: 'horizontal' | 'vertical'
}

/**
 * 日付選択フィールド
 */
export interface DatePickerField extends BaseInputField {
  type: 'date_picker'
  /** 日付フォーマット */
  format?: string
  /** 最小日付 */
  min_date?: string
  /** 最大日付 */
  max_date?: string
  /** 時間も含めるか */
  include_time?: boolean
}

/**
 * 時間選択フィールド
 */
export interface TimePickerField extends BaseInputField {
  type: 'time_picker'
  /** 時間フォーマット */
  format?: string
  /** 分のステップ */
  minute_step?: number
  /** 24時間表記か */
  use_24_hour?: boolean
}

/**
 * 期間選択フィールド（ドロップダウン）
 */
export interface DurationPickerField extends BaseInputField {
  type: 'duration_picker'
  /** 選択可能な単位 */
  units?: ('hours' | 'minutes' | 'seconds' | 'days')[]
  /** 最小期間（秒） */
  min_duration?: number
  /** 最大期間（秒） */
  max_duration?: number
}

/**
 * 期間入力フィールド（テキスト入力）
 */
export interface DurationInputField extends BaseInputField {
  type: 'duration_input'
  /** 表示単位 */
  display_unit?: 'hours' | 'minutes' | 'seconds'
  /** 入力フォーマット */
  format?: string
}

/**
 * ファイルアップロードフィールド
 */
export interface FileUploadField extends BaseInputField {
  type: 'file_upload'
  /** 許可するファイルタイプ */
  accept?: string[]
  /** 最大ファイルサイズ（バイト） */
  max_size?: number
  /** 複数ファイル許可 */
  multiple?: boolean
  /** 最大ファイル数 */
  max_files?: number
  /** ドラッグ&ドロップ許可 */
  drag_drop?: boolean
}

/**
 * リピーターフィールド（動的配列）
 */
export interface RepeaterField extends BaseInputField {
  type: 'repeater'
  /** 繰り返す入力フィールド群 */
  item_fields: InputField[]
  /** 最小アイテム数 */
  min_items?: number
  /** 最大アイテム数 */
  max_items?: number
  /** 追加ボタンのラベル */
  add_button_label?: string
  /** 削除ボタンを表示 */
  show_remove_button?: boolean
  /** 並べ替え可能 */
  sortable?: boolean
}

// =============================================================================
// Data Table / データテーブル
// =============================================================================

/**
 * データテーブルのカラム定義
 */
export interface DataTableColumn {
  /** カラムID */
  id: string
  /** カラムヘッダーラベル */
  label: string
  /** データフィールドキー（省略時はidを使用） */
  field?: string
  /** カラム幅（px, %、またはauto） */
  width?: string
  /** 最小カラム幅（リサイズ時、px） */
  min_width?: string
  /** 最大カラム幅（リサイズ時、px） */
  max_width?: string
  /** リサイズ可能か */
  resizable?: boolean
  /** ソート可能か */
  sortable?: boolean
  /** フィルタリング可能か */
  filterable?: boolean
  /** 表示フォーマット */
  format?: 'text' | 'number' | 'date' | 'datetime' | 'currency' | 'status'
  /** ステータスフォーマット用のマッピング */
  status_map?: Record<string, { label: string; color: 'success' | 'warning' | 'danger' | 'info' | 'default' }>
  /** 通貨フォーマット用の設定 */
  currency_format?: {
    locale?: string
    currency?: string
  }
  /** テキストの配置 */
  align?: 'left' | 'center' | 'right'
  /** 固定カラム */
  fixed?: 'left' | 'right'
  /** ヘッダーセルの結合数（colspan） */
  colspan?: number
  /** ヘッダーセルの行結合数（rowspan） */
  rowspan?: number
}

/**
 * データテーブルの行アクション
 */
export interface DataTableRowAction {
  /** アクションID */
  id: string
  /** アクションラベル */
  label: string
  /** アイコン（オプション） */
  icon?: string
  /** スタイル */
  style?: 'primary' | 'secondary' | 'danger' | 'link'
  /** 確認ダイアログ */
  confirm?: ConfirmConfig
  /** ハンドラー名（カスタムアクション用） */
  handler?: string
}

/**
 * データテーブルのソート設定
 */
export interface DataTableSortConfig {
  /** ソートするカラムID */
  column: string
  /** ソート方向 */
  direction: 'asc' | 'desc'
}

/**
 * データテーブルのページネーション設定
 */
export interface DataTablePaginationConfig {
  /** ページネーションを有効にするか */
  enabled?: boolean
  /** 1ページあたりの行数 */
  page_size?: number
  /** ページサイズの選択肢 */
  page_size_options?: number[]
  /** 現在のページ（0始まり） */
  current_page?: number
  /** 総件数（サーバーサイドページング用） */
  total_count?: number
}

/**
 * データテーブルのフィルター設定
 */
export interface DataTableFilterConfig {
  /** フィルターを有効にするか */
  enabled?: boolean
  /** キーワード検索を表示するか */
  show_search?: boolean
  /** フィルターフィールド */
  fields?: DataTableFilterField[]
  /** フィルターのレイアウト */
  layout?: 'inline' | 'stacked'
}

/**
 * データテーブルのフィルターフィールド
 */
export interface DataTableFilterField {
  /** フィルターID */
  id: string
  /** フィルターラベル */
  label: string
  /** 対象のカラムID */
  column: string
  /** フィルタータイプ */
  type: 'text' | 'select' | 'date_range' | 'number_range'
  /** 選択肢（selectタイプ用） */
  options?: SelectOption[]
  /** プレースホルダー */
  placeholder?: string
}

/**
 * データテーブル行のデータ
 */
export interface DataTableRow {
  /** 行ID（ユニーク） */
  id: string | number
  /** 行グループ名（グループ化用） */
  _group?: string
  /** セル結合設定（カラムID -> 結合設定） */
  _cellMerge?: Record<string, DataTableCellMerge>
  /** 行データ */
  [key: string]: unknown
}

/**
 * セル結合の設定
 */
export interface DataTableCellMerge {
  /** 列方向の結合数 */
  colspan?: number
  /** 行方向の結合数 */
  rowspan?: number
  /** このセルが他のセルに結合されている（非表示） */
  hidden?: boolean
}

/**
 * データテーブルの空状態設定
 */
export interface DataTableEmptyState {
  /** 空状態のタイトル */
  title?: string
  /** 空状態の説明 */
  description?: string
  /** 空状態のアイコン */
  icon?: string
  /** 空状態のアクション */
  action?: {
    label: string
    handler: string
  }
}

/**
 * 行グループ化の設定
 */
export interface DataTableGroupConfig {
  /** グループ化を有効にするか */
  enabled?: boolean
  /** グループのフィールドキー（行データの_groupまたは指定フィールド） */
  field?: string
  /** グループヘッダーをカスタマイズする関数名（ハンドラー） */
  header_renderer?: string
  /** グループの初期展開状態 */
  default_expanded?: boolean
  /** 折りたたみ可能か */
  collapsible?: boolean
}

/**
 * 固定ヘッダーの設定
 */
export interface DataTableFixedHeaderConfig {
  /** 固定ヘッダーを有効にするか */
  enabled?: boolean
  /** 固定時のオフセット（px）- スティッキーポジション用 */
  offset?: number
}

/**
 * 列リサイズの設定
 */
export interface DataTableResizeConfig {
  /** 列リサイズを有効にするか */
  enabled?: boolean
  /** 最小カラム幅（px、デフォルト: 50） */
  min_width?: number
  /** 最大カラム幅（px、デフォルト: 500） */
  max_width?: number
  /** リサイズ時にコールバックを呼ぶか */
  on_resize?: string
}

/**
 * データテーブルフィールド
 */
export interface DataTableField extends Omit<BaseInputField, 'placeholder'> {
  type: 'data_table'
  /** カラム定義 */
  columns: DataTableColumn[]
  /** 静的データ（指定しない場合は動的データソースを想定） */
  data?: DataTableRow[]
  /** 行選択モード */
  selection?: 'none' | 'single' | 'multiple'
  /** 行アクション */
  row_actions?: DataTableRowAction[]
  /** デフォルトのソート設定 */
  default_sort?: DataTableSortConfig
  /** ページネーション設定 */
  pagination?: DataTablePaginationConfig
  /** フィルター設定 */
  filters?: DataTableFilterConfig
  /** 空状態の設定 */
  empty_state?: DataTableEmptyState
  /** テーブルの高さ（スクロール用） */
  height?: string
  /** ストライプ行を有効にするか */
  striped?: boolean
  /** ホバー効果を有効にするか */
  hoverable?: boolean
  /** 枠線を表示するか */
  bordered?: boolean
  /** コンパクトモード */
  compact?: boolean
  /** レスポンシブモード（モバイルでカード表示） */
  responsive?: boolean
  /** 固定ヘッダー設定 */
  fixed_header?: DataTableFixedHeaderConfig | boolean
  /** 行グループ化設定 */
  grouping?: DataTableGroupConfig
  /** 列リサイズ設定 */
  column_resize?: DataTableResizeConfig | boolean
  /** テーブルのレイアウト（auto: 内容に応じて幅決定、fixed: 均等幅） */
  layout?: 'auto' | 'fixed'
}

// =============================================================================
// Google Map Embed / Googleマップ埋め込み
// =============================================================================

/**
 * Googleマップ埋め込みフィールド
 */
export interface GoogleMapEmbedField extends BaseInputField {
  type: 'google_map_embed'
  /** 埋め込みの高さ */
  height?: string
  /** 埋め込みの幅（デフォルト: 100%） */
  width?: string
  /** 「Googleマップで開く」リンクを表示 */
  show_open_link?: boolean
  /** ズームレベル（デフォルト: 15） */
  zoom?: number
}

// =============================================================================
// Toggle / トグル
// =============================================================================

/**
 * チェックボックスフィールド
 *
 * 
 * - indeterminate状態（一部選択）をサポート
 * - `data-state="checked|unchecked|indeterminate"` for styling
 */
export interface CheckboxField extends BaseInputField {
  type: 'checkbox'
  /** チェック時のラベル */
  checked_label?: string
  /** 非チェック時のラベル */
  unchecked_label?: string
  /** サイズ */
  size?: 'small' | 'medium' | 'large'
  /** name属性（フォーム用） */
  name?: string
  /** ラベル位置 */
  label_position?: 'left' | 'right'
}

/**
 * トグルフィールド
 *
 * API follows standard conventions from Headless UI and Radix UI:
 * - `checked_label` / `unchecked_label` for labels
 * - `data-state="checked|unchecked"` for styling
 */
export interface ToggleField extends BaseInputField {
  type: 'toggle'
  /** チェック時のラベル（Radix UI/Headless UI互換） */
  checked_label?: string
  /** 非チェック時のラベル（Radix UI/Headless UI互換） */
  unchecked_label?: string
  /** サイズ ( small/medium) */
  size?: 'small' | 'medium' | 'large'
  /** name属性（フォーム用） */
  name?: string
  /** ラベル位置 () */
  label_position?: 'left' | 'right'
}

/**
 * 写真管理フィールド
 */
export interface PhotoManagerField extends BaseInputField {
  type: 'photo_manager'
  /** 写真リスト */
  photos?: PhotoConfig[]
  /** 最大写真枚数 */
  max_photos?: number
  /** 最大ファイルサイズ（MB） */
  max_file_size?: number
  /** 対応フォーマット */
  accepted_formats?: string[]
  /** グリッドのカラム数 */
  columns?: number
}

/**
 * 写真設定
 */
export interface PhotoConfig {
  /** 写真ID */
  id: string
  /** 画像URL */
  src: string
  /** 代替テキスト */
  alt?: string
  /** メイン写真かどうか */
  is_main?: boolean
}

/**
 * 画像アップローダーフィールド（複数画像のアップロード・並び替え・削除）
 */
export interface ImageUploaderField extends BaseInputField {
  type: 'image_uploader'
  /** 許可するファイルタイプ（デフォルト: ['image/jpeg', 'image/png', 'image/webp']） */
  accepted_formats?: string[]
  /** 最大ファイルサイズ（バイト、デフォルト: 5MB） */
  max_file_size?: number
  /** 最大ファイル数（デフォルト: 10） */
  max_files?: number
  /** 最小ファイル数（デフォルト: 0） */
  min_files?: number
}

// =============================================================================
// Tooltip / ツールチップ
// =============================================================================

/**
 * ツールチップの位置
 */
export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right'

/**
 * ツールチップフィールド
 *
 * 機能:
 * - 位置指定（top/bottom/left/right）
 * - 遅延表示（デフォルト300ms）
 * - リッチコンテンツ対応（HTML/テキスト）
 * - 矢印表示
 */
export interface TooltipField extends Omit<BaseInputField, 'placeholder'> {
  type: 'tooltip'
  /** ツールチップのコンテンツ（テキストまたはHTML） */
  content: string
  /** 位置（デフォルト: top） */
  position?: TooltipPosition
  /** 遅延表示時間（ミリ秒、デフォルト: 300） */
  delay?: number
  /** 矢印を表示するか（デフォルト: true） */
  show_arrow?: boolean
  /** HTMLコンテンツとして解釈するか（デフォルト: false） */
  is_html?: boolean
  /** 最大幅（デフォルト: 200px） */
  max_width?: string
}

/**
 * バッジフィールド（ステータスや数量表示用の小さなラベル）
 *
 * 機能:
 * - カラーバリエーション（gray/blue/green/yellow/red）
 * - サイズ（small/medium）
 * - dot表示（数値なしの状態表示）
 * - カウント表示（99+などの上限表示）
 */
export interface BadgeField extends BaseInputField {
  type: 'badge'
  /** バッジのカラー */
  color?: 'gray' | 'blue' | 'green' | 'yellow' | 'red'
  /** サイズ */
  size?: 'small' | 'medium'
  /** dot表示モード（数値なしの状態表示） */
  dot?: boolean
  /** 表示する数値 */
  count?: number
  /** カウント表示の上限（デフォルト: 99） */
  max_count?: number
  /** テキストコンテンツ（数値の代わりにテキストを表示） */
  text?: string
}

/**
 * 見出しフィールド
 *
 * セマンティックな見出しコンポーネント。
 * 機能:
 * - セマンティックレベル（h1-h6）と視覚的サイズの分離
 * - アクセシビリティを考慮した構造
 * - カラーバリエーション対応
 */
export interface HeadingField extends BaseInputField {
  type: 'heading'
  /** 見出しレベル（セマンティクス） */
  level: 1 | 2 | 3 | 4 | 5 | 6
  /** 見出しテキスト */
  text: string
  /** サイズバリアント（視覚的サイズ、levelから独立） */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  /** テキスト配置 */
  align?: 'left' | 'center' | 'right'
  /** カラーバリエーション */
  color?: 'default' | 'primary' | 'secondary' | 'muted' | 'danger' | 'success' | 'warning'
  /** アイコン（オプション） */
  icon?: string
}

// =============================================================================
// Pagination / ページネーション
// =============================================================================

/**
 * ページネーションフィールド
 *
 * 機能:
 * - ページ番号表示
 * - 前後ボタン
 * - 最初/最後へのジャンプ
 * - ページサイズ選択
 * - 表示件数表示
 * - コンパクト表示モード
 */
export interface PaginationField extends Omit<BaseInputField, 'placeholder'> {
  type: 'pagination'
  /** 総アイテム数 */
  total_items: number
  /** 現在のページ（1始まり） */
  current_page?: number
  /** 1ページあたりのアイテム数（デフォルト: 10） */
  page_size?: number
  /** ページサイズの選択肢（デフォルト: [10, 25, 50, 100]） */
  page_size_options?: number[]
  /** ページサイズ選択を表示するか（デフォルト: true） */
  show_page_size_selector?: boolean
  /** 表示件数を表示するか（デフォルト: true） */
  show_item_count?: boolean
  /** 最初/最後へのジャンプボタンを表示するか（デフォルト: true） */
  show_jump_buttons?: boolean
  /** ページ番号ボタンの最大表示数（デフォルト: 7） */
  max_page_buttons?: number
  /** コンパクトモード（デフォルト: false） */
  compact?: boolean
  /** 位置（デフォルト: 'center'） */
  align?: 'left' | 'center' | 'right'
}

// =============================================================================
// FloatArea / フローティング領域
// =============================================================================

/**
 * フローティング領域の位置
 */
export type FloatAreaPosition = 'top' | 'bottom'

/**
 * フローティング領域のコンテンツ配置
 */
export type FloatAreaAlignment = 'left' | 'center' | 'right' | 'space-between'

/**
 * フローティング領域フィールド
 *
 * 機能:
 * - 位置指定（top/bottom）
 * - 影・ボーダー表示
 * - レスポンシブ対応
 * - z-index管理
 *
 * 用途:
 * - フォーム送信ボタンの固定表示
 * - ナビゲーションの固定表示
 * - アクションバー
 */
export interface FloatAreaField extends Omit<BaseInputField, 'placeholder'> {
  type: 'float_area'
  /** 位置（デフォルト: bottom） */
  position?: FloatAreaPosition
  /** 影を表示するか（デフォルト: true） */
  show_shadow?: boolean
  /** ボーダーを表示するか（デフォルト: false） */
  show_border?: boolean
  /** z-index（デフォルト: 100） */
  z_index?: number
  /** レスポンシブ対応（デフォルト: false） */
  responsive?: boolean
  /** sticky配置を使用（デフォルト: false = fixed） */
  sticky?: boolean
  /** コンテンツの配置（デフォルト: center） */
  align?: FloatAreaAlignment
  /** コンテンツのパディング */
  padding?: string
  /** コンテンツ間のギャップ */
  gap?: string
  /** アクセシビリティ用ラベル */
  aria_label?: string
}

// =============================================================================
// Loader / ローダー
// =============================================================================

/**
 * Loader size variants
 */
export type LoaderSize = 'small' | 'medium' | 'large'

/**
 * Loader color type
 */
export type LoaderType = 'primary' | 'light'

/**
 * Loader state
 */
export interface LoaderState {
  /** Visibility state */
  isVisible: boolean
  /** Current progress (0-100, undefined = indeterminate) */
  progress?: number
  /** Loading message */
  text?: string
}

/**
 * Loader callbacks
 */
export interface LoaderCallbacks {
  /** Called when loader is shown */
  onShow?: () => void
  /** Called when loader is hidden */
  onHide?: () => void
  /** Called when progress updates */
  onProgressUpdate?: (progress: number) => void
}

/**
 * Loader configuration
 */
export interface LoaderConfig {
  /** Size variant */
  size?: LoaderSize
  /** Color type */
  type?: LoaderType
  /** Fullscreen overlay mode */
  overlay?: boolean
  /** Progress value (0-100, enables progress bar) */
  progress?: number
  /** Loading text message */
  text?: string
  /** Alternative text for accessibility */
  ariaLabel?: string
  /** Auto-show on creation */
  autoShow?: boolean
}

/**
 * Loader field for YAML schema
 *
 * 機能:
 * - サイズバリエーション (small/medium/large)
 * - インライン表示
 * - フルスクリーン表示（オーバーレイ）
 * - テキスト付き表示
 * - 進捗率表示（プログレスバー）
 */
export interface LoaderField extends BaseInputField {
  type: 'loader'
  /** Size variant */
  size?: LoaderSize
  /** Color type */
  loaderType?: LoaderType
  /** Fullscreen overlay */
  overlay?: boolean
  /** Show progress bar */
  showProgress?: boolean
  /** Initial progress value */
  initialProgress?: number
}

// =============================================================================
// Browser Field / ブラウザフィールド
// =============================================================================

/**
 * Browserアイテムの定義
 */
export interface BrowserItemSchema {
  /** アイテムの値（一意） */
  value: string
  /** 表示ラベル */
  label: string
  /** 子アイテム */
  children?: BrowserItemSchema[]
  /** 無効化 */
  disabled?: boolean
}

/**
 * Browser field for YAML schema
 *
 * 機能:
 * - 階層的なデータの表示
 * - 複数カラム表示（最大3列）
 * - キーボードナビゲーション
 * - 単一選択
 */
export interface BrowserField extends BaseInputField {
  type: 'browser'
  /** アイテムの配列 */
  items: BrowserItemSchema[]
  /** 初期選択値 */
  default?: string
  /** 最大カラム数（デフォルト: 3） */
  maxColumns?: number
  /** 高さ（デフォルト: 'auto'） */
  height?: string
}

// =============================================================================
// Calendar Field / カレンダーフィールド
// =============================================================================

/**
 * Calendar field for YAML schema
 *
 * 機能:
 * - 月表示カレンダー
 * - 日付選択
 * - 選択可能な日付範囲の制限 (from/to)
 * - 月移動ナビゲーション
 * - キーボードナビゲーション
 */
export interface CalendarField extends BaseInputField {
  type: 'calendar'
  /** 初期選択日付（ISO 8601形式: YYYY-MM-DD） */
  default?: string
  /** 選択可能な日付範囲の開始日（ISO 8601形式） */
  from?: string
  /** 選択可能な日付範囲の終了日（ISO 8601形式） */
  to?: string
  /** 週の開始曜日 (0: 日曜, 1: 月曜) */
  weekStartsOn?: 0 | 1
  /** ロケール（デフォルト: 'ja-JP'） */
  locale?: string
}

// =============================================================================
// Additional Display Field Types / 追加表示フィールドタイプ
// =============================================================================

/**
 * 通知バーフィールド
 */
export interface NotificationBarField extends BaseInputField {
  type: 'notification_bar'
  /** バリアント */
  variant?: 'info' | 'success' | 'warning' | 'error'
  /** 閉じるボタンを表示 */
  dismissible?: boolean
}

/**
 * レスポンスメッセージフィールド
 */
export interface ResponseMessageField extends BaseInputField {
  type: 'response_message'
  /** バリアント */
  variant?: 'success' | 'error' | 'warning' | 'info'
}

/**
 * タイムラインフィールド
 */
export interface TimelineField extends BaseInputField {
  type: 'timeline'
  /** タイムラインアイテム */
  items?: Array<{
    time: string
    title: string
    description?: string
  }>
}

/**
 * チップフィールド
 */
export interface ChipField extends BaseInputField {
  type: 'chip'
  /** バリアント */
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
  /** 削除可能 */
  removable?: boolean
}

/**
 * ステータスラベルフィールド
 */
export interface StatusLabelField extends BaseInputField {
  type: 'status_label'
  /** バリアント */
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
}

/**
 * セグメンテッドコントロールフィールド
 */
export interface SegmentedControlField extends BaseInputField {
  type: 'segmented_control'
  /** 選択肢 */
  options?: SelectOption[]
  /** デフォルト値 */
  default?: string
}

/**
 * タブフィールド
 */
export interface TabsField extends BaseInputField {
  type: 'tabs'
  /** タブアイテム */
  tabs?: Array<{
    id: string
    label: string
    content?: string
  }>
}

/**
 * ラインクランプフィールド
 */
export interface LineClampField extends BaseInputField {
  type: 'line_clamp'
  /** クランプする行数 */
  lines?: number
  /** テキスト */
  text?: string
}

/**
 * ディスクロージャーフィールド
 */
export interface DisclosureField extends BaseInputField {
  type: 'disclosure'
  /** 初期状態で開く */
  defaultOpen?: boolean
}

/**
 * アコーディオンパネルフィールド
 */
export interface AccordionPanelField extends BaseInputField {
  type: 'accordion_panel'
  /** 初期状態で開く */
  defaultOpen?: boolean
}

/**
 * セクションナビフィールド
 */
export interface SectionNavField extends BaseInputField {
  type: 'section_nav'
  /** ナビゲーションアイテム */
  items?: Array<{
    id: string
    label: string
    href?: string
  }>
}

/**
 * 定義リストフィールド
 */
export interface DefinitionListField extends BaseInputField {
  type: 'definition_list'
  /** 定義アイテム */
  items?: Array<{
    term: string
    description: string
  }>
}

/**
 * ステッパーフィールド
 */
export interface StepperField extends BaseInputField {
  type: 'stepper'
  /** ステップ */
  steps?: Array<{
    id: string
    label: string
    completed?: boolean
  }>
  /** 現在のステップ */
  currentStep?: number
}

/**
 * インフォメーションパネルフィールド
 */
export interface InformationPanelField extends BaseInputField {
  type: 'information_panel'
  /** バリアント */
  variant?: 'info' | 'success' | 'warning' | 'error'
}

/**
 * ドロップダウンフィールド
 */
export interface DropdownFieldType extends BaseInputField {
  type: 'dropdown'
  /** 選択肢 */
  options?: SelectOption[]
}

/**
 * 削除確認ダイアログフィールド
 */
export interface DeleteConfirmDialogField extends BaseInputField {
  type: 'delete_confirm_dialog'
  /** 確認メッセージ */
  message?: string
}

/**
 * 全ての入力フィールドのユニオン型
 */
export type InputField =
  | TextField
  | NumberField
  | TextareaField
  | SelectField
  | MultiSelectField
  | ComboboxField
  | RadioGroupField
  | CheckboxField
  | CheckboxGroupField
  | DatePickerField
  | TimePickerField
  | DurationPickerField
  | DurationInputField
  | FileUploadField
  | RepeaterField
  | DataTableField
  | GoogleMapEmbedField
  | PhotoManagerField
  | ToggleField
  | ImageUploaderField
  | BadgeField
  | BrowserField
  | CalendarField
  | HeadingField
  | TooltipField
  | PaginationField
  | FloatAreaField
  | LoaderField
  | NotificationBarField
  | ResponseMessageField
  | TimelineField
  | ChipField
  | StatusLabelField
  | SegmentedControlField
  | TabsField
  | LineClampField
  | DisclosureField
  | AccordionPanelField
  | SectionNavField
  | DefinitionListField
  | StepperField
  | InformationPanelField
  | DropdownFieldType
  | DeleteConfirmDialogField

/**
 * 入力フィールドのタイプ
 */
export type InputFieldType = InputField['type']

// =============================================================================
// Select Options / 選択肢
// =============================================================================

/**
 * 選択肢
 */
export interface SelectOption {
  /** 値 */
  value: string | number
  /** 表示ラベル */
  label: string
  /** 無効化 */
  disabled?: boolean
  /** グループ */
  group?: string
  /** アイコン */
  icon?: string
  /** 説明 */
  description?: string
}

/**
 * セレクトオプショングループ（optgroup用）
 */
export interface SelectOptionGroup {
  /** グループラベル */
  label: string
  /** グループ内のオプション */
  options: SelectOption[]
  /** 無効化 */
  disabled?: boolean
}

/**
 * セレクトコンポーネントの状態
 */
export interface SelectState {
  /** 選択値 */
  value: string | number | null
  /** 無効化状態 */
  disabled: boolean
  /** エラー状態 */
  error: boolean
  /** 開閉状態（カスタムセレクトの場合） */
  isOpen?: boolean
}

/**
 * セレクトコンポーネントのコールバック
 */
export interface SelectCallbacks {
  /** 値変更時 */
  onChange?: (value: string | number | null, state: SelectState) => void
}

/**
 * セレクトコンポーネントの設定
 */
export interface SelectConfig {
  /** 選択肢（混在可能） */
  options: Array<SelectOption | SelectOptionGroup>
  /** 初期値 */
  defaultValue?: string | number
  /** 無効化 */
  disabled?: boolean
  /** エラー状態 */
  error?: boolean
  /** プレースホルダー */
  placeholder?: string
  /** 空オプションを表示 */
  hasBlank?: boolean
  /** 空オプションのラベル */
  blankLabel?: string
  /** サイズ (s/default) */
  size?: 's' | 'default'
  /** 幅 */
  width?: string | number
  /** name属性（フォーム用） */
  name?: string
  /** 必須 */
  required?: boolean
  /** クリア可能 */
  clearable?: boolean
}

// =============================================================================
// Validation / バリデーション
// =============================================================================

/**
 * フィールドバリデーション
 */
export interface FieldValidation {
  /** 必須 */
  required?: boolean | string
  /** 最小長/最小値 */
  min?: number | string
  /** 最大長/最大値 */
  max?: number | string
  /** パターン（正規表現） */
  pattern?: string | { regex: string; message: string }
  /** カスタムバリデーター */
  custom?: string
  /** エラーメッセージ */
  message?: string
}

/**
 * 共通バリデーションルール（再利用可能）
 */
export interface ValidationRule {
  /** ルール名 */
  name: string
  /** バリデーション定義 */
  rules: FieldValidation
  /** エラーメッセージ */
  message?: string
}

// =============================================================================
// Actions / アクション
// =============================================================================

/**
 * アクションの基本インターフェース
 */
interface BaseAction {
  /** アクションID */
  id: string
  /** ラベル */
  label: string
  /** アイコン */
  icon?: string
  /** スタイル */
  style?: 'primary' | 'secondary' | 'danger' | 'link'
  /** 無効化条件 */
  disabled_when?: Condition
  /** 確認ダイアログ */
  confirm?: ConfirmConfig
}

/**
 * 送信アクション
 */
export interface SubmitAction extends BaseAction {
  type: 'submit'
  /** 送信先URL */
  url?: string
  /** HTTPメソッド */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  /** 成功時の遷移先 */
  on_success?: NavigationConfig
  /** 失敗時のアクション */
  on_error?: ErrorHandlerConfig
}

/**
 * ナビゲーションアクション
 */
export interface NavigateAction extends BaseAction {
  type: 'navigate'
  /** 遷移先 */
  to: string
  /** パラメータ */
  params?: Record<string, string>
}

/**
 * カスタムアクション
 */
export interface CustomAction extends BaseAction {
  type: 'custom'
  /** カスタムハンドラー名 */
  handler: string
  /** パラメータ */
  params?: Record<string, unknown>
}

/**
 * リセットアクション
 */
export interface ResetAction extends BaseAction {
  type: 'reset'
  /** リセット対象のフィールド（未指定なら全て） */
  fields?: string[]
}

/**
 * 全てのアクションのユニオン型
 */
export type Action =
  | SubmitAction
  | NavigateAction
  | CustomAction
  | ResetAction

/**
 * 確認ダイアログ設定
 */
export interface ConfirmConfig {
  /** タイトル */
  title: string
  /** メッセージ */
  message: string
  /** 確認ボタンのラベル */
  confirm_label?: string
  /** キャンセルボタンのラベル */
  cancel_label?: string
}

/**
 * ナビゲーション設定
 */
export interface NavigationConfig {
  /** 遷移先 */
  to: string
  /** パラメータ */
  params?: Record<string, string>
  /** メッセージ */
  message?: string
}

/**
 * エラーハンドラー設定
 */
export interface ErrorHandlerConfig {
  /** エラーメッセージ */
  message?: string
  /** リトライ可能か */
  retry?: boolean
  /** リダイレクト先 */
  redirect?: string
}

// =============================================================================
// Common Components / 共通コンポーネント
// =============================================================================

/**
 * 共通コンポーネント
 */
export interface CommonComponent {
  /** コンポーネント名 */
  name: string
  /** 説明 */
  description?: string
  /** コンポーネントタイプ */
  type: 'field_group' | 'action_group' | 'layout' | 'template'
  /** フィールド定義（field_groupの場合） */
  fields?: InputField[]
  /** アクション定義（action_groupの場合） */
  actions?: Action[]
  /** レイアウト設定（layoutの場合） */
  layout?: LayoutConfig
  /** テンプレート（templateの場合） */
  template?: string
  /** パラメータ定義 */
  params?: ComponentParam[]
}

/**
 * コンポーネントパラメータ
 */
export interface ComponentParam {
  /** パラメータ名 */
  name: string
  /** 型 */
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  /** 必須か */
  required?: boolean
  /** デフォルト値 */
  default?: unknown
}

// =============================================================================
// Conditions / 条件
// =============================================================================

/**
 * 条件式
 */
export type Condition =
  | SimpleCondition
  | AndCondition
  | OrCondition
  | NotCondition

/**
 * シンプル条件
 */
export interface SimpleCondition {
  /** 対象フィールド */
  field: string
  /** 演算子 */
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in' | 'contains' | 'empty' | 'not_empty'
  /** 比較値 */
  value?: unknown
}

/**
 * AND条件
 */
export interface AndCondition {
  and: Condition[]
}

/**
 * OR条件
 */
export interface OrCondition {
  or: Condition[]
}

/**
 * NOT条件
 */
export interface NotCondition {
  not: Condition
}

// =============================================================================
// Type Guards / 型ガード
// =============================================================================

/**
 * 条件がAND条件かどうか
 */
export function isAndCondition(condition: Condition): condition is AndCondition {
  return 'and' in condition
}

/**
 * 条件がOR条件かどうか
 */
export function isOrCondition(condition: Condition): condition is OrCondition {
  return 'or' in condition
}

/**
 * 条件がNOT条件かどうか
 */
export function isNotCondition(condition: Condition): condition is NotCondition {
  return 'not' in condition
}

/**
 * 条件がシンプル条件かどうか
 */
export function isSimpleCondition(condition: Condition): condition is SimpleCondition {
  return 'field' in condition && 'operator' in condition
}

/**
 * 入力フィールドが特定のタイプかどうか確認
 */
export function isFieldType<T extends InputField>(
  field: InputField,
  type: T['type']
): field is T {
  return field.type === type
}

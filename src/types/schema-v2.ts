/**
 * Mokkun v2 フォーマット 型定義
 * 6層（App / Flow / View / Section / Field / Component）を入れ子にした YAML 構造。
 * 仕様: docs/format-redesign/02-schema-v2.md
 * 正規形は camelCase。内部では compileV2 で旧フォーマット（MokkunSchema）へ変換する。
 */

// =============================================================================
// Top-Level / トップレベル
// =============================================================================

/**
 * v2 YAML のルート構造
 */
export interface MokkunV2Schema {
  /** フォーマットバージョン（2 固定） */
  mokkun: 2
  /** App 層 */
  app: AppV2
  /** Flow 層（name → Flow） */
  flows?: Record<string, FlowV2>
  /** View 層（name → View） */
  views: Record<string, ViewV2>
  /** 再利用可能な Section（name → Section の一部） */
  patterns?: Record<string, PatternV2>
  /** 共通バリデーション（name → ルール） */
  rules?: Record<string, RuleV2>
}

// =============================================================================
// App
// =============================================================================

export type AppLayoutV2 = 'shell' | 'plain'

export interface AppHeaderV2 {
  systemName?: string
  userName?: string
  userEmail?: string
  tenantName?: string
  helpUrl?: string
}

export interface NavItemV2 {
  /** views のキー */
  view: string
  /** 省略時は view の title */
  label?: string
  icon?: string
}

/** ロール指定（文字列または配列。省略は全ロール） */
export type RoleSpecV2 = string | string[]

export interface NavGroupV2 {
  group: string
  items: NavItemV2[]
  /** このロールにだけ表示する（省略は全ロール）。app.roles の値 */
  role?: RoleSpecV2
}

export type NoticeVariantV2 = 'info' | 'success' | 'warning' | 'error'

export interface NoticeV2 {
  variant?: NoticeVariantV2
  message: string
  dismissible?: boolean
  /** このロールにだけ表示する（省略は全ロール）。app.roles の値 */
  role?: RoleSpecV2
  /** 掲示期限（ISO 日付 YYYY-MM-DD）。今日がこれより後なら表示しない */
  until?: string
}

export interface AppV2 {
  name: string
  layout?: AppLayoutV2
  header?: AppHeaderV2
  roles?: string[]
  navigation?: NavGroupV2[]
  notifications?: NoticeV2[]
}

// =============================================================================
// Flow
// =============================================================================

export interface FlowStepV2 {
  view: string
  /** 省略時は view の title */
  label?: string
}

export interface FlowV2 {
  name: string
  outcome: string
  role?: string
  steps: FlowStepV2[]
  progress?: 'stepper' | 'none'
  resumable?: boolean
}

// =============================================================================
// View
// =============================================================================

export type ViewLayoutV2 = 'stack' | 'tabs' | 'sectioned'

export type ActionKindV2 = 'submit' | 'navigate' | 'custom' | 'reset'
export type ActionPlacementV2 = 'header' | 'footer' | 'sticky'
export type ActionStyleV2 = 'primary' | 'secondary' | 'tertiary' | 'danger'

export interface ActionConfirmV2 {
  message: string
  danger?: boolean
}

export interface ActionV2 {
  id: string
  label: string
  kind?: ActionKindV2
  /** navigate の遷移先 view */
  to?: string
  placement?: ActionPlacementV2
  style?: ActionStyleV2
  confirm?: ActionConfirmV2
  /** このロールにだけ表示する（省略は全ロール）。app.roles の値 */
  role?: RoleSpecV2
}

export interface StateMessageV2 {
  message: string
}

export interface ViewStatesV2 {
  empty?: StateMessageV2
  loading?: StateMessageV2
  success?: StateMessageV2
  error?: StateMessageV2
}

export interface ViewV2 {
  title: string
  goal: string
  nav?: string
  role?: string
  layout?: ViewLayoutV2
  description?: string
  primaryAction?: ActionV2
  secondaryActions?: ActionV2[]
  states?: ViewStatesV2
  sections: SectionV2[]
}

// =============================================================================
// Section
// =============================================================================

export type SectionKindV2 = 'form' | 'list' | 'readonly' | 'summary'

export interface RepeatableV2 {
  min?: number
  max?: number
  addLabel?: string
}

/** 条件で使える値 */
export type ConditionValueV2 = string | number | boolean

/**
 * 条件（visibleWhen / requiredWhen）。equals / notEquals / in のうち 1 つだけを書く。
 * - equals: item の値が等しい
 * - notEquals: item の値が等しくない
 * - in: item の値が配列のどれかと等しい
 */
export interface ConditionV2 {
  item: string
  equals?: ConditionValueV2
  notEquals?: ConditionValueV2
  in?: ConditionValueV2[]
}

/** 一覧セルの型（既定 text） */
export type ListColumnTypeV2 = 'text' | 'status' | 'date' | 'number'

/** 一覧セルに置ける入力（item / label は持たない）。text / number / select / checkbox のみ */
export type ListColumnFieldV2 = Omit<FieldV2, 'item' | 'label'>

export interface ListColumnV2 {
  id: string
  label: string
  sortable?: boolean
  /** セルの型。status はチップ、date は日本語の日付、number は右寄せ */
  type?: ListColumnTypeV2
  /** セルを遷移リンクにする view 名（rows 内の値がリンクの文言になる） */
  to?: string
  /** セルに入力欄を置く（list.rows が必要。name は `<rowKey>.<columnId>`） */
  field?: ListColumnFieldV2
}

export interface ListRowActionV2 {
  id: string
  label: string
  kind?: ActionKindV2
  to?: string
}

export interface ListV2 {
  columns: ListColumnV2[]
  rowActions?: ListRowActionV2[]
  search?: boolean
  paging?: { pageSize?: number }
  selection?: 'none' | 'single' | 'multiple'
  empty?: string
  /** 選択した行への操作（selection が multiple のときだけ）。行 ID は onAction の payload.selectedRows */
  bulkActions?: ActionV2[]
  /** 代表行（キーは列 id）。あればダミー行の代わりに使う */
  rows?: Array<Record<string, unknown>>
}

export interface SectionV2 {
  id: string
  title: string
  purpose?: string
  kind?: SectionKindV2
  reveal?: 'open' | 'collapsed'
  repeatable?: RepeatableV2
  note?: string
  columns?: 1 | 2 | 3
  visibleWhen?: ConditionV2
  /** patterns のキー */
  use?: string
  fields?: FieldV2[]
  list?: ListV2
  /** 見出し行に置く操作（primary は不可）。確認画面の修正する、絞り込みの検索・リセットなど */
  actions?: ActionV2[]
}

/** patterns の値（fields と note のみ。use のネストは非対応） */
export interface PatternV2 {
  fields?: FieldV2[]
  note?: string
}

// =============================================================================
// Field / Component
// =============================================================================

export type ComponentV2 =
  | 'text'
  | 'number'
  | 'textarea'
  | 'date'
  | 'time'
  | 'duration'
  | 'file'
  | 'photo_grid'
  | 'select'
  | 'combobox'
  | 'radio'
  | 'checkbox'
  | 'toggle'
  | 'browser'
  | 'badge'
  | 'chip'
  | 'status'
  | 'timeline'
  | 'map'

/** 有効な component 一覧（パーサーとテストで共有） */
export const VALID_COMPONENTS_V2: readonly ComponentV2[] = [
  'text',
  'number',
  'textarea',
  'date',
  'time',
  'duration',
  'file',
  'photo_grid',
  'select',
  'combobox',
  'radio',
  'checkbox',
  'toggle',
  'browser',
  'badge',
  'chip',
  'status',
  'timeline',
  'map',
]

/** 入力欄の幅（xs ≈ 6rem / sm ≈ 10rem / md ≈ 20rem / lg ≈ 30rem / full = 100%）。旧レンダラーでは無視 */
export type FieldWidthV2 = 'xs' | 'sm' | 'md' | 'lg' | 'full'

export interface OptionV2 {
  value: string | number | boolean
  label: string
}

/** 共通バリデーションルール */
export interface RuleV2 {
  required?: boolean | string
  min?: number | string
  max?: number | string
  pattern?: string | { regex: string; message: string }
  custom?: string
  message?: string
}

/** file の accept（キーワードまたは拡張子・MIME タイプの配列） */
export type FileAcceptV2 = 'image' | 'pdf' | 'document' | string | string[]

export type DatePrecisionV2 = 'day' | 'month'

export interface FieldLinkV2 {
  label: string
  href: string
}

/** timeline の構造化された値 */
export interface TimelineEntryV2 {
  at: string
  label: string
  text?: string
}

export interface FieldV2 {
  /** 業務の名詞。id として使う */
  item: string
  label: string
  component: ComponentV2
  required?: boolean
  whyRequired?: string
  example?: string
  help?: string
  format?: string
  default?: unknown
  options?: OptionV2[]
  multiple?: boolean
  variant?: string
  inline?: boolean
  /** file の種別。image / pdf / document、または拡張子・MIME タイプの配列 */
  accept?: FileAcceptV2
  /** file の 1 ファイルあたりの上限（例 "10MB"。KB / MB / GB） */
  maxSize?: string
  /** 入力欄の後ろに付ける単位（円・件など） */
  unit?: string
  /** date の精度。month は年月だけ（visibleWhen の値は `y-m`） */
  precision?: DatePrecisionV2
  /** HTML の autocomplete トークン。date では `bday` が bday-year/month/day になる */
  autocomplete?: string
  /** サポートテキストの後ろに出すリンク */
  links?: FieldLinkV2[]
  /** この条件が成り立つときだけ必須（required: true とは併用しない） */
  requiredWhen?: ConditionV2
  /** summary / readonly の値を遷移リンクにする view 名 */
  to?: string
  value?: unknown
  readonly?: boolean
  /** 文字列は rules のキー */
  rules?: Array<string | RuleV2>
  visibleWhen?: ConditionV2
  /** 入力欄の幅 */
  width?: FieldWidthV2
  /** component 固有の追加設定（旧フィールド属性をそのまま渡す） */
  props?: Record<string, unknown>
}

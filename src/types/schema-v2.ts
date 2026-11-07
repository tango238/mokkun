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

export interface NavGroupV2 {
  group: string
  items: NavItemV2[]
}

export type NoticeVariantV2 = 'info' | 'success' | 'warning' | 'error'

export interface NoticeV2 {
  variant?: NoticeVariantV2
  message: string
  dismissible?: boolean
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
export type ActionStyleV2 = 'primary' | 'secondary' | 'danger'

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

/** 表示条件（item の値が equals と等しいとき表示） */
export interface ConditionV2 {
  item: string
  equals: string | number | boolean
}

export interface ListColumnV2 {
  id: string
  label: string
  sortable?: boolean
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
  accept?: string
  value?: unknown
  readonly?: boolean
  /** 文字列は rules のキー */
  rules?: Array<string | RuleV2>
  visibleWhen?: ConditionV2
  /** component 固有の追加設定（旧フィールド属性をそのまま渡す） */
  props?: Record<string, unknown>
}

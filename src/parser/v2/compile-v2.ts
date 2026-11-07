/**
 * Mokkun v2 コンパイラ
 * v2 フォーマット（camelCase, 6層）を旧フォーマット（MokkunSchema, snake_case 内部キー）へ変換する。
 * 規則: docs/format-redesign/02-schema-v2.md 末尾の「コンパイル規則」
 */

import type {
  MokkunSchema,
  ScreenDefinition,
  FormSection,
  InputField,
  Action,
  Condition,
  FieldValidation,
  ValidationRule,
  AppHeaderConfigSchema,
  AppNaviConfigSchema,
  HeaderNavItemSchema,
  AppNaviItemSchema,
  DataTableField,
  DataTableColumn,
} from '../../types/schema'
import { normalizeKeysDeep } from '../key-normalizer'
import { generateSectionId } from '../../renderer/screen-renderer'
import type {
  MokkunV2Schema,
  ViewV2,
  SectionV2,
  FieldV2,
  ActionV2,
  ConditionV2,
  ListV2,
  RuleV2,
  FlowV2,
  PatternV2,
} from '../../types/schema-v2'

// =============================================================================
// Helpers / ヘルパー
// =============================================================================

/** 緩い型のフィールド（旧フォーマットは種類ごとに属性が異なるため） */
type LooseField = Record<string, unknown> & { id: string; type: string; label: string }

/**
 * 合成フィールド（stepper / 通知 / 一覧など）の id 接頭辞。item と衝突しない。
 * セクション由来は `_v2_s_`（本体）/ `_v2_n_`（note）/ `_v2_p_`（accordion）+ section.id、
 * view 由来は `_v2_` + 固定名で、互いに衝突しない。
 */
export const SYNTH_PREFIX = '_v2_'

/** 文末の「。」を除く */
function trimPeriod(text: string): string {
  return text.replace(/[。.]+\s*$/, '')
}

function compileCondition(cond: ConditionV2): Condition {
  return { field: cond.item, operator: 'eq', value: cond.equals }
}

/**
 * rules（キー名 or インライン）を FieldValidation にまとめる。
 * キー名は parseV2 で top-level rules の own key であることを検証済み。解決できない名前は無視する。
 */
function resolveValidation(
  rules: Array<string | RuleV2>,
  defs: Record<string, RuleV2> | undefined
): FieldValidation | undefined {
  const merged: Record<string, unknown> = {}
  for (const rule of rules) {
    if (typeof rule === 'string') {
      const def = defs && Object.hasOwn(defs, rule) ? defs[rule] : undefined
      if (def) Object.assign(merged, def)
    } else {
      Object.assign(merged, rule)
    }
  }
  return Object.keys(merged).length > 0 ? (merged as FieldValidation) : undefined
}

// =============================================================================
// Field / フィールド
// =============================================================================

/** options を必須とする旧タイプ（未指定でも空配列にしてレンダラーを落とさない） */
const OPTION_TYPES = new Set(['select', 'multi_select', 'radio_group', 'checkbox_group', 'segmented_control'])

/** value を表示テキストとして読む旧タイプ（それ以外は value → default） */
const VALUE_TEXT_TYPES = new Set(['badge', 'chip', 'status_label'])

/** component（+ 条件）→ 旧タイプ */
function resolveFieldType(f: FieldV2): string {
  switch (f.component) {
    case 'date':
      return f.inline ? 'calendar' : 'date_picker'
    case 'time':
      return 'time_picker'
    case 'duration':
      return 'duration_input'
    case 'file':
      return f.accept === 'image' ? 'image_uploader' : 'file_upload'
    case 'photo_grid':
      return 'photo_manager'
    case 'select':
      if (f.multiple) return 'multi_select'
      if (f.variant === 'segmented') return 'segmented_control'
      return 'select'
    case 'radio':
      return 'radio_group'
    case 'checkbox':
      return f.multiple ? 'checkbox_group' : 'checkbox'
    case 'status':
      return 'status_label'
    case 'map':
      return 'google_map_embed'
    default:
      // text, number, textarea, combobox, toggle, browser, badge, chip, timeline
      return f.component
  }
}

/** help + whyRequired + format を description にまとめる */
function buildDescription(f: FieldV2): string | undefined {
  const parts: string[] = []
  if (f.help) parts.push(trimPeriod(f.help))
  if (f.whyRequired) parts.push(trimPeriod(f.whyRequired))
  if (f.format) parts.push(`入力形式: ${trimPeriod(f.format)}`)
  return parts.length > 0 ? parts.join('。') : undefined
}

/** section 内の展開済みフィールド（use 由来は id に section.id を前置） */
export interface ExpandedField {
  field: FieldV2
  id: string
  /** patterns 由来か */
  fromPattern: boolean
}

/**
 * section.fields と patterns[use].fields を展開する。
 * pattern 由来のフィールドは id を `<sectionId>_<item>` にし、
 * pattern 内で同じ pattern のフィールドを指す visibleWhen は前置した id に書き換える。
 */
export function expandSectionFields(
  section: SectionV2,
  patterns: Record<string, PatternV2> | undefined
): ExpandedField[] {
  const out: ExpandedField[] = []
  const pattern = section.use && patterns && Object.hasOwn(patterns, section.use) ? patterns[section.use] : undefined
  if (pattern?.fields) {
    const items = new Set(pattern.fields.map(f => f.item))
    for (const f of pattern.fields) {
      const field: FieldV2 =
        f.visibleWhen && items.has(f.visibleWhen.item)
          ? { ...f, visibleWhen: { ...f.visibleWhen, item: `${section.id}_${f.visibleWhen.item}` } }
          : f
      out.push({ field, id: `${section.id}_${f.item}`, fromPattern: true })
    }
  }
  for (const f of section.fields ?? []) out.push({ field: f, id: f.item, fromPattern: false })
  return out
}

function compileField(ef: ExpandedField, ruleDefs: Record<string, RuleV2> | undefined): InputField {
  const f = ef.field
  const type = resolveFieldType(f)
  const out: LooseField = { id: ef.id, type, label: f.label }

  const description = buildDescription(f)
  if (description !== undefined) out.description = description
  if (f.required !== undefined) out.required = f.required
  if (f.readonly !== undefined) out.readonly = f.readonly
  if (f.example !== undefined) out.placeholder = f.example
  if (f.default !== undefined) out.default = f.default
  if (f.value !== undefined) {
    if (VALUE_TEXT_TYPES.has(type)) out.value = f.value
    else if (out.default === undefined) out.default = f.value
  }
  if (f.rules && f.rules.length > 0) {
    const validation = resolveValidation(f.rules, ruleDefs)
    if (validation !== undefined) out.validation = validation
  }
  if (f.visibleWhen) out.visible_when = compileCondition(f.visibleWhen)

  if (f.options) out.options = f.options.map(o => ({ ...o }))
  else if (OPTION_TYPES.has(type)) out.options = []

  if (f.variant !== undefined && f.variant !== 'segmented') out.variant = f.variant
  if (type === 'file_upload') {
    if (f.accept) out.accept = [f.accept]
    if (f.multiple !== undefined) out.multiple = f.multiple
  }

  // props は最後に merge。v2 は camelCase なので内部の snake_case キーへ正規化する
  if (f.props) {
    const props = { ...(normalizeKeysDeep(f.props) as Record<string, unknown>) }
    // 安全策: id / type は props で上書きさせない（parseV2 でもエラーにしている）
    delete props.id
    delete props.type
    Object.assign(out, props)
  }
  return out as unknown as InputField
}

/** トップレベルのフィールドに section の表示条件を付与（既に条件があるものは維持） */
function applySectionCondition(fields: InputField[], cond: ConditionV2 | undefined): InputField[] {
  if (!cond) return fields
  const visible = compileCondition(cond)
  return fields.map(f => (f.visible_when ? f : ({ ...f, visible_when: visible } as InputField)))
}

// =============================================================================
// Section / セクション
// =============================================================================

function compileList(section: SectionV2, list: ListV2, emptyFallback: string | undefined): DataTableField {
  const field: DataTableField = {
    id: `${SYNTH_PREFIX}s_${section.id}`,
    type: 'data_table',
    label: section.title,
    // v1 の data_table は sortable 未指定を「ソート可」とみなすため、明示的に false にする
    columns: list.columns.map((c): DataTableColumn => ({ ...c, sortable: c.sortable ?? false })),
  }
  if (list.selection) field.selection = list.selection
  if (list.rowActions && list.rowActions.length > 0) {
    field.row_actions = list.rowActions.map(a => ({ id: a.id, label: a.label, style: 'link' as const }))
  }
  if (list.paging) {
    field.pagination = { enabled: true, ...(list.paging.pageSize ? { page_size: list.paging.pageSize } : {}) }
  }
  if (list.search) field.filters = { enabled: true, show_search: true }
  const empty = list.empty ?? emptyFallback
  if (empty) field.empty_state = { title: empty }
  return field
}

/** 表示値を文字列にする（options があればラベルに置換） */
function displayValue(f: FieldV2): string {
  const raw = f.value !== undefined ? f.value : f.default
  if (raw === undefined || raw === null || raw === '') return '-'
  const hit = f.options?.find(o => String(o.value) === String(raw))
  return String(hit ? hit.label : raw)
}

function compileSection(section: SectionV2, v2: MokkunV2Schema, view: ViewV2): FormSection {
  const kind = section.kind ?? 'form'
  const expanded = expandSectionFields(section, v2.patterns)
  const pattern = section.use && v2.patterns && Object.hasOwn(v2.patterns, section.use) ? v2.patterns[section.use] : undefined
  const note = section.note ?? pattern?.note
  const body: InputField[] = []

  if (note) {
    body.push({
      id: `${SYNTH_PREFIX}n_${section.id}`,
      type: 'information_panel',
      label: '',
      description: note,
      variant: 'info',
    } as InputField)
  }

  if (kind === 'list' && section.list) {
    body.push(compileList(section, section.list, view.states?.empty?.message))
  } else if (kind === 'readonly' || kind === 'summary') {
    body.push({
      id: `${SYNTH_PREFIX}s_${section.id}`,
      type: 'definition_list',
      label: section.title,
      items: expanded.map(ef => ({ term: ef.field.label, description: displayValue(ef.field) })),
    } as InputField)
  } else {
    let inner = expanded.map(ef => compileField(ef, v2.rules))
    if (section.repeatable) {
      const r = section.repeatable
      const repeater: LooseField = {
        id: `${SYNTH_PREFIX}s_${section.id}`,
        type: 'repeater',
        // セクション名と二重にならないよう、見出しはセクション側に任せる
        label: '',
        item_fields: inner,
      }
      if (r.min !== undefined) repeater.min_items = r.min
      if (r.max !== undefined) repeater.max_items = r.max
      if (r.addLabel) repeater.add_button_label = r.addLabel
      inner = [repeater as unknown as InputField]
    }
    if (section.reveal === 'collapsed') {
      inner = [
        {
          id: `${SYNTH_PREFIX}p_${section.id}`,
          type: 'accordion_panel',
          // カードの見出しがセクション名を表示するため、トリガーには繰り返さない
          label: '入力欄を開く',
          fields: inner,
        } as InputField,
      ]
    }
    body.push(...inner)
  }

  return {
    section_name: section.title,
    input_fields: applySectionCondition(body, section.visibleWhen) as FormSection['input_fields'],
  }
}

// =============================================================================
// Action / アクション
// =============================================================================

function compileAction(a: ActionV2, defaultStyle: 'primary' | 'secondary'): Action {
  const type = a.kind ?? 'submit'
  const base = {
    id: a.id,
    label: a.label,
    // 破壊的な確認（confirm.danger）は danger スタイルで表す
    style: a.confirm?.danger ? ('danger' as const) : (a.style === 'tertiary' ? 'secondary' : (a.style ?? defaultStyle)),
    ...(a.confirm
      ? { confirm: { title: a.label, message: a.confirm.message, confirm_label: a.label, cancel_label: 'キャンセル' } }
      : {}),
  }
  switch (type) {
    case 'navigate':
      return { ...base, type: 'navigate', to: a.to ?? '' }
    case 'custom':
      return { ...base, type: 'custom', handler: a.id }
    case 'reset':
      return { ...base, type: 'reset' }
    default:
      return { ...base, type: 'submit' }
  }
}

// =============================================================================
// App chrome / ヘッダーとナビ
// =============================================================================

function compileHeader(v2: MokkunV2Schema, view: ViewV2): AppHeaderConfigSchema {
  const { app } = v2
  const header = app.header ?? {}
  // AppHeader のナビ項目は icon を持たないため、v2 の icon は引き継がない
  const navigations: HeaderNavItemSchema[] = (app.navigation ?? [])
    .flatMap(group => group.items)
    .map((item, i) => ({
      id: `nav-${i}-${item.view}`,
      label: item.label ?? v2.views[item.view]?.title ?? item.view,
      href: `#${item.view}`,
      ...(view.nav !== undefined && item.view === view.nav ? { active: true } : {}),
    }))
  return {
    appName: app.name,
    ...(header.systemName ? { systemName: header.systemName } : {}),
    ...(header.tenantName
      ? { tenants: [{ id: 'tenant-1', name: header.tenantName }], currentTenantId: 'tenant-1' }
      : {}),
    userInfo: { name: header.userName ?? '', ...(header.userEmail ? { email: header.userEmail } : {}) },
    ...(navigations.length > 0 ? { navigations } : {}),
    ...(header.helpUrl ? { helpPageUrl: header.helpUrl } : {}),
  }
}

function compileNavi(v2: MokkunV2Schema, view: ViewV2): AppNaviConfigSchema | undefined {
  const groups = v2.app.navigation
  if (!groups || groups.length === 0) return undefined
  const items: AppNaviItemSchema[] = groups.map((g, i) => ({
    id: `navi-${i + 1}`,
    label: g.group,
    type: 'anchor',
    href: g.items[0] ? `#${g.items[0].view}` : '#',
    ...(view.nav !== undefined && g.items.some(item => item.view === view.nav) ? { current: true } : {}),
  }))
  return { label: v2.app.name, items }
}

// =============================================================================
// View / ビュー
// =============================================================================

/** view を含み、手順ナビを出す flow を探す */
function findFlow(v2: MokkunV2Schema, viewName: string): { flow: FlowV2; index: number } | undefined {
  for (const flow of Object.values(v2.flows ?? {})) {
    if (flow.progress === 'none') continue
    const index = flow.steps.findIndex(s => s.view === viewName)
    if (index >= 0) return { flow, index }
  }
  return undefined
}

function compileView(viewName: string, view: ViewV2, v2: MokkunV2Schema): ScreenDefinition {
  const plain = v2.app.layout === 'plain'

  // 本体セクション
  let bodySections = view.sections.map(s => compileSection(s, v2, view))

  // layout: tabs → sections を tabs フィールド1つにまとめる
  if (view.layout === 'tabs' && bodySections.length > 0) {
    const tabs = {
      id: `${SYNTH_PREFIX}view_tabs`,
      type: 'tabs',
      label: '',
      items: bodySections.map((s, i) => ({
        id: view.sections[i].id,
        label: s.section_name,
        fields: s.input_fields,
      })),
    } as unknown as InputField
    bodySections = [{ section_name: view.title, input_fields: [tabs] as FormSection['input_fields'] }]
  }

  const leadingSections: FormSection[] = []

  // 1) 手順ナビ（flow）
  const found = findFlow(v2, viewName)
  if (found) {
    leadingSections.push({
      section_name: '進行状況',
      input_fields: [
        {
          id: `${SYNTH_PREFIX}flow_progress`,
          type: 'stepper',
          label: '',
          steps: found.flow.steps.map((s, i) => ({
            id: s.view,
            label: s.label ?? v2.views[s.view]?.title ?? s.view,
            completed: i < found.index,
          })),
          currentStep: found.index,
        } as InputField,
      ] as FormSection['input_fields'],
    })
  }

  // 2) 共通通知と状態メッセージ
  const notices: InputField[] = []
  ;(v2.app.notifications ?? []).forEach((n, i) => {
    notices.push({
      id: `${SYNTH_PREFIX}notice_${i + 1}`,
      type: 'notification_bar',
      label: '',
      description: n.message,
      variant: n.variant ?? 'info',
      ...(n.dismissible !== undefined ? { dismissible: n.dismissible } : {}),
    } as InputField)
  })
  for (const state of ['success', 'error'] as const) {
    const message = view.states?.[state]?.message
    if (!message) continue
    notices.push({
      id: `${SYNTH_PREFIX}state_${state}`,
      type: 'response_message',
      label: '',
      description: message,
      variant: state,
    } as InputField)
  }
  if (notices.length > 0) {
    leadingSections.push({ section_name: 'お知らせ', input_fields: notices as FormSection['input_fields'] })
  }

  // 3) 画面内ナビ（sectioned）。本体セクションの位置は先頭セクション数だけずれる
  if (view.layout === 'sectioned' && bodySections.length > 0) {
    const offset = leadingSections.length + 1
    leadingSections.push({
      section_name: '画面の構成',
      input_fields: [
        {
          id: `${SYNTH_PREFIX}section_nav`,
          type: 'section_nav',
          label: '',
          items: bodySections.map((s, i) => ({
            id: view.sections[i]?.id ?? `section_${i + 1}`,
            label: s.section_name,
            href: `#${generateSectionId(s.section_name, offset + i)}`,
          })),
        } as InputField,
      ] as FormSection['input_fields'],
    })
  }

  const sections: FormSection[] = [...leadingSections, ...bodySections]

  // v1 の normalizeSchema と同様、sections の input_fields を平坦化して fields にも持つ
  const fields: InputField[] = sections.flatMap(s => (s.input_fields ?? []) as InputField[])

  const actions = [
    ...(view.primaryAction ? [compileAction(view.primaryAction, 'primary')] : []),
    ...(view.secondaryActions ?? []).map(a => compileAction(a, 'secondary')),
  ]

  return {
    title: view.title,
    // description が無ければ goal を見せる
    description: view.description ?? view.goal,
    purpose: view.goal,
    ...(plain ? {} : { app_header: compileHeader(v2, view), app_navi: compileNavi(v2, view) }),
    sections: sections as ScreenDefinition['sections'],
    fields,
    ...(actions.length > 0 ? { actions } : {}),
  }
}

// =============================================================================
// Entry / エントリ
// =============================================================================

/**
 * v2 スキーマを旧フォーマット（MokkunSchema）へコンパイル
 */
export function compileV2(v2: MokkunV2Schema): MokkunSchema {
  const view: Record<string, ScreenDefinition> = {}
  for (const [name, v] of Object.entries(v2.views)) {
    view[name] = compileView(name, v, v2)
  }

  const schema: MokkunSchema = { view }
  if (v2.rules && Object.keys(v2.rules).length > 0) {
    const validations: Record<string, ValidationRule> = {}
    for (const [name, rule] of Object.entries(v2.rules)) {
      const { message, ...rest } = rule
      validations[name] = { name, rules: rest, ...(message ? { message } : {}) }
    }
    schema.validations = validations
  }
  return schema
}

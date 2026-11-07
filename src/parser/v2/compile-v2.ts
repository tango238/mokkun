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
} from '../../types/schema-v2'

// =============================================================================
// Helpers / ヘルパー
// =============================================================================

/** 緩い型のフィールド（旧フォーマットは種類ごとに属性が異なるため） */
type LooseField = Record<string, unknown> & { id: string; type: string; label: string }

/** view ごとの id 重複回避 */
class IdRegistry {
  private used = new Set<string>()

  /** base が未使用ならそのまま、使用済みなら _2, _3 ... を付けて返す */
  unique(base: string): string {
    let id = base
    let n = 2
    while (this.used.has(id)) {
      id = `${base}_${n}`
      n++
    }
    this.used.add(id)
    return id
  }
}

/** 文末の「。」を除く */
function trimPeriod(text: string): string {
  return text.replace(/[。.]+\s*$/, '')
}

/** renderer の generateSectionId と同じ規則（section_nav の href 用） */
function sectionAnchor(sectionName: string, index: number): string {
  const safeName = sectionName
    .toLowerCase()
    .replace(/[^a-z0-9぀-ゟ゠-ヿ一-龯]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
  return `section-${index}-${safeName || 'section'}`
}

function compileCondition(cond: ConditionV2): Condition {
  return { field: cond.item, operator: 'eq', value: cond.equals }
}

/** rules（キー名 or インライン）を FieldValidation / 文字列にまとめる */
function resolveValidation(
  rules: Array<string | RuleV2>,
  defs: Record<string, RuleV2> | undefined
): FieldValidation | string | undefined {
  const merged: Record<string, unknown> = {}
  const unresolved: string[] = []
  for (const rule of rules) {
    if (typeof rule === 'string') {
      const def = defs?.[rule]
      if (def) Object.assign(merged, def)
      else unresolved.push(rule)
    } else {
      Object.assign(merged, rule)
    }
  }
  if (Object.keys(merged).length > 0) return merged as FieldValidation
  return unresolved.length > 0 ? unresolved.join(',') : undefined
}

// =============================================================================
// Field / フィールド
// =============================================================================

/** options を必須とする旧タイプ（未指定でも空配列にしてレンダラーを落とさない） */
const OPTION_TYPES = new Set(['select', 'multi_select', 'radio_group', 'checkbox_group', 'segmented_control'])

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

function compileField(
  f: FieldV2,
  ids: IdRegistry,
  ruleDefs: Record<string, RuleV2> | undefined
): InputField {
  const type = resolveFieldType(f)
  const out: LooseField = { id: ids.unique(f.item), type, label: f.label }

  const description = buildDescription(f)
  if (description !== undefined) out.description = description
  if (f.required !== undefined) out.required = f.required
  if (f.readonly !== undefined) out.readonly = f.readonly
  if (f.example !== undefined) out.placeholder = f.example
  if (f.default !== undefined) out.default = f.default
  else if (f.value !== undefined) out.default = f.value
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

  // props は最後に merge（既存フィールド属性をそのまま渡す）
  if (f.props) Object.assign(out, f.props)
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

function compileList(section: SectionV2, list: ListV2, emptyFallback: string | undefined, ids: IdRegistry): DataTableField {
  const field: DataTableField = {
    id: ids.unique(section.id),
    type: 'data_table',
    label: section.title,
    columns: list.columns.map((c): DataTableColumn => ({ ...c })),
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

function compileSection(
  section: SectionV2,
  v2: MokkunV2Schema,
  view: ViewV2,
  ids: IdRegistry
): FormSection {
  const kind = section.kind ?? 'form'
  const fieldsV2: FieldV2[] = [...(section.use ? v2.patterns?.[section.use]?.fields ?? [] : []), ...(section.fields ?? [])]
  const body: InputField[] = []

  if (section.note) {
    body.push({
      id: ids.unique(`${section.id}_note`),
      type: 'information_panel',
      label: '',
      description: section.note,
      variant: 'info',
    } as InputField)
  }

  if (kind === 'list' && section.list) {
    body.push(compileList(section, section.list, view.states?.empty?.message, ids))
  } else if (kind === 'readonly' || kind === 'summary') {
    body.push({
      id: ids.unique(section.id),
      type: 'definition_list',
      label: section.title,
      items: fieldsV2.map(f => ({ term: f.label, description: displayValue(f) })),
    } as InputField)
  } else {
    let inner = fieldsV2.map(f => compileField(f, ids, v2.rules))
    if (section.repeatable) {
      const r = section.repeatable
      const repeater: LooseField = {
        id: ids.unique(section.id),
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
          id: ids.unique(`${section.id}_panel`),
          type: 'accordion_panel',
          label: section.title,
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
    style: a.style ?? defaultStyle,
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
  const navigations: HeaderNavItemSchema[] = (app.navigation ?? []).flatMap(group =>
    group.items.map(item => ({
      id: `nav-${item.view}`,
      label: item.label ?? v2.views[item.view]?.title ?? item.view,
      href: `#${item.view}`,
      ...(view.nav !== undefined && item.view === view.nav ? { active: true } : {}),
    }))
  )
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
  const ids = new IdRegistry()
  const plain = v2.app.layout === 'plain'

  // 本体セクション
  let bodySections = view.sections.map(s => compileSection(s, v2, view, ids))

  // layout: tabs → sections を tabs フィールド1つにまとめる
  if (view.layout === 'tabs' && bodySections.length > 0) {
    const tabs = {
      id: ids.unique(`${viewName}_tabs`),
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

  // danger の confirm → delete_confirm_dialog
  const actionsV2 = [
    ...(view.primaryAction ? [{ a: view.primaryAction, d: 'primary' as const }] : []),
    ...(view.secondaryActions ?? []).map(a => ({ a, d: 'secondary' as const })),
  ]
  const dialogs: InputField[] = actionsV2
    .filter(({ a }) => a.confirm?.danger)
    .map(({ a }) => ({
      id: ids.unique(`confirm_${a.id}`),
      type: 'delete_confirm_dialog',
      label: a.label,
      message: a.confirm!.message,
    }) as InputField)
  if (dialogs.length > 0) {
    bodySections.push({ section_name: '操作の確認', input_fields: dialogs as FormSection['input_fields'] })
  }

  // 先頭セクション: 手順ナビ → 共通通知 → 状態メッセージ → 画面内ナビ
  const leading: InputField[] = []
  const found = findFlow(v2, viewName)
  if (found) {
    leading.push({
      id: ids.unique('flow_progress'),
      type: 'stepper',
      label: '',
      steps: found.flow.steps.map((s, i) => ({
        id: s.view,
        label: s.label ?? v2.views[s.view]?.title ?? s.view,
        completed: i < found.index,
      })),
      currentStep: found.index,
    } as InputField)
  }
  let hasMessage = false
  ;(v2.app.notifications ?? []).forEach((n, i) => {
    hasMessage = true
    leading.push({
      id: ids.unique(`notice_${i + 1}`),
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
    hasMessage = true
    leading.push({
      id: ids.unique(`state_${state}`),
      type: 'response_message',
      label: '',
      description: message,
      variant: state,
    } as InputField)
  }
  if (view.layout === 'sectioned' && bodySections.length > 0) {
    // 先頭セクションが index 0 になるため、本体は 1 始まり
    leading.push({
      id: ids.unique('view_section_nav'),
      type: 'section_nav',
      label: '',
      items: bodySections.map((s, i) => ({
        id: view.sections[i]?.id ?? `section_${i + 1}`,
        label: s.section_name,
        href: `#${sectionAnchor(s.section_name, i + 1)}`,
      })),
    } as InputField)
  }

  const sections: FormSection[] = []
  if (leading.length > 0) {
    sections.push({
      section_name: hasMessage ? 'お知らせ' : found ? '進行状況' : '画面の構成',
      input_fields: leading as FormSection['input_fields'],
    })
  }
  sections.push(...bodySections)

  const actions = actionsV2.map(({ a, d }) => compileAction(a, d))

  return {
    title: view.title,
    ...(view.description ? { description: view.description } : {}),
    purpose: view.goal,
    ...(plain ? {} : { app_header: compileHeader(v2, view), app_navi: compileNavi(v2, view) }),
    sections: sections as ScreenDefinition['sections'],
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
      validations[name] = { name, rules: { ...rule }, ...(rule.message ? { message: rule.message } : {}) }
    }
    schema.validations = validations
  }
  return schema
}

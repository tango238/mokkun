/**
 * Mokkun v2 コンパイラ
 * v2 フォーマット（camelCase, 6層）を旧フォーマット（MokkunSchema, snake_case 内部キー）へ変換する。
 * 規則: docs/format-redesign/02-schema-v2.md 末尾の「コンパイル規則」
 * 旧フォーマットで表現できないキーは compileV2Warnings（compile-warnings.ts）が列挙する。
 */

import type {
  MokkunSchema,
  ScreenDefinition,
  FormSection,
  InputField,
  Action,
  ValidationRule,
  AppHeaderConfigSchema,
  AppNaviConfigSchema,
  HeaderNavItemSchema,
  AppNaviItemSchema,
} from '../../types/schema'
import { generateSectionId } from '../../renderer/screen-renderer'
import type { MokkunV2Schema, ViewV2, ActionV2, FlowV2 } from '../../types/schema-v2'
import { SYNTH_PREFIX } from './compile-expand'
import { compileSection } from './compile-section'

export { SYNTH_PREFIX, expandSectionFields, type ExpandedField } from './compile-expand'
export { compileV2Warnings, type V2CompileWarning } from './compile-warnings'

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

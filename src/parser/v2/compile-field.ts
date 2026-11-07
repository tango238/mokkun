/**
 * v2 の Field / Condition を旧フォーマットの InputField / Condition に変換する
 */

import type { Condition, FieldValidation, InputField } from '../../types/schema'
import type { ConditionV2, FieldV2, RuleV2 } from '../../types/schema-v2'
import { normalizeKeysDeep } from '../key-normalizer'
import type { ExpandedField } from './compile-expand'

/** 緩い型のフィールド（旧フォーマットは種類ごとに属性が異なるため） */
export type LooseField = Record<string, unknown> & { id: string; type: string; label: string }

/** 文末の「。」を除く */
function trimPeriod(text: string): string {
  return text.replace(/[。.]+\s*$/, '')
}

/**
 * 条件を旧フォーマットの条件にする。
 * equals → eq、notEquals → ne、in → in（旧スキーマの SimpleCondition が持つ演算子）
 */
export function compileCondition(cond: ConditionV2): Condition {
  if (cond.in !== undefined) return { field: cond.item, operator: 'in', value: cond.in }
  if (cond.notEquals !== undefined) return { field: cond.item, operator: 'ne', value: cond.notEquals }
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

/** options を必須とする旧タイプ（未指定でも空配列にしてレンダラーを落とさない） */
const OPTION_TYPES = new Set(['select', 'multi_select', 'radio_group', 'checkbox_group', 'segmented_control'])

/** value を表示テキストとして読む旧タイプ（それ以外は value → default） */
const VALUE_TEXT_TYPES = new Set(['badge', 'chip', 'status_label'])

/** accept のキーワード → 旧 file_upload の accept（拡張子・MIME タイプの配列） */
const ACCEPT_KEYWORD_MAP: Record<string, string[]> = {
  image: ['image/*'],
  pdf: ['application/pdf'],
  document: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'],
}

/** v2 の accept → 旧 file_upload の accept 配列（image は image_uploader になるため扱わない） */
export function legacyAccept(accept: FieldV2['accept']): string[] | undefined {
  if (accept === undefined) return undefined
  if (Array.isArray(accept)) return accept
  return Object.hasOwn(ACCEPT_KEYWORD_MAP, accept) ? ACCEPT_KEYWORD_MAP[accept] : [accept]
}

const SIZE_UNITS: Record<string, number> = { KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3 }

/** "10MB" → バイト数（書式外は undefined） */
export function maxSizeToBytes(text: string | undefined): number | undefined {
  const m = /^(\d+)(KB|MB|GB)$/.exec(text ?? '')
  return m ? Number(m[1]) * SIZE_UNITS[m[2]] : undefined
}

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

/** help + whyRequired + 入力形式 + 例 を description にまとめる（旧フォーマットは placeholder に例を置かない） */
function buildDescription(f: FieldV2): string | undefined {
  const parts: string[] = []
  if (f.help) parts.push(trimPeriod(f.help))
  if (f.whyRequired) parts.push(trimPeriod(f.whyRequired))
  if (f.format) parts.push(`入力形式: ${trimPeriod(f.format)}`)
  if (f.example) parts.push(`例: ${trimPeriod(f.example)}`)
  return parts.length > 0 ? parts.join('。') : undefined
}

/** timeline の value（{ at, label, text? }[]）→ 旧 timeline の items */
export function legacyTimelineItems(value: unknown): Array<{ time: string; title: string; description?: string }> | undefined {
  if (!Array.isArray(value)) return undefined
  return value
    .filter((e): e is { at: unknown; label: string; text?: unknown } => typeof e === 'object' && e !== null && typeof (e as { label?: unknown }).label === 'string')
    .map(e => ({
      time: String(e.at ?? ''),
      title: e.label,
      ...(typeof e.text === 'string' && e.text ? { description: e.text } : {}),
    }))
}

export function compileField(ef: ExpandedField, ruleDefs: Record<string, RuleV2> | undefined): InputField {
  const f = ef.field
  const type = resolveFieldType(f)
  const out: LooseField = { id: ef.id, type, label: f.label }

  const description = buildDescription(f)
  if (description !== undefined) out.description = description
  if (f.required !== undefined) out.required = f.required
  if (f.readonly !== undefined) out.readonly = f.readonly
  if (f.default !== undefined) out.default = f.default
  if (f.value !== undefined) {
    if (type === 'timeline') {
      const items = legacyTimelineItems(f.value)
      if (items) out.items = items
    } else if (VALUE_TEXT_TYPES.has(type)) out.value = f.value
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
  if (f.unit !== undefined && type === 'number') out.unit = f.unit
  if (type === 'file_upload') {
    const accept = legacyAccept(f.accept)
    if (accept) out.accept = accept
    if (f.multiple !== undefined) out.multiple = f.multiple
    const bytes = maxSizeToBytes(f.maxSize)
    if (bytes !== undefined) out.max_size = bytes
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
export function applySectionCondition(fields: InputField[], cond: ConditionV2 | undefined): InputField[] {
  if (!cond) return fields
  const visible = compileCondition(cond)
  return fields.map(f => (f.visible_when ? f : ({ ...f, visible_when: visible } as InputField)))
}

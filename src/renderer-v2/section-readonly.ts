/**
 * kind: readonly / summary → description-list（term = ラベル、description = 値）
 */

import type { FieldV2, SectionV2 } from '../types/schema-v2'
import { expandSectionFields } from '../parser/v2/compile-v2'
import type { ViewContext } from './context'
import { esc, str } from './util'

const CHIP_COLORS: Record<string, string> = {
  default: 'gray',
  primary: 'blue',
  info: 'light-blue',
  success: 'green',
  warning: 'yellow',
  danger: 'red',
}

/** 表示値（options があればラベルに置換、値なしは -） */
export function displayText(f: FieldV2): string {
  const raw = f.value !== undefined ? f.value : f.default
  if (raw === undefined || raw === null || raw === '') return '-'
  const hit = f.options?.find(o => str(o.value) === str(raw))
  if (hit) return hit.label
  if (typeof raw === 'number' && f.component === 'number') return raw.toLocaleString('ja-JP')
  if (raw === true || raw === false) return raw ? 'はい' : 'いいえ'
  return str(raw)
}

function descriptionValue(f: FieldV2): string {
  const text = esc(displayText(f))
  if (f.component === 'badge' || f.component === 'chip' || f.component === 'status') {
    const color = CHIP_COLORS[f.variant ?? 'default'] ?? 'gray'
    return `<span class="dads-chip-label" data-style="outlined" data-color="${color}">${text}</span>`
  }
  return text
}

export function renderReadonly(section: SectionV2, ctx: ViewContext): string {
  const items = expandSectionFields(section, ctx.schema.patterns)
    .map(
      ef => `<div class="dads-description-list__item">
    <dt>${esc(ef.field.label)}</dt>
    <dd>${descriptionValue(ef.field)}</dd>
  </div>`,
    )
    .join('\n  ')
  return `<dl class="dads-description-list">\n  ${items}\n</dl>`
}

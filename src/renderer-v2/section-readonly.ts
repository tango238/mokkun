/**
 * kind: readonly / summary → description-list（term = ラベル、description = 値）
 */

import type { FieldV2, SectionV2 } from '../types/schema-v2'
import { expandSectionFields } from '../parser/v2/compile-expand'
import type { ViewContext } from './context'
import { timelineList } from './fields/display'
import { attrs, esc, str } from './util'

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
  if (typeof raw === 'number' && f.component === 'number') return `${raw.toLocaleString('ja-JP')}${f.unit ?? ''}`
  if (raw === true || raw === false) return raw ? 'はい' : 'いいえ'
  return str(raw)
}

/** 値を遷移リンクにする（Field.to）。クリックはナビと同じ navigate になる */
function viewLink(view: string, html: string): string {
  return `<a${attrs({ class: 'dads-link', href: `#${view}`, 'data-nav-view': view })}>${html}</a>`
}

function descriptionValue(f: FieldV2): string {
  if (f.component === 'timeline') return timelineList(f)
  const text = esc(displayText(f))
  if (f.component === 'badge' || f.component === 'chip' || f.component === 'status') {
    const color = CHIP_COLORS[f.variant ?? 'default'] ?? 'gray'
    const chip = `<span class="dads-chip-label" data-style="outlined" data-color="${color}">${text}</span>`
    return f.to ? viewLink(f.to, chip) : chip
  }
  return f.to ? viewLink(f.to, text) : text
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

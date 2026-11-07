/**
 * 表示系: badge / chip / status → chip-label、timeline → list、map → image 枠
 */

import type { FieldV2 } from '../../types/schema-v2'
import { esc, objectItems, str } from '../util'
import { wrapDisplay, wrapInline, type Ctl } from './control-label'

/** variant / color → chip-label の data-color */
const CHIP_COLORS: Record<string, string> = {
  default: 'gray',
  gray: 'gray',
  primary: 'blue',
  blue: 'blue',
  info: 'light-blue',
  success: 'green',
  green: 'green',
  warning: 'yellow',
  yellow: 'yellow',
  danger: 'red',
  red: 'red',
}

function chipLabel(c: Ctl): string {
  const variant = c.f.variant ?? (typeof c.f.props?.color === 'string' ? c.f.props.color : 'default')
  const color = CHIP_COLORS[variant] ?? 'gray'
  const text = c.f.value !== undefined ? str(c.f.value) : c.f.label
  return `<span class="dads-chip-label" data-style="outlined" data-color="${color}">${esc(text)}</span>`
}

/** badge / chip / status。値があれば項目名 + チップ、無ければチップのみ（ラベルを二重に出さない） */
export function renderChip(c: Ctl): string {
  return c.f.value !== undefined ? wrapDisplay(c, chipLabel(c)) : wrapInline(c, chipLabel(c))
}

export interface TimelineRow {
  time: string
  title: string
  description?: string
}

/**
 * timeline の行。value（{ at, label, text? }[]）を優先し、なければ props.items（{ time, title, description? }[]）
 */
export function timelineRows(f: FieldV2): TimelineRow[] {
  if (Array.isArray(f.value)) {
    return objectItems<{ at?: unknown; label: string; text?: unknown }>(f.value, 'label').map(e => ({
      time: e.at === undefined || e.at === null ? '' : str(e.at),
      title: e.label,
      description: typeof e.text === 'string' && e.text ? e.text : undefined,
    }))
  }
  return objectItems<TimelineRow>(f.props?.items, 'title').map(it => ({
    time: typeof it.time === 'string' ? it.time : '',
    title: it.title,
    description: it.description,
  }))
}

/** 日時・ラベル・本文の順序なしリスト。readonly の値としても使う */
export function timelineList(f: FieldV2, labelledBy?: string): string {
  const rows = timelineRows(f)
    .map(
      r =>
        `<li class="mk2-timeline__item">${r.time ? `<time class="mk2-timeline__time">${esc(r.time)}</time> ` : ''}<strong class="mk2-timeline__label">${esc(r.title)}</strong>${r.description ? `<br><span class="mk2-timeline__text">${esc(r.description)}</span>` : ''}</li>`,
    )
    .join('\n      ')
  return `<ol class="dads-list" data-spacing="8"${labelledBy ? ` aria-labelledby="${esc(labelledBy)}"` : ''}>\n      ${rows}\n    </ol>`
}

/** timeline（value の { at, label, text? }[]、または props.items） */
export function renderTimeline(c: Ctl): string {
  return wrapDisplay(c, timelineList(c.f, `${c.domId}-label`))
}

/** 地図は image の枠に「地図」プレースホルダー */
export function renderMap(c: Ctl): string {
  const height = typeof c.f.props?.height === 'string' && /^\d+(px|rem|%)$/.test(c.f.props.height) ? c.f.props.height : undefined
  return wrapDisplay(
    c,
    `<figure class="dads-image">
      <div class="dads-image__image-area" data-bordered>
        <div class="mk2-map-placeholder" role="img" aria-label="${esc(c.f.label)}の地図"${height ? ` style="min-height:${height}"` : ''}>地図</div>
      </div>
    </figure>`,
  )
}

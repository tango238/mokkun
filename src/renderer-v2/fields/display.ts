/**
 * 表示系: badge / chip / status → chip-label、timeline → list、map → image 枠
 */

import { esc, str } from '../util'
import { wrapDisplay, type Ctl } from './control-label'

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

/** badge / chip / status。値があれば項目名 + チップ、無ければチップのみ */
export function renderChip(c: Ctl): string {
  return wrapDisplay(c, chipLabel(c))
}

interface TimelineItem {
  time: string
  title: string
  description?: string
}

/** 日時とタイトルの順序なしリスト（props.items: [{ time, title, description }]） */
export function renderTimeline(c: Ctl): string {
  const items = Array.isArray(c.f.props?.items) ? (c.f.props.items as TimelineItem[]) : []
  const rows = items
    .map(
      it =>
        `<li><time>${esc(it.time)}</time> <strong>${esc(it.title)}</strong>${it.description ? `<br><span>${esc(it.description)}</span>` : ''}</li>`,
    )
    .join('\n      ')
  return wrapDisplay(c, `<ol class="dads-list" data-spacing="8" aria-labelledby="${esc(c.domId)}-label">\n      ${rows}\n    </ol>`)
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

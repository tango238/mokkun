/**
 * date → date-picker（consolidated）/ inline のときは calendar
 * DADS の date-picker は 年・月・日 の 3 入力。カレンダーのポップオーバーは JS が必要なため出さない。
 */

import { attrs, esc } from '../util'
import { calendarButtonIcon, calendarNext, calendarPrev } from '../icons'
import { wrapGroup, type Ctl } from './control-label'

interface YMD {
  y: string
  m: string
  d: string
}

/** YYYY-MM-DD / YYYY-MM（年月だけの値。day は空） */
function parseDate(value: unknown): YMD | undefined {
  const m = /^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?/.exec(typeof value === 'string' ? value : '')
  return m ? { y: m[1], m: m[2].padStart(2, '0'), d: m[3] ? m[3].padStart(2, '0') : '' } : undefined
}

/** autocomplete: bday のとき、3 つの入力にそれぞれ bday-year / bday-month / bday-day を付ける */
function birthdayToken(c: Ctl, part: 'year' | 'month' | 'day'): string | undefined {
  return c.f.autocomplete === 'bday' ? `bday-${part}` : undefined
}

function dateInput(c: Ctl, part: 'year' | 'month' | 'day', label: string, value: string): string {
  return `<label class="dads-date-picker__${part}">
            <span class="dads-date-picker__label">${label}</span>
            <input${attrs({
              id: `${c.domId}-${part}`,
              class: 'dads-date-picker__input',
              type: 'text',
              name: `${c.name}.${part}`,
              value: value || undefined,
              inputmode: 'numeric',
              autocomplete: birthdayToken(c, part),
              pattern: '[0-9]+',
              readonly: c.f.readonly === true,
              required: c.required,
              [`data-js-${part}-input`]: true,
            })}${attrs({ 'aria-invalid': c.error ? 'true' : undefined, 'aria-describedby': c.errorId })}>
          </label>`
}

/** 上流の date-picker/error.html に従う: fieldset はサポートテキストだけ、各入力はエラーだけを参照する */
function renderPicker(c: Ctl): string {
  const ymd = parseDate(c.value)
  const month = c.f.precision === 'month'
  const inputs = attrs({ 'data-error': !!c.error, 'data-readonly': c.f.readonly === true })
  const error = c.error ? `\n      <p id="${esc(c.errorId)}" class="dads-date-picker__error-text">${esc(c.error)}</p>` : ''
  // props.calendar: 静的なカレンダーボタン（モック。ポップオーバーは出さず aria-disabled、上流のクラスは維持）
  const calendar =
    c.f.props?.calendar === true && !month
      ? `\n        <button${attrs({ class: 'dads-date-picker__calendar-button', type: 'button', 'aria-disabled': 'true', 'data-js-calendar-button': true })}>${calendarButtonIcon}</button>`
      : ''
  return wrapGroup(
    c,
    `<dads-date-picker class="dads-date-picker" data-type="consolidated">
      <div class="dads-date-picker__controls" data-size="md">
        <div class="dads-date-picker__inputs"${inputs}>
          ${dateInput(c, 'year', '年', ymd?.y ?? '')}
          ${dateInput(c, 'month', '月', ymd?.m ?? '')}${month ? '' : `\n          ${dateInput(c, 'day', '日', ymd?.d ?? '')}`}
        </div>${calendar}
      </div>${error}
    </dads-date-picker>`,
    { 'aria-describedby': c.supportId },
    { skipError: true },
  )
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

/** 月表示の静的カレンダー（選択日を data-selected で示す） */
function renderCalendar(c: Ctl): string {
  const ymd = parseDate(c.value)
  const now = new Date()
  const year = ymd ? Number(ymd.y) : now.getFullYear()
  const month = (ymd ? Number(ymd.m) : now.getMonth() + 1) - 1
  const selected = ymd ? Number(ymd.d) : 0
  const first = new Date(year, month, 1).getDay()
  const days = new Date(year, month + 1, 0).getDate()
  const rows: string[] = []
  let day = 1 - first
  while (day <= days) {
    const cells: string[] = []
    for (let i = 0; i < 7; i++, day++) {
      if (day < 1 || day > days) {
        cells.push('<td class="dads-calendar__data-cell" role="gridcell"></td>')
        continue
      }
      const label = `${year}年${month + 1}月${day}日`
      const isSel = day === selected
      cells.push(
        `<td class="dads-calendar__data-cell" role="gridcell"${attrs({ 'aria-selected': isSel ? 'true' : undefined })}><button${attrs({
          class: 'dads-calendar__date',
          type: 'button',
          'aria-label': isSel ? `選択中 ${label}` : label,
          'data-selected': isSel ? 'true' : undefined,
        })}>${day}</button></td>`,
      )
    }
    rows.push(`<tr>${cells.join('')}</tr>`)
  }
  const nav = (cls: string, icon: string) =>
    `<button class="dads-button dads-calendar__nav-button" type="button" data-size="sm" data-type="outline" aria-disabled="true" data-${cls}>${icon}</button>`
  return wrapGroup(
    c,
    `<div class="dads-calendar" role="application" aria-label="${year}年${month + 1}月">
      <div class="dads-calendar__controls">
        <div class="dads-calendar__navigation">
          ${nav('prev', calendarPrev)}
          <p class="dads-calendar__current-month">${year}年${month + 1}月</p>
          ${nav('next', calendarNext)}
        </div>
      </div>
      <table class="dads-calendar__table" role="grid" aria-label="${year}年${month + 1}月">
        <thead><tr>${WEEKDAYS.map(w => `<th class="dads-calendar__header-cell" scope="col">${w}</th>`).join('')}</tr></thead>
        <tbody>${rows.join('')}</tbody>
      </table>
    </div>`,
  )
}

export function renderDate(c: Ctl): string {
  return c.f.inline ? renderCalendar(c) : renderPicker(c)
}

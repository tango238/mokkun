/**
 * 一覧のセル: 型ごとの表示（status = chip-label、date、number 右寄せ）、リンク（column.to）、入力欄（column.field）
 */

import type { FieldV2, ListColumnV2 } from '../types/schema-v2'
import { inputText } from './fields/text'
import { makeCtl } from './fields/control-label'
import { option, selectControl } from './fields/select'
import { columnKind, formatDateCell, formatNumberCell, statusColor, type ListRow } from './list-data'
import { attrs, esc, str } from './util'

function isEmpty(value: unknown): boolean {
  return value === undefined || value === null || value === ''
}

/** 値を遷移リンクにする。クリックはナビと同じ navigate になる */
function cellLink(view: string, html: string): string {
  return `<a${attrs({ class: 'dads-link', href: `#${view}`, 'data-nav-view': view })}>${html}</a>`
}

/** 入力欄セル（column.field）。name は `<rowKey>.<columnId>`。ラベルがないので aria-label に列名と行を入れる */
function inputCell(col: ListColumnV2, f: NonNullable<ListColumnV2['field']>, row: ListRow, index: number, base: string): string {
  const name = `${row.id}.${col.id}`
  const field: FieldV2 = { ...f, item: col.id, label: col.label }
  const label = `${col.label}（${row.id}）`
  const value = isEmpty(row.values[col.id]) ? f.default : row.values[col.id]
  const c = makeCtl({ ...field, value }, { domId: `${base}-r${index + 1}-${col.id}`, name })
  const wrap = (html: string) => `<div class="mk2-cell-input"${attrs({ 'data-width': f.width })}>${html}</div>`
  switch (f.component) {
    case 'number':
      return wrap(inputText(c, { type: 'number', inputmode: 'numeric', unit: f.unit, ariaLabel: label }))
    case 'select': {
      const current = str(c.value)
      return wrap(selectControl(c, (f.options ?? []).map(o => option(o, current)).join(''), label))
    }
    case 'checkbox': {
      const checked = c.value === true || str(c.value) === 'true'
      const input = `<input${attrs({ id: c.domId, class: 'dads-checkbox__input', type: 'checkbox', name, value: 'true', checked, 'aria-label': label })}>`
      return `<label class="dads-checkbox" data-size="md"><span class="dads-checkbox__checkbox">${input}</span></label>`
    }
    default:
      return wrap(inputText(c, { type: 'text', unit: f.unit, ariaLabel: label }))
  }
}

/** 型に応じたセルの中身（リンクは column.to） */
function cellContent(col: ListColumnV2, value: unknown): string {
  if (isEmpty(value)) return ''
  const kind = columnKind(col)
  let html: string
  if (kind === 'status') {
    const text = str(value)
    html = `<span class="dads-chip-label" data-style="outlined" data-color="${statusColor(text)}">${esc(text)}</span>`
  } else if (kind === 'date') {
    html = esc(formatDateCell(value))
  } else if (kind === 'number') {
    html = esc(formatNumberCell(value))
  } else {
    html = esc(str(value))
  }
  return col.to ? cellLink(col.to, html) : html
}

/** 並べ替えに使う値（数値は数、日付は ISO。表示は桁区切りや日本語表記なので、表示文字列では順序が崩れる） */
function sortValue(col: ListColumnV2, value: unknown): string | undefined {
  if (isEmpty(value)) return undefined
  const kind = columnKind(col)
  if (kind === 'number') {
    const n = Number(str(value).replace(/,/g, ''))
    return Number.isFinite(n) ? String(n) : undefined
  }
  if (kind === 'date') return value instanceof Date ? value.toISOString().slice(0, 10) : str(value)
  return undefined
}

export function renderCell(col: ListColumnV2, row: ListRow, index: number, base: string): string {
  if (col.field) return `<td>${inputCell(col, col.field, row, index, base)}</td>`
  const number = columnKind(col) === 'number'
  const attributes = attrs({ class: number ? 'mk2-cell--number' : undefined, 'data-sort-value': sortValue(col, row.values[col.id]) })
  return `<td${attributes}>${cellContent(col, row.values[col.id])}</td>`
}

/**
 * kind: list → table（ソート可能列は sortable-header）+ page-navigation
 * 行は dummy-data のヘルパーによる 3 行のダミー
 */

import type { InputField } from '../types/schema'
import type { ListColumnV2, SectionV2 } from '../types/schema-v2'
import { generateDummyData } from '../renderer/utils/dummy-data'
import { domId, type ViewContext } from './context'
import { sortIcons, sortSvg } from './icons'
import { attrs, esc } from './util'

const DUMMY_ROWS = 3
const STATUS_SAMPLES = ['処理中', '出荷済み', '完了']

type Kind = 'id' | 'date' | 'number' | 'status' | 'text'

function columnKind(col: ListColumnV2): Kind {
  const key = `${col.id} ${col.label}`
  if (/status|ステータス|状態/i.test(key)) return 'status'
  if (/date|日|時刻/i.test(key) || /(At|_at)$/.test(col.id)) return 'date'
  if (/total|price|amount|qty|quantity|count|金額|単価|数量|合計|件数/i.test(key)) return 'number'
  if (/(Id|_id)$/.test(col.id) || col.id === 'id' || /ID|番号/.test(col.label)) return 'id'
  return 'text'
}

function dummyField(type: string, id: string, extra: Record<string, unknown> = {}): InputField {
  return { id, type, label: id, ...extra } as unknown as InputField
}

/** 列の id / ラベルから推測したダミー値 */
export function dummyCell(col: ListColumnV2, row: number): string {
  switch (columnKind(col)) {
    case 'status':
      return STATUS_SAMPLES[row % STATUS_SAMPLES.length]
    case 'date':
      return String(generateDummyData(dummyField('date_picker', col.id), -row * 3))
    case 'number': {
      const base = Number(generateDummyData(dummyField('number', col.id, { min: 12000, max: 9999999 }), row))
      return (base + row * 8400).toLocaleString('ja-JP')
    }
    case 'id':
      return String(10230 - row)
    default:
      return String(generateDummyData(dummyField('text', col.label), row))
  }
}

function headerCell(col: ListColumnV2): string {
  if (!col.sortable) return `<th class="dads-table__col-header" scope="col">${esc(col.label)}</th>`
  return `<th class="dads-table__sort-header" scope="col" aria-sort="none">
          <div class="dads-table__sort-inner">
            <div class="dads-table__sort-label">
              <button class="dads-table__sort-button" type="button" data-sort="${esc(col.id)}">
                ${esc(col.label)}
                <span class="dads-table__sort-icon">${sortSvg(sortIcons.none)}</span>
              </button>
            </div>
          </div>
        </th>`
}

function selectCell(kind: 'single' | 'multiple', name: string, label: string): string {
  const type = kind === 'single' ? 'radio' : 'checkbox'
  return `<label class="dads-${type}" data-size="md"><span class="dads-${type}__${type}"><input${attrs({ class: `dads-${type}__input`, type, name, 'aria-label': label })}></span></label>`
}

export function renderList(section: SectionV2, ctx: ViewContext): string {
  const list = section.list
  if (!list) return ''
  const selection = list.selection === 'single' || list.selection === 'multiple' ? list.selection : undefined
  const actions = list.rowActions ?? []
  const base = domId(ctx, section.id)

  const heads = [
    selection ? `<th class="dads-table__col-header" scope="col"><span class="dads-u-visually-hidden">選択</span></th>` : '',
    ...list.columns.map(headerCell),
    actions.length > 0 ? `<th class="dads-table__col-header" scope="col"><span class="dads-u-visually-hidden">操作</span></th>` : '',
  ].join('\n        ')

  const rows = Array.from({ length: DUMMY_ROWS }, (_, r) => {
    const cells = list.columns.map(c => `<td>${esc(dummyCell(c, r))}</td>`)
    if (selection) cells.unshift(`<td>${selectCell(selection, `${base}-select`, `${r + 1}行目を選択`)}</td>`)
    if (actions.length > 0) {
      const buttons = actions
        .map(
          a =>
            `<button${attrs({
              class: 'dads-button',
              type: 'button',
              'data-type': 'text',
              'data-size': 'sm',
              'data-action': a.id,
              'data-action-kind': a.kind ?? 'custom',
              'data-navigate-to': a.kind === 'navigate' ? a.to : undefined,
            })}>${esc(a.label)}</button>`,
        )
        .join(' ')
      cells.push(`<td>${buttons}</td>`)
    }
    return `<tr>${cells.join('')}</tr>`
  }).join('\n      ')

  const empty = list.empty ?? ctx.view.states?.empty?.message
  const search = list.search
    ? `<div class="mk2-list__search"><span class="dads-input-text"><input class="dads-input-text__input" type="search" data-size="md" aria-label="${esc(section.title)}を検索"></span></div>`
    : ''
  const pageSize = list.paging?.pageSize
  return `<div class="mk2-list" data-list="${esc(section.id)}"${attrs({ 'data-page-size': pageSize })}>
${search}
<figure class="dads-table" data-row-hover-highlight${selection ? ' data-selectable' : ''}>
  <figcaption class="dads-table__caption dads-u-visually-hidden">${esc(section.title)}</figcaption>
  <table class="dads-table__table" data-width="full" data-border>
    <thead>
      <tr>
        ${heads}
      </tr>
    </thead>
    <tbody data-list-body>
      ${rows}
    </tbody>
  </table>
</figure>
${empty ? `<p class="dads-form-control-label__support-text mk2-empty" data-empty hidden>${esc(empty)}</p>` : ''}
<nav class="dads-page-navigation" aria-label="ページ">
  <span class="dads-page-navigation__counter">1 / 1</span>
</nav>
</div>`
}

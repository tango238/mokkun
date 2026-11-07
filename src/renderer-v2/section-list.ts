/**
 * kind: list → table（ソート可能列は sortable-header）+ page-navigation
 * 行は list.rows（代表行）があればそれを、なければ list-data.ts のダミー（3 行）
 * 検索と bulkActions（選択した行への操作）は表の上の同じ行に置く
 */

import type { ListColumnV2, SectionV2 } from '../types/schema-v2'
import { bulkActions as visibleBulkActions, renderActionButton } from './actions'
import { domId, type ViewContext } from './context'
import { pageNavNext, sortIcons, sortSvg } from './icons'
import { renderCell } from './list-cells'
import { columnKind, listRows } from './list-data'
import { attrs, esc } from './util'

function headerCell(col: ListColumnV2): string {
  const cls = columnKind(col) === 'number' ? ' mk2-cell--number' : ''
  if (!col.sortable) return `<th class="dads-table__col-header${cls}" scope="col">${esc(col.label)}</th>`
  return `<th class="dads-table__sort-header${cls}" scope="col" aria-sort="none">
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

function selectCell(kind: 'single' | 'multiple', name: string, label: string, rowId: string): string {
  const type = kind === 'single' ? 'radio' : 'checkbox'
  return `<label class="dads-${type}" data-size="md"><span class="dads-${type}__${type}"><input${attrs({ class: `dads-${type}__input`, type, name, value: rowId, 'aria-label': label, 'data-row-select': true })}></span></label>`
}

export function renderList(section: SectionV2, ctx: ViewContext): string {
  const list = section.list
  if (!list) return ''
  const selection = list.selection === 'single' || list.selection === 'multiple' ? list.selection : undefined
  const actions = list.rowActions ?? []
  const bulk = selection === 'multiple' ? visibleBulkActions(list, ctx) : []
  const base = domId(ctx, section.id)
  const { rows, total, given } = listRows(list, ctx)

  const heads = [
    selection ? `<th class="dads-table__col-header" scope="col"><span class="dads-u-visually-hidden">選択</span></th>` : '',
    ...list.columns.map(headerCell),
    actions.length > 0 ? `<th class="dads-table__col-header" scope="col"><span class="dads-u-visually-hidden">操作</span></th>` : '',
  ].join('\n        ')

  const body = rows
    .map((row, r) => {
      const cells = list.columns.map(c => renderCell(c, row, r, base))
      if (selection) cells.unshift(`<td>${selectCell(selection, `${base}-select`, `${r + 1}行目を選択`, row.id)}</td>`)
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
      return `<tr${attrs({ 'data-row-id': row.id })}>${cells.join('')}</tr>`
    })
    .join('\n      ')

  // empty 状態で文言がないときも、表を隠して空であることを示す
  const empty = list.empty ?? ctx.view.states?.empty?.message ?? (ctx.state === 'empty' ? '該当するデータはありません' : undefined)
  const showEmpty = ctx.state === 'empty'
  const search = list.search
    ? `<div class="mk2-list__search"><span class="dads-input-text"><input class="dads-input-text__input" type="search" data-size="md" aria-label="${esc(section.title)}を検索"></span></div>`
    : ''
  const bulkHtml =
    bulk.length > 0
      ? `<div class="mk2-list__bulk" role="group" aria-label="選択した行への操作">\n${bulk.map(a => renderActionButton(ctx, a, a.style === 'tertiary' ? 'text' : 'outline', 'md', { 'data-section': section.id, 'data-bulk': true })).join('\n')}\n</div>`
      : ''
  const controls = search || bulkHtml ? `<div class="mk2-list__controls">\n${search}\n${bulkHtml}\n</div>` : ''

  const pageSize = list.paging?.pageSize
  // ページが 1 つだけならページ送りは出さない（DADS）。rows があれば実際のページ数、なければ「1 ページ目」の見え方を示す（upstream first-page.html）
  const pages = given && pageSize ? Math.ceil(total / pageSize) : 5
  const paging =
    pageSize && pages > 1 && ctx.state !== 'empty'
      ? `<nav class="dads-page-navigation" aria-label="ページ">
  <span class="dads-page-navigation__counter">1 / ${pages}</span>
  <button class="dads-button" type="button" data-type="text" data-size="md" data-control="next">次のページ${pageNavNext}</button>
</nav>`
      : ''
  return `<div class="mk2-list" data-list="${esc(section.id)}"${attrs({ 'data-page-size': pageSize })}>
${controls}
<figure class="dads-table" data-row-hover-highlight${selection ? ' data-selectable' : ''}${rows.length === 0 ? ' hidden' : ''}>
  <figcaption class="dads-table__caption dads-u-visually-hidden">${esc(section.title)}</figcaption>
  <table class="dads-table__table" data-width="full" data-border>
    <thead>
      <tr>
        ${heads}
      </tr>
    </thead>
    <tbody data-list-body>
      ${body}
    </tbody>
  </table>
</figure>
${empty ? `<p class="dads-form-control-label__support-text mk2-empty" data-empty${showEmpty ? '' : ' hidden'}>${esc(empty)}</p>` : ''}
${paging}
</div>`
}

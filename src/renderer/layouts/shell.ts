/**
 * Layout "shell" — アプリシェル型（管理画面）
 * app_header / app_navi を全幅で最上部に置き、本文は 12 カラムグリッドのカード群にする。
 */
import type { ScreenLayout, LayoutHelpers } from './types'
import type { ScreenDefinition, Action } from '../../types/schema'
import { renderIconHtml } from '../utils/icons'
import './shell.css'

const FILTER_RE = /検索|フィルタ|絞り込み|filter|search/i

function countType(html: string, type: string): number {
  return (html.match(new RegExp(`field-type-${type}`, 'g')) ?? []).length
}

/** danger → secondary → primary の順に並べる（primary が右端） */
function sortActions(actions: Action[]): Action[] {
  const order = (style?: string) => (style === 'danger' ? 0 : style === 'primary' ? 2 : 1)
  return actions
    .map((a, i) => ({ a, i }))
    .sort((x, y) => order(x.a.style) - order(y.a.style) || x.i - y.i)
    .map(x => x.a)
}

function renderPageHeader(screen: ScreenDefinition, h: LayoutHelpers): string {
  const sorted = sortActions(screen.actions ?? [])
  const desc = screen.description
    ? `<p class="screen-description">${h.escapeHtml(screen.description)}</p>`
    : ''
  return `
    <header class="screen-header shell-page-header">
      <div class="shell-page-heading">
        <h1 class="screen-title">${h.escapeHtml(screen.title)}</h1>
        ${desc}
      </div>
      ${sorted.length ? `<div class="shell-page-actions">${h.renderActions(sorted)}</div>` : ''}
    </header>`
}

export const shellLayout: ScreenLayout = {
  id: 'shell',
  render(screen, h) {
    const sections = h.renderSections(screen)
    const hasSections = sections.length > 0
    const hasFields = !!screen.fields?.length

    const sectionsHtml = sections.map((s, i) => {
      const cls = ['form-section', 'shell-card']
      // section.role（schema 未定義）を優先し、無ければ従来のヒューリスティック
      const role = (screen.sections?.[i] as { role?: string } | undefined)?.role
      const isFilter = role ? role === 'filter' : FILTER_RE.test(s.title)
      const isKpi = role ? role === 'kpi' : countType(s.fieldsHtml, 'badge') >= 3
      if (isFilter) cls.push('shell-filter')
      if (isKpi) cls.push('shell-kpi')
      if (countType(s.fieldsHtml, 'data_table') > 0) cls.push('shell-has-table')
      return `
      <section id="${h.escapeHtml(s.id)}" class="${cls.join(' ')}">
        <div class="shell-card-header">
          <h2 class="section-title">${renderIconHtml(s.icon, 'section-icon')}${h.escapeHtml(s.title)}</h2>
          ${s.publishToggleHtml}
        </div>
        <div class="section-fields shell-grid">${s.fieldsHtml}</div>
      </section>`
    }).join('')

    if (!hasSections) {
      // login のような fields のみの画面: 1 枚のカードに収める
      const actions = screen.actions?.length
        ? `<div class="shell-card-footer">${h.renderActions(sortActions(screen.actions))}</div>`
        : ''
      return `
      <div class="screen screen--bare layout-shell">
        ${h.renderAppLayoutContainers(screen)}
        <div class="shell-body shell-body-narrow">
          <form class="screen-form">
            <section class="form-section shell-card shell-single">
              <div class="shell-card-header">
                <h1 class="screen-title">${h.escapeHtml(screen.title)}</h1>
                ${screen.description ? `<p class="screen-description">${h.escapeHtml(screen.description)}</p>` : ''}
              </div>
              ${hasFields ? `<div class="fields-section shell-single-fields">${h.renderFields(screen.fields!)}</div>` : ''}
              ${actions}
            </section>
          </form>
        </div>
      </div>`
    }

    return `
      <div class="screen screen--bare layout-shell">
        ${h.renderAppLayoutContainers(screen)}
        <div class="shell-body">
          ${renderPageHeader(screen, h)}
          <form class="screen-form">
            ${sectionsHtml}
          </form>
        </div>
      </div>`
  },
}

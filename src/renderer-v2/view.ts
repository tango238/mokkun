/**
 * View 層: 見出し、ゴール、手順ナビ、状態バナー、アクション、レイアウト（stack / tabs / sectioned）
 */

import { renderActions, renderDialogs } from './actions'
import { renderBanner } from './app-shell'
import { domId, findFlow, type ViewContext } from './context'
import { stepCompleted } from './icons'
import { renderSection, renderSections, sectionDomId } from './section'
import { attrs, esc } from './util'

/** flow の手順ナビ（step-navigation, horizontal）。前の step は completed、現在の step は reached */
export function renderStepNavigation(ctx: ViewContext): string {
  const found = findFlow(ctx.schema, ctx.viewName)
  if (!found) return ''
  const { flow, index } = found
  const total = flow.steps.length
  const steps = flow.steps
    .map((s, i) => {
      const label = s.label ?? ctx.schema.views[s.view]?.title ?? s.view
      const state = i < index ? 'completed' : i === index ? 'reached' : undefined
      const number =
        state === 'completed'
          ? `${i + 1}\n          <span class="dads-step-navigation__state-icon">${stepCompleted}</span>\n          <span class="dads-u-visually-hidden">完了</span>`
          : String(i + 1)
      return `<li${attrs({ class: 'dads-step-navigation__step', 'data-state': state, 'data-first': i === 0, 'data-last': i === total - 1, 'aria-current': i === index ? 'true' : undefined })}>
      <span class="dads-step-navigation__header">
        <span class="dads-u-visually-hidden">ステップ</span>
        <span class="dads-step-navigation__number">${number}</span>
        <span class="dads-step-navigation__title">${esc(label)}</span>
      </span>
    </li>`
    })
    .join('\n    ')
  return `<div class="dads-step-navigation" data-orientation="horizontal" data-size="normal">
  <p class="dads-u-visually-hidden">全${total}ステップ中、${index + 1}ステップ目まで到達済み</p>
  <ul>
    ${steps}
  </ul>
</div>`
}

/** states.success / error はバナー（loading は静的な描画対象外、empty は list 側で使う） */
function renderStates(ctx: ViewContext): string {
  const s = ctx.view.states
  const out: string[] = []
  if (s?.success) out.push(renderBanner(domId(ctx, 'state', 'success'), 'success', s.success.message))
  if (s?.error) out.push(renderBanner(domId(ctx, 'state', 'error'), 'error', s.error.message))
  return out.join('\n')
}

function renderTabs(ctx: ViewContext): string {
  const sections = ctx.view.sections
  const tabs = sections
    .map((s, i) => {
      const id = sectionDomId(ctx, s)
      return `<a${attrs({ class: 'dads-tab__tab', href: `#${id}-panel`, role: 'tab', id: `${id}-tab`, 'aria-selected': i === 0 ? 'true' : 'false', 'aria-controls': `${id}-panel`, tabindex: i === 0 ? undefined : '-1' })}><span>${esc(s.title)}</span></a>`
    })
    .join('\n      ')
  const panels = sections
    .map((s, i) => {
      const id = sectionDomId(ctx, s)
      return `<div${attrs({ id: `${id}-panel`, class: 'dads-tab__panel', role: 'tabpanel', 'aria-labelledby': `${id}-tab`, tabindex: '0', hidden: i !== 0 })}>
${renderSection(s, ctx)}
    </div>`
    })
    .join('\n    ')
  return `<div class="dads-tab" data-tabs>
  <div class="dads-tab__list" role="tablist">
      ${tabs}
  </div>
  <div class="dads-tab__panels">
    ${panels}
  </div>
</div>`
}

function renderToc(ctx: ViewContext): string {
  const headingId = domId(ctx, 'toc-heading')
  const links = ctx.view.sections
    .map(s => `<li><a class="dads-link" href="#${esc(sectionDomId(ctx, s))}" data-toc-link>${esc(s.title)}</a></li>`)
    .join('\n      ')
  return `<nav class="dads-toc mk2-toc" aria-labelledby="${esc(headingId)}">
  <h2 id="${esc(headingId)}" class="dads-toc__heading">この画面の内容</h2>
  <ul class="dads-list" data-spacing="8">
      ${links}
  </ul>
</nav>`
}

function renderLayout(ctx: ViewContext): string {
  const { layout, sections } = ctx.view
  if (layout === 'tabs' && sections.length > 0) return renderTabs(ctx)
  const body = renderSections(sections, ctx)
  return layout === 'sectioned' && sections.length > 0 ? `${renderToc(ctx)}\n${body}` : body
}

/** View 本体（main の中身）: パンくずは app-shell 側で前置する */
export function renderViewBody(ctx: ViewContext): string {
  const { view } = ctx
  const header = renderActions(ctx, 'header')
  const footer = renderActions(ctx, 'footer')
  const sticky = renderActions(ctx, 'sticky')
  return `<div class="mk2-view-head">
  <hgroup class="dads-heading" data-size="36">
    <p class="dads-heading__shoulder">${esc(view.goal)}</p>
    <h1 class="dads-heading__heading">${esc(view.title)}</h1>
  </hgroup>
  ${header}
</div>
${renderStepNavigation(ctx)}
${renderStates(ctx)}
${view.description ? `<p class="mk2-view-description">${esc(view.description)}</p>` : ''}
<form class="mk2-form" novalidate data-view-form>
<div class="mk2-sections" data-layout="${view.layout ?? 'stack'}">
${renderLayout(ctx)}
</div>
${footer}
${sticky ? `<div class="mk2-sticky">\n${sticky}\n</div>` : ''}
</form>
${renderDialogs(ctx)}`
}

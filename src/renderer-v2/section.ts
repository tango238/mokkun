/**
 * Section 層: kind / reveal / repeatable の出し分け
 *
 * - reveal: collapsed が 1 つだけ → DADS disclosure（見出しはサマリー自身）
 * - collapsed が連続 → 1 つの積み重ねた DADS accordion（各サマリー = セクション名）
 * - visibleWhen はセクション要素自身に付ける（見出しごと隠れる）
 */

import type { SectionV2 } from '../types/schema-v2'
import { domId, isInitiallyVisible, type ViewContext } from './context'
import { accordionChevron, disclosureIcon } from './icons'
import { renderFieldGrid, renderRepeatable } from './section-fields'
import { renderList } from './section-list'
import { renderReadonly } from './section-readonly'
import { attrs, esc } from './util'

/** Section の DOM id（toc・タブのリンク先） */
export function sectionDomId(ctx: ViewContext, section: SectionV2): string {
  return domId(ctx, 'section', section.id)
}

function renderBody(section: SectionV2, ctx: ViewContext): string {
  const kind = section.kind ?? 'form'
  if (kind === 'list') return renderList(section, ctx)
  if (kind === 'readonly' || kind === 'summary') return renderReadonly(section, ctx)
  return section.repeatable ? renderRepeatable(section, ctx) : renderFieldGrid(section, ctx)
}

/** purpose と note（どちらも控えめな support-text 相当の段落） */
function renderLead(section: SectionV2, ctx: ViewContext): string {
  const pattern = section.use ? ctx.schema.patterns?.[section.use] : undefined
  const note = section.note ?? pattern?.note
  return [
    section.purpose ? `<p class="mk2-section__purpose">${esc(section.purpose)}</p>` : '',
    note ? `<p class="dads-form-control-label__support-text mk2-section__note">${esc(note)}</p>` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

/** セクション共通の属性（id / 種別 / 表示条件）。表示条件は既定値で評価した初期状態を hidden で持つ */
function commonAttrs(section: SectionV2, ctx: ViewContext, extra: Record<string, string | boolean | undefined>): string {
  const cond = section.visibleWhen
  return attrs({
    id: sectionDomId(ctx, section),
    'data-kind': section.kind ?? 'form',
    'data-visible-when': cond ? JSON.stringify({ item: cond.item, equals: cond.equals }) : undefined,
    hidden: !isInitiallyVisible(cond, ctx),
    ...extra,
  })
}

function renderAccordionItem(section: SectionV2, ctx: ViewContext): string {
  const titleId = `${sectionDomId(ctx, section)}-title`
  return `<details class="dads-accordion mk2-section"${commonAttrs(section, ctx, {})}>
  <summary class="dads-accordion__summary">
    <span class="dads-accordion__icon">${accordionChevron}</span>
    <h2 id="${esc(titleId)}">${esc(section.title)}</h2>
  </summary>
  <div class="dads-accordion__content">
${renderLead(section, ctx)}
${renderBody(section, ctx)}
  </div>
</details>`
}

function renderDisclosure(section: SectionV2, ctx: ViewContext): string {
  const summaryId = `${sectionDomId(ctx, section)}-title`
  return `<section class="mk2-section"${commonAttrs(section, ctx, { 'aria-labelledby': summaryId })}>
<details class="dads-disclosure">
  <summary id="${esc(summaryId)}" class="dads-disclosure__summary">
    ${disclosureIcon}
    ${esc(section.title)}
  </summary>
  <div class="dads-disclosure__content">
${renderLead(section, ctx)}
${renderBody(section, ctx)}
  </div>
</details>
</section>`
}

/** 通常（open）のセクション */
export function renderSection(section: SectionV2, ctx: ViewContext): string {
  if (section.reveal === 'collapsed') return renderDisclosure(section, ctx)
  const titleId = `${sectionDomId(ctx, section)}-title`
  return `<section class="mk2-section"${commonAttrs(section, ctx, { 'aria-labelledby': titleId })}>
<div class="dads-heading" data-size="28"><h2 id="${esc(titleId)}" class="dads-heading__heading">${esc(section.title)}</h2></div>
${renderLead(section, ctx)}
${renderBody(section, ctx)}
</section>`
}

/** セクション列を描画する。連続する collapsed は 1 つの accordion にまとめ、1 つだけなら disclosure */
export function renderSections(sections: SectionV2[], ctx: ViewContext): string {
  const out: string[] = []
  for (let i = 0; i < sections.length; i++) {
    if (sections[i].reveal !== 'collapsed') {
      out.push(renderSection(sections[i], ctx))
      continue
    }
    let j = i
    while (j + 1 < sections.length && sections[j + 1].reveal === 'collapsed') j++
    const run = sections.slice(i, j + 1)
    out.push(run.length === 1 ? renderDisclosure(run[0], ctx) : `<div class="mk2-accordion-group">\n${run.map(s => renderAccordionItem(s, ctx)).join('\n')}\n</div>`)
    i = j
  }
  return out.join('\n')
}

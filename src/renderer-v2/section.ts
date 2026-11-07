/**
 * Section 層: kind / reveal / repeatable の出し分け
 */

import type { SectionV2 } from '../types/schema-v2'
import { domId, type ViewContext } from './context'
import { accordionChevron } from './icons'
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

/**
 * 1 セクションを描画する。
 * reveal: collapsed のときはセクション全体が 1 つの accordion になり、見出しは summary が兼ねる（重複見出しを出さない）。
 */
export function renderSection(section: SectionV2, ctx: ViewContext): string {
  const id = sectionDomId(ctx, section)
  const titleId = `${id}-title`
  const kind = section.kind ?? 'form'
  const rootAttrs = attrs({ id, class: 'mk2-section', 'data-kind': kind, 'aria-labelledby': titleId })
  const lead = renderLead(section, ctx)
  const body = renderBody(section, ctx)

  if (section.reveal === 'collapsed') {
    return `<section${rootAttrs}>
<details class="dads-accordion">
  <summary class="dads-accordion__summary">
    <span class="dads-accordion__icon">${accordionChevron}</span>
    <h2 id="${esc(titleId)}">${esc(section.title)}</h2>
  </summary>
  <div class="dads-accordion__content">
${lead}
${body}
  </div>
</details>
</section>`
  }

  return `<section${rootAttrs}>
<div class="dads-heading" data-size="28"><h2 id="${esc(titleId)}" class="dads-heading__heading">${esc(section.title)}</h2></div>
${lead}
${body}
</section>`
}

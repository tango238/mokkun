/**
 * kind: form の項目グリッドと repeatable
 */

import type { FieldV2, SectionV2 } from '../types/schema-v2'
import { expandSectionFields } from '../parser/v2/compile-v2'
import { domId, isInitiallyVisible, type ViewContext } from './context'
import { renderFieldV2 } from './fields'
import { attrs, esc } from './util'

/** 添字付きの DOM id / name の区切り。mount.ts が繰り返しの再採番に使う */
export const GROUP_SEP = '__'

function expandedFields(section: SectionV2, ctx: ViewContext): FieldV2[] {
  return expandSectionFields(section, ctx.schema.patterns).map(ef => ({
    ...ef.field,
    // pattern 由来は id を `<section.id>_<item>` に前置済み。section.visibleWhen は自身の条件がない項目に適用
    item: ef.id,
    visibleWhen: ef.field.visibleWhen ?? section.visibleWhen,
  }))
}

/** 項目グリッド。group を渡すと繰り返しグループ内（id / name に添字を付ける） */
export function renderFieldGrid(section: SectionV2, ctx: ViewContext, group?: number): string {
  const suffix = group === undefined ? '' : `${GROUP_SEP}${group}`
  const fields = expandedFields(section, ctx)
    .map(f =>
      renderFieldV2(f, {
        domId: `${domId(ctx, f.item)}${suffix}`,
        name: `${f.item}${suffix}`,
        hidden: !isInitiallyVisible(f.visibleWhen, ctx),
      }),
    )
    .join('\n')
  return `<div class="mk2-fields" data-columns="${section.columns ?? 1}">\n${fields}\n</div>`
}

function renderGroup(section: SectionV2, ctx: ViewContext, n: number): string {
  const headingId = `${domId(ctx, section.id, 'group')}${GROUP_SEP}${n}`
  return `<div class="mk2-repeat-group" role="group" aria-labelledby="${esc(headingId)}" data-repeat-group>
  <div class="mk2-repeat-group__head">
    <div class="dads-heading" data-size="20"><h3 id="${esc(headingId)}" class="dads-heading__heading">#<span data-group-no>${n}</span></h3></div>
    <button type="button" class="dads-button" data-type="outline" data-size="sm" data-repeat-remove aria-describedby="${esc(headingId)}">削除</button>
  </div>
  ${renderFieldGrid(section, ctx, n)}
</div>`
}

/** 繰り返し: min 件を初期表示し、追加用に <template> を持つ */
export function renderRepeatable(section: SectionV2, ctx: ViewContext): string {
  const rep = section.repeatable ?? {}
  const min = Math.max(0, rep.min ?? 1)
  const groups = Array.from({ length: min }, (_, i) => renderGroup(section, ctx, i + 1)).join('\n')
  return `<div class="mk2-repeatable"${attrs({ 'data-repeatable': section.id, 'data-min': rep.min ?? 1, 'data-max': rep.max })}>
<div class="mk2-repeat-groups" data-repeat-groups>
${groups}
</div>
<template data-repeat-template>${renderGroup(section, ctx, 0)}</template>
<button type="button" class="dads-button" data-type="outline" data-size="md" data-repeat-add>${esc(rep.addLabel ?? '追加')}</button>
</div>`
}

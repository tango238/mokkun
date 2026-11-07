/**
 * Section の項目展開（patterns の use）。パーサー・コンパイラ・レンダラーで共有する軽量モジュール
 */

import type { ConditionV2, FieldV2, PatternV2, SectionV2 } from '../../types/schema-v2'

/**
 * 合成フィールド（stepper / 通知 / 一覧など）の id 接頭辞。item と衝突しない。
 * セクション由来は `_v2_s_`（本体）/ `_v2_n_`（note）/ `_v2_p_`（accordion）+ section.id、
 * view 由来は `_v2_` + 固定名で、互いに衝突しない。
 */
export const SYNTH_PREFIX = '_v2_'

/** section 内の展開済みフィールド（use 由来は id に section.id を前置） */
export interface ExpandedField {
  field: FieldV2
  id: string
  /** patterns 由来か */
  fromPattern: boolean
}

/**
 * section.fields と patterns[use].fields を展開する。
 * pattern 由来のフィールドは id を `<sectionId>_<item>` にし、
 * pattern 内で同じ pattern のフィールドを指す visibleWhen / requiredWhen は前置した id に書き換える。
 */
export function expandSectionFields(
  section: SectionV2,
  patterns: Record<string, PatternV2> | undefined
): ExpandedField[] {
  const out: ExpandedField[] = []
  const pattern = section.use && patterns && Object.hasOwn(patterns, section.use) ? patterns[section.use] : undefined
  if (pattern?.fields) {
    const items = new Set(pattern.fields.map(f => f.item))
    const prefix = (cond: ConditionV2): ConditionV2 => (items.has(cond.item) ? { ...cond, item: `${section.id}_${cond.item}` } : cond)
    for (const f of pattern.fields) {
      const field: FieldV2 =
        f.visibleWhen || f.requiredWhen
          ? {
              ...f,
              ...(f.visibleWhen ? { visibleWhen: prefix(f.visibleWhen) } : {}),
              ...(f.requiredWhen ? { requiredWhen: prefix(f.requiredWhen) } : {}),
            }
          : f
      out.push({ field, id: `${section.id}_${f.item}`, fromPattern: true })
    }
  }
  for (const f of section.fields ?? []) out.push({ field: f, id: f.item, fromPattern: false })
  return out
}

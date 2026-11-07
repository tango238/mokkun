/**
 * View 層と Section 層の検証（項目 id の重複、条件の参照先、action id の一意性を含む）
 */

import type { FieldV2, PatternV2, SectionV2 } from '../../types/schema-v2'
import { expandSectionFields } from './compile-v2'
import { checkAction } from './validate-action'
import { checkConditionShape, checkField, conditionItem } from './validate-field'
import { checkList } from './validate-list'
import { isNonEmptyString, isObject, REVEALS, SECTION_KINDS, VIEW_LAYOUTS, type Obj, type VCtx } from './validate-context'

interface ConditionRef {
  item: string
  path: string
  /** visibleWhen / requiredWhen（エラー文言用） */
  name: string
}

/** pattern を安全に展開できる形に絞る（壊れた項目は別途エラーになっている） */
function safePatternsOf(patterns: Record<string, PatternV2>): Record<string, PatternV2> {
  const safe: Record<string, PatternV2> = {}
  for (const [k, p] of Object.entries(patterns)) {
    safe[k] = { fields: Array.isArray(p.fields) ? p.fields.filter(f => isObject(f) && isNonEmptyString(f.item)) : [] }
  }
  return safe
}

interface ViewScope {
  viewName: string
  fieldIds: Set<string>
  conditions: ConditionRef[]
  /** パターン由来の項目（bare 名 → 前置後 id）。参照ミスのヒント用 */
  patternIds: Array<{ item: string; id: string }>
  sectionIds: Set<string>
}

function checkSection(v: VCtx, section: unknown, sp: string, scope: ViewScope, patterns: Record<string, PatternV2>): void {
  if (!isObject(section)) {
    v.add('INVALID_VALUE', 'Section must be an object', sp)
    return
  }
  if (!isNonEmptyString(section.id)) {
    v.add('MISSING_REQUIRED_FIELD', 'Section must have an "id"', `${sp}.id`)
  } else if (scope.sectionIds.has(section.id)) {
    v.add('INVALID_VALUE', `Duplicate section id "${section.id}"`, `${sp}.id`)
  } else {
    scope.sectionIds.add(section.id)
  }
  v.checkString(section.title, `${sp}.title`, 'title', true)
  v.checkEnum(section.kind, SECTION_KINDS, `${sp}.kind`, 'kind')
  v.checkEnum(section.reveal, REVEALS, `${sp}.reveal`, 'reveal')
  v.checkEnum(section.columns, [1, 2, 3], `${sp}.columns`, 'columns')
  if (section.note !== undefined) v.checkString(section.note, `${sp}.note`, 'note')

  const kind = (section.kind ?? 'form') as string
  if (kind !== 'form') {
    if (section.reveal !== undefined) v.add('INVALID_VALUE', `reveal is only valid for kind "form" (got "${String(kind)}")`, `${sp}.reveal`)
    if (section.repeatable !== undefined) v.add('INVALID_VALUE', `repeatable is only valid for kind "form" (got "${String(kind)}")`, `${sp}.repeatable`)
  }
  if (section.repeatable !== undefined && !isObject(section.repeatable)) {
    v.add('INVALID_VALUE', 'repeatable must be an object', `${sp}.repeatable`)
  } else if (isObject(section.repeatable)) {
    const { min, max } = section.repeatable
    if (typeof min === 'number' && typeof max === 'number' && min > max) {
      v.add('INVALID_VALUE', `repeatable.min (${min}) must not be greater than max (${max})`, `${sp}.repeatable.min`)
    }
  }

  if (section.use !== undefined && !(isNonEmptyString(section.use) && Object.hasOwn(patterns, section.use))) {
    v.add('INVALID_VALUE', `Unknown pattern "${String(section.use)}"`, `${sp}.use`)
  }

  if (section.visibleWhen !== undefined && checkConditionShape(v, section.visibleWhen, `${sp}.visibleWhen`)) {
    scope.conditions.push({ item: conditionItem(section.visibleWhen)!, path: `${sp}.visibleWhen.item`, name: 'visibleWhen' })
  }

  if (section.actions !== undefined) {
    if (!Array.isArray(section.actions)) v.add('INVALID_VALUE', 'Section "actions" must be an array', `${sp}.actions`)
    else section.actions.forEach((a, i) => checkAction(v, a, `${sp}.actions[${i}]`, { section: true }))
  }

  if (kind === 'list') {
    if (section.fields !== undefined) {
      v.add('INVALID_VALUE', 'fields is not valid for kind "list" (use "list.columns")', `${sp}.fields`)
    }
    checkList(v, section.list, sp)
  }

  if (section.fields !== undefined && !Array.isArray(section.fields)) {
    v.add('INVALID_VALUE', 'Section "fields" must be an array', `${sp}.fields`)
    return
  }
  const fields = (section.fields ?? []) as unknown[]
  fields.forEach((field, fi) => {
    const fp = `${sp}.fields[${fi}]`
    checkField(v, field, fp)
    // 値を遷移リンクにする `to` は表示系の Section（readonly / summary）だけ
    if (isObject(field) && field.to !== undefined && kind !== 'readonly' && kind !== 'summary') {
      v.add('INVALID_VALUE', `field "to" is only valid in sections of kind "readonly" or "summary" (got "${kind}")`, `${fp}.to`)
    }
  })

  // 展開（use / 前置）して id の重複と条件の参照を集める。形が壊れている section は後段に進めない
  const shapeOk =
    fields.every(f => isObject(f) && isNonEmptyString(f.item)) &&
    (section.use === undefined || (isNonEmptyString(section.use) && Object.hasOwn(patterns, section.use))) &&
    isNonEmptyString(section.id)
  if (!shapeOk) return
  const expanded = expandSectionFields(section as unknown as SectionV2, safePatternsOf(patterns))
  const patternCount = expanded.filter(e => e.fromPattern).length
  expanded.forEach((ef, i) => {
    const base = ef.fromPattern ? `${sp}.use` : `${sp}.fields[${i - patternCount}]`
    const fp = ef.fromPattern ? base : `${base}.item`
    if (scope.fieldIds.has(ef.id)) v.add('INVALID_VALUE', `Duplicate field id "${ef.id}" in view "${scope.viewName}"`, fp)
    scope.fieldIds.add(ef.id)
    if (ef.fromPattern) {
      scope.patternIds.push({ item: ef.field.item, id: ef.id })
      if (ef.field.to !== undefined && kind !== 'readonly' && kind !== 'summary') {
        v.add('INVALID_VALUE', `field "to" is only valid in sections of kind "readonly" or "summary" (got "${kind}")`, base)
      }
    }
    const f = ef.field as FieldV2
    for (const key of ['visibleWhen', 'requiredWhen'] as const) {
      const item = conditionItem(f[key])
      if (item) scope.conditions.push({ item, path: ef.fromPattern ? base : `${base}.${key}.item`, name: key })
    }
  })
}

/** action id は view 内で一意（primary / secondary / rowActions / bulkActions / Section.actions。data-action での識別に使う） */
function checkActionIds(v: VCtx, viewName: string, view: Obj, vp: string, sections: unknown[]): void {
  const ids = new Map<string, string>()
  const claim = (action: unknown, path: string) => {
    if (!isObject(action) || !isNonEmptyString(action.id)) return
    if (ids.has(action.id)) {
      v.add('INVALID_VALUE', `Duplicate action id "${action.id}" in view "${viewName}" (also at ${ids.get(action.id)})`, `${path}.id`)
    } else {
      ids.set(action.id, path)
    }
  }
  if (isObject(view.primaryAction)) claim(view.primaryAction, `${vp}.primaryAction`)
  if (Array.isArray(view.secondaryActions)) view.secondaryActions.forEach((a, i) => claim(a, `${vp}.secondaryActions[${i}]`))
  sections.forEach((section, si) => {
    if (!isObject(section)) return
    const sp = `${vp}.sections[${si}]`
    if (Array.isArray(section.actions)) section.actions.forEach((a, i) => claim(a, `${sp}.actions[${i}]`))
    if (isObject(section.list)) {
      const { rowActions, bulkActions } = section.list
      if (Array.isArray(rowActions)) rowActions.forEach((a, i) => claim(a, `${sp}.list.rowActions[${i}]`))
      if (Array.isArray(bulkActions)) bulkActions.forEach((a, i) => claim(a, `${sp}.list.bulkActions[${i}]`))
    }
  })
}

export function checkViews(
  v: VCtx,
  views: Obj,
  patterns: Record<string, PatternV2>,
  navViews: Set<string> | undefined,
): void {
  for (const [viewName, view] of Object.entries(views)) {
    const vp = `views.${viewName}`
    if (!isObject(view)) {
      v.add('INVALID_VALUE', 'View must be an object', vp)
      continue
    }
    v.checkString(view.title, `${vp}.title`, 'title', true)
    v.checkString(view.goal, `${vp}.goal`, 'goal', true)
    v.checkEnum(view.layout, VIEW_LAYOUTS, `${vp}.layout`, 'layout')
    if (view.nav !== undefined) {
      if (navViews === undefined) {
        v.add('INVALID_VALUE', 'nav is set but app.navigation is not defined', `${vp}.nav`)
      } else if (!navViews.has(String(view.nav))) {
        v.add('INVALID_VALUE', `nav "${String(view.nav)}" is not in app.navigation`, `${vp}.nav`)
      }
    }
    if (view.states !== undefined) {
      if (!isObject(view.states)) {
        v.add('INVALID_VALUE', 'states must be an object', `${vp}.states`)
      } else {
        for (const [state, value] of Object.entries(view.states)) {
          if (!isObject(value) || typeof value.message !== 'string') {
            v.add('INVALID_VALUE', `states.${state} must be an object with a string "message"`, `${vp}.states.${state}`)
          }
        }
      }
    }

    if (view.primaryAction !== undefined) {
      if (Array.isArray(view.primaryAction)) {
        v.add('INVALID_VALUE', 'primaryAction must be a single action (at most one per view)', `${vp}.primaryAction`)
      } else {
        checkAction(v, view.primaryAction, `${vp}.primaryAction`)
      }
    }
    if (view.secondaryActions !== undefined) {
      if (!Array.isArray(view.secondaryActions)) {
        v.add('INVALID_VALUE', 'secondaryActions must be an array', `${vp}.secondaryActions`)
      } else {
        view.secondaryActions.forEach((a, i) => checkAction(v, a, `${vp}.secondaryActions[${i}]`))
      }
    }

    if (!Array.isArray(view.sections)) {
      v.add('MISSING_REQUIRED_FIELD', 'View must have "sections"', `${vp}.sections`)
      continue
    }

    const scope: ViewScope = { viewName, fieldIds: new Set(), conditions: [], patternIds: [], sectionIds: new Set() }
    view.sections.forEach((section, si) => checkSection(v, section, `${vp}.sections[${si}]`, scope, patterns))
    checkActionIds(v, viewName, view, vp, view.sections)

    for (const c of scope.conditions) {
      if (!scope.fieldIds.has(c.item)) {
        const hit = scope.patternIds.find(p => p.item === c.item)
        const hint = hit ? `（パターン由来の項目は ${hit.id} で参照します）` : ''
        v.add('INVALID_VALUE', `${c.name} references unknown field "${c.item}"${hint}`, c.path)
      }
    }
  }
}

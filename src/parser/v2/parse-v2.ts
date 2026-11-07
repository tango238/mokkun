/**
 * Mokkun v2 パーサー
 * 判別（isV2Document）、構造検証（ajv に依存せず手書き）、compileV2 による旧フォーマットへの変換
 */

import type { MokkunSchema } from '../../types/schema'
import type { MokkunV2Schema, FieldV2, SectionV2, PatternV2 } from '../../types/schema-v2'
import { VALID_COMPONENTS_V2 } from '../../types/schema-v2'
import type { ParseError, ParseErrorType, ParseResult } from '../yaml-parser'
import { compileV2, expandSectionFields, SYNTH_PREFIX } from './compile-v2'

type Obj = Record<string, unknown>

function isObject(value: unknown): value is Obj {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

/**
 * v2 ドキュメントかどうか（トップレベルの `mokkun` が 2）
 */
export function isV2Document(data: unknown): boolean {
  return isObject(data) && data.mokkun === 2
}

/**
 * トップレベルに `mokkun` キーがあるか（バージョン不一致を v1 として扱わないための判定）
 */
export function hasMokkunVersionKey(data: unknown): boolean {
  return isObject(data) && Object.hasOwn(data, 'mokkun')
}

// 列挙値（schema-v2.json と揃える）
const APP_LAYOUTS = ['shell', 'plain']
const FLOW_PROGRESS = ['stepper', 'none']
const VIEW_LAYOUTS = ['stack', 'tabs', 'sectioned']
const SECTION_KINDS = ['form', 'list', 'readonly', 'summary']
const REVEALS = ['open', 'collapsed']
const ACTION_KINDS = ['submit', 'navigate', 'custom', 'reset']
const ACTION_PLACEMENTS = ['header', 'footer', 'sticky']
const ACTION_STYLES = ['primary', 'secondary', 'danger']
const SELECTIONS = ['none', 'single', 'multiple']
const NOTICE_VARIANTS = ['info', 'success', 'warning', 'error']
const PATTERN_KEYS = ['fields', 'note']

/**
 * v2 の構造を検証してエラー一覧を返す。入力が不正でも例外を投げない。
 */
function validateV2(data: Obj): ParseError[] {
  const errors: ParseError[] = []
  const add = (type: ParseErrorType, message: string, path: string) => errors.push({ type, message, path })

  const checkEnum = (value: unknown, allowed: string[] | number[], path: string, name: string) => {
    if (value !== undefined && !(allowed as unknown[]).includes(value)) {
      add('INVALID_VALUE', `Invalid ${name} "${String(value)}" (expected one of: ${allowed.join(', ')})`, path)
    }
  }
  const checkString = (value: unknown, path: string, name: string, required = false) => {
    if (value === undefined) {
      if (required) add('MISSING_REQUIRED_FIELD', `${name} is required`, path)
    } else if (!isNonEmptyString(value) && !(typeof value === 'string' && !required)) {
      add('INVALID_VALUE', `${name} must be a${required ? ' non-empty' : ''} string`, path)
    }
  }

  // --- app ---
  const app = isObject(data.app) ? data.app : undefined
  if (!app) {
    add('MISSING_REQUIRED_FIELD', 'v2 schema must have an "app" object', 'app')
  } else {
    checkString(app.name, 'app.name', 'app.name', true)
    checkEnum(app.layout, APP_LAYOUTS, 'app.layout', 'app.layout')
    if (app.header !== undefined && !isObject(app.header)) {
      add('INVALID_VALUE', 'app.header must be an object', 'app.header')
    }
    if (app.roles !== undefined && !Array.isArray(app.roles)) {
      add('INVALID_VALUE', 'app.roles must be an array', 'app.roles')
    }
    if (app.notifications !== undefined) {
      if (!Array.isArray(app.notifications)) {
        add('INVALID_VALUE', 'app.notifications must be an array', 'app.notifications')
      } else {
        app.notifications.forEach((n, i) => {
          const p = `app.notifications[${i}]`
          if (!isObject(n)) {
            add('INVALID_VALUE', 'Notice must be an object', p)
            return
          }
          checkString(n.message, `${p}.message`, 'message', true)
          checkEnum(n.variant, NOTICE_VARIANTS, `${p}.variant`, 'variant')
        })
      }
    }
  }

  // --- rules ---
  const rules = isObject(data.rules) ? data.rules : {}
  if (data.rules !== undefined) {
    if (!isObject(data.rules)) {
      add('INVALID_VALUE', '"rules" must be an object', 'rules')
    } else {
      for (const [name, rule] of Object.entries(data.rules)) {
        if (!isObject(rule)) add('INVALID_VALUE', 'Rule must be an object', `rules.${name}`)
      }
    }
  }

  // --- views ---
  if (!isObject(data.views)) {
    add('MISSING_REQUIRED_FIELD', 'v2 schema must have a "views" object', 'views')
    return errors
  }
  const views = data.views
  if (Object.keys(views).length === 0) {
    add('MISSING_REQUIRED_FIELD', '"views" must have at least one view', 'views')
  }
  const viewNames = new Set(Object.keys(views))
  const checkViewRef = (name: unknown, path: string) => {
    if (!isNonEmptyString(name)) {
      add('MISSING_REQUIRED_FIELD', 'view reference is required', path)
    } else if (!viewNames.has(name)) {
      add('INVALID_VALUE', `Unknown view "${name}"`, path)
    }
  }

  // --- navigation ---
  const navViews = new Set<string>()
  const navigation = app?.navigation
  if (navigation !== undefined) {
    if (!Array.isArray(navigation)) {
      add('INVALID_VALUE', 'app.navigation must be an array', 'app.navigation')
    } else {
      navigation.forEach((group, gi) => {
        const gp = `app.navigation[${gi}]`
        if (!isObject(group)) {
          add('INVALID_VALUE', 'Navigation group must be an object', gp)
          return
        }
        checkString(group.group, `${gp}.group`, 'group', true)
        if (!Array.isArray(group.items)) {
          add('MISSING_REQUIRED_FIELD', 'navigation group must have "items"', `${gp}.items`)
          return
        }
        group.items.forEach((item, ii) => {
          const path = `${gp}.items[${ii}].view`
          checkViewRef(isObject(item) ? item.view : undefined, path)
          if (isObject(item) && isNonEmptyString(item.view)) navViews.add(item.view)
        })
      })
    }
  }

  // --- flows ---
  if (data.flows !== undefined) {
    if (!isObject(data.flows)) {
      add('INVALID_VALUE', '"flows" must be an object', 'flows')
    } else {
      for (const [name, flow] of Object.entries(data.flows)) {
        const path = `flows.${name}`
        if (!isObject(flow)) {
          add('INVALID_VALUE', 'Flow must be an object', path)
          continue
        }
        checkString(flow.name, `${path}.name`, 'name', true)
        checkString(flow.outcome, `${path}.outcome`, 'outcome', true)
        checkEnum(flow.progress, FLOW_PROGRESS, `${path}.progress`, 'progress')
        if (!Array.isArray(flow.steps) || flow.steps.length === 0) {
          add('MISSING_REQUIRED_FIELD', 'Flow must have "steps"', `${path}.steps`)
        } else {
          flow.steps.forEach((step, i) => checkViewRef(isObject(step) ? step.view : undefined, `${path}.steps[${i}].view`))
        }
      }
    }
  }

  // --- 共通の検証 ---
  const checkAction = (action: unknown, path: string) => {
    if (!isObject(action)) {
      add('INVALID_VALUE', 'Action must be an object', path)
      return
    }
    checkString(action.id, `${path}.id`, 'id', true)
    checkString(action.label, `${path}.label`, 'label', true)
    checkEnum(action.kind, ACTION_KINDS, `${path}.kind`, 'kind')
    checkEnum(action.placement, ACTION_PLACEMENTS, `${path}.placement`, 'placement')
    checkEnum(action.style, ACTION_STYLES, `${path}.style`, 'style')
    if (action.kind === 'navigate') checkViewRef(action.to, `${path}.to`)
    else if (action.to !== undefined) checkViewRef(action.to, `${path}.to`)
    if (action.confirm !== undefined) {
      if (!isObject(action.confirm)) add('INVALID_VALUE', 'confirm must be an object', `${path}.confirm`)
      else checkString(action.confirm.message, `${path}.confirm.message`, 'confirm.message', true)
    }
  }

  /** visibleWhen の形のみ検証（参照先の存在は view 単位で後段チェック） */
  const checkConditionShape = (cond: unknown, path: string): boolean => {
    if (!isObject(cond)) {
      add('INVALID_VALUE', 'visibleWhen must be an object with "item" and "equals"', path)
      return false
    }
    let ok = true
    if (!isNonEmptyString(cond.item)) {
      add('INVALID_VALUE', 'visibleWhen.item must be a non-empty string', `${path}.item`)
      ok = false
    }
    if (!Object.hasOwn(cond, 'equals')) {
      add('MISSING_REQUIRED_FIELD', 'visibleWhen.equals is required', `${path}.equals`)
      ok = false
    }
    return ok
  }

  const checkField = (field: unknown, path: string) => {
    if (!isObject(field)) {
      add('INVALID_VALUE', 'Field must be an object', path)
      return
    }
    checkString(field.item, `${path}.item`, 'item', true)
    if (typeof field.item === 'string' && field.item.startsWith(SYNTH_PREFIX)) {
      add('INVALID_VALUE', `item must not start with "${SYNTH_PREFIX}" (reserved)`, `${path}.item`)
    }
    checkString(field.label, `${path}.label`, 'label', true)
    if (!(typeof field.component === 'string' && (VALID_COMPONENTS_V2 as readonly string[]).includes(field.component))) {
      add('INVALID_FIELD_TYPE', `Invalid component "${String(field.component)}"`, `${path}.component`)
    }
    if (field.options !== undefined) {
      if (!Array.isArray(field.options)) {
        add('INVALID_VALUE', 'options must be an array', `${path}.options`)
      } else {
        field.options.forEach((o, i) => {
          const op = `${path}.options[${i}]`
          if (!isObject(o)) add('INVALID_VALUE', 'option must be an object with "value" and "label"', op)
          else {
            if (!Object.hasOwn(o, 'value')) add('MISSING_REQUIRED_FIELD', 'option must have "value"', `${op}.value`)
            if (typeof o.label !== 'string') add('MISSING_REQUIRED_FIELD', 'option must have a string "label"', `${op}.label`)
          }
        })
      }
    }
    if (field.rules !== undefined) {
      if (!Array.isArray(field.rules)) {
        add('INVALID_VALUE', 'rules must be an array', `${path}.rules`)
      } else {
        field.rules.forEach((r, i) => {
          const rp = `${path}.rules[${i}]`
          if (typeof r === 'string') {
            if (!Object.hasOwn(rules, r)) add('INVALID_VALUE', `Unknown rule "${r}" (not defined in top-level rules)`, rp)
          } else if (!isObject(r)) {
            add('INVALID_VALUE', 'rule must be a rule name or an object', rp)
          }
        })
      }
    }
    if (field.visibleWhen !== undefined) checkConditionShape(field.visibleWhen, `${path}.visibleWhen`)
    if (field.props !== undefined && !isObject(field.props)) add('INVALID_VALUE', 'props must be an object', `${path}.props`)
  }

  // --- patterns ---
  const patterns: Record<string, PatternV2> = {}
  if (data.patterns !== undefined) {
    if (!isObject(data.patterns)) {
      add('INVALID_VALUE', '"patterns" must be an object', 'patterns')
    } else {
      for (const [name, pattern] of Object.entries(data.patterns)) {
        const pp = `patterns.${name}`
        if (!isObject(pattern)) {
          add('INVALID_VALUE', 'Pattern must be an object', pp)
          continue
        }
        for (const key of Object.keys(pattern)) {
          if (!PATTERN_KEYS.includes(key)) {
            add('INVALID_VALUE', `Unsupported pattern key "${key}" (only fields and note; nested "use" is not supported)`, `${pp}.${key}`)
          }
        }
        if (pattern.note !== undefined) checkString(pattern.note, `${pp}.note`, 'note')
        if (pattern.fields !== undefined) {
          if (!Array.isArray(pattern.fields)) add('INVALID_VALUE', 'pattern "fields" must be an array', `${pp}.fields`)
          else pattern.fields.forEach((f, i) => checkField(f, `${pp}.fields[${i}]`))
        }
        patterns[name] = pattern as PatternV2
      }
    }
  }

  // --- views ---
  for (const [viewName, view] of Object.entries(views)) {
    const vp = `views.${viewName}`
    if (!isObject(view)) {
      add('INVALID_VALUE', 'View must be an object', vp)
      continue
    }
    checkString(view.title, `${vp}.title`, 'title', true)
    checkString(view.goal, `${vp}.goal`, 'goal', true)
    checkEnum(view.layout, VIEW_LAYOUTS, `${vp}.layout`, 'layout')
    if (view.nav !== undefined) {
      if (navigation === undefined) {
        add('INVALID_VALUE', 'nav is set but app.navigation is not defined', `${vp}.nav`)
      } else if (!navViews.has(String(view.nav))) {
        add('INVALID_VALUE', `nav "${String(view.nav)}" is not in app.navigation`, `${vp}.nav`)
      }
    }
    if (view.states !== undefined) {
      if (!isObject(view.states)) {
        add('INVALID_VALUE', 'states must be an object', `${vp}.states`)
      } else {
        for (const [state, value] of Object.entries(view.states)) {
          if (!isObject(value) || typeof value.message !== 'string') {
            add('INVALID_VALUE', `states.${state} must be an object with a string "message"`, `${vp}.states.${state}`)
          }
        }
      }
    }

    if (view.primaryAction !== undefined) {
      if (Array.isArray(view.primaryAction)) {
        add('INVALID_VALUE', 'primaryAction must be a single action (at most one per view)', `${vp}.primaryAction`)
      } else {
        checkAction(view.primaryAction, `${vp}.primaryAction`)
      }
    }
    if (view.secondaryActions !== undefined) {
      if (!Array.isArray(view.secondaryActions)) {
        add('INVALID_VALUE', 'secondaryActions must be an array', `${vp}.secondaryActions`)
      } else {
        view.secondaryActions.forEach((a, i) => checkAction(a, `${vp}.secondaryActions[${i}]`))
      }
    }

    if (!Array.isArray(view.sections)) {
      add('MISSING_REQUIRED_FIELD', 'View must have "sections"', `${vp}.sections`)
      continue
    }

    // 展開後の id（重複検出と visibleWhen 参照チェック用）
    const fieldIds = new Set<string>()
    const conditions: Array<{ item: string; path: string }> = []
    const sectionIds = new Set<string>()

    view.sections.forEach((section, si) => {
      const sp = `${vp}.sections[${si}]`
      if (!isObject(section)) {
        add('INVALID_VALUE', 'Section must be an object', sp)
        return
      }
      if (!isNonEmptyString(section.id)) {
        add('MISSING_REQUIRED_FIELD', 'Section must have an "id"', `${sp}.id`)
      } else if (sectionIds.has(section.id)) {
        add('INVALID_VALUE', `Duplicate section id "${section.id}"`, `${sp}.id`)
      } else {
        sectionIds.add(section.id)
      }
      checkString(section.title, `${sp}.title`, 'title', true)
      checkEnum(section.kind, SECTION_KINDS, `${sp}.kind`, 'kind')
      checkEnum(section.reveal, REVEALS, `${sp}.reveal`, 'reveal')
      checkEnum(section.columns, [1, 2, 3], `${sp}.columns`, 'columns')
      if (section.note !== undefined) checkString(section.note, `${sp}.note`, 'note')

      const kind = section.kind ?? 'form'
      if (kind !== 'form') {
        if (section.reveal !== undefined) add('INVALID_VALUE', `reveal is only valid for kind "form" (got "${String(kind)}")`, `${sp}.reveal`)
        if (section.repeatable !== undefined) add('INVALID_VALUE', `repeatable is only valid for kind "form" (got "${String(kind)}")`, `${sp}.repeatable`)
      }
      if (section.repeatable !== undefined && !isObject(section.repeatable)) {
        add('INVALID_VALUE', 'repeatable must be an object', `${sp}.repeatable`)
      }

      if (section.use !== undefined && !(isNonEmptyString(section.use) && Object.hasOwn(patterns, section.use))) {
        add('INVALID_VALUE', `Unknown pattern "${String(section.use)}"`, `${sp}.use`)
      }

      if (section.visibleWhen !== undefined && checkConditionShape(section.visibleWhen, `${sp}.visibleWhen`)) {
        conditions.push({ item: (section.visibleWhen as Obj).item as string, path: `${sp}.visibleWhen.item` })
      }

      if (kind === 'list') {
        const list = section.list
        if (!isObject(list)) {
          add('MISSING_REQUIRED_FIELD', 'Section of kind "list" must have "list"', `${sp}.list`)
        } else {
          if (!Array.isArray(list.columns) || list.columns.length === 0) {
            add('MISSING_REQUIRED_FIELD', 'list.columns must be a non-empty array', `${sp}.list.columns`)
          } else {
            list.columns.forEach((c, i) => {
              const cp = `${sp}.list.columns[${i}]`
              if (!isObject(c)) add('INVALID_VALUE', 'column must be an object', cp)
              else {
                checkString(c.id, `${cp}.id`, 'column id', true)
                checkString(c.label, `${cp}.label`, 'column label', true)
              }
            })
          }
          if (list.rowActions !== undefined) {
            if (!Array.isArray(list.rowActions)) add('INVALID_VALUE', 'list.rowActions must be an array', `${sp}.list.rowActions`)
            else list.rowActions.forEach((a, i) => checkAction(a, `${sp}.list.rowActions[${i}]`))
          }
          checkEnum(list.selection, SELECTIONS, `${sp}.list.selection`, 'selection')
        }
      }

      if (section.fields !== undefined && !Array.isArray(section.fields)) {
        add('INVALID_VALUE', 'Section "fields" must be an array', `${sp}.fields`)
        return
      }
      const fields = (section.fields ?? []) as unknown[]
      fields.forEach((field, fi) => checkField(field, `${sp}.fields[${fi}]`))

      // 展開（use / 前置）して id の重複と visibleWhen 参照を集める。形が壊れている section は後段に進めない
      const shapeOk = fields.every(f => isObject(f) && isNonEmptyString(f.item)) &&
        (section.use === undefined || (isNonEmptyString(section.use) && Object.hasOwn(patterns, section.use))) &&
        isNonEmptyString(section.id)
      if (!shapeOk) return
      const safePatterns: Record<string, PatternV2> = {}
      for (const [k, p] of Object.entries(patterns)) {
        safePatterns[k] = { fields: Array.isArray(p.fields) ? p.fields.filter(f => isObject(f) && isNonEmptyString(f.item)) : [] }
      }
      const expanded = expandSectionFields(section as unknown as SectionV2, safePatterns)
      expanded.forEach((ef, i) => {
        const fp = ef.fromPattern
          ? `${sp}.use`
          : `${sp}.fields[${i - expanded.filter(e => e.fromPattern).length}].item`
        if (fieldIds.has(ef.id)) add('INVALID_VALUE', `Duplicate field id "${ef.id}" in view "${viewName}"`, fp)
        fieldIds.add(ef.id)
        const cond = ef.field.visibleWhen as FieldV2['visibleWhen'] | undefined
        if (isObject(cond) && isNonEmptyString((cond as Obj).item)) {
          conditions.push({ item: cond.item, path: ef.fromPattern ? `${sp}.use` : `${fp.replace(/\.item$/, '')}.visibleWhen.item` })
        }
      })
    })

    for (const c of conditions) {
      if (!fieldIds.has(c.item)) add('INVALID_VALUE', `visibleWhen references unknown field "${c.item}"`, c.path)
    }
  }

  return errors
}

/**
 * v2 ドキュメント（yaml.load 済みの生データ）を検証し、旧フォーマットへコンパイルする
 */
export function parseV2(data: unknown): ParseResult<MokkunSchema> {
  if (!isObject(data)) {
    return { success: false, errors: [{ type: 'SCHEMA_VALIDATION_ERROR', message: 'Root must be an object', path: '' }] }
  }
  if (data.mokkun !== 2) {
    return {
      success: false,
      errors: [
        {
          type: 'SCHEMA_VALIDATION_ERROR',
          message: `unsupported mokkun format version: ${JSON.stringify(data.mokkun)} (expected 2)`,
          path: 'mokkun',
        },
      ],
    }
  }
  try {
    const errors = validateV2(data)
    if (errors.length > 0) return { success: false, errors }
    return { success: true, data: compileV2(data as unknown as MokkunV2Schema) }
  } catch (error) {
    return {
      success: false,
      errors: [
        {
          type: 'SCHEMA_VALIDATION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error while compiling v2 schema',
          path: '',
        },
      ],
    }
  }
}

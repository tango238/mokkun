/**
 * Mokkun v2 パーサー
 * 判別（isV2Document）、軽い構造検証、compileV2 による旧フォーマットへの変換
 */

import type { MokkunSchema } from '../../types/schema'
import type { MokkunV2Schema } from '../../types/schema-v2'
import { VALID_COMPONENTS_V2 } from '../../types/schema-v2'
import type { ParseError, ParseErrorType, ParseResult } from '../yaml-parser'
import { compileV2 } from './compile-v2'

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
 * v2 の構造を検証してエラー一覧を返す
 */
function validateV2(data: Obj): ParseError[] {
  const errors: ParseError[] = []
  const add = (type: ParseErrorType, message: string, path: string) => errors.push({ type, message, path })

  // --- app ---
  if (!isObject(data.app)) {
    add('MISSING_REQUIRED_FIELD', 'v2 schema must have an "app" object', 'app')
  } else if (!isNonEmptyString(data.app.name)) {
    add('MISSING_REQUIRED_FIELD', 'app must have a "name"', 'app.name')
  }

  // --- views ---
  if (!isObject(data.views)) {
    add('MISSING_REQUIRED_FIELD', 'v2 schema must have a "views" object', 'views')
    return errors
  }
  const views = data.views
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
  const navigation = isObject(data.app) ? data.app.navigation : undefined
  if (navigation !== undefined) {
    if (!Array.isArray(navigation)) {
      add('INVALID_VALUE', 'app.navigation must be an array', 'app.navigation')
    } else {
      navigation.forEach((group, gi) => {
        const items = isObject(group) ? group.items : undefined
        if (!Array.isArray(items)) {
          add('MISSING_REQUIRED_FIELD', 'navigation group must have "items"', `app.navigation[${gi}].items`)
          return
        }
        items.forEach((item, ii) => {
          const path = `app.navigation[${gi}].items[${ii}].view`
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
        if (!isNonEmptyString(flow.name)) add('MISSING_REQUIRED_FIELD', 'Flow must have a "name"', `${path}.name`)
        if (!isNonEmptyString(flow.outcome)) add('MISSING_REQUIRED_FIELD', 'Flow must have an "outcome"', `${path}.outcome`)
        if (!Array.isArray(flow.steps) || flow.steps.length === 0) {
          add('MISSING_REQUIRED_FIELD', 'Flow must have "steps"', `${path}.steps`)
        } else {
          flow.steps.forEach((step, i) => checkViewRef(isObject(step) ? step.view : undefined, `${path}.steps[${i}].view`))
        }
      }
    }
  }

  const patterns = isObject(data.patterns) ? data.patterns : {}

  const checkAction = (action: unknown, path: string) => {
    if (!isObject(action)) {
      add('INVALID_VALUE', 'Action must be an object', path)
      return
    }
    if (!isNonEmptyString(action.id)) add('MISSING_REQUIRED_FIELD', 'Action must have an "id"', `${path}.id`)
    if (!isNonEmptyString(action.label)) add('MISSING_REQUIRED_FIELD', 'Action must have a "label"', `${path}.label`)
    if (action.kind === 'navigate' || action.to !== undefined) checkViewRef(action.to, `${path}.to`)
  }

  for (const [viewName, view] of Object.entries(views)) {
    const vp = `views.${viewName}`
    if (!isObject(view)) {
      add('INVALID_VALUE', 'View must be an object', vp)
      continue
    }
    if (!isNonEmptyString(view.title)) add('MISSING_REQUIRED_FIELD', 'View must have a "title"', `${vp}.title`)
    if (!isNonEmptyString(view.goal)) add('MISSING_REQUIRED_FIELD', 'View must have a "goal"', `${vp}.goal`)
    if (view.nav !== undefined && navigation !== undefined && !navViews.has(String(view.nav))) {
      add('INVALID_VALUE', `nav "${String(view.nav)}" is not in app.navigation`, `${vp}.nav`)
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
      if (!isNonEmptyString(section.title)) add('MISSING_REQUIRED_FIELD', 'Section must have a "title"', `${sp}.title`)
      if (section.use !== undefined && !(isNonEmptyString(section.use) && section.use in patterns)) {
        add('INVALID_VALUE', `Unknown pattern "${String(section.use)}"`, `${sp}.use`)
      }
      if (section.kind === 'list') {
        const list = section.list
        if (!isObject(list) || !Array.isArray(list.columns)) {
          add('MISSING_REQUIRED_FIELD', 'Section of kind "list" must have "list.columns"', `${sp}.list`)
        } else if (Array.isArray(list.rowActions)) {
          list.rowActions.forEach((a, i) => checkAction(a, `${sp}.list.rowActions[${i}]`))
        }
      }
      if (section.fields !== undefined && !Array.isArray(section.fields)) {
        add('INVALID_VALUE', 'Section "fields" must be an array', `${sp}.fields`)
      } else {
        ;(section.fields as unknown[] | undefined)?.forEach((field, fi) => {
          const fp = `${sp}.fields[${fi}]`
          if (!isObject(field)) {
            add('INVALID_VALUE', 'Field must be an object', fp)
            return
          }
          if (!isNonEmptyString(field.item)) add('MISSING_REQUIRED_FIELD', 'Field must have an "item"', `${fp}.item`)
          if (!isNonEmptyString(field.label)) add('MISSING_REQUIRED_FIELD', 'Field must have a "label"', `${fp}.label`)
          if (!isDefinedComponent(field.component)) {
            add('INVALID_FIELD_TYPE', `Invalid component "${String(field.component)}"`, `${fp}.component`)
          }
        })
      }
    })
  }

  return errors
}

function isDefinedComponent(value: unknown): boolean {
  return typeof value === 'string' && (VALID_COMPONENTS_V2 as readonly string[]).includes(value)
}

/**
 * v2 ドキュメント（yaml.load 済みの生データ）を検証し、旧フォーマットへコンパイルする
 */
export function parseV2(data: unknown): ParseResult<MokkunSchema> {
  if (!isObject(data)) {
    return { success: false, errors: [{ type: 'SCHEMA_VALIDATION_ERROR', message: 'Root must be an object', path: '' }] }
  }
  const errors = validateV2(data)
  if (errors.length > 0) return { success: false, errors }
  return { success: true, data: compileV2(data as unknown as MokkunV2Schema) }
}

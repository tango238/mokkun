/**
 * App 層（app / navigation / notifications）と Flow 層の検証
 */

import {
  APP_LAYOUTS,
  FLOW_PROGRESS,
  isNonEmptyString,
  isObject,
  NOTICE_VARIANTS,
  type Obj,
  type VCtx,
} from './validate-context'
import { isIsoDate } from './iso-date'
import { APP_KEYS, FLOW_KEYS, FLOW_STEP_KEYS, HEADER_KEYS, NAV_GROUP_KEYS, NAV_ITEM_KEYS, NOTICE_KEYS } from './validate-keys'


function checkNotifications(v: VCtx, notifications: unknown): void {
  if (notifications === undefined) return
  if (!Array.isArray(notifications)) {
    v.add('INVALID_VALUE', 'app.notifications must be an array', 'app.notifications')
    return
  }
  notifications.forEach((n, i) => {
    const p = `app.notifications[${i}]`
    if (!isObject(n)) {
      v.add('INVALID_VALUE', 'Notice must be an object', p)
      return
    }
    v.checkKeys(n, NOTICE_KEYS, p)
    v.checkString(n.message, `${p}.message`, 'message', true)
    v.checkEnum(n.variant, NOTICE_VARIANTS, `${p}.variant`, 'variant')
    v.checkRole(n.role, `${p}.role`)
    if (n.until !== undefined && !(typeof n.until === 'string' && isIsoDate(n.until))) {
      v.add('INVALID_VALUE', `Invalid until ${JSON.stringify(n.until)} (expected an ISO date YYYY-MM-DD)`, `${p}.until`)
    }
  })
}

/** app の形（views が無くても検証できる部分） */
export function checkApp(v: VCtx, app: Obj | undefined): void {
  if (!app) {
    v.add('MISSING_REQUIRED_FIELD', 'v2 schema must have an "app" object', 'app')
    return
  }
  v.checkKeys(app, APP_KEYS, 'app')
  v.checkString(app.name, 'app.name', 'app.name', true)
  v.checkEnum(app.layout, APP_LAYOUTS, 'app.layout', 'app.layout')
  if (app.header !== undefined) {
    if (!isObject(app.header)) v.add('INVALID_VALUE', 'app.header must be an object', 'app.header')
    else v.checkKeys(app.header, HEADER_KEYS, 'app.header')
  }
  if (app.roles !== undefined && !Array.isArray(app.roles)) {
    v.add('INVALID_VALUE', 'app.roles must be an array', 'app.roles')
  }
  checkNotifications(v, app.notifications)
}

/** navigation を検証し、載っている view 名の集合を返す（undefined は navigation 未定義） */
export function checkNavigation(v: VCtx, navigation: unknown): Set<string> | undefined {
  if (navigation === undefined) return undefined
  const navViews = new Set<string>()
  if (!Array.isArray(navigation)) {
    v.add('INVALID_VALUE', 'app.navigation must be an array', 'app.navigation')
    return navViews
  }
  navigation.forEach((group, gi) => {
    const gp = `app.navigation[${gi}]`
    if (!isObject(group)) {
      v.add('INVALID_VALUE', 'Navigation group must be an object', gp)
      return
    }
    v.checkKeys(group, NAV_GROUP_KEYS, gp)
    v.checkString(group.group, `${gp}.group`, 'group', true)
    v.checkRole(group.role, `${gp}.role`)
    if (!Array.isArray(group.items)) {
      v.add('MISSING_REQUIRED_FIELD', 'navigation group must have "items"', `${gp}.items`)
      return
    }
    group.items.forEach((item, ii) => {
      if (isObject(item)) v.checkKeys(item, NAV_ITEM_KEYS, `${gp}.items[${ii}]`)
      v.checkViewRef(isObject(item) ? item.view : undefined, `${gp}.items[${ii}].view`)
      if (isObject(item) && isNonEmptyString(item.view)) navViews.add(item.view)
    })
  })
  return navViews
}

export function checkFlows(v: VCtx, flows: unknown): void {
  if (flows === undefined) return
  if (!isObject(flows)) {
    v.add('INVALID_VALUE', '"flows" must be an object', 'flows')
    return
  }
  for (const [name, flow] of Object.entries(flows)) {
    const path = `flows.${name}`
    if (!isObject(flow)) {
      v.add('INVALID_VALUE', 'Flow must be an object', path)
      continue
    }
    v.checkKeys(flow, FLOW_KEYS, path)
    v.checkString(flow.name, `${path}.name`, 'name', true)
    v.checkString(flow.outcome, `${path}.outcome`, 'outcome', true)
    v.checkEnum(flow.progress, FLOW_PROGRESS, `${path}.progress`, 'progress')
    if (!Array.isArray(flow.steps) || flow.steps.length === 0) {
      v.add('MISSING_REQUIRED_FIELD', 'Flow must have "steps"', `${path}.steps`)
    } else {
      flow.steps.forEach((step, i) => {
        if (isObject(step)) v.checkKeys(step, FLOW_STEP_KEYS, `${path}.steps[${i}]`)
        v.checkViewRef(isObject(step) ? step.view : undefined, `${path}.steps[${i}].view`)
      })
    }
  }
}

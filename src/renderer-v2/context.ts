/**
 * v2 レンダラー内部で共有する描画文脈
 */

import type { ConditionV2, FlowV2, MokkunV2Schema, ViewV2 } from '../types/schema-v2'
import { expandSectionFields } from '../parser/v2/compile-v2'
import { str } from './util'

export interface ViewContext {
  schema: MokkunV2Schema
  viewName: string
  view: ViewV2
  /** 展開後の項目 id → 既定値（visibleWhen の初期評価用） */
  defaults: Map<string, unknown>
}

export function createContext(schema: MokkunV2Schema, viewName: string): ViewContext | undefined {
  const view = Object.hasOwn(schema.views, viewName) ? schema.views[viewName] : undefined
  if (!view) return undefined
  const defaults = new Map<string, unknown>()
  for (const section of view.sections) {
    for (const ef of expandSectionFields(section, schema.patterns)) {
      defaults.set(ef.id, ef.field.value !== undefined ? ef.field.value : ef.field.default)
    }
  }
  return { schema, viewName, view, defaults }
}

/** DOM id は view 名で前置して、ページ内で一意にする */
export function domId(ctx: ViewContext, ...parts: Array<string | number>): string {
  return [ctx.viewName, ...parts].join('-')
}

/** 条件を既定値で評価する（条件がなければ true） */
export function isInitiallyVisible(cond: ConditionV2 | undefined, ctx: ViewContext): boolean {
  if (!cond) return true
  return str(ctx.defaults.get(cond.item)) === str(cond.equals)
}

/** view を含み、手順ナビを出す flow（progress: none は除く） */
export function findFlow(schema: MokkunV2Schema, viewName: string): { flow: FlowV2; index: number } | undefined {
  for (const flow of Object.values(schema.flows ?? {})) {
    if (flow.progress === 'none') continue
    const index = flow.steps.findIndex(s => s.view === viewName)
    if (index >= 0) return { flow, index }
  }
  return undefined
}

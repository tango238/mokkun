/**
 * v2 レンダラー内部で共有する描画文脈
 */

import type { ConditionV2, FieldV2, FlowV2, MokkunV2Schema, ViewV2 } from '../types/schema-v2'
import { expandSectionFields } from '../parser/v2/compile-v2'
import { str } from './util'

export interface ViewContext {
  schema: MokkunV2Schema
  viewName: string
  view: ViewV2
  /** 展開後の項目 id → 項目定義（visibleWhen の初期評価用） */
  fields: Map<string, FieldV2>
}

export function createContext(schema: MokkunV2Schema, viewName: string): ViewContext | undefined {
  const view = Object.hasOwn(schema.views, viewName) ? schema.views[viewName] : undefined
  if (!view) return undefined
  const fields = new Map<string, FieldV2>()
  for (const section of view.sections) {
    for (const ef of expandSectionFields(section, schema.patterns)) {
      fields.set(ef.id, ef.field)
    }
  }
  return { schema, viewName, view, fields }
}

/** DOM id は view 名で前置して、ページ内で一意にする */
export function domId(ctx: ViewContext, ...parts: Array<string | number>): string {
  return [ctx.viewName, ...parts].join('-')
}

/**
 * 項目の初期値を、mount 後に DOM から読む値（mount-visibility.ts の readValue）と同じ形にする。
 * 真偽値系（単一 checkbox / toggle）は 'true' / 'false'（未指定は 'false'）、複数選択は文字列の配列、それ以外は文字列。
 */
function initialToken(f: FieldV2): string | string[] {
  const raw = f.value !== undefined ? f.value : f.default
  if (f.multiple) {
    if (Array.isArray(raw)) return raw.map(str)
    return raw === undefined || raw === null || raw === '' ? [] : [str(raw)]
  }
  if (f.component === 'checkbox' || f.component === 'toggle') return raw === true || str(raw) === 'true' ? 'true' : 'false'
  return str(raw)
}

/** 条件を既定値で評価する（条件がなければ true）。参照先が無ければ false */
export function isInitiallyVisible(cond: ConditionV2 | undefined, ctx: ViewContext): boolean {
  if (!cond) return true
  const ref = ctx.fields.get(cond.item)
  if (!ref) return false
  const token = initialToken(ref)
  return Array.isArray(token) ? token.includes(str(cond.equals)) : token === str(cond.equals)
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

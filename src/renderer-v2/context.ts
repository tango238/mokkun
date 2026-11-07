/**
 * v2 レンダラー内部で共有する描画文脈
 */

import type { ConditionV2, FieldV2, FlowV2, MokkunV2Schema, ViewV2 } from '../types/schema-v2'
import { expandSectionFields } from '../parser/v2/compile-expand'
import { matchesCondition } from './condition'
import { isoDate } from './role'
import { str } from './util'

/** view の状態（ビューアーの「状態」切替）。normal は状態バナーなし */
export type V2ViewState = 'normal' | 'success' | 'error' | 'empty' | 'loading'

export const V2_VIEW_STATES: readonly V2ViewState[] = ['normal', 'success', 'error', 'empty', 'loading']

/** 描画オプション */
export interface V2RenderOptions {
  /** 表示する状態。既定 normal（状態バナーを出さない） */
  state?: V2ViewState
  /** 現在のロール（app.roles の値）。未指定は全ロール分を表示する */
  role?: string
  /** 通知の期限（Notice.until）判定に使う今日。既定は実行時の日付（テスト用） */
  today?: Date | string
}

export interface ViewContext {
  schema: MokkunV2Schema
  viewName: string
  view: ViewV2
  /** 展開後の項目 id → 項目定義（visibleWhen の初期評価用） */
  fields: Map<string, FieldV2>
  state: V2ViewState
  role: string | undefined
  /** 今日（YYYY-MM-DD） */
  today: string
}

export function createContext(schema: MokkunV2Schema, viewName: string, options: V2RenderOptions = {}): ViewContext | undefined {
  const view = Object.hasOwn(schema.views, viewName) ? schema.views[viewName] : undefined
  if (!view) return undefined
  const fields = new Map<string, FieldV2>()
  for (const section of view.sections) {
    for (const ef of expandSectionFields(section, schema.patterns)) {
      fields.set(ef.id, ef.field)
    }
  }
  const state = options.state && V2_VIEW_STATES.includes(options.state) ? options.state : 'normal'
  const today = typeof options.today === 'string' ? options.today : isoDate(options.today ?? new Date())
  return { schema, viewName, view, fields, state, role: options.role || undefined, today }
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
  if (f.component === 'date' && !f.inline) return dateToken(str(raw), f.precision)
  return str(raw)
}

/** date の値を mount 後の DOM から読む形（`y-mm-dd`、precision: month は `y-mm`）にそろえる */
function dateToken(text: string, precision: FieldV2['precision']): string {
  const m = /^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?/.exec(text)
  if (!m) return text
  const ym = `${m[1]}-${m[2].padStart(2, '0')}`
  return precision === 'month' || !m[3] ? ym : `${ym}-${m[3].padStart(2, '0')}`
}

/** 条件を既定値で評価する（条件がなければ true）。参照先が無ければ false */
export function isInitiallyVisible(cond: ConditionV2 | undefined, ctx: ViewContext): boolean {
  if (!cond) return true
  const ref = ctx.fields.get(cond.item)
  if (!ref) return false
  return matchesCondition(initialToken(ref), cond)
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

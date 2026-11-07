/**
 * 条件（visibleWhen / requiredWhen）の評価。静的描画（既定値）と mount 後（DOM の現在値）で共有する。
 *
 * 比較の対象は「項目の現在値のトークン」: 単一値は文字列、複数選択は選択値の配列、
 * 真偽値系（checkbox / toggle）は 'true' / 'false'、date は `y-m-d`（precision: month は `y-m`）。
 */

import type { ConditionV2 } from '../types/schema-v2'
import { str } from './util'

export type Token = string | string[]

/** data 属性に載せる条件（JSON）。equals / notEquals / in のうち書かれたものだけ */
export function serializeCondition(cond: ConditionV2): string {
  const { item, equals, notEquals, in: list } = cond
  return JSON.stringify({
    item,
    ...(equals !== undefined ? { equals } : {}),
    ...(notEquals !== undefined ? { notEquals } : {}),
    ...(list !== undefined ? { in: list } : {}),
  })
}

/** token が cond の比較値と一致するか（配列トークンは「含む」で判定） */
function hits(token: Token, value: ConditionV2['equals']): boolean {
  return Array.isArray(token) ? token.includes(str(value)) : token === str(value)
}

/** 条件を評価する。equals は一致、notEquals は不一致、in は配列のどれかと一致 */
export function matchesCondition(token: Token, cond: ConditionV2): boolean {
  if (cond.in !== undefined) return cond.in.some(v => hits(token, v))
  if (cond.notEquals !== undefined) return !hits(token, cond.notEquals)
  return hits(token, cond.equals)
}

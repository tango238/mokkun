/**
 * ロール指定（Action.role / NavGroup.role / Notice.role）の評価
 */

import type { RoleSpecV2 } from '../types/schema-v2'

/**
 * 現在のロールで表示するか。role の省略は全ロール、現在のロールが未選択なら常に表示する
 * （ロールを選ばない既存の挙動を変えない）。
 */
export function visibleForRole(role: RoleSpecV2 | undefined, current: string | undefined): boolean {
  if (role === undefined || current === undefined || current === '') return true
  return (Array.isArray(role) ? role : [role]).includes(current)
}

/** ローカル日付 YYYY-MM-DD */
export function isoDate(date: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`
}

/** until が今日より前なら期限切れ（当日までは表示する） */
export function isExpired(until: string | undefined, today: string): boolean {
  return until !== undefined && until < today
}

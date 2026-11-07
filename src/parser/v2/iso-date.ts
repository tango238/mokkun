/**
 * ISO 日付（YYYY-MM-DD）と、YAML の日付リテラル（js-yaml が Date にする）の正規化
 */

/** YYYY-MM-DD として実在する日付か */
export function isIsoDate(text: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false
  const d = new Date(`${text}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === text
}

/**
 * 値の中の Date（引用符なしの `2026-11-20` を js-yaml が変換したもの）を、再帰的に UTC の `YYYY-MM-DD` 文字列にする。
 * 元のデータは変更せず、Date を含むときだけ複製する。
 */
export function normalizeDates<T>(value: T): T {
  if (value instanceof Date) {
    return (Number.isNaN(value.getTime()) ? value : value.toISOString().slice(0, 10)) as unknown as T
  }
  if (Array.isArray(value)) return value.map(normalizeDates) as unknown as T
  if (typeof value === 'object' && value !== null) {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) out[k] = normalizeDates(v)
    return out as T
  }
  return value
}

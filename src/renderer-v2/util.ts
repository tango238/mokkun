/**
 * v2 レンダラー共通ユーティリティ
 * HTML 文字列を組み立てるための最小限のヘルパー（DOM に依存しない）
 */

const ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#039;',
}

/**
 * ユーザー由来のテキストを HTML（要素内・属性値）に埋め込めるようエスケープする
 */
export function esc(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, ch => ESCAPE_MAP[ch])
}

type AttrValue = string | number | boolean | null | undefined

/**
 * 属性文字列を組み立てる。true は値なし属性、false / null / undefined は出力しない。
 * 先頭に空白を含むため、そのままタグ名の直後に連結できる。
 */
export function attrs(map: Record<string, AttrValue>): string {
  let out = ''
  for (const [key, value] of Object.entries(map)) {
    if (value === false || value === null || value === undefined) continue
    out += value === true ? ` ${key}` : ` ${key}="${esc(value)}"`
  }
  return out
}

/** 値を比較用の文字列にする（YAML の数値・真偽値と DOM の文字列値を揃える） */
export function str(value: unknown): string {
  return value === undefined || value === null ? '' : String(value)
}

/** props から文字列を取り出す */
export function propString(props: Record<string, unknown> | undefined, key: string): string | undefined {
  const v = props?.[key]
  return typeof v === 'string' && v.length > 0 ? v : undefined
}

/** props から有限の数値を取り出す */
export function propNumber(props: Record<string, unknown> | undefined, key: string): number | undefined {
  const v = props?.[key]
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined
}

/**
 * リンク・画像の URL を http / https / mailto に限る（javascript: などは '#' に置き換える）。
 * 相対 URL は許可する。
 */
export function safeUrl(url: unknown): string {
  const text = typeof url === 'string' ? url.trim() : ''
  if (!text) return '#'
  try {
    const parsed = new URL(text, 'https://mokkun.invalid/')
    return ['http:', 'https:', 'mailto:'].includes(parsed.protocol) ? text : '#'
  } catch {
    return '#'
  }
}

/** props の配列から、指定キーが文字列のオブジェクトだけを取り出す */
export function objectItems<T extends object>(value: unknown, requiredStringKey: string): T[] {
  if (!Array.isArray(value)) return []
  return value.filter(
    (v): v is T => typeof v === 'object' && v !== null && typeof (v as Record<string, unknown>)[requiredStringKey] === 'string',
  )
}

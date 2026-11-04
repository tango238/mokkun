/**
 * アイコン名 → 絵文字/Unicode記号 のマップ
 * YAML の `icon: "refresh"` のような名前指定を、文字列のまま表示せずに記号へ変換する。
 */

import { escapeHtmlSafe } from './field-helpers'

const ICON_MAP: Record<string, string> = {
  refresh: '↻',
  reload: '↻',
  sync: '↻',
  edit: '✎',
  pencil: '✎',
  delete: '🗑',
  trash: '🗑',
  remove: '✕',
  add: '＋',
  plus: '＋',
  create: '＋',
  new: '＋',
  search: '🔍',
  download: '⬇',
  upload: '⬆',
  settings: '⚙',
  setting: '⚙',
  gear: '⚙',
  close: '✕',
  cancel: '✕',
  x: '✕',
  check: '✓',
  save: '✓',
  ok: '✓',
  arrow_left: '←',
  arrow_right: '→',
  arrow_up: '↑',
  arrow_down: '↓',
  back: '←',
  next: '→',
  menu: '☰',
  user: '👤',
  users: '👥',
  info: 'ℹ',
  warning: '⚠',
  error: '⚠',
  star: '★',
  home: '⌂',
  mail: '✉',
  email: '✉',
  copy: '⧉',
  print: '🖨',
  filter: '⏷',
  export: '⬆',
  import: '⬇',
  eye: '👁',
  view: '👁',
  lock: '🔒',
  calendar: '📅',
  link: '🔗',
  help: '?',
  display: '🖥',
  bell: '🔔',
  shield: '🛡',
  key: '🔑',
  globe: '🌐',
  database: '🗄',
  chart: '📊',
  clock: '🕒',
  tag: '🏷',
  folder: '📁',
  file: '📄',
}

/**
 * アイコン名を記号に変換する。未知の名前は空文字（文字列そのものは表示しない）。
 * 既に絵文字などの非ASCII文字列が直接指定されている場合はそのまま返す。
 */
export function resolveIcon(name: string | undefined | null): string {
  if (!name) return ''
  const key = name.trim().toLowerCase().replace(/[-\s]+/g, '_')
  if (Object.hasOwn(ICON_MAP, key)) return ICON_MAP[key]
  // 非ASCII（絵文字・記号の直接指定）はそのまま許可
  if (/[^\x00-\x7F]/.test(name)) return name
  return ''
}

/**
 * アイコン用の <span> HTML を生成（未知の名前は空文字）
 */
export function renderIconHtml(name: string | undefined | null, className: string): string {
  const glyph = resolveIcon(name)
  if (!glyph) return ''
  return `<span class="${escapeHtmlSafe(className)}" aria-hidden="true">${escapeHtmlSafe(glyph)}</span>`
}

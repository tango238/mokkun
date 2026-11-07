/**
 * file の accept / maxSize の仕様（パーサー・コンパイラ・レンダラーで共有）
 */

/** accept のキーワード */
export const ACCEPT_KEYWORDS = ['image', 'pdf', 'document'] as const

/** accept の配列要素: 拡張子（.pdf）または MIME タイプ（image/png, image/*） */
export const ACCEPT_EXT_PATTERN = /^\.[A-Za-z0-9]+$/
export const ACCEPT_MIME_PATTERN = /^[A-Za-z0-9.+-]+\/[A-Za-z0-9.+*-]+$/

/** 旧来の HTML accept 文字列（".pdf" "image/png"。カンマ区切りも可）を許す判定 */
export const ACCEPT_LEGACY_PATTERN = /^\s*(\.[A-Za-z0-9]|[A-Za-z0-9*+.-]+\/)/

/** maxSize: 正の整数 + KB / MB / GB（"0MB" や "010MB" は不可） */
export const MAX_SIZE_PATTERN = /^[1-9]\d*(KB|MB|GB)$/

export const ACCEPT_FORMS = 'image / pdf / document、または [".pdf", "image/png"] のような拡張子・MIME タイプの配列'
export const MAX_SIZE_FORMS = '正の整数 + KB / MB / GB（例: "10MB"）'

/** 配列要素として正しいか */
export function isAcceptToken(token: unknown): boolean {
  return typeof token === 'string' && (ACCEPT_EXT_PATTERN.test(token) || ACCEPT_MIME_PATTERN.test(token))
}

/** キーワード → `<input accept>` */
export const ACCEPT_INPUT_ATTR: Record<string, string> = {
  image: 'image/*',
  pdf: '.pdf,application/pdf',
  document: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt',
}

/** キーワード → サポートテキストの形式名 */
export const ACCEPT_LABEL: Record<string, string> = {
  image: '画像',
  pdf: 'PDF',
  document: 'PDF・Word・Excel・PowerPoint・テキスト',
}

/** キーワード → 旧 file_upload の accept（拡張子・MIME タイプの配列） */
export const ACCEPT_LEGACY_LIST: Record<string, string[]> = {
  image: ['image/*'],
  pdf: ['application/pdf'],
  document: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'],
}

const SIZE_UNITS: Record<string, number> = { KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3 }

/** "10MB" → バイト数（書式外は undefined） */
export function maxSizeToBytes(text: string | undefined): number | undefined {
  const m = /^(\d+)(KB|MB|GB)$/.exec(text ?? '')
  return m ? Number(m[1]) * SIZE_UNITS[m[2]] : undefined
}

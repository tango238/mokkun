/**
 * file の accept / multiple / maxSize と、サポートテキストへの自動追記
 */

import type { FieldV2 } from '../../types/schema-v2'
import { ACCEPT_INPUT_ATTR, ACCEPT_LABEL } from '../../parser/v2/file-spec'

/** 拡張子・MIME タイプ 1 つを形式名にする（.pdf → PDF、image/png → PNG、image/* → 画像） */
function tokenLabel(token: string): string {
  const t = token.trim()
  if (t === 'image/*') return '画像'
  const mime = /^[a-z]+\/([a-z0-9.+-]+)$/i.exec(t)
  if (mime) return mime[1].replace(/^x-/, '').toUpperCase()
  return t.replace(/^\./, '').toUpperCase()
}

function tokens(accept: string | string[]): string[] {
  return Array.isArray(accept) ? accept : accept.split(',').map(s => s.trim()).filter(Boolean)
}

/** `<input accept>` の値 */
export function acceptAttr(accept: FieldV2['accept']): string | undefined {
  if (accept === undefined) return undefined
  if (typeof accept === 'string' && Object.hasOwn(ACCEPT_INPUT_ATTR, accept)) return ACCEPT_INPUT_ATTR[accept]
  return tokens(accept).join(',')
}

/** 形式名（「PDF・JPEG・PNG」の形） */
export function acceptLabel(accept: FieldV2['accept']): string | undefined {
  if (accept === undefined) return undefined
  if (typeof accept === 'string' && Object.hasOwn(ACCEPT_LABEL, accept)) return ACCEPT_LABEL[accept]
  return [...new Set(tokens(accept).map(tokenLabel))].join('・')
}

/** 複数選択か（first-class の multiple。props.multiple も受け付ける） */
export function isMultiple(f: FieldV2): boolean {
  return f.multiple === true || f.props?.multiple === true
}

/**
 * サポートテキストに自動で足す「形式: …／1ファイル 10MB まで」。
 * help が形式名・容量をすでに書いているときは、その部分を足さない（重複させない）。
 */
export function fileSupportLine(f: FieldV2): string | undefined {
  const help = (f.help ?? '').replace(/\s/g, '')
  const label = acceptLabel(f.accept)
  const parts: string[] = []
  if (label) {
    const mentioned = help.includes('形式') || label.split('・').some(l => help.toUpperCase().includes(l.toUpperCase()))
    if (!mentioned) parts.push(`形式: ${label}`)
  }
  if (f.maxSize) {
    const mentioned = help.toUpperCase().includes(f.maxSize.toUpperCase()) || help.includes('1ファイル')
    if (!mentioned) parts.push(`1ファイル ${f.maxSize} まで`)
  }
  return parts.length > 0 ? parts.join('／') : undefined
}

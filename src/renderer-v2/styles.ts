/**
 * DADS の CSS を v2 描画中だけ document に差し込む。
 *
 * DADS の global.css は html / a / :focus-visible などの要素セレクタを含むため、
 * ライブラリの CSS（mokkun.css）に静的に含めると v1 画面まで再スタイルされる。
 * そのため ?inline で文字列として取り込み、v2 を描画している間だけ <style> として挿入する。
 */

import dadsCss from './dads.css?inline'
import v2Css from './mokkun-v2.css?inline'

const STYLE_ID = 'mokkun-v2-styles'
/** mount 中のインスタンス数（最後の destroy で <style> を外す） */
let users = 0

export function ensureV2Styles(): void {
  users += 1
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `${dadsCss}\n${v2Css}`
  document.head.appendChild(style)
}

export function removeV2Styles(): void {
  users = Math.max(0, users - 1)
  if (users > 0 || typeof document === 'undefined') return
  document.getElementById(STYLE_ID)?.remove()
}

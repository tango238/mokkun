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
/** スタイルを必要としている保持者の数（0 になったら <style> を外す） */
let holders = 0

function insertStyle(): void {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `${dadsCss}\n${v2Css}`
  document.head.appendChild(style)
}

/**
 * スタイルを 1 つ保持する。戻り値の release で解放する（二重に呼んでも 1 回分しか減らない）。
 * 画面遷移で「古い view を destroy → 新しい view を mount」する間に <style> が外れて付け直されないよう、
 * 呼び出し側は destroy の前に hold し、mount の後に release する。
 */
export function holdV2Styles(): () => void {
  holders += 1
  insertStyle()
  let released = false
  return () => {
    if (released) return
    released = true
    holders = Math.max(0, holders - 1)
    if (holders === 0 && typeof document !== 'undefined') document.getElementById(STYLE_ID)?.remove()
  }
}

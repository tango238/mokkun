/**
 * mokkun v2 レンダラー（DADS 準拠）
 * v2 文書を旧フォーマットへ変換せずに直接描画する。
 *
 * - renderViewV2: HTML 文字列を返す（SSR / 静的出力）
 * - mountViewV2: container に描画し、イベントを結線して V2Controller を返す
 *
 * 設計: docs/format-redesign/03-renderer-v2.md
 */

import type { MokkunV2Schema } from '../types/schema-v2'
import { renderBreadcrumb, renderHeader, renderNotifications } from './app-shell'
import { createContext, V2_VIEW_STATES, type V2RenderOptions, type V2ViewState } from './context'
import { attachV2Behavior } from './mount'
import { holdV2Styles } from './styles'
import { renderViewBody } from './view'
import { esc } from './util'

/** onAction の付随情報 */
export interface V2ActionPayload {
  /** Section.actions / list.bulkActions のとき、操作が属する Section の id */
  section?: string
  /** list.bulkActions のとき、選択されている行の ID（行の `id`、なければ先頭列の値、なければ 1 始まりの通し番号） */
  selectedRows?: string[]
}

export interface V2Callbacks {
  /** グローバルナビ・パンくず・navigate アクション・submit アクションの to（送信後）で遷移先 view を通知する */
  onNavigate?: (view: string) => void
  /** navigate 以外のアクション（submit / custom / reset）を実行したとき（submit に to があれば、このあと onNavigate も呼ぶ）。Section 内の操作は payload を持つ */
  onAction?: (actionId: string, kind: string, payload?: V2ActionPayload) => void
  /** true のとき、遷移時に location.hash も書き換える（既定 false） */
  syncHash?: boolean
}

export interface V2Controller {
  destroy(): void
}

/**
 * view を HTML 文字列にする。出力は `.mokkun-v2` ルート要素で包まれる。
 * view 名が存在しないときは空のルートにエラー文を入れて返す。
 */
export function renderViewV2(schema: MokkunV2Schema, viewName: string, options: V2RenderOptions = {}): string {
  const ctx = createContext(schema, viewName, options)
  if (!ctx) {
    return `<div class="mokkun-v2"><main class="mk2-main"><p class="dads-form-control-label__error-text">画面が見つかりません: ${esc(viewName)}</p></main></div>`
  }
  const plain = schema.app.layout === 'plain'
  return `<div class="mokkun-v2" data-view="${esc(viewName)}" data-state="${ctx.state}" data-app-layout="${plain ? 'plain' : 'shell'}">
${plain ? '' : renderHeader(ctx)}
<main class="mk2-main">
${renderNotifications(ctx)}
${plain ? '' : renderBreadcrumb(ctx)}
${renderViewBody(ctx)}
</main>
</div>`
}

/** undefined の値を持つキーを除く（後ろの引数の undefined が前の値を消さないように） */
function definedOnly(source: V2RenderOptions): V2RenderOptions {
  const out: V2RenderOptions = {}
  if (source.state !== undefined) out.state = source.state
  if (source.role !== undefined) out.role = source.role
  if (source.today !== undefined) out.today = source.today
  return out
}

/**
 * container に view を描画して振る舞いを結線する。
 * destroy() でイベントを外し、DADS の CSS 注入も解除する（二重に呼んでも何も起きない）。
 * 同じ container に destroy() せずに続けて mount すると、前の mount のイベントが残って重複して結線される。
 * 作り直すときは先に前の V2Controller の destroy() を呼ぶこと。
 */
export function mountViewV2(
  container: HTMLElement,
  schema: MokkunV2Schema,
  viewName: string,
  callbacks: V2Callbacks & V2RenderOptions = {},
  options: V2RenderOptions = {},
): V2Controller {
  // 描画オプションは 5 番目の引数が正。callbacks にまとめて渡しても受け付ける
  container.innerHTML = renderViewV2(schema, viewName, { ...definedOnly(callbacks), ...definedOnly(options) })
  // 描画が成功してからスタイルを保持する（描画が例外なら何も保持しない）
  const release = holdV2Styles()
  let detach: () => void
  try {
    detach = attachV2Behavior(container, callbacks)
  } catch (error) {
    release()
    throw error
  }
  let destroyed = false
  return {
    destroy() {
      if (destroyed) return
      destroyed = true
      detach()
      container.innerHTML = ''
      release()
    },
  }
}

export { holdV2Styles, MOKKUN_V2_CSS } from './styles'
export { V2_VIEW_STATES }
export { availableStates, parseViewState, resolveRole, resolveViewState, V2_STATE_LABELS } from './view-state'
export type { V2RenderOptions, V2ViewState }

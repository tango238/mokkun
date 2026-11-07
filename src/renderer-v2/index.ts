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
import { createContext } from './context'
import { attachV2Behavior } from './mount'
import { ensureV2Styles, removeV2Styles } from './styles'
import { renderViewBody } from './view'
import { esc } from './util'

export interface V2Callbacks {
  /** グローバルナビ・パンくず・navigate アクションで遷移先 view を通知する */
  onNavigate?: (view: string) => void
  /** navigate 以外のアクション（submit / custom / reset）を実行したとき */
  onAction?: (actionId: string, kind: string) => void
}

export interface V2Controller {
  destroy(): void
}

/**
 * view を HTML 文字列にする。出力は `.mokkun-v2` ルート要素で包まれる。
 * view 名が存在しないときは空のルートにエラー文を入れて返す。
 */
export function renderViewV2(schema: MokkunV2Schema, viewName: string): string {
  const ctx = createContext(schema, viewName)
  if (!ctx) {
    return `<div class="mokkun-v2"><main class="mk2-main"><p class="dads-form-control-label__error-text">画面が見つかりません: ${esc(viewName)}</p></main></div>`
  }
  const plain = schema.app.layout === 'plain'
  return `<div class="mokkun-v2" data-view="${esc(viewName)}" data-app-layout="${plain ? 'plain' : 'shell'}">
${plain ? '' : renderHeader(ctx)}
<main class="mk2-main">
${renderNotifications(ctx)}
${plain ? '' : renderBreadcrumb(ctx)}
${renderViewBody(ctx)}
</main>
</div>`
}

/**
 * container に view を描画して振る舞いを結線する。
 * destroy() でイベントを外し、DADS の CSS 注入も解除する。
 */
export function mountViewV2(
  container: HTMLElement,
  schema: MokkunV2Schema,
  viewName: string,
  callbacks: V2Callbacks = {},
): V2Controller {
  ensureV2Styles()
  container.innerHTML = renderViewV2(schema, viewName)
  const detach = attachV2Behavior(container, callbacks)
  return {
    destroy() {
      detach()
      container.innerHTML = ''
      removeV2Styles()
    },
  }
}

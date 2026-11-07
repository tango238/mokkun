/**
 * ビューアーのツールバー: v2 文書の「状態」切替と「ロール」切替
 * - 状態: 通常 / 成功 / エラー / 空 / 読み込み中。view が持つ states.* に対応するものだけ選べる
 * - ロール: app.roles（と「すべて」）。選ぶと、そのロールに向けた操作・ナビ・通知だけを描画する
 */

import type { MokkunV2Schema } from '../types/schema-v2'
import { availableStates, V2_STATE_LABELS, V2_VIEW_STATES, type V2ViewState } from '../renderer-v2'
import { esc } from '../renderer-v2/util'

export { parseViewState, resolveRole, resolveViewState } from '../renderer-v2'

/** ツールバーに置く 状態 / ロール セレクト（v2 文書のみ。ロールは app.roles があるときだけ） */
export function renderV2Controls(schema: MokkunV2Schema, screenName: string, state: V2ViewState, role: string | undefined): string {
  const enabled = availableStates(schema, screenName)
  const stateOptions = V2_VIEW_STATES.map(
    s => `<option value="${s}"${s === state ? ' selected' : ''}${enabled.includes(s) ? '' : ' disabled'}>${V2_STATE_LABELS[s]}</option>`,
  ).join('')
  const roles = schema.app.roles ?? []
  const roleSelect =
    roles.length > 0
      ? `<label for="role-selector" class="mk-label">ロール:</label>
          <select id="role-selector" class="mk-select"><option value="">すべて</option>${roles
            .map(r => `<option value="${esc(r)}"${r === role ? ' selected' : ''}>${esc(r)}</option>`)
            .join('')}</select>`
      : ''
  return `<label for="state-selector" class="mk-label">状態:</label>
          <select id="state-selector" class="mk-select">${stateOptions}</select>
          ${roleSelect}`
}

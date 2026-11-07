/**
 * ビューアーのツールバー: v2 文書の「状態」切替と「ロール」切替
 * - 状態: 通常 / 成功 / エラー / 空 / 読み込み中。view が持つ states.* に対応するものだけ選べる
 * - ロール: app.roles（と「すべて」）。選ぶと、そのロールに向けた操作・ナビ・通知だけを描画する
 */

import type { MokkunV2Schema } from '../types/schema-v2'
import { availableStates, V2_STATE_LABELS, V2_VIEW_STATES, type V2ViewState } from '../renderer-v2'

function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** URL パラメータなどの文字列を状態にする（不正は normal） */
export function parseViewState(value: string | null | undefined): V2ViewState {
  return V2_VIEW_STATES.includes(value as V2ViewState) ? (value as V2ViewState) : 'normal'
}

/** view で選べない状態なら normal に戻す */
export function resolveViewState(schema: MokkunV2Schema, screenName: string, state: V2ViewState): V2ViewState {
  return availableStates(schema, screenName).includes(state) ? state : 'normal'
}

/** app.roles にあるロールだけ（それ以外は未選択＝すべて） */
export function resolveRole(schema: MokkunV2Schema, role: string | null | undefined): string | undefined {
  return role && schema.app.roles?.includes(role) ? role : undefined
}

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

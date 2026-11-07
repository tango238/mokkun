/**
 * View の状態表示（ビューアーの「状態」切替）
 * - 既定（normal）は状態バナーを出さない。success / error は選ばれた 1 つだけ、同時には出さない
 * - loading は DADS の progress-indicator（スピナー）。フォームの代わりに出す
 * - empty は一覧の空表示（section-list.ts）で扱う
 */

import { renderBanner } from './app-shell'
import type { MokkunV2Schema } from '../types/schema-v2'
import { domId, type V2ViewState, type ViewContext } from './context'
import { esc } from './util'

/** states.success / error のバナー。選ばれた状態の分だけ出す */
export function renderStates(ctx: ViewContext): string {
  const s = ctx.view.states
  if (ctx.state === 'success' && s?.success) return renderBanner(domId(ctx, 'state', 'success'), 'success', s.success.message)
  if (ctx.state === 'error' && s?.error) return renderBanner(domId(ctx, 'state', 'error'), 'error', s.error.message)
  return ''
}

/** 読み込み中（上流 progress-indicator の spinner-loop.html、stacked / 大）。不確定進捗なので data-indeterminate を静的に付ける */
export function renderLoading(ctx: ViewContext): string {
  const id = domId(ctx, 'loading-label')
  const message = ctx.view.states?.loading?.message || '読み込み中'
  return `<div class="mk2-loading" data-state-view="loading">
<dads-progress-indicator class="dads-progress-indicator" data-type="stacked" intent="passive" active role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-labelledby="${esc(id)}">
  <svg class="dads-progress-indicator__spinner" data-js-indicator data-indeterminate width="48" height="48" viewBox="0 0 48 48" stroke="currentcolor" fill="none" aria-hidden="true">
    <circle class="dads-progress-indicator__track" cx="24" cy="24" r="22" stroke-width="4"></circle>
    <g><g><circle class="dads-progress-indicator__bar" cx="24" cy="24" r="22" stroke-width="4" pathLength="100"></circle></g></g>
    <circle class="dads-progress-indicator__border" cx="24" cy="24" r="23.5" stroke-width="1"></circle>
  </svg>
  <span id="${esc(id)}" class="dads-progress-indicator__label" data-js-label>${esc(message)}</span>
</dads-progress-indicator>
</div>`
}

/** 状態の表示名（ビューアーの選択肢） */
export const V2_STATE_LABELS: Record<V2ViewState, string> = {
  normal: '通常',
  success: '成功',
  error: 'エラー',
  empty: '空',
  loading: '読み込み中',
}

/**
 * view が選べる状態。normal は常に、success / error / loading は対応する states.* があるとき、
 * empty は states.empty か、list.empty を持つ一覧があるとき（一覧の空文言は list.empty が正）
 */
export function availableStates(schema: MokkunV2Schema, viewName: string): V2ViewState[] {
  const view = Object.hasOwn(schema.views, viewName) ? schema.views[viewName] : undefined
  const out: V2ViewState[] = ['normal']
  if (!view) return out
  const s = view.states
  if (s?.success) out.push('success')
  if (s?.error) out.push('error')
  if (s?.empty || view.sections.some(sec => sec.kind === 'list' && sec.list?.empty)) out.push('empty')
  if (s?.loading) out.push('loading')
  return out
}

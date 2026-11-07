/**
 * アクションボタンと確認ダイアログ（modal-dialog）
 * primaryAction: solid-fill lg / secondary: outline md / tertiary: text md / danger: --button-color を error 色に（mokkun-v2.css の .mk2-button--danger）
 * 並び順（DADS）: tertiary が左端、secondary、primary が右端。DOM の順序をそのまま見た目にする（CSS で並べ替えない）
 */

import type { ActionPlacementV2, ActionV2 } from '../types/schema-v2'
import { domId, type ViewContext } from './context'
import { modalCloseIcon } from './icons'
import { attrs, esc } from './util'

export interface PlacedAction {
  action: ActionV2
  primary: boolean
  placement: ActionPlacementV2
}

/** 画面のアクションを配置先つきで列挙する。primary が先頭。placement 未指定の secondary は primary に揃える */
export function collectActions(ctx: ViewContext): PlacedAction[] {
  const { primaryAction, secondaryActions } = ctx.view
  const fallback = primaryAction?.placement ?? 'footer'
  const out: PlacedAction[] = []
  if (primaryAction) out.push({ action: primaryAction, primary: true, placement: primaryAction.placement ?? 'footer' })
  for (const a of secondaryActions ?? []) out.push({ action: a, primary: false, placement: a.placement ?? fallback })
  return out
}

export function dialogId(ctx: ViewContext, action: ActionV2): string {
  return domId(ctx, 'dialog', action.id)
}

function buttonType(a: PlacedAction): 'solid-fill' | 'outline' | 'text' {
  if (a.primary) return 'solid-fill'
  return a.action.style === 'tertiary' ? 'text' : 'outline'
}

function renderButton(ctx: ViewContext, placed: PlacedAction): string {
  const { action, primary } = placed
  const type = buttonType(placed)
  const classes = ['dads-button', action.style === 'danger' ? 'mk2-button--danger' : '', type === 'text' ? 'mk2-action--tertiary' : ''].filter(Boolean)
  return `<button${attrs({
    type: 'button',
    class: classes.join(' '),
    'data-type': type,
    'data-size': primary ? 'lg' : 'md',
    'data-action': action.id,
    'data-action-kind': action.kind ?? 'submit',
    'data-navigate-to': action.kind === 'navigate' ? action.to : undefined,
    'data-confirm': action.confirm ? dialogId(ctx, action) : undefined,
    'aria-haspopup': action.confirm ? 'dialog' : undefined,
  })}>${esc(action.label)}</button>`
}

/** tertiary → secondary → primary の順（元の順序は各グループ内で保つ） */
function rank(a: PlacedAction): number {
  return a.primary ? 2 : a.action.style === 'tertiary' ? 0 : 1
}

/** 指定した配置のアクション群。無ければ空文字 */
export function renderActions(ctx: ViewContext, placement: ActionPlacementV2): string {
  const buttons = collectActions(ctx)
    .filter(a => a.placement === placement)
    .map((a, i) => ({ a, i }))
    .sort((x, y) => rank(x.a) - rank(y.a) || x.i - y.i)
    .map(x => x.a)
  if (buttons.length === 0) return ''
  return `<div class="mk2-actions" data-placement="${placement}">\n${buttons.map(b => renderButton(ctx, b)).join('\n')}\n</div>`
}

/** action.confirm を持つアクションごとの <dialog>。静的 HTML に含め、mount 時にボタンから開く */
export function renderDialogs(ctx: ViewContext): string {
  return collectActions(ctx)
    .filter(({ action }) => action.confirm)
    .map(({ action }) => {
      const id = dialogId(ctx, action)
      const confirm = action.confirm!
      return `<dialog id="${esc(id)}" class="dads-modal-dialog" aria-labelledby="${esc(id)}-title" data-dialog-for="${esc(action.id)}">
  <div class="dads-modal-dialog__dialog">
    <div class="dads-modal-dialog__header">
      <h2 id="${esc(id)}-title" class="dads-modal-dialog__heading" tabindex="-1">${esc(action.label)}</h2>
      <button class="dads-modal-dialog__close" type="button" data-dialog-close>${modalCloseIcon}閉じる</button>
    </div>
    <div class="dads-modal-dialog__body">
      <p>${esc(confirm.message)}</p>
    </div>
    <div class="dads-modal-dialog__actions">
      <button class="dads-button" type="button" data-size="lg" data-type="outline" data-dialog-close>キャンセル</button>
      <button class="${confirm.danger ? 'dads-button mk2-button--danger' : 'dads-button'}" type="button" data-size="lg" data-type="solid-fill" data-dialog-confirm>${esc(action.label)}</button>
    </div>
  </div>
</dialog>`
    })
    .join('\n')
}

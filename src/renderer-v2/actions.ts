/**
 * アクションボタンと確認ダイアログ（modal-dialog）
 * primaryAction: solid-fill lg / secondary: outline md / tertiary: text md / danger: --button-color を error 色に（mokkun-v2.css の .mk2-button--danger）
 * 並び順（DADS）: tertiary が左端、secondary、primary が右端。DOM の順序をそのまま見た目にする（CSS で並べ替えない）
 */

import type { ActionPlacementV2, ActionV2, ListV2, SectionV2 } from '../types/schema-v2'
import { domId, type ViewContext } from './context'
import { modalCloseIcon } from './icons'
import { visibleForRole } from './role'
import { attrs, esc } from './util'

export interface PlacedAction {
  action: ActionV2
  primary: boolean
  placement: ActionPlacementV2
}

/** 現在のロールで表示する操作だけにする（Action.role） */
function forRole(ctx: ViewContext, actions: ActionV2[] | undefined): ActionV2[] {
  return (actions ?? []).filter(a => visibleForRole(a.role, ctx.role))
}

/** Section.actions（見出し行の操作）。現在のロールで表示するもの */
export function sectionActions(section: SectionV2, ctx: ViewContext): ActionV2[] {
  return forRole(ctx, section.actions)
}

/** list.bulkActions（選択した行への操作）。現在のロールで表示するもの */
export function bulkActions(list: ListV2, ctx: ViewContext): ActionV2[] {
  return forRole(ctx, list.bulkActions)
}

/** 画面のアクションを配置先つきで列挙する。primary が先頭。placement 未指定の secondary は primary に揃える。現在のロールで表示するものだけ */
export function collectActions(ctx: ViewContext): PlacedAction[] {
  const { primaryAction, secondaryActions } = ctx.view
  const fallback = primaryAction?.placement ?? 'footer'
  const out: PlacedAction[] = []
  if (primaryAction && visibleForRole(primaryAction.role, ctx.role)) {
    out.push({ action: primaryAction, primary: true, placement: primaryAction.placement ?? 'footer' })
  }
  for (const a of forRole(ctx, secondaryActions)) out.push({ action: a, primary: false, placement: a.placement ?? fallback })
  return out
}

/** 確認ダイアログを持ちうるすべての操作（画面・Section・一括操作）。表示するものだけ */
function dialogActions(ctx: ViewContext): ActionV2[] {
  const out = collectActions(ctx).map(p => p.action)
  for (const section of ctx.view.sections) {
    out.push(...sectionActions(section, ctx))
    if (section.list) out.push(...bulkActions(section.list, ctx))
  }
  return out
}

export function dialogId(ctx: ViewContext, action: ActionV2): string {
  return domId(ctx, 'dialog', action.id)
}

function buttonType(a: PlacedAction): 'solid-fill' | 'outline' | 'text' {
  if (a.primary) return 'solid-fill'
  return a.action.style === 'tertiary' ? 'text' : 'outline'
}

/**
 * 操作ボタン 1 つ。Section 内の操作（primary ではない）は extra で data-section / data-bulk を付ける。
 * type: solid-fill は primary、text は tertiary、outline はそれ以外
 */
export function renderActionButton(
  ctx: ViewContext,
  action: ActionV2,
  type: 'solid-fill' | 'outline' | 'text',
  size: 'lg' | 'md',
  extra: Record<string, string | boolean | undefined> = {},
): string {
  const classes = ['dads-button', action.style === 'danger' ? 'mk2-button--danger' : '', type === 'text' ? 'mk2-action--tertiary' : ''].filter(Boolean)
  return `<button${attrs({
    type: 'button',
    class: classes.join(' '),
    'data-type': type,
    'data-size': size,
    'data-action': action.id,
    'data-action-kind': action.kind ?? 'submit',
    'data-navigate-to': action.kind === 'navigate' ? action.to : undefined,
    'data-confirm': action.confirm ? dialogId(ctx, action) : undefined,
    'aria-haspopup': action.confirm ? 'dialog' : undefined,
    ...extra,
  })}>${esc(action.label)}</button>`
}

/** Section の操作（見出し行）。tertiary はテキスト、それ以外は outline md */
export function renderSectionButton(ctx: ViewContext, action: ActionV2, sectionId: string): string {
  return renderActionButton(ctx, action, action.style === 'tertiary' ? 'text' : 'outline', 'md', { 'data-section': sectionId })
}

function renderButton(ctx: ViewContext, placed: PlacedAction): string {
  return renderActionButton(ctx, placed.action, buttonType(placed), placed.primary ? 'lg' : 'md')
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
  return dialogActions(ctx)
    .filter(action => action.confirm)
    .map(action => {
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

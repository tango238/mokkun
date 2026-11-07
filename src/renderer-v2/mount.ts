/**
 * mountViewV2 の振る舞い結線（イベント委譲）
 * - 遷移: グローバルナビ・パンくず・navigate アクション → callbacks.onNavigate
 * - 確認ダイアログ: アクションボタンで開き、確定ボタンでアクションを実行
 * - visibleWhen / repeatable / accordion 以外の DADS 部品の最小限の JS
 */

import type { V2Callbacks } from './index'
import { evaluateVisibility } from './mount-visibility'
import { handleRepeatClick, resetRepeatables, syncAllRepeatables } from './mount-repeat'
import { closeAllSubmenus, closeDialog, moveTabFocus, openDialog, selectTab, setSubmenu, setSwitch, sortTable, toggleSwitch, updateFileList } from './mount-parts'

function findDialog(root: HTMLElement, id: string | undefined): HTMLDialogElement | undefined {
  return Array.from(root.querySelectorAll<HTMLDialogElement>('dialog')).find(d => d.id === id)
}

function updateEmptyStates(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>('.mk2-list').forEach(list => {
    const rows = list.querySelectorAll('[data-list-body] tr').length
    const empty = list.querySelector<HTMLElement>('[data-empty]')
    if (empty) empty.hidden = rows > 0
    const table = list.querySelector<HTMLElement>('.dads-table')
    if (table) table.hidden = rows === 0
  })
}

/** フォームのリセット後に、ネイティブの reset では戻らない状態（switch / ファイル一覧 / 繰り返し / 表示条件）を戻す */
function restoreAfterReset(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>('[data-initial-checked]').forEach(b => setSwitch(b, b.dataset.initialChecked === 'true'))
  root.querySelectorAll<HTMLInputElement>('input[type="file"]').forEach(updateFileList)
  resetRepeatables(root)
  evaluateVisibility(root)
}

/** イベントを結線する。戻り値で解除 */
export function attachV2Behavior(root: HTMLElement, callbacks: V2Callbacks): () => void {
  const ac = new AbortController()
  const { signal } = ac

  const navigate = (view: string, setHash: boolean) => {
    if (setHash) {
      try {
        window.location.hash = view
      } catch {
        // hash を変更できない環境（sandbox 等）では通知のみ
      }
    }
    callbacks.onNavigate?.(view)
  }

  const run = (button: HTMLElement) => {
    const kind = button.dataset.actionKind ?? 'custom'
    const to = button.dataset.navigateTo
    if (kind === 'navigate' && to) return navigate(to, true)
    if (kind === 'reset') {
      root.querySelector('form')?.reset()
      restoreAfterReset(root)
    }
    callbacks.onAction?.(button.dataset.action ?? '', kind)
  }

  root.addEventListener(
    'click',
    ev => {
      const target = ev.target instanceof Element ? ev.target : null
      if (!target) return

      const navLink = target.closest<HTMLElement>('[data-nav-view]')
      if (navLink) {
        ev.preventDefault()
        closeAllSubmenus(root)
        navigate(navLink.dataset.navView!, true)
        return
      }
      const toggle = target.closest<HTMLElement>('[data-submenu-toggle]')
      if (toggle) {
        const open = toggle.getAttribute('aria-expanded') !== 'true'
        closeAllSubmenus(root)
        setSubmenu(toggle, open)
        return
      }
      if (!target.closest('.mk2-globalnav')) closeAllSubmenus(root)

      const confirmBtn = target.closest<HTMLElement>('[data-confirm]')
      if (confirmBtn) {
        const dialog = findDialog(root, confirmBtn.dataset.confirm)
        if (dialog) openDialog(dialog)
        return
      }
      const dialogClose = target.closest<HTMLElement>('[data-dialog-close]')
      if (dialogClose) {
        const dialog = dialogClose.closest('dialog')
        if (dialog) closeDialog(dialog)
        return
      }
      const dialogConfirm = target.closest<HTMLElement>('[data-dialog-confirm]')
      if (dialogConfirm) {
        const dialog = dialogConfirm.closest('dialog')
        if (!dialog) return
        closeDialog(dialog)
        const trigger = Array.from(root.querySelectorAll<HTMLElement>('[data-action]')).find(b => b.dataset.action === dialog.dataset.dialogFor && b.dataset.confirm)
        if (trigger) run(trigger)
        return
      }
      const action = target.closest<HTMLElement>('[data-action]')
      if (action) return run(action)

      if (handleRepeatClick(target)) {
        evaluateVisibility(root)
        return
      }
      const sw = target.closest<HTMLElement>('[data-js-toggle]')
      if (sw) return toggleSwitch(sw)
      const select = target.closest<HTMLElement>('[data-js-select-button]')
      if (select) {
        select.closest('.dads-file-upload')?.querySelector<HTMLInputElement>('input[type="file"]')?.click()
        return
      }
      const sort = target.closest<HTMLElement>('[data-sort]')
      if (sort) return sortTable(sort)
      const tab = target.closest<HTMLElement>('[role="tab"]')
      if (tab) {
        ev.preventDefault()
        return selectTab(tab)
      }
      const toc = target.closest<HTMLAnchorElement>('[data-toc-link]')
      if (toc) {
        ev.preventDefault()
        const id = toc.getAttribute('href')?.slice(1)
        Array.from(root.querySelectorAll<HTMLElement>('[id]')).find(s => s.id === id)?.scrollIntoView?.({ behavior: 'smooth' })
        return
      }
      const banner = target.closest<HTMLElement>('[data-banner-close]')
      if (banner) banner.closest('.dads-notification-banner')?.remove()
    },
    { signal },
  )

  root.addEventListener(
    'change',
    ev => {
      evaluateVisibility(root)
      if (ev.target instanceof HTMLInputElement && ev.target.type === 'file') updateFileList(ev.target)
    },
    { signal },
  )
  root.addEventListener('input', () => evaluateVisibility(root), { signal })
  root.addEventListener('reset', () => setTimeout(() => restoreAfterReset(root), 0), { signal })
  // file-upload: ドラッグ＆ドロップ（preventDefault で既定のファイルオープンを止め、input.files に入れる）
  root.addEventListener(
    'dragover',
    ev => {
      if (ev.target instanceof Element && ev.target.closest('[data-js-drop-area]')) ev.preventDefault()
    },
    { signal },
  )
  root.addEventListener(
    'drop',
    ev => {
      const area = ev.target instanceof Element ? ev.target.closest('[data-js-drop-area]') : null
      if (!area) return
      ev.preventDefault()
      const input = area.closest('.dads-file-upload')?.querySelector<HTMLInputElement>('input[type="file"]')
      const files = ev.dataTransfer?.files
      if (!input || !files || files.length === 0) return
      input.files = files
      input.dispatchEvent(new Event('change', { bubbles: true }))
    },
    { signal },
  )
  root.addEventListener('submit', ev => ev.preventDefault(), { signal })
  root.addEventListener(
    'keydown',
    ev => {
      const target = ev.target instanceof Element ? ev.target : null
      if (ev.key === 'Escape') closeAllSubmenus(root)
      const tab = target?.closest<HTMLElement>('[role="tab"]')
      if (tab && moveTabFocus(tab, ev.key)) ev.preventDefault()
    },
    { signal },
  )

  evaluateVisibility(root)
  syncAllRepeatables(root)
  updateEmptyStates(root)
  return () => ac.abort()
}

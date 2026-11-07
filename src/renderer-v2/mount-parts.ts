/**
 * 部品ごとの小さな振る舞い: switch / file-upload / table の並べ替え / tab / submenu / dialog
 */

import { sortIcons } from './icons'

// ---- switch ----
/** switch の状態を aria-checked と、フォーム送信用の hidden input の両方へ反映する */
export function setSwitch(button: HTMLElement, on: boolean): void {
  button.setAttribute('aria-checked', on ? 'true' : 'false')
  const hidden = button.parentElement?.querySelector<HTMLInputElement>('input[data-switch-value]')
  if (hidden) hidden.value = on ? 'true' : 'false'
}

export function toggleSwitch(button: HTMLElement): void {
  if ((button as HTMLButtonElement).disabled) return
  setSwitch(button, button.getAttribute('aria-checked') !== 'true')
  button.dispatchEvent(new Event('change', { bubbles: true }))
}

// ---- file-upload ----
function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}バイト`
  return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)}KB` : `${(bytes / 1024 / 1024).toFixed(1)}MB`
}

/** 選択済みファイルを一覧に反映する（DADS の file-upload JS の最小相当） */
export function updateFileList(input: HTMLInputElement): void {
  const host = input.closest('.dads-file-upload')
  const list = host?.querySelector<HTMLElement>('[data-js-file-list]')
  const empty = host?.querySelector<HTMLElement>('[data-js-empty-message]')
  const summary = host?.querySelector<HTMLElement>('[data-js-select-summary]')
  if (!list || !empty) return
  const files = Array.from(input.files ?? [])
  list.replaceChildren(
    ...files.map(f => {
      const li = document.createElement('li')
      li.className = 'dads-file-upload__file-item'
      const name = document.createElement('span')
      name.className = 'dads-file-upload__file-name'
      name.textContent = f.name
      const meta = document.createElement('span')
      meta.className = 'dads-file-upload__file-meta'
      meta.textContent = ` ${fileSize(f.size)}`
      li.append(name, meta)
      return li
    }),
  )
  list.hidden = files.length === 0
  empty.hidden = files.length > 0
  if (summary) summary.textContent = files.length > 0 ? `${files.length}ファイルを選択中` : ''
}

// ---- table sort ----
/** 並べ替えヘッダーのクリック。none → ascending → descending → ascending … */
export function sortTable(button: HTMLElement): void {
  const th = button.closest('th')
  const table = th?.closest('table')
  const body = table?.querySelector('tbody')
  if (!th || !table || !body) return
  const next = th.getAttribute('aria-sort') === 'ascending' ? 'descending' : 'ascending'
  table.querySelectorAll('th[aria-sort]').forEach(h => {
    h.setAttribute('aria-sort', 'none')
    h.querySelector('.dads-table__sort-svg path')?.setAttribute('d', sortIcons.none)
  })
  th.setAttribute('aria-sort', next)
  th.querySelector('.dads-table__sort-svg path')?.setAttribute('d', sortIcons[next])
  const col = (th as HTMLTableCellElement).cellIndex
  const dir = next === 'ascending' ? 1 : -1
  const rows = Array.from(body.rows)
  // 数値・日付のセルは data-sort-value（数・ISO 日付）で比べる。表示は桁区切りや日本語表記で順序が崩れるため
  const cell = (r: HTMLTableRowElement) => r.cells[col]
  const text = (r: HTMLTableRowElement) => cell(r)?.dataset.sortValue ?? cell(r)?.textContent?.trim() ?? ''
  const num = (t: string) => (/^-?\d+(\.\d+)?$/.test(t) ? Number(t) : Number.NaN)
  const compare = (a: string, b: string) =>
    Number.isNaN(num(a)) || Number.isNaN(num(b)) ? a.localeCompare(b, 'ja', { numeric: true }) : num(a) - num(b)
  rows.sort((a, b) => dir * compare(text(a), text(b)))
  body.append(...rows)
  applyPage(table.closest<HTMLElement>('.mk2-list'))
}

/** rows と pageSize があるときは、並べ替えた全行の先頭 pageSize 件だけを表示する（2 ページ目以降は hidden） */
export function applyPage(list: HTMLElement | null): void {
  if (!list || !list.hasAttribute('data-paged')) return
  const size = Number(list.dataset.pageSize)
  if (!Number.isInteger(size) || size < 1) return
  Array.from(list.querySelectorAll<HTMLTableRowElement>('[data-list-body] tr')).forEach((r, i) => {
    r.hidden = i >= size
  })
}

// ---- tab ----
export function selectTab(tab: HTMLElement): void {
  const host = tab.closest('[data-tabs]')
  if (!host) return
  host.querySelectorAll<HTMLElement>('[role="tab"]').forEach(t => {
    const on = t === tab
    t.setAttribute('aria-selected', String(on))
    if (on) t.removeAttribute('tabindex')
    else t.setAttribute('tabindex', '-1')
    const panel = Array.from(host.querySelectorAll<HTMLElement>('[role="tabpanel"]')).find(p => p.id === t.getAttribute('aria-controls'))
    if (panel) panel.hidden = !on
  })
}

/** 矢印キー / Home / End で隣のタブへ */
export function moveTabFocus(tab: HTMLElement, key: string): boolean {
  const tabs = Array.from(tab.closest('[data-tabs]')?.querySelectorAll<HTMLElement>('[role="tab"]') ?? [])
  const i = tabs.indexOf(tab)
  const target = key === 'ArrowRight' ? tabs[(i + 1) % tabs.length] : key === 'ArrowLeft' ? tabs[(i - 1 + tabs.length) % tabs.length] : key === 'Home' ? tabs[0] : key === 'End' ? tabs[tabs.length - 1] : undefined
  if (!target) return false
  selectTab(target)
  target.focus()
  return true
}

// ---- submenu ----
export function setSubmenu(button: HTMLElement, open: boolean): void {
  button.setAttribute('aria-expanded', String(open))
  const menu = button.getAttribute('aria-controls')
  const el = menu ? Array.from(button.closest('.mk2-globalnav')?.querySelectorAll<HTMLElement>('.mk2-submenu') ?? []).find(m => m.id === menu) : undefined
  if (el) el.hidden = !open
}

export function closeAllSubmenus(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>('[data-submenu-toggle]').forEach(b => setSubmenu(b, false))
}

// ---- dialog ----
export function openDialog(dialog: HTMLDialogElement): void {
  if (dialog.open) return
  if (typeof dialog.showModal === 'function') dialog.showModal()
  else dialog.setAttribute('open', '')
  dialog.querySelector<HTMLElement>('.dads-modal-dialog__heading')?.focus()
}

export function closeDialog(dialog: HTMLDialogElement): void {
  if (typeof dialog.close === 'function') dialog.close()
  else dialog.removeAttribute('open')
}

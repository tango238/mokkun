/**
 * Section 単位の操作: reset（その Section の項目だけ初期値に戻す）、一括操作が使う選択行の収集
 */

import { setSwitch, updateFileList } from './mount-parts'
import { resetRepeatables } from './mount-repeat'

function inSection(root: HTMLElement, id: string | undefined): HTMLElement | undefined {
  return Array.from(root.querySelectorAll<HTMLElement>('[data-section-id]')).find(s => s.dataset.sectionId === id)
}

/** 行の選択チェックボックス／ラジオで選ばれている行 ID（list.bulkActions の payload.selectedRows） */
export function selectedRowIds(root: HTMLElement, sectionId: string | undefined): string[] {
  const list = Array.from(root.querySelectorAll<HTMLElement>('.mk2-list')).find(l => l.dataset.list === sectionId)
  if (!list) return []
  return Array.from(list.querySelectorAll<HTMLInputElement>('input[data-row-select]:checked')).map(i => i.value)
}

/**
 * その Section の入力欄だけを初期値に戻す（ネイティブの form.reset() はフォーム全体を戻してしまう）。
 * 繰り返しは min 件に戻し、switch とファイル一覧も追随させる。
 */
export function resetSection(root: HTMLElement, sectionId: string | undefined): void {
  const section = inSection(root, sectionId)
  if (!section) return
  section.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input, select, textarea').forEach(el => {
    if (el instanceof HTMLInputElement) {
      if (el.type === 'checkbox' || el.type === 'radio') el.checked = el.defaultChecked
      else if (el.type === 'file') el.value = ''
      else if (el.type !== 'hidden') el.value = el.defaultValue
    } else if (el instanceof HTMLSelectElement) {
      Array.from(el.options).forEach(o => {
        o.selected = o.defaultSelected
      })
    } else {
      el.value = el.defaultValue
    }
  })
  section.querySelectorAll<HTMLElement>('[data-initial-checked]').forEach(b => setSwitch(b, b.dataset.initialChecked === 'true'))
  section.querySelectorAll<HTMLInputElement>('input[type="file"]').forEach(updateFileList)
  resetRepeatables(section)
}

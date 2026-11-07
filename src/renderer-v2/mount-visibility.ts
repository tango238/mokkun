/**
 * visibleWhen: 参照先項目の現在値で、項目ラッパーの hidden を切り替える
 */

import { str } from './util'

interface Condition {
  item: string
  equals: string | number | boolean
}

function findField(scope: ParentNode, item: string): HTMLElement | undefined {
  return Array.from(scope.querySelectorAll<HTMLElement>('[data-field]')).find(el => el.dataset.field === item)
}

/** 項目の現在値。チェックボックスが複数あれば選択値の配列、単一なら 'true' / 'false' */
function readValue(field: HTMLElement): string | string[] {
  const radios = Array.from(field.querySelectorAll<HTMLInputElement>('input[type="radio"]'))
  if (radios.length > 0) return radios.find(r => r.checked)?.value ?? ''
  const checks = Array.from(field.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'))
  if (checks.length === 1) return String(checks[0].checked)
  if (checks.length > 1) return checks.filter(c => c.checked).map(c => c.value)
  const sw = field.querySelector('[role="switch"]')
  if (sw) return sw.getAttribute('aria-checked') === 'true' ? 'true' : 'false'
  const control = field.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('select, textarea, input')
  return control?.value ?? ''
}

function matches(value: string | string[], equals: Condition['equals']): boolean {
  return Array.isArray(value) ? value.includes(str(equals)) : value === str(equals)
}

/** root 内の [data-visible-when] をすべて評価する。繰り返しグループ内の条件はそのグループ内の項目を優先して参照する */
export function evaluateVisibility(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>('[data-visible-when]').forEach(el => {
    let cond: Condition
    try {
      cond = JSON.parse(el.dataset.visibleWhen ?? '')
    } catch {
      return
    }
    const group = el.closest('[data-repeat-group]')
    const ref = (group && findField(group, cond.item)) || findField(root, cond.item)
    if (!ref) return
    el.hidden = !matches(readValue(ref), cond.equals)
  })
}

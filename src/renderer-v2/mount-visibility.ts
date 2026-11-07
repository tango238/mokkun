/**
 * 条件: 参照先項目の現在値で、visibleWhen（項目ラッパー／セクションの hidden）と
 * requiredWhen（必須／任意の表示と required 属性）を切り替える
 */

import type { ConditionV2 } from '../types/schema-v2'
import { dateToken, matchesCondition, type Token } from './condition'

function findField(scope: ParentNode, item: string): HTMLElement | undefined {
  return Array.from(scope.querySelectorAll<HTMLElement>('[data-field]')).find(el => el.dataset.field === item)
}

/** 日付の入力欄をトークンにする（静的描画と同じ `dateToken`。年月だけの項目は日の入力が無い） */
function readDate(field: HTMLElement): string {
  const value = (part: string) => field.querySelector<HTMLInputElement>(`input[data-js-${part}-input]`)?.value ?? ''
  return dateToken(value('year'), value('month'), value('day'))
}

/** 項目の現在値。複数選択（data-multiple）は選択値の配列、単一 checkbox / switch は 'true' / 'false' */
export function readValue(field: HTMLElement): Token {
  if (field.dataset.component === 'date' && !field.querySelector('.dads-calendar')) return readDate(field)
  const radios = Array.from(field.querySelectorAll<HTMLInputElement>('input[type="radio"]'))
  if (radios.length > 0) return radios.find(r => r.checked)?.value ?? ''
  const checks = Array.from(field.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'))
  if (field.hasAttribute('data-multiple')) return checks.filter(c => c.checked).map(c => c.value)
  if (checks.length > 0) return String(checks[0].checked)
  const sw = field.querySelector('[role="switch"]')
  if (sw) return sw.getAttribute('aria-checked') === 'true' ? 'true' : 'false'
  const control = field.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('select, textarea, input')
  return control?.value ?? ''
}

/** data 属性の JSON 条件を読む（壊れていれば undefined） */
function readCondition(el: HTMLElement, attr: 'visibleWhen' | 'requiredWhen'): ConditionV2 | undefined {
  try {
    return JSON.parse(el.dataset[attr] ?? '') as ConditionV2
  } catch {
    return undefined
  }
}

/** 繰り返しグループ内の条件は、そのグループ内の項目を優先して参照する */
function evaluate(root: ParentNode, el: HTMLElement, attr: 'visibleWhen' | 'requiredWhen'): boolean | undefined {
  const cond = readCondition(el, attr)
  if (!cond) return undefined
  const group = el.closest('[data-repeat-group]')
  const ref = (group && findField(group, cond.item)) || findField(root, cond.item)
  return ref ? matchesCondition(readValue(ref), cond) : undefined
}

/** root 内の [data-visible-when] をすべて評価する */
export function evaluateVisibility(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>('[data-visible-when]').forEach(el => {
    const visible = evaluate(root, el, 'visibleWhen')
    if (visible !== undefined) el.hidden = !visible
  })
}

/** required 属性を付ける対象（ラジオは先頭だけ、チェックボックスのグループには付けない） */
function requirableControls(field: HTMLElement): HTMLInputElement[] {
  const controls = Array.from(field.querySelectorAll<HTMLInputElement>('input:not([type="hidden"]), select, textarea'))
  const radios = controls.filter(c => c.type === 'radio')
  if (radios.length > 0) return radios.slice(0, 1)
  if (controls.length > 1 && controls.every(c => c.type === 'checkbox')) return []
  return controls
}

/** root 内の [data-required-when] をすべて評価し、「※必須」「※任意」と required 属性を切り替える */
export function evaluateRequired(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>('[data-required-when]').forEach(el => {
    const required = evaluate(root, el, 'requiredWhen')
    if (required === undefined) return
    const badge = el.querySelector<HTMLElement>('.dads-form-control-label__requirement')
    if (badge) {
      badge.dataset.required = String(required)
      badge.textContent = required ? '※必須' : '※任意'
    }
    requirableControls(el).forEach(c => {
      c.required = required
    })
  })
}

/** visibleWhen と requiredWhen を評価する */
export function evaluateConditions(root: ParentNode): void {
  evaluateVisibility(root)
  evaluateRequired(root)
}

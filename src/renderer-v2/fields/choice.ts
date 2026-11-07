/**
 * radio / checkbox の fieldset と、それを使う select の変種
 * - radio: radio の fieldset
 * - checkbox: checkbox 1 つ / multiple は checkbox の fieldset
 * - select multiple: checkbox の fieldset（DADS の指針: 複数選択はチェックボックス）
 * - select segmented: radio の横並び fieldset
 */

import type { OptionV2 } from '../../types/schema-v2'
import { attrs, esc, str } from '../util'
import { requirementHtml, wrapGroup, wrapInline, type Ctl } from './control-label'

function toArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(str)
  return value === undefined || value === null || value === '' ? [] : [str(value)]
}

function radioItems(c: Ctl, options: OptionV2[]): string {
  const current = str(c.value)
  return options
    .map((o, i) => {
      const input = `<input${attrs({
        id: `${c.domId}-${i + 1}`,
        class: 'dads-radio__input',
        type: 'radio',
        name: c.name,
        value: str(o.value),
        checked: current !== '' && str(o.value) === current,
        required: c.f.required === true && i === 0,
        disabled: c.f.readonly === true,
        'aria-invalid': c.error ? 'true' : undefined,
      })}>`
      return `<label class="dads-radio" data-size="md">
      <span class="dads-radio__radio">${input}</span>
      <span class="dads-radio__label">${esc(o.label)}</span>
    </label>`
    })
    .join('\n    ')
}

function checkboxItems(c: Ctl, options: OptionV2[]): string {
  const selected = toArray(c.value)
  return options
    .map((o, i) => {
      const input = `<input${attrs({
        id: `${c.domId}-${i + 1}`,
        class: 'dads-checkbox__input',
        type: 'checkbox',
        name: c.name,
        value: str(o.value),
        checked: selected.includes(str(o.value)),
        disabled: c.f.readonly === true,
        'aria-invalid': c.error ? 'true' : undefined,
      })}>`
      return `<label class="dads-checkbox" data-size="md">
      <span class="dads-checkbox__checkbox">${input}</span>
      <span class="dads-checkbox__label">${esc(o.label)}</span>
    </label>`
    })
    .join('\n    ')
}

export function renderRadio(c: Ctl, inline = false): string {
  return wrapGroup(c, radioItems(c, c.f.options ?? []), inline ? { 'data-inline': true } : {})
}

export function renderCheckboxGroup(c: Ctl): string {
  return wrapGroup(c, checkboxItems(c, c.f.options ?? []))
}

/** 単一チェックボックス: ラベルはチェックボックス自身（必須表示も同じ行に） */
export function renderCheckbox(c: Ctl): string {
  if (c.f.multiple) return renderCheckboxGroup(c)
  const checked = c.value === true || str(c.value) === 'true'
  const input = `<input${attrs({
    id: c.domId,
    class: 'dads-checkbox__input',
    type: 'checkbox',
    name: c.name,
    value: 'true',
    checked,
    required: c.f.required === true,
    disabled: c.f.readonly === true,
    'aria-invalid': c.error ? 'true' : undefined,
    'aria-describedby': c.describedBy,
  })}>`
  const control = `<label class="dads-checkbox" data-size="md">
      <span class="dads-checkbox__checkbox">${input}</span>
      <span class="dads-checkbox__label">${esc(c.f.label)} ${requirementHtml(c.f)}</span>
    </label>`
  return wrapInline(c, control)
}

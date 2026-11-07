/**
 * input-text 系: text / number / time / duration / combobox
 */

import { attrs, esc, propNumber, propString, str } from '../util'
import { ariaAttrs, wrapSingle, type Ctl } from './control-label'

interface InputOpts {
  type: string
  inputmode?: string
  list?: string
  min?: number
  max?: number
  step?: number
  /** 入力欄の後ろに付ける単位（同じ control の中） */
  unit?: string
  /** ラベルを持たない場所（一覧セル）で使う aria-label */
  ariaLabel?: string
}

/** input-text 1 つ（form-control-label の外側）。一覧セルの入力欄からも使う */
export function inputText(c: Ctl, o: InputOpts): string {
  const input = `<input${attrs({
    id: c.domId,
    class: 'dads-input-text__input',
    type: o.type,
    name: c.name,
    value: c.value === undefined || c.value === null ? undefined : str(c.value),
    'data-size': 'md',
    inputmode: o.inputmode,
    list: o.list,
    min: o.min,
    max: o.max,
    step: o.step,
    autocomplete: c.f.autocomplete,
    'aria-label': o.ariaLabel,
    required: c.required,
    readonly: c.f.readonly === true,
  })}${ariaAttrs(c)}>`
  const error = c.error ? `\n      <span id="${esc(c.errorId)}" class="dads-input-text__error-text">${esc(c.error)}</span>` : ''
  const control = `<span class="dads-input-text">
      ${input}${error}
    </span>`
  // 上流 input-text に単位の部品はない。DADS のトークンだけで整える補助クラス（mokkun-v2.css）
  return o.unit ? `<span class="mk2-with-unit">${control}<span class="mk2-unit">${esc(o.unit)}</span></span>` : control
}

export function renderText(c: Ctl): string {
  const inputType = propString(c.f.props, 'inputType')
  const allowed = ['text', 'email', 'tel', 'url', 'password', 'search']
  return wrapSingle(c, inputText(c, { type: inputType && allowed.includes(inputType) ? inputType : 'text', unit: c.f.unit }))
}

export function renderNumber(c: Ctl): string {
  const p = c.f.props
  return wrapSingle(
    c,
    inputText(c, { type: 'number', inputmode: 'numeric', min: propNumber(p, 'min'), max: propNumber(p, 'max'), step: propNumber(p, 'step'), unit: c.f.unit }),
  )
}

export function renderTime(c: Ctl): string {
  return wrapSingle(c, inputText(c, { type: 'time', unit: c.f.unit }))
}

/** 数値入力 + 単位（unit、なければ props.unit、既定「分」） */
export function renderDuration(c: Ctl): string {
  const unit = c.f.unit ?? propString(c.f.props, 'unit') ?? '分'
  return wrapSingle(c, inputText(c, { type: 'number', inputmode: 'numeric', min: 0, unit }))
}

/** input-text + datalist（候補は options のラベル） */
export function renderCombobox(c: Ctl): string {
  const listId = `${c.domId}-list`
  const options = (c.f.options ?? []).map(o => `<option value="${esc(o.label)}"></option>`).join('')
  const selected = c.f.options?.find(o => str(o.value) === str(c.value))
  const ctl: Ctl = selected ? { ...c, value: selected.label } : c
  return wrapSingle(c, `${inputText(ctl, { type: 'text', list: listId, unit: c.f.unit })}<datalist id="${esc(listId)}">${options}</datalist>`)
}

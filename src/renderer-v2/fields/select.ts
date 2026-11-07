/**
 * select / browser（階層は optgroup）と、select の変種の振り分け
 */

import type { OptionV2 } from '../../types/schema-v2'
import { attrs, esc, objectItems, str } from '../util'
import { chevronDown } from '../icons'
import { ariaAttrs, wrapSingle, type Ctl } from './control-label'
import { renderCheckboxGroup, renderRadio } from './choice'

interface BrowserItem {
  value: string
  label: string
  children?: BrowserItem[]
}

export function option(o: OptionV2 | BrowserItem, current: string): string {
  return `<option${attrs({ value: str(o.value), selected: current !== '' && str(o.value) === current })}>${esc(o.label)}</option>`
}

/** select 1 つ（form-control-label の外側）。一覧セルの入力欄からも使う */
export function selectControl(c: Ctl, body: string, ariaLabel?: string): string {
  const select = `<select${attrs({
    id: c.domId,
    class: 'dads-select__select',
    name: c.name,
    'data-size': 'md',
    autocomplete: c.f.autocomplete,
    'aria-label': ariaLabel,
    required: c.required,
    disabled: c.f.readonly === true,
  })}${ariaAttrs(c)}>
          <option value="">選択してください</option>
          ${body}
        </select>`
  const error = c.error ? `\n      <span id="${esc(c.errorId)}" class="dads-select__error-text">${esc(c.error)}</span>` : ''
  return `<span class="dads-select">
      <span class="dads-select__control">
        ${select}
        ${chevronDown('dads-select__chevron')}
      </span>${error}
    </span>`
}

export function renderSelect(c: Ctl): string {
  if (c.f.multiple) return renderCheckboxGroup(c)
  if (c.f.variant === 'segmented') return renderRadio(c, true)
  const current = str(c.value)
  return wrapSingle(c, selectControl(c, (c.f.options ?? []).map(o => option(o, current)).join('\n          ')))
}

/** 階層を持つ項目は optgroup、持たない項目は option（props.items は { value, label, children? }） */
export function renderBrowser(c: Ctl): string {
  const items = objectItems<BrowserItem>(c.f.props?.items, 'label')
  const source: BrowserItem[] = items.length > 0 ? items : (c.f.options ?? []).map(o => ({ value: str(o.value), label: o.label }))
  const current = str(c.value)
  const body = source
    .map(item =>
      Array.isArray(item.children) && item.children.length > 0
        ? `<optgroup label="${esc(item.label)}">${objectItems<BrowserItem>(item.children, 'label').map(ch => option(ch, current)).join('')}</optgroup>`
        : option(item, current),
    )
    .join('\n          ')
  return wrapSingle(c, selectControl(c, body))
}

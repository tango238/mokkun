/**
 * textarea
 */

import { attrs, esc, propNumber } from '../util'
import { ariaAttrs, wrapSingle, type Ctl } from './control-label'

export function renderTextarea(c: Ctl): string {
  const value = c.value === undefined || c.value === null ? '' : String(c.value)
  const textarea = `<textarea${attrs({
    id: c.domId,
    class: 'dads-textarea__textarea',
    name: c.name,
    rows: propNumber(c.f.props, 'rows'),
    required: c.f.required === true,
    readonly: c.f.readonly === true,
  })}${ariaAttrs(c)}>${esc(value)}</textarea>`
  const error = c.error ? `\n      <span id="${esc(c.errorId)}" class="dads-textarea__error-text">${esc(c.error)}</span>` : ''
  return wrapSingle(
    c,
    `<span class="dads-textarea">
      ${textarea}${error}
    </span>`,
  )
}

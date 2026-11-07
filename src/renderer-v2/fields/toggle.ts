/**
 * toggle → switch（on-off）
 * DADS の switch は JS で aria-checked を切り替える。クリック処理は mount.ts で行う。
 */

import { attrs, esc, str } from '../util'
import { switchCheck } from '../icons'
import { wrapSingle, type Ctl } from './control-label'

export function renderToggle(c: Ctl): string {
  const on = c.value === true || str(c.value) === 'true'
  const button = `<button${attrs({
    id: c.domId,
    class: 'dads-switch-on-off__button',
    type: 'button',
    role: 'switch',
    'aria-checked': on ? 'true' : 'false',
    'aria-describedby': c.describedBy,
    disabled: c.f.readonly === true,
    'data-js-toggle': true,
    'data-initial-checked': on ? 'true' : 'false',
  })}>
        <span class="dads-switch-on-off__track" aria-hidden="true">
          <span class="dads-switch-on-off__thumb">
            ${switchCheck}
          </span>
        </span>
      </button>`
  return wrapSingle(
    c,
    `<dads-switch-on-off class="dads-switch-on-off">
      ${button}
      <input type="hidden" name="${esc(c.name)}" value="${on ? 'true' : 'false'}" data-switch-value>
    </dads-switch-on-off>${c.error ? `<p id="${esc(c.errorId)}" class="dads-form-control-label__error-text">${esc(c.error)}</p>` : ''}`,
  )
}

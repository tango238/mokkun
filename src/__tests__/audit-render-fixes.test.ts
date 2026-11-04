/**
 * 描画側の「勝手に足す／差し替える」修正の回帰テスト
 */
import { describe, it, expect } from 'vitest'
import { parseYaml } from '../parser'
import { normalizeKeysDeep } from '../parser/key-normalizer'
import { renderAction } from '../renderer/components/layout'
import { ActionHandler } from '../renderer/action-handler'
import { vi, afterEach } from 'vitest'
import { renderField } from '../renderer/components/form-fields'
import { renderWizardScreen } from '../renderer/screen-renderer'
import type { InputField, ScreenDefinition } from '../types/schema'

function hasEventAttr(html: string): boolean {
  const root = document.createElement('div')
  root.innerHTML = html
  return [...root.querySelectorAll('*')].some(el => el.getAttributeNames().some(n => n.startsWith('on')))
}

const f = (o: Record<string, unknown>) => o as unknown as InputField

describe('repeater static rendering', () => {
  it('renders min_items items with 件 counter and 追加 label', () => {
    const html = renderField(f({ id: 'r', type: 'repeater', label: 'R', min_items: 2, item_fields: [{ id: 'x', type: 'text', label: 'X' }] }))
    expect(html.match(/class="repeater-item expanded"/g)).toHaveLength(2)
    expect(html).toContain('2 件')
    expect(html).toContain('>追加<')
  })
  it('renders no items for min_items 0 and shows max in counter', () => {
    const html = renderField(f({ id: 'r', type: 'repeater', label: 'R', min_items: 0, max_items: 5, item_fields: [] }))
    expect(html).not.toContain('repeater-item expanded')
    expect(html).toContain('0 / 5 件')
  })
  it('defaults to one item', () => {
    const html = renderField(f({ id: 'r', type: 'repeater', label: 'R', item_fields: [] }))
    expect(html.match(/class="repeater-item expanded"/g)).toHaveLength(1)
  })
})

describe('toggle static rendering', () => {
  it('reads snake_case keys', () => {
    const html = renderField(f({ id: 't', type: 'toggle', label: 'T', default: true, checked_label: '有効', unchecked_label: '無効', label_position: 'left', disabled: true }))
    expect(html).toMatch(/role="switch" aria-checked="true" checked/)
    expect(html).toContain('有効')
    expect(html).toContain('toggle-label-left')
    expect(html).toContain('disabled')
    expect(html.indexOf('toggle-label ')).toBeLessThan(html.indexOf('toggle-switch-container'))
  })
})

describe('select required blank option', () => {
  it('renders disabled selected blank for required without default', () => {
    const html = renderField(f({ id: 's', type: 'select', label: 'S', required: true, options: [{ value: 'a', label: 'A' }] }))
    expect(html).toMatch(/<option value="" disabled selected>/)
  })
  it('puts selected on the default when given', () => {
    const html = renderField(f({ id: 's', type: 'select', label: 'S', required: true, default: 'a', options: [{ value: 'a', label: 'A' }] }))
    expect(html).toMatch(/<option value="" disabled>/)
    expect(html).toMatch(/value="a"\s+selected/)
  })
})

describe('label / file_upload', () => {
  it('omits label element and uses placeholder as aria-label', () => {
    const html = renderField(f({ id: '__auto_field_1', type: 'text', label: '', placeholder: '検索' }))
    expect(html).not.toContain('<label')
    expect(html).toContain('aria-label="検索"')
  })
  it('accepts string accept without throwing', () => {
    const html = renderField(f({ id: 'u', type: 'file_upload', label: 'U', accept: '.png, .jpg' }))
    expect(html).toContain('accept=".png,.jpg"')
  })
})

describe('wizard screen.actions', () => {
  const result = parseYaml(`
view:
  w:
    title: W
    wizard:
      steps:
        - id: s1
          title: One
          fields: [{ id: a, type: text, label: A }]
        - id: s2
          title: Two
          fields: [{ id: b, type: text, label: B }]
    actions:
      - { id: cancel, type: navigate, label: 中止, to: w }
      - { id: go, type: submit, label: 登録, style: primary }
`)
  it('renders non-submit on all steps and submit only on the last (replacing built-in)', () => {
    expect(result.success).toBe(true)
    if (!result.success) return
    const screen = result.data.view.w as ScreenDefinition
    const first = renderWizardScreen(screen, 0)
    expect(first).toContain('wizard-screen-actions')
    expect(first).toContain('data-action-id="cancel"')
    expect(first).toContain('data-action-type="navigate"')
    expect(first).toContain('中止')
    expect(first).not.toContain('登録')
    const last = renderWizardScreen(screen, 1)
    expect(last).toContain('中止')
    expect(last).toContain('登録')
    expect(last).not.toContain('wizard-submit')
    expect(last).toContain('data-action-id="go"')
    expect(last).toContain('data-action-type="submit"')
  })
})


describe('attribute injection hardening', () => {
  it('ignores unsafe class and non-numeric length attributes', () => {
    const t = renderField(f({ id: 't', type: 'text', label: 'T', class: 'a" onclick="alert(1)', max_length: '5" onclick="x', min_length: 'x" onfocus="y', default: 'v" onclick="z' }))
    expect(hasEventAttr(t)).toBe(false)
    const ta = renderField(f({ id: 'a', type: 'textarea', label: 'A', max_length: '5" onclick="x', rows: 'x" onclick="y' }))
    expect(ta).not.toContain('onclick')
    const n = renderField(f({ id: 'n', type: 'number', label: 'N', step: '1" onclick="x', min: 'a" onclick="b', default: 'q" onclick="r' }))
    expect(hasEventAttr(n)).toBe(false)
    const h = renderField(f({ id: 'h', type: 'heading', label: 'H', class: 'a" onclick="x' }))
    expect(hasEventAttr(h)).toBe(false)
    const ok = renderField(f({ id: 't', type: 'text', label: 'T', class: 'my-class', max_length: 10 }))
    expect(ok).toContain('my-class')
    expect(ok).toContain('maxlength="10"')
  })
})

describe('parser: default_value for calendar / browser', () => {
  it('maps default_value to default and prefers default', () => {
    const r = parseYaml(`
view:
  s:
    title: S
    fields:
      - { id: c1, type: calendar, label: C, default_value: "2025-01-02" }
      - { id: c2, type: calendar, label: C, default: "2025-03-04", default_value: "2025-01-02" }
      - { id: b1, type: browser, label: B, default_value: x, items: [] }
      - { id: b2, type: browser, label: B, default: y, default_value: x, items: [] }
`)
    expect(r.success).toBe(true)
    if (!r.success) return
    const fl = Object.fromEntries(((r.data.view as any).s.fields as any[]).map(x => [x.id, x]))
    expect(fl.c1.default).toBe('2025-01-02')
    expect(fl.c2.default).toBe('2025-03-04')
    expect(fl.b1.default).toBe('x')
    expect(fl.b2.default).toBe('y')
  })
})

describe('key-normalizer reserved keys', () => {
  it('drops __proto__ / constructor / prototype keys', () => {
    const input = JSON.parse('{"a":1,"__proto__":{"x":1},"constructor":{"y":1},"prototype":2}')
    const out = normalizeKeysDeep(input) as Record<string, unknown>
    expect(Object.keys(out)).toEqual(['a'])
    expect(({} as Record<string, unknown>).x).toBeUndefined()
  })
})

describe('repeater static ids', () => {
  it('has no duplicate ids with min_items >= 2 (including nested)', () => {
    const html = renderField(f({
      id: 'r', type: 'repeater', label: 'R', min_items: 3,
      item_fields: [
        { id: 'x', type: 'text', label: 'X' },
        { id: 'inner', type: 'repeater', label: 'I', min_items: 1, item_fields: [{ id: 'y', type: 'text', label: 'Y' }] },
      ],
    }))
    const ids = [...html.matchAll(/ id="([^"]+)"/g)].map(m => m[1])
    expect(ids.length).toBeGreaterThan(3)
    expect(new Set(ids).size).toBe(ids.length)
    expect(html).toContain('id="r_0_x"')
  })
  it('caps rendered items', () => {
    const html = renderField(f({ id: 'r', type: 'repeater', label: 'R', min_items: 100, item_fields: [] }))
    expect(html.match(/class="repeater-item expanded"/g)).toHaveLength(20)
  })
})

describe('select blank option refinements', () => {
  it('selects blank when default does not match any option', () => {
    const html = renderField(f({ id: 's', type: 'select', label: 'S', default: 'zzz', options: [{ value: 'a', label: 'A' }] }))
    expect(html).toMatch(/<option value="" selected>/)
  })
  it('omits placeholder when options contain an empty value', () => {
    const html = renderField(f({ id: 's', type: 'select', label: 'S', options: [{ value: '', label: 'すべて' }, { value: 'a', label: 'A' }] }))
    expect(html).not.toContain('選択してください')
    expect(html.match(/<option value=""/g)).toHaveLength(1)
  })
})

describe('ActionHandler integration', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    document.body.classList.remove('dialog-open')
  })

  it('opens danger ActionDialog with custom labels from rendered action HTML', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    container.innerHTML = renderAction({
      id: 'rm', type: 'submit', label: '削除', style: 'danger',
      confirm: { title: 't', message: 'm', confirm_label: '消す', cancel_label: 'やめる' },
    } as any)
    new ActionHandler(container, {}).attach()
    ;(container.querySelector('button') as HTMLButtonElement).click()
    expect(document.querySelector('.dialog-danger')).toBeTruthy()
    expect(document.querySelector('.dialog-btn-confirm')?.textContent).toContain('消す')
    expect(document.querySelector('.dialog-btn-cancel')?.textContent).toContain('やめる')
  })

  it('calls onCancel when the generic dialog is closed with Escape', () => {
    const onCancel = vi.fn()
    const container = document.createElement('div')
    document.body.appendChild(container)
    container.innerHTML = renderAction({ id: 'go', type: 'submit', label: 'Go', confirm: { title: 't', message: 'm' } } as any)
    new ActionHandler(container, { onCancel }).attach()
    ;(container.querySelector('button') as HTMLButtonElement).click()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    document.querySelector('.dialog-overlay')?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    document.querySelector('.dialog-overlay')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(onCancel).toHaveBeenCalledWith('go')
  })

  it('prevents native submit and runs onSubmit once; blocks on invalid form', () => {
    const onSubmit = vi.fn()
    const form = document.createElement('form')
    form.innerHTML = '<input name="a" required>' + renderAction({ id: 'go', type: 'submit', label: 'Go' } as any)
    document.body.appendChild(form)
    new ActionHandler(form, { onSubmit }).attach()
    const btn = form.querySelector('button') as HTMLButtonElement
    const invalidEvt = new MouseEvent('click', { bubbles: true, cancelable: true })
    btn.dispatchEvent(invalidEvt)
    expect(onSubmit).not.toHaveBeenCalled()
    ;(form.querySelector('input') as HTMLInputElement).value = 'x'
    const evt = new MouseEvent('click', { bubbles: true, cancelable: true })
    btn.dispatchEvent(evt)
    expect(evt.defaultPrevented).toBe(true)
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })
})

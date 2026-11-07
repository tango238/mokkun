/**
 * v2 専用レンダラー（DADS 準拠）のテスト
 */

import { describe, it, expect, beforeEach } from 'vitest'
import fs from 'fs'
import { parseYamlV2 } from '../parser/yaml-parser'
import { renderViewV2, mountViewV2 } from '../renderer-v2'
import { VALID_COMPONENTS_V2 } from '../types/schema-v2'
import type { FieldV2, MokkunV2Schema } from '../types/schema-v2'

const yamlText = fs.readFileSync('examples/v2/order-entry.yaml', 'utf-8')

function load(): MokkunV2Schema {
  const r = parseYamlV2(yamlText)
  if (!r.success) throw new Error(JSON.stringify(r.errors))
  return r.data
}

function dom(html: string): HTMLElement {
  const el = document.createElement('div')
  el.innerHTML = html
  return el
}

const schema = load()
const viewNames = Object.keys(schema.views)

describe('parseYamlV2', () => {
  it('検証済みの v2 スキーマを返す（旧フォーマットへ変換しない）', () => {
    expect(schema.mokkun).toBe(2)
    expect(Object.keys(schema.views)).toContain('order_form')
  })
})

describe('renderViewV2: 全 view', () => {
  it.each(viewNames)('%s: unknown が無く、id が一意', name => {
    const html = renderViewV2(schema, name)
    // 未対応 component のプレースホルダー（dispatcher が出す明示マーカー）が無いこと
    expect(html).not.toContain('data-unknown-component')
    const root = dom(html)
    expect(root.querySelector('.mokkun-v2')).not.toBeNull()
    const ids = Array.from(root.querySelectorAll('[id]')).map(e => e.id)
    expect(new Set(ids).size).toBe(ids.length)
    ids.forEach(id => expect(id.startsWith(`${name}-`)).toBe(true))
  })

  it('存在しない view はエラー文を返す', () => {
    expect(renderViewV2(schema, 'nope')).toContain('画面が見つかりません')
  })
})

describe('order_form', () => {
  const root = dom(renderViewV2(schema, 'order_form'))

  it('必須項目に DADS の必須バッジが付く', () => {
    const badges = root.querySelectorAll('.dads-form-control-label__requirement[data-required="true"]')
    expect(badges.length).toBeGreaterThanOrEqual(4)
    expect(badges[0].textContent).toBe('※必須')
  })

  it('サポートテキストが aria-describedby で結ばれる', () => {
    const input = root.querySelector<HTMLInputElement>('input[name="customerName"]')!
    const ids = input.getAttribute('aria-describedby')!.split(' ')
    ids.forEach(id => expect(root.querySelector(`#${id}`)).not.toBeNull())
    expect(root.querySelector(`#${ids[0]}`)!.textContent).toContain('例: 株式会社サンプル')
    expect(input.getAttribute('placeholder')).toBeNull()
  })

  it('radio は fieldset + legend', () => {
    const fs1 = root.querySelector('fieldset[data-field="deliveryType"]')!
    expect(fs1.querySelector('legend')).not.toBeNull()
    expect(fs1.querySelectorAll('.dads-radio').length).toBe(2)
  })

  it('現在のナビ項目に aria-current="page"', () => {
    const current = root.querySelectorAll('.mk2-globalnav [aria-current="page"]')
    expect(current.length).toBe(1)
    expect(current[0].textContent).toBe('受注登録')
  })

  it('手順ナビは 3 ステップで先頭が reached', () => {
    const steps = root.querySelectorAll('.dads-step-navigation__step')
    expect(steps.length).toBe(3)
    expect(steps[0].getAttribute('data-state')).toBe('reached')
    expect(steps[1].hasAttribute('data-state')).toBe(false)
  })

  it('「補足を伝える」は単独の collapsed なので disclosure（見出しなし・サマリーがセクション名）', () => {
    const sec = root.querySelector('section[id$="section-memo"]')!
    const details = sec.querySelector('details.dads-disclosure')!
    expect(details.hasAttribute('open')).toBe(false)
    expect(details.querySelector('summary')!.textContent).toContain('補足を伝える')
    expect(sec.querySelector('.dads-heading')).toBeNull()
    expect(sec.textContent).not.toContain('入力欄を開く')
    expect(sec.getAttribute('aria-labelledby')).toBe(details.querySelector('summary')!.id)
  })

  it('「明細を追加する」は 1 グループと追加ボタン', () => {
    const rep = root.querySelector('[data-repeatable="lines"]')!
    expect(rep.querySelectorAll('[data-repeat-groups] > [data-repeat-group]').length).toBe(1)
    expect(rep.querySelector('[data-repeat-add]')!.textContent).toBe('明細を追加')
    expect(rep.querySelector('[data-repeat-group] h3')!.textContent).toBe('#1')
  })

  it('パンくず・h1・sticky フッター・確認ダイアログ', () => {
    expect(root.querySelector('.dads-breadcrumb [aria-current="page"]')!.textContent).toBe('受注登録')
    expect(root.querySelector('h1.dads-heading__heading')!.textContent).toBe('受注登録')
    expect(root.querySelector('.mk2-sticky [data-type="solid-fill"][data-size="lg"]')).not.toBeNull()
    expect(root.querySelector('dialog')!.getAttribute('data-dialog-for')).toBe('cancel')
    expect(root.querySelector('dialog.dads-modal-dialog')).not.toBeNull()
    expect(root.querySelector('.dads-notification-banner[data-type="error"]')).not.toBeNull()
  })
})

describe('order_list', () => {
  const root = dom(renderViewV2(schema, 'order_list'))
  it('table は 5 見出し、page-navigation あり', () => {
    expect(root.querySelectorAll('thead th').length).toBe(5 + 1)
    expect(root.querySelectorAll('thead th[aria-sort]').length).toBe(2)
    expect(root.querySelector('nav.dads-page-navigation')).not.toBeNull()
    expect(root.querySelectorAll('tbody tr').length).toBe(3)
    expect(root.querySelector('[data-empty][hidden]')!.textContent).toBe('該当する受注はありません')
    // 前後のページが無いときはボタンを出さない（無効にもしない）
    expect(root.querySelectorAll('nav.dads-page-navigation button').length).toBe(0)
    expect(root.querySelector('figure.dads-table[data-row-hover-highlight] .dads-table__caption')).not.toBeNull()
  })
})

describe('order_confirm', () => {
  it('dl（description-list）で値を表示', () => {
    const root = dom(renderViewV2(schema, 'order_confirm'))
    const dl = root.querySelector('dl.dads-description-list')!
    expect(dl.querySelectorAll('dt').length).toBe(4)
    expect(dl.textContent).toContain('125,000')
  })
})

describe('エスケープ', () => {
  it('ユーザー由来のテキストを HTML として解釈しない', () => {
    const s = structuredClone(schema)
    s.views.order_form.title = '<img src=x onerror=alert(1)>'
    const root = dom(renderViewV2(s, 'order_form'))
    expect(root.querySelector('img')).toBeNull()
  })
})

// ---- component → DADS ルートクラス ----
function field(component: string, extra: Partial<FieldV2> = {}): FieldV2 {
  return { item: 'x', label: 'ラベル', component, ...extra } as FieldV2
}

function renderField(f: FieldV2): HTMLElement {
  const s: MokkunV2Schema = {
    mokkun: 2,
    app: { name: 'a' },
    views: { v: { title: 't', goal: 'g', sections: [{ id: 's', title: 'S', fields: [f] }] } },
  }
  return dom(renderViewV2(s, 'v'))
}

describe('component → DADS 部品', () => {
  const cases: Array<[string, Partial<FieldV2>, string]> = [
    ['text', {}, '.dads-input-text input[type="text"]'],
    ['number', {}, '.dads-input-text input[type="number"][inputmode="numeric"]'],
    ['textarea', {}, '.dads-textarea textarea'],
    ['date', {}, '.dads-date-picker'],
    ['date', { inline: true }, '.dads-calendar'],
    ['time', {}, '.dads-input-text input[type="time"]'],
    ['duration', {}, '.dads-input-text input[type="number"]'],
    ['file', {}, '.dads-file-upload input[type="file"]'],
    ['file', { accept: 'image' }, '.dads-file-upload input[accept="image/*"]'],
    ['photo_grid', {}, '.dads-file-upload'],
    ['select', { options: [{ value: 'a', label: 'A' }] }, '.dads-select select'],
    ['select', { multiple: true, options: [{ value: 'a', label: 'A' }] }, 'fieldset .dads-checkbox'],
    ['select', { variant: 'segmented', options: [{ value: 'a', label: 'A' }] }, 'fieldset[data-inline] .dads-radio'],
    ['combobox', { options: [{ value: 'a', label: 'A' }] }, '.dads-input-text input[list]'],
    ['radio', { options: [{ value: 'a', label: 'A' }] }, 'fieldset .dads-radio'],
    ['checkbox', {}, '.dads-checkbox input[type="checkbox"]'],
    ['checkbox', { multiple: true, options: [{ value: 'a', label: 'A' }] }, 'fieldset .dads-checkbox'],
    ['toggle', {}, '.dads-switch-on-off [role="switch"]'],
    ['browser', { options: [{ value: 'a', label: 'A' }] }, '.dads-select select'],
    ['badge', { value: 'v' }, '.dads-chip-label'],
    ['chip', { value: 'v' }, '.dads-chip-label'],
    ['status', { value: 'v', variant: 'success' }, '.dads-chip-label[data-color="green"]'],
    ['timeline', { props: { items: [{ time: '9:00', title: 'T' }] } }, 'ol.dads-list li'],
    ['map', {}, '.dads-image'],
  ]

  it('全 component を網羅している', () => {
    expect(new Set(cases.map(c => c[0]))).toEqual(new Set(VALID_COMPONENTS_V2))
  })

  it.each(cases)('%s %j → %s', (component, extra, selector) => {
    const root = renderField(field(component, extra))
    expect(root.querySelector(`.mk2-fields ${selector}`)).not.toBeNull()
    expect(root.querySelector('.dads-form-control-label')).not.toBeNull()
  })

  it('props.error は error-text と aria-invalid を出す', () => {
    const root = renderField(field('text', { props: { error: '入力してください' } }))
    const input = root.querySelector('input')!
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(root.querySelector('.dads-input-text__error-text')!.textContent).toBe('入力してください')
    expect(input.getAttribute('aria-describedby')).toContain(root.querySelector('.dads-input-text__error-text')!.id)
  })
})

// ---- mount ----
describe('mountViewV2', () => {
  let container: HTMLElement
  beforeEach(() => {
    document.body.innerHTML = ''
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  it('visibleWhen: postalCode / address は初期非表示で、別の住所を選ぶと表示', () => {
    const c = mountViewV2(container, schema, 'order_form')
    const wrap = (n: string) => container.querySelector<HTMLElement>(`[data-field="${n}"]`)!
    expect(wrap('postalCode').hidden).toBe(true)
    expect(wrap('address').hidden).toBe(true)
    expect(wrap('desiredDate').hidden).toBe(false)
    const other = container.querySelector<HTMLInputElement>('input[name="deliveryType"][value="other"]')!
    other.checked = true
    other.dispatchEvent(new Event('change', { bubbles: true }))
    expect(wrap('postalCode').hidden).toBe(false)
    expect(wrap('address').hidden).toBe(false)
    const cust = container.querySelector<HTMLInputElement>('input[name="deliveryType"][value="customer"]')!
    cust.checked = true
    cust.dispatchEvent(new Event('change', { bubbles: true }))
    expect(wrap('postalCode').hidden).toBe(true)
    c.destroy()
    expect(container.innerHTML).toBe('')
  })

  it('repeatable: 追加・削除と max / min', () => {
    const s = structuredClone(schema)
    s.views.order_form.sections[2].repeatable = { min: 1, max: 2, addLabel: '追加' }
    mountViewV2(container, s, 'order_form')
    const groups = () => container.querySelectorAll('[data-repeat-groups] > [data-repeat-group]')
    const add = container.querySelector<HTMLButtonElement>('[data-repeat-add]')!
    expect(groups().length).toBe(1)
    expect((container.querySelector('[data-repeat-remove]') as HTMLButtonElement).hidden).toBe(true)
    add.click()
    expect(groups().length).toBe(2)
    expect(add.disabled).toBe(true)
    add.disabled = false
    add.click() // max を超えない
    expect(groups().length).toBe(2)
    const ids = Array.from(container.querySelectorAll('[id]')).map(e => e.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(groups()[1].querySelector('h3')!.textContent).toBe('#2')
    expect(groups()[1].querySelector('input[name="quantity__2"]')).not.toBeNull()
    // 1 件目を削除すると 2 件目が #1 に再採番される
    container.querySelector<HTMLButtonElement>('[data-repeat-remove]')!.click()
    expect(groups().length).toBe(1)
    expect(groups()[0].querySelector('h3')!.textContent).toBe('#1')
    expect(groups()[0].querySelector('input[name="quantity__1"]')).not.toBeNull()
    expect(add.disabled).toBe(false)
    expect((container.querySelector('[data-repeat-remove]') as HTMLButtonElement).hidden).toBe(true)
  })

  it('確認ダイアログ: アクションで開き、確定で実行される', () => {
    const seen: string[] = []
    mountViewV2(container, schema, 'order_form', { onNavigate: v => seen.push(v) })
    const dialog = container.querySelector<HTMLDialogElement>('dialog')!
    expect(dialog.open).toBe(false)
    container.querySelector<HTMLElement>('[data-action="cancel"]')!.click()
    expect(dialog.hasAttribute('open')).toBe(true)
    expect(seen).toEqual([])
    dialog.querySelector<HTMLElement>('[data-dialog-confirm]')!.click()
    expect(dialog.hasAttribute('open')).toBe(false)
    expect(seen).toEqual(['order_list'])
    expect(window.location.hash).toBe('#order_list')
    window.location.hash = ''
  })

  it('グローバルナビ・navigate アクションで onNavigate を呼ぶ', () => {
    const seen: string[] = []
    mountViewV2(container, schema, 'order_list', { onNavigate: v => seen.push(v) })
    container.querySelector<HTMLElement>('.mk2-globalnav a[data-nav-view="settings"]')!.click()
    container.querySelector<HTMLElement>('[data-action="new_order"]')!.click()
    expect(seen).toEqual(['settings', 'order_form'])
    expect(window.location.hash).toBe('#order_form')
    window.location.hash = ''
  })

  it('サブメニューは開閉し、確認ダイアログの確定ボタンに danger 色が付く', () => {
    mountViewV2(container, schema, 'order_form')
    const toggle = container.querySelector<HTMLElement>('[data-submenu-toggle]')!
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    toggle.click()
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    toggle.click()
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    const s = structuredClone(schema)
    s.views.order_confirm.primaryAction!.confirm = { message: 'm', danger: true }
    expect(renderViewV2(s, 'order_confirm')).toContain('dads-button mk2-button--danger')
  })
})

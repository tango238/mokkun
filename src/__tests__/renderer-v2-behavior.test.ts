/**
 * v2 レンダラー: スタイル管理・エラー出力・表示条件・レイアウト・リセットなどの挙動テスト
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'fs'
import { parseYamlV2 } from '../parser/yaml-parser'
import { renderViewV2, mountViewV2 as mountRaw, type V2Controller } from '../renderer-v2'
import { loadFromUrl } from '../loader'
import { Mokkun } from '../lib'
import type { FieldV2, MokkunV2Schema, SectionV2, ViewV2 } from '../types/schema-v2'

const sample = (() => {
  const r = parseYamlV2(fs.readFileSync('examples/v2/order-entry.yaml', 'utf-8'))
  if (!r.success) throw new Error(JSON.stringify(r.errors))
  return r.data
})()

function dom(html: string): HTMLElement {
  const el = document.createElement('div')
  el.innerHTML = html
  return el
}

function build(view: Partial<ViewV2>, app: Partial<MokkunV2Schema['app']> = {}, extra: Partial<MokkunV2Schema> = {}): MokkunV2Schema {
  return { mokkun: 2, app: { name: 'App', ...app }, views: { v: { title: 'T', goal: 'G', sections: [], ...view } }, ...extra }
}

function section(fields: FieldV2[], extra: Partial<SectionV2> = {}): SectionV2 {
  return { id: 's', title: 'S', fields, ...extra }
}

function f(item: string, component: string, extra: Partial<FieldV2> = {}): FieldV2 {
  return { item, label: `L-${item}`, component, ...extra } as FieldV2
}

const STYLE = '#mokkun-v2-styles'

/** テスト後に必ず destroy する（<style> の保持数をテスト間に持ち越さない） */
const mounted: V2Controller[] = []
const mountViewV2: typeof mountRaw = (...args) => {
  const c = mountRaw(...args)
  mounted.push(c)
  return c
}
let container: HTMLElement

beforeEach(() => {
  document.body.innerHTML = ''
  document.head.querySelectorAll(STYLE).forEach(e => e.remove())
  container = document.createElement('div')
  document.body.appendChild(container)
})

afterEach(() => {
  mounted.splice(0).forEach(c => c.destroy())
  window.location.hash = ''
})

describe('スタイルの保持と destroy', () => {
  const schema = build({ sections: [section([f('a', 'text')])] })

  it('mount で追加され、最後の view を destroy したときだけ外れる', () => {
    const c2 = document.createElement('div')
    document.body.appendChild(c2)
    const a = mountViewV2(container, schema, 'v')
    expect(document.querySelectorAll(STYLE).length).toBe(1)
    const b = mountViewV2(c2, schema, 'v')
    expect(document.querySelectorAll(STYLE).length).toBe(1)
    a.destroy()
    expect(document.querySelector(STYLE)).not.toBeNull()
    b.destroy()
    expect(document.querySelector(STYLE)).toBeNull()
  })

  it('destroy は冪等（二重に呼んでも他の保持者の分を減らさない）', () => {
    const c2 = document.createElement('div')
    document.body.appendChild(c2)
    const a = mountViewV2(container, schema, 'v')
    const b = mountViewV2(c2, schema, 'v')
    a.destroy()
    a.destroy()
    expect(document.querySelector(STYLE)).not.toBeNull()
    b.destroy()
    expect(document.querySelector(STYLE)).toBeNull()
  })

  it('destroy 後はイベントが外れている', () => {
    const seen: string[] = []
    const c = mountViewV2(container, schema, 'v', { onNavigate: v => seen.push(v) })
    c.destroy()
    expect(container.innerHTML).toBe('')
    container.innerHTML = '<a href="#x" data-nav-view="x">x</a>'
    container.querySelector<HTMLElement>('a')!.click()
    expect(seen).toEqual([])
  })

  it('同じ container への再 mount でも <style> は 1 つのまま', () => {
    const a = mountViewV2(container, schema, 'v')
    const el = document.querySelector(STYLE)
    const b = mountViewV2(container, schema, 'v')
    expect(document.querySelector(STYLE)).toBe(el)
    a.destroy()
    b.destroy()
  })
})

describe('エラー出力と ID', () => {
  it('date: エラーが 1 つだけで、fieldset はサポート、各入力はエラーを参照する', () => {
    const schema = build({ sections: [section([f('d', 'date', { help: 'ヘルプ', props: { error: '正しい日付を入力してください' } })])] })
    const root = dom(renderViewV2(schema, 'v'))
    const errors = root.querySelectorAll('[id$="-error"]')
    expect(errors.length).toBe(1)
    const ids = Array.from(root.querySelectorAll('[id]')).map(e => e.id)
    expect(new Set(ids).size).toBe(ids.length)
    const fieldset = root.querySelector('fieldset[data-field="d"]')!
    expect(fieldset.getAttribute('aria-describedby')).toBe('v-d-support')
    root.querySelectorAll('.dads-date-picker__input').forEach(i => {
      expect(i.getAttribute('aria-describedby')).toBe(errors[0].id)
      expect(i.getAttribute('aria-invalid')).toBe('true')
    })
  })

  it('radio / checkbox グループのエラーは 1 つで fieldset が参照する', () => {
    const schema = build({ sections: [section([f('r', 'radio', { options: [{ value: 'a', label: 'A' }], props: { error: 'NG' } })])] })
    const root = dom(renderViewV2(schema, 'v'))
    expect(root.querySelectorAll('.dads-form-control-label__error-text').length).toBe(1)
    expect(root.querySelector('fieldset')!.getAttribute('aria-describedby')).toBe('v-r-error')
  })
})

describe('props の不正値', () => {
  it('browser / timeline の items に null があっても落ちない', () => {
    const schema = build({
      sections: [section([f('b', 'browser', { props: { items: [null, { value: 'a', label: 'A' }, { value: 'g', label: 'G', children: [null] }] } }), f('t', 'timeline', { props: { items: [null, 5, { time: '9:00', title: 'T' }] } })])],
    })
    const root = dom(renderViewV2(schema, 'v'))
    expect(root.querySelectorAll('select option').length).toBe(2)
    expect(root.querySelectorAll('ol li').length).toBe(1)
  })

  it('photo_grid の src と helpUrl は http / https / mailto のみ', () => {
    const schema = build(
      { sections: [section([f('p', 'photo_grid', { props: { photos: [{ src: 'javascript:alert(1)' }, { src: 'https://example.com/a.png' }, { src: 'data:text/html,x' }] } })])] },
      { header: { helpUrl: 'javascript:alert(1)' } },
    )
    const root = dom(renderViewV2(schema, 'v'))
    const srcs = Array.from(root.querySelectorAll('.mk2-photo img')).map(i => i.getAttribute('src'))
    expect(srcs).toEqual(['#', 'https://example.com/a.png', '#'])
    expect(root.querySelector('.mk2-header a[target="_blank"]')!.getAttribute('href')).toBe('#')
    const ok = dom(renderViewV2(build({}, { header: { helpUrl: 'mailto:a@example.com' } }), 'v'))
    expect(ok.querySelector('.mk2-header a[target="_blank"]')!.getAttribute('href')).toBe('mailto:a@example.com')
  })

  it('値なしの badge / chip / status はラベルを 1 回だけ出す', () => {
    const root = dom(renderViewV2(build({ sections: [section([f('c', 'chip')])] }), 'v'))
    expect(root.textContent!.match(/L-c/g)!.length).toBe(1)
  })
})

describe('エスケープ', () => {
  const evil = '<img src=x onerror=alert(1)>'
  it('ラベル・選択肢・ナビ・パンくず・バナー・一覧の列と行アクションを HTML として解釈しない', () => {
    const schema = build(
      {
        title: evil,
        states: { error: { message: evil } },
        sections: [
          section([f('a', 'select', { label: evil, options: [{ value: 'x', label: evil }], help: evil })]),
          { id: 'l', title: evil, kind: 'list', list: { columns: [{ id: 'c', label: evil, sortable: true }], rowActions: [{ id: 'ra', label: evil, kind: 'custom' }], empty: evil } },
        ],
        nav: 'v',
      },
      { name: evil, header: { systemName: evil, userName: evil, tenantName: evil }, navigation: [{ group: evil, items: [{ view: 'v', label: evil }, { view: 'v', label: evil }] }], notifications: [{ message: evil }] },
    )
    expect(renderViewV2(schema, 'v')).not.toMatch(/<img/)
  })
})

describe('visibleWhen', () => {
  it('section.visibleWhen はセクション要素自身に付き、初期 hidden と mount 後の切替が一致する', () => {
    const schema = build({
      sections: [
        section([f('kind', 'radio', { default: 'a', options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }] })], { id: 'first' }),
        { id: 'second', title: 'Second', visibleWhen: { item: 'kind', equals: 'b' }, fields: [f('x', 'text')] },
      ],
    })
    const root = dom(renderViewV2(schema, 'v'))
    const sec = root.querySelector<HTMLElement>('section[id$="section-second"]')!
    expect(sec.hidden).toBe(true)
    expect(sec.hasAttribute('data-visible-when')).toBe(true)
    expect(root.querySelector('[data-field="x"]')!.hasAttribute('data-visible-when')).toBe(false)
    mountViewV2(container, schema, 'v')
    const live = container.querySelector<HTMLElement>('section[id$="section-second"]')!
    const b = container.querySelector<HTMLInputElement>('input[value="b"]')!
    b.checked = true
    b.dispatchEvent(new Event('change', { bubbles: true }))
    expect(live.hidden).toBe(false)
  })

  const cases: Array<[string, FieldV2, (root: HTMLElement) => void, string, boolean]> = [
    ['checkbox 単一 default true', f('src', 'checkbox', { default: true }), () => {}, 'true', true],
    ['checkbox 単一 default なし', f('src', 'checkbox'), () => {}, 'true', false],
    ['checkbox 単一 default なし (false 条件)', f('src', 'checkbox'), () => {}, 'false', true],
    ['toggle default true', f('src', 'toggle', { default: true }), () => {}, 'true', true],
    ['toggle default なし', f('src', 'toggle'), () => {}, 'true', false],
    ['select', f('src', 'select', { default: 'b', options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }] }), () => {}, 'b', true],
    ['checkbox multiple (1 件の選択肢)', f('src', 'checkbox', { multiple: true, default: ['a'], options: [{ value: 'a', label: 'A' }] }), () => {}, 'a', true],
    ['checkbox multiple 未選択', f('src', 'checkbox', { multiple: true, options: [{ value: 'a', label: 'A' }] }), () => {}, 'a', false],
    ['select multiple', f('src', 'select', { multiple: true, default: ['b'], options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }] }), () => {}, 'a', false],
  ]
  it.each(cases)('静的な初期表示と mount 後の評価が一致する: %s', (_name, src, _prep, equals, expected) => {
    const schema = build({ sections: [section([src, f('dep', 'text', { visibleWhen: { item: 'src', equals: equals === 'true' || equals === 'false' ? equals === 'true' : equals } })])] })
    const staticRoot = dom(renderViewV2(schema, 'v'))
    expect(staticRoot.querySelector<HTMLElement>('[data-field="dep"]')!.hidden).toBe(!expected)
    mountViewV2(container, schema, 'v')
    expect(container.querySelector<HTMLElement>('[data-field="dep"]')!.hidden).toBe(!expected)
  })
})

describe('layout', () => {
  const two = [section([f('a', 'text')], { id: 'one', title: 'One' }), section([f('b', 'text')], { id: 'two', title: 'Two' })]

  it('tabs: タブとパネルが対応し、クリックで切り替わる', () => {
    mountViewV2(container, build({ layout: 'tabs', sections: two }), 'v')
    const tabs = container.querySelectorAll<HTMLElement>('[role="tab"]')
    const panels = container.querySelectorAll<HTMLElement>('[role="tabpanel"]')
    expect(tabs.length).toBe(2)
    expect(panels[1].hidden).toBe(true)
    tabs[1].click()
    expect(tabs[1].getAttribute('aria-selected')).toBe('true')
    expect(panels[0].hidden).toBe(true)
    expect(panels[1].hidden).toBe(false)
  })

  it('sectioned: 目次にセクションが並ぶ', () => {
    const root = dom(renderViewV2(build({ layout: 'sectioned', sections: two }), 'v'))
    expect(root.querySelectorAll('nav.dads-toc a').length).toBe(2)
  })

  it('plain: ヘッダー・ナビ・パンくずを出さない', () => {
    const root = dom(renderViewV2(build({ sections: two }, { layout: 'plain', navigation: [{ group: 'g', items: [{ view: 'v' }] }] }), 'v'))
    expect(root.querySelector('.mk2-header')).toBeNull()
    expect(root.querySelector('.dads-breadcrumb')).toBeNull()
    expect(root.querySelector('h1')).not.toBeNull()
  })

  it('collapsed が連続すると 1 つの stacked accordion、単独は disclosure', () => {
    const run = [section([f('a', 'text')], { id: 'a', reveal: 'collapsed' }), section([f('b', 'text')], { id: 'b', reveal: 'collapsed' }), section([f('c', 'text')], { id: 'c' }), section([f('d', 'text')], { id: 'd', reveal: 'collapsed' })]
    const root = dom(renderViewV2(build({ sections: run }), 'v'))
    expect(root.querySelectorAll('.mk2-accordion-group > details.dads-accordion').length).toBe(2)
    expect(root.querySelectorAll('.mk2-accordion-group h2').length).toBe(2)
    expect(root.querySelectorAll('details.dads-disclosure').length).toBe(1)
  })
})

describe('アクション', () => {
  const view = {
    primaryAction: { id: 'p', label: 'P', kind: 'custom' as const, placement: 'footer' as const },
    secondaryActions: [
      { id: 's1', label: 'S1', kind: 'custom' as const },
      { id: 't', label: 'T', kind: 'custom' as const, style: 'tertiary' as const },
    ],
  }
  it('DOM 順は tertiary → secondary → primary（text / outline / solid-fill）', () => {
    const root = dom(renderViewV2(build(view), 'v'))
    const buttons = Array.from(root.querySelectorAll('.mk2-actions button'))
    expect(buttons.map(b => b.getAttribute('data-action'))).toEqual(['t', 's1', 'p'])
    expect(buttons.map(b => b.getAttribute('data-type'))).toEqual(['text', 'outline', 'solid-fill'])
  })
})

describe('field.width / date カレンダーボタン', () => {
  it('width は data-width に出る', () => {
    const root = dom(renderViewV2(build({ sections: [section([f('a', 'text', { width: 'sm' })])] }), 'v'))
    expect(root.querySelector('[data-field="a"]')!.getAttribute('data-width')).toBe('sm')
  })
  it('props.calendar でカレンダーボタン、inline は月表示', () => {
    const root = dom(renderViewV2(build({ sections: [section([f('a', 'date', { props: { calendar: true } }), f('b', 'date', { inline: true })])] }), 'v'))
    expect(root.querySelector('[data-field="a"] button.dads-date-picker__calendar-button[aria-haspopup]')).not.toBeNull()
    expect(root.querySelector('[data-field="b"] .dads-calendar')).not.toBeNull()
    expect(root.querySelector('[data-field="b"] .dads-date-picker__calendar-button')).toBeNull()
  })
})

describe('一覧', () => {
  const list: SectionV2 = {
    id: 'l',
    title: 'L',
    kind: 'list',
    list: { columns: [{ id: 'name', label: 'N', sortable: true }, { id: 'total', label: '金額', sortable: true }], selection: 'multiple' },
  }
  it('selection は data-selectable と label のチェックボックス', () => {
    const root = dom(renderViewV2(build({ sections: [list] }), 'v'))
    expect(root.querySelector('.dads-table[data-selectable]')).not.toBeNull()
    expect(root.querySelectorAll('tbody label.dads-checkbox input[type="checkbox"]').length).toBe(3)
  })
  it('ソートヘッダーのクリックで aria-sort が切り替わる', () => {
    mountViewV2(container, build({ sections: [list] }), 'v')
    const th = container.querySelectorAll<HTMLElement>('th[aria-sort]')
    const btn = th[0].querySelector<HTMLElement>('button')!
    btn.click()
    expect(th[0].getAttribute('aria-sort')).toBe('ascending')
    btn.click()
    expect(th[0].getAttribute('aria-sort')).toBe('descending')
    th[1].querySelector<HTMLElement>('button')!.click()
    expect(th[0].getAttribute('aria-sort')).toBe('none')
    expect(th[1].getAttribute('aria-sort')).toBe('ascending')
  })
})

describe('リセット', () => {
  const schema = build({
    secondaryActions: [{ id: 'reset', label: 'R', kind: 'reset' }],
    sections: [
      section([f('sw', 'toggle', { default: false }), f('file', 'file'), f('txt', 'text', { default: 'init' })]),
      { id: 'rep', title: 'Rep', repeatable: { min: 1, max: 3 }, fields: [f('q', 'number')] },
    ],
  })

  it('switch・ファイル一覧・繰り返し・入力値を初期状態へ戻す', () => {
    mountViewV2(container, schema, 'v')
    const sw = container.querySelector<HTMLElement>('[role="switch"]')!
    sw.click()
    expect(sw.getAttribute('aria-checked')).toBe('true')
    expect(container.querySelector<HTMLInputElement>('input[data-switch-value]')!.value).toBe('true')
    const text = container.querySelector<HTMLInputElement>('input[name="txt"]')!
    text.value = 'changed'
    container.querySelector<HTMLElement>('[data-repeat-add]')!.click()
    container.querySelector<HTMLElement>('[data-repeat-add]')!.click()
    expect(container.querySelectorAll('[data-repeat-group]').length).toBe(3)
    // ファイル一覧の疑似状態
    const list = container.querySelector<HTMLElement>('[data-js-file-list]')!
    list.hidden = false
    list.innerHTML = '<li>x</li>'
    container.querySelector<HTMLElement>('[data-js-select-summary]')!.textContent = '1ファイルを選択中'
    container.querySelector<HTMLElement>('[data-action="reset"]')!.click()
    expect(sw.getAttribute('aria-checked')).toBe('false')
    expect(container.querySelector<HTMLInputElement>('input[data-switch-value]')!.value).toBe('false')
    expect(text.value).toBe('init')
    expect(container.querySelectorAll('[data-repeat-group]').length).toBe(1)
    expect(list.children.length).toBe(0)
    expect(list.hidden).toBe(true)
    expect(container.querySelector('[data-js-select-summary]')!.textContent).toBe('')
  })

  it('file-upload は dragover の既定動作を止める', () => {
    mountViewV2(container, schema, 'v')
    const ev = new Event('dragover', { bubbles: true, cancelable: true })
    container.querySelector('[data-js-drop-area]')!.dispatchEvent(ev)
    expect(ev.defaultPrevented).toBe(true)
  })
})

describe('複数 view の連続 mount', () => {
  it('順に mount しても、各 view の id は一意（前の view は残らない）', () => {
    const names = Object.keys(sample.views)
    const seen = new Set<string>()
    for (const name of names) {
      const c = mountViewV2(container, sample, name)
      const ids = Array.from(container.querySelectorAll('[id]')).map(e => e.id)
      expect(new Set(ids).size).toBe(ids.length)
      ids.forEach(id => {
        expect(id.startsWith(`${name}-`)).toBe(true)
        seen.add(id)
      })
      c.destroy()
    }
    expect(seen.size).toBeGreaterThan(20)
  })
})

describe('パーサー', () => {
  const wrap = (body: string) => `mokkun: 2\napp: { name: A }\nviews:\n  v:\n    title: T\n    goal: G\n${body}`
  it('action id の重複（primary / secondary / rowActions）を拒否する', () => {
    const r = parseYamlV2(wrap(`    primaryAction: { id: a, label: A, kind: custom }\n    secondaryActions:\n      - { id: a, label: B, kind: custom }\n    sections: []\n`))
    expect(r.success).toBe(false)
    const r2 = parseYamlV2(wrap(`    primaryAction: { id: ra, label: A, kind: custom }\n    sections:\n      - id: l\n        title: L\n        kind: list\n        list:\n          columns: [{ id: c, label: C }]\n          rowActions: [{ id: ra, label: R, kind: custom }]\n`))
    expect(r2.success).toBe(false)
  })
  it('repeatable.min > max を拒否する', () => {
    const r = parseYamlV2(wrap(`    sections:\n      - id: s\n        title: S\n        repeatable: { min: 3, max: 2 }\n        fields: [{ item: a, label: A, component: text }]\n`))
    expect(r.success).toBe(false)
    if (!r.success) expect(r.errors[0].message).toMatch(/min/)
  })
  it('tertiary と width を受け付け、不正な width は拒否する', () => {
    const ok = parseYamlV2(wrap(`    primaryAction: { id: a, label: A, kind: custom, style: tertiary }\n    sections:\n      - id: s\n        title: S\n        fields: [{ item: a, label: A, component: text, width: sm }]\n`))
    expect(ok.success).toBe(true)
    const bad = parseYamlV2(wrap(`    sections:\n      - id: s\n        title: S\n        fields: [{ item: a, label: A, component: text, width: huge }]\n`))
    expect(bad.success).toBe(false)
  })
})

describe('ローダー / Mokkun.init', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('v2 文書はローダーを 1 回通るだけで schemaV2 を返す', async () => {
    const text = fs.readFileSync('examples/v2/order-entry.yaml', 'utf-8')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: async () => text }))
    const r = await loadFromUrl('http://localhost/order-entry.yaml')
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.schemaV2!.mokkun).toBe(2)
      expect(Object.keys(r.schemaV2!.views)).toContain('order_form')
      expect(r.schema).not.toBeNull()
      expect(r.content).toBe(text)
    }
  })

  const yamlText = `mokkun: 2
app: { name: A }
views:
  a:
    title: A
    goal: G
    primaryAction: { id: save, label: 保存, kind: submit }
    secondaryActions:
      - { id: go, label: 移動, kind: navigate, to: b }
    sections:
      - id: s
        title: S
        fields:
          - { item: notify, label: 通知, component: toggle, default: true }
  b:
    title: B
    goal: G
    sections: []
`

  it('onSubmit のデータに toggle が含まれ、遷移しても <style> は付け直されない', async () => {
    const submitted: Array<Record<string, unknown>> = []
    const inst = await Mokkun.init({ container, yamlContent: yamlText, onSubmit: (_n, d) => submitted.push(d) })
    expect(inst.schemaV2).not.toBeNull()
    expect(inst.getScreenNames()).toEqual(['a', 'b'])
    const style = document.querySelector(STYLE)
    expect(style).not.toBeNull()
    container.querySelector<HTMLElement>('[data-action="save"]')!.click()
    expect(submitted[0]).toMatchObject({ notify: 'true' })
    container.querySelector<HTMLElement>('[data-action="go"]')!.click()
    expect(inst.currentScreen).toBe('b')
    expect(document.querySelector(STYLE)).toBe(style)
    inst.destroy()
    expect(document.querySelector(STYLE)).toBeNull()
  })
})

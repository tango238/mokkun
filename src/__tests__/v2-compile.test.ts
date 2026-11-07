/**
 * v2 フォーマット パース/コンパイル/レンダリングのテスト
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { parseYaml } from '../parser/yaml-parser'
import { isV2Document, parseV2 } from '../parser/v2/parse-v2'
import { renderScreen } from '../renderer/screen-renderer'
import type { MokkunSchema, FormSection, InputField, ScreenDefinition } from '../types/schema'

const root = resolve(__dirname, '../..')
const yamlText = readFileSync(join(root, 'examples', 'v2', 'order-entry.yaml'), 'utf-8')

function compiled(): MokkunSchema {
  const result = parseYaml(yamlText)
  if (!result.success) throw new Error(JSON.stringify(result.errors))
  return result.data
}

function section(screen: ScreenDefinition, name: string): FormSection {
  const s = screen.sections?.find((x) => x.section_name === name)
  if (!s) throw new Error(`section not found: ${name}`)
  return s
}

function fieldsOf(s: FormSection): InputField[] {
  return (s.input_fields ?? []) as InputField[]
}

/** 最小の有効な v2 ドキュメント。over で app / views などを上書きする */
function mk(over: Record<string, any> = {}, viewOver: Record<string, any> = {}): Record<string, any> {
  return {
    mokkun: 2,
    app: { name: 'A' },
    views: {
      v: {
        title: 'V',
        goal: 'g',
        sections: [{ id: 's', title: 'S', fields: [{ item: 'a', label: 'A', component: 'text' }] }],
        ...viewOver,
      },
    },
    ...over,
  }
}

function field(over: Record<string, any>): Record<string, any> {
  return { item: 'f', label: 'F', component: 'text', ...over }
}

/** 1 フィールドだけの view をコンパイルして、そのフィールドを返す */
function compileField(over: Record<string, any>, extra: Record<string, any> = {}): any {
  const r = parseV2(mk(extra, { sections: [{ id: 's', title: 'S', fields: [field(over)] }] }))
  if (!r.success) throw new Error(JSON.stringify(r.errors))
  return (r.data.view.v.sections![0].input_fields as any[])[0]
}

function errorPaths(doc: unknown): string[] {
  const r = parseV2(doc)
  expect(r.success).toBe(false)
  return r.success ? [] : r.errors.map((e) => e.path ?? '')
}

describe('v2 parse: detection and version', () => {
  it('detects v2 documents', () => {
    expect(isV2Document({ mokkun: 2 })).toBe(true)
    expect(isV2Document({ mokkun: '2' })).toBe(false)
    expect(isV2Document({ view: {} })).toBe(false)
    expect(isV2Document(null)).toBe(false)
  })

  it('parses examples/v2/order-entry.yaml via parseYaml', () => {
    expect(parseYaml(yamlText).success).toBe(true)
  })

  it('rejects mokkun: "2" and mokkun: 3 instead of falling through to v1', () => {
    for (const v of ['"2"', '3']) {
      const r = parseYaml(`mokkun: ${v}\nview:\n  a:\n    title: A\n`)
      expect(r.success).toBe(false)
      if (!r.success) expect(r.errors[0].message).toContain('unsupported mokkun format version')
    }
  })

  it('a v1 document still parses', () => {
    expect(parseYaml('view:\n  a:\n    title: A\n    fields: []\n').success).toBe(true)
  })
})

describe('v2 parse: errors never throw', () => {
  it('reports unknown view references and invalid components', () => {
    const doc = mk(
      { app: { name: 'x', navigation: [{ group: 'g', items: [{ view: 'nope' }] }] } },
      {
        primaryAction: { id: 'go', label: 'Go', kind: 'navigate', to: 'missing' },
        sections: [{ id: 's', title: 'S', fields: [field({ component: 'hologram' })] }],
      }
    )
    const paths = errorPaths(doc)
    expect(paths).toContain('app.navigation[0].items[0].view')
    expect(paths).toContain('views.v.primaryAction.to')
    expect(paths).toContain('views.v.sections[0].fields[0].component')
    const r = parseV2(doc)
    if (!r.success) expect(r.errors.find((e) => e.path?.endsWith('.component'))?.type).toBe('INVALID_FIELD_TYPE')
  })

  it('rejects multiple primaryActions and missing required keys', () => {
    const paths = errorPaths({
      mokkun: 2,
      app: { name: 'x' },
      views: { a: { title: 'A', goal: 'g', primaryAction: [{ id: 'a', label: 'A' }], sections: [] }, b: { sections: [] } },
    })
    expect(paths).toContain('views.a.primaryAction')
    expect(paths).toContain('views.b.title')
  })

  it('malformed shapes return ParseErrors (no exceptions)', () => {
    const cases: Array<[string, any, string]> = [
      ['app.header not object', mk({ app: { name: 'A', header: 'x' } }), 'app.header'],
      ['notifications not array', mk({ app: { name: 'A', notifications: 'x' } }), 'app.notifications'],
      ['notification without message', mk({ app: { name: 'A', notifications: [{ variant: 'info' }] } }), 'app.notifications[0].message'],
      ['notification not object', mk({ app: { name: 'A', notifications: [1] } }), 'app.notifications[0]'],
      ['rules value not object', mk({ rules: { r: 'x' } }), 'rules.r'],
      ['options not array', mk({}, { sections: [{ id: 's', title: 'S', fields: [field({ options: 'x' })] }] }), 'views.v.sections[0].fields[0].options'],
      ['option without label', mk({}, { sections: [{ id: 's', title: 'S', fields: [field({ options: [{ value: 1 }] })] }] }), 'views.v.sections[0].fields[0].options[0].label'],
      ['option not object', mk({}, { sections: [{ id: 's', title: 'S', fields: [field({ options: [1] })] }] }), 'views.v.sections[0].fields[0].options[0]'],
      ['list without columns', mk({}, { sections: [{ id: 's', title: 'S', kind: 'list', list: {} }] }), 'views.v.sections[0].list.columns'],
      ['list columns empty', mk({}, { sections: [{ id: 's', title: 'S', kind: 'list', list: { columns: [] } }] }), 'views.v.sections[0].list.columns'],
      ['list column without id', mk({}, { sections: [{ id: 's', title: 'S', kind: 'list', list: { columns: [{ label: 'x' }] } }] }), 'views.v.sections[0].list.columns[0].id'],
      ['list column not object', mk({}, { sections: [{ id: 's', title: 'S', kind: 'list', list: { columns: [3] } }] }), 'views.v.sections[0].list.columns[0]'],
      ['rowActions not array', mk({}, { sections: [{ id: 's', title: 'S', kind: 'list', list: { columns: [{ id: 'a', label: 'A' }], rowActions: 'x' } }] }), 'views.v.sections[0].list.rowActions'],
      ['rowAction not object', mk({}, { sections: [{ id: 's', title: 'S', kind: 'list', list: { columns: [{ id: 'a', label: 'A' }], rowActions: [1] } }] }), 'views.v.sections[0].list.rowActions[0]'],
      ['kind list without list', mk({}, { sections: [{ id: 's', title: 'S', kind: 'list' }] }), 'views.v.sections[0].list'],
      ['patterns.fields not array', mk({ patterns: { p: { fields: 'x' } } }), 'patterns.p.fields'],
      ['pattern not object', mk({ patterns: { p: 3 } }), 'patterns.p'],
      ['fields entry null', mk({}, { sections: [{ id: 's', title: 'S', fields: [null] }] }), 'views.v.sections[0].fields[0]'],
      ['sections entry null', mk({}, { sections: [null] }), 'views.v.sections[0]'],
      ['views empty', mk({ views: {} }), 'views'],
      ['props not object', mk({}, { sections: [{ id: 's', title: 'S', fields: [field({ props: 3 })] }] }), 'views.v.sections[0].fields[0].props'],
    ]
    for (const [name, doc, path] of cases) {
      let paths: string[] = []
      expect(() => { paths = errorPaths(doc) }, name).not.toThrow()
      expect(paths, name).toContain(path)
    }
    expect(parseV2(null).success).toBe(false)
    expect(parseV2('x').success).toBe(false)
    expect(parseV2({ mokkun: 2 }).success).toBe(false)
  })

  it('wraps a throwing compile into SCHEMA_VALIDATION_ERROR', () => {
    const doc = mk()
    // 検証を通るが compile 中に例外になる入力（getter が例外を投げる）
    Object.defineProperty(doc.views.v, 'description', { enumerable: true, get() { throw new Error('boom') } })
    const r = parseV2(doc)
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.errors[0].type).toBe('SCHEMA_VALIDATION_ERROR')
      expect(r.errors[0].message).toBe('boom')
    }
  })

  it('validates enums and required strings', () => {
    const doc = mk(
      { app: { name: 'A', layout: 'grid', navigation: [{ group: '', items: [] }] }, flows: { f: { name: 'F', outcome: 'o', progress: 'bar', steps: [{ view: 'v' }] } } },
      {
        layout: 'wall',
        primaryAction: { id: 'p', label: 'P', kind: 'jump', placement: 'left', style: 'loud' },
        sections: [
          { id: 's1', title: 'S', kind: 'table', reveal: 'half' },
          { id: 's2', title: 'S', kind: 'list', list: { columns: [{ id: 'a', label: 'A' }], selection: 'many' } },
        ],
      }
    )
    const paths = errorPaths(doc)
    for (const p of [
      'app.layout', 'app.navigation[0].group', 'flows.f.progress', 'views.v.layout',
      'views.v.primaryAction.kind', 'views.v.primaryAction.placement', 'views.v.primaryAction.style',
      'views.v.sections[0].kind', 'views.v.sections[0].reveal', 'views.v.sections[1].list.selection',
    ]) expect(paths, p).toContain(p)
  })

  it('navigate action requires "to"', () => {
    expect(errorPaths(mk({}, { primaryAction: { id: 'a', label: 'A', kind: 'navigate' } }))).toContain('views.v.primaryAction.to')
  })

  it('reveal / repeatable on a non-form section is an error', () => {
    const paths = errorPaths(mk({}, {
      sections: [
        { id: 'a', title: 'A', kind: 'readonly', reveal: 'collapsed', fields: [] },
        { id: 'b', title: 'B', kind: 'summary', repeatable: {}, fields: [] },
      ],
    }))
    expect(paths).toContain('views.v.sections[0].reveal')
    expect(paths).toContain('views.v.sections[1].repeatable')
  })

  it('nav without app.navigation is an error', () => {
    expect(errorPaths(mk({}, { nav: 'v' }))).toContain('views.v.nav')
  })
})

describe('v2 parse: fields, rules, patterns, ids', () => {
  it('field.rules: must be array; names must be own keys of rules', () => {
    const bad = (rules: unknown, top: Record<string, unknown> = {}) =>
      errorPaths(mk(top, { sections: [{ id: 's', title: 'S', fields: [field({ rules })] }] }))
    expect(bad('required')).toContain('views.v.sections[0].fields[0].rules')
    expect(bad(['nope'])).toContain('views.v.sections[0].fields[0].rules[0]')
    // プロトタイプ由来のキーは未定義扱い
    expect(bad(['toString'], { rules: {} })).toContain('views.v.sections[0].fields[0].rules[0]')
    expect(bad([3])).toContain('views.v.sections[0].fields[0].rules[0]')
  })

  it('rule resolution: names resolve to validation, inline objects pass through, merged in order', () => {
    const f = compileField({ rules: ['email', { max: 50 }] }, { rules: { email: { pattern: '^.+@.+$', message: 'メール形式' } } })
    expect(f.validation).toEqual({ pattern: '^.+@.+$', message: 'メール形式', max: 50 })
    const r = parseV2(mk({ rules: { email: { pattern: 'x', message: 'm' } } }))
    expect(r.success && r.data.validations!.email).toEqual({ name: 'email', rules: { pattern: 'x' }, message: 'm' })
  })

  it('props are normalized to internal snake_case keys (inputType -> input_type) and merged last', () => {
    const f = compileField({ example: 'e', props: { inputType: 'email', maxLength: 10, placeholder: 'override' } })
    expect(f.input_type).toBe('email')
    expect(f.max_length).toBe(10)
    expect(f.placeholder).toBe('override')
    expect(f.inputType).toBeUndefined()
  })

  it('validates pattern fields with the same rules (paths patterns.<p>.fields[i])', () => {
    const paths = errorPaths(mk({
      patterns: { p: { fields: [field({ component: 'hologram' }), { item: 'x' }, field({ item: 'ok', rules: ['nope'] })], title: 'x' } },
    }))
    expect(paths).toContain('patterns.p.fields[0].component')
    expect(paths).toContain('patterns.p.fields[1].label')
    expect(paths).toContain('patterns.p.fields[2].rules[0]')
    expect(paths).toContain('patterns.p.title')
  })

  it('unknown use (including inherited keys) is an error', () => {
    expect(errorPaths(mk({}, { sections: [{ id: 's', title: 'S', use: 'nope' }] }))).toContain('views.v.sections[0].use')
    expect(errorPaths(mk({}, { sections: [{ id: 's', title: 'S', use: 'toString' }] }))).toContain('views.v.sections[0].use')
  })

  it('duplicate item within a view is an error (also across sections)', () => {
    const paths = errorPaths(mk({}, {
      sections: [
        { id: 's1', title: 'A', fields: [field({ item: 'dup' })] },
        { id: 's2', title: 'B', fields: [field({ item: 'dup' })] },
      ],
    }))
    expect(paths).toContain('views.v.sections[1].fields[0].item')
    // 別の view なら同じ item でも良い
    const ok = parseV2(mk({ views: {
      a: { title: 'A', goal: 'g', sections: [{ id: 's', title: 'S', fields: [field({ item: 'dup' })] }] },
      b: { title: 'B', goal: 'g', sections: [{ id: 's', title: 'S', fields: [field({ item: 'dup' })] }] },
    } }))
    expect(ok.success).toBe(true)
  })

  it('items starting with the reserved prefix are rejected', () => {
    expect(errorPaths(mk({}, { sections: [{ id: 's', title: 'S', fields: [field({ item: '_v2_x' })] }] }))).toContain('views.v.sections[0].fields[0].item')
  })

  it('pattern fields get <sectionId>_<item> ids and internal visibleWhen is rewritten', () => {
    const doc = mk({
      patterns: {
        addr: {
          note: 'パターンの補足',
          fields: [
            field({ item: 'kind', component: 'radio', options: [{ value: 'a', label: 'A' }] }),
            field({ item: 'zip', visibleWhen: { item: 'kind', equals: 'a' } }),
          ],
        },
      },
    }, {
      sections: [
        { id: 'ship', title: '配送', use: 'addr', fields: [field({ item: 'memo' })] },
        { id: 'bill', title: '請求', use: 'addr' },
      ],
    })
    const r = parseV2(doc)
    expect(r.success).toBe(true)
    if (!r.success) return
    const [ship, bill] = r.data.view.v.sections as any[]
    expect(ship.input_fields.map((f: any) => f.id)).toEqual(['_v2_n_ship', 'ship_kind', 'ship_zip', 'memo'])
    expect(ship.input_fields[2].visible_when).toEqual({ field: 'ship_kind', operator: 'eq', value: 'a' })
    expect(bill.input_fields.map((f: any) => f.id)).toEqual(['_v2_n_bill', 'bill_kind', 'bill_zip'])
    expect(bill.input_fields[2].visible_when.field).toBe('bill_kind')
    expect(ship.input_fields[0].description).toBe('パターンの補足')
  })

  it('visibleWhen: shape and reference checks (field and section level)', () => {
    const p = (vw: unknown, where: 'field' | 'section') =>
      errorPaths(mk({}, {
        sections: [
          { id: 's', title: 'S', ...(where === 'section' ? { visibleWhen: vw } : {}), fields: [field({ item: 'a', ...(where === 'field' ? { visibleWhen: vw } : {}) })] },
        ],
      }))
    expect(p('x', 'field')).toContain('views.v.sections[0].fields[0].visibleWhen')
    expect(p({ item: 'a' }, 'field')).toContain('views.v.sections[0].fields[0].visibleWhen.equals')
    expect(p({ item: 'ghost', equals: 1 }, 'field')).toContain('views.v.sections[0].fields[0].visibleWhen.item')
    expect(p({ equals: 1 }, 'section')).toContain('views.v.sections[0].visibleWhen.item')
    expect(p({ item: 'ghost', equals: 1 }, 'section')).toContain('views.v.sections[0].visibleWhen.item')
  })
})

describe('v2 compile (order-entry)', () => {
  const schema = compiled()

  it('has the 5 views', () => {
    expect(Object.keys(schema.view).sort()).toEqual(
      ['order_confirm', 'order_done', 'order_form', 'order_list', 'settings']
    )
  })

  it('order_form: app_header with 3 navigations and order_form active', () => {
    const header = schema.view.order_form.app_header!
    expect(header.appName).toBe('受注管理')
    expect(header.navigations).toHaveLength(3)
    expect(header.navigations!.map((n) => n.id)).toEqual(['nav-0-order_list', 'nav-1-order_form', 'nav-2-settings'])
    const active = header.navigations!.filter((n) => n.active)
    expect(active).toHaveLength(1)
    expect(active[0].href).toBe('#order_form')
    expect(active[0].label).toBe('受注登録')
    const navi = schema.view.order_form.app_navi!
    expect(navi.items.map((i) => i.label)).toEqual(['受注', '設定'])
    expect(navi.items.map((i) => !!i.current)).toEqual([true, false])
    expect(schema.view.order_confirm.app_header!.navigations!.find((n) => n.active)?.href).toBe('#order_form')
  })

  it('order_form: leading sections are split (進行状況 / お知らせ)', () => {
    const sections = schema.view.order_form.sections!
    expect(sections[0].section_name).toBe('進行状況')
    expect(sections[1].section_name).toBe('お知らせ')
    const stepper = fieldsOf(sections[0]) as any[]
    expect(stepper).toHaveLength(1)
    expect(stepper[0].type).toBe('stepper')
    expect(stepper[0].steps.map((s: any) => s.label)).toEqual(['入力', '確認', '完了'])
    expect(stepper[0].currentStep).toBe(0)
    const notices = fieldsOf(sections[1])
    expect(notices.map((f) => f.type)).toEqual(['notification_bar', 'response_message'])
    expect((notices[1] as any).variant).toBe('error')
    // order_confirm は 1 つ進む
    const confirmStepper = fieldsOf(schema.view.order_confirm.sections![0])[0] as any
    expect(confirmStepper.currentStep).toBe(1)
    expect(confirmStepper.steps.map((s: any) => !!s.completed)).toEqual([true, false, false])
    // flow に属さない view に stepper は無く、お知らせだけが先頭
    expect(schema.view.settings.sections![0].section_name).toBe('お知らせ')
    expect(schema.view.settings.sections!.some((s) => fieldsOf(s).some((f) => f.type === 'stepper'))).toBe(false)
  })

  it('section compile: repeatable / collapsed / list / readonly', () => {
    const lines = fieldsOf(section(schema.view.order_form, '明細を追加する'))
    expect(lines).toHaveLength(1)
    expect(lines[0].type).toBe('repeater')
    expect((lines[0] as any).item_fields.map((f: any) => f.id)).toEqual(['product', 'quantity', 'unitPrice'])
    expect((lines[0] as any).min_items).toBe(1)
    expect((lines[0] as any).max_items).toBe(20)
    expect((lines[0] as any).add_button_label).toBe('明細を追加')

    const memo = fieldsOf(section(schema.view.order_form, '補足を伝える'))
    expect(memo).toHaveLength(1)
    expect(memo[0].type).toBe('accordion_panel')
    expect(memo[0].label).toBe('入力欄を開く')
    expect((memo[0] as any).fields[0].type).toBe('textarea')

    const results = fieldsOf(section(schema.view.order_list, '受注を選ぶ'))
    expect(results).toHaveLength(1)
    const table = results[0] as any
    expect(table.type).toBe('data_table')
    expect(table.columns).toHaveLength(5)
    expect(table.columns.map((c: any) => c.sortable)).toEqual([true, false, true, false, false])
    expect(table.pagination.page_size).toBe(20)
    expect(table.row_actions[0].label).toBe('開く')

    const summary = fieldsOf(section(schema.view.order_confirm, '注文内容を確認する'))
    expect(summary[0].type).toBe('definition_list')
    expect((summary[0] as any).items[0]).toEqual({ term: '顧客名', description: '株式会社サンプル' })
    expect((summary[0] as any).items[3]).toEqual({ term: '合計金額', description: '125000' })
  })

  it('field compile: component mapping, description, placeholder, visible_when', () => {
    const customer = fieldsOf(section(schema.view.order_form, '注文者を指定する'))
    const name = customer[0] as any
    expect(name.id).toBe('customerName')
    expect(name.type).toBe('combobox')
    expect(name.required).toBe(true)
    expect(name.placeholder).toBe('株式会社サンプル')
    expect(name.description).toBe('登録済みの顧客から選べます。請求先の特定に必要です')

    const delivery = fieldsOf(section(schema.view.order_form, '配送先を指定する'))
    expect(delivery[0].type).toBe('information_panel')
    const postal = delivery.find((f) => f.id === 'postalCode') as any
    expect(postal.description).toBe('入力形式: ハイフンなし7桁')
    expect(postal.visible_when).toEqual({ field: 'deliveryType', operator: 'eq', value: 'other' })
    expect(delivery.find((f) => f.id === 'deliveryType')!.type).toBe('radio_group')
    expect(delivery.find((f) => f.id === 'desiredDate')!.type).toBe('date_picker')
    expect(fieldsOf(section(schema.view.order_list, '条件で絞り込む')).find((f) => f.id === 'status')!.type).toBe('segmented_control')
  })

  it('actions: primary style, kinds, confirm; goal becomes purpose and fallback description', () => {
    const form = schema.view.order_form
    const primary = form.actions!.find((a) => a.id === 'to_confirm')!
    expect(primary.style).toBe('primary')
    expect(primary.type).toBe('navigate')
    expect((primary as any).to).toBe('order_confirm')
    expect(form.actions!.find((a) => a.id === 'save_draft')!.type).toBe('custom')
    const cancel = form.actions!.find((a) => a.id === 'cancel')!
    expect(cancel.style).toBe('secondary')
    expect(cancel.confirm?.message).toContain('入力内容は保存されません')
    expect(form.purpose).toBe('注文を作る')
    expect(form.description).toBe('入力後、確認画面で内容を確かめてから確定します')
    // description が無い view は goal が description になる
    expect(schema.view.order_list.description).toBe('受注を探して開く')
  })

  it('order_done: success state becomes a response_message in the お知らせ section', () => {
    const done = fieldsOf(schema.view.order_done.sections![1])
    const msg = done.find((f) => f.type === 'response_message') as any
    expect(msg.variant).toBe('success')
    expect(msg.description).toContain('#10234')
  })

  it('screen.fields is the flattened input_fields of all sections', () => {
    for (const screen of Object.values(schema.view)) {
      const flat = screen.sections!.flatMap((s) => fieldsOf(s))
      expect(screen.fields).toEqual(flat)
      expect(flat.length).toBeGreaterThan(0)
    }
  })

  it('all ids are unique within a view, including tabs items and repeater children', () => {
    const collect = (screen: ScreenDefinition): string[] => {
      const ids: string[] = []
      const walk = (fields: InputField[]) => {
        for (const f of fields) {
          ids.push(f.id)
          const a = f as any
          if (a.item_fields) walk(a.item_fields)
          if (a.fields) walk(a.fields)
          if (a.items) for (const t of a.items) if (t?.fields) walk(t.fields)
        }
      }
      for (const s of screen.sections ?? []) walk(fieldsOf(s))
      return ids
    }
    for (const [name, screen] of Object.entries(schema.view)) {
      const ids = collect(screen)
      expect(new Set(ids).size, `${name}: ${ids.join(',')}`).toBe(ids.length)
    }
    // 以前は衝突し得た構成: item 名が合成 id と同名（section id / stepper / tabs）
    const r = parseV2(mk(
      { flows: { f: { name: 'F', outcome: 'o', steps: [{ view: 'v' }] } } },
      {
        layout: 'tabs',
        sections: [
          { id: 'flow_progress', title: 'A', fields: [field({ item: 'flow_progress' }), field({ item: 'tabs' })] },
          { id: 'tabs', title: 'B', repeatable: {}, fields: [field({ item: 'notice_1' })] },
        ],
      }
    ))
    expect(r.success).toBe(true)
    if (!r.success) return
    const ids = collect(r.data.view.v)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('v2 compile: mappings and options', () => {
  it('component mapping table', () => {
    expect(compileField({ component: 'date', inline: true }).type).toBe('calendar')
    expect(compileField({ component: 'date' }).type).toBe('date_picker')
    expect(compileField({ component: 'time' }).type).toBe('time_picker')
    expect(compileField({ component: 'duration' }).type).toBe('duration_input')
    expect(compileField({ component: 'file', accept: 'image' }).type).toBe('image_uploader')
    const file = compileField({ component: 'file', accept: '.pdf', multiple: true })
    expect(file.type).toBe('file_upload')
    expect(file.accept).toEqual(['.pdf'])
    expect(file.multiple).toBe(true)
    expect(compileField({ component: 'photo_grid' }).type).toBe('photo_manager')
    expect(compileField({ component: 'map' }).type).toBe('google_map_embed')
    const opts = [{ value: 'a', label: 'A' }]
    expect(compileField({ component: 'select', multiple: true, options: opts }).type).toBe('multi_select')
    expect(compileField({ component: 'select', options: opts }).type).toBe('select')
    const cg = compileField({ component: 'checkbox', multiple: true, options: opts })
    expect(cg.type).toBe('checkbox_group')
    expect(cg.options).toEqual(opts)
    expect(compileField({ component: 'checkbox' }).type).toBe('checkbox')
    expect(compileField({ component: 'radio', options: opts }).type).toBe('radio_group')
    expect(compileField({ component: 'select' }).options).toEqual([])
  })

  it('display components keep value as value; other components map value to default', () => {
    for (const [component, type] of [['badge', 'badge'], ['chip', 'chip'], ['status', 'status_label']] as const) {
      const f = compileField({ component, label: 'ラベル', value: '処理中' })
      expect(f.type).toBe(type)
      expect(f.label).toBe('ラベル')
      expect(f.value).toBe('処理中')
      expect(f.default).toBeUndefined()
    }
    const t = compileField({ component: 'text', value: 'x' })
    expect(t.default).toBe('x')
    expect(t.value).toBeUndefined()
  })

  it('app.layout plain emits no app_header / app_navi', () => {
    const r = parseV2(mk({ app: { name: 'A', layout: 'plain', navigation: [{ group: 'g', items: [{ view: 'v' }] }] } }))
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.view.v.app_header).toBeUndefined()
      expect(r.data.view.v.app_navi).toBeUndefined()
    }
  })

  it('flow progress: none emits no stepper', () => {
    const r = parseV2(mk({ flows: { f: { name: 'F', outcome: 'o', progress: 'none', steps: [{ view: 'v' }] } } }))
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.view.v.sections!.map((s) => s.section_name)).toEqual(['S'])
    }
  })

  it('danger confirm becomes style danger, keeps confirm, and adds no extra section or dialog field', () => {
    const r = parseV2(mk({}, {
      primaryAction: { id: 'del', label: '削除', style: 'secondary', confirm: { message: '削除しますか', danger: true } },
    }))
    expect(r.success).toBe(true)
    if (!r.success) return
    const action = r.data.view.v.actions![0]
    expect(action.style).toBe('danger')
    expect(action.confirm?.message).toBe('削除しますか')
    expect(r.data.view.v.sections!.map((s) => s.section_name)).toEqual(['S'])
    expect(r.data.view.v.fields!.some((f) => f.type === 'delete_confirm_dialog')).toBe(false)
  })

  it('kind: summary compiles to definition_list with option labels and joined blanks', () => {
    const r = parseV2(mk({}, {
      sections: [{
        id: 's', title: 'まとめ', kind: 'summary',
        fields: [
          field({ item: 'a', label: '区分', component: 'select', value: 'x', options: [{ value: 'x', label: 'エックス' }] }),
          field({ item: 'b', label: '空' }),
        ],
      }],
    }))
    expect(r.success).toBe(true)
    if (!r.success) return
    const dl = (r.data.view.v.sections![0].input_fields as any[])[0]
    expect(dl.type).toBe('definition_list')
    expect(dl.items).toEqual([{ term: '区分', description: 'エックス' }, { term: '空', description: '-' }])
  })

  it('section visibleWhen applies to the section\'s top-level fields only when they have none', () => {
    const r = parseV2(mk({}, {
      sections: [
        { id: 'a', title: 'A', fields: [field({ item: 'k', component: 'toggle' })] },
        {
          id: 'b', title: 'B', visibleWhen: { item: 'k', equals: true },
          fields: [field({ item: 'x' }), field({ item: 'y', visibleWhen: { item: 'k', equals: false } })],
        },
      ],
    }))
    expect(r.success).toBe(true)
    if (!r.success) return
    const [x, y] = (r.data.view.v.sections![1].input_fields as any[])
    expect(x.visible_when).toEqual({ field: 'k', operator: 'eq', value: true })
    expect(y.visible_when.value).toBe(false)
  })
})

describe('v2 compile: layouts', () => {
  const base = (layout: string) =>
    mk({}, {
      layout,
      sections: [
        { id: 's1', title: '一つ目', fields: [field({ item: 'a' })] },
        { id: 's2', title: '二つ目', fields: [field({ item: 'b' })] },
      ],
    })

  it('layout: tabs wraps sections into one tabs field', () => {
    const r = parseV2(base('tabs'))
    expect(r.success).toBe(true)
    if (!r.success) return
    const sections = r.data.view.v.sections!
    expect(sections).toHaveLength(1)
    const tabs = (sections[0].input_fields as any[])[0]
    expect(tabs.type).toBe('tabs')
    expect(tabs.items.map((t: any) => t.label)).toEqual(['一つ目', '二つ目'])
    expect(tabs.items[0].fields[0].id).toBe('a')
    expect(renderScreen(r.data.view.v)).not.toContain('unknown-field')
  })

  it('layout: sectioned adds a section_nav that lists only the real sections and links to them', () => {
    const r = parseV2(base('sectioned'))
    expect(r.success).toBe(true)
    if (!r.success) return
    const sections = r.data.view.v.sections!
    expect(sections.map((s) => s.section_name)).toEqual(['画面の構成', '一つ目', '二つ目'])
    const nav = (sections[0].input_fields as any[])[0]
    expect(nav.type).toBe('section_nav')
    expect(nav.items.map((i: any) => i.label)).toEqual(['一つ目', '二つ目'])
    const html = renderScreen(r.data.view.v)
    for (const item of nav.items) expect(html).toContain(`id="${item.href.slice(1)}"`)
  })

  it('sectioned with a flow and notices: hrefs account for both leading sections', () => {
    const doc = base('sectioned')
    doc.app.notifications = [{ message: 'm' }]
    doc.flows = { f: { name: 'F', outcome: 'o', steps: [{ view: 'v' }] } }
    const r = parseV2(doc)
    expect(r.success).toBe(true)
    if (!r.success) return
    const names = r.data.view.v.sections!.map((s) => s.section_name)
    expect(names).toEqual(['進行状況', 'お知らせ', '画面の構成', '一つ目', '二つ目'])
    const nav = (r.data.view.v.sections![2].input_fields as any[])[0]
    const html = renderScreen(r.data.view.v)
    for (const item of nav.items) expect(html).toContain(`id="${item.href.slice(1)}"`)
  })
})

describe('v2 render (order-entry)', () => {
  const schema = compiled()
  for (const name of Object.keys(schema.view)) {
    it(`renders ${name} without unknown-field`, () => {
      const html = renderScreen(schema.view[name])
      expect(html).not.toContain('unknown-field')
      expect(html).toContain(schema.view[name].title)
    })
  }

  function dom(html: string): Document {
    return new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')
  }

  it('order_form stepper markup carries the 3 step labels and the current index', () => {
    const doc = dom(renderScreen(schema.view.order_form))
    const stepper = doc.querySelector('.mokkun-stepper')!
    expect(stepper).not.toBeNull()
    const steps = [...stepper.querySelectorAll('.stepper-step')]
    expect(steps.map((s) => s.querySelector('.stepper-label')!.textContent)).toEqual(['入力', '確認', '完了'])
    expect(steps.findIndex((s) => s.classList.contains('current'))).toBe(0)
    // order_confirm: current は 2 番目、1 番目は completed
    const confirmSteps = [...dom(renderScreen(schema.view.order_confirm)).querySelectorAll('.mokkun-stepper .stepper-step')]
    expect(confirmSteps.findIndex((s) => s.classList.contains('current'))).toBe(1)
    expect(confirmSteps[0].classList.contains('completed')).toBe(true)
  })

  it('order_list: states.empty / list.empty reaches the rendered data_table empty state', () => {
    const table = fieldsOf(section(schema.view.order_list, '受注を選ぶ'))[0] as any
    expect(table.empty_state.title).toBe('該当する受注はありません')
    expect(renderScreen(schema.view.order_list)).toContain('該当する受注はありません')
    // list.empty が無ければ view.states.empty が使われる
    const r = parseV2(mk({}, {
      states: { empty: { message: '空です' } },
      sections: [{ id: 'l', title: 'L', kind: 'list', list: { columns: [{ id: 'a', label: 'A' }] } }],
    }))
    expect(r.success).toBe(true)
    if (r.success) {
      expect((r.data.view.v.sections![0].input_fields as any[])[0].empty_state.title).toBe('空です')
      expect(renderScreen(r.data.view.v)).toContain('空です')
    }
  })

  it('renders definition list values, accordion children, and actions', () => {
    const form = renderScreen(schema.view.order_form)
    expect(form).toContain('mokkun-repeater')
    expect(form).toContain('<details')
    expect(form).toContain('入力欄を開く')
    expect(form).toContain('data-action-id="to_confirm"')
    const confirm = renderScreen(schema.view.order_confirm)
    expect(confirm).toContain('東京都千代田区千代田1-1')
    expect(confirm).not.toContain('項目1')
  })

  it('order_done: status value is the displayed text', () => {
    const doc = dom(renderScreen(schema.view.order_done))
    // readonly セクションは definition_list なので、status 単体は form セクションで確認する
    expect(doc.body.textContent).toContain('処理中')
    const r = parseV2(mk({}, { sections: [{ id: 's', title: 'S', fields: [field({ item: 'st', label: 'ステータス', component: 'status', value: '出荷済み' })] }] }))
    expect(r.success).toBe(true)
    if (r.success) {
      const text = dom(renderScreen(r.data.view.v)).querySelector('.status-label-text')!.textContent
      expect(text).toBe('出荷済み')
    }
  })
})

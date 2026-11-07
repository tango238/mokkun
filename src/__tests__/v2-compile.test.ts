/**
 * v2 フォーマット コンパイル/パース/レンダリングのテスト
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

describe('v2 parse', () => {
  it('detects v2 documents', () => {
    expect(isV2Document({ mokkun: 2 })).toBe(true)
    expect(isV2Document({ view: {} })).toBe(false)
    expect(isV2Document(null)).toBe(false)
  })

  it('parses examples/v2/order-entry.yaml via parseYaml', () => {
    const result = parseYaml(yamlText)
    expect(result.success).toBe(true)
  })

  it('reports unknown view references and invalid components', () => {
    const bad = parseV2({
      mokkun: 2,
      app: { name: 'x', navigation: [{ group: 'g', items: [{ view: 'nope' }] }] },
      views: {
        a: {
          title: 'A',
          goal: 'g',
          primaryAction: { id: 'go', label: 'Go', kind: 'navigate', to: 'missing' },
          sections: [{ id: 's', title: 'S', fields: [{ item: 'f', label: 'F', component: 'hologram' }] }],
        },
      },
    })
    expect(bad.success).toBe(false)
    if (!bad.success) {
      const paths = bad.errors.map((e) => e.path)
      expect(paths).toContain('app.navigation[0].items[0].view')
      expect(paths).toContain('views.a.primaryAction.to')
      expect(paths).toContain('views.a.sections[0].fields[0].component')
      expect(bad.errors.find((e) => e.path?.endsWith('.component'))?.type).toBe('INVALID_FIELD_TYPE')
    }
  })

  it('rejects multiple primaryActions and missing required keys', () => {
    const bad = parseV2({
      mokkun: 2,
      app: { name: 'x' },
      views: { a: { title: 'A', goal: 'g', primaryAction: [{ id: 'a', label: 'A' }], sections: [] }, b: { sections: [] } },
    })
    expect(bad.success).toBe(false)
    if (!bad.success) {
      expect(bad.errors.some((e) => e.path === 'views.a.primaryAction')).toBe(true)
      expect(bad.errors.some((e) => e.path === 'views.b.title')).toBe(true)
    }
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
    const active = header.navigations!.filter((n) => n.active)
    expect(active).toHaveLength(1)
    expect(active[0].href).toBe('#order_form')
    expect(active[0].label).toBe('受注登録')
    // app_navi: group 単位、現在のグループが current
    const navi = schema.view.order_form.app_navi!
    expect(navi.items.map((i) => i.label)).toEqual(['受注', '設定'])
    expect(navi.items.map((i) => !!i.current)).toEqual([true, false])
    // order_confirm も nav: order_form なので同じ項目が active
    expect(schema.view.order_confirm.app_header!.navigations!.find((n) => n.active)?.href).toBe('#order_form')
  })

  it('order_form: stepper with 3 steps at index 0 and the notification in the leading section', () => {
    const leading = fieldsOf(schema.view.order_form.sections![0])
    const stepper = leading.find((f) => f.type === 'stepper') as any
    expect(stepper.steps).toHaveLength(3)
    expect(stepper.steps.map((s: any) => s.label)).toEqual(['入力', '確認', '完了'])
    expect(stepper.currentStep).toBe(0)
    expect(leading.some((f) => f.type === 'notification_bar')).toBe(true)
    expect(leading.some((f) => f.type === 'response_message' && (f as any).variant === 'error')).toBe(true)
    // order_confirm は 1 つ進む
    const confirmStepper = fieldsOf(schema.view.order_confirm.sections![0]).find((f) => f.type === 'stepper') as any
    expect(confirmStepper.currentStep).toBe(1)
    expect(confirmStepper.steps.map((s: any) => !!s.completed)).toEqual([true, false, false])
    // flow に属さない view に stepper は無い
    expect(fieldsOf(schema.view.settings.sections![0]).some((f) => f.type === 'stepper')).toBe(false)
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
    expect((memo[0] as any).fields[0].type).toBe('textarea')

    const results = fieldsOf(section(schema.view.order_list, '受注を選ぶ'))
    expect(results).toHaveLength(1)
    expect(results[0].type).toBe('data_table')
    expect((results[0] as any).columns).toHaveLength(5)
    expect((results[0] as any).pagination.page_size).toBe(20)
    expect((results[0] as any).empty_state.title).toBe('該当する受注はありません')
    expect((results[0] as any).row_actions[0].label).toBe('開く')

    const summary = fieldsOf(section(schema.view.order_confirm, '注文内容を確認する'))
    expect(summary).toHaveLength(1)
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

    const filter = fieldsOf(section(schema.view.order_list, '条件で絞り込む'))
    expect(filter.find((f) => f.id === 'status')!.type).toBe('segmented_control')
  })

  it('actions: primary style, kinds, confirm', () => {
    const form = schema.view.order_form
    const primary = form.actions!.find((a) => a.id === 'to_confirm')!
    expect(primary.style).toBe('primary')
    expect(primary.type).toBe('navigate')
    expect((primary as any).to).toBe('order_confirm')
    expect(form.actions!.find((a) => a.id === 'save_draft')!.type).toBe('custom')
    const cancel = form.actions!.find((a) => a.id === 'cancel')!
    expect(cancel.style).toBe('secondary')
    expect(cancel.confirm?.message).toContain('入力内容は保存されません')
    expect(schema.view.order_confirm.actions!.find((a) => a.id === 'submit')!.confirm?.message).toContain('確定すると')
    expect(schema.view.order_form.purpose).toBe('注文を作る')
  })

  it('order_done: success response_message; order_list: state/empty', () => {
    const done = fieldsOf(schema.view.order_done.sections![0])
    const msg = done.find((f) => f.type === 'response_message') as any
    expect(msg.variant).toBe('success')
    expect(msg.description).toContain('#10234')
  })

  it('ids are unique within a view', () => {
    for (const [name, screen] of Object.entries(schema.view)) {
      const ids: string[] = []
      const walk = (fields: InputField[]) => {
        for (const f of fields) {
          ids.push(f.id)
          const anyF = f as any
          if (anyF.item_fields) walk(anyF.item_fields)
          if (anyF.fields) walk(anyF.fields)
        }
      }
      for (const s of screen.sections ?? []) walk(fieldsOf(s))
      expect(new Set(ids).size, `${name}: ${ids.join(',')}`).toBe(ids.length)
    }
  })
})

describe('v2 compile (layouts)', () => {
  const base = (layout: string) => ({
    mokkun: 2,
    app: { name: 'A' },
    views: {
      v: {
        title: 'V',
        goal: 'g',
        layout,
        sections: [
          { id: 's1', title: '一つ目', fields: [{ item: 'a', label: 'A', component: 'text' }] },
          { id: 's2', title: '二つ目', fields: [{ item: 'b', label: 'B', component: 'text' }] },
        ],
      },
    },
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

  it('layout: sectioned prepends a section_nav', () => {
    const r = parseV2(base('sectioned'))
    expect(r.success).toBe(true)
    if (!r.success) return
    const sections = r.data.view.v.sections!
    expect(sections).toHaveLength(3)
    const nav = (sections[0].input_fields as any[])[0]
    expect(nav.type).toBe('section_nav')
    expect(nav.items).toHaveLength(2)
    const html = renderScreen(r.data.view.v)
    // href が実際のセクション id に一致する
    for (const item of nav.items) {
      expect(html).toContain(`id="${item.href.slice(1)}"`)
    }
  })

  it('patterns (use) are prepended to section fields', () => {
    const r = parseV2({
      mokkun: 2,
      app: { name: 'A' },
      patterns: { addr: { fields: [{ item: 'zip', label: '郵便番号', component: 'text' }] } },
      views: {
        v: {
          title: 'V',
          goal: 'g',
          sections: [{ id: 's', title: 'S', use: 'addr', fields: [{ item: 'city', label: '市区町村', component: 'text' }] }],
        },
      },
    })
    expect(r.success).toBe(true)
    if (!r.success) return
    expect((r.data.view.v.sections![0].input_fields as any[]).map((f) => f.id)).toEqual(['zip', 'city'])
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

  it('renders the compiled structures (stepper, definition list, accordion)', () => {
    const form = renderScreen(schema.view.order_form)
    expect(form).toContain('stepper-label')
    expect(form).toContain('入力')
    expect(form).toContain('mokkun-repeater')
    expect(form).toContain('<details')
    expect(form).toContain('data-action-id="to_confirm"')
    const confirm = renderScreen(schema.view.order_confirm)
    expect(confirm).toContain('東京都千代田区千代田1-1')
    expect(confirm).not.toContain('項目1')
  })
})

/**
 * v2 → 旧フォーマットの変換: 新しいキーの対応と、落ちるキーの警告（compileV2Warnings）
 */

import { describe, it, expect } from 'vitest'
import { parseV2 } from '../parser/v2/parse-v2'
import { compileV2Warnings } from '../parser/v2/compile-v2'
import { renderScreen } from '../renderer/screen-renderer'
import { field, load, mk } from './v2-test-helpers'

function compiled(viewOver: Record<string, any>, over: Record<string, any> = {}): any {
  const r = parseV2(mk(over, viewOver))
  if (!r.success) throw new Error(JSON.stringify(r.errors))
  return r.data.view.v
}
function compileFields(fields: Array<Record<string, any>>): any[] {
  return compiled({ sections: [{ id: 's', title: 'S', fields }] }).sections[0].input_fields
}
const listField = (list: Record<string, any>) => compiled({ sections: [{ id: 'l', title: 'L', kind: 'list', list }] }).sections[0].input_fields[0]

describe('条件の変換', () => {
  it('equals → eq、notEquals → ne、in → in（旧スキーマの演算子）', () => {
    const [, a, b, c] = compileFields([
      field({ item: 'x' }),
      field({ item: 'a', visibleWhen: { item: 'x', equals: 1 } }),
      field({ item: 'b', visibleWhen: { item: 'x', notEquals: 'n' } }),
      field({ item: 'c', visibleWhen: { item: 'x', in: ['p', 'q'] } }),
    ])
    expect(a.visible_when).toEqual({ field: 'x', operator: 'eq', value: 1 })
    expect(b.visible_when).toEqual({ field: 'x', operator: 'ne', value: 'n' })
    expect(c.visible_when).toEqual({ field: 'x', operator: 'in', value: ['p', 'q'] })
  })

  it('Section.visibleWhen の in も各フィールドの条件になる', () => {
    const f = compiled({ sections: [{ id: 's', title: 'S', visibleWhen: { item: 'x', in: ['a'] }, fields: [field({ item: 'x' })] }] }).sections[0].input_fields[0]
    expect(f.visible_when).toEqual({ field: 'x', operator: 'in', value: ['a'] })
  })
})

describe('Field の変換', () => {
  it('example は placeholder ではなく description の「例: …」', () => {
    const [f] = compileFields([field({ help: '補足', example: '1000001', format: 'ハイフンなし' })])
    expect(f.placeholder).toBeUndefined()
    expect(f.description).toBe('補足。入力形式: ハイフンなし。例: 1000001')
    expect(compileFields([field({ example: 'x。' })])[0].description).toBe('例: x')
  })

  it('unit は number だけ旧スキーマの unit に、file の accept / maxSize / multiple は max_size（バイト）に', () => {
    const [n, t, file, pdf, img] = compileFields([
      field({ item: 'n', component: 'number', unit: '円' }),
      field({ item: 't', unit: '件' }),
      field({ item: 'f', component: 'file', accept: ['.pdf', 'image/png'], maxSize: '10MB', multiple: true }),
      field({ item: 'p', component: 'file', accept: 'pdf', maxSize: '512KB' }),
      field({ item: 'i', component: 'file', accept: 'image', maxSize: '1GB' }),
    ])
    expect(n.unit).toBe('円')
    expect(t.unit).toBeUndefined()
    expect(file).toMatchObject({ type: 'file_upload', accept: ['.pdf', 'image/png'], max_size: 10 * 1024 * 1024, multiple: true })
    expect(pdf).toMatchObject({ accept: ['application/pdf'], max_size: 512 * 1024 })
    expect(img.type).toBe('image_uploader')
  })

  it('timeline の value（{ at, label, text }）は旧 items（time / title / description）に', () => {
    const [t] = compileFields([field({ component: 'timeline', value: [{ at: '11/06', label: '入庫', text: '新宿店' }, { at: '11/05', label: '出庫' }] })])
    expect(t.items).toEqual([{ time: '11/06', title: '入庫', description: '新宿店' }, { time: '11/05', title: '出庫' }])
    // props.items は従来どおり
    const [p] = compileFields([field({ component: 'timeline', props: { items: [{ time: '9:00', title: 'T' }] } })])
    expect(p.items).toEqual([{ time: '9:00', title: 'T' }])
  })

  it('旧スキーマに無いキー（links / requiredWhen / precision / autocomplete / to）は出力に漏れない', () => {
    const [f] = compileFields([field({ item: 'a', links: [{ label: 'L', href: '/x' }], autocomplete: 'email', unit: 'u' })])
    for (const key of ['links', 'autocomplete', 'requiredWhen', 'precision', 'maxSize']) expect(f).not.toHaveProperty(key)
  })
})

describe('list の変換', () => {
  const columns = [
    { id: 'no', label: '番号', to: 'w' },
    { id: 'at', label: '日', type: 'date' },
    { id: 'st', label: '状態', type: 'status' },
    { id: 'amt', label: '金額', type: 'number', sortable: true },
    { id: 'in', label: '入力', field: { component: 'number' } },
  ]
  const table = listField({ columns, rows: [{ no: 'A', amt: 1 }, { id: 'Z', no: 'B' }], selection: 'multiple', bulkActions: [{ id: 'b', label: 'B' }] })

  it('type は format に、number は右寄せ。to / field は列に漏れない（旧 field はデータキー）', () => {
    expect(table.columns.map((c: any) => c.format)).toEqual([undefined, 'date', 'status', 'number', undefined])
    expect(table.columns[3]).toMatchObject({ align: 'right', sortable: true })
    for (const c of table.columns) {
      expect(c).not.toHaveProperty('to')
      expect(c).not.toHaveProperty('field')
      expect(c).not.toHaveProperty('type')
    }
  })

  it('rows は旧 data_table の静的データ（id が無ければ通し番号）。bulkActions は落ちる', () => {
    expect(table.data).toEqual([{ id: 1, no: 'A', amt: 1 }, { id: 'Z', no: 'B' }])
    expect(table).not.toHaveProperty('bulk_actions')
    expect(() => renderScreen(compiled({ sections: [{ id: 'l', title: 'L', kind: 'list', list: { columns, rows: [{ no: 'A' }] } }] }))).not.toThrow()
  })
})

describe('compileV2Warnings', () => {
  const warn = (schema: ReturnType<typeof load>) => compileV2Warnings(schema).map(w => `${w.path} ${w.key}`)

  it('submit の to は警告し、navigate の to は警告しない', () => {
    const w = warn(load(mk({}, {
      primaryAction: { id: 'p', label: 'P', kind: 'submit', to: 'v' },
      secondaryActions: [{ id: 'q', label: 'Q', kind: 'navigate', to: 'v' }, { id: 'r', label: 'R', to: 'v' }],
    })))
    expect(w).toContain('views.v.primaryAction to')
    expect(w).toContain('views.v.secondaryActions[1] to')
    expect(w).not.toContain('views.v.secondaryActions[0] to')
    expect(warn(load(mk({}, { primaryAction: { id: 'c', label: 'C', kind: 'custom', to: 'v' } })))).not.toContain('views.v.primaryAction to')
  })

  it('従来から落ちるキー: placement / columns / purpose / rowActions.to / states.loading / width', () => {
    const w = warn(load(mk({}, {
      primaryAction: { id: 'p', label: 'P', placement: 'sticky' },
      states: { loading: { message: 'l' } },
      sections: [
        { id: 's', title: 'S', purpose: 'p', columns: 2, fields: [field({ width: 'md' })] },
        { id: 'l', title: 'L', kind: 'list', list: { columns: [{ id: 'a', label: 'A' }], rowActions: [{ id: 'o', label: 'O', kind: 'navigate', to: 'w' }] } },
      ],
    })))
    expect(w).toEqual(expect.arrayContaining([
      'views.v.primaryAction placement',
      'views.v.states loading',
      'views.v.sections[0] purpose',
      'views.v.sections[0] columns',
      'views.v.sections[0].fields[0] width',
      'views.v.sections[1].list.rowActions[0] to',
    ]))
  })

  it('新しいキー: role / until / actions / bulkActions / 列の to・field / unit / precision / autocomplete / links / requiredWhen / to', () => {
    const w = warn(load(mk({
      app: { name: 'A', roles: ['x'], navigation: [{ group: 'G', role: 'x', items: [{ view: 'v' }] }], notifications: [{ message: 'm', role: 'x', until: '2026-11-20' }] },
    }, {
      secondaryActions: [{ id: 'a', label: 'A', role: 'x' }],
      sections: [
        { id: 's', title: 'S', actions: [{ id: 'sa', label: 'SA' }], fields: [
          field({ item: 'a', unit: '件', autocomplete: 'email', links: [{ label: 'L', href: '/' }], required: false, requiredWhen: { item: 'z', equals: 1 } }),
          field({ item: 'z', component: 'date', precision: 'month' }),
        ] },
        { id: 'k', title: 'K', kind: 'summary', fields: [field({ item: 'k', to: 'w' })] },
        { id: 'l', title: 'L', kind: 'list', list: { columns: [{ id: 'a', label: 'A', to: 'w' }, { id: 'b', label: 'B', field: { component: 'text' } }], rows: [{}], selection: 'multiple', bulkActions: [{ id: 'bk', label: 'B' }] } },
      ],
    })))
    for (const expected of [
      'app.navigation[0] role',
      'app.notifications[0] role',
      'app.notifications[0] until',
      'views.v.secondaryActions[0] role',
      'views.v.sections[0] actions',
      'views.v.sections[0].fields[0] unit',
      'views.v.sections[0].fields[0] autocomplete',
      'views.v.sections[0].fields[0] links',
      'views.v.sections[0].fields[0] requiredWhen',
      'views.v.sections[0].fields[1] precision',
      'views.v.sections[1].fields[0] to',
      'views.v.sections[2].list.columns[0] to',
      'views.v.sections[2].list.columns[1] field',
      'views.v.sections[2].list bulkActions',
    ]) {
      expect(w).toContain(expected)
    }
  })

  it('変換できたキー（number の unit、日付 precision: day、file の maxSize）は警告しない', () => {
    const w = warn(load(mk({}, { sections: [{ id: 's', title: 'S', fields: [
      field({ item: 'n', component: 'number', unit: '円' }),
      field({ item: 'd', component: 'date', precision: 'day' }),
      field({ item: 'f', component: 'file', maxSize: '1MB', accept: 'pdf', multiple: true }),
    ] }] })))
    expect(w).toEqual([])
  })

  it('各警告は path / key / message を持ち、変換結果は変えない', () => {
    const schema = load(mk({}, { sections: [{ id: 's', title: 'S', purpose: 'p', fields: [] }] }))
    const [first] = compileV2Warnings(schema)
    expect(first).toMatchObject({ path: 'views.v.sections[0]', key: 'purpose' })
    expect(first.message).toContain('purpose')
    const r = parseV2(mk({}, { sections: [{ id: 's', title: 'S', purpose: 'p', fields: [] }] }))
    expect(r.success).toBe(true)
  })

  it('patterns の項目も走査する', () => {
    const schema = load(mk({ patterns: { p: { fields: [field({ item: 'x', links: [{ label: 'L', href: '/' }] })] } } }))
    expect(warn(schema)).toContain('patterns.p.fields[0] links')
  })
})

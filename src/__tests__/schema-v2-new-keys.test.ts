/**
 * schema-v2.json: 第 2 版のルールが前提とするキー（role / actions / bulkActions / rows / unit / precision ほか）
 */

import { describe, it, expect } from 'vitest'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { field, mk } from './v2-test-helpers'

const schema = JSON.parse(readFileSync(join(resolve(__dirname, '../..'), 'schema-v2.json'), 'utf-8'))
const ajv = new Ajv({ allErrors: true, strict: false })
addFormats(ajv)
const validate = ajv.compile(schema)

function errorsOf(doc: unknown) {
  expect(validate(doc)).toBe(false)
  return validate.errors ?? []
}

const fieldDoc = (over: Record<string, any>) => mk({}, { sections: [{ id: 's', title: 'S', fields: [field(over)] }] })
const listDoc = (list: Record<string, any>) => mk({}, { sections: [{ id: 'l', title: 'L', kind: 'list', list }] })
const FP = '/views/v/sections/0/fields/0'
const col = { id: 'a', label: 'A' }

describe('schema-v2: list', () => {
  it('columns[].type / to / rows / bulkActions を受け付ける', () => {
    expect(
      validate(
        listDoc({
          columns: [{ ...col, type: 'status', to: 'w' }, { id: 'b', label: 'B', type: 'number' }],
          rows: [{ a: 'x', b: 1 }],
          selection: 'multiple',
          bulkActions: [{ id: 'bulk', label: '一括', kind: 'custom' }],
        }),
      ),
    ).toBe(true)
  })

  it('type の列挙外は enum エラー', () => {
    expect(errorsOf(listDoc({ columns: [{ ...col, type: 'currency' }] }))).toContainEqual(
      expect.objectContaining({ keyword: 'enum', instancePath: '/views/v/sections/0/list/columns/0/type' }),
    )
  })

  it('bulkActions は selection: multiple のときだけ', () => {
    const bulk = [{ id: 'bulk', label: '一括' }]
    expect(errorsOf(listDoc({ columns: [col], bulkActions: bulk }))).toContainEqual(
      expect.objectContaining({ keyword: 'required', instancePath: '/views/v/sections/0/list', params: { missingProperty: 'selection' } }),
    )
    expect(errorsOf(listDoc({ columns: [col], selection: 'single', bulkActions: bulk }))).toContainEqual(
      expect.objectContaining({ keyword: 'const', instancePath: '/views/v/sections/0/list/selection' }),
    )
  })

  it('列の field は list.rows が必要で、text / number / select / checkbox だけ・item と label は持たない', () => {
    const ok = { ...col, field: { component: 'number', unit: '個', width: 'xs' } }
    expect(validate(listDoc({ columns: [ok], rows: [{}] }))).toBe(true)
    expect(errorsOf(listDoc({ columns: [ok] }))).toContainEqual(
      expect.objectContaining({ keyword: 'required', instancePath: '/views/v/sections/0/list', params: { missingProperty: 'rows' } }),
    )
    expect(errorsOf(listDoc({ columns: [{ ...col, field: { component: 'date' } }], rows: [{}] }))).toContainEqual(
      expect.objectContaining({ keyword: 'enum', instancePath: '/views/v/sections/0/list/columns/0/field/component' }),
    )
    expect(errorsOf(listDoc({ columns: [{ ...col, field: { component: 'text', item: 'x' } }], rows: [{}] }))).toContainEqual(
      expect.objectContaining({ keyword: 'additionalProperties', params: { additionalProperty: 'item' } }),
    )
  })

  it('rows は object の配列', () => {
    expect(errorsOf(listDoc({ columns: [col], rows: ['x'] }))).toContainEqual(
      expect.objectContaining({ keyword: 'type', instancePath: '/views/v/sections/0/list/rows/0' }),
    )
  })
})

describe('schema-v2: role / actions', () => {
  it('Action.role / NavGroup.role / Notice.role は文字列か配列', () => {
    const doc = mk(
      {
        app: {
          name: 'A',
          roles: ['x', 'y'],
          navigation: [{ group: 'G', role: ['x', 'y'], items: [{ view: 'v' }] }],
          notifications: [{ message: 'm', role: 'x', until: '2026-11-20' }],
        },
      },
      { primaryAction: { id: 'p', label: 'P', role: 'x' } },
    )
    expect(validate(doc)).toBe(true)
  })

  it('role は空文字・空配列・数値を受け付けない', () => {
    for (const role of ['', [], 3]) {
      expect(errorsOf(mk({}, { primaryAction: { id: 'p', label: 'P', role } })).length).toBeGreaterThan(0)
    }
  })

  it('Notice.until は YYYY-MM-DD', () => {
    expect(errorsOf(mk({ app: { name: 'A', notifications: [{ message: 'm', until: '2026/11/20' }] } }))).toContainEqual(
      expect.objectContaining({ keyword: 'pattern', instancePath: '/app/notifications/0/until' }),
    )
  })

  it('Section.actions は Action の配列で、primary は不可', () => {
    const doc = (actions: unknown) => mk({}, { sections: [{ id: 's', title: 'S', actions, fields: [] }] })
    expect(validate(doc([{ id: 'a', label: 'A', style: 'secondary' }, { id: 'b', label: 'B', kind: 'reset' }]))).toBe(true)
    expect(errorsOf(doc([{ id: 'a', label: 'A', style: 'primary' }]))).toContainEqual(
      expect.objectContaining({ keyword: 'not', instancePath: '/views/v/sections/0/actions/0' }),
    )
    expect(errorsOf(doc([{ id: 'a' }]))).toContainEqual(
      expect.objectContaining({ keyword: 'required', params: { missingProperty: 'label' } }),
    )
  })
})

describe('schema-v2: Field', () => {
  it('unit / precision / autocomplete / maxSize / links / to を受け付ける', () => {
    expect(validate(fieldDoc({ unit: '円' }))).toBe(true)
    expect(validate(fieldDoc({ component: 'date', precision: 'month', autocomplete: 'bday' }))).toBe(true)
    expect(validate(fieldDoc({ component: 'file', accept: ['.pdf', 'image/png'], maxSize: '10MB', multiple: true }))).toBe(true)
    expect(validate(fieldDoc({ component: 'file', accept: 'pdf' }))).toBe(true)
    expect(validate(fieldDoc({ links: [{ label: '規約', href: 'https://example.jp/terms' }] }))).toBe(true)
  })

  it('precision は date だけ、列挙は day / month', () => {
    expect(errorsOf(fieldDoc({ precision: 'month' }))).toContainEqual(
      expect.objectContaining({ keyword: 'const', instancePath: `${FP}/component` }),
    )
    expect(errorsOf(fieldDoc({ component: 'date', precision: 'year' }))).toContainEqual(
      expect.objectContaining({ keyword: 'enum', instancePath: `${FP}/precision` }),
    )
  })

  it('maxSize は数字 + KB / MB / GB', () => {
    for (const bad of ['10', '10mb', '1.5MB', 'MB']) {
      expect(errorsOf(fieldDoc({ component: 'file', maxSize: bad }))).toContainEqual(
        expect.objectContaining({ keyword: 'pattern', instancePath: `${FP}/maxSize` }),
      )
    }
  })

  it('accept は image / pdf / document、拡張子・MIME の配列（旧来の ".pdf" 文字列も可）', () => {
    expect(validate(fieldDoc({ component: 'file', accept: '.pdf' }))).toBe(true)
    expect(errorsOf(fieldDoc({ component: 'file', accept: 'spreadsheet' })).length).toBeGreaterThan(0)
    expect(errorsOf(fieldDoc({ component: 'file', accept: [] })).length).toBeGreaterThan(0)
  })

  it('links は label と href が必須', () => {
    expect(errorsOf(fieldDoc({ links: [{ label: '規約' }] }))).toContainEqual(
      expect.objectContaining({ keyword: 'required', instancePath: `${FP}/links/0`, params: { missingProperty: 'href' } }),
    )
  })

  it('requiredWhen は required: true と併用できない', () => {
    const cond = { item: 'a', equals: 'x' }
    expect(validate(fieldDoc({ required: false, requiredWhen: cond }))).toBe(true)
    expect(errorsOf(fieldDoc({ required: true, requiredWhen: cond }))).toContainEqual(expect.objectContaining({ keyword: 'not' }))
  })

  it('Field.to は readonly / summary の Section だけ', () => {
    const doc = (kind: string) => mk({}, { sections: [{ id: 's', title: 'S', kind, fields: [field({ to: 'w' })] }] })
    expect(validate(doc('summary'))).toBe(true)
    expect(validate(doc('readonly'))).toBe(true)
    expect(errorsOf(doc('form'))).toContainEqual(expect.objectContaining({ keyword: 'not', instancePath: '/views/v/sections/0/fields/0' }))
  })
})

describe('schema-v2: Condition', () => {
  const cond = (c: Record<string, unknown>) => fieldDoc({ visibleWhen: c })

  it('equals / notEquals / in のうち 1 つ', () => {
    expect(validate(cond({ item: 'a', equals: 1 }))).toBe(true)
    expect(validate(cond({ item: 'a', notEquals: 'x' }))).toBe(true)
    expect(validate(cond({ item: 'a', in: ['x', 2, true] }))).toBe(true)
  })

  it('0 個・2 個以上は oneOf エラー、in は空配列不可', () => {
    expect(errorsOf(cond({ item: 'a' }))).toContainEqual(expect.objectContaining({ keyword: 'oneOf', instancePath: `${FP}/visibleWhen` }))
    expect(errorsOf(cond({ item: 'a', equals: 1, notEquals: 2 }))).toContainEqual(expect.objectContaining({ keyword: 'oneOf' }))
    expect(errorsOf(cond({ item: 'a', in: [] }))).toContainEqual(expect.objectContaining({ keyword: 'minItems', instancePath: `${FP}/visibleWhen/in` }))
  })

  it('Section.visibleWhen にも使える', () => {
    const doc = mk({}, { sections: [{ id: 's', title: 'S', visibleWhen: { item: 'a', in: ['x'] }, fields: [] }] })
    expect(validate(doc)).toBe(true)
  })
})

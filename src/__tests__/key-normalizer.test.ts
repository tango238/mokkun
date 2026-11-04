import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { KNOWN_KEYS, CAMEL_TO_SNAKE, toSnake, normalizeKeysDeep } from '../parser/key-normalizer'
import { load } from 'js-yaml'
import { parseYaml } from '../parser/yaml-parser'

const schema = JSON.parse(readFileSync(join(resolve(__dirname, '../..'), 'schema.json'), 'utf-8'))

function collectPropertyNames(node: unknown, out = new Set<string>()): Set<string> {
  if (Array.isArray(node)) {
    node.forEach((n) => collectPropertyNames(n, out))
  } else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      if (k === 'properties' && v && typeof v === 'object' && !Array.isArray(v)) {
        for (const name of Object.keys(v)) out.add(name)
      }
      collectPropertyNames(v, out)
    }
  }
  return out
}

describe('KNOWN_KEYS', () => {
  it('is sorted and unique', () => {
    expect([...KNOWN_KEYS]).toEqual([...new Set(KNOWN_KEYS)].sort())
  })

  it('contains every schema.json property (as snake_case)', () => {
    const names = [...collectPropertyNames(schema)].filter((n) => /[A-Z]/.test(n) || n.includes('_'))
    // 内部表現が元から camelCase のキー（変換不要）
    const nativeCamel = new Set(['activeIndex'])
    const missing = names.filter((n) => !nativeCamel.has(n)).map(toSnake).filter((n) => n.includes('_') && !n.startsWith('_') && !KNOWN_KEYS.includes(n))
    expect(missing).toEqual([])
  })

  it('maps camelCase to snake_case', () => {
    expect(CAMEL_TO_SNAKE.inputType).toBe('input_type')
    expect(CAMEL_TO_SNAKE.visibleWhen).toBe('visible_when')
    expect(CAMEL_TO_SNAKE.appHeader).toBe('app_header')
    expect(CAMEL_TO_SNAKE.inputFields).toBe('input_fields')
    expect(CAMEL_TO_SNAKE.sectionName).toBe('section_name')
    expect(CAMEL_TO_SNAKE.use24Hour).toBe('use_24_hour')
    expect(toSnake('use24Hour')).toBe('use_24_hour')
  })
})

describe('normalizeKeysDeep', () => {
  it('converts camelCase keys to snake_case', () => {
    expect(normalizeKeysDeep({ inputType: 'password', visibleWhen: { field: 'a' } })).toEqual({
      input_type: 'password',
      visible_when: { field: 'a' },
    })
  })

  it('leaves snake_case keys unchanged', () => {
    const v = { input_type: 'password', section_name: 'x' }
    expect(normalizeKeysDeep(v)).toEqual(v)
  })

  it('prefers the snake_case key when both exist', () => {
    expect(normalizeKeysDeep({ inputType: 'a', input_type: 'b' })).toEqual({ input_type: 'b' })
    expect(normalizeKeysDeep({ input_type: 'b', inputType: 'a' })).toEqual({ input_type: 'b' })
  })

  it('does not convert screen names directly under view', () => {
    const out = normalizeKeysDeep({ view: { orderList: { appHeader: {} } } }) as any
    expect(Object.keys(out.view)).toEqual(['orderList'])
    expect(out.view.orderList).toEqual({ app_header: {} })
  })

  it('does not convert column ids in data rows', () => {
    const out = normalizeKeysDeep({
      type: 'data_table',
      data: [{ id: 1, totalCount: 3, userInfo: 'a', _cellMerge: { createdAt: { rowspan: 2 } } }],
    }) as any
    expect(out.data[0]).toEqual({ id: 1, totalCount: 3, userInfo: 'a', _cellMerge: { createdAt: { rowspan: 2 } } })
    const rows = normalizeKeysDeep({ rows: [{ id: 1, createdAt: 'x', inputType: 'y' }] }) as any
    expect(rows.rows[0]).toEqual({ id: 1, createdAt: 'x', inputType: 'y' })
  })

  it('keeps Date values intact', () => {
    const d = new Date('2024-01-01')
    const out = normalizeKeysDeep({ minDate: d, data: [{ id: 1, created: d }] }) as any
    expect(out.min_date).toBe(d)
    expect(out.data[0].created).toBe(d)
  })

  it('does not convert keys of object elements in default / defaultValue / value arrays', () => {
    const out = normalizeKeysDeep({
      default: [{ sectionName: 'x' }],
      defaultValue: [{ userInfo: 'y' }],
      value: [{ inputType: 'z' }],
    }) as any
    expect(out.default).toEqual([{ sectionName: 'x' }])
    expect(out.default_value).toEqual([{ userInfo: 'y' }])
    expect(out.value).toEqual([{ inputType: 'z' }])
  })

  it('treats screens named like exclusion keys as normal structure', () => {
    const out = normalizeKeysDeep({
      view: {
        params: { inputFields: [{ inputType: 'a' }] },
        value: { fields: [{ inputType: 'b' }] },
        x: { actions: [{ params: { anyKey: 1, inputType: 2 } }] },
      },
    }) as any
    expect(out.view.params.input_fields[0].input_type).toBe('a')
    expect(out.view.value.fields[0].input_type).toBe('b')
    expect(out.view.x.actions[0].params).toEqual({ anyKey: 1, inputType: 2 })
  })

  it('does not convert status_map keys', () => {
    const out = normalizeKeysDeep({ statusMap: { inProgress: { label: 'x', color: 'info' } } }) as any
    expect(out.status_map).toEqual({ inProgress: { label: 'x', color: 'info' } })
  })

  it('traverses arrays', () => {
    expect(normalizeKeysDeep({ fields: [{ inputType: 'a' }, [{ visibleWhen: 1 }]] })).toEqual({
      fields: [{ input_type: 'a' }, [{ visible_when: 1 }]],
    })
  })
})

describe('parseYaml: camelCase and snake_case are equivalent', () => {
  const camel = `
view:
  orderList:
    title: Orders
    appHeader:
      systemName: Demo
      logoAlt: logo
    appNavi:
      currentPage: list
      items:
        - id: list
          label: List
    validations:
      - field: name
        rule: required
        fieldName: Name
    fields:
      - id: name
        type: text
        label: Name
        inputType: password
        minLength: 2
        visibleWhen:
          field: other
          equals: x
      - id: when
        type: date_picker
        label: When
        minDate: 2024-01-01
      - id: rep
        type: repeater
        label: Rep
        itemFields:
          - id: sectionName
            type: text
            label: S
        default:
          - sectionName: first
      - id: tbl
        type: data_table
        label: T
        pagination:
          pageSize: 10
        columns:
          - id: totalCount
            label: Total
            statusMap:
              inProgress:
                label: Doing
                color: info
        data:
          - id: 1
            totalCount: 3
            created: 2024-01-15
      - id: t
        type: tabs
        label: Tabs
        items:
          - id: a
            label: A
`
  const snake = `
view:
  orderList:
    title: Orders
    app_header:
      system_name: Demo
      logo_alt: logo
    app_navi:
      current_page: list
      items:
        - id: list
          label: List
    validations:
      - field: name
        rule: required
        field_name: Name
    fields:
      - id: name
        type: text
        label: Name
        input_type: password
        min_length: 2
        visible_when:
          field: other
          equals: x
      - id: when
        type: date_picker
        label: When
        min_date: 2024-01-01
      - id: rep
        type: repeater
        label: Rep
        item_fields:
          - id: sectionName
            type: text
            label: S
        default:
          - sectionName: first
      - id: tbl
        type: data_table
        label: T
        pagination:
          page_size: 10
        columns:
          - id: totalCount
            label: Total
            status_map:
              inProgress:
                label: Doing
                color: info
        data:
          - id: 1
            totalCount: 3
            created: 2024-01-15
      - id: t
        type: tabs
        label: Tabs
        items:
          - id: a
            label: A
`

  it('produces equal results', () => {
    const a = parseYaml(camel)
    const b = parseYaml(snake)
    expect(a.success).toBe(true)
    expect(b.success).toBe(true)
    expect(a).toEqual(b)
  })

  it('normalizes keys while preserving user-defined keys and Dates', () => {
    const a = parseYaml(camel)
    if (!a.success) throw new Error(JSON.stringify(a.errors))
    const screen = (a.data.view as any).orderList
    const fields = screen.fields as any[]
    const text = fields.find((f) => f.id === 'name')
    expect(text.input_type).toBe('password')
    expect(text.visible_when).toEqual({ field: 'other', equals: 'x' })
    const rawDate = (normalizeKeysDeep(load(camel)) as any).view.orderList.fields.find((f: any) => f.id === 'when')
    expect(rawDate.min_date).toBeInstanceOf(Date)
    const tbl = fields.find((f) => f.id === 'tbl')
    expect(tbl.data[0].totalCount).toBe(3)
    expect(tbl.data[0].created).toBeInstanceOf(Date)
    expect(tbl.columns[0].status_map.inProgress.label).toBe('Doing')
    expect(tbl.pagination.page_size).toBe(10)
    expect((normalizeKeysDeep(load(camel)) as any).view.orderList.validations[0].field_name).toBe('Name')
    expect((normalizeKeysDeep(load(camel)) as any).view.orderList.app_header.system_name).toBe('Demo')
  })

  it('keeps repeater default rows keyed by item-field ids', () => {
    const raw = normalizeKeysDeep(load(camel)) as any
    const rep = raw.view.orderList.fields.find((f: any) => f.id === 'rep')
    expect(rep.default).toEqual([{ sectionName: 'first' }])
    expect(rep.item_fields[0].id).toBe('sectionName')
  })
})

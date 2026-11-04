/**
 * パーサ: 型固有キーの保持テスト
 */
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { parseYaml } from '../parser'
import { renderActions } from '../renderer/components/layout'

function allFields(schema: any): any[] {
  const out: any[] = []
  for (const screen of Object.values<any>(schema.view)) {
    for (const f of screen.fields ?? []) out.push(f)
  }
  return out
}

describe('parser: type-specific keys are preserved', () => {
  it('admin-dashboard.yaml keeps dropdown options and pagination total_items', () => {
    const text = readFileSync(resolve(__dirname, '../../examples/admin-dashboard.yaml'), 'utf-8')
    const result = parseYaml(text)
    expect(result.success).toBe(true)
    if (!result.success) return
    const fields = allFields(result.data)
    const dd = fields.find((f) => f.id === 'action_dropdown')
    expect(dd.options).toHaveLength(4)
    const pg = fields.find((f) => f.id === 'user_pagination')
    expect(pg.total_items).toBe(156)
  })

  it('keeps line_clamp lines / chip variant and timeline item extras', () => {
    const yaml = `
view:
  s:
    title: S
    fields:
      - id: lc
        type: line_clamp
        label: L
        lines: 3
      - id: ch
        type: chip
        label: C
        variant: success
      - id: tl
        type: timeline
        label: T
        items:
          - time: "10:00"
            title: A
            current: true
            icon: check
            status: done
`
    const result = parseYaml(yaml)
    expect(result.success).toBe(true)
    if (!result.success) return
    const fields = allFields(result.data)
    expect(fields[0].lines).toBe(3)
    expect(fields[1].variant).toBe('success')
    expect(fields[2].items[0]).toMatchObject({ time: '10:00', title: 'A', current: true, icon: 'check', status: 'done' })
  })

  it('base keys take precedence over raw keys', () => {
    const yaml = `
view:
  s:
    title: S
    fields:
      - field_name: nm
        type: chip
`
    const result = parseYaml(yaml)
    expect(result.success).toBe(true)
    if (!result.success) return
    const f = allFields(result.data)[0]
    expect(f.id).toBe('nm')
    expect(f.label).toBe('nm')
  })
})

describe('parser: raw keys are passed through (audit phase 1/3b)', () => {
  it('keeps keys not enumerated in normalizeInputField', () => {
    const yaml = `
view:
  s:
    title: S
    fields:
      - id: t
        type: text
        label: T
        maxLength: 10
        default: hello
        disabled: true
      - id: sel
        type: select
        label: S
        clearable: true
        default: a
        options: [a, b]
      - id: rg
        type: radio_group
        label: R
        direction: horizontal
        options: [a, b]
      - id: rp
        type: repeater
        label: RP
        minItems: 2
        addButtonLabel: 行を足す
        itemFields:
          - id: x
            type: text
            label: X
      - id: fu
        type: file_upload
        label: F
        maxSize: 1024
        accept: ".png, .jpg"
`
    const result = parseYaml(yaml)
    expect(result.success).toBe(true)
    if (!result.success) return
    const f = Object.fromEntries(allFields(result.data).map((x) => [x.id, x]))
    expect(f.t.max_length).toBe(10)
    expect(f.t.default).toBe('hello')
    expect(f.t.disabled).toBe(true)
    expect(f.sel.clearable).toBe(true)
    expect(f.sel.default).toBe('a')
    expect(f.rg.direction).toBe('horizontal')
    expect(f.rp.min_items).toBe(2)
    expect(f.rp.add_button_label).toBe('行を足す')
    expect(f.rp.item_fields).toHaveLength(1)
    expect(f.fu.max_size).toBe(1024)
    expect(f.fu.accept).toEqual(['.png', '.jpg'])
  })

  it('does not fall back to id for a missing label', () => {
    const result = parseYaml(`
view:
  s:
    title: S
    fields:
      - type: text
        placeholder: p
`)
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(allFields(result.data)[0].label).toBe('')
  })

  it('string actions become non-submit custom actions', () => {
    const result = parseYaml(`
view:
  s:
    title: S
    fields:
      - id: a
        type: text
        label: A
    actions: ["保存", "キャンセル"]
`)
    expect(result.success).toBe(true)
    if (!result.success) return
    const actions = (result.data.view as any).s.actions
    expect(actions).toHaveLength(2)
    expect(actions.every((a: any) => a.type === 'custom')).toBe(true)
    const html = renderActions(actions)
    expect(html).not.toContain('type="submit"')
    expect(html).toContain('type="button"')
  })
})

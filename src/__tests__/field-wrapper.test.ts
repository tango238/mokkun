import { createFieldWrapper } from '../renderer/utils/field-helpers'
import { Input } from '../renderer/components/input'
import { Select } from '../renderer/components/select'
import { SegmentedControl } from '../renderer/components/segmented-control'
import type { InputField } from '../types/schema'

const f = (o: Record<string, unknown>) => ({ id: 'x', label: 'ラベル', description: '説明', ...o }) as unknown as InputField

describe('createFieldWrapper branches', () => {
  it('normal: label + description', () => {
    const html = createFieldWrapper(f({ type: 'text' }), '<input>')
    expect(html).toContain('<label class="field-label" for="x">')
    expect(html).toContain('field-description')
  })

  it('HEADING_LABEL: heading div, no description', () => {
    for (const type of ['loader', 'notification_bar', 'response_message', 'line_clamp', 'tabs', 'stepper', 'float_area', 'data_table']) {
      const html = createFieldWrapper(f({ type }), '<i></i>')
      expect(html).toContain('<div class="field-label"')
      expect(html).toContain('ラベル')
      expect(html).not.toContain('<label')
      expect(html).not.toContain('field-description')
    }
  })

  it('browser/calendar get role=group + aria-labelledby', () => {
    const html = createFieldWrapper(f({ type: 'browser' }), '')
    expect(html).toContain('role="group"')
    expect(html).toContain('aria-labelledby="x-label"')
    expect(html).toContain('id="x-label"')
  })

  it('SELF_LABELED: no label/description from wrapper', () => {
    for (const type of ['badge', 'chip', 'status_label', 'heading']) {
      const html = createFieldWrapper(f({ type }), '<b>body</b>')
      expect(html).not.toContain('field-label')
      expect(html).not.toContain('field-description')
      expect(html).toContain('<b>body</b>')
    }
  })

  it('text / select / segmented_control keep their label', () => {
    expect(Input.renderField(f({ type: 'text' }))).toContain('ラベル')
    expect(Select.renderField(f({ type: 'select', options: [{ value: 'a', label: 'A' }] }))).toContain('ラベル')
    expect(SegmentedControl.renderField(f({ type: 'segmented_control', options: [{ value: 'a', label: 'A' }] }))).toContain('ラベル')
  })
})

import { Badge } from '../renderer/components/badge'
import { Pagination } from '../renderer/components/pagination'

describe('static renderField hardening', () => {
  it('badge validates color/size via whitelist', () => {
    const html = Badge.renderField(f({ type: 'badge', color: '"><script>', size: 'x y' }))
    expect(html).toContain('badge-gray')
    expect(html).toContain('badge-medium')
    expect(html).not.toContain('<script>')
  })
  it('badge dot gets aria-label with count', () => {
    const html = Badge.renderField(f({ type: 'badge', label: '未読', dot: true, count: 3 }))
    expect(html).toContain('aria-label="未読 3件"')
  })
  it('badge hide_on_zero renders nothing for count 0', () => {
    const html = Badge.renderField(f({ type: 'badge', count: 0, hide_on_zero: true }))
    expect(html).not.toContain('mokkun-badge')
  })
  it('pagination align is whitelisted', () => {
    const html = Pagination.renderField(f({ type: 'pagination', total_items: 5, align: '"><img onerror=1>' }))
    expect(html).toContain('pagination-align-center')
    expect(html).not.toContain('<img')
  })
})

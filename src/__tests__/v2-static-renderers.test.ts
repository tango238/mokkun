/**
 * stepper / definition_list / section_nav / accordion_panel / badge / chip / status_label の
 * 静的レンダリング（データ指定あり）の単体テスト
 */

import { describe, it, expect } from 'vitest'
import { Stepper } from '../renderer/components/stepper'
import { DefinitionList } from '../renderer/components/definition-list'
import { SectionNav } from '../renderer/components/section-nav'
import { AccordionPanel } from '../renderer/components/accordion-panel'
import { Badge } from '../renderer/components/badge'
import { Chip } from '../renderer/components/chip'
import { StatusLabel } from '../renderer/components/status-label'
import type { InputField } from '../types/schema'

function dom(html: string): Document {
  return new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')
}

const f = (o: Record<string, unknown>) => ({ id: 'x', label: 'L', ...o }) as unknown as InputField

describe('Stepper.renderField (steps given)', () => {
  it('renders labels, current, completed and closed', () => {
    const d = dom(Stepper.renderField(f({
      type: 'stepper',
      currentStep: 1,
      steps: [
        { id: 'a', label: '入力', completed: true },
        { id: 'b', label: '確認' },
        { id: 'c', label: '完了', status: 'closed' },
        { id: 'd', label: '別', status: { type: 'completed' } },
      ],
    })))
    const steps = [...d.querySelectorAll('.stepper-step')]
    expect(steps.map((s) => s.querySelector('.stepper-label')!.textContent)).toEqual(['入力', '確認', '完了', '別'])
    expect(steps[0].classList.contains('completed')).toBe(true)
    expect(steps[1].classList.contains('current')).toBe(true)
    expect(steps[1].getAttribute('aria-current')).toBe('step')
    expect(steps[2].classList.contains('closed')).toBe(true)
    expect(steps[3].classList.contains('completed')).toBe(true)
    expect(d.querySelectorAll('.stepper-line')).toHaveLength(3)
  })

  it('accepts string steps and escapes labels', () => {
    const d = dom(Stepper.renderField(f({ type: 'stepper', steps: ['一', '<b>二</b>'] })))
    expect([...d.querySelectorAll('.stepper-label')].map((e) => e.textContent)).toEqual(['一', '<b>二</b>'])
    expect(d.querySelector('b')).toBeNull()
  })

  it('falls back to the placeholder without steps', () => {
    expect(Stepper.renderField(f({ type: 'stepper' }))).toContain('ステップ1')
  })
})

describe('DefinitionList.renderField (items given)', () => {
  it('renders terms and descriptions; arrays join with 、 and null is empty', () => {
    const d = dom(DefinitionList.renderField(f({
      type: 'definition_list',
      items: [
        { term: '名前', description: '山田' },
        { term: '複数', description: ['A', 'B'] },
        { term: '空', description: null },
        { term: '数', description: 0 },
      ],
    })))
    const terms = [...d.querySelectorAll('.definition-term')].map((e) => e.textContent)
    const descs = [...d.querySelectorAll('.definition-description')].map((e) => e.textContent)
    expect(terms).toEqual(['名前', '複数', '空', '数'])
    expect(descs).toEqual(['山田', 'A、B', '', '0'])
  })

  it('falls back to the placeholder without items', () => {
    expect(DefinitionList.renderField(f({ type: 'definition_list' }))).toContain('項目1')
  })
})

describe('SectionNav.renderField (items given)', () => {
  it('renders links; strings are label and anchor', () => {
    const d = dom(SectionNav.renderField(f({
      type: 'section_nav',
      items: [{ id: 'a', label: 'A', href: '#section-1-a' }, { id: 'b', label: 'B' }, '概要'],
    })))
    const links = [...d.querySelectorAll('a.section-nav-link')]
    expect(links.map((a) => a.textContent)).toEqual(['A', 'B', '概要'])
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['#section-1-a', '#b', '#概要'])
    expect(d.querySelector('li')!.classList.contains('active')).toBe(true)
  })

  it('falls back to the placeholder without items', () => {
    expect(SectionNav.renderField(f({ type: 'section_nav' }))).toContain('セクション1')
  })
})

describe('AccordionPanel.renderField (fields given)', () => {
  it('renders a closed <details> with child fields', () => {
    const d = dom(AccordionPanel.renderField(f({
      type: 'accordion_panel',
      label: '詳細',
      fields: [{ id: 'memo', type: 'textarea', label: '備考' }],
    })))
    const details = d.querySelector('details')!
    expect(details.hasAttribute('open')).toBe(false)
    expect(details.querySelector('summary')!.textContent).toContain('詳細')
    expect(details.querySelector('textarea#memo')).not.toBeNull()
  })

  it('defaultOpen opens the panel', () => {
    const d = dom(AccordionPanel.renderField(f({
      type: 'accordion_panel', defaultOpen: true, fields: [{ id: 'm', type: 'text', label: 'M' }],
    })))
    expect(d.querySelector('details')!.hasAttribute('open')).toBe(true)
  })

  it('keeps the legacy markup without fields', () => {
    expect(AccordionPanel.renderField(f({ type: 'accordion_panel' }))).toContain('accordion-trigger')
  })
})

describe('value as display text (badge / chip / status_label)', () => {
  it('status_label and chip show value, falling back to label', () => {
    expect(dom(StatusLabel.renderField(f({ type: 'status_label', value: '処理中' }))).querySelector('.status-label-text')!.textContent).toBe('処理中')
    expect(dom(StatusLabel.renderField(f({ type: 'status_label' }))).querySelector('.status-label-text')!.textContent).toBe('L')
    expect(dom(Chip.renderField(f({ type: 'chip', value: 'タグ' }))).querySelector('.chip-label')!.textContent).toBe('タグ')
    expect(dom(Chip.renderField(f({ type: 'chip' }))).querySelector('.chip-label')!.textContent).toBe('L')
  })

  it('badge shows value as its content instead of the label; label/count behavior is unchanged', () => {
    const v = dom(Badge.renderField(f({ type: 'badge', value: '新着' })))
    expect(v.querySelector('.badge-content')!.textContent).toBe('新着')
    expect(v.querySelector('.badge-label')).toBeNull()
    const c = dom(Badge.renderField(f({ type: 'badge', count: 3, value: '無視' })))
    expect(c.querySelector('.badge-content')!.textContent).toBe('3')
    expect(c.querySelector('.badge-label')!.textContent).toBe('L')
    expect(dom(Badge.renderField(f({ type: 'badge' }))).querySelector('.badge-label')!.textContent).toBe('L')
  })

  it('the label survives when value is shown: caption plus aria-label', () => {
    const s = dom(StatusLabel.renderField(f({ type: 'status_label', label: 'ステータス', value: '処理中' })))
    expect(s.querySelector('.field-caption')!.textContent).toBe('ステータス')
    expect(s.querySelector('.mokkun-status-label')!.getAttribute('aria-label')).toBe('ステータス: 処理中')
    const c = dom(Chip.renderField(f({ type: 'chip', label: '区分', value: 'VIP' })))
    expect(c.querySelector('.field-caption')!.textContent).toBe('区分')
    expect(c.querySelector('.mokkun-chip')!.getAttribute('aria-label')).toBe('区分: VIP')
    const b = dom(Badge.renderField(f({ type: 'badge', label: '通知', value: '新着' })))
    expect(b.querySelector('.field-caption')!.textContent).toBe('通知')
    expect(b.querySelector('.mokkun-badge')!.getAttribute('aria-label')).toBe('通知: 新着')
    // value が無ければ従来どおり（キャプション・aria-label なし）
    const plain = dom(StatusLabel.renderField(f({ type: 'status_label' })))
    expect(plain.querySelector('.field-caption')).toBeNull()
    expect(plain.querySelector('.mokkun-status-label')!.hasAttribute('aria-label')).toBe(false)
  })
})

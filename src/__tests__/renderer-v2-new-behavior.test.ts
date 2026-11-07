/**
 * v2 レンダラー（mount）: 一括操作の選択行、Section.actions、requiredWhen、条件の in / notEquals、
 * ロール・状態の切替、リンクのナビゲーション
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mountViewV2 as mountRaw, type V2Controller } from '../renderer-v2'
import { Mokkun } from '../lib'
import { field, load, mk } from './v2-test-helpers'

const mounted: V2Controller[] = []
const mountViewV2: typeof mountRaw = (...args) => {
  const c = mountRaw(...args)
  mounted.push(c)
  return c
}
let container: HTMLElement

beforeEach(() => {
  document.body.innerHTML = ''
  container = document.createElement('div')
  document.body.appendChild(container)
})
afterEach(() => {
  mounted.splice(0).forEach(c => c.destroy())
})

const click = (el: Element | null) => (el as HTMLElement).click()
const q = <T extends HTMLElement>(sel: string) => container.querySelector<T>(sel)!
const set = (el: HTMLInputElement | HTMLSelectElement, value: string) => {
  el.value = value
  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))
}
const check = (el: HTMLInputElement, on: boolean) => {
  el.checked = on
  el.dispatchEvent(new Event('change', { bubbles: true }))
}

describe('list.bulkActions', () => {
  const schema = load(mk({}, {
    sections: [{
      id: 'stock',
      title: '在庫',
      kind: 'list',
      list: {
        columns: [{ id: 'name', label: '商品名', to: 'w' }],
        rows: [{ id: 'A-1', name: 'a' }, { id: 'B-2', name: 'b' }, { id: 'C-3', name: 'c' }],
        selection: 'multiple',
        bulkActions: [
          { id: 'order', label: '発注候補に追加する', kind: 'custom' },
          { id: 'go', label: '一覧へ', kind: 'navigate', to: 'w' },
          { id: 'del', label: '削除する', kind: 'custom', confirm: { message: '削除しますか？' } },
        ],
      },
    }],
  }))

  it('選択した行の ID を payload.selectedRows で渡す（section も付く）', () => {
    const onAction = vi.fn()
    mountViewV2(container, schema, 'v', { onAction })
    const boxes = container.querySelectorAll<HTMLInputElement>('input[data-row-select]')
    check(boxes[0], true)
    check(boxes[2], true)
    click(q('[data-action="order"]'))
    expect(onAction).toHaveBeenCalledWith('order', 'custom', { section: 'stock', selectedRows: ['A-1', 'C-3'] })
  })

  it('何も選ばなくても押せる（selectedRows は空配列。ボタンは無効化しない）', () => {
    const onAction = vi.fn()
    mountViewV2(container, schema, 'v', { onAction })
    expect(q<HTMLButtonElement>('[data-action="order"]').disabled).toBe(false)
    click(q('[data-action="order"]'))
    expect(onAction).toHaveBeenCalledWith('order', 'custom', { section: 'stock', selectedRows: [] })
  })

  it('navigate の一括操作は onNavigate、confirm 付きは確定してから実行する', () => {
    const onAction = vi.fn()
    const onNavigate = vi.fn()
    mountViewV2(container, schema, 'v', { onAction, onNavigate })
    click(q('[data-action="go"]'))
    expect(onNavigate).toHaveBeenCalledWith('w')
    check(container.querySelectorAll<HTMLInputElement>('input[data-row-select]')[1], true)
    click(q('[data-action="del"]'))
    expect(onAction).not.toHaveBeenCalled()
    click(q('dialog [data-dialog-confirm]'))
    expect(onAction).toHaveBeenCalledWith('del', 'custom', { section: 'stock', selectedRows: ['B-2'] })
  })

  it('一覧の to のセルは navigate と同じ経路で遷移する', () => {
    const onNavigate = vi.fn()
    mountViewV2(container, schema, 'v', { onNavigate })
    click(q('tbody a.dads-link'))
    expect(onNavigate).toHaveBeenCalledWith('w')
  })
})

describe('Section.actions', () => {
  const schema = load(mk({}, {
    sections: [
      {
        id: 'filter',
        title: '条件',
        actions: [
          { id: 'search', label: '検索する', kind: 'custom' },
          { id: 'clear', label: 'リセット', kind: 'reset', style: 'tertiary' },
          { id: 'go', label: '移動', kind: 'navigate', to: 'w' },
        ],
        fields: [
          field({ item: 'kw', default: '初期' }),
          field({ item: 'st', component: 'radio', default: 'a', options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }] }),
          field({ item: 'on', component: 'toggle', default: false }),
        ],
      },
      { id: 'other', title: '別', fields: [field({ item: 'memo', default: '残す' })] },
    ],
  }))

  it('custom は { section } つきで onAction、navigate は onNavigate', () => {
    const onAction = vi.fn()
    const onNavigate = vi.fn()
    mountViewV2(container, schema, 'v', { onAction, onNavigate })
    click(q('[data-action="search"]'))
    expect(onAction).toHaveBeenCalledWith('search', 'custom', { section: 'filter' })
    click(q('[data-action="go"]'))
    expect(onNavigate).toHaveBeenCalledWith('w')
  })

  it('reset はその Section の項目だけ初期値に戻す', () => {
    const onAction = vi.fn()
    mountViewV2(container, schema, 'v', { onAction })
    set(q<HTMLInputElement>('input[name="kw"]'), '変更')
    check(q<HTMLInputElement>('input[name="st"][value="b"]'), true)
    click(q('#v-on'))
    expect(q<HTMLInputElement>('input[name="on"]').value).toBe('true')
    set(q<HTMLInputElement>('input[name="memo"]'), '別Sectionの変更')

    click(q('[data-action="clear"]'))
    expect(q<HTMLInputElement>('input[name="kw"]').value).toBe('初期')
    expect(q<HTMLInputElement>('input[name="st"][value="a"]').checked).toBe(true)
    expect(q('#v-on').getAttribute('aria-checked')).toBe('false')
    expect(q<HTMLInputElement>('input[name="on"]').value).toBe('false')
    expect(q<HTMLInputElement>('input[name="memo"]').value).toBe('別Sectionの変更')
    expect(onAction).toHaveBeenCalledWith('clear', 'reset', { section: 'filter' })
  })

  it('reset 後は条件（visibleWhen）も評価し直す', () => {
    const s = load(mk({}, {
      sections: [
        { id: 'a', title: 'A', actions: [{ id: 'clear', label: 'R', kind: 'reset' }], fields: [field({ item: 'sel', component: 'radio', default: 'x', options: [{ value: 'x', label: 'X' }, { value: 'y', label: 'Y' }] })] },
        { id: 'b', title: 'B', fields: [field({ item: 'dep', visibleWhen: { item: 'sel', equals: 'y' } })] },
      ],
    }))
    mountViewV2(container, s, 'v')
    check(q<HTMLInputElement>('input[name="sel"][value="y"]'), true)
    expect(q('[data-field="dep"]').hasAttribute('hidden')).toBe(false)
    click(q('[data-action="clear"]'))
    expect(q('[data-field="dep"]').hasAttribute('hidden')).toBe(true)
  })
})

describe('条件: requiredWhen / in / notEquals', () => {
  const schema = load(mk({}, {
    sections: [{
      id: 's',
      title: 'S',
      fields: [
        field({ item: 'reason', component: 'radio', default: 'seeking', options: [{ value: 'work', label: '就労' }, { value: 'seeking', label: '求職' }, { value: 'other', label: 'その他' }] }),
        field({ item: 'employer', label: '勤務先', required: false, requiredWhen: { item: 'reason', equals: 'work' } }),
        field({ item: 'detail', label: '詳細', visibleWhen: { item: 'reason', in: ['work', 'seeking'] } }),
        field({ item: 'notwork', label: '就労以外', visibleWhen: { item: 'reason', notEquals: 'work' } }),
      ],
    }]
  }))
  const badge = () => q('[data-field="employer"] .dads-form-control-label__requirement')

  it('requiredWhen: 条件の成否で ※必須 / ※任意 と required 属性が切り替わる', () => {
    mountViewV2(container, schema, 'v')
    expect(badge().textContent).toBe('※任意')
    expect(q<HTMLInputElement>('input[name="employer"]').required).toBe(false)
    check(q<HTMLInputElement>('input[name="reason"][value="work"]'), true)
    expect(badge().textContent).toBe('※必須')
    expect(badge().getAttribute('data-required')).toBe('true')
    expect(q<HTMLInputElement>('input[name="employer"]').required).toBe(true)
    check(q<HTMLInputElement>('input[name="reason"][value="other"]'), true)
    expect(badge().textContent).toBe('※任意')
    expect(q<HTMLInputElement>('input[name="employer"]').required).toBe(false)
  })

  it('visibleWhen の in / notEquals が変更に追随する', () => {
    mountViewV2(container, schema, 'v')
    const hidden = (item: string) => q(`[data-field="${item}"]`).hasAttribute('hidden')
    expect([hidden('detail'), hidden('notwork')]).toEqual([false, false])
    check(q<HTMLInputElement>('input[name="reason"][value="work"]'), true)
    expect([hidden('detail'), hidden('notwork')]).toEqual([false, true])
    check(q<HTMLInputElement>('input[name="reason"][value="other"]'), true)
    expect([hidden('detail'), hidden('notwork')]).toEqual([true, false])
  })

  it('複数選択 checkbox の in は「どれかを含む」', () => {
    const s = load(mk({}, {
      sections: [{ id: 's', title: 'S', fields: [
        field({ item: 'tags', component: 'checkbox', multiple: true, options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }, { value: 'c', label: 'C' }] }),
        field({ item: 'dep', visibleWhen: { item: 'tags', in: ['b', 'c'] } }),
      ] }],
    }))
    mountViewV2(container, s, 'v')
    expect(q('[data-field="dep"]').hasAttribute('hidden')).toBe(true)
    check(q<HTMLInputElement>('input[name="tags"][value="a"]'), true)
    expect(q('[data-field="dep"]').hasAttribute('hidden')).toBe(true)
    check(q<HTMLInputElement>('input[name="tags"][value="c"]'), true)
    expect(q('[data-field="dep"]').hasAttribute('hidden')).toBe(false)
  })

  it('Section.visibleWhen の in', () => {
    const s = load(mk({}, {
      sections: [
        { id: 'a', title: 'A', fields: [field({ item: 'sel', component: 'select', options: [{ value: 'x', label: 'X' }, { value: 'y', label: 'Y' }, { value: 'z', label: 'Z' }] })] },
        { id: 'b', title: 'B', visibleWhen: { item: 'sel', in: ['x', 'y'] }, fields: [field({ item: 'inner' })] },
      ],
    }))
    mountViewV2(container, s, 'v')
    const sec = () => q('[data-section-id="b"]')
    expect(sec().hasAttribute('hidden')).toBe(true)
    set(q<HTMLSelectElement>('select[name="sel"]'), 'y')
    expect(sec().hasAttribute('hidden')).toBe(false)
    set(q<HTMLSelectElement>('select[name="sel"]'), 'z')
    expect(sec().hasAttribute('hidden')).toBe(true)
  })

  it('date precision: month の y-m で比較する（1 桁の月は 0 埋め）', () => {
    const s = load(mk({}, {
      sections: [{ id: 's', title: 'S', fields: [
        field({ item: 'when', component: 'date', precision: 'month' }),
        field({ item: 'dep', visibleWhen: { item: 'when', equals: '2026-04' } }),
      ] }],
    }))
    mountViewV2(container, s, 'v')
    expect(q('[data-field="dep"]').hasAttribute('hidden')).toBe(true)
    set(q<HTMLInputElement>('input[name="when.year"]'), '2026')
    set(q<HTMLInputElement>('input[name="when.month"]'), '4')
    expect(q('[data-field="dep"]').hasAttribute('hidden')).toBe(false)
  })

  it('repeatable 内の requiredWhen はそのグループ内の項目を参照する', () => {
    const s = load(mk({}, {
      sections: [{ id: 'r', title: 'R', repeatable: { min: 2 }, fields: [
        field({ item: 'kind', component: 'radio', default: 'a', options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }] }),
        field({ item: 'val', required: false, requiredWhen: { item: 'kind', equals: 'b' } }),
      ] }],
    }))
    mountViewV2(container, s, 'v')
    const groups = container.querySelectorAll('[data-repeat-group]')
    check(groups[1].querySelector<HTMLInputElement>('input[type="radio"][value="b"]')!, true)
    const text = (g: Element) => g.querySelector('[data-field="val"] .dads-form-control-label__requirement')!.textContent
    expect([text(groups[0]), text(groups[1])]).toEqual(['※任意', '※必須'])
  })
})

describe('固定行の表の入力セル', () => {
  it('入力は form に含まれ、リセットで初期値に戻る', () => {
    const s = load(mk({}, {
      sections: [{ id: 'l', title: 'L', kind: 'list', list: { columns: [{ id: 'sku', label: 'SKU' }, { id: 'qty', label: '実数', field: { component: 'number' } }], rows: [{ sku: 'S1', qty: 5 }] } }],
      secondaryActions: [{ id: 'clear', label: 'R', kind: 'reset' }],
    }))
    mountViewV2(container, s, 'v')
    const input = q<HTMLInputElement>('input[name="S1.qty"]')
    set(input, '9')
    expect(new FormData(container.querySelector('form')!).get('S1.qty')).toBe('9')
    click(q('[data-action="clear"]'))
    expect(q<HTMLInputElement>('input[name="S1.qty"]').value).toBe('5')
  })
})

describe('ロールと状態の切替（mount / Mokkun.init）', () => {
  const schema = load(mk({
    app: { name: 'A', roles: ['店舗', '本部'], navigation: [{ group: '本部専用', role: '本部', items: [{ view: 'v', label: '本部専用' }] }] },
  }, {
    states: { error: { message: 'エラーです' }, loading: { message: '読み込み中です' } },
    secondaryActions: [{ id: 'hq', label: '本部操作', kind: 'custom', role: '本部' }],
    sections: [{ id: 's', title: 'S', fields: [field()] }],
  }))

  it('mountViewV2 は 5 番目の引数（または callbacks）で state / role を受け取る', () => {
    mountViewV2(container, schema, 'v', {}, { state: 'error', role: '店舗' })
    expect(q('.dads-notification-banner[data-type="error"]')).not.toBeNull()
    expect(container.querySelector('[data-action="hq"]')).toBeNull()
    container.innerHTML = ''
    mountViewV2(container, schema, 'v', { state: 'loading', role: '本部' })
    expect(container.querySelector('.dads-progress-indicator')).not.toBeNull()
    expect(container.querySelector('.mokkun-v2')!.getAttribute('data-state')).toBe('loading')
  })

  it('Mokkun.init の role / initialState、setRole / setState、画面遷移で状態が通常に戻る', async () => {
    const yaml = [
      'mokkun: 2',
      'app: { name: A, roles: [店舗, 本部] }',
      'views:',
      '  v:',
      '    title: V',
      '    goal: g',
      '    states: { error: { message: エラーです } }',
      '    secondaryActions:',
      '      - { id: hq, label: 本部操作, kind: custom, role: 本部 }',
      '      - { id: go, label: 移動, kind: navigate, to: w }',
      '    sections: [{ id: s, title: S, fields: [{ item: a, label: A, component: text }] }]',
      '  w:',
      '    title: W',
      '    goal: g',
      '    sections: [{ id: s, title: S, fields: [] }]',
    ].join('\n')
    const instance = await Mokkun.init({ container, yamlContent: yaml, role: '店舗', initialState: 'error' })
    try {
      expect(instance.role).toBe('店舗')
      expect(instance.viewState).toBe('error')
      expect(instance.getAvailableStates()).toEqual(['normal', 'error'])
      expect(q('.dads-notification-banner[data-type="error"]')).not.toBeNull()
      expect(container.querySelector('[data-action="hq"]')).toBeNull()

      instance.setRole('本部')
      expect(container.querySelector('[data-action="hq"]')).not.toBeNull()
      instance.setState('normal')
      expect(container.querySelector('.dads-notification-banner')).toBeNull()
      instance.setState('error')
      click(q('[data-action="go"]'))
      expect(instance.currentScreen).toBe('w')
      expect(instance.viewState).toBe('normal')
      instance.showScreen('v')
      instance.setState('error')
      instance.setRole(undefined)
      expect(container.querySelector('[data-action="hq"]')).not.toBeNull()
    } finally {
      instance.destroy()
    }
  })
})

describe('summary の to', () => {
  it('KPI の値をクリックすると navigate される', () => {
    const s = load(mk({}, { sections: [{ id: 'k', title: 'K', kind: 'summary', fields: [field({ item: 'cnt', component: 'number', value: 3, to: 'w' })] }] }))
    const onNavigate = vi.fn()
    mountViewV2(container, s, 'v', { onNavigate })
    click(q('dd a.dads-link'))
    expect(onNavigate).toHaveBeenCalledWith('w')
  })
})

/**
 * parseV2: 第 2 版のルールが前提とするキーの検証（エラーの path と文言）
 */

import { describe, it, expect } from 'vitest'
import { parseV2 } from '../parser/v2/parse-v2'
import { errorMessages, errorPaths, field, mk } from './v2-test-helpers'

const withField = (over: Record<string, any>, extra: Record<string, any> = {}) =>
  mk(extra, { sections: [{ id: 's', title: 'S', fields: [field(over)] }] })
const withList = (list: Record<string, any>, extra: Record<string, any> = {}) =>
  mk(extra, { sections: [{ id: 'l', title: 'L', kind: 'list', list }] })
const FP = 'views.v.sections[0].fields[0]'
const LP = 'views.v.sections[0].list'
const col = { id: 'a', label: 'A' }

describe('list.columns', () => {
  it('type の列挙と to の参照先', () => {
    expect(parseV2(withList({ columns: [{ ...col, type: 'status', to: 'w' }] })).success).toBe(true)
    expect(errorPaths(withList({ columns: [{ ...col, type: 'money' }] }))).toContain(`${LP}.columns[0].type`)
    expect(errorMessages(withList({ columns: [{ ...col, to: 'nowhere' }] }))).toContain(`${LP}.columns[0].to: Unknown view "nowhere"`)
  })

  it('field は list.rows が必要で、item / label / 条件は持てず、component は text・number・select・checkbox だけ', () => {
    const c = (f: Record<string, any>) => ({ columns: [{ ...col, field: f }], rows: [{ a: 1 }] })
    expect(parseV2(withList(c({ component: 'number' }))).success).toBe(true)
    expect(parseV2(withList(c({ component: 'select', options: [{ value: 'x', label: 'X' }] }))).success).toBe(true)
    expect(parseV2(withList(c({ component: 'checkbox' }))).success).toBe(true)
    expect(errorPaths(withList({ columns: [{ ...col, field: { component: 'text' } }] }))).toContain(`${LP}.columns[0].field`)
    expect(errorPaths(withList(c({ component: 'date' })))).toContain(`${LP}.columns[0].field.component`)
    expect(errorPaths(withList(c({ component: 'text', item: 'x', label: 'X' })))).toEqual(
      expect.arrayContaining([`${LP}.columns[0].field.item`, `${LP}.columns[0].field.label`]),
    )
    expect(errorPaths(withList(c({ component: 'text', visibleWhen: { item: 'a', equals: 1 } })))).toContain(`${LP}.columns[0].field.visibleWhen`)
  })

  it('field の中身は通常の Field と同じに検証される（unit・maxSize など）', () => {
    const r = (f: Record<string, any>) => errorPaths(withList({ columns: [{ ...col, field: f }], rows: [{}] }))
    expect(r({ component: 'text', width: 'huge' })).toContain(`${LP}.columns[0].field.width`)
    expect(r({ component: 'text', precision: 'month' })).toContain(`${LP}.columns[0].field.precision`)
  })

  it('rows は object の配列', () => {
    expect(errorPaths(withList({ columns: [col], rows: 'x' }))).toContain(`${LP}.rows`)
    expect(errorPaths(withList({ columns: [col], rows: [1] }))).toContain(`${LP}.rows[0]`)
  })
})

describe('list.bulkActions', () => {
  const bulk = [{ id: 'bulk', label: '一括' }]
  it('selection: multiple のときだけ', () => {
    expect(parseV2(withList({ columns: [col], selection: 'multiple', bulkActions: bulk })).success).toBe(true)
    for (const selection of [undefined, 'none', 'single']) {
      expect(errorPaths(withList({ columns: [col], selection, bulkActions: bulk }))).toContain(`${LP}.bulkActions`)
    }
  })

  it('各 action は Action として検証される（navigate は to が必要）', () => {
    const doc = withList({ columns: [col], selection: 'multiple', bulkActions: [{ id: 'n', label: 'N', kind: 'navigate' }] })
    expect(errorPaths(doc)).toContain(`${LP}.bulkActions[0].to`)
  })

  it('action id の重複は View 内で検出される（主・副・rowActions・bulkActions・Section.actions）', () => {
    const doc = mk({}, {
      primaryAction: { id: 'dup', label: 'P' },
      sections: [
        { id: 'l', title: 'L', kind: 'list', actions: [{ id: 'dup2', label: 'S' }], list: { columns: [col], selection: 'multiple', bulkActions: [{ id: 'dup', label: 'B' }], rowActions: [{ id: 'dup2', label: 'R' }] } },
      ],
    })
    const paths = errorPaths(doc)
    expect(paths).toContain(`${LP}.bulkActions[0].id`)
    expect(paths).toContain(`${LP}.rowActions[0].id`)
  })
})

describe('role', () => {
  const roles = { app: { name: 'A', roles: ['x', 'y'] } }
  it('Action.role / NavGroup.role / Notice.role は app.roles の値', () => {
    expect(parseV2(mk(roles, { primaryAction: { id: 'p', label: 'P', role: ['x', 'y'] } })).success).toBe(true)
    expect(errorMessages(mk(roles, { primaryAction: { id: 'p', label: 'P', role: 'z' } }))[0]).toContain('Unknown role "z"')
    expect(errorPaths(mk({ app: { ...roles.app, navigation: [{ group: 'G', role: 'z', items: [{ view: 'v' }] }] } }))).toContain('app.navigation[0].role')
    expect(errorPaths(mk({ app: { ...roles.app, notifications: [{ message: 'm', role: ['x', 'q'] }] } }))).toContain('app.notifications[0].role')
  })

  it('app.roles が無ければ値は何でもよい。形（文字列か空でない配列）は常に検証する', () => {
    expect(parseV2(mk({}, { primaryAction: { id: 'p', label: 'P', role: 'anyone' } })).success).toBe(true)
    expect(errorPaths(mk({}, { primaryAction: { id: 'p', label: 'P', role: [] } }))).toContain('views.v.primaryAction.role')
    expect(errorPaths(mk({}, { primaryAction: { id: 'p', label: 'P', role: 3 } }))).toContain('views.v.primaryAction.role')
  })

  it('role は Section.actions と bulkActions の action にも書ける', () => {
    const doc = mk(roles, { sections: [{ id: 's', title: 'S', actions: [{ id: 'a', label: 'A', role: 'q' }], fields: [] }] })
    expect(errorPaths(doc)).toContain('views.v.sections[0].actions[0].role')
  })
})

describe('Section.actions', () => {
  const sec = (actions: unknown) => mk({}, { sections: [{ id: 's', title: 'S', actions, fields: [] }] })
  it('primary は不可（View だけが持つ）', () => {
    expect(parseV2(sec([{ id: 'a', label: 'A', style: 'secondary' }, { id: 'b', label: 'B', style: 'tertiary' }])).success).toBe(true)
    expect(errorMessages(sec([{ id: 'a', label: 'A', style: 'primary' }]))[0]).toContain('only a View has a primary')
  })

  it('配列で、navigate の遷移先は存在する view', () => {
    expect(errorPaths(sec('x'))).toContain('views.v.sections[0].actions')
    expect(errorPaths(sec([{ id: 'a', label: 'A', kind: 'navigate', to: 'nowhere' }]))).toContain('views.v.sections[0].actions[0].to')
  })

  it('action id は View 全体で一意', () => {
    const doc = mk({}, { primaryAction: { id: 'x', label: 'P' }, sections: [{ id: 's', title: 'S', actions: [{ id: 'x', label: 'A' }], fields: [] }] })
    expect(errorPaths(doc)).toContain('views.v.sections[0].actions[0].id')
  })
})

describe('Field の新しいキー', () => {
  it('precision は date だけ', () => {
    expect(parseV2(withField({ component: 'date', precision: 'month' })).success).toBe(true)
    expect(errorMessages(withField({ precision: 'month' }))[0]).toContain('precision is only valid for component "date"')
    expect(errorPaths(withField({ component: 'date', precision: 'year' }))).toContain(`${FP}.precision`)
  })

  it('maxSize の書式と accept の値', () => {
    expect(parseV2(withField({ component: 'file', maxSize: '10MB', accept: ['.pdf'] })).success).toBe(true)
    for (const maxSize of ['10', '10 MB', '1.5MB', '10mb', 10]) {
      expect(errorPaths(withField({ component: 'file', maxSize }))).toContain(`${FP}.maxSize`)
    }
    for (const accept of ['image', 'pdf', 'document', '.pdf', 'image/png', ['.pdf', 'image/png']]) {
      expect(parseV2(withField({ component: 'file', accept })).success).toBe(true)
    }
    for (const accept of ['spreadsheet', [], [1], 3]) {
      expect(errorPaths(withField({ component: 'file', accept }))).toContain(`${FP}.accept`)
    }
  })

  it('links は { label, href } の配列', () => {
    expect(parseV2(withField({ links: [{ label: '規約', href: 'https://example.jp' }] })).success).toBe(true)
    expect(errorPaths(withField({ links: 'x' }))).toContain(`${FP}.links`)
    expect(errorPaths(withField({ links: [{ label: '規約' }] }))).toContain(`${FP}.links[0].href`)
  })

  it('autocomplete は空でない文字列、unit は文字列', () => {
    expect(parseV2(withField({ autocomplete: 'bday', unit: '円' })).success).toBe(true)
    expect(errorPaths(withField({ autocomplete: '' }))).toContain(`${FP}.autocomplete`)
    expect(errorPaths(withField({ unit: 3 }))).toContain(`${FP}.unit`)
  })

  it('Field.to は readonly / summary の Section だけで、view が存在すること', () => {
    const sec = (kind: string, to: string) => mk({}, { sections: [{ id: 's', title: 'S', kind, fields: [field({ to })] }] })
    expect(parseV2(sec('summary', 'w')).success).toBe(true)
    expect(parseV2(sec('readonly', 'w')).success).toBe(true)
    expect(errorPaths(sec('form', 'w'))).toContain(`${FP}.to`)
    expect(errorMessages(sec('readonly', 'nowhere'))).toContain(`${FP}.to: Unknown view "nowhere"`)
  })

  it('pattern 由来の項目の to も、form の Section では拒否する', () => {
    const doc = mk({ patterns: { p: { fields: [field({ item: 'x', to: 'w' })] } } }, { sections: [{ id: 's', title: 'S', use: 'p' }] })
    expect(errorPaths(doc)).toContain('views.v.sections[0].use')
  })
})

describe('Condition: equals / notEquals / in', () => {
  const vis = (c: unknown) => mk({}, { sections: [{ id: 's', title: 'S', fields: [field({ item: 'a' }), field({ item: 'b', visibleWhen: c })] }] })

  it('ちょうど 1 つ', () => {
    expect(parseV2(vis({ item: 'a', equals: 'x' })).success).toBe(true)
    expect(parseV2(vis({ item: 'a', notEquals: 'x' })).success).toBe(true)
    expect(parseV2(vis({ item: 'a', in: ['x', 1, false] })).success).toBe(true)
    expect(errorPaths(vis({ item: 'a' }))).toContain('views.v.sections[0].fields[1].visibleWhen.equals')
    expect(errorMessages(vis({ item: 'a', equals: 'x', in: ['y'] }))[0]).toContain('exactly one of equals, notEquals, in')
  })

  it('in は空でない配列、値は文字列・数値・真偽値', () => {
    expect(errorPaths(vis({ item: 'a', in: [] }))).toContain('views.v.sections[0].fields[1].visibleWhen.in')
    expect(errorPaths(vis({ item: 'a', in: [{}] }))).toContain('views.v.sections[0].fields[1].visibleWhen.in')
    expect(errorPaths(vis({ item: 'a', notEquals: {} }))).toContain('views.v.sections[0].fields[1].visibleWhen.notEquals')
  })

  it('参照先の項目が無ければエラー（notEquals / in でも）', () => {
    expect(errorPaths(vis({ item: 'ghost', in: ['x'] }))).toContain('views.v.sections[0].fields[1].visibleWhen.item')
    const sec = mk({}, { sections: [{ id: 's', title: 'S', visibleWhen: { item: 'ghost', notEquals: 1 }, fields: [] }] })
    expect(errorPaths(sec)).toContain('views.v.sections[0].visibleWhen.item')
  })
})

describe('requiredWhen', () => {
  const req = (over: Record<string, any>) => mk({}, { sections: [{ id: 's', title: 'S', fields: [field({ item: 'a' }), field({ item: 'b', ...over })] }] })

  it('visibleWhen と同じ検証（形・参照先）', () => {
    expect(parseV2(req({ required: false, requiredWhen: { item: 'a', equals: 'x' } })).success).toBe(true)
    expect(parseV2(req({ requiredWhen: { item: 'a', in: ['x', 'y'] } })).success).toBe(true)
    expect(errorPaths(req({ requiredWhen: { item: 'ghost', equals: 1 } }))).toContain('views.v.sections[0].fields[1].requiredWhen.item')
    expect(errorMessages(req({ requiredWhen: { item: 'a', equals: 1, notEquals: 2 } }))[0]).toContain('requiredWhen must have exactly one')
    expect(errorMessages(req({ requiredWhen: 'x' }))[0]).toContain('requiredWhen must be an object')
  })

  it('required: true とは併用できない', () => {
    expect(errorPaths(req({ required: true, requiredWhen: { item: 'a', equals: 1 } }))).toContain('views.v.sections[0].fields[1].requiredWhen')
  })

  it('pattern 内の requiredWhen は前置した id に書き換わる', () => {
    const doc = mk(
      { patterns: { p: { fields: [field({ item: 'k' }), field({ item: 'l', requiredWhen: { item: 'k', equals: 'x' } })] } } },
      { sections: [{ id: 'sec', title: 'S', use: 'p' }] },
    )
    expect(parseV2(doc).success).toBe(true)
  })
})

describe('Notice.until', () => {
  const n = (until: unknown) => mk({ app: { name: 'A', notifications: [{ message: 'm', until }] } })
  it('実在する ISO 日付だけ', () => {
    expect(parseV2(n('2026-11-20')).success).toBe(true)
    for (const bad of ['2026-02-30', '2026/11/20', '20261120', 3, '']) {
      expect(errorPaths(n(bad))).toContain('app.notifications[0].until')
    }
  })
})

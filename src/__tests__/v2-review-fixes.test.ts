/**
 * レビュー指摘の反映: rowActions の制限、YAML の日付、行キーの一意性、並べ替えとページ、未知キー、
 * 状態の色、ロール・状態の解決、loading、today、日付トークン、field エラーの状態ゲート ほか
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { load as loadYaml } from 'js-yaml'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { parseYamlV2 } from '../parser/yaml-parser'
import { parseV2 } from '../parser/v2/parse-v2'
import { compileV2Warnings } from '../parser/v2/compile-v2'
import { renderViewV2, mountViewV2 as mountRaw, type V2Controller } from '../renderer-v2'
import { statusColor, uniqueRowKeys } from '../renderer-v2/list-data'
import { dateToken, dateTokenOf } from '../renderer-v2/condition'
import { resolveToday } from '../renderer-v2/role'
import { Mokkun } from '../lib'
import { dom, errorMessages, errorPaths, field, load, mk, withFields, withList } from './v2-test-helpers'

const schemaJson = JSON.parse(readFileSync(join(resolve(__dirname, '../..'), 'schema-v2.json'), 'utf-8'))
const ajv = new Ajv({ allErrors: true, strict: false })
addFormats(ajv)
const validate = ajv.compile(schemaJson)

const yamlDoc = (body: string) => `mokkun: 2\napp: { name: A }\nviews:\n  v:\n    title: V\n    goal: g\n${body}`
const parseOk = (text: string) => {
  const r = parseYamlV2(text)
  if (!r.success) throw new Error(JSON.stringify(r.errors))
  return r.data
}
const col = (id: string, extra: Record<string, any> = {}) => ({ id, label: id.toUpperCase(), ...extra })

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

describe('list.rowActions は id / label / kind / to だけ', () => {
  const doc = (action: Record<string, any>) => mk({}, { sections: [{ id: 'l', title: 'L', kind: 'list', list: { columns: [col('a')], rowActions: [action] } }] })
  it('role / confirm / style / placement はパーサーもスキーマも拒否する', () => {
    expect(parseV2(doc({ id: 'o', label: '開く', kind: 'navigate', to: 'w' })).success).toBe(true)
    for (const extra of [{ role: 'x' }, { confirm: { message: 'm' } }, { style: 'danger' }, { placement: 'header' }]) {
      const key = Object.keys(extra)[0]
      expect(errorPaths(doc({ id: 'o', label: 'O', ...extra }))).toContain(`views.v.sections[0].list.rowActions[0].${key}`)
      expect(validate(doc({ id: 'o', label: 'O', ...extra }))).toBe(false)
      expect(validate.errors).toContainEqual(expect.objectContaining({ keyword: 'additionalProperties', params: { additionalProperty: key } }))
    }
  })
})

describe('YAML の日付（引用符なし）', () => {
  it('Notice.until は Date でも YYYY-MM-DD として検証・保持される', () => {
    const r = parseYamlV2(`mokkun: 2\napp:\n  name: A\n  notifications:\n    - { message: m, until: 2026-11-20 }\nviews:\n  v: { title: V, goal: g, sections: [] }\n`)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.app.notifications![0].until).toBe('2026-11-20')
    const html = renderViewV2(parseOk(`mokkun: 2\napp:\n  name: A\n  notifications:\n    - { message: 期限切れ, until: 2026-11-06 }\nviews:\n  v: { title: V, goal: g, sections: [] }\n`), 'v', { today: '2026-11-07' })
    expect(html).not.toContain('期限切れ')
  })

  it('date の default は入力欄に年・月・日として出る', () => {
    const s = parseOk(yamlDoc(`    sections:\n      - id: s\n        title: S\n        fields:\n          - { item: d, label: D, component: date, default: 2026-11-14 }\n`))
    const root = dom(renderViewV2(s, 'v'))
    expect(['year', 'month', 'day'].map(p => root.querySelector<HTMLInputElement>(`input[name="d.${p}"]`)!.value)).toEqual(['2026', '11', '14'])
  })

  it('readonly の value は日本語の日付で出る（YYYY-MM-DD も Date 由来も）', () => {
    const s = parseOk(yamlDoc(`    sections:\n      - id: s\n        title: S\n        kind: readonly\n        fields:\n          - { item: a, label: A, component: date, value: 2026-11-14 }\n          - { item: b, label: B, component: date, value: "2026-11-15" }\n          - { item: c, label: C, component: date, value: "2026年11月16日" }\n`))
    expect(Array.from(dom(renderViewV2(s, 'v')).querySelectorAll('dd')).map(e => e.textContent)).toEqual(['2026年11月14日', '2026年11月15日', '2026年11月16日'])
  })

  it('visibleWhen の equals に書いた日付は文字列として比べられる', () => {
    const s = parseOk(yamlDoc(`    sections:\n      - id: s\n        title: S\n        fields:\n          - { item: d, label: D, component: date, default: 2026-04-01 }\n          - { item: x, label: X, component: text, visibleWhen: { item: d, equals: 2026-04-01 } }\n`))
    expect(s.views.v.sections[0].fields![1].visibleWhen!.equals).toBe('2026-04-01')
    expect(dom(renderViewV2(s, 'v')).querySelector('[data-field="x"]')!.hasAttribute('hidden')).toBe(false)
  })

  it('list.rows の日付は文字列になり、スキーマの値の型（スカラー）に収まる', () => {
    const s = parseOk(yamlDoc(`    sections:\n      - id: l\n        title: L\n        kind: list\n        list:\n          columns: [{ id: at, label: At, type: date }]\n          rows: [{ at: 2026-11-07 }, { at: 2026-12 }]\n`))
    expect(Array.from(dom(renderViewV2(s, 'v')).querySelectorAll('tbody td')).map(e => e.textContent)).toEqual(['2026年11月7日', '2026年12月'])
  })
})

describe('list.rows の値はスカラー', () => {
  const rows = (r: unknown) => mk({}, { sections: [{ id: 'l', title: 'L', kind: 'list', list: { columns: [col('a')], rows: r } }] })
  it('文字列・数値・真偽値・null だけ（パーサーとスキーマ）', () => {
    expect(parseV2(rows([{ a: 'x', b: 1, c: true, d: null }])).success).toBe(true)
    expect(validate(rows([{ a: 'x', b: 1, c: true, d: null }]))).toBe(true)
    expect(errorPaths(rows([{ a: { x: 1 } }]))).toContain('views.v.sections[0].list.rows[0].a')
    expect(errorPaths(rows([{ a: [1] }]))).toContain('views.v.sections[0].list.rows[0].a')
    expect(validate(rows([{ a: [1] }]))).toBe(false)
  })
})

describe('行キーの一意性', () => {
  const rows = [{ name: 'A' }, { name: 'A' }, {}, { name: 1 }, { name: 3 }]
  it('uniqueRowKeys: 重複・空には #<添字>', () => {
    expect(uniqueRowKeys(['A', 'A', '', '1', '3'])).toEqual(['A', 'A#1', '#2', '1', '3'])
    expect(uniqueRowKeys(['A', 'A#1', 'A'])).toEqual(['A', 'A#1', 'A#2'])
    expect(uniqueRowKeys(['x', 'x', 'x#1']).length).toBe(3)
    expect(new Set(uniqueRowKeys(['x', 'x', 'x#1'])).size).toBe(3)
  })

  it('selectedRows と入力欄の name が一意になる', () => {
    const schema = withList({
      columns: [col('name'), { id: 'qty', label: 'Q', field: { component: 'number' } }],
      rows,
      selection: 'multiple',
      bulkActions: [{ id: 'bk', label: 'B' }],
    })
    const onAction = vi.fn()
    mountViewV2(container, schema, 'v', { onAction })
    const ids = Array.from(container.querySelectorAll('tbody tr')).map(tr => tr.getAttribute('data-row-id'))
    expect(ids).toEqual(['A', 'A#1', '#2', '1', '3'])
    const names = Array.from(container.querySelectorAll<HTMLInputElement>('tbody input[type="number"]')).map(i => i.name)
    expect(new Set(names).size).toBe(5)
    container.querySelectorAll<HTMLInputElement>('input[data-row-select]').forEach(i => {
      i.checked = true
    })
    ;(container.querySelector('[data-action="bk"]') as HTMLElement).click()
    expect(onAction.mock.calls[0][2].selectedRows).toEqual(ids)
  })
})

describe('rows + pageSize + 並べ替え', () => {
  const schema = withList({ columns: [col('n', { type: 'number', sortable: true })], rows: [{ n: 5 }, { n: 1 }, { n: 3 }, { n: 10 }, { n: 2 }], paging: { pageSize: 2 } })
  const visible = () => Array.from(container.querySelectorAll('tbody tr:not([hidden]) td')).map(td => td.textContent)

  it('全行を並べ替えてから先頭ページを出す（数値順）', () => {
    mountViewV2(container, schema, 'v')
    expect(visible()).toEqual(['5', '1'])
    const sort = container.querySelector<HTMLElement>('[data-sort="n"]')!
    sort.click()
    expect(visible()).toEqual(['1', '2'])
    sort.click()
    expect(visible()).toEqual(['10', '5'])
    expect(container.querySelectorAll('tbody tr').length).toBe(5)
  })

  it('桁区切りの数値も数として比べる', () => {
    const s = withList({ columns: [col('n', { type: 'number', sortable: true })], rows: [{ n: 1000 }, { n: 200 }, { n: 30000 }] })
    mountViewV2(container, s, 'v')
    container.querySelector<HTMLElement>('[data-sort="n"]')!.click()
    expect(Array.from(container.querySelectorAll('tbody td')).map(td => td.textContent)).toEqual(['200', '1,000', '30,000'])
  })
})

describe('パーサー: 数値の範囲', () => {
  it('paging.pageSize は 1 以上の整数、repeatable.min は 0 以上、max は 1 以上の整数', () => {
    const page = (pageSize: unknown) => mk({}, { sections: [{ id: 'l', title: 'L', kind: 'list', list: { columns: [col('a')], paging: { pageSize } } }] })
    expect(parseV2(page(20)).success).toBe(true)
    for (const bad of [0, -1, 1.5, '10']) expect(errorPaths(page(bad))).toContain('views.v.sections[0].list.paging.pageSize')
    const rep = (repeatable: unknown) => mk({}, { sections: [{ id: 's', title: 'S', repeatable, fields: [field()] }] })
    expect(parseV2(rep({ min: 0, max: 1 })).success).toBe(true)
    expect(errorPaths(rep({ min: -1 }))).toContain('views.v.sections[0].repeatable.min')
    expect(errorPaths(rep({ min: 1.5 }))).toContain('views.v.sections[0].repeatable.min')
    expect(errorPaths(rep({ max: 0 }))).toContain('views.v.sections[0].repeatable.max')
    expect(errorPaths(rep({ max: 'x' }))).toContain('views.v.sections[0].repeatable.max')
  })
})

describe('パーサー: 未知のキーはエラー（schema-v2.json の additionalProperties: false と同じ）', () => {
  const field0 = (over: Record<string, any>) => mk({}, { sections: [{ id: 's', title: 'S', fields: [field(over)] }] })
  const sec0 = (over: Record<string, any>) => mk({}, { sections: [{ id: 's', title: 'S', fields: [], ...over }] })

  it('Field（props の中は自由）', () => {
    expect(errorPaths(field0({ bogus: 1 }))).toContain('views.v.sections[0].fields[0].bogus')
    expect(parseV2(field0({ props: { anything: 1 } })).success).toBe(true)
    expect(errorMessages(field0({ bogus: 1 }))[0]).toContain('Unknown key "bogus"')
  })
  it('Section / View / states / Action / 確認 / List / 列 / paging / repeatable', () => {
    expect(errorPaths(sec0({ bogus: 1 }))).toContain('views.v.sections[0].bogus')
    expect(errorPaths(mk({}, { bogus: 1 }))).toContain('views.v.bogus')
    expect(errorPaths(mk({}, { states: { error: { message: 'e' }, bogus: { message: 'x' } } }))).toContain('views.v.states.bogus')
    expect(errorPaths(mk({}, { states: { error: { message: 'e', extra: 1 } } }))).toContain('views.v.states.error.extra')
    expect(errorPaths(mk({}, { primaryAction: { id: 'p', label: 'P', bogus: 1 } }))).toContain('views.v.primaryAction.bogus')
    expect(errorPaths(mk({}, { primaryAction: { id: 'p', label: 'P', confirm: { message: 'm', title: 't' } } }))).toContain('views.v.primaryAction.confirm.title')
    const list = (l: Record<string, any>) => mk({}, { sections: [{ id: 'l', title: 'L', kind: 'list', list: { columns: [col('a')], ...l } }] })
    expect(errorPaths(list({ bogus: 1 }))).toContain('views.v.sections[0].list.bogus')
    expect(errorPaths(list({ columns: [{ ...col('a'), bogus: 1 }] }))).toContain('views.v.sections[0].list.columns[0].bogus')
    expect(errorPaths(list({ paging: { pageSize: 5, bogus: 1 } }))).toContain('views.v.sections[0].list.paging.bogus')
    expect(errorPaths(sec0({ repeatable: { min: 1, bogus: 1 }, fields: [field()] }))).toContain('views.v.sections[0].repeatable.bogus')
  })
  it('列の field は example / rules / links / precision なども持てない', () => {
    const colField = (f: Record<string, any>) => mk({}, { sections: [{ id: 'l', title: 'L', kind: 'list', list: { columns: [{ ...col('a'), field: { component: 'text', ...f } }], rows: [{}] } }] })
    for (const key of ['example', 'rules', 'links', 'whyRequired', 'format', 'accept', 'maxSize', 'precision']) {
      expect(errorPaths(colField({ [key]: key === 'rules' || key === 'links' ? [] : 'x' }))).toContain(`views.v.sections[0].list.columns[0].field.${key}`)
    }
  })
  it('app / header / Notice / NavGroup / NavItem / Flow / 手順 / 選択肢 / 条件 / リンク / トップレベル', () => {
    expect(errorPaths(mk({ app: { name: 'A', bogus: 1 } }))).toContain('app.bogus')
    expect(errorPaths(mk({ app: { name: 'A', header: { bogus: 1 } } }))).toContain('app.header.bogus')
    expect(errorPaths(mk({ app: { name: 'A', notifications: [{ message: 'm', bogus: 1 }] } }))).toContain('app.notifications[0].bogus')
    expect(errorPaths(mk({ app: { name: 'A', navigation: [{ group: 'G', bogus: 1, items: [{ view: 'v', extra: 1 }] }] } }))).toEqual(
      expect.arrayContaining(['app.navigation[0].bogus', 'app.navigation[0].items[0].extra']),
    )
    expect(errorPaths(mk({ flows: { f: { name: 'F', outcome: 'o', bogus: 1, steps: [{ view: 'v', extra: 1 }] } } }))).toEqual(
      expect.arrayContaining(['flows.f.bogus', 'flows.f.steps[0].extra']),
    )
    expect(errorPaths(field0({ component: 'radio', options: [{ value: 'a', label: 'A', extra: 1 }] }))).toContain('views.v.sections[0].fields[0].options[0].extra')
    expect(errorPaths(field0({ visibleWhen: { item: 'f', equals: 1, extra: 1 } }))).toContain('views.v.sections[0].fields[0].visibleWhen.extra')
    expect(errorPaths(field0({ links: [{ label: 'L', href: '/', extra: 1 }] }))).toContain('views.v.sections[0].fields[0].links[0].extra')
    expect(errorPaths({ ...mk(), bogus: 1 })).toContain('bogus')
  })
})

describe('accept / maxSize の書式', () => {
  const f = (over: Record<string, any>) => mk({}, { sections: [{ id: 's', title: 'S', fields: [field({ component: 'file', ...over })] }] })
  it('accept の配列要素は拡張子か MIME タイプ（旧来の ".pdf" 文字列は従来どおり）', () => {
    expect(parseV2(f({ accept: ['.pdf', 'image/png', 'image/*', 'application/vnd.ms-excel'] })).success).toBe(true)
    expect(parseV2(f({ accept: '.pdf' })).success).toBe(true)
    for (const bad of [['pdf'], ['.p df'], ['image/'], ['/png'], [' .pdf'], ['.pdf', 3]]) {
      expect(errorPaths(f({ accept: bad }))).toContain('views.v.sections[0].fields[0].accept')
      expect(validate(f({ accept: bad }))).toBe(false)
    }
    expect(errorMessages(f({ accept: ['pdf'] }))[0]).toContain('image / pdf / document')
  })
  it('maxSize は正のサイズ。エラー文に書式の例を出す', () => {
    expect(parseV2(f({ maxSize: '1KB' })).success).toBe(true)
    for (const bad of ['0MB', '00MB', '010MB', '-1MB', '10 MB', '10']) {
      expect(errorPaths(f({ maxSize: bad }))).toContain('views.v.sections[0].fields[0].maxSize')
      expect(validate(f({ maxSize: bad }))).toBe(false)
    }
    expect(errorMessages(f({ maxSize: '0MB' }))[0]).toContain('例: "10MB"')
  })
})

describe('photo_grid の accept', () => {
  it('accept を使い、なければ image', () => {
    const accept = (f: Record<string, any>) => dom(renderViewV2(withFields([field({ component: 'photo_grid', ...f })]), 'v')).querySelector('input[type="file"]')!.getAttribute('accept')
    expect(accept({})).toBe('image/*')
    expect(accept({ accept: ['.png', '.jpg'] })).toBe('.png,.jpg')
    expect(accept({ accept: 'pdf' })).toBe('.pdf,application/pdf')
  })
})

describe('状態ラベルの色（03-renderer-v2.md の表）', () => {
  it.each([
    ['未完了', 'gray'],
    ['承認待ち', 'yellow'],
    ['不承認', 'red'],
    ['完了予定', 'gray'],
    ['エラーなし', 'gray'],
    ['キャンセル待ち', 'yellow'],
    ['要確認', 'red'],
    ['対応済み', 'green'],
    ['送信済み', 'green'],
    ['欠品間近', 'yellow'],
    ['欠品', 'red'],
    ['エラー', 'red'],
    ['完了', 'green'],
    ['受付済', 'green'],
    ['審査中', 'light-blue'],
    ['処理中', 'light-blue'],
    ['下書き', 'gray'],
    ['未入力', 'gray'],
  ])('%s → %s', (label, color) => {
    expect(statusColor(label)).toBe(color)
  })
})

describe('Mokkun.init の role / initialState と setState / setRole', () => {
  const yaml = [
    'mokkun: 2',
    'app: { name: A, roles: [店舗, 本部] }',
    'views:',
    '  v:',
    '    title: V',
    '    goal: g',
    '    states: { error: { message: エラーです } }',
    '    secondaryActions: [{ id: go, label: 移動, kind: navigate, to: w }]',
    '    sections: [{ id: s, title: S, fields: [{ item: a, label: A, component: text }] }]',
    '  w:',
    '    title: W',
    '    goal: g',
    '    states: { success: { message: 完了 } }',
    '    sections: [{ id: s, title: S, fields: [] }]',
  ].join('\n')
  const init = (opts: Record<string, any>) => Mokkun.init({ container, yamlContent: yaml, ...opts })

  it('不正な initialState・ロール外の role は通常・未選択になり、viewState / role に反映される', async () => {
    const a = await init({ initialState: 'bogus' as never, role: '誰か' })
    expect(a.viewState).toBe('normal')
    expect(a.role).toBeUndefined()
    a.destroy()
    const b = await init({ initialState: 'success' })
    expect(b.viewState).toBe('normal')
    b.destroy()
    const c = await init({ initialState: 'error', role: '本部' })
    expect([c.viewState, c.role]).toEqual(['error', '本部'])
    c.destroy()
  })

  it('setState / setRole も同じ解決を通す', async () => {
    const i = await init({})
    i.setState('error')
    expect(i.viewState).toBe('error')
    i.setState('loading')
    expect(i.viewState).toBe('normal')
    i.setState('bogus' as never)
    expect(i.viewState).toBe('normal')
    i.setRole('本部')
    expect(i.role).toBe('本部')
    i.setRole('誰か')
    expect(i.role).toBeUndefined()
    i.setRole('')
    expect(i.role).toBeUndefined()
    i.destroy()
  })

  it('画面を移ると（ナビ・showScreen のどちらでも）状態は通常に戻る', async () => {
    const i = await init({ initialState: 'error' })
    expect(i.viewState).toBe('error')
    ;(container.querySelector('[data-action="go"]') as HTMLElement).click()
    expect(i.currentScreen).toBe('w')
    expect(i.viewState).toBe('normal')
    i.setState('success')
    expect(i.viewState).toBe('success')
    i.showScreen('v')
    expect(i.viewState).toBe('normal')
    i.setState('error')
    i.showScreen('v')
    expect(i.viewState).toBe('normal')
    i.destroy()
  })
})

describe('loading: 押せる操作を残さない', () => {
  const schema = load(mk({}, {
    states: { loading: { message: '読み込み中です' } },
    primaryAction: { id: 'p', label: 'P', kind: 'custom', placement: 'header' },
    secondaryActions: [
      { id: 'cancel', label: 'キャンセル', kind: 'navigate', to: 'w', style: 'tertiary', placement: 'footer', confirm: { message: '戻りますか？' } },
      { id: 'draft', label: '保存', kind: 'custom', style: 'secondary', placement: 'sticky' },
    ],
    sections: [{ id: 's', title: 'S', actions: [{ id: 'sa', label: 'SA', kind: 'custom', confirm: { message: 'm' } }], fields: [field()] }],
  }))
  it('ボタン・確認ダイアログ・フォームを描かない（スピナーだけ）', () => {
    const root = dom(renderViewV2(schema, 'v', { state: 'loading' }))
    expect(root.querySelectorAll('[data-action]').length).toBe(0)
    expect(root.querySelector('dialog')).toBeNull()
    expect(root.querySelector('form')).toBeNull()
    expect(root.querySelector('.mk2-actions')).toBeNull()
    expect(root.querySelector('.dads-progress-indicator')).not.toBeNull()
    // 通常では描く
    const normal = dom(renderViewV2(schema, 'v'))
    expect(normal.querySelectorAll('[data-action]').length).toBe(4)
    expect(normal.querySelectorAll('dialog').length).toBe(2)
  })
})

describe('today オプションの検証', () => {
  it('YYYY-MM-DD か有効な Date だけ。不正な値は実行時の日付', () => {
    vi.useFakeTimers()
    try {
      vi.setSystemTime(new Date(2026, 10, 7, 12))
      expect(resolveToday('2026-12-01')).toBe('2026-12-01')
      expect(resolveToday(new Date(2026, 0, 2))).toBe('2026-01-02')
      for (const bad of ['2026-13-01', '2026-02-30', 'today', '2026/11/07', '', new Date('nope'), undefined]) {
        expect(resolveToday(bad as never)).toBe('2026-11-07')
      }
      const schema = load(mk({ app: { name: 'A', notifications: [{ message: '期限切れ', until: '2026-11-06' }, { message: '有効', until: '2026-11-07' }] } }))
      const texts = (today: unknown) => Array.from(dom(renderViewV2(schema, 'v', { today: today as never })).querySelectorAll('.dads-notification-banner')).map(e => e.textContent!.trim())
      expect(texts('garbage')).toEqual(['有効'])
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('date のトークン: 静的描画と mount 後の一致', () => {
  it('dateToken / dateTokenOf: 0 埋めと、末尾の空の部分を落とす', () => {
    expect(dateToken('2026', '4', '')).toBe('2026-04')
    expect(dateToken('2026', '4', '1')).toBe('2026-04-01')
    expect(dateToken('', '', '')).toBe('')
    expect(dateToken('2026', '', '')).toBe('2026')
    expect(dateTokenOf('2026-11-05', 'month')).toBe('2026-11')
    expect(dateTokenOf('2026-11', 'day')).toBe('2026-11')
    expect(dateTokenOf('2026-1-5', undefined)).toBe('2026-01-05')
  })

  it('precision: day で YYYY-MM の default でも、静的と mount 後の評価が一致する', () => {
    const schema = withFields([
      field({ item: 'when', component: 'date', default: '2026-11' }),
      field({ item: 'dep', visibleWhen: { item: 'when', equals: '2026-11' } }),
      field({ item: 'full', visibleWhen: { item: 'when', equals: '2026-11-' } }),
    ])
    const hidden = (root: ParentNode, item: string) => root.querySelector(`[data-field="${item}"]`)!.hasAttribute('hidden')
    const staticRoot = dom(renderViewV2(schema, 'v'))
    expect([hidden(staticRoot, 'dep'), hidden(staticRoot, 'full')]).toEqual([false, true])
    mountViewV2(container, schema, 'v')
    expect([hidden(container, 'dep'), hidden(container, 'full')]).toEqual([false, true])
  })
})

describe('項目のエラー文は error の状態だけ（R-V09）', () => {
  const schema = load(mk({}, {
    states: { error: { message: '＊1件の項目を確認してください。A' } },
    sections: [{ id: 's', title: 'S', fields: [field({ item: 'a', props: { error: '＊A を入力してください' } })] }],
  }))
  it('通常: 出さない / error: バナーと項目のエラー文 / success: 出さない', () => {
    const errors = (state: string) => dom(renderViewV2(schema, 'v', { state: state as never })).querySelectorAll('.dads-input-text__error-text').length
    expect(errors('normal')).toBe(0)
    expect(errors('success')).toBe(0)
    expect(errors('error')).toBe(1)
    expect(dom(renderViewV2(schema, 'v', { state: 'error' })).querySelector('input')!.getAttribute('aria-invalid')).toBe('true')
    expect(dom(renderViewV2(schema, 'v')).querySelector('input')!.hasAttribute('aria-invalid')).toBe(false)
  })
})

describe('mount / render のオプション合成', () => {
  it('後ろの引数の undefined は前の値を消さない', () => {
    const schema = load(mk({}, { states: { error: { message: 'E' } } }))
    mountViewV2(container, schema, 'v', { state: 'error' }, { state: undefined, role: undefined })
    expect(container.querySelector('.dads-notification-banner[data-type="error"]')).not.toBeNull()
  })
  it('options が callbacks の同じキーを上書きする', () => {
    const schema = load(mk({}, { states: { error: { message: 'E' } } }))
    mountViewV2(container, schema, 'v', { state: 'error' }, { state: 'normal' })
    expect(container.querySelector('.dads-notification-banner')).toBeNull()
  })
})

describe('compileV2Warnings: component が使わないキーと、変換で落ちるキー', () => {
  const warn = (fields: Array<Record<string, any>>, kind = 'form') =>
    compileV2Warnings(load(mk({}, { sections: [{ id: 's', title: 'S', kind, fields }] }))).map(w => `${w.path.replace('views.v.sections[0].', '')} ${w.key}`)

  it('unit / autocomplete / accept / maxSize / precision を使わない component に付けたとき', () => {
    const w = warn([
      field({ item: 'a', component: 'select', unit: '円' }),
      field({ item: 'b', component: 'radio', autocomplete: 'email' }),
      field({ item: 'c', component: 'date', autocomplete: 'off' }),
      field({ item: 'd', component: 'text', accept: 'pdf', maxSize: '1MB' }),
      field({ item: 'e', component: 'date', precision: 'month', inline: true }),
    ])
    expect(w).toEqual(expect.arrayContaining(['fields[0] unit', 'fields[1] autocomplete', 'fields[2] autocomplete', 'fields[3] accept', 'fields[3] maxSize', 'fields[4] precision']))
  })

  it('readonly / summary の unit は number の値だけ', () => {
    expect(warn([field({ item: 'a', component: 'text', unit: '円' })], 'readonly')).toContain('fields[0] unit')
    expect(warn([field({ item: 'a', component: 'number', unit: '円' })], 'readonly')).not.toContain('fields[0] unit')
  })

  it('使う component では「ignored」ではなく旧フォーマットで落ちる分だけ', () => {
    const w = compileV2Warnings(load(mk({}, { sections: [{ id: 's', title: 'S', fields: [field({ item: 'a', component: 'text', unit: '件' })] }] })))
    expect(w).toHaveLength(1)
    expect(w[0].message).toContain('旧スキーマでは number だけ')
  })

  it('file: accept: image は multiple / maxSize が落ち、photo_grid の accept / maxSize も落ちる', () => {
    const w = warn([
      field({ item: 'a', component: 'file', accept: 'image', multiple: true, maxSize: '5MB' }),
      field({ item: 'b', component: 'photo_grid', accept: ['.png'], maxSize: '5MB' }),
      field({ item: 'c', component: 'file', accept: 'pdf', multiple: true, maxSize: '5MB' }),
    ])
    expect(w).toEqual(expect.arrayContaining(['fields[0] multiple', 'fields[0] maxSize', 'fields[1] accept', 'fields[1] maxSize']))
    expect(w.filter(x => x.startsWith('fields[2]'))).toEqual([])
    expect(w).not.toContain('fields[0] accept')
  })
})

describe('スキーマ: 同じ値の判定を共有している', () => {
  it('schema-v2.json の maxSize / accept 配列の要素と、パーサーが同じ判定', () => {
    const f = (over: Record<string, any>) => mk({}, { sections: [{ id: 's', title: 'S', fields: [field({ component: 'file', ...over })] }] })
    for (const doc of [f({ maxSize: '10MB' }), f({ accept: ['.pdf', 'image/png'] }), f({ maxSize: '0MB' }), f({ accept: ['pdf'] })]) {
      expect(validate(doc)).toBe(parseV2(doc).success)
    }
    // YAML（js-yaml）から読んだ文書も同じ
    const text = yamlDoc(`    sections:\n      - id: s\n        title: S\n        fields:\n          - { item: f, label: F, component: file, accept: ['.pdf'], maxSize: 10MB }\n`)
    expect(validate(loadYaml(text))).toBe(true)
  })
})

describe('sticky フッターの帯', () => {
  it('ボタンが 1 つだけなら data-compact（コンパクトな右寄せ）、複数なら通常の帯', () => {
    const one = dom(renderViewV2(load(mk({}, { primaryAction: { id: 'p', label: 'P', kind: 'custom', placement: 'sticky' } })), 'v'))
    expect(one.querySelector('.mk2-sticky')!.hasAttribute('data-compact')).toBe(true)
    const two = dom(renderViewV2(load(mk({}, {
      primaryAction: { id: 'p', label: 'P', kind: 'custom', placement: 'sticky' },
      secondaryActions: [{ id: 's', label: 'S', kind: 'custom', style: 'secondary' }],
    })), 'v'))
    expect(two.querySelector('.mk2-sticky')!.hasAttribute('data-compact')).toBe(false)
  })
})

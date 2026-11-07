/**
 * v2 レンダラー: 第 2 版のルールが前提とするキーの静的マークアップ（DADS のクラス・属性）
 */

import { describe, it, expect, vi } from 'vitest'
import { renderViewV2 } from '../renderer-v2'
import { availableStates } from '../renderer-v2'
import { dom, field, load, mk, withFields, withList } from './v2-test-helpers'

const col = (id: string, extra: Record<string, any> = {}) => ({ id, label: id.toUpperCase(), ...extra })
const render = (schema: ReturnType<typeof load>, opts = {}) => dom(renderViewV2(schema, 'v', opts))

describe('list: columns type / to / rows', () => {
  const schema = withList({
    columns: [col('no', { to: 'w' }), col('at', { type: 'date' }), col('st', { type: 'status' }), col('amount', { type: 'number' })],
    rows: [
      { no: 'N-1', at: '2026-11-07', st: '処理中', amount: 125000 },
      { no: 'N-2', at: '2026-12', st: '完了', amount: '9800' },
      { no: 'N-3', at: new Date('2026-11-05T00:00:00Z'), st: '要対応', amount: '1,280円' },
    ],
  })
  const root = render(schema)
  const cells = (r: number) => Array.from(root.querySelectorAll('tbody tr')[r].querySelectorAll('td'))

  it('rows があればダミー行の代わりに使う', () => {
    expect(root.querySelectorAll('tbody tr').length).toBe(3)
    expect(cells(0)[0].textContent).toBe('N-1')
  })

  it('to のセルは DADS リンクで、ナビと同じ data-nav-view を持つ', () => {
    const a = cells(0)[0].querySelector('a.dads-link')!
    expect(a.getAttribute('data-nav-view')).toBe('w')
    expect(a.getAttribute('href')).toBe('#w')
  })

  it('status は chip-label（状態名で色が決まる）', () => {
    const chip = (r: number) => cells(r)[2].querySelector('.dads-chip-label')!
    expect(chip(0).textContent).toBe('処理中')
    expect(chip(0).getAttribute('data-color')).toBe('light-blue')
    expect(chip(1).getAttribute('data-color')).toBe('green')
    expect(chip(2).getAttribute('data-color')).toBe('red')
  })

  it('date は日本語表記（YYYY-MM は年月、Date 型の値も UTC の日付で）', () => {
    expect(cells(0)[1].textContent).toBe('2026年11月7日')
    expect(cells(1)[1].textContent).toBe('2026年12月')
    expect(cells(2)[1].textContent).toBe('2026年11月5日')
  })

  it('number は右寄せのクラスと桁区切り（数字だけの文字列も。単位付きはそのまま）', () => {
    expect(cells(0)[3].className).toContain('mk2-cell--number')
    expect(cells(0)[3].textContent).toBe('125,000')
    expect(cells(1)[3].textContent).toBe('9,800')
    expect(cells(2)[3].textContent).toBe('1,280円')
    expect(root.querySelectorAll('thead th')[3].className).toContain('mk2-cell--number')
  })

  it('値の HTML はエスケープされる', () => {
    const s = withList({ columns: [col('a')], rows: [{ a: '<img src=x onerror=alert(1)>' }] })
    expect(render(s).querySelector('tbody img')).toBeNull()
  })

  it('pageSize に収まらない行は 1 ページ目だけ描き、実際のページ数を示す。収まれば page-navigation を出さない', () => {
    const rows = Array.from({ length: 5 }, (_, i) => ({ a: `r${i}` }))
    const paged = render(withList({ columns: [col('a')], rows, paging: { pageSize: 2 } }))
    expect(paged.querySelectorAll('tbody tr').length).toBe(2)
    expect(paged.querySelector('.dads-page-navigation__counter')!.textContent).toBe('1 / 3')
    expect(render(withList({ columns: [col('a')], rows, paging: { pageSize: 10 } })).querySelector('nav.dads-page-navigation')).toBeNull()
  })
})

describe('list: ダミー行の状態名', () => {
  const statusDoc = (fields: Array<Record<string, any>>) =>
    load(mk({}, {
      sections: [
        { id: 'f', title: 'F', fields },
        { id: 'l', title: 'L', kind: 'list', list: { columns: [col('status', { type: 'status' })] } },
      ],
    }))
  const labels = (schema: ReturnType<typeof load>) => Array.from(render(schema).querySelectorAll('tbody .dads-chip-label')).map(e => e.textContent)

  it('同じ view の select / radio の選択肢から借りる（「すべて」は除く）', () => {
    const schema = statusDoc([
      field({ item: 'statusFilter', component: 'select', options: [{ value: 'all', label: 'すべて' }, { value: 'a', label: '受付済' }, { value: 'b', label: '審査中' }, { value: 'c', label: '内定' }] }),
    ])
    expect(labels(schema)).toEqual(['受付済', '審査中', '内定'])
  })

  it('列 id と同じ項目を優先し、無ければ従来の既定', () => {
    const exact = statusDoc([
      field({ item: 'statusX', component: 'radio', options: [{ value: 'x', label: 'X状態' }] }),
      field({ item: 'status', component: 'radio', options: [{ value: 'y', label: '承認待ち' }] }),
    ])
    expect(labels(exact)).toEqual(['承認待ち', '承認待ち', '承認待ち'])
    expect(labels(statusDoc([field({ item: 'other', component: 'text' })]))).toEqual(['処理中', '出荷済み', '完了'])
  })
})

describe('list: bulkActions と controls', () => {
  const schema = withList({
    columns: [col('a')],
    rows: [{ id: 'r1', a: 'x' }, { id: 'r2', a: 'y' }],
    selection: 'multiple',
    search: true,
    bulkActions: [
      { id: 'b1', label: '発注候補に追加する', kind: 'custom' },
      { id: 'b2', label: '削除', kind: 'custom', confirm: { message: '削除しますか？' } },
    ],
  })
  const root = render(schema)

  it('表の上の controls に検索と outline ボタンが並ぶ', () => {
    const controls = root.querySelector('.mk2-list__controls')!
    expect(controls.querySelector('.mk2-list__search')).not.toBeNull()
    const buttons = controls.querySelectorAll('.mk2-list__bulk button')
    expect(buttons.length).toBe(2)
    expect(buttons[0].getAttribute('data-type')).toBe('outline')
    expect(buttons[0].getAttribute('data-action')).toBe('b1')
    expect(buttons[0].hasAttribute('data-bulk')).toBe(true)
    expect(buttons[0].getAttribute('data-section')).toBe('l')
    expect(controls.compareDocumentPosition(root.querySelector('figure.dads-table')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('行に data-row-id、選択入力に value = 行 ID', () => {
    const inputs = root.querySelectorAll<HTMLInputElement>('input[data-row-select]')
    expect(Array.from(inputs).map(i => i.value)).toEqual(['r1', 'r2'])
    expect(root.querySelectorAll('tbody tr')[1].getAttribute('data-row-id')).toBe('r2')
  })

  it('confirm 付きの一括操作には確認ダイアログがある', () => {
    expect(root.querySelector('dialog[data-dialog-for="b2"]')).not.toBeNull()
  })

  it('行 ID は id → 先頭列の値 → 通し番号の順', () => {
    const r = render(withList({ columns: [col('a'), col('b')], rows: [{ a: 'first' }, { b: 'only-b' }], selection: 'multiple' }))
    expect(Array.from(r.querySelectorAll('tbody tr')).map(tr => tr.getAttribute('data-row-id'))).toEqual(['first', '2'])
  })
})

describe('list: 固定行の表の入力セル', () => {
  const schema = withList({
    columns: [
      col('sku'),
      { id: 'qty', label: '実数', field: { component: 'number', unit: '個', width: 'xs' } },
      { id: 'reason', label: '理由', field: { component: 'select', options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }] } },
      { id: 'ok', label: '確認', field: { component: 'checkbox' } },
      { id: 'memo', label: 'メモ', field: { component: 'text', default: '既定' } },
    ],
    rows: [{ sku: 'S1', qty: 3, reason: 'b', ok: true }, { id: 'row-2', sku: 'S2' }],
  })
  const root = render(schema)

  it('name は <rowKey>.<columnId>（行の id → 先頭列の値）', () => {
    const names = Array.from(root.querySelectorAll<HTMLElement>('tbody [name]')).map(e => e.getAttribute('name'))
    expect(names).toEqual(['S1.qty', 'S1.reason', 'S1.ok', 'S1.memo', 'row-2.qty', 'row-2.reason', 'row-2.ok', 'row-2.memo'])
  })

  it('値は rows、無ければ field.default。種類ごとに DADS の部品', () => {
    const first = root.querySelectorAll('tbody tr')[0]
    expect(first.querySelector<HTMLInputElement>('input[name="S1.qty"]')!.getAttribute('value')).toBe('3')
    expect(first.querySelector('input[name="S1.qty"]')!.getAttribute('type')).toBe('number')
    expect(first.querySelector('.mk2-unit')!.textContent).toBe('個')
    expect(first.querySelector<HTMLOptionElement>('select[name="S1.reason"] option[selected]')!.value).toBe('b')
    expect(first.querySelector<HTMLInputElement>('.dads-checkbox input[name="S1.ok"]')!.checked).toBe(true)
    expect(first.querySelector('input[name="S1.memo"]')!.getAttribute('value')).toBe('既定')
  })

  it('ラベルがないので aria-label に列名と行を入れる。DOM id は一意', () => {
    expect(root.querySelector('input[name="S1.qty"]')!.getAttribute('aria-label')).toBe('実数（S1）')
    const ids = Array.from(root.querySelectorAll('[id]')).map(e => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('Section.actions', () => {
  const schema = load(mk({}, {
    sections: [
      {
        id: 'filter',
        title: '条件',
        actions: [
          { id: 'search', label: '検索する', kind: 'custom', style: 'secondary' },
          { id: 'cancel', label: 'やめる', kind: 'reset', style: 'tertiary' },
          { id: 'go', label: '移動', kind: 'navigate', to: 'w', confirm: { message: '移動しますか？' } },
        ],
        fields: [field()],
      },
      { id: 'later', title: '後', reveal: 'collapsed', actions: [{ id: 'inner', label: '中の操作', kind: 'custom' }], fields: [field({ item: 'g', label: 'G' })] },
    ],
  }))
  const root = render(schema)

  it('見出し行（h2 と同じ行）に置き、outline / tertiary は text', () => {
    const head = root.querySelector('section[data-section-id="filter"] .mk2-section__head')!
    expect(head.querySelector('h2')!.textContent).toBe('条件')
    const buttons = head.querySelectorAll('.mk2-section__actions button')
    expect(Array.from(buttons).map(b => b.textContent)).toEqual(['検索する', 'やめる', '移動'])
    expect(Array.from(buttons).map(b => b.getAttribute('data-type'))).toEqual(['outline', 'text', 'outline'])
    expect(buttons[1].getAttribute('data-action-kind')).toBe('reset')
    expect(buttons[1].getAttribute('data-section')).toBe('filter')
    expect(buttons[2].getAttribute('data-navigate-to')).toBe('w')
    expect(root.querySelector('dialog[data-dialog-for="go"]')).not.toBeNull()
  })

  it('折りたたみの Section は中身の先頭に置く', () => {
    expect(root.querySelector('.dads-disclosure__content > .mk2-section__actions [data-action="inner"]')).not.toBeNull()
  })

  it('primary のボタン（solid-fill）にはならない', () => {
    expect(root.querySelectorAll('.mk2-section__actions [data-type="solid-fill"]').length).toBe(0)
  })
})

describe('Field.unit / precision / autocomplete', () => {
  it('unit は同じ control 内の .mk2-unit（text / number / time / combobox / duration）', () => {
    const root = render(withFields([
      field({ item: 'n', component: 'number', unit: '円' }),
      field({ item: 't', unit: '件' }),
      field({ item: 'd', component: 'duration', unit: '時間' }),
      field({ item: 'dd', component: 'duration' }),
    ]))
    const unit = (item: string) => root.querySelector(`[data-field="${item}"] .mk2-with-unit > .mk2-unit`)?.textContent
    expect(unit('n')).toBe('円')
    expect(unit('t')).toBe('件')
    expect(unit('d')).toBe('時間')
    expect(unit('dd')).toBe('分')
    expect(root.querySelector('[data-field="n"] .mk2-with-unit > .dads-input-text input')).not.toBeNull()
  })

  it('precision: month は年と月の入力だけ（値は YYYY-MM でも YYYY-MM-DD でも）', () => {
    const root = render(withFields([
      field({ item: 'm', component: 'date', precision: 'month', default: '2026-12' }),
      field({ item: 'd', component: 'date', default: '2026-12-01' }),
    ]))
    const m = root.querySelector('[data-field="m"]')!
    expect(m.querySelectorAll('.dads-date-picker__input').length).toBe(2)
    expect(m.querySelector('.dads-date-picker__day')).toBeNull()
    expect(m.querySelector<HTMLInputElement>('input[name="m.year"]')!.value).toBe('2026')
    expect(m.querySelector<HTMLInputElement>('input[name="m.month"]')!.value).toBe('12')
    expect(root.querySelector('[data-field="d"]')!.querySelectorAll('.dads-date-picker__input').length).toBe(3)
  })

  it('autocomplete は input に出る。date の bday は 3 つの入力に bday-year / month / day', () => {
    const root = render(withFields([
      field({ item: 'e', autocomplete: 'email' }),
      field({ item: 'b', component: 'date', autocomplete: 'bday' }),
      field({ item: 'o', component: 'date', autocomplete: 'off' }),
      field({ item: 'a', component: 'textarea', autocomplete: 'street-address' }),
    ]))
    expect(root.querySelector('input[name="e"]')!.getAttribute('autocomplete')).toBe('email')
    expect(Array.from(root.querySelectorAll('[data-field="b"] input')).map(i => i.getAttribute('autocomplete'))).toEqual(['bday-year', 'bday-month', 'bday-day'])
    expect(root.querySelector('[data-field="o"] input')!.hasAttribute('autocomplete')).toBe(false)
    expect(root.querySelector('textarea')!.getAttribute('autocomplete')).toBe('street-address')
  })
})

describe('file: multiple / accept / maxSize', () => {
  const input = (f: Record<string, any>) => render(withFields([field({ item: 'doc', component: 'file', ...f })])).querySelector<HTMLInputElement>('input[type="file"]')!
  const support = (f: Record<string, any>) => render(withFields([field({ item: 'doc', component: 'file', ...f })])).querySelector('.dads-form-control-label__support-text')?.textContent

  it('multiple（正規キーと props.multiple の両方）と accept 属性', () => {
    expect(input({ multiple: true }).hasAttribute('multiple')).toBe(true)
    expect(input({ props: { multiple: true } }).hasAttribute('multiple')).toBe(true)
    expect(input({}).hasAttribute('multiple')).toBe(false)
    expect(input({ accept: 'image' }).getAttribute('accept')).toBe('image/*')
    expect(input({ accept: 'pdf' }).getAttribute('accept')).toBe('.pdf,application/pdf')
    expect(input({ accept: 'document' }).getAttribute('accept')).toContain('.docx')
    expect(input({ accept: ['.pdf', 'image/png'] }).getAttribute('accept')).toBe('.pdf,image/png')
    expect(input({ accept: '.csv' }).getAttribute('accept')).toBe('.csv')
    expect(input({ maxSize: '10MB' }).getAttribute('data-max-size')).toBe('10MB')
  })

  it('サポートテキストに「形式: …／1ファイル 10MB まで」を自動で足す', () => {
    expect(support({ accept: ['.pdf', 'image/jpeg', 'image/png'], maxSize: '10MB' })).toBe('形式: PDF・JPEG・PNG／1ファイル 10MB まで')
    expect(support({ accept: 'image', maxSize: '5MB', help: '商品の写真を登録します' })).toBe('商品の写真を登録します形式: 画像／1ファイル 5MB まで')
    expect(support({ maxSize: '10MB' })).toBe('1ファイル 10MB まで')
    expect(support({})).toBeUndefined()
  })

  it('help がすでに書いている部分は足さない', () => {
    const both = support({ accept: ['.pdf', 'image/png'], maxSize: '10MB', help: 'PDF・PNG、1ファイル10MBまで、5ファイルまで' })
    expect(both).toBe('PDF・PNG、1ファイル10MBまで、5ファイルまで')
    expect(support({ accept: 'pdf', maxSize: '10MB', help: '形式は PDF です' })).toBe('形式は PDF です1ファイル 10MB まで')
    expect(support({ accept: 'pdf', maxSize: '10MB', help: '1ファイル 10 MB まで' })).toBe('1ファイル 10 MB まで形式: PDF')
  })
})

describe('Field.links / Field.to / timeline', () => {
  it('links はサポートテキストの後ろに DADS リンクで出る（http は新規タブ、危険な URL は # に）', () => {
    const root = render(withFields([
      field({ item: 'c', component: 'checkbox', help: '規約を確認してください', links: [
        { label: '利用規約', href: 'https://example.jp/terms' },
        { label: '手引き', href: '/guide' },
        { label: '悪い', href: 'javascript:alert(1)' },
      ] }),
    ]))
    const links = root.querySelectorAll('[data-field="c"] ul.mk2-links a.dads-link')
    expect(Array.from(links).map(a => a.getAttribute('href'))).toEqual(['https://example.jp/terms', '/guide', '#'])
    expect(links[0].getAttribute('target')).toBe('_blank')
    expect(links[0].getAttribute('rel')).toBe('noopener noreferrer')
    expect(links[0].querySelector('.dads-link__icon')).not.toBeNull()
    expect(links[1].hasAttribute('target')).toBe(false)
    const field0 = root.querySelector('[data-field="c"]')!
    const ul = field0.querySelector('ul.mk2-links')!
    expect(field0.querySelector('.dads-form-control-label__support-text')!.compareDocumentPosition(ul) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('summary / readonly の値を to でリンクにする（status ならチップごと）', () => {
    const schema = load(mk({}, { sections: [{ id: 'k', title: 'K', kind: 'summary', fields: [
      field({ item: 'cnt', component: 'number', value: 12, unit: '件', to: 'w' }),
      field({ item: 'st', component: 'status', value: '審査中', to: 'w' }),
      field({ item: 'plain', value: 'x' }),
    ] }] }))
    const root = render(schema)
    const dd = root.querySelectorAll('dd')
    expect(dd[0].querySelector('a.dads-link[data-nav-view="w"]')!.textContent).toBe('12件')
    expect(dd[1].querySelector('a.dads-link .dads-chip-label')!.textContent).toBe('審査中')
    expect(dd[2].querySelector('a')).toBeNull()
  })

  it('timeline: value の { at, label, text } を時刻・ラベル・本文で出す（props.items も動く）', () => {
    const root = render(withFields([
      field({ item: 'tl', component: 'timeline', value: [{ at: '11月6日', label: '入庫 +48', text: '新宿店' }, { label: '時刻なし' }] }),
      field({ item: 'old', component: 'timeline', props: { items: [{ time: '9:00', title: '旧' }] } }),
    ]))
    const li = root.querySelectorAll('[data-field="tl"] li')
    expect(li.length).toBe(2)
    expect(li[0].querySelector('time')!.textContent).toBe('11月6日')
    expect(li[0].querySelector('strong')!.textContent).toBe('入庫 +48')
    expect(li[0].querySelector('.mk2-timeline__text')!.textContent).toBe('新宿店')
    expect(li[1].querySelector('time')).toBeNull()
    expect(root.querySelector('[data-field="old"] li strong')!.textContent).toBe('旧')
  })

  it('readonly の timeline も構造化 value を一覧にする', () => {
    const schema = load(mk({}, { sections: [{ id: 'h', title: 'H', kind: 'readonly', fields: [
      field({ item: 'tl', component: 'timeline', value: [{ at: 'a', label: 'L1' }] }),
    ] }] }))
    expect(render(schema).querySelector('dd ol.dads-list li strong')!.textContent).toBe('L1')
  })
})

describe('条件: in / notEquals / requiredWhen の初期描画', () => {
  const doc = (cond: Record<string, any>, over: Record<string, any> = {}) =>
    render(withFields([
      field({ item: 'sel', component: 'radio', default: 'b', options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }] }),
      field({ item: 'dep', label: 'D', ...over, ...cond }),
    ]))

  it('visibleWhen の in / notEquals を既定値で評価する', () => {
    expect(doc({ visibleWhen: { item: 'sel', in: ['a', 'b'] } }).querySelector('[data-field="dep"]')!.hasAttribute('hidden')).toBe(false)
    expect(doc({ visibleWhen: { item: 'sel', in: ['a'] } }).querySelector('[data-field="dep"]')!.hasAttribute('hidden')).toBe(true)
    expect(doc({ visibleWhen: { item: 'sel', notEquals: 'a' } }).querySelector('[data-field="dep"]')!.hasAttribute('hidden')).toBe(false)
    expect(doc({ visibleWhen: { item: 'sel', notEquals: 'b' } }).querySelector('[data-field="dep"]')!.hasAttribute('hidden')).toBe(true)
  })

  it('条件は data-visible-when に書かれたキーだけ入る', () => {
    const el = doc({ visibleWhen: { item: 'sel', in: ['a'] } }).querySelector<HTMLElement>('[data-field="dep"]')!
    expect(JSON.parse(el.dataset.visibleWhen!)).toEqual({ item: 'sel', in: ['a'] })
  })

  it('requiredWhen: 既定値で成り立つときだけ ※必須 と required 属性', () => {
    const yes = doc({ required: false, requiredWhen: { item: 'sel', equals: 'b' } }).querySelector('[data-field="dep"]')!
    expect(yes.querySelector('.dads-form-control-label__requirement')!.textContent).toBe('※必須')
    expect(yes.querySelector('input')!.hasAttribute('required')).toBe(true)
    expect(yes.hasAttribute('data-required-when')).toBe(true)
    const no = doc({ required: false, requiredWhen: { item: 'sel', equals: 'a' } }).querySelector('[data-field="dep"]')!
    expect(no.querySelector('.dads-form-control-label__requirement')!.textContent).toBe('※任意')
    expect(no.querySelector('input')!.hasAttribute('required')).toBe(false)
  })

  it('date の precision: month を参照する条件は y-m で評価する', () => {
    const schema = withFields([
      field({ item: 'when', component: 'date', precision: 'month', default: '2026-12-15' }),
      field({ item: 'dep', visibleWhen: { item: 'when', equals: '2026-12' } }),
    ])
    expect(render(schema).querySelector('[data-field="dep"]')!.hasAttribute('hidden')).toBe(false)
  })
})

describe('状態（state）', () => {
  const schema = load(mk({}, {
    states: { success: { message: '成功しました' }, error: { message: '失敗しました' }, loading: { message: '集計中です' }, empty: { message: '空です' } },
    sections: [{ id: 'l', title: 'L', kind: 'list', list: { columns: [col('a')], rows: [{ a: 'x' }], empty: '一覧は空です' } }],
    primaryAction: { id: 'p', label: 'P', kind: 'custom' },
  }))

  it('既定（通常）は状態バナーを出さない', () => {
    const root = render(schema)
    expect(root.querySelectorAll('.dads-notification-banner').length).toBe(0)
    expect(root.querySelector('.mokkun-v2')!.getAttribute('data-state')).toBe('normal')
  })

  it('success と error は選んだ 1 つだけ（同時に描かない）', () => {
    const ok = render(schema, { state: 'success' })
    expect(ok.querySelectorAll('.dads-notification-banner').length).toBe(1)
    expect(ok.querySelector('.dads-notification-banner[data-type="success"]')!.textContent).toContain('成功しました')
    const ng = render(schema, { state: 'error' })
    expect(ng.querySelectorAll('.dads-notification-banner').length).toBe(1)
    expect(ng.querySelector('.dads-notification-banner[data-type="error"]')).not.toBeNull()
  })

  it('declare していない状態を選んでも何も出ない', () => {
    const s = withFields([field()], { states: { error: { message: 'e' } } })
    expect(render(s, { state: 'success' }).querySelectorAll('.dads-notification-banner').length).toBe(0)
  })

  it('empty は一覧が行の代わりに空の文言を出す', () => {
    const root = render(schema, { state: 'empty' })
    expect(root.querySelectorAll('tbody tr').length).toBe(0)
    const empty = root.querySelector('[data-empty]')!
    expect(empty.hasAttribute('hidden')).toBe(false)
    expect(empty.textContent).toBe('一覧は空です')
    expect(root.querySelector('figure.dads-table')!.hasAttribute('hidden')).toBe(true)
  })

  it('loading は DADS の progress-indicator（スピナー）で、フォームは出さない', () => {
    const root = render(schema, { state: 'loading' })
    const pi = root.querySelector('dads-progress-indicator.dads-progress-indicator')!
    expect(pi.getAttribute('data-type')).toBe('stacked')
    expect(pi.getAttribute('role')).toBe('progressbar')
    expect(pi.querySelector('svg.dads-progress-indicator__spinner[data-indeterminate]')).not.toBeNull()
    expect(root.querySelector('.dads-progress-indicator__label')!.textContent).toBe('集計中です')
    expect(pi.getAttribute('aria-labelledby')).toBe(root.querySelector('.dads-progress-indicator__label')!.id)
    expect(root.querySelector('form')).toBeNull()
  })

  it('loading のメッセージが無ければ「読み込み中」', () => {
    const s = withFields([field()])
    expect(render(s, { state: 'loading' }).querySelector('.dads-progress-indicator__label')!.textContent).toBe('読み込み中')
  })

  it('availableStates: normal は常に、他は対応する states.* があるとき（empty は list.empty でも）', () => {
    expect(availableStates(schema, 'v')).toEqual(['normal', 'success', 'error', 'empty', 'loading'])
    expect(availableStates(withFields([field()], { states: { error: { message: 'e' } } }), 'v')).toEqual(['normal', 'error'])
    expect(availableStates(withList({ columns: [col('a')], empty: '空' }), 'v')).toEqual(['normal', 'empty'])
    expect(availableStates(schema, 'nope')).toEqual(['normal'])
  })
})

describe('ロール（role）', () => {
  const schema = load(mk({
    app: {
      name: 'A',
      roles: ['店舗', '本部'],
      navigation: [
        { group: '共通', items: [{ view: 'v', label: '共通' }] },
        { group: '本部専用', role: '本部', items: [{ view: 'w', label: '本部専用' }] },
        { group: '両方', role: ['店舗', '本部'], items: [{ view: 'w', label: '両方' }] },
      ],
      notifications: [
        { message: '全員向け' },
        { message: '本部向け', role: '本部' },
        { message: '店舗向け', role: ['店舗'] },
      ],
    },
  }, {
    primaryAction: { id: 'p', label: '主操作', kind: 'custom' },
    secondaryActions: [
      { id: 'hq', label: '本部の操作', kind: 'custom', role: '本部' },
      { id: 'hqdel', label: '本部の削除', kind: 'custom', role: '本部', style: 'danger', confirm: { message: '削除？' } },
    ],
    sections: [
      { id: 'f', title: 'F', actions: [{ id: 'sa', label: '店舗の見出し操作', kind: 'custom', role: '店舗' }], fields: [field()] },
      { id: 'l', title: 'L', kind: 'list', list: { columns: [col('a')], selection: 'multiple', bulkActions: [{ id: 'bk', label: '本部の一括', role: '本部' }] } },
    ],
  }))
  const actions = (root: HTMLElement) => Array.from(root.querySelectorAll('[data-action]')).map(b => b.getAttribute('data-action'))
  const navs = (root: HTMLElement) => Array.from(root.querySelectorAll('.mk2-globalnav .dads-horizontal-menu__item-inner')).map(e => e.textContent!.trim())
  const notices = (root: HTMLElement) => Array.from(root.querySelectorAll('.dads-notification-banner')).map(e => e.textContent!.trim())

  it('ロール未選択はすべて描画する（従来どおり）', () => {
    const root = render(schema)
    expect(actions(root)).toEqual(expect.arrayContaining(['p', 'hq', 'hqdel', 'sa', 'bk']))
    expect(navs(root)).toEqual(expect.arrayContaining(['共通', '本部専用', '両方']))
    expect(notices(root).length).toBe(3)
  })

  it('本部: 店舗向けの操作・通知が消える', () => {
    const root = render(schema, { role: '本部' })
    expect(actions(root)).toEqual(expect.arrayContaining(['p', 'hq', 'hqdel', 'bk']))
    expect(actions(root)).not.toContain('sa')
    expect(notices(root).join('|')).toContain('本部向け')
    expect(notices(root).join('|')).not.toContain('店舗向け')
    expect(navs(root)).toEqual(expect.arrayContaining(['本部専用']))
  })

  it('店舗: 本部の操作・ナビ group・通知と、その確認ダイアログが消える', () => {
    const root = render(schema, { role: '店舗' })
    expect(actions(root).sort()).toEqual(['p', 'sa'])
    expect(root.querySelector('dialog[data-dialog-for="hqdel"]')).toBeNull()
    expect(root.querySelector('.mk2-list__bulk')).toBeNull()
    expect(navs(root)).not.toContain('本部専用')
    expect(navs(root)).toContain('共通')
    expect(notices(root).join('|')).toContain('店舗向け')
    expect(notices(root).join('|')).not.toContain('本部向け')
  })

  it('ロール外の値を渡しても落ちない（role 指定のあるものは出ない）', () => {
    expect(actions(render(schema, { role: '不明' }))).toEqual(['p'])
  })
})

describe('通知の掲示期限（until）', () => {
  const schema = load(mk({
    app: { name: 'A', notifications: [
      { message: '期限切れ', until: '2026-11-06' },
      { message: '本日まで', until: '2026-11-07' },
      { message: '期限なし' },
    ] },
  }))
  const texts = (opts: Record<string, any>) => Array.from(render(schema, opts).querySelectorAll('.dads-notification-banner')).map(e => e.textContent!.trim())

  it('今日より前の until は出さない（当日までは出す）', () => {
    expect(texts({ today: '2026-11-07' })).toEqual(['本日まで', '期限なし'])
    expect(texts({ today: '2026-11-06' })).toEqual(['期限切れ', '本日まで', '期限なし'])
    expect(texts({ today: '2026-11-08' })).toEqual(['期限なし'])
  })

  it('today は Date でも渡せる。省略時は実行時の日付', () => {
    expect(texts({ today: new Date(2026, 10, 8) })).toEqual(['期限なし'])
    vi.useFakeTimers()
    try {
      vi.setSystemTime(new Date(2026, 10, 7, 12, 0, 0))
      expect(texts({})).toEqual(['本日まで', '期限なし'])
      vi.setSystemTime(new Date(2027, 0, 1))
      expect(texts({})).toEqual(['期限なし'])
    } finally {
      vi.useRealTimers()
    }
  })

  it('通知 id は定義順の通し番号のまま（途中が消えても詰めない）', () => {
    const ids = Array.from(render(schema, { today: '2026-11-08' }).querySelectorAll('.dads-notification-banner')).map(e => e.id)
    expect(ids).toEqual(['v-notice-3'])
  })
})

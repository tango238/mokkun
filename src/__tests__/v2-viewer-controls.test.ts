/**
 * ビューアーの状態 / ロール セレクトと、DADS CSS の取り込み記録
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { parseViewState, renderV2Controls, resolveRole, resolveViewState } from '../viewer/v2-controls'
import { dom, field, load, mk } from './v2-test-helpers'

const schema = load(mk({ app: { name: 'A', roles: ['店舗担当者', '本部管理者'] } }, {
  states: { error: { message: 'e' }, loading: { message: 'l' } },
  sections: [{ id: 's', title: 'S', fields: [field()] }],
}))

describe('viewer v2 controls', () => {
  it('状態セレクト: 5 つの状態を並べ、view が持たないものは disabled', () => {
    const root = dom(renderV2Controls(schema, 'v', 'error', undefined))
    const opts = Array.from(root.querySelectorAll<HTMLOptionElement>('#state-selector option'))
    expect(opts.map(o => o.textContent)).toEqual(['通常', '成功', 'エラー', '空', '読み込み中'])
    expect(opts.map(o => o.disabled)).toEqual([false, true, false, true, false])
    expect(root.querySelector<HTMLOptionElement>('#state-selector option[selected]')!.value).toBe('error')
  })

  it('ロールセレクト: すべて + app.roles。選択中を反映', () => {
    const root = dom(renderV2Controls(schema, 'v', 'normal', '本部管理者'))
    const opts = Array.from(root.querySelectorAll<HTMLOptionElement>('#role-selector option'))
    expect(opts.map(o => o.textContent)).toEqual(['すべて', '店舗担当者', '本部管理者'])
    expect(root.querySelector<HTMLOptionElement>('#role-selector option[selected]')!.value).toBe('本部管理者')
  })

  it('app.roles が無ければロールセレクトを出さない', () => {
    const noRoles = load(mk())
    expect(dom(renderV2Controls(noRoles, 'v', 'normal', undefined)).querySelector('#role-selector')).toBeNull()
  })

  it('URL パラメータの解釈: 不正な状態・ロール、選べない状態は通常 / 未選択に戻す', () => {
    expect(parseViewState('empty')).toBe('empty')
    expect(parseViewState('bogus')).toBe('normal')
    expect(parseViewState(null)).toBe('normal')
    expect(resolveViewState(schema, 'v', 'success')).toBe('normal')
    expect(resolveViewState(schema, 'v', 'loading')).toBe('loading')
    expect(resolveRole(schema, '店舗担当者')).toBe('店舗担当者')
    expect(resolveRole(schema, '誰か')).toBeUndefined()
    expect(resolveRole(schema, '')).toBeUndefined()
  })
})

describe('DADS CSS の取り込み', () => {
  const dads = join(resolve(__dirname, '..'), 'renderer-v2')
  it('progress-indicator.css は dads.css から読み込まれ、NOTICE.md に載っている', () => {
    expect(readFileSync(join(dads, 'dads.css'), 'utf-8')).toContain("@import './dads/progress-indicator.css';")
    expect(readFileSync(join(dads, 'dads', 'NOTICE.md'), 'utf-8')).toContain('progress-indicator.css | components/progress-indicator/progress-indicator.css')
  })
})

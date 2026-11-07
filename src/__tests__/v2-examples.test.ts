/**
 * examples/v2/ のすべてのサンプルが parseYamlV2 で検証でき、全 view が未対応 component なしで描画できる
 */

import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { load as loadYaml } from 'js-yaml'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { parseYamlV2 } from '../parser/yaml-parser'
import { compileV2Warnings } from '../parser/v2/compile-v2'
import { availableStates, renderViewV2, V2_VIEW_STATES } from '../renderer-v2'
import { dom } from './v2-test-helpers'

const root = resolve(__dirname, '../..')
const dir = join(root, 'examples', 'v2')
/** サンプルの日付に合わせた「今日」（Notice.until の判定を固定する） */
const TODAY = '2026-11-07'

/** サンプルごとに、旧フォーマットで落ちるはずのキー */
const EXPECTED_WARNINGS: Record<string, string[]> = {
  'order-entry.yaml': ['placement', 'columns', 'purpose', 'loading', 'to', 'actions'],
  'childcare-application.yaml': ['precision', 'autocomplete', 'links', 'requiredWhen', 'until', 'actions'],
  'inventory-admin.yaml': ['role', 'until', 'bulkActions', 'actions', 'field', 'to'],
}

const files = readdirSync(dir).filter(f => f.endsWith('.yaml'))
const jsonSchema = JSON.parse(readFileSync(join(root, 'schema-v2.json'), 'utf-8'))

describe('examples/v2', () => {
  it('サンプルは 3 つ以上ある', () => {
    expect(files).toEqual(expect.arrayContaining(['order-entry.yaml', 'childcare-application.yaml', 'inventory-admin.yaml']))
  })

  describe.each(files)('%s', file => {
    const text = readFileSync(join(dir, file), 'utf-8')
    const parsed = parseYamlV2(text)

    it('parseYamlV2 で検証できる', () => {
      expect(parsed.success, parsed.success ? '' : JSON.stringify(parsed.errors)).toBe(true)
    })

    it('schema-v2.json（ajv）でも検証できる', () => {
      const ajv = new Ajv({ allErrors: true, strict: false })
      addFormats(ajv)
      const validate = ajv.compile(jsonSchema)
      expect(validate(loadYaml(text)), ajv.errorsText(validate.errors, { separator: '\n' })).toBe(true)
    })

    it('全 view・全状態・全ロールで描画でき、data-unknown-component がなく、id が一意', () => {
      if (!parsed.success) throw new Error('parse failed')
      const schema = parsed.data
      const roles: Array<string | undefined> = [undefined, ...(schema.app.roles ?? [])]
      for (const name of Object.keys(schema.views)) {
        for (const state of V2_VIEW_STATES) {
          for (const role of roles) {
            const html = renderViewV2(schema, name, { state, role })
            expect(html, `${name}/${state}/${role}`).not.toContain('data-unknown-component')
            const ids = Array.from(dom(html).querySelectorAll('[id]')).map(e => e.id)
            expect(new Set(ids).size, `${name}/${state}/${role}: duplicate id`).toBe(ids.length)
          }
        }
        // 選べる状態は通常を含む
        expect(availableStates(schema, name)).toContain('normal')
      }
    })

    it('状態: 選んだ状態のバナー・スピナー・空表示だけが出て、それ以外では出ない', () => {
      if (!parsed.success) throw new Error('parse failed')
      const schema = parsed.data
      for (const [name, view] of Object.entries(schema.views)) {
        for (const state of V2_VIEW_STATES) {
          const root = dom(renderViewV2(schema, name, { state, today: TODAY }))
          const where = `${name}/${state}`
          const banner = (kind: string) => root.querySelectorAll(`[id$="-state-${kind}"]`).length
          // success / error のバナーは、選ばれていて states に書いてあるときだけ（同時には出ない）
          expect(banner('success'), where).toBe(state === 'success' && view.states?.success ? 1 : 0)
          expect(banner('error'), where).toBe(state === 'error' && view.states?.error ? 1 : 0)
          // 読み込み中はスピナーだけ（フォームも操作も出さない）
          expect(root.querySelectorAll('.dads-progress-indicator').length, where).toBe(state === 'loading' ? 1 : 0)
          if (state === 'loading') {
            expect(root.querySelector('form'), where).toBeNull()
            expect(root.querySelectorAll('[data-action]').length, where).toBe(0)
          }
          // 空: 一覧は行がなく、空の文言が見える。それ以外の状態では行がある
          for (const section of view.sections.filter(sec => sec.kind === 'list' && state !== 'loading')) {
            const list = root.querySelector(`.mk2-list[data-list="${section.id}"]`)!
            expect(list.querySelectorAll('tbody tr').length === 0, `${where}/${section.id}`).toBe(state === 'empty')
            const empty = list.querySelector('[data-empty]')
            if (state === 'empty') expect(empty?.hasAttribute('hidden') ?? false, `${where}/${section.id}`).toBe(false)
            else if (empty) expect(empty.hasAttribute('hidden'), `${where}/${section.id}`).toBe(true)
          }
          // 項目のエラー文（props.error）は error の状態だけ
          const hasError = (JSON.stringify(view)).includes('"error":"')
          const errorText = root.querySelectorAll('[class$="__error-text"], .dads-file-upload__error-messages li').length
          if (state !== 'error') expect(errorText, where).toBe(0)
          else if (hasError) expect(errorText, where).toBeGreaterThan(0)
        }
      }
    })

    it('ロール: 現在のロールに含まれない操作・ナビ group・通知は消え、含まれるものは残る', () => {
      if (!parsed.success) throw new Error('parse failed')
      const schema = parsed.data
      const roles: Array<string | undefined> = [undefined, ...(schema.app.roles ?? [])]
      const allows = (spec: string | string[] | undefined, role: string | undefined) =>
        spec === undefined || role === undefined || (Array.isArray(spec) ? spec : [spec]).includes(role)
      for (const [name, view] of Object.entries(schema.views)) {
        const actions = [
          ...(view.primaryAction ? [view.primaryAction] : []),
          ...(view.secondaryActions ?? []),
          ...view.sections.flatMap(sec => [...(sec.actions ?? []), ...(sec.list?.bulkActions ?? [])]),
        ]
        for (const role of roles) {
          const root = dom(renderViewV2(schema, name, { role, today: TODAY }))
          const where = `${name}/${role}`
          for (const a of actions) {
            expect(root.querySelector(`[data-action="${a.id}"]`) !== null, `${where}: action ${a.id}`).toBe(allows(a.role, role))
          }
          const nav = Array.from(root.querySelectorAll('.mk2-globalnav .dads-horizontal-menu__item-inner')).map(e => e.textContent!.trim())
          for (const g of schema.app.navigation ?? []) {
            const label = g.items.length === 1 ? (g.items[0].label ?? schema.views[g.items[0].view].title) : g.group
            expect(nav.includes(label), `${where}: nav ${g.group}`).toBe(allows(g.role, role))
          }
          ;(schema.app.notifications ?? []).forEach((n, i) => {
            const expired = n.until !== undefined && n.until < TODAY
            expect(root.querySelector(`[id="${name}-notice-${i + 1}"]`) !== null, `${where}: notice ${i + 1}`).toBe(allows(n.role, role) && !expired)
          })
        }
      }
    })

    it('旧フォーマットへの変換警告: 落ちるキーを具体的に挙げる', () => {
      if (!parsed.success) throw new Error('parse failed')
      const w = compileV2Warnings(parsed.data).map(x => `${x.key}`)
      for (const key of EXPECTED_WARNINGS[file] ?? []) expect(w, file).toContain(key)
      // 警告は path / key / message をすべて持つ
      for (const x of compileV2Warnings(parsed.data)) expect([typeof x.path, typeof x.key, typeof x.message]).toEqual(['string', 'string', 'string'])
    })
  })
})

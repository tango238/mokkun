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

    it('旧フォーマットへの変換警告を列挙できる（変換自体は成功する）', () => {
      if (!parsed.success) throw new Error('parse failed')
      expect(Array.isArray(compileV2Warnings(parsed.data))).toBe(true)
    })
  })
})

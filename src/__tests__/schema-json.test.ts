import { describe, it, expect } from 'vitest'
import Ajv2020 from 'ajv/dist/2020'
import addFormats from 'ajv-formats'
import { load } from 'js-yaml'
import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { VALID_FIELD_TYPES, parseYaml } from '../parser/yaml-parser'

const root = resolve(__dirname, '../..')
const schema = JSON.parse(readFileSync(join(root, 'schema.json'), 'utf-8'))

function createValidator() {
  const ajv = new Ajv2020({ allErrors: true, strict: false })
  addFormats(ajv)
  return { ajv, validate: ajv.compile(schema) }
}

describe('schema.json', () => {
  it('compiles as JSON Schema 2020-12', () => {
    expect(() => createValidator()).not.toThrow()
  })

  describe('examples/*.yaml validate against schema.json', () => {
    const { ajv, validate } = createValidator()
    const dir = join(root, 'examples')
    // teamkit-compat.yaml は teamkit generate-ui の出力形式（snake_case, 後方互換用）で、
    // schema.json の正規形（camelCase）とは一致しないため除外し、下で parseYaml の成功のみ確認する
    const files = readdirSync(dir).filter((f) => f.endsWith('.yaml') && f !== 'teamkit-compat.yaml')
    it('has example files', () => {
      expect(files.length).toBeGreaterThan(0)
    })
    for (const file of files) {
      it(file, () => {
        const data = load(readFileSync(join(dir, file), 'utf-8'))
        const ok = validate(data)
        expect(
          ok,
          `${file}:\n${ajv.errorsText(validate.errors, { separator: '\n' })}`
        ).toBe(true)
      })
    }
  })

  it('teamkit-compat.yaml (snake_case) parses with parseYaml', () => {
    const result = parseYaml(readFileSync(join(root, 'examples', 'teamkit-compat.yaml'), 'utf-8'))
    expect(result.success).toBe(true)
  })

  it('InputField type enum matches VALID_FIELD_TYPES', () => {
    function findEnum(node: unknown): string[] | null {
      if (Array.isArray(node)) {
        for (const n of node) {
          const r = findEnum(n)
          if (r) return r
        }
        return null
      }
      if (node && typeof node === 'object') {
        const obj = node as Record<string, unknown>
        if (
          Array.isArray(obj.enum) &&
          obj.enum.includes('text') &&
          obj.enum.includes('data_table')
        ) {
          return obj.enum as string[]
        }
        for (const v of Object.values(obj)) {
          const r = findEnum(v)
          if (r) return r
        }
      }
      return null
    }
    const schemaTypes = findEnum(schema.$defs.InputField)
    expect(schemaTypes).not.toBeNull()
    const s = new Set(schemaTypes!)
    const p = new Set<string>(VALID_FIELD_TYPES)
    const onlyInSchema = [...s].filter((t) => !p.has(t))
    const onlyInParser = [...p].filter((t) => !s.has(t))
    expect({ onlyInSchema, onlyInParser }).toEqual({ onlyInSchema: [], onlyInParser: [] })
  })

  it('required keys are declared in properties', () => {
    const names = [
      'InputField',
      'Action',
      'ScreenDefinition',
      'WizardStep',
      'CommonComponent',
      'ValidationRule',
    ]
    for (const name of names) {
      const def = schema.$defs[name]
      expect(def, `$defs.${name} exists`).toBeDefined()
      const required: string[] = def.required ?? []
      const props = Object.keys(def.properties ?? {})
      const missing = required.filter((r) => !props.includes(r))
      expect(missing, `$defs.${name}.required not in properties`).toEqual([])
    }
  })

  describe('negative cases', () => {
    const { validate } = createValidator()
    it('rejects unknown field type', () => {
      const data = load(`
view:
  s:
    title: "x"
    fields:
      - id: a
        type: "bogus"
        label: "A"
`)
      expect(validate(data)).toBe(false)
    })
    it('rejects document without view', () => {
      expect(validate(load('foo: bar\n'))).toBe(false)
    })
  })
})

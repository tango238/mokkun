import { describe, it, expect } from 'vitest'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { load } from 'js-yaml'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { VALID_COMPONENTS_V2 } from '../types/schema-v2'

const root = resolve(__dirname, '../..')
const schema = JSON.parse(readFileSync(join(root, 'schema-v2.json'), 'utf-8'))

function createValidator() {
  // schema-v2.json は draft-07
  const ajv = new Ajv({ allErrors: true, strict: false })
  addFormats(ajv)
  return { ajv, validate: ajv.compile(schema) }
}

function loadSample(): Record<string, any> {
  return load(readFileSync(join(root, 'examples', 'v2', 'order-entry.yaml'), 'utf-8')) as Record<string, any>
}

describe('schema-v2.json', () => {
  it('compiles as JSON Schema draft-07', () => {
    expect(() => createValidator()).not.toThrow()
  })

  it('component enum matches VALID_COMPONENTS_V2', () => {
    expect([...schema.definitions.Field.properties.component.enum].sort()).toEqual(
      [...VALID_COMPONENTS_V2].sort()
    )
  })

  it('examples/v2/order-entry.yaml validates', () => {
    const { ajv, validate } = createValidator()
    const ok = validate(loadSample())
    expect(ok, ajv.errorsText(validate.errors, { separator: '\n' })).toBe(true)
  })

  it('rejects an unknown component value', () => {
    const { validate } = createValidator()
    const data = loadSample()
    data.views.order_form.sections[0].fields[0].component = 'hologram'
    expect(validate(data)).toBe(false)
    expect(validate.errors?.some((e) => e.instancePath.endsWith('/component'))).toBe(true)
  })

  it('rejects unknown keys and a missing mokkun: 2', () => {
    const { validate } = createValidator()
    const extra = loadSample()
    extra.views.order_form.sections[0].fields[0].unknownKey = 1
    expect(validate(extra)).toBe(false)

    const noVersion = loadSample()
    delete noVersion.mokkun
    expect(validate(noVersion)).toBe(false)
  })
})

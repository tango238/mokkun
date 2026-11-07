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
    expect(validate.errors).toContainEqual(
      expect.objectContaining({ keyword: 'enum', instancePath: '/views/order_form/sections/0/fields/0/component' })
    )
  })

  it('rejects unknown keys and a missing mokkun: 2', () => {
    const { validate } = createValidator()
    const extra = loadSample()
    extra.views.order_form.sections[0].fields[0].unknownKey = 1
    expect(validate(extra)).toBe(false)
    expect(validate.errors).toContainEqual(
      expect.objectContaining({
        keyword: 'additionalProperties',
        instancePath: '/views/order_form/sections/0/fields/0',
        params: { additionalProperty: 'unknownKey' },
      })
    )

    const noVersion = loadSample()
    delete noVersion.mokkun
    expect(validate(noVersion)).toBe(false)
    expect(validate.errors).toContainEqual(
      expect.objectContaining({ keyword: 'required', instancePath: '', params: { missingProperty: 'mokkun' } })
    )
  })

  it('Pattern accepts only fields/note; navigate needs "to"; list kind needs "list"; reveal/repeatable need form', () => {
    const { validate } = createValidator()
    const errorsOf = (data: unknown) => {
      expect(validate(data)).toBe(false)
      return validate.errors ?? []
    }

    const withPattern = loadSample()
    withPattern.patterns = { p: { fields: [], note: 'n', title: 'x' } }
    expect(errorsOf(withPattern)).toContainEqual(
      expect.objectContaining({ keyword: 'additionalProperties', instancePath: '/patterns/p', params: { additionalProperty: 'title' } })
    )

    const nav = loadSample()
    delete nav.views.order_form.primaryAction.to
    expect(errorsOf(nav)).toContainEqual(
      expect.objectContaining({ keyword: 'required', instancePath: '/views/order_form/primaryAction', params: { missingProperty: 'to' } })
    )

    const list = loadSample()
    delete list.views.order_list.sections[1].list
    expect(errorsOf(list)).toContainEqual(
      expect.objectContaining({ keyword: 'required', instancePath: '/views/order_list/sections/1', params: { missingProperty: 'list' } })
    )

    const reveal = loadSample()
    reveal.views.order_confirm.sections[0].reveal = 'collapsed'
    expect(errorsOf(reveal).some((e) => e.keyword === 'not' && e.instancePath === '/views/order_confirm/sections/0')).toBe(true)

    const emptyLabel = loadSample()
    emptyLabel.views.order_form.sections[0].fields[0].label = ''
    expect(errorsOf(emptyLabel)).toContainEqual(
      expect.objectContaining({ keyword: 'minLength', instancePath: '/views/order_form/sections/0/fields/0/label' })
    )

    const okPattern = loadSample()
    okPattern.patterns = { p: { fields: [{ item: 'x', label: 'X', component: 'text' }], note: 'n' } }
    expect(validate(okPattern)).toBe(true)
  })
})

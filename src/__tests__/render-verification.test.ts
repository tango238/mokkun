/**
 * Render Verification Tests
 * YAMLで定義されたすべてのフィールドがレンダリングされることを検証
 *
 * このテストは以下を保証します:
 * 1. VALID_FIELD_TYPES に定義された全タイプがレンダリング可能
 * 2. form-fields.ts の switch 文が VALID_FIELD_TYPES を全てカバー
 * 3. YAMLファイルの全フィールドが正常にレンダリングされる
 * 4. 新しいコンポーネント追加時の漏れを検出
 */

import { describe, it, expect, beforeAll } from 'vitest'
import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import { JSDOM } from 'jsdom'
import { renderField, renderFields } from '../renderer/components/form-fields'
import { VALID_FIELD_TYPES, parseYaml } from '../parser/yaml-parser'
import type { InputField, InputFieldType, MokkunSchemaRaw, DataTableField, RepeaterField, Action } from '../types/schema'

// Setup DOM environment
beforeAll(() => {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
  global.document = dom.window.document
})

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * YAMLファイルからすべてのフィールドを抽出
 */
function extractFieldsFromYaml(yamlContent: string): InputField[] {
  const schema = yaml.load(yamlContent) as MokkunSchemaRaw
  const fields: InputField[] = []

  if (!schema?.view) {
    return fields
  }

  for (const screenName of Object.keys(schema.view)) {
    const screen = schema.view[screenName]

    // 直接fieldsプロパティ
    if (screen.fields && Array.isArray(screen.fields)) {
      fields.push(...(screen.fields as InputField[]))
    }

    // sectionsの中のinput_fields
    if (screen.sections && Array.isArray(screen.sections)) {
      for (const section of screen.sections) {
        if (section.input_fields && Array.isArray(section.input_fields)) {
          fields.push(...(section.input_fields as InputField[]))
        }
      }
    }

    // wizardの中のsteps.fields
    if (screen.wizard?.steps && Array.isArray(screen.wizard.steps)) {
      for (const step of screen.wizard.steps) {
        if (step.fields && Array.isArray(step.fields)) {
          fields.push(...(step.fields as InputField[]))
        }
      }
    }
  }

  return fields
}

/**
 * フィールドタイプごとにグループ化
 */
function groupFieldsByType(fields: InputField[]): Map<InputFieldType, InputField[]> {
  const grouped = new Map<InputFieldType, InputField[]>()

  for (const field of fields) {
    const type = field.type as InputFieldType
    if (!grouped.has(type)) {
      grouped.set(type, [])
    }
    grouped.get(type)!.push(field)
  }

  return grouped
}

/**
 * HTMLが有効かどうかを検証
 */
function isValidHtml(html: string): { valid: boolean; error?: string } {
  if (!html || html.trim().length === 0) {
    return { valid: false, error: 'Empty HTML output' }
  }

  // HTMLタグが含まれているか
  if (!/<[^>]+>/.test(html)) {
    return { valid: false, error: 'No HTML tags found' }
  }

  // 基本的な構造チェック（divまたはspanまたはinputで始まる）
  if (!/<(div|span|input|label|select|textarea|button|form|header|section|nav|ul|ol)/i.test(html)) {
    return { valid: false, error: 'No valid container element found' }
  }

  return { valid: true }
}

// =============================================================================
// Static Analysis Helpers
// =============================================================================

/**
 * form-fields.ts から switch 文の case を抽出
 */
function extractCaseStatementsFromFormFields(): string[] {
  const formFieldsPath = path.join(__dirname, '../renderer/components/form-fields.ts')
  const content = fs.readFileSync(formFieldsPath, 'utf-8')

  // case 'xxx': または case 'xxx': case 'yyy': のパターンを抽出
  const casePattern = /case\s+['"]([^'"]+)['"]\s*:/g
  const cases: string[] = []
  let match

  while ((match = casePattern.exec(content)) !== null) {
    cases.push(match[1])
  }

  return [...new Set(cases)] // 重複を除去
}

/**
 * schema.ts から InputField union の型を抽出
 */
function extractInputFieldTypesFromSchema(): string[] {
  const schemaPath = path.join(__dirname, '../types/schema.ts')
  const content = fs.readFileSync(schemaPath, 'utf-8')

  // InputField = の後から ; までを抽出
  const unionMatch = content.match(/export type InputField\s*=\s*([\s\S]*?)(?=\n\n|\/\*\*|export type InputFieldType)/)
  if (!unionMatch) {
    return []
  }

  // | XxxField パターンを抽出
  const fieldPattern = /\|\s*(\w+Field(?:Type)?)/g
  const fieldTypes: string[] = []
  let match

  while ((match = fieldPattern.exec(unionMatch[1])) !== null) {
    fieldTypes.push(match[1])
  }

  return fieldTypes
}

/**
 * FieldType インターフェースから type を抽出
 */
function extractTypeFromFieldInterface(interfaceName: string): string | null {
  const schemaPath = path.join(__dirname, '../types/schema.ts')
  const content = fs.readFileSync(schemaPath, 'utf-8')

  // interface XxxField { ... type: 'xxx' ... } を探す
  const interfacePattern = new RegExp(
    `export interface ${interfaceName}[^{]*\\{[^}]*type:\\s*['"]([^'"]+)['"]`,
    's'
  )
  const match = content.match(interfacePattern)

  return match ? match[1] : null
}

// =============================================================================
// Test Suites
// =============================================================================

describe('Render Verification', () => {
  describe('Component Registration Integrity', () => {
    it('should have all VALID_FIELD_TYPES handled in form-fields.ts switch', () => {
      const casesInSwitch = extractCaseStatementsFromFormFields()
      const missingInSwitch: string[] = []

      for (const type of VALID_FIELD_TYPES) {
        if (!casesInSwitch.includes(type)) {
          missingInSwitch.push(type)
        }
      }

      if (missingInSwitch.length > 0) {
        console.error('Types in VALID_FIELD_TYPES but missing in form-fields.ts switch:')
        missingInSwitch.forEach((t) => console.error(`  - ${t}`))
      }

      expect(missingInSwitch).toHaveLength(0)
    })

    it('should have all switch cases registered in VALID_FIELD_TYPES', () => {
      const casesInSwitch = extractCaseStatementsFromFormFields()
      const missingInValidTypes: string[] = []

      for (const caseType of casesInSwitch) {
        if (!VALID_FIELD_TYPES.includes(caseType as InputFieldType)) {
          missingInValidTypes.push(caseType)
        }
      }

      if (missingInValidTypes.length > 0) {
        console.error('Types in form-fields.ts switch but missing in VALID_FIELD_TYPES:')
        missingInValidTypes.forEach((t) => console.error(`  - ${t}`))
      }

      expect(missingInValidTypes).toHaveLength(0)
    })

    it('should have InputField union types matching VALID_FIELD_TYPES count', () => {
      const fieldInterfaces = extractInputFieldTypesFromSchema()
      const schemaTypes: string[] = []

      for (const interfaceName of fieldInterfaces) {
        const type = extractTypeFromFieldInterface(interfaceName)
        if (type) {
          schemaTypes.push(type)
        }
      }

      const schemaTypesSet = new Set(schemaTypes)
      const validTypesSet = new Set(VALID_FIELD_TYPES)

      // schema.ts にあって VALID_FIELD_TYPES にない
      const missingInValidTypes = [...schemaTypesSet].filter((t) => !validTypesSet.has(t as InputFieldType))

      // VALID_FIELD_TYPES にあって schema.ts にない
      const missingInSchema = [...validTypesSet].filter((t) => !schemaTypesSet.has(t))

      if (missingInValidTypes.length > 0) {
        console.error('Types in schema.ts but missing in VALID_FIELD_TYPES:')
        missingInValidTypes.forEach((t) => console.error(`  - ${t}`))
      }

      if (missingInSchema.length > 0) {
        console.error('Types in VALID_FIELD_TYPES but missing in schema.ts:')
        missingInSchema.forEach((t) => console.error(`  - ${t}`))
      }

      expect(missingInValidTypes).toHaveLength(0)
      expect(missingInSchema).toHaveLength(0)
    })

    it('should not render "unknown-field" for any VALID_FIELD_TYPE', () => {
      const unknownRendered: string[] = []

      for (const fieldType of VALID_FIELD_TYPES) {
        const minimalField = createMinimalField(fieldType)
        const html = renderField(minimalField)

        if (html.includes('unknown-field') || html.includes('不明なフィールドタイプ')) {
          unknownRendered.push(fieldType)
        }
      }

      if (unknownRendered.length > 0) {
        console.error('Field types rendering as "unknown-field":')
        unknownRendered.forEach((t) => console.error(`  - ${t}`))
      }

      expect(unknownRendered).toHaveLength(0)
    })
  })

  describe('All VALID_FIELD_TYPES should be renderable', () => {
    it.each(VALID_FIELD_TYPES)('should render field type: %s', (fieldType) => {
      // 各フィールドタイプの最小限の定義
      const minimalField: InputField = createMinimalField(fieldType)

      // レンダリング実行
      const html = renderField(minimalField)

      // 検証
      expect(html).toBeDefined()
      expect(html.length).toBeGreaterThan(0)

      const validation = isValidHtml(html)
      expect(validation.valid).toBe(true)
    })
  })

  describe('admin-dashboard.yaml fields rendering', () => {
    let yamlContent: string
    let fields: InputField[]

    beforeAll(() => {
      const yamlPath = path.join(__dirname, '../../examples/admin-dashboard.yaml')
      yamlContent = fs.readFileSync(yamlPath, 'utf-8')
      fields = extractFieldsFromYaml(yamlContent)
    })

    it('should extract fields from YAML', () => {
      expect(fields.length).toBeGreaterThan(0)
    })

    it('should render all extracted fields without errors', () => {
      const errors: { field: InputField; error: string }[] = []

      for (const field of fields) {
        try {
          const html = renderField(field)
          const validation = isValidHtml(html)

          if (!validation.valid) {
            errors.push({
              field,
              error: validation.error || 'Invalid HTML',
            })
          }
        } catch (e) {
          errors.push({
            field,
            error: e instanceof Error ? e.message : String(e),
          })
        }
      }

      // エラーがあれば詳細を表示
      if (errors.length > 0) {
        const errorSummary = errors.map(
          (e) => `  - [${e.field.type}] ${e.field.id || 'no-id'}: ${e.error}`
        ).join('\n')
        console.error(`Rendering errors:\n${errorSummary}`)
      }

      expect(errors).toHaveLength(0)
    })

    it('should cover all field types used in YAML', () => {
      const groupedFields = groupFieldsByType(fields)
      const usedTypes = Array.from(groupedFields.keys()).sort()

      // 使用されているタイプを表示
      console.log(`Field types used in admin-dashboard.yaml (${usedTypes.length} types):`)
      for (const type of usedTypes) {
        const count = groupedFields.get(type)?.length || 0
        console.log(`  - ${type}: ${count} field(s)`)
      }

      expect(usedTypes.length).toBeGreaterThan(0)
    })
  })

  describe('screens.yaml fields rendering', () => {
    let yamlContent: string
    let fields: InputField[]

    beforeAll(() => {
      const yamlPath = path.join(__dirname, '../../examples/screens.yaml')
      yamlContent = fs.readFileSync(yamlPath, 'utf-8')
      fields = extractFieldsFromYaml(yamlContent)
    })

    it('should extract and render all fields', () => {
      expect(fields.length).toBeGreaterThan(0)

      const errors: string[] = []
      for (const field of fields) {
        try {
          const html = renderField(field)
          if (!isValidHtml(html).valid) {
            errors.push(`[${field.type}] ${field.id}: Invalid HTML`)
          }
        } catch (e) {
          errors.push(`[${field.type}] ${field.id}: ${e}`)
        }
      }

      expect(errors).toHaveLength(0)
    })
  })

  describe('renderFields batch rendering', () => {
    it('should render multiple fields at once', () => {
      const fields: InputField[] = [
        { id: 'text1', type: 'text', label: 'Text 1' },
        { id: 'num1', type: 'number', label: 'Number 1' },
        { id: 'sel1', type: 'select', label: 'Select 1', options: [{ value: 'a', label: 'A' }] },
      ]

      const html = renderFields(fields)

      expect(html).toBeDefined()
      expect(html.length).toBeGreaterThan(0)

      // 各フィールドがレンダリングされていることを確認
      expect(html).toContain('text1')
      expect(html).toContain('num1')
      expect(html).toContain('sel1')
    })
  })

  describe('teamkit-compat.yaml fields rendering', () => {
    let yamlContent: string
    let fields: InputField[]

    beforeAll(() => {
      const yamlPath = path.join(__dirname, '../../examples/teamkit-compat.yaml')
      yamlContent = fs.readFileSync(yamlPath, 'utf-8')
      fields = extractFieldsFromYaml(yamlContent)
    })

    it('should extract fields from teamkit-compat YAML', () => {
      expect(fields.length).toBeGreaterThan(0)
    })

    it('should render all extracted fields without errors', () => {
      const errors: { field: InputField; error: string }[] = []

      for (const field of fields) {
        try {
          const html = renderField(field)
          const validation = isValidHtml(html)

          if (!validation.valid) {
            errors.push({
              field,
              error: validation.error || 'Invalid HTML',
            })
          }
        } catch (e) {
          errors.push({
            field,
            error: e instanceof Error ? e.message : String(e),
          })
        }
      }

      if (errors.length > 0) {
        const errorSummary = errors.map(
          (e) => `  - [${e.field.type}] ${e.field.id || 'no-id'}: ${e.error}`
        ).join('\n')
        console.error(`Rendering errors:\n${errorSummary}`)
      }

      expect(errors).toHaveLength(0)
    })

    it('should cover teamkit field types', () => {
      const groupedFields = groupFieldsByType(fields)
      const usedTypes = Array.from(groupedFields.keys()).sort()

      console.log(`Field types used in teamkit-compat.yaml (${usedTypes.length} types):`)
      for (const type of usedTypes) {
        const count = groupedFields.get(type)?.length || 0
        console.log(`  - ${type}: ${count} field(s)`)
      }

      // teamkit の主要フィールドタイプが含まれていることを確認
      const expectedTypes: InputFieldType[] = [
        'text', 'select', 'data_table', 'combobox', 'date_picker',
        'repeater', 'radio_group', 'textarea', 'toggle', 'checkbox',
      ]

      for (const expected of expectedTypes) {
        expect(usedTypes).toContain(expected)
      }
    })
  })

  describe('teamkit-compat.yaml parser integration', () => {
    it('should parse teamkit YAML without validation errors', () => {
      const yamlPath = path.join(__dirname, '../../examples/teamkit-compat.yaml')
      const yamlContent = fs.readFileSync(yamlPath, 'utf-8')

      // parseYaml を使って正規化テスト
      const result = parseYaml(yamlContent)

      expect(result.success).toBe(true)

      if (result.success) {
        const schema = result.data
        // 3画面が定義されている
        const screenNames = Object.keys(schema.view)
        expect(screenNames).toContain('order_list')
        expect(screenNames).toContain('order_form')
        expect(screenNames).toContain('notification_settings')

        // order_list の data_table にauto-IDが付与されている
        const orderListFields = schema.view.order_list.fields ?? []
        const dataTable = orderListFields.find((f: InputField) => f.type === 'data_table')
        if (dataTable && dataTable.type === 'data_table') {
          const data = (dataTable as DataTableField).data
          if (data && data.length > 0) {
            // teamkit の data 行にはIDがないので自動生成されるはず
            for (const row of data) {
              expect(row.id).toBeDefined()
            }
          }
        }

        // order_form の repeater の item_fields が正規化されている
        const orderFormFields = schema.view.order_form.fields ?? []
        const repeater = orderFormFields.find((f: InputField) => f.type === 'repeater')
        if (repeater && repeater.type === 'repeater') {
          expect((repeater as RepeaterField).item_fields.length).toBe(3)
        }

        // notification_settings の visible_when が保持されている
        const notifFields = schema.view.notification_settings.fields ?? []
        const emailFreq = notifFields.find((f: InputField) => f.id === 'email_frequency')
        expect(emailFreq).toBeDefined()
        if (emailFreq) {
          expect(emailFreq.visible_when).toBeDefined()
        }

        // navigate アクションの to が保持されている
        const orderListActions = schema.view.order_list.actions ?? []
        const addOrderAction = orderListActions.find((a: Action) => a.id === 'add_order')
        expect(addOrderAction).toBeDefined()
        if (addOrderAction && addOrderAction.type === 'navigate') {
          expect(addOrderAction.to).toBe('order_form')
        }

        // common_components が正規化されている
        expect(schema.common_components).toBeDefined()

        // validations が正規化されている
        expect(schema.validations).toBeDefined()
      }
    })
  })

  describe('Field type coverage report', () => {
    it('should report coverage of VALID_FIELD_TYPES', () => {
      const yamlPath = path.join(__dirname, '../../examples/admin-dashboard.yaml')
      const yamlContent = fs.readFileSync(yamlPath, 'utf-8')
      const fields = extractFieldsFromYaml(yamlContent)
      const usedTypes = new Set(fields.map((f) => f.type))

      const covered: string[] = []
      const notCovered: string[] = []

      for (const type of VALID_FIELD_TYPES) {
        if (usedTypes.has(type)) {
          covered.push(type)
        } else {
          notCovered.push(type)
        }
      }

      console.log('\n=== Field Type Coverage Report ===')
      console.log(`Total VALID_FIELD_TYPES: ${VALID_FIELD_TYPES.length}`)
      console.log(`Covered in YAML: ${covered.length} (${((covered.length / VALID_FIELD_TYPES.length) * 100).toFixed(1)}%)`)
      console.log(`Not covered: ${notCovered.length}`)

      if (notCovered.length > 0) {
        console.log('\nField types not used in admin-dashboard.yaml:')
        notCovered.forEach((t) => console.log(`  - ${t}`))
      }

      // 少なくとも70%のカバレッジを期待
      const coverageRate = covered.length / VALID_FIELD_TYPES.length
      expect(coverageRate).toBeGreaterThanOrEqual(0.7)
    })
  })
})

// =============================================================================
// Minimal Field Factory
// =============================================================================

/**
 * フィールドタイプごとの最小限の定義を生成
 */
function createMinimalField(fieldType: InputFieldType): InputField {
  const baseField = {
    id: `test-${fieldType}`,
    label: `Test ${fieldType}`,
  }

  switch (fieldType) {
    case 'text':
    case 'number':
    case 'date_picker':
    case 'time_picker':
      return { ...baseField, type: fieldType }

    case 'textarea':
      return { ...baseField, type: 'textarea' }

    case 'select':
    case 'multi_select':
      return {
        ...baseField,
        type: fieldType,
        options: [{ value: 'opt1', label: 'Option 1' }],
      }

    case 'combobox':
      return {
        ...baseField,
        type: 'combobox',
        options: [{ value: 'opt1', label: 'Option 1' }],
      }

    case 'radio_group':
      return {
        ...baseField,
        type: 'radio_group',
        options: [{ value: 'opt1', label: 'Option 1' }],
      }

    case 'checkbox':
      return { ...baseField, type: 'checkbox' }

    case 'checkbox_group':
      return {
        ...baseField,
        type: 'checkbox_group',
        options: [{ value: 'opt1', label: 'Option 1' }],
      }

    case 'duration_picker':
      return { ...baseField, type: 'duration_picker' }

    case 'duration_input':
      return { ...baseField, type: 'duration_input' }

    case 'file_upload':
      return { ...baseField, type: 'file_upload' }

    case 'image_uploader':
      return { ...baseField, type: 'image_uploader' }

    case 'repeater':
      return {
        ...baseField,
        type: 'repeater',
        item_fields: [{ id: 'item', type: 'text', label: 'Item' }],
      }

    case 'data_table':
      return {
        ...baseField,
        type: 'data_table',
        columns: [{ id: 'col1', label: 'Column 1' }],
        data: [],
      }

    case 'google_map_embed':
      return { ...baseField, type: 'google_map_embed' }

    case 'photo_manager':
      return { ...baseField, type: 'photo_manager' }

    case 'toggle':
      return { ...baseField, type: 'toggle' }

    case 'badge':
      return { ...baseField, type: 'badge' }

    case 'browser':
      return {
        ...baseField,
        type: 'browser',
        browser_items: [{ value: 'item1', label: 'Item 1' }],
      }

    case 'calendar':
      return { ...baseField, type: 'calendar' }

    case 'heading':
      return { ...baseField, type: 'heading', level: 2 }

    case 'tooltip':
      return { ...baseField, type: 'tooltip', content: 'Tooltip content' }

    case 'pagination':
      return { ...baseField, type: 'pagination', totalItems: 100 }

    case 'float_area':
      return { ...baseField, type: 'float_area' }

    case 'loader':
      return { ...baseField, type: 'loader' }

    case 'notification_bar':
      return { ...baseField, type: 'notification_bar' }

    case 'response_message':
      return { ...baseField, type: 'response_message' }

    case 'timeline':
      return { ...baseField, type: 'timeline' }

    case 'chip':
      return { ...baseField, type: 'chip' }

    case 'status_label':
      return { ...baseField, type: 'status_label' }

    case 'segmented_control':
      return {
        ...baseField,
        type: 'segmented_control',
        options: [{ value: 'opt1', label: 'Option 1' }],
      }

    case 'tabs':
      return { ...baseField, type: 'tabs' }

    case 'line_clamp':
      return { ...baseField, type: 'line_clamp' }

    case 'disclosure':
      return { ...baseField, type: 'disclosure' }

    case 'accordion_panel':
      return { ...baseField, type: 'accordion_panel' }

    case 'section_nav':
      return { ...baseField, type: 'section_nav' }

    case 'stepper':
      return { ...baseField, type: 'stepper' }

    case 'information_panel':
      return { ...baseField, type: 'information_panel' }

    case 'dropdown':
      return {
        ...baseField,
        type: 'dropdown',
        options: [{ value: 'opt1', label: 'Option 1' }],
      }

    case 'delete_confirm_dialog':
      return { ...baseField, type: 'delete_confirm_dialog' }

    case 'definition_list':
      return { ...baseField, type: 'definition_list' }

    default:
      // Unknown type - return as-is
      return { ...baseField, type: fieldType } as InputField
  }
}

/**
 * YAML Parser Tests
 */

import { parseYaml, formatParseErrors, getScreen, findFieldById } from '../parser'

// =============================================================================
// Valid YAML Test Cases
// =============================================================================

const validSimpleYaml = `
view:
  login:
    title: Login
    fields:
      - id: email
        type: text
        label: Email
        required: true
        input_type: email
      - id: password
        type: text
        label: Password
        required: true
        input_type: password
    actions:
      - id: submit
        type: submit
        label: Login
        style: primary
`

const validWizardYaml = `
view:
  registration:
    title: User Registration
    wizard:
      steps:
        - id: step1
          title: Basic Info
          fields:
            - id: name
              type: text
              label: Full Name
              required: true
            - id: email
              type: text
              label: Email
              input_type: email
        - id: step2
          title: Preferences
          fields:
            - id: notifications
              type: checkbox_group
              label: Notification Preferences
              options:
                - value: email
                  label: Email notifications
                - value: sms
                  label: SMS notifications
      show_progress: true
      allow_back: true
`

const validCompleteYaml = `
view:
  contact_form:
    title: Contact Us
    description: Send us a message
    fields:
      - id: category
        type: select
        label: Category
        options:
          - value: general
            label: General Inquiry
          - value: support
            label: Technical Support
          - value: sales
            label: Sales
        required: true
      - id: message
        type: textarea
        label: Message
        rows: 5
        max_length: 1000
      - id: files
        type: file_upload
        label: Attachments
        accept:
          - .pdf
          - .jpg
          - .png
        max_size: 5242880
        multiple: true
    actions:
      - id: send
        type: submit
        label: Send Message
        style: primary
      - id: cancel
        type: navigate
        label: Cancel
        to: /home

common_components:
  address_fields:
    name: Address Fields
    type: field_group
    fields:
      - id: street
        type: text
        label: Street Address
      - id: city
        type: text
        label: City
      - id: postal_code
        type: text
        label: Postal Code

validations:
  email_format:
    name: Email Format
    rules:
      pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\\\.[a-zA-Z]{2,}$"
      message: Please enter a valid email address
`

const validRepeaterYaml = `
view:
  order_form:
    title: Order Form
    fields:
      - id: items
        type: repeater
        label: Order Items
        min_items: 1
        max_items: 10
        add_button_label: Add Item
        item_fields:
          - id: product
            type: select
            label: Product
            options:
              - value: prod1
                label: Product 1
              - value: prod2
                label: Product 2
          - id: quantity
            type: number
            label: Quantity
            min: 1
            max: 100
`

const validDataTableYaml = `
view:
  customer_list:
    title: 顧客一覧
    fields:
      - id: customers
        type: data_table
        label: 顧客リスト
        columns:
          - id: name
            label: 名前
            sortable: true
          - id: email
            label: メールアドレス
            sortable: true
          - id: status
            label: ステータス
            format: status
        data:
          - id: 1
            name: 田中太郎
            email: tanaka@example.com
            status: active
          - id: 2
            name: 鈴木花子
            email: suzuki@example.com
            status: inactive
        selection: multiple
        pagination:
          page_size: 10
          show_page_size_selector: true
        filters:
          fields:
            - id: status_filter
              label: ステータス
              type: select
              options:
                - value: all
                  label: すべて
                - value: active
                  label: 有効
                - value: inactive
                  label: 無効
        row_actions:
          - id: edit
            label: 編集
            icon: ✏️
          - id: delete
            label: 削除
            icon: 🗑️
            style: danger
        empty_state:
          message: データがありません
          icon: 📭
        striped: true
        hoverable: true
`

// =============================================================================
// Invalid YAML Test Cases
// =============================================================================

const invalidYamlSyntax = `
view:
  login:
    title: Login
    fields:
      - id: email
        type: text
          label: Email  # invalid indentation
`

const missingViewYaml = `
screens:
  login:
    title: Login
`

const missingFieldIdYaml = `
view:
  login:
    title: Login
    fields:
      - type: text
        label: Email
`

const invalidFieldTypeYaml = `
view:
  login:
    title: Login
    fields:
      - id: email
        type: invalid_type
        label: Email
`

const missingOptionsYaml = `
view:
  form:
    title: Form
    fields:
      - id: category
        type: select
        label: Category
`

// =============================================================================
// Tests
// =============================================================================

describe('parseYaml', () => {
  describe('Valid YAML', () => {
    it('should parse simple form YAML', () => {
      const result = parseYaml(validSimpleYaml)

      if (!result.success) {
        console.log(formatParseErrors(result.errors))
      }

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.view.login).toBeDefined()
        expect(result.data.view.login.title).toBe('Login')
        expect(result.data.view.login.fields).toHaveLength(2)
        expect(result.data.view.login.actions).toHaveLength(1)
      }
    })

    it('should parse wizard YAML', () => {
      const result = parseYaml(validWizardYaml)

      expect(result.success).toBe(true)
      if (result.success) {
        const screen = result.data.view.registration
        expect(screen.wizard).toBeDefined()
        expect(screen.wizard?.steps).toHaveLength(2)
        expect(screen.wizard?.show_progress).toBe(true)
        expect(screen.wizard?.allow_back).toBe(true)
      }
    })

    it('should parse complete YAML with common_components and validations', () => {
      const result = parseYaml(validCompleteYaml)

      if (!result.success) {
        console.log(formatParseErrors(result.errors))
      }

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.common_components).toBeDefined()
        expect(result.data.common_components?.address_fields).toBeDefined()
        expect(result.data.validations).toBeDefined()
        expect(result.data.validations?.email_format).toBeDefined()
      }
    })

    it('should parse repeater fields', () => {
      const result = parseYaml(validRepeaterYaml)

      expect(result.success).toBe(true)
      if (result.success) {
        const field = result.data.view.order_form.fields?.[0]
        expect(field?.type).toBe('repeater')
        if (field?.type === 'repeater') {
          expect(field.item_fields).toHaveLength(2)
        }
      }
    })

    it('should parse data_table fields', () => {
      const result = parseYaml(validDataTableYaml)

      if (!result.success) {
        console.log(formatParseErrors(result.errors))
      }

      expect(result.success).toBe(true)
      if (result.success) {
        const field = result.data.view.customer_list.fields?.[0]
        expect(field?.type).toBe('data_table')
        if (field?.type === 'data_table') {
          // columns
          expect(field.columns).toHaveLength(3)
          expect(field.columns[0].id).toBe('name')
          expect(field.columns[0].sortable).toBe(true)

          // data
          expect(field.data).toHaveLength(2)
          expect(field.data?.[0].name).toBe('田中太郎')

          // selection
          expect(field.selection).toBe('multiple')

          // pagination
          expect(field.pagination?.page_size).toBe(10)

          // filters
          expect(field.filters?.fields).toBeDefined()
          expect(field.filters?.fields?.[0].id).toBe('status_filter')

          // row_actions
          expect(field.row_actions).toHaveLength(2)
          expect(field.row_actions?.[0].id).toBe('edit')

          // empty_state
          expect(field.empty_state?.message).toBe('データがありません')

          // style options
          expect(field.striped).toBe(true)
          expect(field.hoverable).toBe(true)
        }
      }
    })
  })

  describe('Invalid YAML', () => {
    it('should return error for invalid YAML syntax', () => {
      const result = parseYaml(invalidYamlSyntax)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors[0].type).toBe('YAML_SYNTAX_ERROR')
      }
    })

    it('should return error for missing view section', () => {
      const result = parseYaml(missingViewYaml)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.some(e => e.message.includes('view'))).toBe(true)
      }
    })

    it('should return error for missing field id', () => {
      const result = parseYaml(missingFieldIdYaml)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.some(e => e.message.includes('id'))).toBe(true)
      }
    })

    it('should allow unknown field types (for extensibility)', () => {
      // Unknown field types are now allowed to support placeholder/future types
      const result = parseYaml(invalidFieldTypeYaml)

      expect(result.success).toBe(true)
      if (result.success) {
        // The unknown type should be preserved in the parsed result
        const screen = result.data.view['login']
        expect(screen.fields).toBeDefined()
        expect(screen.fields?.[0].type).toBe('invalid_type')
      }
    })

    it('should return error for select without options', () => {
      const result = parseYaml(missingOptionsYaml)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.errors.some(e => e.message.includes('options'))).toBe(true)
      }
    })
  })
})

describe('Utility Functions', () => {
  it('getScreen should return correct screen', () => {
    const result = parseYaml(validSimpleYaml)
    if (result.success) {
      const screen = getScreen(result.data, 'login')
      expect(screen?.title).toBe('Login')
    }
  })

  it('findFieldById should find field in flat list', () => {
    const result = parseYaml(validSimpleYaml)
    if (result.success && result.data.view.login.fields) {
      const field = findFieldById(result.data.view.login.fields, 'email')
      expect(field?.label).toBe('Email')
    }
  })

  it('findFieldById should find field in repeater', () => {
    const result = parseYaml(validRepeaterYaml)
    if (result.success && result.data.view.order_form.fields) {
      const field = findFieldById(result.data.view.order_form.fields, 'quantity')
      expect(field?.type).toBe('number')
    }
  })
})

describe('formatParseErrors', () => {
  it('should format errors with path and line info', () => {
    const errors = [
      { type: 'MISSING_REQUIRED_FIELD' as const, message: 'Field required', path: 'view.login.fields[0]' },
      { type: 'YAML_SYNTAX_ERROR' as const, message: 'Bad syntax', line: 5, column: 10 },
    ]

    const formatted = formatParseErrors(errors)
    expect(formatted).toContain('view.login.fields[0]')
    expect(formatted).toContain('line 6')  // 1-indexed
    expect(formatted).toContain('column 11')  // 1-indexed
  })
})

// =============================================================================
// Array Format YAML Test Cases (新形式)
// =============================================================================

const arrayFormatYaml = `
view:
  - name: "施設一覧画面"
    actor: "ホスト"
    purpose: "登録済み施設の一覧表示と管理操作を行う"
    display_fields:
      - "施設名"
      - "住所"
    filters:
      - "公開ステータス"
    actions:
      - "新規施設登録"
      - "編集"

  - name: "施設情報統合フォーム"
    actor: "ホスト"
    purpose: "施設に関連するすべての情報を登録する"
    sections:
      - section_name: "基本情報"
        icon: "📋"
        input_fields:
          - field_name: "施設名"
            type: "text"
            required: true
            description: "施設の正式名称"
          - field_name: "都道府県"
            type: "select"
            required: true
            options:
              - "東京都"
              - "大阪府"
              - "神奈川県"
      - section_name: "詳細情報"
        icon: "📝"
        input_fields:
          - field_name: "施設紹介文"
            type: "textarea"
            required: true
    actions:
      - "保存"
      - "キャンセル"

common_components:
  - component_name: "画像アップローダー"
    description: "複数画像のアップロード"
    used_in:
      - "施設情報統合フォーム"

validations:
  - field: "施設名"
    rule: "必須、最大100文字"
  - field: "郵便番号"
    rule: "7桁の半角数字のみ"
`

describe('display_fields to data_table conversion', () => {
  const displayFieldsYaml = `
view:
  - name: "スペース一覧画面"
    actor: "ホスト（オーナー）"
    purpose: "登録済みスペースの一覧表示と管理操作の起点"
    display_fields:
      - "スペース名"
      - "施設名"
      - "収容人数"
      - "広さ"
      - "公開ステータス"
    filters:
      - "施設で絞り込み"
      - "公開ステータスで絞り込み"
      - "キーワード検索"
    actions:
      - "新規スペース登録"
      - "スペース編集"
      - "スペース削除"
`

  it('should convert display_fields to data_table field', () => {
    const result = parseYaml(displayFieldsYaml)

    if (!result.success) {
      console.log(formatParseErrors(result.errors))
    }

    expect(result.success).toBe(true)
    if (result.success) {
      const screen = result.data.view['スペース一覧画面']
      expect(screen).toBeDefined()
      expect(screen.title).toBe('スペース一覧画面')
      expect(screen.description).toBe('登録済みスペースの一覧表示と管理操作の起点')

      // fieldsが生成されていることを確認
      expect(screen.fields).toBeDefined()
      expect(screen.fields?.length).toBe(1)

      // data_tableフィールドが生成されていることを確認
      const field = screen.fields?.[0]
      expect(field?.type).toBe('data_table')

      if (field?.type === 'data_table') {
        // カラムが生成されていることを確認
        expect(field.columns.length).toBe(5)
        expect(field.columns[0].label).toBe('スペース名')
        expect(field.columns[1].label).toBe('施設名')
        expect(field.columns[2].label).toBe('収容人数')
        expect(field.columns[3].label).toBe('広さ')
        expect(field.columns[4].label).toBe('公開ステータス')

        // フィルターが生成されていることを確認
        expect(field.filters).toBeDefined()
        expect(field.filters?.enabled).toBe(true)
        expect(field.filters?.show_search).toBe(true) // キーワード検索あり
        expect(field.filters?.fields?.length).toBe(2) // キーワード検索以外

        // ページネーションが設定されていることを確認
        expect(field.pagination?.enabled).toBe(true)
        expect(field.pagination?.page_size).toBe(10)

        // empty_stateが設定されていることを確認
        expect(field.empty_state?.title).toBe('データがありません')
      }
    }
  })

  it('should render screen with display_fields as data_table', async () => {
    const { renderScreen } = await import('../renderer/screen-renderer')

    const result = parseYaml(displayFieldsYaml)
    expect(result.success).toBe(true)

    if (result.success) {
      const screen = result.data.view['スペース一覧画面']
      const html = renderScreen(screen)

      // data_tableがレンダリングされていることを確認
      expect(html).toContain('mokkun-data-table')
      expect(html).toContain('スペース名')
      expect(html).toContain('施設名')
      expect(html).toContain('収容人数')
      expect(html).toContain('広さ')
      expect(html).toContain('公開ステータス')

      // ダミーデータが生成されて行が表示されていることを確認
      expect(html).toContain('data-table-tr')
      expect(html).toContain('data-row-id')
    }
  })
})

describe('Array Format YAML', () => {
  it('should parse array format view', () => {
    const result = parseYaml(arrayFormatYaml)

    if (!result.success) {
      console.log(formatParseErrors(result.errors))
    }

    expect(result.success).toBe(true)
    if (result.success) {
      // 配列形式が正規化されていることを確認
      expect(typeof result.data.view).toBe('object')
      expect(Array.isArray(result.data.view)).toBe(false)

      // 画面名がキーに変換されていることを確認
      const screenNames = Object.keys(result.data.view)
      expect(screenNames.length).toBe(2)

      // 施設一覧画面
      const listScreen = result.data.view['施設一覧画面']
      expect(listScreen.title).toBe('施設一覧画面')
      expect(listScreen.description).toBe('登録済み施設の一覧表示と管理操作を行う')

      // 施設情報統合フォーム - セクションからフィールドが抽出されていることを確認
      const formScreen = result.data.view['施設情報統合フォーム']
      expect(formScreen.title).toBe('施設情報統合フォーム')
      expect(formScreen.fields).toBeDefined()
      expect(formScreen.fields?.length).toBe(3) // 基本情報2 + 詳細情報1

      // フィールドのfield_nameがidに変換されていることを確認
      const firstField = formScreen.fields?.[0]
      expect(firstField?.id).toBe('施設名')
      expect(firstField?.label).toBe('施設名')
      expect(firstField?.type).toBe('text')
      expect(firstField?.required).toBe(true)

      // selectフィールドのオプションが正規化されていることを確認
      const selectField = formScreen.fields?.[1]
      expect(selectField?.type).toBe('select')
      if (selectField?.type === 'select') {
        expect(Array.isArray(selectField.options)).toBe(true)
        const options = selectField.options as Array<{ value: string; label: string }>
        expect(options[0]).toEqual({ value: '東京都', label: '東京都' })
      }
    }
  })

  it('should parse array format common_components', () => {
    const result = parseYaml(arrayFormatYaml)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.common_components).toBeDefined()

      const componentNames = Object.keys(result.data.common_components ?? {})
      expect(componentNames.length).toBe(1)

      const component = result.data.common_components?.['画像アップローダー']
      expect(component?.name).toBe('画像アップローダー')
      expect(component?.description).toBe('複数画像のアップロード')
    }
  })

  it('should parse array format validations', () => {
    const result = parseYaml(arrayFormatYaml)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.validations).toBeDefined()

      const ruleNames = Object.keys(result.data.validations ?? {})
      expect(ruleNames.length).toBe(2)

      const rule = result.data.validations?.['施設名']
      expect(rule?.name).toBe('施設名')
      expect(rule?.message).toBe('必須、最大100文字')
    }
  })

  it('should normalize string actions to action objects', () => {
    const result = parseYaml(arrayFormatYaml)

    expect(result.success).toBe(true)
    if (result.success) {
      const listScreen = result.data.view['施設一覧画面']
      expect(listScreen.actions).toBeDefined()
      expect(listScreen.actions?.length).toBe(2)

      const firstAction = listScreen.actions?.[0]
      expect(firstAction?.label).toBe('新規施設登録')
      expect(firstAction?.type).toBe('submit')
      expect(firstAction?.style).toBe('primary')

      const secondAction = listScreen.actions?.[1]
      expect(secondAction?.label).toBe('編集')
      expect(secondAction?.style).toBe('secondary')
    }
  })
})

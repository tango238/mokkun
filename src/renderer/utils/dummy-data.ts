/**
 * Dummy Data Generator
 * リピーター用のダミーデータ自動生成
 */

import type { InputField, SelectOption } from '../../types'

/**
 * フィールドタイプに応じたダミーデータを生成
 */
export function generateDummyData(field: InputField, index: number = 0): unknown {
  switch (field.type) {
    case 'text':
      return generateTextDummy(field.input_type, field.id, index)

    case 'number':
      return generateNumberDummy(field.min, field.max, index)

    case 'textarea':
      return `Sample text content ${index + 1}`

    case 'select':
      return getFirstOptionValue(field.options)

    case 'multi_select':
      return getFirstOptionValueAsArray(field.options)

    case 'radio_group':
      return getFirstOptionValue(field.options)

    case 'checkbox_group':
      return getFirstOptionValueAsArray(field.options)

    case 'date_picker':
      return generateDateDummy(index)

    case 'time_picker':
      return generateTimeDummy(index)

    case 'duration_picker':
      return 3600 // 1 hour in seconds

    case 'duration_input':
      return '01:00:00'

    case 'file_upload':
      return null

    case 'repeater':
      // ネストされたリピーターの場合、空の配列を返す
      return []

    default:
      return null
  }
}

/**
 * テキスト用ダミーデータ
 */
function generateTextDummy(
  inputType: string | undefined,
  fieldId: string,
  index: number
): string {
  switch (inputType) {
    case 'email':
      return `user${index + 1}@example.com`
    case 'url':
      return `https://example.com/page${index + 1}`
    case 'tel':
      return `090-${String(1000 + index).padStart(4, '0')}-${String(1000 + index).padStart(4, '0')}`
    case 'password':
      return 'password123'
    default:
      return `${capitalizeFirst(fieldId)} ${index + 1}`
  }
}

/**
 * 数値用ダミーデータ
 */
function generateNumberDummy(
  min: number | undefined,
  max: number | undefined,
  index: number
): number {
  const minVal = min ?? 1
  const maxVal = max ?? 100
  return Math.min(minVal + index, maxVal)
}

/**
 * 日付用ダミーデータ
 */
function generateDateDummy(index: number): string {
  const date = new Date()
  date.setDate(date.getDate() + index)
  return date.toISOString().split('T')[0]
}

/**
 * 時間用ダミーデータ
 */
function generateTimeDummy(index: number): string {
  const hour = (9 + index) % 24
  return `${String(hour).padStart(2, '0')}:00`
}

/**
 * 選択肢から最初の値を取得
 */
function getFirstOptionValue(
  options: SelectOption[] | string
): string | number | null {
  if (typeof options === 'string') {
    return null
  }
  return options.length > 0 ? options[0].value : null
}

/**
 * 選択肢から最初の値を配列で取得
 */
function getFirstOptionValueAsArray(
  options: SelectOption[] | string
): (string | number)[] {
  if (typeof options === 'string') {
    return []
  }
  return options.length > 0 ? [options[0].value] : []
}

/**
 * 先頭を大文字にする
 */
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ')
}

/**
 * リピーターアイテム用のダミーデータセットを生成
 */
export function generateRepeaterItemDummyData(
  itemFields: InputField[],
  itemIndex: number
): Record<string, unknown> {
  const data: Record<string, unknown> = {}
  for (const field of itemFields) {
    data[field.id] = generateDummyData(field, itemIndex)
  }
  return data
}

// =============================================================================
// DataTable用ダミーデータ生成（Faker.js使用）
// =============================================================================

/**
 * Faker.jsのインターフェース（CDN版用）
 */
interface FakerInstance {
  locale?: string
  person: {
    fullName: () => string
    firstName: () => string
    lastName: () => string
  }
  internet: {
    email: () => string
  }
  phone: {
    number: () => string
  }
  location: {
    streetAddress: () => string
    state: () => string
    city: () => string
    zipCode: () => string
  }
  company: {
    name: () => string
  }
  commerce: {
    department: () => string
  }
  number: {
    int: (options?: { min?: number; max?: number }) => number
  }
  date: {
    recent: () => Date
    past: () => Date
  }
  string: {
    alphanumeric: (length: number) => string
  }
  lorem: {
    sentence: () => string
    words: (count: number) => string
  }
}

/**
 * グローバルのFaker.jsを取得（CDNで読み込まれた場合）
 */
function getFaker(): FakerInstance | null {
  // CDNで読み込まれた場合、グローバルに `faker` が存在する
  if (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).faker) {
    return (window as unknown as Record<string, unknown>).faker as FakerInstance
  }
  return null
}

/**
 * カラムラベルに基づいてダミーデータを生成
 */
function generateDummyValueForColumn(label: string, rowIndex: number): string | number {
  const faker = getFaker()
  const lowerLabel = label.toLowerCase()

  // Faker.jsが利用可能な場合
  if (faker) {
    // 日本語ロケールを設定（利用可能な場合）
    try {
      faker.locale = 'ja'
    } catch {
      // ロケール設定に失敗しても続行
    }

    // 名前関連
    if (lowerLabel.includes('名前') || lowerLabel.includes('氏名') || lowerLabel.includes('name')) {
      return faker.person.fullName()
    }
    if (lowerLabel.includes('姓') || lowerLabel.includes('苗字')) {
      return faker.person.lastName()
    }
    if (lowerLabel.includes('名') && !lowerLabel.includes('名前')) {
      return faker.person.firstName()
    }

    // 連絡先関連
    if (lowerLabel.includes('メール') || lowerLabel.includes('email')) {
      return faker.internet.email()
    }
    if (lowerLabel.includes('電話') || lowerLabel.includes('tel') || lowerLabel.includes('phone')) {
      return faker.phone.number()
    }

    // 住所関連
    if (lowerLabel.includes('住所') || lowerLabel.includes('address')) {
      return faker.location.streetAddress()
    }
    if (lowerLabel.includes('都道府県') || lowerLabel.includes('県')) {
      return faker.location.state()
    }
    if (lowerLabel.includes('市区町村') || lowerLabel.includes('市')) {
      return faker.location.city()
    }
    if (lowerLabel.includes('郵便番号') || lowerLabel.includes('zip')) {
      return faker.location.zipCode()
    }

    // 会社・ビジネス関連
    if (lowerLabel.includes('会社') || lowerLabel.includes('company') || lowerLabel.includes('施設')) {
      return faker.company.name()
    }
    if (lowerLabel.includes('部署') || lowerLabel.includes('department')) {
      return faker.commerce.department()
    }

    // 数値関連
    if (lowerLabel.includes('人数') || lowerLabel.includes('収容')) {
      return faker.number.int({ min: 1, max: 100 })
    }
    if (lowerLabel.includes('金額') || lowerLabel.includes('価格') || lowerLabel.includes('price')) {
      return faker.number.int({ min: 1000, max: 100000 })
    }
    if (lowerLabel.includes('広さ') || lowerLabel.includes('面積')) {
      return faker.number.int({ min: 10, max: 500 })
    }

    // 日付関連
    if (lowerLabel.includes('日付') || lowerLabel.includes('日時') || lowerLabel.includes('date')) {
      return faker.date.recent().toLocaleDateString('ja-JP')
    }
    if (lowerLabel.includes('作成日') || lowerLabel.includes('登録日')) {
      return faker.date.past().toLocaleDateString('ja-JP')
    }
    if (lowerLabel.includes('更新日')) {
      return faker.date.recent().toLocaleDateString('ja-JP')
    }

    // ステータス関連
    if (lowerLabel.includes('ステータス') || lowerLabel.includes('status') || lowerLabel.includes('状態')) {
      const statuses = ['有効', '無効', '保留中', '承認済み', '公開', '非公開', '下書き']
      return statuses[rowIndex % statuses.length]
    }

    // ID関連
    if (lowerLabel.includes('id') || lowerLabel.includes('番号')) {
      return faker.string.alphanumeric(8).toUpperCase()
    }

    // その他
    if (lowerLabel.includes('説明') || lowerLabel.includes('description')) {
      return faker.lorem.sentence()
    }
    if (lowerLabel.includes('備考') || lowerLabel.includes('メモ') || lowerLabel.includes('note')) {
      return faker.lorem.words(5)
    }

    // デフォルト: 短いテキスト
    return faker.lorem.words(2)
  }

  // Faker.jsが利用できない場合のフォールバック
  return `${label} ${rowIndex + 1}`
}

/**
 * DataTable用のダミー行データを生成
 */
export function generateDataTableDummyRow(
  columns: Array<{ id: string; label: string }>,
  rowIndex: number
): Record<string, unknown> {
  const row: Record<string, unknown> = {
    id: rowIndex + 1,
  }

  for (const column of columns) {
    row[column.id] = generateDummyValueForColumn(column.label, rowIndex)
  }

  return row
}

/**
 * DataTable用のダミーデータセットを生成
 */
export function generateDataTableDummyData(
  columns: Array<{ id: string; label: string }>,
  rowCount: number = 10
): Array<Record<string, unknown>> {
  const data: Array<Record<string, unknown>> = []

  for (let i = 0; i < rowCount; i++) {
    data.push(generateDataTableDummyRow(columns, i))
  }

  return data
}

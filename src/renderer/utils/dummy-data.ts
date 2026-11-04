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

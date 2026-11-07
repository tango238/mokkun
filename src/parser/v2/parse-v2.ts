/**
 * Mokkun v2 パーサー
 * 判別（isV2Document）、構造検証（ajv に依存せず手書き）、compileV2 による旧フォーマットへの変換
 */

import type { MokkunSchema } from '../../types/schema'
import type { MokkunV2Schema } from '../../types/schema-v2'
import type { ParseResult } from '../yaml-parser'
import { compileV2 } from './compile-v2'
import { isObject } from './validate-context'
import { validateV2 } from './validate-v2'

/**
 * v2 ドキュメントかどうか（トップレベルの `mokkun` が 2）
 */
export function isV2Document(data: unknown): boolean {
  return isObject(data) && data.mokkun === 2
}

/**
 * トップレベルに `mokkun` キーがあるか（バージョン不一致を v1 として扱わないための判定）
 */
export function hasMokkunVersionKey(data: unknown): boolean {
  return isObject(data) && Object.hasOwn(data, 'mokkun')
}

/**
 * v2 ドキュメント（yaml.load 済みの生データ）を検証し、検証済みの MokkunV2Schema を返す（コンパイルしない）
 * v2 専用レンダラー（renderer-v2）の入力に使う
 */
export function parseV2Document(data: unknown): ParseResult<MokkunV2Schema> {
  if (!isObject(data)) {
    return { success: false, errors: [{ type: 'SCHEMA_VALIDATION_ERROR', message: 'Root must be an object', path: '' }] }
  }
  if (data.mokkun !== 2) {
    return {
      success: false,
      errors: [
        {
          type: 'SCHEMA_VALIDATION_ERROR',
          message: `unsupported mokkun format version: ${JSON.stringify(data.mokkun)} (expected the number 2)`,
          path: 'mokkun',
        },
      ],
    }
  }
  try {
    const errors = validateV2(data)
    if (errors.length > 0) return { success: false, errors }
    return { success: true, data: data as unknown as MokkunV2Schema }
  } catch (error) {
    return {
      success: false,
      errors: [
        {
          type: 'SCHEMA_VALIDATION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error while validating v2 schema',
          path: '',
        },
      ],
    }
  }
}

/**
 * v2 ドキュメント（yaml.load 済みの生データ）を検証し、旧フォーマットへコンパイルする
 */
export function parseV2(data: unknown): ParseResult<MokkunSchema> {
  const parsed = parseV2Document(data)
  if (!parsed.success) return parsed
  try {
    return { success: true, data: compileV2(parsed.data) }
  } catch (error) {
    return {
      success: false,
      errors: [
        {
          type: 'SCHEMA_VALIDATION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error while compiling v2 schema',
          path: '',
        },
      ],
    }
  }
}

/**
 * v2 検証の共通部分: 型ガード、列挙値、エラー収集のヘルパー
 */

import type { ParseError, ParseErrorType } from '../yaml-parser'

export type Obj = Record<string, unknown>

export function isObject(value: unknown): value is Obj {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

// 列挙値（schema-v2.json と揃える）
export const APP_LAYOUTS = ['shell', 'plain']
export const FLOW_PROGRESS = ['stepper', 'none']
export const VIEW_LAYOUTS = ['stack', 'tabs', 'sectioned']
export const SECTION_KINDS = ['form', 'list', 'readonly', 'summary']
export const REVEALS = ['open', 'collapsed']
export const ACTION_KINDS = ['submit', 'navigate', 'custom', 'reset']
export const ACTION_PLACEMENTS = ['header', 'footer', 'sticky']
export const ACTION_STYLES = ['primary', 'secondary', 'tertiary', 'danger']
export const FIELD_WIDTHS = ['xs', 'sm', 'md', 'lg', 'full']
export const SELECTIONS = ['none', 'single', 'multiple']
export const NOTICE_VARIANTS = ['info', 'success', 'warning', 'error']
export const PATTERN_KEYS = ['fields', 'note']
export const COLUMN_TYPES = ['text', 'status', 'date', 'number']
export const ACCEPT_KEYWORDS = ['image', 'pdf', 'document']
export const DATE_PRECISIONS = ['day', 'month']
/** 一覧セルに置ける入力の component */
export const COLUMN_FIELD_COMPONENTS = ['text', 'number', 'select', 'checkbox']
/** 条件の比較キー（exactly one） */
export const CONDITION_KEYS = ['equals', 'notEquals', 'in']

/** 検証の共有状態（エラーの収集と、参照先の存在確認に使う集合） */
export interface VCtx {
  add: (type: ParseErrorType, message: string, path: string) => void
  checkEnum: (value: unknown, allowed: Array<string | number>, path: string, name: string) => void
  checkString: (value: unknown, path: string, name: string, required?: boolean) => void
  /** views のキーを参照しているか */
  checkViewRef: (name: unknown, path: string) => void
  /** role（文字列または配列）の形と、app.roles にあるかを確かめる */
  checkRole: (value: unknown, path: string) => void
  /** トップレベル rules */
  rules: Obj
  viewNames: Set<string>
}

export function createVCtx(errors: ParseError[], data: Obj): VCtx {
  const add: VCtx['add'] = (type, message, path) => {
    errors.push({ type, message, path })
  }
  const app = isObject(data.app) ? data.app : undefined
  const roles =
    Array.isArray(app?.roles) && app.roles.length > 0 && app.roles.every(isNonEmptyString) ? (app.roles as string[]) : undefined
  const viewNames = new Set(isObject(data.views) ? Object.keys(data.views) : [])

  const checkViewRef: VCtx['checkViewRef'] = (name, path) => {
    if (!isNonEmptyString(name)) add('MISSING_REQUIRED_FIELD', 'view reference is required', path)
    else if (!viewNames.has(name)) add('INVALID_VALUE', `Unknown view "${name}"`, path)
  }

  return {
    add,
    checkEnum(value, allowed, path, name) {
      if (value !== undefined && !(allowed as unknown[]).includes(value)) {
        add('INVALID_VALUE', `Invalid ${name} "${String(value)}" (expected one of: ${allowed.join(', ')})`, path)
      }
    },
    checkString(value, path, name, required = false) {
      if (value === undefined) {
        if (required) add('MISSING_REQUIRED_FIELD', `${name} is required`, path)
      } else if (!isNonEmptyString(value) && !(typeof value === 'string' && !required)) {
        add('INVALID_VALUE', `${name} must be a${required ? ' non-empty' : ''} string`, path)
      }
    },
    checkViewRef,
    checkRole(value, path) {
      if (value === undefined) return
      const list = typeof value === 'string' ? [value] : Array.isArray(value) ? value : undefined
      if (!list || list.length === 0 || !list.every(isNonEmptyString)) {
        add('INVALID_VALUE', 'role must be a non-empty string or a non-empty array of strings', path)
        return
      }
      if (!roles) return
      for (const r of list) {
        if (!roles.includes(r)) add('INVALID_VALUE', `Unknown role "${r}" (not in app.roles: ${roles.join(', ')})`, path)
      }
    },
    rules: isObject(data.rules) ? data.rules : {},
    viewNames,
  }
}

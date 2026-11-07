/**
 * v2 の構造を検証してエラー一覧を返す（ajv に依存せず手書き）。入力が不正でも例外を投げない。
 */

import type { PatternV2 } from '../../types/schema-v2'
import type { ParseError } from '../yaml-parser'
import { checkApp, checkFlows, checkNavigation } from './validate-app'
import { createVCtx, isObject, PATTERN_KEYS, type Obj, type VCtx } from './validate-context'
import { checkField } from './validate-field'
import { TOP_KEYS } from './validate-keys'
import { checkViews } from './validate-view'

function checkRules(v: VCtx, rules: unknown): void {
  if (rules === undefined) return
  if (!isObject(rules)) {
    v.add('INVALID_VALUE', '"rules" must be an object', 'rules')
    return
  }
  for (const [name, rule] of Object.entries(rules)) {
    if (!isObject(rule)) v.add('INVALID_VALUE', 'Rule must be an object', `rules.${name}`)
  }
}

function checkPatterns(v: VCtx, raw: unknown): Record<string, PatternV2> {
  const patterns: Record<string, PatternV2> = {}
  if (raw === undefined) return patterns
  if (!isObject(raw)) {
    v.add('INVALID_VALUE', '"patterns" must be an object', 'patterns')
    return patterns
  }
  for (const [name, pattern] of Object.entries(raw)) {
    const pp = `patterns.${name}`
    if (!isObject(pattern)) {
      v.add('INVALID_VALUE', 'Pattern must be an object', pp)
      continue
    }
    for (const key of Object.keys(pattern)) {
      if (!PATTERN_KEYS.includes(key)) {
        v.add('INVALID_VALUE', `Unsupported pattern key "${key}" (only fields and note; nested "use" is not supported)`, `${pp}.${key}`)
      }
    }
    if (pattern.note !== undefined) v.checkString(pattern.note, `${pp}.note`, 'note')
    if (pattern.fields !== undefined) {
      if (!Array.isArray(pattern.fields)) v.add('INVALID_VALUE', 'pattern "fields" must be an array', `${pp}.fields`)
      else pattern.fields.forEach((f, i) => checkField(v, f, `${pp}.fields[${i}]`))
    }
    patterns[name] = pattern as PatternV2
  }
  return patterns
}

export function validateV2(data: Obj): ParseError[] {
  const errors: ParseError[] = []
  const v = createVCtx(errors, data)
  v.checkKeys(data, TOP_KEYS, '')

  checkApp(v, isObject(data.app) ? data.app : undefined)
  checkRules(v, data.rules)

  if (!isObject(data.views)) {
    v.add('MISSING_REQUIRED_FIELD', 'v2 schema must have a "views" object', 'views')
    return errors
  }
  if (Object.keys(data.views).length === 0) {
    v.add('MISSING_REQUIRED_FIELD', '"views" must have at least one view', 'views')
  }
  const app = isObject(data.app) ? data.app : undefined
  const navViews = checkNavigation(v, app?.navigation)
  checkFlows(v, data.flows)
  const patterns = checkPatterns(v, data.patterns)
  checkViews(v, data.views, patterns, navViews)
  return errors
}

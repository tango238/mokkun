/**
 * Field と Condition の検証
 */

import { VALID_COMPONENTS_V2 } from '../../types/schema-v2'
import { SYNTH_PREFIX } from './compile-expand'
import {
  ACCEPT_FORMS,
  ACCEPT_KEYWORDS,
  ACCEPT_LEGACY_PATTERN,
  isAcceptToken,
  MAX_SIZE_FORMS,
  MAX_SIZE_PATTERN,
} from './file-spec'
import {
  COLUMN_FIELD_COMPONENTS,
  CONDITION_KEYS,
  DATE_PRECISIONS,
  FIELD_WIDTHS,
  isNonEmptyString,
  isObject,
  type Obj,
  type VCtx,
} from './validate-context'
import { COLUMN_FIELD_KEYS, CONDITION_ALLOWED_KEYS, FIELD_KEYS, LINK_KEYS, OPTION_KEYS } from './validate-keys'

const isScalar = (value: unknown): boolean => ['string', 'number', 'boolean'].includes(typeof value)

/**
 * 条件（visibleWhen / requiredWhen）の形だけを検証する（参照先の存在は view 単位で後段チェック）。
 * equals / notEquals / in のうちちょうど 1 つが必要。
 */
export function checkConditionShape(v: VCtx, cond: unknown, path: string, name = 'visibleWhen'): boolean {
  if (!isObject(cond)) {
    v.add('INVALID_VALUE', `${name} must be an object with "item" and one of "equals", "notEquals", "in"`, path)
    return false
  }
  v.checkKeys(cond, CONDITION_ALLOWED_KEYS, path)
  let ok = true
  if (!isNonEmptyString(cond.item)) {
    v.add('INVALID_VALUE', `${name}.item must be a non-empty string`, `${path}.item`)
    ok = false
  }
  const keys = CONDITION_KEYS.filter(k => Object.hasOwn(cond, k))
  if (keys.length === 0) {
    v.add('MISSING_REQUIRED_FIELD', `${name}.equals is required (or notEquals / in)`, `${path}.equals`)
    return false
  }
  if (keys.length > 1) {
    v.add('INVALID_VALUE', `${name} must have exactly one of equals, notEquals, in (got ${keys.join(', ')})`, path)
    ok = false
  }
  for (const key of ['equals', 'notEquals']) {
    if (Object.hasOwn(cond, key) && !isScalar(cond[key])) {
      v.add('INVALID_VALUE', `${name}.${key} must be a string, number or boolean`, `${path}.${key}`)
      ok = false
    }
  }
  if (Object.hasOwn(cond, 'in') && !(Array.isArray(cond.in) && cond.in.length > 0 && cond.in.every(isScalar))) {
    v.add('INVALID_VALUE', `${name}.in must be a non-empty array of strings, numbers or booleans`, `${path}.in`)
    ok = false
  }
  return ok
}

function checkAccept(v: VCtx, accept: unknown, path: string): void {
  if (accept === undefined) return
  const message = `Invalid accept ${JSON.stringify(accept)} (expected ${ACCEPT_FORMS})`
  if (typeof accept === 'string') {
    if (!(ACCEPT_KEYWORDS as readonly string[]).includes(accept) && !ACCEPT_LEGACY_PATTERN.test(accept)) v.add('INVALID_VALUE', message, path)
  } else if (!(Array.isArray(accept) && accept.length > 0 && accept.every(isAcceptToken))) {
    v.add('INVALID_VALUE', message, path)
  }
}

function checkLinks(v: VCtx, links: unknown, path: string): void {
  if (links === undefined) return
  if (!Array.isArray(links)) {
    v.add('INVALID_VALUE', 'links must be an array of { label, href }', path)
    return
  }
  links.forEach((link, i) => {
    const lp = `${path}[${i}]`
    if (!isObject(link)) {
      v.add('INVALID_VALUE', 'link must be an object with "label" and "href"', lp)
      return
    }
    v.checkKeys(link, LINK_KEYS, lp)
    v.checkString(link.label, `${lp}.label`, 'link label', true)
    v.checkString(link.href, `${lp}.href`, 'link href', true)
  })
}

export interface FieldCheckOptions {
  /** 一覧セルの入力欄（item / label を持たず、component は text / number / select / checkbox のみ） */
  column?: boolean
}

/** 項目の検証。条件の参照先と pattern 由来の展開は view 単位で後段チェックする */
export function checkField(v: VCtx, field: unknown, path: string, opts: FieldCheckOptions = {}): void {
  if (!isObject(field)) {
    v.add('INVALID_VALUE', 'Field must be an object', path)
    return
  }
  const column = opts.column === true
  v.checkKeys(field, column ? COLUMN_FIELD_KEYS : FIELD_KEYS, path)
  if (!column) {
    v.checkString(field.item, `${path}.item`, 'item', true)
    if (typeof field.item === 'string' && field.item.startsWith(SYNTH_PREFIX)) {
      v.add('INVALID_VALUE', `item must not start with "${SYNTH_PREFIX}" (reserved)`, `${path}.item`)
    }
    v.checkString(field.label, `${path}.label`, 'label', true)
  }
  const valid = typeof field.component === 'string' && (VALID_COMPONENTS_V2 as readonly string[]).includes(field.component)
  if (!valid) {
    v.add('INVALID_FIELD_TYPE', `Invalid component "${String(field.component)}"`, `${path}.component`)
  } else if (column && !COLUMN_FIELD_COMPONENTS.includes(field.component as string)) {
    v.add('INVALID_FIELD_TYPE', `Column field supports only ${COLUMN_FIELD_COMPONENTS.join(' / ')} (got "${String(field.component)}")`, `${path}.component`)
  }
  v.checkEnum(field.width, FIELD_WIDTHS, `${path}.width`, 'width')
  if (field.options !== undefined) {
    if (!Array.isArray(field.options)) {
      v.add('INVALID_VALUE', 'options must be an array', `${path}.options`)
    } else {
      field.options.forEach((o, i) => {
        const op = `${path}.options[${i}]`
        if (!isObject(o)) v.add('INVALID_VALUE', 'option must be an object with "value" and "label"', op)
        else {
          v.checkKeys(o, OPTION_KEYS, op)
          if (!Object.hasOwn(o, 'value')) v.add('MISSING_REQUIRED_FIELD', 'option must have "value"', `${op}.value`)
          if (typeof o.label !== 'string') v.add('MISSING_REQUIRED_FIELD', 'option must have a string "label"', `${op}.label`)
        }
      })
    }
  }
  if (field.rules !== undefined) {
    if (!Array.isArray(field.rules)) {
      v.add('INVALID_VALUE', 'rules must be an array', `${path}.rules`)
    } else {
      field.rules.forEach((r, i) => {
        const rp = `${path}.rules[${i}]`
        if (typeof r === 'string') {
          if (!Object.hasOwn(v.rules, r)) v.add('INVALID_VALUE', `Unknown rule "${r}" (not defined in top-level rules)`, rp)
        } else if (!isObject(r)) {
          v.add('INVALID_VALUE', 'rule must be a rule name or an object', rp)
        }
      })
    }
  }
  if (field.visibleWhen !== undefined && !column) checkConditionShape(v, field.visibleWhen, `${path}.visibleWhen`)
  if (field.requiredWhen !== undefined && !column) {
    checkConditionShape(v, field.requiredWhen, `${path}.requiredWhen`, 'requiredWhen')
    if (field.required === true) {
      v.add('INVALID_VALUE', 'requiredWhen cannot be combined with required: true (use required: false)', `${path}.requiredWhen`)
    }
  }

  // 追加キー
  v.checkString(field.unit, `${path}.unit`, 'unit')
  v.checkString(field.autocomplete, `${path}.autocomplete`, 'autocomplete')
  if (field.autocomplete === '') v.add('INVALID_VALUE', 'autocomplete must be a non-empty string', `${path}.autocomplete`)
  v.checkEnum(field.precision, DATE_PRECISIONS, `${path}.precision`, 'precision')
  if (field.precision !== undefined && field.component !== 'date') {
    v.add('INVALID_VALUE', `precision is only valid for component "date" (got "${String(field.component)}")`, `${path}.precision`)
  }
  checkAccept(v, field.accept, `${path}.accept`)
  if (field.maxSize !== undefined && !(typeof field.maxSize === 'string' && MAX_SIZE_PATTERN.test(field.maxSize))) {
    v.add('INVALID_VALUE', `Invalid maxSize ${JSON.stringify(field.maxSize)} (expected ${MAX_SIZE_FORMS})`, `${path}.maxSize`)
  }
  checkLinks(v, field.links, `${path}.links`)
  if (field.to !== undefined) v.checkViewRef(field.to, `${path}.to`)

  if (field.props !== undefined) {
    if (!isObject(field.props)) {
      v.add('INVALID_VALUE', 'props must be an object', `${path}.props`)
    } else {
      // id / type は item / component から決まるため props で上書きさせない
      for (const key of ['id', 'type']) {
        if (Object.hasOwn(field.props, key)) {
          v.add('INVALID_VALUE', `props.${key} is not allowed (it is derived from item / component)`, `${path}.props.${key}`)
        }
      }
    }
  }
}

/** 条件の参照先 item（形が正しいときだけ） */
export function conditionItem(cond: unknown): string | undefined {
  return isObject(cond) && isNonEmptyString((cond as Obj).item) ? ((cond as Obj).item as string) : undefined
}

/**
 * kind: list の list オブジェクトの検証
 */

import { checkAction } from './validate-action'
import { checkField } from './validate-field'
import { COLUMN_TYPES, isObject, SELECTIONS, type VCtx } from './validate-context'
import { COLUMN_KEYS, LIST_KEYS, PAGING_KEYS } from './validate-keys'

export function checkList(v: VCtx, list: unknown, sp: string): void {
  const lp = `${sp}.list`
  if (!isObject(list)) {
    v.add('MISSING_REQUIRED_FIELD', 'Section of kind "list" must have "list"', lp)
    return
  }
  v.checkKeys(list, LIST_KEYS, lp)
  const hasRows = list.rows !== undefined
  if (hasRows) {
    if (!Array.isArray(list.rows)) v.add('INVALID_VALUE', 'list.rows must be an array of objects', `${lp}.rows`)
    else {
      list.rows.forEach((r, i) => {
        const rp = `${lp}.rows[${i}]`
        if (!isObject(r)) return v.add('INVALID_VALUE', 'row must be an object (keys are column ids)', rp)
        for (const [key, value] of Object.entries(r)) {
          if (!(value === null || ['string', 'number', 'boolean'].includes(typeof value))) {
            v.add('INVALID_VALUE', `row value must be a string, number, boolean or null (got ${Array.isArray(value) ? 'an array' : typeof value})`, `${rp}.${key}`)
          }
        }
      })
    }
  }

  if (!Array.isArray(list.columns) || list.columns.length === 0) {
    v.add('MISSING_REQUIRED_FIELD', 'list.columns must be a non-empty array', `${lp}.columns`)
  } else {
    list.columns.forEach((c, i) => {
      const cp = `${lp}.columns[${i}]`
      if (!isObject(c)) {
        v.add('INVALID_VALUE', 'column must be an object', cp)
        return
      }
      v.checkKeys(c, COLUMN_KEYS, cp)
      v.checkString(c.id, `${cp}.id`, 'column id', true)
      v.checkString(c.label, `${cp}.label`, 'column label', true)
      v.checkEnum(c.type, COLUMN_TYPES, `${cp}.type`, 'column type')
      if (c.to !== undefined) v.checkViewRef(c.to, `${cp}.to`)
      if (c.field !== undefined) {
        checkField(v, c.field, `${cp}.field`, { column: true })
        if (!hasRows) v.add('INVALID_VALUE', 'column "field" requires list.rows', `${cp}.field`)
      }
    })
  }

  if (list.rowActions !== undefined) {
    if (!Array.isArray(list.rowActions)) v.add('INVALID_VALUE', 'list.rowActions must be an array', `${lp}.rowActions`)
    else list.rowActions.forEach((a, i) => checkAction(v, a, `${lp}.rowActions[${i}]`, { row: true }))
  }
  v.checkEnum(list.selection, SELECTIONS, `${lp}.selection`, 'selection')
  if (list.paging !== undefined) {
    if (!isObject(list.paging)) {
      v.add('INVALID_VALUE', 'list.paging must be an object', `${lp}.paging`)
    } else {
      v.checkKeys(list.paging, PAGING_KEYS, `${lp}.paging`)
      const size = list.paging.pageSize
      if (size !== undefined && !(Number.isInteger(size) && (size as number) >= 1)) {
        v.add('INVALID_VALUE', 'paging.pageSize must be an integer of 1 or more', `${lp}.paging.pageSize`)
      }
    }
  }
  if (list.bulkActions !== undefined) {
    if (!Array.isArray(list.bulkActions)) {
      v.add('INVALID_VALUE', 'list.bulkActions must be an array', `${lp}.bulkActions`)
    } else {
      if (list.selection !== 'multiple') {
        v.add('INVALID_VALUE', 'bulkActions is only valid when list.selection is "multiple"', `${lp}.bulkActions`)
      }
      list.bulkActions.forEach((a, i) => checkAction(v, a, `${lp}.bulkActions[${i}]`))
    }
  }
}

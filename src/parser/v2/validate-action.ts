/**
 * Action の検証（View の主・副アクション、rowActions、bulkActions、Section.actions で共通）
 */

import { ACTION_KINDS, ACTION_PLACEMENTS, ACTION_STYLES, isObject, type VCtx } from './validate-context'

export interface ActionCheckOptions {
  /** Section.actions のとき true。primary を持てるのは View だけなので style: primary を拒否する */
  section?: boolean
}

export function checkAction(v: VCtx, action: unknown, path: string, opts: ActionCheckOptions = {}): void {
  if (!isObject(action)) {
    v.add('INVALID_VALUE', 'Action must be an object', path)
    return
  }
  v.checkString(action.id, `${path}.id`, 'id', true)
  v.checkString(action.label, `${path}.label`, 'label', true)
  v.checkEnum(action.kind, ACTION_KINDS, `${path}.kind`, 'kind')
  v.checkEnum(action.placement, ACTION_PLACEMENTS, `${path}.placement`, 'placement')
  v.checkEnum(action.style, ACTION_STYLES, `${path}.style`, 'style')
  if (action.kind === 'navigate') v.checkViewRef(action.to, `${path}.to`)
  else if (action.to !== undefined) v.checkViewRef(action.to, `${path}.to`)
  if (action.confirm !== undefined) {
    if (!isObject(action.confirm)) v.add('INVALID_VALUE', 'confirm must be an object', `${path}.confirm`)
    else v.checkString(action.confirm.message, `${path}.confirm.message`, 'confirm.message', true)
  }
  v.checkRole(action.role, `${path}.role`)
  if (opts.section && action.style === 'primary') {
    v.add('INVALID_VALUE', 'Section actions must not use style "primary" (only a View has a primary action)', `${path}.style`)
  }
}

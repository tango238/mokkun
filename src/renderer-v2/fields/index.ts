/**
 * Field 層: component（と条件）から DADS 部品への振り分け
 *
 * | component | 条件 | DADS 部品 |
 * |---|---|---|
 * | text / number / time / duration / combobox | | input-text |
 * | textarea | | textarea |
 * | date | | date-picker（inline は calendar）|
 * | file / photo_grid | | file-upload |
 * | select | | select（multiple は checkbox、segmented は radio）|
 * | radio / checkbox / toggle | | radio / checkbox / switch |
 * | browser | | select（階層は optgroup）|
 * | badge / chip / status | | chip-label |
 * | timeline / map | | list / image |
 */

import type { FieldV2 } from '../../types/schema-v2'
import { makeCtl, type FieldOpts } from './control-label'
import { renderCheckbox, renderRadio } from './choice'
import { renderDate } from './date'
import { renderChip, renderMap, renderTimeline } from './display'
import { renderFile, renderPhotoGrid } from './file'
import { renderBrowser, renderSelect } from './select'
import { renderCombobox, renderDuration, renderNumber, renderText, renderTime } from './text'
import { renderTextarea } from './textarea'
import { renderToggle } from './toggle'
import { esc } from '../util'

export type { FieldOpts } from './control-label'

/** 1 項目を form-control-label でラップした HTML にする */
export function renderFieldV2(field: FieldV2, opts: FieldOpts): string {
  const c = makeCtl(field, opts)
  switch (field.component) {
    case 'text':
      return renderText(c)
    case 'number':
      return renderNumber(c)
    case 'textarea':
      return renderTextarea(c)
    case 'date':
      return renderDate(c)
    case 'time':
      return renderTime(c)
    case 'duration':
      return renderDuration(c)
    case 'file':
      return renderFile(c)
    case 'photo_grid':
      return renderPhotoGrid(c)
    case 'select':
      return renderSelect(c)
    case 'combobox':
      return renderCombobox(c)
    case 'radio':
      return renderRadio(c)
    case 'checkbox':
      return renderCheckbox(c)
    case 'toggle':
      return renderToggle(c)
    case 'browser':
      return renderBrowser(c)
    case 'badge':
    case 'chip':
    case 'status':
      return renderChip(c)
    case 'timeline':
      return renderTimeline(c)
    case 'map':
      return renderMap(c)
    default:
      // パーサーが component を検証済みのため通常は到達しない
      return `<p class="dads-form-control-label__error-text">未対応の component: ${esc((field as { component: string }).component)}</p>`
  }
}

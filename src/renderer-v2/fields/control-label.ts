/**
 * form-control-label（DADS）でのラップ
 * 単一コントロールは <label for>、複数コントロール（グループ）は <fieldset> + <legend>。
 * サポートテキスト・エラーテキストは aria-describedby で関連付ける。
 */

import type { FieldV2 } from '../../types/schema-v2'
import { attrs, esc } from '../util'

/** 1 項目の描画入力（DOM id / name は呼び出し側で繰り返しグループの添字まで解決済み） */
export interface FieldOpts {
  /** コントロールの DOM id（view 名で前置済み） */
  domId: string
  /** フォーム送信名 */
  name: string
  /** 初期表示で非表示にするか（visibleWhen を既定値で評価した結果） */
  hidden?: boolean
}

/** コントロール描画用の文脈 */
export interface Ctl {
  f: FieldV2
  domId: string
  name: string
  hidden: boolean
  supportId?: string
  errorId?: string
  error?: string
  /** aria-describedby に入れる id 列（エラー → サポートの順） */
  describedBy?: string
  /** 初期値 */
  value: unknown
}

export function makeCtl(f: FieldV2, o: FieldOpts): Ctl {
  const support = supportLines(f)
  const error = typeof f.props?.error === 'string' && f.props.error ? f.props.error : undefined
  const supportId = support.length > 0 ? `${o.domId}-support` : undefined
  const errorId = error ? `${o.domId}-error` : undefined
  const ids = [errorId, supportId].filter(Boolean).join(' ')
  return {
    f,
    domId: o.domId,
    name: o.name,
    hidden: o.hidden === true,
    supportId,
    errorId,
    error,
    describedBy: ids || undefined,
    value: f.value !== undefined ? f.value : f.default,
  }
}

/** サポートテキストの行（help / whyRequired / format / example）。placeholder は使わない */
export function supportLines(f: FieldV2): string[] {
  const lines: string[] = []
  if (f.help) lines.push(f.help)
  if (f.whyRequired) lines.push(f.whyRequired)
  if (f.format) lines.push(`入力形式: ${f.format}`)
  if (f.example) lines.push(`例: ${f.example}`)
  return lines
}

/** aria-invalid / aria-describedby の共通属性 */
export function ariaAttrs(c: Ctl): string {
  return attrs({ 'aria-invalid': c.error ? 'true' : undefined, 'aria-describedby': c.describedBy })
}

function requirement(f: FieldV2): string {
  if (f.readonly) return '<span class="dads-form-control-label__status">編集不可</span>'
  return f.required
    ? '<span class="dads-form-control-label__requirement" data-required="true">※必須</span>'
    : '<span class="dads-form-control-label__requirement" data-required="false">※任意</span>'
}

function support(c: Ctl): string {
  if (!c.supportId) return ''
  const html = supportLines(c.f).map(esc).join('<br>')
  return `\n  <p id="${esc(c.supportId)}" class="dads-form-control-label__support-text">${html}</p>`
}

function rootAttrs(c: Ctl): string {
  const cond = c.f.visibleWhen
  return attrs({
    'data-size': 'md',
    'data-field': c.f.item,
    'data-component': c.f.component,
    'data-multiple': c.f.multiple === true,
    'data-width': c.f.width,
    'data-visible-when': cond ? JSON.stringify({ item: cond.item, equals: cond.equals }) : undefined,
    hidden: c.hidden,
  })
}

/** form-control-label 共通のエラー（各コントロールが専用のエラーテキストを持たない場合） */
export function groupError(c: Ctl): string {
  return c.error ? `<p id="${esc(c.errorId)}" class="dads-form-control-label__error-text">${esc(c.error)}</p>` : ''
}

/** 単一コントロール: <div> + <label for> */
export function wrapSingle(c: Ctl, control: string): string {
  return `<div class="dads-form-control-label"${rootAttrs(c)}>
  <label class="dads-form-control-label__label" for="${esc(c.domId)}">
    ${esc(c.f.label)}
    ${requirement(c.f)}
  </label>${support(c)}
  <div class="dads-form-control-label__field">
    ${control}
  </div>
</div>`
}

/** グループ: <fieldset> + <legend>。aria-describedby は fieldset に付ける */
export function wrapGroup(
  c: Ctl,
  control: string,
  extra: Record<string, string | boolean | undefined> = {},
  opts: { skipError?: boolean } = {},
): string {
  return `<fieldset class="dads-form-control-label"${rootAttrs(c)}${attrs({ 'aria-describedby': c.describedBy, ...extra })}>
  <legend class="dads-form-control-label__legend">
    <span class="dads-form-control-label__label">
      ${esc(c.f.label)}
      ${requirement(c.f)}
    </span>
  </legend>${support(c)}
  <div class="dads-form-control-label__field">
    ${control}
    ${opts.skipError ? '' : groupError(c)}
  </div>
</fieldset>`
}

/** ラベルを持たない表示用コントロール（チップ・タイムライン等）用のラップ */
export function wrapDisplay(c: Ctl, control: string): string {
  return `<div class="dads-form-control-label"${rootAttrs(c)}>
  <p class="dads-form-control-label__label" id="${esc(c.domId)}-label">${esc(c.f.label)}</p>${support(c)}
  <div class="dads-form-control-label__field">
    ${control}
  </div>
</div>`
}

/** 単一チェックボックス用: ラベルはチェックボックス自身が持つ（必須表示はその中に入れる） */
export function wrapInline(c: Ctl, control: string): string {
  return `<div class="dads-form-control-label"${rootAttrs(c)}>${support(c)}
  <div class="dads-form-control-label__field">
    ${control}
    ${groupError(c)}
  </div>
</div>`
}

export { requirement as requirementHtml }

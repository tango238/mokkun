/**
 * form-control-label（DADS）でのラップ
 * 単一コントロールは <label for>、複数コントロール（グループ）は <fieldset> + <legend>。
 * サポートテキスト・エラーテキストは aria-describedby で関連付ける。
 */

import type { FieldV2 } from '../../types/schema-v2'
import { serializeCondition } from '../condition'
import { externalIcon } from '../icons'
import { attrs, esc, safeUrl } from '../util'
import { fileSupportLine } from './file-support'

/** 1 項目の描画入力（DOM id / name は呼び出し側で繰り返しグループの添字まで解決済み） */
export interface FieldOpts {
  /** コントロールの DOM id（view 名で前置済み） */
  domId: string
  /** フォーム送信名 */
  name: string
  /** 初期表示で非表示にするか（visibleWhen を既定値で評価した結果） */
  hidden?: boolean
  /**
   * props.error（項目のエラー文）を描くか。既定 true（単体で呼ぶとき）。View の描画では状態が error のときだけ true
   * （通常の状態ではエラーを出さない）
   */
  showError?: boolean
  /** 初期表示で必須か（requiredWhen を既定値で評価した結果）。省略は field.required */
  required?: boolean
}

/** コントロール描画用の文脈 */
export interface Ctl {
  f: FieldV2
  domId: string
  name: string
  hidden: boolean
  /** 必須として扱うか（requiredWhen のときは条件の評価結果。mount 後は DOM が追随する） */
  required: boolean
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
  const error = o.showError !== false && typeof f.props?.error === 'string' && f.props.error ? f.props.error : undefined
  const supportId = support.length > 0 ? `${o.domId}-support` : undefined
  const errorId = error ? `${o.domId}-error` : undefined
  const ids = [errorId, supportId].filter(Boolean).join(' ')
  return {
    f,
    domId: o.domId,
    name: o.name,
    hidden: o.hidden === true,
    required: o.required ?? f.required === true,
    supportId,
    errorId,
    error,
    describedBy: ids || undefined,
    value: f.value !== undefined ? f.value : f.default,
  }
}

/** サポートテキストの行（help / ファイル形式と容量 / whyRequired / format / example）。placeholder は使わない */
export function supportLines(f: FieldV2): string[] {
  const lines: string[] = []
  if (f.help) lines.push(f.help)
  const file = f.component === 'file' || f.component === 'photo_grid' ? fileSupportLine(f) : undefined
  if (file) lines.push(file)
  if (f.whyRequired) lines.push(f.whyRequired)
  if (f.format) lines.push(`入力形式: ${f.format}`)
  if (f.example) lines.push(`例: ${f.example}`)
  return lines
}

/** aria-invalid / aria-describedby の共通属性 */
export function ariaAttrs(c: Ctl): string {
  return attrs({ 'aria-invalid': c.error ? 'true' : undefined, 'aria-describedby': c.describedBy })
}

function requirement(f: FieldV2, required: boolean): string {
  if (f.readonly) return '<span class="dads-form-control-label__status">編集不可</span>'
  return required
    ? '<span class="dads-form-control-label__requirement" data-required="true">※必須</span>'
    : '<span class="dads-form-control-label__requirement" data-required="false">※任意</span>'
}

/** サポートテキストの後ろに出す DADS リンク（f.links）。http(s) は新規タブで開く */
function links(f: FieldV2): string {
  if (!f.links || f.links.length === 0) return ''
  const items = f.links
    .map(l => {
      const href = safeUrl(l.href)
      const external = /^https?:/i.test(href)
      const attrsText = attrs({ class: 'dads-link', href, target: external ? '_blank' : undefined, rel: external ? 'noopener noreferrer' : undefined })
      return `<li><a${attrsText}>${esc(l.label)}${external ? ` ${externalIcon}` : ''}</a></li>`
    })
    .join('')
  return `\n  <ul class="mk2-links">${items}</ul>`
}

function support(c: Ctl): string {
  const text = c.supportId
    ? `\n  <p id="${esc(c.supportId)}" class="dads-form-control-label__support-text">${supportLines(c.f).map(esc).join('<br>')}</p>`
    : ''
  return text + links(c.f)
}

function rootAttrs(c: Ctl): string {
  const cond = c.f.visibleWhen
  return attrs({
    'data-size': 'md',
    'data-field': c.f.item,
    'data-component': c.f.component,
    'data-multiple': c.f.multiple === true,
    'data-width': c.f.width,
    'data-visible-when': cond ? serializeCondition(cond) : undefined,
    'data-required-when': c.f.requiredWhen ? serializeCondition(c.f.requiredWhen) : undefined,
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
    ${requirement(c.f, c.required)}
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
      ${requirement(c.f, c.required)}
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

/** 必須／任意の表示（単一チェックボックスのラベル内で使う） */
export function requirementHtml(c: Ctl): string {
  return requirement(c.f, c.required)
}

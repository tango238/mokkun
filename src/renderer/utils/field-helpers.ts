/**
 * Field Helper Utilities
 * フォームフィールドレンダリング用の共有ヘルパー関数
 */

import type { InputField, SelectOption } from '../../types/schema'

/**
 * HTML特殊文字をエスケープ
 *
 * @param text - エスケープする文字列
 * @returns エスケープされた文字列
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  // 属性値にも埋め込まれるため、引用符もエスケープする
  return div.innerHTML.replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}

/**
 * SSR対応のHTMLエスケープ
 * document が利用できない環境でも動作する
 *
 * @param text - エスケープする文字列
 * @returns エスケープされた文字列
 */
export function escapeHtmlSafe(text: string): string {
  if (typeof document !== 'undefined') {
    return escapeHtml(text)
  }
  // SSR環境用のフォールバック
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * radio/checkbox グループの方向を決める。direction 指定があれば優先。
 * 未指定なら 選択肢4個以下かつ全ラベル8文字以下(説明文なし)で horizontal。
 */
export function resolveGroupDirection(
  direction: 'horizontal' | 'vertical' | undefined,
  options: Array<{ label: string; description?: string }>
): 'horizontal' | 'vertical' {
  if (direction) return direction
  const compact = options.length <= 4 && options.every(o => String(o.label).length <= 8 && !o.description)
  return compact ? 'horizontal' : 'vertical'
}

/** 自身でラベル/説明文を本文として描画する表示系タイプ（ラッパーに label/description を出さない） */
const SELF_LABELED_TYPES = new Set<string>([
  'heading', 'badge', 'chip', 'status_label',
  'timeline', 'information_panel', 'tooltip', 'pagination',
  'definition_list', 'disclosure', 'accordion_panel', 'section_nav',
  'dropdown', 'delete_confirm_dialog',
])

/** 入力欄ではないが見出しとしてラベルだけ残すタイプ（description は出さない） */
export const HEADING_LABEL_TYPES = new Set<string>([
  'data_table', 'calendar', 'browser', 'google_map_embed', 'photo_manager',
  'loader', 'notification_bar', 'response_message', 'line_clamp', 'tabs', 'stepper', 'float_area',
])

/** 見出しを aria-labelledby でグループに関連付けるタイプ */
const GROUP_ROLE_TYPES = new Set<string>(['browser', 'calendar'])

/**
 * フィールドのラッパーHTML生成
 *
 * @param field - 入力フィールド定義
 * @param content - フィールドのコンテンツHTML
 * @returns ラッパー付きのHTML文字列
 */
export function createFieldWrapper(field: InputField, content: string): string {
  const requiredMark = field.required ? '<span class="required-mark">*</span>' : ''
  const description = field.description
    ? `<p class="field-description">${escapeHtml(field.description)}</p>`
    : ''
  const classes = ['form-field', `field-type-${field.type}`]
  const safeClass = safeClassName(field.class)
  if (safeClass) {
    classes.push(safeClass)
  }

  // visible_when 条件をdata属性に埋め込む
  const visibleWhenAttr = field.visible_when
    ? ` data-visible-when="${escapeHtml(JSON.stringify(field.visible_when))}"`
    : ''

  if (SELF_LABELED_TYPES.has(field.type)) {
    return `
    <div class="${classes.join(' ')}" data-field-id="${escapeHtml(field.id)}"${visibleWhenAttr}>
      ${content}
    </div>
  `
  }

  if (HEADING_LABEL_TYPES.has(field.type)) {
    const labelId = `${field.id}-label`
    const grouped = GROUP_ROLE_TYPES.has(field.type) && !!field.label
    const headingHtml = field.label
      ? `<div class="field-label"${grouped ? ` id="${escapeHtml(labelId)}"` : ''}>${escapeHtml(field.label)}</div>`
      : ''
    const groupAttrs = grouped ? ` role="group" aria-labelledby="${escapeHtml(labelId)}"` : ''
    return `
    <div class="${classes.join(' ')}" data-field-id="${escapeHtml(field.id)}"${groupAttrs}${visibleWhenAttr}>
      ${headingHtml}
      ${content}
    </div>
  `
  }

  return `
    <div class="${classes.join(' ')}" data-field-id="${escapeHtml(field.id)}"${visibleWhenAttr}>
      ${field.label
        ? `<label class="field-label" for="${escapeHtml(field.id)}">
        ${escapeHtml(field.label)}${requiredMark}
      </label>`
        : ''}
      ${content}
      ${description}
    </div>
  `
}

/**
 * 共通属性を生成
 *
 * @param field - 入力フィールド定義
 * @returns 属性文字列
 */
export function getCommonAttributes(field: InputField): string {
  const attrs: string[] = [
    `id="${escapeHtml(field.id)}"`,
    `name="${escapeHtml(field.id)}"`,
  ]

  if (field.required) {
    attrs.push('required')
  }
  if (field.disabled) {
    attrs.push('disabled')
  }
  if (field.readonly) {
    attrs.push('readonly')
  }
  if ('placeholder' in field && field.placeholder) {
    attrs.push(`placeholder="${escapeHtml(field.placeholder)}"`)
    // label が無い場合は placeholder をアクセシブルネームとして使う
    if (!field.label) {
      attrs.push(`aria-label="${escapeHtml(field.placeholder)}"`)
    }
  }

  return attrs.join(' ')
}

/**
 * 選択肢の配列を取得（文字列参照は未対応）
 *
 * @param options - 選択肢配列または参照文字列
 * @returns 選択肢の配列
 */
export function getOptions(options: SelectOption[] | string): SelectOption[] {
  if (typeof options === 'string') {
    // 共通コンポーネント参照は未対応（Phase 3以降で対応予定）
    return []
  }
  return options
}

/**
 * ファイルサイズをフォーマット
 *
 * @param bytes - バイト数
 * @returns フォーマットされたサイズ文字列
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * MIMEタイプから表示名を取得
 *
 * @param mimeType - MIMEタイプ文字列
 * @returns 表示用のフォーマット名
 */
export function formatMimeType(mimeType: string): string {
  const formats: Record<string, string> = {
    'image/jpeg': 'JPEG',
    'image/png': 'PNG',
    'image/webp': 'WebP',
    'image/gif': 'GIF',
  }
  return formats[mimeType] ?? mimeType
}

/**
 * レベルに基づくデフォルトサイズを取得
 *
 * @param level - 見出しレベル (1-6)
 * @returns サイズバリアント
 */
export function getDefaultSizeForLevel(
  level: 1 | 2 | 3 | 4 | 5 | 6
): 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' {
  const sizeMap: Record<number, 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'> = {
    1: '2xl',
    2: 'xl',
    3: 'lg',
    4: 'md',
    5: 'sm',
    6: 'xs',
  }
  return sizeMap[level]
}

/**
 * 単位ラベルのマッピング
 */
export const unitLabels: Record<string, string> = {
  days: '日',
  hours: '時間',
  minutes: '分',
  seconds: '秒',
}

/**
 * ユーザー指定の class 値を検証して返す（英数字・_・-・空白のみ許可）
 * 不正な値は undefined を返し、呼び出し側は無視する。
 */
export function safeClassName(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  return /^[\w\- ]+$/.test(value) ? value : undefined
}

/**
 * 数値属性を生成する。有限な数値でない場合は空文字（属性なし）を返す。
 */
export function numAttr(name: string, value: unknown): string {
  if (value === undefined || value === null || value === '' || typeof value === 'boolean') return ''
  const n = Number(value)
  return Number.isFinite(n) ? `${name}="${n}"` : ''
}

/**
 * 識別子（クラス名の一部や data 属性値）として使えるトークンだけを通す
 */
export function safeToken(value: unknown, fallback: string): string {
  return typeof value === 'string' && /^[\w-]+$/.test(value) ? value : fallback
}

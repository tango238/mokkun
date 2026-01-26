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
  return div.innerHTML
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
  if (field.class) {
    classes.push(field.class)
  }

  return `
    <div class="${classes.join(' ')}" data-field-id="${escapeHtml(field.id)}">
      <label class="field-label" for="${escapeHtml(field.id)}">
        ${escapeHtml(field.label)}${requiredMark}
      </label>
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

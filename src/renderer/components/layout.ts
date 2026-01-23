/**
 * Layout Component Renderers
 * レイアウト要素（display_fields, actions, filters）のHTML生成
 */

import type { Action, InputField } from '../../types/schema'
import { renderFields } from './form-fields'

/**
 * HTML特殊文字をエスケープ
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// =============================================================================
// Display Fields
// =============================================================================

/**
 * 表示フィールド（読み取り専用の値表示）
 */
export interface DisplayField {
  id: string
  label: string
  value?: string | number | boolean
  format?: 'text' | 'date' | 'number' | 'currency' | 'html'
  class?: string
}

/**
 * 表示フィールドをレンダリング
 */
export function renderDisplayField(field: DisplayField): string {
  const valueStr = field.value !== undefined ? String(field.value) : '-'
  const classes = ['display-field']
  if (field.class) {
    classes.push(field.class)
  }

  return `
    <div class="${classes.join(' ')}" data-display-id="${escapeHtml(field.id)}">
      <span class="display-label">${escapeHtml(field.label)}</span>
      <span class="display-value">${field.format === 'html' ? valueStr : escapeHtml(valueStr)}</span>
    </div>
  `
}

/**
 * 複数の表示フィールドをレンダリング
 */
export function renderDisplayFields(fields: DisplayField[]): string {
  if (fields.length === 0) {
    return ''
  }

  const fieldsHtml = fields.map(renderDisplayField).join('')
  return `<div class="display-fields">${fieldsHtml}</div>`
}

// =============================================================================
// Actions (Buttons)
// =============================================================================

/**
 * アクションボタンのスタイルをCSSクラスに変換
 */
function getButtonClass(style?: Action['style']): string {
  const baseClass = 'btn'
  switch (style) {
    case 'primary':
      return `${baseClass} btn-primary`
    case 'secondary':
      return `${baseClass} btn-secondary`
    case 'danger':
      return `${baseClass} btn-danger`
    case 'link':
      return `${baseClass} btn-link`
    default:
      return `${baseClass} btn-secondary`
  }
}

/**
 * 単一アクション（ボタン）をレンダリング
 */
export function renderAction(action: Action): string {
  const buttonClass = getButtonClass(action.style)
  const iconHtml = action.icon ? `<span class="btn-icon">${escapeHtml(action.icon)}</span>` : ''

  // data属性でアクション情報を埋め込む
  const dataAttrs: string[] = [
    `data-action-id="${escapeHtml(action.id)}"`,
    `data-action-type="${escapeHtml(action.type)}"`,
  ]

  if (action.type === 'navigate') {
    dataAttrs.push(`data-navigate-to="${escapeHtml(action.to)}"`)
  }
  if (action.type === 'custom') {
    dataAttrs.push(`data-handler="${escapeHtml(action.handler)}"`)
  }
  if (action.type === 'submit' && action.url) {
    dataAttrs.push(`data-url="${escapeHtml(action.url)}"`)
    if (action.method) {
      dataAttrs.push(`data-method="${escapeHtml(action.method)}"`)
    }
  }

  // 確認ダイアログ設定
  if (action.confirm) {
    dataAttrs.push(`data-confirm-title="${escapeHtml(action.confirm.title)}"`)
    dataAttrs.push(`data-confirm-message="${escapeHtml(action.confirm.message)}"`)
  }

  const buttonType = action.type === 'submit' ? 'submit' : action.type === 'reset' ? 'reset' : 'button'

  return `
    <button
      type="${buttonType}"
      class="${buttonClass}"
      ${dataAttrs.join(' ')}
    >
      ${iconHtml}
      <span class="btn-label">${escapeHtml(action.label)}</span>
    </button>
  `
}

/**
 * アクション群をレンダリング
 */
export function renderActions(actions: Action[]): string {
  if (actions.length === 0) {
    return ''
  }

  const actionsHtml = actions.map(renderAction).join('')
  return `<div class="actions">${actionsHtml}</div>`
}

// =============================================================================
// Filters
// =============================================================================

/**
 * フィルター項目（検索・絞り込みUI）
 */
export interface FilterConfig {
  fields: InputField[]
  submitLabel?: string
  resetLabel?: string
  layout?: 'inline' | 'stacked'
}

/**
 * フィルターUIをレンダリング
 */
export function renderFilters(config: FilterConfig): string {
  const layout = config.layout ?? 'inline'
  const submitLabel = config.submitLabel ?? '検索'
  const resetLabel = config.resetLabel ?? 'クリア'

  const fieldsHtml = renderFields(config.fields)

  return `
    <div class="filters layout-${layout}">
      <div class="filter-fields">
        ${fieldsHtml}
      </div>
      <div class="filter-actions">
        <button type="button" class="btn btn-primary filter-submit">${escapeHtml(submitLabel)}</button>
        <button type="button" class="btn btn-secondary filter-reset">${escapeHtml(resetLabel)}</button>
      </div>
    </div>
  `
}

// =============================================================================
// Section Wrapper
// =============================================================================

/**
 * セクション（見出し付きコンテンツブロック）
 */
export interface SectionConfig {
  id?: string
  title?: string
  description?: string
  content: string
  collapsible?: boolean
  collapsed?: boolean
}

/**
 * セクションをレンダリング
 */
export function renderSection(config: SectionConfig): string {
  const classes = ['section']
  if (config.collapsible) {
    classes.push('collapsible')
    if (config.collapsed) {
      classes.push('collapsed')
    }
  }

  const idAttr = config.id ? `id="${escapeHtml(config.id)}"` : ''
  const titleHtml = config.title
    ? `<h3 class="section-title">${escapeHtml(config.title)}</h3>`
    : ''
  const descHtml = config.description
    ? `<p class="section-description">${escapeHtml(config.description)}</p>`
    : ''

  return `
    <section class="${classes.join(' ')}" ${idAttr}>
      ${titleHtml}
      ${descHtml}
      <div class="section-content">
        ${config.content}
      </div>
    </section>
  `
}

// =============================================================================
// Grid Layout
// =============================================================================

/**
 * グリッドレイアウト設定
 */
export interface GridConfig {
  columns?: number
  gap?: string
  items: string[]
}

/**
 * グリッドレイアウトをレンダリング
 */
export function renderGrid(config: GridConfig): string {
  const columns = config.columns ?? 2
  const gap = config.gap ?? '1rem'

  const style = `
    display: grid;
    grid-template-columns: repeat(${columns}, 1fr);
    gap: ${gap};
  `

  const itemsHtml = config.items
    .map(item => `<div class="grid-item">${item}</div>`)
    .join('')

  return `<div class="grid-layout" style="${style}">${itemsHtml}</div>`
}

/**
 * EmptyState Component
 * データが0件の場合に表示する空状態コンポーネント
 */

import type { EmptyStateConfig, StateAction } from '../../types/schema'
import { escapeHtmlSafe } from '../utils/field-helpers'

/**
 * EmptyStateの状態
 */
export interface EmptyStateState {
  /** 設定 */
  config: EmptyStateConfig
}

/**
 * EmptyStateのコールバック
 */
export interface EmptyStateCallbacks {
  /** プライマリアクションがクリックされた時 */
  onAction?: (handler: string) => void
  /** セカンダリアクションがクリックされた時 */
  onSecondaryAction?: (handler: string) => void
}

/**
 * アクションボタンをレンダリング
 */
function renderAction(action: StateAction, isPrimary: boolean = true): string {
  const styleClass = action.style ?? (isPrimary ? 'primary' : 'secondary')
  const buttonClass = `empty-state-action btn btn-${styleClass}`

  if (action.href) {
    return `<a href="${escapeHtmlSafe(action.href)}" class="${buttonClass}">${escapeHtmlSafe(action.label)}</a>`
  }

  const handler = action.handler ? `data-handler="${escapeHtmlSafe(action.handler)}"` : ''
  return `<button type="button" class="${buttonClass}" ${handler}>${escapeHtmlSafe(action.label)}</button>`
}

/**
 * EmptyStateコンポーネントクラス
 */
export class EmptyState {
  private container: HTMLElement
  private state: EmptyStateState
  private callbacks: EmptyStateCallbacks

  constructor(
    container: HTMLElement,
    config: EmptyStateConfig = {},
    callbacks: EmptyStateCallbacks = {}
  ) {
    this.container = container
    this.state = { config }
    this.callbacks = callbacks
  }

  /**
   * コンポーネントをレンダリング
   */
  render(): void {
    this.container.innerHTML = EmptyState.renderStatic(this.state.config)
    this.attachEventListeners()
  }

  /**
   * イベントリスナーを設定
   */
  private attachEventListeners(): void {
    // プライマリアクション
    const primaryBtn = this.container.querySelector<HTMLElement>('.empty-state-action.btn-primary')
    if (primaryBtn && this.callbacks.onAction) {
      const handler = primaryBtn.dataset.handler
      if (handler) {
        primaryBtn.addEventListener('click', () => {
          this.callbacks.onAction?.(handler)
        })
      }
    }

    // セカンダリアクション
    const secondaryBtn = this.container.querySelector<HTMLElement>('.empty-state-action.btn-secondary')
    if (secondaryBtn && this.callbacks.onSecondaryAction) {
      const handler = secondaryBtn.dataset.handler
      if (handler) {
        secondaryBtn.addEventListener('click', () => {
          this.callbacks.onSecondaryAction?.(handler)
        })
      }
    }
  }

  /**
   * 設定を更新
   */
  updateConfig(config: Partial<EmptyStateConfig>): void {
    this.state.config = { ...this.state.config, ...config }
    this.render()
  }

  /**
   * 破棄
   */
  destroy(): void {
    this.container.innerHTML = ''
  }

  /**
   * 静的レンダリング（SSR対応）
   */
  static renderStatic(config: EmptyStateConfig): string {
    const {
      title = 'データがありません',
      description,
      icon = '📭',
      image,
      action,
      secondary_action,
    } = config

    // アイコンまたは画像
    let visualHtml = ''
    if (image) {
      visualHtml = `<div class="empty-state-image"><img src="${escapeHtmlSafe(image)}" alt="" /></div>`
    } else if (icon) {
      // アイコンがHTML/SVGの場合はそのまま、それ以外（絵文字など）はエスケープ
      const isHtml = icon.trim().startsWith('<')
      visualHtml = `<div class="empty-state-icon">${isHtml ? icon : escapeHtmlSafe(icon)}</div>`
    }

    // タイトル
    const titleHtml = title
      ? `<h3 class="empty-state-title">${escapeHtmlSafe(title)}</h3>`
      : ''

    // 説明
    const descriptionHtml = description
      ? `<p class="empty-state-description">${escapeHtmlSafe(description)}</p>`
      : ''

    // アクションボタン
    let actionsHtml = ''
    if (action || secondary_action) {
      const primaryHtml = action ? renderAction(action, true) : ''
      const secondaryHtml = secondary_action ? renderAction(secondary_action, false) : ''
      actionsHtml = `
        <div class="empty-state-actions">
          ${primaryHtml}
          ${secondaryHtml}
        </div>
      `
    }

    return `
      <div class="empty-state" role="status" aria-live="polite">
        ${visualHtml}
        <div class="empty-state-content">
          ${titleHtml}
          ${descriptionHtml}
        </div>
        ${actionsHtml}
      </div>
    `
  }
}

/**
 * ファクトリー関数
 */
export function createEmptyState(
  container: HTMLElement,
  config: EmptyStateConfig = {},
  callbacks: EmptyStateCallbacks = {}
): EmptyState {
  const emptyState = new EmptyState(container, config, callbacks)
  emptyState.render()
  return emptyState
}

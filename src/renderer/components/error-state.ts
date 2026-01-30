/**
 * ErrorState Component
 * エラー発生時に表示するエラー状態コンポーネント
 */

import type { ErrorStateConfig, StateAction } from '../../types/schema'
import { escapeHtmlSafe } from '../utils/field-helpers'

/**
 * ErrorStateの状態
 */
export interface ErrorStateState {
  /** 設定 */
  config: ErrorStateConfig
  /** 詳細表示状態 */
  isDetailsExpanded: boolean
}

/**
 * ErrorStateのコールバック
 */
export interface ErrorStateCallbacks {
  /** リトライがクリックされた時 */
  onRetry?: (handler: string) => void
  /** ナビゲーションがクリックされた時 */
  onNavigate?: (handler: string) => void
}

/**
 * アクションボタンをレンダリング
 */
function renderAction(action: StateAction, className: string): string {
  const styleClass = action.style ?? 'primary'
  const buttonClass = `${className} btn btn-${styleClass}`

  if (action.href) {
    return `<a href="${escapeHtmlSafe(action.href)}" class="${buttonClass}">${escapeHtmlSafe(action.label)}</a>`
  }

  const handler = action.handler ? `data-handler="${escapeHtmlSafe(action.handler)}"` : ''
  return `<button type="button" class="${buttonClass}" ${handler}>${escapeHtmlSafe(action.label)}</button>`
}

/**
 * ErrorStateコンポーネントクラス
 */
export class ErrorState {
  private container: HTMLElement
  private state: ErrorStateState
  private callbacks: ErrorStateCallbacks

  constructor(
    container: HTMLElement,
    config: ErrorStateConfig = {},
    callbacks: ErrorStateCallbacks = {}
  ) {
    this.container = container
    this.state = {
      config,
      isDetailsExpanded: config.show_details ?? false,
    }
    this.callbacks = callbacks
  }

  /**
   * コンポーネントをレンダリング
   */
  render(): void {
    this.container.innerHTML = ErrorState.renderStatic(this.state.config, this.state.isDetailsExpanded)
    this.attachEventListeners()
  }

  /**
   * イベントリスナーを設定
   */
  private attachEventListeners(): void {
    // リトライアクション
    const retryBtn = this.container.querySelector<HTMLElement>('.error-state-retry')
    if (retryBtn && this.callbacks.onRetry) {
      const handler = retryBtn.dataset.handler
      if (handler) {
        retryBtn.addEventListener('click', () => {
          this.callbacks.onRetry?.(handler)
        })
      }
    }

    // ナビゲーションアクション
    const navBtn = this.container.querySelector<HTMLElement>('.error-state-navigate')
    if (navBtn && this.callbacks.onNavigate) {
      const handler = navBtn.dataset.handler
      if (handler) {
        navBtn.addEventListener('click', () => {
          this.callbacks.onNavigate?.(handler)
        })
      }
    }

    // 詳細トグル
    const toggleBtn = this.container.querySelector<HTMLElement>('.error-state-details-toggle')
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        this.state.isDetailsExpanded = !this.state.isDetailsExpanded
        this.render()
      })
    }
  }

  /**
   * 設定を更新
   */
  updateConfig(config: Partial<ErrorStateConfig>): void {
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
  static renderStatic(config: ErrorStateConfig, isDetailsExpanded: boolean = false): string {
    const {
      title = 'エラーが発生しました',
      description,
      icon = '⚠️',
      image,
      code,
      retry_action,
      navigation_action,
      details,
    } = config

    // アイコンまたは画像
    let visualHtml = ''
    if (image) {
      visualHtml = `<div class="error-state-image"><img src="${escapeHtmlSafe(image)}" alt="" /></div>`
    } else if (icon) {
      const isHtml = icon.trim().startsWith('<')
      visualHtml = `<div class="error-state-icon">${isHtml ? icon : escapeHtmlSafe(icon)}</div>`
    }

    // エラーコード
    const codeHtml = code !== undefined
      ? `<span class="error-state-code">エラーコード: ${escapeHtmlSafe(String(code))}</span>`
      : ''

    // タイトル
    const titleHtml = title
      ? `<h3 class="error-state-title">${escapeHtmlSafe(title)}</h3>`
      : ''

    // 説明
    const descriptionHtml = description
      ? `<p class="error-state-description">${escapeHtmlSafe(description)}</p>`
      : ''

    // 詳細情報
    let detailsHtml = ''
    if (details) {
      const expandedClass = isDetailsExpanded ? 'expanded' : ''
      const ariaExpanded = isDetailsExpanded ? 'true' : 'false'
      detailsHtml = `
        <div class="error-state-details-section">
          <button type="button" class="error-state-details-toggle" aria-expanded="${ariaExpanded}">
            詳細情報 ${isDetailsExpanded ? '▲' : '▼'}
          </button>
          <pre class="error-state-details ${expandedClass}" ${isDetailsExpanded ? '' : 'hidden'}>${escapeHtmlSafe(details)}</pre>
        </div>
      `
    }

    // アクションボタン
    let actionsHtml = ''
    if (retry_action || navigation_action) {
      const retryHtml = retry_action ? renderAction(retry_action, 'error-state-retry') : ''
      const navHtml = navigation_action ? renderAction(navigation_action, 'error-state-navigate') : ''
      actionsHtml = `
        <div class="error-state-actions">
          ${retryHtml}
          ${navHtml}
        </div>
      `
    }

    return `
      <div class="error-state" role="alert" aria-live="assertive">
        ${visualHtml}
        <div class="error-state-content">
          ${codeHtml}
          ${titleHtml}
          ${descriptionHtml}
          ${detailsHtml}
        </div>
        ${actionsHtml}
      </div>
    `
  }
}

/**
 * ファクトリー関数
 */
export function createErrorState(
  container: HTMLElement,
  config: ErrorStateConfig = {},
  callbacks: ErrorStateCallbacks = {}
): ErrorState {
  const errorState = new ErrorState(container, config, callbacks)
  errorState.render()
  return errorState
}

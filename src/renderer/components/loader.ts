/**
 * Loader Component
 * ローディングインジケーターコンポーネント
 *
 * 機能:
 * - サイズバリエーション (small/medium/large)
 * - カラータイプ (primary/light)
 * - インライン/オーバーレイ表示
 * - プログレスバー対応
 * - アクセシビリティ対応 (role="status", aria-busy, aria-live)
 */

import { createElement, generateId } from '../utils/dom'
import type {
  LoaderConfig,
  LoaderState,
  LoaderCallbacks,
} from '../../types/schema'

// Re-export types for convenience
export type { LoaderConfig, LoaderState, LoaderCallbacks } from '../../types/schema'

// =============================================================================
// Loader Class
// =============================================================================

/**
 * Loaderコンポーネント
 * 読み込み中を示すスピナー/プログレス表示
 */
export class Loader {
  private config: LoaderConfig
  private state: LoaderState
  private callbacks: LoaderCallbacks
  private container: HTMLElement | null
  private instanceId: string

  // DOM elements
  private loaderElement: HTMLElement | null = null
  private overlayElement: HTMLElement | null = null
  private spinnerElement: HTMLElement | null = null
  private textElement: HTMLElement | null = null
  private progressBarContainer: HTMLElement | null = null
  private progressBarFill: HTMLElement | null = null

  constructor(
    container: HTMLElement | null,
    config: LoaderConfig = {},
    callbacks: LoaderCallbacks = {}
  ) {
    this.container = container
    this.config = {
      size: 'medium',
      type: 'primary',
      overlay: false,
      ariaLabel: 'Loading',
      ...config,
    }
    this.callbacks = callbacks
    this.instanceId = generateId('loader')
    this.state = this.createInitialState()

    // Auto-show if configured
    if (this.config.autoShow) {
      setTimeout(() => this.show(), 0)
    }
  }

  // ===========================================================================
  // Public API
  // ===========================================================================

  /**
   * ローダーを表示
   */
  show(): void {
    if (this.state.isVisible) {
      return
    }

    this.state = {
      ...this.state,
      isVisible: true,
    }

    this.render()
    this.callbacks.onShow?.()
  }

  /**
   * ローダーを非表示
   */
  hide(): void {
    if (!this.state.isVisible) {
      return
    }

    this.state = {
      ...this.state,
      isVisible: false,
    }

    this.cleanup()
    this.callbacks.onHide?.()
  }

  /**
   * プログレス値を更新 (0-100)
   */
  setProgress(value: number): void {
    // Clamp value to 0-100
    const clampedValue = Math.max(0, Math.min(100, value))

    this.state = {
      ...this.state,
      progress: clampedValue,
    }

    // Update progress bar if visible
    if (this.state.isVisible && this.progressBarFill) {
      this.updateProgressBar(clampedValue)
    }

    this.callbacks.onProgressUpdate?.(clampedValue)
  }

  /**
   * テキストを更新
   */
  setText(text: string): void {
    this.state = {
      ...this.state,
      text,
    }

    // Update text element if visible
    if (this.state.isVisible && this.textElement) {
      this.textElement.textContent = text
    }
  }

  /**
   * 現在の状態を取得（イミュータブル）
   */
  getState(): Readonly<LoaderState> {
    return { ...this.state }
  }

  /**
   * ローダーを破棄
   */
  destroy(): void {
    this.cleanup()
    this.state = {
      ...this.state,
      isVisible: false,
    }
  }

  // ===========================================================================
  // Private Methods - Rendering
  // ===========================================================================

  /**
   * ローダーをレンダリング
   */
  private render(): void {
    if (this.config.overlay) {
      this.renderOverlay()
    } else {
      this.renderInline()
    }
  }

  /**
   * インライン表示
   */
  private renderInline(): void {
    if (!this.container) {
      console.warn('Loader: No container provided for inline mode')
      return
    }

    // Create loader element
    this.loaderElement = this.createLoaderElement()

    // Clear container and append loader
    this.container.innerHTML = ''
    this.container.appendChild(this.loaderElement)
  }

  /**
   * オーバーレイ表示
   */
  private renderOverlay(): void {
    // Create overlay backdrop
    this.overlayElement = createElement('div', {
      className: 'loader-overlay',
      attributes: {
        role: 'status',
        'aria-modal': 'true',
        'aria-busy': 'true',
        'aria-label': this.config.ariaLabel || 'Loading',
      },
    })

    // Create centered content container
    const contentContainer = createElement('div', {
      className: 'loader-overlay-content',
    })

    // Create loader element
    this.loaderElement = this.createLoaderElement()
    contentContainer.appendChild(this.loaderElement)

    this.overlayElement.appendChild(contentContainer)

    // Append to body and prevent scroll
    document.body.appendChild(this.overlayElement)
    document.body.classList.add('loader-open')
  }

  /**
   * ローダー要素を作成
   */
  private createLoaderElement(): HTMLElement {
    const container = createElement('div', {
      className: 'mokkun-loader',
      attributes: {
        id: this.instanceId,
      },
    })

    // Add spinner
    this.spinnerElement = this.createSpinner()
    container.appendChild(this.spinnerElement)

    // Add text if provided
    if (this.config.text || this.state.text) {
      this.textElement = this.createText()
      container.appendChild(this.textElement)
    }

    // Add progress bar if progress is set
    if (this.config.progress !== undefined || this.state.progress !== undefined) {
      const progressContainer = this.createProgressBar()
      container.appendChild(progressContainer)
    }

    // Set ARIA attributes for inline mode
    if (!this.config.overlay) {
      container.setAttribute('role', 'status')
      container.setAttribute('aria-label', this.config.ariaLabel || 'Loading')
    }

    return container
  }

  /**
   * スピナー要素を作成
   */
  private createSpinner(): HTMLElement {
    const size = this.config.size || 'medium'
    const type = this.config.type || 'primary'

    const spinner = createElement('div', {
      className: 'loader-spinner',
      attributes: {
        'data-size': size,
        'data-type': type,
        'aria-hidden': 'true', // Decorative element
      },
    })

    return spinner
  }

  /**
   * テキスト要素を作成
   */
  private createText(): HTMLElement {
    const text = this.state.text || this.config.text || ''

    const textElement = createElement('div', {
      className: 'loader-text',
      textContent: text,
      attributes: {
        'aria-live': 'polite', // Announce text changes
      },
    })

    return textElement
  }

  /**
   * プログレスバーを作成
   */
  private createProgressBar(): HTMLElement {
    const progress = this.state.progress ?? this.config.progress ?? 0

    this.progressBarContainer = createElement('div', {
      className: 'loader-progress',
      attributes: {
        role: 'progressbar',
        'aria-valuemin': '0',
        'aria-valuemax': '100',
        'aria-valuenow': String(progress),
      },
    })

    this.progressBarFill = createElement('div', {
      className: 'loader-progress-fill',
    })

    this.progressBarFill.style.width = `${progress}%`

    this.progressBarContainer.appendChild(this.progressBarFill)

    return this.progressBarContainer
  }

  /**
   * プログレスバーを更新
   */
  private updateProgressBar(progress: number): void {
    if (this.progressBarFill) {
      this.progressBarFill.style.width = `${progress}%`
    }

    if (this.progressBarContainer) {
      this.progressBarContainer.setAttribute('aria-valuenow', String(progress))
    }
  }

  // ===========================================================================
  // Private Methods - State Management
  // ===========================================================================

  /**
   * 初期状態を作成
   */
  private createInitialState(): LoaderState {
    return {
      isVisible: false,
      progress: this.config.progress,
      text: this.config.text,
    }
  }

  /**
   * クリーンアップ
   */
  private cleanup(): void {
    // Remove overlay from body
    if (this.overlayElement) {
      this.overlayElement.remove()
      this.overlayElement = null
      document.body.classList.remove('loader-open')
    }

    // Remove inline loader
    if (this.loaderElement && !this.config.overlay) {
      this.loaderElement.remove()
      this.loaderElement = null
    }

    // Clear references
    this.spinnerElement = null
    this.textElement = null
    this.progressBarContainer = null
    this.progressBarFill = null
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Loaderを作成
 */
export function createLoader(
  container: HTMLElement | null,
  config: LoaderConfig = {},
  callbacks: LoaderCallbacks = {}
): Loader {
  return new Loader(container, config, callbacks)
}

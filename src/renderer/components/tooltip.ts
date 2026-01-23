/**
 * Tooltip Component
 * ツールチップコンポーネント
 *
 * 
 * - 位置指定（top/bottom/left/right）
 * - 遅延表示（デフォルト300ms）
 * - リッチコンテンツ対応（HTML/テキスト）
 * - 矢印表示
 * - `role="tooltip"` with `aria-describedby` for accessibility
 */

import { createElement, generateId } from '../utils/dom'

// =============================================================================
// Types
// =============================================================================

/**
 * ツールチップの位置
 */
export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right'

/**
 * ツールチップの状態
 */
export interface TooltipState {
  /** 表示中かどうか */
  visible: boolean
  /** ホバー中かどうか */
  hovering: boolean
}

/**
 * ツールチップのコールバック
 */
export interface TooltipCallbacks {
  /** 表示時 */
  onShow?: () => void
  /** 非表示時 */
  onHide?: () => void
}

/**
 * ツールチップの設定
 */
export interface TooltipConfig {
  /** ツールチップのコンテンツ（テキストまたはHTML） */
  content: string
  /** 位置（デフォルト: top） */
  position?: TooltipPosition
  /** 遅延表示時間（ミリ秒、デフォルト: 300） */
  delay?: number
  /** 矢印を表示するか（デフォルト: true） */
  showArrow?: boolean
  /** HTMLコンテンツとして解釈するか（デフォルト: false） */
  isHtml?: boolean
  /** 最大幅（デフォルト: 200px） */
  maxWidth?: string
  /** 無効化 */
  disabled?: boolean
  /** トリガー要素にdata-tooltip-triggerを追加するか */
  markTrigger?: boolean
}

// =============================================================================
// Tooltip Class
// =============================================================================

/**
 * ツールチップコンポーネント
 */
export class Tooltip {
  private config: TooltipConfig
  private state: TooltipState
  private callbacks: TooltipCallbacks
  private triggerElement: HTMLElement
  private tooltipElement: HTMLElement | null = null
  private instanceId: string
  private showTimeout: number | null = null
  private hideTimeout: number | null = null

  constructor(
    triggerElement: HTMLElement,
    config: TooltipConfig,
    callbacks: TooltipCallbacks = {}
  ) {
    this.config = {
      position: 'top',
      delay: 300,
      showArrow: true,
      isHtml: false,
      maxWidth: '200px',
      disabled: false,
      markTrigger: true,
      ...config,
    }
    this.triggerElement = triggerElement
    this.callbacks = callbacks
    this.instanceId = generateId('tooltip')
    this.state = {
      visible: false,
      hovering: false,
    }

    this.initialize()
  }

  // ===========================================================================
  // Public Methods
  // ===========================================================================

  /**
   * ツールチップを表示
   */
  show(): void {
    if (this.config.disabled || this.state.visible) {
      return
    }

    // 遅延表示
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout)
      this.hideTimeout = null
    }

    this.showTimeout = window.setTimeout(() => {
      this.state = {
        ...this.state,
        visible: true,
      }
      this.render()
      this.callbacks.onShow?.()
    }, this.config.delay)
  }

  /**
   * ツールチップを非表示
   */
  hide(): void {
    if (this.showTimeout) {
      clearTimeout(this.showTimeout)
      this.showTimeout = null
    }

    // ホバー中でない場合のみ非表示
    if (!this.state.hovering) {
      this.hideTimeout = window.setTimeout(() => {
        this.state = {
          ...this.state,
          visible: false,
        }
        this.removeTooltip()
        this.callbacks.onHide?.()
      }, 100)
    }
  }

  /**
   * 即座にツールチップを表示（遅延なし）
   */
  showImmediate(): void {
    if (this.config.disabled) {
      return
    }

    if (this.showTimeout) {
      clearTimeout(this.showTimeout)
      this.showTimeout = null
    }

    this.state = {
      ...this.state,
      visible: true,
    }
    this.render()
    this.callbacks.onShow?.()
  }

  /**
   * 即座にツールチップを非表示（遅延なし）
   */
  hideImmediate(): void {
    if (this.showTimeout) {
      clearTimeout(this.showTimeout)
      this.showTimeout = null
    }
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout)
      this.hideTimeout = null
    }

    this.state = {
      ...this.state,
      visible: false,
    }
    this.removeTooltip()
    this.callbacks.onHide?.()
  }

  /**
   * ツールチップのコンテンツを更新
   */
  setContent(content: string): void {
    this.config = {
      ...this.config,
      content,
    }

    if (this.state.visible) {
      this.render()
    }
  }

  /**
   * ツールチップの位置を更新
   */
  setPosition(position: TooltipPosition): void {
    this.config = {
      ...this.config,
      position,
    }

    if (this.state.visible) {
      this.render()
    }
  }

  /**
   * 無効化状態を設定
   */
  setDisabled(disabled: boolean): void {
    this.config = {
      ...this.config,
      disabled,
    }

    if (disabled && this.state.visible) {
      this.hideImmediate()
    }
  }

  /**
   * ツールチップを破棄
   */
  destroy(): void {
    this.hideImmediate()
    this.removeEventListeners()

    if (this.config.markTrigger) {
      this.triggerElement.removeAttribute('data-tooltip-trigger')
      this.triggerElement.removeAttribute('aria-describedby')
    }
  }

  /**
   * 現在の状態を取得
   */
  getState(): TooltipState {
    return { ...this.state }
  }

  /**
   * 表示中かどうかを取得
   */
  isVisible(): boolean {
    return this.state.visible
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  /**
   * 初期化
   */
  private initialize(): void {
    // トリガー要素にdata-tooltip-trigger属性を追加
    if (this.config.markTrigger) {
      this.triggerElement.setAttribute('data-tooltip-trigger', '')
      this.triggerElement.setAttribute('aria-describedby', this.instanceId)
    }

    this.attachEventListeners()
  }

  /**
   * イベントリスナーを追加
   */
  private attachEventListeners(): void {
    this.triggerElement.addEventListener('mouseenter', this.handleMouseEnter)
    this.triggerElement.addEventListener('mouseleave', this.handleMouseLeave)
    this.triggerElement.addEventListener('focus', this.handleFocus)
    this.triggerElement.addEventListener('blur', this.handleBlur)
  }

  /**
   * イベントリスナーを削除
   */
  private removeEventListeners(): void {
    this.triggerElement.removeEventListener('mouseenter', this.handleMouseEnter)
    this.triggerElement.removeEventListener('mouseleave', this.handleMouseLeave)
    this.triggerElement.removeEventListener('focus', this.handleFocus)
    this.triggerElement.removeEventListener('blur', this.handleBlur)
  }

  /**
   * マウスエンターハンドラー
   */
  private handleMouseEnter = (): void => {
    this.state = {
      ...this.state,
      hovering: true,
    }
    this.show()
  }

  /**
   * マウスリーブハンドラー
   */
  private handleMouseLeave = (): void => {
    this.state = {
      ...this.state,
      hovering: false,
    }
    this.hide()
  }

  /**
   * フォーカスハンドラー
   */
  private handleFocus = (): void => {
    this.show()
  }

  /**
   * ブラーハンドラー
   */
  private handleBlur = (): void => {
    this.hide()
  }

  /**
   * ツールチップをレンダリング
   */
  private render(): void {
    // 既存のツールチップを即座に削除
    this.removeTooltipImmediate()

    // ツールチップ要素を作成
    this.tooltipElement = createElement('div', {
      className: `mokkun-tooltip tooltip-${this.config.position}`,
      attributes: {
        id: this.instanceId,
        role: 'tooltip',
        'data-position': this.config.position ?? 'top',
      },
    })

    // スタイルを設定
    this.tooltipElement.style.maxWidth = this.config.maxWidth ?? '200px'

    // 矢印を追加
    if (this.config.showArrow) {
      const arrow = createElement('div', {
        className: 'tooltip-arrow',
        attributes: {
          'data-position': this.config.position ?? 'top',
        },
      })
      this.tooltipElement.appendChild(arrow)
    }

    // コンテンツを追加
    const content = createElement('div', {
      className: 'tooltip-content',
    })

    if (this.config.isHtml) {
      content.innerHTML = this.config.content
    } else {
      content.textContent = this.config.content
    }

    this.tooltipElement.appendChild(content)

    // body に追加
    document.body.appendChild(this.tooltipElement)

    // 位置を計算して設定
    this.positionTooltip()

    // ツールチップ自体のマウスイベント
    this.tooltipElement.addEventListener('mouseenter', () => {
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout)
        this.hideTimeout = null
      }
    })

    this.tooltipElement.addEventListener('mouseleave', () => {
      this.hide()
    })

    // アニメーション用のクラスを追加（次のフレームで）
    requestAnimationFrame(() => {
      this.tooltipElement?.classList.add('tooltip-visible')
    })
  }

  /**
   * ツールチップの位置を計算して設定
   */
  private positionTooltip(): void {
    if (!this.tooltipElement) {
      return
    }

    const triggerRect = this.triggerElement.getBoundingClientRect()
    const tooltipRect = this.tooltipElement.getBoundingClientRect()
    const position = this.config.position ?? 'top'
    const gap = 8 // トリガー要素とツールチップの間隔

    let top = 0
    let left = 0

    switch (position) {
      case 'top':
        top = triggerRect.top + window.scrollY - tooltipRect.height - gap
        left = triggerRect.left + window.scrollX + (triggerRect.width - tooltipRect.width) / 2
        break

      case 'bottom':
        top = triggerRect.bottom + window.scrollY + gap
        left = triggerRect.left + window.scrollX + (triggerRect.width - tooltipRect.width) / 2
        break

      case 'left':
        top = triggerRect.top + window.scrollY + (triggerRect.height - tooltipRect.height) / 2
        left = triggerRect.left + window.scrollX - tooltipRect.width - gap
        break

      case 'right':
        top = triggerRect.top + window.scrollY + (triggerRect.height - tooltipRect.height) / 2
        left = triggerRect.right + window.scrollX + gap
        break
    }

    // ビューポート外に出ないように調整
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // 左右の調整
    if (left < 0) {
      left = 8
    } else if (left + tooltipRect.width > viewportWidth) {
      left = viewportWidth - tooltipRect.width - 8
    }

    // 上下の調整
    if (top < window.scrollY) {
      top = window.scrollY + 8
    } else if (top + tooltipRect.height > window.scrollY + viewportHeight) {
      top = window.scrollY + viewportHeight - tooltipRect.height - 8
    }

    this.tooltipElement.style.top = `${top}px`
    this.tooltipElement.style.left = `${left}px`
  }

  /**
   * ツールチップを削除
   */
  private removeTooltip(): void {
    if (this.tooltipElement) {
      this.tooltipElement.classList.remove('tooltip-visible')

      // アニメーション後に削除
      setTimeout(() => {
        if (this.tooltipElement && this.tooltipElement.parentNode) {
          this.tooltipElement.parentNode.removeChild(this.tooltipElement)
        }
        this.tooltipElement = null
      }, 200)
    }
  }

  /**
   * ツールチップを即座に削除（アニメーションなし）
   */
  private removeTooltipImmediate(): void {
    if (this.tooltipElement && this.tooltipElement.parentNode) {
      this.tooltipElement.parentNode.removeChild(this.tooltipElement)
      this.tooltipElement = null
    }
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Tooltipを作成するファクトリ関数
 */
export function createTooltip(
  triggerElement: HTMLElement,
  config: TooltipConfig,
  callbacks: TooltipCallbacks = {}
): Tooltip {
  return new Tooltip(triggerElement, config, callbacks)
}

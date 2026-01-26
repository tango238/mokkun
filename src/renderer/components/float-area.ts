/**
 * FloatArea Component
 * フローティング領域コンポーネント
 *
 * 
 * https://smarthr.design/products/components/float-area/
 *
 * 機能:
 * - primaryButton / secondaryButton / tertiaryButton の3ボタン構成
 * - responseMessage（処理結果メッセージ）のサポート
 * - 画面下部への固定表示
 * - デスクトップ/モバイル対応レイアウト
 * - z-index管理
 *
 * 用途:
 * - フォーム送信ボタンの固定表示
 * - モーダルUIのアクション領域
 * - 設定画面のアクションビュー
 */

import { createElement, generateId } from '../utils/dom'
import { createFieldWrapper } from '../utils/field-helpers'
import type { InputField } from '../../types/schema'

// =============================================================================
// Types
// =============================================================================

/**
 * ボタン設定
 */
export interface FloatAreaButton {
  /** ボタンのラベル */
  label: string
  /** ボタンのタイプ */
  variant?: 'primary' | 'secondary' | 'danger' | 'text'
  /** 無効状態 */
  disabled?: boolean
  /** クリック時のコールバック */
  onClick?: () => void
}

/**
 * レスポンスメッセージの種類
 */
export type ResponseMessageType = 'success' | 'error' | 'warning' | 'info'

/**
 * レスポンスメッセージ設定
 */
export interface ResponseMessage {
  /** メッセージ */
  text: string
  /** メッセージの種類 */
  type: ResponseMessageType
}

/**
 * フローティング領域の状態
 */
export interface FloatAreaState {
  /** 表示中かどうか */
  visible: boolean
  /** z-index */
  zIndex: number
  /** レスポンスメッセージ */
  responseMessage: ResponseMessage | null
}

/**
 * フローティング領域のコールバック
 */
export interface FloatAreaCallbacks {
  /** プライマリボタンクリック時 */
  onPrimaryClick?: () => void
  /** セカンダリボタンクリック時 */
  onSecondaryClick?: () => void
  /** ターシャリボタンクリック時 */
  onTertiaryClick?: () => void
  /** 表示時 */
  onShow?: () => void
  /** 非表示時 */
  onHide?: () => void
}

/**
 * フローティング領域の設定
 */
export interface FloatAreaConfig {
  /** プライマリボタン（必須） */
  primaryButton: FloatAreaButton
  /** セカンダリボタン */
  secondaryButton?: FloatAreaButton
  /** ターシャリボタン（左端に配置） */
  tertiaryButton?: FloatAreaButton
  /** レスポンスメッセージ */
  responseMessage?: ResponseMessage
  /** z-index（デフォルト: 500） */
  zIndex?: number
  /** 下部からの距離（デフォルト: 24px） */
  bottom?: string
  /** 最大幅（デフォルト: 800px） */
  maxWidth?: string
  /** アクセシビリティ用ラベル */
  ariaLabel?: string
}

// =============================================================================
// FloatArea Class
// =============================================================================

/**
 * フローティング領域コンポーネント
 */
export class FloatArea {
  private config: FloatAreaConfig
  private state: FloatAreaState
  private callbacks: FloatAreaCallbacks
  private containerElement: HTMLElement
  private floatAreaElement: HTMLElement | null = null
  private instanceId: string

  constructor(
    containerElement: HTMLElement,
    config: FloatAreaConfig,
    callbacks: FloatAreaCallbacks = {}
  ) {
    this.config = {
      zIndex: 500,
      bottom: '24px',
      maxWidth: '800px',
      ...config,
    }
    this.containerElement = containerElement
    this.callbacks = callbacks
    this.instanceId = generateId('float-area')
    this.state = {
      visible: true,
      zIndex: this.config.zIndex ?? 500,
      responseMessage: this.config.responseMessage ?? null,
    }
  }

  // ===========================================================================
  // Public Methods
  // ===========================================================================

  /**
   * コンポーネントをレンダリング
   */
  render(): void {
    this.removeElement()
    this.createFloatAreaElement()
  }

  /**
   * フローティング領域を表示
   */
  show(): void {
    if (this.state.visible) {
      return
    }

    this.state = {
      ...this.state,
      visible: true,
    }
    this.updateVisibility()
    this.callbacks.onShow?.()
  }

  /**
   * フローティング領域を非表示
   */
  hide(): void {
    if (!this.state.visible) {
      return
    }

    this.state = {
      ...this.state,
      visible: false,
    }
    this.updateVisibility()
    this.callbacks.onHide?.()
  }

  /**
   * 表示/非表示を切り替え
   */
  toggle(): void {
    if (this.state.visible) {
      this.hide()
    } else {
      this.show()
    }
  }

  /**
   * レスポンスメッセージを設定
   */
  setResponseMessage(message: ResponseMessage | null): void {
    this.state = {
      ...this.state,
      responseMessage: message,
    }
    this.render()
  }

  /**
   * 成功メッセージを表示
   */
  showSuccess(text: string): void {
    this.setResponseMessage({ text, type: 'success' })
  }

  /**
   * エラーメッセージを表示
   */
  showError(text: string): void {
    this.setResponseMessage({ text, type: 'error' })
  }

  /**
   * メッセージをクリア
   */
  clearMessage(): void {
    this.setResponseMessage(null)
  }

  /**
   * プライマリボタンを更新
   */
  updatePrimaryButton(button: Partial<FloatAreaButton>): void {
    this.config = {
      ...this.config,
      primaryButton: {
        ...this.config.primaryButton,
        ...button,
      },
    }
    this.render()
  }

  /**
   * プライマリボタンの無効状態を設定
   */
  setPrimaryDisabled(disabled: boolean): void {
    this.updatePrimaryButton({ disabled })
  }

  /**
   * z-indexを設定
   */
  setZIndex(zIndex: number): void {
    this.state = {
      ...this.state,
      zIndex,
    }
    if (this.floatAreaElement) {
      this.floatAreaElement.style.zIndex = String(zIndex)
    }
  }

  /**
   * コンポーネントを破棄
   */
  destroy(): void {
    this.removeElement()
  }

  /**
   * 現在の状態を取得
   */
  getState(): FloatAreaState {
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
   * フローティング領域要素を作成
   */
  private createFloatAreaElement(): void {
    this.floatAreaElement = createElement('div', {
      className: this.buildClassName(),
      attributes: {
        id: this.instanceId,
        role: 'region',
        'aria-label': this.config.ariaLabel ?? 'アクション',
        'aria-hidden': String(!this.state.visible),
      },
    })

    // スタイルを設定
    this.floatAreaElement.style.zIndex = String(this.state.zIndex)
    if (this.config.bottom) {
      this.floatAreaElement.style.setProperty('--float-area-bottom', this.config.bottom)
    }
    if (this.config.maxWidth) {
      this.floatAreaElement.style.setProperty('--float-area-max-width', this.config.maxWidth)
    }

    // 内部コンテナを作成
    const innerContainer = createElement('div', {
      className: 'float-area-inner',
    })

    // ターシャリボタン（左端）
    if (this.config.tertiaryButton) {
      const tertiaryWrapper = createElement('div', {
        className: 'float-area-tertiary',
      })
      tertiaryWrapper.appendChild(this.createButton(this.config.tertiaryButton, 'tertiary'))
      innerContainer.appendChild(tertiaryWrapper)
    }

    // メイン領域（メッセージ + ボタン）
    const mainArea = createElement('div', {
      className: 'float-area-main',
    })

    // レスポンスメッセージ
    if (this.state.responseMessage) {
      const messageEl = this.createResponseMessage(this.state.responseMessage)
      mainArea.appendChild(messageEl)
    }

    // ボタングループ（プライマリ + セカンダリ）
    const buttonGroup = createElement('div', {
      className: 'float-area-buttons',
    })

    // セカンダリボタン（先に追加 = 左側）
    if (this.config.secondaryButton) {
      buttonGroup.appendChild(this.createButton(this.config.secondaryButton, 'secondary'))
    }

    // プライマリボタン（後に追加 = 右側）
    buttonGroup.appendChild(this.createButton(this.config.primaryButton, 'primary'))

    mainArea.appendChild(buttonGroup)
    innerContainer.appendChild(mainArea)

    this.floatAreaElement.appendChild(innerContainer)
    this.containerElement.appendChild(this.floatAreaElement)
  }

  /**
   * ボタン要素を作成
   */
  private createButton(config: FloatAreaButton, type: 'primary' | 'secondary' | 'tertiary'): HTMLButtonElement {
    const variant = config.variant ?? (type === 'primary' ? 'primary' : type === 'tertiary' ? 'text' : 'secondary')

    const button = document.createElement('button')
    button.type = 'button'
    button.className = `float-area-btn float-area-btn-${variant}`
    button.textContent = config.label
    button.disabled = config.disabled ?? false

    if (config.disabled) {
      button.setAttribute('aria-disabled', 'true')
    }

    button.addEventListener('click', () => {
      if (config.disabled) return

      config.onClick?.()

      // コールバックを呼び出し
      if (type === 'primary') {
        this.callbacks.onPrimaryClick?.()
      } else if (type === 'secondary') {
        this.callbacks.onSecondaryClick?.()
      } else {
        this.callbacks.onTertiaryClick?.()
      }
    })

    return button
  }

  /**
   * レスポンスメッセージ要素を作成
   */
  private createResponseMessage(message: ResponseMessage): HTMLElement {
    const messageEl = createElement('div', {
      className: `float-area-message float-area-message-${message.type}`,
      attributes: {
        role: message.type === 'error' ? 'alert' : 'status',
        'aria-live': 'polite',
      },
    })

    // アイコン
    const icon = this.getMessageIcon(message.type)
    const iconEl = createElement('span', {
      className: 'float-area-message-icon',
    })
    iconEl.innerHTML = icon
    messageEl.appendChild(iconEl)

    // テキスト
    const textEl = createElement('span', {
      className: 'float-area-message-text',
    })
    textEl.textContent = message.text
    messageEl.appendChild(textEl)

    return messageEl
  }

  /**
   * メッセージタイプに応じたアイコンを取得
   */
  private getMessageIcon(type: ResponseMessageType): string {
    switch (type) {
      case 'success':
        return '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm3.78 5.22a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-2-2a.75.75 0 0 1 1.06-1.06L6.75 9.19l3.97-3.97a.75.75 0 0 1 1.06 0z"/></svg>'
      case 'error':
        return '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm0 3a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 8 3zm0 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/></svg>'
      case 'warning':
        return '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8.22 1.754a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368L8.22 1.754zm-1.763-.707c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575L6.457 1.047zM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-.25-5.25a.75.75 0 0 0-1.5 0v2.5a.75.75 0 0 0 1.5 0v-2.5z"/></svg>'
      case 'info':
        return '<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm.75 4.75a.75.75 0 0 1-1.5 0 .75.75 0 0 1 1.5 0zM7 7a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 .75.75v3.25h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5H7V7.75A.75.75 0 0 1 7 7z"/></svg>'
    }
  }

  /**
   * クラス名を構築
   */
  private buildClassName(): string {
    const classNames = ['mokkun-float-area']

    if (!this.state.visible) {
      classNames.push('float-area-hidden')
    }

    return classNames.join(' ')
  }

  /**
   * 表示状態を更新
   */
  private updateVisibility(): void {
    if (!this.floatAreaElement) {
      return
    }

    if (this.state.visible) {
      this.floatAreaElement.classList.remove('float-area-hidden')
      this.floatAreaElement.setAttribute('aria-hidden', 'false')
    } else {
      this.floatAreaElement.classList.add('float-area-hidden')
      this.floatAreaElement.setAttribute('aria-hidden', 'true')
    }
  }

  /**
   * 要素を削除
   */
  private removeElement(): void {
    if (this.floatAreaElement && this.floatAreaElement.parentNode) {
      this.floatAreaElement.parentNode.removeChild(this.floatAreaElement)
    }
    this.floatAreaElement = null
  }

  // ===========================================================================
  // Static Field Renderer
  // ===========================================================================

  static renderField(field: InputField): string {
    const floatAreaHtml = `
      <div class="mokkun-float-area">
        <div class="float-area-content">
          <span class="float-area-placeholder">[フロートエリア]</span>
        </div>
      </div>
    `
    return createFieldWrapper(field, floatAreaHtml)
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * FloatAreaを作成するファクトリ関数
 */
export function createFloatArea(
  containerElement: HTMLElement,
  config: FloatAreaConfig,
  callbacks: FloatAreaCallbacks = {}
): FloatArea {
  return new FloatArea(containerElement, config, callbacks)
}

// =============================================================================
// Type Exports (for backwards compatibility)
// =============================================================================

export type FloatAreaPosition = 'top' | 'bottom'
export type FloatAreaAlignment = 'left' | 'center' | 'right' | 'space-between'

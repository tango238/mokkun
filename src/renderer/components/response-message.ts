/**
 * ResponseMessage Component
 * レスポンスメッセージコンポーネント
 *
 * 
 * https://smarthr.design/products/components/response-message/
 *
 * 機能:
 * - タイプ（success/error/warning/info）
 * - 詳細表示（折りたたみ）
 * - 再試行ボタン
 * - アイコン表示
 *
 * 用途:
 * - フォーム送信結果
 * - API呼び出し結果
 * - バリデーションエラー表示
 */

import { createElement, generateId } from '../utils/dom'

// =============================================================================
// Types
// =============================================================================

/**
 * レスポンスメッセージのタイプ
 * - success: 成功・完了
 * - error: エラー・失敗
 * - warning: 警告
 * - info: 情報
 */
export type ResponseMessageType = 'success' | 'error' | 'warning' | 'info'

/**
 * レスポンスメッセージの状態
 */
export interface ResponseMessageState {
  /** 表示中かどうか */
  visible: boolean
  /** 詳細展開状態 */
  detailsExpanded: boolean
  /** ローディング状態（再試行中） */
  loading: boolean
}

/**
 * レスポンスメッセージのコールバック
 */
export interface ResponseMessageCallbacks {
  /** 再試行ボタンクリック時 */
  onRetry?: () => void | Promise<void>
  /** 詳細展開時 */
  onExpandDetails?: () => void
  /** 詳細折りたたみ時 */
  onCollapseDetails?: () => void
  /** 閉じるボタンクリック時 */
  onClose?: () => void
}

/**
 * レスポンスメッセージの設定
 */
export interface ResponseMessageConfig {
  /** メインメッセージ */
  message: string
  /** メッセージタイプ */
  type?: ResponseMessageType
  /** 詳細メッセージ（折りたたみ表示） */
  details?: string | string[]
  /** 再試行ボタンを表示 */
  showRetry?: boolean
  /** 再試行ボタンのラベル */
  retryLabel?: string
  /** 閉じるボタンを表示 */
  showClose?: boolean
  /** アイコンを非表示にする */
  hideIcon?: boolean
  /** カスタムアイコン（SVG文字列） */
  icon?: string
  /** 詳細セクションのラベル */
  detailsLabel?: string
  /** ID属性 */
  id?: string
  /** カスタムCSSクラス */
  className?: string
  /** アクセシビリティ用ラベル */
  ariaLabel?: string
}

// =============================================================================
// Built-in Icons
// =============================================================================

const ICONS: Record<ResponseMessageType, string> = {
  success: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" /></svg>`,
  error: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" /></svg>`,
  warning: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" /></svg>`,
  info: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" /></svg>`,
}

const CHEVRON_DOWN = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M4.22 6.22a.75.75 0 011.06 0L8 8.94l2.72-2.72a.75.75 0 111.06 1.06l-3.25 3.25a.75.75 0 01-1.06 0L4.22 7.28a.75.75 0 010-1.06z" clip-rule="evenodd" /></svg>`

const CLOSE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" /></svg>`

const RETRY_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M8 3a5 5 0 104.546 2.914.75.75 0 011.364-.628A6.5 6.5 0 118 1.5v-.75a.75.75 0 011.28-.53l2 2a.75.75 0 010 1.06l-2 2a.75.75 0 01-1.28-.53V3z" clip-rule="evenodd" /></svg>`

const LOADING_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" class="response-message-spinner"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="2" opacity="0.25" /><path d="M14 8a6 6 0 00-6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>`

/** アニメーション時間（ミリ秒） */
const ANIMATION_DURATION_MS = 200

// =============================================================================
// ResponseMessage Class
// =============================================================================

/**
 * レスポンスメッセージコンポーネント
 */
export class ResponseMessage {
  private config: ResponseMessageConfig
  private state: ResponseMessageState
  private callbacks: ResponseMessageCallbacks
  private container: HTMLElement
  private instanceId: string
  private detailsId: string
  private detailsToggleHandler: (() => void) | null = null
  private retryHandler: (() => Promise<void>) | null = null
  private closeHandler: (() => void) | null = null

  constructor(
    container: HTMLElement,
    config: ResponseMessageConfig,
    callbacks: ResponseMessageCallbacks = {}
  ) {
    this.config = config
    this.container = container
    this.callbacks = callbacks
    this.instanceId = config.id ?? generateId('response-message')
    this.detailsId = `${this.instanceId}-details`
    this.state = this.createInitialState()
  }

  // ===========================================================================
  // Public Methods
  // ===========================================================================

  /**
   * コンポーネントをレンダリング
   */
  render(): void {
    // イベントリスナーをクリーンアップ
    this.cleanupEventListeners()
    this.container.innerHTML = ''

    if (!this.state.visible) {
      this.container.style.display = 'none'
      return
    }

    this.container.style.display = ''

    const type = this.config.type ?? 'info'

    this.container.className = this.buildClassName(type)
    this.container.id = this.instanceId
    this.container.setAttribute('role', type === 'error' ? 'alert' : 'status')
    this.container.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite')

    if (this.config.ariaLabel) {
      this.container.setAttribute('aria-label', this.config.ariaLabel)
    }

    // アイコン
    if (!this.config.hideIcon) {
      const iconEl = this.renderIcon(type)
      this.container.appendChild(iconEl)
    }

    // コンテンツ領域
    const contentEl = this.renderContent()
    this.container.appendChild(contentEl)

    // 閉じるボタン
    if (this.config.showClose) {
      const closeEl = this.renderCloseButton()
      this.container.appendChild(closeEl)
    }
  }

  /**
   * メッセージを表示
   */
  show(): void {
    if (this.state.visible) {
      return
    }

    this.state = {
      ...this.state,
      visible: true,
    }

    this.render()
  }

  /**
   * メッセージを非表示
   */
  hide(): void {
    if (!this.state.visible) {
      return
    }

    this.state = {
      ...this.state,
      visible: false,
    }

    this.render()
    this.callbacks.onClose?.()
  }

  /**
   * 詳細を展開
   */
  expandDetails(): void {
    if (this.state.detailsExpanded || !this.hasDetails()) {
      return
    }

    this.state = {
      ...this.state,
      detailsExpanded: true,
    }

    this.updateDetailsState()
    this.callbacks.onExpandDetails?.()
  }

  /**
   * 詳細を折りたたむ
   */
  collapseDetails(): void {
    if (!this.state.detailsExpanded) {
      return
    }

    this.state = {
      ...this.state,
      detailsExpanded: false,
    }

    this.updateDetailsState()
    this.callbacks.onCollapseDetails?.()
  }

  /**
   * 詳細の展開/折りたたみを切り替え
   */
  toggleDetails(): void {
    if (this.state.detailsExpanded) {
      this.collapseDetails()
    } else {
      this.expandDetails()
    }
  }

  /**
   * ローディング状態を設定
   */
  setLoading(loading: boolean): void {
    if (this.state.loading === loading) {
      return
    }

    this.state = {
      ...this.state,
      loading,
    }

    this.updateRetryButtonState()
  }

  /**
   * メッセージを更新
   */
  setMessage(message: string): void {
    this.config = {
      ...this.config,
      message,
    }
    this.render()
  }

  /**
   * 詳細を更新
   */
  setDetails(details: string | string[] | undefined): void {
    this.config = {
      ...this.config,
      details,
    }
    this.render()
  }

  /**
   * タイプを更新
   */
  setType(type: ResponseMessageType): void {
    this.config = {
      ...this.config,
      type,
    }
    this.render()
  }

  /**
   * 設定を更新
   */
  update(config: Partial<ResponseMessageConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    }
    this.render()
  }

  /**
   * 現在の状態を取得
   */
  getState(): ResponseMessageState {
    return { ...this.state }
  }

  /**
   * 表示中かどうかを取得
   */
  isVisible(): boolean {
    return this.state.visible
  }

  /**
   * 詳細が展開中かどうかを取得
   */
  isDetailsExpanded(): boolean {
    return this.state.detailsExpanded
  }

  /**
   * コンポーネントを破棄
   */
  destroy(): void {
    this.cleanupEventListeners()
    this.container.innerHTML = ''
    this.container.removeAttribute('role')
    this.container.removeAttribute('aria-live')
    this.container.removeAttribute('aria-label')
  }

  // ===========================================================================
  // Private Methods - Initialization
  // ===========================================================================

  private createInitialState(): ResponseMessageState {
    return {
      visible: true,
      detailsExpanded: false,
      loading: false,
    }
  }

  /**
   * イベントリスナーをクリーンアップ
   */
  private cleanupEventListeners(): void {
    const toggleBtn = this.container.querySelector('.response-message-details-toggle')
    const retryBtn = this.container.querySelector('.response-message-retry')
    const closeBtn = this.container.querySelector('.response-message-close')

    if (toggleBtn && this.detailsToggleHandler) {
      toggleBtn.removeEventListener('click', this.detailsToggleHandler)
    }
    if (retryBtn && this.retryHandler) {
      retryBtn.removeEventListener('click', this.retryHandler)
    }
    if (closeBtn && this.closeHandler) {
      closeBtn.removeEventListener('click', this.closeHandler)
    }

    this.detailsToggleHandler = null
    this.retryHandler = null
    this.closeHandler = null
  }

  // ===========================================================================
  // Private Methods - Rendering
  // ===========================================================================

  private buildClassName(type: ResponseMessageType): string {
    const classNames = [
      'mokkun-response-message',
      `response-message-${type}`,
    ]

    if (this.config.className) {
      classNames.push(this.config.className)
    }

    return classNames.join(' ')
  }

  private renderIcon(type: ResponseMessageType): HTMLElement {
    const iconEl = createElement('div', {
      className: 'response-message-icon',
      attributes: {
        'aria-hidden': 'true',
      },
    })

    if (this.config.icon) {
      iconEl.innerHTML = this.sanitizeSvgIcon(this.config.icon) ?? ICONS[type]
    } else {
      iconEl.innerHTML = ICONS[type]
    }

    return iconEl
  }

  private renderContent(): HTMLElement {
    const contentEl = createElement('div', {
      className: 'response-message-content',
    })

    // メインメッセージ
    const messageEl = createElement('div', {
      className: 'response-message-text',
      textContent: this.config.message,
    })
    contentEl.appendChild(messageEl)

    // アクション領域（詳細トグル、再試行ボタン）
    const hasActions = this.hasDetails() || this.config.showRetry
    if (hasActions) {
      const actionsEl = this.renderActions()
      contentEl.appendChild(actionsEl)
    }

    // 詳細セクション
    if (this.hasDetails()) {
      const detailsEl = this.renderDetails()
      contentEl.appendChild(detailsEl)
    }

    return contentEl
  }

  private renderActions(): HTMLElement {
    const actionsEl = createElement('div', {
      className: 'response-message-actions',
    })

    // 詳細トグルボタン
    if (this.hasDetails()) {
      const toggleBtn = this.renderDetailsToggle()
      actionsEl.appendChild(toggleBtn)
    }

    // 再試行ボタン
    if (this.config.showRetry) {
      const retryBtn = this.renderRetryButton()
      actionsEl.appendChild(retryBtn)
    }

    return actionsEl
  }

  private renderDetailsToggle(): HTMLElement {
    const label = this.config.detailsLabel ?? '詳細'

    const toggleBtn = createElement('button', {
      className: `response-message-details-toggle${this.state.detailsExpanded ? ' is-expanded' : ''}`,
      attributes: {
        type: 'button',
        'aria-expanded': String(this.state.detailsExpanded),
        'aria-controls': this.detailsId,
      },
    })

    const labelSpan = createElement('span', {
      className: 'response-message-details-label',
      textContent: label,
    })
    toggleBtn.appendChild(labelSpan)

    const chevronSpan = createElement('span', {
      className: 'response-message-details-chevron',
    })
    chevronSpan.innerHTML = CHEVRON_DOWN
    toggleBtn.appendChild(chevronSpan)

    this.detailsToggleHandler = () => {
      this.toggleDetails()
    }
    toggleBtn.addEventListener('click', this.detailsToggleHandler)

    return toggleBtn
  }

  private renderRetryButton(): HTMLElement {
    const label = this.config.retryLabel ?? '再試行'

    const retryBtn = createElement('button', {
      className: `response-message-retry${this.state.loading ? ' is-loading' : ''}`,
      attributes: {
        type: 'button',
        'aria-disabled': String(this.state.loading),
      },
    })

    if (this.state.loading) {
      retryBtn.disabled = true
    }

    const iconSpan = createElement('span', {
      className: 'response-message-retry-icon',
    })
    iconSpan.innerHTML = this.state.loading ? LOADING_ICON : RETRY_ICON
    retryBtn.appendChild(iconSpan)

    const labelSpan = createElement('span', {
      className: 'response-message-retry-label',
      textContent: label,
    })
    retryBtn.appendChild(labelSpan)

    this.retryHandler = async () => {
      if (this.state.loading) {
        return
      }

      const retryFn = this.callbacks.onRetry
      if (!retryFn) {
        return
      }

      this.setLoading(true)

      try {
        await retryFn()
      } finally {
        this.setLoading(false)
      }
    }
    retryBtn.addEventListener('click', this.retryHandler)

    return retryBtn
  }

  private renderDetails(): HTMLElement {
    const detailsWrapper = createElement('div', {
      className: `response-message-details-wrapper${this.state.detailsExpanded ? ' is-expanded' : ''}`,
    })

    const detailsEl = createElement('div', {
      className: 'response-message-details',
      attributes: {
        id: this.detailsId,
      },
    })

    if (!this.state.detailsExpanded) {
      detailsEl.setAttribute('hidden', '')
    }

    // 詳細コンテンツ
    const details = this.config.details
    if (Array.isArray(details)) {
      const listEl = createElement('ul', {
        className: 'response-message-details-list',
      })
      details.forEach((item) => {
        const li = createElement('li', {
          textContent: item,
        })
        listEl.appendChild(li)
      })
      detailsEl.appendChild(listEl)
    } else if (details) {
      const textEl = createElement('div', {
        className: 'response-message-details-text',
        textContent: details,
      })
      detailsEl.appendChild(textEl)
    }

    detailsWrapper.appendChild(detailsEl)

    return detailsWrapper
  }

  private renderCloseButton(): HTMLElement {
    const closeBtn = createElement('button', {
      className: 'response-message-close',
      attributes: {
        type: 'button',
        'aria-label': '閉じる',
      },
    })

    closeBtn.innerHTML = CLOSE_ICON

    this.closeHandler = () => {
      this.hide()
    }
    closeBtn.addEventListener('click', this.closeHandler)

    return closeBtn
  }

  // ===========================================================================
  // Private Methods - State Updates
  // ===========================================================================

  private updateDetailsState(): void {
    const toggle = this.container.querySelector('.response-message-details-toggle')
    const wrapper = this.container.querySelector('.response-message-details-wrapper')
    const details = this.container.querySelector('.response-message-details')

    if (toggle) {
      toggle.setAttribute('aria-expanded', String(this.state.detailsExpanded))
      if (this.state.detailsExpanded) {
        toggle.classList.add('is-expanded')
      } else {
        toggle.classList.remove('is-expanded')
      }
    }

    if (wrapper) {
      if (this.state.detailsExpanded) {
        wrapper.classList.add('is-expanded')
      } else {
        wrapper.classList.remove('is-expanded')
      }
    }

    if (details) {
      if (this.state.detailsExpanded) {
        details.removeAttribute('hidden')
      } else {
        // アニメーション終了後にhiddenを設定
        setTimeout(() => {
          if (!this.state.detailsExpanded) {
            details.setAttribute('hidden', '')
          }
        }, ANIMATION_DURATION_MS)
      }
    }
  }

  private updateRetryButtonState(): void {
    const retryBtn = this.container.querySelector('.response-message-retry') as HTMLButtonElement
    const iconSpan = this.container.querySelector('.response-message-retry-icon')

    if (retryBtn) {
      retryBtn.disabled = this.state.loading
      retryBtn.setAttribute('aria-disabled', String(this.state.loading))

      if (this.state.loading) {
        retryBtn.classList.add('is-loading')
      } else {
        retryBtn.classList.remove('is-loading')
      }
    }

    if (iconSpan) {
      iconSpan.innerHTML = this.state.loading ? LOADING_ICON : RETRY_ICON
    }
  }

  // ===========================================================================
  // Private Methods - Utilities
  // ===========================================================================

  private hasDetails(): boolean {
    const details = this.config.details
    if (Array.isArray(details)) {
      return details.length > 0
    }
    return Boolean(details)
  }

  /**
   * カスタムSVGアイコンをサニタイズ
   */
  private sanitizeSvgIcon(input: string): string | null {
    const trimmed = input.trim()

    if (!trimmed.toLowerCase().startsWith('<svg') || !trimmed.toLowerCase().endsWith('</svg>')) {
      return null
    }

    const parser = new DOMParser()
    const doc = parser.parseFromString(trimmed, 'image/svg+xml')

    const parserError = doc.querySelector('parsererror')
    if (parserError) {
      return null
    }

    const svg = doc.querySelector('svg')
    if (!svg) {
      return null
    }

    // 危険な要素を削除
    const dangerousElements = ['script', 'foreignObject', 'iframe', 'object', 'embed', 'use']
    dangerousElements.forEach((tag) => {
      svg.querySelectorAll(tag).forEach((el) => el.remove())
    })

    // 危険な属性を削除
    const dangerousAttrs = [
      'onload', 'onerror', 'onclick', 'onmouseover', 'onmouseout', 'onmousedown',
      'onmouseup', 'onfocus', 'onblur', 'onkeydown', 'onkeyup', 'onkeypress',
      'onsubmit', 'onreset', 'onchange', 'oninput', 'onscroll', 'onresize',
      'onanimationstart', 'onanimationend', 'ontransitionend',
    ]

    dangerousAttrs.forEach((attr) => svg.removeAttribute(attr))
    const svgHref = svg.getAttribute('href') ?? svg.getAttribute('xlink:href')
    if (svgHref && svgHref.toLowerCase().startsWith('javascript:')) {
      svg.removeAttribute('href')
      svg.removeAttribute('xlink:href')
    }

    svg.querySelectorAll('*').forEach((el) => {
      dangerousAttrs.forEach((attr) => el.removeAttribute(attr))
      const href = el.getAttribute('href') ?? el.getAttribute('xlink:href')
      if (href && href.toLowerCase().startsWith('javascript:')) {
        el.removeAttribute('href')
        el.removeAttribute('xlink:href')
      }
    })

    return svg.outerHTML
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * レスポンスメッセージを作成
 */
export function createResponseMessage(
  container: HTMLElement,
  config: ResponseMessageConfig,
  callbacks: ResponseMessageCallbacks = {}
): ResponseMessage {
  const responseMessage = new ResponseMessage(container, config, callbacks)
  responseMessage.render()
  return responseMessage
}

/**
 * NotificationBar Component
 * 通知バーコンポーネント
 *
 * 
 * - タイプ（info/success/warning/error/sync）
 * - アクションボタン対応
 * - 閉じるボタン
 * - アニメーション（スライドイン）
 * - 複数通知のスタック表示対応
 * - `data-type` for styling
 * - `role="alert"` or `role="status"` for accessibility
 *
 * @see https://smarthr.design/products/components/notification-bar/
 */

import { createElement, generateId } from '../utils/dom'

// =============================================================================
// Types
// =============================================================================

/**
 * 通知バーのタイプ
 * - info: 情報通知
 * - success: 成功通知
 * - warning: 警告通知
 * - error: エラー通知
 * - sync: 同期中通知
 */
export type NotificationBarType = 'info' | 'success' | 'warning' | 'error' | 'sync'

/**
 * 通知バーの状態
 */
export interface NotificationBarState {
  /** メッセージ */
  message: string
  /** 表示状態 */
  visible: boolean
  /** 強調表示 */
  bold: boolean
}

/**
 * 通知バーのコールバック
 */
export interface NotificationBarCallbacks {
  /** 閉じるボタンクリック時 */
  onClose?: () => void
  /** アクションボタンクリック時 */
  onAction?: () => void
}

/**
 * 通知バーの設定
 */
export interface NotificationBarConfig {
  /** メッセージ */
  message: string
  /** タイプ（カラー） */
  type?: NotificationBarType
  /** アクションボタンのラベル */
  actionLabel?: string
  /** 閉じるボタンを表示するか */
  closable?: boolean
  /** 強調表示（背景色を濃くする） */
  bold?: boolean
  /** アクセシビリティ用のロール */
  role?: 'alert' | 'status'
  /** アクセシビリティ用のラベル */
  ariaLabel?: string
}

// =============================================================================
// Built-in Icons
// =============================================================================

const BUILTIN_ICONS: Record<NotificationBarType, string> = {
  info: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M15 8A7 7 0 1 1 1 8a7 7 0 0 1 14 0ZM9 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM6.75 8a.75.75 0 0 0 0 1.5h.75v1.75a.75.75 0 0 0 1.5 0v-2.5A.75.75 0 0 0 8.25 8h-1.5Z" clip-rule="evenodd" /></svg>`,
  success: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm3.844-8.791a.75.75 0 0 0-1.188-.918l-3.7 4.79-1.649-1.833a.75.75 0 1 0-1.114 1.004l2.25 2.5a.75.75 0 0 0 1.151-.043l4.25-5.5Z" clip-rule="evenodd" /></svg>`,
  warning: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M6.701 2.25c.577-1 2.02-1 2.598 0l5.196 9a1.5 1.5 0 0 1-1.299 2.25H2.804a1.5 1.5 0 0 1-1.3-2.25l5.197-9ZM8 4a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd" /></svg>`,
  error: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14ZM8 4a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd" /></svg>`,
  sync: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M13.836 2.477a.75.75 0 0 1 .75.75v3.182a.75.75 0 0 1-.75.75h-3.182a.75.75 0 0 1 0-1.5h1.37l-.84-.841a4.5 4.5 0 0 0-7.08.681.75.75 0 0 1-1.264-.808 6 6 0 0 1 9.44-.908l.97.969V3.227a.75.75 0 0 1 .75-.75Zm-1.09 7.595a6 6 0 0 1-9.44.908l-.97-.969v1.637a.75.75 0 0 1-1.5 0V8.466a.75.75 0 0 1 .75-.75h3.182a.75.75 0 0 1 0 1.5h-1.37l.84.841a4.5 4.5 0 0 0 7.08-.681.75.75 0 0 1 1.264.808Z" clip-rule="evenodd" /></svg>`,
}

const CLOSE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" /></svg>`

// =============================================================================
// NotificationBar Class
// =============================================================================

/**
 * 通知バーコンポーネント
 */
export class NotificationBar {
  private config: NotificationBarConfig
  private state: NotificationBarState
  private callbacks: NotificationBarCallbacks
  private container: HTMLElement
  private closeHandler: ((event: Event) => void) | null = null
  private actionHandler: ((event: Event) => void) | null = null

  constructor(
    container: HTMLElement,
    config: NotificationBarConfig,
    callbacks: NotificationBarCallbacks = {}
  ) {
    this.config = config
    this.container = container
    this.callbacks = callbacks
    this.state = this.createInitialState()
  }

  // ===========================================================================
  // Public Methods
  // ===========================================================================

  /**
   * 通知バーをレンダリング
   */
  render(): void {
    this.cleanup()
    this.container.innerHTML = ''

    const type = this.config.type ?? 'info'
    const bold = this.state.bold
    const closable = this.config.closable ?? true

    // コンテナのクラスとデータ属性を設定
    this.container.className = [
      'mokkun-notification-bar',
      `notification-bar-${type}`,
      bold ? 'notification-bar-bold' : '',
      !this.state.visible ? 'notification-bar-hidden' : '',
    ].filter(Boolean).join(' ')

    this.container.setAttribute('data-type', type)
    if (bold) {
      this.container.setAttribute('data-bold', '')
    } else {
      this.container.removeAttribute('data-bold')
    }

    if (!this.state.visible) {
      this.container.setAttribute('data-hidden', '')
      return
    } else {
      this.container.removeAttribute('data-hidden')
    }

    // ARIA属性
    const role = this.config.role ?? 'status'
    this.container.setAttribute('role', role)
    this.container.setAttribute('aria-live', role === 'alert' ? 'assertive' : 'polite')

    const ariaLabel = this.config.ariaLabel ?? this.state.message
    this.container.setAttribute('aria-label', ariaLabel)

    // 通知バーの内容を作成
    const content = this.renderContent()
    this.container.appendChild(content)

    // アクションボタン
    if (this.config.actionLabel && this.callbacks.onAction) {
      const actionButton = this.renderActionButton()
      this.container.appendChild(actionButton)
    }

    // 閉じるボタン
    if (closable && this.callbacks.onClose) {
      const closeButton = this.renderCloseButton()
      this.container.appendChild(closeButton)
    }
  }

  /**
   * メッセージを設定
   */
  setMessage(message: string): void {
    if (this.state.message === message) {
      return
    }

    this.state = {
      ...this.state,
      message,
    }

    this.render()
  }

  /**
   * 表示状態を設定
   */
  setVisible(visible: boolean): void {
    if (this.state.visible === visible) {
      return
    }

    this.state = {
      ...this.state,
      visible,
    }

    this.render()
  }

  /**
   * 強調表示を設定
   */
  setBold(bold: boolean): void {
    if (this.state.bold === bold) {
      return
    }

    this.state = {
      ...this.state,
      bold,
    }

    this.render()
  }

  /**
   * 通知を表示
   */
  show(): void {
    this.setVisible(true)
  }

  /**
   * 通知を非表示
   */
  hide(): void {
    this.setVisible(false)
  }

  /**
   * 現在のメッセージを取得
   */
  getMessage(): string {
    return this.state.message
  }

  /**
   * 表示状態を取得
   */
  isVisible(): boolean {
    return this.state.visible
  }

  /**
   * 強調表示状態を取得
   */
  isBold(): boolean {
    return this.state.bold
  }

  /**
   * 現在の状態を取得
   */
  getState(): Readonly<NotificationBarState> {
    return { ...this.state }
  }

  /**
   * コンポーネントを破棄
   */
  destroy(): void {
    this.cleanup()
    this.container.innerHTML = ''
    this.container.className = ''
    this.container.removeAttribute('role')
    this.container.removeAttribute('aria-live')
    this.container.removeAttribute('aria-label')
    this.container.removeAttribute('data-type')
    this.container.removeAttribute('data-bold')
    this.container.removeAttribute('data-hidden')
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  /**
   * 初期状態を作成
   */
  private createInitialState(): NotificationBarState {
    return {
      message: this.config.message,
      visible: true,
      bold: this.config.bold ?? false,
    }
  }

  /**
   * 通知バーの内容をレンダリング
   */
  private renderContent(): HTMLElement {
    const content = createElement('div', {
      className: 'notification-bar-content',
    })

    // アイコン
    const type = this.config.type ?? 'info'
    const iconEl = createElement('span', {
      className: 'notification-bar-icon',
      attributes: {
        'aria-hidden': 'true',
      },
    })
    iconEl.innerHTML = BUILTIN_ICONS[type]
    content.appendChild(iconEl)

    // メッセージ
    const messageEl = createElement('span', {
      className: 'notification-bar-message',
      textContent: this.state.message,
    })
    content.appendChild(messageEl)

    return content
  }

  /**
   * アクションボタンをレンダリング
   */
  private renderActionButton(): HTMLElement {
    const button = createElement('button', {
      className: 'notification-bar-action',
      textContent: this.config.actionLabel,
      attributes: {
        type: 'button',
      },
    })

    this.actionHandler = this.handleAction.bind(this)
    button.addEventListener('click', this.actionHandler)

    return button
  }

  /**
   * 閉じるボタンをレンダリング
   */
  private renderCloseButton(): HTMLElement {
    const button = createElement('button', {
      className: 'notification-bar-close',
      attributes: {
        type: 'button',
        'aria-label': '閉じる',
      },
    })
    button.innerHTML = CLOSE_ICON

    this.closeHandler = this.handleClose.bind(this)
    button.addEventListener('click', this.closeHandler)

    return button
  }

  /**
   * アクションボタンクリックハンドラー
   */
  private handleAction(event: Event): void {
    event.stopPropagation()
    this.callbacks.onAction?.()
  }

  /**
   * 閉じるボタンクリックハンドラー
   */
  private handleClose(event: Event): void {
    event.stopPropagation()
    this.callbacks.onClose?.()
  }

  /**
   * イベントリスナーをクリーンアップ
   */
  private cleanup(): void {
    if (this.closeHandler) {
      const closeButton = this.container.querySelector('.notification-bar-close')
      closeButton?.removeEventListener('click', this.closeHandler)
      this.closeHandler = null
    }
    if (this.actionHandler) {
      const actionButton = this.container.querySelector('.notification-bar-action')
      actionButton?.removeEventListener('click', this.actionHandler)
      this.actionHandler = null
    }
  }
}

// =============================================================================
// NotificationBarStack Class
// =============================================================================

/**
 * 通知アイテム
 */
export interface NotificationItem {
  /** 通知ID */
  id: string
  /** メッセージ */
  message: string
  /** タイプ */
  type?: NotificationBarType
  /** アクションラベル */
  actionLabel?: string
  /** 強調表示 */
  bold?: boolean
  /** アクセシビリティ用のロール */
  role?: 'alert' | 'status'
  /** アクションコールバック */
  onAction?: () => void
}

/**
 * 通知スタックの状態
 */
export interface NotificationBarStackState {
  /** 通知一覧 */
  notifications: NotificationItem[]
}

/**
 * 通知スタックのコールバック
 */
export interface NotificationBarStackCallbacks {
  /** 通知が閉じられた時 */
  onNotificationClose?: (id: string) => void
  /** 全通知が閉じられた時 */
  onAllClosed?: () => void
}

/**
 * 通知スタックの設定
 */
export interface NotificationBarStackConfig {
  /** 初期通知リスト */
  notifications?: NotificationItem[]
  /** 最大表示数 */
  maxVisible?: number
}

/**
 * 通知スタックコンポーネント
 * 複数の通知をスタック表示する
 */
export class NotificationBarStack {
  private config: NotificationBarStackConfig
  private state: NotificationBarStackState
  private callbacks: NotificationBarStackCallbacks
  private container: HTMLElement
  private notificationBars: Map<string, NotificationBar> = new Map()

  constructor(
    container: HTMLElement,
    config: NotificationBarStackConfig = {},
    callbacks: NotificationBarStackCallbacks = {}
  ) {
    this.config = config
    this.container = container
    this.callbacks = callbacks
    this.state = this.createInitialState()
  }

  // ===========================================================================
  // Public Methods
  // ===========================================================================

  /**
   * スタックをレンダリング
   */
  render(): void {
    this.container.innerHTML = ''
    this.notificationBars.clear()

    this.container.className = 'mokkun-notification-bar-stack'

    const maxVisible = this.config.maxVisible ?? 5
    const visibleNotifications = this.state.notifications.slice(0, maxVisible)

    visibleNotifications.forEach((notification) => {
      const wrapper = createElement('div', {
        className: 'notification-bar-wrapper',
        attributes: {
          'data-notification-id': notification.id,
        },
      })

      const notificationContainer = createElement('div', {})
      wrapper.appendChild(notificationContainer)

      const notificationBar = new NotificationBar(
        notificationContainer,
        {
          message: notification.message,
          type: notification.type,
          actionLabel: notification.actionLabel,
          closable: true,
          bold: notification.bold,
          role: notification.role,
        },
        {
          onClose: () => this.removeNotification(notification.id),
          onAction: notification.onAction,
        }
      )

      notificationBar.render()
      this.notificationBars.set(notification.id, notificationBar)
      this.container.appendChild(wrapper)
    })
  }

  /**
   * 通知を追加
   */
  addNotification(notification: Omit<NotificationItem, 'id'> & { id?: string }): string {
    const id = notification.id ?? generateId('notification')
    const newNotification: NotificationItem = {
      ...notification,
      id,
    }

    this.state = {
      ...this.state,
      notifications: [newNotification, ...this.state.notifications],
    }

    this.render()
    return id
  }

  /**
   * 通知を削除
   */
  removeNotification(id: string): void {
    const notification = this.state.notifications.find((n) => n.id === id)
    if (!notification) {
      return
    }

    const notificationBar = this.notificationBars.get(id)
    if (notificationBar) {
      notificationBar.destroy()
      this.notificationBars.delete(id)
    }

    this.state = {
      ...this.state,
      notifications: this.state.notifications.filter((n) => n.id !== id),
    }

    this.callbacks.onNotificationClose?.(id)

    if (this.state.notifications.length === 0) {
      this.callbacks.onAllClosed?.()
    }

    this.render()
  }

  /**
   * 全通知をクリア
   */
  clearAll(): void {
    this.notificationBars.forEach((bar) => bar.destroy())
    this.notificationBars.clear()

    this.state = {
      ...this.state,
      notifications: [],
    }

    this.callbacks.onAllClosed?.()
    this.render()
  }

  /**
   * 通知数を取得
   */
  getCount(): number {
    return this.state.notifications.length
  }

  /**
   * 通知一覧を取得
   */
  getNotifications(): Readonly<NotificationItem[]> {
    return [...this.state.notifications]
  }

  /**
   * 現在の状態を取得
   */
  getState(): Readonly<NotificationBarStackState> {
    return {
      notifications: [...this.state.notifications],
    }
  }

  /**
   * コンポーネントを破棄
   */
  destroy(): void {
    this.notificationBars.forEach((bar) => bar.destroy())
    this.notificationBars.clear()
    this.container.innerHTML = ''
    this.container.className = ''
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  /**
   * 初期状態を作成
   */
  private createInitialState(): NotificationBarStackState {
    return {
      notifications: this.config.notifications ? [...this.config.notifications] : [],
    }
  }
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * 通知バーを作成
 */
export function createNotificationBar(
  container: HTMLElement,
  config: NotificationBarConfig,
  callbacks: NotificationBarCallbacks = {}
): NotificationBar {
  const notificationBar = new NotificationBar(container, config, callbacks)
  notificationBar.render()
  return notificationBar
}

/**
 * 通知スタックを作成
 */
export function createNotificationBarStack(
  container: HTMLElement,
  config: NotificationBarStackConfig = {},
  callbacks: NotificationBarStackCallbacks = {}
): NotificationBarStack {
  const stack = new NotificationBarStack(container, config, callbacks)
  stack.render()
  return stack
}

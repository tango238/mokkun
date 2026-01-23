/**
 * Action Button Group Component
 * アクションボタングループコンポーネント
 *
 * 複数のアクションボタンを適切に配置するコンポーネント
 */

import type { Action, ConfirmConfig } from '../../types/schema'
import { clearElement } from '../utils/dom'

// =============================================================================
// Constants
// =============================================================================

/** Default gap between buttons (matches design system spacing-2) */
const DEFAULT_BUTTON_GAP = '8px'

// =============================================================================
// Utilities
// =============================================================================

/**
 * CSS.escape のポリフィル（テスト環境用フォールバック）
 */
function cssEscape(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value)
  }
  // Fallback: 基本的なエスケープ
  return value.replace(/([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, '\\$1')
}

// =============================================================================
// Types
// =============================================================================

/**
 * アクションボタンの定義
 */
export interface ActionButton {
  /** ボタンID */
  id: string
  /** ボタンタイプ */
  type: 'submit' | 'navigate' | 'custom' | 'reset'
  /** ラベル */
  label: string
  /** アイコン（オプション） */
  icon?: string
  /** スタイル */
  style?: 'primary' | 'secondary' | 'danger' | 'link'
  /** 無効化 */
  disabled?: boolean
  /** 遷移先（navigate時） */
  to?: string
  /** カスタムハンドラー名（custom時） */
  handler?: string
  /** 確認ダイアログ設定 */
  confirm?: ConfirmConfig
}

/**
 * ボタン配置
 */
export type ButtonAlignment = 'start' | 'center' | 'end' | 'spread'

/**
 * ActionButtonGroupの設定
 */
export interface ActionButtonGroupConfig {
  /** ボタン定義 */
  buttons: ActionButton[]
  /** ボタン配置 */
  alignment?: ButtonAlignment
  /** ボタン間のギャップ */
  gap?: string
  /** モバイルでスタック表示 */
  stackOnMobile?: boolean
  /** 表示可能な最大ボタン数（超過分はオーバーフローメニュー） */
  maxVisibleButtons?: number
}

/**
 * ActionButtonGroupの状態
 */
export interface ActionButtonGroupState {
  /** ボタン定義 */
  buttons: ActionButton[]
  /** ボタン配置 */
  alignment: ButtonAlignment
  /** ボタン間のギャップ */
  gap: string
  /** モバイルでスタック表示 */
  stackOnMobile: boolean
  /** 表示可能な最大ボタン数 */
  maxVisibleButtons?: number
  /** ローディング中のボタンID */
  loadingButtons: Set<string>
  /** オーバーフローメニューが開いているか */
  overflowMenuOpen: boolean
}

/**
 * ActionButtonGroupのコールバック
 */
export interface ActionButtonGroupCallbacks {
  /** ボタンクリック時 */
  onClick?: (buttonId: string, state: ActionButtonGroupState) => void
  /** Submit時 */
  onSubmit?: (buttonId: string, state: ActionButtonGroupState) => void
  /** Navigate時 */
  onNavigate?: (to: string, state: ActionButtonGroupState) => void
  /** Custom時 */
  onCustom?: (handler: string, state: ActionButtonGroupState) => void
  /** 確認ダイアログ表示時（trueを返すと処理続行） */
  onConfirm?: (config: ConfirmConfig, state: ActionButtonGroupState) => Promise<boolean>
}

// =============================================================================
// ActionButtonGroup Class
// =============================================================================

/**
 * アクションボタングループコンポーネント
 */
export class ActionButtonGroup {
  private config: ActionButtonGroupConfig
  private container: HTMLElement
  private callbacks: ActionButtonGroupCallbacks
  private state: ActionButtonGroupState
  private groupElement: HTMLElement | null = null
  private overflowMenuElement: HTMLElement | null = null

  constructor(
    config: ActionButtonGroupConfig,
    container: HTMLElement,
    callbacks: ActionButtonGroupCallbacks = {}
  ) {
    this.config = config
    this.container = container
    this.callbacks = callbacks
    this.state = this.initializeState()
  }

  /**
   * 初期状態を生成
   */
  private initializeState(): ActionButtonGroupState {
    return {
      buttons: this.config.buttons.map(b => ({ ...b })),
      alignment: this.config.alignment ?? 'end',
      gap: this.config.gap ?? DEFAULT_BUTTON_GAP,
      stackOnMobile: this.config.stackOnMobile ?? false,
      maxVisibleButtons: this.config.maxVisibleButtons,
      loadingButtons: new Set<string>(),
      overflowMenuOpen: false,
    }
  }

  /**
   * 現在の状態を取得（深いコピーを返す）
   */
  getState(): ActionButtonGroupState {
    return {
      ...this.state,
      buttons: this.state.buttons.map(b => ({ ...b })),
      loadingButtons: new Set(this.state.loadingButtons),
    }
  }

  /**
   * ボタンを取得（コピーを返す）
   */
  getButton(id: string): ActionButton | undefined {
    const button = this.state.buttons.find(b => b.id === id)
    return button ? { ...button } : undefined
  }

  /**
   * Action配列からConfigを生成
   */
  static fromActions(actions: Action[]): ActionButtonGroupConfig {
    const buttons: ActionButton[] = actions.map(action => {
      const base: ActionButton = {
        id: action.id,
        type: action.type,
        label: action.label,
        icon: action.icon,
        style: action.style,
        confirm: action.confirm,
      }

      if (action.type === 'navigate') {
        base.to = action.to
      }

      if (action.type === 'custom') {
        base.handler = action.handler
      }

      return base
    })

    return { buttons }
  }

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  /**
   * レンダリング
   */
  render(): void {
    clearElement(this.container)

    this.groupElement = document.createElement('div')
    this.groupElement.className = this.buildGroupClassName()
    this.groupElement.style.gap = this.state.gap

    const { visibleButtons, overflowButtons } = this.splitButtons()

    // 可視ボタンをレンダリング
    for (const button of visibleButtons) {
      const btnEl = this.renderButton(button)
      this.groupElement.appendChild(btnEl)
    }

    // オーバーフローメニューをレンダリング
    if (overflowButtons.length > 0) {
      const overflowContainer = this.renderOverflowMenu(overflowButtons)
      this.groupElement.appendChild(overflowContainer)
    }

    this.container.appendChild(this.groupElement)
  }

  /**
   * グループのクラス名を生成
   */
  private buildGroupClassName(): string {
    const classes = ['action-button-group', `alignment-${this.state.alignment}`]

    if (this.state.stackOnMobile) {
      classes.push('stack-on-mobile')
    }

    return classes.join(' ')
  }

  /**
   * ボタンを可視とオーバーフローに分割
   */
  private splitButtons(): { visibleButtons: ActionButton[]; overflowButtons: ActionButton[] } {
    if (!this.state.maxVisibleButtons || this.state.buttons.length <= this.state.maxVisibleButtons) {
      return { visibleButtons: this.state.buttons, overflowButtons: [] }
    }

    return {
      visibleButtons: this.state.buttons.slice(0, this.state.maxVisibleButtons),
      overflowButtons: this.state.buttons.slice(this.state.maxVisibleButtons),
    }
  }

  /**
   * 単一ボタンをレンダリング
   */
  private renderButton(button: ActionButton): HTMLButtonElement {
    const btnEl = document.createElement('button')
    btnEl.className = this.buildButtonClassName(button)
    btnEl.dataset.buttonId = button.id
    btnEl.type = this.getButtonType(button.type)

    const isLoading = this.state.loadingButtons.has(button.id)
    const isDisabled = button.disabled || isLoading

    btnEl.disabled = isDisabled

    if (isDisabled) {
      btnEl.setAttribute('aria-disabled', 'true')
    }

    if (isLoading) {
      btnEl.setAttribute('aria-busy', 'true')
      btnEl.classList.add('is-loading')
    }

    // アイコン
    if (button.icon) {
      const iconSpan = document.createElement('span')
      iconSpan.className = 'action-btn-icon'
      iconSpan.textContent = button.icon
      btnEl.appendChild(iconSpan)
    }

    // ローディングスピナー
    if (isLoading) {
      const spinnerSpan = document.createElement('span')
      spinnerSpan.className = 'action-btn-spinner'
      btnEl.appendChild(spinnerSpan)
    }

    // ラベル
    const labelSpan = document.createElement('span')
    labelSpan.className = 'action-btn-label'
    labelSpan.textContent = button.label
    btnEl.appendChild(labelSpan)

    // クリックイベント
    btnEl.addEventListener('click', (e) => this.handleButtonClick(e, button))

    return btnEl
  }

  /**
   * ボタンのクラス名を生成
   */
  private buildButtonClassName(button: ActionButton): string {
    const style = button.style ?? 'secondary'
    return `action-btn action-btn-${style}`
  }

  /**
   * ボタンタイプを取得
   */
  private getButtonType(type: ActionButton['type']): 'submit' | 'reset' | 'button' {
    if (type === 'submit') return 'submit'
    if (type === 'reset') return 'reset'
    return 'button'
  }

  /**
   * オーバーフローメニューをレンダリング
   */
  private renderOverflowMenu(buttons: ActionButton[]): HTMLElement {
    const container = document.createElement('div')
    container.className = 'overflow-menu-container'

    // トリガーボタン
    const trigger = document.createElement('button')
    trigger.type = 'button'
    trigger.className = 'action-btn action-btn-secondary overflow-menu-trigger'
    trigger.textContent = '...'
    trigger.setAttribute('aria-label', 'More actions')
    trigger.setAttribute('aria-haspopup', 'true')
    trigger.setAttribute('aria-expanded', String(this.state.overflowMenuOpen))
    trigger.addEventListener('click', () => this.toggleOverflowMenu())
    container.appendChild(trigger)

    // メニュー
    this.overflowMenuElement = document.createElement('div')
    this.overflowMenuElement.className = `overflow-menu${this.state.overflowMenuOpen ? ' is-open' : ''}`

    for (const button of buttons) {
      const menuItem = document.createElement('button')
      menuItem.type = 'button'
      menuItem.className = 'overflow-menu-item'
      menuItem.dataset.buttonId = button.id
      menuItem.textContent = button.label
      menuItem.disabled = button.disabled || false
      menuItem.addEventListener('click', (e) => this.handleButtonClick(e, button))
      this.overflowMenuElement.appendChild(menuItem)
    }

    container.appendChild(this.overflowMenuElement)

    return container
  }

  // ---------------------------------------------------------------------------
  // Event Handlers
  // ---------------------------------------------------------------------------

  /**
   * ボタンクリック時の処理
   */
  private async handleButtonClick(e: Event, button: ActionButton): Promise<void> {
    e.preventDefault()

    // 汎用のonClickコールバック
    this.callbacks.onClick?.(button.id, this.getState())

    // 確認ダイアログが設定されている場合
    if (button.confirm && this.callbacks.onConfirm) {
      const confirmed = await this.callbacks.onConfirm(button.confirm, this.getState())
      if (!confirmed) {
        return
      }
    }

    // タイプ別のコールバック
    switch (button.type) {
      case 'submit':
        this.callbacks.onSubmit?.(button.id, this.getState())
        break
      case 'navigate':
        if (button.to) {
          this.callbacks.onNavigate?.(button.to, this.getState())
        }
        break
      case 'custom':
        if (button.handler) {
          this.callbacks.onCustom?.(button.handler, this.getState())
        }
        break
    }

    // オーバーフローメニューを閉じる
    this.closeOverflowMenu()
  }

  // ---------------------------------------------------------------------------
  // State Management
  // ---------------------------------------------------------------------------

  /**
   * ローディング状態を設定
   */
  setLoading(buttonId: string, loading: boolean): void {
    const newLoadingButtons = new Set(this.state.loadingButtons)
    if (loading) {
      newLoadingButtons.add(buttonId)
    } else {
      newLoadingButtons.delete(buttonId)
    }

    this.state = {
      ...this.state,
      loadingButtons: newLoadingButtons,
    }

    this.updateButtonState(buttonId)
  }

  /**
   * 無効化状態を設定
   */
  setDisabled(buttonId: string, disabled: boolean): void {
    this.state = {
      ...this.state,
      buttons: this.state.buttons.map(b =>
        b.id === buttonId ? { ...b, disabled } : b
      ),
    }
    this.updateButtonState(buttonId)
  }

  /**
   * ボタンの状態を更新
   */
  private updateButtonState(buttonId: string): void {
    const escapedId = cssEscape(buttonId)
    const btnEl = this.container.querySelector(`[data-button-id="${escapedId}"]`) as HTMLButtonElement | null
    if (!btnEl) return

    const button = this.state.buttons.find(b => b.id === buttonId)
    if (!button) return

    const isLoading = this.state.loadingButtons.has(buttonId)
    const isDisabled = button.disabled || isLoading

    btnEl.disabled = isDisabled

    if (isDisabled) {
      btnEl.setAttribute('aria-disabled', 'true')
    } else {
      btnEl.removeAttribute('aria-disabled')
    }

    if (isLoading) {
      btnEl.setAttribute('aria-busy', 'true')
      btnEl.classList.add('is-loading')
    } else {
      btnEl.removeAttribute('aria-busy')
      btnEl.classList.remove('is-loading')
    }
  }

  /**
   * オーバーフローメニューを切り替え
   */
  toggleOverflowMenu(): void {
    this.state = {
      ...this.state,
      overflowMenuOpen: !this.state.overflowMenuOpen,
    }
    this.updateOverflowMenuState()
  }

  /**
   * オーバーフローメニューを閉じる
   */
  closeOverflowMenu(): void {
    if (this.state.overflowMenuOpen) {
      this.state = {
        ...this.state,
        overflowMenuOpen: false,
      }
      this.updateOverflowMenuState()
    }
  }

  /**
   * オーバーフローメニューの状態を更新
   */
  private updateOverflowMenuState(): void {
    if (!this.overflowMenuElement) return

    const trigger = this.container.querySelector('.overflow-menu-trigger')
    if (trigger) {
      trigger.setAttribute('aria-expanded', String(this.state.overflowMenuOpen))
    }

    if (this.state.overflowMenuOpen) {
      this.overflowMenuElement.classList.add('is-open')
    } else {
      this.overflowMenuElement.classList.remove('is-open')
    }
  }

  // ---------------------------------------------------------------------------
  // Button Management
  // ---------------------------------------------------------------------------

  /**
   * ボタンを追加
   */
  addButton(button: ActionButton, index?: number): void {
    const newButtons = this.state.buttons.map(b => ({ ...b }))
    if (index !== undefined && index >= 0 && index < newButtons.length) {
      newButtons.splice(index, 0, { ...button })
    } else {
      newButtons.push({ ...button })
    }

    this.state = {
      ...this.state,
      buttons: newButtons,
    }
    this.render()
  }

  /**
   * ボタンを削除
   */
  removeButton(buttonId: string): boolean {
    const index = this.state.buttons.findIndex(b => b.id === buttonId)
    if (index === -1) return false

    this.state = {
      ...this.state,
      buttons: this.state.buttons.filter(b => b.id !== buttonId),
    }
    this.render()
    return true
  }

  /**
   * ボタンを更新
   */
  updateButton(buttonId: string, updates: Partial<ActionButton>): boolean {
    const buttonIndex = this.state.buttons.findIndex(b => b.id === buttonId)
    if (buttonIndex === -1) return false

    this.state = {
      ...this.state,
      buttons: this.state.buttons.map((b, i) =>
        i === buttonIndex ? { ...b, ...updates } : b
      ),
    }
    this.render()
    return true
  }

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  /**
   * クリーンアップ
   */
  destroy(): void {
    clearElement(this.container)
    this.groupElement = null
    this.overflowMenuElement = null
  }
}

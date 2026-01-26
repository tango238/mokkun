/**
 * SearchInput Component
 * 検索専用の入力フィールドコンポーネント
 *
 * Features:
 * - 検索アイコン
 * - プレースホルダー
 * - クリアボタン
 * - キーボードショートカット表示
 */

import { createElement, generateId } from '../utils/dom'

// =============================================================================
// Types
// =============================================================================

/**
 * 検索入力の状態
 */
export interface SearchInputState {
  /** 現在の値 */
  value: string
  /** 無効化状態 */
  disabled: boolean
  /** フォーカス状態 */
  focused: boolean
  /** 検索中状態 */
  loading: boolean
}

/**
 * 検索入力のコールバック
 */
export interface SearchInputCallbacks {
  /** 値変更時 */
  onChange?: (value: string, state: SearchInputState) => void
  /** 検索実行時（Enter押下またはdebounce後） */
  onSearch?: (value: string, state: SearchInputState) => void
  /** クリアボタン押下時 */
  onClear?: (state: SearchInputState) => void
  /** フォーカス時 */
  onFocus?: (state: SearchInputState) => void
  /** ブラー時 */
  onBlur?: (state: SearchInputState) => void
}

/**
 * キーボードショートカットの設定
 */
export interface KeyboardShortcut {
  /** 修飾キー */
  modifier?: 'cmd' | 'ctrl' | 'alt' | 'shift'
  /** キー */
  key: string
  /** 表示ラベル（省略時は自動生成） */
  label?: string
}

/**
 * 検索入力の設定
 */
export interface SearchInputConfig {
  /** 初期値 */
  defaultValue?: string
  /** プレースホルダー */
  placeholder?: string
  /** 無効化 */
  disabled?: boolean
  /** サイズ */
  size?: 'small' | 'medium' | 'large'
  /** クリアボタン表示 */
  clearable?: boolean
  /** 検索アイコン表示 */
  showSearchIcon?: boolean
  /** キーボードショートカット */
  shortcut?: KeyboardShortcut
  /** 自動フォーカス */
  autoFocus?: boolean
  /** デバウンス時間（ms）- 0の場合はデバウンスなし */
  debounceMs?: number
  /** aria-label */
  ariaLabel?: string
  /** ローディング状態 */
  loading?: boolean
}

// =============================================================================
// SearchInput Class
// =============================================================================

/**
 * 検索入力コンポーネント
 */
export class SearchInput {
  private config: SearchInputConfig
  private state: SearchInputState
  private callbacks: SearchInputCallbacks
  private container: HTMLElement
  private instanceId: string
  private inputElement: HTMLInputElement | null = null
  private debounceTimer: ReturnType<typeof setTimeout> | null = null
  private globalKeyHandler: ((e: KeyboardEvent) => void) | null = null

  constructor(
    container: HTMLElement,
    config: SearchInputConfig = {},
    callbacks: SearchInputCallbacks = {}
  ) {
    this.config = {
      showSearchIcon: true,
      clearable: true,
      placeholder: '検索...',
      size: 'medium',
      debounceMs: 300,
      ...config,
    }
    this.container = container
    this.callbacks = callbacks
    this.instanceId = generateId('search-input')
    this.state = this.createInitialState()
  }

  // ===========================================================================
  // Public Methods
  // ===========================================================================

  /**
   * 検索入力フィールドをレンダリング
   */
  render(): void {
    this.container.innerHTML = ''

    const size = this.config.size ?? 'medium'

    this.container.className = `mokkun-search-input search-input-${size}`

    // data-state属性を設定
    this.container.setAttribute('data-state', this.getDataState())
    if (this.state.disabled) {
      this.container.setAttribute('data-disabled', '')
    } else {
      this.container.removeAttribute('data-disabled')
    }
    if (this.state.loading) {
      this.container.setAttribute('data-loading', '')
    } else {
      this.container.removeAttribute('data-loading')
    }

    const wrapper = createElement('div', { className: 'search-input-wrapper' })
    const inputGroup = this.renderInputGroup()
    wrapper.appendChild(inputGroup)

    this.container.appendChild(wrapper)

    // グローバルキーボードショートカットを登録
    if (this.config.shortcut) {
      this.registerGlobalShortcut()
    }

    // オートフォーカス
    if (this.config.autoFocus && this.inputElement) {
      this.inputElement.focus()
    }
  }

  /**
   * 値を設定
   */
  setValue(value: string): void {
    if (this.state.value === value) {
      return
    }

    this.state = {
      ...this.state,
      value,
    }

    if (this.inputElement) {
      this.inputElement.value = value
    }

    this.updateClearButton()
    this.callbacks.onChange?.(value, this.state)
  }

  /**
   * 値を取得
   */
  getValue(): string {
    return this.state.value
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

    if (loading) {
      this.container.setAttribute('data-loading', '')
    } else {
      this.container.removeAttribute('data-loading')
    }

    this.updateSearchIcon()
  }

  /**
   * 無効化状態を設定
   */
  setDisabled(disabled: boolean): void {
    if (this.state.disabled === disabled) {
      return
    }

    this.state = {
      ...this.state,
      disabled,
    }

    this.render()
  }

  /**
   * フォーカス
   */
  focus(): void {
    if (this.inputElement) {
      this.inputElement.focus()
    }
  }

  /**
   * ブラー
   */
  blur(): void {
    if (this.inputElement) {
      this.inputElement.blur()
    }
  }

  /**
   * クリア
   */
  clear(): void {
    this.setValue('')
    this.callbacks.onClear?.(this.state)
    this.focus()
  }

  /**
   * 状態を取得
   */
  getState(): SearchInputState {
    return { ...this.state }
  }

  /**
   * 破棄
   */
  destroy(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }

    if (this.globalKeyHandler) {
      document.removeEventListener('keydown', this.globalKeyHandler)
      this.globalKeyHandler = null
    }

    this.container.innerHTML = ''
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  /**
   * 初期状態を作成
   */
  private createInitialState(): SearchInputState {
    return {
      value: this.config.defaultValue ?? '',
      disabled: this.config.disabled ?? false,
      focused: false,
      loading: this.config.loading ?? false,
    }
  }

  /**
   * data-state属性の値を取得
   */
  private getDataState(): string {
    if (this.state.focused) return 'focused'
    if (this.state.value) return 'filled'
    return 'empty'
  }

  /**
   * 入力グループをレンダリング
   */
  private renderInputGroup(): HTMLElement {
    const inputGroup = createElement('div', {
      className: 'search-input-group',
    })

    // 検索アイコン
    if (this.config.showSearchIcon) {
      const iconElement = this.renderSearchIcon()
      inputGroup.appendChild(iconElement)
    }

    // 入力フィールド
    const input = this.renderInput()
    inputGroup.appendChild(input)

    // クリアボタンまたはショートカット表示
    if (this.config.clearable && this.state.value && !this.state.disabled) {
      const clearButton = this.renderClearButton()
      inputGroup.appendChild(clearButton)
    } else if (this.config.shortcut && !this.state.value) {
      const shortcutBadge = this.renderShortcutBadge()
      inputGroup.appendChild(shortcutBadge)
    }

    return inputGroup
  }

  /**
   * 検索アイコンをレンダリング
   */
  private renderSearchIcon(): HTMLElement {
    const iconWrapper = createElement('span', {
      className: `search-input-icon ${this.state.loading ? 'is-loading' : ''}`,
    })

    if (this.state.loading) {
      // ローディングスピナー
      const spinner = createElement('span', {
        className: 'search-input-spinner',
      })
      iconWrapper.appendChild(spinner)
    } else {
      // 検索アイコン（SVG）
      iconWrapper.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      `
    }

    return iconWrapper
  }

  /**
   * 検索アイコンを更新
   */
  private updateSearchIcon(): void {
    const iconWrapper = this.container.querySelector('.search-input-icon')
    if (!iconWrapper) return

    if (this.state.loading) {
      iconWrapper.classList.add('is-loading')
      iconWrapper.innerHTML = '<span class="search-input-spinner"></span>'
    } else {
      iconWrapper.classList.remove('is-loading')
      iconWrapper.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      `
    }
  }

  /**
   * 入力フィールドをレンダリング
   */
  private renderInput(): HTMLInputElement {
    const input = createElement('input', {
      className: 'search-input-field',
      attributes: {
        type: 'search',
        id: this.instanceId,
        placeholder: this.config.placeholder ?? '',
        ...(this.config.ariaLabel && { 'aria-label': this.config.ariaLabel }),
        ...(this.state.disabled && { disabled: 'disabled' }),
      },
    })

    input.value = this.state.value

    // イベントリスナー
    input.addEventListener('input', this.handleInput.bind(this))
    input.addEventListener('focus', this.handleFocus.bind(this))
    input.addEventListener('blur', this.handleBlur.bind(this))
    input.addEventListener('keydown', this.handleKeyDown.bind(this))

    this.inputElement = input
    return input
  }

  /**
   * クリアボタンをレンダリング
   */
  private renderClearButton(): HTMLElement {
    const button = createElement('button', {
      className: 'search-input-clear-button',
      attributes: {
        type: 'button',
        'aria-label': 'クリア',
      },
    })

    // クリアアイコン（×）
    button.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    `

    button.addEventListener('click', this.handleClear.bind(this))

    return button
  }

  /**
   * ショートカットバッジをレンダリング
   */
  private renderShortcutBadge(): HTMLElement {
    const shortcut = this.config.shortcut!
    const label = shortcut.label ?? this.getShortcutLabel(shortcut)

    const badge = createElement('span', {
      className: 'search-input-shortcut',
      textContent: label,
    })

    return badge
  }

  /**
   * ショートカットラベルを取得
   */
  private getShortcutLabel(shortcut: KeyboardShortcut): string {
    const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac')
    const parts: string[] = []

    if (shortcut.modifier) {
      switch (shortcut.modifier) {
        case 'cmd':
          parts.push(isMac ? '⌘' : 'Ctrl')
          break
        case 'ctrl':
          parts.push(isMac ? '⌃' : 'Ctrl')
          break
        case 'alt':
          parts.push(isMac ? '⌥' : 'Alt')
          break
        case 'shift':
          parts.push(isMac ? '⇧' : 'Shift')
          break
      }
    }

    parts.push(shortcut.key.toUpperCase())

    return parts.join(isMac ? '' : '+')
  }

  /**
   * グローバルキーボードショートカットを登録
   */
  private registerGlobalShortcut(): void {
    const shortcut = this.config.shortcut!

    this.globalKeyHandler = (e: KeyboardEvent) => {
      if (this.state.disabled) return

      const isMac = navigator.platform.includes('Mac')
      let modifierMatch = true

      if (shortcut.modifier) {
        switch (shortcut.modifier) {
          case 'cmd':
            modifierMatch = isMac ? e.metaKey : e.ctrlKey
            break
          case 'ctrl':
            modifierMatch = e.ctrlKey
            break
          case 'alt':
            modifierMatch = e.altKey
            break
          case 'shift':
            modifierMatch = e.shiftKey
            break
        }
      }

      if (modifierMatch && e.key.toLowerCase() === shortcut.key.toLowerCase()) {
        e.preventDefault()
        this.focus()
      }
    }

    document.addEventListener('keydown', this.globalKeyHandler)
  }

  /**
   * クリアボタンの表示/非表示を更新
   */
  private updateClearButton(): void {
    const inputGroup = this.container.querySelector('.search-input-group')
    if (!inputGroup) return

    const existingClearButton = inputGroup.querySelector('.search-input-clear-button')
    const existingShortcut = inputGroup.querySelector('.search-input-shortcut')
    const shouldShowClear = this.state.value && !this.state.disabled

    if (shouldShowClear && !existingClearButton) {
      // ショートカットバッジを削除してクリアボタンを追加
      if (existingShortcut) {
        existingShortcut.remove()
      }
      const clearButton = this.renderClearButton()
      inputGroup.appendChild(clearButton)
    } else if (!shouldShowClear && existingClearButton) {
      // クリアボタンを削除
      existingClearButton.remove()
      // ショートカットがあれば復元
      if (this.config.shortcut && !this.state.value) {
        const shortcutBadge = this.renderShortcutBadge()
        inputGroup.appendChild(shortcutBadge)
      }
    }
  }

  // ===========================================================================
  // Event Handlers
  // ===========================================================================

  /**
   * 入力イベント
   */
  private handleInput(event: Event): void {
    const target = event.target as HTMLInputElement
    const value = target.value

    this.state = {
      ...this.state,
      value,
    }

    this.callbacks.onChange?.(value, this.state)

    // クリアボタンの表示/非表示を更新
    if (this.config.clearable) {
      this.updateClearButton()
    }

    // デバウンス検索
    if (this.config.debounceMs && this.config.debounceMs > 0) {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer)
      }
      this.debounceTimer = setTimeout(() => {
        this.callbacks.onSearch?.(this.state.value, this.state)
      }, this.config.debounceMs)
    }
  }

  /**
   * フォーカスイベント
   */
  private handleFocus(): void {
    this.state = {
      ...this.state,
      focused: true,
    }

    this.container.setAttribute('data-state', this.getDataState())
    this.callbacks.onFocus?.(this.state)
  }

  /**
   * ブラーイベント
   */
  private handleBlur(): void {
    this.state = {
      ...this.state,
      focused: false,
    }

    this.container.setAttribute('data-state', this.getDataState())
    this.callbacks.onBlur?.(this.state)
  }

  /**
   * キーダウンイベント
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      // デバウンスタイマーをキャンセルして即座に検索
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer)
        this.debounceTimer = null
      }
      this.callbacks.onSearch?.(this.state.value, this.state)
    } else if (event.key === 'Escape') {
      if (this.state.value) {
        this.clear()
      } else {
        this.blur()
      }
    }
  }

  /**
   * クリアイベント
   */
  private handleClear(): void {
    this.clear()
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * 検索入力コンポーネントを作成
 */
export function createSearchInput(
  container: HTMLElement,
  config: SearchInputConfig = {},
  callbacks: SearchInputCallbacks = {}
): SearchInput {
  const searchInput = new SearchInput(container, config, callbacks)
  searchInput.render()
  return searchInput
}

/**
 * RadioButtonPanel Component
 * ラジオボタンパネルコンポーネント
 *
 * Card-style radio button group component:
 * - Visual panel/card appearance for each option
 * - Icon and image support
 * - Description text
 * - Disabled state (group and per-option)
 * - Selected state highlighting
 * - Vertical/horizontal/grid layouts
 * - Full ARIA 1.2 compliance with keyboard navigation
 */

import { createElement } from '../utils/dom'

// =============================================================================
// Types
// =============================================================================

/**
 * ラジオボタンパネルのオプション
 */
export interface RadioButtonPanelOption {
  /** 値 */
  value: string
  /** ラベル */
  label: string
  /** 説明テキスト */
  description?: string
  /** アイコン（SVG文字列） */
  icon?: string
  /** 画像URL */
  image?: string
  /** 無効化 */
  disabled?: boolean
}

/**
 * ラジオボタンパネルの状態
 */
export interface RadioButtonPanelState {
  /** 選択された値 */
  selectedValue: string | null
  /** 無効化状態 */
  disabled: boolean
  /** フォーカスされているオプションのインデックス */
  focusedIndex: number
}

/**
 * ラジオボタンパネルのコールバック
 */
export interface RadioButtonPanelCallbacks {
  /** 値変更時（値と状態を受け取る） */
  onChange?: (value: string, state: RadioButtonPanelState) => void
  /** 値変更時（値のみを受け取る） */
  onValueChange?: (value: string) => void
}

/**
 * ラジオボタンパネルの設定
 */
export interface RadioButtonPanelConfig {
  /** name属性（フォーム用、必須） */
  name: string
  /** オプション配列 */
  options: RadioButtonPanelOption[]
  /** 初期選択値 */
  defaultValue?: string
  /** レイアウト方向 */
  direction?: 'horizontal' | 'vertical'
  /** グリッドカラム数（horizontal時のみ） */
  columns?: 1 | 2 | 3 | 4
  /** サイズ */
  size?: 'small' | 'medium' | 'large'
  /** 無効化（グループ全体） */
  disabled?: boolean
  /** 必須 */
  required?: boolean
  /** 幅 */
  width?: string | number
}

// =============================================================================
// RadioButtonPanel Class
// =============================================================================

/**
 * ラジオボタンパネルコンポーネント
 */
export class RadioButtonPanel {
  private config: RadioButtonPanelConfig
  private state: RadioButtonPanelState
  private callbacks: RadioButtonPanelCallbacks
  private container: HTMLElement
  private optionElements: HTMLElement[] = []

  constructor(
    container: HTMLElement,
    config: RadioButtonPanelConfig,
    callbacks: RadioButtonPanelCallbacks = {}
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
   * ラジオボタンパネルをレンダリング
   */
  render(): void {
    this.container.innerHTML = ''
    this.optionElements = []

    const size = this.config.size ?? 'medium'
    const direction = this.config.direction ?? 'vertical'
    const columns = this.config.columns ?? 1

    this.container.className = `mokkun-radio-button-panel radio-panel-${size}`
    this.container.setAttribute('role', 'radiogroup')
    this.container.setAttribute('data-direction', direction)
    this.container.setAttribute('data-columns', String(columns))

    if (this.config.required) {
      this.container.setAttribute('aria-required', 'true')
    }

    if (this.state.disabled) {
      this.container.setAttribute('data-disabled', '')
    } else {
      this.container.removeAttribute('data-disabled')
    }

    // 幅の設定
    if (this.config.width) {
      const width = typeof this.config.width === 'number'
        ? `${this.config.width}px`
        : this.config.width
      this.container.style.width = width
    }

    // オプションコンテナ
    const optionsContainer = createElement('div', {
      className: 'radio-panel-options',
    })

    // オプションをレンダリング
    this.config.options.forEach((option, index) => {
      const optionElement = this.renderOption(option, index)
      this.optionElements.push(optionElement)
      optionsContainer.appendChild(optionElement)
    })

    this.container.appendChild(optionsContainer)
  }

  /**
   * 値を設定
   */
  setValue(value: string | null): void {
    if (this.state.disabled) {
      return
    }

    if (value !== null) {
      const option = this.config.options.find((opt) => opt.value === value)
      if (!option || option.disabled) {
        return
      }
    }

    if (this.state.selectedValue === value) {
      return
    }

    this.state = {
      ...this.state,
      selectedValue: value,
    }

    this.render()
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
   * 現在の状態を取得
   */
  getState(): RadioButtonPanelState {
    return { ...this.state }
  }

  /**
   * 現在の値を取得
   */
  getValue(): string | null {
    return this.state.selectedValue
  }

  /**
   * 無効化されているかどうかを取得
   */
  isDisabled(): boolean {
    return this.state.disabled
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  /**
   * 初期状態を作成
   */
  private createInitialState(): RadioButtonPanelState {
    return {
      selectedValue: this.config.defaultValue ?? null,
      disabled: this.config.disabled ?? false,
      focusedIndex: 0,
    }
  }

  /**
   * オプションをレンダリング
   */
  private renderOption(
    option: RadioButtonPanelOption,
    index: number
  ): HTMLElement {
    const isChecked = this.state.selectedValue === option.value
    const isDisabled = this.state.disabled || option.disabled || false
    const isFocusable =
      isChecked || (this.state.selectedValue === null && index === 0)

    const optionElement = createElement('div', {
      className: 'radio-panel-option',
      attributes: {
        role: 'radio',
        'aria-checked': String(isChecked),
        'aria-disabled': String(isDisabled),
        tabindex: isFocusable ? '0' : '-1',
        'data-value': option.value,
      },
    })

    // 隠しラジオ入力（フォーム統合用）
    const input = createElement('input', {
      className: 'radio-panel-input',
      attributes: {
        type: 'radio',
        name: this.config.name,
        value: option.value,
        tabindex: '-1',
        'aria-hidden': 'true',
      },
    })

    if (isChecked) {
      input.setAttribute('checked', 'checked')
    }

    if (isDisabled) {
      input.setAttribute('disabled', 'disabled')
    }

    optionElement.appendChild(input)

    // ビジュアルカード
    const card = createElement('div', { className: 'radio-panel-card' })

    // メディア（アイコン/画像）
    const media = this.renderMedia(option)
    if (media) {
      card.appendChild(media)
    }

    // コンテンツ（ラベル + 説明）
    const content = this.renderContent(option)
    card.appendChild(content)

    // インジケーター（ラジオ円）
    const indicator = this.renderIndicator()
    card.appendChild(indicator)

    optionElement.appendChild(card)

    // イベントリスナー
    if (!isDisabled) {
      optionElement.addEventListener('click', () => {
        this.handleOptionClick(option.value)
      })

      optionElement.addEventListener('keydown', (e) => {
        this.handleKeyboardNavigation(e)
      })
    }

    return optionElement
  }

  /**
   * メディア（アイコン/画像）をレンダリング
   */
  private renderMedia(option: RadioButtonPanelOption): HTMLElement | null {
    if (!option.icon && !option.image) {
      return null
    }

    const media = createElement('div', { className: 'radio-panel-media' })

    if (option.image) {
      const img = createElement('img', {
        className: 'radio-panel-image',
        attributes: {
          src: option.image,
          alt: '',
        },
      })
      media.appendChild(img)
    } else if (option.icon) {
      const icon = createElement('div', { className: 'radio-panel-icon' })
      icon.innerHTML = option.icon
      media.appendChild(icon)
    }

    return media
  }

  /**
   * コンテンツ（ラベル + 説明）をレンダリング
   */
  private renderContent(option: RadioButtonPanelOption): HTMLElement {
    const content = createElement('div', { className: 'radio-panel-content' })

    const label = createElement('div', {
      className: 'radio-panel-label',
      textContent: option.label,
    })
    content.appendChild(label)

    if (option.description) {
      const description = createElement('div', {
        className: 'radio-panel-description',
        textContent: option.description,
      })
      content.appendChild(description)
    }

    return content
  }

  /**
   * インジケーター（ラジオ円）をレンダリング
   */
  private renderIndicator(): HTMLElement {
    const indicator = createElement('div', {
      className: 'radio-panel-indicator',
    })

    const circle = createElement('span', { className: 'radio-circle' })
    const dot = createElement('span', { className: 'radio-dot' })

    circle.appendChild(dot)
    indicator.appendChild(circle)

    return indicator
  }

  /**
   * オプションクリックを処理
   */
  private handleOptionClick(value: string): void {
    if (this.state.disabled) {
      return
    }

    const option = this.config.options.find((opt) => opt.value === value)
    if (!option || option.disabled) {
      return
    }

    if (this.state.selectedValue === value) {
      return
    }

    this.state = {
      ...this.state,
      selectedValue: value,
    }

    this.render()
    this.callbacks.onChange?.(value, this.state)
    this.callbacks.onValueChange?.(value)
  }

  /**
   * キーボードナビゲーションを処理
   */
  private handleKeyboardNavigation(e: KeyboardEvent): void {
    const isVertical = (this.config.direction ?? 'vertical') === 'vertical'
    const nextKey = isVertical ? 'ArrowDown' : 'ArrowRight'
    const prevKey = isVertical ? 'ArrowUp' : 'ArrowLeft'

    switch (e.key) {
      case nextKey:
        e.preventDefault()
        this.focusNextOption()
        break
      case prevKey:
        e.preventDefault()
        this.focusPreviousOption()
        break
      case 'Home':
        e.preventDefault()
        this.focusOption(0)
        break
      case 'End':
        e.preventDefault()
        this.focusOption(this.config.options.length - 1)
        break
      case ' ':
      case 'Enter':
        e.preventDefault()
        // Get the value from the current target element
        const target = e.currentTarget as HTMLElement
        const value = target.getAttribute('data-value')
        if (value) {
          const option = this.config.options.find((opt) => opt.value === value)
          if (option && !option.disabled) {
            this.handleOptionClick(value)
          }
        }
        break
    }
  }

  /**
   * 次のオプションにフォーカス
   */
  private focusNextOption(): void {
    let nextIndex = this.state.focusedIndex + 1
    while (nextIndex < this.config.options.length) {
      if (!this.config.options[nextIndex].disabled) {
        this.focusOption(nextIndex)
        return
      }
      nextIndex++
    }
  }

  /**
   * 前のオプションにフォーカス
   */
  private focusPreviousOption(): void {
    let prevIndex = this.state.focusedIndex - 1
    while (prevIndex >= 0) {
      if (!this.config.options[prevIndex].disabled) {
        this.focusOption(prevIndex)
        return
      }
      prevIndex--
    }
  }

  /**
   * 指定されたインデックスのオプションにフォーカス
   */
  private focusOption(index: number): void {
    if (index < 0 || index >= this.config.options.length) {
      return
    }

    const option = this.config.options[index]
    if (option.disabled) {
      return
    }

    this.state = {
      ...this.state,
      focusedIndex: index,
    }

    if (this.optionElements[index]) {
      this.optionElements[index].focus()
    }
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * RadioButtonPanelを作成するファクトリ関数
 */
export function createRadioButtonPanel(
  container: HTMLElement,
  config: RadioButtonPanelConfig,
  callbacks: RadioButtonPanelCallbacks = {}
): RadioButtonPanel {
  const panel = new RadioButtonPanel(container, config, callbacks)
  panel.render()
  return panel
}

/**
 * SegmentedControl Component
 * セグメントコントロールコンポーネント
 *
 * Button group component for selecting one option from multiple choices:
 * - Size variations (small/medium)
 * - Icon support for options
 * - Disabled state (group and per-option)
 * - Full-width display
 * - Full ARIA compliance with keyboard navigation
 *
 * Use cases:
 * - View switching (list/grid)
 * - Filter switching
 * - Tab alternative
 */

import { createElement } from '../utils/dom'
import { escapeHtml, createFieldWrapper } from '../utils/field-helpers'
import type { InputField } from '../../types/schema'

// =============================================================================
// Types
// =============================================================================

/**
 * セグメントコントロールのオプション
 */
export interface SegmentedControlOption {
  /** 値 */
  value: string
  /** ラベル */
  label: string
  /** アイコン（SVG文字列） */
  icon?: string
  /** 無効化 */
  disabled?: boolean
}

/**
 * セグメントコントロールの状態
 */
export interface SegmentedControlState {
  /** 選択された値 */
  selectedValue: string
  /** 無効化状態 */
  disabled: boolean
  /** フォーカスされているオプションのインデックス */
  focusedIndex: number
}

/**
 * セグメントコントロールのコールバック
 */
export interface SegmentedControlCallbacks {
  /** 値変更時（値と状態を受け取る） */
  onChange?: (value: string, state: SegmentedControlState) => void
  /** 値変更時（値のみを受け取る） -  */
  onClickOption?: (value: string) => void
}

/**
 * セグメントコントロールの設定
 */
export interface SegmentedControlConfig {
  /** オプション配列（必須） */
  options: SegmentedControlOption[]
  /** 初期選択値 */
  value?: string
  /** サイズ: 's' (small) または 'default' (medium) -  */
  size?: 's' | 'default'
  /** 無効化（グループ全体） */
  disabled?: boolean
  /** フル幅表示 */
  fullWidth?: boolean
  /** 幅（カスタム指定） */
  width?: string | number
}

// =============================================================================
// SegmentedControl Class
// =============================================================================

/**
 * セグメントコントロールコンポーネント
 */
export class SegmentedControl {
  private config: SegmentedControlConfig
  private state: SegmentedControlState
  private callbacks: SegmentedControlCallbacks
  private container: HTMLElement
  private optionElements: HTMLElement[] = []

  constructor(
    container: HTMLElement,
    config: SegmentedControlConfig,
    callbacks: SegmentedControlCallbacks = {}
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
   * セグメントコントロールをレンダリング
   */
  render(): void {
    this.container.innerHTML = ''
    this.optionElements = []

    const size = this.config.size ?? 'default'

    this.container.className = `mokkun-segmented-control segmented-${size === 's' ? 'small' : 'medium'}`

    if (this.config.fullWidth) {
      this.container.classList.add('segmented-full-width')
    }

    this.container.setAttribute('role', 'group')

    if (this.state.disabled) {
      this.container.setAttribute('data-disabled', '')
    } else {
      this.container.removeAttribute('data-disabled')
    }

    // 幅の設定
    if (this.config.width) {
      const width =
        typeof this.config.width === 'number'
          ? `${this.config.width}px`
          : this.config.width
      this.container.style.width = width
    } else if (this.config.fullWidth) {
      this.container.style.width = '100%'
    } else {
      this.container.style.width = ''
    }

    // オプションコンテナ
    const optionsContainer = createElement('div', {
      className: 'segmented-options',
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
  setValue(value: string): void {
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
  getState(): SegmentedControlState {
    return { ...this.state }
  }

  /**
   * 現在の値を取得
   */
  getValue(): string {
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
  private createInitialState(): SegmentedControlState {
    // デフォルト値がない場合は最初の有効なオプションを選択
    const defaultValue =
      this.config.value ??
      this.config.options.find((opt) => !opt.disabled)?.value ??
      this.config.options[0]?.value ??
      ''

    return {
      selectedValue: defaultValue,
      disabled: this.config.disabled ?? false,
      focusedIndex: this.config.options.findIndex(
        (opt) => opt.value === defaultValue
      ),
    }
  }

  /**
   * オプションをレンダリング
   */
  private renderOption(
    option: SegmentedControlOption,
    index: number
  ): HTMLElement {
    const isSelected = this.state.selectedValue === option.value
    const isDisabled = this.state.disabled || option.disabled || false
    const isFocusable =
      isSelected ||
      (this.state.focusedIndex === -1 && index === 0) ||
      this.state.focusedIndex === index

    const button = createElement('button', {
      className: 'segmented-button',
      attributes: {
        type: 'button',
        'aria-pressed': String(isSelected),
        'aria-disabled': String(isDisabled),
        tabindex: isFocusable && !isDisabled ? '0' : '-1',
        'data-value': option.value,
      },
    })

    if (isSelected) {
      button.classList.add('selected')
    }

    if (isDisabled) {
      button.classList.add('disabled')
      button.setAttribute('disabled', 'disabled')
    }

    // アイコン
    if (option.icon) {
      const iconWrapper = createElement('span', {
        className: 'segmented-icon',
      })
      iconWrapper.innerHTML = option.icon
      button.appendChild(iconWrapper)
    }

    // ラベル
    const labelSpan = createElement('span', {
      className: 'segmented-label',
      textContent: option.label,
    })
    button.appendChild(labelSpan)

    // イベントリスナー
    if (!isDisabled) {
      button.addEventListener('click', (e) => {
        e.preventDefault()
        this.handleOptionClick(option.value)
      })

      button.addEventListener('keydown', (e) => {
        this.handleKeyboardNavigation(e)
      })
    }

    return button
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

    const optionIndex = this.config.options.findIndex(
      (opt) => opt.value === value
    )

    this.state = {
      ...this.state,
      selectedValue: value,
      focusedIndex: optionIndex,
    }

    this.render()

    // フォーカスを維持
    if (this.optionElements[optionIndex]) {
      this.optionElements[optionIndex].focus()
    }

    this.callbacks.onChange?.(value, this.state)
    this.callbacks.onClickOption?.(value)
  }

  /**
   * キーボードナビゲーションを処理
   */
  private handleKeyboardNavigation(e: KeyboardEvent): void {
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault()
        this.focusNextOption()
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault()
        this.focusPreviousOption()
        break
      case 'Home':
        e.preventDefault()
        this.focusFirstOption()
        break
      case 'End':
        e.preventDefault()
        this.focusLastOption()
        break
      case ' ':
      case 'Enter':
        e.preventDefault()
        const target = e.currentTarget as HTMLElement
        const value = target.getAttribute('data-value')
        if (value) {
          this.handleOptionClick(value)
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
    // ループ: 先頭に戻る
    this.focusFirstOption()
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
    // ループ: 末尾に戻る
    this.focusLastOption()
  }

  /**
   * 最初の有効なオプションにフォーカス
   */
  private focusFirstOption(): void {
    for (let i = 0; i < this.config.options.length; i++) {
      if (!this.config.options[i].disabled) {
        this.focusOption(i)
        return
      }
    }
  }

  /**
   * 最後の有効なオプションにフォーカス
   */
  private focusLastOption(): void {
    for (let i = this.config.options.length - 1; i >= 0; i--) {
      if (!this.config.options[i].disabled) {
        this.focusOption(i)
        return
      }
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
      // タブインデックスを更新
      this.optionElements.forEach((el, i) => {
        el.setAttribute('tabindex', i === index ? '0' : '-1')
      })
      this.optionElements[index].focus()
    }
  }

  // ===========================================================================
  // Static Field Renderer
  // ===========================================================================

  static renderField(field: InputField): string {
    const segmentedField = field as InputField & {
      options?: Array<{ value: string; label: string }>
      default?: string
    }
    const options = segmentedField.options ?? []
    const defaultValue = segmentedField.default ?? options[0]?.value

    const segmentedHtml = `
      <div class="mokkun-segmented-control" role="radiogroup" aria-label="${escapeHtml(field.label)}">
        ${options.map(opt => `
          <button type="button" class="segment-button ${opt.value === defaultValue ? 'active' : ''}"
                  role="radio" aria-checked="${opt.value === defaultValue}"
                  data-value="${escapeHtml(opt.value)}">
            ${escapeHtml(opt.label)}
          </button>
        `).join('')}
      </div>
    `
    return createFieldWrapper(field, segmentedHtml)
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * SegmentedControlを作成するファクトリ関数
 */
export function createSegmentedControl(
  container: HTMLElement,
  config: SegmentedControlConfig,
  callbacks: SegmentedControlCallbacks = {}
): SegmentedControl {
  const control = new SegmentedControl(container, config, callbacks)
  control.render()
  return control
}

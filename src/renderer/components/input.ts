/**
 * Input Component
 * 汎用テキスト入力コンポーネント
 *
 * Features:
 * - Prefix/Suffix support
 * - Validation display
 * - Size variants (small/medium/large)
 * - Input types (text/email/password/number/tel/url)
 * - Clear button
 * - Error states
 */

import { createElement, generateId } from '../utils/dom'
import {
  escapeHtml,
  createFieldWrapper,
  getCommonAttributes,
} from '../utils/field-helpers'
import type { TextField, NumberField, DatePickerField, TimePickerField } from '../../types/schema'

// =============================================================================
// Types
// =============================================================================

/**
 * 入力の状態
 */
export interface InputState {
  /** 現在の値 */
  value: string
  /** 無効化状態 */
  disabled: boolean
  /** 読み取り専用状態 */
  readonly: boolean
  /** エラー状態 */
  error: boolean
  /** エラーメッセージ */
  errorMessage?: string
  /** フォーカス状態 */
  focused: boolean
}

/**
 * 入力のコールバック
 */
export interface InputCallbacks {
  /** 値変更時 */
  onChange?: (value: string, state: InputState) => void
  /** フォーカス時 */
  onFocus?: (state: InputState) => void
  /** ブラー時 */
  onBlur?: (state: InputState) => void
  /** クリアボタン押下時 */
  onClear?: (state: InputState) => void
  /** Enter キー押下時 */
  onEnter?: (value: string, state: InputState) => void
}

/**
 * 入力の設定
 */
export interface InputConfig {
  /** 初期値 */
  defaultValue?: string
  /** プレースホルダー */
  placeholder?: string
  /** 無効化 */
  disabled?: boolean
  /** 読み取り専用 */
  readonly?: boolean
  /** 必須 */
  required?: boolean
  /** サイズ */
  size?: 'small' | 'medium' | 'large'
  /** 入力タイプ */
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url'
  /** name属性（フォーム用） */
  name?: string
  /** プレフィックス（アイコンやテキスト） */
  prefix?: string | HTMLElement
  /** サフィックス（アイコンやテキスト） */
  suffix?: string | HTMLElement
  /** クリアボタン表示 */
  clearable?: boolean
  /** 自動フォーカス */
  autoFocus?: boolean
  /** オートコンプリート */
  autoComplete?: string
  /** エラーメッセージ（初期値） */
  errorMessage?: string
  /** aria-label */
  ariaLabel?: string
  /** aria-describedby */
  ariaDescribedBy?: string
}

// =============================================================================
// Input Class
// =============================================================================

/**
 * 入力コンポーネント
 */
export class Input {
  private config: InputConfig
  private state: InputState
  private callbacks: InputCallbacks
  private container: HTMLElement
  private instanceId: string
  private inputElement: HTMLInputElement | null = null

  constructor(
    container: HTMLElement,
    config: InputConfig = {},
    callbacks: InputCallbacks = {}
  ) {
    this.config = config
    this.container = container
    this.callbacks = callbacks
    this.instanceId = generateId('input')
    this.state = this.createInitialState()
  }

  // ===========================================================================
  // Public Methods
  // ===========================================================================

  /**
   * 入力フィールドをレンダリング
   */
  render(): void {
    this.container.innerHTML = ''

    const size = this.config.size ?? 'medium'
    const hasPrefix = !!this.config.prefix
    const hasSuffix = !!this.config.suffix || !!this.config.clearable

    this.container.className = `mokkun-input input-${size}`

    // data-state属性を設定
    this.container.setAttribute('data-state', this.getDataState())
    if (this.state.disabled) {
      this.container.setAttribute('data-disabled', '')
    } else {
      this.container.removeAttribute('data-disabled')
    }
    if (this.state.readonly) {
      this.container.setAttribute('data-readonly', '')
    } else {
      this.container.removeAttribute('data-readonly')
    }
    if (this.state.error) {
      this.container.setAttribute('data-error', '')
    } else {
      this.container.removeAttribute('data-error')
    }

    const wrapper = createElement('div', { className: 'input-wrapper' })

    // 入力グループ（prefix + input + suffix/clear）
    const inputGroup = this.renderInputGroup(hasPrefix, hasSuffix)
    wrapper.appendChild(inputGroup)

    // エラーメッセージ
    if (this.state.error && this.state.errorMessage) {
      const errorElement = this.renderError()
      wrapper.appendChild(errorElement)
    }

    this.container.appendChild(wrapper)

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

    this.callbacks.onChange?.(value, this.state)
  }

  /**
   * 値を取得
   */
  getValue(): string {
    return this.state.value
  }

  /**
   * エラー状態を設定
   */
  setError(error: boolean, errorMessage?: string): void {
    this.state = {
      ...this.state,
      error,
      errorMessage,
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
   * 読み取り専用状態を設定
   */
  setReadonly(readonly: boolean): void {
    if (this.state.readonly === readonly) {
      return
    }

    this.state = {
      ...this.state,
      readonly,
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
  getState(): InputState {
    return { ...this.state }
  }

  /**
   * 破棄
   */
  destroy(): void {
    this.container.innerHTML = ''
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  /**
   * 初期状態を作成
   */
  private createInitialState(): InputState {
    return {
      value: this.config.defaultValue ?? '',
      disabled: this.config.disabled ?? false,
      readonly: this.config.readonly ?? false,
      error: !!this.config.errorMessage,
      errorMessage: this.config.errorMessage,
      focused: false,
    }
  }

  /**
   * data-state属性の値を取得
   */
  private getDataState(): string {
    if (this.state.error) return 'error'
    if (this.state.focused) return 'focused'
    if (this.state.value) return 'filled'
    return 'empty'
  }

  /**
   * 入力グループをレンダリング
   */
  private renderInputGroup(hasPrefix: boolean, hasSuffix: boolean): HTMLElement {
    const inputGroup = createElement('div', {
      className: `input-group ${hasPrefix ? 'has-prefix' : ''} ${hasSuffix ? 'has-suffix' : ''}`
    })

    // Prefix
    if (hasPrefix && this.config.prefix) {
      const prefixElement = this.renderAffix(this.config.prefix, 'prefix')
      inputGroup.appendChild(prefixElement)
    }

    // Input
    const input = this.renderInput()
    inputGroup.appendChild(input)

    // Suffix or Clear button
    if (hasSuffix) {
      if (this.config.clearable && this.state.value && !this.state.disabled && !this.state.readonly) {
        const clearButton = this.renderClearButton()
        inputGroup.appendChild(clearButton)
      } else if (this.config.suffix) {
        const suffixElement = this.renderAffix(this.config.suffix, 'suffix')
        inputGroup.appendChild(suffixElement)
      }
    }

    return inputGroup
  }

  /**
   * 入力フィールドをレンダリング
   */
  private renderInput(): HTMLInputElement {
    const input = createElement('input', {
      className: 'input-field',
      attributes: {
        type: this.config.type ?? 'text',
        id: this.instanceId,
        ...(this.config.name && { name: this.config.name }),
        ...(this.config.placeholder && { placeholder: this.config.placeholder }),
        ...(this.config.required && { required: 'required' }),
        ...(this.config.autoComplete && { autocomplete: this.config.autoComplete }),
        ...(this.config.ariaLabel && { 'aria-label': this.config.ariaLabel }),
        ...(this.config.ariaDescribedBy && { 'aria-describedby': this.config.ariaDescribedBy }),
        ...(this.state.disabled && { disabled: 'disabled' }),
        ...(this.state.readonly && { readonly: 'readonly' }),
        ...(this.state.error && { 'aria-invalid': 'true' }),
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
   * Prefix/Suffixをレンダリング
   */
  private renderAffix(affix: string | HTMLElement, type: 'prefix' | 'suffix'): HTMLElement {
    const affixWrapper = createElement('span', { className: `input-${type}` })

    if (typeof affix === 'string') {
      affixWrapper.textContent = affix
    } else {
      affixWrapper.appendChild(affix)
    }

    return affixWrapper
  }

  /**
   * クリアボタンをレンダリング
   */
  private renderClearButton(): HTMLElement {
    const button = createElement('button', {
      className: 'input-clear-button',
      attributes: {
        type: 'button',
        'aria-label': 'Clear input',
      },
    })

    // クリアアイコン (×)
    const icon = createElement('span', {
      className: 'clear-icon',
      textContent: '×',
    })
    button.appendChild(icon)

    button.addEventListener('click', this.handleClear.bind(this))

    return button
  }

  /**
   * エラーメッセージをレンダリング
   */
  private renderError(): HTMLElement {
    return createElement('div', {
      className: 'input-error-message',
      attributes: {
        id: `${this.instanceId}-error`,
        role: 'alert',
      },
      textContent: this.state.errorMessage ?? '',
    })
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

    // クリアボタンの表示/非表示を更新（DOMを部分的に更新）
    if (this.config.clearable) {
      this.updateClearButton()
    }
  }

  /**
   * クリアボタンの表示/非表示を更新（フォーカスを失わないように部分更新）
   */
  private updateClearButton(): void {
    const inputGroup = this.container.querySelector('.input-group')
    if (!inputGroup) return

    const existingClearButton = inputGroup.querySelector('.input-clear-button')
    const existingSuffix = inputGroup.querySelector('.input-suffix')
    const shouldShowClear = this.state.value && !this.state.disabled && !this.state.readonly

    if (shouldShowClear && !existingClearButton) {
      // クリアボタンを追加
      if (existingSuffix) {
        existingSuffix.remove()
      }
      const clearButton = this.renderClearButton()
      inputGroup.appendChild(clearButton)
    } else if (!shouldShowClear && existingClearButton) {
      // クリアボタンを削除
      existingClearButton.remove()
      // サフィックスがあれば復元
      if (this.config.suffix) {
        const suffixElement = this.renderAffix(this.config.suffix, 'suffix')
        inputGroup.appendChild(suffixElement)
      }
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
      this.callbacks.onEnter?.(this.state.value, this.state)
    }
  }

  /**
   * クリアイベント
   */
  private handleClear(): void {
    this.clear()
  }

  // ===========================================================================
  // Static Field Renderers
  // ===========================================================================

  /**
   * テキストフィールドをHTMLとしてレンダリング（静的メソッド）
   * SSR/初期レンダリング用
   *
   * @param field - テキストフィールド定義
   * @returns 生成されたHTML文字列
   */
  static renderTextField(field: TextField): string {
    const inputType = field.input_type ?? 'text'
    const attrs: string[] = [getCommonAttributes(field)]

    if (field.min_length !== undefined) {
      attrs.push(`minlength="${field.min_length}"`)
    }
    if (field.max_length !== undefined) {
      attrs.push(`maxlength="${field.max_length}"`)
    }
    if (field.pattern) {
      attrs.push(`pattern="${escapeHtml(field.pattern)}"`)
    }
    if (field.default !== undefined) {
      attrs.push(`value="${escapeHtml(String(field.default))}"`)
    }

    const input = `<input type="${inputType}" class="form-input" ${attrs.join(' ')} />`
    return createFieldWrapper(field, input)
  }

  /**
   * 数値フィールドをHTMLとしてレンダリング（静的メソッド）
   * SSR/初期レンダリング用
   *
   * @param field - 数値フィールド定義
   * @returns 生成されたHTML文字列
   */
  static renderNumberField(field: NumberField): string {
    const attrs: string[] = [getCommonAttributes(field)]

    if (field.min !== undefined) {
      attrs.push(`min="${field.min}"`)
    }
    if (field.max !== undefined) {
      attrs.push(`max="${field.max}"`)
    }
    if (field.step !== undefined) {
      attrs.push(`step="${field.step}"`)
    }
    if (field.default !== undefined) {
      attrs.push(`value="${field.default}"`)
    }

    let input = `<input type="number" class="form-input" ${attrs.join(' ')} />`

    if (field.unit) {
      input = `
        <div class="input-with-unit">
          ${input}
          <span class="input-unit">${escapeHtml(field.unit)}</span>
        </div>
      `
    }

    return createFieldWrapper(field, input)
  }

  /**
   * 日付選択フィールドをHTMLとしてレンダリング（静的メソッド）
   * SSR/初期レンダリング用
   *
   * @param field - 日付選択フィールド定義
   * @returns 生成されたHTML文字列
   */
  static renderDatePickerField(field: DatePickerField): string {
    const inputType = field.include_time ? 'datetime-local' : 'date'
    const attrs: string[] = [getCommonAttributes(field)]

    if (field.min_date) {
      attrs.push(`min="${escapeHtml(field.min_date)}"`)
    }
    if (field.max_date) {
      attrs.push(`max="${escapeHtml(field.max_date)}"`)
    }
    if (field.default !== undefined) {
      attrs.push(`value="${escapeHtml(String(field.default))}"`)
    }

    const input = `<input type="${inputType}" class="form-input" ${attrs.join(' ')} />`
    return createFieldWrapper(field, input)
  }

  /**
   * 時間選択フィールドをHTMLとしてレンダリング（静的メソッド）
   * SSR/初期レンダリング用
   *
   * @param field - 時間選択フィールド定義
   * @returns 生成されたHTML文字列
   */
  static renderTimePickerField(field: TimePickerField): string {
    const attrs: string[] = [getCommonAttributes(field)]

    if (field.minute_step) {
      attrs.push(`step="${field.minute_step * 60}"`)
    }
    if (field.default !== undefined) {
      attrs.push(`value="${escapeHtml(String(field.default))}"`)
    }

    const input = `<input type="time" class="form-input" ${attrs.join(' ')} />`
    return createFieldWrapper(field, input)
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * 入力コンポーネントを作成
 */
export function createInput(
  container: HTMLElement,
  config: InputConfig = {},
  callbacks: InputCallbacks = {}
): Input {
  const input = new Input(container, config, callbacks)
  input.render()
  return input
}

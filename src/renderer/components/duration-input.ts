/**
 * Duration Input Component
 * 期間入力コンポーネント（数値入力 + 単位表示）
 *
 * 機能:
 * - 数値入力による期間指定
 * - 単位ラベル表示
 * - バリデーション
 * - アクセシビリティ対応
 */

import { createElement, generateId } from '../utils/dom'
import {
  createFieldWrapper,
  getCommonAttributes,
  unitLabels,
} from '../utils/field-helpers'
import type { DurationInputField } from '../../types/schema'

// =============================================================================
// Types
// =============================================================================

/**
 * 表示単位
 */
export type DisplayUnit = 'hours' | 'minutes' | 'seconds'

/**
 * Duration Inputの状態
 */
export interface DurationInputState {
  /** 現在の値（表示単位での数値） */
  value: number
  /** 無効化状態 */
  disabled: boolean
  /** 読み取り専用状態 */
  readonly: boolean
  /** エラー状態 */
  error: boolean
  /** エラーメッセージ */
  errorMessage?: string
}

/**
 * Duration Inputのコールバック
 */
export interface DurationInputCallbacks {
  /** 値変更時 */
  onChange?: (value: number, state: DurationInputState) => void
  /** フォーカス時 */
  onFocus?: (state: DurationInputState) => void
  /** ブラー時 */
  onBlur?: (state: DurationInputState) => void
}

/**
 * Duration Inputの設定
 */
export interface DurationInputConfig {
  /** 初期値 */
  defaultValue?: number
  /** 表示単位 */
  displayUnit?: DisplayUnit
  /** 最小値 */
  min?: number
  /** 最大値 */
  max?: number
  /** 無効化 */
  disabled?: boolean
  /** 読み取り専用 */
  readonly?: boolean
  /** 必須 */
  required?: boolean
  /** name属性 */
  name?: string
  /** ID */
  id?: string
  /** プレースホルダー */
  placeholder?: string
}

// =============================================================================
// DurationInput Class
// =============================================================================

/**
 * 期間入力コンポーネント
 */
export class DurationInput {
  private config: DurationInputConfig
  private state: DurationInputState
  private callbacks: DurationInputCallbacks
  private container: HTMLElement
  private instanceId: string
  private inputElement: HTMLInputElement | null = null

  constructor(
    container: HTMLElement,
    config: DurationInputConfig = {},
    callbacks: DurationInputCallbacks = {}
  ) {
    this.config = config
    this.container = container
    this.callbacks = callbacks
    this.instanceId = config.id ?? generateId('duration-input')
    this.state = this.createInitialState()
  }

  // ===========================================================================
  // Public Methods
  // ===========================================================================

  /**
   * Duration Inputをレンダリング
   */
  render(): void {
    this.container.innerHTML = ''

    const wrapper = createElement('div', {
      className: 'mokkun-duration-input',
    })

    if (this.state.disabled) {
      wrapper.classList.add('is-disabled')
    }
    if (this.state.readonly) {
      wrapper.classList.add('is-readonly')
    }
    if (this.state.error) {
      wrapper.classList.add('has-error')
    }

    // 入力グループ（input + 単位）
    const inputGroup = this.renderInputGroup()
    wrapper.appendChild(inputGroup)

    // エラーメッセージ
    if (this.state.error && this.state.errorMessage) {
      const errorEl = this.renderError()
      wrapper.appendChild(errorEl)
    }

    this.container.appendChild(wrapper)
  }

  /**
   * 値を設定
   */
  setValue(value: number): void {
    if (this.state.value === value) {
      return
    }

    this.state = {
      ...this.state,
      value,
    }

    if (this.inputElement) {
      this.inputElement.value = String(value)
    }

    this.callbacks.onChange?.(value, this.state)
  }

  /**
   * 値を取得
   */
  getValue(): number {
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
    this.inputElement?.focus()
  }

  /**
   * ブラー
   */
  blur(): void {
    this.inputElement?.blur()
  }

  /**
   * 現在の状態を取得
   */
  getState(): DurationInputState {
    return { ...this.state }
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  /**
   * 初期状態を作成
   */
  private createInitialState(): DurationInputState {
    return {
      value: this.config.defaultValue ?? 0,
      disabled: this.config.disabled ?? false,
      readonly: this.config.readonly ?? false,
      error: false,
      errorMessage: undefined,
    }
  }

  /**
   * 入力グループをレンダリング
   */
  private renderInputGroup(): HTMLElement {
    const inputGroup = createElement('div', {
      className: 'input-with-unit',
    })

    // 数値入力
    const input = this.renderInput()
    inputGroup.appendChild(input)

    // 単位ラベル
    const unit = this.config.displayUnit ?? 'minutes'
    const unitLabel = createElement('span', {
      className: 'input-unit',
      textContent: unitLabels[unit] ?? unit,
    })
    inputGroup.appendChild(unitLabel)

    return inputGroup
  }

  /**
   * 入力フィールドをレンダリング
   */
  private renderInput(): HTMLInputElement {
    const input = createElement('input', {
      className: 'form-input duration-input-field',
      attributes: {
        type: 'number',
        id: this.instanceId,
        name: this.config.name ?? this.instanceId,
        min: String(this.config.min ?? 0),
        ...(this.config.max !== undefined && { max: String(this.config.max) }),
        ...(this.config.placeholder && { placeholder: this.config.placeholder }),
        ...(this.config.required && { required: 'required' }),
        ...(this.state.disabled && { disabled: 'disabled' }),
        ...(this.state.readonly && { readonly: 'readonly' }),
        ...(this.state.error && { 'aria-invalid': 'true' }),
      },
    }) as HTMLInputElement

    input.value = String(this.state.value)

    // イベントリスナー
    input.addEventListener('input', this.handleInput.bind(this))
    input.addEventListener('focus', this.handleFocus.bind(this))
    input.addEventListener('blur', this.handleBlur.bind(this))

    this.inputElement = input
    return input
  }

  /**
   * エラーメッセージをレンダリング
   */
  private renderError(): HTMLElement {
    return createElement('div', {
      className: 'duration-input-error',
      textContent: this.state.errorMessage ?? '',
      attributes: {
        id: `${this.instanceId}-error`,
        role: 'alert',
      },
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
    const value = parseInt(target.value, 10) || 0

    this.state = {
      ...this.state,
      value,
    }

    this.callbacks.onChange?.(value, this.state)
  }

  /**
   * フォーカスイベント
   */
  private handleFocus(): void {
    this.callbacks.onFocus?.(this.state)
  }

  /**
   * ブラーイベント
   */
  private handleBlur(): void {
    this.callbacks.onBlur?.(this.state)
  }

  // ===========================================================================
  // Static Field Renderer
  // ===========================================================================

  /**
   * Duration Inputフィールドを HTMLとしてレンダリング（静的メソッド）
   * SSR/初期レンダリング用
   *
   * @param field - Duration Inputフィールド定義
   * @returns 生成されたHTML文字列
   */
  static renderField(field: DurationInputField): string {
    const attrs: string[] = [getCommonAttributes(field)]
    attrs.push('min="0"')

    if (field.default !== undefined) {
      attrs.push(`value="${field.default}"`)
    }

    const unit = field.display_unit ?? 'minutes'

    const content = `
      <div class="input-with-unit">
        <input type="number" class="form-input" ${attrs.join(' ')} />
        <span class="input-unit">${unitLabels[unit] ?? unit}</span>
      </div>
    `
    return createFieldWrapper(field, content)
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Duration Inputを作成するファクトリ関数
 */
export function createDurationInput(
  container: HTMLElement,
  config: DurationInputConfig = {},
  callbacks: DurationInputCallbacks = {}
): DurationInput {
  const durationInput = new DurationInput(container, config, callbacks)
  durationInput.render()
  return durationInput
}

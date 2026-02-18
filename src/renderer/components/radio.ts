/**
 * RadioButton Component
 * ラジオボタンコンポーネント
 *
 * 
 * - `checked` / `defaultChecked` for state
 * - `data-state="checked|unchecked"` for styling
 * - `error` state with error messages
 * - `role="radio"` with `aria-checked` for accessibility
 */

import { createElement, generateId } from '../utils/dom'
import {
  escapeHtml,
  createFieldWrapper,
  getOptions,
} from '../utils/field-helpers'
import type { RadioGroupField } from '../../types/schema'

// =============================================================================
// Types
// =============================================================================

/**
 * ラジオボタンの状態
 */
export interface RadioButtonState {
  /** 選択状態 */
  checked: boolean
  /** 無効化状態 */
  disabled: boolean
}

/**
 * ラジオボタンのコールバック
 */
export interface RadioButtonCallbacks {
  /** 状態変更時 */
  onChange?: (checked: boolean, state: RadioButtonState) => void
  /** 選択状態変更時 */
  onCheckedChange?: (checked: boolean) => void
}

/**
 * ラジオボタンの設定
 */
export interface RadioButtonConfig {
  /** 初期選択状態 */
  defaultChecked?: boolean
  /** 無効化 */
  disabled?: boolean
  /** 選択時ラベル */
  checkedLabel?: string
  /** 非選択時ラベル */
  uncheckedLabel?: string
  /** サイズ */
  size?: 'small' | 'medium' | 'large'
  /** name属性（グループ化用） */
  name?: string
  /** value属性 */
  value?: string
  /** ラベル位置 */
  labelPosition?: 'left' | 'right'
}

// =============================================================================
// RadioButton Class
// =============================================================================

/**
 * ラジオボタンコンポーネント
 */
export class RadioButton {
  private config: RadioButtonConfig
  private state: RadioButtonState
  private callbacks: RadioButtonCallbacks
  private container: HTMLElement
  private instanceId: string

  constructor(
    container: HTMLElement,
    config: RadioButtonConfig = {},
    callbacks: RadioButtonCallbacks = {}
  ) {
    this.config = config
    this.container = container
    this.callbacks = callbacks
    this.instanceId = generateId('radio')
    this.state = this.createInitialState()
  }

  // ===========================================================================
  // Public Methods
  // ===========================================================================

  /**
   * ラジオボタンをレンダリング
   */
  render(): void {
    this.container.innerHTML = ''

    const size = this.config.size ?? 'medium'
    const labelPosition = this.config.labelPosition ?? 'right'
    this.container.className = `mokkun-radio radio-${size} radio-label-${labelPosition}`

    // data-state属性を設定
    const dataState = this.state.checked ? 'checked' : 'unchecked'
    this.container.setAttribute('data-state', dataState)

    if (this.state.disabled) {
      this.container.setAttribute('data-disabled', '')
    } else {
      this.container.removeAttribute('data-disabled')
    }

    const wrapper = createElement('div', { className: 'radio-wrapper' })

    // ラベル（左側に配置する場合）
    if (labelPosition === 'left') {
      const label = this.renderLabel()
      wrapper.appendChild(label)
    }

    // ラジオボタン
    const radio = this.renderRadio()
    wrapper.appendChild(radio)

    // ラベル（右側に配置する場合）
    if (labelPosition === 'right') {
      const label = this.renderLabel()
      wrapper.appendChild(label)
    }

    this.container.appendChild(wrapper)
  }

  /**
   * 選択状態を設定
   */
  setChecked(checked: boolean): void {
    if (this.state.disabled) {
      return
    }

    if (this.state.checked === checked) {
      return
    }

    this.state = {
      ...this.state,
      checked,
    }

    this.render()
    this.callbacks.onChange?.(checked, this.state)
    this.callbacks.onCheckedChange?.(checked)
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
  getState(): RadioButtonState {
    return { ...this.state }
  }

  /**
   * 選択状態を取得
   */
  isChecked(): boolean {
    return this.state.checked
  }

  /**
   * 無効化されているかどうかを取得
   */
  isDisabled(): boolean {
    return this.state.disabled
  }

  /**
   * value属性を取得
   */
  getValue(): string | undefined {
    return this.config.value
  }

  /**
   * name属性を取得
   */
  getName(): string | undefined {
    return this.config.name
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  /**
   * 初期状態を作成
   */
  private createInitialState(): RadioButtonState {
    return {
      checked: this.config.defaultChecked ?? false,
      disabled: this.config.disabled ?? false,
    }
  }

  /**
   * ラジオボタンをレンダリング
   */
  private renderRadio(): HTMLElement {
    const radioContainer = createElement('div', {
      className: 'radio-input-container',
    })

    // ラジオボタン入力要素
    const input = createElement('input', {
      className: 'radio-input',
      attributes: {
        type: 'radio',
        id: this.instanceId,
        role: 'radio',
        'aria-checked': String(this.state.checked),
        'aria-label': this.state.checked
          ? (this.config.checkedLabel ?? '選択済み')
          : (this.config.uncheckedLabel ?? '未選択'),
      },
    })

    if (this.config.name) {
      input.setAttribute('name', this.config.name)
    }

    if (this.config.value) {
      input.setAttribute('value', this.config.value)
    }

    if (this.state.checked) {
      input.setAttribute('checked', 'checked')
    }

    if (this.state.disabled) {
      input.setAttribute('disabled', 'disabled')
      input.setAttribute('aria-disabled', 'true')
    }

    // 変更イベント
    input.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement
      this.setChecked(target.checked)
    })

    // キーボードイベント（Spaceキー対応）
    input.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        if (!this.state.disabled) {
          this.setChecked(true)
        }
      }
    })

    radioContainer.appendChild(input)

    // 視覚的なラジオボタン
    const dataState = this.state.checked ? 'checked' : 'unchecked'
    const classNames = [
      'radio-visual',
      dataState,
      this.state.disabled ? 'disabled' : '',
    ].filter(Boolean).join(' ')

    const visualRadio = createElement('label', {
      className: classNames,
      attributes: {
        for: this.instanceId,
        'data-state': dataState,
      },
    })

    if (this.state.disabled) {
      visualRadio.setAttribute('data-disabled', '')
    }

    // ラジオボタンの枠
    const circle = createElement('span', { className: 'radio-circle' })

    // 選択マーク（内側の円）
    const dot = createElement('span', {
      className: 'radio-dot',
      attributes: {
        'data-state': dataState,
      },
    })

    circle.appendChild(dot)
    visualRadio.appendChild(circle)

    radioContainer.appendChild(visualRadio)

    return radioContainer
  }

  /**
   * ラベルをレンダリング
   */
  private renderLabel(): HTMLElement {
    const checkedLabel = this.config.checkedLabel ?? ''
    const uncheckedLabel = this.config.uncheckedLabel ?? ''

    const dataState = this.state.checked ? 'checked' : 'unchecked'
    const classNames = [
      'radio-label',
      dataState,
      this.state.disabled ? 'disabled' : '',
    ].filter(Boolean).join(' ')

    const labelText = this.state.checked ? checkedLabel : uncheckedLabel
    const label = createElement('label', {
      className: classNames,
      textContent: labelText,
      attributes: {
        'for': this.instanceId,
        'aria-live': 'polite',
        'data-state': dataState,
      },
    })

    if (this.state.disabled) {
      label.setAttribute('data-disabled', '')
    }

    return label
  }

  // ===========================================================================
  // Static Field Renderer
  // ===========================================================================

  /**
   * ラジオグループフィールドをHTMLとしてレンダリング（静的メソッド）
   * SSR/初期レンダリング用
   *
   * @param field - ラジオグループフィールド定義
   * @returns 生成されたHTML文字列
   */
  static renderField(field: RadioGroupField): string {
    const options = getOptions(field.options)
    const direction = field.direction ?? 'vertical'

    const optionHtml = options
      .map((opt) => {
        const checked = field.default === opt.value ? 'checked' : ''
        const disabled = opt.disabled || field.disabled ? 'disabled' : ''
        const optionId = `${field.id}-${opt.value}`

        const descriptionHtml = opt.description
          ? `<span class="radio-option-description">${escapeHtml(opt.description)}</span>`
          : ''

        return `
          <label class="radio-option" for="${escapeHtml(optionId)}">
            <input
              type="radio"
              id="${escapeHtml(optionId)}"
              name="${escapeHtml(field.id)}"
              value="${escapeHtml(String(opt.value))}"
              ${checked}
              ${disabled}
              ${field.required ? 'required' : ''}
            />
            <span class="radio-label-group">
              <span class="radio-label">${escapeHtml(opt.label)}</span>
              ${descriptionHtml}
            </span>
          </label>
        `
      })
      .join('')

    const content = `<div class="radio-group direction-${direction}">${optionHtml}</div>`
    return createFieldWrapper(field, content)
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * RadioButtonを作成するファクトリ関数
 */
export function createRadioButton(
  container: HTMLElement,
  config: RadioButtonConfig = {},
  callbacks: RadioButtonCallbacks = {}
): RadioButton {
  const radio = new RadioButton(container, config, callbacks)
  radio.render()
  return radio
}

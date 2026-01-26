/**
 * Checkbox Component
 * チェックボックスコンポーネント
 *
 * 
 * - `checked` / `defaultChecked` for state
 * - `indeterminate` state support (一部選択)
 * - `data-state="checked|unchecked|indeterminate"` for styling
 * - `error` state with error messages
 * - `role="checkbox"` with `aria-checked` for accessibility
 */

import { createElement, generateId } from '../utils/dom'
import {
  escapeHtml,
  createFieldWrapper,
  getOptions,
} from '../utils/field-helpers'
import type { CheckboxField, CheckboxGroupField, InputField } from '../../types/schema'

// =============================================================================
// Types
// =============================================================================

/**
 * チェックボックスの状態
 */
export interface CheckboxState {
  /** チェック状態 */
  checked: boolean
  /** 中間状態（一部選択） */
  indeterminate: boolean
  /** 無効化状態 */
  disabled: boolean
}

/**
 * チェックボックスのコールバック
 */
export interface CheckboxCallbacks {
  /** 状態変更時 */
  onChange?: (checked: boolean, state: CheckboxState) => void
  /** チェック状態変更時 */
  onCheckedChange?: (checked: boolean) => void
}

/**
 * チェックボックスの設定
 */
export interface CheckboxConfig {
  /** 初期チェック状態 */
  defaultChecked?: boolean
  /** 初期中間状態 */
  defaultIndeterminate?: boolean
  /** 無効化 */
  disabled?: boolean
  /** チェック時ラベル */
  checkedLabel?: string
  /** 非チェック時ラベル */
  uncheckedLabel?: string
  /** サイズ */
  size?: 'small' | 'medium' | 'large'
  /** name属性（フォーム用） */
  name?: string
  /** ラベル位置 */
  labelPosition?: 'left' | 'right'
}

// =============================================================================
// Checkbox Class
// =============================================================================

/**
 * チェックボックスコンポーネント
 */
export class Checkbox {
  private config: CheckboxConfig
  private state: CheckboxState
  private callbacks: CheckboxCallbacks
  private container: HTMLElement
  private instanceId: string

  constructor(
    container: HTMLElement,
    config: CheckboxConfig = {},
    callbacks: CheckboxCallbacks = {}
  ) {
    this.config = config
    this.container = container
    this.callbacks = callbacks
    this.instanceId = generateId('checkbox')
    this.state = this.createInitialState()
  }

  // ===========================================================================
  // Public Methods
  // ===========================================================================

  /**
   * チェックボックスをレンダリング
   */
  render(): void {
    this.container.innerHTML = ''

    const size = this.config.size ?? 'medium'
    const labelPosition = this.config.labelPosition ?? 'right'
    this.container.className = `mokkun-checkbox checkbox-${size} checkbox-label-${labelPosition}`

    // data-state属性を設定
    const dataState = this.state.indeterminate
      ? 'indeterminate'
      : this.state.checked
        ? 'checked'
        : 'unchecked'
    this.container.setAttribute('data-state', dataState)

    if (this.state.disabled) {
      this.container.setAttribute('data-disabled', '')
    } else {
      this.container.removeAttribute('data-disabled')
    }

    const wrapper = createElement('div', { className: 'checkbox-wrapper' })

    // ラベル（左側に配置する場合）
    if (labelPosition === 'left') {
      const label = this.renderLabel()
      wrapper.appendChild(label)
    }

    // チェックボックス
    const checkbox = this.renderCheckbox()
    wrapper.appendChild(checkbox)

    // ラベル（右側に配置する場合）
    if (labelPosition === 'right') {
      const label = this.renderLabel()
      wrapper.appendChild(label)
    }

    this.container.appendChild(wrapper)
  }

  /**
   * チェック状態を設定
   */
  setChecked(checked: boolean): void {
    if (this.state.disabled) {
      return
    }

    if (this.state.checked === checked && !this.state.indeterminate) {
      return
    }

    this.state = {
      ...this.state,
      checked,
      indeterminate: false, // チェック状態を設定すると中間状態は解除
    }

    this.render()
    this.callbacks.onChange?.(checked, this.state)
    this.callbacks.onCheckedChange?.(checked)
  }

  /**
   * 中間状態を設定
   */
  setIndeterminate(indeterminate: boolean): void {
    if (this.state.disabled) {
      return
    }

    if (this.state.indeterminate === indeterminate) {
      return
    }

    this.state = {
      ...this.state,
      indeterminate,
    }

    this.render()
  }

  /**
   * 状態をトグル
   */
  toggle(): void {
    // 中間状態の場合はチェック状態にする
    if (this.state.indeterminate) {
      this.setChecked(true)
    } else {
      this.setChecked(!this.state.checked)
    }
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
  getState(): CheckboxState {
    return { ...this.state }
  }

  /**
   * チェック状態を取得
   */
  isChecked(): boolean {
    return this.state.checked
  }

  /**
   * 中間状態かどうかを取得
   */
  isIndeterminate(): boolean {
    return this.state.indeterminate
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
  private createInitialState(): CheckboxState {
    return {
      checked: this.config.defaultChecked ?? false,
      indeterminate: this.config.defaultIndeterminate ?? false,
      disabled: this.config.disabled ?? false,
    }
  }

  /**
   * チェックボックスをレンダリング
   */
  private renderCheckbox(): HTMLElement {
    const checkboxContainer = createElement('div', {
      className: 'checkbox-input-container',
    })

    // チェックボックス入力要素
    const input = createElement('input', {
      className: 'checkbox-input',
      attributes: {
        type: 'checkbox',
        id: this.instanceId,
        role: 'checkbox',
        'aria-checked': this.state.indeterminate
          ? 'mixed'
          : String(this.state.checked),
        'aria-label': this.state.checked
          ? (this.config.checkedLabel ?? 'チェック済み')
          : (this.config.uncheckedLabel ?? '未チェック'),
      },
    })

    if (this.config.name) {
      input.setAttribute('name', this.config.name)
    }

    if (this.state.checked) {
      input.setAttribute('checked', 'checked')
    }

    if (this.state.indeterminate) {
      (input as HTMLInputElement).indeterminate = true
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
          this.toggle()
        }
      }
    })

    checkboxContainer.appendChild(input)

    // 視覚的なチェックボックス
    const dataState = this.state.indeterminate
      ? 'indeterminate'
      : this.state.checked
        ? 'checked'
        : 'unchecked'
    const classNames = [
      'checkbox-visual',
      dataState,
      this.state.disabled ? 'disabled' : '',
    ].filter(Boolean).join(' ')

    const visualCheckbox = createElement('label', {
      className: classNames,
      attributes: {
        for: this.instanceId,
        'data-state': dataState,
      },
    })

    if (this.state.disabled) {
      visualCheckbox.setAttribute('data-disabled', '')
    }

    // チェックボックスの枠
    const box = createElement('span', { className: 'checkbox-box' })

    // チェックマーク/インデタミネートマーク
    const icon = createElement('span', {
      className: 'checkbox-icon',
      attributes: {
        'data-state': dataState,
      },
    })

    // SVGアイコン（チェックマーク or インデタミネートマーク）
    if (this.state.indeterminate) {
      icon.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 8H13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      `
    } else if (this.state.checked) {
      icon.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 8L6.5 11.5L13 4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `
    }

    box.appendChild(icon)
    visualCheckbox.appendChild(box)

    checkboxContainer.appendChild(visualCheckbox)

    return checkboxContainer
  }

  /**
   * ラベルをレンダリング
   */
  private renderLabel(): HTMLElement {
    const checkedLabel = this.config.checkedLabel ?? ''
    const uncheckedLabel = this.config.uncheckedLabel ?? ''

    const dataState = this.state.indeterminate
      ? 'indeterminate'
      : this.state.checked
        ? 'checked'
        : 'unchecked'
    const classNames = [
      'checkbox-label',
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
   * チェックボックスグループフィールドをHTMLとしてレンダリング（静的メソッド）
   * SSR/初期レンダリング用
   *
   * @param field - チェックボックスグループフィールド定義
   * @returns 生成されたHTML文字列
   */
  static renderField(field: InputField): string {
    if (field.type === 'checkbox') {
      return Checkbox.renderSingleCheckbox(field as CheckboxField)
    }
    return Checkbox.renderCheckboxGroup(field as CheckboxGroupField)
  }

  /**
   * 単一チェックボックスをレンダリング
   */
  private static renderSingleCheckbox(field: CheckboxField): string {
    const labelPosition = field.label_position ?? 'right'
    const size = field.size ?? 'medium'
    const disabled = field.disabled ? 'disabled' : ''

    const checkboxInput = `
      <input
        type="checkbox"
        id="${escapeHtml(field.id)}"
        name="${escapeHtml(field.name ?? field.id)}"
        class="checkbox-input checkbox-${size}"
        ${field.required ? 'required' : ''}
        ${disabled}
      />
    `

    const labelText = field.label ? `<span class="checkbox-label-text">${escapeHtml(field.label)}</span>` : ''

    const content = labelPosition === 'left'
      ? `<label class="checkbox-single label-left">${labelText}${checkboxInput}</label>`
      : `<label class="checkbox-single label-right">${checkboxInput}${labelText}</label>`

    return createFieldWrapper({ ...field, label: '' }, content)
  }

  /**
   * チェックボックスグループをレンダリング
   */
  private static renderCheckboxGroup(field: CheckboxGroupField): string {
    const options = getOptions(field.options)
    const direction = field.direction ?? 'vertical'
    const defaultValues = Array.isArray(field.default) ? field.default : []

    const optionHtml = options
      .map((opt) => {
        const checked = defaultValues.includes(opt.value) ? 'checked' : ''
        const disabled = opt.disabled || field.disabled ? 'disabled' : ''
        const optionId = `${field.id}-${opt.value}`

        return `
          <label class="checkbox-option" for="${escapeHtml(optionId)}">
            <input
              type="checkbox"
              id="${escapeHtml(optionId)}"
              name="${escapeHtml(field.id)}"
              value="${escapeHtml(String(opt.value))}"
              ${checked}
              ${disabled}
            />
            <span class="checkbox-label">${escapeHtml(opt.label)}</span>
          </label>
        `
      })
      .join('')

    const content = `<div class="checkbox-group direction-${direction}">${optionHtml}</div>`
    return createFieldWrapper(field, content)
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Checkboxを作成するファクトリ関数
 */
export function createCheckbox(
  container: HTMLElement,
  config: CheckboxConfig = {},
  callbacks: CheckboxCallbacks = {}
): Checkbox {
  const checkbox = new Checkbox(container, config, callbacks)
  checkbox.render()
  return checkbox
}

/**
 * Toggle Component
 * トグルスイッチコンポーネント
 *
 * API follows standard conventions from Headless UI and Radix UI:
 * - `checked` / `defaultChecked` for state
 * - `data-state="checked|unchecked"` for styling
 * - `data-disabled` when disabled
 * - `role="switch"` with `aria-checked` for accessibility
 * - `onCheckedChange` callback (Radix UI compatible)
 */

import { createElement, generateId } from '../utils/dom'
import { escapeHtml, createFieldWrapper } from '../utils/field-helpers'
import type { InputField } from '../../types/schema'

// =============================================================================
// Types
// =============================================================================

/**
 * トグルの状態
 */
export interface ToggleState {
  /** チェック状態 */
  checked: boolean
  /** 無効化状態 */
  disabled: boolean
}

/**
 * トグルのコールバック
 */
export interface ToggleCallbacks {
  /** 状態変更時 */
  onChange?: (checked: boolean, state: ToggleState) => void
  /** Radix UI互換: 状態変更時 */
  onCheckedChange?: (checked: boolean) => void
}

/**
 * トグルの設定
 */
export interface ToggleConfig {
  /** 初期チェック状態 */
  defaultChecked?: boolean
  /** 無効化 */
  disabled?: boolean
  /** チェック時ラベル */
  checkedLabel?: string
  /** 非チェック時ラベル */
  uncheckedLabel?: string
  /** サイズ ( small/medium) */
  size?: 'small' | 'medium' | 'large'
  /** name属性（フォーム用） */
  name?: string
  /** ラベル位置 () */
  labelPosition?: 'left' | 'right'
}

// =============================================================================
// Toggle Class
// =============================================================================

/**
 * トグルコンポーネント
 */
export class Toggle {
  private config: ToggleConfig
  private state: ToggleState
  private callbacks: ToggleCallbacks
  private container: HTMLElement
  private instanceId: string

  constructor(
    container: HTMLElement,
    config: ToggleConfig = {},
    callbacks: ToggleCallbacks = {}
  ) {
    this.config = config
    this.container = container
    this.callbacks = callbacks
    this.instanceId = generateId('toggle')
    this.state = this.createInitialState()
  }

  // ===========================================================================
  // Public Methods
  // ===========================================================================

  /**
   * トグルをレンダリング
   */
  render(): void {
    this.container.innerHTML = ''

    const size = this.config.size ?? 'medium'
    const labelPosition = this.config.labelPosition ?? 'right'
    this.container.className = `mokkun-toggle toggle-${size} toggle-label-${labelPosition}`

    // data-state属性を設定（Radix UI / Headless UI互換）
    this.container.setAttribute('data-state', this.state.checked ? 'checked' : 'unchecked')
    if (this.state.disabled) {
      this.container.setAttribute('data-disabled', '')
    } else {
      this.container.removeAttribute('data-disabled')
    }

    const wrapper = createElement('div', { className: 'toggle-wrapper' })

    // ラベル（左側に配置する場合）
    if (labelPosition === 'left') {
      const label = this.renderLabel()
      wrapper.appendChild(label)
    }

    // トグルスイッチ
    const toggle = this.renderToggle()
    wrapper.appendChild(toggle)

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
   * 状態をトグル
   */
  toggle(): void {
    this.setChecked(!this.state.checked)
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
  getState(): ToggleState {
    return { ...this.state }
  }

  /**
   * チェック状態を取得
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

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  /**
   * 初期状態を作成
   */
  private createInitialState(): ToggleState {
    return {
      checked: this.config.defaultChecked ?? false,
      disabled: this.config.disabled ?? false,
    }
  }

  /**
   * トグルスイッチをレンダリング
   */
  private renderToggle(): HTMLElement {
    const toggleContainer = createElement('div', {
      className: 'toggle-switch-container',
    })

    // 非表示のチェックボックス（アクセシビリティ用）
    const checkbox = createElement('input', {
      className: 'toggle-checkbox visually-hidden',
      attributes: {
        type: 'checkbox',
        id: this.instanceId,
        role: 'switch',
        'aria-checked': String(this.state.checked),
        'aria-label': this.state.checked
          ? (this.config.checkedLabel ?? 'ON')
          : (this.config.uncheckedLabel ?? 'OFF'),
      },
    })

    if (this.config.name) {
      checkbox.setAttribute('name', this.config.name)
    }

    if (this.state.checked) {
      checkbox.setAttribute('checked', 'checked')
    }

    if (this.state.disabled) {
      checkbox.setAttribute('disabled', 'disabled')
      checkbox.setAttribute('aria-disabled', 'true')
    }

    // 変更イベント
    checkbox.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement
      this.setChecked(target.checked)
    })

    // キーボードイベント（Spaceキー対応）
    checkbox.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        if (!this.state.disabled) {
          this.toggle()
        }
      }
    })

    toggleContainer.appendChild(checkbox)

    // 視覚的なトグルスイッチ
    const stateClass = this.state.checked ? 'checked' : 'unchecked'
    const classNames = [
      'toggle-switch',
      stateClass,
      this.state.disabled ? 'disabled' : '',
    ].filter(Boolean).join(' ')

    const toggleSwitch = createElement('label', {
      className: classNames,
      attributes: {
        for: this.instanceId,
        'data-state': stateClass,
      },
    })

    if (this.state.disabled) {
      toggleSwitch.setAttribute('data-disabled', '')
    }

    // トラック
    const track = createElement('span', { className: 'toggle-track' })
    toggleSwitch.appendChild(track)

    // Thumb（標準的な命名）
    const thumb = createElement('span', {
      className: 'toggle-thumb',
      attributes: {
        'data-state': stateClass,
      },
    })
    toggleSwitch.appendChild(thumb)

    toggleContainer.appendChild(toggleSwitch)

    return toggleContainer
  }

  /**
   * ラベルをレンダリング
   */
  private renderLabel(): HTMLElement {
    const checkedLabel = this.config.checkedLabel ?? 'ON'
    const uncheckedLabel = this.config.uncheckedLabel ?? 'OFF'

    const stateClass = this.state.checked ? 'checked' : 'unchecked'
    const classNames = [
      'toggle-label',
      stateClass,
      this.state.disabled ? 'disabled' : '',
    ].filter(Boolean).join(' ')

    const label = createElement('span', {
      className: classNames,
      textContent: this.state.checked ? checkedLabel : uncheckedLabel,
      attributes: {
        'aria-live': 'polite',
        'data-state': stateClass,
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
   * ToggleフィールドをHTMLとしてレンダリング（静的メソッド）
   * SSR/初期レンダリング用
   */
  static renderField(field: InputField): string {
    const toggleField = field as InputField & {
      defaultChecked?: boolean
      checkedLabel?: string
      uncheckedLabel?: string
      size?: 'small' | 'medium' | 'large'
    }
    const checked = toggleField.defaultChecked ?? false
    const checkedLabel = toggleField.checkedLabel ?? 'ON'
    const uncheckedLabel = toggleField.uncheckedLabel ?? 'OFF'
    const size = toggleField.size ?? 'medium'
    const stateClass = checked ? 'checked' : 'unchecked'

    const toggleHtml = `
      <div class="mokkun-toggle toggle-${size} toggle-label-right" data-state="${stateClass}">
        <div class="toggle-wrapper">
          <div class="toggle-switch-container">
            <input type="checkbox" class="toggle-checkbox visually-hidden" id="${escapeHtml(field.id)}" role="switch" aria-checked="${checked}" ${checked ? 'checked' : ''}>
            <label class="toggle-switch ${stateClass}" for="${escapeHtml(field.id)}" data-state="${stateClass}">
              <span class="toggle-track"></span>
              <span class="toggle-thumb" data-state="${stateClass}"></span>
            </label>
          </div>
          <span class="toggle-label ${stateClass}" aria-live="polite" data-state="${stateClass}">${escapeHtml(checked ? checkedLabel : uncheckedLabel)}</span>
        </div>
      </div>
    `

    return createFieldWrapper(field, toggleHtml)
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Toggleを作成するファクトリ関数
 */
export function createToggle(
  container: HTMLElement,
  config: ToggleConfig = {},
  callbacks: ToggleCallbacks = {}
): Toggle {
  const toggle = new Toggle(container, config, callbacks)
  toggle.render()
  return toggle
}

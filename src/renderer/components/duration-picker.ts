/**
 * Duration Picker Component
 * 期間選択コンポーネント（時間:分 等の選択UI）
 *
 * 機能:
 * - 複数の時間単位（日/時間/分/秒）からの選択
 * - 柔軟な単位設定
 * - アクセシビリティ対応
 */

import { createElement, generateId } from '../utils/dom'
import {
  escapeHtml,
  createFieldWrapper,
  unitLabels,
} from '../utils/field-helpers'
import type { DurationPickerField } from '../../types/schema'

// =============================================================================
// Types
// =============================================================================

/**
 * 時間単位
 */
export type DurationUnit = 'days' | 'hours' | 'minutes' | 'seconds'

/**
 * Duration Pickerの状態
 */
export interface DurationPickerState {
  /** 各単位の値 */
  values: Record<DurationUnit, number>
  /** 無効化状態 */
  disabled: boolean
}

/**
 * Duration Pickerのコールバック
 */
export interface DurationPickerCallbacks {
  /** 値変更時 */
  onChange?: (values: Record<DurationUnit, number>, state: DurationPickerState) => void
}

/**
 * Duration Pickerの設定
 */
export interface DurationPickerConfig {
  /** 使用する単位 */
  units: DurationUnit[]
  /** 初期値 */
  defaultValues?: Partial<Record<DurationUnit, number>>
  /** 無効化 */
  disabled?: boolean
  /** name属性プレフィックス */
  name?: string
  /** ID */
  id?: string
}

// =============================================================================
// DurationPicker Class
// =============================================================================

/**
 * 期間選択コンポーネント
 */
export class DurationPicker {
  private config: DurationPickerConfig
  private state: DurationPickerState
  private callbacks: DurationPickerCallbacks
  private container: HTMLElement
  private instanceId: string

  constructor(
    container: HTMLElement,
    config: DurationPickerConfig,
    callbacks: DurationPickerCallbacks = {}
  ) {
    this.config = config
    this.container = container
    this.callbacks = callbacks
    this.instanceId = config.id ?? generateId('duration-picker')
    this.state = this.createInitialState()
  }

  // ===========================================================================
  // Public Methods
  // ===========================================================================

  /**
   * Duration Pickerをレンダリング
   */
  render(): void {
    this.container.innerHTML = ''

    const wrapper = createElement('div', {
      className: 'mokkun-duration-picker',
    })

    if (this.state.disabled) {
      wrapper.classList.add('is-disabled')
    }

    // 各単位のセレクター
    for (const unit of this.config.units) {
      const unitElement = this.renderUnitSelector(unit)
      wrapper.appendChild(unitElement)
    }

    this.container.appendChild(wrapper)
  }

  /**
   * 値を設定
   */
  setValue(unit: DurationUnit, value: number): void {
    if (this.state.disabled) {
      return
    }

    this.state = {
      ...this.state,
      values: {
        ...this.state.values,
        [unit]: value,
      },
    }

    this.render()
    this.callbacks.onChange?.(this.state.values, this.state)
  }

  /**
   * 全ての値を設定
   */
  setValues(values: Partial<Record<DurationUnit, number>>): void {
    if (this.state.disabled) {
      return
    }

    this.state = {
      ...this.state,
      values: {
        ...this.state.values,
        ...values,
      },
    }

    this.render()
    this.callbacks.onChange?.(this.state.values, this.state)
  }

  /**
   * 値を取得
   */
  getValue(unit: DurationUnit): number {
    return this.state.values[unit]
  }

  /**
   * 全ての値を取得
   */
  getValues(): Record<DurationUnit, number> {
    return { ...this.state.values }
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
  getState(): DurationPickerState {
    return { ...this.state }
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  /**
   * 初期状態を作成
   */
  private createInitialState(): DurationPickerState {
    const defaultValues = this.config.defaultValues ?? {}
    return {
      values: {
        days: defaultValues.days ?? 0,
        hours: defaultValues.hours ?? 0,
        minutes: defaultValues.minutes ?? 0,
        seconds: defaultValues.seconds ?? 0,
      },
      disabled: this.config.disabled ?? false,
    }
  }

  /**
   * 単位セレクターをレンダリング
   */
  private renderUnitSelector(unit: DurationUnit): HTMLElement {
    const unitContainer = createElement('div', {
      className: 'duration-unit',
    })

    const unitId = `${this.instanceId}-${unit}`
    const max = this.getMaxForUnit(unit)
    const currentValue = this.state.values[unit]

    // セレクトボックス
    const select = createElement('select', {
      className: 'form-select duration-select',
      attributes: {
        id: unitId,
        name: this.config.name ? `${this.config.name}-${unit}` : unitId,
      },
    })

    if (this.state.disabled) {
      select.setAttribute('disabled', 'disabled')
    }

    // オプションを生成
    for (let i = 0; i <= max; i++) {
      const option = createElement('option', {
        textContent: String(i),
      })
      option.setAttribute('value', String(i))
      if (i === currentValue) {
        option.setAttribute('selected', 'selected')
      }
      select.appendChild(option)
    }

    // 変更イベント
    select.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement
      this.setValue(unit, parseInt(target.value, 10))
    })

    unitContainer.appendChild(select)

    // 単位ラベル
    const label = createElement('span', {
      className: 'duration-unit-label',
      textContent: unitLabels[unit] ?? unit,
    })
    unitContainer.appendChild(label)

    return unitContainer
  }

  /**
   * 単位ごとの最大値を取得
   */
  private getMaxForUnit(unit: DurationUnit): number {
    switch (unit) {
      case 'days':
        return 365
      case 'hours':
        return 23
      case 'minutes':
      case 'seconds':
        return 59
      default:
        return 59
    }
  }

  // ===========================================================================
  // Static Field Renderer
  // ===========================================================================

  /**
   * Duration Pickerフィールドを HTMLとしてレンダリング（静的メソッド）
   * SSR/初期レンダリング用
   *
   * @param field - Duration Pickerフィールド定義
   * @returns 生成されたHTML文字列
   */
  static renderField(field: DurationPickerField): string {
    const units = field.units ?? ['hours', 'minutes']
    const fieldId = field.id

    const selectors = units
      .map((unit) => {
        const unitId = `${fieldId}-${unit}`
        let max = 59
        if (unit === 'hours') max = 23
        if (unit === 'days') max = 365

        const options = Array.from({ length: max + 1 }, (_, i) =>
          `<option value="${i}">${i}</option>`
        ).join('')

        return `
          <div class="duration-unit">
            <select id="${escapeHtml(unitId)}" name="${escapeHtml(unitId)}" class="form-select duration-select" ${field.disabled ? 'disabled' : ''}>
              ${options}
            </select>
            <span class="duration-unit-label">${unitLabels[unit] ?? unit}</span>
          </div>
        `
      })
      .join('')

    const content = `<div class="duration-picker">${selectors}</div>`
    return createFieldWrapper(field, content)
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Duration Pickerを作成するファクトリ関数
 */
export function createDurationPicker(
  container: HTMLElement,
  config: DurationPickerConfig,
  callbacks: DurationPickerCallbacks = {}
): DurationPicker {
  const picker = new DurationPicker(container, config, callbacks)
  picker.render()
  return picker
}

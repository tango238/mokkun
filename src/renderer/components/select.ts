/**
 * Select Component
 * セレクトコンポーネント
 *
 * Native <select> based component:
 * - Size variants: 's' | 'default'
 * - State variants: default, disabled, error
 * - Support for optgroup (option grouping)
 * - Placeholder and blank options
 * - Full accessibility with ARIA attributes
 */

import { createElement, generateId } from '../utils/dom'
import {
  escapeHtml,
  createFieldWrapper,
  getCommonAttributes,
  getOptions,
} from '../utils/field-helpers'
import type {
  SelectConfig,
  SelectState,
  SelectCallbacks,
  SelectOption,
  SelectOptionGroup,
  SelectField,
  MultiSelectField,
} from '../../types/schema'

// =============================================================================
// Type Guards
// =============================================================================

/**
 * SelectOptionGroupの型ガード
 */
function isOptionGroup(item: SelectOption | SelectOptionGroup): item is SelectOptionGroup {
  return 'options' in item && Array.isArray(item.options)
}

// =============================================================================
// Select Class
// =============================================================================

/**
 * セレクトコンポーネント
 */
export class Select {
  private config: SelectConfig
  private state: SelectState
  private callbacks: SelectCallbacks
  private container: HTMLElement
  private instanceId: string
  private selectElement: HTMLSelectElement | null = null

  constructor(
    container: HTMLElement,
    config: SelectConfig,
    callbacks: SelectCallbacks = {}
  ) {
    this.config = config
    this.container = container
    this.callbacks = callbacks
    this.instanceId = generateId('select')
    this.state = this.createInitialState()
  }

  // ===========================================================================
  // Public Methods
  // ===========================================================================

  /**
   * セレクトをレンダリング
   */
  render(): void {
    this.container.innerHTML = ''

    const size = this.config.size ?? 'default'
    this.container.className = `mokkun-select select-${size}`

    // data-state属性を設定
    if (this.state.disabled) {
      this.container.setAttribute('data-disabled', '')
    } else {
      this.container.removeAttribute('data-disabled')
    }

    if (this.state.error) {
      this.container.setAttribute('data-error', '')
    } else {
      this.container.removeAttribute('data-error')
    }

    // セレクト要素を作成
    const select = this.renderSelect()
    this.selectElement = select
    this.container.appendChild(select)
  }

  /**
   * 値を設定
   */
  setValue(value: string | number | null): void {
    if (this.state.disabled) {
      return
    }

    const stringValue = value === null ? '' : String(value)

    if (this.state.value === value) {
      return
    }

    this.state = {
      ...this.state,
      value,
    }

    if (this.selectElement) {
      this.selectElement.value = stringValue
    }

    this.callbacks.onChange?.(value, this.state)
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
   * エラー状態を設定
   */
  setError(error: boolean): void {
    if (this.state.error === error) {
      return
    }

    this.state = {
      ...this.state,
      error,
    }

    this.render()
  }

  /**
   * 現在の状態を取得
   */
  getState(): SelectState {
    return { ...this.state }
  }

  /**
   * 現在の値を取得
   */
  getValue(): string | number | null {
    return this.state.value
  }

  /**
   * 無効化されているかどうかを取得
   */
  isDisabled(): boolean {
    return this.state.disabled
  }

  /**
   * エラー状態かどうかを取得
   */
  hasError(): boolean {
    return this.state.error
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  /**
   * 初期状態を作成
   */
  private createInitialState(): SelectState {
    return {
      value: this.config.defaultValue ?? null,
      disabled: this.config.disabled ?? false,
      error: this.config.error ?? false,
    }
  }

  /**
   * セレクト要素をレンダリング
   */
  private renderSelect(): HTMLSelectElement {
    const classNames = [
      'field-input',
      'field-select',
      this.state.error ? 'error' : '',
    ].filter(Boolean).join(' ')

    const select = createElement('select', {
      className: classNames,
      attributes: {
        id: this.instanceId,
        'aria-invalid': this.state.error ? 'true' : 'false',
      },
    })

    // name属性
    if (this.config.name) {
      select.setAttribute('name', this.config.name)
    }

    // 幅の設定
    if (this.config.width) {
      const width = typeof this.config.width === 'number'
        ? `${this.config.width}px`
        : this.config.width
      select.style.width = width
    }

    // 無効化
    if (this.state.disabled) {
      select.setAttribute('disabled', 'disabled')
      select.setAttribute('aria-disabled', 'true')
    }

    // 必須
    if (this.config.required) {
      select.setAttribute('required', 'required')
      select.setAttribute('aria-required', 'true')
    }

    // 空オプション（プレースホルダー）
    if (this.config.hasBlank !== false) {
      const blankOption = createElement('option', {
        textContent: this.config.placeholder ??
                     this.config.blankLabel ??
                     'Select...',
      })
      blankOption.value = ''
      if (this.state.value === null || this.state.value === '') {
        blankOption.selected = true
      }
      select.appendChild(blankOption)
    }

    // オプションまたはオプショングループを追加
    this.appendOptions(select, this.config.options)

    // 変更イベント
    select.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement
      const value = target.value === '' ? null : target.value
      this.setValue(value)
    })

    // キーボードナビゲーション
    select.addEventListener('keydown', (e) => {
      // Escape でフォーカスを外す
      if (e.key === 'Escape') {
        select.blur()
      }
    })

    return select
  }

  /**
   * オプションを追加
   */
  private appendOptions(
    select: HTMLSelectElement,
    items: Array<SelectOption | SelectOptionGroup>
  ): void {
    for (const item of items) {
      if (isOptionGroup(item)) {
        // オプショングループ
        const optgroup = this.createOptgroup(item)
        select.appendChild(optgroup)
      } else {
        // 単一オプション
        const option = this.createOption(item)
        select.appendChild(option)
      }
    }
  }

  /**
   * オプションを作成
   */
  private createOption(opt: SelectOption): HTMLOptionElement {
    const option = createElement('option', {
      textContent: opt.label,
    })

    option.value = String(opt.value)

    if (opt.disabled) {
      option.disabled = true
    }

    // 選択状態
    if (this.state.value !== null && String(opt.value) === String(this.state.value)) {
      option.selected = true
    }

    return option
  }

  /**
   * オプショングループを作成
   */
  private createOptgroup(group: SelectOptionGroup): HTMLOptGroupElement {
    const optgroup = document.createElement('optgroup')
    optgroup.label = group.label

    if (group.disabled) {
      optgroup.disabled = true
    }

    // グループ内のオプションを追加
    for (const opt of group.options) {
      const option = this.createOption(opt)
      optgroup.appendChild(option)
    }

    return optgroup
  }

  // ===========================================================================
  // Static Field Renderers
  // ===========================================================================

  /**
   * セレクトフィールドをHTMLとしてレンダリング（静的メソッド）
   * SSR/初期レンダリング用
   *
   * @param field - セレクトフィールド定義
   * @returns 生成されたHTML文字列
   */
  static renderSelectField(field: SelectField): string {
    const attrs: string[] = [getCommonAttributes(field)]
    const sizeClass = field.size ? `select-${field.size}` : 'select-default'
    const options = getOptions(field.options)

    // グループ化されたオプションとそうでないオプションを分離
    const grouped = new Map<string, SelectOption[]>()
    const ungrouped: SelectOption[] = []

    for (const opt of options) {
      if (opt.group) {
        if (!grouped.has(opt.group)) {
          grouped.set(opt.group, [])
        }
        grouped.get(opt.group)!.push(opt)
      } else {
        ungrouped.push(opt)
      }
    }

    // オプションHTMLの生成
    const renderOption = (opt: SelectOption) => {
      const selected = field.default === opt.value ? 'selected' : ''
      const disabled = opt.disabled ? 'disabled' : ''
      return `<option value="${escapeHtml(String(opt.value))}" ${selected} ${disabled}>${escapeHtml(opt.label)}</option>`
    }

    // 未グループ化のオプション
    const ungroupedHtml = ungrouped.map(renderOption).join('')

    // グループ化されたオプション（optgroup）
    const groupedHtml = Array.from(grouped.entries())
      .map(([label, opts]) => {
        const optionsHtml = opts.map(renderOption).join('')
        return `<optgroup label="${escapeHtml(label)}">${optionsHtml}</optgroup>`
      })
      .join('')

    // プレースホルダーまたは空オプション
    const hasBlank = !field.required || field.clearable
    const blankOption = hasBlank
      ? `<option value="">${escapeHtml(field.placeholder ?? 'Select...')}</option>`
      : ''

    const select = `
      <select class="field-select ${sizeClass}" ${attrs.join(' ')}>
        ${blankOption}
        ${ungroupedHtml}
        ${groupedHtml}
      </select>
    `
    return createFieldWrapper(field, select)
  }

  /**
   * マルチセレクトフィールドをHTMLとしてレンダリング（静的メソッド）
   * SSR/初期レンダリング用
   *
   * @param field - マルチセレクトフィールド定義
   * @returns 生成されたHTML文字列
   */
  static renderMultiSelectField(field: MultiSelectField): string {
    const attrs: string[] = [getCommonAttributes(field), 'multiple']
    const options = getOptions(field.options)
    const defaultValues = Array.isArray(field.default) ? field.default : []

    const optionHtml = options
      .map((opt) => {
        const selected = defaultValues.includes(opt.value) ? 'selected' : ''
        const disabled = opt.disabled ? 'disabled' : ''
        return `<option value="${escapeHtml(String(opt.value))}" ${selected} ${disabled}>${escapeHtml(opt.label)}</option>`
      })
      .join('')

    const select = `
      <select class="form-select form-multiselect" ${attrs.join(' ')}>
        ${optionHtml}
      </select>
    `
    return createFieldWrapper(field, select)
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Selectを作成するファクトリ関数
 */
export function createSelect(
  container: HTMLElement,
  config: SelectConfig,
  callbacks: SelectCallbacks = {}
): Select {
  const select = new Select(container, config, callbacks)
  select.render()
  return select
}

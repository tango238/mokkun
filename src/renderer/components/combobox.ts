/**
 * Combobox Component
 * コンボボックスコンポーネント
 *
 * Features:
 * - Single and multi-selection modes
 * - Search/filter functionality
 * - Async option loading with debounce
 * - Grouped options support
 * - Custom option rendering
 * - Full keyboard navigation
 * - ARIA accessibility
 *
 * API follows standard conventions from Headless UI and Radix UI:
 * - `role="combobox"` with `aria-haspopup="listbox"`
 * - `aria-expanded` for dropdown state
 * - `aria-activedescendant` for keyboard navigation
 * - `data-state="open|closed"` for styling
 */

import { createElement, generateId, clearElement } from '../utils/dom'
import {
  escapeHtml,
  createFieldWrapper,
  getOptions,
} from '../utils/field-helpers'
import type { ComboboxField } from '../../types/schema'

// =============================================================================
// Types
// =============================================================================

/**
 * コンボボックスの選択肢
 */
export interface ComboboxOption {
  /** 値 */
  value: string | number
  /** ラベル */
  label: string
  /** 無効化 */
  disabled?: boolean
  /** グループ名 */
  group?: string
  /** アイコンHTML */
  icon?: string
  /** 説明 */
  description?: string
  /** カスタムデータ */
  data?: Record<string, unknown>
}

/**
 * コンボボックスの状態
 */
export interface ComboboxState {
  /** 選択された値 */
  selectedValues: (string | number)[]
  /** 入力テキスト */
  inputValue: string
  /** ドロップダウン開閉状態 */
  isOpen: boolean
  /** ハイライト中のオプションインデックス */
  highlightedIndex: number
  /** フィルタリング/ロード済みオプション */
  filteredOptions: ComboboxOption[]
  /** グループ化されたオプション */
  groupedOptions: Map<string, ComboboxOption[]>
  /** ローディング状態 */
  isLoading: boolean
  /** エラーメッセージ */
  error: string | null
}

/**
 * コンボボックスのコールバック
 */
export interface ComboboxCallbacks {
  /** 選択変更時 */
  onChange?: (values: (string | number)[], state: ComboboxState) => void
  /** 入力変更時 */
  onInputChange?: (value: string, state: ComboboxState) => void
  /** ドロップダウン開閉時 */
  onOpen?: (state: ComboboxState) => void
  /** ドロップダウン閉じる時 */
  onClose?: (state: ComboboxState) => void
  /** オプションハイライト時 */
  onHighlight?: (option: ComboboxOption | null, state: ComboboxState) => void
  /** 非同期ロードエラー時 */
  onError?: (error: Error, state: ComboboxState) => void
}

/**
 * コンボボックスの設定
 */
export interface ComboboxConfig {
  /** コンポーネントID */
  id: string
  /** プレースホルダー */
  placeholder?: string
  /** 選択モード */
  mode: 'single' | 'multi'
  /** 静的オプション */
  options?: ComboboxOption[]
  /** 非同期ローダー関数 */
  loadOptions?: (query: string) => Promise<ComboboxOption[]>
  /** デバウンス遅延（ms） */
  debounceMs?: number
  /** クリア可能 */
  clearable?: boolean
  /** 無効化 */
  disabled?: boolean
  /** 必須フィールド */
  required?: boolean
  /** 非同期ロード最小検索文字数 */
  minSearchLength?: number
  /** 最大選択数（multiモード） */
  maxSelections?: number
  /** カスタムオプションレンダラー */
  renderOption?: (option: ComboboxOption) => string
  /** カスタム選択値レンダラー */
  renderSelected?: (option: ComboboxOption) => string
  /** オプションなしメッセージ */
  noOptionsMessage?: string
  /** ローディングメッセージ */
  loadingMessage?: string
  /** name属性（フォーム用） */
  name?: string
}

// =============================================================================
// Combobox Class
// =============================================================================

/**
 * コンボボックスコンポーネント
 */
export class Combobox {
  private config: ComboboxConfig
  private state: ComboboxState
  private callbacks: ComboboxCallbacks
  private container: HTMLElement
  private instanceId: string
  private debounceTimer: ReturnType<typeof setTimeout> | null = null
  private inputRef: HTMLInputElement | null = null
  private listboxRef: HTMLElement | null = null
  private documentClickHandler: ((e: MouseEvent) => void) | null = null
  private abortController: AbortController | null = null

  constructor(
    container: HTMLElement,
    config: ComboboxConfig,
    callbacks: ComboboxCallbacks = {},
    initialValues: (string | number)[] = []
  ) {
    this.config = config
    this.container = container
    this.callbacks = callbacks
    this.instanceId = generateId('combobox')
    this.state = this.createInitialState(initialValues)
  }

  // ===========================================================================
  // Public Methods
  // ===========================================================================

  /**
   * コンボボックスをレンダリング
   */
  render(): void {
    clearElement(this.container)
    this.container.className = `mokkun-combobox combobox-${this.config.mode}`
    this.container.setAttribute('data-state', this.state.isOpen ? 'open' : 'closed')

    if (this.config.disabled) {
      this.container.setAttribute('data-disabled', '')
    } else {
      this.container.removeAttribute('data-disabled')
    }

    // Build wrapper
    const wrapper = createElement('div', { className: 'combobox-wrapper' })

    // Input area
    wrapper.appendChild(this.renderInputArea())

    // Dropdown (when open)
    if (this.state.isOpen) {
      wrapper.appendChild(this.renderDropdown())
    }

    this.container.appendChild(wrapper)

    // Setup event listeners
    this.setupEventListeners()
  }

  /**
   * 値を取得
   */
  getValue(): (string | number)[] {
    return [...this.state.selectedValues]
  }

  /**
   * 値を設定
   */
  setValue(values: (string | number)[]): void {
    this.setState({ selectedValues: values })
  }

  /**
   * 選択されたオプションを取得
   */
  getSelectedOptions(): ComboboxOption[] {
    const allOptions = this.config.options ?? []
    return this.state.selectedValues
      .map((value) => allOptions.find((opt) => opt.value === value))
      .filter((opt): opt is ComboboxOption => opt !== undefined)
  }

  /**
   * ドロップダウンを開く
   */
  open(): void {
    if (this.config.disabled || this.state.isOpen) return
    this.setState({ isOpen: true, highlightedIndex: -1 })
    this.callbacks.onOpen?.(this.state)
  }

  /**
   * ドロップダウンを閉じる
   */
  close(): void {
    if (!this.state.isOpen) return
    this.setState({ isOpen: false, highlightedIndex: -1 })
    this.callbacks.onClose?.(this.state)
  }

  /**
   * ドロップダウンの開閉状態をトグル
   */
  toggle(): void {
    if (this.state.isOpen) {
      this.close()
    } else {
      this.open()
    }
  }

  /**
   * ドロップダウンが開いているか
   */
  isOpenState(): boolean {
    return this.state.isOpen
  }

  /**
   * オプションを設定
   */
  setOptions(options: ComboboxOption[]): void {
    this.config.options = options
    this.updateFilteredOptions()
  }

  /**
   * オプションを追加
   */
  addOption(option: ComboboxOption): void {
    if (!this.config.options) {
      this.config.options = []
    }
    this.config.options.push(option)
    this.updateFilteredOptions()
  }

  /**
   * オプションを削除
   */
  removeOption(value: string | number): void {
    if (!this.config.options) return
    this.config.options = this.config.options.filter((opt) => opt.value !== value)
    this.updateFilteredOptions()
  }

  /**
   * 状態を取得
   */
  getState(): ComboboxState {
    return { ...this.state }
  }

  /**
   * クリーンアップ
   */
  destroy(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }
    if (this.abortController) {
      this.abortController.abort()
    }
    if (this.documentClickHandler) {
      document.removeEventListener('click', this.documentClickHandler)
    }
    clearElement(this.container)
    this.inputRef = null
    this.listboxRef = null
  }

  // ===========================================================================
  // Private Methods - State Management
  // ===========================================================================

  private createInitialState(initialValues: (string | number)[]): ComboboxState {
    const options = this.config.options ?? []
    const filteredOptions = this.filterOptions('', options)
    return {
      selectedValues: initialValues,
      inputValue: '',
      isOpen: false,
      highlightedIndex: -1,
      filteredOptions,
      groupedOptions: this.groupOptions(filteredOptions),
      isLoading: false,
      error: null,
    }
  }

  private setState(partial: Partial<ComboboxState>): void {
    this.state = { ...this.state, ...partial }
    this.render()
  }

  private updateFilteredOptions(): void {
    const options = this.config.options ?? []
    const filteredOptions = this.filterOptions(this.state.inputValue, options)
    this.setState({
      filteredOptions,
      groupedOptions: this.groupOptions(filteredOptions),
    })
  }

  // ===========================================================================
  // Private Methods - Filtering and Grouping
  // ===========================================================================

  private filterOptions(query: string, options: ComboboxOption[]): ComboboxOption[] {
    if (!query) return options

    const normalized = query.toLowerCase().trim()
    return options.filter((option) => {
      // Don't filter out disabled options from display, just prevent interaction
      const labelMatch = option.label.toLowerCase().includes(normalized)
      const descMatch = option.description?.toLowerCase().includes(normalized) ?? false
      const groupMatch = option.group?.toLowerCase().includes(normalized) ?? false
      return labelMatch || descMatch || groupMatch
    })
  }

  private groupOptions(options: ComboboxOption[]): Map<string, ComboboxOption[]> {
    const grouped = new Map<string, ComboboxOption[]>()
    const ungrouped: ComboboxOption[] = []

    for (const option of options) {
      if (option.group) {
        if (!grouped.has(option.group)) {
          grouped.set(option.group, [])
        }
        grouped.get(option.group)!.push(option)
      } else {
        ungrouped.push(option)
      }
    }

    if (ungrouped.length > 0) {
      grouped.set('', ungrouped)
    }

    return grouped
  }

  // ===========================================================================
  // Private Methods - Async Loading
  // ===========================================================================

  private async loadOptionsAsync(query: string): Promise<void> {
    if (!this.config.loadOptions) return

    // Clear previous timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }

    // Check minimum search length
    const minLength = this.config.minSearchLength ?? 0
    if (query.length < minLength) {
      this.setState({
        filteredOptions: [],
        groupedOptions: new Map(),
        isLoading: false,
        error: null,
      })
      return
    }

    // Cancel previous request
    if (this.abortController) {
      this.abortController.abort()
    }
    this.abortController = new AbortController()

    // Set loading state
    this.setState({ isLoading: true, error: null })

    // Debounce
    this.debounceTimer = setTimeout(async () => {
      try {
        const options = await this.config.loadOptions!(query)
        const filteredOptions = this.filterOptions(query, options)
        this.setState({
          filteredOptions,
          groupedOptions: this.groupOptions(filteredOptions),
          isLoading: false,
          error: null,
        })
      } catch (error) {
        // Check if error is abort
        if ((error as Error).name === 'AbortError') return

        this.setState({
          isLoading: false,
          error: (error as Error).message,
        })
        this.callbacks.onError?.(error as Error, this.state)
      }
    }, this.config.debounceMs ?? 300)
  }

  // ===========================================================================
  // Private Methods - Rendering
  // ===========================================================================

  private renderInputArea(): HTMLElement {
    const control = createElement('div', {
      className: `combobox-control ${this.config.disabled ? 'disabled' : ''}`,
    })

    const valueContainer = createElement('div', { className: 'combobox-value-container' })

    if (this.config.mode === 'multi') {
      // Multi mode: tags + input
      const tagsContainer = this.renderTags()
      if (tagsContainer) {
        valueContainer.appendChild(tagsContainer)
      }
    } else {
      // Single mode: selected value or empty
      if (this.state.selectedValues.length > 0) {
        const selectedOption = this.getSelectedOptions()[0]
        if (selectedOption) {
          const singleValue = createElement('span', { className: 'combobox-single-value' })
          if (this.config.renderSelected) {
            singleValue.innerHTML = this.config.renderSelected(selectedOption)
          } else {
            singleValue.textContent = selectedOption.label
          }
          valueContainer.appendChild(singleValue)
        }
      }
    }

    // Input element
    const input = this.createInputElement()
    this.inputRef = input as HTMLInputElement
    valueContainer.appendChild(input)

    control.appendChild(valueContainer)

    // Indicators (clear + dropdown)
    const indicators = this.renderIndicators()
    control.appendChild(indicators)

    return control
  }

  private createInputElement(): HTMLElement {
    const attributes: Record<string, string> = {
      type: 'text',
      role: 'combobox',
      'aria-haspopup': 'listbox',
      'aria-expanded': String(this.state.isOpen),
      'aria-controls': `${this.instanceId}-listbox`,
      'aria-autocomplete': 'list',
      id: this.config.id,
      name: this.config.name ?? this.config.id,
      placeholder: this.config.placeholder ?? '',
    }

    if (this.config.disabled) {
      attributes.disabled = 'true'
    }
    if (this.config.required) {
      attributes.required = 'true'
    }

    const input = createElement('input', {
      className: 'combobox-input',
      attributes,
    }) as HTMLInputElement

    if (this.state.highlightedIndex >= 0 && this.state.filteredOptions[this.state.highlightedIndex]) {
      input.setAttribute(
        'aria-activedescendant',
        `${this.instanceId}-option-${this.state.highlightedIndex}`
      )
    }

    return input
  }

  private renderTags(): HTMLElement | null {
    if (this.state.selectedValues.length === 0) return null

    const tagsContainer = createElement('div', { className: 'combobox-tags' })
    const selectedOptions = this.getSelectedOptions()

    for (const option of selectedOptions) {
      const tag = createElement('span', { className: 'combobox-tag' })

      const label = createElement('span', { className: 'combobox-tag-label' })
      if (this.config.renderSelected) {
        label.innerHTML = this.config.renderSelected(option)
      } else {
        label.textContent = option.label
      }
      tag.appendChild(label)

      const removeBtn = createElement('button', {
        className: 'combobox-tag-remove',
        attributes: {
          type: 'button',
          'aria-label': `Remove ${option.label}`,
          'data-value': String(option.value),
        },
      })
      removeBtn.textContent = '×'
      tag.appendChild(removeBtn)

      tagsContainer.appendChild(tag)
    }

    return tagsContainer
  }

  private renderIndicators(): HTMLElement {
    const indicators = createElement('div', { className: 'combobox-indicators' })

    // Clear button
    if (this.config.clearable && this.state.selectedValues.length > 0) {
      const clearBtn = createElement('button', {
        className: 'combobox-clear',
        attributes: {
          type: 'button',
          'aria-label': 'Clear selection',
        },
      })
      clearBtn.textContent = '×'
      indicators.appendChild(clearBtn)

      const separator = createElement('span', { className: 'combobox-separator' })
      indicators.appendChild(separator)
    }

    // Dropdown indicator
    const dropdownBtn = createElement('button', {
      className: 'combobox-dropdown-indicator',
      attributes: {
        type: 'button',
        'aria-label': this.state.isOpen ? 'Close options' : 'Open options',
      },
    })
    dropdownBtn.textContent = '▼'
    indicators.appendChild(dropdownBtn)

    return indicators
  }

  private renderDropdown(): HTMLElement {
    const dropdown = createElement('div', {
      className: 'combobox-dropdown',
      attributes: {
        role: 'listbox',
        id: `${this.instanceId}-listbox`,
        'aria-label': 'Options',
      },
    })
    this.listboxRef = dropdown

    // Loading state
    if (this.state.isLoading) {
      const loading = createElement('div', { className: 'combobox-loading' })
      loading.textContent = this.config.loadingMessage ?? 'Loading...'
      dropdown.appendChild(loading)
      return dropdown
    }

    // Error state
    if (this.state.error) {
      const error = createElement('div', { className: 'combobox-error' })
      error.textContent = this.state.error
      dropdown.appendChild(error)
      return dropdown
    }

    // Empty state
    if (this.state.filteredOptions.length === 0) {
      const empty = createElement('div', { className: 'combobox-no-options' })
      empty.textContent = this.config.noOptionsMessage ?? 'No options found'
      dropdown.appendChild(empty)
      return dropdown
    }

    // Render grouped options
    let globalIndex = 0
    for (const [groupName, options] of this.state.groupedOptions.entries()) {
      const group = createElement('div', { className: 'combobox-option-group' })

      if (groupName) {
        const header = createElement('div', { className: 'combobox-group-header' })
        header.textContent = groupName
        group.appendChild(header)
      }

      for (const option of options) {
        const optionEl = this.renderOption(option, globalIndex)
        group.appendChild(optionEl)
        globalIndex++
      }

      dropdown.appendChild(group)
    }

    return dropdown
  }

  private renderOption(option: ComboboxOption, index: number): HTMLElement {
    const isSelected = this.state.selectedValues.includes(option.value)
    const isHighlighted = this.state.highlightedIndex === index

    const el = createElement('div', {
      className: `combobox-option ${isSelected ? 'selected' : ''} ${
        isHighlighted ? 'highlighted' : ''
      } ${option.disabled ? 'disabled' : ''}`,
      attributes: {
        role: 'option',
        'aria-selected': String(isSelected),
        'data-value': String(option.value),
        'data-index': String(index),
        id: `${this.instanceId}-option-${index}`,
      },
    })

    if (this.config.renderOption) {
      el.innerHTML = this.config.renderOption(option)
    } else {
      if (option.icon) {
        const icon = createElement('span', { className: 'combobox-option-icon' })
        icon.innerHTML = option.icon
        el.appendChild(icon)
      }

      const label = createElement('span', { className: 'combobox-option-label' })
      label.textContent = option.label
      el.appendChild(label)

      if (option.description) {
        const desc = createElement('span', { className: 'combobox-option-description' })
        desc.textContent = option.description
        el.appendChild(desc)
      }
    }

    return el
  }

  // ===========================================================================
  // Private Methods - Event Handling
  // ===========================================================================

  private setupEventListeners(): void {
    if (!this.inputRef) return

    // Input events
    this.inputRef.addEventListener('focus', () => this.handleInputFocus())
    this.inputRef.addEventListener('input', (e) => this.handleInput(e))
    this.inputRef.addEventListener('keydown', (e) => this.handleKeyDown(e))

    // Clear button
    const clearBtn = this.container.querySelector('.combobox-clear')
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.handleClear())
    }

    // Dropdown indicator
    const dropdownBtn = this.container.querySelector('.combobox-dropdown-indicator')
    if (dropdownBtn) {
      dropdownBtn.addEventListener('click', () => this.toggle())
    }

    // Tag remove buttons
    const removeBtns = this.container.querySelectorAll('.combobox-tag-remove')
    removeBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const value = (e.target as HTMLElement).closest('[data-value]')?.getAttribute('data-value')
        if (value !== null && value !== undefined) {
          this.deselectOption(value)
        }
      })
    })

    // Option clicks
    if (this.listboxRef) {
      this.listboxRef.addEventListener('click', (e) => this.handleOptionClick(e))
      this.listboxRef.addEventListener('mouseover', (e) => this.handleOptionHover(e))
    }

    // Document click for closing dropdown
    this.documentClickHandler = (e: MouseEvent) => {
      if (!this.container.contains(e.target as Node)) {
        this.close()
      }
    }
    document.addEventListener('click', this.documentClickHandler)
  }

  private handleInputFocus(): void {
    if (!this.state.isOpen) {
      this.open()
    }
  }

  private handleInput(e: Event): void {
    const input = e.target as HTMLInputElement
    const value = input.value

    this.state.inputValue = value
    this.callbacks.onInputChange?.(value, this.state)

    if (this.config.loadOptions) {
      this.loadOptionsAsync(value)
    } else {
      this.updateFilteredOptions()
    }

    if (!this.state.isOpen) {
      this.open()
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (!this.state.isOpen) {
          this.open()
        } else {
          this.highlightNext()
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        if (this.state.isOpen) {
          this.highlightPrevious()
        }
        break
      case 'Enter':
        e.preventDefault()
        if (this.state.isOpen && this.state.highlightedIndex >= 0) {
          this.selectHighlighted()
        }
        break
      case 'Escape':
        e.preventDefault()
        this.close()
        break
      case 'Tab':
        this.close()
        break
      case 'Backspace':
        if (this.config.mode === 'multi' && !this.state.inputValue) {
          this.removeLastSelected()
        }
        break
    }
  }

  private handleClear(): void {
    this.clearSelection()
  }

  private handleOptionClick(e: MouseEvent): void {
    const target = e.target as HTMLElement
    const optionEl = target.closest('.combobox-option') as HTMLElement
    if (!optionEl) return

    const value = optionEl.getAttribute('data-value')
    if (value === null) return

    const option = this.state.filteredOptions.find((opt) => String(opt.value) === value)
    if (!option || option.disabled) return

    this.selectOption(option.value)
  }

  private handleOptionHover(e: MouseEvent): void {
    const target = e.target as HTMLElement
    const optionEl = target.closest('.combobox-option') as HTMLElement
    if (!optionEl) return

    const index = parseInt(optionEl.getAttribute('data-index') ?? '-1')
    if (index >= 0) {
      this.highlightOption(index)
    }
  }

  // ===========================================================================
  // Private Methods - Selection
  // ===========================================================================

  private selectOption(value: string | number): void {
    if (this.config.mode === 'single') {
      // Single: replace selection
      this.setState({
        selectedValues: [value],
        inputValue: '',
        isOpen: false,
      })
    } else {
      // Multi: add to selection
      if (this.state.selectedValues.includes(value)) {
        // Already selected, deselect
        this.deselectOption(value)
        return
      }

      const maxSelections = this.config.maxSelections
      if (maxSelections && this.state.selectedValues.length >= maxSelections) {
        return
      }

      this.setState({
        selectedValues: [...this.state.selectedValues, value],
        inputValue: '',
      })
    }

    this.callbacks.onChange?.(this.state.selectedValues, this.state)
  }

  private deselectOption(value: string | number): void {
    this.setState({
      selectedValues: this.state.selectedValues.filter((v) => String(v) !== String(value)),
    })
    this.callbacks.onChange?.(this.state.selectedValues, this.state)
  }

  private clearSelection(): void {
    this.setState({ selectedValues: [], inputValue: '' })
    this.callbacks.onChange?.(this.state.selectedValues, this.state)
  }

  private selectHighlighted(): void {
    if (this.state.highlightedIndex < 0) return
    const option = this.state.filteredOptions[this.state.highlightedIndex]
    if (!option || option.disabled) return
    this.selectOption(option.value)
  }

  private removeLastSelected(): void {
    if (this.state.selectedValues.length === 0) return
    const lastValue = this.state.selectedValues[this.state.selectedValues.length - 1]
    this.deselectOption(lastValue)
  }

  // ===========================================================================
  // Private Methods - Highlighting
  // ===========================================================================

  private highlightNext(): void {
    let nextIndex = this.state.highlightedIndex + 1
    while (nextIndex < this.state.filteredOptions.length) {
      if (!this.state.filteredOptions[nextIndex].disabled) {
        this.highlightOption(nextIndex)
        return
      }
      nextIndex++
    }
  }

  private highlightPrevious(): void {
    let prevIndex = this.state.highlightedIndex - 1
    while (prevIndex >= 0) {
      if (!this.state.filteredOptions[prevIndex].disabled) {
        this.highlightOption(prevIndex)
        return
      }
      prevIndex--
    }
  }

  private highlightOption(index: number): void {
    if (index < 0 || index >= this.state.filteredOptions.length) return

    const prevIndex = this.state.highlightedIndex
    this.state.highlightedIndex = index

    // Update highlight without full re-render
    if (this.listboxRef) {
      // Remove previous highlight
      if (prevIndex >= 0) {
        const prevEl = this.listboxRef.querySelector(`[data-index="${prevIndex}"]`)
        prevEl?.classList.remove('highlighted')
      }
      // Add new highlight
      const newEl = this.listboxRef.querySelector(`[data-index="${index}"]`)
      newEl?.classList.add('highlighted')

      // Update aria-activedescendant on input
      if (this.inputRef) {
        this.inputRef.setAttribute(
          'aria-activedescendant',
          `${this.instanceId}-option-${index}`
        )
      }

      // Scroll into view (check if method exists for jsdom compatibility)
      if (newEl && typeof (newEl as HTMLElement).scrollIntoView === 'function') {
        ;(newEl as HTMLElement).scrollIntoView({ block: 'nearest' })
      }
    }

    const option = this.state.filteredOptions[index]
    this.callbacks.onHighlight?.(option, this.state)
  }

  // ===========================================================================
  // Static Field Renderer
  // ===========================================================================

  /**
   * コンボボックスフィールドをHTMLとしてレンダリング（静的メソッド）
   * SSR/初期レンダリング用
   *
   * @param field - コンボボックスフィールド定義
   * @returns 生成されたHTML文字列
   */
  static renderField(field: ComboboxField): string {
    const attrs: string[] = [
      `id="${escapeHtml(field.id)}"`,
      `name="${escapeHtml(field.id)}"`,
      'role="combobox"',
      'aria-haspopup="listbox"',
      'aria-expanded="false"',
    ]

    if (field.required) {
      attrs.push('required')
    }
    if (field.disabled) {
      attrs.push('disabled')
    }
    if (field.placeholder) {
      attrs.push(`placeholder="${escapeHtml(field.placeholder)}"`)
    }

    const options = getOptions(field.options ?? [])
    const optionListId = `${field.id}-listbox`
    attrs.push(`aria-controls="${optionListId}"`)

    // オプションリストをhidden datalistとして準備
    const optionHtml = options
      .map((opt, index) => {
        const disabled = opt.disabled ? 'aria-disabled="true"' : ''
        return `
          <div
            role="option"
            id="${escapeHtml(field.id)}-option-${index}"
            data-value="${escapeHtml(String(opt.value))}"
            ${disabled}
          >
            ${escapeHtml(opt.label)}
          </div>
        `
      })
      .join('')

    const content = `
      <div class="combobox-wrapper" data-state="closed">
        <div class="combobox-control">
          <input type="text" class="combobox-input" ${attrs.join(' ')} />
          <button type="button" class="combobox-dropdown-indicator" aria-label="Open options">▼</button>
        </div>
        <div role="listbox" id="${optionListId}" class="combobox-dropdown" hidden>
          ${optionHtml}
        </div>
      </div>
    `
    return createFieldWrapper(field, content)
  }
}

/**
 * Dropdown Component
 * ドロップダウンコンポーネント
 *
 * 3つのバリアント:
 * - MenuButton: アクションメニュー
 * - FilterDropdown: フィルター操作
 * - SortDropdown: 並び替え操作
 */

import { createElement, generateId } from '../utils/dom'

// =============================================================================
// Types
// =============================================================================

/**
 * ドロップダウンメニュー項目の基本型
 */
interface BaseMenuItem {
  /** 項目ID */
  id: string
  /** 項目ラベル */
  label: string
  /** アイコン（オプション） */
  icon?: string
  /** 無効化 */
  disabled?: boolean
}

/**
 * アクションメニュー項目
 */
export interface ActionMenuItem extends BaseMenuItem {
  type: 'action'
  /** クリック時のハンドラー */
  onAction?: (id: string) => void
}

/**
 * 区切り線
 */
export interface DividerMenuItem {
  type: 'divider'
  /** 一意なID（必須） */
  id: string
}

/**
 * フィルター項目
 */
export interface FilterMenuItem extends BaseMenuItem {
  type: 'filter'
  /** フィルター値 */
  value: string
  /** 選択状態 */
  selected?: boolean
}

/**
 * ソート項目
 */
export interface SortMenuItem extends BaseMenuItem {
  type: 'sort'
  /** ソートフィールド */
  field: string
  /** ソート方向 */
  direction?: 'asc' | 'desc'
}

/**
 * 全てのメニュー項目のユニオン型
 */
export type MenuItem = ActionMenuItem | DividerMenuItem | FilterMenuItem | SortMenuItem

/**
 * ドロップダウンのバリアント
 */
export type DropdownVariant = 'menu' | 'filter' | 'sort'

/**
 * ドロップダウンの配置
 */
export type DropdownPlacement = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'

/**
 * ドロップダウンの状態
 */
export interface DropdownState {
  /** 開閉状態 */
  isOpen: boolean
  /** メニュー項目 */
  items: MenuItem[]
  /** 選択されたフィルター（FilterDropdown用） */
  selectedFilters?: string[]
  /** 現在のソート（SortDropdown用） */
  currentSort?: {
    field: string
    direction: 'asc' | 'desc'
  }
  /** フォーカスされている項目のインデックス */
  focusedIndex: number
}

/**
 * ドロップダウンのコールバック
 */
export interface DropdownCallbacks {
  /** 開閉状態変更時 */
  onOpenChange?: (isOpen: boolean) => void
  /** メニュー項目選択時 */
  onSelect?: (item: MenuItem) => void
  /** フィルター適用時（FilterDropdown用） */
  onApply?: (selectedFilters: string[]) => void
  /** フィルタークリア時（FilterDropdown用） */
  onReset?: () => void
  /** ソート変更時（SortDropdown用） */
  onSortChange?: (field: string, direction: 'asc' | 'desc') => void
}

/**
 * ドロップダウンの設定
 */
export interface DropdownConfig {
  /** バリアント */
  variant?: DropdownVariant
  /** トリガーボタンのラベル */
  triggerLabel: string
  /** トリガーボタンのアイコン */
  triggerIcon?: string
  /** メニュー項目 */
  items: MenuItem[]
  /** 配置 */
  placement?: DropdownPlacement
  /** トリガーサイズ */
  triggerSize?: 's' | 'default'
  /** アイコンのみのトリガー */
  onlyIconTrigger?: boolean
  /** 初期開閉状態 */
  defaultOpen?: boolean
  /** フィルター状態（FilterDropdown用） */
  isFiltered?: boolean
  /** モーダル表示（モバイル用、将来実装） */
  useModal?: boolean
}

// =============================================================================
// Dropdown Class
// =============================================================================

/**
 * ドロップダウンコンポーネント
 */
export class Dropdown {
  private config: DropdownConfig
  private state: DropdownState
  private callbacks: DropdownCallbacks
  private container: HTMLElement
  private instanceId: string
  private triggerElement: HTMLElement | null = null
  private contentElement: HTMLElement | null = null
  private clickOutsideHandler: ((e: MouseEvent) => void) | null = null
  private keyboardHandler: ((e: KeyboardEvent) => void) | null = null

  constructor(
    container: HTMLElement,
    config: DropdownConfig,
    callbacks: DropdownCallbacks = {}
  ) {
    this.config = config
    this.container = container
    this.callbacks = callbacks
    this.instanceId = generateId('dropdown')
    this.state = this.createInitialState()
  }

  // ===========================================================================
  // Public Methods
  // ===========================================================================

  /**
   * ドロップダウンをレンダリング
   */
  render(): void {
    this.container.innerHTML = ''

    const variant = this.config.variant ?? 'menu'
    const placement = this.config.placement ?? 'bottom-start'
    const triggerSize = this.config.triggerSize ?? 'default'

    this.container.className = `mokkun-dropdown dropdown-${variant} dropdown-${placement} dropdown-trigger-${triggerSize}`
    // Ensure overflow is visible for dropdown menu to be visible outside container
    this.container.style.overflow = 'visible'

    if (this.state.isOpen) {
      this.container.setAttribute('data-state', 'open')
    } else {
      this.container.setAttribute('data-state', 'closed')
    }

    const wrapper = createElement('div', { className: 'dropdown-wrapper' })

    // トリガーボタン
    this.triggerElement = this.renderTrigger()
    wrapper.appendChild(this.triggerElement)

    // ドロップダウンコンテンツ
    if (this.state.isOpen) {
      this.contentElement = this.renderContent()
      wrapper.appendChild(this.contentElement)
      this.attachEventListeners()

      // 初回オープン時に最初の項目にフォーカスを設定（再レンダリングなし）
      if (this.state.focusedIndex === -1) {
        this.initializeFocus()
      }
    } else {
      this.contentElement = null
      this.detachEventListeners()
    }

    this.container.appendChild(wrapper)
  }

  /**
   * 開閉状態を切り替え
   */
  toggle(): void {
    this.setOpen(!this.state.isOpen)
  }

  /**
   * 開く
   */
  open(): void {
    this.setOpen(true)
  }

  /**
   * 閉じる
   */
  close(): void {
    this.setOpen(false)
  }

  /**
   * 開閉状態を設定
   */
  setOpen(isOpen: boolean): void {
    if (this.state.isOpen === isOpen) {
      return
    }

    this.state = {
      ...this.state,
      isOpen,
      focusedIndex: -1,
    }

    this.render()
    this.callbacks.onOpenChange?.(isOpen)
  }

  /**
   * 状態を取得
   */
  getState(): DropdownState {
    return { ...this.state }
  }

  /**
   * メニュー項目を更新
   */
  setItems(items: MenuItem[]): void {
    this.state = {
      ...this.state,
      items,
    }

    if (this.state.isOpen) {
      this.render()
    }
  }

  /**
   * コンポーネントを破棄
   */
  destroy(): void {
    this.detachEventListeners()
    this.container.innerHTML = ''
  }

  // ===========================================================================
  // Private Methods - Initialization
  // ===========================================================================

  private createInitialState(): DropdownState {
    const defaultOpen = this.config.defaultOpen ?? false

    return {
      isOpen: defaultOpen,
      items: this.config.items,
      selectedFilters:
        this.config.variant === 'filter'
          ? this.config.items
              .filter((item): item is FilterMenuItem => item.type === 'filter' && item.selected === true)
              .map((item) => item.value)
          : undefined,
      currentSort: undefined,
      focusedIndex: -1,
    }
  }

  // ===========================================================================
  // Private Methods - Rendering
  // ===========================================================================

  private renderTrigger(): HTMLElement {
    const onlyIcon = this.config.onlyIconTrigger ?? false
    const triggerSize = this.config.triggerSize ?? 'default'
    const isFiltered = this.config.isFiltered ?? false

    const button = createElement('button', {
      className: `dropdown-trigger dropdown-trigger-${triggerSize}${isFiltered ? ' is-filtered' : ''}`,
      attributes: {
        type: 'button',
        'aria-haspopup': 'true',
        'aria-expanded': String(this.state.isOpen),
        'aria-controls': `${this.instanceId}-content`,
        id: `${this.instanceId}-trigger`,
      },
    })

    // アイコン
    if (this.config.triggerIcon) {
      const icon = createElement('span', {
        className: 'dropdown-trigger-icon',
      })
      icon.innerHTML = this.config.triggerIcon
      button.appendChild(icon)
    }

    // ラベル（アイコンのみモードでは非表示）
    if (!onlyIcon) {
      const label = createElement('span', {
        className: 'dropdown-trigger-label',
        textContent: this.config.triggerLabel,
      })
      button.appendChild(label)
    }

    // キャレット（下向き矢印）
    const caret = createElement('span', {
      className: 'dropdown-trigger-caret',
      textContent: '▼',
    })
    caret.setAttribute('aria-hidden', 'true')
    button.appendChild(caret)

    button.addEventListener('click', () => {
      this.toggle()
    })

    return button
  }

  private renderContent(): HTMLElement {
    const variant = this.config.variant ?? 'menu'
    const placement = this.config.placement ?? 'bottom-start'

    const content = createElement('div', {
      className: `dropdown-content dropdown-content-${placement}`,
      attributes: {
        role: 'menu',
        'aria-labelledby': `${this.instanceId}-trigger`,
        id: `${this.instanceId}-content`,
      },
    })

    if (variant === 'filter') {
      this.renderFilterContent(content)
    } else {
      this.renderMenuContent(content)
    }

    return content
  }

  private renderMenuContent(container: HTMLElement): void {
    const menu = createElement('div', { className: 'dropdown-menu', attributes: { role: 'menu' } })

    this.state.items.forEach((item, index) => {
      if (item.type === 'divider') {
        menu.appendChild(this.renderDivider())
      } else {
        menu.appendChild(this.renderMenuItem(item, index))
      }
    })

    container.appendChild(menu)
  }

  private renderFilterContent(container: HTMLElement): void {
    const filterContent = createElement('div', { className: 'dropdown-filter-content' })

    // フィルター項目
    const menu = createElement('div', { className: 'dropdown-menu', attributes: { role: 'menu' } })

    const filterItems = this.state.items.filter((item): item is FilterMenuItem => item.type === 'filter')

    filterItems.forEach((item, index) => {
      menu.appendChild(this.renderFilterItem(item, index))
    })

    filterContent.appendChild(menu)

    // アクションボタン
    const actions = createElement('div', { className: 'dropdown-filter-actions' })

    const resetButton = createElement('button', {
      className: 'dropdown-filter-button dropdown-filter-reset',
      textContent: 'クリア',
      attributes: { type: 'button' },
    })

    resetButton.addEventListener('click', () => {
      this.handleFilterReset()
    })

    const applyButton = createElement('button', {
      className: 'dropdown-filter-button dropdown-filter-apply',
      textContent: '適用',
      attributes: { type: 'button' },
    })

    applyButton.addEventListener('click', () => {
      this.handleFilterApply()
    })

    actions.appendChild(resetButton)
    actions.appendChild(applyButton)

    filterContent.appendChild(actions)
    container.appendChild(filterContent)
  }

  private renderMenuItem(item: ActionMenuItem | FilterMenuItem | SortMenuItem, index: number): HTMLElement {
    const menuItem = createElement('div', {
      className: `dropdown-menu-item${item.disabled ? ' is-disabled' : ''}${this.state.focusedIndex === index ? ' is-focused' : ''}`,
      attributes: {
        role: 'menuitem',
        tabindex: String(item.disabled ? -1 : 0),
        'aria-disabled': item.disabled ? 'true' : 'false',
        'data-index': String(index),
      },
    })

    // アイコン
    if (item.icon) {
      const icon = createElement('span', {
        className: 'dropdown-menu-item-icon',
      })
      icon.innerHTML = item.icon
      menuItem.appendChild(icon)
    }

    // ラベル
    const label = createElement('span', {
      className: 'dropdown-menu-item-label',
      textContent: item.label,
    })
    menuItem.appendChild(label)

    // ソート方向インジケーター（SortDropdown用）
    if (item.type === 'sort' && this.state.currentSort?.field === item.field) {
      const indicator = createElement('span', {
        className: 'dropdown-menu-item-sort-indicator',
        textContent: this.state.currentSort.direction === 'asc' ? '↑' : '↓',
      })
      menuItem.appendChild(indicator)
    }

    if (!item.disabled) {
      menuItem.addEventListener('click', () => {
        this.handleItemClick(item)
      })
    }

    return menuItem
  }

  private renderFilterItem(item: FilterMenuItem, index: number): HTMLElement {
    const isSelected = this.state.selectedFilters?.includes(item.value) ?? false

    const menuItem = createElement('label', {
      className: `dropdown-menu-item dropdown-filter-item${item.disabled ? ' is-disabled' : ''}${isSelected ? ' is-selected' : ''}${this.state.focusedIndex === index ? ' is-focused' : ''}`,
      attributes: {
        tabindex: String(item.disabled ? -1 : 0),
        'data-index': String(index),
      },
    })

    // チェックボックス
    const checkbox = createElement('input', {
      className: 'dropdown-filter-checkbox',
      attributes: {
        type: 'checkbox',
        value: item.value,
      },
    }) as HTMLInputElement

    if (isSelected) {
      checkbox.checked = true
    }

    if (item.disabled) {
      checkbox.disabled = true
    }

    checkbox.addEventListener('change', () => {
      this.handleFilterChange(item.value, checkbox.checked)
    })

    menuItem.appendChild(checkbox)

    // アイコン
    if (item.icon) {
      const icon = createElement('span', {
        className: 'dropdown-menu-item-icon',
      })
      icon.innerHTML = item.icon
      menuItem.appendChild(icon)
    }

    // ラベル
    const label = createElement('span', {
      className: 'dropdown-menu-item-label',
      textContent: item.label,
    })
    menuItem.appendChild(label)

    return menuItem
  }

  private renderDivider(): HTMLElement {
    return createElement('div', {
      className: 'dropdown-divider',
      attributes: {
        role: 'separator',
      },
    })
  }

  // ===========================================================================
  // Private Methods - Event Handlers
  // ===========================================================================

  private handleItemClick(item: MenuItem): void {
    if (item.type === 'divider') {
      return
    }

    this.callbacks.onSelect?.(item)

    if (item.type === 'action') {
      item.onAction?.(item.id)
      this.close()
    } else if (item.type === 'sort') {
      const newDirection = this.state.currentSort?.field === item.field && this.state.currentSort.direction === 'asc' ? 'desc' : 'asc'

      this.state = {
        ...this.state,
        currentSort: {
          field: item.field,
          direction: newDirection,
        },
      }

      this.callbacks.onSortChange?.(item.field, newDirection)
      this.close()
    }
  }

  private handleFilterChange(value: string, checked: boolean): void {
    const selectedFilters = this.state.selectedFilters ?? []

    if (checked) {
      this.state = {
        ...this.state,
        selectedFilters: [...selectedFilters, value],
      }
    } else {
      this.state = {
        ...this.state,
        selectedFilters: selectedFilters.filter((v) => v !== value),
      }
    }
  }

  private handleFilterApply(): void {
    this.callbacks.onApply?.(this.state.selectedFilters ?? [])
    this.close()
  }

  private handleFilterReset(): void {
    this.state = {
      ...this.state,
      selectedFilters: [],
    }

    this.render()
    this.callbacks.onReset?.()
  }

  private handleClickOutside(event: MouseEvent): void {
    const target = event.target as Node

    if (!this.container.contains(target)) {
      this.close()
    }
  }

  private handleKeyboard(event: KeyboardEvent): void {
    if (!this.state.isOpen) {
      return
    }

    const actionableItems = this.state.items.filter(
      (item) => item.type !== 'divider' && !(item as ActionMenuItem).disabled
    )

    switch (event.key) {
      case 'Escape':
        event.preventDefault()
        this.close()
        this.triggerElement?.focus()
        break

      case 'ArrowDown':
        event.preventDefault()
        this.focusNextItem(actionableItems.length)
        break

      case 'ArrowUp':
        event.preventDefault()
        this.focusPreviousItem(actionableItems.length)
        break

      case 'Home':
        event.preventDefault()
        this.focusFirstItem()
        break

      case 'End':
        event.preventDefault()
        this.focusLastItem(actionableItems.length)
        break

      case 'Enter':
      case ' ':
        event.preventDefault()
        this.selectFocusedItem()
        break
    }
  }

  // ===========================================================================
  // Private Methods - Focus Management
  // ===========================================================================

  /**
   * 初回オープン時のフォーカス設定（再レンダリングなし）
   */
  private initializeFocus(): void {
    const actionableItems = this.state.items.filter(
      (item) => item.type !== 'divider' && !(item as ActionMenuItem).disabled
    )

    if (actionableItems.length === 0) {
      return
    }

    const firstIndex = this.state.items.indexOf(actionableItems[0])

    // 状態を更新するが、再レンダリングしない
    this.state = {
      ...this.state,
      focusedIndex: firstIndex,
    }

    // DOMが構築された後にフォーカスを移動
    const focusedElement = this.contentElement?.querySelector(`[data-index="${firstIndex}"]`) as HTMLElement
    focusedElement?.focus()
  }

  private focusFirstItem(): void {
    const actionableItems = this.state.items.filter(
      (item) => item.type !== 'divider' && !(item as ActionMenuItem).disabled
    )

    if (actionableItems.length === 0) {
      return
    }

    const firstIndex = this.state.items.indexOf(actionableItems[0])
    this.setFocusedIndex(firstIndex)
  }

  private focusLastItem(actionableCount: number): void {
    if (actionableCount === 0) {
      return
    }

    const actionableItems = this.state.items.filter(
      (item) => item.type !== 'divider' && !(item as ActionMenuItem).disabled
    )

    const lastIndex = this.state.items.indexOf(actionableItems[actionableItems.length - 1])
    this.setFocusedIndex(lastIndex)
  }

  private focusNextItem(actionableCount: number): void {
    if (actionableCount === 0) {
      return
    }

    const actionableItems = this.state.items.filter(
      (item) => item.type !== 'divider' && !(item as ActionMenuItem).disabled
    )

    const currentActionableIndex = actionableItems.findIndex((item) => this.state.items.indexOf(item) === this.state.focusedIndex)

    const nextActionableIndex = (currentActionableIndex + 1) % actionableCount
    const nextIndex = this.state.items.indexOf(actionableItems[nextActionableIndex])

    this.setFocusedIndex(nextIndex)
  }

  private focusPreviousItem(actionableCount: number): void {
    if (actionableCount === 0) {
      return
    }

    const actionableItems = this.state.items.filter(
      (item) => item.type !== 'divider' && !(item as ActionMenuItem).disabled
    )

    const currentActionableIndex = actionableItems.findIndex((item) => this.state.items.indexOf(item) === this.state.focusedIndex)

    const previousActionableIndex = currentActionableIndex <= 0 ? actionableCount - 1 : currentActionableIndex - 1
    const previousIndex = this.state.items.indexOf(actionableItems[previousActionableIndex])

    this.setFocusedIndex(previousIndex)
  }

  private setFocusedIndex(index: number): void {
    this.state = {
      ...this.state,
      focusedIndex: index,
    }

    this.render()

    // フォーカスされた要素にフォーカスを移動
    const focusedElement = this.contentElement?.querySelector(`[data-index="${index}"]`) as HTMLElement
    focusedElement?.focus()
  }

  private selectFocusedItem(): void {
    if (this.state.focusedIndex === -1) {
      return
    }

    const item = this.state.items[this.state.focusedIndex]

    if (item && item.type !== 'divider') {
      this.handleItemClick(item)
    }
  }

  // ===========================================================================
  // Private Methods - Event Listeners
  // ===========================================================================

  private attachEventListeners(): void {
    this.clickOutsideHandler = this.handleClickOutside.bind(this)
    this.keyboardHandler = this.handleKeyboard.bind(this)

    setTimeout(() => {
      document.addEventListener('click', this.clickOutsideHandler!)
      document.addEventListener('keydown', this.keyboardHandler!)
    }, 0)
  }

  private detachEventListeners(): void {
    if (this.clickOutsideHandler) {
      document.removeEventListener('click', this.clickOutsideHandler)
      this.clickOutsideHandler = null
    }

    if (this.keyboardHandler) {
      document.removeEventListener('keydown', this.keyboardHandler)
      this.keyboardHandler = null
    }
  }
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * ドロップダウンを作成（ファクトリー関数）
 */
export function createDropdown(
  container: HTMLElement,
  config: DropdownConfig,
  callbacks?: DropdownCallbacks
): Dropdown {
  const dropdown = new Dropdown(container, config, callbacks)
  dropdown.render()
  return dropdown
}

/**
 * メニューボタンを作成
 */
export function createMenuButton(
  container: HTMLElement,
  config: Omit<DropdownConfig, 'variant'>,
  callbacks?: DropdownCallbacks
): Dropdown {
  return createDropdown(container, { ...config, variant: 'menu' }, callbacks)
}

/**
 * フィルタードロップダウンを作成
 */
export function createFilterDropdown(
  container: HTMLElement,
  config: Omit<DropdownConfig, 'variant'>,
  callbacks?: DropdownCallbacks
): Dropdown {
  return createDropdown(container, { ...config, variant: 'filter' }, callbacks)
}

/**
 * ソートドロップダウンを作成
 */
export function createSortDropdown(
  container: HTMLElement,
  config: Omit<DropdownConfig, 'variant'>,
  callbacks?: DropdownCallbacks
): Dropdown {
  return createDropdown(container, { ...config, variant: 'sort' }, callbacks)
}

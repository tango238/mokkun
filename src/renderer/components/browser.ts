/**
 * Browser Component
 * 階層構造を持つデータの中から項目を単一選択するコンポーネント
 *
 * https://smarthr.design/products/components/browser/
 *
 * 機能:
 * - 階層的なデータの表示
 * - 複数カラム表示（最大3列）
 * - キーボードナビゲーション
 * - 単一選択
 * - アクセシビリティ対応（ARIA属性）
 *
 * 用途:
 * - カテゴリ選択
 * - ファイルブラウジング
 * - 組織階層の選択
 */

import { createElement, generateId } from '../utils/dom'
import { createFieldWrapper } from '../utils/field-helpers'
import type { InputField } from '../../types/schema'

// =============================================================================
// Types
// =============================================================================

/**
 * Browserアイテムの定義
 */
export interface BrowserItem {
  /** アイテムの値（一意） */
  value: string
  /** 表示ラベル */
  label: string
  /** 子アイテム */
  children?: BrowserItem[]
  /** 無効化 */
  disabled?: boolean
}

/**
 * Browserの状態
 */
export interface BrowserState {
  /** 選択中のアイテムのvalue */
  selectedValue: string | null
  /** 選択パス（ルートからのvalue配列） */
  selectedPath: string[]
  /** フォーカス中のカラムインデックス */
  focusedColumnIndex: number
  /** 各カラムでフォーカス中のアイテムのインデックス */
  focusedItemIndexes: number[]
}

/**
 * Browserのコールバック
 */
export interface BrowserCallbacks {
  /** アイテム選択時 */
  onSelect?: (value: string, path: string[], item: BrowserItem) => void
  /** 選択変更時 */
  onChange?: (value: string | null, path: string[]) => void
}

/**
 * Browserの設定
 */
export interface BrowserConfig {
  /** アイテムの配列 */
  items: BrowserItem[]
  /** 初期選択値 */
  defaultValue?: string
  /** ID属性 */
  id?: string
  /** カスタムCSSクラス */
  className?: string
  /** 最大カラム数（デフォルト: 3） */
  maxColumns?: number
  /** 高さ（デフォルト: 'auto'） */
  height?: string
}

/**
 * 内部用: カラムデータ
 */
interface ColumnData {
  items: BrowserItem[]
  parentValue: string | null
}

// =============================================================================
// Browser Class
// =============================================================================

/**
 * Browserコンポーネント
 */
export class Browser {
  private config: BrowserConfig
  private state: BrowserState
  private callbacks: BrowserCallbacks
  private container: HTMLElement
  private instanceId: string
  private columnsWrapper: HTMLElement | null = null
  private itemsMap: Map<string, BrowserItem> = new Map()
  private parentMap: Map<string, string | null> = new Map()

  constructor(
    container: HTMLElement,
    config: BrowserConfig,
    callbacks: BrowserCallbacks = {}
  ) {
    this.config = config
    this.container = container
    this.callbacks = callbacks
    this.instanceId = config.id ?? generateId('browser')

    // アイテムマップを構築
    this.buildItemsMap(config.items, null)

    // 初期状態
    const initialPath = config.defaultValue
      ? this.getPathToValue(config.defaultValue)
      : []

    this.state = {
      selectedValue: config.defaultValue ?? null,
      selectedPath: initialPath,
      focusedColumnIndex: 0,
      focusedItemIndexes: new Array(config.maxColumns ?? 3).fill(0),
    }
  }

  // ===========================================================================
  // Public Methods
  // ===========================================================================

  /**
   * Browserをレンダリング
   */
  render(): void {
    this.container.innerHTML = ''

    this.container.className = [
      'mokkun-browser',
      this.config.className ?? '',
    ]
      .filter(Boolean)
      .join(' ')

    this.container.id = this.instanceId
    this.container.setAttribute('role', 'application')
    this.container.setAttribute('aria-label', '階層ブラウザ')

    if (this.config.height && this.config.height !== 'auto') {
      this.container.style.height = this.config.height
    }

    // カラムラッパー
    this.columnsWrapper = createElement('div', {
      className: 'browser-columns',
    })

    // キーボードイベント
    this.container.addEventListener('keydown', this.handleKeyDown.bind(this))

    this.container.appendChild(this.columnsWrapper)
    this.renderColumns()
  }

  /**
   * 値を選択
   */
  selectValue(value: string): void {
    const item = this.itemsMap.get(value)
    if (!item || item.disabled) return

    const path = this.getPathToValue(value)
    this.state = {
      ...this.state,
      selectedValue: value,
      selectedPath: path,
    }

    this.renderColumns()
    this.callbacks.onSelect?.(value, path, item)
    this.callbacks.onChange?.(value, path)
  }

  /**
   * 選択をクリア
   */
  clearSelection(): void {
    this.state = {
      ...this.state,
      selectedValue: null,
      selectedPath: [],
    }

    this.renderColumns()
    this.callbacks.onChange?.(null, [])
  }

  /**
   * 現在の選択値を取得
   */
  getValue(): string | null {
    return this.state.selectedValue
  }

  /**
   * 現在の選択パスを取得
   */
  getPath(): string[] {
    return [...this.state.selectedPath]
  }

  /**
   * 現在の状態を取得
   */
  getState(): BrowserState {
    return { ...this.state }
  }

  /**
   * アイテムを更新
   */
  setItems(items: BrowserItem[]): void {
    this.config = { ...this.config, items }
    this.itemsMap.clear()
    this.parentMap.clear()
    this.buildItemsMap(items, null)

    // 選択値が新しいアイテムに存在しなければクリア
    if (this.state.selectedValue && !this.itemsMap.has(this.state.selectedValue)) {
      this.state = {
        ...this.state,
        selectedValue: null,
        selectedPath: [],
      }
    }

    this.renderColumns()
  }

  /**
   * コンポーネントを破棄
   */
  destroy(): void {
    this.container.innerHTML = ''
    this.columnsWrapper = null
    this.itemsMap.clear()
    this.parentMap.clear()
  }

  // ===========================================================================
  // Private Methods - Data
  // ===========================================================================

  private buildItemsMap(items: BrowserItem[], parentValue: string | null): void {
    for (const item of items) {
      this.itemsMap.set(item.value, item)
      this.parentMap.set(item.value, parentValue)

      if (item.children && item.children.length > 0) {
        this.buildItemsMap(item.children, item.value)
      }
    }
  }

  private getPathToValue(value: string): string[] {
    const path: string[] = []
    let currentValue: string | null = value

    while (currentValue !== null) {
      path.unshift(currentValue)
      currentValue = this.parentMap.get(currentValue) ?? null
    }

    return path
  }

  private getColumnsData(): ColumnData[] {
    const columns: ColumnData[] = []
    const maxColumns = this.config.maxColumns ?? 3

    // 最初のカラムはルートアイテム
    columns.push({
      items: this.config.items,
      parentValue: null,
    })

    // 選択パスに基づいて追加カラムを生成
    for (let i = 0; i < this.state.selectedPath.length && columns.length < maxColumns; i++) {
      const selectedValue = this.state.selectedPath[i]
      const item = this.itemsMap.get(selectedValue)

      if (item?.children && item.children.length > 0) {
        columns.push({
          items: item.children,
          parentValue: selectedValue,
        })
      }
    }

    return columns
  }

  // ===========================================================================
  // Private Methods - Rendering
  // ===========================================================================

  private renderColumns(): void {
    if (!this.columnsWrapper) return

    this.columnsWrapper.innerHTML = ''
    const columnsData = this.getColumnsData()

    columnsData.forEach((columnData, columnIndex) => {
      const column = this.renderColumn(columnData, columnIndex)
      this.columnsWrapper!.appendChild(column)
    })
  }

  private renderColumn(columnData: ColumnData, columnIndex: number): HTMLElement {
    const column = createElement('div', {
      className: 'browser-column',
      attributes: {
        role: 'listbox',
        'aria-label': `カラム ${columnIndex + 1}`,
        'data-column-index': String(columnIndex),
      },
    })

    columnData.items.forEach((item, itemIndex) => {
      const itemElement = this.renderItem(item, columnIndex, itemIndex)
      column.appendChild(itemElement)
    })

    return column
  }

  private renderItem(item: BrowserItem, columnIndex: number, itemIndex: number): HTMLElement {
    const isSelected = this.state.selectedPath.includes(item.value)
    const isLeafSelected = this.state.selectedValue === item.value
    const hasChildren = item.children && item.children.length > 0
    const isFocused = this.state.focusedColumnIndex === columnIndex &&
                      this.state.focusedItemIndexes[columnIndex] === itemIndex

    const itemWrapper = createElement('label', {
      className: [
        'browser-item',
        isSelected ? 'is-selected' : '',
        isLeafSelected ? 'is-leaf-selected' : '',
        item.disabled ? 'is-disabled' : '',
        isFocused ? 'is-focused' : '',
      ].filter(Boolean).join(' '),
      attributes: {
        'data-value': item.value,
        'data-column': String(columnIndex),
        'data-index': String(itemIndex),
      },
    })

    // ラジオボタン（非表示）
    const radio = document.createElement('input')
    radio.type = 'radio'
    radio.name = `${this.instanceId}-column-${columnIndex}`
    radio.value = item.value
    radio.checked = isSelected
    radio.disabled = item.disabled ?? false
    radio.tabIndex = isFocused ? 0 : -1
    radio.className = 'browser-item-radio'
    radio.setAttribute('aria-label', item.label)

    radio.addEventListener('change', () => {
      if (!item.disabled) {
        this.handleItemSelect(item, columnIndex, itemIndex)
      }
    })

    radio.addEventListener('focus', () => {
      this.state = {
        ...this.state,
        focusedColumnIndex: columnIndex,
        focusedItemIndexes: this.state.focusedItemIndexes.map((idx, i) =>
          i === columnIndex ? itemIndex : idx
        ),
      }
    })

    itemWrapper.appendChild(radio)

    // ラベルコンテナ
    const labelContainer = createElement('span', {
      className: 'browser-item-content',
    })

    // ラベルテキスト
    const labelText = createElement('span', {
      className: 'browser-item-label',
      textContent: item.label,
    })
    labelContainer.appendChild(labelText)

    // 子要素がある場合は矢印アイコン
    if (hasChildren) {
      const arrow = this.renderArrowIcon()
      labelContainer.appendChild(arrow)
    }

    itemWrapper.appendChild(labelContainer)

    // クリックイベント
    itemWrapper.addEventListener('click', (e) => {
      if (item.disabled) {
        e.preventDefault()
        return
      }
      this.handleItemSelect(item, columnIndex, itemIndex)
    })

    return itemWrapper
  }

  private renderArrowIcon(): HTMLElement {
    const icon = createElement('span', {
      className: 'browser-item-arrow',
      attributes: {
        'aria-hidden': 'true',
      },
    })

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('width', '16')
    svg.setAttribute('height', '16')
    svg.setAttribute('viewBox', '0 0 16 16')
    svg.setAttribute('fill', 'currentColor')

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute('d', 'M6 3l5 5-5 5V3z')

    svg.appendChild(path)
    icon.appendChild(svg)

    return icon
  }

  // ===========================================================================
  // Private Methods - Event Handlers
  // ===========================================================================

  private handleItemSelect(item: BrowserItem, columnIndex: number, itemIndex: number): void {
    // パスを更新
    const newPath = [...this.state.selectedPath.slice(0, columnIndex), item.value]

    // 子がない場合は最終選択
    const hasChildren = item.children && item.children.length > 0

    this.state = {
      ...this.state,
      selectedValue: item.value,
      selectedPath: newPath,
      focusedColumnIndex: hasChildren ? columnIndex + 1 : columnIndex,
      focusedItemIndexes: this.state.focusedItemIndexes.map((idx, i) => {
        if (i === columnIndex) return itemIndex
        if (i === columnIndex + 1) return 0
        return idx
      }),
    }

    this.renderColumns()
    this.callbacks.onSelect?.(item.value, newPath, item)
    this.callbacks.onChange?.(item.value, newPath)

    // 子がある場合、次のカラムの最初のアイテムにフォーカス
    if (hasChildren) {
      setTimeout(() => {
        this.focusCurrentItem()
      }, 0)
    }
  }

  private handleKeyDown(event: KeyboardEvent): void {
    const columnsData = this.getColumnsData()
    const currentColumn = columnsData[this.state.focusedColumnIndex]
    if (!currentColumn) return

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault()
        this.moveFocus(-1, 0)
        break

      case 'ArrowDown':
        event.preventDefault()
        this.moveFocus(1, 0)
        break

      case 'ArrowLeft':
        event.preventDefault()
        this.moveFocus(0, -1)
        break

      case 'ArrowRight':
      case 'Enter':
      case ' ':
        event.preventDefault()
        this.selectFocusedOrMoveRight()
        break
    }
  }

  private moveFocus(rowDelta: number, colDelta: number): void {
    const columnsData = this.getColumnsData()
    let newColumnIndex = this.state.focusedColumnIndex + colDelta
    newColumnIndex = Math.max(0, Math.min(newColumnIndex, columnsData.length - 1))

    const column = columnsData[newColumnIndex]
    if (!column) return

    let newItemIndex = this.state.focusedItemIndexes[newColumnIndex] + rowDelta
    newItemIndex = Math.max(0, Math.min(newItemIndex, column.items.length - 1))

    this.state = {
      ...this.state,
      focusedColumnIndex: newColumnIndex,
      focusedItemIndexes: this.state.focusedItemIndexes.map((idx, i) =>
        i === newColumnIndex ? newItemIndex : idx
      ),
    }

    this.renderColumns()
    this.focusCurrentItem()
  }

  private selectFocusedOrMoveRight(): void {
    const columnsData = this.getColumnsData()
    const currentColumn = columnsData[this.state.focusedColumnIndex]
    if (!currentColumn) return

    const itemIndex = this.state.focusedItemIndexes[this.state.focusedColumnIndex]
    const item = currentColumn.items[itemIndex]
    if (!item || item.disabled) return

    this.handleItemSelect(item, this.state.focusedColumnIndex, itemIndex)
  }

  private focusCurrentItem(): void {
    const selector = `.browser-item[data-column="${this.state.focusedColumnIndex}"][data-index="${this.state.focusedItemIndexes[this.state.focusedColumnIndex]}"] .browser-item-radio`
    const input = this.container.querySelector<HTMLInputElement>(selector)
    input?.focus()
  }

  // ===========================================================================
  // Static Field Renderer
  // ===========================================================================

  static renderField(field: InputField): string {
    const browserHtml = `
      <div class="mokkun-browser browser-placeholder">
        <div class="browser-toolbar">
          <div class="browser-controls">
            <span class="browser-dot browser-dot-red"></span>
            <span class="browser-dot browser-dot-yellow"></span>
            <span class="browser-dot browser-dot-green"></span>
          </div>
          <div class="browser-url-bar">
            <span class="browser-url">https://example.com</span>
          </div>
        </div>
        <div class="browser-content">
          <p class="browser-placeholder-text">ブラウザコンテンツ</p>
        </div>
      </div>
    `
    return createFieldWrapper(field, browserHtml)
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Browserを作成
 */
export function createBrowser(
  container: HTMLElement,
  config: BrowserConfig,
  callbacks?: BrowserCallbacks
): Browser {
  const browser = new Browser(container, config, callbacks)
  browser.render()
  return browser
}

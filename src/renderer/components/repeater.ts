/**
 * Repeater Component
 * 動的フィールドグループ（リピーター）
 */

import type { RepeaterField, InputField } from '../../types'
import { createElement, clearElement, generateId } from '../utils/dom'
import { generateRepeaterItemDummyData } from '../utils'

// =============================================================================
// Types
// =============================================================================

/**
 * リピーターアイテムの状態
 */
export interface RepeaterItem {
  /** アイテムID */
  id: string
  /** アイテムのデータ */
  data: Record<string, unknown>
  /** 展開状態 */
  expanded: boolean
}

/**
 * リピーターの状態
 */
export interface RepeaterState {
  /** アイテム一覧 */
  items: RepeaterItem[]
  /** ネストレベル */
  nestLevel: number
}

/**
 * リピーターのコールバック
 */
export interface RepeaterCallbacks {
  /** アイテム追加時 */
  onAdd?: (item: RepeaterItem, state: RepeaterState) => void
  /** アイテム削除時 */
  onRemove?: (itemId: string, state: RepeaterState) => void
  /** 並べ替え時 */
  onReorder?: (items: RepeaterItem[]) => void
  /** データ変更時 */
  onChange?: (state: RepeaterState) => void
  /** フィールドレンダラー */
  renderFields?: (
    fields: InputField[],
    container: HTMLElement,
    itemId: string,
    nestLevel: number
  ) => void
}

// =============================================================================
// Repeater Class
// =============================================================================

/**
 * リピーターコンポーネント
 */
export class Repeater {
  private config: RepeaterField
  private state: RepeaterState
  private callbacks: RepeaterCallbacks
  private container: HTMLElement

  /** 最大ネストレベル（2階層まで） */
  private static readonly MAX_NEST_LEVEL = 2

  constructor(
    config: RepeaterField,
    container: HTMLElement,
    callbacks: RepeaterCallbacks = {},
    nestLevel: number = 0
  ) {
    this.config = config
    this.container = container
    this.callbacks = callbacks
    this.state = this.createInitialState(nestLevel)
  }

  // ===========================================================================
  // Public Methods
  // ===========================================================================

  /**
   * リピーターをレンダリング
   */
  render(): void {
    clearElement(this.container)
    this.container.className = `mokkun-repeater nest-level-${this.state.nestLevel}`

    const wrapper = createElement('div', { className: 'repeater-wrapper' })

    // ヘッダー
    wrapper.appendChild(this.renderHeader())

    // アイテム一覧
    const itemsContainer = createElement('div', { className: 'repeater-items' })
    for (const item of this.state.items) {
      itemsContainer.appendChild(this.renderItem(item))
    }
    wrapper.appendChild(itemsContainer)

    // フッター（追加ボタン）
    wrapper.appendChild(this.renderFooter())

    this.container.appendChild(wrapper)
  }

  /**
   * アイテムを追加
   */
  addItem(withDummyData: boolean = false): RepeaterItem | null {
    // 最大数チェック
    if (this.config.max_items && this.state.items.length >= this.config.max_items) {
      return null
    }

    const newItem: RepeaterItem = {
      id: generateId('item'),
      data: withDummyData
        ? generateRepeaterItemDummyData(this.config.item_fields, this.state.items.length)
        : {},
      expanded: true,
    }

    this.state = {
      ...this.state,
      items: [...this.state.items, newItem],
    }

    this.render()
    this.callbacks.onAdd?.(newItem, this.state)
    this.callbacks.onChange?.(this.state)

    return newItem
  }

  /**
   * アイテムを削除
   */
  removeItem(itemId: string): boolean {
    // 最小数チェック
    if (this.config.min_items && this.state.items.length <= this.config.min_items) {
      return false
    }

    const itemIndex = this.state.items.findIndex(item => item.id === itemId)
    if (itemIndex === -1) {
      return false
    }

    this.state = {
      ...this.state,
      items: this.state.items.filter(item => item.id !== itemId),
    }

    this.render()
    this.callbacks.onRemove?.(itemId, this.state)
    this.callbacks.onChange?.(this.state)

    return true
  }

  /**
   * アイテムデータを更新
   */
  updateItemData(itemId: string, data: Record<string, unknown>): void {
    this.state = {
      ...this.state,
      items: this.state.items.map(item =>
        item.id === itemId ? { ...item, data: { ...item.data, ...data } } : item
      ),
    }
    this.callbacks.onChange?.(this.state)
  }

  /**
   * アイテムの展開/折りたたみ
   */
  toggleItemExpanded(itemId: string): void {
    this.state = {
      ...this.state,
      items: this.state.items.map(item =>
        item.id === itemId ? { ...item, expanded: !item.expanded } : item
      ),
    }
    this.render()
  }

  /**
   * アイテムを上へ移動
   */
  moveItemUp(itemId: string): boolean {
    if (!this.config.sortable) return false

    const index = this.state.items.findIndex(item => item.id === itemId)
    if (index <= 0) return false

    const newItems = [...this.state.items]
    const temp = newItems[index]
    newItems[index] = newItems[index - 1]
    newItems[index - 1] = temp

    this.state = { ...this.state, items: newItems }
    this.render()
    this.callbacks.onReorder?.(this.state.items)
    this.callbacks.onChange?.(this.state)

    return true
  }

  /**
   * アイテムを下へ移動
   */
  moveItemDown(itemId: string): boolean {
    if (!this.config.sortable) return false

    const index = this.state.items.findIndex(item => item.id === itemId)
    if (index < 0 || index >= this.state.items.length - 1) return false

    const newItems = [...this.state.items]
    const temp = newItems[index]
    newItems[index] = newItems[index + 1]
    newItems[index + 1] = temp

    this.state = { ...this.state, items: newItems }
    this.render()
    this.callbacks.onReorder?.(this.state.items)
    this.callbacks.onChange?.(this.state)

    return true
  }

  /**
   * 現在の状態を取得
   */
  getState(): RepeaterState {
    return {
      ...this.state,
      items: this.state.items.map(item => ({ ...item })),
    }
  }

  /**
   * 値を取得（フォーム送信用）
   */
  getValue(): Record<string, unknown>[] {
    return this.state.items.map(item => ({ ...item.data }))
  }

  /**
   * ダミーデータで初期化
   */
  initWithDummyData(count: number = 1): void {
    const itemCount = Math.min(
      count,
      this.config.max_items ?? count
    )

    const items: RepeaterItem[] = []
    for (let i = 0; i < itemCount; i++) {
      items.push({
        id: generateId('item'),
        data: generateRepeaterItemDummyData(this.config.item_fields, i),
        expanded: true,
      })
    }

    this.state = { ...this.state, items }
    this.render()
    this.callbacks.onChange?.(this.state)
  }

  // ===========================================================================
  // Private Methods - Rendering
  // ===========================================================================

  /**
   * 初期状態を作成
   */
  private createInitialState(nestLevel: number): RepeaterState {
    const initialItems: RepeaterItem[] = []

    // 最小アイテム数分の空アイテムを作成
    if (this.config.min_items) {
      for (let i = 0; i < this.config.min_items; i++) {
        initialItems.push({
          id: generateId('item'),
          data: {},
          expanded: true,
        })
      }
    }

    return {
      items: initialItems,
      nestLevel: Math.min(nestLevel, Repeater.MAX_NEST_LEVEL),
    }
  }

  /**
   * ヘッダーをレンダリング
   */
  private renderHeader(): HTMLElement {
    const header = createElement('div', { className: 'repeater-header' })

    // ラベル
    const label = createElement('label', {
      className: 'repeater-label',
      textContent: this.config.label,
    })
    if (this.config.required) {
      const required = createElement('span', {
        className: 'required-marker',
        textContent: '*',
      })
      label.appendChild(required)
    }
    header.appendChild(label)

    // 説明
    if (this.config.description) {
      const description = createElement('p', {
        className: 'repeater-description',
        textContent: this.config.description,
      })
      header.appendChild(description)
    }

    // カウンター
    const counter = createElement('span', { className: 'repeater-counter' })
    const countText = this.config.max_items
      ? `${this.state.items.length} / ${this.config.max_items}`
      : `${this.state.items.length} items`
    counter.textContent = countText
    header.appendChild(counter)

    return header
  }

  /**
   * アイテムをレンダリング
   */
  private renderItem(item: RepeaterItem): HTMLElement {
    const itemEl = createElement('div', {
      className: `repeater-item ${item.expanded ? 'expanded' : 'collapsed'}`,
      attributes: { 'data-item-id': item.id },
    })

    // アイテムヘッダー
    const itemHeader = createElement('div', { className: 'repeater-item-header' })

    // ドラッグハンドル（ソート可能な場合）
    if (this.config.sortable) {
      const handle = createElement('div', { className: 'repeater-item-handle' })
      handle.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M3 15h18v-2H3v2zm0 4h18v-2H3v2zm0-8h18V9H3v2zm0-6v2h18V5H3z"/></svg>'
      itemHeader.appendChild(handle)
    }

    // アイテム番号
    const index = this.state.items.findIndex(i => i.id === item.id)
    const itemNumber = createElement('span', {
      className: 'repeater-item-number',
      textContent: `#${index + 1}`,
    })
    itemHeader.appendChild(itemNumber)

    // 展開/折りたたみトグル
    const toggle = createElement('button', {
      className: 'repeater-item-toggle',
      attributes: { type: 'button' },
    })
    toggle.innerHTML = item.expanded
      ? '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>'
      : '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg>'
    toggle.addEventListener('click', () => this.toggleItemExpanded(item.id))
    itemHeader.appendChild(toggle)

    // スペーサー
    const spacer = createElement('div', { className: 'repeater-item-spacer' })
    itemHeader.appendChild(spacer)

    // 並べ替えボタン（ソート可能な場合）
    if (this.config.sortable) {
      const moveUpBtn = createElement('button', {
        className: 'repeater-item-move-up',
        attributes: { type: 'button', title: 'Move up' },
      })
      moveUpBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M7 14l5-5 5 5z"/></svg>'
      moveUpBtn.disabled = index === 0
      moveUpBtn.addEventListener('click', () => this.moveItemUp(item.id))
      itemHeader.appendChild(moveUpBtn)

      const moveDownBtn = createElement('button', {
        className: 'repeater-item-move-down',
        attributes: { type: 'button', title: 'Move down' },
      })
      moveDownBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M7 10l5 5 5-5z"/></svg>'
      moveDownBtn.disabled = index === this.state.items.length - 1
      moveDownBtn.addEventListener('click', () => this.moveItemDown(item.id))
      itemHeader.appendChild(moveDownBtn)
    }

    // 削除ボタン
    if (this.config.show_remove_button !== false) {
      const canRemove = !this.config.min_items || this.state.items.length > this.config.min_items
      const removeBtn = createElement('button', {
        className: 'repeater-item-remove',
        attributes: { type: 'button', title: 'Remove' },
      })
      removeBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>'
      removeBtn.disabled = !canRemove
      removeBtn.addEventListener('click', () => this.removeItem(item.id))
      itemHeader.appendChild(removeBtn)
    }

    itemEl.appendChild(itemHeader)

    // アイテムコンテンツ（フィールド）
    if (item.expanded) {
      const content = createElement('div', { className: 'repeater-item-content' })

      if (this.callbacks.renderFields) {
        this.callbacks.renderFields(
          this.config.item_fields,
          content,
          item.id,
          this.state.nestLevel + 1
        )
      } else {
        // デフォルトのフィールドプレースホルダー
        for (const field of this.config.item_fields) {
          const fieldPlaceholder = this.renderFieldPlaceholder(field, item)
          content.appendChild(fieldPlaceholder)
        }
      }

      itemEl.appendChild(content)
    }

    return itemEl
  }

  /**
   * フィールドプレースホルダーをレンダリング（renderFieldsコールバックがない場合）
   */
  private renderFieldPlaceholder(field: InputField, item: RepeaterItem): HTMLElement {
    const fieldWrapper = createElement('div', { className: 'field-wrapper' })

    const label = createElement('label', { textContent: field.label })
    fieldWrapper.appendChild(label)

    // ネストされたリピーターの場合
    if (field.type === 'repeater' && this.state.nestLevel < Repeater.MAX_NEST_LEVEL) {
      const nestedContainer = createElement('div', { className: 'nested-repeater-container' })
      const nestedRepeater = new Repeater(
        field,
        nestedContainer,
        this.callbacks,
        this.state.nestLevel + 1
      )
      nestedRepeater.render()
      fieldWrapper.appendChild(nestedContainer)
    } else {
      // 通常フィールドの簡易レンダリング
      const input = this.createSimpleInput(field, item)
      fieldWrapper.appendChild(input)
    }

    return fieldWrapper
  }

  /**
   * 簡易入力要素を作成
   */
  private createSimpleInput(field: InputField, item: RepeaterItem): HTMLElement {
    const value = item.data[field.id]

    switch (field.type) {
      case 'text':
      case 'number': {
        const input = createElement('input', {
          className: 'field-input',
          attributes: {
            type: field.type === 'number' ? 'number' : 'text',
            id: `${item.id}-${field.id}`,
            placeholder: field.placeholder ?? '',
          },
        })
        if (value !== undefined) {
          input.value = String(value)
        }
        input.addEventListener('change', (e) => {
          const target = e.target as HTMLInputElement
          this.updateItemData(item.id, { [field.id]: target.value })
        })
        return input
      }

      case 'textarea': {
        const textarea = createElement('textarea', {
          className: 'field-textarea',
          attributes: {
            id: `${item.id}-${field.id}`,
            placeholder: field.placeholder ?? '',
            rows: String(field.rows ?? 3),
          },
        })
        if (value !== undefined) {
          textarea.value = String(value)
        }
        textarea.addEventListener('change', (e) => {
          const target = e.target as HTMLTextAreaElement
          this.updateItemData(item.id, { [field.id]: target.value })
        })
        return textarea
      }

      case 'select': {
        const select = createElement('select', {
          className: 'field-select',
          attributes: { id: `${item.id}-${field.id}` },
        })

        // 空オプション
        const emptyOption = createElement('option', { textContent: field.placeholder ?? 'Select...' })
        emptyOption.value = ''
        select.appendChild(emptyOption)

        // オプション
        if (Array.isArray(field.options)) {
          for (const opt of field.options) {
            const option = createElement('option', { textContent: opt.label })
            option.value = String(opt.value)
            if (value !== undefined && String(opt.value) === String(value)) {
              option.selected = true
            }
            select.appendChild(option)
          }
        }

        select.addEventListener('change', (e) => {
          const target = e.target as HTMLSelectElement
          this.updateItemData(item.id, { [field.id]: target.value })
        })
        return select
      }

      default: {
        const placeholder = createElement('div', {
          className: 'field-placeholder',
          textContent: `[${field.type} field]`,
        })
        return placeholder
      }
    }
  }

  /**
   * フッター（追加ボタン）をレンダリング
   */
  private renderFooter(): HTMLElement {
    const footer = createElement('div', { className: 'repeater-footer' })

    const canAdd = !this.config.max_items || this.state.items.length < this.config.max_items

    // 追加ボタン
    const addBtn = createElement('button', {
      className: 'repeater-add-btn',
      attributes: { type: 'button' },
      textContent: this.config.add_button_label ?? 'Add Item',
    })
    addBtn.disabled = !canAdd
    addBtn.addEventListener('click', () => this.addItem())
    footer.appendChild(addBtn)

    // ダミーデータ追加ボタン（開発用）
    const addDummyBtn = createElement('button', {
      className: 'repeater-add-dummy-btn',
      attributes: { type: 'button' },
      textContent: 'Add with Dummy Data',
    })
    addDummyBtn.disabled = !canAdd
    addDummyBtn.addEventListener('click', () => this.addItem(true))
    footer.appendChild(addDummyBtn)

    return footer
  }
}

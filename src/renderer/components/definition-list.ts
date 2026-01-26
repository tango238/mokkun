/**
 * DefinitionList Component
 * 定義リストコンポーネント
 *
 * 
 * - 水平/垂直レイアウト
 * - ラベル幅調整
 * - グループ化
 * - レスポンシブ対応
 * - maxColumns設定
 * - セマンティックHTML（dl/dt/dd）
 */

import { createElement } from '../utils/dom'
import { escapeHtml, createFieldWrapper } from '../utils/field-helpers'
import type { InputField } from '../../types/schema'

// =============================================================================
// Types
// =============================================================================

/**
 * 定義リストのアイテム
 */
export interface DefinitionListItem {
  /** 用語（ラベル/キー） */
  term: string
  /** 説明（値） */
  description: string | string[] | null
  /** アイテム固有の全幅表示 */
  fullWidth?: boolean
  /** アイテム固有のカラム数 */
  maxColumns?: number
  /** カスタムクラス */
  className?: string
}

/**
 * 定義リストのグループ
 */
export interface DefinitionListGroup {
  /** グループタイトル */
  title: string
  /** グループ内のアイテム */
  items: DefinitionListItem[]
  /** グループ固有のレイアウト */
  layout?: 'horizontal' | 'vertical'
  /** グループ固有のカラム数 */
  maxColumns?: number
}

/**
 * 定義リストの状態
 */
export interface DefinitionListState {
  /** 現在のアイテム */
  items: DefinitionListItem[]
  /** 現在のグループ（グループ化時） */
  groups: DefinitionListGroup[]
  /** グループ化モード */
  isGrouped: boolean
}

/**
 * 定義リストのコールバック
 */
export interface DefinitionListCallbacks {
  /** アイテムクリック時 */
  onItemClick?: (item: DefinitionListItem, index: number) => void
  /** グループクリック時 */
  onGroupClick?: (group: DefinitionListGroup, index: number) => void
}

/**
 * 用語のスタイルタイプ
 */
export type TermStyleType = 'blockTitle' | 'subBlockTitle' | 'subSubBlockTitle'

/**
 * 定義リストの設定
 */
export interface DefinitionListConfig {
  /** アイテム配列（フラットリスト用） */
  items?: DefinitionListItem[]
  /** グループ配列（グループ化リスト用） */
  groups?: DefinitionListGroup[]
  /** レイアウト方向（デフォルト: horizontal） */
  layout?: 'horizontal' | 'vertical'
  /** 最大カラム数（デフォルト: 自動） */
  maxColumns?: 1 | 2 | 3 | 4
  /** 用語（ラベル）の幅 */
  termWidth?: string | number
  /** 用語のスタイルタイプ */
  termStyleType?: TermStyleType
  /** アイテム間のギャップ */
  gap?: string | number
  /** ボーダーを表示 */
  bordered?: boolean
  /** ストライプ表示 */
  striped?: boolean
  /** コンパクト表示 */
  compact?: boolean
  /** クリック可能 */
  clickable?: boolean
  /** 空の値の表示テキスト */
  emptyText?: string
}

// =============================================================================
// DefinitionList Class
// =============================================================================

/**
 * 定義リストコンポーネント
 */
export class DefinitionList {
  private config: DefinitionListConfig
  private state: DefinitionListState
  private callbacks: DefinitionListCallbacks
  private container: HTMLElement

  constructor(
    container: HTMLElement,
    config: DefinitionListConfig = {},
    callbacks: DefinitionListCallbacks = {}
  ) {
    this.config = config
    this.container = container
    this.callbacks = callbacks
    this.state = this.createInitialState()
  }

  // ===========================================================================
  // Public Methods
  // ===========================================================================

  /**
   * 定義リストをレンダリング
   */
  render(): void {
    this.container.innerHTML = ''

    const layout = this.config.layout ?? 'horizontal'
    const maxColumns = this.config.maxColumns
    const bordered = this.config.bordered ?? false
    const striped = this.config.striped ?? false
    const compact = this.config.compact ?? false

    // メインコンテナの設定
    this.container.className = 'mokkun-definition-list'
    this.container.setAttribute('data-layout', layout)

    if (maxColumns) {
      this.container.setAttribute('data-columns', String(maxColumns))
    }

    if (bordered) {
      this.container.classList.add('definition-list-bordered')
    }

    if (striped) {
      this.container.classList.add('definition-list-striped')
    }

    if (compact) {
      this.container.classList.add('definition-list-compact')
    }

    // CSS変数の設定
    this.applyCustomStyles()

    // グループ化モードかフラットリストかで分岐
    if (this.state.isGrouped && this.state.groups.length > 0) {
      this.renderGroups()
    } else {
      this.renderItems(this.state.items)
    }
  }

  /**
   * アイテムを設定
   */
  setItems(items: DefinitionListItem[]): void {
    this.state = {
      ...this.state,
      items,
      groups: [],
      isGrouped: false,
    }
    this.render()
  }

  /**
   * グループを設定
   */
  setGroups(groups: DefinitionListGroup[]): void {
    this.state = {
      ...this.state,
      items: [],
      groups,
      isGrouped: true,
    }
    this.render()
  }

  /**
   * アイテムを追加
   */
  addItem(item: DefinitionListItem): void {
    this.state = {
      ...this.state,
      items: [...this.state.items, item],
    }
    this.render()
  }

  /**
   * アイテムを削除
   */
  removeItem(index: number): void {
    if (index < 0 || index >= this.state.items.length) {
      return
    }

    this.state = {
      ...this.state,
      items: this.state.items.filter((_, i) => i !== index),
    }
    this.render()
  }

  /**
   * アイテムを更新
   */
  updateItem(index: number, item: Partial<DefinitionListItem>): void {
    if (index < 0 || index >= this.state.items.length) {
      return
    }

    this.state = {
      ...this.state,
      items: this.state.items.map((existingItem, i) =>
        i === index ? { ...existingItem, ...item } : existingItem
      ),
    }
    this.render()
  }

  /**
   * 現在の状態を取得
   */
  getState(): Readonly<DefinitionListState> {
    return { ...this.state }
  }

  /**
   * コンポーネントを破棄
   */
  destroy(): void {
    this.container.innerHTML = ''
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  /**
   * 初期状態を作成
   */
  private createInitialState(): DefinitionListState {
    const items = this.config.items ?? []
    const groups = this.config.groups ?? []
    const isGrouped = groups.length > 0

    return {
      items: isGrouped ? [] : items,
      groups,
      isGrouped,
    }
  }

  /**
   * カスタムスタイルを適用
   */
  private applyCustomStyles(): void {
    // 用語の幅
    if (this.config.termWidth) {
      const width =
        typeof this.config.termWidth === 'number'
          ? `${this.config.termWidth}px`
          : this.config.termWidth
      this.container.style.setProperty('--definition-term-width', width)
    }

    // ギャップ
    if (this.config.gap) {
      const gap =
        typeof this.config.gap === 'number'
          ? `${this.config.gap}px`
          : this.config.gap
      this.container.style.setProperty('--definition-gap', gap)
    }
  }

  /**
   * グループをレンダリング
   */
  private renderGroups(): void {
    this.state.groups.forEach((group, groupIndex) => {
      const groupElement = this.renderGroup(group, groupIndex)
      this.container.appendChild(groupElement)
    })
  }

  /**
   * 単一のグループをレンダリング
   */
  private renderGroup(group: DefinitionListGroup, groupIndex: number): HTMLElement {
    const groupContainer = createElement('div', {
      className: 'definition-group',
      attributes: {
        'data-group-index': String(groupIndex),
      },
    })

    // グループタイトル
    const titleElement = createElement('div', {
      className: 'definition-group-title',
      textContent: group.title,
    })
    groupContainer.appendChild(titleElement)

    // グループ内のアイテム
    const listContainer = createElement('dl', {
      className: 'definition-list-content',
      attributes: {
        'aria-label': group.title,
      },
    })

    // グループ固有のレイアウト設定
    if (group.layout) {
      listContainer.setAttribute('data-layout', group.layout)
    }

    if (group.maxColumns) {
      listContainer.setAttribute('data-columns', String(group.maxColumns))
    }

    // グループクリックイベント
    if (this.callbacks.onGroupClick) {
      groupContainer.style.cursor = 'pointer'
      groupContainer.addEventListener('click', (e) => {
        // アイテムクリック時は伝播しない
        if ((e.target as HTMLElement).closest('.definition-item')) {
          return
        }
        this.callbacks.onGroupClick?.(group, groupIndex)
      })
    }

    group.items.forEach((item, itemIndex) => {
      const itemElements = this.renderItem(item, itemIndex)
      itemElements.forEach((el) => listContainer.appendChild(el))
    })

    groupContainer.appendChild(listContainer)
    return groupContainer
  }

  /**
   * アイテムリストをレンダリング
   */
  private renderItems(items: DefinitionListItem[]): void {
    const listContainer = createElement('dl', {
      className: 'definition-list-content',
      attributes: {
        'aria-label': 'Definition list',
      },
    })

    items.forEach((item, index) => {
      const itemElements = this.renderItem(item, index)
      itemElements.forEach((el) => listContainer.appendChild(el))
    })

    this.container.appendChild(listContainer)
  }

  /**
   * 単一のアイテムをレンダリング（dt + dd のペア）
   */
  private renderItem(item: DefinitionListItem, index: number): HTMLElement[] {
    const elements: HTMLElement[] = []
    const clickable = this.config.clickable ?? false
    const emptyText = this.config.emptyText ?? '-'
    const termStyleType = this.config.termStyleType

    // classNameのサニタイズ（安全な文字のみ許可）
    const sanitizedClassName = item.className
      ? item.className.replace(/[^a-zA-Z0-9_\-\s]/g, '')
      : ''

    // アイテムラッパー（グリッド配置用）
    const itemWrapper = createElement('div', {
      className: `definition-item${sanitizedClassName ? ` ${sanitizedClassName}` : ''}`,
      attributes: {
        'data-index': String(index),
      },
    })

    // 全幅表示
    if (item.fullWidth) {
      itemWrapper.setAttribute('data-full-width', '')
    }

    // アイテム固有のカラム数
    if (item.maxColumns) {
      itemWrapper.setAttribute('data-columns', String(item.maxColumns))
    }

    // 用語（dt）
    const termElement = createElement('dt', {
      className: `definition-term${termStyleType ? ` term-${termStyleType}` : ''}`,
      textContent: item.term,
    })

    // 説明（dd）
    const descriptionElement = createElement('dd', {
      className: 'definition-description',
    })

    // 説明の内容を設定
    if (item.description === null || item.description === undefined) {
      descriptionElement.textContent = emptyText
      descriptionElement.classList.add('definition-description-empty')
    } else if (Array.isArray(item.description)) {
      if (item.description.length === 0) {
        descriptionElement.textContent = emptyText
        descriptionElement.classList.add('definition-description-empty')
      } else {
        // 複数の値をリストとして表示
        const list = createElement('ul', {
          className: 'definition-description-list',
        })
        item.description.forEach((desc) => {
          const listItem = createElement('li', { textContent: desc })
          list.appendChild(listItem)
        })
        descriptionElement.appendChild(list)
      }
    } else {
      descriptionElement.textContent = item.description
    }

    // クリックイベント
    if (clickable && this.callbacks.onItemClick) {
      itemWrapper.style.cursor = 'pointer'
      itemWrapper.setAttribute('role', 'button')
      itemWrapper.setAttribute('tabindex', '0')

      itemWrapper.addEventListener('click', () => {
        this.callbacks.onItemClick?.(item, index)
      })

      itemWrapper.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          this.callbacks.onItemClick?.(item, index)
        }
      })
    }

    itemWrapper.appendChild(termElement)
    itemWrapper.appendChild(descriptionElement)
    elements.push(itemWrapper)

    return elements
  }

  // ===========================================================================
  // Static Field Renderer
  // ===========================================================================

  static renderField(field: InputField): string {
    const label = escapeHtml(field.label)
    const definitionHtml = `
      <dl class="mokkun-definition-list" aria-label="${label}">
        <div class="definition-item">
          <dt class="definition-term">項目1</dt>
          <dd class="definition-description">値1</dd>
        </div>
        <div class="definition-item">
          <dt class="definition-term">項目2</dt>
          <dd class="definition-description">値2</dd>
        </div>
        <div class="definition-item">
          <dt class="definition-term">項目3</dt>
          <dd class="definition-description">値3</dd>
        </div>
      </dl>
    `
    return createFieldWrapper(field, definitionHtml)
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * 定義リストを作成
 */
export function createDefinitionList(
  container: HTMLElement,
  config: DefinitionListConfig = {},
  callbacks: DefinitionListCallbacks = {}
): DefinitionList {
  const definitionList = new DefinitionList(container, config, callbacks)
  definitionList.render()
  return definitionList
}

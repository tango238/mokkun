/**
 * AccordionPanel Component
 * 折りたたみパネルコンポーネント
 *
 * 
 * - 複数パネルの同時開閉制御（単一/複数展開モード）
 * - 開閉アニメーション
 * - アイコン付きヘッダー
 * - デフォルト展開状態の設定
 * - キーボード操作対応
 * - アクセシビリティ対応（ARIA属性）
 */

import { createElement, generateId } from '../utils/dom'

// =============================================================================
// Types
// =============================================================================

/**
 * アコーディオンアイテムの定義
 */
export interface AccordionItem {
  /** 一意な識別子 */
  name: string
  /** ヘッダーテキスト */
  title: string
  /** ヘッダーアイコン（オプション） */
  icon?: string
  /** コンテンツ（HTML文字列またはHTMLElement） */
  content: string | HTMLElement
  /** 無効化 */
  disabled?: boolean
}

/**
 * アイコンの配置位置
 */
export type IconPosition = 'left' | 'right'

/**
 * 見出しタイプ
 */
export type HeadingType = 'sectionTitle' | 'blockTitle' | 'subBlockTitle' | 'subSubBlockTitle'

/**
 * アコーディオンパネルの状態
 */
export interface AccordionPanelState {
  /** 展開中のパネル名リスト */
  expandedItems: string[]
  /** フォーカスされているアイテムのインデックス */
  focusedIndex: number
}

/**
 * アコーディオンパネルのコールバック
 */
export interface AccordionPanelCallbacks {
  /** パネル展開時 */
  onExpand?: (name: string) => void
  /** パネル折りたたみ時 */
  onCollapse?: (name: string) => void
  /** 展開状態変更時 */
  onChange?: (expandedItems: string[]) => void
}

/**
 * アコーディオンパネルの設定
 */
export interface AccordionPanelConfig {
  /** アコーディオンアイテム */
  items: AccordionItem[]
  /** 複数パネル同時展開を許可（デフォルト: true） */
  expandableMultiply?: boolean
  /** デフォルトで展開するパネル名のリスト */
  defaultExpanded?: string[]
  /** アイコンの配置位置（デフォルト: left） */
  iconPosition?: IconPosition
  /** 見出しタイプ（デフォルト: blockTitle） */
  headingType?: HeadingType
  /** ID属性 */
  id?: string
  /** カスタムCSSクラス */
  className?: string
}

// =============================================================================
// AccordionPanel Class
// =============================================================================

/**
 * アコーディオンパネルコンポーネント
 */
export class AccordionPanel {
  private config: AccordionPanelConfig
  private state: AccordionPanelState
  private callbacks: AccordionPanelCallbacks
  private container: HTMLElement
  private instanceId: string
  private itemElements: Map<string, { trigger: HTMLElement; content: HTMLElement }> = new Map()

  constructor(
    container: HTMLElement,
    config: AccordionPanelConfig,
    callbacks: AccordionPanelCallbacks = {}
  ) {
    this.config = config
    this.container = container
    this.callbacks = callbacks
    this.instanceId = config.id ?? generateId('accordion')
    this.state = this.createInitialState()
  }

  // ===========================================================================
  // Public Methods
  // ===========================================================================

  /**
   * アコーディオンパネルをレンダリング
   */
  render(): void {
    this.container.innerHTML = ''
    this.itemElements.clear()

    const iconPosition = this.config.iconPosition ?? 'left'
    const headingType = this.config.headingType ?? 'blockTitle'

    this.container.className = [
      'mokkun-accordion-panel',
      `accordion-icon-${iconPosition}`,
      `accordion-heading-${headingType}`,
      this.config.className ?? '',
    ]
      .filter(Boolean)
      .join(' ')

    this.container.setAttribute('role', 'region')
    this.container.id = this.instanceId

    // アイテムをレンダリング
    this.config.items.forEach((item, index) => {
      const itemElement = this.renderItem(item, index)
      this.container.appendChild(itemElement)
    })

    // キーボードイベントをアタッチ
    this.attachKeyboardEvents()
  }

  /**
   * パネルを展開
   */
  expand(name: string): void {
    const item = this.config.items.find((i) => i.name === name)
    if (!item || item.disabled) {
      return
    }

    if (this.state.expandedItems.includes(name)) {
      return
    }

    const expandableMultiply = this.config.expandableMultiply ?? true
    const previouslyExpanded = [...this.state.expandedItems]

    if (expandableMultiply) {
      this.state = {
        ...this.state,
        expandedItems: [...this.state.expandedItems, name],
      }
    } else {
      // 単一展開モード: 他のパネルを閉じる
      this.state = {
        ...this.state,
        expandedItems: [name],
      }

      // 以前展開していたパネルのUIを閉じる
      previouslyExpanded.forEach((prevName) => {
        if (prevName !== name) {
          this.updateItemState(prevName, false)
          this.callbacks.onCollapse?.(prevName)
        }
      })
    }

    this.updateItemState(name, true)
    this.callbacks.onExpand?.(name)
    this.callbacks.onChange?.(this.state.expandedItems)
  }

  /**
   * パネルを折りたたむ
   */
  collapse(name: string): void {
    if (!this.state.expandedItems.includes(name)) {
      return
    }

    this.state = {
      ...this.state,
      expandedItems: this.state.expandedItems.filter((n) => n !== name),
    }

    this.updateItemState(name, false)
    this.callbacks.onCollapse?.(name)
    this.callbacks.onChange?.(this.state.expandedItems)
  }

  /**
   * パネルの展開/折りたたみを切り替え
   */
  toggle(name: string): void {
    if (this.state.expandedItems.includes(name)) {
      this.collapse(name)
    } else {
      this.expand(name)
    }
  }

  /**
   * すべてのパネルを展開
   */
  expandAll(): void {
    if (!(this.config.expandableMultiply ?? true)) {
      return
    }

    const enabledItems = this.config.items
      .filter((item) => !item.disabled)
      .map((item) => item.name)

    this.state = {
      ...this.state,
      expandedItems: enabledItems,
    }

    enabledItems.forEach((name) => {
      this.updateItemState(name, true)
    })

    this.callbacks.onChange?.(this.state.expandedItems)
  }

  /**
   * すべてのパネルを折りたたむ
   */
  collapseAll(): void {
    const previousExpanded = [...this.state.expandedItems]

    this.state = {
      ...this.state,
      expandedItems: [],
    }

    previousExpanded.forEach((name) => {
      this.updateItemState(name, false)
    })

    this.callbacks.onChange?.(this.state.expandedItems)
  }

  /**
   * パネルの展開状態を確認
   */
  isExpanded(name: string): boolean {
    return this.state.expandedItems.includes(name)
  }

  /**
   * 現在の状態を取得
   */
  getState(): AccordionPanelState {
    return { ...this.state }
  }

  /**
   * アイテムを更新
   */
  setItems(items: AccordionItem[]): void {
    this.config = {
      ...this.config,
      items,
    }

    // 存在しないアイテムを展開状態から削除
    const validNames = items.map((item) => item.name)
    this.state = {
      ...this.state,
      expandedItems: this.state.expandedItems.filter((name) => validNames.includes(name)),
      focusedIndex: Math.min(this.state.focusedIndex, items.length - 1),
    }

    this.render()
  }

  /**
   * コンポーネントを破棄
   */
  destroy(): void {
    this.container.innerHTML = ''
    this.itemElements.clear()
  }

  // ===========================================================================
  // Private Methods - Initialization
  // ===========================================================================

  private createInitialState(): AccordionPanelState {
    const defaultExpanded = this.config.defaultExpanded ?? []
    const expandableMultiply = this.config.expandableMultiply ?? true

    // 単一展開モードの場合、最初の一つのみ展開
    const expandedItems = expandableMultiply
      ? defaultExpanded.filter((name) => {
          const item = this.config.items.find((i) => i.name === name)
          return item && !item.disabled
        })
      : defaultExpanded.slice(0, 1).filter((name) => {
          const item = this.config.items.find((i) => i.name === name)
          return item && !item.disabled
        })

    return {
      expandedItems,
      focusedIndex: -1,
    }
  }

  // ===========================================================================
  // Private Methods - Rendering
  // ===========================================================================

  private renderItem(item: AccordionItem, index: number): HTMLElement {
    const isExpanded = this.state.expandedItems.includes(item.name)
    const triggerId = `${this.instanceId}-trigger-${item.name}`
    const contentId = `${this.instanceId}-content-${item.name}`

    const itemWrapper = createElement('div', {
      className: `accordion-item${item.disabled ? ' is-disabled' : ''}${isExpanded ? ' is-expanded' : ''}`,
      attributes: {
        'data-name': item.name,
        'data-index': String(index),
      },
    })

    // ヘッダー（トリガー）
    const trigger = this.renderTrigger(item, isExpanded, triggerId, contentId)
    itemWrapper.appendChild(trigger)

    // コンテンツパネル
    const content = this.renderContent(item, isExpanded, contentId, triggerId)
    itemWrapper.appendChild(content)

    // 要素を保存
    this.itemElements.set(item.name, { trigger, content })

    return itemWrapper
  }

  private renderTrigger(
    item: AccordionItem,
    isExpanded: boolean,
    triggerId: string,
    contentId: string
  ): HTMLElement {
    const iconPosition = this.config.iconPosition ?? 'left'

    const trigger = createElement('button', {
      className: 'accordion-trigger',
      attributes: {
        type: 'button',
        id: triggerId,
        'aria-expanded': String(isExpanded),
        'aria-controls': contentId,
        'aria-disabled': item.disabled ? 'true' : 'false',
        tabindex: item.disabled ? '-1' : '0',
      },
    })

    // アイコン（左配置の場合）
    if (iconPosition === 'left') {
      const icon = this.renderIcon(isExpanded, iconPosition)
      trigger.appendChild(icon)
    }

    // タイトルアイコン（ユーザー指定）
    if (item.icon) {
      const titleIcon = createElement('span', {
        className: 'accordion-trigger-title-icon',
      })
      titleIcon.innerHTML = item.icon
      trigger.appendChild(titleIcon)
    }

    // タイトルテキスト
    const title = createElement('span', {
      className: 'accordion-trigger-title',
      textContent: item.title,
    })
    trigger.appendChild(title)

    // アイコン（右配置の場合）
    if (iconPosition === 'right') {
      const icon = this.renderIcon(isExpanded, iconPosition)
      trigger.appendChild(icon)
    }

    // クリックイベント
    if (!item.disabled) {
      trigger.addEventListener('click', () => {
        this.toggle(item.name)
      })
    }

    return trigger
  }

  private renderIcon(isExpanded: boolean, position: IconPosition): HTMLElement {
    const icon = createElement('span', {
      className: `accordion-icon accordion-icon-${position}${isExpanded ? ' is-expanded' : ''}`,
      attributes: {
        'aria-hidden': 'true',
      },
    })

    // キャレットアイコン
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('width', '16')
    svg.setAttribute('height', '16')
    svg.setAttribute('viewBox', '0 0 16 16')
    svg.setAttribute('fill', 'currentColor')

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')

    if (position === 'left') {
      // 右向き矢印 → 展開時に90度回転して下向きに
      path.setAttribute('d', 'M6 3l5 5-5 5V3z')
    } else {
      // 下向き矢印 → 展開時に180度回転して上向きに
      path.setAttribute('d', 'M3 6l5 5 5-5H3z')
    }

    svg.appendChild(path)
    icon.appendChild(svg)

    return icon
  }

  private renderContent(
    item: AccordionItem,
    isExpanded: boolean,
    contentId: string,
    triggerId: string
  ): HTMLElement {
    const wrapper = createElement('div', {
      className: `accordion-content-wrapper${isExpanded ? ' is-expanded' : ''}`,
    })

    const content = createElement('div', {
      className: 'accordion-content',
      attributes: {
        id: contentId,
        role: 'region',
        'aria-labelledby': triggerId,
      },
    })

    if (!isExpanded) {
      content.setAttribute('hidden', '')
    }

    // コンテンツを追加
    if (typeof item.content === 'string') {
      content.innerHTML = item.content
    } else {
      content.appendChild(item.content)
    }

    wrapper.appendChild(content)

    return wrapper
  }

  // ===========================================================================
  // Private Methods - State Updates
  // ===========================================================================

  private updateItemState(name: string, isExpanded: boolean): void {
    const elements = this.itemElements.get(name)
    if (!elements) {
      return
    }

    const { trigger, content } = elements
    const itemWrapper = trigger.parentElement

    // トリガーの状態更新
    trigger.setAttribute('aria-expanded', String(isExpanded))

    // アイコンの状態更新
    const icon = trigger.querySelector('.accordion-icon')
    if (icon) {
      if (isExpanded) {
        icon.classList.add('is-expanded')
      } else {
        icon.classList.remove('is-expanded')
      }
    }

    // ラッパーの状態更新
    if (isExpanded) {
      itemWrapper?.classList.add('is-expanded')
      content.classList.add('is-expanded')
    } else {
      itemWrapper?.classList.remove('is-expanded')
      content.classList.remove('is-expanded')
    }

    // コンテンツパネルの表示/非表示
    const contentPanel = content.querySelector('.accordion-content')
    if (contentPanel) {
      if (isExpanded) {
        contentPanel.removeAttribute('hidden')
      } else {
        // アニメーション終了後にhiddenを設定
        setTimeout(() => {
          if (!this.state.expandedItems.includes(name)) {
            contentPanel.setAttribute('hidden', '')
          }
        }, 200) // アニメーション時間に合わせる
      }
    }
  }

  // ===========================================================================
  // Private Methods - Keyboard Navigation
  // ===========================================================================

  private attachKeyboardEvents(): void {
    this.container.addEventListener('keydown', (event) => {
      const target = event.target as HTMLElement

      if (!target.classList.contains('accordion-trigger')) {
        return
      }

      const currentIndex = parseInt(target.closest('.accordion-item')?.getAttribute('data-index') ?? '-1', 10)

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          this.focusNextItem(currentIndex)
          break

        case 'ArrowUp':
          event.preventDefault()
          this.focusPreviousItem(currentIndex)
          break

        case 'Home':
          event.preventDefault()
          this.focusFirstItem()
          break

        case 'End':
          event.preventDefault()
          this.focusLastItem()
          break

        case 'Enter':
        case ' ':
          // クリックイベントで処理されるため、ここでは何もしない
          break
      }
    })
  }

  private focusNextItem(currentIndex: number): void {
    const enabledItems = this.config.items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => !item.disabled)

    const currentEnabledIndex = enabledItems.findIndex(({ index }) => index === currentIndex)
    const nextEnabledIndex = (currentEnabledIndex + 1) % enabledItems.length
    const nextItem = enabledItems[nextEnabledIndex]

    if (nextItem) {
      this.focusItem(nextItem.item.name)
    }
  }

  private focusPreviousItem(currentIndex: number): void {
    const enabledItems = this.config.items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => !item.disabled)

    const currentEnabledIndex = enabledItems.findIndex(({ index }) => index === currentIndex)
    const previousEnabledIndex = currentEnabledIndex <= 0 ? enabledItems.length - 1 : currentEnabledIndex - 1
    const previousItem = enabledItems[previousEnabledIndex]

    if (previousItem) {
      this.focusItem(previousItem.item.name)
    }
  }

  private focusFirstItem(): void {
    const firstEnabled = this.config.items.find((item) => !item.disabled)
    if (firstEnabled) {
      this.focusItem(firstEnabled.name)
    }
  }

  private focusLastItem(): void {
    const enabledItems = this.config.items.filter((item) => !item.disabled)
    const lastEnabled = enabledItems[enabledItems.length - 1]
    if (lastEnabled) {
      this.focusItem(lastEnabled.name)
    }
  }

  private focusItem(name: string): void {
    const elements = this.itemElements.get(name)
    if (elements) {
      elements.trigger.focus()
    }
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * アコーディオンパネルを作成
 */
export function createAccordionPanel(
  container: HTMLElement,
  config: AccordionPanelConfig,
  callbacks?: AccordionPanelCallbacks
): AccordionPanel {
  const accordion = new AccordionPanel(container, config, callbacks)
  accordion.render()
  return accordion
}

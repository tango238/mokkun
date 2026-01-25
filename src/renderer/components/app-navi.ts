/**
 * AppNavi Component
 * プロダクト内の主要な機能を切り替えるためのナビゲーションコンポーネント
 *
 * SmartHR Design System の AppNavi を参考に実装
 * https://smarthr.design/products/components/app-navi/
 */

import { createElement, clearElement, generateId } from '../utils/dom'

// =============================================================================
// Types
// =============================================================================

/**
 * ナビゲーションアイテムの基本型
 */
interface AppNaviItemBase {
  /** アイテムID */
  id: string
  /** 表示ラベル */
  label: string
  /** アイコン（HTML文字列、SVGなど） */
  icon?: string
  /** 無効化 */
  disabled?: boolean
  /** 現在のページ/セクションを示す */
  current?: boolean
}

/**
 * ボタンタイプのナビゲーションアイテム
 */
export interface AppNaviButtonItem extends AppNaviItemBase {
  type: 'button'
  /** クリック時のハンドラー */
  onClick?: (id: string) => void
}

/**
 * アンカー（リンク）タイプのナビゲーションアイテム
 */
export interface AppNaviAnchorItem extends AppNaviItemBase {
  type: 'anchor'
  /** リンク先URL */
  href: string
  /** ターゲット属性 */
  target?: '_blank' | '_self' | '_parent' | '_top'
}

/**
 * ドロップダウンのメニュー項目
 */
export interface AppNaviDropdownMenuItem {
  /** アイテムID */
  id: string
  /** 表示ラベル */
  label: string
  /** アイコン（HTML文字列） */
  icon?: string
  /** 無効化 */
  disabled?: boolean
  /** リンク先URL（アンカー時） */
  href?: string
  /** クリック時のハンドラー */
  onClick?: (id: string) => void
}

/**
 * ドロップダウンタイプのナビゲーションアイテム
 */
export interface AppNaviDropdownItem extends AppNaviItemBase {
  type: 'dropdown'
  /** ドロップダウンメニュー項目 */
  dropdownItems: AppNaviDropdownMenuItem[]
}

/**
 * ナビゲーションアイテムのユニオン型
 */
export type AppNaviItem = AppNaviButtonItem | AppNaviAnchorItem | AppNaviDropdownItem

/**
 * AppNaviの状態
 */
export interface AppNaviState {
  /** ナビゲーションアイテム */
  items: AppNaviItem[]
  /** 開いているドロップダウンのID（null = 全て閉じている） */
  openDropdownId: string | null
}

/**
 * AppNaviのコールバック
 */
export interface AppNaviCallbacks {
  /** アイテムクリック時 */
  onItemClick?: (itemId: string, item: AppNaviItem) => void
  /** ドロップダウン開閉時 */
  onDropdownToggle?: (itemId: string, isOpen: boolean) => void
}

/**
 * AppNaviの設定
 */
export interface AppNaviConfig {
  /** ナビゲーションラベル（アクセシビリティ用） */
  label?: string
  /** 追加の領域（右側に表示するカスタムコンテンツ） */
  additionalArea?: HTMLElement | (() => HTMLElement)
  /** ナビゲーションアイテム */
  items: AppNaviItem[]
}

// =============================================================================
// AppNavi Class
// =============================================================================

/**
 * AppNaviコンポーネント
 */
export class AppNavi {
  private config: AppNaviConfig
  private state: AppNaviState
  private callbacks: AppNaviCallbacks
  private container: HTMLElement
  private instanceId: string
  private clickOutsideHandler: ((e: MouseEvent) => void) | null = null

  constructor(
    container: HTMLElement,
    config: AppNaviConfig,
    callbacks: AppNaviCallbacks = {}
  ) {
    this.validateConfig(config, container)
    this.config = config
    this.container = container
    this.callbacks = callbacks
    this.instanceId = generateId('app-navi')
    this.state = this.createInitialState()
  }

  // ===========================================================================
  // Public Methods
  // ===========================================================================

  /**
   * ナビゲーションをレンダリング
   */
  render(): void {
    clearElement(this.container)
    this.detachEventListeners()

    this.container.className = 'mokkun-app-navi'
    this.container.setAttribute('role', 'navigation')
    this.container.setAttribute('aria-label', this.config.label ?? 'アプリナビゲーション')

    const wrapper = createElement('div', { className: 'app-navi-wrapper' })

    // ナビゲーションリスト
    const navList = this.renderNavList()
    wrapper.appendChild(navList)

    // 追加領域
    if (this.config.additionalArea) {
      const additionalArea = this.renderAdditionalArea()
      wrapper.appendChild(additionalArea)
    }

    this.container.appendChild(wrapper)

    // ドロップダウンが開いている場合、外側クリックハンドラーをアタッチ
    if (this.state.openDropdownId !== null) {
      this.attachClickOutsideHandler()
    }
  }

  /**
   * 現在の状態を取得
   */
  getState(): AppNaviState {
    return {
      ...this.state,
      items: this.state.items.map(item => ({ ...item })),
    }
  }

  /**
   * 指定アイテムを現在のアイテムとして設定
   */
  setCurrent(itemId: string): boolean {
    const index = this.state.items.findIndex(item => item.id === itemId)
    if (index === -1) {
      return false
    }

    this.state = {
      ...this.state,
      items: this.state.items.map(item => ({
        ...item,
        current: item.id === itemId,
      })),
    }

    this.render()
    return true
  }

  /**
   * 全てのcurrentをリセット
   */
  clearCurrent(): void {
    this.state = {
      ...this.state,
      items: this.state.items.map(item => ({
        ...item,
        current: false,
      })),
    }

    this.render()
  }

  /**
   * ドロップダウンを開く
   */
  openDropdown(itemId: string): boolean {
    const item = this.state.items.find(i => i.id === itemId)
    if (!item || item.type !== 'dropdown') {
      return false
    }

    this.state = {
      ...this.state,
      openDropdownId: itemId,
    }

    this.render()
    this.callbacks.onDropdownToggle?.(itemId, true)
    return true
  }

  /**
   * ドロップダウンを閉じる
   */
  closeDropdown(): void {
    if (this.state.openDropdownId === null) {
      return
    }

    const closedId = this.state.openDropdownId
    this.state = {
      ...this.state,
      openDropdownId: null,
    }

    this.render()
    this.callbacks.onDropdownToggle?.(closedId, false)
  }

  /**
   * アイテムを追加
   */
  addItem(item: AppNaviItem, index?: number): void {
    const newItems = [...this.state.items]
    if (index !== undefined && index >= 0 && index <= newItems.length) {
      newItems.splice(index, 0, item)
    } else {
      newItems.push(item)
    }

    this.state = {
      ...this.state,
      items: newItems,
    }

    this.render()
  }

  /**
   * アイテムを削除
   */
  removeItem(itemId: string): boolean {
    const index = this.state.items.findIndex(item => item.id === itemId)
    if (index === -1) {
      return false
    }

    this.state = {
      ...this.state,
      items: this.state.items.filter(item => item.id !== itemId),
      openDropdownId: this.state.openDropdownId === itemId ? null : this.state.openDropdownId,
    }

    this.render()
    return true
  }

  /**
   * アイテムを更新
   */
  updateItem(itemId: string, updates: Partial<AppNaviItem>): boolean {
    const index = this.state.items.findIndex(item => item.id === itemId)
    if (index === -1) {
      return false
    }

    this.state = {
      ...this.state,
      items: this.state.items.map(item =>
        item.id === itemId ? { ...item, ...updates } as AppNaviItem : item
      ),
    }

    this.render()
    return true
  }

  /**
   * コンポーネントを破棄
   */
  destroy(): void {
    this.detachEventListeners()
    clearElement(this.container)
  }

  // ===========================================================================
  // Private Methods - Validation
  // ===========================================================================

  private validateConfig(config: AppNaviConfig, container: HTMLElement): void {
    if (!config?.items || !Array.isArray(config.items)) {
      throw new Error('AppNavi: config.items must be an array')
    }
    if (!(container instanceof HTMLElement)) {
      throw new Error('AppNavi: container must be an HTMLElement')
    }

    for (const item of config.items) {
      if (!item.id || typeof item.id !== 'string') {
        throw new Error('AppNavi: Each item must have a valid id')
      }
      if (!item.label || typeof item.label !== 'string') {
        throw new Error(`AppNavi: Item "${item.id}" must have a valid label`)
      }
    }
  }

  // ===========================================================================
  // Private Methods - State
  // ===========================================================================

  private createInitialState(): AppNaviState {
    return {
      items: [...this.config.items],
      openDropdownId: null,
    }
  }

  // ===========================================================================
  // Private Methods - Rendering
  // ===========================================================================

  private renderNavList(): HTMLElement {
    const navList = createElement('ul', {
      className: 'app-navi-list',
      attributes: { role: 'list' },
    })

    for (const item of this.state.items) {
      const navItem = this.renderNavItem(item)
      navList.appendChild(navItem)
    }

    return navList
  }

  private renderNavItem(item: AppNaviItem): HTMLElement {
    const li = createElement('li', {
      className: 'app-navi-item',
    })

    switch (item.type) {
      case 'button':
        li.appendChild(this.renderButton(item))
        break
      case 'anchor':
        li.appendChild(this.renderAnchor(item))
        break
      case 'dropdown':
        li.appendChild(this.renderDropdown(item))
        break
    }

    return li
  }

  private renderButton(item: AppNaviButtonItem): HTMLElement {
    const classNames = [
      'app-navi-button',
      item.current ? 'is-current' : '',
      item.disabled ? 'is-disabled' : '',
    ].filter(Boolean).join(' ')

    const button = createElement('button', {
      className: classNames,
      attributes: {
        type: 'button',
        'aria-current': item.current ? 'page' : '',
        'aria-disabled': item.disabled ? 'true' : 'false',
        'data-item-id': item.id,
      },
    })

    if (!item.current) {
      button.removeAttribute('aria-current')
    }

    if (item.disabled) {
      button.setAttribute('disabled', 'true')
    }

    // アイコン
    if (item.icon) {
      const icon = createElement('span', { className: 'app-navi-icon' })
      icon.innerHTML = item.icon
      button.appendChild(icon)
    }

    // ラベル
    const label = createElement('span', {
      className: 'app-navi-label',
      textContent: item.label,
    })
    button.appendChild(label)

    // 現在インジケーター
    if (item.current) {
      const indicator = createElement('span', {
        className: 'app-navi-current-indicator',
        attributes: { 'aria-hidden': 'true' },
      })
      button.appendChild(indicator)
    }

    // クリックイベント
    if (!item.disabled) {
      button.addEventListener('click', () => {
        item.onClick?.(item.id)
        this.callbacks.onItemClick?.(item.id, item)
      })
    }

    return button
  }

  private renderAnchor(item: AppNaviAnchorItem): HTMLElement {
    const classNames = [
      'app-navi-anchor',
      item.current ? 'is-current' : '',
      item.disabled ? 'is-disabled' : '',
    ].filter(Boolean).join(' ')

    const anchor = createElement('a', {
      className: classNames,
      attributes: {
        href: item.disabled ? '' : item.href,
        'aria-current': item.current ? 'page' : '',
        'aria-disabled': item.disabled ? 'true' : 'false',
        'data-item-id': item.id,
      },
    })

    if (!item.current) {
      anchor.removeAttribute('aria-current')
    }

    if (item.target) {
      anchor.setAttribute('target', item.target)
      if (item.target === '_blank') {
        anchor.setAttribute('rel', 'noopener noreferrer')
      }
    }

    if (item.disabled) {
      anchor.removeAttribute('href')
      anchor.setAttribute('tabindex', '-1')
    }

    // アイコン
    if (item.icon) {
      const icon = createElement('span', { className: 'app-navi-icon' })
      icon.innerHTML = item.icon
      anchor.appendChild(icon)
    }

    // ラベル
    const label = createElement('span', {
      className: 'app-navi-label',
      textContent: item.label,
    })
    anchor.appendChild(label)

    // 現在インジケーター
    if (item.current) {
      const indicator = createElement('span', {
        className: 'app-navi-current-indicator',
        attributes: { 'aria-hidden': 'true' },
      })
      anchor.appendChild(indicator)
    }

    // クリックイベント（コールバック用）
    if (!item.disabled) {
      anchor.addEventListener('click', () => {
        this.callbacks.onItemClick?.(item.id, item)
      })
    }

    return anchor
  }

  private renderDropdown(item: AppNaviDropdownItem): HTMLElement {
    const isOpen = this.state.openDropdownId === item.id

    const wrapper = createElement('div', {
      className: `app-navi-dropdown-wrapper${isOpen ? ' is-open' : ''}`,
    })

    // トリガーボタン
    const classNames = [
      'app-navi-dropdown-trigger',
      item.current ? 'is-current' : '',
      item.disabled ? 'is-disabled' : '',
      isOpen ? 'is-open' : '',
    ].filter(Boolean).join(' ')

    const trigger = createElement('button', {
      className: classNames,
      attributes: {
        type: 'button',
        'aria-haspopup': 'true',
        'aria-expanded': String(isOpen),
        'aria-controls': `${this.instanceId}-dropdown-${item.id}`,
        'aria-current': item.current ? 'page' : '',
        'aria-disabled': item.disabled ? 'true' : 'false',
        'data-item-id': item.id,
      },
    })

    if (!item.current) {
      trigger.removeAttribute('aria-current')
    }

    if (item.disabled) {
      trigger.setAttribute('disabled', 'true')
    }

    // アイコン
    if (item.icon) {
      const icon = createElement('span', { className: 'app-navi-icon' })
      icon.innerHTML = item.icon
      trigger.appendChild(icon)
    }

    // ラベル
    const label = createElement('span', {
      className: 'app-navi-label',
      textContent: item.label,
    })
    trigger.appendChild(label)

    // キャレット
    const caret = createElement('span', {
      className: 'app-navi-caret',
      textContent: '▼',
      attributes: { 'aria-hidden': 'true' },
    })
    trigger.appendChild(caret)

    // 現在インジケーター
    if (item.current) {
      const indicator = createElement('span', {
        className: 'app-navi-current-indicator',
        attributes: { 'aria-hidden': 'true' },
      })
      trigger.appendChild(indicator)
    }

    // クリックイベント
    if (!item.disabled) {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation()
        if (isOpen) {
          this.closeDropdown()
        } else {
          this.openDropdown(item.id)
        }
        this.callbacks.onItemClick?.(item.id, item)
      })
    }

    wrapper.appendChild(trigger)

    // ドロップダウンメニュー
    if (isOpen) {
      const menu = this.renderDropdownMenu(item)
      wrapper.appendChild(menu)
    }

    return wrapper
  }

  private renderDropdownMenu(item: AppNaviDropdownItem): HTMLElement {
    const menu = createElement('ul', {
      className: 'app-navi-dropdown-menu',
      attributes: {
        role: 'menu',
        id: `${this.instanceId}-dropdown-${item.id}`,
      },
    })

    for (const menuItem of item.dropdownItems) {
      const li = createElement('li', {
        className: 'app-navi-dropdown-menu-item',
        attributes: { role: 'presentation' },
      })

      const itemElement = this.renderDropdownMenuItem(menuItem, item.id)
      li.appendChild(itemElement)
      menu.appendChild(li)
    }

    return menu
  }

  private renderDropdownMenuItem(menuItem: AppNaviDropdownMenuItem, _parentId: string): HTMLElement {
    const classNames = [
      'app-navi-dropdown-menu-button',
      menuItem.disabled ? 'is-disabled' : '',
    ].filter(Boolean).join(' ')

    // href がある場合はアンカー、なければボタン
    if (menuItem.href && !menuItem.disabled) {
      const anchor = createElement('a', {
        className: classNames.replace('button', 'anchor'),
        attributes: {
          href: menuItem.href,
          role: 'menuitem',
          'data-menu-item-id': menuItem.id,
        },
      })

      // アイコン
      if (menuItem.icon) {
        const icon = createElement('span', { className: 'app-navi-dropdown-menu-icon' })
        icon.innerHTML = menuItem.icon
        anchor.appendChild(icon)
      }

      // ラベル
      const label = createElement('span', {
        className: 'app-navi-dropdown-menu-label',
        textContent: menuItem.label,
      })
      anchor.appendChild(label)

      anchor.addEventListener('click', () => {
        menuItem.onClick?.(menuItem.id)
        this.closeDropdown()
      })

      return anchor
    }

    const button = createElement('button', {
      className: classNames,
      attributes: {
        type: 'button',
        role: 'menuitem',
        'aria-disabled': menuItem.disabled ? 'true' : 'false',
        'data-menu-item-id': menuItem.id,
      },
    })

    if (menuItem.disabled) {
      button.setAttribute('disabled', 'true')
    }

    // アイコン
    if (menuItem.icon) {
      const icon = createElement('span', { className: 'app-navi-dropdown-menu-icon' })
      icon.innerHTML = menuItem.icon
      button.appendChild(icon)
    }

    // ラベル
    const label = createElement('span', {
      className: 'app-navi-dropdown-menu-label',
      textContent: menuItem.label,
    })
    button.appendChild(label)

    // クリックイベント
    if (!menuItem.disabled) {
      button.addEventListener('click', () => {
        menuItem.onClick?.(menuItem.id)
        this.closeDropdown()
      })
    }

    return button
  }

  private renderAdditionalArea(): HTMLElement {
    const area = createElement('div', { className: 'app-navi-additional-area' })

    const content = typeof this.config.additionalArea === 'function'
      ? this.config.additionalArea()
      : this.config.additionalArea

    if (content) {
      area.appendChild(content)
    }

    return area
  }

  // ===========================================================================
  // Private Methods - Event Listeners
  // ===========================================================================

  private attachClickOutsideHandler(): void {
    this.clickOutsideHandler = (e: MouseEvent) => {
      const target = e.target as Node
      const dropdownWrapper = this.container.querySelector('.app-navi-dropdown-wrapper.is-open')

      if (dropdownWrapper && !dropdownWrapper.contains(target)) {
        this.closeDropdown()
      }
    }

    // 次のイベントループで追加（現在のクリックイベントが完了してから）
    setTimeout(() => {
      document.addEventListener('click', this.clickOutsideHandler!)
    }, 0)
  }

  private detachEventListeners(): void {
    if (this.clickOutsideHandler) {
      document.removeEventListener('click', this.clickOutsideHandler)
      this.clickOutsideHandler = null
    }
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * AppNaviコンポーネントを作成するファクトリー関数
 */
export function createAppNavi(
  container: HTMLElement,
  config: AppNaviConfig,
  callbacks?: AppNaviCallbacks
): AppNavi {
  const appNavi = new AppNavi(container, config, callbacks)
  appNavi.render()
  return appNavi
}

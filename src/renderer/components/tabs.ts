/**
 * Tabs Component
 * タブUIコンポーネント
 */

import type { InputField } from '../../types'
import { createElement, clearElement, generateId } from '../utils/dom'

// =============================================================================
// Types
// =============================================================================

/**
 * 遅延読み込み関数の型
 */
export type LazyLoadFn = (tabId: string) => Promise<string>

/**
 * タブ定義
 */
export interface TabDefinition {
  /** タブID（英数字、ハイフン、アンダースコアのみ推奨） */
  id: string
  /** タブラベル */
  label: string
  /**
   * タブアイコン（オプション）
   * @security HTML文字列として設定されるため、信頼されたソースからのみ使用すること
   */
  icon?: string
  /** アイコンの代替テキスト（アクセシビリティ用） */
  iconLabel?: string
  /** 無効化 */
  disabled?: boolean
  /** バッジ（通知数等） */
  badge?: string | number
  /** タブ内のフィールド */
  fields?: InputField[]
  /**
   * タブ内のカスタムコンテンツ（HTML文字列）
   * @security HTML文字列として設定されるため、信頼されたソースからのみ使用すること
   */
  content?: string
  /**
   * 遅延読み込み関数
   * @security 戻り値はHTML文字列として設定されるため、信頼されたソースからのみ使用すること
   */
  lazyLoad?: LazyLoadFn
}

/**
 * タブの状態
 */
export interface TabsState {
  /** 現在のアクティブタブID */
  activeTabId: string
  /** タブ一覧 */
  tabs: TabDefinition[]
}

/**
 * タブのコールバック
 */
export interface TabsCallbacks {
  /** タブ変更時 */
  onTabChange?: (tabId: string, state: TabsState) => void
  /** フィールドレンダラー */
  renderFields?: (fields: InputField[], container: HTMLElement) => void
}

/**
 * タブの設定
 */
export interface TabsConfig {
  /** タブ一覧 */
  tabs: TabDefinition[]
  /** 初期アクティブタブID */
  defaultActiveTab?: string
  /** タブの配置 */
  position?: 'top' | 'bottom' | 'left' | 'right'
  /** タブのスタイル */
  variant?: 'default' | 'pills' | 'underline' | 'bordered' | 'segmented'
  /** ボーダー表示 */
  bordered?: boolean
  /** スクロール有効化（タブが多い場合） */
  scrollable?: boolean
  /** URLハッシュとの同期 */
  syncWithHash?: boolean
  /** ハッシュのプレフィックス（例: "section-"） */
  hashPrefix?: string
}

// =============================================================================
// Tabs Class
// =============================================================================

/**
 * タブコンポーネント
 */
export class Tabs {
  private config: TabsConfig
  private state: TabsState
  private callbacks: TabsCallbacks
  private container: HTMLElement
  private instanceId: string
  private hashChangeHandler: ((e: HashChangeEvent) => void) | null = null
  private lazyLoadCache: Map<string, string> = new Map()
  private loadingTabs: Set<string> = new Set()

  constructor(
    config: TabsConfig,
    container: HTMLElement,
    callbacks: TabsCallbacks = {}
  ) {
    this.config = config
    this.container = container
    this.callbacks = callbacks
    this.instanceId = generateId('tabs')
    this.state = this.createInitialState()
  }

  // ===========================================================================
  // Public Methods
  // ===========================================================================

  /**
   * タブをレンダリング
   */
  render(): void {
    clearElement(this.container)

    const position = this.config.position ?? 'top'
    const variant = this.config.variant ?? 'default'
    const bordered = this.config.bordered ?? false
    const scrollable = this.config.scrollable ?? false

    const classNames = [
      'mokkun-tabs',
      `tabs-${position}`,
      `tabs-${variant}`,
      bordered ? 'tabs-bordered' : '',
      scrollable ? 'tabs-scrollable' : '',
    ].filter(Boolean).join(' ')

    this.container.className = classNames

    const wrapper = createElement('div', { className: 'tabs-wrapper' })

    // 縦配置の場合はフレックス方向を調整
    if (position === 'left' || position === 'right') {
      wrapper.style.display = 'flex'
      wrapper.style.flexDirection = position === 'left' ? 'row' : 'row-reverse'
    }

    // タブヘッダー
    const tabList = this.renderTabList()
    wrapper.appendChild(tabList)

    // タブパネル
    const panels = this.renderPanels()
    wrapper.appendChild(panels)

    this.container.appendChild(wrapper)

    // URLハッシュ同期のセットアップ（重複登録を防止）
    if (this.config.syncWithHash && !this.hashChangeHandler) {
      this.setupHashSync()
    }

    // アクティブタブの遅延読み込みを実行
    this.loadLazyContent(this.state.activeTabId)
  }

  /**
   * タブを切り替え
   */
  setActiveTab(tabId: string): boolean {
    const tab = this.state.tabs.find(t => t.id === tabId)
    if (!tab || tab.disabled) {
      return false
    }

    if (this.state.activeTabId === tabId) {
      return true
    }

    this.state = {
      ...this.state,
      activeTabId: tabId,
    }

    this.render()
    this.callbacks.onTabChange?.(tabId, this.state)

    // URLハッシュを更新
    if (this.config.syncWithHash) {
      this.updateHash(tabId)
    }

    return true
  }

  /**
   * 次のタブへ移動
   */
  nextTab(): boolean {
    const currentIndex = this.state.tabs.findIndex(t => t.id === this.state.activeTabId)

    for (let i = currentIndex + 1; i < this.state.tabs.length; i++) {
      const tab = this.state.tabs[i]
      if (!tab.disabled) {
        return this.setActiveTab(tab.id)
      }
    }

    // 循環
    for (let i = 0; i < currentIndex; i++) {
      const tab = this.state.tabs[i]
      if (!tab.disabled) {
        return this.setActiveTab(tab.id)
      }
    }

    return false
  }

  /**
   * 前のタブへ移動
   */
  previousTab(): boolean {
    const currentIndex = this.state.tabs.findIndex(t => t.id === this.state.activeTabId)

    for (let i = currentIndex - 1; i >= 0; i--) {
      const tab = this.state.tabs[i]
      if (!tab.disabled) {
        return this.setActiveTab(tab.id)
      }
    }

    // 循環
    for (let i = this.state.tabs.length - 1; i > currentIndex; i--) {
      const tab = this.state.tabs[i]
      if (!tab.disabled) {
        return this.setActiveTab(tab.id)
      }
    }

    return false
  }

  /**
   * 現在の状態を取得
   */
  getState(): TabsState {
    return {
      ...this.state,
      tabs: this.state.tabs.map(t => ({ ...t })),
    }
  }

  /**
   * 現在のアクティブタブを取得
   */
  getActiveTab(): TabDefinition | undefined {
    return this.state.tabs.find(t => t.id === this.state.activeTabId)
  }

  /**
   * タブを追加
   */
  addTab(tab: TabDefinition, index?: number): void {
    const newTabs = [...this.state.tabs]
    if (index !== undefined && index >= 0 && index <= newTabs.length) {
      newTabs.splice(index, 0, tab)
    } else {
      newTabs.push(tab)
    }

    this.state = {
      ...this.state,
      tabs: newTabs,
    }

    this.render()
  }

  /**
   * タブを削除
   */
  removeTab(tabId: string): boolean {
    const index = this.state.tabs.findIndex(t => t.id === tabId)
    if (index === -1) {
      return false
    }

    const newTabs = this.state.tabs.filter(t => t.id !== tabId)

    // 削除されたタブがアクティブだった場合、別のタブをアクティブに
    let newActiveTabId = this.state.activeTabId
    if (this.state.activeTabId === tabId && newTabs.length > 0) {
      const enabledTab = newTabs.find(t => !t.disabled)
      newActiveTabId = enabledTab?.id ?? newTabs[0].id
    }

    this.state = {
      ...this.state,
      tabs: newTabs,
      activeTabId: newActiveTabId,
    }

    this.render()
    return true
  }

  /**
   * タブを更新
   */
  updateTab(tabId: string, updates: Partial<TabDefinition>): boolean {
    const index = this.state.tabs.findIndex(t => t.id === tabId)
    if (index === -1) {
      return false
    }

    this.state = {
      ...this.state,
      tabs: this.state.tabs.map(t =>
        t.id === tabId ? { ...t, ...updates } : t
      ),
    }

    this.render()
    return true
  }

  // ===========================================================================
  // Private Methods - Rendering
  // ===========================================================================

  /**
   * 初期状態を作成
   */
  private createInitialState(): TabsState {
    // URLハッシュから初期タブを取得
    let initialTabId: string | undefined
    if (this.config.syncWithHash) {
      initialTabId = this.getTabIdFromHash()
    }

    const defaultActiveTab = initialTabId
      ?? this.config.defaultActiveTab
      ?? this.config.tabs.find(t => !t.disabled)?.id
      ?? this.config.tabs[0]?.id
      ?? ''

    return {
      activeTabId: defaultActiveTab,
      tabs: [...this.config.tabs],
    }
  }

  /**
   * タブリストをレンダリング
   */
  private renderTabList(): HTMLElement {
    const tabList = createElement('div', {
      className: 'tabs-list',
      attributes: { role: 'tablist' },
    })

    for (const tab of this.state.tabs) {
      const tabButton = this.renderTabButton(tab)
      tabList.appendChild(tabButton)
    }

    // キーボードナビゲーション
    tabList.addEventListener('keydown', (e) => this.handleKeyDown(e))

    return tabList
  }

  /**
   * タブボタンをレンダリング
   */
  private renderTabButton(tab: TabDefinition): HTMLElement {
    const isActive = tab.id === this.state.activeTabId
    const className = [
      'tab-button',
      isActive ? 'active' : '',
      tab.disabled ? 'disabled' : '',
    ].filter(Boolean).join(' ')

    const button = createElement('button', {
      className,
      attributes: {
        type: 'button',
        role: 'tab',
        'aria-selected': String(isActive),
        'aria-controls': `${this.instanceId}-panel-${tab.id}`,
        id: `${this.instanceId}-tab-${tab.id}`,
        tabindex: isActive ? '0' : '-1',
      },
    })

    if (tab.disabled) {
      button.setAttribute('aria-disabled', 'true')
    }

    // アイコン
    if (tab.icon) {
      const icon = createElement('span', {
        className: 'tab-icon',
        attributes: tab.iconLabel ? {
          'aria-label': tab.iconLabel,
          role: 'img',
        } : {},
      })
      icon.innerHTML = tab.icon
      button.appendChild(icon)
    }

    // ラベル
    const label = createElement('span', {
      className: 'tab-label',
      textContent: tab.label,
    })
    button.appendChild(label)

    // バッジ
    if (tab.badge !== undefined) {
      const badge = createElement('span', {
        className: 'tab-badge',
        textContent: String(tab.badge),
      })
      button.appendChild(badge)
    }

    // クリックイベント
    if (!tab.disabled) {
      button.addEventListener('click', () => this.setActiveTab(tab.id))
    }

    return button
  }

  /**
   * パネルをレンダリング
   */
  private renderPanels(): HTMLElement {
    const panels = createElement('div', { className: 'tabs-panels' })

    for (const tab of this.state.tabs) {
      const panel = this.renderPanel(tab)
      panels.appendChild(panel)
    }

    return panels
  }

  /**
   * 個別パネルをレンダリング
   */
  private renderPanel(tab: TabDefinition): HTMLElement {
    const isActive = tab.id === this.state.activeTabId

    const panel = createElement('div', {
      className: `tab-panel ${isActive ? 'active' : ''}`,
      attributes: {
        role: 'tabpanel',
        id: `${this.instanceId}-panel-${tab.id}`,
        'aria-labelledby': `${this.instanceId}-tab-${tab.id}`,
        hidden: isActive ? '' : 'true',
      },
    })

    if (isActive) {
      panel.removeAttribute('hidden')
    }

    // コンテンツをレンダリング
    if (tab.fields && this.callbacks.renderFields) {
      this.callbacks.renderFields(tab.fields, panel)
    } else if (tab.content) {
      panel.innerHTML = tab.content
    } else if (tab.fields) {
      // デフォルトのフィールドプレースホルダー
      for (const field of tab.fields) {
        const fieldEl = createElement('div', {
          className: 'field-placeholder',
          textContent: `[${field.type}] ${field.label}`,
        })
        panel.appendChild(fieldEl)
      }
    }

    return panel
  }

  /**
   * キーボードイベントを処理
   */
  private handleKeyDown(e: KeyboardEvent): void {
    const position = this.config.position ?? 'top'
    const isVertical = position === 'left' || position === 'right'

    switch (e.key) {
      case 'ArrowLeft':
        if (!isVertical) {
          e.preventDefault()
          this.previousTab()
        }
        break
      case 'ArrowRight':
        if (!isVertical) {
          e.preventDefault()
          this.nextTab()
        }
        break
      case 'ArrowUp':
        if (isVertical) {
          e.preventDefault()
          this.previousTab()
        }
        break
      case 'ArrowDown':
        if (isVertical) {
          e.preventDefault()
          this.nextTab()
        }
        break
      case 'Home':
        e.preventDefault()
        const firstEnabled = this.state.tabs.find(t => !t.disabled)
        if (firstEnabled) {
          this.setActiveTab(firstEnabled.id)
        }
        break
      case 'End':
        e.preventDefault()
        const lastEnabled = [...this.state.tabs].reverse().find(t => !t.disabled)
        if (lastEnabled) {
          this.setActiveTab(lastEnabled.id)
        }
        break
    }
  }

  // ===========================================================================
  // Private Methods - URL Hash Sync
  // ===========================================================================

  /**
   * URLハッシュ同期をセットアップ
   */
  private setupHashSync(): void {
    this.hashChangeHandler = () => {
      const tabId = this.getTabIdFromHash()
      if (tabId && tabId !== this.state.activeTabId) {
        const tab = this.state.tabs.find(t => t.id === tabId)
        if (tab && !tab.disabled) {
          this.state = {
            ...this.state,
            activeTabId: tabId,
          }
          this.render()
          this.callbacks.onTabChange?.(tabId, this.state)
        }
      }
    }
    window.addEventListener('hashchange', this.hashChangeHandler)
  }

  /**
   * ハッシュからタブIDを取得
   */
  private getTabIdFromHash(): string | undefined {
    const hash = window.location.hash.slice(1) // Remove '#'
    if (!hash) {
      return undefined
    }

    const prefix = this.config.hashPrefix ?? ''
    if (prefix && hash.startsWith(prefix)) {
      const tabId = hash.slice(prefix.length)
      const tab = this.state.tabs.find(t => t.id === tabId)
      return tab && !tab.disabled ? tabId : undefined
    }

    // Check if it's a valid tab ID
    const tab = this.config.tabs.find(t => t.id === hash)
    return tab && !tab.disabled ? hash : undefined
  }

  /**
   * URLハッシュを更新
   */
  private updateHash(tabId: string): void {
    const prefix = this.config.hashPrefix ?? ''
    window.location.hash = `${prefix}${tabId}`
  }

  // ===========================================================================
  // Private Methods - Lazy Loading
  // ===========================================================================

  /**
   * 遅延読み込みコンテンツを読み込む
   */
  private loadLazyContent(tabId: string): void {
    const tab = this.state.tabs.find(t => t.id === tabId)
    if (!tab?.lazyLoad) {
      return
    }

    // キャッシュがあれば使用
    if (this.lazyLoadCache.has(tabId)) {
      return
    }

    // 既に読み込み中
    if (this.loadingTabs.has(tabId)) {
      return
    }

    this.loadingTabs.add(tabId)

    // パネルにローディング表示
    const panel = this.container.querySelector(
      `#${this.instanceId}-panel-${tabId}`
    )
    if (panel) {
      const loadingDiv = createElement('div', {
        className: 'tab-loading',
        textContent: '読み込み中...',
      })
      clearElement(panel as HTMLElement)
      panel.appendChild(loadingDiv)
    }

    tab.lazyLoad(tabId)
      .then(content => {
        this.lazyLoadCache.set(tabId, content)
        this.loadingTabs.delete(tabId)

        // パネルにコンテンツを設定
        // Note: lazyLoadの戻り値はHTMLとして設定される（信頼されたソースからのコンテンツ前提）
        const currentPanel = this.container.querySelector(
          `#${this.instanceId}-panel-${tabId}`
        )
        if (currentPanel) {
          currentPanel.innerHTML = content
        }
      })
      .catch((error: Error) => {
        this.loadingTabs.delete(tabId)

        // パネルにエラー表示
        const currentPanel = this.container.querySelector(
          `#${this.instanceId}-panel-${tabId}`
        )
        if (currentPanel) {
          const errorDiv = createElement('div', {
            className: 'tab-error',
            textContent: `読み込みに失敗しました: ${error.message}`,
          })
          clearElement(currentPanel as HTMLElement)
          currentPanel.appendChild(errorDiv)
        }
      })
  }

  // ===========================================================================
  // Public Methods - Cleanup and Refresh
  // ===========================================================================

  /**
   * クリーンアップ（イベントリスナーの削除）
   */
  destroy(): void {
    if (this.hashChangeHandler) {
      window.removeEventListener('hashchange', this.hashChangeHandler)
      this.hashChangeHandler = null
    }
    this.lazyLoadCache.clear()
    this.loadingTabs.clear()
    clearElement(this.container)
  }

  /**
   * タブコンテンツを強制再読み込み
   */
  async refreshTabContent(tabId: string): Promise<void> {
    const tab = this.state.tabs.find(t => t.id === tabId)
    if (!tab?.lazyLoad) {
      return
    }

    // キャッシュをクリア
    this.lazyLoadCache.delete(tabId)

    // 再読み込み
    this.loadLazyContent(tabId)
  }
}

/**
 * Tabs Component
 * タブUIコンポーネント
 */

import type { InputField, TabsField } from '../../types'
import { createElement, clearElement, generateId } from '../utils/dom'
import { createFieldWrapper, escapeHtml } from '../utils/field-helpers'
import { renderIconHtml } from '../utils/icons'
import { renderFields } from './form-fields'

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

  // ===========================================================================
  // Static Field Renderer
  // ===========================================================================

  static renderField(field: InputField): string {
    const f = field as TabsField
    const rawItems = (Array.isArray(f.items) && f.items.length > 0 ? f.items : Array.isArray(f.tabs) ? f.tabs : [])
    if (rawItems.length === 0) {
      return createFieldWrapper(field, Tabs.renderDummy(field))
    }

    const uid = escapeHtml(`${field.id || 'tabs'}`)
    const items = rawItems.map((item, i) => ({ ...item, _id: String(item.id ?? `tab-${i + 1}`) }))
    const wanted = f.active ?? f.default
    const activeItem =
      items.find(t => t._id === wanted && !t.disabled) ??
      items.find(t => !t.disabled) ??
      items[0]

    const position = ['top', 'bottom', 'left', 'right'].includes(f.position ?? '') ? f.position : 'top'
    const variant = ['default', 'pills', 'underline', 'bordered', 'segmented'].includes(f.variant ?? '')
      ? f.variant
      : 'default'

    const buttons = items.map((t, i) => {
      const active = t === activeItem
      const cls = ['tab-button', active ? 'active' : '', t.disabled ? 'disabled' : ''].filter(Boolean).join(' ')
      const icon = renderIconHtml(t.icon, 'tab-icon')
      const badge = t.badge !== undefined && t.badge !== null && t.badge !== ''
        ? `<span class="tab-badge">${escapeHtml(String(t.badge))}</span>`
        : ''
      return `<button type="button" class="${cls}" role="tab" id="${uid}-tab-${i}" data-tab-index="${i}" aria-selected="${active}" aria-controls="${uid}-panel-${i}" tabindex="${active ? '0' : '-1'}"${t.disabled ? ' aria-disabled="true" disabled' : ''}>${icon}<span class="tab-label">${escapeHtml(String(t.label ?? t._id))}</span>${badge}</button>`
    }).join('')

    const panels = items.map((t, i) => {
      const active = t === activeItem
      let body = ''
      if (Array.isArray(t.fields) && t.fields.length > 0) {
        body = renderFields(t.fields)
      } else if (t.content) {
        body = `<p>${escapeHtml(String(t.content))}</p>`
      }
      return `<div class="tab-panel${active ? ' active' : ''}" role="tabpanel" id="${uid}-panel-${i}" aria-labelledby="${uid}-tab-${i}"${active ? '' : ' hidden'}>${body}</div>`
    }).join('')

    const html = `
      <div class="mokkun-tabs tabs-${position} tabs-${variant}" data-tabs-static>
        <div class="tabs-wrapper">
          <div class="tabs-list" role="tablist"${field.label ? ` aria-label="${escapeHtml(field.label)}"` : ''}${position === 'left' || position === 'right' ? ' aria-orientation="vertical"' : ''}>${buttons}</div>
          <div class="tabs-panels">${panels}</div>
        </div>
      </div>
    `
    return createFieldWrapper(field, html)
  }

  private static renderDummy(field: InputField): string {
    return `
      <div class="mokkun-tabs">
        <div class="tabs-list" role="tablist"${field.label ? ` aria-label="${escapeHtml(field.label)}"` : ''}>
          <button type="button" class="tab-button active" role="tab" aria-selected="true">タブ1</button>
          <button type="button" class="tab-button" role="tab" aria-selected="false">タブ2</button>
          <button type="button" class="tab-button" role="tab" aria-selected="false">タブ3</button>
        </div>
        <div class="tab-panel active" role="tabpanel">
          <p>タブコンテンツがここに表示されます</p>
        </div>
      </div>
    `
  }
}

/**
 * 静的出力（Tabs.renderField）のタブ切替を有効化する。クリックと矢印キーに対応。
 * @returns クリーンアップ関数
 */
export function attachTabsBehavior(container: HTMLElement): () => void {
  // 入れ子の tabs を拾わないよう、自身に属する要素だけを返す
  const own = (root: HTMLElement, sel: string): HTMLElement[] =>
    Array.from(root.querySelectorAll<HTMLElement>(sel)).filter(
      el => el.closest('[data-tabs-static]') === root
    )

  const activate = (root: HTMLElement, index: number, focus: boolean): void => {
    const buttons = Array.from(own(root, '[role="tab"][data-tab-index]'))
    const panels = Array.from(own(root, '[role="tabpanel"]'))
    buttons.forEach((b, i) => {
      const on = i === index
      b.classList.toggle('active', on)
      b.setAttribute('aria-selected', String(on))
      b.setAttribute('tabindex', on ? '0' : '-1')
      if (on && focus) b.focus()
    })
    panels.forEach((p, i) => {
      const on = i === index
      p.classList.toggle('active', on)
      if (on) p.removeAttribute('hidden')
      else p.setAttribute('hidden', '')
    })
  }

  const onClick = (e: Event): void => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[role="tab"][data-tab-index]')
    const root = btn?.closest<HTMLElement>('[data-tabs-static]')
    if (!btn || !root || !container.contains(root) || btn.hasAttribute('disabled')) return
    activate(root, Number(btn.dataset.tabIndex), false)
  }

  const onKeyDown = (e: KeyboardEvent): void => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[role="tab"][data-tab-index]')
    const root = btn?.closest<HTMLElement>('[data-tabs-static]')
    if (!btn || !root || !container.contains(root)) return
    const vertical = root.classList.contains('tabs-left') || root.classList.contains('tabs-right')
    const prev = vertical ? 'ArrowUp' : 'ArrowLeft'
    const next = vertical ? 'ArrowDown' : 'ArrowRight'
    const keys = [prev, next, 'ArrowLeft', 'ArrowRight', 'Home', 'End']
    if (!keys.includes(e.key)) return
    if (vertical && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) return
    const enabled = Array.from(own(root, '[role="tab"][data-tab-index]'))
      .filter(b => !b.hasAttribute('disabled'))
    const pos = enabled.indexOf(btn)
    if (pos < 0 || enabled.length === 0) return
    let target = pos
    if (e.key === 'Home') target = 0
    else if (e.key === 'End') target = enabled.length - 1
    else if (e.key === next || (!vertical && e.key === 'ArrowRight')) target = (pos + 1) % enabled.length
    else target = (pos - 1 + enabled.length) % enabled.length
    e.preventDefault()
    activate(root, Number(enabled[target].dataset.tabIndex), true)
  }

  container.addEventListener('click', onClick)
  container.addEventListener('keydown', onKeyDown)
  return () => {
    container.removeEventListener('click', onClick)
    container.removeEventListener('keydown', onKeyDown)
  }
}

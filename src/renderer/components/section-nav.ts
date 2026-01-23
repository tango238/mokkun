/**
 * Section Navigation Component
 * セクション間をスムーズスクロールで移動するナビゲーション
 */

import { createElement, clearElement } from '../utils/dom'

// =============================================================================
// Constants
// =============================================================================

/** Default scroll offset to account for sticky headers */
const DEFAULT_SCROLL_OFFSET = 80

/** Delay after scroll before resuming intersection observer updates */
const SCROLL_DEBOUNCE_MS = 1000

/**
 * Default root margin for intersection observer.
 * Top -20%: triggers slightly before section reaches top
 * Bottom -60%: section must be in upper 40% of viewport to be "active"
 */
const DEFAULT_ROOT_MARGIN = '-20% 0px -60% 0px'

// =============================================================================
// Types
// =============================================================================

/**
 * セクション定義
 */
export interface SectionDefinition {
  /** セクションID（HTMLのid属性と一致させる） */
  id: string
  /** セクション名 */
  label: string
  /** アイコン（絵文字のみサポート、HTMLは安全のためテキストとして表示） */
  icon?: string
  /** 無効化 */
  disabled?: boolean
}

/**
 * セクションナビの状態
 */
export interface SectionNavState {
  /** 現在アクティブなセクションID */
  activeSectionId: string
  /** セクション一覧 */
  sections: SectionDefinition[]
}

/**
 * セクションナビのコールバック
 */
export interface SectionNavCallbacks {
  /** セクション変更時（クリックによる遷移） */
  onSectionChange?: (sectionId: string, state: SectionNavState) => void
  /** スクロールによるアクティブセクション変更時 */
  onActiveChange?: (sectionId: string, state: SectionNavState) => void
}

/**
 * セクションナビの設定
 */
export interface SectionNavConfig {
  /** セクション一覧 */
  sections: SectionDefinition[]
  /** 初期アクティブセクションID */
  defaultActiveSection?: string
  /** スクロールオフセット（sticky headerの高さ考慮） */
  scrollOffset?: number
  /** スクロール動作 */
  scrollBehavior?: ScrollBehavior
  /** モバイル表示モード */
  mobileMode?: 'scroll' | 'dropdown'
  /** スティッキー位置（top値） */
  stickyTop?: string
  /** Intersection Observer のルートマージン */
  rootMargin?: string
  /** Intersection Observer の閾値 */
  threshold?: number | number[]
}

// =============================================================================
// SectionNav Class
// =============================================================================

/**
 * セクションナビゲーションコンポーネント
 */
export class SectionNav {
  private config: SectionNavConfig
  private state: SectionNavState
  private callbacks: SectionNavCallbacks
  private container: HTMLElement
  private observer: IntersectionObserver | null = null
  private isScrolling = false
  private scrollTimeout: number | null = null
  private documentClickHandler: ((e: MouseEvent) => void) | null = null

  constructor(
    config: SectionNavConfig,
    container: HTMLElement,
    callbacks: SectionNavCallbacks = {}
  ) {
    this.validateConfig(config, container)
    this.config = config
    this.container = container
    this.callbacks = callbacks
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

    const mobileMode = this.config.mobileMode ?? 'scroll'
    const stickyTop = this.config.stickyTop ?? '0'

    this.container.className = `mokkun-section-nav section-nav-${mobileMode}`
    this.container.style.display = 'block'
    this.container.style.position = 'sticky'
    this.container.style.top = stickyTop
    this.container.style.zIndex = '100'

    const wrapper = createElement('div', { className: 'section-nav-wrapper' })

    // ナビゲーションリスト
    const navList = this.renderNavList()
    wrapper.appendChild(navList)

    // モバイル用ドロップダウン（mobileMode === 'dropdown'の場合）
    if (mobileMode === 'dropdown') {
      const dropdown = this.renderMobileDropdown()
      wrapper.appendChild(dropdown)
    }

    this.container.appendChild(wrapper)

    // Intersection Observerをセットアップ
    this.setupIntersectionObserver()
  }

  /**
   * 指定セクションにスクロール
   * @param sectionId - スクロール先のセクションID
   */
  scrollToSection(sectionId: string): void {
    const section = this.state.sections.find(s => s.id === sectionId)
    if (!section || section.disabled) {
      return
    }

    const targetElement = document.getElementById(sectionId)
    if (!targetElement) {
      return
    }

    // スクロール中フラグを設定（Intersection Observerの誤検知防止）
    this.isScrolling = true

    const offset = this.config.scrollOffset ?? DEFAULT_SCROLL_OFFSET
    const behavior = this.config.scrollBehavior ?? 'smooth'

    const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - offset

    window.scrollTo({
      top: targetPosition,
      behavior,
    })

    // 状態を更新
    this.state = {
      ...this.state,
      activeSectionId: sectionId,
    }

    this.updateActiveStyles()
    this.callbacks.onSectionChange?.(sectionId, this.getState())

    // スクロール完了後にフラグをリセット
    if (this.scrollTimeout !== null) {
      window.clearTimeout(this.scrollTimeout)
    }
    this.scrollTimeout = window.setTimeout(() => {
      this.isScrolling = false
    }, SCROLL_DEBOUNCE_MS)
  }

  /**
   * アクティブセクションを設定（スクロールなし）
   * @param sectionId - アクティブにするセクションID
   */
  setActiveSection(sectionId: string): void {
    const section = this.state.sections.find(s => s.id === sectionId)
    if (!section || section.disabled) {
      return
    }

    this.state = {
      ...this.state,
      activeSectionId: sectionId,
    }

    this.updateActiveStyles()
  }

  /**
   * 現在の状態を取得
   * @returns 現在の状態のコピー
   */
  getState(): SectionNavState {
    return {
      ...this.state,
      sections: this.state.sections.map(s => ({ ...s })),
    }
  }

  /**
   * 現在のアクティブセクションを取得
   * @returns アクティブなセクション定義、またはundefined
   */
  getActiveSection(): SectionDefinition | undefined {
    return this.state.sections.find(s => s.id === this.state.activeSectionId)
  }

  /**
   * セクションを追加
   * @param section - 追加するセクション定義
   * @param index - 挿入位置（省略時は末尾に追加）
   */
  addSection(section: SectionDefinition, index?: number): void {
    const newSections = [...this.state.sections]
    if (index !== undefined && index >= 0 && index <= newSections.length) {
      newSections.splice(index, 0, section)
    } else {
      newSections.push(section)
    }

    this.state = {
      ...this.state,
      sections: newSections,
    }

    this.render()
  }

  /**
   * セクションを削除
   * @param sectionId - 削除するセクションID
   * @returns 削除成功時true
   */
  removeSection(sectionId: string): boolean {
    const index = this.state.sections.findIndex(s => s.id === sectionId)
    if (index === -1) {
      return false
    }

    const newSections = this.state.sections.filter(s => s.id !== sectionId)

    let newActiveSectionId = this.state.activeSectionId
    if (this.state.activeSectionId === sectionId && newSections.length > 0) {
      const enabledSection = newSections.find(s => !s.disabled)
      newActiveSectionId = enabledSection?.id ?? newSections[0].id
    }

    this.state = {
      ...this.state,
      sections: newSections,
      activeSectionId: newActiveSectionId,
    }

    this.render()
    return true
  }

  /**
   * セクションを更新
   * @param sectionId - 更新するセクションID
   * @param updates - 更新内容
   * @returns 更新成功時true
   */
  updateSection(sectionId: string, updates: Partial<SectionDefinition>): boolean {
    const index = this.state.sections.findIndex(s => s.id === sectionId)
    if (index === -1) {
      return false
    }

    this.state = {
      ...this.state,
      sections: this.state.sections.map(s =>
        s.id === sectionId ? { ...s, ...updates } : s
      ),
    }

    this.render()
    return true
  }

  /**
   * クリーンアップ（Intersection Observerとイベントリスナーの解除）
   */
  destroy(): void {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
    if (this.scrollTimeout !== null) {
      window.clearTimeout(this.scrollTimeout)
      this.scrollTimeout = null
    }
    if (this.documentClickHandler) {
      document.removeEventListener('click', this.documentClickHandler)
      this.documentClickHandler = null
    }
  }

  // ===========================================================================
  // Private Methods - Validation
  // ===========================================================================

  /**
   * 設定を検証
   */
  private validateConfig(config: SectionNavConfig, container: HTMLElement): void {
    if (!config?.sections || !Array.isArray(config.sections)) {
      throw new Error('SectionNav: config.sections must be an array')
    }
    if (!(container instanceof HTMLElement)) {
      throw new Error('SectionNav: container must be an HTMLElement')
    }
    if (config.sections.length === 0) {
      throw new Error('SectionNav: config.sections must not be empty')
    }

    for (const section of config.sections) {
      if (!section.id || typeof section.id !== 'string') {
        throw new Error('SectionNav: Each section must have a valid id')
      }
      if (!section.label || typeof section.label !== 'string') {
        throw new Error(`SectionNav: Section "${section.id}" must have a valid label`)
      }
    }
  }

  // ===========================================================================
  // Private Methods - Rendering
  // ===========================================================================

  /**
   * 初期状態を作成
   */
  private createInitialState(): SectionNavState {
    const defaultActiveSection = this.config.defaultActiveSection
      ?? this.config.sections.find(s => !s.disabled)?.id
      ?? this.config.sections[0]?.id
      ?? ''

    return {
      activeSectionId: defaultActiveSection,
      sections: [...this.config.sections],
    }
  }

  /**
   * ナビゲーションリストをレンダリング
   */
  private renderNavList(): HTMLElement {
    const navList = createElement('nav', {
      className: 'section-nav-list',
      attributes: {
        'aria-label': 'セクションナビゲーション',
        role: 'navigation',
      },
    })

    const ul = createElement('ul', {
      className: 'section-nav-items',
      attributes: { role: 'list' },
    })

    for (const section of this.state.sections) {
      const item = this.renderNavItem(section)
      ul.appendChild(item)
    }

    navList.appendChild(ul)
    return navList
  }

  /**
   * ナビゲーションアイテムをレンダリング
   */
  private renderNavItem(section: SectionDefinition): HTMLElement {
    const isActive = section.id === this.state.activeSectionId
    const className = [
      'section-nav-item',
      isActive ? 'active' : '',
      section.disabled ? 'disabled' : '',
    ].filter(Boolean).join(' ')

    const li = createElement('li', { className })

    const button = createElement('button', {
      className: 'section-nav-button',
      attributes: {
        type: 'button',
        'aria-current': isActive ? 'location' : '',
        'data-section-id': section.id,
      },
    })

    // aria-currentが空の場合は属性を削除
    if (!isActive) {
      button.removeAttribute('aria-current')
    }

    if (section.disabled) {
      button.setAttribute('aria-disabled', 'true')
      button.setAttribute('disabled', 'true')
    }

    // アイコン（XSS防止のためtextContentを使用）
    if (section.icon) {
      const icon = createElement('span', {
        className: 'section-nav-icon',
        textContent: section.icon,
      })
      button.appendChild(icon)
    }

    // ラベル
    const label = createElement('span', {
      className: 'section-nav-label',
      textContent: section.label,
    })
    button.appendChild(label)

    // クリックイベント
    if (!section.disabled) {
      button.addEventListener('click', () => this.scrollToSection(section.id))
    }

    li.appendChild(button)
    return li
  }

  /**
   * モバイル用ドロップダウンをレンダリング
   */
  private renderMobileDropdown(): HTMLElement {
    const dropdown = createElement('div', {
      className: 'section-nav-dropdown',
    })

    const activeSection = this.getActiveSection()

    const trigger = createElement('button', {
      className: 'section-nav-dropdown-trigger',
      attributes: {
        type: 'button',
        'aria-haspopup': 'listbox',
        'aria-expanded': 'false',
      },
    })

    // アイコン（XSS防止のためtextContentを使用）
    if (activeSection?.icon) {
      const icon = createElement('span', {
        className: 'section-nav-icon',
        textContent: activeSection.icon,
      })
      trigger.appendChild(icon)
    }

    const label = createElement('span', {
      className: 'section-nav-label',
      textContent: activeSection?.label ?? 'セクション選択',
    })
    trigger.appendChild(label)

    const chevron = createElement('span', {
      className: 'section-nav-chevron',
      textContent: '▼',
    })
    trigger.appendChild(chevron)

    // ドロップダウンメニュー
    const menu = createElement('ul', {
      className: 'section-nav-dropdown-menu',
      attributes: { role: 'listbox', hidden: 'true' },
    })

    for (const section of this.state.sections) {
      const isActive = section.id === this.state.activeSectionId
      const option = createElement('li', {
        className: `section-nav-dropdown-item ${isActive ? 'active' : ''} ${section.disabled ? 'disabled' : ''}`,
        attributes: {
          role: 'option',
          'aria-selected': String(isActive),
        },
      })

      // アイコン（XSS防止のためtextContentを使用）
      if (section.icon) {
        const icon = createElement('span', {
          className: 'section-nav-icon',
          textContent: section.icon,
        })
        option.appendChild(icon)
      }

      const optionLabel = createElement('span', {
        className: 'section-nav-label',
        textContent: section.label,
      })
      option.appendChild(optionLabel)

      if (!section.disabled) {
        option.addEventListener('click', () => {
          this.scrollToSection(section.id)
          menu.setAttribute('hidden', 'true')
          trigger.setAttribute('aria-expanded', 'false')
        })
      }

      menu.appendChild(option)
    }

    // トリガークリックでドロップダウン開閉
    trigger.addEventListener('click', () => {
      const isExpanded = trigger.getAttribute('aria-expanded') === 'true'
      trigger.setAttribute('aria-expanded', String(!isExpanded))
      if (isExpanded) {
        menu.setAttribute('hidden', 'true')
      } else {
        menu.removeAttribute('hidden')
      }
    })

    // 外側クリックで閉じる（イベントリスナーを保持してクリーンアップ可能に）
    this.documentClickHandler = (e: MouseEvent) => {
      if (!dropdown.contains(e.target as Node)) {
        menu.setAttribute('hidden', 'true')
        trigger.setAttribute('aria-expanded', 'false')
      }
    }
    document.addEventListener('click', this.documentClickHandler)

    dropdown.appendChild(trigger)
    dropdown.appendChild(menu)
    return dropdown
  }

  /**
   * Intersection Observerをセットアップ
   */
  private setupIntersectionObserver(): void {
    if (this.observer) {
      this.observer.disconnect()
    }

    const rootMargin = this.config.rootMargin ?? DEFAULT_ROOT_MARGIN
    const threshold = this.config.threshold ?? 0

    this.observer = new IntersectionObserver(
      (entries) => this.handleIntersection(entries),
      { rootMargin, threshold }
    )

    // 各セクション要素を監視
    for (const section of this.state.sections) {
      const element = document.getElementById(section.id)
      if (element) {
        this.observer.observe(element)
      }
    }
  }

  /**
   * Intersection Observerのコールバック
   */
  private handleIntersection(entries: IntersectionObserverEntry[]): void {
    // スクロール中は無視
    if (this.isScrolling) {
      return
    }

    for (const entry of entries) {
      if (entry.isIntersecting) {
        const sectionId = entry.target.id
        const section = this.state.sections.find(s => s.id === sectionId)

        if (section && !section.disabled && sectionId !== this.state.activeSectionId) {
          this.state = {
            ...this.state,
            activeSectionId: sectionId,
          }

          this.updateActiveStyles()
          this.callbacks.onActiveChange?.(sectionId, this.getState())
        }
      }
    }
  }

  /**
   * アクティブスタイルを更新
   */
  private updateActiveStyles(): void {
    const items = this.container.querySelectorAll('.section-nav-item')
    items.forEach(item => {
      const button = item.querySelector('.section-nav-button')
      const sectionId = button?.getAttribute('data-section-id')

      if (sectionId === this.state.activeSectionId) {
        item.classList.add('active')
        button?.setAttribute('aria-current', 'location')
      } else {
        item.classList.remove('active')
        button?.removeAttribute('aria-current')
      }
    })

    // モバイルドロップダウンも更新
    const dropdownTrigger = this.container.querySelector('.section-nav-dropdown-trigger')
    if (dropdownTrigger) {
      const activeSection = this.getActiveSection()
      const labelEl = dropdownTrigger.querySelector('.section-nav-label')
      const iconEl = dropdownTrigger.querySelector('.section-nav-icon')

      if (labelEl) {
        labelEl.textContent = activeSection?.label ?? 'セクション選択'
      }
      if (iconEl && activeSection?.icon) {
        iconEl.textContent = activeSection.icon
      }
    }

    // ドロップダウンメニュー内のアクティブ状態も更新
    const dropdownItems = this.container.querySelectorAll('.section-nav-dropdown-item')
    dropdownItems.forEach((item, index) => {
      const section = this.state.sections[index]
      if (section?.id === this.state.activeSectionId) {
        item.classList.add('active')
        item.setAttribute('aria-selected', 'true')
      } else {
        item.classList.remove('active')
        item.setAttribute('aria-selected', 'false')
      }
    })
  }
}

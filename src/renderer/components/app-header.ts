/**
 * AppHeader Component
 * アプリケーションヘッダーコンポーネント
 *
 * SmartHR Design System を参考に実装
 * - Header（上部バー）: ロゴ、テナント切替、各種ボタン
 * - AppNavi（下部バー）: アプリ名、ナビゲーション
 */

import { createElement, clearElement } from '../utils/dom'

// =============================================================================
// Types
// =============================================================================

/**
 * テナント情報
 */
export interface Tenant {
  /** テナントID */
  id: string
  /** テナント名 */
  name: string
}

/**
 * ユーザー情報
 */
export interface UserInfo {
  /** ユーザー名 */
  name: string
  /** メールアドレス（オプション） */
  email?: string
  /** アバターURL（オプション） */
  avatarUrl?: string
}

/**
 * ナビゲーションアイテム
 */
export interface NavItem {
  /** アイテムID */
  id: string
  /** ラベル */
  label: string
  /** リンク先URL */
  href?: string
  /** アクティブ状態 */
  active?: boolean
  /** 無効化 */
  disabled?: boolean
  /** ドロップダウンメニュー */
  dropdown?: NavDropdownItem[]
}

/**
 * ドロップダウンメニューアイテム
 */
export interface NavDropdownItem {
  /** アイテムID */
  id: string
  /** ラベル */
  label: string
  /** リンク先URL */
  href?: string
  /** 区切り線 */
  divider?: boolean
}

/**
 * アプリランチャーアイテム
 */
export interface AppLauncherItem {
  /** アプリID */
  id: string
  /** アプリ名 */
  name: string
  /** アプリURL */
  url: string
  /** アイコン（SVG HTML文字列） */
  icon?: string
}

/**
 * AppHeaderの状態
 */
export interface AppHeaderState {
  /** 現在のテナントID */
  currentTenantId: string
  /** テナント切替ドロップダウンの開閉状態 */
  tenantDropdownOpen: boolean
  /** ユーザードロップダウンの開閉状態 */
  userDropdownOpen: boolean
  /** アプリランチャーの開閉状態 */
  appLauncherOpen: boolean
  /** アクティブなナビゲーションID */
  activeNavId: string | null
  /** ナビゲーションドロップダウンの開閉状態 */
  navDropdownOpen: string | null
  /** モバイルメニューの開閉状態 */
  mobileMenuOpen: boolean
}

/**
 * AppHeaderのコールバック
 */
export interface AppHeaderCallbacks {
  /** テナント変更時 */
  onTenantChange?: (tenantId: string) => void
  /** ナビゲーションクリック時 */
  onNavClick?: (navId: string, href?: string) => void
  /** ドロップダウンアイテムクリック時 */
  onDropdownItemClick?: (navId: string, itemId: string, href?: string) => void
  /** ユーザーメニュー項目クリック時 */
  onUserMenuClick?: (action: 'profile' | 'settings' | 'logout') => void
  /** アプリランチャークリック時 */
  onAppLauncherClick?: (appId: string, url: string) => void
  /** ヘルプクリック時 */
  onHelpClick?: () => void
  /** ロゴクリック時 */
  onLogoClick?: () => void
}

/**
 * AppHeaderの設定
 */
export interface AppHeaderConfig {
  /** ロゴ（SVG HTML文字列） */
  logo?: string
  /** ロゴの代替テキスト */
  logoAlt?: string
  /** ロゴのリンク先 */
  logoHref?: string
  /** アプリ名 */
  appName: string
  /** テナント一覧 */
  tenants?: Tenant[]
  /** 現在のテナントID */
  currentTenantId?: string
  /** ユーザー情報 */
  userInfo: UserInfo
  /** ナビゲーション一覧 */
  navigations?: NavItem[]
  /** アプリランチャー一覧 */
  appLauncher?: AppLauncherItem[]
  /** ヘルプページURL */
  helpPageUrl?: string
  /** リリースノート表示 */
  showReleaseNote?: boolean
  /** リリースノートテキスト */
  releaseNoteText?: string
  /** データ同期ボタン表示 */
  showDataSync?: boolean
  /** データ同期中 */
  dataSyncing?: boolean
}

// =============================================================================
// AppHeader Class
// =============================================================================

/**
 * AppHeaderコンポーネント
 */
export class AppHeader {
  private config: AppHeaderConfig
  private state: AppHeaderState
  private callbacks: AppHeaderCallbacks
  private container: HTMLElement
  private documentClickHandler: ((e: MouseEvent) => void) | null = null

  constructor(
    container: HTMLElement,
    config: AppHeaderConfig,
    callbacks: AppHeaderCallbacks = {}
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
   * ヘッダーをレンダリング
   */
  render(): void {
    clearElement(this.container)

    this.container.className = 'mokkun-app-header'
    this.container.setAttribute('role', 'banner')

    // Header（上部バー）
    const header = this.renderHeader()
    this.container.appendChild(header)

    // AppNavi（下部バー）
    const appNavi = this.renderAppNavi()
    this.container.appendChild(appNavi)

    // ドキュメントクリックでドロップダウンを閉じる
    this.setupDocumentClickHandler()
  }

  /**
   * テナントを切り替え
   */
  setCurrentTenant(tenantId: string): void {
    if (this.state.currentTenantId === tenantId) {
      return
    }

    this.state = {
      ...this.state,
      currentTenantId: tenantId,
      tenantDropdownOpen: false,
    }

    this.render()
    this.callbacks.onTenantChange?.(tenantId)
  }

  /**
   * アクティブなナビゲーションを設定
   */
  setActiveNav(navId: string | null): void {
    this.state = {
      ...this.state,
      activeNavId: navId,
    }
    this.render()
  }

  /**
   * 現在の状態を取得
   */
  getState(): Readonly<AppHeaderState> {
    return { ...this.state }
  }

  /**
   * コンポーネントを破棄
   */
  destroy(): void {
    if (this.documentClickHandler) {
      document.removeEventListener('click', this.documentClickHandler)
      this.documentClickHandler = null
    }
    clearElement(this.container)
  }

  // ===========================================================================
  // Private Methods - State
  // ===========================================================================

  /**
   * 初期状態を作成
   */
  private createInitialState(): AppHeaderState {
    const activeNav = this.config.navigations?.find(n => n.active)
    return {
      currentTenantId: this.config.currentTenantId ?? this.config.tenants?.[0]?.id ?? '',
      tenantDropdownOpen: false,
      userDropdownOpen: false,
      appLauncherOpen: false,
      activeNavId: activeNav?.id ?? null,
      navDropdownOpen: null,
      mobileMenuOpen: false,
    }
  }

  // ===========================================================================
  // Private Methods - Rendering Header
  // ===========================================================================

  /**
   * Header（上部バー）をレンダリング
   */
  private renderHeader(): HTMLElement {
    const header = createElement('div', { className: 'app-header-bar' })

    // 左側: ロゴ
    const left = createElement('div', { className: 'app-header-left' })
    left.appendChild(this.renderLogo())
    header.appendChild(left)

    // 中央: テナント切替
    const center = createElement('div', { className: 'app-header-center' })
    if (this.config.tenants && this.config.tenants.length > 0) {
      center.appendChild(this.renderTenantSwitcher())
    }
    header.appendChild(center)

    // 右側: 各種ボタン
    const right = createElement('div', { className: 'app-header-right' })

    // アプリランチャー
    if (this.config.appLauncher && this.config.appLauncher.length > 0) {
      right.appendChild(this.renderAppLauncher())
    }

    // ヘルプボタン
    if (this.config.helpPageUrl) {
      right.appendChild(this.renderHelpButton())
    }

    // ユーザーメニュー
    right.appendChild(this.renderUserMenu())

    header.appendChild(right)

    return header
  }

  /**
   * ロゴをレンダリング
   */
  private renderLogo(): HTMLElement {
    const logoWrapper = createElement('div', { className: 'app-header-logo' })

    if (this.config.logoHref) {
      const link = createElement('a', {
        className: 'app-header-logo-link',
        attributes: {
          href: this.config.logoHref,
          'aria-label': this.config.logoAlt ?? 'ホーム',
        },
      })

      if (this.config.logo) {
        link.innerHTML = this.config.logo
      } else {
        // デフォルトロゴ
        link.innerHTML = this.renderDefaultLogo()
      }

      link.addEventListener('click', (e) => {
        if (this.callbacks.onLogoClick) {
          e.preventDefault()
          this.callbacks.onLogoClick()
        }
      })

      logoWrapper.appendChild(link)
    } else {
      const span = createElement('span', { className: 'app-header-logo-text' })
      if (this.config.logo) {
        span.innerHTML = this.config.logo
      } else {
        span.innerHTML = this.renderDefaultLogo()
      }
      logoWrapper.appendChild(span)
    }

    return logoWrapper
  }

  /**
   * デフォルトロゴをレンダリング
   */
  private renderDefaultLogo(): string {
    return `<svg width="120" height="24" viewBox="0 0 120 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="4" fill="currentColor"/>
      <text x="32" y="17" font-size="14" font-weight="600" fill="currentColor">mokkun</text>
    </svg>`
  }

  /**
   * テナント切替をレンダリング
   */
  private renderTenantSwitcher(): HTMLElement {
    const wrapper = createElement('div', { className: 'app-header-tenant' })

    const currentTenant = this.config.tenants?.find(t => t.id === this.state.currentTenantId)

    const button = createElement('button', {
      className: `app-header-tenant-button ${this.state.tenantDropdownOpen ? 'is-open' : ''}`,
      attributes: {
        type: 'button',
        'aria-haspopup': 'listbox',
        'aria-expanded': String(this.state.tenantDropdownOpen),
      },
    })

    const label = createElement('span', {
      className: 'app-header-tenant-label',
      textContent: currentTenant?.name ?? '企業を選択',
    })
    button.appendChild(label)

    const icon = createElement('span', { className: 'app-header-dropdown-icon' })
    icon.innerHTML = this.renderChevronIcon()
    button.appendChild(icon)

    button.addEventListener('click', (e) => {
      e.stopPropagation()
      this.toggleTenantDropdown()
    })

    wrapper.appendChild(button)

    // ドロップダウンメニュー
    if (this.state.tenantDropdownOpen) {
      const dropdown = this.renderTenantDropdownMenu()
      wrapper.appendChild(dropdown)
    }

    return wrapper
  }

  /**
   * テナントドロップダウンメニューをレンダリング
   */
  private renderTenantDropdownMenu(): HTMLElement {
    const menu = createElement('div', {
      className: 'app-header-dropdown-menu',
      attributes: { role: 'listbox' },
    })

    for (const tenant of this.config.tenants ?? []) {
      const isSelected = tenant.id === this.state.currentTenantId
      const item = createElement('button', {
        className: `app-header-dropdown-item ${isSelected ? 'is-selected' : ''}`,
        attributes: {
          type: 'button',
          role: 'option',
          'aria-selected': String(isSelected),
        },
        textContent: tenant.name,
      })

      item.addEventListener('click', () => {
        this.setCurrentTenant(tenant.id)
      })

      menu.appendChild(item)
    }

    return menu
  }

  /**
   * アプリランチャーをレンダリング
   */
  private renderAppLauncher(): HTMLElement {
    const wrapper = createElement('div', { className: 'app-header-launcher' })

    const button = createElement('button', {
      className: `app-header-icon-button ${this.state.appLauncherOpen ? 'is-open' : ''}`,
      attributes: {
        type: 'button',
        'aria-label': 'アプリ一覧',
        'aria-haspopup': 'menu',
        'aria-expanded': String(this.state.appLauncherOpen),
      },
    })
    button.innerHTML = this.renderGridIcon()

    button.addEventListener('click', (e) => {
      e.stopPropagation()
      this.toggleAppLauncher()
    })

    wrapper.appendChild(button)

    // ドロップダウン
    if (this.state.appLauncherOpen) {
      const dropdown = this.renderAppLauncherDropdown()
      wrapper.appendChild(dropdown)
    }

    return wrapper
  }

  /**
   * アプリランチャードロップダウンをレンダリング
   */
  private renderAppLauncherDropdown(): HTMLElement {
    const menu = createElement('div', {
      className: 'app-header-dropdown-menu app-header-launcher-menu',
      attributes: { role: 'menu' },
    })

    for (const app of this.config.appLauncher ?? []) {
      const item = createElement('a', {
        className: 'app-header-launcher-item',
        attributes: {
          href: app.url,
          role: 'menuitem',
        },
      })

      if (app.icon) {
        const icon = createElement('span', { className: 'app-header-launcher-icon' })
        icon.innerHTML = app.icon
        item.appendChild(icon)
      }

      const name = createElement('span', {
        className: 'app-header-launcher-name',
        textContent: app.name,
      })
      item.appendChild(name)

      item.addEventListener('click', (e) => {
        e.preventDefault()
        this.state.appLauncherOpen = false
        this.render()
        this.callbacks.onAppLauncherClick?.(app.id, app.url)
      })

      menu.appendChild(item)
    }

    return menu
  }

  /**
   * ヘルプボタンをレンダリング
   */
  private renderHelpButton(): HTMLElement {
    const button = createElement('a', {
      className: 'app-header-icon-button',
      attributes: {
        href: this.config.helpPageUrl ?? '#',
        'aria-label': 'ヘルプ',
        target: '_blank',
        rel: 'noopener noreferrer',
      },
    })
    button.innerHTML = this.renderHelpIcon()

    button.addEventListener('click', (e) => {
      if (this.callbacks.onHelpClick) {
        e.preventDefault()
        this.callbacks.onHelpClick()
      }
    })

    return button
  }

  /**
   * ユーザーメニューをレンダリング
   */
  private renderUserMenu(): HTMLElement {
    const wrapper = createElement('div', { className: 'app-header-user' })

    const button = createElement('button', {
      className: `app-header-user-button ${this.state.userDropdownOpen ? 'is-open' : ''}`,
      attributes: {
        type: 'button',
        'aria-haspopup': 'menu',
        'aria-expanded': String(this.state.userDropdownOpen),
      },
    })

    // アバター
    const avatar = createElement('span', { className: 'app-header-avatar' })
    if (this.config.userInfo.avatarUrl) {
      const img = createElement('img', {
        attributes: {
          src: this.config.userInfo.avatarUrl,
          alt: this.config.userInfo.name,
        },
      })
      avatar.appendChild(img)
    } else {
      avatar.textContent = this.config.userInfo.name.charAt(0).toUpperCase()
    }
    button.appendChild(avatar)

    // ユーザー名
    const name = createElement('span', {
      className: 'app-header-user-name',
      textContent: this.config.userInfo.name,
    })
    button.appendChild(name)

    // ドロップダウンアイコン
    const icon = createElement('span', { className: 'app-header-dropdown-icon' })
    icon.innerHTML = this.renderChevronIcon()
    button.appendChild(icon)

    button.addEventListener('click', (e) => {
      e.stopPropagation()
      this.toggleUserDropdown()
    })

    wrapper.appendChild(button)

    // ドロップダウンメニュー
    if (this.state.userDropdownOpen) {
      const dropdown = this.renderUserDropdownMenu()
      wrapper.appendChild(dropdown)
    }

    return wrapper
  }

  /**
   * ユーザードロップダウンメニューをレンダリング
   */
  private renderUserDropdownMenu(): HTMLElement {
    const menu = createElement('div', {
      className: 'app-header-dropdown-menu app-header-user-menu',
      attributes: { role: 'menu' },
    })

    // ユーザー情報
    const userInfo = createElement('div', { className: 'app-header-user-info' })
    const userName = createElement('div', {
      className: 'app-header-user-info-name',
      textContent: this.config.userInfo.name,
    })
    userInfo.appendChild(userName)

    if (this.config.userInfo.email) {
      const email = createElement('div', {
        className: 'app-header-user-info-email',
        textContent: this.config.userInfo.email,
      })
      userInfo.appendChild(email)
    }
    menu.appendChild(userInfo)

    // 区切り線
    const divider = createElement('div', { className: 'app-header-dropdown-divider' })
    menu.appendChild(divider)

    // メニュー項目
    const menuItems: { id: 'profile' | 'settings' | 'logout'; label: string }[] = [
      { id: 'profile', label: 'プロフィール' },
      { id: 'settings', label: '設定' },
      { id: 'logout', label: 'ログアウト' },
    ]

    for (const item of menuItems) {
      const button = createElement('button', {
        className: `app-header-dropdown-item ${item.id === 'logout' ? 'is-danger' : ''}`,
        attributes: {
          type: 'button',
          role: 'menuitem',
        },
        textContent: item.label,
      })

      button.addEventListener('click', () => {
        this.state.userDropdownOpen = false
        this.render()
        this.callbacks.onUserMenuClick?.(item.id)
      })

      menu.appendChild(button)
    }

    return menu
  }

  // ===========================================================================
  // Private Methods - Rendering AppNavi
  // ===========================================================================

  /**
   * AppNavi（下部バー）をレンダリング
   */
  private renderAppNavi(): HTMLElement {
    const navi = createElement('div', { className: 'app-header-navi' })

    // 左側: アプリ名
    const left = createElement('div', { className: 'app-header-navi-left' })
    const appName = createElement('h1', {
      className: 'app-header-app-name',
      textContent: this.config.appName,
    })
    left.appendChild(appName)
    navi.appendChild(left)

    // 中央: ナビゲーション
    if (this.config.navigations && this.config.navigations.length > 0) {
      const center = createElement('nav', {
        className: 'app-header-navi-center',
        attributes: { 'aria-label': 'アプリナビゲーション' },
      })
      center.appendChild(this.renderNavigation())
      navi.appendChild(center)
    }

    // 右側: 追加ボタン
    const right = createElement('div', { className: 'app-header-navi-right' })

    // データ同期ボタン
    if (this.config.showDataSync) {
      right.appendChild(this.renderDataSyncButton())
    }

    // リリースノートボタン
    if (this.config.showReleaseNote) {
      right.appendChild(this.renderReleaseNoteButton())
    }

    if (right.childNodes.length > 0) {
      navi.appendChild(right)
    }

    // モバイルメニューボタン
    const mobileButton = this.renderMobileMenuButton()
    navi.appendChild(mobileButton)

    return navi
  }

  /**
   * ナビゲーションをレンダリング
   */
  private renderNavigation(): HTMLElement {
    const navList = createElement('ul', {
      className: 'app-header-nav-list',
      attributes: { role: 'menubar' },
    })

    for (const nav of this.config.navigations ?? []) {
      const item = this.renderNavItem(nav)
      navList.appendChild(item)
    }

    return navList
  }

  /**
   * ナビゲーションアイテムをレンダリング
   */
  private renderNavItem(nav: NavItem): HTMLElement {
    const isActive = nav.id === this.state.activeNavId || nav.active
    const hasDropdown = nav.dropdown && nav.dropdown.length > 0
    const isDropdownOpen = this.state.navDropdownOpen === nav.id

    const li = createElement('li', {
      className: 'app-header-nav-item',
      attributes: { role: 'none' },
    })

    if (hasDropdown) {
      // ドロップダウン付きボタン
      const button = createElement('button', {
        className: `app-header-nav-button ${isActive ? 'is-active' : ''} ${nav.disabled ? 'is-disabled' : ''}`,
        attributes: {
          type: 'button',
          role: 'menuitem',
          'aria-haspopup': 'menu',
          'aria-expanded': String(isDropdownOpen),
          ...(nav.disabled ? { 'aria-disabled': 'true' } : {}),
        },
      })

      const label = createElement('span', { textContent: nav.label })
      button.appendChild(label)

      const icon = createElement('span', { className: 'app-header-nav-dropdown-icon' })
      icon.innerHTML = this.renderChevronIcon()
      button.appendChild(icon)

      if (!nav.disabled) {
        button.addEventListener('click', (e) => {
          e.stopPropagation()
          this.toggleNavDropdown(nav.id)
        })
      }

      li.appendChild(button)

      // ドロップダウンメニュー
      if (isDropdownOpen) {
        const dropdown = this.renderNavDropdownMenu(nav)
        li.appendChild(dropdown)
      }
    } else {
      // 通常のリンク/ボタン
      if (nav.href) {
        const link = createElement('a', {
          className: `app-header-nav-link ${isActive ? 'is-active' : ''} ${nav.disabled ? 'is-disabled' : ''}`,
          attributes: {
            href: nav.href,
            role: 'menuitem',
            ...(nav.disabled ? { 'aria-disabled': 'true', tabindex: '-1' } : {}),
          },
          textContent: nav.label,
        })

        link.addEventListener('click', (e) => {
          if (nav.disabled) {
            e.preventDefault()
            return
          }
          if (this.callbacks.onNavClick) {
            e.preventDefault()
            this.callbacks.onNavClick(nav.id, nav.href)
          }
        })

        li.appendChild(link)
      } else {
        const button = createElement('button', {
          className: `app-header-nav-button ${isActive ? 'is-active' : ''} ${nav.disabled ? 'is-disabled' : ''}`,
          attributes: {
            type: 'button',
            role: 'menuitem',
            ...(nav.disabled ? { 'aria-disabled': 'true' } : {}),
          },
          textContent: nav.label,
        })

        if (!nav.disabled) {
          button.addEventListener('click', () => {
            this.callbacks.onNavClick?.(nav.id)
          })
        }

        li.appendChild(button)
      }
    }

    return li
  }

  /**
   * ナビゲーションドロップダウンメニューをレンダリング
   */
  private renderNavDropdownMenu(nav: NavItem): HTMLElement {
    const menu = createElement('div', {
      className: 'app-header-dropdown-menu app-header-nav-dropdown',
      attributes: { role: 'menu' },
    })

    for (const item of nav.dropdown ?? []) {
      if (item.divider) {
        const divider = createElement('div', { className: 'app-header-dropdown-divider' })
        menu.appendChild(divider)
      } else {
        const button = createElement('button', {
          className: 'app-header-dropdown-item',
          attributes: {
            type: 'button',
            role: 'menuitem',
          },
          textContent: item.label,
        })

        button.addEventListener('click', () => {
          this.state.navDropdownOpen = null
          this.render()
          this.callbacks.onDropdownItemClick?.(nav.id, item.id, item.href)
        })

        menu.appendChild(button)
      }
    }

    return menu
  }

  /**
   * データ同期ボタンをレンダリング
   */
  private renderDataSyncButton(): HTMLElement {
    const button = createElement('button', {
      className: `app-header-navi-button ${this.config.dataSyncing ? 'is-syncing' : ''}`,
      attributes: {
        type: 'button',
        'aria-label': 'データ同期',
      },
    })
    button.innerHTML = this.renderSyncIcon()

    const label = createElement('span', { textContent: 'データ同期' })
    button.appendChild(label)

    return button
  }

  /**
   * リリースノートボタンをレンダリング
   */
  private renderReleaseNoteButton(): HTMLElement {
    const button = createElement('button', {
      className: 'app-header-navi-button app-header-release-note',
      attributes: {
        type: 'button',
        'aria-label': 'リリースノート',
      },
    })

    const icon = createElement('span', { className: 'app-header-release-icon' })
    icon.innerHTML = this.renderBellIcon()
    button.appendChild(icon)

    const label = createElement('span', {
      textContent: this.config.releaseNoteText ?? 'リリースノート',
    })
    button.appendChild(label)

    return button
  }

  /**
   * モバイルメニューボタンをレンダリング
   */
  private renderMobileMenuButton(): HTMLElement {
    const button = createElement('button', {
      className: 'app-header-mobile-menu-button',
      attributes: {
        type: 'button',
        'aria-label': 'メニュー',
        'aria-expanded': String(this.state.mobileMenuOpen),
      },
    })
    button.innerHTML = this.renderMenuIcon()

    button.addEventListener('click', () => {
      this.state.mobileMenuOpen = !this.state.mobileMenuOpen
      this.render()
    })

    return button
  }

  // ===========================================================================
  // Private Methods - Event Handlers
  // ===========================================================================

  /**
   * ドキュメントクリックハンドラーをセットアップ
   */
  private setupDocumentClickHandler(): void {
    // 既存のハンドラーを削除
    if (this.documentClickHandler) {
      document.removeEventListener('click', this.documentClickHandler)
    }

    this.documentClickHandler = () => {
      let needsRender = false

      if (this.state.tenantDropdownOpen) {
        this.state.tenantDropdownOpen = false
        needsRender = true
      }
      if (this.state.userDropdownOpen) {
        this.state.userDropdownOpen = false
        needsRender = true
      }
      if (this.state.appLauncherOpen) {
        this.state.appLauncherOpen = false
        needsRender = true
      }
      if (this.state.navDropdownOpen !== null) {
        this.state.navDropdownOpen = null
        needsRender = true
      }

      if (needsRender) {
        this.render()
      }
    }

    document.addEventListener('click', this.documentClickHandler)
  }

  /**
   * テナントドロップダウンを切り替え
   */
  private toggleTenantDropdown(): void {
    this.state = {
      ...this.state,
      tenantDropdownOpen: !this.state.tenantDropdownOpen,
      userDropdownOpen: false,
      appLauncherOpen: false,
      navDropdownOpen: null,
    }
    this.render()
  }

  /**
   * ユーザードロップダウンを切り替え
   */
  private toggleUserDropdown(): void {
    this.state = {
      ...this.state,
      userDropdownOpen: !this.state.userDropdownOpen,
      tenantDropdownOpen: false,
      appLauncherOpen: false,
      navDropdownOpen: null,
    }
    this.render()
  }

  /**
   * アプリランチャーを切り替え
   */
  private toggleAppLauncher(): void {
    this.state = {
      ...this.state,
      appLauncherOpen: !this.state.appLauncherOpen,
      tenantDropdownOpen: false,
      userDropdownOpen: false,
      navDropdownOpen: null,
    }
    this.render()
  }

  /**
   * ナビゲーションドロップダウンを切り替え
   */
  private toggleNavDropdown(navId: string): void {
    this.state = {
      ...this.state,
      navDropdownOpen: this.state.navDropdownOpen === navId ? null : navId,
      tenantDropdownOpen: false,
      userDropdownOpen: false,
      appLauncherOpen: false,
    }
    this.render()
  }

  // ===========================================================================
  // Private Methods - Icons
  // ===========================================================================

  private renderChevronIcon(): string {
    return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`
  }

  private renderGridIcon(): string {
    return `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="5" height="5" rx="1" fill="currentColor"/>
      <rect x="12" y="3" width="5" height="5" rx="1" fill="currentColor"/>
      <rect x="3" y="12" width="5" height="5" rx="1" fill="currentColor"/>
      <rect x="12" y="12" width="5" height="5" rx="1" fill="currentColor"/>
    </svg>`
  }

  private renderHelpIcon(): string {
    return `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.5"/>
      <path d="M10 14V14.01M10 11C10 9.5 11.5 9 11.5 7.5C11.5 6.12 10.38 5 9 5C7.62 5 6.5 6.12 6.5 7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`
  }

  private renderSyncIcon(): string {
    return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M12 4L14 2L16 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`
  }

  private renderBellIcon(): string {
    return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 2C5.79086 2 4 3.79086 4 6V9L3 11H13L12 9V6C12 3.79086 10.2091 2 8 2Z" stroke="currentColor" stroke-width="1.5"/>
      <path d="M6 11V12C6 13.1046 6.89543 14 8 14C9.10457 14 10 13.1046 10 12V11" stroke="currentColor" stroke-width="1.5"/>
    </svg>`
  }

  private renderMenuIcon(): string {
    return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 6H21M3 12H21M3 18H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>`
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * AppHeaderを作成
 */
export function createAppHeader(
  container: HTMLElement,
  config: AppHeaderConfig,
  callbacks: AppHeaderCallbacks = {}
): AppHeader {
  const appHeader = new AppHeader(container, config, callbacks)
  appHeader.render()
  return appHeader
}

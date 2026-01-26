/**
 * InformationPanel Component
 * 情報パネルコンポーネント
 *
 * 
 * - タイプ（info/success/warning/error/sync）
 * - アイコン表示
 * - 開閉ボタン（toggleable）
 * - タイトル付き（必須）
 * - 太字表示（bold）
 * - アクセシビリティ対応（ARIA属性）
 *
 * @see https://smarthr.design/products/components/information-panel/
 */

import { createElement, generateId } from '../utils/dom'
import { escapeHtml, createFieldWrapper } from '../utils/field-helpers'
import type { InputField } from '../../types/schema'

// =============================================================================
// Types
// =============================================================================

/**
 * 情報パネルのタイプ
 * - info: 一般情報（青）
 * - success: 成功・完了（緑）
 * - warning: 警告・注意（黄）
 * - error: エラー（赤）
 * - sync: 同期中（灰色）
 */
export type InformationPanelType = 'info' | 'success' | 'warning' | 'error' | 'sync'

/**
 * 情報パネルの状態
 */
export interface InformationPanelState {
  /** パネルが展開されているか（toggleableの場合） */
  active: boolean
  /** 非表示状態 */
  hidden: boolean
}

/**
 * 情報パネルのコールバック
 */
export interface InformationPanelCallbacks {
  /** 開閉ボタンクリック時 */
  onClickTrigger?: (active: boolean) => void
  /** 閉じるボタンクリック時（非toggleable時） */
  onClose?: () => void
}

/**
 * 情報パネルの設定
 */
export interface InformationPanelConfig {
  /** パネルのタイトル（必須） */
  title: string
  /** パネルの内容（HTML文字列またはHTMLElement） */
  content: string | HTMLElement
  /** タイプ（デフォルト: info） */
  type?: InformationPanelType
  /** 開閉ボタンを表示するか（デフォルト: false） */
  toggleable?: boolean
  /** 初期展開状態（toggleableの場合、デフォルト: true） */
  defaultActive?: boolean
  /** タイトルを太字にするか（デフォルト: false） */
  bold?: boolean
  /** 閉じるボタンを表示するか（デフォルト: false） */
  closable?: boolean
  /** ID属性 */
  id?: string
  /** カスタムCSSクラス */
  className?: string
}

// =============================================================================
// Built-in Icons
// =============================================================================

const BUILTIN_ICONS: Record<InformationPanelType, string> = {
  info: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M15 8A7 7 0 1 1 1 8a7 7 0 0 1 14 0ZM9 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM6.75 8a.75.75 0 0 0 0 1.5h.75v1.75a.75.75 0 0 0 1.5 0v-2.5A.75.75 0 0 0 8.25 8h-1.5Z" clip-rule="evenodd" /></svg>`,
  success: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm3.844-8.791a.75.75 0 0 0-1.188-.918l-3.7 4.79-1.649-1.833a.75.75 0 1 0-1.114 1.004l2.25 2.5a.75.75 0 0 0 1.151-.043l4.25-5.5Z" clip-rule="evenodd" /></svg>`,
  warning: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M6.701 2.25c.577-1 2.02-1 2.598 0l5.196 9a1.5 1.5 0 0 1-1.299 2.25H2.804a1.5 1.5 0 0 1-1.3-2.25l5.197-9ZM8 4a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd" /></svg>`,
  error: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14ZM8 4a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd" /></svg>`,
  sync: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M13.836 2.477a.75.75 0 0 1 .75.75v3.182a.75.75 0 0 1-.75.75h-3.182a.75.75 0 0 1 0-1.5h1.37l-.84-.841a4.5 4.5 0 0 0-7.08.681.75.75 0 0 1-1.264-.808 6 6 0 0 1 9.44-.908l.84.84v-1.646a.75.75 0 0 1 .75-.75Zm-1.672 9.046a.75.75 0 0 1 1.264.808 6 6 0 0 1-9.44.908l-.84-.84v1.646a.75.75 0 0 1-1.5 0V10.82a.75.75 0 0 1 .75-.75h3.182a.75.75 0 0 1 0 1.5h-1.37l.84.841a4.5 4.5 0 0 0 7.08-.681Z" clip-rule="evenodd" /></svg>`,
}

// =============================================================================
// InformationPanel Class
// =============================================================================

/**
 * 情報パネルコンポーネント
 */
export class InformationPanel {
  private config: InformationPanelConfig
  private state: InformationPanelState
  private callbacks: InformationPanelCallbacks
  private container: HTMLElement
  private instanceId: string
  private contentElement: HTMLElement | null = null

  constructor(
    container: HTMLElement,
    config: InformationPanelConfig,
    callbacks: InformationPanelCallbacks = {}
  ) {
    this.config = config
    this.container = container
    this.callbacks = callbacks
    this.instanceId = config.id ?? generateId('information-panel')
    this.state = this.createInitialState()
  }

  // ===========================================================================
  // Public Methods
  // ===========================================================================

  /**
   * 情報パネルをレンダリング
   */
  render(): void {
    this.container.innerHTML = ''
    this.contentElement = null

    const type = this.config.type ?? 'info'
    const toggleable = this.config.toggleable ?? false
    const bold = this.config.bold ?? false

    this.container.className = [
      'mokkun-information-panel',
      `information-panel-${type}`,
      toggleable ? 'information-panel-toggleable' : '',
      bold ? 'information-panel-bold' : '',
      this.state.active ? 'is-active' : '',
      this.config.className ?? '',
    ]
      .filter(Boolean)
      .join(' ')

    this.container.id = this.instanceId
    this.container.setAttribute('data-type', type)

    if (this.state.hidden) {
      this.container.setAttribute('data-hidden', '')
      this.container.style.display = 'none'
      return
    } else {
      this.container.removeAttribute('data-hidden')
      this.container.style.display = ''
    }

    // ヘッダー
    const header = this.renderHeader()
    this.container.appendChild(header)

    // コンテンツ
    const content = this.renderContent()
    this.container.appendChild(content)
    this.contentElement = content
  }

  /**
   * パネルを開く
   */
  open(): void {
    if (!(this.config.toggleable ?? false)) {
      return
    }

    if (this.state.active) {
      return
    }

    this.state = {
      ...this.state,
      active: true,
    }

    this.updateActiveState()
    this.callbacks.onClickTrigger?.(true)
  }

  /**
   * パネルを閉じる
   */
  close(): void {
    if (!(this.config.toggleable ?? false)) {
      return
    }

    if (!this.state.active) {
      return
    }

    this.state = {
      ...this.state,
      active: false,
    }

    this.updateActiveState()
    this.callbacks.onClickTrigger?.(false)
  }

  /**
   * パネルの開閉を切り替え
   */
  toggle(): void {
    if (this.state.active) {
      this.close()
    } else {
      this.open()
    }
  }

  /**
   * パネルが開いているか確認
   */
  isActive(): boolean {
    return this.state.active
  }

  /**
   * パネルを非表示にする
   */
  hide(): void {
    if (this.state.hidden) {
      return
    }

    this.state = {
      ...this.state,
      hidden: true,
    }

    this.render()
  }

  /**
   * パネルを表示する
   */
  show(): void {
    if (!this.state.hidden) {
      return
    }

    this.state = {
      ...this.state,
      hidden: false,
    }

    this.render()
  }

  /**
   * 現在の状態を取得
   */
  getState(): Readonly<InformationPanelState> {
    return { ...this.state }
  }

  /**
   * タイトルを更新
   */
  setTitle(title: string): void {
    this.config = {
      ...this.config,
      title,
    }
    this.render()
  }

  /**
   * コンテンツを更新
   */
  setContent(content: string | HTMLElement): void {
    this.config = {
      ...this.config,
      content,
    }
    this.render()
  }

  /**
   * タイプを更新
   */
  setType(type: InformationPanelType): void {
    this.config = {
      ...this.config,
      type,
    }
    this.render()
  }

  /**
   * コンポーネントを破棄
   */
  destroy(): void {
    this.container.innerHTML = ''
    this.contentElement = null
  }

  // ===========================================================================
  // Private Methods - Initialization
  // ===========================================================================

  private createInitialState(): InformationPanelState {
    const toggleable = this.config.toggleable ?? false
    const defaultActive = this.config.defaultActive ?? true

    return {
      active: toggleable ? defaultActive : true,
      hidden: false,
    }
  }

  // ===========================================================================
  // Private Methods - Rendering
  // ===========================================================================

  private renderHeader(): HTMLElement {
    const header = createElement('div', {
      className: 'information-panel-header',
    })

    // アイコン
    const icon = this.renderIcon()
    header.appendChild(icon)

    // タイトル
    const title = this.renderTitle()
    header.appendChild(title)

    // 閉じる/開閉ボタン
    const actions = this.renderActions()
    if (actions) {
      header.appendChild(actions)
    }

    return header
  }

  private renderIcon(): HTMLElement {
    const type = this.config.type ?? 'info'

    const iconWrapper = createElement('span', {
      className: 'information-panel-icon',
      attributes: {
        'aria-hidden': 'true',
      },
    })

    iconWrapper.innerHTML = BUILTIN_ICONS[type]

    return iconWrapper
  }

  private renderTitle(): HTMLElement {
    const bold = this.config.bold ?? false
    const toggleable = this.config.toggleable ?? false

    const title = createElement('span', {
      className: `information-panel-title${bold ? ' is-bold' : ''}`,
      textContent: this.config.title,
    })

    if (toggleable) {
      title.setAttribute('id', `${this.instanceId}-title`)
    }

    return title
  }

  private renderActions(): HTMLElement | null {
    const toggleable = this.config.toggleable ?? false
    const closable = this.config.closable ?? false

    if (!toggleable && !closable) {
      return null
    }

    const actions = createElement('div', {
      className: 'information-panel-actions',
    })

    if (toggleable) {
      const toggleButton = this.renderToggleButton()
      actions.appendChild(toggleButton)
    } else if (closable) {
      const closeButton = this.renderCloseButton()
      actions.appendChild(closeButton)
    }

    return actions
  }

  private renderToggleButton(): HTMLElement {
    const button = createElement('button', {
      className: 'information-panel-toggle',
      attributes: {
        type: 'button',
        'aria-expanded': String(this.state.active),
        'aria-controls': `${this.instanceId}-content`,
      },
    })

    // アイコン（展開/折りたたみ）
    const icon = createElement('span', {
      className: 'information-panel-toggle-icon',
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
    path.setAttribute('d', 'M3 6l5 5 5-5H3z')

    svg.appendChild(path)
    icon.appendChild(svg)
    button.appendChild(icon)

    // テキスト
    const text = createElement('span', {
      className: 'information-panel-toggle-text',
      textContent: this.state.active ? '閉じる' : '開く',
    })
    button.appendChild(text)

    // クリックイベント
    button.addEventListener('click', () => {
      this.toggle()
    })

    return button
  }

  private renderCloseButton(): HTMLElement {
    const button = createElement('button', {
      className: 'information-panel-close',
      attributes: {
        type: 'button',
        'aria-label': '閉じる',
      },
    })

    // 閉じるアイコン
    const icon = createElement('span', {
      className: 'information-panel-close-icon',
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
    path.setAttribute(
      'd',
      'M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z'
    )

    svg.appendChild(path)
    icon.appendChild(svg)
    button.appendChild(icon)

    // クリックイベント
    button.addEventListener('click', () => {
      this.hide()
      this.callbacks.onClose?.()
    })

    return button
  }

  private renderContent(): HTMLElement {
    const toggleable = this.config.toggleable ?? false

    const wrapper = createElement('div', {
      className: `information-panel-content-wrapper${this.state.active ? ' is-active' : ''}`,
    })

    const content = createElement('div', {
      className: 'information-panel-content',
      attributes: {
        role: 'region',
      },
    })

    if (toggleable) {
      content.setAttribute('id', `${this.instanceId}-content`)
      content.setAttribute('aria-labelledby', `${this.instanceId}-title`)

      if (!this.state.active) {
        content.setAttribute('hidden', '')
      }
    }

    // コンテンツを追加
    if (typeof this.config.content === 'string') {
      content.innerHTML = this.config.content
    } else {
      content.appendChild(this.config.content)
    }

    wrapper.appendChild(content)

    return wrapper
  }

  // ===========================================================================
  // Private Methods - State Updates
  // ===========================================================================

  private updateActiveState(): void {
    const toggleable = this.config.toggleable ?? false

    if (!toggleable) {
      return
    }

    // コンテナの状態更新
    if (this.state.active) {
      this.container.classList.add('is-active')
    } else {
      this.container.classList.remove('is-active')
    }

    // トグルボタンの状態更新
    const toggleButton = this.container.querySelector('.information-panel-toggle')
    if (toggleButton) {
      toggleButton.setAttribute('aria-expanded', String(this.state.active))

      const icon = toggleButton.querySelector('.information-panel-toggle-icon')
      if (icon) {
        if (this.state.active) {
          icon.classList.add('is-active')
        } else {
          icon.classList.remove('is-active')
        }
      }

      const text = toggleButton.querySelector('.information-panel-toggle-text')
      if (text) {
        text.textContent = this.state.active ? '閉じる' : '開く'
      }
    }

    // コンテンツの状態更新
    if (this.contentElement) {
      const contentInner = this.contentElement.querySelector('.information-panel-content')

      if (this.state.active) {
        this.contentElement.classList.add('is-active')
        contentInner?.removeAttribute('hidden')
      } else {
        this.contentElement.classList.remove('is-active')
        // アニメーション終了後にhiddenを設定
        setTimeout(() => {
          if (!this.state.active) {
            contentInner?.setAttribute('hidden', '')
          }
        }, 200)
      }
    }
  }

  // ===========================================================================
  // Static Field Renderer
  // ===========================================================================

  static renderField(field: InputField): string {
    const infoField = field as InputField & {
      variant?: 'info' | 'success' | 'warning' | 'error'
    }
    const variant = infoField.variant ?? 'info'

    const infoHtml = `
      <div class="mokkun-information-panel panel-${variant}">
        <div class="panel-icon">ℹ️</div>
        <div class="panel-content">
          <div class="panel-title">${escapeHtml(field.label)}</div>
          ${field.description ? `<div class="panel-description">${escapeHtml(field.description)}</div>` : ''}
        </div>
      </div>
    `
    return createFieldWrapper(field, infoHtml)
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * 情報パネルを作成
 */
export function createInformationPanel(
  container: HTMLElement,
  config: InformationPanelConfig,
  callbacks: InformationPanelCallbacks = {}
): InformationPanel {
  const panel = new InformationPanel(container, config, callbacks)
  panel.render()
  return panel
}

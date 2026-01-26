/**
 * Disclosure Component
 * 開閉コンテンツコンポーネント
 *
 * 
 * https://smarthr.design/products/components/disclosure/
 *
 * 機能:
 * - 開閉トリガー（クリック）
 * - スムーズなアニメーション
 * - アイコン回転
 * - デフォルト展開状態
 * - キーボード操作対応
 * - アクセシビリティ対応（ARIA属性）
 *
 * 用途:
 * - 「もっと見る」機能
 * - 補足情報の表示切り替え
 * - AccordionPanelより軽量な単独使用
 */

import { createElement, generateId } from '../utils/dom'
import { escapeHtml, createFieldWrapper } from '../utils/field-helpers'
import type { InputField } from '../../types/schema'

// =============================================================================
// Types
// =============================================================================

/**
 * Disclosureの状態
 */
export interface DisclosureState {
  /** 展開中かどうか */
  isOpen: boolean
}

/**
 * Disclosureのコールバック
 */
export interface DisclosureCallbacks {
  /** 展開時 */
  onOpen?: () => void
  /** 折りたたみ時 */
  onClose?: () => void
  /** 開閉状態変更時 */
  onChange?: (isOpen: boolean) => void
}

/**
 * Disclosureの設定
 */
export interface DisclosureConfig {
  /** トリガーのラベル（閉じているとき） */
  triggerLabel: string
  /** トリガーのラベル（開いているとき、オプション） */
  triggerLabelOpen?: string
  /** コンテンツ（HTML文字列またはHTMLElement） */
  content: string | HTMLElement
  /** デフォルトで展開（デフォルト: false） */
  defaultOpen?: boolean
  /** ID属性 */
  id?: string
  /** カスタムCSSクラス */
  className?: string
  /** 閉じた状態でもDOMに存在させるか（デフォルト: false） */
  visuallyHidden?: boolean
}

// =============================================================================
// Disclosure Class
// =============================================================================

/**
 * Disclosureコンポーネント
 */
export class Disclosure {
  private config: DisclosureConfig
  private state: DisclosureState
  private callbacks: DisclosureCallbacks
  private container: HTMLElement
  private instanceId: string
  private triggerElement: HTMLButtonElement | null = null
  private contentWrapper: HTMLElement | null = null
  private contentElement: HTMLElement | null = null

  constructor(
    container: HTMLElement,
    config: DisclosureConfig,
    callbacks: DisclosureCallbacks = {}
  ) {
    this.config = config
    this.container = container
    this.callbacks = callbacks
    this.instanceId = config.id ?? generateId('disclosure')
    this.state = {
      isOpen: config.defaultOpen ?? false,
    }
  }

  // ===========================================================================
  // Public Methods
  // ===========================================================================

  /**
   * Disclosureをレンダリング
   */
  render(): void {
    this.container.innerHTML = ''

    this.container.className = [
      'mokkun-disclosure',
      this.state.isOpen ? 'is-open' : '',
      this.config.className ?? '',
    ]
      .filter(Boolean)
      .join(' ')

    this.container.id = this.instanceId

    // トリガーボタン
    this.triggerElement = this.renderTrigger()
    this.container.appendChild(this.triggerElement)

    // コンテンツ
    this.contentWrapper = this.renderContent()
    this.container.appendChild(this.contentWrapper)
  }

  /**
   * 展開する
   */
  open(): void {
    if (this.state.isOpen) {
      return
    }

    this.state = {
      ...this.state,
      isOpen: true,
    }

    this.updateUI()
    this.callbacks.onOpen?.()
    this.callbacks.onChange?.(true)
  }

  /**
   * 折りたたむ
   */
  close(): void {
    if (!this.state.isOpen) {
      return
    }

    this.state = {
      ...this.state,
      isOpen: false,
    }

    this.updateUI()
    this.callbacks.onClose?.()
    this.callbacks.onChange?.(false)
  }

  /**
   * 開閉を切り替え
   */
  toggle(): void {
    if (this.state.isOpen) {
      this.close()
    } else {
      this.open()
    }
  }

  /**
   * 展開状態を確認
   */
  isOpen(): boolean {
    return this.state.isOpen
  }

  /**
   * 現在の状態を取得
   */
  getState(): DisclosureState {
    return { ...this.state }
  }

  /**
   * コンテンツを更新
   */
  setContent(content: string | HTMLElement): void {
    this.config = {
      ...this.config,
      content,
    }

    if (this.contentElement) {
      this.contentElement.innerHTML = ''
      if (typeof content === 'string') {
        this.contentElement.innerHTML = content
      } else {
        this.contentElement.appendChild(content)
      }
    }
  }

  /**
   * トリガーラベルを更新
   */
  setTriggerLabel(label: string, labelOpen?: string): void {
    this.config = {
      ...this.config,
      triggerLabel: label,
      triggerLabelOpen: labelOpen,
    }

    if (this.triggerElement) {
      const labelEl = this.triggerElement.querySelector('.disclosure-trigger-label')
      if (labelEl) {
        labelEl.textContent = this.getCurrentLabel()
      }
    }
  }

  /**
   * コンポーネントを破棄
   */
  destroy(): void {
    this.container.innerHTML = ''
    this.triggerElement = null
    this.contentWrapper = null
    this.contentElement = null
  }

  // ===========================================================================
  // Private Methods - Rendering
  // ===========================================================================

  private renderTrigger(): HTMLButtonElement {
    const triggerId = `${this.instanceId}-trigger`
    const contentId = `${this.instanceId}-content`

    const trigger = document.createElement('button')
    trigger.type = 'button'
    trigger.className = 'disclosure-trigger'
    trigger.id = triggerId
    trigger.setAttribute('aria-expanded', String(this.state.isOpen))
    trigger.setAttribute('aria-controls', contentId)

    // アイコン
    const icon = this.renderIcon()
    trigger.appendChild(icon)

    // ラベル
    const label = createElement('span', {
      className: 'disclosure-trigger-label',
      textContent: this.getCurrentLabel(),
    })
    trigger.appendChild(label)

    // クリックイベント
    trigger.addEventListener('click', () => {
      this.toggle()
    })

    // キーボードイベント
    trigger.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        this.toggle()
      }
    })

    return trigger
  }

  private renderIcon(): HTMLElement {
    const icon = createElement('span', {
      className: `disclosure-icon${this.state.isOpen ? ' is-open' : ''}`,
      attributes: {
        'aria-hidden': 'true',
      },
    })

    // キャレットアイコン（右向き矢印、展開時に90度回転して下向きに）
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

  private renderContent(): HTMLElement {
    const contentId = `${this.instanceId}-content`
    const triggerId = `${this.instanceId}-trigger`

    const wrapper = createElement('div', {
      className: `disclosure-content-wrapper${this.state.isOpen ? ' is-open' : ''}`,
    })

    this.contentElement = createElement('div', {
      className: 'disclosure-content',
      attributes: {
        id: contentId,
        role: 'region',
        'aria-labelledby': triggerId,
      },
    })

    // 閉じている場合の処理
    if (!this.state.isOpen) {
      if (this.config.visuallyHidden) {
        // DOMに存在させるが視覚的に隠す
        this.contentElement.setAttribute('aria-hidden', 'true')
      } else {
        // DOMから完全に非表示
        this.contentElement.setAttribute('hidden', '')
      }
    }

    // コンテンツを追加
    if (typeof this.config.content === 'string') {
      this.contentElement.innerHTML = this.config.content
    } else {
      this.contentElement.appendChild(this.config.content)
    }

    wrapper.appendChild(this.contentElement)

    return wrapper
  }

  // ===========================================================================
  // Private Methods - State Updates
  // ===========================================================================

  private updateUI(): void {
    // コンテナのクラス更新
    if (this.state.isOpen) {
      this.container.classList.add('is-open')
    } else {
      this.container.classList.remove('is-open')
    }

    // トリガーの更新
    if (this.triggerElement) {
      this.triggerElement.setAttribute('aria-expanded', String(this.state.isOpen))

      // ラベルの更新
      const labelEl = this.triggerElement.querySelector('.disclosure-trigger-label')
      if (labelEl) {
        labelEl.textContent = this.getCurrentLabel()
      }

      // アイコンの更新
      const icon = this.triggerElement.querySelector('.disclosure-icon')
      if (icon) {
        if (this.state.isOpen) {
          icon.classList.add('is-open')
        } else {
          icon.classList.remove('is-open')
        }
      }
    }

    // コンテンツラッパーの更新
    if (this.contentWrapper) {
      if (this.state.isOpen) {
        this.contentWrapper.classList.add('is-open')
      } else {
        this.contentWrapper.classList.remove('is-open')
      }
    }

    // コンテンツの更新
    if (this.contentElement) {
      if (this.state.isOpen) {
        this.contentElement.removeAttribute('hidden')
        this.contentElement.removeAttribute('aria-hidden')
      } else {
        if (this.config.visuallyHidden) {
          this.contentElement.setAttribute('aria-hidden', 'true')
        } else {
          // アニメーション終了後にhiddenを設定
          setTimeout(() => {
            if (!this.state.isOpen && this.contentElement) {
              this.contentElement.setAttribute('hidden', '')
            }
          }, 200) // アニメーション時間に合わせる
        }
      }
    }
  }

  private getCurrentLabel(): string {
    if (this.state.isOpen && this.config.triggerLabelOpen) {
      return this.config.triggerLabelOpen
    }
    return this.config.triggerLabel
  }

  // ===========================================================================
  // Static Field Renderer
  // ===========================================================================

  static renderField(field: InputField): string {
    const disclosureHtml = `
      <details class="mokkun-disclosure">
        <summary class="disclosure-trigger">${escapeHtml(field.label)}</summary>
        <div class="disclosure-content">
          <p>${escapeHtml(field.description ?? '詳細コンテンツがここに表示されます')}</p>
        </div>
      </details>
    `
    return createFieldWrapper(field, disclosureHtml)
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Disclosureを作成
 */
export function createDisclosure(
  container: HTMLElement,
  config: DisclosureConfig,
  callbacks?: DisclosureCallbacks
): Disclosure {
  const disclosure = new Disclosure(container, config, callbacks)
  disclosure.render()
  return disclosure
}

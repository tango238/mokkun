/**
 * Badge Component
 * バッジコンポーネント
 *
 * 
 * - カラーバリエーション（gray/blue/green/yellow/red）
 * - サイズ（small/medium）
 * - dot表示（数値なしの状態表示）
 * - カウント表示（99+などの上限表示）
 * - `data-color` / `data-size` for styling
 * - `role="status"` with `aria-label` for accessibility
 */

import { createElement } from '../utils/dom'
import { escapeHtml, createFieldWrapper } from '../utils/field-helpers'
import type { InputField } from '../../types/schema'

// =============================================================================
// Types
// =============================================================================

/**
 * バッジの状態
 */
export interface BadgeState {
  /** 表示する数値 */
  count: number | null
  /** 表示するテキスト */
  text: string | null
  /** dotモード */
  dot: boolean
  /** 非表示状態 */
  hidden: boolean
}

/**
 * バッジのコールバック
 */
export interface BadgeCallbacks {
  /** カウント変更時 */
  onCountChange?: (count: number | null) => void
  /** クリック時 */
  onClick?: (event: MouseEvent) => void
}

/**
 * バッジの設定
 */
export interface BadgeConfig {
  /** カラー */
  color?: 'gray' | 'blue' | 'green' | 'yellow' | 'red'
  /** サイズ */
  size?: 'small' | 'medium'
  /** dotモード（数値なしの状態表示） */
  dot?: boolean
  /** 初期カウント */
  count?: number
  /** カウント表示の上限（デフォルト: 99） */
  maxCount?: number
  /** テキストコンテンツ（数値の代わりにテキストを表示） */
  text?: string
  /** ラベル（アクセシビリティ用） */
  label?: string
  /** クリック可能か */
  clickable?: boolean
  /** 0の時に非表示にするか */
  hideOnZero?: boolean
}

// =============================================================================
// Badge Class
// =============================================================================

/**
 * バッジコンポーネント
 */
export class Badge {
  private config: BadgeConfig
  private state: BadgeState
  private callbacks: BadgeCallbacks
  private container: HTMLElement
  private clickHandler: ((event: MouseEvent) => void) | null = null

  constructor(
    container: HTMLElement,
    config: BadgeConfig = {},
    callbacks: BadgeCallbacks = {}
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
   * バッジをレンダリング
   */
  render(): void {
    this.container.innerHTML = ''

    const color = this.config.color ?? 'gray'
    const size = this.config.size ?? 'medium'
    const clickable = this.config.clickable ?? false

    this.container.className = `mokkun-badge badge-${color} badge-${size}`

    if (clickable) {
      this.container.classList.add('badge-clickable')
    }

    if (this.state.dot) {
      this.container.classList.add('badge-dot')
    }

    // data属性を設定
    this.container.setAttribute('data-color', color)
    this.container.setAttribute('data-size', size)

    if (this.state.hidden) {
      this.container.setAttribute('data-hidden', '')
      this.container.style.display = 'none'
      return
    } else {
      this.container.removeAttribute('data-hidden')
      this.container.style.display = ''
    }

    // バッジ要素を作成
    const badge = this.renderBadge()
    this.container.appendChild(badge)

    // クリックイベント
    // 既存のイベントリスナーを削除
    if (this.clickHandler) {
      this.container.removeEventListener('click', this.clickHandler)
      this.clickHandler = null
    }

    if (clickable && this.callbacks.onClick) {
      this.clickHandler = this.handleClick.bind(this)
      this.container.addEventListener('click', this.clickHandler)
    }
  }

  /**
   * カウントを設定
   */
  setCount(count: number): void {
    if (count < 0) {
      count = 0
    }

    if (this.state.count === count) {
      return
    }

    this.state = {
      ...this.state,
      count,
      text: null, // カウントを設定するとテキストはクリア
      hidden: (this.config.hideOnZero === true) && count === 0,
    }

    this.render()
    this.callbacks.onCountChange?.(count)
  }

  /**
   * テキストを設定
   */
  setText(text: string): void {
    if (this.state.text === text) {
      return
    }

    this.state = {
      ...this.state,
      text,
      count: null, // テキストを設定するとカウントはクリア
      hidden: false,
    }

    this.render()
  }

  /**
   * dotモードを設定
   */
  setDot(dot: boolean): void {
    if (this.state.dot === dot) {
      return
    }

    this.state = {
      ...this.state,
      dot,
    }

    this.render()
  }

  /**
   * 非表示状態を設定
   */
  setHidden(hidden: boolean): void {
    if (this.state.hidden === hidden) {
      return
    }

    this.state = {
      ...this.state,
      hidden,
    }

    this.render()
  }

  /**
   * 現在のカウントを取得
   */
  getCount(): number | null {
    return this.state.count
  }

  /**
   * 現在のテキストを取得
   */
  getText(): string | null {
    return this.state.text
  }

  /**
   * 現在の状態を取得
   */
  getState(): Readonly<BadgeState> {
    return { ...this.state }
  }

  /**
   * コンポーネントを破棄
   */
  destroy(): void {
    if (this.clickHandler) {
      this.container.removeEventListener('click', this.clickHandler)
      this.clickHandler = null
    }
    this.container.innerHTML = ''
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  /**
   * 初期状態を作成
   */
  private createInitialState(): BadgeState {
    const count = this.config.count ?? null
    const text = this.config.text ?? null
    const dot = this.config.dot ?? false
    const hideOnZero = this.config.hideOnZero === true

    return {
      count,
      text,
      dot,
      hidden: hideOnZero && count === 0,
    }
  }

  /**
   * バッジ要素をレンダリング
   */
  private renderBadge(): HTMLElement {
    const badge = createElement('span', {
      className: 'badge-content',
    })

    // ARIA属性
    badge.setAttribute('role', 'status')

    // アクセシビリティ用のラベル
    const ariaLabel = this.getAriaLabel()
    if (ariaLabel) {
      badge.setAttribute('aria-label', ariaLabel)
    }

    // dotモードの場合
    if (this.state.dot) {
      const dot = createElement('span', {
        className: 'badge-dot-indicator',
        attributes: {
          'aria-hidden': 'true',
        },
      })
      badge.appendChild(dot)
      return badge
    }

    // テキスト表示
    if (this.state.text !== null) {
      badge.textContent = this.state.text
      return badge
    }

    // カウント表示
    if (this.state.count !== null) {
      const displayCount = this.formatCount(this.state.count)
      badge.textContent = displayCount
      return badge
    }

    // フォールバック（空のバッジ）
    return badge
  }

  /**
   * カウントをフォーマット
   */
  private formatCount(count: number): string {
    const maxCount = this.config.maxCount ?? 99

    if (count > maxCount) {
      return `${maxCount}+`
    }

    return String(count)
  }

  /**
   * アクセシビリティ用のラベルを取得
   */
  private getAriaLabel(): string {
    // config.labelが指定されている場合はそれを使用
    if (this.config.label) {
      return this.config.label
    }

    // dotモードの場合
    if (this.state.dot) {
      return 'Status indicator'
    }

    // テキスト表示の場合
    if (this.state.text !== null) {
      return this.state.text
    }

    // カウント表示の場合
    if (this.state.count !== null) {
      const count = this.state.count
      const maxCount = this.config.maxCount ?? 99

      if (count > maxCount) {
        return `${maxCount}+ notifications`
      }

      return `${count} notification${count === 1 ? '' : 's'}`
    }

    return ''
  }

  /**
   * クリックイベントハンドラー
   */
  private handleClick(event: MouseEvent): void {
    this.callbacks.onClick?.(event)
  }

  // ===========================================================================
  // Static Field Renderer
  // ===========================================================================

  /**
   * BadgeフィールドをHTMLとしてレンダリング（静的メソッド）
   * SSR/初期レンダリング用
   */
  static renderField(field: InputField): string {
    const badgeField = field as InputField & {
      text?: string
      variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
    }
    const text = badgeField.text ?? field.label
    const variant = badgeField.variant ?? 'default'

    const badgeHtml = `
      <span class="mokkun-badge badge-${variant}">${escapeHtml(text)}</span>
    `

    return createFieldWrapper(field, badgeHtml)
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * バッジを作成
 */
export function createBadge(
  container: HTMLElement,
  config: BadgeConfig = {},
  callbacks: BadgeCallbacks = {}
): Badge {
  const badge = new Badge(container, config, callbacks)
  badge.render()
  return badge
}

/**
 * StatusLabel Component
 * ステータスラベルコンポーネント
 *
 * 
 * - タイプ（grey/blue/green/yellow/red/warning/error）
 * - 強調表示（bold）
 * - サイズ（small/medium）
 * - アイコン付き
 * - `data-type` / `data-size` / `data-bold` for styling
 * - `role="status"` with `aria-label` for accessibility
 *
 * @see https://smarthr.design/products/components/status-label/
 */

import { createElement } from '../utils/dom'

// =============================================================================
// Types
// =============================================================================

/**
 * ステータスラベルのタイプ
 * - grey: 中立的な状態
 * - blue: 情報・進行中
 * - green: 成功・完了
 * - yellow: 注意
 * - red: エラー・緊急
 * - warning: 警告（黄色背景）
 * - error: エラー（赤背景）
 */
export type StatusLabelType = 'grey' | 'blue' | 'green' | 'yellow' | 'red' | 'warning' | 'error'

/**
 * ステータスラベルのサイズ
 */
export type StatusLabelSize = 'small' | 'medium'

/**
 * ビルトインアイコンタイプ
 */
export type StatusLabelIconType =
  | 'check'
  | 'warning'
  | 'error'
  | 'info'
  | 'clock'
  | 'circle'
  | 'dot'

/**
 * ステータスラベルの状態
 */
export interface StatusLabelState {
  /** 表示テキスト */
  text: string
  /** 強調表示（背景と文字色を反転） */
  bold: boolean
  /** 非表示状態 */
  hidden: boolean
}

/**
 * ステータスラベルのコールバック
 */
export interface StatusLabelCallbacks {
  /** クリック時 */
  onClick?: (event: MouseEvent) => void
}

/**
 * ステータスラベルの設定
 */
export interface StatusLabelConfig {
  /** ラベルテキスト */
  text: string
  /** タイプ（カラー） */
  type?: StatusLabelType
  /** サイズ */
  size?: StatusLabelSize
  /** 強調表示 */
  bold?: boolean
  /** アイコン（ビルトインタイプまたはカスタムSVG） */
  icon?: StatusLabelIconType | string
  /** アイコンの位置 */
  iconPosition?: 'left' | 'right'
  /** ラベル（アクセシビリティ用） */
  label?: string
  /** クリック可能か */
  clickable?: boolean
}

// =============================================================================
// Built-in Icons
// =============================================================================

const BUILTIN_ICONS: Record<StatusLabelIconType, string> = {
  check: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.739a.75.75 0 0 1 1.04-.208Z" clip-rule="evenodd" /></svg>`,
  warning: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M6.701 2.25c.577-1 2.02-1 2.598 0l5.196 9a1.5 1.5 0 0 1-1.299 2.25H2.804a1.5 1.5 0 0 1-1.3-2.25l5.197-9ZM8 4a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd" /></svg>`,
  error: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14ZM8 4a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd" /></svg>`,
  info: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M15 8A7 7 0 1 1 1 8a7 7 0 0 1 14 0ZM9 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM6.75 8a.75.75 0 0 0 0 1.5h.75v1.75a.75.75 0 0 0 1.5 0v-2.5A.75.75 0 0 0 8.25 8h-1.5Z" clip-rule="evenodd" /></svg>`,
  clock: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M1 8a7 7 0 1 1 14 0A7 7 0 0 1 1 8Zm7.75-4.25a.75.75 0 0 0-1.5 0V8c0 .414.336.75.75.75h3.25a.75.75 0 0 0 0-1.5h-2.5v-3.5Z" clip-rule="evenodd" /></svg>`,
  circle: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><circle cx="8" cy="8" r="6" /></svg>`,
  dot: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><circle cx="8" cy="8" r="4" /></svg>`,
}

// =============================================================================
// StatusLabel Class
// =============================================================================

/**
 * ステータスラベルコンポーネント
 */
export class StatusLabel {
  private config: StatusLabelConfig
  private state: StatusLabelState
  private callbacks: StatusLabelCallbacks
  private container: HTMLElement
  private clickHandler: ((event: MouseEvent) => void) | null = null

  constructor(
    container: HTMLElement,
    config: StatusLabelConfig,
    callbacks: StatusLabelCallbacks = {}
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
   * ステータスラベルをレンダリング
   */
  render(): void {
    this.container.innerHTML = ''

    const type = this.config.type ?? 'grey'
    const size = this.config.size ?? 'medium'
    const bold = this.state.bold
    const clickable = this.config.clickable ?? false

    this.container.className = `mokkun-status-label status-label-${type} status-label-${size}`

    if (bold) {
      this.container.classList.add('status-label-bold')
    }

    if (clickable) {
      this.container.classList.add('status-label-clickable')
    }

    // data属性を設定
    this.container.setAttribute('data-type', type)
    this.container.setAttribute('data-size', size)
    if (bold) {
      this.container.setAttribute('data-bold', '')
    } else {
      this.container.removeAttribute('data-bold')
    }

    if (this.state.hidden) {
      this.container.setAttribute('data-hidden', '')
      this.container.style.display = 'none'
      return
    } else {
      this.container.removeAttribute('data-hidden')
      this.container.style.display = ''
    }

    // ラベル要素を作成
    const label = this.renderLabel()
    this.container.appendChild(label)

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
   * テキストを設定
   */
  setText(text: string): void {
    if (this.state.text === text) {
      return
    }

    this.state = {
      ...this.state,
      text,
    }

    this.render()
  }

  /**
   * 強調表示を設定
   */
  setBold(bold: boolean): void {
    if (this.state.bold === bold) {
      return
    }

    this.state = {
      ...this.state,
      bold,
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
   * 現在のテキストを取得
   */
  getText(): string {
    return this.state.text
  }

  /**
   * 強調表示状態を取得
   */
  isBold(): boolean {
    return this.state.bold
  }

  /**
   * 現在の状態を取得
   */
  getState(): Readonly<StatusLabelState> {
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
  private createInitialState(): StatusLabelState {
    return {
      text: this.config.text,
      bold: this.config.bold ?? false,
      hidden: false,
    }
  }

  /**
   * ラベル要素をレンダリング
   */
  private renderLabel(): HTMLElement {
    const label = createElement('span', {
      className: 'status-label-content',
    })

    // ARIA属性
    label.setAttribute('role', 'status')

    // アクセシビリティ用のラベル
    const ariaLabel = this.getAriaLabel()
    if (ariaLabel) {
      label.setAttribute('aria-label', ariaLabel)
    }

    const iconPosition = this.config.iconPosition ?? 'left'

    // アイコン（左）
    if (this.config.icon && iconPosition === 'left') {
      const iconEl = this.renderIcon()
      if (iconEl) {
        label.appendChild(iconEl)
      }
    }

    // テキスト
    const textSpan = createElement('span', {
      className: 'status-label-text',
      textContent: this.state.text,
    })
    label.appendChild(textSpan)

    // アイコン（右）
    if (this.config.icon && iconPosition === 'right') {
      const iconEl = this.renderIcon()
      if (iconEl) {
        label.appendChild(iconEl)
      }
    }

    return label
  }

  /**
   * アイコン要素をレンダリング
   */
  private renderIcon(): HTMLElement | null {
    if (!this.config.icon) {
      return null
    }

    const iconWrapper = createElement('span', {
      className: 'status-label-icon',
      attributes: {
        'aria-hidden': 'true',
      },
    })

    // ビルトインアイコンをチェック
    const builtinIcon = BUILTIN_ICONS[this.config.icon as StatusLabelIconType]
    if (builtinIcon) {
      iconWrapper.innerHTML = builtinIcon
    } else {
      // カスタムSVGとして扱う（サニタイズ処理）
      const sanitizedSvg = this.sanitizeSvgIcon(this.config.icon)
      if (sanitizedSvg) {
        iconWrapper.innerHTML = sanitizedSvg
      }
    }

    return iconWrapper
  }

  /**
   * カスタムSVGアイコンをサニタイズ
   * XSS攻撃を防ぐため、SVG要素のみを許可し、危険な属性を削除する
   */
  private sanitizeSvgIcon(input: string): string | null {
    const trimmed = input.trim()

    // SVG要素でなければ拒否
    if (!trimmed.toLowerCase().startsWith('<svg') || !trimmed.toLowerCase().endsWith('</svg>')) {
      return null
    }

    // DOMパーサーでSVGを解析
    const parser = new DOMParser()
    const doc = parser.parseFromString(trimmed, 'image/svg+xml')

    // パースエラーがある場合は拒否
    const parserError = doc.querySelector('parsererror')
    if (parserError) {
      return null
    }

    const svg = doc.querySelector('svg')
    if (!svg) {
      return null
    }

    // 危険な要素を削除（script, foreignObject, iframe等）
    const dangerousElements = ['script', 'foreignObject', 'iframe', 'object', 'embed', 'use']
    dangerousElements.forEach((tag) => {
      svg.querySelectorAll(tag).forEach((el) => el.remove())
    })

    // 危険な属性を全要素から削除（イベントハンドラ等）
    const dangerousAttrs = [
      'onload', 'onerror', 'onclick', 'onmouseover', 'onmouseout', 'onmousedown',
      'onmouseup', 'onfocus', 'onblur', 'onkeydown', 'onkeyup', 'onkeypress',
      'onsubmit', 'onreset', 'onchange', 'oninput', 'onscroll', 'onresize',
      'onanimationstart', 'onanimationend', 'ontransitionend',
    ]

    // SVG要素自体の属性もサニタイズ
    dangerousAttrs.forEach((attr) => svg.removeAttribute(attr))
    const svgHref = svg.getAttribute('href') ?? svg.getAttribute('xlink:href')
    if (svgHref && svgHref.toLowerCase().startsWith('javascript:')) {
      svg.removeAttribute('href')
      svg.removeAttribute('xlink:href')
    }

    // 子要素の属性もサニタイズ
    svg.querySelectorAll('*').forEach((el) => {
      dangerousAttrs.forEach((attr) => el.removeAttribute(attr))
      // href/xlink:hrefがjavascript:の場合も削除
      const href = el.getAttribute('href') ?? el.getAttribute('xlink:href')
      if (href && href.toLowerCase().startsWith('javascript:')) {
        el.removeAttribute('href')
        el.removeAttribute('xlink:href')
      }
    })

    return svg.outerHTML
  }

  /**
   * アクセシビリティ用のラベルを取得
   */
  private getAriaLabel(): string {
    if (this.config.label) {
      return this.config.label
    }
    return this.state.text
  }

  /**
   * クリックイベントハンドラー
   */
  private handleClick(event: MouseEvent): void {
    this.callbacks.onClick?.(event)
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * ステータスラベルを作成
 */
export function createStatusLabel(
  container: HTMLElement,
  config: StatusLabelConfig,
  callbacks: StatusLabelCallbacks = {}
): StatusLabel {
  const statusLabel = new StatusLabel(container, config, callbacks)
  statusLabel.render()
  return statusLabel
}

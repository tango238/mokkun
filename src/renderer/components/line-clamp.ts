/**
 * LineClamp Component
 * 行数制限コンポーネント
 *
 * 機能:
 * - 行数指定（1-6行）
 * - 展開ボタン（「もっと見る」/「折りたたむ」）
 * - ツールチップでの全文表示
 * - 省略記号（...）表示
 */

import { createElement, generateId, escapeHtml } from '../utils/dom'
import { escapeHtml as escapeHtmlHelper, createFieldWrapper } from '../utils/field-helpers'
import type { InputField } from '../../types/schema'
import { Tooltip, type TooltipPosition } from './tooltip'

// =============================================================================
// Types
// =============================================================================

/**
 * 行数制限の値（1-6）
 */
export type MaxLines = 1 | 2 | 3 | 4 | 5 | 6

/**
 * LineClampの状態
 */
export interface LineClampState {
  /** テキスト内容 */
  text: string
  /** 最大行数 */
  maxLines: MaxLines
  /** 展開中かどうか */
  expanded: boolean
  /** テキストが切り詰められているかどうか */
  clamped: boolean
  /** 展開ボタンを表示するか */
  showExpandButton: boolean
  /** ツールチップを表示するか */
  showTooltip: boolean
  /** ツールチップの位置 */
  tooltipPosition: TooltipPosition
}

/**
 * LineClampのコールバック
 */
export interface LineClampCallbacks {
  /** 展開時 */
  onExpand?: () => void
  /** 折りたたみ時 */
  onCollapse?: () => void
  /** トグル時（展開/折りたたみ） */
  onToggle?: (expanded: boolean) => void
}

/**
 * LineClampの設定
 */
export interface LineClampConfig {
  /** テキスト内容 */
  text: string
  /** 最大行数（1-6、デフォルト: 2） */
  maxLines: MaxLines
  /** HTMLコンテンツとして解釈するか（デフォルト: false） */
  isHtml?: boolean
  /** 展開ボタンを表示するか（デフォルト: false） */
  showExpandButton?: boolean
  /** 展開ボタンのラベル（デフォルト: 「もっと見る」） */
  expandButtonLabel?: string
  /** 折りたたみボタンのラベル（デフォルト: 「折りたたむ」） */
  collapseButtonLabel?: string
  /** ツールチップで全文を表示するか（デフォルト: true） */
  showTooltip?: boolean
  /** ツールチップの位置（デフォルト: top） */
  tooltipPosition?: TooltipPosition
  /** ツールチップの遅延時間（ミリ秒、デフォルト: 300） */
  tooltipDelay?: number
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * HTMLをサニタイズする（許可されたタグのみを保持）
 * XSS攻撃を防ぐために、scriptタグやイベントハンドラを除去
 */
function sanitizeHtml(html: string): string {
  // 許可するタグ
  const allowedTags = ['strong', 'em', 'b', 'i', 'u', 'a', 'br', 'span', 'p']
  // 許可する属性
  const allowedAttributes: Record<string, string[]> = {
    a: ['href', 'target', 'rel'],
    span: ['class'],
  }

  // DOMParserでパース
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  // ノードを再帰的にサニタイズ
  function sanitizeNode(node: Node): Node | null {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.cloneNode()
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return null
    }

    const element = node as Element
    const tagName = element.tagName.toLowerCase()

    // 許可されていないタグの場合は子要素のみを返す
    if (!allowedTags.includes(tagName)) {
      const fragment = document.createDocumentFragment()
      for (const child of Array.from(element.childNodes)) {
        const sanitizedChild = sanitizeNode(child)
        if (sanitizedChild) {
          fragment.appendChild(sanitizedChild)
        }
      }
      return fragment
    }

    // 許可されたタグの場合は新しい要素を作成
    const newElement = document.createElement(tagName)

    // 許可された属性のみをコピー
    const allowedAttrs = allowedAttributes[tagName] ?? []
    for (const attr of allowedAttrs) {
      const value = element.getAttribute(attr)
      if (value !== null) {
        // href属性はjavascript:を除去
        if (attr === 'href' && value.toLowerCase().startsWith('javascript:')) {
          continue
        }
        newElement.setAttribute(attr, value)
      }
    }

    // aタグの場合、rel="noopener noreferrer"を追加（セキュリティ対策）
    if (tagName === 'a' && newElement.getAttribute('target') === '_blank') {
      newElement.setAttribute('rel', 'noopener noreferrer')
    }

    // 子要素を再帰的にサニタイズ
    for (const child of Array.from(element.childNodes)) {
      const sanitizedChild = sanitizeNode(child)
      if (sanitizedChild) {
        newElement.appendChild(sanitizedChild)
      }
    }

    return newElement
  }

  // bodyの子要素をサニタイズしてHTMLに変換
  const fragment = document.createDocumentFragment()
  for (const child of Array.from(doc.body.childNodes)) {
    const sanitizedChild = sanitizeNode(child)
    if (sanitizedChild) {
      fragment.appendChild(sanitizedChild)
    }
  }

  const tempDiv = document.createElement('div')
  tempDiv.appendChild(fragment)
  return tempDiv.innerHTML
}

/**
 * maxLinesの値を検証
 */
function isValidMaxLines(value: number): value is MaxLines {
  return Number.isInteger(value) && value >= 1 && value <= 6
}

// =============================================================================
// LineClamp Class
// =============================================================================

/**
 * 行数制限コンポーネント
 */
export class LineClamp {
  private config: Required<Omit<LineClampConfig, 'isHtml' | 'tooltipDelay'>> & {
    isHtml: boolean
    tooltipDelay: number
  }
  private state: LineClampState
  private callbacks: LineClampCallbacks
  private container: HTMLElement
  private element: HTMLElement | null = null
  private textElement: HTMLElement | null = null
  private buttonContainer: HTMLElement | null = null
  private expandButton: HTMLElement | null = null
  private collapseButton: HTMLElement | null = null
  private instanceId: string
  private tooltip: Tooltip | null = null
  private resizeObserver: ResizeObserver | null = null
  private resizeDebounceTimeout: number | null = null

  // イベントハンドラをバインド
  private handleExpand = (): void => this.expand()
  private handleCollapse = (): void => this.collapse()

  constructor(
    config: LineClampConfig,
    container: HTMLElement,
    callbacks: LineClampCallbacks = {}
  ) {
    // maxLinesの検証
    if (!isValidMaxLines(config.maxLines)) {
      console.warn(`[LineClamp] Invalid maxLines value: ${config.maxLines}. Using default value 2.`)
    }

    this.config = {
      text: config.text,
      maxLines: isValidMaxLines(config.maxLines) ? config.maxLines : 2,
      isHtml: config.isHtml ?? false,
      showExpandButton: config.showExpandButton ?? false,
      expandButtonLabel: config.expandButtonLabel ?? 'もっと見る',
      collapseButtonLabel: config.collapseButtonLabel ?? '折りたたむ',
      showTooltip: config.showTooltip ?? true,
      tooltipPosition: config.tooltipPosition ?? 'top',
      tooltipDelay: config.tooltipDelay ?? 300,
    }
    this.container = container
    this.callbacks = callbacks
    this.instanceId = generateId('line-clamp')
    this.state = {
      text: this.config.text,
      maxLines: this.config.maxLines,
      expanded: false,
      clamped: false,
      showExpandButton: this.config.showExpandButton,
      showTooltip: this.config.showTooltip,
      tooltipPosition: this.config.tooltipPosition,
    }

    this.render()
    this.setupResizeObserver()
  }

  // ===========================================================================
  // Public Methods
  // ===========================================================================

  /**
   * テキストを展開
   */
  expand(): void {
    if (this.state.expanded) {
      return
    }

    this.state = {
      ...this.state,
      expanded: true,
    }

    this.element?.classList.add('expanded')
    this.element?.setAttribute('aria-expanded', 'true')
    this.updateTextStyles()
    this.updateExpandButton()

    this.callbacks.onExpand?.()
    this.callbacks.onToggle?.(true)
  }

  /**
   * テキストを折りたたむ
   */
  collapse(): void {
    if (!this.state.expanded) {
      return
    }

    this.state = {
      ...this.state,
      expanded: false,
    }

    this.element?.classList.remove('expanded')
    this.element?.setAttribute('aria-expanded', 'false')
    this.updateTextStyles()
    this.updateExpandButton()

    this.callbacks.onCollapse?.()
    this.callbacks.onToggle?.(false)
  }

  /**
   * 展開/折りたたみをトグル
   */
  toggle(): void {
    if (this.state.expanded) {
      this.collapse()
    } else {
      this.expand()
    }
  }

  /**
   * 展開中かどうかを取得
   * @returns {boolean} 展開中の場合true
   */
  isExpanded(): boolean {
    return this.state.expanded
  }

  /**
   * テキストを更新
   */
  setText(text: string): void {
    this.config = {
      ...this.config,
      text,
    }
    this.state = {
      ...this.state,
      text,
    }

    this.updateTextContent()
    this.updateClampedState()
    this.initializeTooltip()
  }

  /**
   * 最大行数を更新
   */
  setMaxLines(maxLines: MaxLines): void {
    // 入力検証
    if (!isValidMaxLines(maxLines)) {
      console.warn(`[LineClamp] Invalid maxLines value: ${maxLines}. Value must be between 1 and 6.`)
      return
    }

    this.config = {
      ...this.config,
      maxLines,
    }
    this.state = {
      ...this.state,
      maxLines,
    }

    this.updateTextStyles()
    this.updateClampedState()
    this.initializeTooltip()
  }

  /**
   * 現在の状態を取得
   * @returns {LineClampState} 現在の状態のコピー
   */
  getState(): LineClampState {
    return { ...this.state }
  }

  /**
   * テスト用：切り詰め状態を強制的に設定
   * @internal
   */
  setClampedForTesting(clamped: boolean): void {
    this.state = {
      ...this.state,
      clamped,
    }

    if (clamped) {
      this.element?.classList.add('clamped')
    } else {
      this.element?.classList.remove('clamped')
    }

    this.updateExpandButton()
    this.initializeTooltip()
  }

  /**
   * コンポーネントを破棄
   */
  destroy(): void {
    // デバウンスタイムアウトをクリア
    if (this.resizeDebounceTimeout !== null) {
      clearTimeout(this.resizeDebounceTimeout)
      this.resizeDebounceTimeout = null
    }

    // Tooltipを破棄
    if (this.tooltip) {
      this.tooltip.destroy()
      this.tooltip = null
    }

    // ResizeObserverを破棄
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }

    // イベントリスナーを削除
    this.cleanupButtonListeners()

    // DOM要素を削除
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element)
    }

    this.element = null
    this.textElement = null
    this.buttonContainer = null
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  /**
   * コンポーネントをレンダリング
   */
  private render(): void {
    // メインコンテナを作成
    this.element = createElement('div', {
      className: 'mokkun-line-clamp',
      attributes: {
        id: this.instanceId,
        'aria-expanded': 'false',
      },
    })

    // テキスト要素を作成
    this.textElement = createElement('span', {
      className: 'line-clamp-text',
      attributes: {
        id: `${this.instanceId}-text`,
      },
    })

    this.updateTextContent()
    this.updateTextStyles()
    this.element.appendChild(this.textElement)

    // ボタンコンテナを作成
    this.buttonContainer = createElement('div', {
      className: 'line-clamp-button-container',
    })
    this.element.appendChild(this.buttonContainer)

    // コンテナに追加
    this.container.appendChild(this.element)

    // 切り詰め状態を更新（DOM追加後に実行）
    requestAnimationFrame(() => {
      this.updateClampedState()
      this.updateExpandButton()
      this.initializeTooltip()
    })
  }

  /**
   * テキスト内容を更新
   */
  private updateTextContent(): void {
    if (!this.textElement) {
      return
    }

    if (this.config.isHtml) {
      // HTMLをサニタイズしてからセット（XSS対策）
      this.textElement.innerHTML = sanitizeHtml(this.config.text)
    } else {
      this.textElement.textContent = this.config.text
    }
  }

  /**
   * テキストスタイルを更新
   */
  private updateTextStyles(): void {
    if (!this.textElement) {
      return
    }

    if (this.state.expanded) {
      // 展開時はline-clampを解除
      this.textElement.style.removeProperty('-webkit-line-clamp')
      this.textElement.style.removeProperty('display')
      this.textElement.style.removeProperty('-webkit-box-orient')
      this.textElement.style.removeProperty('overflow')
    } else {
      // 切り詰め時はline-clampを適用
      this.textElement.style.setProperty('-webkit-line-clamp', String(this.state.maxLines))
      this.textElement.style.setProperty('display', '-webkit-box')
      this.textElement.style.setProperty('-webkit-box-orient', 'vertical')
      this.textElement.style.setProperty('overflow', 'hidden')
    }
  }

  /**
   * 切り詰め状態を更新
   */
  private updateClampedState(): void {
    const clamped = this.checkIfClamped()
    this.state = {
      ...this.state,
      clamped,
    }

    if (clamped) {
      this.element?.classList.add('clamped')
    } else {
      this.element?.classList.remove('clamped')
    }
  }

  /**
   * テキストが切り詰められているかチェック
   */
  private checkIfClamped(): boolean {
    if (!this.textElement) {
      return false
    }

    // 展開中は切り詰められていないとみなす
    if (this.state.expanded) {
      return false
    }

    // scrollHeightとclientHeightを比較
    return this.textElement.scrollHeight > this.textElement.clientHeight
  }

  /**
   * ボタンのイベントリスナーをクリーンアップ
   */
  private cleanupButtonListeners(): void {
    if (this.expandButton) {
      this.expandButton.removeEventListener('click', this.handleExpand)
      this.expandButton = null
    }
    if (this.collapseButton) {
      this.collapseButton.removeEventListener('click', this.handleCollapse)
      this.collapseButton = null
    }
  }

  /**
   * 展開ボタンを更新
   */
  private updateExpandButton(): void {
    if (!this.buttonContainer || !this.config.showExpandButton) {
      return
    }

    // 既存のイベントリスナーをクリーンアップ
    this.cleanupButtonListeners()

    // 既存のボタンを削除
    this.buttonContainer.innerHTML = ''

    // 切り詰められていない場合はボタンを表示しない
    if (!this.state.clamped && !this.state.expanded) {
      return
    }

    if (this.state.expanded) {
      // 折りたたみボタン
      this.collapseButton = createElement('button', {
        className: 'line-clamp-collapse-button',
        textContent: this.config.collapseButtonLabel,
        attributes: {
          type: 'button',
          'aria-controls': `${this.instanceId}-text`,
          'aria-expanded': 'true',
        },
      })
      this.collapseButton.addEventListener('click', this.handleCollapse)
      this.buttonContainer.appendChild(this.collapseButton)
    } else {
      // 展開ボタン
      this.expandButton = createElement('button', {
        className: 'line-clamp-expand-button',
        textContent: this.config.expandButtonLabel,
        attributes: {
          type: 'button',
          'aria-controls': `${this.instanceId}-text`,
          'aria-expanded': 'false',
        },
      })
      this.expandButton.addEventListener('click', this.handleExpand)
      this.buttonContainer.appendChild(this.expandButton)
    }
  }

  /**
   * ツールチップを初期化
   */
  private initializeTooltip(): void {
    // 既存のTooltipを破棄
    if (this.tooltip) {
      this.tooltip.destroy()
      this.tooltip = null
    }

    // ツールチップが無効、または切り詰められていない場合は初期化しない
    if (!this.config.showTooltip || !this.element) {
      return
    }

    // 切り詰められている場合のみTooltipを作成（state.clampedを参照）
    if (this.state.clamped) {
      this.tooltip = new Tooltip(this.element, {
        content: this.config.isHtml
          ? sanitizeHtml(this.config.text)
          : escapeHtml(this.config.text),
        isHtml: this.config.isHtml,
        position: this.config.tooltipPosition,
        delay: this.config.tooltipDelay,
        maxWidth: '400px',
        markTrigger: false,
      })
    }
  }

  /**
   * ResizeObserverをセットアップ
   */
  private setupResizeObserver(): void {
    if (!this.textElement || typeof ResizeObserver === 'undefined') {
      return
    }

    this.resizeObserver = new ResizeObserver(() => {
      // デバウンス処理（パフォーマンス対策）
      if (this.resizeDebounceTimeout !== null) {
        clearTimeout(this.resizeDebounceTimeout)
      }

      this.resizeDebounceTimeout = window.setTimeout(() => {
        this.updateClampedState()
        this.updateExpandButton()
        this.initializeTooltip()
      }, 100)
    })

    this.resizeObserver.observe(this.textElement)
  }

  // ===========================================================================
  // Static Field Renderer
  // ===========================================================================

  static renderField(field: InputField): string {
    const lineClampField = field as InputField & {
      lines?: number
    }
    const lines = lineClampField.lines ?? 3

    const lineClampHtml = `
      <div class="mokkun-line-clamp" style="-webkit-line-clamp: ${lines}; display: -webkit-box; -webkit-box-orient: vertical; overflow: hidden;">
        ${escapeHtmlHelper(field.description ?? 'テキストコンテンツがここに表示されます。長いテキストは指定行数で切り詰められます。')}
      </div>
    `
    return createFieldWrapper(field, lineClampHtml)
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * LineClampを作成するファクトリ関数
 */
export function createLineClamp(
  config: LineClampConfig,
  container: HTMLElement,
  callbacks: LineClampCallbacks = {}
): LineClamp {
  return new LineClamp(config, container, callbacks)
}

/**
 * Timeline Component
 * タイムラインコンポーネント
 *
 * 
 * - 日時表示（datetime / dateLabel）
 * - 時間フォーマット（none / HH:mm:ss / HH:mm）
 * - アイコンカスタマイズ
 * - コンテンツのカスタマイズ
 * - 接続線のスタイル
 * - 現在のアイテム強調（current）
 *
 * @see https://smarthr.design/products/components/timeline/
 */

import { createElement, clearElement } from '../utils/dom'

// =============================================================================
// Types
// =============================================================================

/**
 * 時間表示フォーマット
 * - none: 時間を表示しない
 * - HH:mm:ss: 時:分:秒
 * - HH:mm: 時:分
 */
export type TimelineTimeFormat = 'none' | 'HH:mm:ss' | 'HH:mm'

/**
 * ビルトインアイコンタイプ
 */
export type TimelineIconType =
  | 'circle'
  | 'dot'
  | 'check'
  | 'warning'
  | 'error'
  | 'info'
  | 'clock'
  | 'star'
  | 'user'
  | 'message'

/**
 * タイムラインアイテムの設定
 */
export interface TimelineItemConfig {
  /** 日時（Date or ISO string） */
  datetime: string | Date
  /** カスタム日付ラベル（表示用、datetimeの代わりに表示） */
  dateLabel?: string
  /** 時間表示フォーマット */
  timeFormat?: TimelineTimeFormat
  /** 日付サフィックスエリア（日付の後に表示される追加コンテンツ） */
  dateSuffixArea?: string
  /** サイドアクションエリア（右側に表示されるアクションボタン等） */
  sideActionArea?: string
  /** 現在のアイテム（強調表示） */
  current?: boolean
  /** アイコン（ビルトインタイプまたはカスタムSVG） */
  icon?: TimelineIconType | string
  /** アイコンの色（CSS color値） */
  iconColor?: string
  /** コンテンツ（HTML文字列） */
  content: string
  /** タイトル */
  title?: string
}

/**
 * タイムラインの設定
 */
export interface TimelineConfig {
  /** タイムラインアイテム配列 */
  items: TimelineItemConfig[]
}

/**
 * タイムラインの状態
 */
export interface TimelineState {
  /** アイテム数 */
  itemCount: number
  /** 現在のアイテムインデックス（-1 = なし） */
  currentIndex: number
}

/**
 * タイムラインのコールバック
 */
export interface TimelineCallbacks {
  /** アイテムクリック時 */
  onItemClick?: (index: number, event: MouseEvent) => void
}

// =============================================================================
// Built-in Icons
// =============================================================================

const BUILTIN_ICONS: Record<TimelineIconType, string> = {
  circle: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><circle cx="8" cy="8" r="6" /></svg>`,
  dot: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><circle cx="8" cy="8" r="4" /></svg>`,
  check: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.739a.75.75 0 0 1 1.04-.208Z" clip-rule="evenodd" /></svg>`,
  warning: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M6.701 2.25c.577-1 2.02-1 2.598 0l5.196 9a1.5 1.5 0 0 1-1.299 2.25H2.804a1.5 1.5 0 0 1-1.3-2.25l5.197-9ZM8 4a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd" /></svg>`,
  error: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14ZM8 4a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd" /></svg>`,
  info: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M15 8A7 7 0 1 1 1 8a7 7 0 0 1 14 0ZM9 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM6.75 8a.75.75 0 0 0 0 1.5h.75v1.75a.75.75 0 0 0 1.5 0v-2.5A.75.75 0 0 0 8.25 8h-1.5Z" clip-rule="evenodd" /></svg>`,
  clock: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M1 8a7 7 0 1 1 14 0A7 7 0 0 1 1 8Zm7.75-4.25a.75.75 0 0 0-1.5 0V8c0 .414.336.75.75.75h3.25a.75.75 0 0 0 0-1.5h-2.5v-3.5Z" clip-rule="evenodd" /></svg>`,
  star: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M8 1.75a.75.75 0 0 1 .692.462l1.41 3.393 3.664.293a.75.75 0 0 1 .428 1.317l-2.791 2.39.853 3.58a.75.75 0 0 1-1.12.814L8 11.95l-3.136 2.05a.75.75 0 0 1-1.12-.815l.853-3.58-2.79-2.39a.75.75 0 0 1 .427-1.316l3.663-.293 1.41-3.393A.75.75 0 0 1 8 1.75Z" clip-rule="evenodd" /></svg>`,
  user: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z" /></svg>`,
  message: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M1 8.74c0 .983.713 1.825 1.69 1.943.764.092 1.534.164 2.31.216v2.351a.75.75 0 0 0 1.28.53l2.51-2.51c.182-.181.427-.283.684-.287A23.109 23.109 0 0 0 14 10.67c.7-.123 1-.87 1-1.63v-4.6c0-.76-.3-1.51-1-1.63A23.056 23.056 0 0 0 8 2.25c-2.154 0-4.254.147-6 .56-.7.12-1 .87-1 1.63v4.3Z" clip-rule="evenodd" /></svg>`,
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Dateオブジェクトに変換
 */
function toDate(datetime: string | Date): Date {
  if (datetime instanceof Date) {
    return datetime
  }
  return new Date(datetime)
}

/**
 * 日付をフォーマット（YYYY/MM/DD形式）
 */
function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}/${month}/${day}`
}

/**
 * 時間をフォーマット
 */
function formatTime(date: Date, format: TimelineTimeFormat): string {
  if (format === 'none') {
    return ''
  }

  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  if (format === 'HH:mm') {
    return `${hours}:${minutes}`
  }

  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

/**
 * HTMLをサニタイズ（XSS対策）
 * 安全なHTML要素と属性のみを許可
 */
function sanitizeHtml(input: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(input, 'text/html')

  // 危険な要素を完全に削除
  const dangerousElements = [
    'script', 'iframe', 'object', 'embed', 'form', 'input', 'button',
    'textarea', 'select', 'style', 'link', 'meta', 'base', 'noscript',
  ]
  dangerousElements.forEach((tag) => {
    doc.querySelectorAll(tag).forEach((el) => el.remove())
  })

  // 危険な属性を全要素から削除（イベントハンドラ等）
  const dangerousAttrs = [
    'onload', 'onerror', 'onclick', 'onmouseover', 'onmouseout', 'onmousedown',
    'onmouseup', 'onfocus', 'onblur', 'onkeydown', 'onkeyup', 'onkeypress',
    'onsubmit', 'onreset', 'onchange', 'oninput', 'onscroll', 'onresize',
    'onanimationstart', 'onanimationend', 'ontransitionend', 'oncontextmenu',
    'ondblclick', 'ondrag', 'ondragend', 'ondragenter', 'ondragleave',
    'ondragover', 'ondragstart', 'ondrop', 'onmouseenter', 'onmouseleave',
    'onmousemove', 'onwheel', 'oncopy', 'oncut', 'onpaste', 'onabort',
    'oncanplay', 'oncanplaythrough', 'oncuechange', 'ondurationchange',
    'onemptied', 'onended', 'onloadeddata', 'onloadedmetadata', 'onloadstart',
    'onpause', 'onplay', 'onplaying', 'onprogress', 'onratechange', 'onseeked',
    'onseeking', 'onstalled', 'onsuspend', 'ontimeupdate', 'onvolumechange',
    'onwaiting', 'ontoggle', 'onpointerdown', 'onpointerup', 'onpointermove',
    'onpointerenter', 'onpointerleave', 'onpointercancel', 'ongotpointercapture',
    'onlostpointercapture', 'ontouchstart', 'ontouchmove', 'ontouchend',
    'ontouchcancel',
  ]

  doc.querySelectorAll('*').forEach((el) => {
    // イベントハンドラ属性を削除
    dangerousAttrs.forEach((attr) => el.removeAttribute(attr))

    // javascript: URLを削除
    const href = el.getAttribute('href')
    if (href && href.toLowerCase().trim().startsWith('javascript:')) {
      el.removeAttribute('href')
    }

    const src = el.getAttribute('src')
    if (src && src.toLowerCase().trim().startsWith('javascript:')) {
      el.removeAttribute('src')
    }

    // data: URLは画像以外では危険なので削除
    if (src && src.toLowerCase().trim().startsWith('data:') && el.tagName.toLowerCase() !== 'img') {
      el.removeAttribute('src')
    }

    // style属性からjavascript:やexpression()を削除
    const style = el.getAttribute('style')
    if (style) {
      const sanitizedStyle = style
        .replace(/javascript:/gi, '')
        .replace(/expression\s*\(/gi, '')
        .replace(/url\s*\(\s*["']?\s*javascript:/gi, 'url(')
      el.setAttribute('style', sanitizedStyle)
    }
  })

  return doc.body.innerHTML
}

/**
 * カスタムSVGアイコンをサニタイズ
 */
function sanitizeSvgIcon(input: string): string | null {
  const trimmed = input.trim()

  if (!trimmed.toLowerCase().startsWith('<svg') || !trimmed.toLowerCase().endsWith('</svg>')) {
    return null
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(trimmed, 'image/svg+xml')

  const parserError = doc.querySelector('parsererror')
  if (parserError) {
    return null
  }

  const svg = doc.querySelector('svg')
  if (!svg) {
    return null
  }

  const dangerousElements = ['script', 'foreignObject', 'iframe', 'object', 'embed', 'use']
  dangerousElements.forEach((tag) => {
    svg.querySelectorAll(tag).forEach((el) => el.remove())
  })

  const dangerousAttrs = [
    'onload', 'onerror', 'onclick', 'onmouseover', 'onmouseout', 'onmousedown',
    'onmouseup', 'onfocus', 'onblur', 'onkeydown', 'onkeyup', 'onkeypress',
    'onsubmit', 'onreset', 'onchange', 'oninput', 'onscroll', 'onresize',
    'onanimationstart', 'onanimationend', 'ontransitionend',
  ]

  dangerousAttrs.forEach((attr) => svg.removeAttribute(attr))
  const svgHref = svg.getAttribute('href') ?? svg.getAttribute('xlink:href')
  if (svgHref && svgHref.toLowerCase().startsWith('javascript:')) {
    svg.removeAttribute('href')
    svg.removeAttribute('xlink:href')
  }

  svg.querySelectorAll('*').forEach((el) => {
    dangerousAttrs.forEach((attr) => el.removeAttribute(attr))
    const href = el.getAttribute('href') ?? el.getAttribute('xlink:href')
    if (href && href.toLowerCase().startsWith('javascript:')) {
      el.removeAttribute('href')
      el.removeAttribute('xlink:href')
    }
  })

  return svg.outerHTML
}

// =============================================================================
// Timeline Class
// =============================================================================

/**
 * タイムラインコンポーネント
 */
export class Timeline {
  private config: TimelineConfig
  private container: HTMLElement
  private callbacks: TimelineCallbacks
  private state: TimelineState
  private itemClickElements: Array<{ element: HTMLElement; handler: (event: MouseEvent) => void }> = []

  constructor(
    container: HTMLElement,
    config: TimelineConfig,
    callbacks: TimelineCallbacks = {}
  ) {
    this.container = container
    this.config = config
    this.callbacks = callbacks
    this.state = this.createInitialState()
  }

  // ===========================================================================
  // Public Methods
  // ===========================================================================

  /**
   * タイムラインをレンダリング
   */
  render(): void {
    this.cleanup()
    clearElement(this.container)

    this.container.className = 'mokkun-timeline'
    this.container.setAttribute('role', 'list')
    this.container.setAttribute('aria-label', 'タイムライン')

    const list = createElement('ol', {
      className: 'timeline-list',
    })

    this.config.items.forEach((item, index) => {
      const itemEl = this.renderItem(item, index)
      list.appendChild(itemEl)
    })

    this.container.appendChild(list)
  }

  /**
   * アイテムを追加
   */
  addItem(item: TimelineItemConfig): void {
    this.config = {
      ...this.config,
      items: [...this.config.items, item],
    }
    this.state = this.createInitialState()
    this.render()
  }

  /**
   * アイテムを削除
   */
  removeItem(index: number): void {
    if (index < 0 || index >= this.config.items.length) {
      return
    }

    this.config = {
      ...this.config,
      items: this.config.items.filter((_, i) => i !== index),
    }
    this.state = this.createInitialState()
    this.render()
  }

  /**
   * アイテムを更新
   */
  updateItem(index: number, item: Partial<TimelineItemConfig>): void {
    if (index < 0 || index >= this.config.items.length) {
      return
    }

    this.config = {
      ...this.config,
      items: this.config.items.map((existingItem, i) =>
        i === index ? { ...existingItem, ...item } : existingItem
      ),
    }
    this.state = this.createInitialState()
    this.render()
  }

  /**
   * 現在の状態を取得
   */
  getState(): Readonly<TimelineState> {
    return { ...this.state }
  }

  /**
   * アイテム数を取得
   */
  getItemCount(): number {
    return this.config.items.length
  }

  /**
   * コンポーネントを破棄
   */
  destroy(): void {
    this.cleanup()
    clearElement(this.container)
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  /**
   * 初期状態を作成
   */
  private createInitialState(): TimelineState {
    const currentIndex = this.config.items.findIndex((item) => item.current)
    return {
      itemCount: this.config.items.length,
      currentIndex,
    }
  }

  /**
   * イベントハンドラーをクリーンアップ
   */
  private cleanup(): void {
    this.itemClickElements.forEach(({ element, handler }) => {
      element.removeEventListener('click', handler)
    })
    this.itemClickElements = []
  }

  /**
   * アイテムをレンダリング
   */
  private renderItem(item: TimelineItemConfig, index: number): HTMLElement {
    const isFirst = index === 0
    const isLast = index === this.config.items.length - 1
    const isCurrent = item.current ?? false

    const li = createElement('li', {
      className: [
        'timeline-item',
        isCurrent ? 'is-current' : '',
        isFirst ? 'is-first' : '',
        isLast ? 'is-last' : '',
      ].filter(Boolean).join(' '),
    })
    li.setAttribute('role', 'listitem')

    // マーカーエリア（アイコン + 接続線）
    const markerArea = this.renderMarkerArea(item, isLast)
    li.appendChild(markerArea)

    // コンテンツエリア
    const contentArea = this.renderContentArea(item, index)
    li.appendChild(contentArea)

    return li
  }

  /**
   * マーカーエリアをレンダリング
   */
  private renderMarkerArea(item: TimelineItemConfig, isLast: boolean): HTMLElement {
    const markerArea = createElement('div', {
      className: 'timeline-marker-area',
    })

    // アイコン
    const iconWrapper = createElement('span', {
      className: [
        'timeline-icon',
        item.current ? 'is-current' : '',
      ].filter(Boolean).join(' '),
    })
    iconWrapper.setAttribute('aria-hidden', 'true')

    if (item.iconColor) {
      iconWrapper.style.color = item.iconColor
    }

    const iconHtml = this.getIconHtml(item.icon)
    if (iconHtml) {
      iconWrapper.innerHTML = iconHtml
    }

    markerArea.appendChild(iconWrapper)

    // 接続線（最後のアイテム以外）
    if (!isLast) {
      const line = createElement('span', {
        className: 'timeline-line',
      })
      markerArea.appendChild(line)
    }

    return markerArea
  }

  /**
   * コンテンツエリアをレンダリング
   */
  private renderContentArea(item: TimelineItemConfig, index: number): HTMLElement {
    const contentArea = createElement('div', {
      className: 'timeline-content-area',
    })

    // ヘッダー（日時 + サイドアクション）
    const header = this.renderHeader(item)
    contentArea.appendChild(header)

    // タイトル
    if (item.title) {
      const title = createElement('div', {
        className: [
          'timeline-title',
          item.current ? 'is-current' : '',
        ].filter(Boolean).join(' '),
        textContent: item.title,
      })
      contentArea.appendChild(title)
    }

    // コンテンツ
    const content = createElement('div', {
      className: 'timeline-content',
    })
    content.innerHTML = sanitizeHtml(item.content)
    contentArea.appendChild(content)

    // クリックハンドラー
    if (this.callbacks.onItemClick) {
      contentArea.classList.add('is-clickable')
      const handler = (event: MouseEvent) => {
        this.callbacks.onItemClick?.(index, event)
      }
      this.itemClickElements.push({ element: contentArea, handler })
      contentArea.addEventListener('click', handler)
    }

    return contentArea
  }

  /**
   * ヘッダーをレンダリング
   */
  private renderHeader(item: TimelineItemConfig): HTMLElement {
    const header = createElement('div', {
      className: 'timeline-header',
    })

    // 日時エリア
    const dateArea = createElement('div', {
      className: 'timeline-date-area',
    })

    // 日付
    const date = toDate(item.datetime)
    const dateLabel = item.dateLabel ?? formatDate(date)
    const dateEl = createElement('time', {
      className: [
        'timeline-date',
        item.current ? 'is-current' : '',
      ].filter(Boolean).join(' '),
      textContent: dateLabel,
    })
    dateEl.setAttribute('datetime', date.toISOString())
    dateArea.appendChild(dateEl)

    // 時間
    const timeFormat = item.timeFormat ?? 'HH:mm'
    if (timeFormat !== 'none') {
      const timeStr = formatTime(date, timeFormat)
      if (timeStr) {
        const timeEl = createElement('span', {
          className: 'timeline-time',
          textContent: timeStr,
        })
        dateArea.appendChild(timeEl)
      }
    }

    // 日付サフィックスエリア
    if (item.dateSuffixArea) {
      const suffixEl = createElement('span', {
        className: 'timeline-date-suffix',
      })
      suffixEl.innerHTML = sanitizeHtml(item.dateSuffixArea)
      dateArea.appendChild(suffixEl)
    }

    header.appendChild(dateArea)

    // サイドアクションエリア
    if (item.sideActionArea) {
      const sideActionEl = createElement('div', {
        className: 'timeline-side-action',
      })
      sideActionEl.innerHTML = sanitizeHtml(item.sideActionArea)
      header.appendChild(sideActionEl)
    }

    return header
  }

  /**
   * アイコンHTMLを取得
   */
  private getIconHtml(icon?: TimelineIconType | string): string {
    if (!icon) {
      return BUILTIN_ICONS.dot
    }

    const builtinIcon = BUILTIN_ICONS[icon as TimelineIconType]
    if (builtinIcon) {
      return builtinIcon
    }

    const sanitized = sanitizeSvgIcon(icon)
    return sanitized ?? BUILTIN_ICONS.dot
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * タイムラインを作成
 */
export function createTimeline(
  container: HTMLElement,
  config: TimelineConfig,
  callbacks: TimelineCallbacks = {}
): Timeline {
  const timeline = new Timeline(container, config, callbacks)
  timeline.render()
  return timeline
}

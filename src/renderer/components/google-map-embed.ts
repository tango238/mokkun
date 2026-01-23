/**
 * Google Map Embed Component
 * Googleマップ埋め込みコンポーネント
 */

import type { GoogleMapEmbedField } from '../../types/schema'
import { createElement } from '../utils/dom'

/**
 * 許可するGoogle TLD（セキュリティのため明示的なホワイトリスト）
 */
const GOOGLE_TLDS =
  'com|co\\.uk|co\\.jp|co\\.kr|co\\.in|co\\.id|co\\.nz|co\\.th|co\\.za|com\\.au|com\\.br|com\\.mx|com\\.ar|de|fr|it|es|nl|pl|ru|ca'

/**
 * Google Maps URL パターン（HTTPS のみ許可）
 *
 * Note: Application should include appropriate CSP frame-src directive:
 * frame-src https://www.google.com https://maps.google.com;
 */
const GOOGLE_MAPS_URL_PATTERNS = [
  // https://www.google.com/maps/place/...
  new RegExp(`^https:\\/\\/(www\\.)?google\\.(${GOOGLE_TLDS})\\/maps\\/.+`, 'i'),
  // https://maps.google.com/...
  new RegExp(`^https:\\/\\/maps\\.google\\.(${GOOGLE_TLDS})\\/.+`, 'i'),
  // https://goo.gl/maps/...
  /^https:\/\/goo\.gl\/maps\/.+/i,
  // https://maps.app.goo.gl/...
  /^https:\/\/maps\.app\.goo\.gl\/.+/i,
]

/**
 * 許可されたホスト名のリスト
 */
const ALLOWED_HOSTS_PATTERNS = [
  /^(www\.)?google\.(com|co\.\w{2,3}|com\.\w{2,3}|\w{2,3})$/i,
  /^maps\.google\.(com|co\.\w{2,3}|com\.\w{2,3}|\w{2,3})$/i,
  /^goo\.gl$/i,
  /^maps\.app\.goo\.gl$/i,
]

/**
 * URL の長さ制限
 */
const MAX_URL_LENGTH = 2048

/**
 * 座標抽出パターン
 */
const COORD_PATTERNS = [
  // @lat,lng,zoom
  /@(-?\d+\.?\d*),(-?\d+\.?\d*),(\d+\.?\d*)z/,
  // ?ll=lat,lng
  /[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
  // place/name/@lat,lng
  /place\/[^@]+\/@(-?\d+\.?\d*),(-?\d+\.?\d*)/,
]

/**
 * Place ID 抽出パターン
 */
const PLACE_ID_PATTERN = /place_id[:=]([A-Za-z0-9_-]+)/

/**
 * 検索クエリ抽出パターン
 */
const QUERY_PATTERNS = [
  // /search/query/
  /\/search\/([^/@]+)/,
  // ?q=query
  /[?&]q=([^&]+)/,
  // place/name/
  /\/place\/([^/@]+)/,
]

export interface GoogleMapEmbedState {
  url: string
  isValid: boolean
  embedUrl: string | null
  errorMessage: string | null
  coordinates: { lat: number; lng: number } | null
  query: string | null
}

export interface GoogleMapEmbedCallbacks {
  onChange?: (state: GoogleMapEmbedState) => void
}

/**
 * ホスト名が許可されているか確認
 */
function isAllowedHost(hostname: string): boolean {
  return ALLOWED_HOSTS_PATTERNS.some((pattern) => pattern.test(hostname))
}

/**
 * Google Maps URL をバリデート
 */
export function isValidGoogleMapsUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false
  }

  const trimmedUrl = url.trim()

  // URL の長さチェック
  if (trimmedUrl.length > MAX_URL_LENGTH) {
    return false
  }

  // パターンマッチ
  if (!GOOGLE_MAPS_URL_PATTERNS.some((pattern) => pattern.test(trimmedUrl))) {
    return false
  }

  // ホスト名の二重チェック
  try {
    const urlObj = new URL(trimmedUrl)

    // HTTPS のみ許可
    if (urlObj.protocol !== 'https:') {
      return false
    }

    // ホスト名の検証
    if (!isAllowedHost(urlObj.hostname)) {
      return false
    }

    return true
  } catch {
    return false
  }
}

/**
 * 座標が有効な範囲内か確認
 */
function isValidCoordinate(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
}

/**
 * URL から座標を抽出
 */
export function extractCoordinates(
  url: string
): { lat: number; lng: number } | null {
  for (const pattern of COORD_PATTERNS) {
    const match = url.match(pattern)
    if (match) {
      const lat = parseFloat(match[1])
      const lng = parseFloat(match[2])
      if (!isNaN(lat) && !isNaN(lng) && isValidCoordinate(lat, lng)) {
        return { lat, lng }
      }
    }
  }
  return null
}

/**
 * URL から検索クエリを抽出
 */
export function extractQuery(url: string): string | null {
  for (const pattern of QUERY_PATTERNS) {
    const match = url.match(pattern)
    if (match && match[1]) {
      try {
        return decodeURIComponent(match[1].replace(/\+/g, ' '))
      } catch {
        return match[1]
      }
    }
  }
  return null
}

/**
 * URL から Place ID を抽出
 */
export function extractPlaceId(url: string): string | null {
  const match = url.match(PLACE_ID_PATTERN)
  return match ? match[1] : null
}

/**
 * Place ID の形式を検証
 */
function isValidPlaceId(placeId: string): boolean {
  // Place ID は英数字、ダッシュ、アンダースコアのみ
  return /^[A-Za-z0-9_-]+$/.test(placeId) && placeId.length <= 200
}

/**
 * ズーム値をサニタイズ
 */
function sanitizeZoom(zoom: number): number {
  const z = Math.floor(zoom)
  return Math.max(1, Math.min(21, z))
}

/**
 * Google Maps 埋め込み URL を生成
 */
export function generateEmbedUrl(
  url: string,
  zoom: number = 15
): string | null {
  if (!isValidGoogleMapsUrl(url)) {
    return null
  }

  const safeZoom = sanitizeZoom(zoom)
  const coordinates = extractCoordinates(url)
  const query = extractQuery(url)
  const placeId = extractPlaceId(url)

  // Place ID がある場合
  if (placeId && isValidPlaceId(placeId)) {
    return `https://www.google.com/maps/embed/v1/place?key=&q=place_id:${encodeURIComponent(placeId)}`
  }

  // 座標がある場合
  if (coordinates) {
    const { lat, lng } = coordinates
    // 座標を固定小数点でフォーマット
    return `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}&z=${safeZoom}&output=embed`
  }

  // 検索クエリがある場合
  if (query) {
    const encodedQuery = encodeURIComponent(query)
    return `https://www.google.com/maps?q=${encodedQuery}&z=${safeZoom}&output=embed`
  }

  // どれにも該当しない場合は元のURLをiframe用に変換
  try {
    const urlObj = new URL(url)

    // ホスト名を再度検証
    if (!isAllowedHost(urlObj.hostname)) {
      return null
    }

    urlObj.searchParams.set('output', 'embed')
    return urlObj.toString()
  } catch {
    return null
  }
}

/**
 * Google Maps 埋め込みコンポーネント
 */
export class GoogleMapEmbed {
  private field: GoogleMapEmbedField
  private container: HTMLElement
  private callbacks: GoogleMapEmbedCallbacks
  private state: GoogleMapEmbedState

  private inputElement: HTMLInputElement | null = null
  private previewContainer: HTMLElement | null = null
  private errorElement: HTMLElement | null = null

  constructor(
    field: GoogleMapEmbedField,
    container: HTMLElement,
    callbacks: GoogleMapEmbedCallbacks = {},
    initialValue?: string
  ) {
    this.field = field
    this.container = container
    this.callbacks = callbacks
    this.state = this.createInitialState(initialValue)
  }

  private createInitialState(initialValue?: string): GoogleMapEmbedState {
    if (initialValue && isValidGoogleMapsUrl(initialValue)) {
      return {
        url: initialValue,
        isValid: true,
        embedUrl: generateEmbedUrl(initialValue, this.field.zoom),
        errorMessage: null,
        coordinates: extractCoordinates(initialValue),
        query: extractQuery(initialValue),
      }
    }

    return {
      url: initialValue ?? '',
      isValid: !initialValue,
      embedUrl: null,
      errorMessage: initialValue ? 'Invalid Google Maps URL' : null,
      coordinates: null,
      query: null,
    }
  }

  /**
   * コンポーネントをレンダリング
   */
  render(): void {
    this.container.innerHTML = ''
    this.container.className = 'google-map-embed-container'

    // URL 入力フィールド
    const inputWrapper = this.createInputField()
    this.container.appendChild(inputWrapper)

    // エラーメッセージ
    this.errorElement = createElement('div', {
      className: 'google-map-embed-error',
    })
    this.updateErrorDisplay()
    this.container.appendChild(this.errorElement)

    // プレビューコンテナ
    this.previewContainer = createElement('div', {
      className: 'google-map-embed-preview',
    })
    this.updatePreview()
    this.container.appendChild(this.previewContainer)

    // 「Googleマップで開く」リンク
    if (this.field.show_open_link !== false) {
      const linkContainer = this.createOpenLink()
      this.container.appendChild(linkContainer)
    }
  }

  private createInputField(): HTMLElement {
    const wrapper = createElement('div', {
      className: 'google-map-embed-input-wrapper',
    })

    this.inputElement = createElement('input', {
      className: 'google-map-embed-input field-input',
      attributes: {
        type: 'text',
        inputmode: 'url',
        id: this.field.id,
        name: this.field.id,
        placeholder:
          this.field.placeholder ?? 'Google Maps URL を入力してください',
        maxlength: String(MAX_URL_LENGTH),
      },
    })

    if (this.state.url) {
      this.inputElement.value = this.state.url
    }
    if (this.field.required) {
      this.inputElement.required = true
    }
    if (this.field.disabled) {
      this.inputElement.disabled = true
    }
    if (this.field.readonly) {
      this.inputElement.readOnly = true
    }

    this.inputElement.addEventListener('input', this.handleInput.bind(this))
    this.inputElement.addEventListener('blur', this.handleBlur.bind(this))
    this.inputElement.addEventListener('paste', this.handlePaste.bind(this))

    wrapper.appendChild(this.inputElement)

    return wrapper
  }

  private createOpenLink(): HTMLElement {
    const container = createElement('div', {
      className: 'google-map-embed-link-container',
    })

    const link = createElement('a', {
      className: 'google-map-embed-open-link',
      attributes: {
        href: this.state.url || '#',
        target: '_blank',
        rel: 'noopener noreferrer',
      },
      textContent: 'Googleマップで開く',
    })

    if (!this.state.isValid || !this.state.url) {
      link.classList.add('disabled')
      link.setAttribute('aria-disabled', 'true')
      link.onclick = (e) => e.preventDefault()
    }

    container.appendChild(link)
    return container
  }

  private handleInput(event: Event): void {
    const target = event.target as HTMLInputElement
    this.updateState(target.value)
  }

  private handleBlur(): void {
    if (this.inputElement) {
      this.updateState(this.inputElement.value.trim())
    }
  }

  private handlePaste(event: ClipboardEvent): void {
    event.preventDefault()
    const pastedText = event.clipboardData?.getData('text') ?? ''
    if (this.inputElement) {
      this.inputElement.value = pastedText.trim()
      this.updateState(pastedText.trim())
    }
  }

  private updateState(url: string): void {
    const trimmedUrl = url.trim()
    const isValid = !trimmedUrl || isValidGoogleMapsUrl(trimmedUrl)

    this.state = {
      url: trimmedUrl,
      isValid,
      embedUrl: isValid ? generateEmbedUrl(trimmedUrl, this.field.zoom) : null,
      errorMessage:
        !isValid && trimmedUrl ? '有効なGoogle Maps URLを入力してください' : null,
      coordinates: isValid ? extractCoordinates(trimmedUrl) : null,
      query: isValid ? extractQuery(trimmedUrl) : null,
    }

    this.updateErrorDisplay()
    this.updatePreview()
    this.updateOpenLink()
    this.callbacks.onChange?.(this.state)
  }

  private updateErrorDisplay(): void {
    if (!this.errorElement) return

    if (this.state.errorMessage) {
      this.errorElement.textContent = this.state.errorMessage
      this.errorElement.classList.add('visible')
    } else {
      this.errorElement.textContent = ''
      this.errorElement.classList.remove('visible')
    }
  }

  private updatePreview(): void {
    if (!this.previewContainer) return

    this.previewContainer.innerHTML = ''

    if (!this.state.embedUrl) {
      const placeholder = createElement('div', {
        className: 'google-map-embed-placeholder',
        textContent: 'Google Maps URL を入力すると、ここにプレビューが表示されます',
      })
      this.previewContainer.appendChild(placeholder)
      return
    }

    const iframe = createElement('iframe', {
      className: 'google-map-embed-iframe',
      attributes: {
        src: this.state.embedUrl,
        width: this.field.width ?? '100%',
        height: this.field.height ?? '300',
        frameborder: '0',
        allowfullscreen: 'true',
        loading: 'lazy',
        referrerpolicy: 'no-referrer-when-downgrade',
        sandbox: 'allow-scripts allow-same-origin',
      },
    })

    this.previewContainer.appendChild(iframe)
  }

  private updateOpenLink(): void {
    const linkElement = this.container.querySelector(
      '.google-map-embed-open-link'
    ) as HTMLAnchorElement | null

    if (!linkElement) return

    if (this.state.isValid && this.state.url) {
      linkElement.href = this.state.url
      linkElement.classList.remove('disabled')
      linkElement.removeAttribute('aria-disabled')
      linkElement.onclick = null
    } else {
      linkElement.href = '#'
      linkElement.classList.add('disabled')
      linkElement.setAttribute('aria-disabled', 'true')
      linkElement.onclick = (e) => e.preventDefault()
    }
  }

  /**
   * 現在の状態を取得
   */
  getState(): GoogleMapEmbedState {
    return { ...this.state }
  }

  /**
   * URL を設定
   */
  setUrl(url: string): void {
    if (this.inputElement) {
      this.inputElement.value = url
    }
    this.updateState(url)
  }

  /**
   * コンポーネントを破棄
   */
  destroy(): void {
    if (this.inputElement) {
      this.inputElement.removeEventListener('input', this.handleInput)
      this.inputElement.removeEventListener('blur', this.handleBlur)
      this.inputElement.removeEventListener('paste', this.handlePaste as EventListener)
    }
    this.container.innerHTML = ''
  }
}

/**
 * Googleマップ埋め込みフィールドをレンダリング
 */
export function renderGoogleMapEmbedField(
  field: GoogleMapEmbedField,
  container: HTMLElement,
  options: {
    value?: string
    onChange?: (fieldId: string, value: unknown) => void
  } = {}
): GoogleMapEmbed {
  const googleMapEmbed = new GoogleMapEmbed(
    field,
    container,
    {
      onChange: (state) => {
        options.onChange?.(field.id, state.url)
      },
    },
    options.value
  )

  googleMapEmbed.render()
  return googleMapEmbed
}

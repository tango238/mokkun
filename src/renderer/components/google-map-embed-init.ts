/**
 * Google Map Embed Initialization
 * HTMLレンダリング後にGoogle Maps埋め込みコンポーネントを初期化
 */

import {
  isValidGoogleMapsUrl,
  generateEmbedUrl,
} from './google-map-embed'

/**
 * ページ上のすべてのGoogle Maps埋め込みフィールドを初期化
 */
export function initializeGoogleMapEmbedFields(): void {
  const containers = document.querySelectorAll<HTMLElement>('.google-map-embed-container')

  containers.forEach((container) => {
    initializeGoogleMapEmbedField(container)
  })
}

/**
 * 個別のGoogle Maps埋め込みフィールドを初期化
 */
function initializeGoogleMapEmbedField(container: HTMLElement): void {
  const input = container.querySelector<HTMLInputElement>('.google-map-embed-input')
  const errorElement = container.querySelector<HTMLElement>('.google-map-embed-error')
  const previewContainer = container.querySelector<HTMLElement>('.google-map-embed-preview')
  const openLink = container.querySelector<HTMLAnchorElement>('.google-map-embed-open-link')

  if (!input || !previewContainer) return

  // 初期値があれば処理
  if (input.value) {
    updateGoogleMapEmbed(input.value, previewContainer, errorElement, openLink)
  }

  // イベントリスナーを設定
  input.addEventListener('input', () => {
    updateGoogleMapEmbed(input.value, previewContainer, errorElement, openLink)
  })

  input.addEventListener('blur', () => {
    input.value = input.value.trim()
    updateGoogleMapEmbed(input.value, previewContainer, errorElement, openLink)
  })

  input.addEventListener('paste', (event) => {
    event.preventDefault()
    const pastedText = event.clipboardData?.getData('text') ?? ''
    input.value = pastedText.trim()
    updateGoogleMapEmbed(input.value, previewContainer, errorElement, openLink)
  })
}

/**
 * Google Maps埋め込みを更新
 */
function updateGoogleMapEmbed(
  url: string,
  previewContainer: HTMLElement,
  errorElement: HTMLElement | null,
  openLink: HTMLAnchorElement | null
): void {
  const trimmedUrl = url.trim()

  // 空の場合はプレースホルダーを表示
  if (!trimmedUrl) {
    showPlaceholder(previewContainer)
    hideError(errorElement)
    disableOpenLink(openLink)
    return
  }

  // URL検証
  if (!isValidGoogleMapsUrl(trimmedUrl)) {
    showError(errorElement, '有効なGoogle Maps URLを入力してください')
    showPlaceholder(previewContainer)
    disableOpenLink(openLink)
    return
  }

  // 埋め込みURL生成
  const height = previewContainer.dataset.height ?? '300'
  const width = previewContainer.dataset.width ?? '100%'
  const embedUrl = generateEmbedUrl(trimmedUrl)

  if (!embedUrl) {
    showError(errorElement, '埋め込みURLの生成に失敗しました')
    showPlaceholder(previewContainer)
    disableOpenLink(openLink)
    return
  }

  // プレビューを表示
  hideError(errorElement)
  showPreview(previewContainer, embedUrl, width, height)
  enableOpenLink(openLink, trimmedUrl)
}

/**
 * プレースホルダーを表示
 */
function showPlaceholder(container: HTMLElement): void {
  container.innerHTML = `
    <div class="google-map-embed-placeholder">
      Google Maps URL を入力すると、ここにプレビューが表示されます
    </div>
  `
}

/**
 * プレビューを表示
 */
function showPreview(
  container: HTMLElement,
  embedUrl: string,
  width: string,
  height: string
): void {
  container.innerHTML = `
    <iframe
      class="google-map-embed-iframe"
      src="${escapeAttr(embedUrl)}"
      width="${escapeAttr(width)}"
      height="${escapeAttr(height)}"
      frameborder="0"
      allowfullscreen="true"
      loading="lazy"
      referrerpolicy="no-referrer-when-downgrade"
      sandbox="allow-scripts allow-same-origin"
    ></iframe>
  `
}

/**
 * エラーを表示
 */
function showError(element: HTMLElement | null, message: string): void {
  if (!element) return
  element.textContent = message
  element.classList.add('visible')
}

/**
 * エラーを非表示
 */
function hideError(element: HTMLElement | null): void {
  if (!element) return
  element.textContent = ''
  element.classList.remove('visible')
}

/**
 * 「Googleマップで開く」リンクを有効化
 */
function enableOpenLink(link: HTMLAnchorElement | null, url: string): void {
  if (!link) return
  link.href = url
  link.classList.remove('disabled')
  link.removeAttribute('aria-disabled')
  link.onclick = null
}

/**
 * 「Googleマップで開く」リンクを無効化
 */
function disableOpenLink(link: HTMLAnchorElement | null): void {
  if (!link) return
  link.href = '#'
  link.classList.add('disabled')
  link.setAttribute('aria-disabled', 'true')
  link.onclick = (e) => e.preventDefault()
}

/**
 * HTML属性値をエスケープ
 */
function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

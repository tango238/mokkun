/**
 * DOM Utilities
 * DOM操作のユーティリティ関数
 */

/**
 * 要素を作成する
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options?: {
    className?: string
    attributes?: Record<string, string>
    textContent?: string
    children?: (HTMLElement | string)[]
  }
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag)

  if (options?.className) {
    element.className = options.className
  }

  if (options?.attributes) {
    for (const [key, value] of Object.entries(options.attributes)) {
      element.setAttribute(key, value)
    }
  }

  if (options?.textContent) {
    element.textContent = options.textContent
  }

  if (options?.children) {
    for (const child of options.children) {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child))
      } else {
        element.appendChild(child)
      }
    }
  }

  return element
}

/**
 * 要素をクリアする
 */
export function clearElement(element: HTMLElement): void {
  while (element.firstChild) {
    element.removeChild(element.firstChild)
  }
}

/**
 * 一意なIDを生成する
 */
export function generateId(prefix: string = 'mokkun'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * HTMLテキストをエスケープする
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * タブIDを検証・サニタイズする
 */
export function sanitizeTabId(id: string): string {
  // 英数字、ハイフン、アンダースコアのみ許可
  return id.replace(/[^a-zA-Z0-9_-]/g, '')
}

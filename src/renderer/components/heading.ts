/**
 * Heading Component
 * 見出しコンポーネント
 *
 * 
 * - セマンティックレベル（h1-h6）と視覚的サイズの分離
 * - アクセシビリティを考慮した構造
 * - カラーバリエーション対応
 * - テキスト配置オプション
 */

import { createElement, generateId } from '../utils/dom'
import { escapeHtml, getDefaultSizeForLevel } from '../utils/field-helpers'
import type { HeadingField } from '../../types/schema'

// =============================================================================
// Types
// =============================================================================

/**
 * 見出しの状態
 */
export interface HeadingState {
  /** 見出しレベル */
  level: 1 | 2 | 3 | 4 | 5 | 6
  /** 見出しテキスト */
  text: string
  /** サイズバリアント */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  /** テキスト配置 */
  align?: 'left' | 'center' | 'right'
  /** カラーバリエーション */
  color?: 'default' | 'primary' | 'secondary' | 'muted' | 'danger' | 'success' | 'warning'
  /** アイコン */
  icon?: string
}

/**
 * 見出しのコールバック（拡張用）
 */
export interface HeadingCallbacks {
  /** クリック時（インタラクティブな見出しの場合） */
  onClick?: (state: HeadingState) => void
}

/**
 * 見出しの設定
 */
export interface HeadingConfig {
  /** 見出しレベル（h1-h6） */
  level: 1 | 2 | 3 | 4 | 5 | 6
  /** 見出しテキスト */
  text: string
  /** サイズバリアント（デフォルト: levelに基づく） */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  /** テキスト配置（デフォルト: left） */
  align?: 'left' | 'center' | 'right'
  /** カラーバリエーション（デフォルト: default） */
  color?: 'default' | 'primary' | 'secondary' | 'muted' | 'danger' | 'success' | 'warning'
  /** アイコン（オプション） */
  icon?: string
  /** ID属性 */
  id?: string
  /** カスタムCSSクラス */
  className?: string
}

// =============================================================================
// Heading Class
// =============================================================================

/**
 * 見出しコンポーネント
 */
export class Heading {
  private config: HeadingConfig
  private state: HeadingState
  private callbacks: HeadingCallbacks
  private container: HTMLElement
  private instanceId: string

  constructor(
    container: HTMLElement,
    config: HeadingConfig,
    callbacks: HeadingCallbacks = {}
  ) {
    this.config = config
    this.container = container
    this.callbacks = callbacks
    this.instanceId = config.id ?? generateId('heading')
    this.state = this.createInitialState()
  }

  // ===========================================================================
  // Public Methods
  // ===========================================================================

  /**
   * 見出しをレンダリング
   */
  render(): void {
    this.container.innerHTML = ''

    const level = this.state.level
    const size = this.state.size ?? this.getDefaultSizeForLevel(level)
    const align = this.state.align ?? 'left'
    const color = this.state.color ?? 'default'

    // コンテナに基本クラスとバリアントクラスを追加
    this.container.className = [
      'mokkun-heading',
      `heading-level-${level}`,
      `heading-size-${size}`,
      `heading-align-${align}`,
      `heading-color-${color}`,
      this.config.className ?? '',
    ]
      .filter(Boolean)
      .join(' ')

    // 見出し要素を作成
    const headingElement = this.createHeadingElement()
    this.container.appendChild(headingElement)
  }

  /**
   * 見出しテキストを更新
   */
  setText(text: string): void {
    this.state = {
      ...this.state,
      text,
    }
    this.render()
  }

  /**
   * 見出しレベルを更新
   */
  setLevel(level: 1 | 2 | 3 | 4 | 5 | 6): void {
    this.state = {
      ...this.state,
      level,
    }
    this.render()
  }

  /**
   * サイズバリアントを更新
   */
  setSize(size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'): void {
    this.state = {
      ...this.state,
      size,
    }
    this.render()
  }

  /**
   * テキスト配置を更新
   */
  setAlign(align: 'left' | 'center' | 'right'): void {
    this.state = {
      ...this.state,
      align,
    }
    this.render()
  }

  /**
   * カラーバリエーションを更新
   */
  setColor(
    color: 'default' | 'primary' | 'secondary' | 'muted' | 'danger' | 'success' | 'warning'
  ): void {
    this.state = {
      ...this.state,
      color,
    }
    this.render()
  }

  /**
   * 現在の状態を取得
   */
  getState(): HeadingState {
    return { ...this.state }
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  /**
   * 初期状態を作成
   */
  private createInitialState(): HeadingState {
    return {
      level: this.config.level,
      text: this.config.text,
      size: this.config.size,
      align: this.config.align,
      color: this.config.color,
      icon: this.config.icon,
    }
  }

  /**
   * 見出し要素を作成
   */
  private createHeadingElement(): HTMLElement {
    const tag = `h${this.state.level}` as keyof HTMLElementTagNameMap
    const headingElement = createElement(tag, {
      className: 'heading-element',
      attributes: {
        id: this.instanceId,
      },
    })

    // アイコンがある場合
    if (this.state.icon) {
      const iconSpan = createElement('span', {
        className: 'heading-icon',
        textContent: this.state.icon,
      })
      headingElement.appendChild(iconSpan)
    }

    // テキスト
    const textSpan = createElement('span', {
      className: 'heading-text',
      textContent: this.state.text,
    })
    headingElement.appendChild(textSpan)

    // クリックイベント（オプション）
    if (this.callbacks.onClick) {
      headingElement.style.cursor = 'pointer'
      headingElement.addEventListener('click', () => {
        this.callbacks.onClick?.(this.getState())
      })
    }

    return headingElement
  }

  /**
   * レベルに基づくデフォルトサイズを取得
   */
  private getDefaultSizeForLevel(level: 1 | 2 | 3 | 4 | 5 | 6): 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' {
    return getDefaultSizeForLevel(level)
  }

  // ===========================================================================
  // Static Field Renderer
  // ===========================================================================

  /**
   * 見出しフィールドをHTMLとしてレンダリング（静的メソッド）
   * SSR/初期レンダリング用
   *
   * @param field - 見出しフィールド定義
   * @returns 生成されたHTML文字列
   */
  static renderField(field: HeadingField): string {
    const size = field.size ?? getDefaultSizeForLevel(field.level)
    const align = field.align ?? 'left'
    const color = field.color ?? 'default'
    const tag = `h${field.level}`

    const classes = [
      'heading-field-container',
      `heading-level-${field.level}`,
      `heading-size-${size}`,
      `heading-align-${align}`,
      `heading-color-${color}`,
    ]

    if (field.class) {
      classes.push(field.class)
    }

    const iconHtml = field.icon ? `<span class="heading-icon">${escapeHtml(field.icon)}</span>` : ''

    // 見出しフィールドはラベルや説明が不要なため、直接コンテンツを返す
    return `
      <div class="${classes.join(' ')}" data-field-id="${escapeHtml(field.id)}">
        <${tag} class="heading-element" id="${escapeHtml(field.id)}">
          ${iconHtml}
          <span class="heading-text">${escapeHtml(field.text)}</span>
        </${tag}>
      </div>
    `
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * 見出しコンポーネントを作成
 */
export function createHeading(
  container: HTMLElement,
  config: HeadingConfig,
  callbacks?: HeadingCallbacks
): Heading {
  const heading = new Heading(container, config, callbacks)
  heading.render()
  return heading
}

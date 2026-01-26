/**
 * Textarea Component
 * 複数行テキスト入力コンポーネント
 *
 * 機能:
 * - 自動リサイズ
 * - 文字数カウント
 * - 最大文字数制限
 * - 行数指定
 * - バリデーション表示
 *
 * 参考: https://smarthr.design/products/components/textarea/
 */

import { createElement, generateId } from '../utils/dom'
import {
  escapeHtml,
  createFieldWrapper,
  getCommonAttributes,
} from '../utils/field-helpers'
import type { TextareaField } from '../../types/schema'

// =============================================================================
// Types
// =============================================================================

/**
 * Textareaの状態
 */
export interface TextareaState {
  /** 現在の値 */
  value: string
  /** 無効化状態 */
  disabled: boolean
  /** 読み取り専用状態 */
  readonly: boolean
  /** エラー状態 */
  error: boolean
  /** エラーメッセージ */
  errorMessage?: string
  /** 文字数 */
  characterCount: number
}

/**
 * Textareaのコールバック
 */
export interface TextareaCallbacks {
  /** 値変更時 */
  onChange?: (value: string, state: TextareaState) => void
  /** 入力時 */
  onInput?: (value: string, state: TextareaState) => void
  /** フォーカス時 */
  onFocus?: (state: TextareaState) => void
  /** ブラー時 */
  onBlur?: (state: TextareaState) => void
}

/**
 * Textareaの設定
 */
export interface TextareaConfig {
  /** 初期値 */
  defaultValue?: string
  /** プレースホルダー */
  placeholder?: string
  /** 行数 */
  rows?: number
  /** 最小文字数 */
  minLength?: number
  /** 最大文字数 */
  maxLength?: number
  /** 必須フィールド */
  required?: boolean
  /** 無効化 */
  disabled?: boolean
  /** 読み取り専用 */
  readonly?: boolean
  /** 自動リサイズ */
  autoResize?: boolean
  /** 文字数カウント表示 */
  showCount?: boolean
  /** リサイズ可能 */
  resizable?: boolean
  /** name属性（フォーム用） */
  name?: string
  /** ID */
  id?: string
  /** エラーメッセージ */
  errorMessage?: string
}

// =============================================================================
// Textarea Class
// =============================================================================

/**
 * Textareaコンポーネント
 */
export class Textarea {
  private config: TextareaConfig
  private state: TextareaState
  private callbacks: TextareaCallbacks
  private container: HTMLElement
  private textareaElement?: HTMLTextAreaElement
  private instanceId: string

  constructor(
    container: HTMLElement,
    config: TextareaConfig = {},
    callbacks: TextareaCallbacks = {}
  ) {
    this.config = config
    this.container = container
    this.callbacks = callbacks
    this.instanceId = config.id ?? generateId('textarea')
    this.state = this.createInitialState()
  }

  // ===========================================================================
  // Public Methods
  // ===========================================================================

  /**
   * Textareaをレンダリング
   */
  render(): void {
    this.container.innerHTML = ''

    const wrapper = createElement('div', {
      className: 'mokkun-textarea-wrapper',
    })

    // エラー状態のクラス
    if (this.state.error) {
      wrapper.classList.add('has-error')
    }
    if (this.state.disabled) {
      wrapper.classList.add('is-disabled')
    }
    if (this.state.readonly) {
      wrapper.classList.add('is-readonly')
    }

    // Textareaエレメント
    const textarea = this.renderTextarea()
    wrapper.appendChild(textarea)

    // 文字数カウント
    if (this.config.showCount) {
      const counter = this.renderCounter()
      wrapper.appendChild(counter)
    }

    // エラーメッセージ
    if (this.state.error && this.state.errorMessage) {
      const errorEl = this.renderError()
      wrapper.appendChild(errorEl)
    }

    this.container.appendChild(wrapper)
  }

  /**
   * 値を設定
   */
  setValue(value: string): void {
    if (this.state.value === value) {
      return
    }

    this.state = {
      ...this.state,
      value,
      characterCount: value.length,
    }

    if (this.textareaElement) {
      this.textareaElement.value = value
      if (this.config.autoResize) {
        this.adjustHeight()
      }
    }

    this.render()
    this.callbacks.onChange?.(value, this.state)
  }

  /**
   * 値を取得
   */
  getValue(): string {
    return this.state.value
  }

  /**
   * 無効化状態を設定
   */
  setDisabled(disabled: boolean): void {
    if (this.state.disabled === disabled) {
      return
    }

    this.state = {
      ...this.state,
      disabled,
    }

    this.render()
  }

  /**
   * 読み取り専用状態を設定
   */
  setReadonly(readonly: boolean): void {
    if (this.state.readonly === readonly) {
      return
    }

    this.state = {
      ...this.state,
      readonly,
    }

    this.render()
  }

  /**
   * エラー状態を設定
   */
  setError(error: boolean, errorMessage?: string): void {
    if (this.state.error === error && this.state.errorMessage === errorMessage) {
      return
    }

    this.state = {
      ...this.state,
      error,
      errorMessage,
    }

    this.render()
  }

  /**
   * クリア
   */
  clear(): void {
    this.setValue('')
  }

  /**
   * フォーカス
   */
  focus(): void {
    this.textareaElement?.focus()
  }

  /**
   * ブラー
   */
  blur(): void {
    this.textareaElement?.blur()
  }

  /**
   * バリデーション実行
   */
  validate(): boolean {
    const value = this.state.value

    // 必須チェック
    if (this.config.required && !value.trim()) {
      this.setError(true, 'この項目は必須です')
      return false
    }

    // 最小文字数チェック
    if (this.config.minLength !== undefined && value.length < this.config.minLength) {
      this.setError(true, `${this.config.minLength}文字以上入力してください`)
      return false
    }

    // 最大文字数チェック
    if (this.config.maxLength !== undefined && value.length > this.config.maxLength) {
      this.setError(true, `${this.config.maxLength}文字以内で入力してください`)
      return false
    }

    this.setError(false)
    return true
  }

  /**
   * 現在の状態を取得
   */
  getState(): TextareaState {
    return { ...this.state }
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  /**
   * 初期状態を作成
   */
  private createInitialState(): TextareaState {
    const value = this.config.defaultValue ?? ''
    return {
      value,
      disabled: this.config.disabled ?? false,
      readonly: this.config.readonly ?? false,
      error: false,
      errorMessage: this.config.errorMessage,
      characterCount: value.length,
    }
  }

  /**
   * Textareaエレメントをレンダリング
   */
  private renderTextarea(): HTMLTextAreaElement {
    const rows = this.config.rows ?? 3
    const resizableClass = this.config.resizable === false ? 'no-resize' : ''

    const textarea = createElement('textarea', {
      className: `mokkun-textarea ${resizableClass}`,
      attributes: {
        id: this.instanceId,
        rows: String(rows),
        'aria-label': 'Textarea',
      },
    }) as HTMLTextAreaElement

    if (this.config.name) {
      textarea.setAttribute('name', this.config.name)
    }

    if (this.config.placeholder) {
      textarea.setAttribute('placeholder', this.config.placeholder)
    }

    if (this.config.minLength !== undefined) {
      textarea.setAttribute('minlength', String(this.config.minLength))
    }

    if (this.config.maxLength !== undefined) {
      textarea.setAttribute('maxlength', String(this.config.maxLength))
    }

    if (this.config.required) {
      textarea.setAttribute('required', 'required')
      textarea.setAttribute('aria-required', 'true')
    }

    if (this.state.disabled) {
      textarea.setAttribute('disabled', 'disabled')
      textarea.setAttribute('aria-disabled', 'true')
    }

    if (this.state.readonly) {
      textarea.setAttribute('readonly', 'readonly')
      textarea.setAttribute('aria-readonly', 'true')
    }

    if (this.state.error) {
      textarea.setAttribute('aria-invalid', 'true')
      if (this.state.errorMessage) {
        textarea.setAttribute('aria-describedby', `${this.instanceId}-error`)
      }
    }

    textarea.value = this.state.value

    // イベントリスナー
    textarea.addEventListener('input', (e) => {
      const target = e.target as HTMLTextAreaElement
      const value = target.value

      this.state = {
        ...this.state,
        value,
        characterCount: value.length,
      }

      if (this.config.autoResize) {
        this.adjustHeight()
      }

      if (this.config.showCount) {
        this.updateCounter()
      }

      this.callbacks.onInput?.(value, this.state)
    })

    textarea.addEventListener('change', (e) => {
      const target = e.target as HTMLTextAreaElement
      const value = target.value

      this.callbacks.onChange?.(value, this.state)
    })

    textarea.addEventListener('focus', () => {
      this.callbacks.onFocus?.(this.state)
    })

    textarea.addEventListener('blur', () => {
      this.callbacks.onBlur?.(this.state)
      this.validate()
    })

    this.textareaElement = textarea

    if (this.config.autoResize) {
      // 初期高さ調整
      setTimeout(() => this.adjustHeight(), 0)
    }

    return textarea
  }

  /**
   * 文字数カウンターをレンダリング
   */
  private renderCounter(): HTMLElement {
    const counter = createElement('div', {
      className: 'mokkun-textarea-counter',
      attributes: {
        id: `${this.instanceId}-counter`,
        'aria-live': 'polite',
      },
    })

    this.updateCounterContent(counter)

    return counter
  }

  /**
   * カウンターの内容を更新
   */
  private updateCounterContent(counter: HTMLElement): void {
    const { characterCount } = this.state
    const { maxLength } = this.config

    if (maxLength !== undefined) {
      counter.textContent = `${characterCount} / ${maxLength}`
      if (characterCount > maxLength) {
        counter.classList.add('over-limit')
      } else {
        counter.classList.remove('over-limit')
      }
    } else {
      counter.textContent = `${characterCount}文字`
    }
  }

  /**
   * カウンターを更新
   */
  private updateCounter(): void {
    const counter = this.container.querySelector(`#${this.instanceId}-counter`)
    if (counter instanceof HTMLElement) {
      this.updateCounterContent(counter)
    }
  }

  /**
   * エラーメッセージをレンダリング
   */
  private renderError(): HTMLElement {
    return createElement('div', {
      className: 'mokkun-textarea-error',
      textContent: this.state.errorMessage ?? '',
      attributes: {
        id: `${this.instanceId}-error`,
        role: 'alert',
        'aria-live': 'polite',
      },
    })
  }

  /**
   * 自動リサイズ - 高さ調整
   */
  private adjustHeight(): void {
    if (!this.textareaElement) {
      return
    }

    // 一時的にheightをautoにしてscrollHeightを取得
    this.textareaElement.style.height = 'auto'
    const scrollHeight = this.textareaElement.scrollHeight
    this.textareaElement.style.height = `${scrollHeight}px`
  }

  // ===========================================================================
  // Static Field Renderer
  // ===========================================================================

  /**
   * テキストエリアフィールドをHTMLとしてレンダリング（静的メソッド）
   * SSR/初期レンダリング用
   *
   * @param field - テキストエリアフィールド定義
   * @returns 生成されたHTML文字列
   */
  static renderField(field: TextareaField): string {
    const attrs: string[] = [getCommonAttributes(field)]

    if (field.rows) {
      attrs.push(`rows="${field.rows}"`)
    }
    if (field.min_length !== undefined) {
      attrs.push(`minlength="${field.min_length}"`)
    }
    if (field.max_length !== undefined) {
      attrs.push(`maxlength="${field.max_length}"`)
    }

    const resizeClass = field.resizable === false ? 'no-resize' : ''
    const defaultValue = field.default !== undefined ? escapeHtml(String(field.default)) : ''

    const textarea = `<textarea class="form-textarea ${resizeClass}" ${attrs.join(' ')}>${defaultValue}</textarea>`
    return createFieldWrapper(field, textarea)
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Textareaを作成するファクトリ関数
 */
export function createTextarea(
  container: HTMLElement,
  config: TextareaConfig = {},
  callbacks: TextareaCallbacks = {}
): Textarea {
  const textarea = new Textarea(container, config, callbacks)
  textarea.render()
  return textarea
}

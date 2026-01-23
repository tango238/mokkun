/**
 * Base Dialog Component
 * すべてのダイアログバリアントの基盤となるクラス
 *
 * 機能:
 * - オーバーレイ管理
 * - フォーカストラップ
 * - キーボードイベント処理（Escape, Tab）
 * - ARIA属性管理
 * - open/closeライフサイクル
 * - bodyスクロール防止
 * - フォーカス復元
 */

import { createElement, generateId } from '../../utils/dom'
import type {
  BaseDialogConfig,
  BaseDialogCallbacks,
  BaseDialogState,
} from './dialog-types'

// =============================================================================
// BaseDialog Class
// =============================================================================

/**
 * ベースダイアログコンポーネント
 * すべてのダイアログタイプの共通ロジックを提供
 */
export class BaseDialog {
  protected config: BaseDialogConfig
  protected callbacks: BaseDialogCallbacks
  protected state: BaseDialogState
  protected dialogElement: HTMLElement | null = null
  protected overlayElement: HTMLElement | null = null
  protected readonly dialogId: string
  private boundKeydownHandler: (e: KeyboardEvent) => void

  constructor(config: BaseDialogConfig = {}, callbacks: BaseDialogCallbacks = {}) {
    this.config = {
      size: 'M',
      closeOnOverlayClick: true,
      closeOnEscape: true,
      firstFocusTarget: 'first',
      contentPadding: 'normal',
      ...config,
    }
    this.callbacks = callbacks
    this.dialogId = generateId('dialog')
    this.state = {
      isOpen: false,
      previouslyFocusedElement: null,
    }
    this.boundKeydownHandler = this.handleKeydown.bind(this)

    // 外部制御の場合、初期状態がtrueなら開く
    if (config.isOpen) {
      // nextTick で open を呼ぶ（サブクラスのコンストラクタが完了した後）
      setTimeout(() => this.open(), 0)
    }
  }

  // ===========================================================================
  // Public Methods
  // ===========================================================================

  /**
   * ダイアログを開く
   */
  open(): void {
    if (this.state.isOpen) {
      return
    }

    this.state = {
      ...this.state,
      isOpen: true,
      previouslyFocusedElement: document.activeElement,
    }

    this.render()
    this.setupEventListeners()
    this.trapFocus()

    this.callbacks.onOpen?.()
  }

  /**
   * ダイアログを閉じる
   */
  close(): void {
    if (!this.state.isOpen) {
      return
    }

    this.removeEventListeners()
    this.destroy()

    // フォーカスを元の要素に戻す
    if (this.state.previouslyFocusedElement instanceof HTMLElement) {
      this.state.previouslyFocusedElement.focus()
    }

    this.state = {
      ...this.state,
      isOpen: false,
      previouslyFocusedElement: null,
    }

    this.callbacks.onClose?.()

    // アニメーション完了後のコールバック
    requestAnimationFrame(() => {
      this.callbacks.onAfterClose?.()
    })
  }

  /**
   * 設定を更新
   */
  updateConfig(config: Partial<BaseDialogConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    }

    if (this.state.isOpen) {
      this.render()
    }
  }

  /**
   * 現在の状態を取得
   */
  getState(): BaseDialogState {
    return { ...this.state }
  }

  /**
   * ダイアログ要素を取得（テスト用）
   */
  getDialogElement(): HTMLElement | null {
    return this.dialogElement
  }

  /**
   * オーバーレイ要素を取得（テスト用）
   */
  getOverlayElement(): HTMLElement | null {
    return this.overlayElement
  }

  // ===========================================================================
  // Protected Methods - 継承クラスでオーバーライド可能
  // ===========================================================================

  /**
   * ダイアログをレンダリング
   * 継承クラスでオーバーライドして独自のコンテンツを追加
   */
  protected render(): void {
    this.destroy()

    // オーバーレイ
    this.overlayElement = this.createOverlay()

    // ダイアログコンテナ
    this.dialogElement = this.createDialogContainer()

    // ダイアログコンテンツを構築（継承クラスでオーバーライド）
    const content = this.renderContent()
    if (content) {
      this.dialogElement.appendChild(content)
    }

    // DOMに追加
    document.body.appendChild(this.overlayElement)
    document.body.appendChild(this.dialogElement)

    // bodyのスクロールを防止
    document.body.classList.add('dialog-open')
  }

  /**
   * ダイアログのコンテンツをレンダリング
   * 継承クラスで必ずオーバーライドすること
   */
  protected renderContent(): HTMLElement | null {
    // デフォルト実装：何もレンダリングしない
    return null
  }

  /**
   * ダイアログのクラス名を取得
   * 継承クラスでオーバーライドしてタイプ固有のクラスを追加
   */
  protected getDialogClassName(): string {
    const baseClass = 'dialog-base'
    const customClass = this.config.className ?? ''
    return `${baseClass} ${customClass}`.trim()
  }

  /**
   * ダイアログのARIA role を取得
   * 継承クラスでオーバーライド可能（例: ActionDialog → alertdialog）
   */
  protected getAriaRole(): string {
    return 'dialog'
  }

  /**
   * 初期フォーカス要素を取得
   * 継承クラスでオーバーライドして特定の要素を返すことができる
   */
  protected getFirstFocusElement(): HTMLElement | null {
    const focusableElements = this.getFocusableElements()
    if (focusableElements.length === 0) {
      return null
    }

    switch (this.config.firstFocusTarget) {
      case 'first':
        return focusableElements[0]
      case 'confirm':
        // data-action="confirm" を持つボタンを探す
        return (
          this.dialogElement?.querySelector<HTMLElement>(
            'button[data-action="confirm"]'
          ) ?? focusableElements[0]
        )
      case 'cancel':
        // data-action="cancel" を持つボタンを探す
        return (
          this.dialogElement?.querySelector<HTMLElement>(
            'button[data-action="cancel"]'
          ) ?? focusableElements[0]
        )
      default:
        return focusableElements[0]
    }
  }

  // ===========================================================================
  // Private Methods - Rendering
  // ===========================================================================

  /**
   * オーバーレイを作成
   */
  private createOverlay(): HTMLElement {
    return createElement('div', {
      className: 'dialog-overlay',
      attributes: {
        'data-dialog-overlay': this.dialogId,
      },
    })
  }

  /**
   * ダイアログコンテナを作成
   */
  private createDialogContainer(): HTMLElement {
    const className = this.getDialogClassName()
    const ariaLabel = this.config.ariaLabel
    const ariaLabelledby = this.config.ariaLabelledby
    const ariaDescribedby = this.config.ariaDescribedby

    const attributes: Record<string, string> = {
      'role': this.getAriaRole(),
      'aria-modal': 'true',
      'data-dialog-id': this.dialogId,
      'data-size': this.config.size ?? 'M',
    }

    if (ariaLabel) {
      attributes['aria-label'] = ariaLabel
    }
    if (ariaLabelledby) {
      attributes['aria-labelledby'] = ariaLabelledby
    }
    if (ariaDescribedby) {
      attributes['aria-describedby'] = ariaDescribedby
    }

    return createElement('div', {
      className,
      attributes,
    })
  }

  // ===========================================================================
  // Private Methods - Event Handling
  // ===========================================================================

  /**
   * イベントリスナーを設定
   */
  private setupEventListeners(): void {
    document.addEventListener('keydown', this.boundKeydownHandler)

    // オーバーレイクリックで閉じる
    if (this.config.closeOnOverlayClick !== false) {
      this.overlayElement?.addEventListener('click', (e) => {
        // オーバーレイ自体がクリックされた場合のみ
        if (e.target === this.overlayElement) {
          this.handleOverlayClick()
        }
      })
    }
  }

  /**
   * イベントリスナーを削除
   */
  private removeEventListeners(): void {
    document.removeEventListener('keydown', this.boundKeydownHandler)
  }

  /**
   * キーボードイベントハンドラ
   */
  private handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape' && this.config.closeOnEscape !== false) {
      e.preventDefault()
      this.handleEscapeKey()
      return
    }

    // Tab キーでフォーカストラップ
    if (e.key === 'Tab') {
      this.handleTabKey(e)
    }
  }

  /**
   * Escapeキー処理
   */
  private handleEscapeKey(): void {
    // コールバックがfalseを返した場合は閉じない
    const shouldClose = this.config.onPressEscape?.() ?? true
    if (shouldClose !== false) {
      this.close()
    }
  }

  /**
   * オーバーレイクリック処理
   */
  private handleOverlayClick(): void {
    // コールバックがfalseを返した場合は閉じない
    const shouldClose = this.config.onClickOverlay?.() ?? true
    if (shouldClose !== false) {
      this.close()
    }
  }

  /**
   * Tab キーの処理（フォーカストラップ）
   */
  private handleTabKey(e: KeyboardEvent): void {
    if (!this.dialogElement) {
      return
    }

    const focusableElements = this.getFocusableElements()
    if (focusableElements.length === 0) {
      return
    }

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]
    const activeElement = document.activeElement

    if (e.shiftKey) {
      // Shift+Tab: 最初の要素にいたら最後へ
      if (activeElement === firstElement) {
        e.preventDefault()
        lastElement.focus()
      }
    } else {
      // Tab: 最後の要素にいたら最初へ
      if (activeElement === lastElement) {
        e.preventDefault()
        firstElement.focus()
      }
    }
  }

  /**
   * フォーカス可能な要素を取得
   */
  private getFocusableElements(): HTMLElement[] {
    if (!this.dialogElement) {
      return []
    }

    const selector = [
      'button:not([disabled])',
      'a[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ')

    return Array.from(this.dialogElement.querySelectorAll<HTMLElement>(selector))
  }

  /**
   * フォーカスをダイアログ内に設定
   */
  private trapFocus(): void {
    const firstFocusElement = this.getFirstFocusElement()
    if (firstFocusElement) {
      firstFocusElement.focus()
    }
  }

  // ===========================================================================
  // Private Methods - Utility
  // ===========================================================================

  /**
   * ダイアログ要素を破棄
   */
  private destroy(): void {
    if (this.overlayElement) {
      this.overlayElement.remove()
      this.overlayElement = null
    }
    if (this.dialogElement) {
      this.dialogElement.remove()
      this.dialogElement = null
    }
    document.body.classList.remove('dialog-open')
  }

  /**
   * HTML特殊文字をエスケープ
   */
  protected escapeHtml(text: string): string {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }
}

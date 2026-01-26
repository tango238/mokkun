/**
 * Delete Confirm Dialog Component
 * 削除確認ダイアログ - 依存データの影響を表示
 */

import { createElement, generateId } from '../utils/dom'
import { escapeHtml, createFieldWrapper } from '../utils/field-helpers'
import type { InputField } from '../../types/schema'

// =============================================================================
// Types
// =============================================================================

/**
 * 依存データの情報
 */
export interface DependencyInfo {
  /** 依存データのタイプ（例：spaces, reservations） */
  type: string
  /** 表示ラベル */
  label: string
  /** 件数 */
  count: number
}

/**
 * 削除確認ダイアログの設定
 */
export interface DeleteConfirmDialogConfig {
  /** ダイアログタイトル */
  title: string
  /** 削除対象の名前（例：施設名） */
  targetName: string
  /** 削除対象のタイプ（例：施設） */
  targetType?: string
  /** 依存データの情報 */
  dependencies?: DependencyInfo[]
  /** 警告メッセージ */
  warningMessage?: string
  /** 確認ボタンのラベル */
  confirmLabel?: string
  /** キャンセルボタンのラベル */
  cancelLabel?: string
  /** 危険なアクションとしてスタイリング */
  danger?: boolean
}

/**
 * ダイアログのコールバック
 */
export interface DeleteConfirmDialogCallbacks {
  /** 削除確認時 */
  onConfirm?: () => void
  /** キャンセル時 */
  onCancel?: () => void
  /** ダイアログクローズ時 */
  onClose?: () => void
}

/**
 * ダイアログの状態
 */
export interface DeleteConfirmDialogState {
  /** ダイアログが開いているか */
  isOpen: boolean
  /** フォーカスを戻す要素 */
  previouslyFocusedElement: Element | null
}

// =============================================================================
// DeleteConfirmDialog Class
// =============================================================================

/**
 * 削除確認ダイアログコンポーネント
 */
export class DeleteConfirmDialog {
  private config: DeleteConfirmDialogConfig
  private callbacks: DeleteConfirmDialogCallbacks
  private state: DeleteConfirmDialogState
  private dialogElement: HTMLElement | null = null
  private overlayElement: HTMLElement | null = null
  private readonly dialogId: string
  private boundKeydownHandler: (e: KeyboardEvent) => void

  constructor(
    config: DeleteConfirmDialogConfig,
    callbacks: DeleteConfirmDialogCallbacks = {}
  ) {
    this.config = config
    this.callbacks = callbacks
    this.dialogId = generateId('delete-dialog')
    this.state = {
      isOpen: false,
      previouslyFocusedElement: null,
    }
    this.boundKeydownHandler = this.handleKeydown.bind(this)
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
  }

  /**
   * 設定を更新
   */
  updateConfig(config: Partial<DeleteConfirmDialogConfig>): void {
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
  getState(): DeleteConfirmDialogState {
    return { ...this.state }
  }

  /**
   * ダイアログ要素を取得（テスト用）
   */
  getDialogElement(): HTMLElement | null {
    return this.dialogElement
  }

  // ===========================================================================
  // Private Methods - Rendering
  // ===========================================================================

  /**
   * ダイアログをレンダリング
   */
  private render(): void {
    this.destroy()

    // オーバーレイ
    this.overlayElement = createElement('div', {
      className: 'dialog-overlay',
      attributes: {
        'data-dialog-overlay': this.dialogId,
      },
    })

    // ダイアログコンテナ
    const dangerClass = this.config.danger !== false ? 'dialog-danger' : ''
    this.dialogElement = createElement('div', {
      className: `delete-confirm-dialog ${dangerClass}`.trim(),
      attributes: {
        'role': 'alertdialog',
        'aria-modal': 'true',
        'aria-labelledby': `${this.dialogId}-title`,
        'aria-describedby': `${this.dialogId}-description`,
        'data-dialog-id': this.dialogId,
      },
    })

    // ダイアログ内容を構築
    this.dialogElement.appendChild(this.renderHeader())
    this.dialogElement.appendChild(this.renderBody())
    this.dialogElement.appendChild(this.renderFooter())

    // DOMに追加
    document.body.appendChild(this.overlayElement)
    document.body.appendChild(this.dialogElement)

    // body のスクロールを防止
    document.body.classList.add('dialog-open')
  }

  /**
   * ヘッダーをレンダリング
   */
  private renderHeader(): HTMLElement {
    const header = createElement('div', { className: 'dialog-header' })

    // 警告アイコン
    const icon = createElement('div', { className: 'dialog-icon' })
    icon.innerHTML = `
      <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
      </svg>
    `
    header.appendChild(icon)

    // タイトル
    const title = createElement('h2', {
      className: 'dialog-title',
      textContent: this.config.title,
      attributes: {
        'id': `${this.dialogId}-title`,
      },
    })
    header.appendChild(title)

    return header
  }

  /**
   * ボディをレンダリング
   */
  private renderBody(): HTMLElement {
    const body = createElement('div', {
      className: 'dialog-body',
      attributes: {
        'id': `${this.dialogId}-description`,
      },
    })

    // 削除対象の情報
    const targetInfo = createElement('div', { className: 'dialog-target-info' })
    const targetTypeLabel = this.config.targetType ?? '項目'
    const targetText = createElement('p', {
      className: 'dialog-target-text',
    })
    targetText.innerHTML = `<strong>${this.escapeHtml(targetTypeLabel)}</strong>: ${this.escapeHtml(this.config.targetName)}`
    targetInfo.appendChild(targetText)
    body.appendChild(targetInfo)

    // 依存データの表示
    if (this.config.dependencies && this.config.dependencies.length > 0) {
      const dependenciesSection = this.renderDependencies()
      body.appendChild(dependenciesSection)
    }

    // 警告メッセージ
    if (this.config.warningMessage) {
      const warning = createElement('div', {
        className: 'dialog-warning',
        attributes: {
          'role': 'alert',
        },
      })
      const warningIcon = createElement('span', { className: 'warning-icon' })
      warningIcon.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
          <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
        </svg>
      `
      warning.appendChild(warningIcon)
      const warningText = createElement('span', {
        className: 'warning-text',
        textContent: this.config.warningMessage,
      })
      warning.appendChild(warningText)
      body.appendChild(warning)
    }

    return body
  }

  /**
   * 依存データセクションをレンダリング
   */
  private renderDependencies(): HTMLElement {
    const section = createElement('div', { className: 'dialog-dependencies' })

    const heading = createElement('h3', {
      className: 'dependencies-heading',
      textContent: '関連データへの影響',
    })
    section.appendChild(heading)

    const list = createElement('ul', { className: 'dependencies-list' })

    for (const dep of this.config.dependencies ?? []) {
      const item = createElement('li', { className: 'dependency-item' })
      const label = createElement('span', {
        className: 'dependency-label',
        textContent: dep.label,
      })
      const count = createElement('span', {
        className: `dependency-count ${dep.count > 0 ? 'has-data' : ''}`,
        textContent: `${dep.count}件`,
      })
      item.appendChild(label)
      item.appendChild(count)
      list.appendChild(item)
    }

    section.appendChild(list)

    // 影響説明
    const hasAffectedData = this.config.dependencies?.some(d => d.count > 0)
    if (hasAffectedData) {
      const affectedNote = createElement('p', {
        className: 'dependencies-note',
        textContent: 'これらの関連データも削除されます。この操作は取り消せません。',
      })
      section.appendChild(affectedNote)
    }

    return section
  }

  /**
   * フッターをレンダリング
   */
  private renderFooter(): HTMLElement {
    const footer = createElement('div', { className: 'dialog-footer' })

    // キャンセルボタン
    const cancelBtn = createElement('button', {
      className: 'dialog-btn dialog-btn-cancel',
      textContent: this.config.cancelLabel ?? 'キャンセル',
      attributes: {
        'type': 'button',
        'data-action': 'cancel',
      },
    })
    cancelBtn.addEventListener('click', () => this.handleCancel())
    footer.appendChild(cancelBtn)

    // 削除ボタン
    const confirmBtn = createElement('button', {
      className: 'dialog-btn dialog-btn-confirm dialog-btn-danger',
      textContent: this.config.confirmLabel ?? '削除を実行',
      attributes: {
        'type': 'button',
        'data-action': 'confirm',
      },
    })
    confirmBtn.addEventListener('click', () => this.handleConfirm())
    footer.appendChild(confirmBtn)

    return footer
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
    this.overlayElement?.addEventListener('click', () => this.handleCancel())
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
    if (e.key === 'Escape') {
      e.preventDefault()
      this.handleCancel()
      return
    }

    // Tab キーでフォーカストラップ
    if (e.key === 'Tab') {
      this.handleTabKey(e)
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
    const focusableElements = this.getFocusableElements()
    if (focusableElements.length > 0) {
      // 最初のフォーカス可能要素（キャンセルボタン）にフォーカス
      focusableElements[0].focus()
    }
  }

  /**
   * 確認ボタンクリック時
   */
  private handleConfirm(): void {
    this.callbacks.onConfirm?.()
    this.close()
  }

  /**
   * キャンセルボタンクリック時
   */
  private handleCancel(): void {
    this.callbacks.onCancel?.()
    this.close()
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
  private escapeHtml(text: string): string {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  // ===========================================================================
  // Static Field Renderer
  // ===========================================================================

  static renderField(field: InputField): string {
    const dialogField = field as InputField & {
      title?: string
      message?: string
      cancelLabel?: string
      confirmLabel?: string
      targetName?: string
    }
    const title = dialogField.title ?? field.label ?? '削除確認'
    const message = dialogField.message ?? field.description ?? 'この操作は取り消せません。本当に削除しますか？'
    const cancelLabel = dialogField.cancelLabel ?? 'キャンセル'
    const confirmLabel = dialogField.confirmLabel ?? '削除する'
    const targetName = dialogField.targetName ?? ''

    const dialogHtml = `
      <div class="delete-confirm-dialog-preview">
        <div class="dialog-header">
          <h3>${escapeHtml(title)}</h3>
        </div>
        <div class="dialog-body">
          ${targetName ? `<p class="dialog-target"><strong>対象:</strong> ${escapeHtml(targetName)}</p>` : ''}
          <p class="dialog-message">${escapeHtml(message)}</p>
        </div>
        <div class="dialog-footer">
          <button type="button" class="dialog-button dialog-cancel">${escapeHtml(cancelLabel)}</button>
          <button type="button" class="dialog-button dialog-confirm dialog-danger">${escapeHtml(confirmLabel)}</button>
        </div>
      </div>
    `
    return createFieldWrapper(field, dialogHtml)
  }
}

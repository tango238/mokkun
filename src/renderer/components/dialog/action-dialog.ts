/**
 * Action Dialog Component
 * ユーザーアクション確認用ダイアログ
 *
 * 機能:
 * - 確認/キャンセルボタン
 * - デンジャーモード（危険なアクションの強調）
 * - アイコン表示
 * - サブアクションエリア
 */

import { BaseDialog } from './base-dialog'
import { createElement } from '../../utils/dom'
import type {
  ActionDialogConfig,
  ActionDialogCallbacks,
  DialogIcon,
} from './dialog-types'

// =============================================================================
// ActionDialog Class
// =============================================================================

/**
 * アクションダイアログコンポーネント
 * ユーザーに確認・キャンセルの選択を求めるダイアログ
 */
export class ActionDialog extends BaseDialog {
  protected declare config: Required<Omit<ActionDialogConfig, 'customIcon' | 'message' | 'subActionContent'>> & Pick<ActionDialogConfig, 'customIcon' | 'message' | 'subActionContent'>
  protected declare callbacks: ActionDialogCallbacks

  constructor(config: ActionDialogConfig, callbacks: ActionDialogCallbacks = {}) {
    super(config, callbacks)

    // ActionDialog固有のデフォルト値
    this.config = {
      ...this.config,
      title: config.title,
      message: config.message,
      icon: config.icon ?? 'warning',
      customIcon: config.customIcon,
      confirmLabel: config.confirmLabel ?? '確認',
      cancelLabel: config.cancelLabel ?? 'キャンセル',
      confirmDisabled: config.confirmDisabled ?? false,
      danger: config.danger ?? false,
      showSubActionArea: config.showSubActionArea ?? false,
      subActionContent: config.subActionContent,
    }

    this.callbacks = {
      ...this.callbacks,
      onConfirm: callbacks.onConfirm,
      onCancel: callbacks.onCancel,
    }
  }

  // ===========================================================================
  // Protected Methods - Overrides
  // ===========================================================================

  /**
   * ダイアログのクラス名を取得
   */
  protected getDialogClassName(): string {
    const baseClass = super.getDialogClassName()
    const actionClass = 'dialog-action'
    const dangerClass = this.config.danger ? 'dialog-danger' : ''
    return `${baseClass} ${actionClass} ${dangerClass}`.trim()
  }

  /**
   * ARIA role を取得（アクション確認なので alertdialog）
   */
  protected getAriaRole(): string {
    return 'alertdialog'
  }

  /**
   * ダイアログのコンテンツをレンダリング
   */
  protected renderContent(): HTMLElement {
    const container = createElement('div', { className: 'dialog-content-wrapper' })

    container.appendChild(this.renderHeader())
    container.appendChild(this.renderBody())
    container.appendChild(this.renderFooter())

    return container
  }

  // ===========================================================================
  // Private Methods - Rendering
  // ===========================================================================

  /**
   * ヘッダーをレンダリング
   */
  private renderHeader(): HTMLElement {
    const header = createElement('div', { className: 'dialog-header' })

    // アイコン
    const iconEl = this.renderIcon()
    header.appendChild(iconEl)

    // タイトル
    const titleId = `${this.dialogId}-title`
    const title = createElement('h2', {
      className: 'dialog-title',
      textContent: this.config.title,
      attributes: {
        'id': titleId,
      },
    })
    header.appendChild(title)

    // aria-labelledby を自動設定
    if (!this.config.ariaLabelledby && this.dialogElement) {
      this.dialogElement.setAttribute('aria-labelledby', titleId)
    }

    return header
  }

  /**
   * アイコンをレンダリング
   */
  private renderIcon(): HTMLElement {
    const icon = createElement('div', { className: `dialog-icon dialog-icon-${this.config.icon}` })

    if (this.config.icon === 'custom' && this.config.customIcon) {
      icon.innerHTML = this.config.customIcon
    } else {
      icon.innerHTML = this.getIconSVG(this.config.icon)
    }

    return icon
  }

  /**
   * アイコンのSVGを取得
   */
  private getIconSVG(iconType: DialogIcon): string {
    const svgs: Record<Exclude<DialogIcon, 'custom'>, string> = {
      warning: `
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
      `,
      error: `
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
      `,
      info: `
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
        </svg>
      `,
      success: `
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      `,
    }

    // customの場合は空文字列を返す（customIconが使われるため）
    if (iconType === 'custom') {
      return ''
    }

    return svgs[iconType] || svgs.warning
  }

  /**
   * ボディをレンダリング
   */
  private renderBody(): HTMLElement {
    const bodyId = `${this.dialogId}-body`
    const body = createElement('div', {
      className: 'dialog-body',
      attributes: {
        'id': bodyId,
      },
    })

    // メッセージ
    if (this.config.message) {
      const message = createElement('p', {
        className: 'dialog-message',
        textContent: this.config.message,
      })
      body.appendChild(message)
    }

    // サブアクションエリア
    if (this.config.showSubActionArea && this.config.subActionContent) {
      const subActionArea = createElement('div', { className: 'dialog-sub-action-area' })

      if (typeof this.config.subActionContent === 'string') {
        subActionArea.innerHTML = this.config.subActionContent
      } else {
        subActionArea.appendChild(this.config.subActionContent)
      }

      body.appendChild(subActionArea)
    }

    // aria-describedby を自動設定
    if (!this.config.ariaDescribedby && this.dialogElement) {
      this.dialogElement.setAttribute('aria-describedby', bodyId)
    }

    return body
  }

  /**
   * フッターをレンダリング
   */
  private renderFooter(): HTMLElement {
    const footer = createElement('div', { className: 'dialog-footer' })

    // キャンセルボタン
    const cancelBtn = createElement('button', {
      className: 'dialog-btn dialog-btn-cancel',
      textContent: this.config.cancelLabel,
      attributes: {
        'type': 'button',
        'data-action': 'cancel',
      },
    })
    cancelBtn.addEventListener('click', () => this.handleCancel())
    footer.appendChild(cancelBtn)

    // 確認ボタン
    const confirmBtnClass = this.config.danger
      ? 'dialog-btn dialog-btn-confirm dialog-btn-danger'
      : 'dialog-btn dialog-btn-confirm dialog-btn-primary'
    const confirmBtn = createElement('button', {
      className: confirmBtnClass,
      textContent: this.config.confirmLabel,
      attributes: {
        'type': 'button',
        'data-action': 'confirm',
      },
    })

    if (this.config.confirmDisabled) {
      confirmBtn.setAttribute('disabled', 'true')
    }

    confirmBtn.addEventListener('click', () => this.handleConfirm())
    footer.appendChild(confirmBtn)

    return footer
  }

  // ===========================================================================
  // Private Methods - Event Handling
  // ===========================================================================

  /**
   * 確認ボタンクリック時
   */
  private async handleConfirm(): Promise<void> {
    const result = this.callbacks.onConfirm?.()

    // Promiseの場合は待つ
    if (result instanceof Promise) {
      await result
    }

    this.close()
  }

  /**
   * キャンセルボタンクリック時
   */
  private handleCancel(): void {
    this.callbacks.onCancel?.()
    this.close()
  }
}

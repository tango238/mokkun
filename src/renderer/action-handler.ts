/**
 * Action Handler
 * アクションボタンのイベント処理（確認ダイアログ統合）
 */

import {
  DeleteConfirmDialog,
  type DeleteConfirmDialogConfig,
  type DependencyInfo,
} from './components/delete-confirm-dialog'

// =============================================================================
// Types
// =============================================================================

/**
 * アクションハンドラーのコールバック
 */
export interface ActionHandlerCallbacks {
  /** submit アクション実行時 */
  onSubmit?: (actionId: string, url?: string, method?: string) => void
  /** navigate アクション実行時 */
  onNavigate?: (actionId: string, to: string) => void
  /** custom アクション実行時 */
  onCustom?: (actionId: string, handler: string) => void
  /** reset アクション実行時 */
  onReset?: (actionId: string) => void
  /** アクションがキャンセルされた時 */
  onCancel?: (actionId: string) => void
}

/**
 * 削除確認ダイアログの拡張設定（YAMLから取得する追加情報）
 */
export interface DeleteConfirmExtendedConfig {
  /** 依存データを取得する関数 */
  getDependencies?: () => DependencyInfo[] | Promise<DependencyInfo[]>
  /** 削除対象名を取得する関数 */
  getTargetName?: () => string
  /** 削除対象タイプ */
  targetType?: string
  /** 警告メッセージ */
  warningMessage?: string
}

// =============================================================================
// Action Handler Class
// =============================================================================

/**
 * アクションハンドラー
 * ボタンクリック時の処理と確認ダイアログの表示を管理
 */
export class ActionHandler {
  private container: HTMLElement
  private callbacks: ActionHandlerCallbacks
  private deleteConfirmConfigs: Map<string, DeleteConfirmExtendedConfig>
  private boundClickHandler: (e: Event) => void

  constructor(
    container: HTMLElement,
    callbacks: ActionHandlerCallbacks = {},
    deleteConfirmConfigs: Map<string, DeleteConfirmExtendedConfig> = new Map()
  ) {
    this.container = container
    this.callbacks = callbacks
    this.deleteConfirmConfigs = deleteConfirmConfigs
    this.boundClickHandler = this.handleClick.bind(this)
  }

  /**
   * イベントリスナーを設定
   */
  attach(): void {
    this.container.addEventListener('click', this.boundClickHandler)
  }

  /**
   * イベントリスナーを削除
   */
  detach(): void {
    this.container.removeEventListener('click', this.boundClickHandler)
  }

  /**
   * 削除確認の設定を登録
   */
  registerDeleteConfirmConfig(actionId: string, config: DeleteConfirmExtendedConfig): void {
    this.deleteConfirmConfigs.set(actionId, config)
  }

  /**
   * クリックイベントハンドラー
   */
  private handleClick(e: Event): void {
    const target = e.target as HTMLElement
    const button = target.closest('[data-action-id]') as HTMLElement | null

    if (!button) {
      return
    }

    const actionId = button.dataset.actionId
    const actionType = button.dataset.actionType

    if (!actionId || !actionType) {
      return
    }

    // 確認ダイアログが必要かチェック
    const confirmTitle = button.dataset.confirmTitle
    const confirmMessage = button.dataset.confirmMessage

    if (confirmTitle && confirmMessage) {
      e.preventDefault()
      this.showConfirmDialog(button, actionId, actionType, confirmTitle, confirmMessage)
      return
    }

    // 確認不要なら直接実行
    this.executeAction(button, actionId, actionType)
  }

  /**
   * 確認ダイアログを表示
   */
  private async showConfirmDialog(
    button: HTMLElement,
    actionId: string,
    actionType: string,
    title: string,
    message: string
  ): Promise<void> {
    const extendedConfig = this.deleteConfirmConfigs.get(actionId)

    // 依存データを取得
    let dependencies: DependencyInfo[] | undefined
    if (extendedConfig?.getDependencies) {
      const result = extendedConfig.getDependencies()
      dependencies = result instanceof Promise ? await result : result
    }

    // 削除対象名を取得
    let targetName = message
    if (extendedConfig?.getTargetName) {
      targetName = extendedConfig.getTargetName()
    }

    const config: DeleteConfirmDialogConfig = {
      title,
      targetName,
      targetType: extendedConfig?.targetType,
      dependencies,
      warningMessage: extendedConfig?.warningMessage,
      danger: true,
    }

    const dialog = new DeleteConfirmDialog(config, {
      onConfirm: () => {
        this.executeAction(button, actionId, actionType)
      },
      onCancel: () => {
        this.callbacks.onCancel?.(actionId)
      },
    })

    dialog.open()
  }

  /**
   * アクションを実行
   */
  private executeAction(button: HTMLElement, actionId: string, actionType: string): void {
    switch (actionType) {
      case 'submit': {
        const url = button.dataset.url
        const method = button.dataset.method
        this.callbacks.onSubmit?.(actionId, url, method)
        break
      }

      case 'navigate': {
        const to = button.dataset.navigateTo
        if (to) {
          this.callbacks.onNavigate?.(actionId, to)
        }
        break
      }

      case 'custom': {
        const handler = button.dataset.handler
        if (handler) {
          this.callbacks.onCustom?.(actionId, handler)
        }
        break
      }

      case 'reset': {
        this.callbacks.onReset?.(actionId)
        break
      }
    }
  }
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * コンテナにアクションハンドラーをアタッチ
 */
export function attachActionHandler(
  container: HTMLElement,
  callbacks: ActionHandlerCallbacks = {},
  deleteConfirmConfigs?: Map<string, DeleteConfirmExtendedConfig>
): ActionHandler {
  const handler = new ActionHandler(container, callbacks, deleteConfirmConfigs)
  handler.attach()
  return handler
}

/**
 * 簡易的な確認ダイアログを表示（スタンドアロン使用）
 */
export function showDeleteConfirmDialog(
  config: DeleteConfirmDialogConfig,
  onConfirm: () => void,
  onCancel?: () => void
): DeleteConfirmDialog {
  const dialog = new DeleteConfirmDialog(config, {
    onConfirm,
    onCancel,
  })
  dialog.open()
  return dialog
}

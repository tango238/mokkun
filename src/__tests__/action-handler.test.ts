/**
 * Action Handler Tests
 * アクションハンドラーのテスト
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  ActionHandler,
  attachActionHandler,
  showDeleteConfirmDialog,
  type ActionHandlerCallbacks,
} from '../renderer/action-handler'
import type { DeleteConfirmDialogConfig } from '../renderer/components/delete-confirm-dialog'

// =============================================================================
// Test Helpers
// =============================================================================

function createContainer(): HTMLElement {
  const container = document.createElement('div')
  document.body.appendChild(container)
  return container
}

function cleanup(): void {
  document.querySelectorAll('.delete-confirm-dialog, .dialog-overlay').forEach(el => el.remove())
  document.body.classList.remove('dialog-open')
}

function createButton(config: {
  actionId: string
  actionType: string
  confirmTitle?: string
  confirmMessage?: string
  navigateTo?: string
  url?: string
  method?: string
  handler?: string
}): HTMLButtonElement {
  const button = document.createElement('button')
  button.dataset.actionId = config.actionId
  button.dataset.actionType = config.actionType

  if (config.confirmTitle) {
    button.dataset.confirmTitle = config.confirmTitle
  }
  if (config.confirmMessage) {
    button.dataset.confirmMessage = config.confirmMessage
  }
  if (config.navigateTo) {
    button.dataset.navigateTo = config.navigateTo
  }
  if (config.url) {
    button.dataset.url = config.url
  }
  if (config.method) {
    button.dataset.method = config.method
  }
  if (config.handler) {
    button.dataset.handler = config.handler
  }

  button.textContent = 'Test Button'
  return button
}

// =============================================================================
// ActionHandler Tests
// =============================================================================

describe('ActionHandler', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = createContainer()
  })

  afterEach(() => {
    container.remove()
    cleanup()
  })

  describe('Initialization', () => {
    it('should create ActionHandler instance', () => {
      const handler = new ActionHandler(container)
      expect(handler).toBeTruthy()
    })

    it('should attach event listeners', () => {
      const callbacks: ActionHandlerCallbacks = {
        onSubmit: vi.fn(),
      }
      const handler = new ActionHandler(container, callbacks)
      handler.attach()

      const button = createButton({ actionId: 'test', actionType: 'submit' })
      container.appendChild(button)
      button.click()

      expect(callbacks.onSubmit).toHaveBeenCalledWith('test', undefined, undefined)
    })

    it('should detach event listeners', () => {
      const callbacks: ActionHandlerCallbacks = {
        onSubmit: vi.fn(),
      }
      const handler = new ActionHandler(container, callbacks)
      handler.attach()
      handler.detach()

      const button = createButton({ actionId: 'test', actionType: 'submit' })
      container.appendChild(button)
      button.click()

      expect(callbacks.onSubmit).not.toHaveBeenCalled()
    })
  })

  describe('Submit Action', () => {
    it('should call onSubmit callback', () => {
      const onSubmit = vi.fn()
      const handler = new ActionHandler(container, { onSubmit })
      handler.attach()

      const button = createButton({ actionId: 'save', actionType: 'submit' })
      container.appendChild(button)
      button.click()

      expect(onSubmit).toHaveBeenCalledWith('save', undefined, undefined)
    })

    it('should pass url and method to onSubmit', () => {
      const onSubmit = vi.fn()
      const handler = new ActionHandler(container, { onSubmit })
      handler.attach()

      const button = createButton({
        actionId: 'save',
        actionType: 'submit',
        url: '/api/save',
        method: 'POST',
      })
      container.appendChild(button)
      button.click()

      expect(onSubmit).toHaveBeenCalledWith('save', '/api/save', 'POST')
    })
  })

  describe('Navigate Action', () => {
    it('should call onNavigate callback', () => {
      const onNavigate = vi.fn()
      const handler = new ActionHandler(container, { onNavigate })
      handler.attach()

      const button = createButton({
        actionId: 'goto',
        actionType: 'navigate',
        navigateTo: '/dashboard',
      })
      container.appendChild(button)
      button.click()

      expect(onNavigate).toHaveBeenCalledWith('goto', '/dashboard')
    })

    it('should not call onNavigate if no target specified', () => {
      const onNavigate = vi.fn()
      const handler = new ActionHandler(container, { onNavigate })
      handler.attach()

      const button = createButton({ actionId: 'goto', actionType: 'navigate' })
      container.appendChild(button)
      button.click()

      expect(onNavigate).not.toHaveBeenCalled()
    })
  })

  describe('Custom Action', () => {
    it('should call onCustom callback', () => {
      const onCustom = vi.fn()
      const handler = new ActionHandler(container, { onCustom })
      handler.attach()

      const button = createButton({
        actionId: 'custom1',
        actionType: 'custom',
        handler: 'handleCustomAction',
      })
      container.appendChild(button)
      button.click()

      expect(onCustom).toHaveBeenCalledWith('custom1', 'handleCustomAction')
    })
  })

  describe('Reset Action', () => {
    it('should call onReset callback', () => {
      const onReset = vi.fn()
      const handler = new ActionHandler(container, { onReset })
      handler.attach()

      const button = createButton({ actionId: 'reset1', actionType: 'reset' })
      container.appendChild(button)
      button.click()

      expect(onReset).toHaveBeenCalledWith('reset1')
    })
  })

  describe('Confirm Dialog Integration', () => {
    it('should show confirm dialog when confirm attributes are present', () => {
      const onSubmit = vi.fn()
      const handler = new ActionHandler(container, { onSubmit })
      handler.attach()

      const button = createButton({
        actionId: 'delete',
        actionType: 'submit',
        confirmTitle: '削除の確認',
        confirmMessage: 'この項目を削除しますか？',
      })
      container.appendChild(button)
      button.click()

      // Dialog should be shown
      expect(document.querySelector('.delete-confirm-dialog')).toBeTruthy()
      // onSubmit should not be called yet
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('should call onSubmit when confirm dialog is confirmed', () => {
      const onSubmit = vi.fn()
      const handler = new ActionHandler(container, { onSubmit })
      handler.attach()

      const button = createButton({
        actionId: 'delete',
        actionType: 'submit',
        confirmTitle: '削除の確認',
        confirmMessage: 'この項目を削除しますか？',
      })
      container.appendChild(button)
      button.click()

      // Click confirm button in dialog
      const confirmBtn = document.querySelector('.dialog-btn-confirm') as HTMLButtonElement
      confirmBtn.click()

      expect(onSubmit).toHaveBeenCalledWith('delete', undefined, undefined)
    })

    it('should call onCancel when confirm dialog is cancelled', () => {
      const onSubmit = vi.fn()
      const onCancel = vi.fn()
      const handler = new ActionHandler(container, { onSubmit, onCancel })
      handler.attach()

      const button = createButton({
        actionId: 'delete',
        actionType: 'submit',
        confirmTitle: '削除の確認',
        confirmMessage: 'この項目を削除しますか？',
      })
      container.appendChild(button)
      button.click()

      // Click cancel button in dialog
      const cancelBtn = document.querySelector('.dialog-btn-cancel') as HTMLButtonElement
      cancelBtn.click()

      expect(onSubmit).not.toHaveBeenCalled()
      expect(onCancel).toHaveBeenCalledWith('delete')
    })

    it('should use extended config for dependencies', async () => {
      const onSubmit = vi.fn()
      const handler = new ActionHandler(container, { onSubmit })

      // Register extended config with dependencies
      handler.registerDeleteConfirmConfig('delete', {
        getDependencies: () => [
          { type: 'spaces', label: '関連スペース', count: 5 },
          { type: 'reservations', label: '関連予約', count: 3 },
        ],
        targetType: '施設',
        warningMessage: 'すべての関連データも削除されます',
      })

      handler.attach()

      const button = createButton({
        actionId: 'delete',
        actionType: 'submit',
        confirmTitle: '施設を削除',
        confirmMessage: 'テスト施設',
      })
      container.appendChild(button)
      button.click()

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10))

      // Check dependencies are displayed
      const dependenciesList = document.querySelector('.dependencies-list')
      expect(dependenciesList).toBeTruthy()
      expect(document.querySelectorAll('.dependency-item').length).toBe(2)
    })
  })

  describe('Event Delegation', () => {
    it('should handle clicks on nested elements', () => {
      const onSubmit = vi.fn()
      const handler = new ActionHandler(container, { onSubmit })
      handler.attach()

      const button = createButton({ actionId: 'test', actionType: 'submit' })
      const span = document.createElement('span')
      span.textContent = 'Click me'
      button.appendChild(span)
      container.appendChild(button)

      // Click on the nested span
      span.click()

      expect(onSubmit).toHaveBeenCalledWith('test', undefined, undefined)
    })

    it('should ignore clicks on non-action elements', () => {
      const onSubmit = vi.fn()
      const handler = new ActionHandler(container, { onSubmit })
      handler.attach()

      const div = document.createElement('div')
      div.textContent = 'Not an action'
      container.appendChild(div)
      div.click()

      expect(onSubmit).not.toHaveBeenCalled()
    })
  })
})

// =============================================================================
// attachActionHandler Tests
// =============================================================================

describe('attachActionHandler', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = createContainer()
  })

  afterEach(() => {
    container.remove()
    cleanup()
  })

  it('should create and attach handler', () => {
    const onSubmit = vi.fn()
    const handler = attachActionHandler(container, { onSubmit })

    const button = createButton({ actionId: 'test', actionType: 'submit' })
    container.appendChild(button)
    button.click()

    expect(onSubmit).toHaveBeenCalled()
    expect(handler).toBeInstanceOf(ActionHandler)
  })
})

// =============================================================================
// showDeleteConfirmDialog Tests
// =============================================================================

describe('showDeleteConfirmDialog', () => {
  afterEach(() => {
    cleanup()
  })

  it('should show dialog with provided config', () => {
    const config: DeleteConfirmDialogConfig = {
      title: 'テスト削除',
      targetName: 'テスト項目',
      targetType: 'アイテム',
    }
    const onConfirm = vi.fn()

    showDeleteConfirmDialog(config, onConfirm)

    expect(document.querySelector('.delete-confirm-dialog')).toBeTruthy()
    expect(document.querySelector('.dialog-title')?.textContent).toBe('テスト削除')
  })

  it('should call onConfirm when confirmed', () => {
    const onConfirm = vi.fn()

    showDeleteConfirmDialog({ title: 'Test', targetName: 'Item' }, onConfirm)

    const confirmBtn = document.querySelector('.dialog-btn-confirm') as HTMLButtonElement
    confirmBtn.click()

    expect(onConfirm).toHaveBeenCalled()
  })

  it('should call onCancel when cancelled', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()

    showDeleteConfirmDialog({ title: 'Test', targetName: 'Item' }, onConfirm, onCancel)

    const cancelBtn = document.querySelector('.dialog-btn-cancel') as HTMLButtonElement
    cancelBtn.click()

    expect(onConfirm).not.toHaveBeenCalled()
    expect(onCancel).toHaveBeenCalled()
  })

  it('should return dialog instance', () => {
    const dialog = showDeleteConfirmDialog({ title: 'Test', targetName: 'Item' }, vi.fn())

    expect(dialog.getState().isOpen).toBe(true)
  })
})

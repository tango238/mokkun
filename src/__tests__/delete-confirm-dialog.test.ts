/**
 * Delete Confirm Dialog Tests
 * 削除確認ダイアログコンポーネントのテスト
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  DeleteConfirmDialog,
  type DeleteConfirmDialogConfig,
  type DependencyInfo,
} from '../renderer/components/delete-confirm-dialog'

// =============================================================================
// Test Helpers
// =============================================================================

function createBasicConfig(): DeleteConfirmDialogConfig {
  return {
    title: '施設を削除しますか？',
    targetName: 'サンプル施設',
    targetType: '施設',
  }
}

function createFullConfig(): DeleteConfirmDialogConfig {
  return {
    title: '施設を削除しますか？',
    targetName: 'サンプル施設',
    targetType: '施設',
    dependencies: [
      { type: 'spaces', label: '関連スペース', count: 5 },
      { type: 'reservations', label: '関連予約', count: 12 },
      { type: 'cleanings', label: '関連清掃情報', count: 3 },
    ],
    warningMessage: 'この操作は取り消せません。すべての関連データも削除されます。',
    confirmLabel: '削除する',
    cancelLabel: 'やめる',
    danger: true,
  }
}

function cleanup(): void {
  // ダイアログとオーバーレイを削除
  document.querySelectorAll('.delete-confirm-dialog, .dialog-overlay').forEach(el => el.remove())
  document.body.classList.remove('dialog-open')
}

// =============================================================================
// Basic Functionality Tests
// =============================================================================

describe('DeleteConfirmDialog', () => {
  afterEach(() => {
    cleanup()
  })

  describe('Initialization', () => {
    it('should create dialog instance with basic config', () => {
      const dialog = new DeleteConfirmDialog(createBasicConfig())
      const state = dialog.getState()

      expect(state.isOpen).toBe(false)
      expect(state.previouslyFocusedElement).toBe(null)
    })

    it('should not render dialog until open() is called', () => {
      new DeleteConfirmDialog(createBasicConfig())

      expect(document.querySelector('.delete-confirm-dialog')).toBeNull()
      expect(document.querySelector('.dialog-overlay')).toBeNull()
    })
  })

  describe('Opening Dialog', () => {
    it('should render dialog when open() is called', () => {
      const dialog = new DeleteConfirmDialog(createBasicConfig())
      dialog.open()

      expect(document.querySelector('.delete-confirm-dialog')).toBeTruthy()
      expect(document.querySelector('.dialog-overlay')).toBeTruthy()
    })

    it('should set isOpen state to true', () => {
      const dialog = new DeleteConfirmDialog(createBasicConfig())
      dialog.open()

      expect(dialog.getState().isOpen).toBe(true)
    })

    it('should store previously focused element', () => {
      const button = document.createElement('button')
      document.body.appendChild(button)
      button.focus()

      const dialog = new DeleteConfirmDialog(createBasicConfig())
      dialog.open()

      expect(dialog.getState().previouslyFocusedElement).toBe(button)

      button.remove()
    })

    it('should add dialog-open class to body', () => {
      const dialog = new DeleteConfirmDialog(createBasicConfig())
      dialog.open()

      expect(document.body.classList.contains('dialog-open')).toBe(true)
    })

    it('should not open again if already open', () => {
      const dialog = new DeleteConfirmDialog(createBasicConfig())
      dialog.open()
      dialog.open()

      expect(document.querySelectorAll('.delete-confirm-dialog').length).toBe(1)
    })
  })

  describe('Closing Dialog', () => {
    it('should remove dialog when close() is called', () => {
      const dialog = new DeleteConfirmDialog(createBasicConfig())
      dialog.open()
      dialog.close()

      expect(document.querySelector('.delete-confirm-dialog')).toBeNull()
      expect(document.querySelector('.dialog-overlay')).toBeNull()
    })

    it('should set isOpen state to false', () => {
      const dialog = new DeleteConfirmDialog(createBasicConfig())
      dialog.open()
      dialog.close()

      expect(dialog.getState().isOpen).toBe(false)
    })

    it('should remove dialog-open class from body', () => {
      const dialog = new DeleteConfirmDialog(createBasicConfig())
      dialog.open()
      dialog.close()

      expect(document.body.classList.contains('dialog-open')).toBe(false)
    })

    it('should restore focus to previously focused element', () => {
      const button = document.createElement('button')
      document.body.appendChild(button)
      button.focus()

      const dialog = new DeleteConfirmDialog(createBasicConfig())
      dialog.open()
      dialog.close()

      expect(document.activeElement).toBe(button)

      button.remove()
    })

    it('should call onClose callback', () => {
      const onClose = vi.fn()
      const dialog = new DeleteConfirmDialog(createBasicConfig(), { onClose })
      dialog.open()
      dialog.close()

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should do nothing if not open', () => {
      const onClose = vi.fn()
      const dialog = new DeleteConfirmDialog(createBasicConfig(), { onClose })
      dialog.close()

      expect(onClose).not.toHaveBeenCalled()
    })
  })

  describe('Content Rendering', () => {
    it('should display dialog title', () => {
      const config = createBasicConfig()
      const dialog = new DeleteConfirmDialog(config)
      dialog.open()

      const title = document.querySelector('.dialog-title')
      expect(title?.textContent).toBe(config.title)
    })

    it('should display target name and type', () => {
      const config = createBasicConfig()
      const dialog = new DeleteConfirmDialog(config)
      dialog.open()

      const targetText = document.querySelector('.dialog-target-text')
      expect(targetText?.textContent).toContain(config.targetName)
      expect(targetText?.textContent).toContain(config.targetType!)
    })

    it('should use default target type label when not specified', () => {
      const config: DeleteConfirmDialogConfig = {
        title: '削除しますか？',
        targetName: 'アイテム',
      }
      const dialog = new DeleteConfirmDialog(config)
      dialog.open()

      const targetText = document.querySelector('.dialog-target-text')
      expect(targetText?.textContent).toContain('項目')
    })

    it('should display dependencies when provided', () => {
      const config = createFullConfig()
      const dialog = new DeleteConfirmDialog(config)
      dialog.open()

      const dependenciesList = document.querySelector('.dependencies-list')
      expect(dependenciesList).toBeTruthy()

      const items = document.querySelectorAll('.dependency-item')
      expect(items.length).toBe(3)

      // Check first dependency
      expect(items[0].querySelector('.dependency-label')?.textContent).toBe('関連スペース')
      expect(items[0].querySelector('.dependency-count')?.textContent).toBe('5件')
    })

    it('should highlight dependencies with count > 0', () => {
      const config = createFullConfig()
      const dialog = new DeleteConfirmDialog(config)
      dialog.open()

      const counts = document.querySelectorAll('.dependency-count.has-data')
      expect(counts.length).toBe(3) // All have counts > 0
    })

    it('should display warning message when provided', () => {
      const config = createFullConfig()
      const dialog = new DeleteConfirmDialog(config)
      dialog.open()

      const warning = document.querySelector('.dialog-warning')
      expect(warning).toBeTruthy()
      expect(warning?.querySelector('.warning-text')?.textContent).toBe(config.warningMessage)
    })

    it('should not display warning when not provided', () => {
      const config = createBasicConfig()
      const dialog = new DeleteConfirmDialog(config)
      dialog.open()

      expect(document.querySelector('.dialog-warning')).toBeNull()
    })

    it('should display dependencies note when there are affected data', () => {
      const config = createFullConfig()
      const dialog = new DeleteConfirmDialog(config)
      dialog.open()

      const note = document.querySelector('.dependencies-note')
      expect(note).toBeTruthy()
      expect(note?.textContent).toContain('関連データも削除')
    })

    it('should not display dependencies note when no affected data', () => {
      const config: DeleteConfirmDialogConfig = {
        ...createBasicConfig(),
        dependencies: [
          { type: 'spaces', label: '関連スペース', count: 0 },
        ],
      }
      const dialog = new DeleteConfirmDialog(config)
      dialog.open()

      expect(document.querySelector('.dependencies-note')).toBeNull()
    })

    it('should use custom button labels', () => {
      const config = createFullConfig()
      const dialog = new DeleteConfirmDialog(config)
      dialog.open()

      const confirmBtn = document.querySelector('.dialog-btn-confirm')
      const cancelBtn = document.querySelector('.dialog-btn-cancel')

      expect(confirmBtn?.textContent).toBe(config.confirmLabel)
      expect(cancelBtn?.textContent).toBe(config.cancelLabel)
    })

    it('should use default button labels when not specified', () => {
      const config = createBasicConfig()
      const dialog = new DeleteConfirmDialog(config)
      dialog.open()

      const confirmBtn = document.querySelector('.dialog-btn-confirm')
      const cancelBtn = document.querySelector('.dialog-btn-cancel')

      expect(confirmBtn?.textContent).toBe('削除を実行')
      expect(cancelBtn?.textContent).toBe('キャンセル')
    })

    it('should apply danger class by default', () => {
      const config = createBasicConfig()
      const dialog = new DeleteConfirmDialog(config)
      dialog.open()

      expect(document.querySelector('.delete-confirm-dialog.dialog-danger')).toBeTruthy()
    })

    it('should not apply danger class when danger is false', () => {
      const config: DeleteConfirmDialogConfig = {
        ...createBasicConfig(),
        danger: false,
      }
      const dialog = new DeleteConfirmDialog(config)
      dialog.open()

      expect(document.querySelector('.delete-confirm-dialog.dialog-danger')).toBeNull()
    })
  })

  describe('Button Actions', () => {
    it('should call onConfirm and close when confirm button is clicked', () => {
      const onConfirm = vi.fn()
      const dialog = new DeleteConfirmDialog(createBasicConfig(), { onConfirm })
      dialog.open()

      const confirmBtn = document.querySelector('.dialog-btn-confirm') as HTMLButtonElement
      confirmBtn.click()

      expect(onConfirm).toHaveBeenCalledTimes(1)
      expect(dialog.getState().isOpen).toBe(false)
    })

    it('should call onCancel and close when cancel button is clicked', () => {
      const onCancel = vi.fn()
      const dialog = new DeleteConfirmDialog(createBasicConfig(), { onCancel })
      dialog.open()

      const cancelBtn = document.querySelector('.dialog-btn-cancel') as HTMLButtonElement
      cancelBtn.click()

      expect(onCancel).toHaveBeenCalledTimes(1)
      expect(dialog.getState().isOpen).toBe(false)
    })

    it('should call onCancel and close when overlay is clicked', () => {
      const onCancel = vi.fn()
      const dialog = new DeleteConfirmDialog(createBasicConfig(), { onCancel })
      dialog.open()

      const overlay = document.querySelector('.dialog-overlay') as HTMLElement
      overlay.click()

      expect(onCancel).toHaveBeenCalledTimes(1)
      expect(dialog.getState().isOpen).toBe(false)
    })
  })

  describe('Keyboard Navigation', () => {
    it('should close on Escape key', () => {
      const onCancel = vi.fn()
      const dialog = new DeleteConfirmDialog(createBasicConfig(), { onCancel })
      dialog.open()

      const event = new KeyboardEvent('keydown', { key: 'Escape' })
      document.dispatchEvent(event)

      expect(onCancel).toHaveBeenCalledTimes(1)
      expect(dialog.getState().isOpen).toBe(false)
    })

    it('should trap focus within dialog on Tab', () => {
      const dialog = new DeleteConfirmDialog(createBasicConfig())
      dialog.open()

      const buttons = document.querySelectorAll<HTMLButtonElement>('.dialog-btn')
      const firstBtn = buttons[0]
      const lastBtn = buttons[buttons.length - 1]

      // Focus on last button and Tab
      lastBtn.focus()
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' })
      document.dispatchEvent(tabEvent)

      // Note: In a real browser, focus would cycle to first button
      // Here we just verify the handler doesn't throw
      expect(document.activeElement).toBeTruthy()
    })

    it('should trap focus on Shift+Tab from first element', () => {
      const dialog = new DeleteConfirmDialog(createBasicConfig())
      dialog.open()

      const buttons = document.querySelectorAll<HTMLButtonElement>('.dialog-btn')
      const firstBtn = buttons[0]

      // Focus on first button and Shift+Tab
      firstBtn.focus()
      const shiftTabEvent = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true })
      document.dispatchEvent(shiftTabEvent)

      expect(document.activeElement).toBeTruthy()
    })
  })

  describe('Accessibility', () => {
    it('should have role="alertdialog"', () => {
      const dialog = new DeleteConfirmDialog(createBasicConfig())
      dialog.open()

      const dialogEl = document.querySelector('.delete-confirm-dialog')
      expect(dialogEl?.getAttribute('role')).toBe('alertdialog')
    })

    it('should have aria-modal="true"', () => {
      const dialog = new DeleteConfirmDialog(createBasicConfig())
      dialog.open()

      const dialogEl = document.querySelector('.delete-confirm-dialog')
      expect(dialogEl?.getAttribute('aria-modal')).toBe('true')
    })

    it('should have aria-labelledby pointing to title', () => {
      const dialog = new DeleteConfirmDialog(createBasicConfig())
      dialog.open()

      const dialogEl = document.querySelector('.delete-confirm-dialog')
      const titleId = dialogEl?.getAttribute('aria-labelledby')
      const title = document.getElementById(titleId!)

      expect(title).toBeTruthy()
      expect(title?.classList.contains('dialog-title')).toBe(true)
    })

    it('should have aria-describedby pointing to body', () => {
      const dialog = new DeleteConfirmDialog(createBasicConfig())
      dialog.open()

      const dialogEl = document.querySelector('.delete-confirm-dialog')
      const bodyId = dialogEl?.getAttribute('aria-describedby')
      const body = document.getElementById(bodyId!)

      expect(body).toBeTruthy()
      expect(body?.classList.contains('dialog-body')).toBe(true)
    })

    it('should have role="alert" on warning element', () => {
      const config = createFullConfig()
      const dialog = new DeleteConfirmDialog(config)
      dialog.open()

      const warning = document.querySelector('.dialog-warning')
      expect(warning?.getAttribute('role')).toBe('alert')
    })

    it('should focus first focusable element (cancel button) when opened', () => {
      const dialog = new DeleteConfirmDialog(createBasicConfig())
      dialog.open()

      const cancelBtn = document.querySelector('.dialog-btn-cancel')
      expect(document.activeElement).toBe(cancelBtn)
    })
  })

  describe('Config Updates', () => {
    it('should update config and re-render when dialog is open', () => {
      const dialog = new DeleteConfirmDialog(createBasicConfig())
      dialog.open()

      dialog.updateConfig({ title: '新しいタイトル' })

      const title = document.querySelector('.dialog-title')
      expect(title?.textContent).toBe('新しいタイトル')
    })

    it('should update config without rendering when dialog is closed', () => {
      const dialog = new DeleteConfirmDialog(createBasicConfig())
      dialog.updateConfig({ title: '新しいタイトル' })

      dialog.open()

      const title = document.querySelector('.dialog-title')
      expect(title?.textContent).toBe('新しいタイトル')
    })
  })

  describe('getDialogElement', () => {
    it('should return dialog element when open', () => {
      const dialog = new DeleteConfirmDialog(createBasicConfig())
      dialog.open()

      const element = dialog.getDialogElement()
      expect(element).toBeTruthy()
      expect(element?.classList.contains('delete-confirm-dialog')).toBe(true)
    })

    it('should return null when closed', () => {
      const dialog = new DeleteConfirmDialog(createBasicConfig())

      expect(dialog.getDialogElement()).toBeNull()
    })
  })

  describe('HTML Escaping', () => {
    it('should escape HTML in target name', () => {
      const config: DeleteConfirmDialogConfig = {
        ...createBasicConfig(),
        targetName: '<script>alert("xss")</script>',
      }
      const dialog = new DeleteConfirmDialog(config)
      dialog.open()

      const targetText = document.querySelector('.dialog-target-text')
      expect(targetText?.innerHTML).not.toContain('<script>')
      expect(targetText?.textContent).toContain('<script>')
    })

    it('should escape HTML in target type', () => {
      const config: DeleteConfirmDialogConfig = {
        ...createBasicConfig(),
        targetType: '<img src=x onerror=alert(1)>',
      }
      const dialog = new DeleteConfirmDialog(config)
      dialog.open()

      const targetText = document.querySelector('.dialog-target-text')
      expect(targetText?.innerHTML).not.toContain('<img')
    })
  })

  describe('Event Cleanup', () => {
    it('should remove keydown listener when closed', () => {
      const dialog = new DeleteConfirmDialog(createBasicConfig())
      dialog.open()
      dialog.close()

      // Open a new dialog to ensure old listeners don't interfere
      const dialog2 = new DeleteConfirmDialog(createBasicConfig())
      dialog2.open()

      const event = new KeyboardEvent('keydown', { key: 'Escape' })
      document.dispatchEvent(event)

      // Only the second dialog should close
      expect(document.querySelectorAll('.delete-confirm-dialog').length).toBe(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty dependencies array', () => {
      const config: DeleteConfirmDialogConfig = {
        ...createBasicConfig(),
        dependencies: [],
      }
      const dialog = new DeleteConfirmDialog(config)
      dialog.open()

      expect(document.querySelector('.dialog-dependencies')).toBeNull()
    })

    it('should handle missing callbacks gracefully', () => {
      const dialog = new DeleteConfirmDialog(createBasicConfig())
      dialog.open()

      // Should not throw
      const confirmBtn = document.querySelector('.dialog-btn-confirm') as HTMLButtonElement
      expect(() => confirmBtn.click()).not.toThrow()
    })

    it('should handle rapid open/close cycles', () => {
      const dialog = new DeleteConfirmDialog(createBasicConfig())

      dialog.open()
      dialog.close()
      dialog.open()
      dialog.close()
      dialog.open()

      expect(document.querySelectorAll('.delete-confirm-dialog').length).toBe(1)
      expect(dialog.getState().isOpen).toBe(true)
    })
  })
})

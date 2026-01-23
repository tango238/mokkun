/**
 * Base Dialog Tests
 * ベースダイアログコンポーネントのテスト
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { BaseDialog } from '../../renderer/components/dialog/base-dialog'
import type { BaseDialogConfig, BaseDialogCallbacks } from '../../renderer/components/dialog/dialog-types'

// =============================================================================
// Test Helpers
// =============================================================================

function cleanup(): void {
  document.querySelectorAll('.dialog-base, .dialog-overlay').forEach(el => el.remove())
  document.body.classList.remove('dialog-open')
}

// =============================================================================
// Basic Functionality Tests
// =============================================================================

describe('BaseDialog', () => {
  afterEach(() => {
    cleanup()
  })

  describe('Initialization', () => {
    it('should create dialog instance with default config', () => {
      const dialog = new BaseDialog()
      const state = dialog.getState()

      expect(state.isOpen).toBe(false)
      expect(state.previouslyFocusedElement).toBe(null)
    })

    it('should create dialog instance with custom config', () => {
      const config: BaseDialogConfig = {
        size: 'L',
        ariaLabel: 'Test Dialog',
      }
      const dialog = new BaseDialog(config)

      expect(dialog.getDialogElement()).toBeNull() // not rendered yet
    })

    it('should not render dialog until open() is called', () => {
      new BaseDialog()

      expect(document.querySelector('.dialog-base')).toBeNull()
      expect(document.querySelector('.dialog-overlay')).toBeNull()
    })

    it('should open automatically if isOpen is true in config', async () => {
      const dialog = new BaseDialog({ isOpen: true })

      // Wait for setTimeout to complete
      await new Promise(resolve => setTimeout(resolve, 10))

      expect(dialog.getState().isOpen).toBe(true)
      // BaseDialog doesn't render content by default (renderContent returns null)
      // But overlay and container should still be created
      expect(dialog.getDialogElement()).toBeTruthy()
      expect(dialog.getOverlayElement()).toBeTruthy()
    })
  })

  describe('Opening Dialog', () => {
    it('should render dialog when open() is called', () => {
      const dialog = new BaseDialog()
      dialog.open()

      expect(document.querySelector('.dialog-base')).toBeTruthy()
      expect(document.querySelector('.dialog-overlay')).toBeTruthy()
    })

    it('should set isOpen state to true', () => {
      const dialog = new BaseDialog()
      dialog.open()

      expect(dialog.getState().isOpen).toBe(true)
    })

    it('should store previously focused element', () => {
      const button = document.createElement('button')
      document.body.appendChild(button)
      button.focus()

      const dialog = new BaseDialog()
      dialog.open()

      expect(dialog.getState().previouslyFocusedElement).toBe(button)

      button.remove()
    })

    it('should add dialog-open class to body', () => {
      const dialog = new BaseDialog()
      dialog.open()

      expect(document.body.classList.contains('dialog-open')).toBe(true)
    })

    it('should not open again if already open', () => {
      const dialog = new BaseDialog()
      dialog.open()
      dialog.open()

      expect(document.querySelectorAll('.dialog-base').length).toBe(1)
    })

    it('should call onOpen callback', () => {
      const onOpen = vi.fn()
      const dialog = new BaseDialog({}, { onOpen })
      dialog.open()

      expect(onOpen).toHaveBeenCalledTimes(1)
    })
  })

  describe('Closing Dialog', () => {
    it('should remove dialog when close() is called', () => {
      const dialog = new BaseDialog()
      dialog.open()
      dialog.close()

      expect(document.querySelector('.dialog-base')).toBeNull()
      expect(document.querySelector('.dialog-overlay')).toBeNull()
    })

    it('should set isOpen state to false', () => {
      const dialog = new BaseDialog()
      dialog.open()
      dialog.close()

      expect(dialog.getState().isOpen).toBe(false)
    })

    it('should remove dialog-open class from body', () => {
      const dialog = new BaseDialog()
      dialog.open()
      dialog.close()

      expect(document.body.classList.contains('dialog-open')).toBe(false)
    })

    it('should restore focus to previously focused element', () => {
      const button = document.createElement('button')
      document.body.appendChild(button)
      button.focus()

      const dialog = new BaseDialog()
      dialog.open()
      dialog.close()

      expect(document.activeElement).toBe(button)

      button.remove()
    })

    it('should call onClose callback', () => {
      const onClose = vi.fn()
      const dialog = new BaseDialog({}, { onClose })
      dialog.open()
      dialog.close()

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should do nothing if not open', () => {
      const onClose = vi.fn()
      const dialog = new BaseDialog({}, { onClose })
      dialog.close()

      expect(onClose).not.toHaveBeenCalled()
    })
  })

  describe('Size Variants', () => {
    const sizes: Array<{ size: any, expected: string }> = [
      { size: 'XS', expected: 'XS' },
      { size: 'S', expected: 'S' },
      { size: 'M', expected: 'M' },
      { size: 'L', expected: 'L' },
      { size: 'XL', expected: 'XL' },
      { size: 'XXL', expected: 'XXL' },
      { size: 'FULL', expected: 'FULL' },
    ]

    sizes.forEach(({ size, expected }) => {
      it(`should apply data-size="${expected}" for size="${size}"`, () => {
        const dialog = new BaseDialog({ size })
        dialog.open()

        const dialogEl = document.querySelector('.dialog-base')
        expect(dialogEl?.getAttribute('data-size')).toBe(expected)
      })
    })

    it('should default to M size if not specified', () => {
      const dialog = new BaseDialog()
      dialog.open()

      const dialogEl = document.querySelector('.dialog-base')
      expect(dialogEl?.getAttribute('data-size')).toBe('M')
    })
  })

  describe('Accessibility', () => {
    it('should have role="dialog"', () => {
      const dialog = new BaseDialog()
      dialog.open()

      const dialogEl = document.querySelector('.dialog-base')
      expect(dialogEl?.getAttribute('role')).toBe('dialog')
    })

    it('should have aria-modal="true"', () => {
      const dialog = new BaseDialog()
      dialog.open()

      const dialogEl = document.querySelector('.dialog-base')
      expect(dialogEl?.getAttribute('aria-modal')).toBe('true')
    })

    it('should set aria-label when provided', () => {
      const dialog = new BaseDialog({ ariaLabel: 'Test Dialog' })
      dialog.open()

      const dialogEl = document.querySelector('.dialog-base')
      expect(dialogEl?.getAttribute('aria-label')).toBe('Test Dialog')
    })

    it('should set aria-labelledby when provided', () => {
      const dialog = new BaseDialog({ ariaLabelledby: 'dialog-title' })
      dialog.open()

      const dialogEl = document.querySelector('.dialog-base')
      expect(dialogEl?.getAttribute('aria-labelledby')).toBe('dialog-title')
    })

    it('should set aria-describedby when provided', () => {
      const dialog = new BaseDialog({ ariaDescribedby: 'dialog-description' })
      dialog.open()

      const dialogEl = document.querySelector('.dialog-base')
      expect(dialogEl?.getAttribute('aria-describedby')).toBe('dialog-description')
    })
  })

  describe('Keyboard Navigation', () => {
    it('should close on Escape key by default', () => {
      const dialog = new BaseDialog()
      dialog.open()

      const event = new KeyboardEvent('keydown', { key: 'Escape' })
      document.dispatchEvent(event)

      expect(dialog.getState().isOpen).toBe(false)
    })

    it('should not close on Escape if closeOnEscape is false', () => {
      const dialog = new BaseDialog({ closeOnEscape: false })
      dialog.open()

      const event = new KeyboardEvent('keydown', { key: 'Escape' })
      document.dispatchEvent(event)

      expect(dialog.getState().isOpen).toBe(true)
    })

    it('should call onPressEscape callback', () => {
      const onPressEscape = vi.fn()
      const dialog = new BaseDialog({ onPressEscape })
      dialog.open()

      const event = new KeyboardEvent('keydown', { key: 'Escape' })
      document.dispatchEvent(event)

      expect(onPressEscape).toHaveBeenCalledTimes(1)
    })

    it('should not close if onPressEscape returns false', () => {
      const onPressEscape = vi.fn(() => false)
      const dialog = new BaseDialog({ onPressEscape })
      dialog.open()

      const event = new KeyboardEvent('keydown', { key: 'Escape' })
      document.dispatchEvent(event)

      expect(dialog.getState().isOpen).toBe(true)
    })
  })

  describe('Overlay Click Handling', () => {
    it('should close on overlay click by default', () => {
      const dialog = new BaseDialog()
      dialog.open()

      const overlay = document.querySelector('.dialog-overlay') as HTMLElement
      overlay.click()

      expect(dialog.getState().isOpen).toBe(false)
    })

    it('should not close on overlay click if closeOnOverlayClick is false', () => {
      const dialog = new BaseDialog({ closeOnOverlayClick: false })
      dialog.open()

      const overlay = document.querySelector('.dialog-overlay') as HTMLElement
      overlay.click()

      expect(dialog.getState().isOpen).toBe(true)
    })

    it('should call onClickOverlay callback', () => {
      const onClickOverlay = vi.fn()
      const dialog = new BaseDialog({ onClickOverlay })
      dialog.open()

      const overlay = document.querySelector('.dialog-overlay') as HTMLElement
      overlay.click()

      expect(onClickOverlay).toHaveBeenCalledTimes(1)
    })

    it('should not close if onClickOverlay returns false', () => {
      const onClickOverlay = vi.fn(() => false)
      const dialog = new BaseDialog({ onClickOverlay })
      dialog.open()

      const overlay = document.querySelector('.dialog-overlay') as HTMLElement
      overlay.click()

      expect(dialog.getState().isOpen).toBe(true)
    })
  })

  describe('Config Updates', () => {
    it('should update config and re-render when dialog is open', () => {
      const dialog = new BaseDialog({ size: 'M' })
      dialog.open()

      dialog.updateConfig({ size: 'L' })

      const dialogEl = document.querySelector('.dialog-base')
      expect(dialogEl?.getAttribute('data-size')).toBe('L')
    })

    it('should update config without rendering when dialog is closed', () => {
      const dialog = new BaseDialog({ size: 'M' })
      dialog.updateConfig({ size: 'L' })

      expect(document.querySelector('.dialog-base')).toBeNull()

      dialog.open()

      const dialogEl = document.querySelector('.dialog-base')
      expect(dialogEl?.getAttribute('data-size')).toBe('L')
    })
  })

  describe('getDialogElement', () => {
    it('should return dialog element when open', () => {
      const dialog = new BaseDialog()
      dialog.open()

      const element = dialog.getDialogElement()
      expect(element).toBeTruthy()
      expect(element?.classList.contains('dialog-base')).toBe(true)
    })

    it('should return null when closed', () => {
      const dialog = new BaseDialog()

      expect(dialog.getDialogElement()).toBeNull()
    })
  })

  describe('getOverlayElement', () => {
    it('should return overlay element when open', () => {
      const dialog = new BaseDialog()
      dialog.open()

      const element = dialog.getOverlayElement()
      expect(element).toBeTruthy()
      expect(element?.classList.contains('dialog-overlay')).toBe(true)
    })

    it('should return null when closed', () => {
      const dialog = new BaseDialog()

      expect(dialog.getOverlayElement()).toBeNull()
    })
  })

  describe('Event Cleanup', () => {
    it('should remove keydown listener when closed', () => {
      const dialog = new BaseDialog()
      dialog.open()
      dialog.close()

      // Open a new dialog to ensure old listeners don't interfere
      const dialog2 = new BaseDialog()
      dialog2.open()

      const event = new KeyboardEvent('keydown', { key: 'Escape' })
      document.dispatchEvent(event)

      // Only the second dialog should close
      expect(document.querySelectorAll('.dialog-base').length).toBe(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle rapid open/close cycles', () => {
      const dialog = new BaseDialog()

      dialog.open()
      dialog.close()
      dialog.open()
      dialog.close()
      dialog.open()

      expect(document.querySelectorAll('.dialog-base').length).toBe(1)
      expect(dialog.getState().isOpen).toBe(true)
    })

    it('should handle missing callbacks gracefully', () => {
      const dialog = new BaseDialog()

      expect(() => {
        dialog.open()
        dialog.close()
      }).not.toThrow()
    })
  })

  describe('Custom Class Name', () => {
    it('should apply custom class name', () => {
      const dialog = new BaseDialog({ className: 'my-custom-dialog' })
      dialog.open()

      const dialogEl = document.querySelector('.dialog-base')
      expect(dialogEl?.classList.contains('my-custom-dialog')).toBe(true)
    })
  })
})

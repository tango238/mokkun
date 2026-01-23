/**
 * FloatArea Component Tests
 * フローティング領域コンポーネントのテスト
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  FloatArea,
  createFloatArea,
  type FloatAreaConfig,
  type FloatAreaCallbacks,
} from '../renderer/components/float-area'

// =============================================================================
// Test Utilities
// =============================================================================

function createMockContainer(): HTMLElement {
  const container = document.createElement('div')
  document.body.appendChild(container)
  return container
}

function cleanupElement(element: HTMLElement | null): void {
  if (element && element.parentNode) {
    element.parentNode.removeChild(element)
  }
}

// =============================================================================
// FloatArea Component Tests
// =============================================================================

describe('FloatArea Component', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = createMockContainer()
  })

  afterEach(() => {
    cleanupElement(container)
    const floatAreas = document.querySelectorAll('.mokkun-float-area')
    floatAreas.forEach((area) => cleanupElement(area as HTMLElement))
  })

  // ===========================================================================
  // Initialization Tests
  // ===========================================================================

  describe('Initialization', () => {
    it('should initialize with required primaryButton', () => {
      const config: FloatAreaConfig = {
        primaryButton: { label: '保存' },
      }
      const floatArea = new FloatArea(container, config)

      expect(floatArea.getState().visible).toBe(true)
      expect(floatArea.getState().zIndex).toBe(500)

      floatArea.destroy()
    })

    it('should initialize with custom zIndex', () => {
      const config: FloatAreaConfig = {
        primaryButton: { label: '保存' },
        zIndex: 1000,
      }
      const floatArea = new FloatArea(container, config)

      expect(floatArea.getState().zIndex).toBe(1000)

      floatArea.destroy()
    })

    it('should create float area using factory function', () => {
      const config: FloatAreaConfig = {
        primaryButton: { label: '保存' },
      }
      const floatArea = createFloatArea(container, config)

      expect(floatArea).toBeInstanceOf(FloatArea)

      floatArea.destroy()
    })
  })

  // ===========================================================================
  // Button Rendering Tests
  // ===========================================================================

  describe('Button Rendering', () => {
    it('should render primary button', () => {
      const floatArea = new FloatArea(container, {
        primaryButton: { label: '保存する' },
      })
      floatArea.render()

      const button = container.querySelector('.float-area-btn-primary')
      expect(button).toBeTruthy()
      expect(button?.textContent).toBe('保存する')

      floatArea.destroy()
    })

    it('should render secondary button when provided', () => {
      const floatArea = new FloatArea(container, {
        primaryButton: { label: '保存' },
        secondaryButton: { label: 'キャンセル' },
      })
      floatArea.render()

      const secondaryBtn = container.querySelector('.float-area-btn-secondary')
      expect(secondaryBtn).toBeTruthy()
      expect(secondaryBtn?.textContent).toBe('キャンセル')

      floatArea.destroy()
    })

    it('should render tertiary button when provided', () => {
      const floatArea = new FloatArea(container, {
        primaryButton: { label: '保存' },
        tertiaryButton: { label: '削除' },
      })
      floatArea.render()

      const tertiaryBtn = container.querySelector('.float-area-tertiary .float-area-btn')
      expect(tertiaryBtn).toBeTruthy()
      expect(tertiaryBtn?.textContent).toBe('削除')

      floatArea.destroy()
    })

    it('should render all three buttons', () => {
      const floatArea = new FloatArea(container, {
        primaryButton: { label: '保存' },
        secondaryButton: { label: 'キャンセル' },
        tertiaryButton: { label: '削除' },
      })
      floatArea.render()

      expect(container.querySelector('.float-area-btn-primary')).toBeTruthy()
      expect(container.querySelector('.float-area-btn-secondary')).toBeTruthy()
      expect(container.querySelector('.float-area-tertiary')).toBeTruthy()

      floatArea.destroy()
    })

    it('should support danger variant for primary button', () => {
      const floatArea = new FloatArea(container, {
        primaryButton: { label: '削除', variant: 'danger' },
      })
      floatArea.render()

      const button = container.querySelector('.float-area-btn-danger')
      expect(button).toBeTruthy()

      floatArea.destroy()
    })

    it('should disable button when disabled is true', () => {
      const floatArea = new FloatArea(container, {
        primaryButton: { label: '保存', disabled: true },
      })
      floatArea.render()

      const button = container.querySelector('.float-area-btn-primary') as HTMLButtonElement
      expect(button?.disabled).toBe(true)

      floatArea.destroy()
    })
  })

  // ===========================================================================
  // Button Click Tests
  // ===========================================================================

  describe('Button Clicks', () => {
    it('should call onClick when primary button clicked', () => {
      const onClick = vi.fn()
      const floatArea = new FloatArea(container, {
        primaryButton: { label: '保存', onClick },
      })
      floatArea.render()

      const button = container.querySelector('.float-area-btn-primary') as HTMLButtonElement
      button.click()

      expect(onClick).toHaveBeenCalledTimes(1)

      floatArea.destroy()
    })

    it('should call onPrimaryClick callback', () => {
      const onPrimaryClick = vi.fn()
      const floatArea = new FloatArea(
        container,
        { primaryButton: { label: '保存' } },
        { onPrimaryClick }
      )
      floatArea.render()

      const button = container.querySelector('.float-area-btn-primary') as HTMLButtonElement
      button.click()

      expect(onPrimaryClick).toHaveBeenCalledTimes(1)

      floatArea.destroy()
    })

    it('should call onSecondaryClick callback', () => {
      const onSecondaryClick = vi.fn()
      const floatArea = new FloatArea(
        container,
        {
          primaryButton: { label: '保存' },
          secondaryButton: { label: 'キャンセル' },
        },
        { onSecondaryClick }
      )
      floatArea.render()

      const button = container.querySelector('.float-area-btn-secondary') as HTMLButtonElement
      button.click()

      expect(onSecondaryClick).toHaveBeenCalledTimes(1)

      floatArea.destroy()
    })

    it('should call onTertiaryClick callback', () => {
      const onTertiaryClick = vi.fn()
      const floatArea = new FloatArea(
        container,
        {
          primaryButton: { label: '保存' },
          tertiaryButton: { label: '削除' },
        },
        { onTertiaryClick }
      )
      floatArea.render()

      const button = container.querySelector('.float-area-tertiary .float-area-btn') as HTMLButtonElement
      button.click()

      expect(onTertiaryClick).toHaveBeenCalledTimes(1)

      floatArea.destroy()
    })

    it('should not call onClick when button is disabled', () => {
      const onClick = vi.fn()
      const floatArea = new FloatArea(container, {
        primaryButton: { label: '保存', disabled: true, onClick },
      })
      floatArea.render()

      const button = container.querySelector('.float-area-btn-primary') as HTMLButtonElement
      button.click()

      expect(onClick).not.toHaveBeenCalled()

      floatArea.destroy()
    })
  })

  // ===========================================================================
  // Response Message Tests
  // ===========================================================================

  describe('Response Message', () => {
    it('should render success message', () => {
      const floatArea = new FloatArea(container, {
        primaryButton: { label: '保存' },
        responseMessage: { text: '保存しました', type: 'success' },
      })
      floatArea.render()

      const message = container.querySelector('.float-area-message-success')
      expect(message).toBeTruthy()
      expect(message?.textContent).toContain('保存しました')

      floatArea.destroy()
    })

    it('should render error message', () => {
      const floatArea = new FloatArea(container, {
        primaryButton: { label: '保存' },
        responseMessage: { text: 'エラーが発生しました', type: 'error' },
      })
      floatArea.render()

      const message = container.querySelector('.float-area-message-error')
      expect(message).toBeTruthy()
      expect(message?.getAttribute('role')).toBe('alert')

      floatArea.destroy()
    })

    it('should set response message dynamically', () => {
      const floatArea = new FloatArea(container, {
        primaryButton: { label: '保存' },
      })
      floatArea.render()

      expect(container.querySelector('.float-area-message')).toBeFalsy()

      floatArea.setResponseMessage({ text: '成功', type: 'success' })

      expect(container.querySelector('.float-area-message-success')).toBeTruthy()

      floatArea.destroy()
    })

    it('should show success message using helper', () => {
      const floatArea = new FloatArea(container, {
        primaryButton: { label: '保存' },
      })
      floatArea.render()

      floatArea.showSuccess('保存しました')

      expect(container.querySelector('.float-area-message-success')).toBeTruthy()

      floatArea.destroy()
    })

    it('should show error message using helper', () => {
      const floatArea = new FloatArea(container, {
        primaryButton: { label: '保存' },
      })
      floatArea.render()

      floatArea.showError('エラー')

      expect(container.querySelector('.float-area-message-error')).toBeTruthy()

      floatArea.destroy()
    })

    it('should clear message', () => {
      const floatArea = new FloatArea(container, {
        primaryButton: { label: '保存' },
        responseMessage: { text: 'メッセージ', type: 'info' },
      })
      floatArea.render()

      expect(container.querySelector('.float-area-message')).toBeTruthy()

      floatArea.clearMessage()

      expect(container.querySelector('.float-area-message')).toBeFalsy()

      floatArea.destroy()
    })

    it('should render warning message', () => {
      const floatArea = new FloatArea(container, {
        primaryButton: { label: '保存' },
        responseMessage: { text: '注意', type: 'warning' },
      })
      floatArea.render()

      expect(container.querySelector('.float-area-message-warning')).toBeTruthy()

      floatArea.destroy()
    })

    it('should render info message', () => {
      const floatArea = new FloatArea(container, {
        primaryButton: { label: '保存' },
        responseMessage: { text: '情報', type: 'info' },
      })
      floatArea.render()

      expect(container.querySelector('.float-area-message-info')).toBeTruthy()

      floatArea.destroy()
    })
  })

  // ===========================================================================
  // Visibility Tests
  // ===========================================================================

  describe('Visibility', () => {
    it('should be visible by default', () => {
      const floatArea = new FloatArea(container, {
        primaryButton: { label: '保存' },
      })
      floatArea.render()

      expect(floatArea.isVisible()).toBe(true)
      expect(container.querySelector('.float-area-hidden')).toBeFalsy()

      floatArea.destroy()
    })

    it('should hide when hide() is called', () => {
      const floatArea = new FloatArea(container, {
        primaryButton: { label: '保存' },
      })
      floatArea.render()

      floatArea.hide()

      expect(floatArea.isVisible()).toBe(false)
      expect(container.querySelector('.float-area-hidden')).toBeTruthy()

      floatArea.destroy()
    })

    it('should show when show() is called', () => {
      const floatArea = new FloatArea(container, {
        primaryButton: { label: '保存' },
      })
      floatArea.render()
      floatArea.hide()

      floatArea.show()

      expect(floatArea.isVisible()).toBe(true)

      floatArea.destroy()
    })

    it('should toggle visibility', () => {
      const floatArea = new FloatArea(container, {
        primaryButton: { label: '保存' },
      })
      floatArea.render()

      expect(floatArea.isVisible()).toBe(true)

      floatArea.toggle()
      expect(floatArea.isVisible()).toBe(false)

      floatArea.toggle()
      expect(floatArea.isVisible()).toBe(true)

      floatArea.destroy()
    })

    it('should call onShow callback', () => {
      const onShow = vi.fn()
      const floatArea = new FloatArea(
        container,
        { primaryButton: { label: '保存' } },
        { onShow }
      )
      floatArea.render()
      floatArea.hide()

      floatArea.show()

      expect(onShow).toHaveBeenCalledTimes(1)

      floatArea.destroy()
    })

    it('should call onHide callback', () => {
      const onHide = vi.fn()
      const floatArea = new FloatArea(
        container,
        { primaryButton: { label: '保存' } },
        { onHide }
      )
      floatArea.render()

      floatArea.hide()

      expect(onHide).toHaveBeenCalledTimes(1)

      floatArea.destroy()
    })
  })

  // ===========================================================================
  // z-index Tests
  // ===========================================================================

  describe('z-index', () => {
    it('should use default z-index of 500', () => {
      const floatArea = new FloatArea(container, {
        primaryButton: { label: '保存' },
      })
      floatArea.render()

      const element = container.querySelector('.mokkun-float-area') as HTMLElement
      expect(element?.style.zIndex).toBe('500')

      floatArea.destroy()
    })

    it('should use custom z-index', () => {
      const floatArea = new FloatArea(container, {
        primaryButton: { label: '保存' },
        zIndex: 1000,
      })
      floatArea.render()

      const element = container.querySelector('.mokkun-float-area') as HTMLElement
      expect(element?.style.zIndex).toBe('1000')

      floatArea.destroy()
    })

    it('should update z-index dynamically', () => {
      const floatArea = new FloatArea(container, {
        primaryButton: { label: '保存' },
      })
      floatArea.render()

      floatArea.setZIndex(2000)

      const element = container.querySelector('.mokkun-float-area') as HTMLElement
      expect(element?.style.zIndex).toBe('2000')

      floatArea.destroy()
    })
  })

  // ===========================================================================
  // Update Primary Button Tests
  // ===========================================================================

  describe('Update Primary Button', () => {
    it('should update primary button label', () => {
      const floatArea = new FloatArea(container, {
        primaryButton: { label: '保存' },
      })
      floatArea.render()

      floatArea.updatePrimaryButton({ label: '更新' })

      const button = container.querySelector('.float-area-btn-primary')
      expect(button?.textContent).toBe('更新')

      floatArea.destroy()
    })

    it('should set primary button disabled', () => {
      const floatArea = new FloatArea(container, {
        primaryButton: { label: '保存' },
      })
      floatArea.render()

      floatArea.setPrimaryDisabled(true)

      const button = container.querySelector('.float-area-btn-primary') as HTMLButtonElement
      expect(button?.disabled).toBe(true)

      floatArea.destroy()
    })
  })

  // ===========================================================================
  // Accessibility Tests
  // ===========================================================================

  describe('Accessibility', () => {
    it('should have role="region"', () => {
      const floatArea = new FloatArea(container, {
        primaryButton: { label: '保存' },
      })
      floatArea.render()

      const element = container.querySelector('.mokkun-float-area')
      expect(element?.getAttribute('role')).toBe('region')

      floatArea.destroy()
    })

    it('should have default aria-label', () => {
      const floatArea = new FloatArea(container, {
        primaryButton: { label: '保存' },
      })
      floatArea.render()

      const element = container.querySelector('.mokkun-float-area')
      expect(element?.getAttribute('aria-label')).toBe('アクション')

      floatArea.destroy()
    })

    it('should use custom aria-label', () => {
      const floatArea = new FloatArea(container, {
        primaryButton: { label: '保存' },
        ariaLabel: 'フォーム操作',
      })
      floatArea.render()

      const element = container.querySelector('.mokkun-float-area')
      expect(element?.getAttribute('aria-label')).toBe('フォーム操作')

      floatArea.destroy()
    })

    it('should update aria-hidden on visibility change', () => {
      const floatArea = new FloatArea(container, {
        primaryButton: { label: '保存' },
      })
      floatArea.render()

      const element = container.querySelector('.mokkun-float-area')
      expect(element?.getAttribute('aria-hidden')).toBe('false')

      floatArea.hide()
      expect(element?.getAttribute('aria-hidden')).toBe('true')

      floatArea.destroy()
    })

    it('should have role="alert" for error messages', () => {
      const floatArea = new FloatArea(container, {
        primaryButton: { label: '保存' },
        responseMessage: { text: 'エラー', type: 'error' },
      })
      floatArea.render()

      const message = container.querySelector('.float-area-message')
      expect(message?.getAttribute('role')).toBe('alert')

      floatArea.destroy()
    })

    it('should have role="status" for success messages', () => {
      const floatArea = new FloatArea(container, {
        primaryButton: { label: '保存' },
        responseMessage: { text: '成功', type: 'success' },
      })
      floatArea.render()

      const message = container.querySelector('.float-area-message')
      expect(message?.getAttribute('role')).toBe('status')

      floatArea.destroy()
    })
  })

  // ===========================================================================
  // Layout Tests
  // ===========================================================================

  describe('Layout', () => {
    it('should render inner container', () => {
      const floatArea = new FloatArea(container, {
        primaryButton: { label: '保存' },
      })
      floatArea.render()

      expect(container.querySelector('.float-area-inner')).toBeTruthy()

      floatArea.destroy()
    })

    it('should render main area', () => {
      const floatArea = new FloatArea(container, {
        primaryButton: { label: '保存' },
      })
      floatArea.render()

      expect(container.querySelector('.float-area-main')).toBeTruthy()

      floatArea.destroy()
    })

    it('should render button group', () => {
      const floatArea = new FloatArea(container, {
        primaryButton: { label: '保存' },
      })
      floatArea.render()

      expect(container.querySelector('.float-area-buttons')).toBeTruthy()

      floatArea.destroy()
    })
  })

  // ===========================================================================
  // Cleanup Tests
  // ===========================================================================

  describe('Cleanup', () => {
    it('should remove element on destroy', () => {
      const floatArea = new FloatArea(container, {
        primaryButton: { label: '保存' },
      })
      floatArea.render()

      expect(container.querySelector('.mokkun-float-area')).toBeTruthy()

      floatArea.destroy()

      expect(container.querySelector('.mokkun-float-area')).toBeFalsy()
    })
  })
})

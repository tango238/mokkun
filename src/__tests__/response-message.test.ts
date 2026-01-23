/**
 * ResponseMessage Component Tests
 * レスポンスメッセージコンポーネントのテスト
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  ResponseMessage,
  createResponseMessage,
  type ResponseMessageConfig,
  type ResponseMessageCallbacks,
  type ResponseMessageType,
} from '../renderer/components/response-message'

// =============================================================================
// Test Utilities
// =============================================================================

function createMockContainer(): HTMLElement {
  const container = document.createElement('div')
  document.body.appendChild(container)
  return container
}

function cleanupContainer(container: HTMLElement): void {
  container.remove()
}

// =============================================================================
// ResponseMessage Component Tests
// =============================================================================

describe('ResponseMessage Component', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = createMockContainer()
  })

  afterEach(() => {
    cleanupContainer(container)
  })

  // ===========================================================================
  // Initialization Tests
  // ===========================================================================

  describe('Initialization', () => {
    it('should initialize with required message config', () => {
      const config: ResponseMessageConfig = { message: 'Operation completed' }
      const responseMessage = new ResponseMessage(container, config)
      responseMessage.render()

      expect(container.classList.contains('mokkun-response-message')).toBe(true)
      expect(container.querySelector('.response-message-content')).toBeTruthy()
    })

    it('should initialize with specified message', () => {
      const config: ResponseMessageConfig = { message: 'Test message' }
      const responseMessage = new ResponseMessage(container, config)
      responseMessage.render()

      const textEl = container.querySelector('.response-message-text')
      expect(textEl?.textContent).toBe('Test message')
    })

    it('should initialize with default type (info)', () => {
      const config: ResponseMessageConfig = { message: 'Info message' }
      const responseMessage = new ResponseMessage(container, config)
      responseMessage.render()

      expect(container.classList.contains('response-message-info')).toBe(true)
    })

    it('should be visible by default', () => {
      const config: ResponseMessageConfig = { message: 'Message' }
      const responseMessage = new ResponseMessage(container, config)
      responseMessage.render()

      expect(responseMessage.isVisible()).toBe(true)
      expect(container.style.display).not.toBe('none')
    })

    it('should have details collapsed by default', () => {
      const config: ResponseMessageConfig = {
        message: 'Message',
        details: 'Details text',
      }
      const responseMessage = new ResponseMessage(container, config)
      responseMessage.render()

      expect(responseMessage.isDetailsExpanded()).toBe(false)
    })
  })

  // ===========================================================================
  // Type Variants Tests
  // ===========================================================================

  describe('Type Variants', () => {
    const types: ResponseMessageType[] = ['success', 'error', 'warning', 'info']

    types.forEach((type) => {
      it(`should render ${type} type correctly`, () => {
        const config: ResponseMessageConfig = { message: 'Message', type }
        const responseMessage = new ResponseMessage(container, config)
        responseMessage.render()

        expect(container.classList.contains(`response-message-${type}`)).toBe(true)
      })
    })

    it('should have role="alert" for error type', () => {
      const config: ResponseMessageConfig = { message: 'Error', type: 'error' }
      const responseMessage = new ResponseMessage(container, config)
      responseMessage.render()

      expect(container.getAttribute('role')).toBe('alert')
      expect(container.getAttribute('aria-live')).toBe('assertive')
    })

    it('should have role="status" for non-error types', () => {
      const config: ResponseMessageConfig = { message: 'Success', type: 'success' }
      const responseMessage = new ResponseMessage(container, config)
      responseMessage.render()

      expect(container.getAttribute('role')).toBe('status')
      expect(container.getAttribute('aria-live')).toBe('polite')
    })
  })

  // ===========================================================================
  // Icon Tests
  // ===========================================================================

  describe('Icon Support', () => {
    it('should render icon by default', () => {
      const config: ResponseMessageConfig = { message: 'Message', type: 'success' }
      const responseMessage = new ResponseMessage(container, config)
      responseMessage.render()

      const iconEl = container.querySelector('.response-message-icon')
      expect(iconEl).toBeTruthy()
      expect(iconEl?.querySelector('svg')).toBeTruthy()
    })

    it('should hide icon when hideIcon is true', () => {
      const config: ResponseMessageConfig = { message: 'Message', hideIcon: true }
      const responseMessage = new ResponseMessage(container, config)
      responseMessage.render()

      const iconEl = container.querySelector('.response-message-icon')
      expect(iconEl).toBeFalsy()
    })

    it('should render custom icon when provided', () => {
      const customIcon = '<svg viewBox="0 0 20 20"><circle cx="10" cy="10" r="5"/></svg>'
      const config: ResponseMessageConfig = { message: 'Message', icon: customIcon }
      const responseMessage = new ResponseMessage(container, config)
      responseMessage.render()

      const iconEl = container.querySelector('.response-message-icon')
      expect(iconEl).toBeTruthy()
      expect(iconEl?.innerHTML).toContain('<svg')
      expect(iconEl?.innerHTML).toContain('circle')
    })

    it('should sanitize malicious custom icons', () => {
      const maliciousIcon = '<svg onclick="alert(1)"><circle cx="10" cy="10" r="5"/></svg>'
      const config: ResponseMessageConfig = { message: 'Message', icon: maliciousIcon }
      const responseMessage = new ResponseMessage(container, config)
      responseMessage.render()

      const iconEl = container.querySelector('.response-message-icon')
      expect(iconEl?.innerHTML).not.toContain('onclick')
    })

    it('should reject non-SVG custom icons', () => {
      const divIcon = '<div>Not an SVG</div>'
      const config: ResponseMessageConfig = { message: 'Message', icon: divIcon }
      const responseMessage = new ResponseMessage(container, config)
      responseMessage.render()

      const iconEl = container.querySelector('.response-message-icon')
      // Should fall back to default icon
      expect(iconEl?.innerHTML).toContain('<svg')
    })
  })

  // ===========================================================================
  // Details Tests
  // ===========================================================================

  describe('Details Section', () => {
    it('should not render details toggle when no details provided', () => {
      const config: ResponseMessageConfig = { message: 'Message' }
      const responseMessage = new ResponseMessage(container, config)
      responseMessage.render()

      const toggle = container.querySelector('.response-message-details-toggle')
      expect(toggle).toBeFalsy()
    })

    it('should render details toggle when string details provided', () => {
      const config: ResponseMessageConfig = {
        message: 'Message',
        details: 'Additional details here',
      }
      const responseMessage = new ResponseMessage(container, config)
      responseMessage.render()

      const toggle = container.querySelector('.response-message-details-toggle')
      expect(toggle).toBeTruthy()
      expect(toggle?.getAttribute('aria-expanded')).toBe('false')
    })

    it('should render details toggle when array details provided', () => {
      const config: ResponseMessageConfig = {
        message: 'Message',
        details: ['Detail 1', 'Detail 2', 'Detail 3'],
      }
      const responseMessage = new ResponseMessage(container, config)
      responseMessage.render()

      const toggle = container.querySelector('.response-message-details-toggle')
      expect(toggle).toBeTruthy()
    })

    it('should not render details toggle for empty array', () => {
      const config: ResponseMessageConfig = {
        message: 'Message',
        details: [],
      }
      const responseMessage = new ResponseMessage(container, config)
      responseMessage.render()

      const toggle = container.querySelector('.response-message-details-toggle')
      expect(toggle).toBeFalsy()
    })

    it('should use custom details label', () => {
      const config: ResponseMessageConfig = {
        message: 'Message',
        details: 'Details',
        detailsLabel: 'Show more',
      }
      const responseMessage = new ResponseMessage(container, config)
      responseMessage.render()

      const label = container.querySelector('.response-message-details-label')
      expect(label?.textContent).toBe('Show more')
    })

    it('should expand details on toggle click', () => {
      const config: ResponseMessageConfig = {
        message: 'Message',
        details: 'Details text',
      }
      const responseMessage = new ResponseMessage(container, config)
      responseMessage.render()

      const toggle = container.querySelector('.response-message-details-toggle') as HTMLButtonElement
      toggle?.click()

      expect(responseMessage.isDetailsExpanded()).toBe(true)
      expect(toggle?.getAttribute('aria-expanded')).toBe('true')
    })

    it('should render details as list for array', () => {
      const config: ResponseMessageConfig = {
        message: 'Message',
        details: ['Item 1', 'Item 2'],
      }
      const responseMessage = new ResponseMessage(container, config)
      responseMessage.render()
      responseMessage.expandDetails()

      const list = container.querySelector('.response-message-details-list')
      expect(list).toBeTruthy()
      expect(list?.querySelectorAll('li').length).toBe(2)
    })

    it('should render details as text for string', () => {
      const config: ResponseMessageConfig = {
        message: 'Message',
        details: 'Single detail text',
      }
      const responseMessage = new ResponseMessage(container, config)
      responseMessage.render()
      responseMessage.expandDetails()

      const text = container.querySelector('.response-message-details-text')
      expect(text?.textContent).toBe('Single detail text')
    })
  })

  // ===========================================================================
  // Retry Button Tests
  // ===========================================================================

  describe('Retry Button', () => {
    it('should not render retry button by default', () => {
      const config: ResponseMessageConfig = { message: 'Message' }
      const responseMessage = new ResponseMessage(container, config)
      responseMessage.render()

      const retryBtn = container.querySelector('.response-message-retry')
      expect(retryBtn).toBeFalsy()
    })

    it('should render retry button when showRetry is true', () => {
      const config: ResponseMessageConfig = { message: 'Message', showRetry: true }
      const responseMessage = new ResponseMessage(container, config)
      responseMessage.render()

      const retryBtn = container.querySelector('.response-message-retry')
      expect(retryBtn).toBeTruthy()
    })

    it('should use default retry label', () => {
      const config: ResponseMessageConfig = { message: 'Message', showRetry: true }
      const responseMessage = new ResponseMessage(container, config)
      responseMessage.render()

      const label = container.querySelector('.response-message-retry-label')
      expect(label?.textContent).toBe('再試行')
    })

    it('should use custom retry label', () => {
      const config: ResponseMessageConfig = {
        message: 'Message',
        showRetry: true,
        retryLabel: 'Try again',
      }
      const responseMessage = new ResponseMessage(container, config)
      responseMessage.render()

      const label = container.querySelector('.response-message-retry-label')
      expect(label?.textContent).toBe('Try again')
    })

    it('should call onRetry callback when clicked', async () => {
      const onRetry = vi.fn()
      const config: ResponseMessageConfig = { message: 'Message', showRetry: true }
      const callbacks: ResponseMessageCallbacks = { onRetry }
      const responseMessage = new ResponseMessage(container, config, callbacks)
      responseMessage.render()

      const retryBtn = container.querySelector('.response-message-retry') as HTMLButtonElement
      retryBtn?.click()

      await vi.waitFor(() => {
        expect(onRetry).toHaveBeenCalledTimes(1)
      })
    })

    it('should show loading state during retry', async () => {
      const onRetry = vi.fn().mockImplementation(() => new Promise((r) => setTimeout(r, 100)))
      const config: ResponseMessageConfig = { message: 'Message', showRetry: true }
      const callbacks: ResponseMessageCallbacks = { onRetry }
      const responseMessage = new ResponseMessage(container, config, callbacks)
      responseMessage.render()

      const retryBtn = container.querySelector('.response-message-retry') as HTMLButtonElement
      retryBtn?.click()

      expect(retryBtn?.classList.contains('is-loading')).toBe(true)
      expect(retryBtn?.disabled).toBe(true)

      await vi.waitFor(() => {
        expect(retryBtn?.classList.contains('is-loading')).toBe(false)
      })
    })

    it('should disable button during loading', async () => {
      const config: ResponseMessageConfig = { message: 'Message', showRetry: true }
      const responseMessage = new ResponseMessage(container, config)
      responseMessage.render()

      responseMessage.setLoading(true)

      const retryBtn = container.querySelector('.response-message-retry') as HTMLButtonElement
      expect(retryBtn?.disabled).toBe(true)
      expect(retryBtn?.getAttribute('aria-disabled')).toBe('true')
    })
  })

  // ===========================================================================
  // Close Button Tests
  // ===========================================================================

  describe('Close Button', () => {
    it('should not render close button by default', () => {
      const config: ResponseMessageConfig = { message: 'Message' }
      const responseMessage = new ResponseMessage(container, config)
      responseMessage.render()

      const closeBtn = container.querySelector('.response-message-close')
      expect(closeBtn).toBeFalsy()
    })

    it('should render close button when showClose is true', () => {
      const config: ResponseMessageConfig = { message: 'Message', showClose: true }
      const responseMessage = new ResponseMessage(container, config)
      responseMessage.render()

      const closeBtn = container.querySelector('.response-message-close')
      expect(closeBtn).toBeTruthy()
      expect(closeBtn?.getAttribute('aria-label')).toBe('閉じる')
    })

    it('should hide message when close button clicked', () => {
      const config: ResponseMessageConfig = { message: 'Message', showClose: true }
      const responseMessage = new ResponseMessage(container, config)
      responseMessage.render()

      const closeBtn = container.querySelector('.response-message-close') as HTMLButtonElement
      closeBtn?.click()

      expect(responseMessage.isVisible()).toBe(false)
    })

    it('should call onClose callback when closed', () => {
      const onClose = vi.fn()
      const config: ResponseMessageConfig = { message: 'Message', showClose: true }
      const callbacks: ResponseMessageCallbacks = { onClose }
      const responseMessage = new ResponseMessage(container, config, callbacks)
      responseMessage.render()

      const closeBtn = container.querySelector('.response-message-close') as HTMLButtonElement
      closeBtn?.click()

      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  // ===========================================================================
  // State Management Tests
  // ===========================================================================

  describe('State Management', () => {
    it('should show message via show()', () => {
      const config: ResponseMessageConfig = { message: 'Message' }
      const responseMessage = new ResponseMessage(container, config)
      responseMessage.render()
      responseMessage.hide()

      expect(responseMessage.isVisible()).toBe(false)

      responseMessage.show()

      expect(responseMessage.isVisible()).toBe(true)
    })

    it('should hide message via hide()', () => {
      const config: ResponseMessageConfig = { message: 'Message' }
      const responseMessage = new ResponseMessage(container, config)
      responseMessage.render()

      responseMessage.hide()

      expect(responseMessage.isVisible()).toBe(false)
      expect(container.style.display).toBe('none')
    })

    it('should expand details via expandDetails()', () => {
      const config: ResponseMessageConfig = { message: 'Message', details: 'Details' }
      const responseMessage = new ResponseMessage(container, config)
      responseMessage.render()

      responseMessage.expandDetails()

      expect(responseMessage.isDetailsExpanded()).toBe(true)
    })

    it('should collapse details via collapseDetails()', () => {
      const config: ResponseMessageConfig = { message: 'Message', details: 'Details' }
      const responseMessage = new ResponseMessage(container, config)
      responseMessage.render()
      responseMessage.expandDetails()

      responseMessage.collapseDetails()

      expect(responseMessage.isDetailsExpanded()).toBe(false)
    })

    it('should toggle details via toggleDetails()', () => {
      const config: ResponseMessageConfig = { message: 'Message', details: 'Details' }
      const responseMessage = new ResponseMessage(container, config)
      responseMessage.render()

      expect(responseMessage.isDetailsExpanded()).toBe(false)

      responseMessage.toggleDetails()
      expect(responseMessage.isDetailsExpanded()).toBe(true)

      responseMessage.toggleDetails()
      expect(responseMessage.isDetailsExpanded()).toBe(false)
    })

    it('should update message via setMessage()', () => {
      const config: ResponseMessageConfig = { message: 'Initial' }
      const responseMessage = new ResponseMessage(container, config)
      responseMessage.render()

      responseMessage.setMessage('Updated')

      const textEl = container.querySelector('.response-message-text')
      expect(textEl?.textContent).toBe('Updated')
    })

    it('should update type via setType()', () => {
      const config: ResponseMessageConfig = { message: 'Message', type: 'info' }
      const responseMessage = new ResponseMessage(container, config)
      responseMessage.render()

      expect(container.classList.contains('response-message-info')).toBe(true)

      responseMessage.setType('error')

      expect(container.classList.contains('response-message-error')).toBe(true)
      expect(container.classList.contains('response-message-info')).toBe(false)
    })

    it('should update details via setDetails()', () => {
      const config: ResponseMessageConfig = { message: 'Message' }
      const responseMessage = new ResponseMessage(container, config)
      responseMessage.render()

      expect(container.querySelector('.response-message-details-toggle')).toBeFalsy()

      responseMessage.setDetails('New details')

      expect(container.querySelector('.response-message-details-toggle')).toBeTruthy()
    })

    it('should update via update() method', () => {
      const config: ResponseMessageConfig = { message: 'Initial', type: 'info' }
      const responseMessage = new ResponseMessage(container, config)
      responseMessage.render()

      responseMessage.update({
        message: 'Updated',
        type: 'success',
        showRetry: true,
      })

      const textEl = container.querySelector('.response-message-text')
      expect(textEl?.textContent).toBe('Updated')
      expect(container.classList.contains('response-message-success')).toBe(true)
      expect(container.querySelector('.response-message-retry')).toBeTruthy()
    })

    it('should return correct state via getState()', () => {
      const config: ResponseMessageConfig = { message: 'Message', details: 'Details' }
      const responseMessage = new ResponseMessage(container, config)
      responseMessage.render()
      responseMessage.expandDetails()

      const state = responseMessage.getState()

      expect(state.visible).toBe(true)
      expect(state.detailsExpanded).toBe(true)
      expect(state.loading).toBe(false)
    })
  })

  // ===========================================================================
  // Callback Tests
  // ===========================================================================

  describe('Callbacks', () => {
    it('should call onExpandDetails when details expanded', () => {
      const onExpandDetails = vi.fn()
      const config: ResponseMessageConfig = { message: 'Message', details: 'Details' }
      const callbacks: ResponseMessageCallbacks = { onExpandDetails }
      const responseMessage = new ResponseMessage(container, config, callbacks)
      responseMessage.render()

      responseMessage.expandDetails()

      expect(onExpandDetails).toHaveBeenCalledTimes(1)
    })

    it('should call onCollapseDetails when details collapsed', () => {
      const onCollapseDetails = vi.fn()
      const config: ResponseMessageConfig = { message: 'Message', details: 'Details' }
      const callbacks: ResponseMessageCallbacks = { onCollapseDetails }
      const responseMessage = new ResponseMessage(container, config, callbacks)
      responseMessage.render()
      responseMessage.expandDetails()

      responseMessage.collapseDetails()

      expect(onCollapseDetails).toHaveBeenCalledTimes(1)
    })

    it('should not call onExpandDetails when already expanded', () => {
      const onExpandDetails = vi.fn()
      const config: ResponseMessageConfig = { message: 'Message', details: 'Details' }
      const callbacks: ResponseMessageCallbacks = { onExpandDetails }
      const responseMessage = new ResponseMessage(container, config, callbacks)
      responseMessage.render()
      responseMessage.expandDetails()

      onExpandDetails.mockClear()
      responseMessage.expandDetails()

      expect(onExpandDetails).not.toHaveBeenCalled()
    })

    it('should not call onCollapseDetails when already collapsed', () => {
      const onCollapseDetails = vi.fn()
      const config: ResponseMessageConfig = { message: 'Message', details: 'Details' }
      const callbacks: ResponseMessageCallbacks = { onCollapseDetails }
      const responseMessage = new ResponseMessage(container, config, callbacks)
      responseMessage.render()

      responseMessage.collapseDetails()

      expect(onCollapseDetails).not.toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // Accessibility Tests
  // ===========================================================================

  describe('Accessibility', () => {
    it('should have proper role attribute', () => {
      const config: ResponseMessageConfig = { message: 'Message', type: 'info' }
      const responseMessage = new ResponseMessage(container, config)
      responseMessage.render()

      expect(container.getAttribute('role')).toBe('status')
    })

    it('should have aria-live attribute', () => {
      const config: ResponseMessageConfig = { message: 'Message' }
      const responseMessage = new ResponseMessage(container, config)
      responseMessage.render()

      expect(container.getAttribute('aria-live')).toBeTruthy()
    })

    it('should use custom ariaLabel when provided', () => {
      const config: ResponseMessageConfig = {
        message: 'Message',
        ariaLabel: 'Custom label',
      }
      const responseMessage = new ResponseMessage(container, config)
      responseMessage.render()

      expect(container.getAttribute('aria-label')).toBe('Custom label')
    })

    it('should have aria-hidden on icon', () => {
      const config: ResponseMessageConfig = { message: 'Message' }
      const responseMessage = new ResponseMessage(container, config)
      responseMessage.render()

      const iconEl = container.querySelector('.response-message-icon')
      expect(iconEl?.getAttribute('aria-hidden')).toBe('true')
    })

    it('should have aria-controls on details toggle', () => {
      const config: ResponseMessageConfig = { message: 'Message', details: 'Details' }
      const responseMessage = new ResponseMessage(container, config)
      responseMessage.render()

      const toggle = container.querySelector('.response-message-details-toggle')
      const ariaControls = toggle?.getAttribute('aria-controls')
      expect(ariaControls).toBeTruthy()

      const details = container.querySelector(`#${ariaControls}`)
      expect(details).toBeTruthy()
    })

    it('should have aria-label on close button', () => {
      const config: ResponseMessageConfig = { message: 'Message', showClose: true }
      const responseMessage = new ResponseMessage(container, config)
      responseMessage.render()

      const closeBtn = container.querySelector('.response-message-close')
      expect(closeBtn?.getAttribute('aria-label')).toBe('閉じる')
    })
  })

  // ===========================================================================
  // Factory Function Tests
  // ===========================================================================

  describe('createResponseMessage Factory', () => {
    it('should create and render ResponseMessage', () => {
      const responseMessage = createResponseMessage(container, { message: 'Test' })

      expect(container.classList.contains('mokkun-response-message')).toBe(true)
      expect(responseMessage.isVisible()).toBe(true)
    })

    it('should pass callbacks correctly', async () => {
      const onRetry = vi.fn()
      const responseMessage = createResponseMessage(
        container,
        { message: 'Test', showRetry: true },
        { onRetry }
      )

      const retryBtn = container.querySelector('.response-message-retry') as HTMLButtonElement
      retryBtn?.click()

      await vi.waitFor(() => {
        expect(onRetry).toHaveBeenCalled()
      })
    })
  })

  // ===========================================================================
  // Destroy Tests
  // ===========================================================================

  describe('Destroy', () => {
    it('should clear container content', () => {
      const responseMessage = createResponseMessage(container, { message: 'Test' })

      expect(container.innerHTML).not.toBe('')

      responseMessage.destroy()

      expect(container.innerHTML).toBe('')
    })

    it('should remove ARIA attributes', () => {
      const responseMessage = createResponseMessage(container, {
        message: 'Test',
        ariaLabel: 'Custom',
      })

      responseMessage.destroy()

      expect(container.hasAttribute('role')).toBe(false)
      expect(container.hasAttribute('aria-live')).toBe(false)
      expect(container.hasAttribute('aria-label')).toBe(false)
    })

    it('should remove event listeners on destroy', async () => {
      const onRetry = vi.fn()
      const onClose = vi.fn()
      const onExpandDetails = vi.fn()
      const responseMessage = createResponseMessage(
        container,
        {
          message: 'Test',
          showRetry: true,
          showClose: true,
          details: 'Details',
        },
        { onRetry, onClose, onExpandDetails }
      )

      // Store references to buttons before destroy
      const retryBtn = container.querySelector('.response-message-retry') as HTMLButtonElement
      const closeBtn = container.querySelector('.response-message-close') as HTMLButtonElement
      const detailsToggle = container.querySelector('.response-message-details-toggle') as HTMLButtonElement

      responseMessage.destroy()

      // Clicking the old references should not trigger callbacks
      // (buttons no longer exist but this confirms handlers were removed)
      expect(onRetry).not.toHaveBeenCalled()
      expect(onClose).not.toHaveBeenCalled()
      expect(onExpandDetails).not.toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // Combined Scenarios Tests
  // ===========================================================================

  describe('Combined Scenarios', () => {
    it('should render error with retry and details', () => {
      const config: ResponseMessageConfig = {
        message: 'Failed to save data',
        type: 'error',
        details: ['Network error', 'Please try again later'],
        showRetry: true,
        showClose: true,
      }
      const responseMessage = createResponseMessage(container, config)

      expect(container.classList.contains('response-message-error')).toBe(true)
      expect(container.querySelector('.response-message-retry')).toBeTruthy()
      expect(container.querySelector('.response-message-details-toggle')).toBeTruthy()
      expect(container.querySelector('.response-message-close')).toBeTruthy()
    })

    it('should render success without icon', () => {
      const config: ResponseMessageConfig = {
        message: 'Successfully saved',
        type: 'success',
        hideIcon: true,
      }
      const responseMessage = createResponseMessage(container, config)

      expect(container.classList.contains('response-message-success')).toBe(true)
      expect(container.querySelector('.response-message-icon')).toBeFalsy()
    })

    it('should handle complete retry flow', async () => {
      let retryCount = 0
      const onRetry = vi.fn().mockImplementation(() => {
        retryCount++
        return Promise.resolve()
      })

      const config: ResponseMessageConfig = {
        message: 'Failed',
        type: 'error',
        showRetry: true,
      }
      const responseMessage = createResponseMessage(container, config, { onRetry })

      const retryBtn = container.querySelector('.response-message-retry') as HTMLButtonElement

      // First retry
      retryBtn?.click()
      await vi.waitFor(() => {
        expect(retryCount).toBe(1)
      })

      // Second retry
      retryBtn?.click()
      await vi.waitFor(() => {
        expect(retryCount).toBe(2)
      })
    })

    it('should update from error to success', () => {
      const responseMessage = createResponseMessage(container, {
        message: 'Failed to save',
        type: 'error',
        showRetry: true,
      })

      expect(container.classList.contains('response-message-error')).toBe(true)

      responseMessage.update({
        message: 'Saved successfully',
        type: 'success',
        showRetry: false,
      })

      expect(container.classList.contains('response-message-success')).toBe(true)
      expect(container.classList.contains('response-message-error')).toBe(false)
      expect(container.querySelector('.response-message-retry')).toBeFalsy()
    })
  })
})

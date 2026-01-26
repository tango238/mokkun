import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { AlertBanner, createAlertBanner } from '../renderer/components/alert-banner'
import type { AlertBannerType, AlertBannerConfig, AlertBannerCallbacks } from '../renderer/components/alert-banner'

function createMockContainer(): HTMLElement {
  const container = document.createElement('div')
  document.body.appendChild(container)
  return container
}

describe('AlertBanner Component', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = createMockContainer()
  })

  afterEach(() => {
    container.remove()
  })

  describe('Initialization', () => {
    it('should initialize with required message config', () => {
      const config: AlertBannerConfig = { message: 'Test alert' }
      const alertBanner = new AlertBanner(container, config)
      alertBanner.render()

      expect(container.classList.contains('mokkun-alert-banner')).toBe(true)
      expect(container.querySelector('.alert-banner-content')).toBeTruthy()
    })

    it('should initialize with default type "info"', () => {
      const config: AlertBannerConfig = { message: 'Test alert' }
      const alertBanner = new AlertBanner(container, config)
      alertBanner.render()

      expect(container.classList.contains('alert-banner-info')).toBe(true)
      expect(container.getAttribute('data-type')).toBe('info')
    })

    it('should initialize with specified type', () => {
      const types: AlertBannerType[] = ['info', 'warning', 'error', 'success']

      types.forEach(type => {
        const freshContainer = createMockContainer()
        const config: AlertBannerConfig = { message: 'Test', type }
        const alertBanner = new AlertBanner(freshContainer, config)
        alertBanner.render()

        expect(freshContainer.classList.contains(`alert-banner-${type}`)).toBe(true)
        expect(freshContainer.getAttribute('data-type')).toBe(type)

        freshContainer.remove()
      })
    })

    it('should initialize with closable set to true by default', () => {
      const config: AlertBannerConfig = { message: 'Test alert' }
      const alertBanner = new AlertBanner(container, config)
      alertBanner.render()

      expect(container.querySelector('.alert-banner-close')).toBeTruthy()
    })

    it('should initialize without close button when closable is false', () => {
      const config: AlertBannerConfig = { message: 'Test alert', closable: false }
      const alertBanner = new AlertBanner(container, config)
      alertBanner.render()

      expect(container.querySelector('.alert-banner-close')).toBeFalsy()
    })

    it('should initialize hidden when visible is false', () => {
      const config: AlertBannerConfig = { message: 'Test alert', visible: false }
      const alertBanner = new AlertBanner(container, config)
      alertBanner.render()

      expect(container.classList.contains('alert-banner-hidden')).toBe(true)
    })

    it('should initialize with action button when actionLabel provided', () => {
      const config: AlertBannerConfig = {
        message: 'Test alert',
        actionLabel: 'Retry'
      }
      const alertBanner = new AlertBanner(container, config)
      alertBanner.render()

      const actionButton = container.querySelector('.alert-banner-action')
      expect(actionButton).toBeTruthy()
      expect(actionButton?.textContent).toBe('Retry')
    })

    it('should initialize without action button when actionLabel not provided', () => {
      const config: AlertBannerConfig = { message: 'Test alert' }
      const alertBanner = new AlertBanner(container, config)
      alertBanner.render()

      expect(container.querySelector('.alert-banner-action')).toBeFalsy()
    })
  })

  describe('Accessibility', () => {
    it('should set role="alert" for alert types', () => {
      const types: AlertBannerType[] = ['error', 'warning']

      types.forEach(type => {
        const freshContainer = createMockContainer()
        const config: AlertBannerConfig = { message: 'Test', type }
        const alertBanner = new AlertBanner(freshContainer, config)
        alertBanner.render()

        expect(freshContainer.getAttribute('role')).toBe('alert')
        expect(freshContainer.getAttribute('aria-live')).toBe('assertive')

        freshContainer.remove()
      })
    })

    it('should set role="status" for info and success types', () => {
      const types: AlertBannerType[] = ['info', 'success']

      types.forEach(type => {
        const freshContainer = createMockContainer()
        const config: AlertBannerConfig = { message: 'Test', type }
        const alertBanner = new AlertBanner(freshContainer, config)
        alertBanner.render()

        expect(freshContainer.getAttribute('role')).toBe('status')
        expect(freshContainer.getAttribute('aria-live')).toBe('polite')

        freshContainer.remove()
      })
    })

    it('should set custom role when provided', () => {
      const config: AlertBannerConfig = {
        message: 'Test',
        role: 'alert'
      }
      const alertBanner = new AlertBanner(container, config)
      alertBanner.render()

      expect(container.getAttribute('role')).toBe('alert')
    })

    it('should set aria-label to message when ariaLabel not provided', () => {
      const message = 'Important notification'
      const config: AlertBannerConfig = { message }
      const alertBanner = new AlertBanner(container, config)
      alertBanner.render()

      expect(container.getAttribute('aria-label')).toBe(message)
    })

    it('should set custom aria-label when provided', () => {
      const config: AlertBannerConfig = {
        message: 'Test',
        ariaLabel: 'Custom label'
      }
      const alertBanner = new AlertBanner(container, config)
      alertBanner.render()

      expect(container.getAttribute('aria-label')).toBe('Custom label')
    })

    it('should set aria-label on close button', () => {
      const config: AlertBannerConfig = { message: 'Test' }
      const alertBanner = new AlertBanner(container, config)
      alertBanner.render()

      const closeButton = container.querySelector('.alert-banner-close')
      expect(closeButton?.getAttribute('aria-label')).toBe('Close alert')
    })
  })

  describe('State Management', () => {
    it('should update message via setMessage', () => {
      const alertBanner = new AlertBanner(container, { message: 'Initial' })
      alertBanner.render()
      alertBanner.setMessage('Updated')

      expect(alertBanner.getMessage()).toBe('Updated')
      const content = container.querySelector('.alert-banner-message')
      expect(content?.textContent).toBe('Updated')
    })

    it('should not re-render when setting same message', () => {
      const alertBanner = new AlertBanner(container, { message: 'Same' })
      alertBanner.render()
      const renderSpy = vi.spyOn(alertBanner as any, 'render')
      alertBanner.setMessage('Same')
      expect(renderSpy).not.toHaveBeenCalled()
    })

    it('should show and hide via setVisible', () => {
      const alertBanner = new AlertBanner(container, { message: 'Test' })
      alertBanner.render()

      alertBanner.setVisible(false)
      expect(container.classList.contains('alert-banner-hidden')).toBe(true)
      expect(alertBanner.isVisible()).toBe(false)

      alertBanner.setVisible(true)
      expect(container.classList.contains('alert-banner-hidden')).toBe(false)
      expect(alertBanner.isVisible()).toBe(true)
    })

    it('should show via show() method', () => {
      const alertBanner = new AlertBanner(container, { message: 'Test', visible: false })
      alertBanner.render()

      alertBanner.show()
      expect(alertBanner.isVisible()).toBe(true)
      expect(container.classList.contains('alert-banner-hidden')).toBe(false)
    })

    it('should hide via hide() method', () => {
      const alertBanner = new AlertBanner(container, { message: 'Test' })
      alertBanner.render()

      alertBanner.hide()
      expect(alertBanner.isVisible()).toBe(false)
      expect(container.classList.contains('alert-banner-hidden')).toBe(true)
    })

    it('should return immutable state via getState', () => {
      const alertBanner = new AlertBanner(container, { message: 'Test' })
      alertBanner.render()

      const state1 = alertBanner.getState()
      const state2 = alertBanner.getState()

      expect(state1).toEqual(state2)
      expect(state1).not.toBe(state2) // Different object references

      // Attempting to modify returned state should not affect internal state
      const stateCopy = alertBanner.getState() as any
      stateCopy.message = 'Modified'
      expect(alertBanner.getMessage()).toBe('Test')
    })
  })

  describe('Callbacks', () => {
    it('should call onClose when close button is clicked', () => {
      const onClose = vi.fn()
      const callbacks: AlertBannerCallbacks = { onClose }
      const alertBanner = new AlertBanner(
        container,
        { message: 'Test' },
        callbacks
      )
      alertBanner.render()

      const closeButton = container.querySelector('.alert-banner-close') as HTMLElement
      closeButton?.click()

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should hide banner when close button is clicked', () => {
      const alertBanner = new AlertBanner(container, { message: 'Test' })
      alertBanner.render()

      const closeButton = container.querySelector('.alert-banner-close') as HTMLElement
      closeButton?.click()

      expect(alertBanner.isVisible()).toBe(false)
      expect(container.classList.contains('alert-banner-hidden')).toBe(true)
    })

    it('should call onAction when action button is clicked', () => {
      const onAction = vi.fn()
      const callbacks: AlertBannerCallbacks = { onAction }
      const config: AlertBannerConfig = {
        message: 'Test',
        actionLabel: 'Retry'
      }
      const alertBanner = new AlertBanner(container, config, callbacks)
      alertBanner.render()

      const actionButton = container.querySelector('.alert-banner-action') as HTMLElement
      actionButton?.click()

      expect(onAction).toHaveBeenCalledTimes(1)
    })

    it('should prevent default on action button click', () => {
      const onAction = vi.fn()
      const callbacks: AlertBannerCallbacks = { onAction }
      const config: AlertBannerConfig = {
        message: 'Test',
        actionLabel: 'Retry'
      }
      const alertBanner = new AlertBanner(container, config, callbacks)
      alertBanner.render()

      const actionButton = container.querySelector('.alert-banner-action') as HTMLElement
      const event = new MouseEvent('click', { cancelable: true })
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

      actionButton?.dispatchEvent(event)

      expect(preventDefaultSpy).toHaveBeenCalled()
    })
  })

  describe('Cleanup', () => {
    it('should remove event listeners on destroy', () => {
      const onClose = vi.fn()
      const onAction = vi.fn()
      const callbacks: AlertBannerCallbacks = { onClose, onAction }
      const config: AlertBannerConfig = {
        message: 'Test',
        actionLabel: 'Retry'
      }
      const alertBanner = new AlertBanner(container, config, callbacks)
      alertBanner.render()

      alertBanner.destroy()

      const closeButton = container.querySelector('.alert-banner-close') as HTMLElement
      const actionButton = container.querySelector('.alert-banner-action') as HTMLElement

      closeButton?.click()
      actionButton?.click()

      expect(onClose).not.toHaveBeenCalled()
      expect(onAction).not.toHaveBeenCalled()
    })

    it('should clear container content on destroy', () => {
      const alertBanner = new AlertBanner(container, { message: 'Test' })
      alertBanner.render()

      expect(container.innerHTML).not.toBe('')

      alertBanner.destroy()

      expect(container.innerHTML).toBe('')
    })

    it('should remove all attributes on destroy', () => {
      const alertBanner = new AlertBanner(container, { message: 'Test' })
      alertBanner.render()

      expect(container.attributes.length).toBeGreaterThan(0)

      alertBanner.destroy()

      expect(container.className).toBe('')
      expect(container.getAttribute('role')).toBeNull()
      expect(container.getAttribute('aria-live')).toBeNull()
      expect(container.getAttribute('aria-label')).toBeNull()
      expect(container.getAttribute('data-type')).toBeNull()
    })
  })

  describe('Factory Function', () => {
    it('should create and render AlertBanner via factory', () => {
      const config: AlertBannerConfig = { message: 'Factory test' }
      const alertBanner = createAlertBanner(container, config)

      expect(alertBanner).toBeInstanceOf(AlertBanner)
      expect(container.classList.contains('mokkun-alert-banner')).toBe(true)
      expect(alertBanner.getMessage()).toBe('Factory test')
    })

    it('should accept callbacks via factory', () => {
      const onClose = vi.fn()
      const callbacks: AlertBannerCallbacks = { onClose }
      const config: AlertBannerConfig = { message: 'Test' }

      const alertBanner = createAlertBanner(container, config, callbacks)

      const closeButton = container.querySelector('.alert-banner-close') as HTMLElement
      closeButton?.click()

      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Icon Display', () => {
    it('should display icon for each type', () => {
      const types: AlertBannerType[] = ['info', 'warning', 'error', 'success']

      types.forEach(type => {
        const freshContainer = createMockContainer()
        const config: AlertBannerConfig = { message: 'Test', type }
        const alertBanner = new AlertBanner(freshContainer, config)
        alertBanner.render()

        const icon = freshContainer.querySelector('.alert-banner-icon')
        expect(icon).toBeTruthy()
        expect(icon?.innerHTML).toContain('<svg')

        freshContainer.remove()
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty message', () => {
      const config: AlertBannerConfig = { message: '' }
      const alertBanner = new AlertBanner(container, config)
      alertBanner.render()

      expect(alertBanner.getMessage()).toBe('')
      const content = container.querySelector('.alert-banner-message')
      expect(content?.textContent).toBe('')
    })

    it('should escape HTML in message', () => {
      const config: AlertBannerConfig = {
        message: '<script>alert("xss")</script>'
      }
      const alertBanner = new AlertBanner(container, config)
      alertBanner.render()

      const content = container.querySelector('.alert-banner-message')
      expect(content?.innerHTML).not.toContain('<script>')
      expect(content?.textContent).toContain('<script>')
    })

    it('should handle rapid show/hide toggles', () => {
      const alertBanner = new AlertBanner(container, { message: 'Test' })
      alertBanner.render()

      alertBanner.hide()
      alertBanner.show()
      alertBanner.hide()
      alertBanner.show()

      expect(alertBanner.isVisible()).toBe(true)
    })

    it('should not crash when calling destroy multiple times', () => {
      const alertBanner = new AlertBanner(container, { message: 'Test' })
      alertBanner.render()

      expect(() => {
        alertBanner.destroy()
        alertBanner.destroy()
        alertBanner.destroy()
      }).not.toThrow()
    })
  })
})

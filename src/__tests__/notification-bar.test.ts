/**
 * NotificationBar Component Tests
 * 通知バーコンポーネントのテスト（）
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  NotificationBar,
  NotificationBarStack,
  createNotificationBar,
  createNotificationBarStack,
  type NotificationBarConfig,
  type NotificationBarCallbacks,
  type NotificationBarStackConfig,
  type NotificationBarStackCallbacks,
  type NotificationItem,
} from '../renderer/components/notification-bar'

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
// NotificationBar Component Tests
// =============================================================================

describe('NotificationBar Component', () => {
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
      const config: NotificationBarConfig = { message: 'Test notification' }
      const notificationBar = new NotificationBar(container, config)
      notificationBar.render()

      expect(container.classList.contains('mokkun-notification-bar')).toBe(true)
      expect(container.querySelector('.notification-bar-content')).toBeTruthy()
    })

    it('should initialize with specified message', () => {
      const config: NotificationBarConfig = { message: 'Hello World' }
      const notificationBar = new NotificationBar(container, config)
      notificationBar.render()

      expect(notificationBar.getMessage()).toBe('Hello World')
      const messageEl = container.querySelector('.notification-bar-message')
      expect(messageEl?.textContent).toBe('Hello World')
    })

    it('should initialize with default type (info)', () => {
      const config: NotificationBarConfig = { message: 'Info message' }
      const notificationBar = new NotificationBar(container, config)
      notificationBar.render()

      expect(container.classList.contains('notification-bar-info')).toBe(true)
      expect(container.getAttribute('data-type')).toBe('info')
    })

    it('should initialize as visible by default', () => {
      const config: NotificationBarConfig = { message: 'Visible notification' }
      const notificationBar = new NotificationBar(container, config)
      notificationBar.render()

      expect(notificationBar.isVisible()).toBe(true)
      expect(container.classList.contains('notification-bar-hidden')).toBe(false)
    })

    it('should initialize with non-bold state by default', () => {
      const config: NotificationBarConfig = { message: 'Normal notification' }
      const notificationBar = new NotificationBar(container, config)
      notificationBar.render()

      expect(notificationBar.isBold()).toBe(false)
      expect(container.classList.contains('notification-bar-bold')).toBe(false)
      expect(container.hasAttribute('data-bold')).toBe(false)
    })

    it('should initialize with bold state when specified', () => {
      const config: NotificationBarConfig = { message: 'Bold notification', bold: true }
      const notificationBar = new NotificationBar(container, config)
      notificationBar.render()

      expect(notificationBar.isBold()).toBe(true)
      expect(container.classList.contains('notification-bar-bold')).toBe(true)
      expect(container.hasAttribute('data-bold')).toBe(true)
    })

    it('should show close button by default with onClose callback', () => {
      const config: NotificationBarConfig = { message: 'Closable notification' }
      const callbacks: NotificationBarCallbacks = { onClose: vi.fn() }
      const notificationBar = new NotificationBar(container, config, callbacks)
      notificationBar.render()

      const closeButton = container.querySelector('.notification-bar-close')
      expect(closeButton).toBeTruthy()
    })

    it('should not show close button without onClose callback', () => {
      const config: NotificationBarConfig = { message: 'Non-closable notification' }
      const notificationBar = new NotificationBar(container, config)
      notificationBar.render()

      const closeButton = container.querySelector('.notification-bar-close')
      expect(closeButton).toBeNull()
    })

    it('should not show close button when closable is false', () => {
      const config: NotificationBarConfig = { message: 'Non-closable notification', closable: false }
      const callbacks: NotificationBarCallbacks = { onClose: vi.fn() }
      const notificationBar = new NotificationBar(container, config, callbacks)
      notificationBar.render()

      const closeButton = container.querySelector('.notification-bar-close')
      expect(closeButton).toBeNull()
    })
  })

  // ===========================================================================
  // Type Variants Tests
  // ===========================================================================

  describe('Type Variants', () => {
    const types = ['info', 'success', 'warning', 'error', 'sync'] as const

    types.forEach((type) => {
      it(`should render ${type} type correctly`, () => {
        const config: NotificationBarConfig = { message: 'Test', type }
        const notificationBar = new NotificationBar(container, config)
        notificationBar.render()

        expect(container.classList.contains(`notification-bar-${type}`)).toBe(true)
        expect(container.getAttribute('data-type')).toBe(type)
      })
    })

    types.forEach((type) => {
      it(`should render ${type} type icon`, () => {
        const config: NotificationBarConfig = { message: 'Test', type }
        const notificationBar = new NotificationBar(container, config)
        notificationBar.render()

        const iconEl = container.querySelector('.notification-bar-icon')
        expect(iconEl).toBeTruthy()
        expect(iconEl?.querySelector('svg')).toBeTruthy()
        expect(iconEl?.getAttribute('aria-hidden')).toBe('true')
      })
    })
  })

  // ===========================================================================
  // Accessibility Tests
  // ===========================================================================

  describe('Accessibility', () => {
    it('should have role="status" by default', () => {
      const config: NotificationBarConfig = { message: 'Status notification' }
      const notificationBar = new NotificationBar(container, config)
      notificationBar.render()

      expect(container.getAttribute('role')).toBe('status')
      expect(container.getAttribute('aria-live')).toBe('polite')
    })

    it('should have role="alert" when specified', () => {
      const config: NotificationBarConfig = { message: 'Alert notification', role: 'alert' }
      const notificationBar = new NotificationBar(container, config)
      notificationBar.render()

      expect(container.getAttribute('role')).toBe('alert')
      expect(container.getAttribute('aria-live')).toBe('assertive')
    })

    it('should have aria-label with message by default', () => {
      const config: NotificationBarConfig = { message: 'Important message' }
      const notificationBar = new NotificationBar(container, config)
      notificationBar.render()

      expect(container.getAttribute('aria-label')).toBe('Important message')
    })

    it('should have custom aria-label when specified', () => {
      const config: NotificationBarConfig = { message: 'Test', ariaLabel: 'Custom label' }
      const notificationBar = new NotificationBar(container, config)
      notificationBar.render()

      expect(container.getAttribute('aria-label')).toBe('Custom label')
    })

    it('should have aria-label on close button', () => {
      const config: NotificationBarConfig = { message: 'Test' }
      const callbacks: NotificationBarCallbacks = { onClose: vi.fn() }
      const notificationBar = new NotificationBar(container, config, callbacks)
      notificationBar.render()

      const closeButton = container.querySelector('.notification-bar-close')
      expect(closeButton?.getAttribute('aria-label')).toBe('閉じる')
    })
  })

  // ===========================================================================
  // State Management Tests
  // ===========================================================================

  describe('State Management', () => {
    it('should update message via setMessage', () => {
      const notificationBar = new NotificationBar(container, { message: 'Initial' })
      notificationBar.render()
      notificationBar.setMessage('Updated')

      expect(notificationBar.getMessage()).toBe('Updated')
      const messageEl = container.querySelector('.notification-bar-message')
      expect(messageEl?.textContent).toBe('Updated')
    })

    it('should not re-render when setting same message', () => {
      const notificationBar = new NotificationBar(container, { message: 'Same' })
      notificationBar.render()
      const renderSpy = vi.spyOn(notificationBar, 'render')
      notificationBar.setMessage('Same')
      expect(renderSpy).not.toHaveBeenCalled()
    })

    it('should update visibility via setVisible', () => {
      const notificationBar = new NotificationBar(container, { message: 'Test' })
      notificationBar.render()
      expect(notificationBar.isVisible()).toBe(true)

      notificationBar.setVisible(false)
      expect(notificationBar.isVisible()).toBe(false)
      expect(container.hasAttribute('data-hidden')).toBe(true)

      notificationBar.setVisible(true)
      expect(notificationBar.isVisible()).toBe(true)
      expect(container.hasAttribute('data-hidden')).toBe(false)
    })

    it('should not re-render when setting same visibility', () => {
      const notificationBar = new NotificationBar(container, { message: 'Test' })
      notificationBar.render()
      const renderSpy = vi.spyOn(notificationBar, 'render')
      notificationBar.setVisible(true)
      expect(renderSpy).not.toHaveBeenCalled()
    })

    it('should update bold state via setBold', () => {
      const notificationBar = new NotificationBar(container, { message: 'Test' })
      notificationBar.render()
      expect(notificationBar.isBold()).toBe(false)

      notificationBar.setBold(true)
      expect(notificationBar.isBold()).toBe(true)
      expect(container.classList.contains('notification-bar-bold')).toBe(true)

      notificationBar.setBold(false)
      expect(notificationBar.isBold()).toBe(false)
      expect(container.classList.contains('notification-bar-bold')).toBe(false)
    })

    it('should not re-render when setting same bold state', () => {
      const notificationBar = new NotificationBar(container, { message: 'Test' })
      notificationBar.render()
      const renderSpy = vi.spyOn(notificationBar, 'render')
      notificationBar.setBold(false)
      expect(renderSpy).not.toHaveBeenCalled()
    })

    it('should show via show method', () => {
      const notificationBar = new NotificationBar(container, { message: 'Test' })
      notificationBar.render()
      notificationBar.hide()
      expect(notificationBar.isVisible()).toBe(false)

      notificationBar.show()
      expect(notificationBar.isVisible()).toBe(true)
    })

    it('should hide via hide method', () => {
      const notificationBar = new NotificationBar(container, { message: 'Test' })
      notificationBar.render()
      expect(notificationBar.isVisible()).toBe(true)

      notificationBar.hide()
      expect(notificationBar.isVisible()).toBe(false)
    })

    it('should return correct state via getState', () => {
      const notificationBar = new NotificationBar(container, { message: 'Test', bold: true })
      notificationBar.render()

      const state = notificationBar.getState()
      expect(state.message).toBe('Test')
      expect(state.visible).toBe(true)
      expect(state.bold).toBe(true)
    })

    it('should return immutable state', () => {
      const notificationBar = new NotificationBar(container, { message: 'Test' })
      notificationBar.render()

      const state1 = notificationBar.getState()
      const state2 = notificationBar.getState()
      expect(state1).not.toBe(state2)
      expect(state1).toEqual(state2)
    })
  })

  // ===========================================================================
  // Callback Tests
  // ===========================================================================

  describe('Callbacks', () => {
    it('should call onClose when close button is clicked', () => {
      const onClose = vi.fn()
      const config: NotificationBarConfig = { message: 'Test' }
      const callbacks: NotificationBarCallbacks = { onClose }
      const notificationBar = new NotificationBar(container, config, callbacks)
      notificationBar.render()

      const closeButton = container.querySelector('.notification-bar-close') as HTMLButtonElement
      closeButton.click()

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should call onAction when action button is clicked', () => {
      const onAction = vi.fn()
      const config: NotificationBarConfig = { message: 'Test', actionLabel: 'Retry' }
      const callbacks: NotificationBarCallbacks = { onAction }
      const notificationBar = new NotificationBar(container, config, callbacks)
      notificationBar.render()

      const actionButton = container.querySelector('.notification-bar-action') as HTMLButtonElement
      actionButton.click()

      expect(onAction).toHaveBeenCalledTimes(1)
    })

    it('should show action button with correct label', () => {
      const onAction = vi.fn()
      const config: NotificationBarConfig = { message: 'Test', actionLabel: 'Undo' }
      const callbacks: NotificationBarCallbacks = { onAction }
      const notificationBar = new NotificationBar(container, config, callbacks)
      notificationBar.render()

      const actionButton = container.querySelector('.notification-bar-action')
      expect(actionButton).toBeTruthy()
      expect(actionButton?.textContent).toBe('Undo')
    })

    it('should not show action button without onAction callback', () => {
      const config: NotificationBarConfig = { message: 'Test', actionLabel: 'Retry' }
      const notificationBar = new NotificationBar(container, config)
      notificationBar.render()

      const actionButton = container.querySelector('.notification-bar-action')
      expect(actionButton).toBeNull()
    })

    it('should not show action button without actionLabel', () => {
      const onAction = vi.fn()
      const config: NotificationBarConfig = { message: 'Test' }
      const callbacks: NotificationBarCallbacks = { onAction }
      const notificationBar = new NotificationBar(container, config, callbacks)
      notificationBar.render()

      const actionButton = container.querySelector('.notification-bar-action')
      expect(actionButton).toBeNull()
    })
  })

  // ===========================================================================
  // Destroy Tests
  // ===========================================================================

  describe('Destroy', () => {
    it('should clear container content', () => {
      const notificationBar = createNotificationBar(container, { message: 'Test' })
      expect(container.innerHTML).not.toBe('')

      notificationBar.destroy()
      expect(container.innerHTML).toBe('')
    })

    it('should clear container class', () => {
      const notificationBar = createNotificationBar(container, { message: 'Test' })
      expect(container.className).not.toBe('')

      notificationBar.destroy()
      expect(container.className).toBe('')
    })

    it('should remove ARIA attributes', () => {
      const notificationBar = createNotificationBar(container, { message: 'Test' })
      expect(container.getAttribute('role')).toBe('status')

      notificationBar.destroy()
      expect(container.getAttribute('role')).toBeNull()
      expect(container.getAttribute('aria-live')).toBeNull()
      expect(container.getAttribute('aria-label')).toBeNull()
    })

    it('should remove data attributes', () => {
      const notificationBar = createNotificationBar(container, { message: 'Test', bold: true })
      expect(container.getAttribute('data-type')).toBe('info')
      expect(container.hasAttribute('data-bold')).toBe(true)

      notificationBar.destroy()
      expect(container.getAttribute('data-type')).toBeNull()
      expect(container.hasAttribute('data-bold')).toBe(false)
    })

    it('should cleanup event listeners on destroy', () => {
      const onClose = vi.fn()
      const notificationBar = createNotificationBar(container, { message: 'Test' }, { onClose })

      notificationBar.destroy()

      // Try to trigger click on destroyed button (should not exist)
      const closeButton = container.querySelector('.notification-bar-close')
      expect(closeButton).toBeNull()
    })
  })

  // ===========================================================================
  // Factory Function Tests
  // ===========================================================================

  describe('Factory Function', () => {
    it('should create and render NotificationBar', () => {
      const notificationBar = createNotificationBar(container, { message: 'Factory test' })
      expect(container.classList.contains('mokkun-notification-bar')).toBe(true)
      expect(notificationBar.getMessage()).toBe('Factory test')
    })

    it('should create NotificationBar with callbacks', () => {
      const onClose = vi.fn()
      const notificationBar = createNotificationBar(container, { message: 'Test' }, { onClose })

      const closeButton = container.querySelector('.notification-bar-close') as HTMLButtonElement
      closeButton.click()

      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })
})

// =============================================================================
// NotificationBarStack Component Tests
// =============================================================================

describe('NotificationBarStack Component', () => {
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
    it('should initialize with empty notifications', () => {
      const stack = new NotificationBarStack(container)
      stack.render()

      expect(container.classList.contains('mokkun-notification-bar-stack')).toBe(true)
      expect(stack.getCount()).toBe(0)
    })

    it('should initialize with provided notifications', () => {
      const notifications: NotificationItem[] = [
        { id: '1', message: 'First' },
        { id: '2', message: 'Second' },
      ]
      const config: NotificationBarStackConfig = { notifications }
      const stack = new NotificationBarStack(container, config)
      stack.render()

      expect(stack.getCount()).toBe(2)
      const wrappers = container.querySelectorAll('.notification-bar-wrapper')
      expect(wrappers.length).toBe(2)
    })
  })

  // ===========================================================================
  // Add Notification Tests
  // ===========================================================================

  describe('Add Notification', () => {
    it('should add notification and return id', () => {
      const stack = new NotificationBarStack(container)
      stack.render()

      const id = stack.addNotification({ message: 'New notification' })
      expect(id).toBeTruthy()
      expect(stack.getCount()).toBe(1)
    })

    it('should add notification with custom id', () => {
      const stack = new NotificationBarStack(container)
      stack.render()

      const id = stack.addNotification({ id: 'custom-id', message: 'Custom' })
      expect(id).toBe('custom-id')
    })

    it('should prepend new notifications', () => {
      const stack = new NotificationBarStack(container)
      stack.render()

      stack.addNotification({ id: 'first', message: 'First' })
      stack.addNotification({ id: 'second', message: 'Second' })

      const notifications = stack.getNotifications()
      expect(notifications[0].id).toBe('second')
      expect(notifications[1].id).toBe('first')
    })

    it('should render notification with correct type', () => {
      const stack = new NotificationBarStack(container)
      stack.render()

      stack.addNotification({ message: 'Error!', type: 'error' })

      expect(container.querySelector('.notification-bar-error')).toBeTruthy()
    })
  })

  // ===========================================================================
  // Remove Notification Tests
  // ===========================================================================

  describe('Remove Notification', () => {
    it('should remove notification by id', () => {
      const notifications: NotificationItem[] = [
        { id: '1', message: 'First' },
        { id: '2', message: 'Second' },
      ]
      const stack = new NotificationBarStack(container, { notifications })
      stack.render()

      stack.removeNotification('1')
      expect(stack.getCount()).toBe(1)
      expect(stack.getNotifications()[0].id).toBe('2')
    })

    it('should call onNotificationClose callback', () => {
      const onNotificationClose = vi.fn()
      const notifications: NotificationItem[] = [{ id: '1', message: 'Test' }]
      const stack = new NotificationBarStack(container, { notifications }, { onNotificationClose })
      stack.render()

      stack.removeNotification('1')
      expect(onNotificationClose).toHaveBeenCalledWith('1')
    })

    it('should call onAllClosed when last notification removed', () => {
      const onAllClosed = vi.fn()
      const notifications: NotificationItem[] = [{ id: '1', message: 'Test' }]
      const stack = new NotificationBarStack(container, { notifications }, { onAllClosed })
      stack.render()

      stack.removeNotification('1')
      expect(onAllClosed).toHaveBeenCalledTimes(1)
    })

    it('should handle removing non-existent notification', () => {
      const stack = new NotificationBarStack(container)
      stack.render()

      // Should not throw
      stack.removeNotification('non-existent')
      expect(stack.getCount()).toBe(0)
    })
  })

  // ===========================================================================
  // Clear All Tests
  // ===========================================================================

  describe('Clear All', () => {
    it('should clear all notifications', () => {
      const notifications: NotificationItem[] = [
        { id: '1', message: 'First' },
        { id: '2', message: 'Second' },
      ]
      const stack = new NotificationBarStack(container, { notifications })
      stack.render()

      stack.clearAll()
      expect(stack.getCount()).toBe(0)
    })

    it('should call onAllClosed callback', () => {
      const onAllClosed = vi.fn()
      const notifications: NotificationItem[] = [{ id: '1', message: 'Test' }]
      const stack = new NotificationBarStack(container, { notifications }, { onAllClosed })
      stack.render()

      stack.clearAll()
      expect(onAllClosed).toHaveBeenCalledTimes(1)
    })
  })

  // ===========================================================================
  // Max Visible Tests
  // ===========================================================================

  describe('Max Visible', () => {
    it('should limit displayed notifications to maxVisible', () => {
      const notifications: NotificationItem[] = [
        { id: '1', message: 'First' },
        { id: '2', message: 'Second' },
        { id: '3', message: 'Third' },
        { id: '4', message: 'Fourth' },
      ]
      const config: NotificationBarStackConfig = { notifications, maxVisible: 2 }
      const stack = new NotificationBarStack(container, config)
      stack.render()

      const wrappers = container.querySelectorAll('.notification-bar-wrapper')
      expect(wrappers.length).toBe(2)
      expect(stack.getCount()).toBe(4) // All notifications are still tracked
    })

    it('should default maxVisible to 5', () => {
      const notifications: NotificationItem[] = Array.from({ length: 7 }, (_, i) => ({
        id: String(i),
        message: `Notification ${i}`,
      }))
      const stack = new NotificationBarStack(container, { notifications })
      stack.render()

      const wrappers = container.querySelectorAll('.notification-bar-wrapper')
      expect(wrappers.length).toBe(5)
    })
  })

  // ===========================================================================
  // State Tests
  // ===========================================================================

  describe('State', () => {
    it('should return correct state', () => {
      const notifications: NotificationItem[] = [
        { id: '1', message: 'First', type: 'success' },
        { id: '2', message: 'Second', type: 'error' },
      ]
      const stack = new NotificationBarStack(container, { notifications })
      stack.render()

      const state = stack.getState()
      expect(state.notifications.length).toBe(2)
      expect(state.notifications[0].id).toBe('1')
      expect(state.notifications[1].id).toBe('2')
    })

    it('should return immutable notifications array', () => {
      const notifications: NotificationItem[] = [{ id: '1', message: 'Test' }]
      const stack = new NotificationBarStack(container, { notifications })
      stack.render()

      const list1 = stack.getNotifications()
      const list2 = stack.getNotifications()
      expect(list1).not.toBe(list2)
      expect(list1).toEqual(list2)
    })
  })

  // ===========================================================================
  // Close Button Integration Tests
  // ===========================================================================

  describe('Close Button Integration', () => {
    it('should remove notification when close button clicked', () => {
      const notifications: NotificationItem[] = [{ id: '1', message: 'Test' }]
      const stack = new NotificationBarStack(container, { notifications })
      stack.render()

      const closeButton = container.querySelector('.notification-bar-close') as HTMLButtonElement
      closeButton.click()

      expect(stack.getCount()).toBe(0)
    })

    it('should call onNotificationClose when close button clicked', () => {
      const onNotificationClose = vi.fn()
      const notifications: NotificationItem[] = [{ id: '1', message: 'Test' }]
      const stack = new NotificationBarStack(container, { notifications }, { onNotificationClose })
      stack.render()

      const closeButton = container.querySelector('.notification-bar-close') as HTMLButtonElement
      closeButton.click()

      expect(onNotificationClose).toHaveBeenCalledWith('1')
    })
  })

  // ===========================================================================
  // Action Button Integration Tests
  // ===========================================================================

  describe('Action Button Integration', () => {
    it('should call notification onAction when action button clicked', () => {
      const onAction = vi.fn()
      const notifications: NotificationItem[] = [
        { id: '1', message: 'Test', actionLabel: 'Retry', onAction },
      ]
      const stack = new NotificationBarStack(container, { notifications })
      stack.render()

      const actionButton = container.querySelector('.notification-bar-action') as HTMLButtonElement
      actionButton.click()

      expect(onAction).toHaveBeenCalledTimes(1)
    })
  })

  // ===========================================================================
  // Destroy Tests
  // ===========================================================================

  describe('Destroy', () => {
    it('should clear container content', () => {
      const notifications: NotificationItem[] = [{ id: '1', message: 'Test' }]
      const stack = createNotificationBarStack(container, { notifications })
      expect(container.innerHTML).not.toBe('')

      stack.destroy()
      expect(container.innerHTML).toBe('')
    })

    it('should clear container class', () => {
      const stack = createNotificationBarStack(container)
      expect(container.className).not.toBe('')

      stack.destroy()
      expect(container.className).toBe('')
    })
  })

  // ===========================================================================
  // Factory Function Tests
  // ===========================================================================

  describe('Factory Function', () => {
    it('should create and render NotificationBarStack', () => {
      const stack = createNotificationBarStack(container)
      expect(container.classList.contains('mokkun-notification-bar-stack')).toBe(true)
    })

    it('should create NotificationBarStack with config', () => {
      const notifications: NotificationItem[] = [{ id: '1', message: 'Test' }]
      const stack = createNotificationBarStack(container, { notifications })
      expect(stack.getCount()).toBe(1)
    })

    it('should create NotificationBarStack with callbacks', () => {
      const onNotificationClose = vi.fn()
      const notifications: NotificationItem[] = [{ id: '1', message: 'Test' }]
      const stack = createNotificationBarStack(container, { notifications }, { onNotificationClose })

      stack.removeNotification('1')
      expect(onNotificationClose).toHaveBeenCalledWith('1')
    })
  })
})

// =============================================================================
// Combined Scenarios Tests
// =============================================================================

describe('Combined Scenarios', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = createMockContainer()
  })

  afterEach(() => {
    cleanupContainer(container)
  })

  it('should handle multiple notifications with different types', () => {
    const stack = createNotificationBarStack(container)

    stack.addNotification({ message: 'Info message', type: 'info' })
    stack.addNotification({ message: 'Success message', type: 'success' })
    stack.addNotification({ message: 'Warning message', type: 'warning' })
    stack.addNotification({ message: 'Error message', type: 'error' })

    expect(stack.getCount()).toBe(4)
    expect(container.querySelector('.notification-bar-info')).toBeTruthy()
    expect(container.querySelector('.notification-bar-success')).toBeTruthy()
    expect(container.querySelector('.notification-bar-warning')).toBeTruthy()
    expect(container.querySelector('.notification-bar-error')).toBeTruthy()
  })

  it('should handle rapid add and remove operations', () => {
    const stack = createNotificationBarStack(container)

    const id1 = stack.addNotification({ message: 'First' })
    const id2 = stack.addNotification({ message: 'Second' })
    stack.removeNotification(id1)
    const id3 = stack.addNotification({ message: 'Third' })
    stack.removeNotification(id2)

    expect(stack.getCount()).toBe(1)
    expect(stack.getNotifications()[0].id).toBe(id3)
  })

  it('should maintain state consistency after multiple operations', () => {
    const stack = createNotificationBarStack(container)

    stack.addNotification({ id: 'a', message: 'A' })
    stack.addNotification({ id: 'b', message: 'B' })
    stack.addNotification({ id: 'c', message: 'C' })

    stack.removeNotification('b')

    const notifications = stack.getNotifications()
    expect(notifications.length).toBe(2)
    expect(notifications[0].id).toBe('c')
    expect(notifications[1].id).toBe('a')
  })

  it('should handle bold notifications in stack', () => {
    const stack = createNotificationBarStack(container)

    stack.addNotification({ message: 'Bold notification', bold: true })

    const notification = container.querySelector('.notification-bar-bold')
    expect(notification).toBeTruthy()
  })

  it('should handle notification with role="alert"', () => {
    const stack = createNotificationBarStack(container)

    stack.addNotification({ message: 'Alert!', type: 'error', role: 'alert' })

    const notification = container.querySelector('[role="alert"]')
    expect(notification).toBeTruthy()
    expect(notification?.getAttribute('aria-live')).toBe('assertive')
  })
})

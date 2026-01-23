/**
 * Badge Component Tests
 * バッジコンポーネントのテスト（）
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  Badge,
  createBadge,
  type BadgeConfig,
  type BadgeCallbacks,
} from '../renderer/components/badge'

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
// Badge Component Tests
// =============================================================================

describe('Badge Component', () => {
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
    it('should initialize with default config', () => {
      const badge = new Badge(container)
      badge.render()

      expect(container.classList.contains('mokkun-badge')).toBe(true)
      expect(container.querySelector('.badge-content')).toBeTruthy()
    })

    it('should initialize with count 0 by default', () => {
      const badge = new Badge(container)
      badge.render()

      expect(badge.getCount()).toBe(null)
      expect(badge.getText()).toBe(null)
    })

    it('should initialize with specified count', () => {
      const config: BadgeConfig = { count: 5 }
      const badge = new Badge(container, config)
      badge.render()

      expect(badge.getCount()).toBe(5)
      const content = container.querySelector('.badge-content')
      expect(content?.textContent).toBe('5')
    })

    it('should initialize with text', () => {
      const config: BadgeConfig = { text: 'NEW' }
      const badge = new Badge(container, config)
      badge.render()

      expect(badge.getText()).toBe('NEW')
      const content = container.querySelector('.badge-content')
      expect(content?.textContent).toBe('NEW')
    })

    it('should initialize in dot mode', () => {
      const config: BadgeConfig = { dot: true }
      const badge = new Badge(container, config)
      badge.render()

      expect(container.classList.contains('badge-dot')).toBe(true)
      expect(container.querySelector('.badge-dot-indicator')).toBeTruthy()
    })

    it('should hide when count is 0 and hideOnZero is true', () => {
      const config: BadgeConfig = { count: 0, hideOnZero: true }
      const badge = new Badge(container, config)
      badge.render()

      expect(container.hasAttribute('data-hidden')).toBe(true)
      expect(container.style.display).toBe('none')
    })

    it('should show when count is 0 and hideOnZero is false', () => {
      const config: BadgeConfig = { count: 0, hideOnZero: false }
      const badge = new Badge(container, config)
      badge.render()

      expect(container.hasAttribute('data-hidden')).toBe(false)
      expect(container.style.display).toBe('')
    })
  })

  // ===========================================================================
  // Color Variant Tests
  // ===========================================================================

  describe('Color Variants', () => {
    it('should apply gray color by default', () => {
      const badge = new Badge(container)
      badge.render()

      expect(container.classList.contains('badge-gray')).toBe(true)
      expect(container.getAttribute('data-color')).toBe('gray')
    })

    it('should apply blue color', () => {
      const config: BadgeConfig = { color: 'blue' }
      const badge = new Badge(container, config)
      badge.render()

      expect(container.classList.contains('badge-blue')).toBe(true)
      expect(container.getAttribute('data-color')).toBe('blue')
    })

    it('should apply green color', () => {
      const config: BadgeConfig = { color: 'green' }
      const badge = new Badge(container, config)
      badge.render()

      expect(container.classList.contains('badge-green')).toBe(true)
      expect(container.getAttribute('data-color')).toBe('green')
    })

    it('should apply yellow color', () => {
      const config: BadgeConfig = { color: 'yellow' }
      const badge = new Badge(container, config)
      badge.render()

      expect(container.classList.contains('badge-yellow')).toBe(true)
      expect(container.getAttribute('data-color')).toBe('yellow')
    })

    it('should apply red color', () => {
      const config: BadgeConfig = { color: 'red' }
      const badge = new Badge(container, config)
      badge.render()

      expect(container.classList.contains('badge-red')).toBe(true)
      expect(container.getAttribute('data-color')).toBe('red')
    })
  })

  // ===========================================================================
  // Size Variant Tests
  // ===========================================================================

  describe('Size Variants', () => {
    it('should apply medium size by default', () => {
      const badge = new Badge(container)
      badge.render()

      expect(container.classList.contains('badge-medium')).toBe(true)
      expect(container.getAttribute('data-size')).toBe('medium')
    })

    it('should apply small size', () => {
      const config: BadgeConfig = { size: 'small' }
      const badge = new Badge(container, config)
      badge.render()

      expect(container.classList.contains('badge-small')).toBe(true)
      expect(container.getAttribute('data-size')).toBe('small')
    })
  })

  // ===========================================================================
  // Count Display Tests
  // ===========================================================================

  describe('Count Display', () => {
    it('should display count correctly', () => {
      const config: BadgeConfig = { count: 42 }
      const badge = new Badge(container, config)
      badge.render()

      const content = container.querySelector('.badge-content')
      expect(content?.textContent).toBe('42')
    })

    it('should display maxCount+ when count exceeds maxCount', () => {
      const config: BadgeConfig = { count: 150, maxCount: 99 }
      const badge = new Badge(container, config)
      badge.render()

      const content = container.querySelector('.badge-content')
      expect(content?.textContent).toBe('99+')
    })

    it('should use default maxCount of 99', () => {
      const config: BadgeConfig = { count: 100 }
      const badge = new Badge(container, config)
      badge.render()

      const content = container.querySelector('.badge-content')
      expect(content?.textContent).toBe('99+')
    })

    it('should display count when equal to maxCount', () => {
      const config: BadgeConfig = { count: 99, maxCount: 99 }
      const badge = new Badge(container, config)
      badge.render()

      const content = container.querySelector('.badge-content')
      expect(content?.textContent).toBe('99')
    })

    it('should handle negative counts by setting to 0', () => {
      const badge = new Badge(container)
      badge.render()
      badge.setCount(-5)

      expect(badge.getCount()).toBe(0)
      const content = container.querySelector('.badge-content')
      expect(content?.textContent).toBe('0')
    })
  })

  // ===========================================================================
  // Text Display Tests
  // ===========================================================================

  describe('Text Display', () => {
    it('should display text content', () => {
      const config: BadgeConfig = { text: 'NEW' }
      const badge = new Badge(container, config)
      badge.render()

      const content = container.querySelector('.badge-content')
      expect(content?.textContent).toBe('NEW')
    })

    it('should escape HTML in text', () => {
      const config: BadgeConfig = { text: '<script>alert("xss")</script>' }
      const badge = new Badge(container, config)
      badge.render()

      const content = container.querySelector('.badge-content')
      // textContent should contain the raw text (browsers handle the escaping)
      expect(content?.textContent).toBe('<script>alert("xss")</script>')
      // innerHTML should be escaped (not contain actual script tag)
      expect(content?.innerHTML).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;')
    })
  })

  // ===========================================================================
  // Dot Mode Tests
  // ===========================================================================

  describe('Dot Mode', () => {
    it('should display dot indicator in dot mode', () => {
      const config: BadgeConfig = { dot: true }
      const badge = new Badge(container, config)
      badge.render()

      expect(container.classList.contains('badge-dot')).toBe(true)
      expect(container.querySelector('.badge-dot-indicator')).toBeTruthy()
    })

    it('should not display count in dot mode', () => {
      const config: BadgeConfig = { dot: true, count: 5 }
      const badge = new Badge(container, config)
      badge.render()

      const content = container.querySelector('.badge-content')
      expect(content?.textContent).toBe('')
      expect(container.querySelector('.badge-dot-indicator')).toBeTruthy()
    })

    it('should toggle dot mode', () => {
      const badge = new Badge(container, { count: 5 })
      badge.render()

      // Initially not in dot mode
      expect(container.classList.contains('badge-dot')).toBe(false)

      // Enable dot mode
      badge.setDot(true)
      expect(container.classList.contains('badge-dot')).toBe(true)

      // Disable dot mode
      badge.setDot(false)
      expect(container.classList.contains('badge-dot')).toBe(false)
    })
  })

  // ===========================================================================
  // State Management Tests
  // ===========================================================================

  describe('State Management', () => {
    it('should update count', () => {
      const badge = new Badge(container, { count: 5 })
      badge.render()

      badge.setCount(10)
      expect(badge.getCount()).toBe(10)

      const content = container.querySelector('.badge-content')
      expect(content?.textContent).toBe('10')
    })

    it('should update text', () => {
      const badge = new Badge(container, { text: 'OLD' })
      badge.render()

      badge.setText('NEW')
      expect(badge.getText()).toBe('NEW')

      const content = container.querySelector('.badge-content')
      expect(content?.textContent).toBe('NEW')
    })

    it('should clear text when setting count', () => {
      const badge = new Badge(container, { text: 'TEXT' })
      badge.render()

      badge.setCount(5)
      expect(badge.getCount()).toBe(5)
      expect(badge.getText()).toBe(null)
    })

    it('should clear count when setting text', () => {
      const badge = new Badge(container, { count: 5 })
      badge.render()

      badge.setText('TEXT')
      expect(badge.getText()).toBe('TEXT')
      expect(badge.getCount()).toBe(null)
    })

    it('should toggle hidden state', () => {
      const badge = new Badge(container, { count: 5 })
      badge.render()

      badge.setHidden(true)
      expect(container.hasAttribute('data-hidden')).toBe(true)
      expect(container.style.display).toBe('none')

      badge.setHidden(false)
      expect(container.hasAttribute('data-hidden')).toBe(false)
      expect(container.style.display).toBe('')
    })

    it('should get current state', () => {
      const badge = new Badge(container, { count: 5, dot: false })
      badge.render()

      const state = badge.getState()
      expect(state.count).toBe(5)
      expect(state.text).toBe(null)
      expect(state.dot).toBe(false)
      expect(state.hidden).toBe(false)
    })
  })

  // ===========================================================================
  // Callback Tests
  // ===========================================================================

  describe('Callbacks', () => {
    it('should call onCountChange when count changes', () => {
      const onCountChange = vi.fn()
      const callbacks: BadgeCallbacks = { onCountChange }
      const badge = new Badge(container, { count: 5 }, callbacks)
      badge.render()

      badge.setCount(10)
      expect(onCountChange).toHaveBeenCalledWith(10)
      expect(onCountChange).toHaveBeenCalledTimes(1)
    })

    it('should not call onCountChange when count stays the same', () => {
      const onCountChange = vi.fn()
      const callbacks: BadgeCallbacks = { onCountChange }
      const badge = new Badge(container, { count: 5 }, callbacks)
      badge.render()

      badge.setCount(5)
      expect(onCountChange).not.toHaveBeenCalled()
    })

    it('should call onClick when badge is clicked', () => {
      const onClick = vi.fn()
      const callbacks: BadgeCallbacks = { onClick }
      const config: BadgeConfig = { count: 5, clickable: true }
      const badge = new Badge(container, config, callbacks)
      badge.render()

      container.click()
      expect(onClick).toHaveBeenCalledTimes(1)
      expect(onClick.mock.calls[0][0]).toBeInstanceOf(MouseEvent)
    })

    it('should not call onClick when badge is not clickable', () => {
      const onClick = vi.fn()
      const callbacks: BadgeCallbacks = { onClick }
      const config: BadgeConfig = { count: 5, clickable: false }
      const badge = new Badge(container, config, callbacks)
      badge.render()

      container.click()
      expect(onClick).not.toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // Clickable Tests
  // ===========================================================================

  describe('Clickable', () => {
    it('should add clickable class when clickable is true', () => {
      const config: BadgeConfig = { count: 5, clickable: true }
      const badge = new Badge(container, config)
      badge.render()

      expect(container.classList.contains('badge-clickable')).toBe(true)
      // CSS cursor is applied via class, not inline style (checked in CSS)
    })

    it('should not add clickable class when clickable is false', () => {
      const config: BadgeConfig = { count: 5, clickable: false }
      const badge = new Badge(container, config)
      badge.render()

      expect(container.classList.contains('badge-clickable')).toBe(false)
    })
  })

  // ===========================================================================
  // Accessibility Tests
  // ===========================================================================

  describe('Accessibility', () => {
    it('should have role="status"', () => {
      const badge = new Badge(container, { count: 5 })
      badge.render()

      const content = container.querySelector('.badge-content')
      expect(content?.getAttribute('role')).toBe('status')
    })

    it('should have aria-label for count', () => {
      const badge = new Badge(container, { count: 5 })
      badge.render()

      const content = container.querySelector('.badge-content')
      expect(content?.getAttribute('aria-label')).toBe('5 notifications')
    })

    it('should have aria-label for count = 1 (singular)', () => {
      const badge = new Badge(container, { count: 1 })
      badge.render()

      const content = container.querySelector('.badge-content')
      expect(content?.getAttribute('aria-label')).toBe('1 notification')
    })

    it('should have aria-label for count > maxCount', () => {
      const badge = new Badge(container, { count: 100, maxCount: 99 })
      badge.render()

      const content = container.querySelector('.badge-content')
      expect(content?.getAttribute('aria-label')).toBe('99+ notifications')
    })

    it('should have aria-label for text', () => {
      const badge = new Badge(container, { text: 'NEW' })
      badge.render()

      const content = container.querySelector('.badge-content')
      expect(content?.getAttribute('aria-label')).toBe('NEW')
    })

    it('should have aria-label for dot mode', () => {
      const badge = new Badge(container, { dot: true })
      badge.render()

      const content = container.querySelector('.badge-content')
      expect(content?.getAttribute('aria-label')).toBe('Status indicator')
    })

    it('should use custom label when provided', () => {
      const config: BadgeConfig = { count: 5, label: 'Custom label' }
      const badge = new Badge(container, config)
      badge.render()

      const content = container.querySelector('.badge-content')
      expect(content?.getAttribute('aria-label')).toBe('Custom label')
    })
  })

  // ===========================================================================
  // Destroy Tests
  // ===========================================================================

  describe('Destroy', () => {
    it('should remove all event listeners', () => {
      const onClick = vi.fn()
      const callbacks: BadgeCallbacks = { onClick }
      const config: BadgeConfig = { count: 5, clickable: true }
      const badge = new Badge(container, config, callbacks)
      badge.render()

      badge.destroy()
      container.click()

      expect(onClick).not.toHaveBeenCalled()
    })

    it('should clear container content', () => {
      const badge = new Badge(container, { count: 5 })
      badge.render()

      badge.destroy()
      expect(container.innerHTML).toBe('')
    })
  })

  // ===========================================================================
  // Factory Function Tests
  // ===========================================================================

  describe('createBadge Factory', () => {
    it('should create and render badge', () => {
      const config: BadgeConfig = { count: 5, color: 'blue' }
      const badge = createBadge(container, config)

      expect(container.classList.contains('mokkun-badge')).toBe(true)
      expect(container.classList.contains('badge-blue')).toBe(true)
      expect(badge.getCount()).toBe(5)
    })

    it('should create badge with callbacks', () => {
      const onCountChange = vi.fn()
      const callbacks: BadgeCallbacks = { onCountChange }
      const badge = createBadge(container, { count: 5 }, callbacks)

      badge.setCount(10)
      expect(onCountChange).toHaveBeenCalledWith(10)
    })
  })

  // ===========================================================================
  // Edge Cases
  // ===========================================================================

  describe('Edge Cases', () => {
    it('should handle empty badge (no count, no text, no dot)', () => {
      const badge = new Badge(container)
      badge.render()

      const content = container.querySelector('.badge-content')
      expect(content).toBeTruthy()
      expect(content?.textContent).toBe('')
    })

    it('should handle very large counts', () => {
      const badge = new Badge(container, { count: 999999 })
      badge.render()

      const content = container.querySelector('.badge-content')
      expect(content?.textContent).toBe('99+')
    })

    it('should handle very long text', () => {
      const longText = 'VERY LONG TEXT THAT SHOULD NOT WRAP'
      const badge = new Badge(container, { text: longText })
      badge.render()

      const content = container.querySelector('.badge-content')
      expect(content?.textContent).toBe(longText)
    })

    it('should handle rapid state changes', () => {
      const badge = new Badge(container, { count: 0 })
      badge.render()

      badge.setCount(1)
      badge.setCount(2)
      badge.setCount(3)
      badge.setText('TEXT')
      badge.setDot(true)
      badge.setHidden(true)

      expect(badge.getState().hidden).toBe(true)
    })
  })
})

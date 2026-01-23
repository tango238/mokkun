/**
 * Disclosure Component Tests
 * 開閉コンテンツコンポーネントのテスト
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  Disclosure,
  createDisclosure,
  type DisclosureConfig,
  type DisclosureCallbacks,
} from '../renderer/components/disclosure'

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
// Disclosure Component Tests
// =============================================================================

describe('Disclosure Component', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = createMockContainer()
  })

  afterEach(() => {
    cleanupElement(container)
    const disclosures = document.querySelectorAll('.mokkun-disclosure')
    disclosures.forEach((disclosure) => cleanupElement(disclosure as HTMLElement))
  })

  // ===========================================================================
  // Initialization Tests
  // ===========================================================================

  describe('Initialization', () => {
    it('should initialize with required config', () => {
      const config: DisclosureConfig = {
        triggerLabel: 'もっと見る',
        content: '<p>追加コンテンツ</p>',
      }
      const disclosure = new Disclosure(container, config)

      expect(disclosure.getState().isOpen).toBe(false)

      disclosure.destroy()
    })

    it('should initialize with defaultOpen true', () => {
      const config: DisclosureConfig = {
        triggerLabel: 'もっと見る',
        content: '<p>追加コンテンツ</p>',
        defaultOpen: true,
      }
      const disclosure = new Disclosure(container, config)

      expect(disclosure.getState().isOpen).toBe(true)

      disclosure.destroy()
    })

    it('should create disclosure using factory function', () => {
      const config: DisclosureConfig = {
        triggerLabel: 'もっと見る',
        content: '<p>追加コンテンツ</p>',
      }
      const disclosure = createDisclosure(container, config)

      expect(disclosure).toBeInstanceOf(Disclosure)
      expect(container.classList.contains('mokkun-disclosure')).toBe(true)

      disclosure.destroy()
    })

    it('should apply custom className', () => {
      const config: DisclosureConfig = {
        triggerLabel: 'もっと見る',
        content: '<p>追加コンテンツ</p>',
        className: 'custom-class',
      }
      const disclosure = createDisclosure(container, config)

      expect(container.classList.contains('custom-class')).toBe(true)

      disclosure.destroy()
    })

    it('should apply custom id', () => {
      const config: DisclosureConfig = {
        triggerLabel: 'もっと見る',
        content: '<p>追加コンテンツ</p>',
        id: 'custom-disclosure-id',
      }
      const disclosure = createDisclosure(container, config)

      expect(container.id).toBe('custom-disclosure-id')

      disclosure.destroy()
    })
  })

  // ===========================================================================
  // Trigger Rendering Tests
  // ===========================================================================

  describe('Trigger Rendering', () => {
    it('should render trigger button', () => {
      const disclosure = createDisclosure(container, {
        triggerLabel: 'もっと見る',
        content: '<p>追加コンテンツ</p>',
      })

      const trigger = container.querySelector('.disclosure-trigger')
      expect(trigger).toBeTruthy()
      expect(trigger?.tagName.toLowerCase()).toBe('button')

      disclosure.destroy()
    })

    it('should render trigger label', () => {
      const disclosure = createDisclosure(container, {
        triggerLabel: 'もっと見る',
        content: '<p>追加コンテンツ</p>',
      })

      const label = container.querySelector('.disclosure-trigger-label')
      expect(label?.textContent).toBe('もっと見る')

      disclosure.destroy()
    })

    it('should render icon', () => {
      const disclosure = createDisclosure(container, {
        triggerLabel: 'もっと見る',
        content: '<p>追加コンテンツ</p>',
      })

      const icon = container.querySelector('.disclosure-icon')
      expect(icon).toBeTruthy()
      expect(icon?.querySelector('svg')).toBeTruthy()

      disclosure.destroy()
    })

    it('should use triggerLabelOpen when open', () => {
      const disclosure = createDisclosure(container, {
        triggerLabel: 'もっと見る',
        triggerLabelOpen: '閉じる',
        content: '<p>追加コンテンツ</p>',
      })

      const label = container.querySelector('.disclosure-trigger-label')
      expect(label?.textContent).toBe('もっと見る')

      disclosure.open()
      expect(label?.textContent).toBe('閉じる')

      disclosure.close()
      expect(label?.textContent).toBe('もっと見る')

      disclosure.destroy()
    })
  })

  // ===========================================================================
  // Content Rendering Tests
  // ===========================================================================

  describe('Content Rendering', () => {
    it('should render content wrapper', () => {
      const disclosure = createDisclosure(container, {
        triggerLabel: 'もっと見る',
        content: '<p>追加コンテンツ</p>',
      })

      const wrapper = container.querySelector('.disclosure-content-wrapper')
      expect(wrapper).toBeTruthy()

      disclosure.destroy()
    })

    it('should render content with HTML string', () => {
      const disclosure = createDisclosure(container, {
        triggerLabel: 'もっと見る',
        content: '<p>追加コンテンツ</p>',
      })

      const content = container.querySelector('.disclosure-content')
      expect(content?.innerHTML).toContain('<p>追加コンテンツ</p>')

      disclosure.destroy()
    })

    it('should render content with HTMLElement', () => {
      const contentElement = document.createElement('div')
      contentElement.textContent = 'HTMLElement コンテンツ'

      const disclosure = createDisclosure(container, {
        triggerLabel: 'もっと見る',
        content: contentElement,
      })

      const content = container.querySelector('.disclosure-content')
      expect(content?.textContent).toContain('HTMLElement コンテンツ')

      disclosure.destroy()
    })

    it('should have hidden content when closed', () => {
      const disclosure = createDisclosure(container, {
        triggerLabel: 'もっと見る',
        content: '<p>追加コンテンツ</p>',
      })

      const content = container.querySelector('.disclosure-content')
      expect(content?.hasAttribute('hidden')).toBe(true)

      disclosure.destroy()
    })

    it('should show content when open', () => {
      const disclosure = createDisclosure(container, {
        triggerLabel: 'もっと見る',
        content: '<p>追加コンテンツ</p>',
        defaultOpen: true,
      })

      const content = container.querySelector('.disclosure-content')
      expect(content?.hasAttribute('hidden')).toBe(false)

      disclosure.destroy()
    })
  })

  // ===========================================================================
  // Open/Close Tests
  // ===========================================================================

  describe('Open/Close', () => {
    it('should open when open() is called', () => {
      const disclosure = createDisclosure(container, {
        triggerLabel: 'もっと見る',
        content: '<p>追加コンテンツ</p>',
      })

      expect(disclosure.isOpen()).toBe(false)

      disclosure.open()

      expect(disclosure.isOpen()).toBe(true)
      expect(container.classList.contains('is-open')).toBe(true)

      disclosure.destroy()
    })

    it('should close when close() is called', () => {
      const disclosure = createDisclosure(container, {
        triggerLabel: 'もっと見る',
        content: '<p>追加コンテンツ</p>',
        defaultOpen: true,
      })

      expect(disclosure.isOpen()).toBe(true)

      disclosure.close()

      expect(disclosure.isOpen()).toBe(false)
      expect(container.classList.contains('is-open')).toBe(false)

      disclosure.destroy()
    })

    it('should toggle when toggle() is called', () => {
      const disclosure = createDisclosure(container, {
        triggerLabel: 'もっと見る',
        content: '<p>追加コンテンツ</p>',
      })

      expect(disclosure.isOpen()).toBe(false)

      disclosure.toggle()
      expect(disclosure.isOpen()).toBe(true)

      disclosure.toggle()
      expect(disclosure.isOpen()).toBe(false)

      disclosure.destroy()
    })

    it('should not change state when calling open() on already open', () => {
      const onOpen = vi.fn()
      const disclosure = createDisclosure(
        container,
        {
          triggerLabel: 'もっと見る',
          content: '<p>追加コンテンツ</p>',
          defaultOpen: true,
        },
        { onOpen }
      )

      disclosure.open()

      expect(onOpen).not.toHaveBeenCalled()

      disclosure.destroy()
    })

    it('should not change state when calling close() on already closed', () => {
      const onClose = vi.fn()
      const disclosure = createDisclosure(
        container,
        {
          triggerLabel: 'もっと見る',
          content: '<p>追加コンテンツ</p>',
        },
        { onClose }
      )

      disclosure.close()

      expect(onClose).not.toHaveBeenCalled()

      disclosure.destroy()
    })
  })

  // ===========================================================================
  // Click Event Tests
  // ===========================================================================

  describe('Click Events', () => {
    it('should toggle when trigger is clicked', () => {
      const disclosure = createDisclosure(container, {
        triggerLabel: 'もっと見る',
        content: '<p>追加コンテンツ</p>',
      })

      const trigger = container.querySelector('.disclosure-trigger') as HTMLButtonElement

      expect(disclosure.isOpen()).toBe(false)

      trigger.click()
      expect(disclosure.isOpen()).toBe(true)

      trigger.click()
      expect(disclosure.isOpen()).toBe(false)

      disclosure.destroy()
    })
  })

  // ===========================================================================
  // Keyboard Event Tests
  // ===========================================================================

  describe('Keyboard Events', () => {
    it('should toggle on Enter key', () => {
      const disclosure = createDisclosure(container, {
        triggerLabel: 'もっと見る',
        content: '<p>追加コンテンツ</p>',
      })

      const trigger = container.querySelector('.disclosure-trigger') as HTMLButtonElement
      const event = new KeyboardEvent('keydown', { key: 'Enter' })

      expect(disclosure.isOpen()).toBe(false)

      trigger.dispatchEvent(event)
      expect(disclosure.isOpen()).toBe(true)

      disclosure.destroy()
    })

    it('should toggle on Space key', () => {
      const disclosure = createDisclosure(container, {
        triggerLabel: 'もっと見る',
        content: '<p>追加コンテンツ</p>',
      })

      const trigger = container.querySelector('.disclosure-trigger') as HTMLButtonElement
      const event = new KeyboardEvent('keydown', { key: ' ' })

      expect(disclosure.isOpen()).toBe(false)

      trigger.dispatchEvent(event)
      expect(disclosure.isOpen()).toBe(true)

      disclosure.destroy()
    })
  })

  // ===========================================================================
  // Callback Tests
  // ===========================================================================

  describe('Callbacks', () => {
    it('should call onOpen when opened', () => {
      const onOpen = vi.fn()
      const disclosure = createDisclosure(
        container,
        {
          triggerLabel: 'もっと見る',
          content: '<p>追加コンテンツ</p>',
        },
        { onOpen }
      )

      disclosure.open()

      expect(onOpen).toHaveBeenCalledTimes(1)

      disclosure.destroy()
    })

    it('should call onClose when closed', () => {
      const onClose = vi.fn()
      const disclosure = createDisclosure(
        container,
        {
          triggerLabel: 'もっと見る',
          content: '<p>追加コンテンツ</p>',
          defaultOpen: true,
        },
        { onClose }
      )

      disclosure.close()

      expect(onClose).toHaveBeenCalledTimes(1)

      disclosure.destroy()
    })

    it('should call onChange when state changes', () => {
      const onChange = vi.fn()
      const disclosure = createDisclosure(
        container,
        {
          triggerLabel: 'もっと見る',
          content: '<p>追加コンテンツ</p>',
        },
        { onChange }
      )

      disclosure.open()
      expect(onChange).toHaveBeenCalledWith(true)

      disclosure.close()
      expect(onChange).toHaveBeenCalledWith(false)

      expect(onChange).toHaveBeenCalledTimes(2)

      disclosure.destroy()
    })
  })

  // ===========================================================================
  // Content Update Tests
  // ===========================================================================

  describe('Content Update', () => {
    it('should update content with setContent', () => {
      const disclosure = createDisclosure(container, {
        triggerLabel: 'もっと見る',
        content: '<p>初期コンテンツ</p>',
      })

      disclosure.setContent('<p>更新されたコンテンツ</p>')

      const content = container.querySelector('.disclosure-content')
      expect(content?.innerHTML).toContain('更新されたコンテンツ')

      disclosure.destroy()
    })

    it('should update trigger label with setTriggerLabel', () => {
      const disclosure = createDisclosure(container, {
        triggerLabel: 'もっと見る',
        content: '<p>追加コンテンツ</p>',
      })

      disclosure.setTriggerLabel('詳細を表示')

      const label = container.querySelector('.disclosure-trigger-label')
      expect(label?.textContent).toBe('詳細を表示')

      disclosure.destroy()
    })

    it('should update both labels with setTriggerLabel', () => {
      const disclosure = createDisclosure(container, {
        triggerLabel: 'もっと見る',
        triggerLabelOpen: '閉じる',
        content: '<p>追加コンテンツ</p>',
      })

      disclosure.setTriggerLabel('展開', '折りたたむ')

      const label = container.querySelector('.disclosure-trigger-label')
      expect(label?.textContent).toBe('展開')

      disclosure.open()
      expect(label?.textContent).toBe('折りたたむ')

      disclosure.destroy()
    })
  })

  // ===========================================================================
  // Icon Animation Tests
  // ===========================================================================

  describe('Icon Animation', () => {
    it('should add is-open class to icon when opened', () => {
      const disclosure = createDisclosure(container, {
        triggerLabel: 'もっと見る',
        content: '<p>追加コンテンツ</p>',
      })

      const icon = container.querySelector('.disclosure-icon')
      expect(icon?.classList.contains('is-open')).toBe(false)

      disclosure.open()
      expect(icon?.classList.contains('is-open')).toBe(true)

      disclosure.destroy()
    })

    it('should remove is-open class from icon when closed', () => {
      const disclosure = createDisclosure(container, {
        triggerLabel: 'もっと見る',
        content: '<p>追加コンテンツ</p>',
        defaultOpen: true,
      })

      const icon = container.querySelector('.disclosure-icon')
      expect(icon?.classList.contains('is-open')).toBe(true)

      disclosure.close()
      expect(icon?.classList.contains('is-open')).toBe(false)

      disclosure.destroy()
    })
  })

  // ===========================================================================
  // Accessibility Tests
  // ===========================================================================

  describe('Accessibility', () => {
    it('should have aria-expanded attribute on trigger', () => {
      const disclosure = createDisclosure(container, {
        triggerLabel: 'もっと見る',
        content: '<p>追加コンテンツ</p>',
      })

      const trigger = container.querySelector('.disclosure-trigger')
      expect(trigger?.getAttribute('aria-expanded')).toBe('false')

      disclosure.open()
      expect(trigger?.getAttribute('aria-expanded')).toBe('true')

      disclosure.destroy()
    })

    it('should have aria-controls linking to content', () => {
      const disclosure = createDisclosure(container, {
        triggerLabel: 'もっと見る',
        content: '<p>追加コンテンツ</p>',
        id: 'test-disclosure',
      })

      const trigger = container.querySelector('.disclosure-trigger')
      const content = container.querySelector('.disclosure-content')

      expect(trigger?.getAttribute('aria-controls')).toBe('test-disclosure-content')
      expect(content?.id).toBe('test-disclosure-content')

      disclosure.destroy()
    })

    it('should have role="region" on content', () => {
      const disclosure = createDisclosure(container, {
        triggerLabel: 'もっと見る',
        content: '<p>追加コンテンツ</p>',
      })

      const content = container.querySelector('.disclosure-content')
      expect(content?.getAttribute('role')).toBe('region')

      disclosure.destroy()
    })

    it('should have aria-labelledby linking to trigger', () => {
      const disclosure = createDisclosure(container, {
        triggerLabel: 'もっと見る',
        content: '<p>追加コンテンツ</p>',
        id: 'test-disclosure',
      })

      const trigger = container.querySelector('.disclosure-trigger')
      const content = container.querySelector('.disclosure-content')

      expect(content?.getAttribute('aria-labelledby')).toBe('test-disclosure-trigger')
      expect(trigger?.id).toBe('test-disclosure-trigger')

      disclosure.destroy()
    })

    it('should have aria-hidden="true" on icon', () => {
      const disclosure = createDisclosure(container, {
        triggerLabel: 'もっと見る',
        content: '<p>追加コンテンツ</p>',
      })

      const icon = container.querySelector('.disclosure-icon')
      expect(icon?.getAttribute('aria-hidden')).toBe('true')

      disclosure.destroy()
    })
  })

  // ===========================================================================
  // Visually Hidden Mode Tests
  // ===========================================================================

  describe('Visually Hidden Mode', () => {
    it('should use aria-hidden instead of hidden when visuallyHidden is true', () => {
      const disclosure = createDisclosure(container, {
        triggerLabel: 'もっと見る',
        content: '<p>追加コンテンツ</p>',
        visuallyHidden: true,
      })

      const content = container.querySelector('.disclosure-content')
      expect(content?.hasAttribute('hidden')).toBe(false)
      expect(content?.getAttribute('aria-hidden')).toBe('true')

      disclosure.destroy()
    })

    it('should remove aria-hidden when opened in visuallyHidden mode', () => {
      const disclosure = createDisclosure(container, {
        triggerLabel: 'もっと見る',
        content: '<p>追加コンテンツ</p>',
        visuallyHidden: true,
      })

      const content = container.querySelector('.disclosure-content')
      expect(content?.getAttribute('aria-hidden')).toBe('true')

      disclosure.open()
      expect(content?.hasAttribute('aria-hidden')).toBe(false)

      disclosure.destroy()
    })
  })

  // ===========================================================================
  // CSS Class Tests
  // ===========================================================================

  describe('CSS Classes', () => {
    it('should have mokkun-disclosure class', () => {
      const disclosure = createDisclosure(container, {
        triggerLabel: 'もっと見る',
        content: '<p>追加コンテンツ</p>',
      })

      expect(container.classList.contains('mokkun-disclosure')).toBe(true)

      disclosure.destroy()
    })

    it('should toggle is-open class on container', () => {
      const disclosure = createDisclosure(container, {
        triggerLabel: 'もっと見る',
        content: '<p>追加コンテンツ</p>',
      })

      expect(container.classList.contains('is-open')).toBe(false)

      disclosure.open()
      expect(container.classList.contains('is-open')).toBe(true)

      disclosure.close()
      expect(container.classList.contains('is-open')).toBe(false)

      disclosure.destroy()
    })

    it('should toggle is-open class on content wrapper', () => {
      const disclosure = createDisclosure(container, {
        triggerLabel: 'もっと見る',
        content: '<p>追加コンテンツ</p>',
      })

      const wrapper = container.querySelector('.disclosure-content-wrapper')
      expect(wrapper?.classList.contains('is-open')).toBe(false)

      disclosure.open()
      expect(wrapper?.classList.contains('is-open')).toBe(true)

      disclosure.destroy()
    })
  })

  // ===========================================================================
  // Cleanup Tests
  // ===========================================================================

  describe('Cleanup', () => {
    it('should clear container on destroy', () => {
      const disclosure = createDisclosure(container, {
        triggerLabel: 'もっと見る',
        content: '<p>追加コンテンツ</p>',
      })

      expect(container.querySelector('.disclosure-trigger')).toBeTruthy()
      expect(container.querySelector('.disclosure-content')).toBeTruthy()

      disclosure.destroy()

      expect(container.querySelector('.disclosure-trigger')).toBeFalsy()
      expect(container.querySelector('.disclosure-content')).toBeFalsy()
    })
  })
})

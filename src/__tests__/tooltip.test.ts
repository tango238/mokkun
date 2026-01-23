/**
 * Tooltip Component Tests
 * ツールチップコンポーネントのテスト（）
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  Tooltip,
  createTooltip,
  type TooltipConfig,
  type TooltipCallbacks,
} from '../renderer/components/tooltip'

// =============================================================================
// Test Utilities
// =============================================================================

function createMockTrigger(): HTMLElement {
  const trigger = document.createElement('button')
  trigger.textContent = 'Trigger'
  document.body.appendChild(trigger)
  return trigger
}

function cleanupElement(element: HTMLElement | null): void {
  if (element && element.parentNode) {
    element.parentNode.removeChild(element)
  }
}

function waitForTimeout(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// =============================================================================
// Tooltip Component Tests
// =============================================================================

describe('Tooltip Component', () => {
  let trigger: HTMLElement

  beforeEach(() => {
    trigger = createMockTrigger()
  })

  afterEach(() => {
    cleanupElement(trigger)
    // Clean up any remaining tooltips
    const tooltips = document.querySelectorAll('.mokkun-tooltip')
    tooltips.forEach((tooltip) => cleanupElement(tooltip as HTMLElement))
  })

  // ===========================================================================
  // Initialization Tests
  // ===========================================================================

  describe('Initialization', () => {
    it('should initialize with default config', () => {
      const config: TooltipConfig = { content: 'Test tooltip' }
      const tooltip = new Tooltip(trigger, config)

      expect(tooltip.isVisible()).toBe(false)
      expect(trigger.hasAttribute('data-tooltip-trigger')).toBe(true)
      expect(trigger.hasAttribute('aria-describedby')).toBe(true)

      tooltip.destroy()
    })

    it('should initialize without marking trigger when markTrigger is false', () => {
      const config: TooltipConfig = { content: 'Test tooltip', markTrigger: false }
      const tooltip = new Tooltip(trigger, config)

      expect(trigger.hasAttribute('data-tooltip-trigger')).toBe(false)
      expect(trigger.hasAttribute('aria-describedby')).toBe(false)

      tooltip.destroy()
    })

    it('should create tooltip using factory function', () => {
      const config: TooltipConfig = { content: 'Factory tooltip' }
      const tooltip = createTooltip(trigger, config)

      expect(tooltip).toBeInstanceOf(Tooltip)

      tooltip.destroy()
    })
  })

  // ===========================================================================
  // Position Tests
  // ===========================================================================

  describe('Position', () => {
    it('should default to top position', async () => {
      const config: TooltipConfig = { content: 'Top tooltip', delay: 0 }
      const tooltip = new Tooltip(trigger, config)

      tooltip.showImmediate()
      await waitForTimeout(50)

      const tooltipElement = document.querySelector('.mokkun-tooltip')
      expect(tooltipElement).toBeTruthy()
      expect(tooltipElement?.classList.contains('tooltip-top')).toBe(true)
      expect(tooltipElement?.getAttribute('data-position')).toBe('top')

      tooltip.destroy()
    })

    it('should support bottom position', async () => {
      const config: TooltipConfig = {
        content: 'Bottom tooltip',
        position: 'bottom',
        delay: 0,
      }
      const tooltip = new Tooltip(trigger, config)

      tooltip.showImmediate()
      await waitForTimeout(50)

      const tooltipElement = document.querySelector('.mokkun-tooltip')
      expect(tooltipElement?.classList.contains('tooltip-bottom')).toBe(true)
      expect(tooltipElement?.getAttribute('data-position')).toBe('bottom')

      tooltip.destroy()
    })

    it('should support left position', async () => {
      const config: TooltipConfig = {
        content: 'Left tooltip',
        position: 'left',
        delay: 0,
      }
      const tooltip = new Tooltip(trigger, config)

      tooltip.showImmediate()
      await waitForTimeout(50)

      const tooltipElement = document.querySelector('.mokkun-tooltip')
      expect(tooltipElement?.classList.contains('tooltip-left')).toBe(true)
      expect(tooltipElement?.getAttribute('data-position')).toBe('left')

      tooltip.destroy()
    })

    it('should support right position', async () => {
      const config: TooltipConfig = {
        content: 'Right tooltip',
        position: 'right',
        delay: 0,
      }
      const tooltip = new Tooltip(trigger, config)

      tooltip.showImmediate()
      await waitForTimeout(50)

      const tooltipElement = document.querySelector('.mokkun-tooltip')
      expect(tooltipElement?.classList.contains('tooltip-right')).toBe(true)
      expect(tooltipElement?.getAttribute('data-position')).toBe('right')

      tooltip.destroy()
    })

    it('should update position dynamically', async () => {
      const config: TooltipConfig = { content: 'Dynamic position', delay: 0 }
      const tooltip = new Tooltip(trigger, config)

      tooltip.showImmediate()
      await waitForTimeout(50)

      let tooltipElement = document.querySelector('.mokkun-tooltip')
      expect(tooltipElement?.getAttribute('data-position')).toBe('top')

      tooltip.setPosition('bottom')
      await waitForTimeout(50)

      tooltipElement = document.querySelector('.mokkun-tooltip')
      expect(tooltipElement?.getAttribute('data-position')).toBe('bottom')

      tooltip.destroy()
    })
  })

  // ===========================================================================
  // Content Tests
  // ===========================================================================

  describe('Content', () => {
    it('should render text content', async () => {
      const config: TooltipConfig = { content: 'Plain text content', delay: 0 }
      const tooltip = new Tooltip(trigger, config)

      tooltip.showImmediate()
      await waitForTimeout(50)

      const contentElement = document.querySelector('.tooltip-content')
      expect(contentElement?.textContent).toBe('Plain text content')

      tooltip.destroy()
    })

    it('should render HTML content when isHtml is true', async () => {
      const config: TooltipConfig = {
        content: '<strong>Bold</strong> text',
        isHtml: true,
        delay: 0,
      }
      const tooltip = new Tooltip(trigger, config)

      tooltip.showImmediate()
      await waitForTimeout(50)

      const contentElement = document.querySelector('.tooltip-content')
      expect(contentElement?.innerHTML).toBe('<strong>Bold</strong> text')
      expect(contentElement?.querySelector('strong')).toBeTruthy()

      tooltip.destroy()
    })

    it('should update content dynamically', async () => {
      const config: TooltipConfig = { content: 'Initial content', delay: 0 }
      const tooltip = new Tooltip(trigger, config)

      tooltip.showImmediate()
      await waitForTimeout(50)

      let contentElement = document.querySelector('.tooltip-content')
      expect(contentElement?.textContent).toBe('Initial content')

      tooltip.setContent('Updated content')
      await waitForTimeout(50)

      contentElement = document.querySelector('.tooltip-content')
      expect(contentElement?.textContent).toBe('Updated content')

      tooltip.destroy()
    })
  })

  // ===========================================================================
  // Arrow Tests
  // ===========================================================================

  describe('Arrow', () => {
    it('should show arrow by default', async () => {
      const config: TooltipConfig = { content: 'With arrow', delay: 0 }
      const tooltip = new Tooltip(trigger, config)

      tooltip.showImmediate()
      await waitForTimeout(50)

      const arrow = document.querySelector('.tooltip-arrow')
      expect(arrow).toBeTruthy()

      tooltip.destroy()
    })

    it('should hide arrow when showArrow is false', async () => {
      const config: TooltipConfig = {
        content: 'Without arrow',
        showArrow: false,
        delay: 0,
      }
      const tooltip = new Tooltip(trigger, config)

      tooltip.showImmediate()
      await waitForTimeout(50)

      const arrow = document.querySelector('.tooltip-arrow')
      expect(arrow).toBeFalsy()

      tooltip.destroy()
    })
  })

  // ===========================================================================
  // Delay Tests
  // ===========================================================================

  describe('Delay', () => {
    it('should show immediately when delay is 0', async () => {
      const config: TooltipConfig = { content: 'No delay', delay: 0 }
      const tooltip = new Tooltip(trigger, config)

      tooltip.show()
      await waitForTimeout(50)

      const tooltipElement = document.querySelector('.mokkun-tooltip')
      expect(tooltipElement).toBeTruthy()

      tooltip.destroy()
    })

    it('should delay showing by default (300ms)', async () => {
      const config: TooltipConfig = { content: 'Default delay' }
      const tooltip = new Tooltip(trigger, config)

      tooltip.show()
      await waitForTimeout(100)

      let tooltipElement = document.querySelector('.mokkun-tooltip')
      expect(tooltipElement).toBeFalsy()

      await waitForTimeout(250)

      tooltipElement = document.querySelector('.mokkun-tooltip')
      expect(tooltipElement).toBeTruthy()

      tooltip.destroy()
    })

    it('should respect custom delay', async () => {
      const config: TooltipConfig = { content: 'Custom delay', delay: 500 }
      const tooltip = new Tooltip(trigger, config)

      tooltip.show()
      await waitForTimeout(300)

      let tooltipElement = document.querySelector('.mokkun-tooltip')
      expect(tooltipElement).toBeFalsy()

      await waitForTimeout(250)

      tooltipElement = document.querySelector('.mokkun-tooltip')
      expect(tooltipElement).toBeTruthy()

      tooltip.destroy()
    })

    it('should show immediately with showImmediate()', async () => {
      const config: TooltipConfig = { content: 'Immediate show', delay: 500 }
      const tooltip = new Tooltip(trigger, config)

      tooltip.showImmediate()
      await waitForTimeout(50)

      const tooltipElement = document.querySelector('.mokkun-tooltip')
      expect(tooltipElement).toBeTruthy()

      tooltip.destroy()
    })
  })

  // ===========================================================================
  // Show/Hide Tests
  // ===========================================================================

  describe('Show/Hide', () => {
    it('should show and hide tooltip', async () => {
      const config: TooltipConfig = { content: 'Toggle tooltip', delay: 0 }
      const tooltip = new Tooltip(trigger, config)

      expect(tooltip.isVisible()).toBe(false)

      tooltip.show()
      await waitForTimeout(50)

      expect(tooltip.isVisible()).toBe(true)
      const tooltipElement = document.querySelector('.mokkun-tooltip')
      expect(tooltipElement).toBeTruthy()

      tooltip.hide()
      await waitForTimeout(150)

      expect(tooltip.isVisible()).toBe(false)

      tooltip.destroy()
    })

    it('should not show when disabled', async () => {
      const config: TooltipConfig = { content: 'Disabled tooltip', disabled: true, delay: 0 }
      const tooltip = new Tooltip(trigger, config)

      tooltip.show()
      await waitForTimeout(50)

      expect(tooltip.isVisible()).toBe(false)
      const tooltipElement = document.querySelector('.mokkun-tooltip')
      expect(tooltipElement).toBeFalsy()

      tooltip.destroy()
    })

    it('should hide when disabled is set to true', async () => {
      const config: TooltipConfig = { content: 'Disable while shown', delay: 0 }
      const tooltip = new Tooltip(trigger, config)

      tooltip.showImmediate()
      await waitForTimeout(50)

      expect(tooltip.isVisible()).toBe(true)

      tooltip.setDisabled(true)
      await waitForTimeout(50)

      expect(tooltip.isVisible()).toBe(false)

      tooltip.destroy()
    })
  })

  // ===========================================================================
  // Callbacks Tests
  // ===========================================================================

  describe('Callbacks', () => {
    it('should call onShow callback', async () => {
      const onShow = vi.fn()
      const callbacks: TooltipCallbacks = { onShow }
      const config: TooltipConfig = { content: 'Callback test', delay: 0 }
      const tooltip = new Tooltip(trigger, config, callbacks)

      tooltip.show()
      await waitForTimeout(50)

      expect(onShow).toHaveBeenCalledTimes(1)

      tooltip.destroy()
    })

    it('should call onHide callback', async () => {
      const onHide = vi.fn()
      const callbacks: TooltipCallbacks = { onHide }
      const config: TooltipConfig = { content: 'Callback test', delay: 0 }
      const tooltip = new Tooltip(trigger, config, callbacks)

      tooltip.show()
      await waitForTimeout(50)

      tooltip.hide()
      await waitForTimeout(150)

      expect(onHide).toHaveBeenCalledTimes(1)

      tooltip.destroy()
    })
  })

  // ===========================================================================
  // Mouse Events Tests
  // ===========================================================================

  describe('Mouse Events', () => {
    it('should show on mouseenter', async () => {
      const config: TooltipConfig = { content: 'Mouse enter', delay: 0 }
      const tooltip = new Tooltip(trigger, config)

      const event = new MouseEvent('mouseenter', { bubbles: true })
      trigger.dispatchEvent(event)

      await waitForTimeout(50)

      expect(tooltip.isVisible()).toBe(true)

      tooltip.destroy()
    })

    it('should hide on mouseleave', async () => {
      const config: TooltipConfig = { content: 'Mouse leave', delay: 0 }
      const tooltip = new Tooltip(trigger, config)

      trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
      await waitForTimeout(50)

      expect(tooltip.isVisible()).toBe(true)

      trigger.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }))
      await waitForTimeout(150)

      expect(tooltip.isVisible()).toBe(false)

      tooltip.destroy()
    })
  })

  // ===========================================================================
  // Focus Events Tests
  // ===========================================================================

  describe('Focus Events', () => {
    it('should show on focus', async () => {
      const config: TooltipConfig = { content: 'Focus test', delay: 0 }
      const tooltip = new Tooltip(trigger, config)

      trigger.dispatchEvent(new FocusEvent('focus'))
      await waitForTimeout(50)

      expect(tooltip.isVisible()).toBe(true)

      tooltip.destroy()
    })

    it('should hide on blur', async () => {
      const config: TooltipConfig = { content: 'Blur test', delay: 0 }
      const tooltip = new Tooltip(trigger, config)

      trigger.dispatchEvent(new FocusEvent('focus'))
      await waitForTimeout(50)

      expect(tooltip.isVisible()).toBe(true)

      trigger.dispatchEvent(new FocusEvent('blur'))
      await waitForTimeout(150)

      expect(tooltip.isVisible()).toBe(false)

      tooltip.destroy()
    })
  })

  // ===========================================================================
  // Accessibility Tests
  // ===========================================================================

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', async () => {
      const config: TooltipConfig = { content: 'Accessible tooltip', delay: 0 }
      const tooltip = new Tooltip(trigger, config)

      const ariaDescribedBy = trigger.getAttribute('aria-describedby')
      expect(ariaDescribedBy).toBeTruthy()

      tooltip.showImmediate()
      await waitForTimeout(50)

      const tooltipElement = document.querySelector('.mokkun-tooltip')
      expect(tooltipElement?.getAttribute('role')).toBe('tooltip')
      expect(tooltipElement?.id).toBe(ariaDescribedBy)

      tooltip.destroy()
    })
  })

  // ===========================================================================
  // Cleanup Tests
  // ===========================================================================

  describe('Cleanup', () => {
    it('should remove tooltip on destroy', async () => {
      const config: TooltipConfig = { content: 'Destroy test', delay: 0 }
      const tooltip = new Tooltip(trigger, config)

      tooltip.showImmediate()
      await waitForTimeout(50)

      let tooltipElement = document.querySelector('.mokkun-tooltip')
      expect(tooltipElement).toBeTruthy()

      tooltip.destroy()
      await waitForTimeout(250)

      tooltipElement = document.querySelector('.mokkun-tooltip')
      expect(tooltipElement).toBeFalsy()
      expect(trigger.hasAttribute('data-tooltip-trigger')).toBe(false)
      expect(trigger.hasAttribute('aria-describedby')).toBe(false)
    })

    it('should not show after destroy', async () => {
      const config: TooltipConfig = { content: 'After destroy', delay: 0 }
      const tooltip = new Tooltip(trigger, config)

      tooltip.destroy()

      trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
      await waitForTimeout(50)

      const tooltipElement = document.querySelector('.mokkun-tooltip')
      expect(tooltipElement).toBeFalsy()
    })
  })

  // ===========================================================================
  // Max Width Tests
  // ===========================================================================

  describe('Max Width', () => {
    it('should use default max width of 200px', async () => {
      const config: TooltipConfig = { content: 'Default width', delay: 0 }
      const tooltip = new Tooltip(trigger, config)

      tooltip.showImmediate()
      await waitForTimeout(50)

      const tooltipElement = document.querySelector('.mokkun-tooltip') as HTMLElement
      expect(tooltipElement?.style.maxWidth).toBe('200px')

      tooltip.destroy()
    })

    it('should respect custom max width', async () => {
      const config: TooltipConfig = {
        content: 'Custom width',
        maxWidth: '300px',
        delay: 0,
      }
      const tooltip = new Tooltip(trigger, config)

      tooltip.showImmediate()
      await waitForTimeout(50)

      const tooltipElement = document.querySelector('.mokkun-tooltip') as HTMLElement
      expect(tooltipElement?.style.maxWidth).toBe('300px')

      tooltip.destroy()
    })
  })
})

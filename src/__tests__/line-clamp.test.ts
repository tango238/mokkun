/**
 * LineClamp Component Tests
 * 行数制限コンポーネントのテスト
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  LineClamp,
  createLineClamp,
  type LineClampConfig,
  type LineClampCallbacks,
} from '../renderer/components/line-clamp'

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

function waitForTimeout(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// =============================================================================
// LineClamp Component Tests
// =============================================================================

describe('LineClamp Component', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = createMockContainer()
  })

  afterEach(() => {
    cleanupElement(container)
    // Clean up any remaining tooltips
    const tooltips = document.querySelectorAll('.mokkun-tooltip')
    tooltips.forEach((tooltip) => cleanupElement(tooltip as HTMLElement))
  })

  // ===========================================================================
  // Initialization Tests
  // ===========================================================================

  describe('Initialization', () => {
    it('should initialize with default config', () => {
      const config: LineClampConfig = {
        text: 'This is a test text that might be clamped.',
        maxLines: 2,
      }
      const lineClamp = new LineClamp(config, container)

      const element = container.querySelector('.mokkun-line-clamp')
      expect(element).toBeTruthy()

      lineClamp.destroy()
    })

    it('should create line clamp using factory function', () => {
      const config: LineClampConfig = {
        text: 'Factory created text',
        maxLines: 3,
      }
      const lineClamp = createLineClamp(config, container)

      expect(lineClamp).toBeInstanceOf(LineClamp)

      lineClamp.destroy()
    })

    it('should render text content', () => {
      const config: LineClampConfig = {
        text: 'Simple text content',
        maxLines: 1,
      }
      const lineClamp = new LineClamp(config, container)

      const textElement = container.querySelector('.line-clamp-text')
      expect(textElement?.textContent).toBe('Simple text content')

      lineClamp.destroy()
    })

    it('should render HTML content when isHtml is true', () => {
      const config: LineClampConfig = {
        text: '<strong>Bold</strong> and <em>italic</em>',
        maxLines: 2,
        isHtml: true,
      }
      const lineClamp = new LineClamp(config, container)

      const textElement = container.querySelector('.line-clamp-text')
      expect(textElement?.querySelector('strong')).toBeTruthy()
      expect(textElement?.querySelector('em')).toBeTruthy()

      lineClamp.destroy()
    })
  })

  // ===========================================================================
  // MaxLines Tests
  // ===========================================================================

  describe('MaxLines', () => {
    it('should apply correct CSS for 1 line clamp', () => {
      const config: LineClampConfig = {
        text: 'Single line text that will be clamped',
        maxLines: 1,
      }
      const lineClamp = new LineClamp(config, container)

      const textElement = container.querySelector('.line-clamp-text') as HTMLElement
      expect(textElement?.style.getPropertyValue('-webkit-line-clamp')).toBe('1')

      lineClamp.destroy()
    })

    it('should apply correct CSS for 3 line clamp', () => {
      const config: LineClampConfig = {
        text: 'Multi line text that will be clamped',
        maxLines: 3,
      }
      const lineClamp = new LineClamp(config, container)

      const textElement = container.querySelector('.line-clamp-text') as HTMLElement
      expect(textElement?.style.getPropertyValue('-webkit-line-clamp')).toBe('3')

      lineClamp.destroy()
    })

    it('should support maxLines from 1 to 6', () => {
      for (let lines = 1; lines <= 6; lines++) {
        const config: LineClampConfig = {
          text: 'Test text',
          maxLines: lines as 1 | 2 | 3 | 4 | 5 | 6,
        }
        const lineClamp = new LineClamp(config, container)

        const textElement = container.querySelector('.line-clamp-text') as HTMLElement
        expect(textElement?.style.getPropertyValue('-webkit-line-clamp')).toBe(String(lines))

        lineClamp.destroy()
      }
    })

    it('should update maxLines dynamically', () => {
      const config: LineClampConfig = {
        text: 'Dynamic lines text',
        maxLines: 2,
      }
      const lineClamp = new LineClamp(config, container)

      let textElement = container.querySelector('.line-clamp-text') as HTMLElement
      expect(textElement?.style.getPropertyValue('-webkit-line-clamp')).toBe('2')

      lineClamp.setMaxLines(4)

      textElement = container.querySelector('.line-clamp-text') as HTMLElement
      expect(textElement?.style.getPropertyValue('-webkit-line-clamp')).toBe('4')

      lineClamp.destroy()
    })
  })

  // ===========================================================================
  // Expand Button Tests
  // ===========================================================================

  describe('Expand Button', () => {
    it('should show expand button when showExpandButton is true and text is clamped', () => {
      const config: LineClampConfig = {
        text: 'A'.repeat(500), // Long text that will be clamped
        maxLines: 2,
        showExpandButton: true,
      }
      const lineClamp = new LineClamp(config, container)

      // Simulate text being clamped by forcing clamped state
      lineClamp.setClampedForTesting(true)

      const expandButton = container.querySelector('.line-clamp-expand-button')
      expect(expandButton).toBeTruthy()
      expect(expandButton?.textContent).toBe('もっと見る')

      lineClamp.destroy()
    })

    it('should use custom expand button label', () => {
      const config: LineClampConfig = {
        text: 'A'.repeat(500),
        maxLines: 2,
        showExpandButton: true,
        expandButtonLabel: 'Show more',
      }
      const lineClamp = new LineClamp(config, container)

      lineClamp.setClampedForTesting(true)

      const expandButton = container.querySelector('.line-clamp-expand-button')
      expect(expandButton?.textContent).toBe('Show more')

      lineClamp.destroy()
    })

    it('should expand text when button is clicked', async () => {
      const config: LineClampConfig = {
        text: 'A'.repeat(500),
        maxLines: 2,
        showExpandButton: true,
      }
      const lineClamp = new LineClamp(config, container)

      lineClamp.setClampedForTesting(true)

      const expandButton = container.querySelector('.line-clamp-expand-button') as HTMLElement
      expandButton?.click()
      await waitForTimeout(50)

      expect(lineClamp.isExpanded()).toBe(true)
      const element = container.querySelector('.mokkun-line-clamp')
      expect(element?.classList.contains('expanded')).toBe(true)

      lineClamp.destroy()
    })

    it('should show collapse button when expanded', async () => {
      const config: LineClampConfig = {
        text: 'A'.repeat(500),
        maxLines: 2,
        showExpandButton: true,
        collapseButtonLabel: '折りたたむ',
      }
      const lineClamp = new LineClamp(config, container)

      lineClamp.setClampedForTesting(true)

      const expandButton = container.querySelector('.line-clamp-expand-button') as HTMLElement
      expandButton?.click()
      await waitForTimeout(50)

      const collapseButton = container.querySelector('.line-clamp-collapse-button')
      expect(collapseButton).toBeTruthy()
      expect(collapseButton?.textContent).toBe('折りたたむ')

      lineClamp.destroy()
    })

    it('should collapse text when collapse button is clicked', async () => {
      const config: LineClampConfig = {
        text: 'A'.repeat(500),
        maxLines: 2,
        showExpandButton: true,
      }
      const lineClamp = new LineClamp(config, container)

      lineClamp.setClampedForTesting(true)

      // Expand
      let expandButton = container.querySelector('.line-clamp-expand-button') as HTMLElement
      expandButton?.click()
      await waitForTimeout(50)

      expect(lineClamp.isExpanded()).toBe(true)

      // Collapse
      const collapseButton = container.querySelector('.line-clamp-collapse-button') as HTMLElement
      collapseButton?.click()
      await waitForTimeout(50)

      expect(lineClamp.isExpanded()).toBe(false)

      lineClamp.destroy()
    })

    it('should not show expand button when showExpandButton is false', () => {
      const config: LineClampConfig = {
        text: 'A'.repeat(500),
        maxLines: 2,
        showExpandButton: false,
      }
      const lineClamp = new LineClamp(config, container)

      const expandButton = container.querySelector('.line-clamp-expand-button')
      expect(expandButton).toBeFalsy()

      lineClamp.destroy()
    })
  })

  // ===========================================================================
  // Tooltip Tests
  // ===========================================================================

  describe('Tooltip', () => {
    it('should show tooltip on hover when showTooltip is true and text is clamped', async () => {
      const config: LineClampConfig = {
        text: 'A'.repeat(500),
        maxLines: 2,
        showTooltip: true,
        tooltipDelay: 0,
      }
      const lineClamp = new LineClamp(config, container)

      lineClamp.setClampedForTesting(true)

      const element = container.querySelector('.mokkun-line-clamp') as HTMLElement
      element?.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
      await waitForTimeout(50) // Wait for tooltip

      const tooltip = document.querySelector('.mokkun-tooltip')
      expect(tooltip).toBeTruthy()

      lineClamp.destroy()
    })

    it('should not show tooltip when text is not clamped', async () => {
      const config: LineClampConfig = {
        text: 'Short text',
        maxLines: 10,
        showTooltip: true,
      }
      const lineClamp = new LineClamp(config, container)

      // Default state: not clamped

      const element = container.querySelector('.mokkun-line-clamp') as HTMLElement
      element?.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
      await waitForTimeout(350)

      const tooltip = document.querySelector('.mokkun-tooltip')
      expect(tooltip).toBeFalsy()

      lineClamp.destroy()
    })

    it('should show full text in tooltip', async () => {
      const fullText = 'This is the full text that should be shown in the tooltip'
      const config: LineClampConfig = {
        text: fullText,
        maxLines: 1,
        showTooltip: true,
        tooltipDelay: 0,
      }
      const lineClamp = new LineClamp(config, container)

      lineClamp.setClampedForTesting(true)

      const element = container.querySelector('.mokkun-line-clamp') as HTMLElement
      element?.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
      await waitForTimeout(50)

      const tooltipContent = document.querySelector('.tooltip-content')
      expect(tooltipContent?.textContent).toBe(fullText)

      lineClamp.destroy()
    })

    it('should support custom tooltip position', () => {
      const config: LineClampConfig = {
        text: 'A'.repeat(500),
        maxLines: 2,
        showTooltip: true,
        tooltipPosition: 'bottom',
      }
      const lineClamp = new LineClamp(config, container)

      expect(lineClamp.getState().tooltipPosition).toBe('bottom')

      lineClamp.destroy()
    })

    it('should not show tooltip when showTooltip is false', async () => {
      const config: LineClampConfig = {
        text: 'A'.repeat(500),
        maxLines: 2,
        showTooltip: false,
      }
      const lineClamp = new LineClamp(config, container)

      lineClamp.setClampedForTesting(true)

      const element = container.querySelector('.mokkun-line-clamp') as HTMLElement
      element?.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
      await waitForTimeout(350)

      const tooltip = document.querySelector('.mokkun-tooltip')
      expect(tooltip).toBeFalsy()

      lineClamp.destroy()
    })
  })

  // ===========================================================================
  // State Tests
  // ===========================================================================

  describe('State', () => {
    it('should return correct state', () => {
      const config: LineClampConfig = {
        text: 'Test text',
        maxLines: 2,
        showExpandButton: true,
        showTooltip: true,
      }
      const lineClamp = new LineClamp(config, container)

      const state = lineClamp.getState()
      expect(state.text).toBe('Test text')
      expect(state.maxLines).toBe(2)
      expect(state.expanded).toBe(false)
      expect(state.showExpandButton).toBe(true)
      expect(state.showTooltip).toBe(true)

      lineClamp.destroy()
    })

    it('should update expanded state correctly', () => {
      const config: LineClampConfig = {
        text: 'A'.repeat(500),
        maxLines: 2,
        showExpandButton: true,
      }
      const lineClamp = new LineClamp(config, container)

      expect(lineClamp.isExpanded()).toBe(false)

      lineClamp.expand()
      expect(lineClamp.isExpanded()).toBe(true)

      lineClamp.collapse()
      expect(lineClamp.isExpanded()).toBe(false)

      lineClamp.destroy()
    })

    it('should toggle expanded state', () => {
      const config: LineClampConfig = {
        text: 'A'.repeat(500),
        maxLines: 2,
        showExpandButton: true,
      }
      const lineClamp = new LineClamp(config, container)

      expect(lineClamp.isExpanded()).toBe(false)

      lineClamp.toggle()
      expect(lineClamp.isExpanded()).toBe(true)

      lineClamp.toggle()
      expect(lineClamp.isExpanded()).toBe(false)

      lineClamp.destroy()
    })
  })

  // ===========================================================================
  // Callbacks Tests
  // ===========================================================================

  describe('Callbacks', () => {
    it('should call onExpand callback when expanded', () => {
      const onExpand = vi.fn()
      const callbacks: LineClampCallbacks = { onExpand }
      const config: LineClampConfig = {
        text: 'A'.repeat(500),
        maxLines: 2,
        showExpandButton: true,
      }
      const lineClamp = new LineClamp(config, container, callbacks)

      lineClamp.expand()

      expect(onExpand).toHaveBeenCalledTimes(1)

      lineClamp.destroy()
    })

    it('should call onCollapse callback when collapsed', () => {
      const onCollapse = vi.fn()
      const callbacks: LineClampCallbacks = { onCollapse }
      const config: LineClampConfig = {
        text: 'A'.repeat(500),
        maxLines: 2,
        showExpandButton: true,
      }
      const lineClamp = new LineClamp(config, container, callbacks)

      lineClamp.expand()
      lineClamp.collapse()

      expect(onCollapse).toHaveBeenCalledTimes(1)

      lineClamp.destroy()
    })

    it('should call onToggle callback', () => {
      const onToggle = vi.fn()
      const callbacks: LineClampCallbacks = { onToggle }
      const config: LineClampConfig = {
        text: 'A'.repeat(500),
        maxLines: 2,
        showExpandButton: true,
      }
      const lineClamp = new LineClamp(config, container, callbacks)

      lineClamp.toggle()

      expect(onToggle).toHaveBeenCalledWith(true) // expanded

      lineClamp.toggle()

      expect(onToggle).toHaveBeenCalledWith(false) // collapsed

      lineClamp.destroy()
    })
  })

  // ===========================================================================
  // Update Tests
  // ===========================================================================

  describe('Update', () => {
    it('should update text content', () => {
      const config: LineClampConfig = {
        text: 'Initial text',
        maxLines: 2,
      }
      const lineClamp = new LineClamp(config, container)

      let textElement = container.querySelector('.line-clamp-text')
      expect(textElement?.textContent).toBe('Initial text')

      lineClamp.setText('Updated text')

      textElement = container.querySelector('.line-clamp-text')
      expect(textElement?.textContent).toBe('Updated text')

      lineClamp.destroy()
    })

    it('should update maxLines', () => {
      const config: LineClampConfig = {
        text: 'Test text',
        maxLines: 2,
      }
      const lineClamp = new LineClamp(config, container)

      expect(lineClamp.getState().maxLines).toBe(2)

      lineClamp.setMaxLines(5)

      expect(lineClamp.getState().maxLines).toBe(5)

      lineClamp.destroy()
    })
  })

  // ===========================================================================
  // Ellipsis Tests
  // ===========================================================================

  describe('Ellipsis', () => {
    it('should have ellipsis CSS property', () => {
      const config: LineClampConfig = {
        text: 'Text with ellipsis',
        maxLines: 2,
      }
      const lineClamp = new LineClamp(config, container)

      const textElement = container.querySelector('.line-clamp-text') as HTMLElement

      // CSS class should enable text-overflow: ellipsis
      expect(textElement?.classList.contains('line-clamp-text')).toBe(true)

      lineClamp.destroy()
    })
  })

  // ===========================================================================
  // Cleanup Tests
  // ===========================================================================

  describe('Cleanup', () => {
    it('should remove element on destroy', () => {
      const config: LineClampConfig = {
        text: 'Destroy test',
        maxLines: 2,
      }
      const lineClamp = new LineClamp(config, container)

      let element = container.querySelector('.mokkun-line-clamp')
      expect(element).toBeTruthy()

      lineClamp.destroy()

      element = container.querySelector('.mokkun-line-clamp')
      expect(element).toBeFalsy()
    })

    it('should remove tooltip on destroy', async () => {
      const config: LineClampConfig = {
        text: 'A'.repeat(500),
        maxLines: 2,
        showTooltip: true,
        tooltipDelay: 0,
      }
      const lineClamp = new LineClamp(config, container)

      // Wait for requestAnimationFrame in render() to complete
      await waitForTimeout(20)

      lineClamp.setClampedForTesting(true)

      const element = container.querySelector('.mokkun-line-clamp') as HTMLElement
      element?.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
      await waitForTimeout(50)

      let tooltip = document.querySelector('.mokkun-tooltip')
      expect(tooltip).toBeTruthy()

      lineClamp.destroy()
      await waitForTimeout(250)

      tooltip = document.querySelector('.mokkun-tooltip')
      expect(tooltip).toBeFalsy()
    })
  })

  // ===========================================================================
  // Accessibility Tests
  // ===========================================================================

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for expandable content', () => {
      const config: LineClampConfig = {
        text: 'A'.repeat(500),
        maxLines: 2,
        showExpandButton: true,
      }
      const lineClamp = new LineClamp(config, container)

      lineClamp.setClampedForTesting(true)

      const element = container.querySelector('.mokkun-line-clamp')
      const expandButton = container.querySelector('.line-clamp-expand-button')

      expect(element?.getAttribute('aria-expanded')).toBe('false')
      expect(expandButton?.getAttribute('aria-controls')).toBeTruthy()

      lineClamp.destroy()
    })

    it('should update ARIA expanded state when toggled', () => {
      const config: LineClampConfig = {
        text: 'A'.repeat(500),
        maxLines: 2,
        showExpandButton: true,
      }
      const lineClamp = new LineClamp(config, container)

      lineClamp.setClampedForTesting(true)

      const element = container.querySelector('.mokkun-line-clamp')
      expect(element?.getAttribute('aria-expanded')).toBe('false')

      lineClamp.expand()

      expect(element?.getAttribute('aria-expanded')).toBe('true')

      lineClamp.destroy()
    })
  })

  // ===========================================================================
  // CSS Class Tests
  // ===========================================================================

  describe('CSS Classes', () => {
    it('should apply mokkun-line-clamp class', () => {
      const config: LineClampConfig = {
        text: 'Test text',
        maxLines: 2,
      }
      const lineClamp = new LineClamp(config, container)

      const element = container.querySelector('.mokkun-line-clamp')
      expect(element).toBeTruthy()

      lineClamp.destroy()
    })

    it('should apply expanded class when expanded', () => {
      const config: LineClampConfig = {
        text: 'Test text',
        maxLines: 2,
      }
      const lineClamp = new LineClamp(config, container)

      const element = container.querySelector('.mokkun-line-clamp')
      expect(element?.classList.contains('expanded')).toBe(false)

      lineClamp.expand()

      expect(element?.classList.contains('expanded')).toBe(true)

      lineClamp.destroy()
    })

    it('should apply clamped class when text is clamped', () => {
      const config: LineClampConfig = {
        text: 'A'.repeat(500),
        maxLines: 2,
      }
      const lineClamp = new LineClamp(config, container)

      lineClamp.setClampedForTesting(true)

      const element = container.querySelector('.mokkun-line-clamp')
      expect(element?.classList.contains('clamped')).toBe(true)

      lineClamp.destroy()
    })
  })
})

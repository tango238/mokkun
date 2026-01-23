/**
 * Heading Component Tests
 * 見出しコンポーネントのテスト（）
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  Heading,
  createHeading,
  type HeadingConfig,
  type HeadingCallbacks,
} from '../renderer/components/heading'

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
// Heading Component Tests
// =============================================================================

describe('Heading Component', () => {
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
    it('should initialize with required config', () => {
      const config: HeadingConfig = {
        level: 1,
        text: 'Test Heading',
      }
      const heading = new Heading(container, config)
      heading.render()

      expect(container.classList.contains('mokkun-heading')).toBe(true)
      expect(container.querySelector('.heading-element')).toBeTruthy()
      expect(container.querySelector('.heading-text')).toBeTruthy()
    })

    it('should render correct heading tag for level', () => {
      const levels = [1, 2, 3, 4, 5, 6] as const

      levels.forEach((level) => {
        const testContainer = createMockContainer()
        const config: HeadingConfig = {
          level,
          text: `Heading Level ${level}`,
        }
        const heading = new Heading(testContainer, config)
        heading.render()

        const headingElement = testContainer.querySelector(`h${level}`)
        expect(headingElement).toBeTruthy()
        expect(headingElement?.textContent).toContain(`Heading Level ${level}`)

        cleanupContainer(testContainer)
      })
    })

    it('should render heading text correctly', () => {
      const config: HeadingConfig = {
        level: 2,
        text: 'Sample Heading Text',
      }
      const heading = new Heading(container, config)
      heading.render()

      const textElement = container.querySelector('.heading-text')
      expect(textElement?.textContent).toBe('Sample Heading Text')
    })

    it('should apply default size based on level', () => {
      const config: HeadingConfig = {
        level: 1,
        text: 'H1 Heading',
      }
      const heading = new Heading(container, config)
      heading.render()

      expect(container.classList.contains('heading-size-2xl')).toBe(true)
    })

    it('should apply custom size when provided', () => {
      const config: HeadingConfig = {
        level: 1,
        text: 'H1 with Small Size',
        size: 'sm',
      }
      const heading = new Heading(container, config)
      heading.render()

      expect(container.classList.contains('heading-size-sm')).toBe(true)
      expect(container.classList.contains('heading-size-2xl')).toBe(false)
    })
  })

  // ===========================================================================
  // Size Variant Tests
  // ===========================================================================

  describe('Size Variants', () => {
    const sizes = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const

    sizes.forEach((size) => {
      it(`should apply ${size} size variant`, () => {
        const config: HeadingConfig = {
          level: 3,
          text: 'Test',
          size,
        }
        const heading = new Heading(container, config)
        heading.render()

        expect(container.classList.contains(`heading-size-${size}`)).toBe(true)
      })
    })

    it('should default to level-based size when not specified', () => {
      const levelSizeMap = [
        { level: 1, expectedSize: '2xl' },
        { level: 2, expectedSize: 'xl' },
        { level: 3, expectedSize: 'lg' },
        { level: 4, expectedSize: 'md' },
        { level: 5, expectedSize: 'sm' },
        { level: 6, expectedSize: 'xs' },
      ] as const

      levelSizeMap.forEach(({ level, expectedSize }) => {
        const testContainer = createMockContainer()
        const config: HeadingConfig = {
          level,
          text: `Level ${level}`,
        }
        const heading = new Heading(testContainer, config)
        heading.render()

        expect(testContainer.classList.contains(`heading-size-${expectedSize}`)).toBe(true)

        cleanupContainer(testContainer)
      })
    })
  })

  // ===========================================================================
  // Alignment Tests
  // ===========================================================================

  describe('Text Alignment', () => {
    const alignments = ['left', 'center', 'right'] as const

    alignments.forEach((align) => {
      it(`should apply ${align} alignment`, () => {
        const config: HeadingConfig = {
          level: 2,
          text: 'Aligned Heading',
          align,
        }
        const heading = new Heading(container, config)
        heading.render()

        expect(container.classList.contains(`heading-align-${align}`)).toBe(true)
      })
    })

    it('should default to left alignment when not specified', () => {
      const config: HeadingConfig = {
        level: 2,
        text: 'Default Alignment',
      }
      const heading = new Heading(container, config)
      heading.render()

      expect(container.classList.contains('heading-align-left')).toBe(true)
    })
  })

  // ===========================================================================
  // Color Variant Tests
  // ===========================================================================

  describe('Color Variants', () => {
    const colors = ['default', 'primary', 'secondary', 'muted', 'danger', 'success', 'warning'] as const

    colors.forEach((color) => {
      it(`should apply ${color} color variant`, () => {
        const config: HeadingConfig = {
          level: 2,
          text: 'Colored Heading',
          color,
        }
        const heading = new Heading(container, config)
        heading.render()

        expect(container.classList.contains(`heading-color-${color}`)).toBe(true)
      })
    })

    it('should default to default color when not specified', () => {
      const config: HeadingConfig = {
        level: 2,
        text: 'Default Color',
      }
      const heading = new Heading(container, config)
      heading.render()

      expect(container.classList.contains('heading-color-default')).toBe(true)
    })
  })

  // ===========================================================================
  // Icon Tests
  // ===========================================================================

  describe('Icon Support', () => {
    it('should render icon when provided', () => {
      const config: HeadingConfig = {
        level: 2,
        text: 'Heading with Icon',
        icon: '🎉',
      }
      const heading = new Heading(container, config)
      heading.render()

      const iconElement = container.querySelector('.heading-icon')
      expect(iconElement).toBeTruthy()
      expect(iconElement?.textContent).toBe('🎉')
    })

    it('should not render icon element when not provided', () => {
      const config: HeadingConfig = {
        level: 2,
        text: 'Heading without Icon',
      }
      const heading = new Heading(container, config)
      heading.render()

      const iconElement = container.querySelector('.heading-icon')
      expect(iconElement).toBeFalsy()
    })
  })

  // ===========================================================================
  // State Management Tests
  // ===========================================================================

  describe('State Management', () => {
    it('should update text via setText', () => {
      const config: HeadingConfig = {
        level: 2,
        text: 'Initial Text',
      }
      const heading = new Heading(container, config)
      heading.render()

      heading.setText('Updated Text')

      const textElement = container.querySelector('.heading-text')
      expect(textElement?.textContent).toBe('Updated Text')
    })

    it('should update level via setLevel', () => {
      const config: HeadingConfig = {
        level: 2,
        text: 'Test',
      }
      const heading = new Heading(container, config)
      heading.render()

      heading.setLevel(4)

      expect(container.classList.contains('heading-level-4')).toBe(true)
      expect(container.querySelector('h4')).toBeTruthy()
    })

    it('should update size via setSize', () => {
      const config: HeadingConfig = {
        level: 2,
        text: 'Test',
        size: 'sm',
      }
      const heading = new Heading(container, config)
      heading.render()

      heading.setSize('xl')

      expect(container.classList.contains('heading-size-xl')).toBe(true)
      expect(container.classList.contains('heading-size-sm')).toBe(false)
    })

    it('should update alignment via setAlign', () => {
      const config: HeadingConfig = {
        level: 2,
        text: 'Test',
        align: 'left',
      }
      const heading = new Heading(container, config)
      heading.render()

      heading.setAlign('center')

      expect(container.classList.contains('heading-align-center')).toBe(true)
      expect(container.classList.contains('heading-align-left')).toBe(false)
    })

    it('should update color via setColor', () => {
      const config: HeadingConfig = {
        level: 2,
        text: 'Test',
        color: 'default',
      }
      const heading = new Heading(container, config)
      heading.render()

      heading.setColor('primary')

      expect(container.classList.contains('heading-color-primary')).toBe(true)
      expect(container.classList.contains('heading-color-default')).toBe(false)
    })

    it('should return current state via getState', () => {
      const config: HeadingConfig = {
        level: 3,
        text: 'Test State',
        size: 'lg',
        align: 'center',
        color: 'primary',
        icon: '⭐',
      }
      const heading = new Heading(container, config)
      heading.render()

      const state = heading.getState()

      expect(state.level).toBe(3)
      expect(state.text).toBe('Test State')
      expect(state.size).toBe('lg')
      expect(state.align).toBe('center')
      expect(state.color).toBe('primary')
      expect(state.icon).toBe('⭐')
    })
  })

  // ===========================================================================
  // Custom Class Tests
  // ===========================================================================

  describe('Custom Classes', () => {
    it('should apply custom className', () => {
      const config: HeadingConfig = {
        level: 2,
        text: 'Custom Class',
        className: 'custom-heading',
      }
      const heading = new Heading(container, config)
      heading.render()

      expect(container.classList.contains('custom-heading')).toBe(true)
      expect(container.classList.contains('mokkun-heading')).toBe(true)
    })
  })

  // ===========================================================================
  // Callbacks Tests
  // ===========================================================================

  describe('Callbacks', () => {
    it('should call onClick callback when clicked', () => {
      const onClickMock = vi.fn()
      const callbacks: HeadingCallbacks = {
        onClick: onClickMock,
      }
      const config: HeadingConfig = {
        level: 2,
        text: 'Clickable Heading',
      }
      const heading = new Heading(container, config, callbacks)
      heading.render()

      const headingElement = container.querySelector('.heading-element') as HTMLElement
      headingElement.click()

      expect(onClickMock).toHaveBeenCalledTimes(1)
      expect(onClickMock).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 2,
          text: 'Clickable Heading',
        })
      )
    })

    it('should not error when clicked without onClick callback', () => {
      const config: HeadingConfig = {
        level: 2,
        text: 'Non-clickable Heading',
      }
      const heading = new Heading(container, config)
      heading.render()

      const headingElement = container.querySelector('.heading-element') as HTMLElement

      expect(() => headingElement.click()).not.toThrow()
    })
  })

  // ===========================================================================
  // Factory Function Tests
  // ===========================================================================

  describe('Factory Function', () => {
    it('should create and render heading via createHeading', () => {
      const config: HeadingConfig = {
        level: 2,
        text: 'Factory Created',
      }
      const heading = createHeading(container, config)

      expect(heading).toBeInstanceOf(Heading)
      expect(container.querySelector('.heading-element')).toBeTruthy()
      expect(container.querySelector('.heading-text')?.textContent).toBe('Factory Created')
    })

    it('should accept callbacks in factory function', () => {
      const onClickMock = vi.fn()
      const config: HeadingConfig = {
        level: 2,
        text: 'Factory with Callback',
      }
      const callbacks: HeadingCallbacks = {
        onClick: onClickMock,
      }

      createHeading(container, config, callbacks)

      const headingElement = container.querySelector('.heading-element') as HTMLElement
      headingElement.click()

      expect(onClickMock).toHaveBeenCalledTimes(1)
    })
  })

  // ===========================================================================
  // Level Class Tests
  // ===========================================================================

  describe('Level Classes', () => {
    it('should apply level-specific class', () => {
      const config: HeadingConfig = {
        level: 3,
        text: 'Level 3',
      }
      const heading = new Heading(container, config)
      heading.render()

      expect(container.classList.contains('heading-level-3')).toBe(true)
    })

    it('should update level class when level changes', () => {
      const config: HeadingConfig = {
        level: 2,
        text: 'Test',
      }
      const heading = new Heading(container, config)
      heading.render()

      expect(container.classList.contains('heading-level-2')).toBe(true)

      heading.setLevel(5)

      expect(container.classList.contains('heading-level-5')).toBe(true)
      expect(container.classList.contains('heading-level-2')).toBe(false)
    })
  })
})

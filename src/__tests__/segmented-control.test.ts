/**
 * SegmentedControl Component Tests
 * セグメントコントロールコンポーネントのテスト
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  SegmentedControl,
  createSegmentedControl,
  type SegmentedControlConfig,
  type SegmentedControlCallbacks,
  type SegmentedControlOption,
} from '../renderer/components/segmented-control'

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

const mockOptions: SegmentedControlOption[] = [
  { value: 'list', label: 'List' },
  { value: 'grid', label: 'Grid' },
  { value: 'table', label: 'Table' },
]

const mockOptionsWithIcons: SegmentedControlOption[] = [
  { value: 'list', label: 'List', icon: '<svg viewBox="0 0 24 24"><path d="M3 4h18v2H3V4z"/></svg>' },
  { value: 'grid', label: 'Grid', icon: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/></svg>' },
]

// =============================================================================
// SegmentedControl Component Tests
// =============================================================================

describe('SegmentedControl Component', () => {
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
      const config: SegmentedControlConfig = {
        options: mockOptions,
      }
      const control = new SegmentedControl(container, config)
      control.render()

      expect(container.classList.contains('mokkun-segmented-control')).toBe(true)
      expect(container.getAttribute('role')).toBe('group')
      expect(container.querySelector('.segmented-options')).toBeTruthy()
    })

    it('should render all options', () => {
      const config: SegmentedControlConfig = {
        options: mockOptions,
      }
      const control = new SegmentedControl(container, config)
      control.render()

      const buttons = container.querySelectorAll('.segmented-button')
      expect(buttons.length).toBe(3)
    })

    it('should initialize with first option selected by default', () => {
      const config: SegmentedControlConfig = {
        options: mockOptions,
      }
      const control = new SegmentedControl(container, config)
      control.render()

      expect(control.getValue()).toBe('list')
      const selectedButton = container.querySelector('.segmented-button.selected')
      expect(selectedButton?.getAttribute('data-value')).toBe('list')
    })

    it('should initialize with specified value', () => {
      const config: SegmentedControlConfig = {
        options: mockOptions,
        value: 'grid',
      }
      const control = new SegmentedControl(container, config)
      control.render()

      expect(control.getValue()).toBe('grid')
      const selectedButton = container.querySelector('.segmented-button.selected')
      expect(selectedButton?.getAttribute('data-value')).toBe('grid')
    })

    it('should initialize disabled', () => {
      const config: SegmentedControlConfig = {
        options: mockOptions,
        disabled: true,
      }
      const control = new SegmentedControl(container, config)
      control.render()

      expect(control.isDisabled()).toBe(true)
      expect(container.hasAttribute('data-disabled')).toBe(true)
    })
  })

  // ===========================================================================
  // Rendering Tests
  // ===========================================================================

  describe('Rendering', () => {
    it('should render option labels', () => {
      const config: SegmentedControlConfig = {
        options: mockOptions,
      }
      const control = new SegmentedControl(container, config)
      control.render()

      const labels = container.querySelectorAll('.segmented-label')
      expect(labels.length).toBe(3)
      expect(labels[0].textContent).toBe('List')
      expect(labels[1].textContent).toBe('Grid')
      expect(labels[2].textContent).toBe('Table')
    })

    it('should render icons when provided', () => {
      const config: SegmentedControlConfig = {
        options: mockOptionsWithIcons,
      }
      const control = new SegmentedControl(container, config)
      control.render()

      const icons = container.querySelectorAll('.segmented-icon')
      expect(icons.length).toBe(2)
      expect(icons[0].innerHTML).toContain('<svg')
    })

    it('should not render icon wrapper when no icon provided', () => {
      const optionsWithoutIcons: SegmentedControlOption[] = [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
      ]
      const config: SegmentedControlConfig = {
        options: optionsWithoutIcons,
      }
      const control = new SegmentedControl(container, config)
      control.render()

      const icons = container.querySelectorAll('.segmented-icon')
      expect(icons.length).toBe(0)
    })
  })

  // ===========================================================================
  // Size Variations Tests
  // ===========================================================================

  describe('Size Variations', () => {
    it('should apply medium size by default', () => {
      const config: SegmentedControlConfig = {
        options: mockOptions,
      }
      const control = new SegmentedControl(container, config)
      control.render()

      expect(container.classList.contains('segmented-medium')).toBe(true)
    })

    it('should apply small size with size="s"', () => {
      const config: SegmentedControlConfig = {
        options: mockOptions,
        size: 's',
      }
      const control = new SegmentedControl(container, config)
      control.render()

      expect(container.classList.contains('segmented-small')).toBe(true)
    })

    it('should apply medium size with size="default"', () => {
      const config: SegmentedControlConfig = {
        options: mockOptions,
        size: 'default',
      }
      const control = new SegmentedControl(container, config)
      control.render()

      expect(container.classList.contains('segmented-medium')).toBe(true)
    })
  })

  // ===========================================================================
  // Full Width Tests
  // ===========================================================================

  describe('Full Width', () => {
    it('should not be full width by default', () => {
      const config: SegmentedControlConfig = {
        options: mockOptions,
      }
      const control = new SegmentedControl(container, config)
      control.render()

      expect(container.classList.contains('segmented-full-width')).toBe(false)
    })

    it('should apply full width when fullWidth=true', () => {
      const config: SegmentedControlConfig = {
        options: mockOptions,
        fullWidth: true,
      }
      const control = new SegmentedControl(container, config)
      control.render()

      expect(container.classList.contains('segmented-full-width')).toBe(true)
      expect(container.style.width).toBe('100%')
    })

    it('should apply custom width', () => {
      const config: SegmentedControlConfig = {
        options: mockOptions,
        width: 300,
      }
      const control = new SegmentedControl(container, config)
      control.render()

      expect(container.style.width).toBe('300px')
    })

    it('should apply custom width as string', () => {
      const config: SegmentedControlConfig = {
        options: mockOptions,
        width: '50%',
      }
      const control = new SegmentedControl(container, config)
      control.render()

      expect(container.style.width).toBe('50%')
    })
  })

  // ===========================================================================
  // Selection Tests
  // ===========================================================================

  describe('Selection', () => {
    it('should select option on click', () => {
      const config: SegmentedControlConfig = {
        options: mockOptions,
      }
      const control = new SegmentedControl(container, config)
      control.render()

      const gridButton = container.querySelector('[data-value="grid"]') as HTMLElement
      gridButton.click()

      expect(control.getValue()).toBe('grid')
    })

    it('should update visual state on selection', () => {
      const config: SegmentedControlConfig = {
        options: mockOptions,
      }
      const control = new SegmentedControl(container, config)
      control.render()

      const gridButton = container.querySelector('[data-value="grid"]') as HTMLElement
      gridButton.click()

      const selectedButton = container.querySelector('.segmented-button.selected')
      expect(selectedButton?.getAttribute('data-value')).toBe('grid')
      expect(selectedButton?.getAttribute('aria-pressed')).toBe('true')
    })

    it('should maintain mutual exclusivity', () => {
      const config: SegmentedControlConfig = {
        options: mockOptions,
      }
      const control = new SegmentedControl(container, config)
      control.render()

      // Initially 'list' is selected
      expect(control.getValue()).toBe('list')

      // Click 'grid'
      const gridButton = container.querySelector('[data-value="grid"]') as HTMLElement
      gridButton.click()

      // Only 'grid' should be selected
      const selectedButtons = container.querySelectorAll('.segmented-button.selected')
      expect(selectedButtons.length).toBe(1)
      expect(selectedButtons[0].getAttribute('data-value')).toBe('grid')
    })

    it('should fire onChange callback', () => {
      const onChange = vi.fn()
      const callbacks: SegmentedControlCallbacks = { onChange }
      const config: SegmentedControlConfig = {
        options: mockOptions,
      }
      const control = new SegmentedControl(container, config, callbacks)
      control.render()

      const gridButton = container.querySelector('[data-value="grid"]') as HTMLElement
      gridButton.click()

      expect(onChange).toHaveBeenCalledWith('grid', expect.objectContaining({
        selectedValue: 'grid',
      }))
    })

    it('should fire onClickOption callback ', () => {
      const onClickOption = vi.fn()
      const callbacks: SegmentedControlCallbacks = { onClickOption }
      const config: SegmentedControlConfig = {
        options: mockOptions,
      }
      const control = new SegmentedControl(container, config, callbacks)
      control.render()

      const tableButton = container.querySelector('[data-value="table"]') as HTMLElement
      tableButton.click()

      expect(onClickOption).toHaveBeenCalledWith('table')
    })

    it('should not re-select already selected option', () => {
      const onChange = vi.fn()
      const callbacks: SegmentedControlCallbacks = { onChange }
      const config: SegmentedControlConfig = {
        options: mockOptions,
        value: 'list',
      }
      const control = new SegmentedControl(container, config, callbacks)
      control.render()

      const listButton = container.querySelector('[data-value="list"]') as HTMLElement
      listButton.click()

      expect(onChange).not.toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // Disabled State Tests
  // ===========================================================================

  describe('Disabled State', () => {
    it('should not allow selection when group is disabled', () => {
      const onChange = vi.fn()
      const config: SegmentedControlConfig = {
        options: mockOptions,
        disabled: true,
      }
      const control = new SegmentedControl(container, config, { onChange })
      control.render()

      const gridButton = container.querySelector('[data-value="grid"]') as HTMLElement
      gridButton.click()

      expect(onChange).not.toHaveBeenCalled()
      expect(control.getValue()).toBe('list') // Still first option
    })

    it('should not allow selection of disabled option', () => {
      const optionsWithDisabled: SegmentedControlOption[] = [
        { value: 'list', label: 'List' },
        { value: 'grid', label: 'Grid', disabled: true },
        { value: 'table', label: 'Table' },
      ]
      const onChange = vi.fn()
      const config: SegmentedControlConfig = {
        options: optionsWithDisabled,
      }
      const control = new SegmentedControl(container, config, { onChange })
      control.render()

      const disabledButton = container.querySelector('[data-value="grid"]') as HTMLElement
      disabledButton.click()

      expect(onChange).not.toHaveBeenCalled()
    })

    it('should set aria-disabled on disabled options', () => {
      const optionsWithDisabled: SegmentedControlOption[] = [
        { value: 'list', label: 'List' },
        { value: 'grid', label: 'Grid', disabled: true },
      ]
      const config: SegmentedControlConfig = {
        options: optionsWithDisabled,
      }
      const control = new SegmentedControl(container, config)
      control.render()

      const disabledButton = container.querySelector('[data-value="grid"]')
      expect(disabledButton?.getAttribute('aria-disabled')).toBe('true')
      expect(disabledButton?.classList.contains('disabled')).toBe(true)
    })

    it('should select first non-disabled option by default', () => {
      const optionsWithFirstDisabled: SegmentedControlOption[] = [
        { value: 'list', label: 'List', disabled: true },
        { value: 'grid', label: 'Grid' },
        { value: 'table', label: 'Table' },
      ]
      const config: SegmentedControlConfig = {
        options: optionsWithFirstDisabled,
      }
      const control = new SegmentedControl(container, config)
      control.render()

      expect(control.getValue()).toBe('grid')
    })
  })

  // ===========================================================================
  // Keyboard Navigation Tests
  // ===========================================================================

  describe('Keyboard Navigation', () => {
    it('should navigate with ArrowRight', () => {
      const config: SegmentedControlConfig = {
        options: mockOptions,
      }
      const control = new SegmentedControl(container, config)
      control.render()

      const firstButton = container.querySelector('[data-value="list"]') as HTMLElement
      firstButton.focus()

      const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })
      firstButton.dispatchEvent(event)

      expect(control.getState().focusedIndex).toBe(1)
    })

    it('should navigate with ArrowLeft', () => {
      const config: SegmentedControlConfig = {
        options: mockOptions,
        value: 'grid',
      }
      const control = new SegmentedControl(container, config)
      control.render()

      const gridButton = container.querySelector('[data-value="grid"]') as HTMLElement
      gridButton.focus()

      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true })
      gridButton.dispatchEvent(event)

      expect(control.getState().focusedIndex).toBe(0)
    })

    it('should navigate with ArrowDown', () => {
      const config: SegmentedControlConfig = {
        options: mockOptions,
      }
      const control = new SegmentedControl(container, config)
      control.render()

      const firstButton = container.querySelector('[data-value="list"]') as HTMLElement
      firstButton.focus()

      const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })
      firstButton.dispatchEvent(event)

      expect(control.getState().focusedIndex).toBe(1)
    })

    it('should navigate with ArrowUp', () => {
      const config: SegmentedControlConfig = {
        options: mockOptions,
        value: 'grid',
      }
      const control = new SegmentedControl(container, config)
      control.render()

      const gridButton = container.querySelector('[data-value="grid"]') as HTMLElement
      gridButton.focus()

      const event = new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true })
      gridButton.dispatchEvent(event)

      expect(control.getState().focusedIndex).toBe(0)
    })

    it('should navigate to first option with Home', () => {
      const config: SegmentedControlConfig = {
        options: mockOptions,
        value: 'table',
      }
      const control = new SegmentedControl(container, config)
      control.render()

      const tableButton = container.querySelector('[data-value="table"]') as HTMLElement
      tableButton.focus()

      const event = new KeyboardEvent('keydown', { key: 'Home', bubbles: true })
      tableButton.dispatchEvent(event)

      expect(control.getState().focusedIndex).toBe(0)
    })

    it('should navigate to last option with End', () => {
      const config: SegmentedControlConfig = {
        options: mockOptions,
      }
      const control = new SegmentedControl(container, config)
      control.render()

      const firstButton = container.querySelector('[data-value="list"]') as HTMLElement
      firstButton.focus()

      const event = new KeyboardEvent('keydown', { key: 'End', bubbles: true })
      firstButton.dispatchEvent(event)

      expect(control.getState().focusedIndex).toBe(2)
    })

    it('should select option with Space key', () => {
      const config: SegmentedControlConfig = {
        options: mockOptions,
      }
      const control = new SegmentedControl(container, config)
      control.render()

      const gridButton = container.querySelector('[data-value="grid"]') as HTMLElement
      gridButton.focus()

      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true })
      gridButton.dispatchEvent(event)

      expect(control.getValue()).toBe('grid')
    })

    it('should select option with Enter key', () => {
      const config: SegmentedControlConfig = {
        options: mockOptions,
      }
      const control = new SegmentedControl(container, config)
      control.render()

      const tableButton = container.querySelector('[data-value="table"]') as HTMLElement
      tableButton.focus()

      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
      tableButton.dispatchEvent(event)

      expect(control.getValue()).toBe('table')
    })

    it('should skip disabled options when navigating', () => {
      const optionsWithDisabled: SegmentedControlOption[] = [
        { value: 'list', label: 'List' },
        { value: 'grid', label: 'Grid', disabled: true },
        { value: 'table', label: 'Table' },
      ]
      const config: SegmentedControlConfig = {
        options: optionsWithDisabled,
      }
      const control = new SegmentedControl(container, config)
      control.render()

      const firstButton = container.querySelector('[data-value="list"]') as HTMLElement
      firstButton.focus()

      const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })
      firstButton.dispatchEvent(event)

      // Should skip 'grid' (index 1) and go to 'table' (index 2)
      expect(control.getState().focusedIndex).toBe(2)
    })

    it('should loop navigation at the end', () => {
      const config: SegmentedControlConfig = {
        options: mockOptions,
        value: 'table',
      }
      const control = new SegmentedControl(container, config)
      control.render()

      const tableButton = container.querySelector('[data-value="table"]') as HTMLElement
      tableButton.focus()

      const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })
      tableButton.dispatchEvent(event)

      // Should loop back to first
      expect(control.getState().focusedIndex).toBe(0)
    })

    it('should loop navigation at the beginning', () => {
      const config: SegmentedControlConfig = {
        options: mockOptions,
      }
      const control = new SegmentedControl(container, config)
      control.render()

      const firstButton = container.querySelector('[data-value="list"]') as HTMLElement
      firstButton.focus()

      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true })
      firstButton.dispatchEvent(event)

      // Should loop to last
      expect(control.getState().focusedIndex).toBe(2)
    })
  })

  // ===========================================================================
  // Accessibility Tests
  // ===========================================================================

  describe('Accessibility', () => {
    it('should have role="group" on container', () => {
      const config: SegmentedControlConfig = {
        options: mockOptions,
      }
      const control = new SegmentedControl(container, config)
      control.render()

      expect(container.getAttribute('role')).toBe('group')
    })

    it('should have type="button" on each button', () => {
      const config: SegmentedControlConfig = {
        options: mockOptions,
      }
      const control = new SegmentedControl(container, config)
      control.render()

      const buttons = container.querySelectorAll('.segmented-button')
      buttons.forEach((button) => {
        expect(button.getAttribute('type')).toBe('button')
      })
    })

    it('should set aria-pressed correctly', () => {
      const config: SegmentedControlConfig = {
        options: mockOptions,
        value: 'grid',
      }
      const control = new SegmentedControl(container, config)
      control.render()

      const selectedButton = container.querySelector('[data-value="grid"]')
      const unselectedButton = container.querySelector('[data-value="list"]')

      expect(selectedButton?.getAttribute('aria-pressed')).toBe('true')
      expect(unselectedButton?.getAttribute('aria-pressed')).toBe('false')
    })

    it('should set aria-disabled correctly', () => {
      const optionsWithDisabled: SegmentedControlOption[] = [
        { value: 'list', label: 'List' },
        { value: 'grid', label: 'Grid', disabled: true },
      ]
      const config: SegmentedControlConfig = {
        options: optionsWithDisabled,
      }
      const control = new SegmentedControl(container, config)
      control.render()

      const disabledButton = container.querySelector('[data-value="grid"]')
      const enabledButton = container.querySelector('[data-value="list"]')

      expect(disabledButton?.getAttribute('aria-disabled')).toBe('true')
      expect(enabledButton?.getAttribute('aria-disabled')).toBe('false')
    })

    it('should implement roving tabindex', () => {
      const config: SegmentedControlConfig = {
        options: mockOptions,
        value: 'grid',
      }
      const control = new SegmentedControl(container, config)
      control.render()

      const selectedButton = container.querySelector('[data-value="grid"]')
      const unselectedButton = container.querySelector('[data-value="list"]')

      expect(selectedButton?.getAttribute('tabindex')).toBe('0')
      expect(unselectedButton?.getAttribute('tabindex')).toBe('-1')
    })
  })

  // ===========================================================================
  // Public Methods Tests
  // ===========================================================================

  describe('Public Methods', () => {
    it('should set value with setValue()', () => {
      const config: SegmentedControlConfig = {
        options: mockOptions,
      }
      const control = new SegmentedControl(container, config)
      control.render()

      control.setValue('table')

      expect(control.getValue()).toBe('table')
    })

    it('should not set value for disabled option via setValue()', () => {
      const optionsWithDisabled: SegmentedControlOption[] = [
        { value: 'list', label: 'List' },
        { value: 'grid', label: 'Grid', disabled: true },
      ]
      const config: SegmentedControlConfig = {
        options: optionsWithDisabled,
      }
      const control = new SegmentedControl(container, config)
      control.render()

      control.setValue('grid')

      expect(control.getValue()).toBe('list')
    })

    it('should not set value when group is disabled', () => {
      const config: SegmentedControlConfig = {
        options: mockOptions,
        disabled: true,
      }
      const control = new SegmentedControl(container, config)
      control.render()

      control.setValue('grid')

      expect(control.getValue()).toBe('list')
    })

    it('should set disabled state with setDisabled()', () => {
      const config: SegmentedControlConfig = {
        options: mockOptions,
      }
      const control = new SegmentedControl(container, config)
      control.render()

      control.setDisabled(true)

      expect(control.isDisabled()).toBe(true)
      expect(container.hasAttribute('data-disabled')).toBe(true)
    })

    it('should get current state with getState()', () => {
      const config: SegmentedControlConfig = {
        options: mockOptions,
        value: 'grid',
      }
      const control = new SegmentedControl(container, config)
      control.render()

      const state = control.getState()

      expect(state.selectedValue).toBe('grid')
      expect(state.disabled).toBe(false)
      expect(state.focusedIndex).toBe(1)
    })

    it('should return immutable state from getState()', () => {
      const config: SegmentedControlConfig = {
        options: mockOptions,
      }
      const control = new SegmentedControl(container, config)
      control.render()

      const state1 = control.getState()
      const state2 = control.getState()

      expect(state1).not.toBe(state2)
      expect(state1).toEqual(state2)
    })
  })

  // ===========================================================================
  // Factory Function Tests
  // ===========================================================================

  describe('Factory Function', () => {
    it('should create and render control with createSegmentedControl()', () => {
      const config: SegmentedControlConfig = {
        options: mockOptions,
      }
      const control = createSegmentedControl(container, config)

      expect(control).toBeInstanceOf(SegmentedControl)
      expect(container.classList.contains('mokkun-segmented-control')).toBe(true)
    })

    it('should accept callbacks in factory function', () => {
      const onChange = vi.fn()
      const callbacks: SegmentedControlCallbacks = { onChange }
      const config: SegmentedControlConfig = {
        options: mockOptions,
      }
      createSegmentedControl(container, config, callbacks)

      const gridButton = container.querySelector('[data-value="grid"]') as HTMLElement
      gridButton.click()

      expect(onChange).toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // Edge Cases Tests
  // ===========================================================================

  describe('Edge Cases', () => {
    it('should handle empty options array', () => {
      const config: SegmentedControlConfig = {
        options: [],
      }
      const control = new SegmentedControl(container, config)
      control.render()

      const buttons = container.querySelectorAll('.segmented-button')
      expect(buttons.length).toBe(0)
      expect(control.getValue()).toBe('')
    })

    it('should handle single option', () => {
      const config: SegmentedControlConfig = {
        options: [{ value: 'only', label: 'Only Option' }],
      }
      const control = new SegmentedControl(container, config)
      control.render()

      const buttons = container.querySelectorAll('.segmented-button')
      expect(buttons.length).toBe(1)
      expect(control.getValue()).toBe('only')
    })

    it('should handle all options disabled', () => {
      const optionsAllDisabled: SegmentedControlOption[] = [
        { value: 'list', label: 'List', disabled: true },
        { value: 'grid', label: 'Grid', disabled: true },
      ]
      const config: SegmentedControlConfig = {
        options: optionsAllDisabled,
      }
      const control = new SegmentedControl(container, config)
      control.render()

      // Should still have first option's value as default
      expect(control.getValue()).toBe('list')

      const button = container.querySelector('[data-value="grid"]') as HTMLElement
      button.click()

      // Should not change
      expect(control.getValue()).toBe('list')
    })

    it('should handle long labels', () => {
      const longOptions: SegmentedControlOption[] = [
        { value: 'option1', label: 'This is a very long label that might wrap' },
        { value: 'option2', label: 'Another long label here' },
      ]
      const config: SegmentedControlConfig = {
        options: longOptions,
      }
      const control = new SegmentedControl(container, config)
      control.render()

      const label = container.querySelector('.segmented-label')
      expect(label?.textContent).toContain('very long label')
    })

    it('should handle special characters in values', () => {
      const specialOptions: SegmentedControlOption[] = [
        { value: 'option-1', label: 'Option 1' },
        { value: 'option_2', label: 'Option 2' },
        { value: 'option.3', label: 'Option 3' },
      ]
      const config: SegmentedControlConfig = {
        options: specialOptions,
      }
      const control = new SegmentedControl(container, config)
      control.render()

      control.setValue('option_2')
      expect(control.getValue()).toBe('option_2')
    })

    it('should handle setValue with non-existent value', () => {
      const config: SegmentedControlConfig = {
        options: mockOptions,
      }
      const control = new SegmentedControl(container, config)
      control.render()

      control.setValue('non-existent')

      // Should remain unchanged
      expect(control.getValue()).toBe('list')
    })

    it('should maintain focus after selection', () => {
      const config: SegmentedControlConfig = {
        options: mockOptions,
      }
      const control = new SegmentedControl(container, config)
      control.render()

      const gridButton = container.querySelector('[data-value="grid"]') as HTMLElement
      gridButton.click()

      // After re-render, the grid button should be at focusedIndex
      expect(control.getState().focusedIndex).toBe(1)
    })
  })
})

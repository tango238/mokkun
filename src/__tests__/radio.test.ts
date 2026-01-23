/**
 * RadioButton Component Tests
 * ラジオボタンコンポーネントのテスト（）
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  RadioButton,
  createRadioButton,
  type RadioButtonConfig,
  type RadioButtonCallbacks,
} from '../renderer/components/radio'

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
// RadioButton Component Tests
// =============================================================================

describe('RadioButton Component', () => {
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
      const radio = new RadioButton(container)
      radio.render()

      expect(container.classList.contains('mokkun-radio')).toBe(true)
      expect(container.querySelector('.radio-wrapper')).toBeTruthy()
      expect(container.querySelector('.radio-input')).toBeTruthy()
      expect(container.querySelector('.radio-visual')).toBeTruthy()
    })

    it('should initialize unchecked by default', () => {
      const radio = new RadioButton(container)
      radio.render()

      expect(radio.isChecked()).toBe(false)
      expect(radio.getState().checked).toBe(false)
      expect(container.getAttribute('data-state')).toBe('unchecked')
    })

    it('should initialize with defaultChecked', () => {
      const config: RadioButtonConfig = { defaultChecked: true }
      const radio = new RadioButton(container, config)
      radio.render()

      expect(radio.isChecked()).toBe(true)
      expect(container.getAttribute('data-state')).toBe('checked')
    })

    it('should initialize disabled', () => {
      const config: RadioButtonConfig = { disabled: true }
      const radio = new RadioButton(container, config)
      radio.render()

      expect(radio.isDisabled()).toBe(true)
      expect(container.hasAttribute('data-disabled')).toBe(true)
    })

    it('should initialize with name and value', () => {
      const config: RadioButtonConfig = { name: 'option', value: 'yes' }
      const radio = new RadioButton(container, config)
      radio.render()

      expect(radio.getName()).toBe('option')
      expect(radio.getValue()).toBe('yes')

      const input = container.querySelector('.radio-input') as HTMLInputElement
      expect(input?.getAttribute('name')).toBe('option')
      expect(input?.getAttribute('value')).toBe('yes')
    })
  })

  // ===========================================================================
  // Size Variant Tests
  // ===========================================================================

  describe('Size Variants', () => {
    it('should apply medium size by default', () => {
      const radio = new RadioButton(container)
      radio.render()

      expect(container.classList.contains('radio-medium')).toBe(true)
    })

    it('should apply small size', () => {
      const config: RadioButtonConfig = { size: 'small' }
      const radio = new RadioButton(container, config)
      radio.render()

      expect(container.classList.contains('radio-small')).toBe(true)
    })

    it('should apply large size', () => {
      const config: RadioButtonConfig = { size: 'large' }
      const radio = new RadioButton(container, config)
      radio.render()

      expect(container.classList.contains('radio-large')).toBe(true)
    })
  })

  // ===========================================================================
  // Label Position Tests
  // ===========================================================================

  describe('Label Position', () => {
    it('should position label on right by default', () => {
      const config: RadioButtonConfig = {
        checkedLabel: 'Selected',
        uncheckedLabel: 'Unselected',
      }
      const radio = new RadioButton(container, config)
      radio.render()

      expect(container.classList.contains('radio-label-right')).toBe(true)
    })

    it('should position label on left', () => {
      const config: RadioButtonConfig = {
        checkedLabel: 'Selected',
        uncheckedLabel: 'Unselected',
        labelPosition: 'left',
      }
      const radio = new RadioButton(container, config)
      radio.render()

      expect(container.classList.contains('radio-label-left')).toBe(true)
    })

    it('should show correct label for checked state', () => {
      const config: RadioButtonConfig = {
        defaultChecked: true,
        checkedLabel: 'Yes',
        uncheckedLabel: 'No',
      }
      const radio = new RadioButton(container, config)
      radio.render()

      const label = container.querySelector('.radio-label')
      expect(label?.textContent).toBe('Yes')
    })

    it('should show correct label for unchecked state', () => {
      const config: RadioButtonConfig = {
        defaultChecked: false,
        checkedLabel: 'Yes',
        uncheckedLabel: 'No',
      }
      const radio = new RadioButton(container, config)
      radio.render()

      const label = container.querySelector('.radio-label')
      expect(label?.textContent).toBe('No')
    })
  })

  // ===========================================================================
  // State Management Tests
  // ===========================================================================

  describe('State Management', () => {
    it('should update checked state', () => {
      const radio = new RadioButton(container)
      radio.render()

      radio.setChecked(true)
      expect(radio.isChecked()).toBe(true)
      expect(container.getAttribute('data-state')).toBe('checked')

      radio.setChecked(false)
      expect(radio.isChecked()).toBe(false)
      expect(container.getAttribute('data-state')).toBe('unchecked')
    })

    it('should not change state when disabled', () => {
      const config: RadioButtonConfig = { disabled: true }
      const radio = new RadioButton(container, config)
      radio.render()

      radio.setChecked(true)
      expect(radio.isChecked()).toBe(false)
    })

    it('should update disabled state', () => {
      const radio = new RadioButton(container)
      radio.render()

      radio.setDisabled(true)
      expect(radio.isDisabled()).toBe(true)
      expect(container.hasAttribute('data-disabled')).toBe(true)

      radio.setDisabled(false)
      expect(radio.isDisabled()).toBe(false)
      expect(container.hasAttribute('data-disabled')).toBe(false)
    })

    it('should return immutable state copy', () => {
      const radio = new RadioButton(container)
      radio.render()

      const state1 = radio.getState()
      const state2 = radio.getState()

      expect(state1).not.toBe(state2)
      expect(state1).toEqual(state2)
    })
  })

  // ===========================================================================
  // Callback Tests
  // ===========================================================================

  describe('Callbacks', () => {
    it('should call onChange when checked state changes', () => {
      const onChange = vi.fn()
      const callbacks: RadioButtonCallbacks = { onChange }
      const radio = new RadioButton(container, {}, callbacks)
      radio.render()

      radio.setChecked(true)
      expect(onChange).toHaveBeenCalledWith(true, expect.objectContaining({ checked: true }))

      radio.setChecked(false)
      expect(onChange).toHaveBeenCalledWith(false, expect.objectContaining({ checked: false }))
    })

    it('should call onCheckedChange when checked state changes', () => {
      const onCheckedChange = vi.fn()
      const callbacks: RadioButtonCallbacks = { onCheckedChange }
      const radio = new RadioButton(container, {}, callbacks)
      radio.render()

      radio.setChecked(true)
      expect(onCheckedChange).toHaveBeenCalledWith(true)

      radio.setChecked(false)
      expect(onCheckedChange).toHaveBeenCalledWith(false)
    })

    it('should not call callbacks when state does not change', () => {
      const onChange = vi.fn()
      const callbacks: RadioButtonCallbacks = { onChange }
      const config: RadioButtonConfig = { defaultChecked: true }
      const radio = new RadioButton(container, config, callbacks)
      radio.render()

      onChange.mockClear()
      radio.setChecked(true)
      expect(onChange).not.toHaveBeenCalled()
    })

    it('should not call callbacks when disabled', () => {
      const onChange = vi.fn()
      const callbacks: RadioButtonCallbacks = { onChange }
      const config: RadioButtonConfig = { disabled: true }
      const radio = new RadioButton(container, config, callbacks)
      radio.render()

      radio.setChecked(true)
      expect(onChange).not.toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // Accessibility Tests
  // ===========================================================================

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for unchecked state', () => {
      const radio = new RadioButton(container)
      radio.render()

      const input = container.querySelector('.radio-input') as HTMLInputElement
      expect(input?.getAttribute('role')).toBe('radio')
      expect(input?.getAttribute('aria-checked')).toBe('false')
    })

    it('should have proper ARIA attributes for checked state', () => {
      const config: RadioButtonConfig = { defaultChecked: true }
      const radio = new RadioButton(container, config)
      radio.render()

      const input = container.querySelector('.radio-input') as HTMLInputElement
      expect(input?.getAttribute('aria-checked')).toBe('true')
    })

    it('should have aria-disabled when disabled', () => {
      const config: RadioButtonConfig = { disabled: true }
      const radio = new RadioButton(container, config)
      radio.render()

      const input = container.querySelector('.radio-input') as HTMLInputElement
      expect(input?.getAttribute('aria-disabled')).toBe('true')
    })

    it('should have aria-label with custom labels', () => {
      const config: RadioButtonConfig = {
        checkedLabel: 'Enabled',
        uncheckedLabel: 'Disabled',
      }
      const radio = new RadioButton(container, config)
      radio.render()

      const input = container.querySelector('.radio-input') as HTMLInputElement
      expect(input?.getAttribute('aria-label')).toBe('Disabled')

      radio.setChecked(true)
      const inputAfter = container.querySelector('.radio-input') as HTMLInputElement
      expect(inputAfter?.getAttribute('aria-label')).toBe('Enabled')
    })

    it('should have name attribute when provided', () => {
      const config: RadioButtonConfig = { name: 'choice' }
      const radio = new RadioButton(container, config)
      radio.render()

      const input = container.querySelector('.radio-input') as HTMLInputElement
      expect(input?.getAttribute('name')).toBe('choice')
    })

    it('should have value attribute when provided', () => {
      const config: RadioButtonConfig = { value: 'option1' }
      const radio = new RadioButton(container, config)
      radio.render()

      const input = container.querySelector('.radio-input') as HTMLInputElement
      expect(input?.getAttribute('value')).toBe('option1')
    })
  })

  // ===========================================================================
  // Visual Rendering Tests
  // ===========================================================================

  describe('Visual Rendering', () => {
    it('should render radio dot when checked', () => {
      const config: RadioButtonConfig = { defaultChecked: true }
      const radio = new RadioButton(container, config)
      radio.render()

      const dot = container.querySelector('.radio-dot')
      expect(dot).toBeTruthy()
      expect(dot?.getAttribute('data-state')).toBe('checked')
    })

    it('should render empty radio when unchecked', () => {
      const radio = new RadioButton(container)
      radio.render()

      const dot = container.querySelector('.radio-dot')
      expect(dot).toBeTruthy()
      expect(dot?.getAttribute('data-state')).toBe('unchecked')
    })

    it('should apply disabled class to visual elements', () => {
      const config: RadioButtonConfig = { disabled: true }
      const radio = new RadioButton(container, config)
      radio.render()

      const visual = container.querySelector('.radio-visual')
      const label = container.querySelector('.radio-label')

      expect(visual?.classList.contains('disabled')).toBe(true)
      expect(label?.classList.contains('disabled')).toBe(true)
    })

    it('should render circle element', () => {
      const radio = new RadioButton(container)
      radio.render()

      const circle = container.querySelector('.radio-circle')
      expect(circle).toBeTruthy()
    })
  })

  // ===========================================================================
  // Factory Function Tests
  // ===========================================================================

  describe('Factory Function', () => {
    it('should create and render radio using factory', () => {
      const radio = createRadioButton(container)

      expect(radio).toBeInstanceOf(RadioButton)
      expect(container.querySelector('.radio-wrapper')).toBeTruthy()
    })

    it('should accept config and callbacks in factory', () => {
      const onChange = vi.fn()
      const config: RadioButtonConfig = { defaultChecked: true }
      const callbacks: RadioButtonCallbacks = { onChange }

      const radio = createRadioButton(container, config, callbacks)

      expect(radio.isChecked()).toBe(true)

      radio.setChecked(false)
      expect(onChange).toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // Integration Tests
  // ===========================================================================

  describe('Integration Tests', () => {
    it('should handle rapid state changes', () => {
      const radio = new RadioButton(container)
      radio.render()

      radio.setChecked(true)
      radio.setChecked(false)
      radio.setChecked(true)
      radio.setChecked(false)

      expect(radio.isChecked()).toBe(false)
    })

    it('should handle complex state combinations', () => {
      const config: RadioButtonConfig = {
        defaultChecked: true,
        disabled: false,
      }
      const radio = new RadioButton(container, config)
      radio.render()

      expect(radio.isChecked()).toBe(true)

      radio.setDisabled(true)
      expect(radio.isDisabled()).toBe(true)

      radio.setChecked(false)
      expect(radio.isChecked()).toBe(true) // Should not change when disabled
    })

    it('should maintain state consistency across re-renders', () => {
      const radio = new RadioButton(container)
      radio.render()

      radio.setChecked(true)

      const stateBefore = radio.getState()
      radio.render()
      const stateAfter = radio.getState()

      expect(stateBefore).toEqual(stateAfter)
    })

    it('should work correctly in a radio group', () => {
      const container1 = createMockContainer()
      const container2 = createMockContainer()
      const container3 = createMockContainer()

      const radio1 = createRadioButton(container1, { name: 'group1', value: 'option1' })
      const radio2 = createRadioButton(container2, { name: 'group1', value: 'option2' })
      const radio3 = createRadioButton(container3, { name: 'group1', value: 'option3' })

      radio1.setChecked(true)
      expect(radio1.isChecked()).toBe(true)

      // In a real radio group, selecting another radio would uncheck the first
      // But our component doesn't handle that automatically
      // The parent needs to manage that behavior
      radio2.setChecked(true)
      expect(radio2.isChecked()).toBe(true)

      cleanupContainer(container1)
      cleanupContainer(container2)
      cleanupContainer(container3)
    })
  })
})

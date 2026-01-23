/**
 * Checkbox Component Tests
 * チェックボックスコンポーネントのテスト（）
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  Checkbox,
  createCheckbox,
  type CheckboxConfig,
  type CheckboxCallbacks,
} from '../renderer/components/checkbox'

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
// Checkbox Component Tests
// =============================================================================

describe('Checkbox Component', () => {
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
      const checkbox = new Checkbox(container)
      checkbox.render()

      expect(container.classList.contains('mokkun-checkbox')).toBe(true)
      expect(container.querySelector('.checkbox-wrapper')).toBeTruthy()
      expect(container.querySelector('.checkbox-input')).toBeTruthy()
      expect(container.querySelector('.checkbox-visual')).toBeTruthy()
    })

    it('should initialize unchecked by default', () => {
      const checkbox = new Checkbox(container)
      checkbox.render()

      expect(checkbox.isChecked()).toBe(false)
      expect(checkbox.getState().checked).toBe(false)
      expect(container.getAttribute('data-state')).toBe('unchecked')
    })

    it('should initialize with defaultChecked', () => {
      const config: CheckboxConfig = { defaultChecked: true }
      const checkbox = new Checkbox(container, config)
      checkbox.render()

      expect(checkbox.isChecked()).toBe(true)
      expect(container.getAttribute('data-state')).toBe('checked')
    })

    it('should initialize with defaultIndeterminate', () => {
      const config: CheckboxConfig = { defaultIndeterminate: true }
      const checkbox = new Checkbox(container, config)
      checkbox.render()

      expect(checkbox.isIndeterminate()).toBe(true)
      expect(container.getAttribute('data-state')).toBe('indeterminate')
    })

    it('should initialize disabled', () => {
      const config: CheckboxConfig = { disabled: true }
      const checkbox = new Checkbox(container, config)
      checkbox.render()

      expect(checkbox.isDisabled()).toBe(true)
      expect(container.hasAttribute('data-disabled')).toBe(true)
    })
  })

  // ===========================================================================
  // Size Variant Tests
  // ===========================================================================

  describe('Size Variants', () => {
    it('should apply medium size by default', () => {
      const checkbox = new Checkbox(container)
      checkbox.render()

      expect(container.classList.contains('checkbox-medium')).toBe(true)
    })

    it('should apply small size', () => {
      const config: CheckboxConfig = { size: 'small' }
      const checkbox = new Checkbox(container, config)
      checkbox.render()

      expect(container.classList.contains('checkbox-small')).toBe(true)
    })

    it('should apply large size', () => {
      const config: CheckboxConfig = { size: 'large' }
      const checkbox = new Checkbox(container, config)
      checkbox.render()

      expect(container.classList.contains('checkbox-large')).toBe(true)
    })
  })

  // ===========================================================================
  // Label Position Tests
  // ===========================================================================

  describe('Label Position', () => {
    it('should position label on right by default', () => {
      const config: CheckboxConfig = {
        checkedLabel: 'Checked',
        uncheckedLabel: 'Unchecked',
      }
      const checkbox = new Checkbox(container, config)
      checkbox.render()

      expect(container.classList.contains('checkbox-label-right')).toBe(true)
    })

    it('should position label on left', () => {
      const config: CheckboxConfig = {
        checkedLabel: 'Checked',
        uncheckedLabel: 'Unchecked',
        labelPosition: 'left',
      }
      const checkbox = new Checkbox(container, config)
      checkbox.render()

      expect(container.classList.contains('checkbox-label-left')).toBe(true)
    })

    it('should show correct label for checked state', () => {
      const config: CheckboxConfig = {
        defaultChecked: true,
        checkedLabel: 'Yes',
        uncheckedLabel: 'No',
      }
      const checkbox = new Checkbox(container, config)
      checkbox.render()

      const label = container.querySelector('.checkbox-label')
      expect(label?.textContent).toBe('Yes')
    })

    it('should show correct label for unchecked state', () => {
      const config: CheckboxConfig = {
        defaultChecked: false,
        checkedLabel: 'Yes',
        uncheckedLabel: 'No',
      }
      const checkbox = new Checkbox(container, config)
      checkbox.render()

      const label = container.querySelector('.checkbox-label')
      expect(label?.textContent).toBe('No')
    })
  })

  // ===========================================================================
  // State Management Tests
  // ===========================================================================

  describe('State Management', () => {
    it('should update checked state', () => {
      const checkbox = new Checkbox(container)
      checkbox.render()

      checkbox.setChecked(true)
      expect(checkbox.isChecked()).toBe(true)
      expect(container.getAttribute('data-state')).toBe('checked')

      checkbox.setChecked(false)
      expect(checkbox.isChecked()).toBe(false)
      expect(container.getAttribute('data-state')).toBe('unchecked')
    })

    it('should clear indeterminate when setting checked', () => {
      const config: CheckboxConfig = { defaultIndeterminate: true }
      const checkbox = new Checkbox(container, config)
      checkbox.render()

      expect(checkbox.isIndeterminate()).toBe(true)

      checkbox.setChecked(true)
      expect(checkbox.isIndeterminate()).toBe(false)
      expect(checkbox.isChecked()).toBe(true)
    })

    it('should toggle state from unchecked to checked', () => {
      const checkbox = new Checkbox(container)
      checkbox.render()

      checkbox.toggle()
      expect(checkbox.isChecked()).toBe(true)

      checkbox.toggle()
      expect(checkbox.isChecked()).toBe(false)
    })

    it('should toggle from indeterminate to checked', () => {
      const config: CheckboxConfig = { defaultIndeterminate: true }
      const checkbox = new Checkbox(container, config)
      checkbox.render()

      checkbox.toggle()
      expect(checkbox.isChecked()).toBe(true)
      expect(checkbox.isIndeterminate()).toBe(false)
    })

    it('should set indeterminate state', () => {
      const checkbox = new Checkbox(container)
      checkbox.render()

      checkbox.setIndeterminate(true)
      expect(checkbox.isIndeterminate()).toBe(true)
      expect(container.getAttribute('data-state')).toBe('indeterminate')

      checkbox.setIndeterminate(false)
      expect(checkbox.isIndeterminate()).toBe(false)
    })

    it('should not change state when disabled', () => {
      const config: CheckboxConfig = { disabled: true }
      const checkbox = new Checkbox(container, config)
      checkbox.render()

      checkbox.setChecked(true)
      expect(checkbox.isChecked()).toBe(false)

      checkbox.toggle()
      expect(checkbox.isChecked()).toBe(false)

      checkbox.setIndeterminate(true)
      expect(checkbox.isIndeterminate()).toBe(false)
    })

    it('should update disabled state', () => {
      const checkbox = new Checkbox(container)
      checkbox.render()

      checkbox.setDisabled(true)
      expect(checkbox.isDisabled()).toBe(true)
      expect(container.hasAttribute('data-disabled')).toBe(true)

      checkbox.setDisabled(false)
      expect(checkbox.isDisabled()).toBe(false)
      expect(container.hasAttribute('data-disabled')).toBe(false)
    })

    it('should return immutable state copy', () => {
      const checkbox = new Checkbox(container)
      checkbox.render()

      const state1 = checkbox.getState()
      const state2 = checkbox.getState()

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
      const callbacks: CheckboxCallbacks = { onChange }
      const checkbox = new Checkbox(container, {}, callbacks)
      checkbox.render()

      checkbox.setChecked(true)
      expect(onChange).toHaveBeenCalledWith(true, expect.objectContaining({ checked: true }))

      checkbox.setChecked(false)
      expect(onChange).toHaveBeenCalledWith(false, expect.objectContaining({ checked: false }))
    })

    it('should call onCheckedChange when checked state changes', () => {
      const onCheckedChange = vi.fn()
      const callbacks: CheckboxCallbacks = { onCheckedChange }
      const checkbox = new Checkbox(container, {}, callbacks)
      checkbox.render()

      checkbox.setChecked(true)
      expect(onCheckedChange).toHaveBeenCalledWith(true)

      checkbox.setChecked(false)
      expect(onCheckedChange).toHaveBeenCalledWith(false)
    })

    it('should not call callbacks when state does not change', () => {
      const onChange = vi.fn()
      const callbacks: CheckboxCallbacks = { onChange }
      const config: CheckboxConfig = { defaultChecked: true }
      const checkbox = new Checkbox(container, config, callbacks)
      checkbox.render()

      onChange.mockClear()
      checkbox.setChecked(true)
      expect(onChange).not.toHaveBeenCalled()
    })

    it('should not call callbacks when disabled', () => {
      const onChange = vi.fn()
      const callbacks: CheckboxCallbacks = { onChange }
      const config: CheckboxConfig = { disabled: true }
      const checkbox = new Checkbox(container, config, callbacks)
      checkbox.render()

      checkbox.setChecked(true)
      expect(onChange).not.toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // Accessibility Tests
  // ===========================================================================

  describe('Accessibility', () => {
    it('should have proper ARIA attributes for unchecked state', () => {
      const checkbox = new Checkbox(container)
      checkbox.render()

      const input = container.querySelector('.checkbox-input') as HTMLInputElement
      expect(input?.getAttribute('role')).toBe('checkbox')
      expect(input?.getAttribute('aria-checked')).toBe('false')
    })

    it('should have proper ARIA attributes for checked state', () => {
      const config: CheckboxConfig = { defaultChecked: true }
      const checkbox = new Checkbox(container, config)
      checkbox.render()

      const input = container.querySelector('.checkbox-input') as HTMLInputElement
      expect(input?.getAttribute('aria-checked')).toBe('true')
    })

    it('should have aria-checked="mixed" for indeterminate state', () => {
      const config: CheckboxConfig = { defaultIndeterminate: true }
      const checkbox = new Checkbox(container, config)
      checkbox.render()

      const input = container.querySelector('.checkbox-input') as HTMLInputElement
      expect(input?.getAttribute('aria-checked')).toBe('mixed')
    })

    it('should have aria-disabled when disabled', () => {
      const config: CheckboxConfig = { disabled: true }
      const checkbox = new Checkbox(container, config)
      checkbox.render()

      const input = container.querySelector('.checkbox-input') as HTMLInputElement
      expect(input?.getAttribute('aria-disabled')).toBe('true')
    })

    it('should have aria-label with custom labels', () => {
      const config: CheckboxConfig = {
        checkedLabel: 'Enabled',
        uncheckedLabel: 'Disabled',
      }
      const checkbox = new Checkbox(container, config)
      checkbox.render()

      const input = container.querySelector('.checkbox-input') as HTMLInputElement
      expect(input?.getAttribute('aria-label')).toBe('Disabled')

      checkbox.setChecked(true)
      const inputAfter = container.querySelector('.checkbox-input') as HTMLInputElement
      expect(inputAfter?.getAttribute('aria-label')).toBe('Enabled')
    })

    it('should have name attribute when provided', () => {
      const config: CheckboxConfig = { name: 'agree' }
      const checkbox = new Checkbox(container, config)
      checkbox.render()

      const input = container.querySelector('.checkbox-input') as HTMLInputElement
      expect(input?.getAttribute('name')).toBe('agree')
    })
  })

  // ===========================================================================
  // Visual Rendering Tests
  // ===========================================================================

  describe('Visual Rendering', () => {
    it('should render checkmark icon when checked', () => {
      const config: CheckboxConfig = { defaultChecked: true }
      const checkbox = new Checkbox(container, config)
      checkbox.render()

      const icon = container.querySelector('.checkbox-icon')
      expect(icon?.innerHTML).toContain('svg')
      expect(icon?.innerHTML).toContain('path')
    })

    it('should render indeterminate icon when indeterminate', () => {
      const config: CheckboxConfig = { defaultIndeterminate: true }
      const checkbox = new Checkbox(container, config)
      checkbox.render()

      const icon = container.querySelector('.checkbox-icon')
      expect(icon?.innerHTML).toContain('svg')
      expect(icon?.innerHTML).toContain('M3 8H13')
    })

    it('should not render icon when unchecked', () => {
      const checkbox = new Checkbox(container)
      checkbox.render()

      const icon = container.querySelector('.checkbox-icon')
      expect(icon?.innerHTML.trim()).toBe('')
    })

    it('should apply disabled class to visual elements', () => {
      const config: CheckboxConfig = { disabled: true }
      const checkbox = new Checkbox(container, config)
      checkbox.render()

      const visual = container.querySelector('.checkbox-visual')
      const label = container.querySelector('.checkbox-label')

      expect(visual?.classList.contains('disabled')).toBe(true)
      expect(label?.classList.contains('disabled')).toBe(true)
    })
  })

  // ===========================================================================
  // Factory Function Tests
  // ===========================================================================

  describe('Factory Function', () => {
    it('should create and render checkbox using factory', () => {
      const checkbox = createCheckbox(container)

      expect(checkbox).toBeInstanceOf(Checkbox)
      expect(container.querySelector('.checkbox-wrapper')).toBeTruthy()
    })

    it('should accept config and callbacks in factory', () => {
      const onChange = vi.fn()
      const config: CheckboxConfig = { defaultChecked: true }
      const callbacks: CheckboxCallbacks = { onChange }

      const checkbox = createCheckbox(container, config, callbacks)

      expect(checkbox.isChecked()).toBe(true)

      checkbox.setChecked(false)
      expect(onChange).toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // Integration Tests
  // ===========================================================================

  describe('Integration Tests', () => {
    it('should handle rapid state changes', () => {
      const checkbox = new Checkbox(container)
      checkbox.render()

      checkbox.setChecked(true)
      checkbox.setChecked(false)
      checkbox.setChecked(true)
      checkbox.setIndeterminate(true)
      checkbox.setChecked(false)

      expect(checkbox.isChecked()).toBe(false)
      expect(checkbox.isIndeterminate()).toBe(false)
    })

    it('should handle complex state combinations', () => {
      const config: CheckboxConfig = {
        defaultChecked: true,
        disabled: false,
      }
      const checkbox = new Checkbox(container, config)
      checkbox.render()

      expect(checkbox.isChecked()).toBe(true)

      checkbox.setDisabled(true)
      expect(checkbox.isDisabled()).toBe(true)

      checkbox.setChecked(false)
      expect(checkbox.isChecked()).toBe(true) // Should not change when disabled
    })

    it('should maintain state consistency across re-renders', () => {
      const checkbox = new Checkbox(container)
      checkbox.render()

      checkbox.setChecked(true)
      checkbox.setIndeterminate(true)

      const stateBefore = checkbox.getState()
      checkbox.render()
      const stateAfter = checkbox.getState()

      expect(stateBefore).toEqual(stateAfter)
    })
  })
})

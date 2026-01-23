/**
 * RadioButtonPanel Component Tests
 * ラジオボタンパネルコンポーネントのテスト
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  RadioButtonPanel,
  createRadioButtonPanel,
  type RadioButtonPanelConfig,
  type RadioButtonPanelCallbacks,
  type RadioButtonPanelOption,
} from '../renderer/components/radio-button-panel'

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

const mockOptions: RadioButtonPanelOption[] = [
  { value: 'basic', label: 'Basic Plan', description: 'For individuals' },
  { value: 'pro', label: 'Pro Plan', description: 'For professionals' },
  { value: 'enterprise', label: 'Enterprise Plan', description: 'For teams' },
]

// =============================================================================
// RadioButtonPanel Component Tests
// =============================================================================

describe('RadioButtonPanel Component', () => {
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
      const config: RadioButtonPanelConfig = {
        name: 'plan',
        options: mockOptions,
      }
      const panel = new RadioButtonPanel(container, config)
      panel.render()

      expect(container.classList.contains('mokkun-radio-button-panel')).toBe(true)
      expect(container.getAttribute('role')).toBe('radiogroup')
      expect(container.querySelector('.radio-panel-options')).toBeTruthy()
    })

    it('should render all options', () => {
      const config: RadioButtonPanelConfig = {
        name: 'plan',
        options: mockOptions,
      }
      const panel = new RadioButtonPanel(container, config)
      panel.render()

      const options = container.querySelectorAll('.radio-panel-option')
      expect(options.length).toBe(3)
    })

    it('should initialize with no selection by default', () => {
      const config: RadioButtonPanelConfig = {
        name: 'plan',
        options: mockOptions,
      }
      const panel = new RadioButtonPanel(container, config)
      panel.render()

      expect(panel.getValue()).toBe(null)
      expect(panel.getState().selectedValue).toBe(null)
    })

    it('should initialize with defaultValue', () => {
      const config: RadioButtonPanelConfig = {
        name: 'plan',
        options: mockOptions,
        defaultValue: 'pro',
      }
      const panel = new RadioButtonPanel(container, config)
      panel.render()

      expect(panel.getValue()).toBe('pro')
      const selectedOption = container.querySelector('[data-value="pro"]')
      expect(selectedOption?.getAttribute('aria-checked')).toBe('true')
    })

    it('should initialize disabled', () => {
      const config: RadioButtonPanelConfig = {
        name: 'plan',
        options: mockOptions,
        disabled: true,
      }
      const panel = new RadioButtonPanel(container, config)
      panel.render()

      expect(panel.isDisabled()).toBe(true)
      expect(container.hasAttribute('data-disabled')).toBe(true)
    })

    it('should generate unique instance ID', () => {
      const config: RadioButtonPanelConfig = {
        name: 'plan',
        options: mockOptions,
      }
      const panel1 = new RadioButtonPanel(container, config)
      const panel2 = new RadioButtonPanel(container, config)

      expect(panel1).not.toBe(panel2)
    })
  })

  // ===========================================================================
  // Rendering Tests
  // ===========================================================================

  describe('Rendering', () => {
    it('should render option labels', () => {
      const config: RadioButtonPanelConfig = {
        name: 'plan',
        options: mockOptions,
      }
      const panel = new RadioButtonPanel(container, config)
      panel.render()

      const labels = container.querySelectorAll('.radio-panel-label')
      expect(labels.length).toBe(3)
      expect(labels[0].textContent).toBe('Basic Plan')
      expect(labels[1].textContent).toBe('Pro Plan')
      expect(labels[2].textContent).toBe('Enterprise Plan')
    })

    it('should render option descriptions', () => {
      const config: RadioButtonPanelConfig = {
        name: 'plan',
        options: mockOptions,
      }
      const panel = new RadioButtonPanel(container, config)
      panel.render()

      const descriptions = container.querySelectorAll('.radio-panel-description')
      expect(descriptions.length).toBe(3)
      expect(descriptions[0].textContent).toBe('For individuals')
    })

    it('should render icons when provided', () => {
      const optionsWithIcons: RadioButtonPanelOption[] = [
        { value: 'option1', label: 'Option 1', icon: '<svg></svg>' },
        { value: 'option2', label: 'Option 2', icon: '<svg></svg>' },
      ]
      const config: RadioButtonPanelConfig = {
        name: 'test',
        options: optionsWithIcons,
      }
      const panel = new RadioButtonPanel(container, config)
      panel.render()

      const icons = container.querySelectorAll('.radio-panel-icon')
      expect(icons.length).toBe(2)
    })

    it('should render images when provided', () => {
      const optionsWithImages: RadioButtonPanelOption[] = [
        { value: 'option1', label: 'Option 1', image: 'https://example.com/image1.jpg' },
        { value: 'option2', label: 'Option 2', image: 'https://example.com/image2.jpg' },
      ]
      const config: RadioButtonPanelConfig = {
        name: 'test',
        options: optionsWithImages,
      }
      const panel = new RadioButtonPanel(container, config)
      panel.render()

      const images = container.querySelectorAll('.radio-panel-image')
      expect(images.length).toBe(2)
      expect((images[0] as HTMLImageElement).src).toBe('https://example.com/image1.jpg')
    })

    it('should render radio indicators', () => {
      const config: RadioButtonPanelConfig = {
        name: 'plan',
        options: mockOptions,
      }
      const panel = new RadioButtonPanel(container, config)
      panel.render()

      const indicators = container.querySelectorAll('.radio-panel-indicator')
      expect(indicators.length).toBe(3)

      const circles = container.querySelectorAll('.radio-circle')
      expect(circles.length).toBe(3)

      const dots = container.querySelectorAll('.radio-dot')
      expect(dots.length).toBe(3)
    })

    it('should apply correct CSS classes for size variants', () => {
      const sizes: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large']

      sizes.forEach((size) => {
        const testContainer = createMockContainer()
        const config: RadioButtonPanelConfig = {
          name: 'plan',
          options: mockOptions,
          size,
        }
        const panel = new RadioButtonPanel(testContainer, config)
        panel.render()

        expect(testContainer.classList.contains(`radio-panel-${size}`)).toBe(true)
        cleanupContainer(testContainer)
      })
    })
  })

  // ===========================================================================
  // Layout Tests
  // ===========================================================================

  describe('Layout', () => {
    it('should apply vertical layout by default', () => {
      const config: RadioButtonPanelConfig = {
        name: 'plan',
        options: mockOptions,
      }
      const panel = new RadioButtonPanel(container, config)
      panel.render()

      expect(container.getAttribute('data-direction')).toBe('vertical')
    })

    it('should apply horizontal layout', () => {
      const config: RadioButtonPanelConfig = {
        name: 'plan',
        options: mockOptions,
        direction: 'horizontal',
      }
      const panel = new RadioButtonPanel(container, config)
      panel.render()

      expect(container.getAttribute('data-direction')).toBe('horizontal')
    })

    it('should apply grid columns', () => {
      const columns: Array<1 | 2 | 3 | 4> = [1, 2, 3, 4]

      columns.forEach((cols) => {
        const testContainer = createMockContainer()
        const config: RadioButtonPanelConfig = {
          name: 'plan',
          options: mockOptions,
          columns: cols,
        }
        const panel = new RadioButtonPanel(testContainer, config)
        panel.render()

        expect(testContainer.getAttribute('data-columns')).toBe(String(cols))
        cleanupContainer(testContainer)
      })
    })
  })

  // ===========================================================================
  // Selection Tests
  // ===========================================================================

  describe('Selection', () => {
    it('should select option on click', () => {
      const config: RadioButtonPanelConfig = {
        name: 'plan',
        options: mockOptions,
      }
      const panel = new RadioButtonPanel(container, config)
      panel.render()

      const option = container.querySelector('[data-value="pro"]') as HTMLElement
      option.click()

      expect(panel.getValue()).toBe('pro')
      const updatedOption = container.querySelector('[data-value="pro"]')
      expect(updatedOption?.getAttribute('aria-checked')).toBe('true')
    })

    it('should update state correctly on selection', () => {
      const config: RadioButtonPanelConfig = {
        name: 'plan',
        options: mockOptions,
      }
      const panel = new RadioButtonPanel(container, config)
      panel.render()

      const option = container.querySelector('[data-value="basic"]') as HTMLElement
      option.click()

      const state = panel.getState()
      expect(state.selectedValue).toBe('basic')
    })

    it('should maintain mutual exclusivity', () => {
      const config: RadioButtonPanelConfig = {
        name: 'plan',
        options: mockOptions,
      }
      const panel = new RadioButtonPanel(container, config)
      panel.render()

      let option1 = container.querySelector('[data-value="basic"]') as HTMLElement
      let option2 = container.querySelector('[data-value="pro"]') as HTMLElement

      option1.click()
      option1 = container.querySelector('[data-value="basic"]') as HTMLElement
      option2 = container.querySelector('[data-value="pro"]') as HTMLElement
      expect(option1.getAttribute('aria-checked')).toBe('true')
      expect(option2.getAttribute('aria-checked')).toBe('false')

      option2.click()
      const updatedOption1 = container.querySelector('[data-value="basic"]')
      const updatedOption2 = container.querySelector('[data-value="pro"]')
      expect(updatedOption1?.getAttribute('aria-checked')).toBe('false')
      expect(updatedOption2?.getAttribute('aria-checked')).toBe('true')
    })

    it('should fire onChange callback', () => {
      const onChange = vi.fn()
      const callbacks: RadioButtonPanelCallbacks = { onChange }
      const config: RadioButtonPanelConfig = {
        name: 'plan',
        options: mockOptions,
      }
      const panel = new RadioButtonPanel(container, config, callbacks)
      panel.render()

      const option = container.querySelector('[data-value="pro"]') as HTMLElement
      option.click()

      expect(onChange).toHaveBeenCalledWith('pro', expect.objectContaining({
        selectedValue: 'pro',
      }))
    })

    it('should fire onValueChange callback', () => {
      const onValueChange = vi.fn()
      const callbacks: RadioButtonPanelCallbacks = { onValueChange }
      const config: RadioButtonPanelConfig = {
        name: 'plan',
        options: mockOptions,
      }
      const panel = new RadioButtonPanel(container, config, callbacks)
      panel.render()

      const option = container.querySelector('[data-value="enterprise"]') as HTMLElement
      option.click()

      expect(onValueChange).toHaveBeenCalledWith('enterprise')
    })

    it('should update hidden radio inputs on selection', () => {
      const config: RadioButtonPanelConfig = {
        name: 'plan',
        options: mockOptions,
      }
      const panel = new RadioButtonPanel(container, config)
      panel.render()

      const option = container.querySelector('[data-value="pro"]') as HTMLElement
      option.click()
      panel.render()

      const checkedInput = container.querySelector('input[value="pro"]') as HTMLInputElement
      expect(checkedInput.checked).toBe(true)
    })
  })

  // ===========================================================================
  // Disabled State Tests
  // ===========================================================================

  describe('Disabled State', () => {
    it('should not allow selection when group is disabled', () => {
      const config: RadioButtonPanelConfig = {
        name: 'plan',
        options: mockOptions,
        disabled: true,
      }
      const panel = new RadioButtonPanel(container, config)
      panel.render()

      const option = container.querySelector('[data-value="pro"]') as HTMLElement
      option.click()

      expect(panel.getValue()).toBe(null)
    })

    it('should not allow selection of disabled option', () => {
      const optionsWithDisabled: RadioButtonPanelOption[] = [
        { value: 'basic', label: 'Basic Plan' },
        { value: 'pro', label: 'Pro Plan', disabled: true },
        { value: 'enterprise', label: 'Enterprise Plan' },
      ]
      const config: RadioButtonPanelConfig = {
        name: 'plan',
        options: optionsWithDisabled,
      }
      const panel = new RadioButtonPanel(container, config)
      panel.render()

      const disabledOption = container.querySelector('[data-value="pro"]') as HTMLElement
      disabledOption.click()

      expect(panel.getValue()).toBe(null)
    })

    it('should allow selection of enabled options when group is not disabled', () => {
      const optionsWithDisabled: RadioButtonPanelOption[] = [
        { value: 'basic', label: 'Basic Plan' },
        { value: 'pro', label: 'Pro Plan', disabled: true },
        { value: 'enterprise', label: 'Enterprise Plan' },
      ]
      const config: RadioButtonPanelConfig = {
        name: 'plan',
        options: optionsWithDisabled,
      }
      const panel = new RadioButtonPanel(container, config)
      panel.render()

      const enabledOption = container.querySelector('[data-value="enterprise"]') as HTMLElement
      enabledOption.click()

      expect(panel.getValue()).toBe('enterprise')
    })

    it('should set aria-disabled on disabled options', () => {
      const optionsWithDisabled: RadioButtonPanelOption[] = [
        { value: 'basic', label: 'Basic Plan' },
        { value: 'pro', label: 'Pro Plan', disabled: true },
      ]
      const config: RadioButtonPanelConfig = {
        name: 'plan',
        options: optionsWithDisabled,
      }
      const panel = new RadioButtonPanel(container, config)
      panel.render()

      const disabledOption = container.querySelector('[data-value="pro"]')
      expect(disabledOption?.getAttribute('aria-disabled')).toBe('true')
    })

    it('should not fire callbacks for disabled options', () => {
      const onChange = vi.fn()
      const optionsWithDisabled: RadioButtonPanelOption[] = [
        { value: 'basic', label: 'Basic Plan', disabled: true },
      ]
      const callbacks: RadioButtonPanelCallbacks = { onChange }
      const config: RadioButtonPanelConfig = {
        name: 'plan',
        options: optionsWithDisabled,
      }
      const panel = new RadioButtonPanel(container, config, callbacks)
      panel.render()

      const disabledOption = container.querySelector('[data-value="basic"]') as HTMLElement
      disabledOption.click()

      expect(onChange).not.toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // Keyboard Navigation Tests
  // ===========================================================================

  describe('Keyboard Navigation', () => {
    it('should navigate with ArrowDown in vertical layout', () => {
      const config: RadioButtonPanelConfig = {
        name: 'plan',
        options: mockOptions,
        direction: 'vertical',
      }
      const panel = new RadioButtonPanel(container, config)
      panel.render()

      const firstOption = container.querySelector('[data-value="basic"]') as HTMLElement
      firstOption.focus()

      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' })
      firstOption.dispatchEvent(event)

      expect(panel.getState().focusedIndex).toBeGreaterThan(0)
    })

    it('should navigate with ArrowRight in horizontal layout', () => {
      const config: RadioButtonPanelConfig = {
        name: 'plan',
        options: mockOptions,
        direction: 'horizontal',
      }
      const panel = new RadioButtonPanel(container, config)
      panel.render()

      const firstOption = container.querySelector('[data-value="basic"]') as HTMLElement
      firstOption.focus()

      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' })
      firstOption.dispatchEvent(event)

      expect(panel.getState().focusedIndex).toBeGreaterThan(0)
    })

    it('should select option with Space key', () => {
      const config: RadioButtonPanelConfig = {
        name: 'plan',
        options: mockOptions,
      }
      const panel = new RadioButtonPanel(container, config)
      panel.render()

      const option = container.querySelector('[data-value="pro"]') as HTMLElement
      option.focus()

      const event = new KeyboardEvent('keydown', { key: ' ' })
      option.dispatchEvent(event)

      expect(panel.getValue()).toBe('pro')
    })

    it('should select option with Enter key', () => {
      const config: RadioButtonPanelConfig = {
        name: 'plan',
        options: mockOptions,
      }
      const panel = new RadioButtonPanel(container, config)
      panel.render()

      const option = container.querySelector('[data-value="enterprise"]') as HTMLElement
      option.focus()

      const event = new KeyboardEvent('keydown', { key: 'Enter' })
      option.dispatchEvent(event)

      expect(panel.getValue()).toBe('enterprise')
    })
  })

  // ===========================================================================
  // Accessibility Tests
  // ===========================================================================

  describe('Accessibility', () => {
    it('should have role="radiogroup" on container', () => {
      const config: RadioButtonPanelConfig = {
        name: 'plan',
        options: mockOptions,
      }
      const panel = new RadioButtonPanel(container, config)
      panel.render()

      expect(container.getAttribute('role')).toBe('radiogroup')
    })

    it('should have role="radio" on each option', () => {
      const config: RadioButtonPanelConfig = {
        name: 'plan',
        options: mockOptions,
      }
      const panel = new RadioButtonPanel(container, config)
      panel.render()

      const options = container.querySelectorAll('.radio-panel-option')
      options.forEach((option) => {
        expect(option.getAttribute('role')).toBe('radio')
      })
    })

    it('should set aria-checked correctly', () => {
      const config: RadioButtonPanelConfig = {
        name: 'plan',
        options: mockOptions,
        defaultValue: 'pro',
      }
      const panel = new RadioButtonPanel(container, config)
      panel.render()

      const selectedOption = container.querySelector('[data-value="pro"]')
      const unselectedOption = container.querySelector('[data-value="basic"]')

      expect(selectedOption?.getAttribute('aria-checked')).toBe('true')
      expect(unselectedOption?.getAttribute('aria-checked')).toBe('false')
    })

    it('should set aria-disabled correctly', () => {
      const optionsWithDisabled: RadioButtonPanelOption[] = [
        { value: 'basic', label: 'Basic Plan' },
        { value: 'pro', label: 'Pro Plan', disabled: true },
      ]
      const config: RadioButtonPanelConfig = {
        name: 'plan',
        options: optionsWithDisabled,
      }
      const panel = new RadioButtonPanel(container, config)
      panel.render()

      const disabledOption = container.querySelector('[data-value="pro"]')
      const enabledOption = container.querySelector('[data-value="basic"]')

      expect(disabledOption?.getAttribute('aria-disabled')).toBe('true')
      expect(enabledOption?.getAttribute('aria-disabled')).toBe('false')
    })

    it('should set aria-required when required', () => {
      const config: RadioButtonPanelConfig = {
        name: 'plan',
        options: mockOptions,
        required: true,
      }
      const panel = new RadioButtonPanel(container, config)
      panel.render()

      expect(container.getAttribute('aria-required')).toBe('true')
    })

    it('should implement roving tabindex', () => {
      const config: RadioButtonPanelConfig = {
        name: 'plan',
        options: mockOptions,
        defaultValue: 'pro',
      }
      const panel = new RadioButtonPanel(container, config)
      panel.render()

      const selectedOption = container.querySelector('[data-value="pro"]')
      const unselectedOption = container.querySelector('[data-value="basic"]')

      expect(selectedOption?.getAttribute('tabindex')).toBe('0')
      expect(unselectedOption?.getAttribute('tabindex')).toBe('-1')
    })
  })

  // ===========================================================================
  // Form Integration Tests
  // ===========================================================================

  describe('Form Integration', () => {
    it('should create hidden radio inputs', () => {
      const config: RadioButtonPanelConfig = {
        name: 'plan',
        options: mockOptions,
      }
      const panel = new RadioButtonPanel(container, config)
      panel.render()

      const inputs = container.querySelectorAll('input[type="radio"]')
      expect(inputs.length).toBe(3)
    })

    it('should set correct name on hidden inputs', () => {
      const config: RadioButtonPanelConfig = {
        name: 'subscription-plan',
        options: mockOptions,
      }
      const panel = new RadioButtonPanel(container, config)
      panel.render()

      const inputs = container.querySelectorAll('input[type="radio"]')
      inputs.forEach((input) => {
        expect((input as HTMLInputElement).name).toBe('subscription-plan')
      })
    })

    it('should set correct value on hidden inputs', () => {
      const config: RadioButtonPanelConfig = {
        name: 'plan',
        options: mockOptions,
      }
      const panel = new RadioButtonPanel(container, config)
      panel.render()

      const inputs = container.querySelectorAll('input[type="radio"]')
      expect((inputs[0] as HTMLInputElement).value).toBe('basic')
      expect((inputs[1] as HTMLInputElement).value).toBe('pro')
      expect((inputs[2] as HTMLInputElement).value).toBe('enterprise')
    })

    it('should check selected input', () => {
      const config: RadioButtonPanelConfig = {
        name: 'plan',
        options: mockOptions,
        defaultValue: 'pro',
      }
      const panel = new RadioButtonPanel(container, config)
      panel.render()

      const checkedInput = container.querySelector('input[value="pro"]') as HTMLInputElement
      expect(checkedInput.checked).toBe(true)
    })
  })

  // ===========================================================================
  // Public Methods Tests
  // ===========================================================================

  describe('Public Methods', () => {
    it('should set value with setValue()', () => {
      const config: RadioButtonPanelConfig = {
        name: 'plan',
        options: mockOptions,
      }
      const panel = new RadioButtonPanel(container, config)
      panel.render()

      panel.setValue('enterprise')

      expect(panel.getValue()).toBe('enterprise')
    })

    it('should not set value for disabled option', () => {
      const optionsWithDisabled: RadioButtonPanelOption[] = [
        { value: 'basic', label: 'Basic Plan' },
        { value: 'pro', label: 'Pro Plan', disabled: true },
      ]
      const config: RadioButtonPanelConfig = {
        name: 'plan',
        options: optionsWithDisabled,
      }
      const panel = new RadioButtonPanel(container, config)
      panel.render()

      panel.setValue('pro')

      expect(panel.getValue()).toBe(null)
    })

    it('should set disabled state with setDisabled()', () => {
      const config: RadioButtonPanelConfig = {
        name: 'plan',
        options: mockOptions,
      }
      const panel = new RadioButtonPanel(container, config)
      panel.render()

      panel.setDisabled(true)

      expect(panel.isDisabled()).toBe(true)
    })

    it('should get current state with getState()', () => {
      const config: RadioButtonPanelConfig = {
        name: 'plan',
        options: mockOptions,
        defaultValue: 'basic',
      }
      const panel = new RadioButtonPanel(container, config)
      panel.render()

      const state = panel.getState()

      expect(state.selectedValue).toBe('basic')
      expect(state.disabled).toBe(false)
      expect(state.focusedIndex).toBe(0)
    })
  })

  // ===========================================================================
  // Factory Function Tests
  // ===========================================================================

  describe('Factory Function', () => {
    it('should create and render panel with createRadioButtonPanel()', () => {
      const config: RadioButtonPanelConfig = {
        name: 'plan',
        options: mockOptions,
      }
      const panel = createRadioButtonPanel(container, config)

      expect(panel).toBeInstanceOf(RadioButtonPanel)
      expect(container.classList.contains('mokkun-radio-button-panel')).toBe(true)
    })

    it('should accept callbacks in factory function', () => {
      const onChange = vi.fn()
      const callbacks: RadioButtonPanelCallbacks = { onChange }
      const config: RadioButtonPanelConfig = {
        name: 'plan',
        options: mockOptions,
      }
      const panel = createRadioButtonPanel(container, config, callbacks)

      const option = container.querySelector('[data-value="pro"]') as HTMLElement
      option.click()

      expect(onChange).toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // Edge Cases Tests
  // ===========================================================================

  describe('Edge Cases', () => {
    it('should handle empty options array', () => {
      const config: RadioButtonPanelConfig = {
        name: 'plan',
        options: [],
      }
      const panel = new RadioButtonPanel(container, config)
      panel.render()

      const options = container.querySelectorAll('.radio-panel-option')
      expect(options.length).toBe(0)
    })

    it('should handle single option', () => {
      const config: RadioButtonPanelConfig = {
        name: 'plan',
        options: [{ value: 'only', label: 'Only Option' }],
      }
      const panel = new RadioButtonPanel(container, config)
      panel.render()

      const options = container.querySelectorAll('.radio-panel-option')
      expect(options.length).toBe(1)
    })

    it('should handle all options disabled', () => {
      const optionsAllDisabled: RadioButtonPanelOption[] = [
        { value: 'basic', label: 'Basic Plan', disabled: true },
        { value: 'pro', label: 'Pro Plan', disabled: true },
      ]
      const config: RadioButtonPanelConfig = {
        name: 'plan',
        options: optionsAllDisabled,
      }
      const panel = new RadioButtonPanel(container, config)
      panel.render()

      const option = container.querySelector('[data-value="basic"]') as HTMLElement
      option.click()

      expect(panel.getValue()).toBe(null)
    })

    it('should handle long labels and descriptions', () => {
      const longOptions: RadioButtonPanelOption[] = [
        {
          value: 'option1',
          label: 'This is a very long label that might wrap to multiple lines',
          description: 'This is an extremely long description that provides detailed information about the option and should wrap to multiple lines in the UI',
        },
      ]
      const config: RadioButtonPanelConfig = {
        name: 'plan',
        options: longOptions,
      }
      const panel = new RadioButtonPanel(container, config)
      panel.render()

      const label = container.querySelector('.radio-panel-label')
      expect(label?.textContent).toContain('very long label')
    })

    it('should not re-select already selected option', () => {
      const onChange = vi.fn()
      const callbacks: RadioButtonPanelCallbacks = { onChange }
      const config: RadioButtonPanelConfig = {
        name: 'plan',
        options: mockOptions,
        defaultValue: 'basic',
      }
      const panel = new RadioButtonPanel(container, config, callbacks)
      panel.render()

      const option = container.querySelector('[data-value="basic"]') as HTMLElement
      option.click()

      expect(onChange).not.toHaveBeenCalled()
    })

    it('should handle setValue to null', () => {
      const config: RadioButtonPanelConfig = {
        name: 'plan',
        options: mockOptions,
        defaultValue: 'basic',
      }
      const panel = new RadioButtonPanel(container, config)
      panel.render()

      panel.setValue(null)

      expect(panel.getValue()).toBe(null)
    })
  })
})

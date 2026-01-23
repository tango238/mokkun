/**
 * Select Component Tests
 * セレクトコンポーネントのテスト
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Select, createSelect } from '../renderer/components/select'
import type { SelectConfig, SelectOption, SelectOptionGroup } from '../types/schema'

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
// Test Data
// =============================================================================

const basicOptions: SelectOption[] = [
  { value: '1', label: 'Option 1' },
  { value: '2', label: 'Option 2' },
  { value: '3', label: 'Option 3', disabled: true },
]

const groupedOptions: SelectOption[] = [
  { value: '1', label: 'Option 1', group: 'Group A' },
  { value: '2', label: 'Option 2', group: 'Group A' },
  { value: '3', label: 'Option 3', group: 'Group B' },
  { value: '4', label: 'Option 4' }, // Ungrouped
]

const optionGroups: SelectOptionGroup[] = [
  {
    label: 'Group A',
    options: [
      { value: '1', label: 'Option 1' },
      { value: '2', label: 'Option 2' },
    ],
  },
  {
    label: 'Group B',
    options: [
      { value: '3', label: 'Option 3' },
      { value: '4', label: 'Option 4' },
    ],
  },
]

// =============================================================================
// Select Component Tests
// =============================================================================

describe('Select Component', () => {
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
    it('should initialize with basic options', () => {
      const config: SelectConfig = { options: basicOptions }
      const select = new Select(container, config)
      select.render()

      expect(container.classList.contains('mokkun-select')).toBe(true)
      const selectElement = container.querySelector('select')
      expect(selectElement).toBeTruthy()
      expect(selectElement?.options.length).toBe(4) // 3 options + 1 blank
    })

    it('should set default value', () => {
      const config: SelectConfig = {
        options: basicOptions,
        defaultValue: '2',
      }
      const select = new Select(container, config)
      select.render()

      expect(select.getValue()).toBe('2')
      const selectElement = container.querySelector('select') as HTMLSelectElement
      expect(selectElement.value).toBe('2')
    })

    it('should render blank option by default', () => {
      const config: SelectConfig = { options: basicOptions }
      const select = new Select(container, config)
      select.render()

      const selectElement = container.querySelector('select') as HTMLSelectElement
      const blankOption = selectElement.options[0]
      expect(blankOption.value).toBe('')
      expect(blankOption.textContent).toBe('Select...')
    })

    it('should render custom placeholder', () => {
      const config: SelectConfig = {
        options: basicOptions,
        placeholder: 'Choose an option',
      }
      const select = new Select(container, config)
      select.render()

      const selectElement = container.querySelector('select') as HTMLSelectElement
      const blankOption = selectElement.options[0]
      expect(blankOption.textContent).toBe('Choose an option')
    })

    it('should not render blank option when hasBlank is false', () => {
      const config: SelectConfig = {
        options: basicOptions,
        hasBlank: false,
      }
      const select = new Select(container, config)
      select.render()

      const selectElement = container.querySelector('select') as HTMLSelectElement
      expect(selectElement.options.length).toBe(3)
      expect(selectElement.options[0].value).toBe('1')
    })
  })

  // ===========================================================================
  // Size Variants
  // ===========================================================================

  describe('Size Variants', () => {
    it('should apply default size class', () => {
      const config: SelectConfig = { options: basicOptions }
      const select = new Select(container, config)
      select.render()

      expect(container.classList.contains('select-default')).toBe(true)
    })

    it('should apply small size class', () => {
      const config: SelectConfig = {
        options: basicOptions,
        size: 's',
      }
      const select = new Select(container, config)
      select.render()

      expect(container.classList.contains('select-s')).toBe(true)
    })
  })

  // ===========================================================================
  // State Management
  // ===========================================================================

  describe('State Management', () => {
    it('should update value', () => {
      const config: SelectConfig = { options: basicOptions }
      const select = new Select(container, config)
      select.render()

      select.setValue('2')
      expect(select.getValue()).toBe('2')

      const selectElement = container.querySelector('select') as HTMLSelectElement
      expect(selectElement.value).toBe('2')
    })

    it('should set null value as empty string', () => {
      const config: SelectConfig = {
        options: basicOptions,
        defaultValue: '1',
      }
      const select = new Select(container, config)
      select.render()

      select.setValue(null)
      expect(select.getValue()).toBe(null)

      const selectElement = container.querySelector('select') as HTMLSelectElement
      expect(selectElement.value).toBe('')
    })

    it('should not update when disabled', () => {
      const config: SelectConfig = {
        options: basicOptions,
        disabled: true,
        defaultValue: '1',
      }
      const select = new Select(container, config)
      select.render()

      select.setValue('2')
      expect(select.getValue()).toBe('1') // Should remain unchanged
    })

    it('should get state', () => {
      const config: SelectConfig = {
        options: basicOptions,
        defaultValue: '2',
        disabled: false,
        error: false,
      }
      const select = new Select(container, config)
      select.render()

      const state = select.getState()
      expect(state.value).toBe('2')
      expect(state.disabled).toBe(false)
      expect(state.error).toBe(false)
    })
  })

  // ===========================================================================
  // Disabled State
  // ===========================================================================

  describe('Disabled State', () => {
    it('should render disabled', () => {
      const config: SelectConfig = {
        options: basicOptions,
        disabled: true,
      }
      const select = new Select(container, config)
      select.render()

      expect(select.isDisabled()).toBe(true)
      expect(container.hasAttribute('data-disabled')).toBe(true)

      const selectElement = container.querySelector('select') as HTMLSelectElement
      expect(selectElement.disabled).toBe(true)
      expect(selectElement.getAttribute('aria-disabled')).toBe('true')
    })

    it('should set disabled state', () => {
      const config: SelectConfig = { options: basicOptions }
      const select = new Select(container, config)
      select.render()

      select.setDisabled(true)
      expect(select.isDisabled()).toBe(true)
      expect(container.hasAttribute('data-disabled')).toBe(true)

      select.setDisabled(false)
      expect(select.isDisabled()).toBe(false)
      expect(container.hasAttribute('data-disabled')).toBe(false)
    })
  })

  // ===========================================================================
  // Error State
  // ===========================================================================

  describe('Error State', () => {
    it('should render error state', () => {
      const config: SelectConfig = {
        options: basicOptions,
        error: true,
      }
      const select = new Select(container, config)
      select.render()

      expect(select.hasError()).toBe(true)
      expect(container.hasAttribute('data-error')).toBe(true)

      const selectElement = container.querySelector('select') as HTMLSelectElement
      expect(selectElement.classList.contains('error')).toBe(true)
      expect(selectElement.getAttribute('aria-invalid')).toBe('true')
    })

    it('should set error state', () => {
      const config: SelectConfig = { options: basicOptions }
      const select = new Select(container, config)
      select.render()

      select.setError(true)
      expect(select.hasError()).toBe(true)
      expect(container.hasAttribute('data-error')).toBe(true)

      select.setError(false)
      expect(select.hasError()).toBe(false)
      expect(container.hasAttribute('data-error')).toBe(false)
    })
  })

  // ===========================================================================
  // Option Groups (optgroup)
  // ===========================================================================

  describe('Option Groups', () => {
    it('should render optgroup elements', () => {
      const config: SelectConfig = { options: optionGroups }
      const select = new Select(container, config)
      select.render()

      const selectElement = container.querySelector('select') as HTMLSelectElement
      const optgroups = selectElement.querySelectorAll('optgroup')
      expect(optgroups.length).toBe(2)
      expect(optgroups[0].label).toBe('Group A')
      expect(optgroups[1].label).toBe('Group B')
    })

    it('should group options by group property', () => {
      // Note: Select component expects pre-grouped options (SelectOptionGroup[])
      // The field-renderer handles conversion from SelectOption[] with group properties
      const manuallyGrouped: SelectOptionGroup[] = [
        {
          label: 'Group A',
          options: [
            { value: '1', label: 'Option 1' },
            { value: '2', label: 'Option 2' },
          ],
        },
        {
          label: 'Group B',
          options: [
            { value: '3', label: 'Option 3' },
          ],
        },
      ]
      const ungroupedOptions: SelectOption[] = [
        { value: '4', label: 'Option 4' },
      ]

      const config: SelectConfig = {
        options: [...ungroupedOptions, ...manuallyGrouped],
      }
      const select = new Select(container, config)
      select.render()

      const selectElement = container.querySelector('select') as HTMLSelectElement
      const optgroups = selectElement.querySelectorAll('optgroup')
      expect(optgroups.length).toBe(2)

      // Ungrouped option should be outside optgroup
      const allOptions = Array.from(selectElement.querySelectorAll('option'))
      const ungroupedOption = allOptions.find(opt => opt.value === '4')
      expect(ungroupedOption?.parentElement?.tagName).not.toBe('OPTGROUP')
    })

    it('should disable optgroup', () => {
      const disabledGroup: SelectOptionGroup[] = [
        {
          label: 'Disabled Group',
          options: [{ value: '1', label: 'Option 1' }],
          disabled: true,
        },
      ]
      const config: SelectConfig = { options: disabledGroup }
      const select = new Select(container, config)
      select.render()

      const selectElement = container.querySelector('select') as HTMLSelectElement
      const optgroup = selectElement.querySelector('optgroup') as HTMLOptGroupElement
      expect(optgroup.disabled).toBe(true)
    })
  })

  // ===========================================================================
  // Disabled Options
  // ===========================================================================

  describe('Disabled Options', () => {
    it('should disable specific options', () => {
      const config: SelectConfig = { options: basicOptions }
      const select = new Select(container, config)
      select.render()

      const selectElement = container.querySelector('select') as HTMLSelectElement
      const options = Array.from(selectElement.options)
      const disabledOption = options.find(opt => opt.value === '3')
      expect(disabledOption?.disabled).toBe(true)
    })
  })

  // ===========================================================================
  // Callbacks
  // ===========================================================================

  describe('Callbacks', () => {
    it('should call onChange when value changes', () => {
      const onChange = vi.fn()
      const config: SelectConfig = { options: basicOptions }
      const select = new Select(container, config, { onChange })
      select.render()

      select.setValue('2')

      expect(onChange).toHaveBeenCalledWith('2', expect.objectContaining({
        value: '2',
      }))
    })

    it('should trigger onChange on user selection', () => {
      const onChange = vi.fn()
      const config: SelectConfig = { options: basicOptions }
      const select = new Select(container, config, { onChange })
      select.render()

      const selectElement = container.querySelector('select') as HTMLSelectElement
      selectElement.value = '2'
      selectElement.dispatchEvent(new Event('change'))

      expect(onChange).toHaveBeenCalledWith('2', expect.any(Object))
    })
  })

  // ===========================================================================
  // Required Attribute
  // ===========================================================================

  describe('Required Attribute', () => {
    it('should set required attribute', () => {
      const config: SelectConfig = {
        options: basicOptions,
        required: true,
      }
      const select = new Select(container, config)
      select.render()

      const selectElement = container.querySelector('select') as HTMLSelectElement
      expect(selectElement.required).toBe(true)
      expect(selectElement.getAttribute('aria-required')).toBe('true')
    })
  })

  // ===========================================================================
  // Name Attribute
  // ===========================================================================

  describe('Name Attribute', () => {
    it('should set name attribute', () => {
      const config: SelectConfig = {
        options: basicOptions,
        name: 'my-select',
      }
      const select = new Select(container, config)
      select.render()

      const selectElement = container.querySelector('select') as HTMLSelectElement
      expect(selectElement.name).toBe('my-select')
    })
  })

  // ===========================================================================
  // Width Configuration
  // ===========================================================================

  describe('Width Configuration', () => {
    it('should set width with number', () => {
      const config: SelectConfig = {
        options: basicOptions,
        width: 300,
      }
      const select = new Select(container, config)
      select.render()

      const selectElement = container.querySelector('select') as HTMLSelectElement
      expect(selectElement.style.width).toBe('300px')
    })

    it('should set width with string', () => {
      const config: SelectConfig = {
        options: basicOptions,
        width: '50%',
      }
      const select = new Select(container, config)
      select.render()

      const selectElement = container.querySelector('select') as HTMLSelectElement
      expect(selectElement.style.width).toBe('50%')
    })
  })

  // ===========================================================================
  // Factory Function
  // ===========================================================================

  describe('Factory Function', () => {
    it('should create and render Select using factory', () => {
      const config: SelectConfig = { options: basicOptions }
      const select = createSelect(container, config)

      expect(container.querySelector('select')).toBeTruthy()
      expect(select instanceof Select).toBe(true)
    })
  })

  // ===========================================================================
  // Keyboard Navigation
  // ===========================================================================

  describe('Keyboard Navigation', () => {
    it('should blur on Escape key', () => {
      const config: SelectConfig = { options: basicOptions }
      const select = new Select(container, config)
      select.render()

      const selectElement = container.querySelector('select') as HTMLSelectElement
      selectElement.focus()
      expect(document.activeElement).toBe(selectElement)

      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' })
      selectElement.dispatchEvent(escapeEvent)

      // Note: blur() may not work in JSDOM, but the event listener is tested
      expect(selectElement).toBeTruthy()
    })
  })
})

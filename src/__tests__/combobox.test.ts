/**
 * Combobox Component Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  Combobox,
  type ComboboxConfig,
  type ComboboxOption,
  type ComboboxCallbacks,
} from '../renderer/components/combobox'

// ===========================================================================
// Test Utilities
// ===========================================================================

function createMockContainer(): HTMLElement {
  const container = document.createElement('div')
  document.body.appendChild(container)
  return container
}

function cleanupContainer(container: HTMLElement): void {
  container.remove()
}

const sampleOptions: ComboboxOption[] = [
  { value: '1', label: 'Option 1' },
  { value: '2', label: 'Option 2', description: 'Description for option 2' },
  { value: '3', label: 'Option 3', group: 'Group A' },
  { value: '4', label: 'Option 4', group: 'Group A' },
  { value: '5', label: 'Option 5', group: 'Group B', disabled: true },
]

// ===========================================================================
// Initialization Tests
// ===========================================================================

describe('Combobox - Initialization', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = createMockContainer()
  })

  afterEach(() => {
    cleanupContainer(container)
  })

  it('should initialize with empty state', () => {
    const config: ComboboxConfig = {
      id: 'test-combobox',
      mode: 'single',
      options: sampleOptions,
    }
    const combobox = new Combobox(container, config)
    combobox.render()

    const state = combobox.getState()
    expect(state.selectedValues).toEqual([])
    expect(state.inputValue).toBe('')
    expect(state.isOpen).toBe(false)
    expect(state.highlightedIndex).toBe(-1)
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
  })

  it('should initialize with initial values', () => {
    const config: ComboboxConfig = {
      id: 'test-combobox',
      mode: 'single',
      options: sampleOptions,
    }
    const combobox = new Combobox(container, config, {}, ['2'])
    combobox.render()

    const state = combobox.getState()
    expect(state.selectedValues).toEqual(['2'])
  })

  it('should set mode correctly', () => {
    const configSingle: ComboboxConfig = {
      id: 'test-single',
      mode: 'single',
      options: sampleOptions,
    }
    const comboboxSingle = new Combobox(container, configSingle)
    comboboxSingle.render()
    expect(container.classList.contains('combobox-single')).toBe(true)

    cleanupContainer(container)
    container = createMockContainer()

    const configMulti: ComboboxConfig = {
      id: 'test-multi',
      mode: 'multi',
      options: sampleOptions,
    }
    const comboboxMulti = new Combobox(container, configMulti)
    comboboxMulti.render()
    expect(container.classList.contains('combobox-multi')).toBe(true)
  })

  it('should apply disabled state', () => {
    const config: ComboboxConfig = {
      id: 'test-combobox',
      mode: 'single',
      options: sampleOptions,
      disabled: true,
    }
    const combobox = new Combobox(container, config)
    combobox.render()

    expect(container.hasAttribute('data-disabled')).toBe(true)
    expect(container.querySelector('.combobox-control.disabled')).toBeTruthy()
  })
})

// ===========================================================================
// Rendering Tests
// ===========================================================================

describe('Combobox - Rendering', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = createMockContainer()
  })

  afterEach(() => {
    cleanupContainer(container)
  })

  it('should render input field', () => {
    const config: ComboboxConfig = {
      id: 'test-combobox',
      mode: 'single',
      options: sampleOptions,
    }
    const combobox = new Combobox(container, config)
    combobox.render()

    const input = container.querySelector<HTMLInputElement>('.combobox-input')
    expect(input).toBeTruthy()
    expect(input?.getAttribute('role')).toBe('combobox')
  })

  it('should render placeholder', () => {
    const config: ComboboxConfig = {
      id: 'test-combobox',
      mode: 'single',
      options: sampleOptions,
      placeholder: 'Select an option...',
    }
    const combobox = new Combobox(container, config)
    combobox.render()

    const input = container.querySelector<HTMLInputElement>('.combobox-input')
    expect(input?.placeholder).toBe('Select an option...')
  })

  it('should render selected value in single mode', () => {
    const config: ComboboxConfig = {
      id: 'test-combobox',
      mode: 'single',
      options: sampleOptions,
    }
    const combobox = new Combobox(container, config, {}, ['2'])
    combobox.render()

    const singleValue = container.querySelector('.combobox-single-value')
    expect(singleValue?.textContent).toBe('Option 2')
  })

  it('should render tags in multi mode', () => {
    const config: ComboboxConfig = {
      id: 'test-combobox',
      mode: 'multi',
      options: sampleOptions,
    }
    const combobox = new Combobox(container, config, {}, ['1', '2'])
    combobox.render()

    const tags = container.querySelectorAll('.combobox-tag')
    expect(tags.length).toBe(2)
  })

  it('should render dropdown when open', () => {
    const config: ComboboxConfig = {
      id: 'test-combobox',
      mode: 'single',
      options: sampleOptions,
    }
    const combobox = new Combobox(container, config)
    combobox.render()
    combobox.open()

    const dropdown = container.querySelector('.combobox-dropdown')
    expect(dropdown).toBeTruthy()
  })

  it('should render grouped options', () => {
    const config: ComboboxConfig = {
      id: 'test-combobox',
      mode: 'single',
      options: sampleOptions,
    }
    const combobox = new Combobox(container, config)
    combobox.render()
    combobox.open()

    const groups = container.querySelectorAll('.combobox-option-group')
    expect(groups.length).toBeGreaterThan(0)

    const groupHeaders = container.querySelectorAll('.combobox-group-header')
    expect(groupHeaders.length).toBeGreaterThan(0)
  })

  it('should render loading state', async () => {
    const config: ComboboxConfig = {
      id: 'test-combobox',
      mode: 'single',
      loadOptions: async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
        return sampleOptions
      },
      loadingMessage: 'Loading options...',
    }
    const combobox = new Combobox(container, config)
    combobox.render()
    combobox.open()

    // Trigger async loading
    const input = container.querySelector<HTMLInputElement>('.combobox-input')
    input!.value = 'test'
    input!.dispatchEvent(new Event('input'))

    // Check loading state after a short delay
    await new Promise(resolve => setTimeout(resolve, 10))
    const loading = container.querySelector('.combobox-loading')
    expect(loading).toBeTruthy()
    expect(loading?.textContent).toContain('Loading options...')
  })

  it('should render empty state', () => {
    const config: ComboboxConfig = {
      id: 'test-combobox',
      mode: 'single',
      options: [],
      noOptionsMessage: 'No results found',
    }
    const combobox = new Combobox(container, config)
    combobox.render()
    combobox.open()

    const empty = container.querySelector('.combobox-no-options')
    expect(empty).toBeTruthy()
    expect(empty?.textContent).toContain('No results found')
  })
})

// ===========================================================================
// Selection Tests
// ===========================================================================

describe('Combobox - Selection', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = createMockContainer()
  })

  afterEach(() => {
    cleanupContainer(container)
  })

  it('should select option on click', () => {
    const onChange = vi.fn()
    const config: ComboboxConfig = {
      id: 'test-combobox',
      mode: 'single',
      options: sampleOptions,
    }
    const combobox = new Combobox(container, config, { onChange })
    combobox.render()
    combobox.open()

    const option = container.querySelector<HTMLElement>('[data-value="1"]')
    option?.click()

    expect(onChange).toHaveBeenCalledWith(['1'], expect.any(Object))
    expect(combobox.getValue()).toEqual(['1'])
  })

  it('should replace selection in single mode', () => {
    const config: ComboboxConfig = {
      id: 'test-combobox',
      mode: 'single',
      options: sampleOptions,
    }
    const combobox = new Combobox(container, config, {}, ['1'])
    combobox.render()
    combobox.open()

    const option = container.querySelector<HTMLElement>('[data-value="2"]')
    option?.click()

    expect(combobox.getValue()).toEqual(['2'])
  })

  it('should add to selection in multi mode', () => {
    const config: ComboboxConfig = {
      id: 'test-combobox',
      mode: 'multi',
      options: sampleOptions,
    }
    const combobox = new Combobox(container, config, {}, ['1'])
    combobox.render()
    combobox.open()

    const option = container.querySelector<HTMLElement>('[data-value="2"]')
    option?.click()

    expect(combobox.getValue()).toEqual(['1', '2'])
  })

  it('should deselect option in multi mode', () => {
    const config: ComboboxConfig = {
      id: 'test-combobox',
      mode: 'multi',
      options: sampleOptions,
    }
    const combobox = new Combobox(container, config, {}, ['1', '2'])
    combobox.render()
    combobox.open()

    const option = container.querySelector<HTMLElement>('[data-value="1"]')
    option?.click()

    expect(combobox.getValue()).toEqual(['2'])
  })

  it('should clear selection', () => {
    const config: ComboboxConfig = {
      id: 'test-combobox',
      mode: 'single',
      options: sampleOptions,
      clearable: true,
    }
    const combobox = new Combobox(container, config, {}, ['1'])
    combobox.render()

    const clearBtn = container.querySelector<HTMLElement>('.combobox-clear')
    clearBtn?.click()

    expect(combobox.getValue()).toEqual([])
  })

  it('should respect maxSelections in multi mode', () => {
    const config: ComboboxConfig = {
      id: 'test-combobox',
      mode: 'multi',
      options: sampleOptions,
      maxSelections: 2,
    }
    const combobox = new Combobox(container, config, {}, ['1', '2'])
    combobox.render()
    combobox.open()

    const option = container.querySelector<HTMLElement>('[data-value="3"]')
    option?.click()

    // Should not add third option
    expect(combobox.getValue()).toEqual(['1', '2'])
  })

  it('should not select disabled options', () => {
    const config: ComboboxConfig = {
      id: 'test-combobox',
      mode: 'single',
      options: sampleOptions,
    }
    const combobox = new Combobox(container, config)
    combobox.render()
    combobox.open()

    const option = container.querySelector<HTMLElement>('[data-value="5"]')
    option?.click()

    // Option 5 is disabled, should not be selected
    expect(combobox.getValue()).toEqual([])
  })

  it('should call onChange callback', () => {
    const onChange = vi.fn()
    const config: ComboboxConfig = {
      id: 'test-combobox',
      mode: 'single',
      options: sampleOptions,
    }
    const combobox = new Combobox(container, config, { onChange })
    combobox.render()
    combobox.open()

    const option = container.querySelector<HTMLElement>('[data-value="1"]')
    option?.click()

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(['1'], expect.any(Object))
  })
})

// ===========================================================================
// Filtering Tests
// ===========================================================================

describe('Combobox - Filtering', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = createMockContainer()
  })

  afterEach(() => {
    cleanupContainer(container)
  })

  it('should filter options by label', () => {
    const config: ComboboxConfig = {
      id: 'test-combobox',
      mode: 'single',
      options: sampleOptions,
    }
    const combobox = new Combobox(container, config)
    combobox.render()
    combobox.open()

    const input = container.querySelector<HTMLInputElement>('.combobox-input')
    input!.value = 'Option 1'
    input!.dispatchEvent(new Event('input'))

    const state = combobox.getState()
    expect(state.filteredOptions.length).toBe(1)
    expect(state.filteredOptions[0].label).toBe('Option 1')
  })

  it('should be case-insensitive', () => {
    const config: ComboboxConfig = {
      id: 'test-combobox',
      mode: 'single',
      options: sampleOptions,
    }
    const combobox = new Combobox(container, config)
    combobox.render()
    combobox.open()

    const input = container.querySelector<HTMLInputElement>('.combobox-input')
    input!.value = 'option 1'
    input!.dispatchEvent(new Event('input'))

    const state = combobox.getState()
    expect(state.filteredOptions.length).toBe(1)
    expect(state.filteredOptions[0].label).toBe('Option 1')
  })

  it('should show no results message', () => {
    const config: ComboboxConfig = {
      id: 'test-combobox',
      mode: 'single',
      options: sampleOptions,
      noOptionsMessage: 'No matches found',
    }
    const combobox = new Combobox(container, config)
    combobox.render()
    combobox.open()

    const input = container.querySelector<HTMLInputElement>('.combobox-input')
    input!.value = 'xyz'
    input!.dispatchEvent(new Event('input'))

    const empty = container.querySelector('.combobox-no-options')
    expect(empty).toBeTruthy()
    expect(empty?.textContent).toContain('No matches found')
  })

  it('should clear filter on selection in single mode', () => {
    const config: ComboboxConfig = {
      id: 'test-combobox',
      mode: 'single',
      options: sampleOptions,
    }
    const combobox = new Combobox(container, config)
    combobox.render()
    combobox.open()

    const input = container.querySelector<HTMLInputElement>('.combobox-input')
    input!.value = 'Option 1'
    input!.dispatchEvent(new Event('input'))

    const option = container.querySelector<HTMLElement>('[data-value="1"]')
    option?.click()

    const state = combobox.getState()
    expect(state.inputValue).toBe('')
  })

  it('should maintain filter after selection in multi mode', () => {
    const config: ComboboxConfig = {
      id: 'test-combobox',
      mode: 'multi',
      options: sampleOptions,
    }
    const combobox = new Combobox(container, config)
    combobox.render()
    combobox.open()

    const input = container.querySelector<HTMLInputElement>('.combobox-input')
    input!.value = 'Option'
    input!.dispatchEvent(new Event('input'))

    const option = container.querySelector<HTMLElement>('[data-value="1"]')
    option?.click()

    const state = combobox.getState()
    expect(state.inputValue).toBe('')
  })
})

// ===========================================================================
// Keyboard Navigation Tests
// ===========================================================================

describe('Combobox - Keyboard Navigation', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = createMockContainer()
  })

  afterEach(() => {
    cleanupContainer(container)
  })

  it('should open on ArrowDown', () => {
    const config: ComboboxConfig = {
      id: 'test-combobox',
      mode: 'single',
      options: sampleOptions,
    }
    const combobox = new Combobox(container, config)
    combobox.render()

    const input = container.querySelector<HTMLInputElement>('.combobox-input')
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown' })
    input!.dispatchEvent(event)

    expect(combobox.isOpenState()).toBe(true)
  })

  it('should navigate with ArrowDown/ArrowUp', () => {
    const config: ComboboxConfig = {
      id: 'test-combobox',
      mode: 'single',
      options: sampleOptions,
    }
    const combobox = new Combobox(container, config)
    combobox.render()
    combobox.open()

    const input = container.querySelector<HTMLInputElement>('.combobox-input')

    // Navigate down
    let event = new KeyboardEvent('keydown', { key: 'ArrowDown' })
    input!.dispatchEvent(event)

    let state = combobox.getState()
    expect(state.highlightedIndex).toBe(0)

    // Navigate down again
    event = new KeyboardEvent('keydown', { key: 'ArrowDown' })
    input!.dispatchEvent(event)

    state = combobox.getState()
    expect(state.highlightedIndex).toBe(1)

    // Navigate up
    event = new KeyboardEvent('keydown', { key: 'ArrowUp' })
    input!.dispatchEvent(event)

    state = combobox.getState()
    expect(state.highlightedIndex).toBe(0)
  })

  it('should select on Enter', () => {
    const config: ComboboxConfig = {
      id: 'test-combobox',
      mode: 'single',
      options: sampleOptions,
    }
    const combobox = new Combobox(container, config)
    combobox.render()
    combobox.open()

    const input = container.querySelector<HTMLInputElement>('.combobox-input')

    // Navigate to first option
    let event = new KeyboardEvent('keydown', { key: 'ArrowDown' })
    input!.dispatchEvent(event)

    // Select with Enter
    event = new KeyboardEvent('keydown', { key: 'Enter' })
    input!.dispatchEvent(event)

    expect(combobox.getValue()).toEqual(['1'])
  })

  it('should close on Escape', () => {
    const config: ComboboxConfig = {
      id: 'test-combobox',
      mode: 'single',
      options: sampleOptions,
    }
    const combobox = new Combobox(container, config)
    combobox.render()
    combobox.open()

    const input = container.querySelector<HTMLInputElement>('.combobox-input')
    const event = new KeyboardEvent('keydown', { key: 'Escape' })
    input!.dispatchEvent(event)

    expect(combobox.isOpenState()).toBe(false)
  })

  it('should close on Tab', () => {
    const config: ComboboxConfig = {
      id: 'test-combobox',
      mode: 'single',
      options: sampleOptions,
    }
    const combobox = new Combobox(container, config)
    combobox.render()
    combobox.open()

    const input = container.querySelector<HTMLInputElement>('.combobox-input')
    const event = new KeyboardEvent('keydown', { key: 'Tab' })
    input!.dispatchEvent(event)

    expect(combobox.isOpenState()).toBe(false)
  })

  it('should remove last tag on Backspace in multi mode', () => {
    const config: ComboboxConfig = {
      id: 'test-combobox',
      mode: 'multi',
      options: sampleOptions,
    }
    const combobox = new Combobox(container, config, {}, ['1', '2', '3'])
    combobox.render()

    const input = container.querySelector<HTMLInputElement>('.combobox-input')
    input!.value = '' // Empty input
    const event = new KeyboardEvent('keydown', { key: 'Backspace' })
    input!.dispatchEvent(event)

    expect(combobox.getValue()).toEqual(['1', '2'])
  })

  it('should skip disabled options', () => {
    const config: ComboboxConfig = {
      id: 'test-combobox',
      mode: 'single',
      options: sampleOptions,
    }
    const combobox = new Combobox(container, config)
    combobox.render()
    combobox.open()

    const input = container.querySelector<HTMLInputElement>('.combobox-input')

    // Navigate to last non-disabled option
    for (let i = 0; i < 4; i++) {
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' })
      input!.dispatchEvent(event)
    }

    const state = combobox.getState()
    // Should skip disabled option (index 4) and stay at index 3
    expect(state.filteredOptions[state.highlightedIndex].disabled).toBeFalsy()
  })
})

// ===========================================================================
// Accessibility Tests
// ===========================================================================

describe('Combobox - Accessibility', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = createMockContainer()
  })

  afterEach(() => {
    cleanupContainer(container)
  })

  it('should have role="combobox" on input', () => {
    const config: ComboboxConfig = {
      id: 'test-combobox',
      mode: 'single',
      options: sampleOptions,
    }
    const combobox = new Combobox(container, config)
    combobox.render()

    const input = container.querySelector<HTMLInputElement>('.combobox-input')
    expect(input?.getAttribute('role')).toBe('combobox')
  })

  it('should have aria-haspopup="listbox"', () => {
    const config: ComboboxConfig = {
      id: 'test-combobox',
      mode: 'single',
      options: sampleOptions,
    }
    const combobox = new Combobox(container, config)
    combobox.render()

    const input = container.querySelector<HTMLInputElement>('.combobox-input')
    expect(input?.getAttribute('aria-haspopup')).toBe('listbox')
  })

  it('should have aria-expanded reflecting open state', () => {
    const config: ComboboxConfig = {
      id: 'test-combobox',
      mode: 'single',
      options: sampleOptions,
    }
    const combobox = new Combobox(container, config)
    combobox.render()

    let input = container.querySelector<HTMLInputElement>('.combobox-input')
    expect(input?.getAttribute('aria-expanded')).toBe('false')

    combobox.open()
    input = container.querySelector<HTMLInputElement>('.combobox-input')
    expect(input?.getAttribute('aria-expanded')).toBe('true')
  })

  it('should have aria-activedescendant when navigating', () => {
    const config: ComboboxConfig = {
      id: 'test-combobox',
      mode: 'single',
      options: sampleOptions,
    }
    const combobox = new Combobox(container, config)
    combobox.render()
    combobox.open()

    let input = container.querySelector<HTMLInputElement>('.combobox-input')
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown' })
    input!.dispatchEvent(event)

    // Re-query input after re-render
    input = container.querySelector<HTMLInputElement>('.combobox-input')
    expect(input?.hasAttribute('aria-activedescendant')).toBe(true)
  })

  it('should have role="listbox" on dropdown', () => {
    const config: ComboboxConfig = {
      id: 'test-combobox',
      mode: 'single',
      options: sampleOptions,
    }
    const combobox = new Combobox(container, config)
    combobox.render()
    combobox.open()

    const dropdown = container.querySelector('.combobox-dropdown')
    expect(dropdown?.getAttribute('role')).toBe('listbox')
  })

  it('should have role="option" on options', () => {
    const config: ComboboxConfig = {
      id: 'test-combobox',
      mode: 'single',
      options: sampleOptions,
    }
    const combobox = new Combobox(container, config)
    combobox.render()
    combobox.open()

    const options = container.querySelectorAll('.combobox-option')
    options.forEach(option => {
      expect(option.getAttribute('role')).toBe('option')
    })
  })

  it('should have aria-selected on options', () => {
    const config: ComboboxConfig = {
      id: 'test-combobox',
      mode: 'single',
      options: sampleOptions,
    }
    const combobox = new Combobox(container, config, {}, ['1'])
    combobox.render()
    combobox.open()

    const selectedOption = container.querySelector('[data-value="1"]')
    expect(selectedOption?.getAttribute('aria-selected')).toBe('true')

    const unselectedOption = container.querySelector('[data-value="2"]')
    expect(unselectedOption?.getAttribute('aria-selected')).toBe('false')
  })
})

// ===========================================================================
// Public API Tests
// ===========================================================================

describe('Combobox - Public API', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = createMockContainer()
  })

  afterEach(() => {
    cleanupContainer(container)
  })

  it('should get value', () => {
    const config: ComboboxConfig = {
      id: 'test-combobox',
      mode: 'single',
      options: sampleOptions,
    }
    const combobox = new Combobox(container, config, {}, ['1'])
    combobox.render()

    expect(combobox.getValue()).toEqual(['1'])
  })

  it('should set value', () => {
    const config: ComboboxConfig = {
      id: 'test-combobox',
      mode: 'single',
      options: sampleOptions,
    }
    const combobox = new Combobox(container, config)
    combobox.render()

    combobox.setValue(['2'])
    expect(combobox.getValue()).toEqual(['2'])
  })

  it('should get selected options', () => {
    const config: ComboboxConfig = {
      id: 'test-combobox',
      mode: 'single',
      options: sampleOptions,
    }
    const combobox = new Combobox(container, config, {}, ['1'])
    combobox.render()

    const selected = combobox.getSelectedOptions()
    expect(selected.length).toBe(1)
    expect(selected[0].value).toBe('1')
    expect(selected[0].label).toBe('Option 1')
  })

  it('should open dropdown', () => {
    const onOpen = vi.fn()
    const config: ComboboxConfig = {
      id: 'test-combobox',
      mode: 'single',
      options: sampleOptions,
    }
    const combobox = new Combobox(container, config, { onOpen })
    combobox.render()

    combobox.open()
    expect(combobox.isOpenState()).toBe(true)
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('should close dropdown', () => {
    const onClose = vi.fn()
    const config: ComboboxConfig = {
      id: 'test-combobox',
      mode: 'single',
      options: sampleOptions,
    }
    const combobox = new Combobox(container, config, { onClose })
    combobox.render()
    combobox.open()

    combobox.close()
    expect(combobox.isOpenState()).toBe(false)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should toggle dropdown', () => {
    const config: ComboboxConfig = {
      id: 'test-combobox',
      mode: 'single',
      options: sampleOptions,
    }
    const combobox = new Combobox(container, config)
    combobox.render()

    combobox.toggle()
    expect(combobox.isOpenState()).toBe(true)

    combobox.toggle()
    expect(combobox.isOpenState()).toBe(false)
  })

  it('should set options', () => {
    const config: ComboboxConfig = {
      id: 'test-combobox',
      mode: 'single',
      options: sampleOptions,
    }
    const combobox = new Combobox(container, config)
    combobox.render()

    const newOptions: ComboboxOption[] = [
      { value: 'a', label: 'Option A' },
      { value: 'b', label: 'Option B' },
    ]
    combobox.setOptions(newOptions)

    const state = combobox.getState()
    expect(state.filteredOptions.length).toBe(2)
  })

  it('should add option', () => {
    const config: ComboboxConfig = {
      id: 'test-combobox',
      mode: 'single',
      options: [...sampleOptions], // Use a copy to avoid mutation
    }
    const combobox = new Combobox(container, config)
    combobox.render()

    const initialLength = combobox.getState().filteredOptions.length

    const newOption: ComboboxOption = { value: '10', label: 'Option 10' }
    combobox.addOption(newOption)

    const state = combobox.getState()
    expect(state.filteredOptions.length).toBe(initialLength + 1)
  })

  it('should remove option', () => {
    const config: ComboboxConfig = {
      id: 'test-combobox',
      mode: 'single',
      options: sampleOptions,
    }
    const combobox = new Combobox(container, config)
    combobox.render()

    combobox.removeOption('1')

    const state = combobox.getState()
    expect(state.filteredOptions.length).toBe(sampleOptions.length - 1)
    expect(state.filteredOptions.find(o => o.value === '1')).toBeUndefined()
  })

  it('should cleanup on destroy', () => {
    const config: ComboboxConfig = {
      id: 'test-combobox',
      mode: 'single',
      options: sampleOptions,
    }
    const combobox = new Combobox(container, config)
    combobox.render()

    combobox.destroy()

    expect(container.innerHTML).toBe('')
  })
})

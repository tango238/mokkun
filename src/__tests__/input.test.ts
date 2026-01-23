/**
 * Input Component Tests
 * Inputコンポーネントのテスト
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  Input,
  createInput,
  type InputConfig,
  type InputCallbacks,
} from '../renderer/components/input'

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
// Input Component Tests
// =============================================================================

describe('Input Component', () => {
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
      const input = new Input(container)
      input.render()

      expect(container.classList.contains('mokkun-input')).toBe(true)
      expect(container.querySelector('.input-field')).toBeTruthy()
      expect(input.getValue()).toBe('')
    })

    it('should set default value', () => {
      const config: InputConfig = { defaultValue: 'Hello World' }
      const input = new Input(container, config)
      input.render()

      expect(input.getValue()).toBe('Hello World')
      const inputElement = container.querySelector('.input-field') as HTMLInputElement
      expect(inputElement.value).toBe('Hello World')
    })

    it('should set placeholder', () => {
      const config: InputConfig = { placeholder: 'Enter text...' }
      const input = new Input(container, config)
      input.render()

      const inputElement = container.querySelector('.input-field') as HTMLInputElement
      expect(inputElement.placeholder).toBe('Enter text...')
    })

    it('should create unique instance ID', () => {
      const input1 = new Input(createMockContainer())
      const input2 = new Input(createMockContainer())
      input1.render()
      input2.render()

      const id1 = (input1 as unknown as { instanceId: string }).instanceId
      const id2 = (input2 as unknown as { instanceId: string }).instanceId
      expect(id1).not.toBe(id2)
    })
  })

  // ===========================================================================
  // Input Type Tests
  // ===========================================================================

  describe('Input Types', () => {
    it('should default to text type', () => {
      const input = new Input(container)
      input.render()

      const inputElement = container.querySelector('.input-field') as HTMLInputElement
      expect(inputElement.type).toBe('text')
    })

    it('should support email type', () => {
      const config: InputConfig = { type: 'email' }
      const input = new Input(container, config)
      input.render()

      const inputElement = container.querySelector('.input-field') as HTMLInputElement
      expect(inputElement.type).toBe('email')
    })

    it('should support password type', () => {
      const config: InputConfig = { type: 'password' }
      const input = new Input(container, config)
      input.render()

      const inputElement = container.querySelector('.input-field') as HTMLInputElement
      expect(inputElement.type).toBe('password')
    })

    it('should support number type', () => {
      const config: InputConfig = { type: 'number' }
      const input = new Input(container, config)
      input.render()

      const inputElement = container.querySelector('.input-field') as HTMLInputElement
      expect(inputElement.type).toBe('number')
    })

    it('should support tel type', () => {
      const config: InputConfig = { type: 'tel' }
      const input = new Input(container, config)
      input.render()

      const inputElement = container.querySelector('.input-field') as HTMLInputElement
      expect(inputElement.type).toBe('tel')
    })

    it('should support url type', () => {
      const config: InputConfig = { type: 'url' }
      const input = new Input(container, config)
      input.render()

      const inputElement = container.querySelector('.input-field') as HTMLInputElement
      expect(inputElement.type).toBe('url')
    })
  })

  // ===========================================================================
  // Size Variant Tests
  // ===========================================================================

  describe('Size Variants', () => {
    it('should default to medium size', () => {
      const input = new Input(container)
      input.render()

      expect(container.classList.contains('input-medium')).toBe(true)
    })

    it('should support small size', () => {
      const config: InputConfig = { size: 'small' }
      const input = new Input(container, config)
      input.render()

      expect(container.classList.contains('input-small')).toBe(true)
    })

    it('should support medium size', () => {
      const config: InputConfig = { size: 'medium' }
      const input = new Input(container, config)
      input.render()

      expect(container.classList.contains('input-medium')).toBe(true)
    })

    it('should support large size', () => {
      const config: InputConfig = { size: 'large' }
      const input = new Input(container, config)
      input.render()

      expect(container.classList.contains('input-large')).toBe(true)
    })
  })

  // ===========================================================================
  // State Tests
  // ===========================================================================

  describe('States', () => {
    it('should support disabled state', () => {
      const config: InputConfig = { disabled: true }
      const input = new Input(container, config)
      input.render()

      expect(container.hasAttribute('data-disabled')).toBe(true)
      const inputElement = container.querySelector('.input-field') as HTMLInputElement
      expect(inputElement.disabled).toBe(true)
    })

    it('should support readonly state', () => {
      const config: InputConfig = { readonly: true }
      const input = new Input(container, config)
      input.render()

      expect(container.hasAttribute('data-readonly')).toBe(true)
      const inputElement = container.querySelector('.input-field') as HTMLInputElement
      expect(inputElement.readOnly).toBe(true)
    })

    it('should support required state', () => {
      const config: InputConfig = { required: true }
      const input = new Input(container, config)
      input.render()

      const inputElement = container.querySelector('.input-field') as HTMLInputElement
      expect(inputElement.required).toBe(true)
    })

    it('should update data-state on focus', () => {
      const input = new Input(container)
      input.render()

      const inputElement = container.querySelector('.input-field') as HTMLInputElement
      inputElement.focus()

      expect(container.getAttribute('data-state')).toBe('focused')
    })

    it('should update data-state on blur', () => {
      const input = new Input(container)
      input.render()

      const inputElement = container.querySelector('.input-field') as HTMLInputElement
      inputElement.focus()
      inputElement.blur()

      expect(container.getAttribute('data-state')).toBe('empty')
    })

    it('should show filled state when has value', () => {
      const config: InputConfig = { defaultValue: 'test' }
      const input = new Input(container, config)
      input.render()

      expect(container.getAttribute('data-state')).toBe('filled')
    })
  })

  // ===========================================================================
  // Prefix/Suffix Tests
  // ===========================================================================

  describe('Prefix and Suffix', () => {
    it('should render string prefix', () => {
      const config: InputConfig = { prefix: '@' }
      const input = new Input(container, config)
      input.render()

      const prefix = container.querySelector('.input-prefix')
      expect(prefix?.textContent).toBe('@')
      expect(container.querySelector('.input-group')?.classList.contains('has-prefix')).toBe(true)
    })

    it('should render string suffix', () => {
      const config: InputConfig = { suffix: '.com' }
      const input = new Input(container, config)
      input.render()

      const suffix = container.querySelector('.input-suffix')
      expect(suffix?.textContent).toBe('.com')
      expect(container.querySelector('.input-group')?.classList.contains('has-suffix')).toBe(true)
    })

    it('should render both prefix and suffix', () => {
      const config: InputConfig = { prefix: 'https://', suffix: '.com' }
      const input = new Input(container, config)
      input.render()

      expect(container.querySelector('.input-prefix')).toBeTruthy()
      expect(container.querySelector('.input-suffix')).toBeTruthy()
    })

    it('should render HTMLElement prefix', () => {
      const icon = document.createElement('span')
      icon.className = 'icon'
      icon.textContent = '🔍'

      const config: InputConfig = { prefix: icon }
      const input = new Input(container, config)
      input.render()

      const prefix = container.querySelector('.input-prefix .icon')
      expect(prefix?.textContent).toBe('🔍')
    })

    it('should render HTMLElement suffix', () => {
      const icon = document.createElement('span')
      icon.className = 'icon'
      icon.textContent = '📧'

      const config: InputConfig = { suffix: icon }
      const input = new Input(container, config)
      input.render()

      const suffix = container.querySelector('.input-suffix .icon')
      expect(suffix?.textContent).toBe('📧')
    })
  })

  // ===========================================================================
  // Clear Button Tests
  // ===========================================================================

  describe('Clear Button', () => {
    it('should not show clear button when clearable is false', () => {
      const config: InputConfig = { defaultValue: 'test', clearable: false }
      const input = new Input(container, config)
      input.render()

      expect(container.querySelector('.input-clear-button')).toBeNull()
    })

    it('should not show clear button when value is empty', () => {
      const config: InputConfig = { clearable: true }
      const input = new Input(container, config)
      input.render()

      expect(container.querySelector('.input-clear-button')).toBeNull()
    })

    it('should show clear button when clearable and has value', () => {
      const config: InputConfig = { defaultValue: 'test', clearable: true }
      const input = new Input(container, config)
      input.render()

      expect(container.querySelector('.input-clear-button')).toBeTruthy()
    })

    it('should not show clear button when disabled', () => {
      const config: InputConfig = { defaultValue: 'test', clearable: true, disabled: true }
      const input = new Input(container, config)
      input.render()

      expect(container.querySelector('.input-clear-button')).toBeNull()
    })

    it('should not show clear button when readonly', () => {
      const config: InputConfig = { defaultValue: 'test', clearable: true, readonly: true }
      const input = new Input(container, config)
      input.render()

      expect(container.querySelector('.input-clear-button')).toBeNull()
    })

    it('should clear value when clear button clicked', () => {
      const config: InputConfig = { defaultValue: 'test', clearable: true }
      const input = new Input(container, config)
      input.render()

      const clearButton = container.querySelector('.input-clear-button') as HTMLButtonElement
      clearButton.click()

      expect(input.getValue()).toBe('')
    })
  })

  // ===========================================================================
  // Error State Tests
  // ===========================================================================

  describe('Error States', () => {
    it('should show error state', () => {
      const input = new Input(container)
      input.render()
      input.setError(true, 'This field is required')

      expect(container.hasAttribute('data-error')).toBe(true)
      const errorMessage = container.querySelector('.input-error-message')
      expect(errorMessage?.textContent).toBe('This field is required')
    })

    it('should clear error state', () => {
      const input = new Input(container)
      input.render()
      input.setError(true, 'Error')
      input.setError(false)

      expect(container.hasAttribute('data-error')).toBe(false)
      expect(container.querySelector('.input-error-message')).toBeNull()
    })

    it('should initialize with error message', () => {
      const config: InputConfig = { errorMessage: 'Initial error' }
      const input = new Input(container, config)
      input.render()

      expect(container.hasAttribute('data-error')).toBe(true)
      expect(container.querySelector('.input-error-message')?.textContent).toBe('Initial error')
    })

    it('should set aria-invalid when error', () => {
      const input = new Input(container)
      input.render()
      input.setError(true, 'Error')

      const inputElement = container.querySelector('.input-field') as HTMLInputElement
      expect(inputElement.getAttribute('aria-invalid')).toBe('true')
    })
  })

  // ===========================================================================
  // Public Methods Tests
  // ===========================================================================

  describe('Public Methods', () => {
    it('should set value', () => {
      const input = new Input(container)
      input.render()
      input.setValue('new value')

      expect(input.getValue()).toBe('new value')
    })

    it('should get value', () => {
      const config: InputConfig = { defaultValue: 'test' }
      const input = new Input(container, config)
      input.render()

      expect(input.getValue()).toBe('test')
    })

    it('should set disabled state', () => {
      const input = new Input(container)
      input.render()
      input.setDisabled(true)

      expect(container.hasAttribute('data-disabled')).toBe(true)
    })

    it('should set readonly state', () => {
      const input = new Input(container)
      input.render()
      input.setReadonly(true)

      expect(container.hasAttribute('data-readonly')).toBe(true)
    })

    it('should focus input', () => {
      const input = new Input(container)
      input.render()
      input.focus()

      const inputElement = container.querySelector('.input-field') as HTMLInputElement
      expect(document.activeElement).toBe(inputElement)
    })

    it('should blur input', () => {
      const input = new Input(container)
      input.render()
      input.focus()
      input.blur()

      const inputElement = container.querySelector('.input-field') as HTMLInputElement
      expect(document.activeElement).not.toBe(inputElement)
    })

    it('should clear input', () => {
      const config: InputConfig = { defaultValue: 'test' }
      const input = new Input(container, config)
      input.render()
      input.clear()

      expect(input.getValue()).toBe('')
    })

    it('should get state', () => {
      const config: InputConfig = { defaultValue: 'test', disabled: true }
      const input = new Input(container, config)
      input.render()

      const state = input.getState()
      expect(state.value).toBe('test')
      expect(state.disabled).toBe(true)
      expect(state.error).toBe(false)
    })

    it('should destroy input', () => {
      const input = new Input(container)
      input.render()
      input.destroy()

      expect(container.innerHTML).toBe('')
    })
  })

  // ===========================================================================
  // Callback Tests
  // ===========================================================================

  describe('Callbacks', () => {
    it('should call onChange when value changes', () => {
      const onChange = vi.fn()
      const callbacks: InputCallbacks = { onChange }
      const input = new Input(container, {}, callbacks)
      input.render()

      const inputElement = container.querySelector('.input-field') as HTMLInputElement
      inputElement.value = 'new value'
      inputElement.dispatchEvent(new Event('input'))

      expect(onChange).toHaveBeenCalledWith('new value', expect.any(Object))
    })

    it('should call onFocus when focused', () => {
      const onFocus = vi.fn()
      const callbacks: InputCallbacks = { onFocus }
      const input = new Input(container, {}, callbacks)
      input.render()

      const inputElement = container.querySelector('.input-field') as HTMLInputElement
      inputElement.focus()

      expect(onFocus).toHaveBeenCalledWith(expect.any(Object))
    })

    it('should call onBlur when blurred', () => {
      const onBlur = vi.fn()
      const callbacks: InputCallbacks = { onBlur }
      const input = new Input(container, {}, callbacks)
      input.render()

      const inputElement = container.querySelector('.input-field') as HTMLInputElement
      inputElement.focus()
      inputElement.blur()

      expect(onBlur).toHaveBeenCalledWith(expect.any(Object))
    })

    it('should call onClear when clear button clicked', () => {
      const onClear = vi.fn()
      const callbacks: InputCallbacks = { onClear }
      const config: InputConfig = { defaultValue: 'test', clearable: true }
      const input = new Input(container, config, callbacks)
      input.render()

      const clearButton = container.querySelector('.input-clear-button') as HTMLButtonElement
      clearButton.click()

      expect(onClear).toHaveBeenCalledWith(expect.any(Object))
    })

    it('should call onEnter when Enter key pressed', () => {
      const onEnter = vi.fn()
      const callbacks: InputCallbacks = { onEnter }
      const input = new Input(container, {}, callbacks)
      input.render()

      const inputElement = container.querySelector('.input-field') as HTMLInputElement
      inputElement.value = 'test'
      // Trigger input event to update state
      inputElement.dispatchEvent(new Event('input'))

      const event = new KeyboardEvent('keydown', { key: 'Enter' })
      inputElement.dispatchEvent(event)

      expect(onEnter).toHaveBeenCalledWith('test', expect.any(Object))
    })
  })

  // ===========================================================================
  // Factory Function Tests
  // ===========================================================================

  describe('Factory Function', () => {
    it('should create and render input', () => {
      const input = createInput(container, { defaultValue: 'test' })

      expect(container.querySelector('.input-field')).toBeTruthy()
      expect(input.getValue()).toBe('test')
    })

    it('should create input with callbacks', () => {
      const onChange = vi.fn()
      createInput(container, { defaultValue: 'test' }, { onChange })

      const inputElement = container.querySelector('.input-field') as HTMLInputElement
      inputElement.value = 'new'
      inputElement.dispatchEvent(new Event('input'))

      expect(onChange).toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // Accessibility Tests
  // ===========================================================================

  describe('Accessibility', () => {
    it('should set aria-label', () => {
      const config: InputConfig = { ariaLabel: 'Search' }
      const input = new Input(container, config)
      input.render()

      const inputElement = container.querySelector('.input-field') as HTMLInputElement
      expect(inputElement.getAttribute('aria-label')).toBe('Search')
    })

    it('should set aria-describedby', () => {
      const config: InputConfig = { ariaDescribedBy: 'help-text' }
      const input = new Input(container, config)
      input.render()

      const inputElement = container.querySelector('.input-field') as HTMLInputElement
      expect(inputElement.getAttribute('aria-describedby')).toBe('help-text')
    })

    it('should add role="alert" to error message', () => {
      const input = new Input(container)
      input.render()
      input.setError(true, 'Error message')

      const errorElement = container.querySelector('.input-error-message')
      expect(errorElement?.getAttribute('role')).toBe('alert')
    })

    it('should support autoComplete', () => {
      const config: InputConfig = { autoComplete: 'email' }
      const input = new Input(container, config)
      input.render()

      const inputElement = container.querySelector('.input-field') as HTMLInputElement
      expect(inputElement.getAttribute('autocomplete')).toBe('email')
    })
  })

  // ===========================================================================
  // Immutability Tests
  // ===========================================================================

  describe('Immutability', () => {
    it('should not mutate state when calling getState', () => {
      const input = new Input(container)
      input.render()

      const state1 = input.getState()
      state1.value = 'mutated'

      const state2 = input.getState()
      expect(state2.value).toBe('')
    })

    it('should create new state object on setValue', () => {
      const input = new Input(container)
      input.render()

      const state1 = input.getState()
      input.setValue('new value')
      const state2 = input.getState()

      expect(state1).not.toBe(state2)
    })
  })

  // ===========================================================================
  // Edge Cases Tests
  // ===========================================================================

  describe('Edge Cases', () => {
    it('should handle empty string value', () => {
      const input = new Input(container, { defaultValue: '' })
      input.render()

      expect(input.getValue()).toBe('')
    })

    it('should handle setValue with same value', () => {
      const onChange = vi.fn()
      const input = new Input(container, { defaultValue: 'test' }, { onChange })
      input.render()

      input.setValue('test')

      expect(onChange).not.toHaveBeenCalled()
    })

    it('should not change value when disabled', () => {
      const input = new Input(container, { disabled: true })
      input.render()

      const inputElement = container.querySelector('.input-field') as HTMLInputElement
      expect(inputElement.disabled).toBe(true)
    })

    it('should handle autofocus', () => {
      const config: InputConfig = { autoFocus: true }
      const input = new Input(container, config)
      input.render()

      const inputElement = container.querySelector('.input-field') as HTMLInputElement
      expect(document.activeElement).toBe(inputElement)
    })
  })
})

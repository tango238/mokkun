/**
 * Textarea Component Tests
 * Textareaコンポーネントのテスト
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  Textarea,
  createTextarea,
  type TextareaConfig,
  type TextareaState,
  type TextareaCallbacks,
} from '../renderer/components/textarea'

// Simple DOM mock for testing
function createMockContainer(): HTMLElement {
  const container = document.createElement('div')
  document.body.appendChild(container)
  return container
}

function cleanupContainer(container: HTMLElement): void {
  container.remove()
}

// =============================================================================
// Textarea Tests
// =============================================================================

describe('Textarea', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = createMockContainer()
  })

  afterEach(() => {
    cleanupContainer(container)
  })

  // ---------------------------------------------------------------------------
  // Initialization Tests
  // ---------------------------------------------------------------------------

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const textarea = new Textarea(container)
      const state = textarea.getState()

      expect(state.value).toBe('')
      expect(state.disabled).toBe(false)
      expect(state.readonly).toBe(false)
      expect(state.error).toBe(false)
      expect(state.characterCount).toBe(0)
    })

    it('should initialize with custom config', () => {
      const config: TextareaConfig = {
        defaultValue: 'Hello World',
        disabled: true,
        readonly: false,
        rows: 5,
        maxLength: 100,
      }

      const textarea = new Textarea(container, config)
      const state = textarea.getState()

      expect(state.value).toBe('Hello World')
      expect(state.disabled).toBe(true)
      expect(state.readonly).toBe(false)
      expect(state.characterCount).toBe(11)
    })

    it('should calculate initial character count', () => {
      const config: TextareaConfig = {
        defaultValue: 'Test message',
      }

      const textarea = new Textarea(container, config)
      const state = textarea.getState()

      expect(state.characterCount).toBe(12)
    })
  })

  // ---------------------------------------------------------------------------
  // Rendering Tests
  // ---------------------------------------------------------------------------

  describe('rendering', () => {
    it('should render textarea element', () => {
      const textarea = new Textarea(container)
      textarea.render()

      const textareaEl = container.querySelector('textarea')
      expect(textareaEl).toBeTruthy()
      expect(textareaEl?.classList.contains('mokkun-textarea')).toBe(true)
    })

    it('should render with placeholder', () => {
      const config: TextareaConfig = {
        placeholder: 'Enter your message',
      }

      const textarea = new Textarea(container, config)
      textarea.render()

      const textareaEl = container.querySelector('textarea')
      expect(textareaEl?.getAttribute('placeholder')).toBe('Enter your message')
    })

    it('should render with custom rows', () => {
      const config: TextareaConfig = {
        rows: 10,
      }

      const textarea = new Textarea(container, config)
      textarea.render()

      const textareaEl = container.querySelector('textarea')
      expect(textareaEl?.getAttribute('rows')).toBe('10')
    })

    it('should render character counter when showCount is true', () => {
      const config: TextareaConfig = {
        showCount: true,
        defaultValue: 'Test',
      }

      const textarea = new Textarea(container, config)
      textarea.render()

      const counter = container.querySelector('.mokkun-textarea-counter')
      expect(counter).toBeTruthy()
      expect(counter?.textContent).toBe('4文字')
    })

    it('should render character counter with max length', () => {
      const config: TextareaConfig = {
        showCount: true,
        maxLength: 100,
        defaultValue: 'Test',
      }

      const textarea = new Textarea(container, config)
      textarea.render()

      const counter = container.querySelector('.mokkun-textarea-counter')
      expect(counter).toBeTruthy()
      expect(counter?.textContent).toBe('4 / 100')
    })

    it('should not render character counter when showCount is false', () => {
      const config: TextareaConfig = {
        showCount: false,
      }

      const textarea = new Textarea(container, config)
      textarea.render()

      const counter = container.querySelector('.mokkun-textarea-counter')
      expect(counter).toBeNull()
    })

    it('should render error message when error state is true', () => {
      const config: TextareaConfig = {
        errorMessage: 'This field is required',
      }

      const textarea = new Textarea(container, config)
      textarea.setError(true, 'This field is required')

      const error = container.querySelector('.mokkun-textarea-error')
      expect(error).toBeTruthy()
      expect(error?.textContent).toBe('This field is required')
    })

    it('should apply disabled class when disabled', () => {
      const config: TextareaConfig = {
        disabled: true,
      }

      const textarea = new Textarea(container, config)
      textarea.render()

      const wrapper = container.querySelector('.mokkun-textarea-wrapper')
      expect(wrapper?.classList.contains('is-disabled')).toBe(true)
    })

    it('should apply readonly class when readonly', () => {
      const config: TextareaConfig = {
        readonly: true,
      }

      const textarea = new Textarea(container, config)
      textarea.render()

      const wrapper = container.querySelector('.mokkun-textarea-wrapper')
      expect(wrapper?.classList.contains('is-readonly')).toBe(true)
    })

    it('should apply no-resize class when resizable is false', () => {
      const config: TextareaConfig = {
        resizable: false,
      }

      const textarea = new Textarea(container, config)
      textarea.render()

      const textareaEl = container.querySelector('textarea')
      expect(textareaEl?.classList.contains('no-resize')).toBe(true)
    })
  })

  // ---------------------------------------------------------------------------
  // Value Management Tests
  // ---------------------------------------------------------------------------

  describe('value management', () => {
    it('should set and get value', () => {
      const textarea = new Textarea(container)
      textarea.render()

      textarea.setValue('New value')
      expect(textarea.getValue()).toBe('New value')
    })

    it('should update character count when value changes', () => {
      const config: TextareaConfig = {
        showCount: true,
      }

      const textarea = new Textarea(container, config)
      textarea.render()

      textarea.setValue('Hello')
      const state = textarea.getState()
      expect(state.characterCount).toBe(5)
    })

    it('should trigger onChange callback when value changes', () => {
      const onChange = vi.fn()
      const callbacks: TextareaCallbacks = {
        onChange,
      }

      const textarea = new Textarea(container, {}, callbacks)
      textarea.render()

      textarea.setValue('Test')
      expect(onChange).toHaveBeenCalledWith('Test', expect.any(Object))
    })

    it('should clear value', () => {
      const config: TextareaConfig = {
        defaultValue: 'Initial value',
      }

      const textarea = new Textarea(container, config)
      textarea.render()

      textarea.clear()
      expect(textarea.getValue()).toBe('')
    })
  })

  // ---------------------------------------------------------------------------
  // State Management Tests
  // ---------------------------------------------------------------------------

  describe('state management', () => {
    it('should set disabled state', () => {
      const textarea = new Textarea(container)
      textarea.render()

      textarea.setDisabled(true)
      const state = textarea.getState()
      expect(state.disabled).toBe(true)
    })

    it('should set readonly state', () => {
      const textarea = new Textarea(container)
      textarea.render()

      textarea.setReadonly(true)
      const state = textarea.getState()
      expect(state.readonly).toBe(true)
    })

    it('should set error state', () => {
      const textarea = new Textarea(container)
      textarea.render()

      textarea.setError(true, 'Error message')
      const state = textarea.getState()
      expect(state.error).toBe(true)
      expect(state.errorMessage).toBe('Error message')
    })

    it('should clear error state', () => {
      const textarea = new Textarea(container)
      textarea.render()

      textarea.setError(true, 'Error message')
      textarea.setError(false)
      const state = textarea.getState()
      expect(state.error).toBe(false)
    })
  })

  // ---------------------------------------------------------------------------
  // Validation Tests
  // ---------------------------------------------------------------------------

  describe('validation', () => {
    it('should validate required field', () => {
      const config: TextareaConfig = {
        required: true,
      }

      const textarea = new Textarea(container, config)
      textarea.render()

      expect(textarea.validate()).toBe(false)
      const state = textarea.getState()
      expect(state.error).toBe(true)
      expect(state.errorMessage).toBe('この項目は必須です')
    })

    it('should validate min length', () => {
      const config: TextareaConfig = {
        minLength: 10,
        defaultValue: 'Short',
      }

      const textarea = new Textarea(container, config)
      textarea.render()

      expect(textarea.validate()).toBe(false)
      const state = textarea.getState()
      expect(state.error).toBe(true)
      expect(state.errorMessage).toBe('10文字以上入力してください')
    })

    it('should validate max length', () => {
      const config: TextareaConfig = {
        maxLength: 5,
        defaultValue: 'Too long message',
      }

      const textarea = new Textarea(container, config)
      textarea.render()

      expect(textarea.validate()).toBe(false)
      const state = textarea.getState()
      expect(state.error).toBe(true)
      expect(state.errorMessage).toBe('5文字以内で入力してください')
    })

    it('should pass validation when all rules are met', () => {
      const config: TextareaConfig = {
        required: true,
        minLength: 5,
        maxLength: 20,
        defaultValue: 'Valid message',
      }

      const textarea = new Textarea(container, config)
      textarea.render()

      expect(textarea.validate()).toBe(true)
      const state = textarea.getState()
      expect(state.error).toBe(false)
    })

    it('should allow empty value when not required', () => {
      const config: TextareaConfig = {
        required: false,
      }

      const textarea = new Textarea(container, config)
      textarea.render()

      expect(textarea.validate()).toBe(true)
    })
  })

  // ---------------------------------------------------------------------------
  // Callback Tests
  // ---------------------------------------------------------------------------

  describe('callbacks', () => {
    it('should trigger onChange callback', () => {
      const onChange = vi.fn()
      const callbacks: TextareaCallbacks = {
        onChange,
      }

      const textarea = new Textarea(container, {}, callbacks)
      textarea.render()

      textarea.setValue('Test')
      expect(onChange).toHaveBeenCalled()
      expect(onChange).toHaveBeenCalledWith('Test', expect.objectContaining({
        value: 'Test',
        characterCount: 4,
      }))
    })
  })

  // ---------------------------------------------------------------------------
  // Factory Function Tests
  // ---------------------------------------------------------------------------

  describe('createTextarea factory', () => {
    it('should create and render textarea', () => {
      const config: TextareaConfig = {
        defaultValue: 'Factory test',
      }

      const textarea = createTextarea(container, config)

      const textareaEl = container.querySelector('textarea')
      expect(textareaEl).toBeTruthy()
      expect(textarea.getValue()).toBe('Factory test')
    })

    it('should work with callbacks', () => {
      const onChange = vi.fn()
      const callbacks: TextareaCallbacks = {
        onChange,
      }

      const textarea = createTextarea(container, {}, callbacks)
      textarea.setValue('Test')

      expect(onChange).toHaveBeenCalled()
    })
  })

  // ---------------------------------------------------------------------------
  // Accessibility Tests
  // ---------------------------------------------------------------------------

  describe('accessibility', () => {
    it('should set aria-label attribute', () => {
      const textarea = new Textarea(container)
      textarea.render()

      const textareaEl = container.querySelector('textarea')
      expect(textareaEl?.getAttribute('aria-label')).toBe('Textarea')
    })

    it('should set aria-required when required', () => {
      const config: TextareaConfig = {
        required: true,
      }

      const textarea = new Textarea(container, config)
      textarea.render()

      const textareaEl = container.querySelector('textarea')
      expect(textareaEl?.getAttribute('aria-required')).toBe('true')
    })

    it('should set aria-disabled when disabled', () => {
      const config: TextareaConfig = {
        disabled: true,
      }

      const textarea = new Textarea(container, config)
      textarea.render()

      const textareaEl = container.querySelector('textarea')
      expect(textareaEl?.getAttribute('aria-disabled')).toBe('true')
    })

    it('should set aria-readonly when readonly', () => {
      const config: TextareaConfig = {
        readonly: true,
      }

      const textarea = new Textarea(container, config)
      textarea.render()

      const textareaEl = container.querySelector('textarea')
      expect(textareaEl?.getAttribute('aria-readonly')).toBe('true')
    })

    it('should set aria-invalid when error', () => {
      const textarea = new Textarea(container)
      textarea.render()
      textarea.setError(true, 'Error')

      const textareaEl = container.querySelector('textarea')
      expect(textareaEl?.getAttribute('aria-invalid')).toBe('true')
    })

    it('should set aria-describedby when error message exists', () => {
      const textarea = new Textarea(container, {
        id: 'test-textarea',
      })
      textarea.render()
      textarea.setError(true, 'Error message')

      const textareaEl = container.querySelector('textarea')
      expect(textareaEl?.getAttribute('aria-describedby')).toBe('test-textarea-error')
    })

    it('should set aria-live on counter', () => {
      const config: TextareaConfig = {
        showCount: true,
      }

      const textarea = new Textarea(container, config)
      textarea.render()

      const counter = container.querySelector('.mokkun-textarea-counter')
      expect(counter?.getAttribute('aria-live')).toBe('polite')
    })

    it('should set role alert on error message', () => {
      const textarea = new Textarea(container)
      textarea.render()
      textarea.setError(true, 'Error')

      const error = container.querySelector('.mokkun-textarea-error')
      expect(error?.getAttribute('role')).toBe('alert')
    })
  })

  // ---------------------------------------------------------------------------
  // Character Counter Tests
  // ---------------------------------------------------------------------------

  describe('character counter', () => {
    it('should show over-limit class when exceeding max length', () => {
      const config: TextareaConfig = {
        showCount: true,
        maxLength: 10,
        defaultValue: 'This is a very long message',
      }

      const textarea = new Textarea(container, config)
      textarea.render()

      const counter = container.querySelector('.mokkun-textarea-counter')
      expect(counter?.classList.contains('over-limit')).toBe(true)
    })

    it('should remove over-limit class when within limit', () => {
      const config: TextareaConfig = {
        showCount: true,
        maxLength: 100,
        defaultValue: 'Short',
      }

      const textarea = new Textarea(container, config)
      textarea.render()

      const counter = container.querySelector('.mokkun-textarea-counter')
      expect(counter?.classList.contains('over-limit')).toBe(false)
    })
  })
})

/**
 * Mokkun Library Entry Point Tests
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Mokkun, type MokkunInstance } from '../lib'

// Mock IntersectionObserver for tests
class MockIntersectionObserver {
  constructor(_callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {}
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  takeRecords = vi.fn().mockReturnValue([])
  root = null
  rootMargin = ''
  thresholds = [0]
}
vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)

describe('Mokkun Library', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    container.id = 'test-container'
    document.body.appendChild(container)
  })

  afterEach(() => {
    document.body.removeChild(container)
    // Reset theme to default
    document.documentElement.removeAttribute('data-theme')
  })

  describe('Mokkun.init()', () => {
    it('should initialize with yamlContent', async () => {
      const instance = await Mokkun.init({
        container: '#test-container',
        yamlContent: `
view:
  test:
    title: Test Screen
    fields:
      - id: name
        type: text
        label: Name
`,
      })

      expect(instance.schema).not.toBeNull()
      expect(instance.getScreenNames()).toContain('test')
      expect(instance.currentScreen).toBe('test')

      // Cleanup
      instance.destroy()
    })

    it('should apply specified theme', async () => {
      const instance = await Mokkun.init({
        container: '#test-container',
        theme: 'dark',
        yamlContent: `
view:
  test:
    title: Test
`,
      })

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')

      instance.destroy()
    })

    it('should render screen with fields', async () => {
      const instance = await Mokkun.init({
        container: '#test-container',
        yamlContent: `
view:
  form:
    title: Contact Form
    fields:
      - id: email
        type: text
        label: Email Address
`,
      })

      expect(container.querySelector('.screen-title')?.textContent).toBe('Contact Form')
      expect(container.querySelector('label')?.textContent).toContain('Email Address')

      instance.destroy()
    })

    it('should call onReady callback', async () => {
      const onReady = vi.fn()

      const instance = await Mokkun.init({
        container: '#test-container',
        yamlContent: `view: { test: { title: Test } }`,
        onReady,
      })

      expect(onReady).toHaveBeenCalledTimes(1)
      expect(onReady).toHaveBeenCalledWith(instance)

      instance.destroy()
    })

    it('should call onError callback for invalid YAML', async () => {
      const onError = vi.fn()

      await expect(
        Mokkun.init({
          container: '#test-container',
          yamlContent: `invalid: [yaml`,
          onError,
        })
      ).rejects.toThrow()

      expect(onError).toHaveBeenCalledTimes(1)
    })

    it('should reject when container not found', async () => {
      await expect(
        Mokkun.init({
          container: '#non-existent',
          yamlContent: `view: { test: { title: Test } }`,
        })
      ).rejects.toThrow('Container not found')
    })

    it('should reject when neither yamlUrl nor yamlContent provided', async () => {
      await expect(
        Mokkun.init({
          container: '#test-container',
        })
      ).rejects.toThrow('Either yamlUrl or yamlContent must be provided')
    })

    it('should use initialScreen option', async () => {
      const instance = await Mokkun.init({
        container: '#test-container',
        initialScreen: 'screen2',
        yamlContent: `
view:
  screen1:
    title: Screen 1
  screen2:
    title: Screen 2
`,
      })

      expect(instance.currentScreen).toBe('screen2')
      expect(container.querySelector('.screen-title')?.textContent).toBe('Screen 2')

      instance.destroy()
    })
  })

  describe('MokkunInstance methods', () => {
    let instance: MokkunInstance

    beforeEach(async () => {
      instance = await Mokkun.init({
        container: '#test-container',
        yamlContent: `
view:
  screen1:
    title: Screen 1
    fields:
      - id: field1
        type: text
        label: Field 1
  screen2:
    title: Screen 2
    fields:
      - id: field2
        type: text
        label: Field 2
`,
      })
    })

    afterEach(() => {
      instance.destroy()
    })

    it('should navigate between screens with showScreen()', () => {
      expect(instance.currentScreen).toBe('screen1')

      instance.showScreen('screen2')

      expect(instance.currentScreen).toBe('screen2')
      expect(container.querySelector('.screen-title')?.textContent).toBe('Screen 2')
    })

    it('should return correct screen names', () => {
      const names = instance.getScreenNames()
      expect(names).toEqual(['screen1', 'screen2'])
    })

    it('should change theme with setTheme()', () => {
      instance.setTheme('dark')
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')

      instance.setTheme('light')
      expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    })

    it('should get current theme', () => {
      instance.setTheme('dark')
      expect(instance.getTheme()).toBe('dark')
    })

    it('should get form data', () => {
      // Fill in form field
      const input = container.querySelector<HTMLInputElement>('input[name="field1"]')
      if (input) {
        input.value = 'test value'
      }

      const formData = instance.getFormData()
      expect(formData).toHaveProperty('field1', 'test value')
    })

    it('should cleanup on destroy()', () => {
      instance.destroy()

      expect(container.innerHTML).toBe('')
      expect(instance.schema).toBeNull()
      expect(instance.currentScreen).toBeNull()
    })

    it('should warn when showing non-existent screen', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      instance.showScreen('non-existent')

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Screen not found: non-existent')
      )

      consoleSpy.mockRestore()
    })
  })

  describe('Mokkun exports', () => {
    it('should export VERSION', () => {
      expect(typeof Mokkun.VERSION).toBe('string')
    })

    it('should export utils', () => {
      expect(typeof Mokkun.utils.parseYaml).toBe('function')
      expect(typeof Mokkun.utils.getScreen).toBe('function')
      expect(typeof Mokkun.utils.getScreenNames).toBe('function')
      expect(typeof Mokkun.utils.findFieldById).toBe('function')
    })

    it('should export theme utilities', () => {
      expect(typeof Mokkun.theme.apply).toBe('function')
      expect(typeof Mokkun.theme.getCurrent).toBe('function')
      expect(typeof Mokkun.theme.getAvailable).toBe('function')
    })

    it('should parse YAML with utils.parseYaml()', () => {
      const result = Mokkun.utils.parseYaml(`
view:
  test:
    title: Test
    fields:
      - id: name
        type: text
        label: Name
`)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.view).toHaveProperty('test')
      }
    })
  })

  describe('Wizard screen support', () => {
    it('should render wizard screen', async () => {
      const instance = await Mokkun.init({
        container: '#test-container',
        yamlContent: `
view:
  wizard_form:
    title: Wizard Form
    wizard:
      show_progress: true
      steps:
        - id: step1
          title: Step 1
          fields:
            - id: name
              type: text
              label: Name
        - id: step2
          title: Step 2
          fields:
            - id: email
              type: text
              label: Email
`,
      })

      expect(container.querySelector('.wizard-screen')).not.toBeNull()
      expect(container.querySelector('.wizard-progress')).not.toBeNull()
      expect(container.querySelector('.wizard-step-title')?.textContent).toBe('Step 1')

      instance.destroy()
    })
  })

  describe('Section navigation support', () => {
    it('should render screen with sections', async () => {
      const instance = await Mokkun.init({
        container: '#test-container',
        yamlContent: `
view:
  sectioned_form:
    title: Sectioned Form
    sections:
      - section_name: Basic Info
        input_fields:
          - id: name
            type: text
            label: Name
      - section_name: Contact
        input_fields:
          - id: email
            type: text
            label: Email
`,
      })

      expect(container.querySelector('.screen-with-sections')).not.toBeNull()
      expect(container.querySelectorAll('.form-section').length).toBe(2)

      instance.destroy()
    })
  })
})

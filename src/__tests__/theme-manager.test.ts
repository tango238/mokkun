/**
 * Theme Manager Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { JSDOM } from 'jsdom'
import {
  ThemeManager,
  themeManager,
  initializeTheme,
  applyTheme,
  getAvailableThemes,
  getCurrentTheme,
} from '../theme/theme-manager'
import {
  THEME_STORAGE_KEY,
  THEME_DATA_ATTRIBUTE,
  THEME_CHANGE_EVENT,
} from '../types/theme'
import type { ThemeDefinition, ThemeChangeEventDetail } from '../types/theme'

describe('ThemeManager', () => {
  let dom: JSDOM
  let manager: ThemeManager

  beforeEach(() => {
    // Set up JSDOM
    dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', {
      url: 'http://localhost',
    })

    // Set globals
    global.document = dom.window.document
    global.window = dom.window as unknown as Window & typeof globalThis
    global.localStorage = dom.window.localStorage
    global.HTMLStyleElement = dom.window.HTMLStyleElement
    global.CustomEvent = dom.window.CustomEvent

    // Clear localStorage
    localStorage.clear()

    // Create fresh manager for each test
    manager = new ThemeManager()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initialization', () => {
    it('should have built-in themes registered', () => {
      const themes = manager.getAvailableThemes()
      expect(themes.length).toBeGreaterThanOrEqual(2)

      const themeIds = themes.map(t => t.id)
      expect(themeIds).toContain('light')
      expect(themeIds).toContain('dark')
    })

    it('should apply default theme on initialize when no saved preference', () => {
      manager.initialize()

      expect(manager.getCurrentTheme()).toBe('light')
      expect(document.documentElement.getAttribute(THEME_DATA_ATTRIBUTE)).toBe('light')
    })

    it('should apply saved theme on initialize', () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'dark')

      manager.initialize()

      expect(manager.getCurrentTheme()).toBe('dark')
      expect(document.documentElement.getAttribute(THEME_DATA_ATTRIBUTE)).toBe('dark')
    })

    it('should fallback to default if saved theme does not exist', () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'nonexistent')

      manager.initialize()

      expect(manager.getCurrentTheme()).toBe('light')
    })
  })

  describe('applyTheme', () => {
    it('should apply theme and set data attribute', () => {
      const result = manager.applyTheme('dark')

      expect(result).toBe(true)
      expect(manager.getCurrentTheme()).toBe('dark')
      expect(document.documentElement.getAttribute(THEME_DATA_ATTRIBUTE)).toBe('dark')
    })

    it('should return false for non-existent theme', () => {
      const result = manager.applyTheme('nonexistent')

      expect(result).toBe(false)
      expect(manager.getCurrentTheme()).toBeNull()
    })

    it('should save theme to localStorage', () => {
      manager.applyTheme('dark')

      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    })

    it('should dispatch theme change event', () => {
      const eventHandler = vi.fn()
      document.addEventListener(THEME_CHANGE_EVENT, eventHandler)

      manager.applyTheme('dark')

      expect(eventHandler).toHaveBeenCalled()
      const event = eventHandler.mock.calls[0][0] as CustomEvent<ThemeChangeEventDetail>
      expect(event.detail.currentTheme).toBe('dark')
    })
  })

  describe('getAvailableThemes', () => {
    it('should return array of theme definitions', () => {
      const themes = manager.getAvailableThemes()

      expect(Array.isArray(themes)).toBe(true)
      expect(themes.length).toBeGreaterThan(0)

      themes.forEach(theme => {
        expect(theme).toHaveProperty('id')
        expect(theme).toHaveProperty('name')
      })
    })
  })

  describe('getTheme', () => {
    it('should return theme by id', () => {
      const theme = manager.getTheme('light')

      expect(theme).toBeDefined()
      expect(theme?.id).toBe('light')
      expect(theme?.name).toBe('ライト')
    })

    it('should return undefined for non-existent theme', () => {
      const theme = manager.getTheme('nonexistent')

      expect(theme).toBeUndefined()
    })
  })

  describe('hasTheme', () => {
    it('should return true for existing theme', () => {
      expect(manager.hasTheme('light')).toBe(true)
      expect(manager.hasTheme('dark')).toBe(true)
    })

    it('should return false for non-existent theme', () => {
      expect(manager.hasTheme('nonexistent')).toBe(false)
    })
  })

  describe('registerTheme', () => {
    it('should register custom theme', () => {
      const customTheme: ThemeDefinition = {
        id: 'custom',
        name: 'Custom Theme',
        description: 'A custom theme',
        cssVariables: {
          '--primary-color': '#ff0000',
        },
      }

      manager.registerTheme(customTheme)

      expect(manager.hasTheme('custom')).toBe(true)
      expect(manager.getTheme('custom')?.name).toBe('Custom Theme')
      expect(manager.getTheme('custom')?.isBuiltIn).toBe(false)
    })
  })

  describe('unregisterTheme', () => {
    it('should unregister custom theme', () => {
      const customTheme: ThemeDefinition = {
        id: 'custom',
        name: 'Custom Theme',
      }

      manager.registerTheme(customTheme)
      expect(manager.hasTheme('custom')).toBe(true)

      const result = manager.unregisterTheme('custom')

      expect(result).toBe(true)
      expect(manager.hasTheme('custom')).toBe(false)
    })

    it('should not unregister built-in theme', () => {
      const result = manager.unregisterTheme('light')

      expect(result).toBe(false)
      expect(manager.hasTheme('light')).toBe(true)
    })

    it('should switch to default if current theme is unregistered', () => {
      const customTheme: ThemeDefinition = {
        id: 'custom',
        name: 'Custom Theme',
      }

      manager.registerTheme(customTheme)
      manager.applyTheme('custom')
      expect(manager.getCurrentTheme()).toBe('custom')

      manager.unregisterTheme('custom')

      expect(manager.getCurrentTheme()).toBe('light')
    })
  })

  describe('getSavedTheme', () => {
    it('should return saved theme from localStorage', () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'dark')

      expect(manager.getSavedTheme()).toBe('dark')
    })

    it('should return null if no theme saved', () => {
      expect(manager.getSavedTheme()).toBeNull()
    })
  })

  describe('clearSavedTheme', () => {
    it('should remove theme from localStorage', () => {
      localStorage.setItem(THEME_STORAGE_KEY, 'dark')
      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')

      manager.clearSavedTheme()

      expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull()
    })
  })

  describe('onThemeChange', () => {
    it('should call callback when theme changes', () => {
      const callback = vi.fn()

      manager.onThemeChange(callback)
      manager.applyTheme('dark')

      expect(callback).toHaveBeenCalledWith({
        previousTheme: null,
        currentTheme: 'dark',
      })
    })

    it('should return unsubscribe function', () => {
      const callback = vi.fn()

      const unsubscribe = manager.onThemeChange(callback)
      manager.applyTheme('dark')
      expect(callback).toHaveBeenCalledTimes(1)

      unsubscribe()
      manager.applyTheme('light')
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('should track previous theme', () => {
      const callback = vi.fn()

      manager.onThemeChange(callback)
      manager.applyTheme('light')
      manager.applyTheme('dark')

      expect(callback).toHaveBeenLastCalledWith({
        previousTheme: 'light',
        currentTheme: 'dark',
      })
    })
  })

  describe('loadConfig', () => {
    it('should load theme config from YAML', () => {
      const yamlConfig = `
default_theme: dark
themes:
  - id: light
    name: Light
  - id: dark
    name: Dark
custom_themes:
  - id: custom-blue
    name: Custom Blue
    css_variables:
      --primary-color: "#1976d2"
`

      manager.loadConfig(yamlConfig)

      expect(manager.hasTheme('custom-blue')).toBe(true)
      expect(manager.getTheme('custom-blue')?.name).toBe('Custom Blue')
    })

    it('should handle invalid YAML gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      manager.loadConfig('invalid: yaml: content: [')

      expect(consoleSpy).toHaveBeenCalled()
    })
  })

  describe('getDefaultTheme', () => {
    it('should return default theme id', () => {
      expect(manager.getDefaultTheme()).toBe('light')
    })

    it('should return config default if loaded', () => {
      const yamlConfig = `
default_theme: dark
themes:
  - id: light
    name: Light
  - id: dark
    name: Dark
`
      manager.loadConfig(yamlConfig)

      expect(manager.getDefaultTheme()).toBe('dark')
    })
  })

  describe('prefersColorScheme', () => {
    it('should return light when matchMedia is not available', () => {
      // In test environment (JSDOM), matchMedia is not available
      // The method should return 'light' as fallback
      const originalMatchMedia = window.matchMedia
      // @ts-expect-error - Testing undefined matchMedia
      window.matchMedia = undefined

      expect(manager.prefersColorScheme()).toBe('light')

      window.matchMedia = originalMatchMedia
    })

    it('should return dark when system prefers dark mode', () => {
      window.matchMedia = vi.fn().mockReturnValue({ matches: true })

      expect(manager.prefersColorScheme()).toBe('dark')
    })

    it('should return light when system prefers light mode', () => {
      window.matchMedia = vi.fn().mockReturnValue({ matches: false })

      expect(manager.prefersColorScheme()).toBe('light')
    })
  })

  describe('custom theme CSS variables', () => {
    it('should apply custom CSS variables for custom themes', () => {
      const customTheme: ThemeDefinition = {
        id: 'custom',
        name: 'Custom Theme',
        isBuiltIn: false,
        cssVariables: {
          '--primary-color': '#ff0000',
          '--background-color': '#000000',
        },
      }

      manager.registerTheme(customTheme)
      manager.applyTheme('custom')

      const styleElement = document.getElementById('mokkun-custom-theme')
      expect(styleElement).toBeDefined()
      expect(styleElement?.textContent).toContain('--primary-color: #ff0000')
      expect(styleElement?.textContent).toContain('--background-color: #000000')
    })

    it('should remove custom CSS variables when switching to built-in theme', () => {
      const customTheme: ThemeDefinition = {
        id: 'custom',
        name: 'Custom Theme',
        isBuiltIn: false,
        cssVariables: {
          '--primary-color': '#ff0000',
        },
      }

      manager.registerTheme(customTheme)
      manager.applyTheme('custom')

      expect(document.getElementById('mokkun-custom-theme')).toBeDefined()

      manager.applyTheme('light')

      expect(document.getElementById('mokkun-custom-theme')).toBeNull()
    })
  })
})

describe('Singleton exports', () => {
  let dom: JSDOM

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', {
      url: 'http://localhost',
    })

    global.document = dom.window.document
    global.window = dom.window as unknown as Window & typeof globalThis
    global.localStorage = dom.window.localStorage
    global.HTMLStyleElement = dom.window.HTMLStyleElement
    global.CustomEvent = dom.window.CustomEvent

    localStorage.clear()
  })

  it('should export themeManager singleton', () => {
    expect(themeManager).toBeDefined()
    expect(themeManager).toBeInstanceOf(ThemeManager)
  })

  it('should export convenience functions', () => {
    expect(typeof initializeTheme).toBe('function')
    expect(typeof applyTheme).toBe('function')
    expect(typeof getAvailableThemes).toBe('function')
    expect(typeof getCurrentTheme).toBe('function')
  })
})

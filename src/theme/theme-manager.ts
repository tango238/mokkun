/**
 * Mokkun Theme Manager
 * テーマの読み込み、切り替え、保存を管理
 */

import * as yaml from 'js-yaml'
import type {
  ThemeDefinition,
  ThemeConfig,
  ThemeCSSVariables,
  ThemeChangeEventDetail,
  BuiltInThemeId,
} from '../types/theme'
import {
  THEME_STORAGE_KEY,
  THEME_DATA_ATTRIBUTE,
  THEME_CHANGE_EVENT,
} from '../types/theme'

/**
 * Built-in themes
 */
const BUILT_IN_THEMES: ThemeDefinition[] = [
  {
    id: 'light',
    name: 'ライト',
    description: 'デフォルトの明るいテーマ',
    isBuiltIn: true,
  },
  {
    id: 'dark',
    name: 'ダーク',
    description: '目に優しいダークテーマ',
    isBuiltIn: true,
  },
]

/**
 * Default theme ID
 */
const DEFAULT_THEME_ID: BuiltInThemeId = 'light'

/**
 * Theme Manager class
 */
export class ThemeManager {
  private themes: Map<string, ThemeDefinition>
  private currentThemeId: string | null
  private config: ThemeConfig | null
  private customStyleElement: HTMLStyleElement | null

  constructor() {
    this.themes = new Map()
    this.currentThemeId = null
    this.config = null
    this.customStyleElement = null

    // Register built-in themes
    BUILT_IN_THEMES.forEach(theme => {
      this.themes.set(theme.id, theme)
    })
  }

  /**
   * Initialize the theme manager
   * Loads saved preference or applies default theme
   */
  initialize(): void {
    const savedTheme = this.getSavedTheme()
    const themeToApply = savedTheme && this.themes.has(savedTheme)
      ? savedTheme
      : this.config?.default_theme ?? DEFAULT_THEME_ID

    this.applyTheme(themeToApply)
  }

  /**
   * Load theme configuration from YAML string
   */
  loadConfig(yamlContent: string): void {
    try {
      this.config = yaml.load(yamlContent) as ThemeConfig

      // Register custom themes if any
      if (this.config.custom_themes) {
        this.config.custom_themes.forEach(customTheme => {
          const theme: ThemeDefinition = {
            id: customTheme.id,
            name: customTheme.name,
            description: customTheme.description,
            isBuiltIn: false,
            cssVariables: customTheme.css_variables as ThemeCSSVariables,
          }
          this.themes.set(theme.id, theme)
        })
      }
    } catch (error) {
      console.error('Failed to load theme config:', error)
    }
  }

  /**
   * Get all available themes
   */
  getAvailableThemes(): ThemeDefinition[] {
    return Array.from(this.themes.values())
  }

  /**
   * Get current theme ID
   */
  getCurrentTheme(): string | null {
    return this.currentThemeId
  }

  /**
   * Get theme by ID
   */
  getTheme(id: string): ThemeDefinition | undefined {
    return this.themes.get(id)
  }

  /**
   * Check if a theme exists
   */
  hasTheme(id: string): boolean {
    return this.themes.has(id)
  }

  /**
   * Apply a theme by ID
   */
  applyTheme(themeId: string): boolean {
    const theme = this.themes.get(themeId)
    if (!theme) {
      console.warn(`Theme not found: ${themeId}`)
      return false
    }

    const previousTheme = this.currentThemeId

    // Apply data attribute to document element
    document.documentElement.setAttribute(THEME_DATA_ATTRIBUTE, themeId)

    // Apply custom CSS variables if this is a custom theme
    if (!theme.isBuiltIn && theme.cssVariables) {
      this.applyCustomVariables(theme.cssVariables)
    } else {
      this.removeCustomVariables()
    }

    this.currentThemeId = themeId

    // Save to localStorage
    this.saveTheme(themeId)

    // Dispatch change event
    this.dispatchThemeChangeEvent(previousTheme, themeId)

    return true
  }

  /**
   * Apply custom CSS variables
   */
  private applyCustomVariables(variables: ThemeCSSVariables): void {
    this.removeCustomVariables()

    const styleContent = Object.entries(variables)
      .map(([key, value]) => `  ${key}: ${value};`)
      .join('\n')

    const css = `[${THEME_DATA_ATTRIBUTE}] {\n${styleContent}\n}`

    this.customStyleElement = document.createElement('style')
    this.customStyleElement.id = 'mokkun-custom-theme'
    this.customStyleElement.textContent = css
    document.head.appendChild(this.customStyleElement)
  }

  /**
   * Remove custom CSS variables style element
   */
  private removeCustomVariables(): void {
    if (this.customStyleElement) {
      this.customStyleElement.remove()
      this.customStyleElement = null
    }
  }

  /**
   * Register a custom theme
   */
  registerTheme(theme: ThemeDefinition): void {
    this.themes.set(theme.id, {
      ...theme,
      isBuiltIn: false,
    })
  }

  /**
   * Unregister a theme (only custom themes can be removed)
   */
  unregisterTheme(themeId: string): boolean {
    const theme = this.themes.get(themeId)
    if (!theme || theme.isBuiltIn) {
      return false
    }

    this.themes.delete(themeId)

    // If current theme was removed, switch to default
    if (this.currentThemeId === themeId) {
      this.applyTheme(DEFAULT_THEME_ID)
    }

    return true
  }

  /**
   * Save theme preference to localStorage
   */
  private saveTheme(themeId: string): void {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, themeId)
    } catch (error) {
      console.warn('Failed to save theme preference:', error)
    }
  }

  /**
   * Get saved theme from localStorage
   */
  getSavedTheme(): string | null {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY)
    } catch (error) {
      console.warn('Failed to read theme preference:', error)
      return null
    }
  }

  /**
   * Clear saved theme preference
   */
  clearSavedTheme(): void {
    try {
      localStorage.removeItem(THEME_STORAGE_KEY)
    } catch (error) {
      console.warn('Failed to clear theme preference:', error)
    }
  }

  /**
   * Dispatch theme change event
   */
  private dispatchThemeChangeEvent(
    previousTheme: string | null,
    currentTheme: string
  ): void {
    const detail: ThemeChangeEventDetail = {
      previousTheme,
      currentTheme,
    }

    const event = new CustomEvent(THEME_CHANGE_EVENT, {
      bubbles: true,
      detail,
    })

    document.dispatchEvent(event)
  }

  /**
   * Subscribe to theme changes
   */
  onThemeChange(
    callback: (detail: ThemeChangeEventDetail) => void
  ): () => void {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<ThemeChangeEventDetail>
      callback(customEvent.detail)
    }

    document.addEventListener(THEME_CHANGE_EVENT, handler)

    // Return unsubscribe function
    return () => {
      document.removeEventListener(THEME_CHANGE_EVENT, handler)
    }
  }

  /**
   * Get default theme ID
   */
  getDefaultTheme(): string {
    return this.config?.default_theme ?? DEFAULT_THEME_ID
  }

  /**
   * Check if system prefers dark mode
   */
  prefersColorScheme(): 'light' | 'dark' {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return 'light'
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  }

  /**
   * Apply system preference
   */
  applySystemPreference(): void {
    const preferred = this.prefersColorScheme()
    this.applyTheme(preferred)
  }

  /**
   * Watch for system preference changes
   */
  watchSystemPreference(autoApply: boolean = false): () => void {
    if (typeof window === 'undefined') {
      return () => {}
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handler = (event: MediaQueryListEvent) => {
      if (autoApply) {
        this.applyTheme(event.matches ? 'dark' : 'light')
      }
    }

    mediaQuery.addEventListener('change', handler)

    return () => {
      mediaQuery.removeEventListener('change', handler)
    }
  }
}

// Export singleton instance
export const themeManager = new ThemeManager()

// Export convenience functions
export const initializeTheme = () => themeManager.initialize()
export const applyTheme = (id: string) => themeManager.applyTheme(id)
export const getAvailableThemes = () => themeManager.getAvailableThemes()
export const getCurrentTheme = () => themeManager.getCurrentTheme()
export const onThemeChange = (
  callback: (detail: ThemeChangeEventDetail) => void
) => themeManager.onThemeChange(callback)

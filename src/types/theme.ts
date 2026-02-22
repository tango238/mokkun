/**
 * Mokkun Theme Type Definitions
 * テーマ関連の型定義
 */

/**
 * CSS Variables for theming
 */
export interface ThemeCSSVariables {
  '--primary-color'?: string
  '--primary-color-hover'?: string
  '--primary-color-light'?: string
  '--secondary-color'?: string
  '--secondary-color-hover'?: string
  '--background-color'?: string
  '--background-color-subtle'?: string
  '--surface-color'?: string
  '--text-color'?: string
  '--text-color-muted'?: string
  '--text-color-inverse'?: string
  '--border-color'?: string
  '--border-color-focus'?: string
  '--input-background'?: string
  '--input-border'?: string
  '--input-text'?: string
  '--input-placeholder'?: string
  '--button-background'?: string
  '--button-text'?: string
  '--button-secondary-background'?: string
  '--button-secondary-text'?: string
  '--button-secondary-border'?: string
  '--error-color'?: string
  '--error-color-light'?: string
  '--success-color'?: string
  '--success-color-light'?: string
  '--warning-color'?: string
  '--warning-color-light'?: string
  '--info-color'?: string
  '--info-color-light'?: string
  '--shadow-color'?: string
  '--shadow-sm'?: string
  '--shadow-md'?: string
  '--shadow-lg'?: string
  '--focus-ring-color'?: string
  '--scrollbar-track'?: string
  '--scrollbar-thumb'?: string
  '--scrollbar-thumb-hover'?: string
  [key: `--${string}`]: string | undefined
}

/**
 * Theme definition
 */
export interface ThemeDefinition {
  /** Unique theme ID */
  id: string
  /** Display name */
  name: string
  /** Description */
  description?: string
  /** Whether this is a built-in theme */
  isBuiltIn?: boolean
  /** Custom CSS variables (for custom themes) */
  cssVariables?: ThemeCSSVariables
}

/**
 * Built-in theme IDs
 */
export type BuiltInThemeId = 'light' | 'dark' | 'lofi'

/**
 * Theme configuration from YAML
 */
export interface ThemeConfig {
  /** Default theme ID */
  default_theme: string
  /** List of available themes */
  themes: ThemeConfigEntry[]
  /** Custom themes with CSS variables */
  custom_themes?: CustomThemeConfigEntry[]
}

/**
 * Theme entry in config
 */
export interface ThemeConfigEntry {
  id: string
  name: string
  description?: string
}

/**
 * Custom theme entry with CSS variables
 */
export interface CustomThemeConfigEntry extends ThemeConfigEntry {
  css_variables: Record<string, string>
}

/**
 * Theme change event detail
 */
export interface ThemeChangeEventDetail {
  previousTheme: string | null
  currentTheme: string
}

/**
 * Local storage key for theme preference
 */
export const THEME_STORAGE_KEY = 'mokkun-theme' as const

/**
 * Data attribute for theme on document element
 */
export const THEME_DATA_ATTRIBUTE = 'data-theme' as const

/**
 * Custom event name for theme changes
 */
export const THEME_CHANGE_EVENT = 'mokkun-theme-change' as const

/**
 * Theme module exports
 */

export {
  ThemeManager,
  themeManager,
  initializeTheme,
  applyTheme,
  getAvailableThemes,
  getCurrentTheme,
  onThemeChange,
} from './theme-manager'

export type {
  ThemeDefinition,
  ThemeConfig,
  ThemeCSSVariables,
  ThemeChangeEventDetail,
  BuiltInThemeId,
} from '../types/theme'

export {
  THEME_STORAGE_KEY,
  THEME_DATA_ATTRIBUTE,
  THEME_CHANGE_EVENT,
} from '../types/theme'

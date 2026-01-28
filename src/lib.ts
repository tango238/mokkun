/**
 * Mokkun Library Entry Point
 * YAML-based presentation and form builder
 */

// Import CSS (will be handled by Vite)
import './style.css'

// Import core modules
import { parseYaml, getScreen, getScreenNames, findFieldById } from './parser'
import {
  designSystemRegistry,
  type DesignSystem,
  type PartialDesignSystem,
} from './design-system'
import {
  renderScreen,
  initializeSectionNav,
  mountWizardScreen,
  type SectionNavController,
  type WizardController,
} from './renderer/screen-renderer'
import { attachActionHandler, type ActionHandlerCallbacks } from './renderer/action-handler'
import { loadFromUrl } from './loader'
import {
  initializeTheme,
  applyTheme,
  getAvailableThemes,
  getCurrentTheme,
} from './theme'
import type { MokkunSchema, ScreenDefinition, BuiltInThemeId } from './types'

// ============================================================================
// Types
// ============================================================================

/**
 * Mokkun initialization options
 */
export interface MokkunInitOptions {
  /** Container selector or element */
  container: string | HTMLElement
  /** URL to YAML file */
  yamlUrl?: string
  /** Inline YAML content */
  yamlContent?: string
  /** Initial theme ('light' | 'dark') */
  theme?: BuiltInThemeId | string
  /** Design system to use (name or instance) */
  designSystem?: string | DesignSystem
  /** Initial screen to display */
  initialScreen?: string
  /** Callback when ready */
  onReady?: (instance: MokkunInstance) => void
  /** Callback on error */
  onError?: (error: Error) => void
  /** Callback when navigating between screens */
  onNavigate?: (fromScreen: string, toScreen: string) => void
  /** Callback when form is submitted */
  onSubmit?: (screenName: string, formData: Record<string, unknown>) => void
}

/**
 * Mokkun instance returned by init()
 */
export interface MokkunInstance {
  /** Current schema */
  readonly schema: MokkunSchema | null
  /** Current screen name */
  readonly currentScreen: string | null
  /** Navigate to a screen */
  showScreen: (screenName: string) => void
  /** Get available screen names */
  getScreenNames: () => string[]
  /** Change theme */
  setTheme: (themeId: string) => void
  /** Get current theme */
  getTheme: () => string | null
  /** Switch design system */
  setDesignSystem: (nameOrSystem: string | DesignSystem) => void
  /** Get current design system name */
  getDesignSystem: () => string
  /** Get current form data */
  getFormData: () => Record<string, unknown> | null
  /** Destroy instance and cleanup */
  destroy: () => void
}

// ============================================================================
// Internal State
// ============================================================================

interface InternalState {
  container: HTMLElement
  schema: MokkunSchema | null
  currentScreenName: string | null
  sectionNavController: SectionNavController | null
  wizardController: WizardController | null
  actionHandler: ReturnType<typeof attachActionHandler> | null
  options: MokkunInitOptions
}

// ============================================================================
// Core Implementation
// ============================================================================

/**
 * Create a Mokkun instance with given state
 */
function createInstance(state: InternalState): MokkunInstance {
  const renderCurrentScreen = (): void => {
    if (!state.schema || !state.currentScreenName) return

    const screen = getScreen(state.schema, state.currentScreenName)
    if (!screen) return

    // Cleanup previous controllers
    if (state.sectionNavController) {
      state.sectionNavController.destroy()
      state.sectionNavController = null
    }
    if (state.actionHandler) {
      state.actionHandler.detach()
      state.actionHandler = null
    }
    state.wizardController = null

    // Render screen
    if (screen.wizard) {
      state.wizardController = mountWizardScreen(state.container, screen, 0)
    } else {
      state.container.innerHTML = renderScreen(screen)

      // Initialize section nav if needed
      if (screen.sections && screen.sections.length > 0) {
        state.sectionNavController = initializeSectionNav(state.container, screen)
      }
    }

    // Attach action handler
    const callbacks: ActionHandlerCallbacks = {
      onNavigate: (_actionId, to) => {
        const fromScreen = state.currentScreenName
        instance.showScreen(to)
        if (fromScreen) {
          state.options.onNavigate?.(fromScreen, to)
        }
      },
      onSubmit: (_actionId, _url, _method) => {
        const formData = instance.getFormData()
        if (formData && state.currentScreenName) {
          state.options.onSubmit?.(state.currentScreenName, formData)
        }
      },
      onReset: () => {
        const form = state.container.querySelector('form')
        form?.reset()
      },
      onCancel: () => {},
      onCustom: () => {},
    }

    state.actionHandler = attachActionHandler(state.container, callbacks)
  }

  const instance: MokkunInstance = {
    get schema() {
      return state.schema
    },
    get currentScreen() {
      return state.currentScreenName
    },

    showScreen(screenName: string) {
      if (!state.schema) return
      const screen = getScreen(state.schema, screenName)
      if (!screen) {
        console.warn(`[Mokkun] Screen not found: ${screenName}`)
        return
      }
      state.currentScreenName = screenName
      renderCurrentScreen()
    },

    getScreenNames() {
      return state.schema ? getScreenNames(state.schema) : []
    },

    setTheme(themeId: string) {
      applyTheme(themeId)
    },

    getTheme() {
      return getCurrentTheme()
    },

    setDesignSystem(nameOrSystem: string | DesignSystem) {
      if (typeof nameOrSystem === 'string') {
        designSystemRegistry.setActive(nameOrSystem)
      } else {
        designSystemRegistry.register(nameOrSystem)
        designSystemRegistry.setActive(nameOrSystem.name)
      }
      // Re-render current screen with new design system
      renderCurrentScreen()
    },

    getDesignSystem() {
      return designSystemRegistry.getActiveName()
    },

    getFormData() {
      const form = state.container.querySelector('form')
      if (!form) return null
      const formData = new FormData(form)
      const data: Record<string, unknown> = {}
      formData.forEach((value, key) => {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          if (Array.isArray(data[key])) {
            ;(data[key] as unknown[]).push(value)
          } else {
            data[key] = [data[key], value]
          }
        } else {
          data[key] = value
        }
      })
      return data
    },

    destroy() {
      if (state.sectionNavController) {
        state.sectionNavController.destroy()
      }
      if (state.actionHandler) {
        state.actionHandler.detach()
      }
      state.container.innerHTML = ''
      state.schema = null
      state.currentScreenName = null
      state.sectionNavController = null
      state.wizardController = null
      state.actionHandler = null
    },
  }

  return instance
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Initialize Mokkun with the given options
 */
async function init(options: MokkunInitOptions): Promise<MokkunInstance> {
  // Resolve container
  const container =
    typeof options.container === 'string'
      ? document.querySelector<HTMLElement>(options.container)
      : options.container

  if (!container) {
    const error = new Error(`[Mokkun] Container not found: ${options.container}`)
    options.onError?.(error)
    throw error
  }

  // Initialize design system
  if (options.designSystem) {
    if (typeof options.designSystem === 'string') {
      designSystemRegistry.setActive(options.designSystem)
    } else {
      designSystemRegistry.register(options.designSystem)
      designSystemRegistry.setActive(options.designSystem.name)
    }
  }

  // Initialize theme
  if (options.theme) {
    applyTheme(options.theme)
  } else {
    initializeTheme()
  }

  // Create internal state
  const state: InternalState = {
    container,
    schema: null,
    currentScreenName: null,
    sectionNavController: null,
    wizardController: null,
    actionHandler: null,
    options,
  }

  try {
    // Load YAML
    if (options.yamlContent) {
      const result = parseYaml(options.yamlContent)
      if (!result.success) {
        throw new Error(
          `[Mokkun] YAML parse error: ${result.errors.map((e) => e.message).join(', ')}`
        )
      }
      state.schema = result.data
    } else if (options.yamlUrl) {
      const result = await loadFromUrl(options.yamlUrl)
      if (!result.success) {
        throw new Error(`[Mokkun] Failed to load YAML: ${result.error.message}`)
      }
      state.schema = result.schema
    } else {
      throw new Error('[Mokkun] Either yamlUrl or yamlContent must be provided')
    }

    // Create instance
    const instance = createInstance(state)

    // Show initial screen
    const screenNames = instance.getScreenNames()
    const initialScreen =
      options.initialScreen && screenNames.includes(options.initialScreen)
        ? options.initialScreen
        : screenNames[0]

    if (initialScreen) {
      instance.showScreen(initialScreen)
    }

    // Call ready callback
    options.onReady?.(instance)

    return instance
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    options.onError?.(err)
    throw err
  }
}

// Version (replaced by Vite define)
declare const __VERSION__: string
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : '0.0.0-dev'

// ============================================================================
// Main Export Object
// ============================================================================

/**
 * Mokkun - YAML-based presentation and form builder
 */
export const Mokkun = {
  /** Initialize Mokkun */
  init,
  /** Library version */
  VERSION,
  /** Utility functions */
  utils: {
    parseYaml,
    getScreen,
    getScreenNames,
    findFieldById,
  },
  /** Theme management */
  theme: {
    apply: applyTheme,
    getCurrent: getCurrentTheme,
    getAvailable: getAvailableThemes,
  },
  /** Design system management */
  designSystem: {
    /** Register a design system */
    register: (system: DesignSystem) => designSystemRegistry.register(system),
    /** Register a partial design system (overrides specific field types) */
    registerPartial: (partial: PartialDesignSystem, baseName?: string) =>
      designSystemRegistry.registerPartial(partial, baseName),
    /** Set the active design system by name */
    setActive: (name: string) => designSystemRegistry.setActive(name),
    /** Get the active design system name */
    getActive: () => designSystemRegistry.getActiveName(),
    /** Get all registered design system names */
    getAvailable: () => designSystemRegistry.getAvailable(),
    /** Unregister a design system */
    unregister: (name: string) => designSystemRegistry.unregister(name),
  },
}

// UMD global export
if (typeof window !== 'undefined') {
  ;(window as unknown as { Mokkun: typeof Mokkun }).Mokkun = Mokkun
}

export type { MokkunSchema, ScreenDefinition, BuiltInThemeId }
export type { DesignSystem, PartialDesignSystem, FieldRenderer } from './design-system'
export { designSystemRegistry, defaultDesignSystem } from './design-system'

// Export components
export {
  Textarea,
  createTextarea,
  type TextareaState,
  type TextareaCallbacks,
  type TextareaConfig,
} from './renderer/components/textarea'

// Export components for direct use
export {
  Combobox,
  type ComboboxOption,
  type ComboboxConfig,
  type ComboboxState,
  type ComboboxCallbacks,
} from './renderer/components'

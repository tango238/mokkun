/**
 * Mokkun Library Entry Point
 * YAML-based presentation and form builder
 */

// Import CSS (will be handled by Vite)
import './style.css'

// Import core modules
import { parseYaml, parseYamlV2, isV2Yaml, parseV2Document, isV2Document, getScreen, getScreenNames, findFieldById } from './parser'
import {
  renderScreen,
  mountAppChrome,
  type AppChromeController,
  mountWizardScreen,
  type WizardController,
} from './renderer/screen-renderer'
import { attachTabsBehavior } from './renderer/components/tabs'
import { attachActionHandler, type ActionHandlerCallbacks } from './renderer/action-handler'
import { loadFromUrl } from './loader'
import {
  initializeTheme,
  applyTheme,
  getAvailableThemes,
  getCurrentTheme,
} from './theme'
import { mountViewV2, renderViewV2, holdV2Styles, type V2Controller, type V2Callbacks } from './renderer-v2'
import type { MokkunSchema, ScreenDefinition, BuiltInThemeId } from './types'
import type { MokkunV2Schema } from './types/schema-v2'

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
  /** Current schema（v2 文書のときは null。schemaV2 を使う） */
  readonly schema: MokkunSchema | null
  /** Current v2 schema（v1 文書のときは null） */
  readonly schemaV2: MokkunV2Schema | null
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
  /** v2 文書（mokkun: 2）のとき。v2 専用レンダラーで直接描画する */
  schemaV2: MokkunV2Schema | null
  v2Controller: V2Controller | null
  currentScreenName: string | null
  appChrome: AppChromeController | null
  tabsCleanup?: (() => void) | null
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
  /** v2 文書: 専用レンダラーで描画（v1 のコントローラーは使わない） */
  const renderCurrentV2 = (schemaV2: MokkunV2Schema, name: string): void => {
    // 古い view を外す間も <style> を保持し、遷移のたびに外れて付け直されないようにする
    const release = holdV2Styles()
    state.v2Controller?.destroy()
    const callbacks: V2Callbacks = {
      onNavigate: to => {
        const fromScreen = state.currentScreenName
        instance.showScreen(to)
        if (fromScreen) state.options.onNavigate?.(fromScreen, to)
      },
      onAction: (_actionId, kind) => {
        if (kind !== 'submit') return
        const formData = instance.getFormData()
        if (formData) state.options.onSubmit?.(name, formData)
      },
    }
    try {
      state.v2Controller = mountViewV2(state.container, schemaV2, name, callbacks)
    } finally {
      release()
    }
  }

  const renderCurrentScreen = (): void => {
    if (state.schemaV2 && state.currentScreenName) {
      renderCurrentV2(state.schemaV2, state.currentScreenName)
      return
    }
    if (!state.schema || !state.currentScreenName) return

    const screen = getScreen(state.schema, state.currentScreenName)
    if (!screen) return

    // Cleanup previous controllers
    if (state.appChrome) {
      state.appChrome.destroy()
      state.appChrome = null
    }
    if (state.tabsCleanup) {
      state.tabsCleanup()
      state.tabsCleanup = null
    }
    if (state.actionHandler) {
      state.actionHandler.detach()
      state.actionHandler = null
    }
    state.wizardController?.destroy()
    state.wizardController = null

    // Render screen
    if (screen.wizard) {
      state.wizardController = mountWizardScreen(state.container, screen, 0)
    } else {
      state.container.innerHTML = renderScreen(screen)
      state.appChrome = mountAppChrome(state.container, screen)
    }

    // Enable tab switching for statically rendered tabs
    state.tabsCleanup = attachTabsBehavior(state.container)

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
    get schemaV2() {
      return state.schemaV2
    },
    get currentScreen() {
      return state.currentScreenName
    },

    showScreen(screenName: string) {
      if (state.schemaV2) {
        if (!Object.hasOwn(state.schemaV2.views, screenName)) {
          console.warn(`[Mokkun] Screen not found: ${screenName}`)
          return
        }
        state.currentScreenName = screenName
        renderCurrentScreen()
        return
      }
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
      if (state.schemaV2) return Object.keys(state.schemaV2.views)
      return state.schema ? getScreenNames(state.schema) : []
    },

    setTheme(themeId: string) {
      applyTheme(themeId)
    },

    getTheme() {
      return getCurrentTheme()
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
      state.v2Controller?.destroy()
      state.v2Controller = null
      state.schemaV2 = null
      state.appChrome?.destroy()
      state.appChrome = null
      state.tabsCleanup?.()
      state.tabsCleanup = null
      state.wizardController?.destroy()
      if (state.actionHandler) {
        state.actionHandler.detach()
      }
      state.container.innerHTML = ''
      state.schema = null
      state.currentScreenName = null
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
 * v2 の YAML を検証して state に載せる（旧フォーマットへ変換しない）
 */
function loadV2(state: InternalState, yamlText: string): void {
  const result = parseYamlV2(yamlText)
  if (!result.success) {
    throw new Error(`[Mokkun] YAML parse error: ${result.errors.map((e) => e.message).join(', ')}`)
  }
  state.schemaV2 = result.data
}

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

  // Initialize theme
  // 未知のテーマIDは既定テーマにフォールバック
  if (!options.theme || !applyTheme(options.theme)) {
    initializeTheme()
  }

  // Create internal state
  const state: InternalState = {
    container,
    schema: null,
    schemaV2: null,
    v2Controller: null,
    currentScreenName: null,
    appChrome: null,
    wizardController: null,
    actionHandler: null,
    options,
  }

  try {
    // Load YAML
    if (options.yamlContent) {
      if (isV2Yaml(options.yamlContent)) {
        loadV2(state, options.yamlContent)
      } else {
        const result = parseYaml(options.yamlContent)
        if (!result.success) {
          throw new Error(
            `[Mokkun] YAML parse error: ${result.errors.map((e) => e.message).join(', ')}`
          )
        }
        state.schema = result.data
      }
    } else if (options.yamlUrl) {
      const result = await loadFromUrl(options.yamlUrl)
      if (!result.success) {
        throw new Error(`[Mokkun] Failed to load YAML: ${result.error.message}`)
      }
      if (result.schemaV2) {
        state.schemaV2 = result.schemaV2
      } else {
        state.schema = result.schema
      }
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
    parseYamlV2,
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
}

// UMD global export
if (typeof window !== 'undefined') {
  ;(window as unknown as { Mokkun: typeof Mokkun }).Mokkun = Mokkun
}

export type { MokkunSchema, ScreenDefinition, BuiltInThemeId, MokkunV2Schema }

// v2 レンダラー（DADS 準拠）
export { renderViewV2, mountViewV2, parseYamlV2, parseV2Document, isV2Document }
export type { V2Controller, V2Callbacks }

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

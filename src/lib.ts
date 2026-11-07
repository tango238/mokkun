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
import { mountViewV2, renderViewV2, holdV2Styles, availableStates, parseViewState, resolveRole, resolveViewState, V2_STATE_LABELS, type V2Controller, type V2Callbacks, type V2ViewState } from './renderer-v2'
import { compileV2Warnings } from './parser/v2/compile-warnings'
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
  /** v2 文書で、画面遷移時に location.hash も書き換える（既定 false） */
  syncHash?: boolean
  /** Initial screen to display */
  initialScreen?: string
  /** v2 文書: 現在のロール（app.roles の値）。ロール外の操作・ナビ・通知を出さない。未指定は全ロール分を表示 */
  role?: string
  /** v2 文書: 最初の画面の状態（normal / success / error / empty / loading）。既定 normal（状態バナーなし） */
  initialState?: V2ViewState
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
  /** v2 文書: 現在のロール。変更すると現在の画面を描き直す（undefined は全ロール） */
  setRole: (role: string | undefined) => void
  /** v2 文書: 現在の画面の状態。変更すると描き直す */
  setState: (viewState: V2ViewState) => void
  /** v2 文書: 現在の画面で選べる状態（normal は常に。success / error / empty / loading は対応する states.* があるとき） */
  getAvailableStates: () => V2ViewState[]
  /** v2 文書: 現在のロール */
  readonly role: string | undefined
  /** v2 文書: 現在の画面の状態 */
  readonly viewState: V2ViewState
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
  /** v2: 現在のロールと画面の状態 */
  role: string | undefined
  viewState: V2ViewState
  /** v2: 次の showScreen で使う状態（init の initialState。使ったら消える）。通常は画面を移るたびに通常へ戻る */
  nextState: V2ViewState | undefined
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
      syncHash: state.options.syncHash === true,
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
      state.v2Controller = mountViewV2(state.container, schemaV2, name, callbacks, { state: state.viewState, role: state.role })
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
        // 状態は画面ごと。画面を移ったら通常に戻す（init の initialState だけ最初の画面に使う。選べない状態は通常）
        state.viewState = resolveViewState(state.schemaV2, screenName, state.nextState ?? 'normal')
        state.nextState = undefined
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

    setRole(role) {
      // app.roles にないロールは未選択（すべて）
      state.role = state.schemaV2 ? resolveRole(state.schemaV2, role) : undefined
      if (state.schemaV2 && state.currentScreenName) renderCurrentScreen()
    },

    setState(viewState) {
      // 不正な値や、いまの画面で選べない状態は通常
      state.viewState = state.schemaV2 && state.currentScreenName ? resolveViewState(state.schemaV2, state.currentScreenName, viewState) : 'normal'
      if (state.schemaV2 && state.currentScreenName) renderCurrentScreen()
    },

    getAvailableStates() {
      return state.schemaV2 && state.currentScreenName ? availableStates(state.schemaV2, state.currentScreenName) : ['normal']
    },

    get role() {
      return state.role
    },

    get viewState() {
      return state.viewState
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
    role: undefined,
    viewState: 'normal',
    nextState: undefined,
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

    // role / initialState も画面のロール・状態と同じ解決を通す（不正な値は未選択・通常）
    state.role = state.schemaV2 ? resolveRole(state.schemaV2, options.role) : undefined
    state.nextState = parseViewState(options.initialState)

    if (initialScreen) {
      instance.showScreen(initialScreen)
    }
    state.nextState = undefined

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
    compileV2Warnings,
    /** v2 の状態の表示名（ビューアーのセレクトに使う） */
    V2_STATE_LABELS,
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
export { renderViewV2, mountViewV2, parseYamlV2, parseV2Document, isV2Document, compileV2Warnings }
export type { V2Controller, V2Callbacks, V2ViewState }
export type { V2RenderOptions, V2ActionPayload } from './renderer-v2'
export type { V2CompileWarning } from './parser/v2/compile-warnings'

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

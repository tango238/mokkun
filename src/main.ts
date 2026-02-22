/**
 * Mokkun - YAML Presentation Tool
 * Main Entry Point
 */

import './style.css'
import { getScreenNames, getScreen } from './parser'
import { renderScreen, renderWizardScreen, initializeSectionNav, attachActionHandler, type SectionNavController, type ActionHandler } from './renderer'
import {
  loadFromUrl,
  loadFromUrlParams,
  renderFileLoaderUI,
  attachFileLoaderEvents,
  formatFileLoadError,
  type FileLoadResult,
} from './loader'
import { initializeTheme } from './theme'
import {
  renderThemeSelector,
  attachThemeSelectorListeners,
  setupThemeSelectorSync,
} from './theme/theme-selector'
import { initializeGoogleMapEmbedFields } from './renderer/components/google-map-embed-init'
import type { MokkunSchema } from './types/schema'

// グローバル状態
let currentSchema: MokkunSchema | null = null
let currentScreenName: string | null = null
let currentFileName: string | null = null
let fileLoaderCleanup: (() => void) | null = null
let sectionNavController: SectionNavController | null = null
let actionHandler: ActionHandler | null = null

/**
 * 画面選択プルダウンを生成
 */
function renderScreenSelector(schema: MokkunSchema): string {
  const screenNames = getScreenNames(schema)

  const options = screenNames.map(name => {
    const screen = getScreen(schema, name)
    const title = screen?.title ?? name
    const selected = name === currentScreenName ? 'selected' : ''

    return `<option value="${escapeHtml(name)}" ${selected}>${escapeHtml(title)} (${escapeHtml(name)})</option>`
  }).join('')

  return `
    <select id="screen-selector" class="screen-selector">
      ${options}
    </select>
  `
}

/**
 * アプリケーション全体をレンダリング
 */
function renderApp(schema: MokkunSchema, screenName: string | null): void {
  const app = document.querySelector<HTMLDivElement>('#app')
  if (!app) return

  const screenSelectorHtml = renderScreenSelector(schema)
  let screenContentHtml = ''

  if (screenName) {
    const screen = getScreen(schema, screenName)
    if (screen) {
      screenContentHtml = renderScreen(screen)
    } else {
      screenContentHtml = `<div class="error">画面が見つかりません: ${screenName}</div>`
    }
  } else {
    screenContentHtml = `
      <div class="welcome">
        <h2>Mokkun</h2>
        <p>画面を選択してください</p>
      </div>
    `
  }

  const fileNameDisplay = currentFileName
    ? `<span class="current-file" title="${escapeHtml(currentFileName)}">${escapeHtml(truncateFileName(currentFileName))}</span>`
    : ''

  const themeSelectorHtml = renderThemeSelector()

  app.innerHTML = `
    <div class="app-layout">
      <header class="app-header">
        <h1 class="app-title">Mokkun</h1>
        <div class="header-controls">
          ${fileNameDisplay}
          <button type="button" class="btn btn-secondary btn-sm" id="load-yaml-btn">
            YAMLを読み込む
          </button>
          <label for="screen-selector" class="screen-selector-label">画面:</label>
          ${screenSelectorHtml}
          ${themeSelectorHtml}
        </div>
      </header>
      <main class="main-content">
        ${screenContentHtml}
      </main>
    </div>
  `

  // イベントリスナーを設定
  attachEventListeners()

  // テーマセレクターのイベントリスナーを設定
  attachThemeSelectorListeners()

  // セクションナビを初期化（セクション付き画面の場合）
  if (sectionNavController) {
    sectionNavController.destroy()
    sectionNavController = null
  }

  if (screenName) {
    const screen = getScreen(schema, screenName)
    if (screen?.sections && screen.sections.length > 0) {
      const mainContent = app.querySelector<HTMLElement>('.main-content')
      if (mainContent) {
        sectionNavController = initializeSectionNav(mainContent, screen)
      }
    }
  }

  // アクションハンドラーを設定（確認ダイアログ対応）
  attachActionHandlerToMain()
}

/**
 * ファイルローダー画面を表示
 */
function renderFileLoaderScreen(): void {
  const app = document.querySelector<HTMLDivElement>('#app')
  if (!app) return

  // 前のクリーンアップを実行
  if (fileLoaderCleanup) {
    fileLoaderCleanup()
    fileLoaderCleanup = null
  }

  app.innerHTML = `
    <div class="app-layout">
      <header class="app-header">
        <h1 class="app-title">Mokkun</h1>
        <div class="header-controls">
          <button type="button" class="btn btn-secondary btn-sm" id="use-sample-btn">
            サンプルを使用
          </button>
        </div>
      </header>
      <main class="main-content">
        ${renderFileLoaderUI()}
      </main>
    </div>
  `

  // ファイルローダーのイベントをアタッチ
  const mainContent = app.querySelector<HTMLElement>('.main-content')
  if (mainContent) {
    fileLoaderCleanup = attachFileLoaderEvents(mainContent, handleFileLoad)
  }

  // サンプルを使用ボタン
  const sampleBtn = app.querySelector('#use-sample-btn')
  if (sampleBtn) {
    sampleBtn.addEventListener('click', async () => {
      const result = await loadFromUrl('examples/screens.yaml')
      handleFileLoad(result)
    })
  }
}

/**
 * ファイル読み込みハンドラー
 */
function handleFileLoad(result: FileLoadResult): void {
  if (!result.success) {
    renderError(formatFileLoadError(result.error), true)
    return
  }

  currentSchema = result.schema
  currentFileName = result.fileName
  currentScreenName = getScreenNames(currentSchema)[0] ?? null
  renderApp(currentSchema, currentScreenName)
}

/**
 * アクションハンドラーをメインコンテンツにアタッチ
 */
function attachActionHandlerToMain(): void {
  // 既存のハンドラーをクリーンアップ
  if (actionHandler) {
    actionHandler.detach()
    actionHandler = null
  }

  const mainContent = document.querySelector<HTMLElement>('.main-content')
  if (!mainContent) {
    return
  }

  actionHandler = attachActionHandler(mainContent, {
    onSubmit: (actionId, url, method) => {
      // フォーム送信処理（confirmがあれば確認後に呼ばれる）
      const form = mainContent.querySelector('form')
      if (form) {
        const formData = new FormData(form)
        const data = formDataToRecord(formData)
        alert(`アクション: ${actionId}\nURL: ${url ?? '(なし)'}\nメソッド: ${method ?? 'POST'}\nデータ:\n${JSON.stringify(data, null, 2)}`)
      }
    },
    onNavigate: (_actionId, to) => {
      // ナビゲーション処理
      if (currentSchema) {
        const screen = getScreen(currentSchema, to)
        if (screen) {
          currentScreenName = to
          renderApp(currentSchema, currentScreenName)
        } else {
          alert(`画面が見つかりません: ${to}`)
        }
      }
    },
    onCustom: (actionId, handler) => {
      alert(`カスタムアクション: ${actionId}\nハンドラー: ${handler}`)
    },
    onReset: (_actionId) => {
      const form = mainContent.querySelector('form')
      if (form) {
        form.reset()
      }
    },
    onCancel: (_actionId) => {
      // キャンセル時は何もしない（ダイアログが閉じるだけ）
    },
  })
}

/**
 * イベントリスナーを設定
 */
function attachEventListeners(): void {
  // 画面選択プルダウン
  const selector = document.getElementById('screen-selector') as HTMLSelectElement
  if (selector) {
    selector.addEventListener('change', () => {
      const screenName = selector.value
      if (screenName && currentSchema) {
        currentScreenName = screenName
        renderApp(currentSchema, currentScreenName)
      }
    })
  }

  // YAML読み込みボタン
  const loadYamlBtn = document.getElementById('load-yaml-btn')
  if (loadYamlBtn) {
    loadYamlBtn.addEventListener('click', () => {
      renderFileLoaderScreen()
    })
  }

  // フォーム送信（デフォルト動作を防止）
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault()
      const formData = new FormData(form)
      const data = formDataToRecord(formData)
      alert('フォームデータ:\n' + JSON.stringify(data, null, 2))
    })
  })

  // ウィザードナビゲーション
  attachWizardEventListeners()

  // Google Maps 埋め込みコンポーネントを初期化
  initializeGoogleMapEmbedFields()
}

/**
 * ウィザードのイベントリスナーを設定
 */
function attachWizardEventListeners(): void {
  // 次へボタン
  document.querySelectorAll('.wizard-next').forEach(btn => {
    btn.addEventListener('click', () => {
      const form = document.querySelector('.wizard-form') as HTMLElement
      if (!form) return

      const currentStep = parseInt(form.dataset.currentStep ?? '0', 10)
      updateWizardStep(currentStep + 1)
    })
  })

  // 戻るボタン
  document.querySelectorAll('.wizard-back').forEach(btn => {
    btn.addEventListener('click', () => {
      const form = document.querySelector('.wizard-form') as HTMLElement
      if (!form) return

      const currentStep = parseInt(form.dataset.currentStep ?? '0', 10)
      if (currentStep > 0) {
        updateWizardStep(currentStep - 1)
      }
    })
  })
}

/**
 * ウィザードのステップを更新
 */
function updateWizardStep(newStep: number): void {
  if (!currentSchema || !currentScreenName) return

  const screen = getScreen(currentSchema, currentScreenName)
  if (!screen?.wizard) return

  if (newStep < 0 || newStep >= screen.wizard.steps.length) return

  // 再レンダリング
  const mainContent = document.querySelector('.main-content')
  if (!mainContent) return

  mainContent.innerHTML = renderWizardScreen(screen, newStep)
  attachWizardEventListeners()

  // フォーム送信リスナーも再設定
  const form = mainContent.querySelector('form')
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault()
      const formData = new FormData(form)
      const data = formDataToRecord(formData)
      alert('フォームデータ:\n' + JSON.stringify(data, null, 2))
    })
  }

  // Google Maps 埋め込みコンポーネントを初期化
  initializeGoogleMapEmbedFields()
}

/**
 * エラー画面を表示
 */
function renderError(message: string, showBackButton = false): void {
  const app = document.querySelector<HTMLDivElement>('#app')
  if (!app) return

  const backButtonHtml = showBackButton
    ? `<button type="button" class="btn btn-primary" id="error-back-btn">戻る</button>`
    : ''

  app.innerHTML = `
    <div class="error-screen">
      <h1>エラー</h1>
      <pre class="error-message">${escapeHtml(message)}</pre>
      ${backButtonHtml}
    </div>
  `

  if (showBackButton) {
    const backBtn = app.querySelector('#error-back-btn')
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        if (currentSchema) {
          renderApp(currentSchema, currentScreenName)
        } else {
          renderFileLoaderScreen()
        }
      })
    }
  }
}

/**
 * HTMLエスケープ
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * FormDataをレコードオブジェクトに変換
 */
function formDataToRecord(formData: FormData): Record<string, unknown> {
  const data: Record<string, unknown> = {}
  formData.forEach((value, key) => {
    if (data[key]) {
      if (Array.isArray(data[key])) {
        (data[key] as unknown[]).push(value)
      } else {
        data[key] = [data[key], value]
      }
    } else {
      data[key] = value
    }
  })
  return data
}

/**
 * ファイル名を短縮
 */
function truncateFileName(fileName: string, maxLength = 30): string {
  if (fileName.length <= maxLength) {
    return fileName
  }
  const ext = fileName.includes('.') ? fileName.slice(fileName.lastIndexOf('.')) : ''
  const name = fileName.slice(0, fileName.length - ext.length)
  const truncatedLength = maxLength - ext.length - 3 // 3 for "..."
  return `${name.slice(0, truncatedLength)}...${ext}`
}

/**
 * アプリケーション初期化
 */
async function init(): Promise<void> {
  // テーマを初期化（ローカルストレージから読み込みまたはデフォルト適用）
  initializeTheme()

  // テーマ同期のセットアップ
  setupThemeSelectorSync()

  // URLパラメータからYAMLを読み込み
  const urlResult = await loadFromUrlParams()

  if (urlResult) {
    handleFileLoad(urlResult)
    return
  }

  // URLパラメータがない場合はファイルローダー画面を表示
  renderFileLoaderScreen()
}

// DOMContentLoaded時に初期化
document.addEventListener('DOMContentLoaded', init)

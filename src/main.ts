/**
 * Mokkun - YAML Presentation Tool
 * Main Entry Point
 */

import './style.css'
import './viewer.css'
import { getScreenNames, getScreen, isV2Yaml, parseYamlV2 } from './parser'
import { mountViewV2, type V2Controller } from './renderer-v2'
import { renderScreen, renderWizardScreen, mountAppChrome, attachActionHandler, attachTabsBehavior, type AppChromeController, type ActionHandler } from './renderer'
import {
  loadFromUrl,
  loadFromUrlParams,
  renderFileLoaderUI,
  attachFileLoaderEvents,
  formatFileLoadError,
  type FileLoadResult,
} from './loader'
import { initializeTheme, applyTheme, getAvailableThemes, getCurrentTheme } from './theme'
import { highlightYaml, findScreenRange } from './viewer/yaml-highlight'
import { initializeGoogleMapEmbedFields } from './renderer/components/google-map-embed-init'
import type { MokkunSchema } from './types/schema'
import type { MokkunV2Schema } from './types/schema-v2'

// グローバル状態
let currentSchema: MokkunSchema | null = null
/** v2 文書（mokkun: 2）のとき。v2 専用レンダラーで直接描画する（currentSchema は画面名・ソート表示用のコンパイル結果） */
let currentSchemaV2: MokkunV2Schema | null = null
let v2Controller: V2Controller | null = null
let currentScreenName: string | null = null
let currentFileName: string | null = null
let fileLoaderCleanup: (() => void) | null = null
let actionHandler: ActionHandler | null = null
let appChrome: AppChromeController | null = null
let currentYamlText: string | null = null
let lastScrolledScreen: string | null = null
let gutterCleanup: (() => void) | null = null
let highlightedYamlCache: { text: string; html: string } | null = null

// ---- YAML ソースペインの状態（localStorage に保存） ----
const STAGE_TAG_HTML = '<span class="mk-stage-tag">YAML output</span>'
const SOURCE_PANE_KEY = 'mokkun.viewer.sourcePane'
const SOURCE_PANE_DEFAULT_WIDTH = 420
const SOURCE_PANE_MIN_WIDTH = 280
const SOURCE_PANE_MAX_RATIO = 0.6

interface SourcePaneState {
  width: number
  open: boolean
}

function clampSourceWidth(width: number): number {
  const max = Math.max(SOURCE_PANE_MIN_WIDTH, Math.floor(window.innerWidth * SOURCE_PANE_MAX_RATIO))
  return Math.min(max, Math.max(SOURCE_PANE_MIN_WIDTH, Math.round(width)))
}

function loadSourcePaneState(): SourcePaneState {
  const state: SourcePaneState = { width: SOURCE_PANE_DEFAULT_WIDTH, open: true }
  try {
    const raw = window.localStorage.getItem(SOURCE_PANE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SourcePaneState>
      if (typeof parsed.width === 'number' && Number.isFinite(parsed.width)) state.width = parsed.width
      if (typeof parsed.open === 'boolean') state.open = parsed.open
    }
  } catch {
    // localStorage 利用不可 / 不正値は既定値で続行
  }
  state.width = clampSourceWidth(state.width)
  return state
}

function saveSourcePaneState(state: SourcePaneState): void {
  try {
    window.localStorage.setItem(SOURCE_PANE_KEY, JSON.stringify(state))
  } catch {
    // 保存できなくても動作には影響しない
  }
}

let sourcePaneState: SourcePaneState = { width: SOURCE_PANE_DEFAULT_WIDTH, open: true }

let viewerHeaderObserver: ResizeObserver | null = null

/** .app-header の実測高さを --viewer-header-height に反映（レイアウトの sticky top 用） */
function syncViewerHeaderHeight(): void {
  viewerHeaderObserver?.disconnect()
  viewerHeaderObserver = null
  const header = document.querySelector<HTMLElement>('.app-header')
  if (!header) return
  const apply = (): void => {
    document.documentElement.style.setProperty('--viewer-header-height', `${header.offsetHeight}px`)
  }
  apply()
  if (typeof ResizeObserver !== 'undefined') {
    viewerHeaderObserver = new ResizeObserver(apply)
    viewerHeaderObserver.observe(header)
  }
}

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
    <select id="screen-selector" class="mk-select">
      ${options}
    </select>
  `
}

let tabsCleanup: (() => void) | null = null

/**
 * 現在の画面に紐づくコントローラー（AppHeader・AppNavi / tabs / gutter）を破棄する。
 * #app の innerHTML を差し替える前に呼ぶこと。
 */
function teardownScreen(): void {
  if (v2Controller) {
    v2Controller.destroy()
    v2Controller = null
  }
  if (appChrome) {
    appChrome.destroy()
    appChrome = null
  }
  if (tabsCleanup) {
    tabsCleanup()
    tabsCleanup = null
  }
  if (gutterCleanup) {
    gutterCleanup()
    gutterCleanup = null
  }
}


function renderOptionSelect(id: string, options: Array<{ value: string; label: string }>, selected: string): string {
  const items = options.map(o =>
    `<option value="${escapeHtml(o.value)}"${o.value === selected ? ' selected' : ''}>${escapeHtml(o.label)}</option>`
  ).join('')
  return `<select id="${id}" class="mk-select">${items}</select>`
}

/** PREVIEW ペインヘッダ右端の theme セレクト */
function renderPreviewControls(): string {
  const themes = getAvailableThemes()
  const themeSelect = renderOptionSelect(
    'theme-selector',
    themes.map(t => ({ value: t.id, label: t.name ?? t.id })),
    getCurrentTheme() ?? ''
  )
  return `
    <label for="theme-selector">theme</label>${themeSelect}
  `
}

function renderSourcePane(): string {
  if (currentYamlText === null) return ''
  if (!highlightedYamlCache || highlightedYamlCache.text !== currentYamlText) {
    highlightedYamlCache = { text: currentYamlText, html: highlightYaml(currentYamlText) }
  }
  return `
    <div class="mk-gutter" id="mk-gutter" role="separator" aria-orientation="vertical" aria-label="YAML ペインの幅" aria-valuemin="${SOURCE_PANE_MIN_WIDTH}" aria-valuenow="${sourcePaneState.width}" aria-valuemax="${Math.max(SOURCE_PANE_MIN_WIDTH, Math.floor(window.innerWidth * SOURCE_PANE_MAX_RATIO))}" tabindex="0"></div>
    <aside class="mk-pane mk-pane-source" id="mk-source-pane">
      <div class="mk-pane-head">
        Source <span class="mk-pane-sub">${escapeHtml(currentFileName ?? '')}</span>
        <span class="mk-pane-head-right">
          <button type="button" class="mk-btn" id="source-close-btn" aria-label="YAML ペインを閉じる">閉じる</button>
        </span>
      </div>
      <pre class="mk-yaml" id="mk-yaml"><code>${highlightedYamlCache.html}</code></pre>
    </aside>
  `
}

/** 現在の画面に対応する YAML ブロックを強調し、そこへスクロールする */
function highlightSourceScreen(scroll: boolean): void {
  const pre = document.getElementById('mk-yaml')
  if (!pre || currentYamlText === null || !currentScreenName) return
  pre.querySelectorAll('.mk-line.is-active').forEach(el => el.classList.remove('is-active'))
  const range = findScreenRange(currentYamlText, currentScreenName)
  if (!range) return
  let first: HTMLElement | null = null
  for (let n = range.start; n <= range.end; n++) {
    const el = pre.querySelector<HTMLElement>(`.mk-line[data-line="${n}"]`)
    if (!el) continue
    el.classList.add('is-active')
    if (!first) first = el
  }
  if (scroll && first) {
    const lineHeight = parseFloat(getComputedStyle(pre).lineHeight) || 20
    const y = first.getBoundingClientRect().top - pre.getBoundingClientRect().top + pre.scrollTop
    pre.scrollTop = Math.max(0, y - 2 * lineHeight)
  }
}

function applySourcePaneState(): void {
  const viewer = document.querySelector<HTMLElement>('.mk-viewer')
  if (!viewer) return
  viewer.style.setProperty('--mk-source-width', `${sourcePaneState.width}px`)
  viewer.classList.toggle('is-source-closed', !sourcePaneState.open)
  const toggle = document.getElementById('source-toggle-btn')
  if (toggle) toggle.hidden = sourcePaneState.open
}

function setSourcePaneOpen(open: boolean): void {
  sourcePaneState = { ...sourcePaneState, open }
  saveSourcePaneState(sourcePaneState)
  applySourcePaneState()
  if (open) highlightSourceScreen(true)
}

/** ガターのドラッグ / キーボードでペイン幅を変更する */
function attachGutter(): void {
  const gutter = document.getElementById('mk-gutter')
  const viewer = document.querySelector<HTMLElement>('.mk-viewer')
  if (!gutter || !viewer) return

  const setWidth = (w: number): void => {
    sourcePaneState = { ...sourcePaneState, width: clampSourceWidth(w) }
    viewer.style.setProperty('--mk-source-width', `${sourcePaneState.width}px`)
    gutter.setAttribute('aria-valuenow', String(sourcePaneState.width))
  }
  let dragging = false
  const onMove = (e: PointerEvent): void => setWidth(window.innerWidth - e.clientX)
  const stop = (): void => {
    document.removeEventListener('pointermove', onMove)
    document.removeEventListener('pointerup', stop)
    document.removeEventListener('pointercancel', stop)
    gutter.classList.remove('is-dragging')
    viewer.classList.remove('is-resizing')
    if (dragging) saveSourcePaneState(sourcePaneState)
    dragging = false
  }
  const onDown = (e: PointerEvent): void => {
    e.preventDefault()
    dragging = true
    gutter.classList.add('is-dragging')
    viewer.classList.add('is-resizing')
    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', stop)
    document.addEventListener('pointercancel', stop)
  }
  const onKey = (e: KeyboardEvent): void => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    setWidth(sourcePaneState.width + (e.key === 'ArrowLeft' ? 24 : -24))
    saveSourcePaneState(sourcePaneState)
  }
  gutter.addEventListener('pointerdown', onDown)
  gutter.addEventListener('keydown', onKey)
  gutterCleanup = () => {
    gutter.removeEventListener('pointerdown', onDown)
    gutter.removeEventListener('keydown', onKey)
    stop()
  }
}

/**
 * アプリケーション全体をレンダリング
 */
function renderApp(schema: MokkunSchema, screenName: string | null): void {
  const app = document.querySelector<HTMLDivElement>('#app')
  if (!app) return

  // innerHTML 差し替えの前に前画面のコントローラーを破棄する
  teardownScreen()
  const prevSourceScroll = document.getElementById('mk-yaml')?.scrollTop ?? 0

  const screenSelectorHtml = renderScreenSelector(schema)
  let screenContentHtml = ''

  if (screenName) {
    const screen = getScreen(schema, screenName)
    if (currentSchemaV2 && Object.hasOwn(currentSchemaV2.views, screenName)) {
      // v2 は専用レンダラー。コンテナだけ出力し、app.innerHTML の後で mount する
      screenContentHtml = '<div id="mk-v2-root"></div>'
    } else if (screen) {
      screenContentHtml = renderScreen(screen)
    } else {
      screenContentHtml = `<div class="error">画面が見つかりません: ${escapeHtml(screenName)}</div>`
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
    ? `<span class="mk-file-chip" title="${escapeHtml(currentFileName)}">${escapeHtml(truncateFileName(currentFileName))}</span>`
    : ''

  app.innerHTML = `
    <div class="mk-viewer">
      <header class="app-header mk-toolbar">
        <div class="mk-brand">
          <h1 class="mk-wordmark">Mokkun</h1>
          <span class="mk-tag">Viewer</span>
        </div>
        <div class="mk-toolbar-controls">
          ${fileNameDisplay}
          <button type="button" class="mk-btn" id="load-yaml-btn">YAMLを読み込む</button>
          <label for="screen-selector" class="mk-label">画面:</label>
          ${screenSelectorHtml}
          <button type="button" class="mk-btn" id="source-toggle-btn" hidden>YAML を表示</button>
        </div>
      </header>
      <div class="mk-split">
        <section class="mk-pane mk-pane-preview">
          <div class="mk-pane-head">
            Preview <span class="mk-pane-sub">YAML から生成した画面</span>
            <span class="mk-pane-head-right">${renderPreviewControls()}</span>
          </div>
          <div class="mk-canvas">
            <div class="mk-canvas-inner">
              <main class="main-content mk-stage">
                ${STAGE_TAG_HTML}
                ${screenContentHtml}
              </main>
            </div>
          </div>
        </section>
        ${renderSourcePane()}
      </div>
    </div>
  `
  applySourcePaneState()
  attachGutter()
  const screenChanged = currentScreenName !== lastScrolledScreen
  lastScrolledScreen = currentScreenName
  if (!screenChanged) {
    const pre = document.getElementById('mk-yaml')
    if (pre) pre.scrollTop = prevSourceScroll
  }
  highlightSourceScreen(screenChanged)

  // イベントリスナーを設定
  attachEventListeners()
  syncViewerHeaderHeight()

  // v2: 専用レンダラーをマウントして終了（v1 の AppHeader / tabs / アクションハンドラーは使わない）
  const v2Root = app.querySelector<HTMLElement>('#mk-v2-root')
  if (v2Root && currentSchemaV2 && screenName) {
    v2Controller = mountViewV2(v2Root, currentSchemaV2, screenName, {
      onNavigate: to => {
        if (!currentSchemaV2 || !Object.hasOwn(currentSchemaV2.views, to)) return
        currentScreenName = to
        updateUrlParam('screen', to)
        renderApp(schema, currentScreenName)
      },
      onAction: (actionId, kind) => {
        const form = v2Root.querySelector('form')
        const data = form ? formDataToRecord(new FormData(form)) : {}
        if (kind === 'submit') alert(`アクション: ${actionId}\nデータ:\n${JSON.stringify(data, null, 2)}`)
        else if (kind === 'custom') alert(`カスタムアクション: ${actionId}`)
      },
    })
    return
  }

  // AppHeader / AppNavi をマウント
  if (screenName) {
    const screen = getScreen(schema, screenName)
    const mainContent = app.querySelector<HTMLElement>('.main-content')
    // AppHeader / AppNavi を初期化（コンテナは renderScreen が出力済み）
    if (screen && mainContent) {
      appChrome = mountAppChrome(mainContent, screen)
    }
  }

  // 静的出力された tabs の切替を有効化
  const tabsRoot = app.querySelector<HTMLElement>('.main-content')
  if (tabsRoot) tabsCleanup = attachTabsBehavior(tabsRoot)

  // アクションハンドラーを設定（確認ダイアログ対応）
  attachActionHandlerToMain()
}

/**
 * ファイルローダー画面を表示
 */
function renderFileLoaderScreen(): void {
  const app = document.querySelector<HTMLDivElement>('#app')
  if (!app) return

  teardownScreen()

  // 前のクリーンアップを実行
  if (fileLoaderCleanup) {
    fileLoaderCleanup()
    fileLoaderCleanup = null
  }

  app.innerHTML = `
    <div class="mk-viewer">
      <header class="app-header mk-toolbar">
        <div class="mk-brand">
          <h1 class="mk-wordmark">Mokkun</h1>
          <span class="mk-tag">Viewer</span>
        </div>
        <div class="mk-toolbar-controls">
          <button type="button" class="mk-btn" id="use-sample-btn">サンプルを使用</button>
        </div>
      </header>
      <div class="mk-split">
        <section class="mk-pane mk-pane-preview">
          <div class="mk-canvas">
            <div class="mk-canvas-inner">
              <main class="main-content mk-stage">
                ${renderFileLoaderUI()}
              </main>
            </div>
          </div>
        </section>
      </div>
    </div>
  `
  syncViewerHeaderHeight()

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
  // v2 文書は検証済みの v2 スキーマを保持して、変換を経ずに描画する
  currentSchemaV2 = null
  if (isV2Yaml(result.content)) {
    const v2 = parseYamlV2(result.content)
    if (v2.success) currentSchemaV2 = v2.data
  }
  currentFileName = result.fileName
  currentYamlText = result.content
  lastScrolledScreen = null
  sourcePaneState = loadSourcePaneState()
  const screenNames = getScreenNames(currentSchema)
  const urlScreen = new URLSearchParams(window.location.search).get('screen')
  currentScreenName = (urlScreen && screenNames.includes(urlScreen) ? urlScreen : screenNames[0]) ?? null
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
          updateUrlParam('screen', to)
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
        updateUrlParam('screen', screenName)
        renderApp(currentSchema, currentScreenName)
      }
    })
  }

  // theme セレクト（URL を更新して再描画）
  const themeSelector = document.getElementById('theme-selector') as HTMLSelectElement | null
  themeSelector?.addEventListener('change', () => {
    applyTheme(themeSelector.value)
    updateUrlParam('theme', themeSelector.value)
    if (currentSchema) renderApp(currentSchema, currentScreenName)
  })

  // YAML ペインの開閉
  document.getElementById('source-close-btn')?.addEventListener('click', () => setSourcePaneOpen(false))
  document.getElementById('source-toggle-btn')?.addEventListener('click', () => setSourcePaneOpen(true))

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

  if (appChrome) {
    appChrome.destroy()
    appChrome = null
  }
  mainContent.innerHTML = STAGE_TAG_HTML + renderWizardScreen(screen, newStep)
  appChrome = mountAppChrome(mainContent as HTMLElement, screen)
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
    ? `<button type="button" class="mk-btn" id="error-back-btn">戻る</button>`
    : ''

  teardownScreen()

  app.innerHTML = `
    <div class="mk-viewer">
      <header class="app-header mk-toolbar">
        <div class="mk-brand">
          <h1 class="mk-wordmark">Mokkun</h1>
          <span class="mk-tag">Viewer</span>
        </div>
      </header>
      <div class="mk-split">
        <section class="mk-pane mk-pane-preview">
          <div class="mk-canvas">
            <div class="mk-canvas-inner">
              <main class="main-content mk-stage">
                <div class="error-screen">
                  <h1>エラー</h1>
                  <pre class="error-message">${escapeHtml(message)}</pre>
                  ${backButtonHtml}
                </div>
              </main>
            </div>
          </div>
        </section>
      </div>
    </div>
  `
  syncViewerHeaderHeight()

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

/** URL クエリを history.replaceState で更新 */
function updateUrlParam(key: string, value: string): void {
  try {
    const url = new URL(window.location.href)
    url.searchParams.set(key, value)
    window.history.replaceState(null, '', url)
  } catch {
    // URL 更新に失敗しても描画には影響しない
  }
}

/**
 * HTMLエスケープ
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
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
  // テーマを初期化（デフォルト: light）
  initializeTheme()

  // URLパラメータ ?theme= でテーマを上書き
  const urlTheme = new URLSearchParams(window.location.search).get('theme')
  if (urlTheme) {
    applyTheme(urlTheme)
  }

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

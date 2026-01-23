/**
 * Mokkun - YAML Presentation Tool
 * Main Entry Point
 */

import './style.css'
import { parseYaml, formatParseErrors, getScreenNames, getScreen } from './parser'
import { renderScreen, renderWizardScreen, initializeSectionNav, attachActionHandler, type SectionNavController, type ActionHandler } from './renderer'
import {
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

// サンプルYAML（テスト用）
const SAMPLE_YAML = `
view:
  login:
    title: ログイン
    description: アカウントにログインしてください
    fields:
      - id: email
        type: text
        label: メールアドレス
        required: true
        input_type: email
        placeholder: example@mail.com
      - id: password
        type: text
        label: パスワード
        required: true
        input_type: password
      - id: remember
        type: checkbox_group
        label: オプション
        options:
          - value: remember
            label: ログイン状態を保持する
    actions:
      - id: login_btn
        type: submit
        label: ログイン
        style: primary
      - id: forgot_password
        type: navigate
        label: パスワードを忘れた方
        style: link
        to: password_reset

  user_registration:
    title: ユーザー登録
    description: 新規アカウントを作成します
    layout:
      columns: 2
      gap: 1.5rem
    fields:
      - id: username
        type: text
        label: ユーザー名
        required: true
        min_length: 3
        max_length: 20
        placeholder: yamada_taro
      - id: email
        type: text
        label: メールアドレス
        required: true
        input_type: email
      - id: password
        type: text
        label: パスワード
        required: true
        input_type: password
        min_length: 8
      - id: password_confirm
        type: text
        label: パスワード（確認）
        required: true
        input_type: password
      - id: age
        type: number
        label: 年齢
        min: 0
        max: 150
        unit: 歳
      - id: gender
        type: radio_group
        label: 性別
        options:
          - value: male
            label: 男性
          - value: female
            label: 女性
          - value: other
            label: その他
        direction: horizontal
      - id: interests
        type: checkbox_group
        label: 興味のある分野
        options:
          - value: tech
            label: テクノロジー
          - value: sports
            label: スポーツ
          - value: music
            label: 音楽
          - value: art
            label: アート
        direction: horizontal
      - id: bio
        type: textarea
        label: 自己紹介
        rows: 4
        max_length: 500
        placeholder: 自己紹介を入力してください
    actions:
      - id: register_btn
        type: submit
        label: 登録する
        style: primary
      - id: cancel_btn
        type: reset
        label: クリア
        style: secondary

  settings:
    title: 設定
    description: アプリケーション設定を変更します
    fields:
      - id: notification_email
        type: checkbox_group
        label: メール通知
        options:
          - value: news
            label: ニュースレター
          - value: updates
            label: アップデート情報
          - value: promotions
            label: キャンペーン情報
      - id: language
        type: select
        label: 言語
        options:
          - value: ja
            label: 日本語
          - value: en
            label: English
          - value: zh
            label: 中文
      - id: timezone
        type: select
        label: タイムゾーン
        options:
          - value: Asia/Tokyo
            label: 東京 (GMT+9)
          - value: America/New_York
            label: ニューヨーク (GMT-5)
          - value: Europe/London
            label: ロンドン (GMT+0)
      - id: date_format
        type: radio_group
        label: 日付形式
        options:
          - value: yyyy-mm-dd
            label: 2024-01-15
          - value: dd/mm/yyyy
            label: 15/01/2024
          - value: mm/dd/yyyy
            label: 01/15/2024
    actions:
      - id: save_settings
        type: submit
        label: 保存
        style: primary

  booking:
    title: 予約フォーム
    description: 施設の予約を行います
    fields:
      - id: facility
        type: select
        label: 施設
        required: true
        options:
          - value: meeting_room_a
            label: 会議室A
          - value: meeting_room_b
            label: 会議室B
          - value: event_hall
            label: イベントホール
      - id: date
        type: date_picker
        label: 予約日
        required: true
      - id: start_time
        type: time_picker
        label: 開始時間
        required: true
        minute_step: 30
      - id: duration
        type: duration_picker
        label: 利用時間
        units:
          - hours
          - minutes
      - id: participants
        type: number
        label: 参加人数
        required: true
        min: 1
        max: 100
        unit: 人
      - id: equipment
        type: multi_select
        label: 必要な備品
        options:
          - value: projector
            label: プロジェクター
          - value: whiteboard
            label: ホワイトボード
          - value: video_conf
            label: ビデオ会議システム
          - value: microphone
            label: マイク
      - id: notes
        type: textarea
        label: 備考
        rows: 3
        placeholder: 特記事項があればご記入ください
    actions:
      - id: book_btn
        type: submit
        label: 予約する
        style: primary
      - id: cancel_btn
        type: reset
        label: クリア
        style: secondary

  file_upload_demo:
    title: ファイルアップロード
    description: ファイルをアップロードします
    fields:
      - id: profile_image
        type: file_upload
        label: プロフィール画像
        accept:
          - image/jpeg
          - image/png
        max_size: 5242880
        drag_drop: true
      - id: documents
        type: file_upload
        label: 書類（複数可）
        accept:
          - application/pdf
          - application/msword
        multiple: true
        max_files: 5
        max_size: 10485760
    actions:
      - id: upload_btn
        type: submit
        label: アップロード
        style: primary

  image_upload_demo:
    title: 画像アップローダーデモ
    description: 複数画像のアップロード、並び替え、削除ができます
    fields:
      - id: facility_images
        type: image_uploader
        label: 施設画像
        description: 施設の写真をアップロードしてください（最大10枚）
        required: true
        accepted_formats:
          - image/jpeg
          - image/png
          - image/webp
        max_file_size: 5242880
        max_files: 10
        min_files: 1
      - id: thumbnail
        type: image_uploader
        label: サムネイル画像
        description: サムネイル用の画像（1枚のみ）
        max_files: 1
    actions:
      - id: save_images
        type: submit
        label: 保存
        style: primary

  wizard_demo:
    title: ウィザードデモ
    description: 複数ステップのフォーム例
    wizard:
      show_progress: true
      allow_back: true
      steps:
        - id: step1
          title: 基本情報
          description: まず基本情報を入力してください
          fields:
            - id: name
              type: text
              label: 氏名
              required: true
            - id: email
              type: text
              label: メールアドレス
              required: true
              input_type: email
        - id: step2
          title: 詳細情報
          description: 詳細な情報を入力してください
          fields:
            - id: company
              type: text
              label: 会社名
            - id: department
              type: text
              label: 部署名
            - id: position
              type: text
              label: 役職
        - id: step3
          title: 確認
          description: 入力内容を確認してください
          fields:
            - id: agreement
              type: checkbox_group
              label: 同意事項
              required: true
              options:
                - value: terms
                  label: 利用規約に同意します
                - value: privacy
                  label: プライバシーポリシーに同意します
`

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
    sampleBtn.addEventListener('click', () => {
      loadSampleYaml()
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
 * サンプルYAMLを読み込み
 */
function loadSampleYaml(): void {
  const result = parseYaml(SAMPLE_YAML)

  if (!result.success) {
    renderError(formatParseErrors(result.errors), true)
    return
  }

  currentSchema = result.data
  currentFileName = 'sample.yaml'
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

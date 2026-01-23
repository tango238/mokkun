/**
 * Mokkun - File Loader Module
 * YAMLファイルの読み込み機能を提供
 */

import { parseYaml, formatParseErrors } from '../parser'
import type { MokkunSchema } from '../types/schema'
import type { ParseError } from '../parser/yaml-parser'

// ============================================================================
// Types
// ============================================================================

/**
 * ファイル読み込みエラーの種類
 */
export type FileLoadErrorType =
  | 'INVALID_FILE_TYPE'
  | 'FILE_READ_ERROR'
  | 'FETCH_ERROR'
  | 'YAML_PARSE_ERROR'
  | 'NETWORK_ERROR'

/**
 * ファイル読み込みエラー
 */
export interface FileLoadError {
  type: FileLoadErrorType
  message: string
  details?: string
  parseErrors?: ParseError[]
}

/**
 * ファイル読み込み成功結果
 */
export interface FileLoadSuccess {
  success: true
  schema: MokkunSchema
  fileName: string
  source: 'file' | 'url' | 'drop'
}

/**
 * ファイル読み込み失敗結果
 */
export interface FileLoadFailure {
  success: false
  error: FileLoadError
}

/**
 * ファイル読み込み結果
 */
export type FileLoadResult = FileLoadSuccess | FileLoadFailure

/**
 * ファイル読み込みコールバック
 */
export type FileLoadCallback = (result: FileLoadResult) => void

/**
 * ドロップゾーンオプション
 */
export interface DropZoneOptions {
  element: HTMLElement
  onLoad: FileLoadCallback
  onDragOver?: () => void
  onDragLeave?: () => void
  multiple?: boolean
}

/**
 * ファイル選択オプション
 */
export interface FileSelectOptions {
  onLoad: FileLoadCallback
  multiple?: boolean
}

// ============================================================================
// Constants
// ============================================================================

/**
 * 許可されるファイル拡張子
 */
const ALLOWED_EXTENSIONS = ['.yaml', '.yml']

/**
 * 許可されるMIMEタイプ
 */
const ALLOWED_MIME_TYPES = [
  'application/x-yaml',
  'application/yaml',
  'text/yaml',
  'text/x-yaml',
  'text/plain', // 一部のブラウザでYAMLファイルがtext/plainとして認識される
]

/**
 * 許可されるプロトコル
 */
const ALLOWED_PROTOCOLS = ['https:', 'http:']

/**
 * 最大ファイルサイズ (10MB)
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024

// ============================================================================
// Validation
// ============================================================================

/**
 * ファイル名が許可された拡張子かチェック
 */
export function isValidFileName(fileName: string): boolean {
  const lowerName = fileName.toLowerCase()
  return ALLOWED_EXTENSIONS.some(ext => lowerName.endsWith(ext))
}

/**
 * ファイルタイプが許可されているかチェック
 */
export function isValidFileType(file: File): boolean {
  // MIMEタイプをチェック（空の場合はファイル名で判断）
  if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
    // ファイル名でフォールバックチェック
    return isValidFileName(file.name)
  }
  return isValidFileName(file.name)
}

/**
 * ファイルタイプエラーを生成
 */
function createInvalidFileTypeError(fileName: string): FileLoadError {
  return {
    type: 'INVALID_FILE_TYPE',
    message: `無効なファイル形式: ${fileName}`,
    details: `YAMLファイル（${ALLOWED_EXTENSIONS.join(', ')}）のみ対応しています`,
  }
}

// ============================================================================
// YAML Content Processing
// ============================================================================

/**
 * YAMLテキストをパースしてスキーマを取得
 */
function parseYamlContent(
  content: string,
  fileName: string,
  source: 'file' | 'url' | 'drop'
): FileLoadResult {
  const result = parseYaml(content)

  if (!result.success) {
    return {
      success: false,
      error: {
        type: 'YAML_PARSE_ERROR',
        message: 'YAMLのパースに失敗しました',
        details: formatParseErrors(result.errors),
        parseErrors: result.errors,
      },
    }
  }

  return {
    success: true,
    schema: result.data,
    fileName,
    source,
  }
}

// ============================================================================
// File Reading
// ============================================================================

/**
 * FileReaderでファイルを読み込み
 */
export function readFile(
  file: File,
  source: 'file' | 'drop'
): Promise<FileLoadResult> {
  return new Promise(resolve => {
    // ファイルサイズチェック
    if (file.size > MAX_FILE_SIZE) {
      resolve({
        success: false,
        error: {
          type: 'FILE_READ_ERROR',
          message: `ファイルサイズが大きすぎます: ${file.name}`,
          details: `最大ファイルサイズは${MAX_FILE_SIZE / 1024 / 1024}MBです`,
        },
      })
      return
    }

    // ファイルタイプチェック
    if (!isValidFileType(file)) {
      resolve({
        success: false,
        error: createInvalidFileTypeError(file.name),
      })
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      const content = reader.result as string
      const result = parseYamlContent(content, file.name, source)
      resolve(result)
    }

    reader.onerror = () => {
      resolve({
        success: false,
        error: {
          type: 'FILE_READ_ERROR',
          message: `ファイルの読み込みに失敗しました: ${file.name}`,
          details: reader.error?.message ?? '不明なエラー',
        },
      })
    }

    reader.readAsText(file, 'UTF-8')
  })
}

/**
 * 複数ファイルを読み込み
 */
export async function readFiles(
  files: FileList | File[],
  source: 'file' | 'drop'
): Promise<FileLoadResult[]> {
  const fileArray = Array.from(files)
  const results = await Promise.all(
    fileArray.map(file => readFile(file, source))
  )
  return results
}

// ============================================================================
// URL Loading
// ============================================================================

/**
 * URLからYAMLファイルを読み込み
 */
export async function loadFromUrl(url: string): Promise<FileLoadResult> {
  // ファイル名を取得
  const urlObj = new URL(url, window.location.href)
  const pathParts = urlObj.pathname.split('/')
  const fileName = pathParts[pathParts.length - 1] || 'unknown.yaml'

  // プロトコルチェック
  if (!ALLOWED_PROTOCOLS.includes(urlObj.protocol)) {
    return {
      success: false,
      error: {
        type: 'FETCH_ERROR',
        message: '無効なURLプロトコル',
        details: `許可されているプロトコル: ${ALLOWED_PROTOCOLS.join(', ')}`,
      },
    }
  }

  // 拡張子チェック
  if (!isValidFileName(fileName)) {
    return {
      success: false,
      error: createInvalidFileTypeError(fileName),
    }
  }

  try {
    const response = await fetch(url)

    if (!response.ok) {
      return {
        success: false,
        error: {
          type: 'FETCH_ERROR',
          message: `ファイルの取得に失敗しました: ${url}`,
          details: `HTTPステータス: ${response.status} ${response.statusText}`,
        },
      }
    }

    const content = await response.text()
    return parseYamlContent(content, fileName, 'url')
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      error: {
        type: 'NETWORK_ERROR',
        message: `ネットワークエラー: ${url}`,
        details: errorMessage,
      },
    }
  }
}

/**
 * URLパラメータからYAMLパスを取得
 */
export function getYamlUrlFromParams(): string | null {
  const params = new URLSearchParams(window.location.search)
  return params.get('yaml')
}

/**
 * URLパラメータで指定されたYAMLを読み込み
 */
export async function loadFromUrlParams(): Promise<FileLoadResult | null> {
  const yamlPath = getYamlUrlFromParams()
  if (!yamlPath) {
    return null
  }
  return loadFromUrl(yamlPath)
}

// ============================================================================
// File Selection Dialog
// ============================================================================

/**
 * ファイル選択input要素を作成
 */
export function createFileInput(options: FileSelectOptions): HTMLInputElement {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = ALLOWED_EXTENSIONS.join(',')
  input.multiple = options.multiple ?? false

  input.addEventListener('change', async () => {
    if (!input.files || input.files.length === 0) {
      return
    }

    if (options.multiple) {
      const results = await readFiles(input.files, 'file')
      results.forEach(result => options.onLoad(result))
    } else {
      const result = await readFile(input.files[0], 'file')
      options.onLoad(result)
    }

    // リセットして同じファイルを再選択可能に
    input.value = ''
  })

  return input
}

/**
 * ファイル選択ダイアログを開く
 */
export function openFileDialog(options: FileSelectOptions): void {
  const input = createFileInput(options)
  input.click()
}

// ============================================================================
// Drag & Drop
// ============================================================================

/**
 * ドロップゾーンをセットアップ
 */
export function setupDropZone(options: DropZoneOptions): () => void {
  const { element, onLoad, onDragOver, onDragLeave, multiple = false } = options

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy'
    }
    element.classList.add('drag-over')
    onDragOver?.()
  }

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    element.classList.remove('drag-over')
    onDragLeave?.()
  }

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    element.classList.remove('drag-over')
    onDragLeave?.()

    const files = e.dataTransfer?.files
    if (!files || files.length === 0) {
      return
    }

    if (multiple) {
      const results = await readFiles(files, 'drop')
      results.forEach(result => onLoad(result))
    } else {
      const result = await readFile(files[0], 'drop')
      onLoad(result)
    }
  }

  // イベントリスナーを登録
  element.addEventListener('dragover', handleDragOver)
  element.addEventListener('dragleave', handleDragLeave)
  element.addEventListener('drop', handleDrop)

  // クリーンアップ関数を返す
  return () => {
    element.removeEventListener('dragover', handleDragOver)
    element.removeEventListener('dragleave', handleDragLeave)
    element.removeEventListener('drop', handleDrop)
  }
}

// ============================================================================
// Error Formatting
// ============================================================================

/**
 * エラーをフォーマットして表示用文字列に変換
 */
export function formatFileLoadError(error: FileLoadError): string {
  const lines = [error.message]

  if (error.details) {
    lines.push('')
    lines.push(error.details)
  }

  return lines.join('\n')
}

// ============================================================================
// UI Components
// ============================================================================

/**
 * ファイル読み込みUIを生成
 */
export function renderFileLoaderUI(): string {
  return `
    <div class="file-loader">
      <div class="file-loader-header">
        <h2>YAMLファイルを読み込む</h2>
        <p class="file-loader-description">
          ファイルを選択、ドラッグ&ドロップ、またはURLで指定してください
        </p>
      </div>

      <div class="file-loader-options">
        <div class="file-loader-dropzone" id="yaml-dropzone">
          <div class="dropzone-content">
            <svg class="dropzone-icon" viewBox="0 0 24 24" width="48" height="48">
              <path fill="currentColor" d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
            </svg>
            <p class="dropzone-label">ここにYAMLファイルをドロップ</p>
            <p class="dropzone-hint">または</p>
            <button type="button" class="btn btn-primary" id="yaml-file-select">
              ファイルを選択
            </button>
          </div>
        </div>

        <div class="file-loader-url">
          <label for="yaml-url-input" class="field-label">URL指定</label>
          <div class="url-input-group">
            <input
              type="url"
              id="yaml-url-input"
              class="form-input"
              placeholder="https://example.com/form.yaml"
            />
            <button type="button" class="btn btn-secondary" id="yaml-url-load">
              読み込み
            </button>
          </div>
        </div>
      </div>

      <div class="file-loader-info">
        <p class="file-format-hint">
          対応形式: ${ALLOWED_EXTENSIONS.join(', ')}
        </p>
      </div>
    </div>
  `
}

/**
 * ファイルローダーUIにイベントをアタッチ
 */
export function attachFileLoaderEvents(
  container: HTMLElement,
  onLoad: FileLoadCallback
): () => void {
  const dropzone = container.querySelector<HTMLElement>('#yaml-dropzone')
  const fileSelectBtn = container.querySelector<HTMLButtonElement>('#yaml-file-select')
  const urlInput = container.querySelector<HTMLInputElement>('#yaml-url-input')
  const urlLoadBtn = container.querySelector<HTMLButtonElement>('#yaml-url-load')

  const cleanupFunctions: Array<() => void> = []

  // ドロップゾーンのセットアップ
  if (dropzone) {
    const cleanup = setupDropZone({
      element: dropzone,
      onLoad,
    })
    cleanupFunctions.push(cleanup)
  }

  // ファイル選択ボタン
  if (fileSelectBtn) {
    const handleClick = () => {
      openFileDialog({ onLoad })
    }
    fileSelectBtn.addEventListener('click', handleClick)
    cleanupFunctions.push(() => fileSelectBtn.removeEventListener('click', handleClick))
  }

  // URL読み込みボタン
  if (urlLoadBtn && urlInput) {
    const handleUrlLoad = async () => {
      const url = urlInput.value.trim()
      if (!url) {
        return
      }
      const result = await loadFromUrl(url)
      onLoad(result)
    }
    urlLoadBtn.addEventListener('click', handleUrlLoad)
    cleanupFunctions.push(() => urlLoadBtn.removeEventListener('click', handleUrlLoad))

    // Enterキーでも読み込み
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleUrlLoad()
      }
    }
    urlInput.addEventListener('keypress', handleKeyPress)
    cleanupFunctions.push(() => urlInput.removeEventListener('keypress', handleKeyPress))
  }

  // クリーンアップ関数を返す
  return () => {
    cleanupFunctions.forEach(fn => fn())
  }
}

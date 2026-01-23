/**
 * ImageUploader Component
 * 複数画像のアップロード、並び替え、削除ができるコンポーネント
 */

import { createElement, clearElement, generateId } from '../utils/dom'

// =============================================================================
// Types
// =============================================================================

/**
 * 画像アイテム
 */
export interface ImageItem {
  /** 画像ID */
  id: string
  /** ファイルオブジェクト（新規アップロードの場合） */
  file: File | null
  /** プレビューURL */
  previewUrl: string
  /** ファイル名 */
  name: string
  /** ファイルサイズ（バイト） */
  size: number
  /** メイン画像かどうか */
  isMain: boolean
}

/**
 * 画像アップローダーの設定
 */
export interface ImageUploaderConfig {
  /** コンポーネントID */
  id: string
  /** ラベル */
  label: string
  /** 説明 */
  description?: string
  /** 対応フォーマット */
  acceptedFormats: string[]
  /** 最大ファイルサイズ（バイト） */
  maxFileSize: number
  /** 最大ファイル数 */
  maxFiles: number
  /** 最小ファイル数 */
  minFiles?: number
  /** 必須かどうか */
  required?: boolean
  /** 無効かどうか */
  disabled?: boolean
  /** フォームエラー状態（） */
  error?: boolean
  /** 複数ファイル選択の可否（） */
  multiple?: boolean
  /** ファイルタイプ制限の表示をドロップゾーン内に表示するか */
  showTypeHintInDropzone?: boolean
  /** ドロップゾーンのテキストカスタマイズ */
  decorators?: {
    /** ドロップゾーンのメインテキスト */
    dropzoneText?: string
    /** ドロップゾーンのサブテキスト（ヒント） */
    dropzoneHint?: string
  }
}

/**
 * アップロード状態
 */
export type UploadStatus = 'pending' | 'uploading' | 'completed' | 'error'

/**
 * 画像アップローダーの状態
 */
export interface ImageUploaderState {
  /** 画像リスト */
  images: ImageItem[]
  /** メイン画像のID */
  mainImageId: string | null
  /** ドラッグオーバー中かどうか */
  isDraggingOver: boolean
  /** 並び替え中の画像ID */
  draggingImageId: string | null
  /** アップロード進捗（ID -> パーセンテージ） */
  uploadProgress: Record<string, number>
  /** アップロード状態（ID -> ステータス） */
  uploadStatus: Record<string, UploadStatus>
  /** 拒否されたファイル一覧（UIで表示用） */
  rejectedFiles: RejectedFile[]
}

/**
 * 画像アップローダーのコールバック
 */
export interface ImageUploaderCallbacks {
  /** 画像追加時 */
  onAdd?: (images: ImageItem[], state: ImageUploaderState) => void
  /** 画像削除時 */
  onRemove?: (imageId: string, state: ImageUploaderState) => void
  /** 並び替え時 */
  onReorder?: (images: ImageItem[], state: ImageUploaderState) => void
  /** メイン画像変更時 */
  onMainChange?: (imageId: string, state: ImageUploaderState) => void
  /** 変更時 */
  onChange?: (state: ImageUploaderState) => void
  /** エラー時 */
  onError?: (errors: RejectedFile[]) => void
  /** 進捗更新時 */
  onProgress?: (imageId: string, progress: number) => void
  /** ファイル選択時（のonSelectFilesに対応） */
  onSelectFiles?: (files: File[], state: ImageUploaderState) => void
  /** アップロード完了時 */
  onUploadComplete?: (imageId: string, state: ImageUploaderState) => void
  /** アップロードエラー時 */
  onUploadError?: (imageId: string, error: string, state: ImageUploaderState) => void
}

/**
 * バリデーション結果
 */
export interface ValidationResult {
  /** 有効かどうか */
  valid: boolean
  /** エラーメッセージ */
  errors: string[]
  /** 拒否理由のコード */
  reasonCode?: RejectionReason
}

/**
 * 拒否理由の種類
 */
export type RejectionReason = 'invalid-format' | 'file-too-large' | 'max-files-exceeded'

/**
 * 拒否されたファイル
 */
export interface RejectedFile {
  /** ファイル */
  file: File
  /** 拒否理由 */
  reason: string
  /** 拒否理由のコード */
  reasonCode: RejectionReason
}

/**
 * ファイル追加結果
 */
export interface AddFilesResult {
  /** 追加された画像 */
  added: ImageItem[]
  /** 拒否されたファイル */
  rejected: RejectedFile[]
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * ファイルサイズをフォーマット
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

/**
 * MIMEタイプから表示名を取得
 */
function formatMimeType(mimeType: string): string {
  const formats: Record<string, string> = {
    'image/jpeg': 'JPEG',
    'image/png': 'PNG',
    'image/webp': 'WebP',
    'image/gif': 'GIF',
  }
  return formats[mimeType] ?? mimeType
}

/**
 * ファイルバリデーション
 */
export function validateFile(
  file: File,
  config: ImageUploaderConfig
): ValidationResult {
  const errors: string[] = []
  let reasonCode: RejectionReason | undefined

  // フォーマットチェック
  if (!config.acceptedFormats.includes(file.type)) {
    const formatsDisplay = config.acceptedFormats.map(formatMimeType).join(', ')
    errors.push(`対応していないファイル形式です。${formatsDisplay}のみ対応しています。`)
    reasonCode = 'invalid-format'
  }

  // サイズチェック
  if (file.size > config.maxFileSize) {
    errors.push(`ファイルサイズが上限を超えています。最大${formatFileSize(config.maxFileSize)}まで対応しています。`)
    reasonCode = reasonCode ?? 'file-too-large'
  }

  return {
    valid: errors.length === 0,
    errors,
    reasonCode,
  }
}

/**
 * FileからプレビューURLを生成
 */
function createPreviewUrl(file: File): string {
  return URL.createObjectURL(file)
}

// =============================================================================
// ImageUploader Class
// =============================================================================

/**
 * 画像アップローダーコンポーネント
 */
export class ImageUploader {
  private config: ImageUploaderConfig
  private state: ImageUploaderState
  private callbacks: ImageUploaderCallbacks
  private container: HTMLElement
  private fileInputRef: HTMLInputElement | null = null

  constructor(
    config: ImageUploaderConfig,
    container: HTMLElement,
    callbacks: ImageUploaderCallbacks = {},
    initialImages: ImageItem[] = []
  ) {
    this.config = config
    this.container = container
    this.callbacks = callbacks
    this.state = this.createInitialState(initialImages)
  }

  // ===========================================================================
  // Public Methods
  // ===========================================================================

  /**
   * コンポーネントをレンダリング
   */
  render(): void {
    clearElement(this.container)
    this.container.className = 'image-uploader'
    if (this.config.disabled) {
      this.container.classList.add('disabled')
    }
    if (this.config.error) {
      this.container.classList.add('has-error')
    }

    const wrapper = createElement('div', { className: 'uploader-wrapper' })

    // ヘッダー
    wrapper.appendChild(this.renderHeader())

    // 拒否されたファイル一覧（エラーがある場合）
    if (this.state.rejectedFiles.length > 0) {
      wrapper.appendChild(this.renderRejectedFiles())
    }

    // 画像グリッド（画像がある場合）
    if (this.state.images.length > 0) {
      wrapper.appendChild(this.renderImageGrid())
    }

    // アップロードゾーン
    wrapper.appendChild(this.renderDropzone())

    // ヒント
    wrapper.appendChild(this.renderHints())

    this.container.appendChild(wrapper)
  }

  /**
   * ファイルを追加
   */
  addFiles(files: File[]): AddFilesResult {
    const added: ImageItem[] = []
    const rejected: RejectedFile[] = []

    // onSelectFilesコールバックを呼び出し（）
    this.callbacks.onSelectFiles?.(files, this.state)

    for (const file of files) {
      // 最大数チェック
      if (this.state.images.length + added.length >= this.config.maxFiles) {
        rejected.push({
          file,
          reason: `最大枚数（${this.config.maxFiles}枚）に達しました。`,
          reasonCode: 'max-files-exceeded',
        })
        continue
      }

      // バリデーション
      const validation = validateFile(file, this.config)
      if (!validation.valid) {
        rejected.push({
          file,
          reason: validation.errors.join(' '),
          reasonCode: validation.reasonCode ?? 'invalid-format',
        })
        continue
      }

      // 画像アイテムを作成
      const imageItem: ImageItem = {
        id: generateId('img'),
        file,
        previewUrl: createPreviewUrl(file),
        name: file.name,
        size: file.size,
        isMain: this.state.images.length === 0 && added.length === 0,
      }

      added.push(imageItem)
    }

    // 状態を更新
    const newImages = added.length > 0 ? [...this.state.images, ...added] : this.state.images
    const newMainId = this.state.mainImageId ?? (added.length > 0 ? added[0].id : null)

    this.state = {
      ...this.state,
      images: newImages,
      mainImageId: newMainId,
      rejectedFiles: rejected,
    }

    this.render()

    if (added.length > 0) {
      this.callbacks.onAdd?.(added, this.state)
      this.callbacks.onChange?.(this.state)
    }

    // エラーを通知
    if (rejected.length > 0) {
      this.callbacks.onError?.(rejected)
    }

    return { added, rejected }
  }

  /**
   * 画像を削除
   */
  removeImage(imageId: string): boolean {
    const index = this.state.images.findIndex(img => img.id === imageId)
    if (index === -1) {
      return false
    }

    // 最小数チェック
    if (this.config.minFiles && this.state.images.length <= this.config.minFiles) {
      return false
    }

    const removedImage = this.state.images[index]

    // プレビューURLを解放（File由来の場合）
    if (removedImage.file) {
      URL.revokeObjectURL(removedImage.previewUrl)
    }

    const newImages = this.state.images.filter(img => img.id !== imageId)

    // メイン画像が削除された場合は次の画像をメインに
    let newMainId = this.state.mainImageId
    if (this.state.mainImageId === imageId) {
      newMainId = newImages.length > 0 ? newImages[0].id : null
      if (newMainId) {
        newImages[0] = { ...newImages[0], isMain: true }
      }
    }

    // 進捗を削除
    const { [imageId]: _, ...remainingProgress } = this.state.uploadProgress

    this.state = {
      ...this.state,
      images: newImages,
      mainImageId: newMainId,
      uploadProgress: remainingProgress,
    }

    this.render()
    this.callbacks.onRemove?.(imageId, this.state)
    this.callbacks.onChange?.(this.state)

    return true
  }

  /**
   * 画像を移動
   */
  moveImage(imageId: string, direction: 'up' | 'down'): boolean {
    const index = this.state.images.findIndex(img => img.id === imageId)
    if (index === -1) {
      return false
    }

    if (direction === 'up' && index === 0) {
      return false
    }
    if (direction === 'down' && index === this.state.images.length - 1) {
      return false
    }

    const newImages = [...this.state.images]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const temp = newImages[index]
    newImages[index] = newImages[targetIndex]
    newImages[targetIndex] = temp

    this.state = {
      ...this.state,
      images: newImages,
    }

    this.render()
    this.callbacks.onReorder?.(newImages, this.state)
    this.callbacks.onChange?.(this.state)

    return true
  }

  /**
   * 画像の順序を変更
   */
  reorderImages(imageIds: string[]): void {
    const imageMap = new Map(this.state.images.map(img => [img.id, img]))
    const newImages = imageIds
      .filter(id => imageMap.has(id))
      .map(id => imageMap.get(id)!)

    this.state = {
      ...this.state,
      images: newImages,
    }

    this.render()
    this.callbacks.onReorder?.(newImages, this.state)
    this.callbacks.onChange?.(this.state)
  }

  /**
   * メイン画像を設定
   */
  setMainImage(imageId: string): boolean {
    const index = this.state.images.findIndex(img => img.id === imageId)
    if (index === -1) {
      return false
    }

    const newImages = this.state.images.map(img => ({
      ...img,
      isMain: img.id === imageId,
    }))

    this.state = {
      ...this.state,
      images: newImages,
      mainImageId: imageId,
    }

    this.render()
    this.callbacks.onMainChange?.(imageId, this.state)
    this.callbacks.onChange?.(this.state)

    return true
  }

  /**
   * アップロード進捗を設定
   */
  setUploadProgress(imageId: string, progress: number): void {
    const boundedProgress = Math.min(100, Math.max(0, progress))

    if (boundedProgress >= 100) {
      const { [imageId]: _, ...remainingProgress } = this.state.uploadProgress
      const { [imageId]: __, ...remainingStatus } = this.state.uploadStatus
      this.state = {
        ...this.state,
        uploadProgress: remainingProgress,
        uploadStatus: {
          ...remainingStatus,
          [imageId]: 'completed',
        },
      }
      this.callbacks.onUploadComplete?.(imageId, this.state)
    } else {
      this.state = {
        ...this.state,
        uploadProgress: {
          ...this.state.uploadProgress,
          [imageId]: boundedProgress,
        },
        uploadStatus: {
          ...this.state.uploadStatus,
          [imageId]: 'uploading',
        },
      }
    }

    this.callbacks.onProgress?.(imageId, boundedProgress)
    this.render()
  }

  /**
   * アップロード状態を設定
   */
  setUploadStatus(imageId: string, status: UploadStatus, errorMessage?: string): void {
    this.state = {
      ...this.state,
      uploadStatus: {
        ...this.state.uploadStatus,
        [imageId]: status,
      },
    }

    if (status === 'error' && errorMessage) {
      this.callbacks.onUploadError?.(imageId, errorMessage, this.state)
    }

    this.render()
  }

  /**
   * 一括アップロード開始（複数ファイルのアップロードを開始する際に使用）
   */
  startBatchUpload(imageIds: string[]): void {
    const newStatus: Record<string, UploadStatus> = {}
    const newProgress: Record<string, number> = {}

    for (const id of imageIds) {
      newStatus[id] = 'uploading'
      newProgress[id] = 0
    }

    this.state = {
      ...this.state,
      uploadStatus: {
        ...this.state.uploadStatus,
        ...newStatus,
      },
      uploadProgress: {
        ...this.state.uploadProgress,
        ...newProgress,
      },
    }

    this.render()
  }

  /**
   * アップロードがアクティブかどうかを取得
   */
  hasActiveUploads(): boolean {
    return Object.values(this.state.uploadStatus).some(status => status === 'uploading')
  }

  /**
   * 全画像をクリア
   */
  clear(): void {
    // プレビューURLを解放
    for (const img of this.state.images) {
      if (img.file) {
        URL.revokeObjectURL(img.previewUrl)
      }
    }

    this.state = {
      images: [],
      mainImageId: null,
      isDraggingOver: false,
      draggingImageId: null,
      uploadProgress: {},
      uploadStatus: {},
      rejectedFiles: [],
    }

    this.render()
    this.callbacks.onChange?.(this.state)
  }

  /**
   * コンポーネントを破棄（リソースを解放）
   */
  destroy(): void {
    // プレビューURLを解放
    for (const img of this.state.images) {
      if (img.file) {
        URL.revokeObjectURL(img.previewUrl)
      }
    }

    // 状態をリセット
    this.state = {
      images: [],
      mainImageId: null,
      isDraggingOver: false,
      draggingImageId: null,
      uploadProgress: {},
      uploadStatus: {},
      rejectedFiles: [],
    }

    // DOMをクリア
    clearElement(this.container)
    this.fileInputRef = null
  }

  /**
   * 現在の状態を取得
   */
  getState(): ImageUploaderState {
    return {
      ...this.state,
      images: this.state.images.map(img => ({ ...img })),
      uploadProgress: { ...this.state.uploadProgress },
      uploadStatus: { ...this.state.uploadStatus },
      rejectedFiles: this.state.rejectedFiles.map(rf => ({ ...rf })),
    }
  }

  /**
   * 値を取得（フォーム送信用）
   */
  getValue(): ImageItem[] {
    return this.state.images.map(img => ({ ...img }))
  }

  /**
   * メイン画像IDを取得
   */
  getMainImageId(): string | null {
    return this.state.mainImageId
  }

  /**
   * ファイル選択ダイアログを開く
   */
  openFileDialog(): void {
    if (this.fileInputRef && !this.config.disabled) {
      this.fileInputRef.click()
    }
  }

  // ===========================================================================
  // Private Methods - State
  // ===========================================================================

  /**
   * 初期状態を作成
   */
  private createInitialState(initialImages: ImageItem[]): ImageUploaderState {
    // メイン画像を決定
    let mainImageId: string | null = null
    const images = initialImages.map((img) => {
      if (img.isMain) {
        mainImageId = img.id
      }
      return { ...img }
    })

    // メイン画像が指定されていない場合、最初の画像をメインに
    if (!mainImageId && images.length > 0) {
      mainImageId = images[0].id
      images[0] = { ...images[0], isMain: true }
    }

    return {
      images,
      mainImageId,
      isDraggingOver: false,
      draggingImageId: null,
      uploadProgress: {},
      uploadStatus: {},
      rejectedFiles: [],
    }
  }

  // ===========================================================================
  // Private Methods - Rendering
  // ===========================================================================

  /**
   * ヘッダーをレンダリング
   */
  private renderHeader(): HTMLElement {
    const header = createElement('div', { className: 'uploader-header' })

    // ラベル
    const label = createElement('label', {
      className: 'uploader-label',
      textContent: this.config.label,
    })
    if (this.config.required) {
      const required = createElement('span', {
        className: 'required-marker',
        textContent: '*',
      })
      label.appendChild(required)
    }
    header.appendChild(label)

    // 説明
    if (this.config.description) {
      const description = createElement('p', {
        className: 'uploader-description',
        textContent: this.config.description,
      })
      header.appendChild(description)
    }

    // カウンター
    const counter = createElement('span', {
      className: 'uploader-counter',
      textContent: `${this.state.images.length} / ${this.config.maxFiles}`,
    })
    header.appendChild(counter)

    return header
  }

  /**
   * 画像グリッドをレンダリング
   */
  private renderImageGrid(): HTMLElement {
    const grid = createElement('div', { className: 'image-grid' })

    for (const image of this.state.images) {
      grid.appendChild(this.renderImageItem(image))
    }

    return grid
  }

  /**
   * 画像アイテムをレンダリング
   */
  private renderImageItem(image: ImageItem): HTMLElement {
    const uploadStatus = this.state.uploadStatus[image.id]
    const isUploading = uploadStatus === 'uploading'
    const hasError = uploadStatus === 'error'

    const item = createElement('div', {
      className: `image-item ${image.isMain ? 'is-main' : ''} ${isUploading ? 'is-uploading' : ''} ${hasError ? 'has-error' : ''}`,
      attributes: { 'data-image-id': image.id },
    })

    // プレビュー
    const preview = createElement('div', { className: 'image-preview' })
    const img = createElement('img', {
      attributes: {
        src: image.previewUrl,
        alt: image.name,
        draggable: 'false',
      },
    })
    preview.appendChild(img)

    // メインバッジ
    if (image.isMain) {
      const mainBadge = createElement('span', {
        className: 'main-badge',
        textContent: 'メイン',
      })
      preview.appendChild(mainBadge)
    }

    // アップロード進捗
    const progress = this.state.uploadProgress[image.id]
    if (progress !== undefined || isUploading) {
      const progressOverlay = createElement('div', { className: 'upload-progress-overlay' })

      // プログレスバー
      const progressBar = createElement('div', { className: 'upload-progress' })
      const progressFill = createElement('div', { className: 'upload-progress-fill' })
      const boundedProgress = Math.min(100, Math.max(0, progress ?? 0))
      progressFill.style.width = `${boundedProgress}%`
      progressBar.appendChild(progressFill)
      progressOverlay.appendChild(progressBar)

      // プログレステキスト
      const progressText = createElement('span', {
        className: 'upload-progress-text',
        textContent: `${Math.round(boundedProgress)}%`,
      })
      progressOverlay.appendChild(progressText)

      preview.appendChild(progressOverlay)
    }

    // エラーアイコン
    if (hasError) {
      const errorBadge = createElement('span', {
        className: 'error-badge',
        attributes: { title: 'アップロードエラー' },
      })
      errorBadge.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>'
      preview.appendChild(errorBadge)
    }

    item.appendChild(preview)

    // 画像情報
    const info = createElement('div', { className: 'image-info' })
    const name = createElement('span', {
      className: 'image-name',
      textContent: image.name,
      attributes: { title: image.name },
    })
    info.appendChild(name)

    const size = createElement('span', {
      className: 'image-size',
      textContent: formatFileSize(image.size),
    })
    info.appendChild(size)
    item.appendChild(info)

    // アクション
    if (!this.config.disabled) {
      const actions = createElement('div', { className: 'image-actions' })

      // メイン設定ボタン
      if (!image.isMain) {
        const setMainBtn = createElement('button', {
          className: 'image-action-btn set-main-btn',
          attributes: { type: 'button', title: 'メイン画像に設定' },
        })
        setMainBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>'
        setMainBtn.addEventListener('click', () => this.setMainImage(image.id))
        actions.appendChild(setMainBtn)
      }

      // 上に移動
      const index = this.state.images.findIndex(img => img.id === image.id)
      if (index > 0) {
        const moveUpBtn = createElement('button', {
          className: 'image-action-btn move-up-btn',
          attributes: { type: 'button', title: '上に移動' },
        })
        moveUpBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M7 14l5-5 5 5z"/></svg>'
        moveUpBtn.addEventListener('click', () => this.moveImage(image.id, 'up'))
        actions.appendChild(moveUpBtn)
      }

      // 下に移動
      if (index < this.state.images.length - 1) {
        const moveDownBtn = createElement('button', {
          className: 'image-action-btn move-down-btn',
          attributes: { type: 'button', title: '下に移動' },
        })
        moveDownBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M7 10l5 5 5-5z"/></svg>'
        moveDownBtn.addEventListener('click', () => this.moveImage(image.id, 'down'))
        actions.appendChild(moveDownBtn)
      }

      // 削除
      const canRemove = !this.config.minFiles || this.state.images.length > this.config.minFiles
      if (canRemove) {
        const removeBtn = createElement('button', {
          className: 'image-action-btn remove-btn',
          attributes: { type: 'button', title: '削除' },
        })
        removeBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>'
        removeBtn.addEventListener('click', () => this.removeImage(image.id))
        actions.appendChild(removeBtn)
      }

      item.appendChild(actions)
    }

    return item
  }

  /**
   * ドロップゾーンをレンダリング
   */
  private renderDropzone(): HTMLElement {
    const dropzone = createElement('div', {
      className: `upload-dropzone ${this.state.isDraggingOver ? 'dragging-over' : ''}`,
    })

    // 最大数に達している場合は無効化
    const isMaxReached = this.state.images.length >= this.config.maxFiles
    if (isMaxReached || this.config.disabled) {
      dropzone.classList.add('disabled')
    }

    // エラー状態（）
    if (this.config.error) {
      dropzone.classList.add('has-error')
    }

    // 複数選択の可否（デフォルトはtrue）
    const allowMultiple = this.config.multiple !== false

    // ファイル入力
    const fileInput = createElement('input', {
      className: 'file-input',
      attributes: {
        type: 'file',
        id: `${this.config.id}-input`,
        accept: this.config.acceptedFormats.join(','),
        ...(allowMultiple ? { multiple: 'true' } : {}),
      },
    })
    if (isMaxReached || this.config.disabled) {
      fileInput.disabled = true
    }
    fileInput.addEventListener('change', (e) => this.handleFileSelect(e))
    this.fileInputRef = fileInput
    dropzone.appendChild(fileInput)

    // ドロップゾーンラベル
    const label = createElement('label', {
      className: 'dropzone-label',
      attributes: { for: `${this.config.id}-input` },
    })

    // ドロップゾーンコンテンツ
    const content = createElement('div', { className: 'dropzone-content' })

    const icon = createElement('div', { className: 'dropzone-icon' })
    icon.innerHTML = '<svg viewBox="0 0 24 24" width="48" height="48"><path fill="currentColor" d="M19.35 10.04A7.49 7.49 0 0012 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 000 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/></svg>'
    content.appendChild(icon)

    // テキストエリア
    const textArea = createElement('div', { className: 'dropzone-text' })

    // メインテキスト
    let mainText = this.config.decorators?.dropzoneText
    if (!mainText) {
      mainText = isMaxReached
        ? '最大枚数に達しました'
        : 'クリックまたはドラッグ&ドロップで画像を追加'
    }
    const mainLabel = createElement('p', {
      className: 'dropzone-label-text',
      textContent: mainText,
    })
    textArea.appendChild(mainLabel)

    // サブテキスト（ヒント）
    if (this.config.decorators?.dropzoneHint && !isMaxReached) {
      const hintText = createElement('p', {
        className: 'dropzone-hint',
        textContent: this.config.decorators.dropzoneHint,
      })
      textArea.appendChild(hintText)
    }

    // ドロップゾーン内にファイルタイプ制限を表示（オプション）
    if (this.config.showTypeHintInDropzone && !isMaxReached) {
      const typeHint = createElement('p', {
        className: 'dropzone-type-hint',
        textContent: `${this.config.acceptedFormats.map(formatMimeType).join(', ')} / 最大${formatFileSize(this.config.maxFileSize)}`,
      })
      textArea.appendChild(typeHint)
    }

    content.appendChild(textArea)
    label.appendChild(content)
    dropzone.appendChild(label)

    // ドラッグ&ドロップイベント
    if (!isMaxReached && !this.config.disabled) {
      dropzone.addEventListener('dragover', (e) => this.handleDragOver(e))
      dropzone.addEventListener('dragleave', (e) => this.handleDragLeave(e))
      dropzone.addEventListener('drop', (e) => this.handleDrop(e))
    }

    return dropzone
  }

  /**
   * ヒントをレンダリング
   */
  private renderHints(): HTMLElement {
    const hints = createElement('div', { className: 'uploader-hints' })

    // 対応フォーマット
    const formatsHint = createElement('span', {
      className: 'hint-formats hint-item',
    })
    const formatIcon = createElement('span', { className: 'hint-icon' })
    formatIcon.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13z"/></svg>'
    const formatText = createElement('span', {
      textContent: `対応形式: ${this.config.acceptedFormats.map(formatMimeType).join(', ')}`,
    })
    formatsHint.appendChild(formatIcon)
    formatsHint.appendChild(formatText)
    hints.appendChild(formatsHint)

    // 最大サイズ
    const sizeHint = createElement('span', {
      className: 'hint-size hint-item',
    })
    const sizeIcon = createElement('span', { className: 'hint-icon' })
    sizeIcon.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg>'
    const sizeText = createElement('span', {
      textContent: `最大サイズ: ${formatFileSize(this.config.maxFileSize)}/枚`,
    })
    sizeHint.appendChild(sizeIcon)
    sizeHint.appendChild(sizeText)
    hints.appendChild(sizeHint)

    // 最大枚数
    const countHint = createElement('span', {
      className: 'hint-count hint-item',
    })
    const countIcon = createElement('span', { className: 'hint-icon' })
    countIcon.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>'
    const countText = createElement('span', {
      textContent: `最大枚数: ${this.config.maxFiles}枚`,
    })
    countHint.appendChild(countIcon)
    countHint.appendChild(countText)
    hints.appendChild(countHint)

    return hints
  }

  /**
   * 拒否されたファイル一覧をレンダリング
   */
  private renderRejectedFiles(): HTMLElement {
    const container = createElement('div', { className: 'rejected-files' })

    // タイトル
    const title = createElement('div', { className: 'rejected-title' })
    const icon = createElement('span', { className: 'rejected-icon' })
    icon.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>'
    const titleText = createElement('span', {
      textContent: '以下のファイルは追加できませんでした',
    })
    title.appendChild(icon)
    title.appendChild(titleText)
    container.appendChild(title)

    // 閉じるボタン
    const closeBtn = createElement('button', {
      className: 'rejected-close-btn',
      attributes: { type: 'button', 'aria-label': '閉じる' },
    })
    closeBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>'
    closeBtn.addEventListener('click', () => this.clearRejectedFiles())
    title.appendChild(closeBtn)

    // ファイル一覧
    const list = createElement('ul', { className: 'rejected-list' })
    for (const rejected of this.state.rejectedFiles) {
      const item = createElement('li', { className: 'rejected-item' })

      const fileName = createElement('span', {
        className: 'rejected-filename',
        textContent: rejected.file.name,
      })
      item.appendChild(fileName)

      const reason = createElement('span', {
        className: 'rejected-reason',
        textContent: ` - ${rejected.reason}`,
      })
      item.appendChild(reason)

      list.appendChild(item)
    }
    container.appendChild(list)

    return container
  }

  /**
   * 拒否されたファイル一覧をクリア
   */
  clearRejectedFiles(): void {
    this.state = {
      ...this.state,
      rejectedFiles: [],
    }
    this.render()
  }

  // ===========================================================================
  // Private Methods - Event Handlers
  // ===========================================================================

  /**
   * ファイル選択ハンドラ
   */
  private handleFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement
    const files = input.files
    if (files && files.length > 0) {
      this.addFiles(Array.from(files))
    }
    // リセットして同じファイルを再選択可能に
    input.value = ''
  }

  /**
   * ドラッグオーバーハンドラ
   */
  private handleDragOver(event: DragEvent): void {
    event.preventDefault()
    event.stopPropagation()
    if (!this.state.isDraggingOver) {
      this.state = { ...this.state, isDraggingOver: true }
      this.render()
    }
  }

  /**
   * ドラッグリーブハンドラ
   */
  private handleDragLeave(event: DragEvent): void {
    event.preventDefault()
    event.stopPropagation()
    if (this.state.isDraggingOver) {
      this.state = { ...this.state, isDraggingOver: false }
      this.render()
    }
  }

  /**
   * ドロップハンドラ
   */
  private handleDrop(event: DragEvent): void {
    event.preventDefault()
    event.stopPropagation()

    this.state = { ...this.state, isDraggingOver: false }

    const files = event.dataTransfer?.files
    if (files && files.length > 0) {
      this.addFiles(Array.from(files))
    } else {
      this.render()
    }
  }
}

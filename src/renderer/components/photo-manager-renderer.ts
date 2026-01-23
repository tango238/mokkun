/**
 * Photo Manager Renderer
 * 写真管理画面のHTML生成（静的レンダリング用）
 */

import type { PhotoManagerField } from '../../types/schema'

/**
 * ユニークIDを生成
 */
function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * HTMLエスケープ
 */
function escapeHtml(str: string): string {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

/**
 * 写真管理フィールドをHTML文字列としてレンダリング
 */
export function renderPhotoManagerField(field: PhotoManagerField): string {
  const managerId = generateId('photo-manager')
  const photos = field.photos ?? []
  const maxPhotos = field.max_photos ?? 20
  const maxFileSize = field.max_file_size ?? 10
  const acceptedFormats = field.accepted_formats ?? ['JPG', 'PNG']
  const columns = field.columns ?? 4

  // アップロードエリアHTML
  const uploadAreaHtml = `
    <div class="photo-upload-area" data-manager-id="${managerId}">
      <div class="upload-icon">📷</div>
      <div class="upload-text">ここにファイルをドラッグ＆ドロップ<br>または</div>
      <button type="button" class="btn btn-primary photo-select-btn">ファイルを選択</button>
      <input type="file" class="photo-file-input" accept="${acceptedFormats.map(f => `.${f.toLowerCase()}`).join(',')}" multiple hidden />
      <div class="upload-note">対応形式: ${acceptedFormats.join(', ')} / 最大${maxFileSize}MB/枚 / 最大${maxPhotos}枚まで</div>
    </div>
  `

  // 写真カウンターHTML
  const counterHtml = `
    <div class="photo-count">
      登録済み写真: <strong>${photos.length}枚</strong> / 上限${maxPhotos}枚
    </div>
  `

  // ドラッグヒントHTML
  const dragHintHtml = photos.length > 0 ? `
    <div class="photo-drag-hint">
      💡 写真をドラッグ＆ドロップして表示順序を変更できます
    </div>
  ` : ''

  // 写真グリッドHTML
  const photosHtml = photos.length > 0 ? `
    <div class="photo-grid" style="--photo-columns: ${columns}" data-manager-id="${managerId}">
      ${photos.map((photo, index) => {
        const isMain = photo.is_main ?? (index === 0)
        return `
          <div class="photo-item" data-photo-id="${escapeHtml(photo.id)}" data-index="${index}" draggable="true">
            <img src="${escapeHtml(photo.src)}" alt="${escapeHtml(photo.alt ?? `写真${index + 1}`)}" loading="lazy" />
            ${isMain ? '<span class="photo-main-badge">メイン</span>' : ''}
            <span class="photo-order-badge">${index + 1}</span>
            <div class="photo-overlay">
              <button type="button" class="btn btn-primary btn-sm photo-set-main-btn" ${isMain ? 'disabled' : ''}>メインに設定</button>
              <button type="button" class="btn btn-danger btn-sm photo-delete-btn">削除</button>
            </div>
          </div>
        `
      }).join('')}
    </div>
  ` : `
    <div class="photo-empty">
      <p>写真が登録されていません</p>
    </div>
  `

  return `
    <div class="field-wrapper field-type-photo_manager">
      ${field.label ? `<label class="field-label">${escapeHtml(field.label)}</label>` : ''}
      ${field.description ? `<p class="field-description">${escapeHtml(field.description)}</p>` : ''}
      <div
        class="photo-manager"
        id="${managerId}"
        data-config='${JSON.stringify({ maxPhotos, maxFileSize, acceptedFormats, columns })}'
        role="region"
        aria-label="${field.label ?? '写真管理'}"
      >
        ${uploadAreaHtml}
        ${counterHtml}
        ${dragHintHtml}
        ${photosHtml}
      </div>
    </div>
  `
}

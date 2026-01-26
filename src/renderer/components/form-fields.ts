/**
 * Form Field Renderers
 * 各フォームフィールドタイプのHTML生成
 */

import type {
  InputField,
  TextField,
  NumberField,
  TextareaField,
  SelectField,
  MultiSelectField,
  ComboboxField,
  RadioGroupField,
  CheckboxGroupField,
  DatePickerField,
  TimePickerField,
  DurationPickerField,
  DurationInputField,
  FileUploadField,
  DataTableField,
  GoogleMapEmbedField,
  PhotoManagerField,
  ImageUploaderField,
  HeadingField,
  SelectOption,
} from '../../types/schema'
import { renderDataTableField } from './data-table'
import { renderPhotoManagerField } from './photo-manager-renderer'

/**
 * フィールドのラッパーHTML生成
 */
function createFieldWrapper(
  field: InputField,
  content: string
): string {
  const requiredMark = field.required ? '<span class="required-mark">*</span>' : ''
  const description = field.description
    ? `<p class="field-description">${escapeHtml(field.description)}</p>`
    : ''
  const classes = ['form-field', `field-type-${field.type}`]
  if (field.class) {
    classes.push(field.class)
  }

  return `
    <div class="${classes.join(' ')}" data-field-id="${escapeHtml(field.id)}">
      <label class="field-label" for="${escapeHtml(field.id)}">
        ${escapeHtml(field.label)}${requiredMark}
      </label>
      ${content}
      ${description}
    </div>
  `
}

/**
 * HTML特殊文字をエスケープ
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * 共通属性を生成
 */
function getCommonAttributes(field: InputField): string {
  const attrs: string[] = [
    `id="${escapeHtml(field.id)}"`,
    `name="${escapeHtml(field.id)}"`,
  ]

  if (field.required) {
    attrs.push('required')
  }
  if (field.disabled) {
    attrs.push('disabled')
  }
  if (field.readonly) {
    attrs.push('readonly')
  }
  if ('placeholder' in field && field.placeholder) {
    attrs.push(`placeholder="${escapeHtml(field.placeholder)}"`)
  }

  return attrs.join(' ')
}

/**
 * 選択肢の配列を取得（文字列参照は未対応）
 */
function getOptions(options: SelectOption[] | string): SelectOption[] {
  if (typeof options === 'string') {
    // 共通コンポーネント参照は未対応（Phase 3以降で対応予定）
    return []
  }
  return options
}

// =============================================================================
// Individual Field Renderers
// =============================================================================

/**
 * text → <input type="text">
 */
export function renderTextField(field: TextField): string {
  const inputType = field.input_type ?? 'text'
  const attrs: string[] = [getCommonAttributes(field)]

  if (field.min_length !== undefined) {
    attrs.push(`minlength="${field.min_length}"`)
  }
  if (field.max_length !== undefined) {
    attrs.push(`maxlength="${field.max_length}"`)
  }
  if (field.pattern) {
    attrs.push(`pattern="${escapeHtml(field.pattern)}"`)
  }
  if (field.default !== undefined) {
    attrs.push(`value="${escapeHtml(String(field.default))}"`)
  }

  const input = `<input type="${inputType}" class="form-input" ${attrs.join(' ')} />`
  return createFieldWrapper(field, input)
}

/**
 * number → <input type="number">
 */
export function renderNumberField(field: NumberField): string {
  const attrs: string[] = [getCommonAttributes(field)]

  if (field.min !== undefined) {
    attrs.push(`min="${field.min}"`)
  }
  if (field.max !== undefined) {
    attrs.push(`max="${field.max}"`)
  }
  if (field.step !== undefined) {
    attrs.push(`step="${field.step}"`)
  }
  if (field.default !== undefined) {
    attrs.push(`value="${field.default}"`)
  }

  let input = `<input type="number" class="form-input" ${attrs.join(' ')} />`

  if (field.unit) {
    input = `
      <div class="input-with-unit">
        ${input}
        <span class="input-unit">${escapeHtml(field.unit)}</span>
      </div>
    `
  }

  return createFieldWrapper(field, input)
}

/**
 * textarea → <textarea>
 */
export function renderTextareaField(field: TextareaField): string {
  const attrs: string[] = [getCommonAttributes(field)]

  if (field.rows) {
    attrs.push(`rows="${field.rows}"`)
  }
  if (field.min_length !== undefined) {
    attrs.push(`minlength="${field.min_length}"`)
  }
  if (field.max_length !== undefined) {
    attrs.push(`maxlength="${field.max_length}"`)
  }

  const resizeClass = field.resizable === false ? 'no-resize' : ''
  const defaultValue = field.default !== undefined ? escapeHtml(String(field.default)) : ''

  const textarea = `<textarea class="form-textarea ${resizeClass}" ${attrs.join(' ')}>${defaultValue}</textarea>`
  return createFieldWrapper(field, textarea)
}

/**
 * select → <select>
 */
export function renderSelectField(field: SelectField): string {
  const attrs: string[] = [getCommonAttributes(field)]

  // サイズクラスの追加
  const sizeClass = field.size ? `select-${field.size}` : 'select-default'

  const options = getOptions(field.options)

  // グループ化されたオプションとそうでないオプションを分離
  const grouped = new Map<string, SelectOption[]>()
  const ungrouped: SelectOption[] = []

  for (const opt of options) {
    if (opt.group) {
      if (!grouped.has(opt.group)) {
        grouped.set(opt.group, [])
      }
      grouped.get(opt.group)!.push(opt)
    } else {
      ungrouped.push(opt)
    }
  }

  // オプションHTMLの生成
  const renderOption = (opt: SelectOption) => {
    const selected = field.default === opt.value ? 'selected' : ''
    const disabled = opt.disabled ? 'disabled' : ''
    return `<option value="${escapeHtml(String(opt.value))}" ${selected} ${disabled}>${escapeHtml(opt.label)}</option>`
  }

  // 未グループ化のオプション
  const ungroupedHtml = ungrouped.map(renderOption).join('')

  // グループ化されたオプション（optgroup）
  const groupedHtml = Array.from(grouped.entries()).map(([label, opts]) => {
    const optionsHtml = opts.map(renderOption).join('')
    return `<optgroup label="${escapeHtml(label)}">${optionsHtml}</optgroup>`
  }).join('')

  // プレースホルダーまたは空オプション
  const hasBlank = !field.required || field.clearable
  const blankOption = hasBlank
    ? `<option value="">${escapeHtml(field.placeholder ?? 'Select...')}</option>`
    : ''

  const select = `
    <select class="field-select ${sizeClass}" ${attrs.join(' ')}>
      ${blankOption}
      ${ungroupedHtml}
      ${groupedHtml}
    </select>
  `
  return createFieldWrapper(field, select)
}

/**
 * multi_select → <select multiple>
 */
export function renderMultiSelectField(field: MultiSelectField): string {
  const attrs: string[] = [getCommonAttributes(field), 'multiple']
  const options = getOptions(field.options)
  const defaultValues = Array.isArray(field.default) ? field.default : []

  const optionHtml = options.map(opt => {
    const selected = defaultValues.includes(opt.value) ? 'selected' : ''
    const disabled = opt.disabled ? 'disabled' : ''
    return `<option value="${escapeHtml(String(opt.value))}" ${selected} ${disabled}>${escapeHtml(opt.label)}</option>`
  }).join('')

  const select = `
    <select class="form-select form-multiselect" ${attrs.join(' ')}>
      ${optionHtml}
    </select>
  `
  return createFieldWrapper(field, select)
}

/**
 * combobox → Combobox component container
 */
export function renderComboboxField(field: ComboboxField): string {
  const mode = field.mode ?? 'single'
  const clearable = field.clearable !== false
  const minSearch = field.min_search_length ?? 0
  const debounce = field.debounce_ms ?? 300
  const maxSelections = field.max_selections ?? null
  const noOptionsMsg = field.no_options_message ?? 'No options found'
  const loadingMsg = field.loading_message ?? 'Loading...'

  const content = `
    <div class="combobox-container"
         data-field-id="${escapeHtml(field.id)}"
         data-mode="${mode}"
         data-options="${escapeHtml(JSON.stringify(getOptions(field.options ?? [])))}"
         data-clearable="${clearable}"
         data-min-search="${minSearch}"
         data-debounce="${debounce}"
         data-max-selections="${maxSelections ?? ''}"
         data-no-options-message="${escapeHtml(noOptionsMsg)}"
         data-loading-message="${escapeHtml(loadingMsg)}"
         data-async-loader="${field.async_loader ?? ''}">
      <!-- Combobox will be initialized by JavaScript -->
    </div>
  `
  return createFieldWrapper(field, content)
}

/**
 * radio_group → <input type="radio"> × N
 */
export function renderRadioGroupField(field: RadioGroupField): string {
  const options = getOptions(field.options)
  const direction = field.direction ?? 'vertical'

  const optionHtml = options.map(opt => {
    const checked = field.default === opt.value ? 'checked' : ''
    const disabled = opt.disabled || field.disabled ? 'disabled' : ''
    const optionId = `${field.id}-${opt.value}`

    return `
      <label class="radio-option" for="${escapeHtml(optionId)}">
        <input
          type="radio"
          id="${escapeHtml(optionId)}"
          name="${escapeHtml(field.id)}"
          value="${escapeHtml(String(opt.value))}"
          ${checked}
          ${disabled}
          ${field.required ? 'required' : ''}
        />
        <span class="radio-label">${escapeHtml(opt.label)}</span>
      </label>
    `
  }).join('')

  const content = `<div class="radio-group direction-${direction}">${optionHtml}</div>`
  return createFieldWrapper(field, content)
}

/**
 * checkbox_group → <input type="checkbox"> × N
 */
export function renderCheckboxGroupField(field: CheckboxGroupField): string {
  const options = getOptions(field.options)
  const direction = field.direction ?? 'vertical'
  const defaultValues = Array.isArray(field.default) ? field.default : []

  const optionHtml = options.map(opt => {
    const checked = defaultValues.includes(opt.value) ? 'checked' : ''
    const disabled = opt.disabled || field.disabled ? 'disabled' : ''
    const optionId = `${field.id}-${opt.value}`

    return `
      <label class="checkbox-option" for="${escapeHtml(optionId)}">
        <input
          type="checkbox"
          id="${escapeHtml(optionId)}"
          name="${escapeHtml(field.id)}"
          value="${escapeHtml(String(opt.value))}"
          ${checked}
          ${disabled}
        />
        <span class="checkbox-label">${escapeHtml(opt.label)}</span>
      </label>
    `
  }).join('')

  const content = `<div class="checkbox-group direction-${direction}">${optionHtml}</div>`
  return createFieldWrapper(field, content)
}

/**
 * date_picker → <input type="date">
 */
export function renderDatePickerField(field: DatePickerField): string {
  const inputType = field.include_time ? 'datetime-local' : 'date'
  const attrs: string[] = [getCommonAttributes(field)]

  if (field.min_date) {
    attrs.push(`min="${escapeHtml(field.min_date)}"`)
  }
  if (field.max_date) {
    attrs.push(`max="${escapeHtml(field.max_date)}"`)
  }
  if (field.default !== undefined) {
    attrs.push(`value="${escapeHtml(String(field.default))}"`)
  }

  const input = `<input type="${inputType}" class="form-input" ${attrs.join(' ')} />`
  return createFieldWrapper(field, input)
}

/**
 * time_picker → <input type="time">
 */
export function renderTimePickerField(field: TimePickerField): string {
  const attrs: string[] = [getCommonAttributes(field)]

  if (field.minute_step) {
    attrs.push(`step="${field.minute_step * 60}"`)
  }
  if (field.default !== undefined) {
    attrs.push(`value="${escapeHtml(String(field.default))}"`)
  }

  const input = `<input type="time" class="form-input" ${attrs.join(' ')} />`
  return createFieldWrapper(field, input)
}

/**
 * file_upload → <input type="file">
 */
export function renderFileUploadField(field: FileUploadField): string {
  const attrs: string[] = [getCommonAttributes(field)]

  if (field.accept && field.accept.length > 0) {
    attrs.push(`accept="${field.accept.join(',')}"`)
  }
  if (field.multiple) {
    attrs.push('multiple')
  }

  const dropzoneClass = field.drag_drop ? 'with-dropzone' : ''

  let content = `<input type="file" class="form-file" ${attrs.join(' ')} />`

  if (field.drag_drop) {
    content = `
      <div class="file-dropzone ${dropzoneClass}">
        ${content}
        <div class="dropzone-label">
          ファイルをドラッグ&ドロップ または クリックして選択
        </div>
      </div>
    `
  }

  if (field.max_size) {
    const maxSizeMB = (field.max_size / (1024 * 1024)).toFixed(1)
    content += `<p class="file-size-hint">最大ファイルサイズ: ${maxSizeMB} MB</p>`
  }

  return createFieldWrapper(field, content)
}

/**
 * duration_picker → カスタム（時間:分 選択UI）
 */
export function renderDurationPickerField(field: DurationPickerField): string {
  const units = field.units ?? ['hours', 'minutes']
  const fieldId = field.id

  const unitLabels: Record<string, string> = {
    days: '日',
    hours: '時間',
    minutes: '分',
    seconds: '秒',
  }

  const selectors = units.map(unit => {
    const unitId = `${fieldId}-${unit}`
    let max = 59
    if (unit === 'hours') max = 23
    if (unit === 'days') max = 365

    const options = Array.from({ length: max + 1 }, (_, i) =>
      `<option value="${i}">${i}</option>`
    ).join('')

    return `
      <div class="duration-unit">
        <select id="${escapeHtml(unitId)}" name="${escapeHtml(unitId)}" class="form-select duration-select" ${field.disabled ? 'disabled' : ''}>
          ${options}
        </select>
        <span class="duration-unit-label">${unitLabels[unit]}</span>
      </div>
    `
  }).join('')

  const content = `<div class="duration-picker">${selectors}</div>`
  return createFieldWrapper(field, content)
}

/**
 * duration_input → <input type="number"> + 単位
 */
export function renderDurationInputField(field: DurationInputField): string {
  const attrs: string[] = [getCommonAttributes(field)]
  attrs.push('min="0"')

  if (field.default !== undefined) {
    attrs.push(`value="${field.default}"`)
  }

  const unitLabels: Record<string, string> = {
    hours: '時間',
    minutes: '分',
    seconds: '秒',
  }
  const unit = field.display_unit ?? 'minutes'

  const content = `
    <div class="input-with-unit">
      <input type="number" class="form-input" ${attrs.join(' ')} />
      <span class="input-unit">${unitLabels[unit]}</span>
    </div>
  `
  return createFieldWrapper(field, content)
}

/**
 * google_map_embed → Google Maps 埋め込みコンポーネント
 */
export function renderGoogleMapEmbedFieldHtml(field: GoogleMapEmbedField): string {
  const height = field.height ?? '300'
  const width = field.width ?? '100%'
  const showOpenLink = field.show_open_link !== false

  const content = `
    <div class="google-map-embed-container" data-field-id="${escapeHtml(field.id)}">
      <div class="google-map-embed-input-wrapper">
        <input
          type="text"
          inputmode="url"
          id="${escapeHtml(field.id)}"
          name="${escapeHtml(field.id)}"
          class="form-input google-map-embed-input"
          placeholder="${escapeHtml(field.placeholder ?? 'Google Maps URL を入力してください')}"
          maxlength="2048"
          ${field.required ? 'required' : ''}
          ${field.disabled ? 'disabled' : ''}
          ${field.readonly ? 'readonly' : ''}
        />
      </div>
      <div class="google-map-embed-error"></div>
      <div class="google-map-embed-preview" data-height="${escapeHtml(height)}" data-width="${escapeHtml(width)}">
        <div class="google-map-embed-placeholder">
          Google Maps URL を入力すると、ここにプレビューが表示されます
        </div>
      </div>
      ${showOpenLink ? `
        <div class="google-map-embed-link-container">
          <a href="#" class="google-map-embed-open-link disabled" target="_blank" rel="noopener noreferrer" aria-disabled="true">
            Googleマップで開く
          </a>
        </div>
      ` : ''}
    </div>
  `
  return createFieldWrapper(field, content)
}

/**
 * ファイルサイズをフォーマット
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
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
 * image_uploader → 画像アップローダーコンポーネント
 * Note: このHTMLはプレースホルダー。実際の機能はImageUploaderクラスで初期化する必要がある
 */
export function renderImageUploaderField(field: ImageUploaderField): string {
  const acceptedFormats = field.accepted_formats ?? ['image/jpeg', 'image/png', 'image/webp']
  const maxFileSize = field.max_file_size ?? 5 * 1024 * 1024 // 5MB
  const maxFiles = field.max_files ?? 10

  const formatsDisplay = acceptedFormats.map(formatMimeType).join(', ')
  const sizeDisplay = formatFileSize(maxFileSize)

  const content = `
    <div class="image-uploader-container"
         data-field-id="${escapeHtml(field.id)}"
         data-accepted-formats="${escapeHtml(acceptedFormats.join(','))}"
         data-max-file-size="${maxFileSize}"
         data-max-files="${maxFiles}"
         data-min-files="${field.min_files ?? 0}">
      <div class="uploader-wrapper">
        <div class="upload-dropzone">
          <input type="file"
                 class="file-input"
                 id="${escapeHtml(field.id)}-input"
                 accept="${acceptedFormats.join(',')}"
                 multiple
                 ${field.disabled ? 'disabled' : ''} />
          <label class="dropzone-label" for="${escapeHtml(field.id)}-input">
            <div class="dropzone-icon">
              <svg viewBox="0 0 24 24" width="48" height="48">
                <path fill="currentColor" d="M19.35 10.04A7.49 7.49 0 0012 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 000 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
              </svg>
            </div>
            <span class="dropzone-text">クリックまたはドラッグ&ドロップで画像を追加</span>
          </label>
        </div>
        <div class="uploader-hints">
          <span class="hint-formats">対応形式: ${formatsDisplay}</span>
          <span class="hint-size">最大サイズ: ${sizeDisplay}/枚</span>
          <span class="hint-count">最大${maxFiles}枚</span>
        </div>
        <div class="image-grid"></div>
      </div>
    </div>
  `
  return createFieldWrapper(field, content)
}

/**
 * heading → 見出しフィールド
 * Note: 見出しはセクションタイトルやページタイトルとして使用される
 */
export function renderHeadingField(field: HeadingField): string {
  const size = field.size ?? getDefaultSizeForLevel(field.level)
  const align = field.align ?? 'left'
  const color = field.color ?? 'default'
  const tag = `h${field.level}`

  const classes = [
    'heading-field-container',
    `heading-level-${field.level}`,
    `heading-size-${size}`,
    `heading-align-${align}`,
    `heading-color-${color}`,
  ]

  if (field.class) {
    classes.push(field.class)
  }

  const iconHtml = field.icon ? `<span class="heading-icon">${escapeHtml(field.icon)}</span>` : ''

  const content = `
    <div class="${classes.join(' ')}" data-field-id="${escapeHtml(field.id)}">
      <${tag} class="heading-element" id="${escapeHtml(field.id)}">
        ${iconHtml}
        <span class="heading-text">${escapeHtml(field.text)}</span>
      </${tag}>
    </div>
  `

  // 見出しフィールドはラベルや説明が不要なため、直接コンテンツを返す
  return content
}

/**
 * レベルに基づくデフォルトサイズを取得
 */
function getDefaultSizeForLevel(level: 1 | 2 | 3 | 4 | 5 | 6): 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' {
  const sizeMap: Record<number, 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'> = {
    1: '2xl',
    2: 'xl',
    3: 'lg',
    4: 'md',
    5: 'sm',
    6: 'xs',
  }
  return sizeMap[level]
}

// =============================================================================
// Additional Field Type Renderers
// =============================================================================

/**
 * Paginationフィールドをレンダリング
 */
function renderPaginationField(field: InputField): string {
  const paginationField = field as InputField & {
    totalItems?: number
    pageSize?: number
    currentPage?: number
  }
  const totalItems = paginationField.totalItems ?? 0
  const pageSize = paginationField.pageSize ?? 10
  const currentPage = paginationField.currentPage ?? 1
  const totalPages = Math.ceil(totalItems / pageSize)

  const startItem = totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0
  const endItem = Math.min(currentPage * pageSize, totalItems)

  const paginationHtml = `
    <div class="mokkun-pagination pagination-align-center">
      <div class="pagination-wrapper">
        <div class="pagination-page-size-selector">
          <label class="page-size-label">表示件数:</label>
          <select class="page-size-select" aria-label="ページサイズ選択">
            <option value="10" ${pageSize === 10 ? 'selected' : ''}>10件</option>
            <option value="25" ${pageSize === 25 ? 'selected' : ''}>25件</option>
            <option value="50" ${pageSize === 50 ? 'selected' : ''}>50件</option>
            <option value="100" ${pageSize === 100 ? 'selected' : ''}>100件</option>
          </select>
        </div>
        <div class="pagination-navigation">
          <button type="button" class="pagination-button pagination-button-first" ${currentPage === 1 ? 'disabled' : ''} aria-label="最初">最初</button>
          <button type="button" class="pagination-button pagination-button-prev" ${currentPage === 1 ? 'disabled' : ''} aria-label="前へ">前へ</button>
          ${Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            const page = i + 1
            return `<button type="button" class="pagination-button pagination-page-button ${page === currentPage ? 'active' : ''}" aria-label="ページ ${page}" ${page === currentPage ? 'aria-current="page"' : ''}>${page}</button>`
          }).join('')}
          <button type="button" class="pagination-button pagination-button-next" ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''} aria-label="次へ">次へ</button>
          <button type="button" class="pagination-button pagination-button-last" ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''} aria-label="最後">最後</button>
        </div>
        <div class="pagination-item-count">
          <span class="item-count-text" aria-live="polite">${totalItems > 0 ? `${totalItems}件中 ${startItem}-${endItem}件を表示` : '0件'}</span>
        </div>
      </div>
    </div>
  `

  return createFieldWrapper(field, paginationHtml)
}

/**
 * Toggleフィールドをレンダリング
 */
function renderToggleField(field: InputField): string {
  const toggleField = field as InputField & {
    defaultChecked?: boolean
    checkedLabel?: string
    uncheckedLabel?: string
    size?: 'small' | 'medium' | 'large'
  }
  const checked = toggleField.defaultChecked ?? false
  const checkedLabel = toggleField.checkedLabel ?? 'ON'
  const uncheckedLabel = toggleField.uncheckedLabel ?? 'OFF'
  const size = toggleField.size ?? 'medium'
  const stateClass = checked ? 'checked' : 'unchecked'

  const toggleHtml = `
    <div class="mokkun-toggle toggle-${size} toggle-label-right" data-state="${stateClass}">
      <div class="toggle-wrapper">
        <div class="toggle-switch-container">
          <input type="checkbox" class="toggle-checkbox visually-hidden" id="${escapeHtml(field.id)}" role="switch" aria-checked="${checked}" ${checked ? 'checked' : ''}>
          <label class="toggle-switch ${stateClass}" for="${escapeHtml(field.id)}" data-state="${stateClass}">
            <span class="toggle-track"></span>
            <span class="toggle-thumb" data-state="${stateClass}"></span>
          </label>
        </div>
        <span class="toggle-label ${stateClass}" aria-live="polite" data-state="${stateClass}">${escapeHtml(checked ? checkedLabel : uncheckedLabel)}</span>
      </div>
    </div>
  `

  return createFieldWrapper(field, toggleHtml)
}

/**
 * Badgeフィールドをレンダリング
 */
function renderBadgeField(field: InputField): string {
  const badgeField = field as InputField & {
    text?: string
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
  }
  const text = badgeField.text ?? field.label
  const variant = badgeField.variant ?? 'default'

  const badgeHtml = `
    <span class="mokkun-badge badge-${variant}">${escapeHtml(text)}</span>
  `

  return createFieldWrapper(field, badgeHtml)
}

/**
 * Browserフィールドをレンダリング（プレースホルダー）
 */
function renderBrowserField(field: InputField): string {
  const browserHtml = `
    <div class="mokkun-browser browser-placeholder">
      <div class="browser-toolbar">
        <div class="browser-controls">
          <span class="browser-dot browser-dot-red"></span>
          <span class="browser-dot browser-dot-yellow"></span>
          <span class="browser-dot browser-dot-green"></span>
        </div>
        <div class="browser-url-bar">
          <span class="browser-url">https://example.com</span>
        </div>
      </div>
      <div class="browser-content">
        <p class="browser-placeholder-text">ブラウザコンテンツ</p>
      </div>
    </div>
  `

  return createFieldWrapper(field, browserHtml)
}

/**
 * Calendarフィールドをレンダリング（プレースホルダー）
 */
function renderCalendarField(field: InputField): string {
  const calendarHtml = `
    <div class="mokkun-calendar calendar-placeholder">
      <div class="calendar-header">
        <button type="button" class="calendar-nav-btn" aria-label="前月">←</button>
        <span class="calendar-month-year">2024年12月</span>
        <button type="button" class="calendar-nav-btn" aria-label="次月">→</button>
      </div>
      <div class="calendar-grid">
        <div class="calendar-weekdays">
          <span>日</span><span>月</span><span>火</span><span>水</span><span>木</span><span>金</span><span>土</span>
        </div>
        <div class="calendar-days">
          ${Array.from({ length: 35 }, (_, i) => {
            const day = i - 5 // Offset for starting day
            if (day < 1 || day > 31) return '<span class="calendar-day calendar-day-empty"></span>'
            return `<span class="calendar-day ${day === 15 ? 'calendar-day-selected' : ''}">${day}</span>`
          }).join('')}
        </div>
      </div>
    </div>
  `

  return createFieldWrapper(field, calendarHtml)
}

/**
 * Tooltipフィールドをレンダリング（プレースホルダー）
 */
function renderTooltipField(field: InputField): string {
  const tooltipField = field as InputField & {
    text?: string
    content?: string
  }
  const text = tooltipField.text ?? 'ヘルプ'
  const content = tooltipField.content ?? 'ツールチップの内容'

  const tooltipHtml = `
    <div class="mokkun-tooltip-container">
      <span class="tooltip-trigger" tabindex="0" aria-describedby="${escapeHtml(field.id)}-tooltip">${escapeHtml(text)}</span>
      <div class="tooltip-content" id="${escapeHtml(field.id)}-tooltip" role="tooltip">${escapeHtml(content)}</div>
    </div>
  `

  return createFieldWrapper(field, tooltipHtml)
}

/**
 * FloatAreaフィールドをレンダリング（プレースホルダー）
 */
function renderFloatAreaField(field: InputField): string {
  const floatAreaHtml = `
    <div class="mokkun-float-area">
      <div class="float-area-content">
        <span class="float-area-placeholder">[フロートエリア]</span>
      </div>
    </div>
  `

  return createFieldWrapper(field, floatAreaHtml)
}

/**
 * Loaderフィールドをレンダリング
 */
function renderLoaderField(field: InputField): string {
  const loaderField = field as InputField & {
    size?: 'small' | 'medium' | 'large'
    text?: string
  }
  const size = loaderField.size ?? 'medium'
  const text = loaderField.text

  const loaderHtml = `
    <div class="mokkun-loader loader-${size}">
      <div class="loader-spinner"></div>
      ${text ? `<span class="loader-text">${escapeHtml(text)}</span>` : ''}
    </div>
  `

  return createFieldWrapper(field, loaderHtml)
}

/**
 * NotificationBarフィールドをレンダリング
 */
function renderNotificationBarField(field: InputField): string {
  const notificationField = field as InputField & {
    variant?: 'info' | 'success' | 'warning' | 'error'
    dismissible?: boolean
  }
  const variant = notificationField.variant ?? 'info'
  const dismissible = notificationField.dismissible ?? true

  const iconMap: Record<string, string> = {
    info: 'ℹ️',
    success: '✓',
    warning: '⚠️',
    error: '✕',
  }

  const notificationHtml = `
    <div class="mokkun-notification-bar notification-${variant}" role="alert">
      <span class="notification-icon">${iconMap[variant]}</span>
      <div class="notification-content">
        <span class="notification-message">${escapeHtml(field.description ?? field.label)}</span>
      </div>
      ${dismissible ? '<button type="button" class="notification-dismiss" aria-label="閉じる">×</button>' : ''}
    </div>
  `

  return createFieldWrapper(field, notificationHtml)
}

/**
 * ResponseMessageフィールドをレンダリング
 */
function renderResponseMessageField(field: InputField): string {
  const messageField = field as InputField & {
    variant?: 'success' | 'error' | 'warning' | 'info'
  }
  const variant = messageField.variant ?? 'success'

  const iconMap: Record<string, string> = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  }

  const messageHtml = `
    <div class="mokkun-response-message response-${variant}" role="status">
      <span class="response-icon">${iconMap[variant]}</span>
      <span class="response-text">${escapeHtml(field.description ?? field.label)}</span>
    </div>
  `

  return createFieldWrapper(field, messageHtml)
}

/**
 * Timelineフィールドをレンダリング
 */
function renderTimelineField(field: InputField): string {
  const timelineHtml = `
    <div class="mokkun-timeline">
      <div class="timeline-item">
        <div class="timeline-marker"></div>
        <div class="timeline-content">
          <div class="timeline-time">10:30</div>
          <div class="timeline-title">アクティビティ1</div>
        </div>
      </div>
      <div class="timeline-item">
        <div class="timeline-marker"></div>
        <div class="timeline-content">
          <div class="timeline-time">09:15</div>
          <div class="timeline-title">アクティビティ2</div>
        </div>
      </div>
      <div class="timeline-item">
        <div class="timeline-marker"></div>
        <div class="timeline-content">
          <div class="timeline-time">08:00</div>
          <div class="timeline-title">アクティビティ3</div>
        </div>
      </div>
    </div>
  `

  return createFieldWrapper(field, timelineHtml)
}

/**
 * Chipフィールドをレンダリング
 */
function renderChipField(field: InputField): string {
  const chipField = field as InputField & {
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
    removable?: boolean
  }
  const variant = chipField.variant ?? 'default'
  const removable = chipField.removable ?? false

  const chipHtml = `
    <span class="mokkun-chip chip-${variant}">
      <span class="chip-label">${escapeHtml(field.label)}</span>
      ${removable ? '<button type="button" class="chip-remove" aria-label="削除">×</button>' : ''}
    </span>
  `

  return createFieldWrapper(field, chipHtml)
}

/**
 * StatusLabelフィールドをレンダリング
 */
function renderStatusLabelField(field: InputField): string {
  const statusField = field as InputField & {
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
  }
  const variant = statusField.variant ?? 'default'

  const statusHtml = `
    <span class="mokkun-status-label status-${variant}">
      <span class="status-dot"></span>
      <span class="status-text">${escapeHtml(field.label)}</span>
    </span>
  `

  return createFieldWrapper(field, statusHtml)
}

/**
 * SegmentedControlフィールドをレンダリング
 */
function renderSegmentedControlField(field: InputField): string {
  const segmentedField = field as InputField & {
    options?: Array<{ value: string; label: string }>
    default?: string
  }
  const options = segmentedField.options ?? []
  const defaultValue = segmentedField.default ?? options[0]?.value

  const segmentedHtml = `
    <div class="mokkun-segmented-control" role="radiogroup" aria-label="${escapeHtml(field.label)}">
      ${options.map(opt => `
        <button type="button" class="segment-button ${opt.value === defaultValue ? 'active' : ''}"
                role="radio" aria-checked="${opt.value === defaultValue}"
                data-value="${escapeHtml(opt.value)}">
          ${escapeHtml(opt.label)}
        </button>
      `).join('')}
    </div>
  `

  return createFieldWrapper(field, segmentedHtml)
}

/**
 * Tabsフィールドをレンダリング
 */
function renderTabsField(field: InputField): string {
  const tabsHtml = `
    <div class="mokkun-tabs">
      <div class="tabs-list" role="tablist">
        <button type="button" class="tab-button active" role="tab" aria-selected="true">タブ1</button>
        <button type="button" class="tab-button" role="tab" aria-selected="false">タブ2</button>
        <button type="button" class="tab-button" role="tab" aria-selected="false">タブ3</button>
      </div>
      <div class="tab-panel" role="tabpanel">
        <p>タブコンテンツがここに表示されます</p>
      </div>
    </div>
  `

  return createFieldWrapper(field, tabsHtml)
}

/**
 * LineClampフィールドをレンダリング
 */
function renderLineClampField(field: InputField): string {
  const lineClampField = field as InputField & {
    lines?: number
    text?: string
  }
  const lines = lineClampField.lines ?? 3

  const lineClampHtml = `
    <div class="mokkun-line-clamp" style="-webkit-line-clamp: ${lines}; display: -webkit-box; -webkit-box-orient: vertical; overflow: hidden;">
      ${escapeHtml(field.description ?? 'テキストコンテンツがここに表示されます。長いテキストは指定行数で切り詰められます。')}
    </div>
  `

  return createFieldWrapper(field, lineClampHtml)
}

/**
 * Disclosureフィールドをレンダリング
 */
function renderDisclosureField(field: InputField): string {
  const disclosureHtml = `
    <details class="mokkun-disclosure">
      <summary class="disclosure-trigger">${escapeHtml(field.label)}</summary>
      <div class="disclosure-content">
        <p>${escapeHtml(field.description ?? '詳細コンテンツがここに表示されます')}</p>
      </div>
    </details>
  `

  return createFieldWrapper(field, disclosureHtml)
}

/**
 * AccordionPanelフィールドをレンダリング
 */
function renderAccordionPanelField(field: InputField): string {
  const accordionHtml = `
    <div class="mokkun-accordion">
      <div class="accordion-item">
        <button type="button" class="accordion-trigger" aria-expanded="false">
          <span>${escapeHtml(field.label)}</span>
          <span class="accordion-icon">▼</span>
        </button>
        <div class="accordion-content" hidden>
          <p>${escapeHtml(field.description ?? 'アコーディオンコンテンツ')}</p>
        </div>
      </div>
    </div>
  `

  return createFieldWrapper(field, accordionHtml)
}

/**
 * SectionNavフィールドをレンダリング
 */
function renderSectionNavField(field: InputField): string {
  const sectionNavHtml = `
    <nav class="mokkun-section-nav" aria-label="${escapeHtml(field.label)}">
      <ul class="section-nav-list">
        <li class="section-nav-item active">
          <a href="#section1" class="section-nav-link">セクション1</a>
        </li>
        <li class="section-nav-item">
          <a href="#section2" class="section-nav-link">セクション2</a>
        </li>
        <li class="section-nav-item">
          <a href="#section3" class="section-nav-link">セクション3</a>
        </li>
      </ul>
    </nav>
  `

  return createFieldWrapper(field, sectionNavHtml)
}

/**
 * DefinitionListフィールドをレンダリング
 */
function renderDefinitionListField(field: InputField): string {
  const definitionHtml = `
    <dl class="mokkun-definition-list">
      <div class="definition-item">
        <dt class="definition-term">項目1</dt>
        <dd class="definition-description">値1</dd>
      </div>
      <div class="definition-item">
        <dt class="definition-term">項目2</dt>
        <dd class="definition-description">値2</dd>
      </div>
      <div class="definition-item">
        <dt class="definition-term">項目3</dt>
        <dd class="definition-description">値3</dd>
      </div>
    </dl>
  `

  return createFieldWrapper(field, definitionHtml)
}

/**
 * Stepperフィールドをレンダリング
 */
function renderStepperField(field: InputField): string {
  const stepperHtml = `
    <div class="mokkun-stepper">
      <div class="stepper-step completed">
        <div class="step-indicator">1</div>
        <div class="step-label">ステップ1</div>
      </div>
      <div class="stepper-connector"></div>
      <div class="stepper-step active">
        <div class="step-indicator">2</div>
        <div class="step-label">ステップ2</div>
      </div>
      <div class="stepper-connector"></div>
      <div class="stepper-step">
        <div class="step-indicator">3</div>
        <div class="step-label">ステップ3</div>
      </div>
    </div>
  `

  return createFieldWrapper(field, stepperHtml)
}

/**
 * InformationPanelフィールドをレンダリング
 */
function renderInformationPanelField(field: InputField): string {
  const infoField = field as InputField & {
    variant?: 'info' | 'success' | 'warning' | 'error'
  }
  const variant = infoField.variant ?? 'info'

  const infoHtml = `
    <div class="mokkun-information-panel panel-${variant}">
      <div class="panel-icon">ℹ️</div>
      <div class="panel-content">
        <div class="panel-title">${escapeHtml(field.label)}</div>
        ${field.description ? `<div class="panel-description">${escapeHtml(field.description)}</div>` : ''}
      </div>
    </div>
  `

  return createFieldWrapper(field, infoHtml)
}

/**
 * Dropdownフィールドをレンダリング
 */
function renderDropdownField(field: InputField): string {
  const dropdownField = field as InputField & {
    options?: Array<{ value: string; label: string }>
  }
  const options = dropdownField.options ?? []

  const dropdownHtml = `
    <div class="mokkun-dropdown">
      <button type="button" class="dropdown-trigger" aria-haspopup="listbox" aria-expanded="false">
        <span>${escapeHtml(field.label)}</span>
        <span class="dropdown-arrow">▼</span>
      </button>
      <ul class="dropdown-menu" role="listbox" hidden>
        ${options.map(opt => `
          <li class="dropdown-item" role="option" data-value="${escapeHtml(opt.value)}">
            ${escapeHtml(opt.label)}
          </li>
        `).join('')}
      </ul>
    </div>
  `

  return createFieldWrapper(field, dropdownHtml)
}

/**
 * DeleteConfirmDialogフィールドをレンダリング
 */
function renderDeleteConfirmDialogField(field: InputField): string {
  const dialogField = field as InputField & {
    title?: string
    message?: string
    cancelLabel?: string
    confirmLabel?: string
    targetName?: string
  }
  const title = dialogField.title ?? field.label ?? '削除確認'
  const message = dialogField.message ?? field.description ?? 'この操作は取り消せません。本当に削除しますか？'
  const cancelLabel = dialogField.cancelLabel ?? 'キャンセル'
  const confirmLabel = dialogField.confirmLabel ?? '削除する'
  const targetName = dialogField.targetName ?? ''

  const dialogHtml = `
    <div class="dialog-overlay">
      <div class="delete-confirm-dialog dialog-danger" role="dialog" aria-modal="true" aria-labelledby="${escapeHtml(field.id)}-title">
        <div class="dialog-header">
          <div class="dialog-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              <line x1="10" y1="11" x2="10" y2="17"/>
              <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
          </div>
          <h2 class="dialog-title" id="${escapeHtml(field.id)}-title">${escapeHtml(title)}</h2>
        </div>
        <div class="dialog-body">
          ${targetName ? `
            <div class="dialog-target-info">
              <p class="dialog-target-text"><strong>対象:</strong> ${escapeHtml(targetName)}</p>
            </div>
          ` : ''}
          <div class="dialog-warning">
            <span class="warning-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              </svg>
            </span>
            <span class="warning-text">${escapeHtml(message)}</span>
          </div>
        </div>
        <div class="dialog-footer">
          <button type="button" class="dialog-btn dialog-btn-cancel">${escapeHtml(cancelLabel)}</button>
          <button type="button" class="dialog-btn dialog-btn-danger">${escapeHtml(confirmLabel)}</button>
        </div>
      </div>
    </div>
  `

  // ダイアログはラッパーなしで直接返す（モーダルなので独自のレイアウトが必要）
  return `<div class="form-field field-type-${field.type}" data-field-id="${escapeHtml(field.id)}">${dialogHtml}</div>`
}

// =============================================================================
// Main Render Function
// =============================================================================

/**
 * フィールドタイプに応じてレンダリング
 */
export function renderField(field: InputField): string {
  switch (field.type) {
    case 'text':
      return renderTextField(field)
    case 'number':
      return renderNumberField(field)
    case 'textarea':
      return renderTextareaField(field)
    case 'select':
      return renderSelectField(field)
    case 'multi_select':
      return renderMultiSelectField(field)
    case 'combobox':
      return renderComboboxField(field)
    case 'radio_group':
      return renderRadioGroupField(field)
    case 'checkbox_group':
      return renderCheckboxGroupField(field)
    case 'date_picker':
      return renderDatePickerField(field)
    case 'time_picker':
      return renderTimePickerField(field)
    case 'duration_picker':
      return renderDurationPickerField(field)
    case 'duration_input':
      return renderDurationInputField(field)
    case 'file_upload':
      return renderFileUploadField(field)
    case 'image_uploader':
      return renderImageUploaderField(field)
    case 'repeater':
      // Repeaterは別途実装（Phase 3以降）
      return createFieldWrapper(field, '<div class="repeater-placeholder">[リピーターフィールド - 未実装]</div>')
    case 'data_table':
      return renderDataTableField(field as DataTableField)
    case 'google_map_embed':
      return renderGoogleMapEmbedFieldHtml(field)
    case 'photo_manager':
      return renderPhotoManagerField(field as PhotoManagerField)
    case 'heading':
      return renderHeadingField(field)
    case 'pagination':
      return renderPaginationField(field)
    case 'toggle':
      return renderToggleField(field)
    case 'badge':
      return renderBadgeField(field)
    case 'browser':
      return renderBrowserField(field)
    case 'calendar':
      return renderCalendarField(field)
    case 'tooltip':
      return renderTooltipField(field)
    case 'float_area':
      return renderFloatAreaField(field)
    case 'loader':
      return renderLoaderField(field)
    case 'notification_bar':
      return renderNotificationBarField(field)
    case 'response_message':
      return renderResponseMessageField(field)
    case 'timeline':
      return renderTimelineField(field)
    case 'chip':
      return renderChipField(field)
    case 'status_label':
      return renderStatusLabelField(field)
    case 'segmented_control':
      return renderSegmentedControlField(field)
    case 'tabs':
      return renderTabsField(field)
    case 'line_clamp':
      return renderLineClampField(field)
    case 'disclosure':
      return renderDisclosureField(field)
    case 'accordion_panel':
      return renderAccordionPanelField(field)
    case 'section_nav':
      return renderSectionNavField(field)
    case 'definition_list':
      return renderDefinitionListField(field)
    case 'stepper':
      return renderStepperField(field)
    case 'information_panel':
      return renderInformationPanelField(field)
    case 'dropdown':
      return renderDropdownField(field)
    case 'delete_confirm_dialog':
      return renderDeleteConfirmDialogField(field)
    default:
      return createFieldWrapper(field, `<div class="unknown-field">不明なフィールドタイプ: ${(field as InputField).type}</div>`)
  }
}

/**
 * 複数のフィールドをレンダリング
 */
export function renderFields(fields: InputField[]): string {
  return fields.map(renderField).join('')
}

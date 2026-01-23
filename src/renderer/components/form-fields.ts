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

/**
 * Form Field Renderers (Facade)
 * 各フォームフィールドタイプのHTML生成
 *
 * このモジュールはファサードとして機能し、アクティブなデザインシステムの
 * renderFieldメソッドに委譲します。デザインシステムが未設定の場合は
 * デフォルトデザインシステム（既存コンポーネント）が使用されます。
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
  GoogleMapEmbedField,
  ImageUploaderField,
  HeadingField,
} from '../../types/schema'

// デザインシステムレジストリ（デフォルトが自動登録される）
import { designSystemRegistry } from '../../design-system'

// コンポーネントインポート（deprecated関数用）
import { Input } from './input'
import { Textarea } from './textarea'
import { Select } from './select'
import { RadioButton } from './radio'
import { Checkbox } from './checkbox'
import { Combobox } from './combobox'
import { Heading } from './heading'
import { DurationPicker } from './duration-picker'
import { DurationInput } from './duration-input'

// ヘルパー関数のインポート（deprecated関数用）
import {
  escapeHtml,
  createFieldWrapper,
  getCommonAttributes,
  formatFileSize,
  formatMimeType,
} from '../utils/field-helpers'

// =============================================================================
// Delegated Field Renderers (コンポーネントへ委譲)
// =============================================================================

/**
 * text → <input type="text">
 * @deprecated Use Input.renderField instead
 */
export function renderTextField(field: TextField): string {
  return Input.renderField(field)
}

/**
 * number → <input type="number">
 * @deprecated Use Input.renderField instead
 */
export function renderNumberField(field: NumberField): string {
  return Input.renderField(field)
}

/**
 * textarea → <textarea>
 * @deprecated Use Textarea.renderField instead
 */
export function renderTextareaField(field: TextareaField): string {
  return Textarea.renderField(field)
}

/**
 * select → <select>
 * @deprecated Use Select.renderField instead
 */
export function renderSelectField(field: SelectField): string {
  return Select.renderField(field)
}

/**
 * multi_select → <select multiple>
 * @deprecated Use Select.renderField instead
 */
export function renderMultiSelectField(field: MultiSelectField): string {
  return Select.renderField(field)
}

/**
 * combobox → Combobox component container
 * @deprecated Use Combobox.renderField instead
 */
export function renderComboboxField(field: ComboboxField): string {
  return Combobox.renderField(field)
}

/**
 * radio_group → <input type="radio"> × N
 * @deprecated Use RadioButton.renderField instead
 */
export function renderRadioGroupField(field: RadioGroupField): string {
  return RadioButton.renderField(field)
}

/**
 * checkbox_group → <input type="checkbox"> × N
 * @deprecated Use Checkbox.renderField instead
 */
export function renderCheckboxGroupField(field: CheckboxGroupField): string {
  return Checkbox.renderField(field)
}

/**
 * date_picker → <input type="date">
 * @deprecated Use Input.renderField instead
 */
export function renderDatePickerField(field: DatePickerField): string {
  return Input.renderField(field)
}

/**
 * time_picker → <input type="time">
 * @deprecated Use Input.renderField instead
 */
export function renderTimePickerField(field: TimePickerField): string {
  return Input.renderField(field)
}

/**
 * duration_picker → カスタム（時間:分 選択UI）
 * @deprecated Use DurationPicker.renderField instead
 */
export function renderDurationPickerField(field: DurationPickerField): string {
  return DurationPicker.renderField(field)
}

/**
 * duration_input → <input type="number"> + 単位
 * @deprecated Use DurationInput.renderField instead
 */
export function renderDurationInputField(field: DurationInputField): string {
  return DurationInput.renderField(field)
}

/**
 * heading → 見出しフィールド
 * @deprecated Use Heading.renderField instead
 */
export function renderHeadingField(field: HeadingField): string {
  return Heading.renderField(field)
}

// =============================================================================
// Local Field Renderers (まだコンポーネントに移行していないもの)
// =============================================================================

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
 * image_uploader → 画像アップローダーコンポーネント
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

// =============================================================================
// Main Render Function (Design System対応)
// =============================================================================

/**
 * フィールドタイプに応じてレンダリング
 * アクティブなデザインシステムに委譲する
 */
export function renderField(field: InputField): string {
  return designSystemRegistry.renderField(field)
}

/**
 * 複数のフィールドをレンダリング
 * アクティブなデザインシステムに委譲する
 */
export function renderFields(fields: InputField[]): string {
  return designSystemRegistry.renderFields(fields)
}

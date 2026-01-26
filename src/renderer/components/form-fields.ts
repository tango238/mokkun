/**
 * Form Field Renderers (Facade)
 * 各フォームフィールドタイプのHTML生成
 *
 * このモジュールはファサードとして機能し、実際のレンダリングロジックは
 * 各コンポーネントの静的renderFieldメソッドに委譲されます。
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
} from '../../types/schema'

// コンポーネントインポート
import { Input } from './input'
import { Textarea } from './textarea'
import { Select } from './select'
import { RadioButton } from './radio'
import { Checkbox } from './checkbox'
import { Combobox } from './combobox'
import { Heading } from './heading'
import { DurationPicker } from './duration-picker'
import { DurationInput } from './duration-input'
import { Pagination } from './pagination'
import { Toggle } from './toggle'
import { Badge } from './badge'
import { Browser } from './browser'
import { Calendar } from './calendar'
import { Tooltip } from './tooltip'
import { FloatArea } from './float-area'
import { Loader } from './loader'
import { NotificationBar } from './notification-bar'
import { ResponseMessage } from './response-message'
import { Timeline } from './timeline'
import { Chip } from './chip'
import { StatusLabel } from './status-label'
import { SegmentedControl } from './segmented-control'
import { Tabs } from './tabs'
import { LineClamp } from './line-clamp'
import { Disclosure } from './disclosure'
import { AccordionPanel } from './accordion-panel'
import { SectionNav } from './section-nav'
import { DefinitionList } from './definition-list'
import { Stepper } from './stepper'
import { InformationPanel } from './information-panel'
import { Dropdown } from './dropdown'
import { DeleteConfirmDialog } from './delete-confirm-dialog'
import { renderDataTableField } from './data-table'
import { renderPhotoManagerField } from './photo-manager-renderer'

// ヘルパー関数のインポート（まだ移行していないrender関数用）
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
// Main Render Function
// =============================================================================

/**
 * フィールドタイプに応じてレンダリング
 */
export function renderField(field: InputField): string {
  switch (field.type) {
    case 'text':
    case 'number':
    case 'date_picker':
    case 'time_picker':
      return Input.renderField(field)
    case 'textarea':
      return Textarea.renderField(field)
    case 'select':
    case 'multi_select':
      return Select.renderField(field)
    case 'combobox':
      return Combobox.renderField(field)
    case 'radio_group':
      return RadioButton.renderField(field)
    case 'checkbox':
    case 'checkbox_group':
      return Checkbox.renderField(field)
    case 'duration_picker':
      return DurationPicker.renderField(field)
    case 'duration_input':
      return DurationInput.renderField(field)
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
      return Heading.renderField(field)
    case 'pagination':
      return Pagination.renderField(field)
    case 'toggle':
      return Toggle.renderField(field)
    case 'badge':
      return Badge.renderField(field)
    case 'browser':
      return Browser.renderField(field)
    case 'calendar':
      return Calendar.renderField(field)
    case 'tooltip':
      return Tooltip.renderField(field)
    case 'float_area':
      return FloatArea.renderField(field)
    case 'loader':
      return Loader.renderField(field)
    case 'notification_bar':
      return NotificationBar.renderField(field)
    case 'response_message':
      return ResponseMessage.renderField(field)
    case 'timeline':
      return Timeline.renderField(field)
    case 'chip':
      return Chip.renderField(field)
    case 'status_label':
      return StatusLabel.renderField(field)
    case 'segmented_control':
      return SegmentedControl.renderField(field)
    case 'tabs':
      return Tabs.renderField(field)
    case 'line_clamp':
      return LineClamp.renderField(field)
    case 'disclosure':
      return Disclosure.renderField(field)
    case 'accordion_panel':
      return AccordionPanel.renderField(field)
    case 'section_nav':
      return SectionNav.renderField(field)
    case 'definition_list':
      return DefinitionList.renderField(field)
    case 'stepper':
      return Stepper.renderField(field)
    case 'information_panel':
      return InformationPanel.renderField(field)
    case 'dropdown':
      return Dropdown.renderField(field)
    case 'delete_confirm_dialog':
      return DeleteConfirmDialog.renderField(field)
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

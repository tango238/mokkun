/**
 * Default Design System
 * 既存コンポーネントをラップしたデフォルトデザインシステム
 */

import type { InputField } from '../types/schema'
import type { DesignSystem } from './types'

// コンポーネントインポート
import { Input } from '../renderer/components/input'
import { Textarea } from '../renderer/components/textarea'
import { Select } from '../renderer/components/select'
import { RadioButton } from '../renderer/components/radio'
import { Checkbox } from '../renderer/components/checkbox'
import { Combobox } from '../renderer/components/combobox'
import { Heading } from '../renderer/components/heading'
import { DurationPicker } from '../renderer/components/duration-picker'
import { DurationInput } from '../renderer/components/duration-input'
import { Pagination } from '../renderer/components/pagination'
import { Toggle } from '../renderer/components/toggle'
import { Badge } from '../renderer/components/badge'
import { Browser } from '../renderer/components/browser'
import { Calendar } from '../renderer/components/calendar'
import { Tooltip } from '../renderer/components/tooltip'
import { FloatArea } from '../renderer/components/float-area'
import { Loader } from '../renderer/components/loader'
import { NotificationBar } from '../renderer/components/notification-bar'
import { ResponseMessage } from '../renderer/components/response-message'
import { Timeline } from '../renderer/components/timeline'
import { Chip } from '../renderer/components/chip'
import { StatusLabel } from '../renderer/components/status-label'
import { SegmentedControl } from '../renderer/components/segmented-control'
import { Tabs } from '../renderer/components/tabs'
import { LineClamp } from '../renderer/components/line-clamp'
import { Disclosure } from '../renderer/components/disclosure'
import { AccordionPanel } from '../renderer/components/accordion-panel'
import { SectionNav } from '../renderer/components/section-nav'
import { DefinitionList } from '../renderer/components/definition-list'
import { Stepper } from '../renderer/components/stepper'
import { InformationPanel } from '../renderer/components/information-panel'
import { Dropdown } from '../renderer/components/dropdown'
import { DeleteConfirmDialog } from '../renderer/components/delete-confirm-dialog'
import { renderDataTableField } from '../renderer/components/data-table'
import { renderPhotoManagerField } from '../renderer/components/photo-manager-renderer'

import type {
  DataTableField,
  PhotoManagerField,
} from '../types/schema'

import {
  createFieldWrapper,
  escapeHtml,
  getCommonAttributes,
  formatFileSize,
  formatMimeType,
} from '../renderer/utils/field-helpers'

import type {
  FileUploadField,
  GoogleMapEmbedField,
  ImageUploaderField,
} from '../types/schema'

// =============================================================================
// Local renderers (form-fields.tsから移動)
// =============================================================================

function renderFileUploadField(field: FileUploadField): string {
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

function renderGoogleMapEmbedFieldHtml(field: GoogleMapEmbedField): string {
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

function renderImageUploaderField(field: ImageUploaderField): string {
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
// Default Design System
// =============================================================================

/**
 * デフォルトデザインシステム
 * 既存のMokkunコンポーネントをそのまま使用する
 */
export const defaultDesignSystem: DesignSystem = {
  name: 'default',

  renderField(field: InputField): string {
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
  },
}

/**
 * Field Renderer
 * フィールドレンダリングユーティリティ
 */

import type { InputField, SelectOption } from '../../types'
import { createElement } from '../utils/dom'
import { Repeater } from './repeater'
import { renderGoogleMapEmbedField } from './google-map-embed'
import { Checkbox } from './checkbox'
import { Toggle } from './toggle'
import { Textarea } from './textarea'
import { Heading } from './heading'
import { Input } from './input'
import { Select } from './select'
import { renderDataTableField } from './data-table'
import { renderPhotoManagerField } from './photo-manager-renderer'
import { ImageUploader } from './image-uploader'

/**
 * フィールドをレンダリングするオプション
 */
export interface RenderFieldOptions {
  /** 値 */
  value?: unknown
  /** 変更時コールバック */
  onChange?: (fieldId: string, value: unknown) => void
  /** ネストレベル（リピーター用） */
  nestLevel?: number
  /** アイテムID（リピーター内のフィールド用） */
  itemId?: string
}

/**
 * フィールドをレンダリング
 */
export function renderField(
  field: InputField,
  container: HTMLElement,
  options: RenderFieldOptions = {}
): void {
  const wrapper = createElement('div', {
    className: `field-wrapper field-type-${field.type}`,
  })

  // ラベル
  if (field.label) {
    const label = createElement('label', {
      className: 'field-label',
      attributes: { for: getFieldInputId(field, options) },
    })
    label.textContent = field.label
    if (field.required) {
      const required = createElement('span', {
        className: 'required-marker',
        textContent: '*',
      })
      label.appendChild(required)
    }
    wrapper.appendChild(label)
  }

  // 説明
  if (field.description) {
    const description = createElement('p', {
      className: 'field-description',
      textContent: field.description,
    })
    wrapper.appendChild(description)
  }

  // 入力要素
  const inputWrapper = createElement('div', { className: 'field-input-wrapper' })
  const input = createFieldInput(field, options)
  inputWrapper.appendChild(input)
  wrapper.appendChild(inputWrapper)

  container.appendChild(wrapper)
}

/**
 * フィールドの入力要素ID
 */
function getFieldInputId(field: InputField, options: RenderFieldOptions): string {
  if (options.itemId) {
    return `${options.itemId}-${field.id}`
  }
  return field.id
}

/**
 * フィールドの入力要素を作成
 */
function createFieldInput(
  field: InputField,
  options: RenderFieldOptions
): HTMLElement {
  const inputId = getFieldInputId(field, options)

  switch (field.type) {
    case 'text':
      return createTextInput(field, inputId, options)

    case 'number':
      return createNumberInput(field, inputId, options)

    case 'textarea':
      return createTextarea(field, inputId, options)

    case 'select':
      return createSelect(field, inputId, options)

    case 'multi_select':
      return createMultiSelect(field, inputId, options)

    case 'radio_group':
      return createRadioGroup(field, inputId, options)

    case 'checkbox_group':
      return createCheckboxGroup(field, inputId, options)

    case 'date_picker':
      return createDatePicker(field, inputId, options)

    case 'time_picker':
      return createTimePicker(field, inputId, options)

    case 'duration_picker':
      return createDurationPicker(field, inputId, options)

    case 'duration_input':
      return createDurationInput(field, inputId, options)

    case 'file_upload':
      return createFileUpload(field, inputId, options)

    case 'repeater':
      return createRepeater(field, inputId, options)

    case 'google_map_embed':
      return createGoogleMapEmbed(field, options)

    case 'checkbox':
      return createCheckboxField(field, inputId, options)

    case 'toggle':
      return createToggleField(field, inputId, options)

    case 'data_table':
      return createDataTable(field, options)

    case 'photo_manager':
      return createPhotoManager(field, options)

    case 'image_uploader':
      return createImageUploader(field, inputId, options)

    case 'heading':
      return createHeadingField(field, options)

    default:
      return createElement('div', {
        className: 'field-unsupported',
        textContent: `Unsupported field type: ${(field as InputField).type}`,
      })
  }
}

// =============================================================================
// Individual Field Creators
// =============================================================================

function createTextInput(
  field: Extract<InputField, { type: 'text' }>,
  _inputId: string,
  options: RenderFieldOptions
): HTMLElement {
  const container = createElement('div', { className: 'input-container' })

  const defaultValue = options.value !== undefined
    ? String(options.value)
    : field.default !== undefined
      ? String(field.default)
      : ''

  const input = new Input(
    container,
    {
      defaultValue,
      placeholder: field.placeholder,
      disabled: field.disabled ?? false,
      readonly: field.readonly ?? false,
      required: field.required ?? false,
      type: field.input_type ?? 'text',
      name: field.id,
      size: 'medium',
      clearable: true,
    },
    {
      onChange: (value) => {
        options.onChange?.(field.id, value)
      },
    }
  )

  input.render()

  return container
}

function createNumberInput(
  field: Extract<InputField, { type: 'number' }>,
  inputId: string,
  options: RenderFieldOptions
): HTMLElement {
  const wrapper = createElement('div', { className: 'number-input-wrapper' })

  const input = createElement('input', {
    className: 'field-input field-number',
    attributes: {
      type: 'number',
      id: inputId,
      name: field.id,
      placeholder: field.placeholder ?? '',
    },
  })

  if (options.value !== undefined) {
    input.value = String(options.value)
  } else if (field.default !== undefined) {
    input.value = String(field.default)
  }

  if (field.required) input.required = true
  if (field.disabled) input.disabled = true
  if (field.readonly) input.readOnly = true
  if (field.min !== undefined) input.min = String(field.min)
  if (field.max !== undefined) input.max = String(field.max)
  if (field.step !== undefined) input.step = String(field.step)

  input.addEventListener('change', () => {
    options.onChange?.(field.id, parseFloat(input.value) || 0)
  })

  wrapper.appendChild(input)

  if (field.unit) {
    const unit = createElement('span', {
      className: 'field-unit',
      textContent: field.unit,
    })
    wrapper.appendChild(unit)
  }

  return wrapper
}

function createTextarea(
  field: Extract<InputField, { type: 'textarea' }>,
  inputId: string,
  options: RenderFieldOptions
): HTMLElement {
  const container = createElement('div', {
    className: 'field-textarea-container',
  })

  const defaultValue = options.value !== undefined
    ? String(options.value)
    : field.default !== undefined
      ? String(field.default)
      : undefined

  const textarea = new Textarea(
    container,
    {
      id: inputId,
      name: field.id,
      placeholder: field.placeholder,
      rows: field.rows,
      minLength: field.min_length,
      maxLength: field.max_length,
      required: field.required,
      disabled: field.disabled,
      readonly: field.readonly,
      resizable: field.resizable,
      defaultValue,
      autoResize: true,
      showCount: field.max_length !== undefined,
    },
    {
      onChange: (value) => {
        options.onChange?.(field.id, value)
      },
    }
  )

  textarea.render()

  return container
}

function createSelect(
  field: Extract<InputField, { type: 'select' }>,
  _inputId: string,
  options: RenderFieldOptions
): HTMLElement {
  const container = createElement('div', { className: 'select-container' })

  // 初期値の決定
  const defaultValue = options.value !== undefined
    ? String(options.value)
    : field.default !== undefined
      ? String(field.default)
      : undefined

  // オプションの配列化（グループ対応）
  const selectOptions = getOptionsArray(field.options)
  const optionsWithGroups = groupOptionsByGroup(selectOptions)

  const select = new Select(
    container,
    {
      options: optionsWithGroups,
      defaultValue,
      disabled: field.disabled ?? false,
      error: false,
      placeholder: field.placeholder,
      hasBlank: !field.required || field.clearable,
      size: field.size as 's' | 'default' | undefined,
      name: field.name,
      required: field.required,
      clearable: field.clearable,
    },
    {
      onChange: (value) => {
        options.onChange?.(field.id, value)
      },
    }
  )

  select.render()

  return container
}

function createMultiSelect(
  field: Extract<InputField, { type: 'multi_select' }>,
  _inputId: string,
  options: RenderFieldOptions
): HTMLElement {
  const wrapper = createElement('div', { className: 'multi-select-wrapper' })

  const selectedValues = new Set<string | number>(
    Array.isArray(options.value) ? options.value :
    Array.isArray(field.default) ? field.default : []
  )

  const selectOptions = getOptionsArray(field.options)
  for (const opt of selectOptions) {
    const checkWrapper = createElement('label', { className: 'multi-select-option' })
    const checkbox = createElement('input', {
      attributes: {
        type: 'checkbox',
        name: `${field.id}[]`,
        value: String(opt.value),
      },
    })
    checkbox.checked = selectedValues.has(opt.value)
    if (opt.disabled) checkbox.disabled = true

    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        selectedValues.add(opt.value)
      } else {
        selectedValues.delete(opt.value)
      }
      options.onChange?.(field.id, Array.from(selectedValues))
    })

    checkWrapper.appendChild(checkbox)
    checkWrapper.appendChild(document.createTextNode(opt.label))
    wrapper.appendChild(checkWrapper)
  }

  return wrapper
}

function createRadioGroup(
  field: Extract<InputField, { type: 'radio_group' }>,
  _inputId: string,
  options: RenderFieldOptions
): HTMLElement {
  const direction = field.direction ?? 'vertical'
  const wrapper = createElement('div', {
    className: `radio-group-wrapper direction-${direction}`,
  })

  const selectOptions = getOptionsArray(field.options)
  const currentValue = options.value ?? field.default

  for (const opt of selectOptions) {
    const radioWrapper = createElement('label', { className: 'radio-option' })
    const radio = createElement('input', {
      attributes: {
        type: 'radio',
        name: field.id,
        value: String(opt.value),
      },
    })
    radio.checked = currentValue !== undefined && String(opt.value) === String(currentValue)
    if (opt.disabled) radio.disabled = true

    radio.addEventListener('change', () => {
      if (radio.checked) {
        options.onChange?.(field.id, opt.value)
      }
    })

    radioWrapper.appendChild(radio)
    radioWrapper.appendChild(document.createTextNode(opt.label))
    wrapper.appendChild(radioWrapper)
  }

  return wrapper
}

function createCheckboxGroup(
  field: Extract<InputField, { type: 'checkbox_group' }>,
  _inputId: string,
  options: RenderFieldOptions
): HTMLElement {
  const direction = field.direction ?? 'vertical'
  const wrapper = createElement('div', {
    className: `checkbox-group-wrapper direction-${direction}`,
  })

  const selectedValues = new Set<string | number>(
    Array.isArray(options.value) ? options.value :
    Array.isArray(field.default) ? field.default : []
  )

  const selectOptions = getOptionsArray(field.options)
  for (const opt of selectOptions) {
    const checkWrapper = createElement('label', { className: 'checkbox-option' })
    const checkbox = createElement('input', {
      attributes: {
        type: 'checkbox',
        name: `${field.id}[]`,
        value: String(opt.value),
      },
    })
    checkbox.checked = selectedValues.has(opt.value)
    if (opt.disabled) checkbox.disabled = true

    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        selectedValues.add(opt.value)
      } else {
        selectedValues.delete(opt.value)
      }
      options.onChange?.(field.id, Array.from(selectedValues))
    })

    checkWrapper.appendChild(checkbox)
    checkWrapper.appendChild(document.createTextNode(opt.label))
    wrapper.appendChild(checkWrapper)
  }

  return wrapper
}

function createDatePicker(
  field: Extract<InputField, { type: 'date_picker' }>,
  inputId: string,
  options: RenderFieldOptions
): HTMLElement {
  const inputType = field.include_time ? 'datetime-local' : 'date'
  const input = createElement('input', {
    className: 'field-input field-date',
    attributes: {
      type: inputType,
      id: inputId,
      name: field.id,
    },
  })

  if (options.value !== undefined) {
    input.value = String(options.value)
  } else if (field.default !== undefined) {
    input.value = String(field.default)
  }

  if (field.required) input.required = true
  if (field.disabled) input.disabled = true
  if (field.min_date) input.min = field.min_date
  if (field.max_date) input.max = field.max_date

  input.addEventListener('change', () => {
    options.onChange?.(field.id, input.value)
  })

  return input
}

function createTimePicker(
  field: Extract<InputField, { type: 'time_picker' }>,
  inputId: string,
  options: RenderFieldOptions
): HTMLElement {
  const input = createElement('input', {
    className: 'field-input field-time',
    attributes: {
      type: 'time',
      id: inputId,
      name: field.id,
    },
  })

  if (options.value !== undefined) {
    input.value = String(options.value)
  } else if (field.default !== undefined) {
    input.value = String(field.default)
  }

  if (field.required) input.required = true
  if (field.disabled) input.disabled = true
  if (field.minute_step) input.step = String(field.minute_step * 60)

  input.addEventListener('change', () => {
    options.onChange?.(field.id, input.value)
  })

  return input
}

function createDurationPicker(
  field: Extract<InputField, { type: 'duration_picker' }>,
  inputId: string,
  options: RenderFieldOptions
): HTMLElement {
  const wrapper = createElement('div', { className: 'duration-picker-wrapper' })

  const units = field.units ?? ['hours', 'minutes', 'seconds']
  let totalSeconds = typeof options.value === 'number' ? options.value :
                     typeof field.default === 'number' ? field.default : 0

  const updateValue = () => {
    let seconds = 0
    for (const [unit, input] of Object.entries(inputs)) {
      const val = parseInt(input.value) || 0
      switch (unit) {
        case 'days': seconds += val * 86400; break
        case 'hours': seconds += val * 3600; break
        case 'minutes': seconds += val * 60; break
        case 'seconds': seconds += val; break
      }
    }
    options.onChange?.(field.id, seconds)
  }

  const inputs: Record<string, HTMLInputElement> = {}

  for (const unit of units) {
    const unitWrapper = createElement('div', { className: 'duration-unit' })

    const input = createElement('input', {
      className: 'field-input duration-input',
      attributes: {
        type: 'number',
        min: '0',
        id: `${inputId}-${unit}`,
      },
    })

    // 初期値を計算
    let value = 0
    switch (unit) {
      case 'days':
        value = Math.floor(totalSeconds / 86400)
        totalSeconds %= 86400
        break
      case 'hours':
        value = Math.floor(totalSeconds / 3600)
        totalSeconds %= 3600
        break
      case 'minutes':
        value = Math.floor(totalSeconds / 60)
        totalSeconds %= 60
        break
      case 'seconds':
        value = totalSeconds
        break
    }
    input.value = String(value)

    if (field.disabled) input.disabled = true

    input.addEventListener('change', updateValue)
    inputs[unit] = input

    const label = createElement('label', {
      attributes: { for: `${inputId}-${unit}` },
      textContent: unit,
    })

    unitWrapper.appendChild(input)
    unitWrapper.appendChild(label)
    wrapper.appendChild(unitWrapper)
  }

  return wrapper
}

function createDurationInput(
  field: Extract<InputField, { type: 'duration_input' }>,
  inputId: string,
  options: RenderFieldOptions
): HTMLElement {
  const input = createElement('input', {
    className: 'field-input field-duration-input',
    attributes: {
      type: 'text',
      id: inputId,
      name: field.id,
      placeholder: field.format ?? 'HH:MM:SS',
    },
  })

  if (options.value !== undefined) {
    input.value = String(options.value)
  } else if (field.default !== undefined) {
    input.value = String(field.default)
  }

  if (field.required) input.required = true
  if (field.disabled) input.disabled = true

  input.addEventListener('change', () => {
    options.onChange?.(field.id, input.value)
  })

  return input
}

function createFileUpload(
  field: Extract<InputField, { type: 'file_upload' }>,
  inputId: string,
  options: RenderFieldOptions
): HTMLElement {
  const wrapper = createElement('div', {
    className: `file-upload-wrapper ${field.drag_drop !== false ? 'drag-drop-enabled' : ''}`,
  })

  const input = createElement('input', {
    className: 'field-input field-file',
    attributes: {
      type: 'file',
      id: inputId,
      name: field.id,
    },
  })

  if (field.accept) {
    input.accept = field.accept.join(',')
  }
  if (field.multiple) {
    input.multiple = true
  }
  if (field.required) input.required = true
  if (field.disabled) input.disabled = true

  input.addEventListener('change', () => {
    options.onChange?.(field.id, input.files)
  })

  // ドラッグ&ドロップエリア
  if (field.drag_drop !== false) {
    const dropZone = createElement('div', { className: 'drop-zone' })
    const dropText = createElement('p', {
      textContent: 'Drag and drop files here or click to select',
    })
    dropZone.appendChild(dropText)
    dropZone.appendChild(input)

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault()
      dropZone.classList.add('drag-over')
    })

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('drag-over')
    })

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault()
      dropZone.classList.remove('drag-over')
      if (e.dataTransfer?.files) {
        const dt = new DataTransfer()
        for (const file of Array.from(e.dataTransfer.files)) {
          dt.items.add(file)
        }
        input.files = dt.files
        options.onChange?.(field.id, input.files)
      }
    })

    wrapper.appendChild(dropZone)
  } else {
    wrapper.appendChild(input)
  }

  return wrapper
}

function createRepeater(
  field: Extract<InputField, { type: 'repeater' }>,
  _inputId: string,
  options: RenderFieldOptions
): HTMLElement {
  const container = createElement('div', { className: 'repeater-container' })

  const nestLevel = options.nestLevel ?? 0
  if (nestLevel >= 2) {
    container.textContent = 'Maximum nesting level reached'
    return container
  }

  const repeater = new Repeater(
    field,
    container,
    {
      onChange: (state) => {
        options.onChange?.(field.id, state.items.map(item => item.data))
      },
      renderFields: (fields, itemContainer, itemId, level) => {
        for (const itemField of fields) {
          renderField(itemField, itemContainer, {
            ...options,
            nestLevel: level,
            itemId,
          })
        }
      },
    },
    nestLevel
  )

  repeater.render()

  return container
}

function createGoogleMapEmbed(
  field: Extract<InputField, { type: 'google_map_embed' }>,
  options: RenderFieldOptions
): HTMLElement {
  const container = createElement('div', { className: 'google-map-embed-field' })

  renderGoogleMapEmbedField(field, container, {
    value: typeof options.value === 'string' ? options.value : undefined,
    onChange: (fieldId, value) => {
      options.onChange?.(fieldId, value)
    },
  })

  return container
}

function createCheckboxField(
  field: Extract<InputField, { type: 'checkbox' }>,
  _inputId: string,
  options: RenderFieldOptions
): HTMLElement {
  const container = createElement('div', { className: 'checkbox-container' })

  const defaultChecked = options.value !== undefined
    ? Boolean(options.value)
    : field.default !== undefined
      ? Boolean(field.default)
      : false

  const checkbox = new Checkbox(
    container,
    {
      defaultChecked,
      disabled: field.disabled ?? false,
      checkedLabel: field.checked_label,
      uncheckedLabel: field.unchecked_label,
      size: field.size,
      name: field.name,
      labelPosition: field.label_position,
    },
    {
      onChange: (checked) => {
        options.onChange?.(field.id, checked)
      },
    }
  )

  checkbox.render()

  return container
}

function createToggleField(
  field: Extract<InputField, { type: 'toggle' }>,
  _inputId: string,
  options: RenderFieldOptions
): HTMLElement {
  const container = createElement('div', { className: 'toggle-container' })

  const defaultChecked = options.value !== undefined
    ? Boolean(options.value)
    : field.default !== undefined
      ? Boolean(field.default)
      : false

  const toggle = new Toggle(
    container,
    {
      defaultChecked,
      disabled: field.disabled ?? false,
      checkedLabel: field.checked_label,
      uncheckedLabel: field.unchecked_label,
      size: field.size,
      name: field.name,
      labelPosition: field.label_position,
    },
    {
      onChange: (checked) => {
        options.onChange?.(field.id, checked)
      },
    }
  )

  toggle.render()

  return container
}

function createDataTable(
  field: Extract<InputField, { type: 'data_table' }>,
  _options: RenderFieldOptions
): HTMLElement {
  const container = createElement('div', { className: 'data-table-container' })

  // renderDataTableFieldを使用してテーブルをレンダリング
  const tableHtml = renderDataTableField(field)
  container.innerHTML = tableHtml

  return container
}

function createPhotoManager(
  field: Extract<InputField, { type: 'photo_manager' }>,
  _options: RenderFieldOptions
): HTMLElement {
  const container = createElement('div', { className: 'photo-manager-container' })

  // renderPhotoManagerFieldを使用してマネージャーをレンダリング
  const managerHtml = renderPhotoManagerField(field)
  container.innerHTML = managerHtml

  return container
}

function createImageUploader(
  field: Extract<InputField, { type: 'image_uploader' }>,
  _inputId: string,
  options: RenderFieldOptions
): HTMLElement {
  const container = createElement('div', { className: 'image-uploader-container' })

  const uploader = new ImageUploader(
    {
      id: field.id,
      label: field.label,
      description: field.description,
      acceptedFormats: field.accepted_formats ?? ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      maxFileSize: field.max_file_size ?? 10 * 1024 * 1024, // 10MB
      maxFiles: field.max_files ?? 10,
      minFiles: field.min_files,
      required: field.required,
      disabled: field.disabled,
    },
    container,
    {
      onChange: (state) => {
        options.onChange?.(field.id, state.images)
      },
    }
  )

  uploader.render()

  return container
}

function createHeadingField(
  field: Extract<InputField, { type: 'heading' }>,
  _options: RenderFieldOptions
): HTMLElement {
  const container = createElement('div', { className: 'heading-field-container' })

  const heading = new Heading(
    container,
    {
      level: field.level,
      text: field.text,
      size: field.size,
      align: field.align,
      color: field.color,
      icon: field.icon,
      id: field.id,
      className: field.class,
    }
  )

  heading.render()

  return container
}

// =============================================================================
// Helpers
// =============================================================================

function getOptionsArray(options: SelectOption[] | string): SelectOption[] {
  if (typeof options === 'string') {
    return []
  }
  return options
}

/**
 * オプションをグループ化（group プロパティに基づいて optgroup に変換）
 */
function groupOptionsByGroup(
  options: SelectOption[]
): Array<SelectOption | import('../../types/schema').SelectOptionGroup> {
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

  const result: Array<SelectOption | import('../../types/schema').SelectOptionGroup> = []

  // 未グループ化のオプションを最初に追加
  result.push(...ungrouped)

  // グループ化されたオプションを追加
  for (const [label, opts] of grouped.entries()) {
    result.push({
      label,
      options: opts,
    } as import('../../types/schema').SelectOptionGroup)
  }

  return result
}

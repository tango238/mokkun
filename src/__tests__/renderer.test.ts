/**
 * Renderer Tests
 * フォームフィールドとスクリーンレンダラーのテスト
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  renderField,
  renderFields,
  renderTextField,
  renderNumberField,
  renderTextareaField,
  renderSelectField,
  renderMultiSelectField,
  renderRadioGroupField,
  renderCheckboxGroupField,
  renderDatePickerField,
  renderTimePickerField,
  renderDurationPickerField,
  renderDurationInputField,
  renderFileUploadField,
  renderImageUploaderField,
} from '../renderer/components/form-fields'
import {
  renderAction,
  renderActions,
  renderDisplayField,
  renderDisplayFields,
  renderFilters,
  renderGrid,
} from '../renderer/components/layout'
import { renderScreen, renderWizardScreen } from '../renderer/screen-renderer'
import type {
  TextField,
  NumberField,
  TextareaField,
  SelectField,
  MultiSelectField,
  RadioGroupField,
  CheckboxGroupField,
  DatePickerField,
  TimePickerField,
  DurationPickerField,
  DurationInputField,
  FileUploadField,
  ImageUploaderField,
  ScreenDefinition,
  SubmitAction,
  NavigateAction,
  WizardConfig,
  RepeaterField,
  InputField,
} from '../types/schema'
import { Wizard, type WizardState } from '../renderer/components/wizard'
import { Repeater, type RepeaterState } from '../renderer/components/repeater'
import { Tabs, type TabsState, type TabDefinition } from '../renderer/components/tabs'
import { DataTable, renderDataTableField, type DataTableState } from '../renderer/components/data-table'
import { Toggle, createToggle, type ToggleConfig } from '../renderer/components/toggle'
import { generateDummyData, generateRepeaterItemDummyData } from '../renderer/utils/dummy-data'
import type { DataTableField, DataTableRow } from '../types/schema'

// =============================================================================
// Phase 2 Tests - Form Field Renderers
// =============================================================================

describe('Form Field Renderers', () => {
  describe('renderTextField', () => {
    it('renders basic text input', () => {
      const field: TextField = {
        id: 'test_text',
        type: 'text',
        label: 'Test Label',
      }
      const html = renderTextField(field)

      expect(html).toContain('id="test_text"')
      expect(html).toContain('name="test_text"')
      expect(html).toContain('type="text"')
      expect(html).toContain('Test Label')
    })

    it('renders email input type', () => {
      const field: TextField = {
        id: 'email',
        type: 'text',
        label: 'Email',
        input_type: 'email',
      }
      const html = renderTextField(field)

      expect(html).toContain('type="email"')
    })

    it('renders required field with mark', () => {
      const field: TextField = {
        id: 'required_field',
        type: 'text',
        label: 'Required',
        required: true,
      }
      const html = renderTextField(field)

      expect(html).toContain('required')
      expect(html).toContain('required-mark')
    })

    it('renders with placeholder', () => {
      const field: TextField = {
        id: 'placeholder_field',
        type: 'text',
        label: 'With Placeholder',
        placeholder: 'Enter text here',
      }
      const html = renderTextField(field)

      expect(html).toContain('placeholder="Enter text here"')
    })

    it('renders with validation attributes', () => {
      const field: TextField = {
        id: 'validated_field',
        type: 'text',
        label: 'Validated',
        min_length: 3,
        max_length: 100,
        pattern: '[A-Za-z]+',
      }
      const html = renderTextField(field)

      expect(html).toContain('minlength="3"')
      expect(html).toContain('maxlength="100"')
      expect(html).toContain('pattern="[A-Za-z]+"')
    })
  })

  describe('renderNumberField', () => {
    it('renders number input with min/max', () => {
      const field: NumberField = {
        id: 'age',
        type: 'number',
        label: 'Age',
        min: 0,
        max: 150,
      }
      const html = renderNumberField(field)

      expect(html).toContain('type="number"')
      expect(html).toContain('min="0"')
      expect(html).toContain('max="150"')
    })

    it('renders with unit', () => {
      const field: NumberField = {
        id: 'weight',
        type: 'number',
        label: 'Weight',
        unit: 'kg',
      }
      const html = renderNumberField(field)

      expect(html).toContain('input-unit')
      expect(html).toContain('kg')
    })
  })

  describe('renderTextareaField', () => {
    it('renders textarea with rows', () => {
      const field: TextareaField = {
        id: 'bio',
        type: 'textarea',
        label: 'Bio',
        rows: 5,
      }
      const html = renderTextareaField(field)

      expect(html).toContain('<textarea')
      expect(html).toContain('rows="5"')
    })
  })

  describe('renderSelectField', () => {
    it('renders select with options', () => {
      const field: SelectField = {
        id: 'country',
        type: 'select',
        label: 'Country',
        options: [
          { value: 'jp', label: 'Japan' },
          { value: 'us', label: 'USA' },
        ],
      }
      const html = renderSelectField(field)

      expect(html).toContain('<select')
      expect(html).toContain('value="jp"')
      expect(html).toContain('Japan')
      expect(html).toContain('value="us"')
      expect(html).toContain('USA')
    })
  })

  describe('renderMultiSelectField', () => {
    it('renders multi-select', () => {
      const field: MultiSelectField = {
        id: 'tags',
        type: 'multi_select',
        label: 'Tags',
        options: [
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B' },
        ],
      }
      const html = renderMultiSelectField(field)

      expect(html).toContain('multiple')
      expect(html).toContain('form-multiselect')
    })
  })

  describe('renderRadioGroupField', () => {
    it('renders radio buttons', () => {
      const field: RadioGroupField = {
        id: 'gender',
        type: 'radio_group',
        label: 'Gender',
        options: [
          { value: 'male', label: 'Male' },
          { value: 'female', label: 'Female' },
        ],
      }
      const html = renderRadioGroupField(field)

      expect(html).toContain('type="radio"')
      expect(html).toContain('radio-group')
      expect(html).toContain('Male')
      expect(html).toContain('Female')
    })

    it('renders horizontal layout', () => {
      const field: RadioGroupField = {
        id: 'choice',
        type: 'radio_group',
        label: 'Choice',
        options: [{ value: '1', label: 'One' }],
        direction: 'horizontal',
      }
      const html = renderRadioGroupField(field)

      expect(html).toContain('direction-horizontal')
    })
  })

  describe('renderCheckboxGroupField', () => {
    it('renders checkboxes', () => {
      const field: CheckboxGroupField = {
        id: 'interests',
        type: 'checkbox_group',
        label: 'Interests',
        options: [
          { value: 'tech', label: 'Technology' },
          { value: 'music', label: 'Music' },
        ],
      }
      const html = renderCheckboxGroupField(field)

      expect(html).toContain('type="checkbox"')
      expect(html).toContain('checkbox-group')
      expect(html).toContain('Technology')
      expect(html).toContain('Music')
    })
  })

  describe('renderDatePickerField', () => {
    it('renders date input', () => {
      const field: DatePickerField = {
        id: 'birthday',
        type: 'date_picker',
        label: 'Birthday',
      }
      const html = renderDatePickerField(field)

      expect(html).toContain('type="date"')
    })

    it('renders datetime-local when include_time is true', () => {
      const field: DatePickerField = {
        id: 'appointment',
        type: 'date_picker',
        label: 'Appointment',
        include_time: true,
      }
      const html = renderDatePickerField(field)

      expect(html).toContain('type="datetime-local"')
    })
  })

  describe('renderTimePickerField', () => {
    it('renders time input', () => {
      const field: TimePickerField = {
        id: 'start_time',
        type: 'time_picker',
        label: 'Start Time',
      }
      const html = renderTimePickerField(field)

      expect(html).toContain('type="time"')
    })
  })

  describe('renderDurationPickerField', () => {
    it('renders duration picker with selectors', () => {
      const field: DurationPickerField = {
        id: 'duration',
        type: 'duration_picker',
        label: 'Duration',
        units: ['hours', 'minutes'],
      }
      const html = renderDurationPickerField(field)

      expect(html).toContain('duration-picker')
      expect(html).toContain('時間')
      expect(html).toContain('分')
    })
  })

  describe('renderDurationInputField', () => {
    it('renders duration input with unit', () => {
      const field: DurationInputField = {
        id: 'timeout',
        type: 'duration_input',
        label: 'Timeout',
        display_unit: 'seconds',
      }
      const html = renderDurationInputField(field)

      expect(html).toContain('type="number"')
      expect(html).toContain('秒')
    })
  })

  describe('renderFileUploadField', () => {
    it('renders file input', () => {
      const field: FileUploadField = {
        id: 'avatar',
        type: 'file_upload',
        label: 'Avatar',
        accept: ['image/jpeg', 'image/png'],
      }
      const html = renderFileUploadField(field)

      expect(html).toContain('type="file"')
      expect(html).toContain('accept="image/jpeg,image/png"')
    })

    it('renders dropzone when drag_drop is true', () => {
      const field: FileUploadField = {
        id: 'document',
        type: 'file_upload',
        label: 'Document',
        drag_drop: true,
      }
      const html = renderFileUploadField(field)

      expect(html).toContain('file-dropzone')
      expect(html).toContain('ドラッグ&ドロップ')
    })
  })

  describe('renderImageUploaderField', () => {
    it('renders image uploader with default settings', () => {
      const field: ImageUploaderField = {
        id: 'facility_images',
        type: 'image_uploader',
        label: 'Facility Images',
      }
      const html = renderImageUploaderField(field)

      expect(html).toContain('image-uploader-container')
      expect(html).toContain('data-field-id="facility_images"')
      expect(html).toContain('image/jpeg')
      expect(html).toContain('image/png')
      expect(html).toContain('image/webp')
      expect(html).toContain('5.0 MB')
      expect(html).toContain('最大10枚')
    })

    it('renders with custom settings', () => {
      const field: ImageUploaderField = {
        id: 'product_photos',
        type: 'image_uploader',
        label: 'Product Photos',
        accepted_formats: ['image/jpeg'],
        max_file_size: 10 * 1024 * 1024,
        max_files: 5,
        min_files: 1,
      }
      const html = renderImageUploaderField(field)

      expect(html).toContain('data-max-files="5"')
      expect(html).toContain('data-min-files="1"')
      expect(html).toContain('10.0 MB')
      expect(html).toContain('最大5枚')
      expect(html).toContain('JPEG')
    })

    it('renders dropzone with file input', () => {
      const field: ImageUploaderField = {
        id: 'images',
        type: 'image_uploader',
        label: 'Images',
      }
      const html = renderImageUploaderField(field)

      expect(html).toContain('upload-dropzone')
      expect(html).toContain('type="file"')
      expect(html).toContain('multiple')
      expect(html).toContain('dropzone-label')
    })
  })

  describe('renderField', () => {
    it('dispatches to correct renderer based on type', () => {
      const textField: TextField = {
        id: 'text',
        type: 'text',
        label: 'Text',
      }
      const numberField: NumberField = {
        id: 'number',
        type: 'number',
        label: 'Number',
      }

      const textHtml = renderField(textField)
      const numberHtml = renderField(numberField)

      expect(textHtml).toContain('type="text"')
      expect(numberHtml).toContain('type="number"')
    })

    it('dispatches data_table to renderDataTableField', () => {
      const dataTableField: DataTableField = {
        id: 'customers',
        type: 'data_table',
        label: '顧客リスト',
        columns: [
          { id: 'name', label: '名前' },
          { id: 'email', label: 'メール' },
        ],
        data: [
          { id: 1, name: '田中', email: 'tanaka@example.com' },
        ],
      }

      const html = renderField(dataTableField)

      // data_tableがmokkun-data-tableクラスを持つHTMLをレンダリングすることを確認
      expect(html).toContain('mokkun-data-table')
      expect(html).toContain('data-table-th')
      expect(html).toContain('名前')
      expect(html).toContain('メール')
      expect(html).toContain('田中')
    })
  })

  describe('renderFields', () => {
    it('renders multiple fields', () => {
      const fields = [
        { id: 'f1', type: 'text' as const, label: 'Field 1' },
        { id: 'f2', type: 'text' as const, label: 'Field 2' },
      ]
      const html = renderFields(fields)

      expect(html).toContain('Field 1')
      expect(html).toContain('Field 2')
    })
  })
})

describe('Layout Components', () => {
  describe('renderAction', () => {
    it('renders submit button', () => {
      const action: SubmitAction = {
        id: 'submit',
        type: 'submit',
        label: 'Submit',
        style: 'primary',
      }
      const html = renderAction(action)

      expect(html).toContain('type="submit"')
      expect(html).toContain('btn-primary')
      expect(html).toContain('Submit')
    })

    it('renders navigate button', () => {
      const action: NavigateAction = {
        id: 'go',
        type: 'navigate',
        label: 'Go',
        to: '/next',
      }
      const html = renderAction(action)

      expect(html).toContain('type="button"')
      expect(html).toContain('data-navigate-to="/next"')
    })
  })

  describe('renderActions', () => {
    it('renders multiple actions', () => {
      const actions = [
        { id: 'a1', type: 'submit' as const, label: 'Save' },
        { id: 'a2', type: 'reset' as const, label: 'Cancel' },
      ]
      const html = renderActions(actions)

      expect(html).toContain('Save')
      expect(html).toContain('Cancel')
      expect(html).toContain('class="actions"')
    })
  })

  describe('renderDisplayField', () => {
    it('renders display field', () => {
      const html = renderDisplayField({
        id: 'name',
        label: 'Name',
        value: 'John Doe',
      })

      expect(html).toContain('display-field')
      expect(html).toContain('Name')
      expect(html).toContain('John Doe')
    })
  })

  describe('renderFilters', () => {
    it('renders filter UI', () => {
      const html = renderFilters({
        fields: [
          { id: 'search', type: 'text', label: 'Search' },
        ],
      })

      expect(html).toContain('filters')
      expect(html).toContain('filter-submit')
      expect(html).toContain('filter-reset')
    })
  })

  describe('renderGrid', () => {
    it('renders grid layout', () => {
      const html = renderGrid({
        columns: 3,
        items: ['<div>A</div>', '<div>B</div>', '<div>C</div>'],
      })

      expect(html).toContain('grid-layout')
      expect(html).toContain('grid-template-columns: repeat(3, 1fr)')
    })
  })
})

describe('Screen Renderer', () => {
  describe('renderScreen', () => {
    it('renders basic screen', () => {
      const screen: ScreenDefinition = {
        title: 'Login',
        description: 'Please log in',
        fields: [
          { id: 'email', type: 'text', label: 'Email' },
          { id: 'password', type: 'text', label: 'Password', input_type: 'password' },
        ],
        actions: [
          { id: 'login', type: 'submit', label: 'Login', style: 'primary' },
        ],
      }
      const html = renderScreen(screen)

      expect(html).toContain('class="screen"')
      expect(html).toContain('Login')
      expect(html).toContain('Please log in')
      expect(html).toContain('Email')
      expect(html).toContain('Password')
    })

    it('renders screen without fields', () => {
      const screen: ScreenDefinition = {
        title: 'Empty Screen',
      }
      const html = renderScreen(screen)

      expect(html).toContain('Empty Screen')
    })
  })

  describe('renderWizardScreen', () => {
    it('renders wizard screen with progress', () => {
      const screen: ScreenDefinition = {
        title: 'Registration',
        wizard: {
          show_progress: true,
          allow_back: true,
          steps: [
            {
              id: 'step1',
              title: 'Step 1',
              fields: [{ id: 'name', type: 'text', label: 'Name' }],
            },
            {
              id: 'step2',
              title: 'Step 2',
              fields: [{ id: 'email', type: 'text', label: 'Email' }],
            },
          ],
        },
      }
      const html = renderWizardScreen(screen, 0)

      expect(html).toContain('wizard-screen')
      expect(html).toContain('wizard-progress')
      expect(html).toContain('Step 1')
      expect(html).toContain('Step 2')
    })

    it('renders correct step', () => {
      const screen: ScreenDefinition = {
        title: 'Wizard',
        wizard: {
          steps: [
            {
              id: 'step1',
              title: 'First',
              fields: [{ id: 'a', type: 'text', label: 'A' }],
            },
            {
              id: 'step2',
              title: 'Second',
              fields: [{ id: 'b', type: 'text', label: 'B' }],
            },
          ],
        },
      }

      const html1 = renderWizardScreen(screen, 0)
      const html2 = renderWizardScreen(screen, 1)

      expect(html1).toContain('wizard-next')
      expect(html1).not.toContain('wizard-back')

      expect(html2).toContain('wizard-back')
      expect(html2).toContain('wizard-submit')
    })
  })
})

// =============================================================================
// Phase 3 Tests - Component Classes
// =============================================================================

// Simple DOM mock for testing
function createMockContainer(): HTMLElement {
  const container = document.createElement('div')
  document.body.appendChild(container)
  return container
}

function cleanupContainer(container: HTMLElement): void {
  container.remove()
}

// =============================================================================
// Wizard Tests
// =============================================================================

describe('Wizard', () => {
  let container: HTMLElement

  const basicWizardConfig: WizardConfig = {
    steps: [
      {
        id: 'step1',
        title: 'Basic Info',
        description: 'Enter your basic information',
        fields: [
          { id: 'name', type: 'text', label: 'Name', required: true },
          { id: 'email', type: 'text', label: 'Email', input_type: 'email' },
        ],
      },
      {
        id: 'step2',
        title: 'Preferences',
        fields: [
          { id: 'theme', type: 'select', label: 'Theme', options: [
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]},
        ],
      },
      {
        id: 'step3',
        title: 'Review',
        fields: [],
      },
    ],
    show_progress: true,
    allow_back: true,
  }

  beforeEach(() => {
    container = createMockContainer()
  })

  afterEach(() => {
    cleanupContainer(container)
  })

  it('should initialize with correct state', () => {
    const wizard = new Wizard(basicWizardConfig, container)
    const state = wizard.getState()

    expect(state.currentStep).toBe(0)
    expect(state.totalSteps).toBe(3)
    expect(state.completedSteps.size).toBe(0)
    expect(state.skippedSteps.size).toBe(0)
  })

  it('should render wizard with step indicator', () => {
    const wizard = new Wizard(basicWizardConfig, container)
    wizard.render()

    expect(container.querySelector('.wizard-indicator')).toBeTruthy()
    expect(container.querySelectorAll('.wizard-step').length).toBe(3)
    expect(container.querySelector('.wizard-progress')).toBeTruthy()
  })

  it('should display current step title and description', () => {
    const wizard = new Wizard(basicWizardConfig, container)
    wizard.render()

    expect(container.querySelector('.wizard-step-title')?.textContent).toBe('Basic Info')
    expect(container.querySelector('.wizard-step-description')?.textContent).toBe('Enter your basic information')
  })

  it('should navigate to next step', () => {
    const onStepChange = vi.fn()
    const wizard = new Wizard(basicWizardConfig, container, { onStepChange })
    wizard.render()

    const result = wizard.nextStep()

    expect(result).toBe(true)
    expect(wizard.getState().currentStep).toBe(1)
    expect(onStepChange).toHaveBeenCalledWith(1, expect.any(Object))
  })

  it('should navigate to previous step', () => {
    const wizard = new Wizard(basicWizardConfig, container)
    wizard.render()
    wizard.nextStep()

    const result = wizard.previousStep()

    expect(result).toBe(true)
    expect(wizard.getState().currentStep).toBe(0)
  })

  it('should not go back from first step', () => {
    const wizard = new Wizard(basicWizardConfig, container)
    wizard.render()

    const result = wizard.previousStep()

    expect(result).toBe(false)
    expect(wizard.getState().currentStep).toBe(0)
  })

  it('should mark steps as completed', () => {
    const wizard = new Wizard(basicWizardConfig, container)
    wizard.render()
    wizard.nextStep()

    expect(wizard.getState().completedSteps.has(0)).toBe(true)
  })

  it('should allow jumping to completed steps', () => {
    const wizard = new Wizard(basicWizardConfig, container)
    wizard.render()
    wizard.nextStep()
    wizard.nextStep()

    const result = wizard.goToStep(0)

    expect(result).toBe(true)
    expect(wizard.getState().currentStep).toBe(0)
  })

  it('should not allow jumping to future uncompleted steps', () => {
    const wizard = new Wizard(basicWizardConfig, container)
    wizard.render()

    const result = wizard.goToStep(2)

    expect(result).toBe(false)
    expect(wizard.getState().currentStep).toBe(0)
  })

  it('should call onComplete when finishing last step', () => {
    const onComplete = vi.fn()
    const wizard = new Wizard(basicWizardConfig, container, { onComplete })
    wizard.render()
    wizard.nextStep()
    wizard.nextStep()
    wizard.nextStep()

    expect(onComplete).toHaveBeenCalled()
  })

  it('should update step data', () => {
    const wizard = new Wizard(basicWizardConfig, container)
    wizard.render()

    wizard.updateStepData('step1', { name: 'John', email: 'john@example.com' })

    expect(wizard.getState().stepData.step1).toEqual({ name: 'John', email: 'john@example.com' })
  })

  it('should get current step config', () => {
    const wizard = new Wizard(basicWizardConfig, container)
    wizard.render()

    const stepConfig = wizard.getCurrentStepConfig()

    expect(stepConfig.id).toBe('step1')
    expect(stepConfig.title).toBe('Basic Info')
  })

  // ===========================================================================
  // Stepper Extensions Tests
  // ===========================================================================

  describe('Stepper Extensions', () => {
    it('should initialize with horizontal layout by default', () => {
      const wizard = new Wizard(basicWizardConfig, container)
      const state = wizard.getState()

      expect(state.layout).toBe('horizontal')
    })

    it('should support vertical layout', () => {
      const verticalConfig: WizardConfig = {
        ...basicWizardConfig,
        layout: 'vertical',
      }
      const wizard = new Wizard(verticalConfig, container)
      wizard.render()

      expect(wizard.getState().layout).toBe('vertical')
      expect(container.classList.contains('wizard-vertical')).toBe(true)
    })

    it('should change layout dynamically', () => {
      const wizard = new Wizard(basicWizardConfig, container)
      wizard.render()

      expect(container.classList.contains('wizard-horizontal')).toBe(true)

      wizard.setLayout('vertical')

      expect(wizard.getState().layout).toBe('vertical')
      expect(container.classList.contains('wizard-vertical')).toBe(true)
    })

    it('should support subtitle in steps', () => {
      const configWithSubtitle: WizardConfig = {
        ...basicWizardConfig,
        steps: [
          {
            id: 'step1',
            title: 'Basic Info',
            subtitle: 'Required information',
            description: 'Enter your basic information',
            fields: [{ id: 'name', type: 'text', label: 'Name' }],
          },
          {
            id: 'step2',
            title: 'Preferences',
            subtitle: 'Optional settings',
            fields: [],
          },
        ],
      }
      const wizard = new Wizard(configWithSubtitle, container)
      wizard.render()

      expect(container.querySelector('.wizard-step-subtitle')?.textContent).toBe('Required information')
      expect(container.querySelectorAll('.step-subtitle').length).toBe(2)
    })

    it('should support step status: completed', () => {
      const configWithStatus: WizardConfig = {
        ...basicWizardConfig,
        steps: [
          {
            id: 'step1',
            title: 'Step 1',
            fields: [],
            status: 'completed',
          },
          {
            id: 'step2',
            title: 'Step 2',
            fields: [],
          },
        ],
      }
      const wizard = new Wizard(configWithStatus, container)
      wizard.render()

      const firstStep = container.querySelector('[data-step-index="0"]')
      expect(firstStep?.getAttribute('data-step-status')).toBe('completed')
      expect(firstStep?.classList.contains('status-completed')).toBe(true)
    })

    it('should support step status: error', () => {
      const configWithError: WizardConfig = {
        steps: [
          {
            id: 'step1',
            title: 'Step 1',
            fields: [],
            status: 'error',
          },
        ],
      }
      const wizard = new Wizard(configWithError, container)
      wizard.render()

      const step = container.querySelector('[data-step-index="0"]')
      expect(step?.getAttribute('data-step-status')).toBe('error')
      expect(step?.classList.contains('status-error')).toBe(true)
    })

    it('should support step status: warning', () => {
      const wizard = new Wizard(basicWizardConfig, container)
      wizard.render()

      wizard.setStepStatus(0, 'warning')

      const step = container.querySelector('[data-step-index="0"]')
      expect(step?.getAttribute('data-step-status')).toBe('warning')
      expect(step?.classList.contains('status-warning')).toBe(true)
    })

    it('should support step status with text', () => {
      const configWithStatusText: WizardConfig = {
        steps: [
          {
            id: 'step1',
            title: 'Step 1',
            fields: [],
            status: { type: 'error', text: 'Validation failed' },
          },
        ],
      }
      const wizard = new Wizard(configWithStatusText, container)
      wizard.render()

      expect(container.querySelector('.step-status-text')?.textContent).toBe('Validation failed')
    })

    it('should get and set step status', () => {
      const wizard = new Wizard(basicWizardConfig, container)
      wizard.render()

      expect(wizard.getStepStatus(0)).toBeUndefined()

      wizard.setStepStatus(0, 'completed')
      expect(wizard.getStepStatus(0)).toBe('completed')

      wizard.setStepStatus(1, { type: 'error', text: 'Failed' })
      const status = wizard.getStepStatus(1)
      expect(typeof status).toBe('object')
      expect((status as { type: string }).type).toBe('error')
    })

    it('should support clickable_steps option', () => {
      const configClickable: WizardConfig = {
        ...basicWizardConfig,
        clickable_steps: true,
      }
      const wizard = new Wizard(configClickable, container)
      wizard.render()
      wizard.nextStep()

      const firstStep = container.querySelector('[data-step-index="0"]')
      expect(firstStep?.classList.contains('clickable')).toBe(true)
    })

    it('should disable clickable steps when clickable_steps is false', () => {
      const configNotClickable: WizardConfig = {
        ...basicWizardConfig,
        clickable_steps: false,
      }
      const wizard = new Wizard(configNotClickable, container)
      wizard.render()
      wizard.nextStep()

      const firstStep = container.querySelector('[data-step-index="0"]')
      expect(firstStep?.classList.contains('clickable')).toBe(false)
    })

    it('should call onStepClick callback when step is clicked', () => {
      const onStepClick = vi.fn()
      const wizard = new Wizard(basicWizardConfig, container, { onStepClick })
      wizard.render()
      wizard.nextStep()

      const firstStep = container.querySelector('[data-step-index="0"]') as HTMLElement
      firstStep?.click()

      expect(onStepClick).toHaveBeenCalledWith(0, expect.any(Object))
    })

    it('should initialize with activeIndex', () => {
      const configWithActiveIndex: WizardConfig = {
        ...basicWizardConfig,
        activeIndex: 1,
      }
      const wizard = new Wizard(configWithActiveIndex, container)

      expect(wizard.getState().currentStep).toBe(1)
    })

    it('should render vertical layout with connectors', () => {
      const verticalConfig: WizardConfig = {
        ...basicWizardConfig,
        layout: 'vertical',
      }
      const wizard = new Wizard(verticalConfig, container)
      wizard.render()

      // 2 connectors for 3 steps
      expect(container.querySelectorAll('.wizard-step-connector').length).toBe(2)
    })

    it('should skip step with skippable property', () => {
      const configWithSkippable: WizardConfig = {
        steps: [
          {
            id: 'step1',
            title: 'Step 1',
            fields: [],
            skippable: true,
          },
          {
            id: 'step2',
            title: 'Step 2',
            fields: [],
          },
        ],
      }
      const wizard = new Wizard(configWithSkippable, container)
      wizard.render()

      const result = wizard.skipStep()

      expect(result).toBe(true)
      expect(wizard.getState().currentStep).toBe(1)
      expect(wizard.getState().skippedSteps.has(0)).toBe(true)
    })

    it('should not skip step without skippable property', () => {
      const wizard = new Wizard(basicWizardConfig, container)
      wizard.render()

      const result = wizard.skipStep()

      expect(result).toBe(false)
      expect(wizard.getState().currentStep).toBe(0)
    })

    it('should display skippable badge in content header', () => {
      const configWithSkippable: WizardConfig = {
        steps: [
          {
            id: 'step1',
            title: 'Step 1',
            fields: [],
            skippable: true,
          },
        ],
      }
      const wizard = new Wizard(configWithSkippable, container)
      wizard.render()

      expect(container.querySelector('.skippable-badge')?.textContent).toBe('Optional')
    })

    it('should display status badge in content header for error status', () => {
      const wizard = new Wizard(basicWizardConfig, container)
      wizard.render()
      wizard.setStepStatus(0, { type: 'error', text: 'Fix required' })

      expect(container.querySelector('.wizard-status-badge.status-error')?.textContent).toBe('Fix required')
    })
  })
})

// =============================================================================
// Repeater Tests
// =============================================================================

describe('Repeater', () => {
  let container: HTMLElement

  const basicRepeaterConfig: RepeaterField = {
    id: 'items',
    type: 'repeater',
    label: 'Order Items',
    min_items: 1,
    max_items: 5,
    add_button_label: 'Add Item',
    show_remove_button: true,
    sortable: true,
    item_fields: [
      {
        id: 'product',
        type: 'select',
        label: 'Product',
        options: [
          { value: 'prod1', label: 'Product 1' },
          { value: 'prod2', label: 'Product 2' },
        ],
      },
      { id: 'quantity', type: 'number', label: 'Quantity', min: 1, max: 100 },
    ],
  }

  beforeEach(() => {
    container = createMockContainer()
  })

  afterEach(() => {
    cleanupContainer(container)
  })

  it('should initialize with min_items', () => {
    const repeater = new Repeater(basicRepeaterConfig, container)
    const state = repeater.getState()

    expect(state.items.length).toBe(1) // min_items = 1
    expect(state.nestLevel).toBe(0)
  })

  it('should render repeater with header and footer', () => {
    const repeater = new Repeater(basicRepeaterConfig, container)
    repeater.render()

    expect(container.querySelector('.repeater-header')).toBeTruthy()
    expect(container.querySelector('.repeater-footer')).toBeTruthy()
    expect(container.querySelector('.repeater-add-btn')?.textContent).toBe('Add Item')
  })

  it('should add items', () => {
    const onChange = vi.fn()
    const repeater = new Repeater(basicRepeaterConfig, container, { onChange })
    repeater.render()

    const item = repeater.addItem()

    expect(item).toBeTruthy()
    expect(repeater.getState().items.length).toBe(2)
    expect(onChange).toHaveBeenCalled()
  })

  it('should not exceed max_items', () => {
    const repeater = new Repeater(basicRepeaterConfig, container)
    repeater.render()

    // Add items up to max
    repeater.addItem()
    repeater.addItem()
    repeater.addItem()
    repeater.addItem()

    // Try to exceed max
    const item = repeater.addItem()

    expect(item).toBeNull()
    expect(repeater.getState().items.length).toBe(5)
  })

  it('should remove items', () => {
    const onRemove = vi.fn()
    const repeater = new Repeater(basicRepeaterConfig, container, { onRemove })
    repeater.render()
    repeater.addItem()

    const state = repeater.getState()
    const itemId = state.items[1].id

    const result = repeater.removeItem(itemId)

    expect(result).toBe(true)
    expect(repeater.getState().items.length).toBe(1)
    expect(onRemove).toHaveBeenCalledWith(itemId, expect.any(Object))
  })

  it('should not go below min_items', () => {
    const repeater = new Repeater(basicRepeaterConfig, container)
    repeater.render()

    const state = repeater.getState()
    const result = repeater.removeItem(state.items[0].id)

    expect(result).toBe(false)
    expect(repeater.getState().items.length).toBe(1)
  })

  it('should update item data', () => {
    const repeater = new Repeater(basicRepeaterConfig, container)
    repeater.render()

    const state = repeater.getState()
    const itemId = state.items[0].id

    repeater.updateItemData(itemId, { product: 'prod1', quantity: 5 })

    expect(repeater.getState().items[0].data).toEqual({ product: 'prod1', quantity: 5 })
  })

  it('should toggle item expanded state', () => {
    const repeater = new Repeater(basicRepeaterConfig, container)
    repeater.render()

    const state = repeater.getState()
    const itemId = state.items[0].id
    expect(state.items[0].expanded).toBe(true)

    repeater.toggleItemExpanded(itemId)

    expect(repeater.getState().items[0].expanded).toBe(false)
  })

  it('should move items up and down', () => {
    const repeater = new Repeater(basicRepeaterConfig, container)
    repeater.render()
    repeater.addItem()
    repeater.addItem()

    const state = repeater.getState()
    const secondItemId = state.items[1].id

    const result = repeater.moveItemUp(secondItemId)

    expect(result).toBe(true)
    expect(repeater.getState().items[0].id).toBe(secondItemId)
  })

  it('should add items with dummy data', () => {
    const repeater = new Repeater(basicRepeaterConfig, container)
    repeater.render()

    const item = repeater.addItem(true)

    expect(item).toBeTruthy()
    expect(item?.data.product).toBeDefined()
    expect(item?.data.quantity).toBeDefined()
  })

  it('should initialize with dummy data', () => {
    const repeater = new Repeater(basicRepeaterConfig, container)
    repeater.initWithDummyData(3)

    expect(repeater.getState().items.length).toBe(3)
    repeater.getState().items.forEach(item => {
      expect(Object.keys(item.data).length).toBeGreaterThan(0)
    })
  })

  it('should get value for form submission', () => {
    const repeater = new Repeater(basicRepeaterConfig, container)
    repeater.render()
    repeater.addItem(true)

    const value = repeater.getValue()

    expect(Array.isArray(value)).toBe(true)
    expect(value.length).toBe(2)
  })

  it('should respect nest level', () => {
    const repeater = new Repeater(basicRepeaterConfig, container, {}, 1)
    repeater.render()

    // The nest-level class is applied to the container itself
    expect(container.classList.contains('nest-level-1')).toBe(true)
    expect(repeater.getState().nestLevel).toBe(1)
  })
})

// =============================================================================
// Tabs Tests
// =============================================================================

describe('Tabs', () => {
  let container: HTMLElement

  const basicTabsConfig = {
    tabs: [
      { id: 'tab1', label: 'General', content: '<p>General content</p>' },
      { id: 'tab2', label: 'Settings', content: '<p>Settings content</p>' },
      { id: 'tab3', label: 'Advanced', content: '<p>Advanced content</p>', disabled: true },
    ] as TabDefinition[],
  }

  beforeEach(() => {
    container = createMockContainer()
  })

  afterEach(() => {
    cleanupContainer(container)
  })

  it('should initialize with first enabled tab active', () => {
    const tabs = new Tabs(basicTabsConfig, container)
    const state = tabs.getState()

    expect(state.activeTabId).toBe('tab1')
    expect(state.tabs.length).toBe(3)
  })

  it('should render tabs with tab list and panels', () => {
    const tabs = new Tabs(basicTabsConfig, container)
    tabs.render()

    expect(container.querySelector('.tabs-list')).toBeTruthy()
    expect(container.querySelectorAll('.tab-button').length).toBe(3)
    expect(container.querySelectorAll('.tab-panel').length).toBe(3)
  })

  it('should switch tabs', () => {
    const onTabChange = vi.fn()
    const tabs = new Tabs(basicTabsConfig, container, { onTabChange })
    tabs.render()

    const result = tabs.setActiveTab('tab2')

    expect(result).toBe(true)
    expect(tabs.getState().activeTabId).toBe('tab2')
    expect(onTabChange).toHaveBeenCalledWith('tab2', expect.any(Object))
  })

  it('should not switch to disabled tab', () => {
    const tabs = new Tabs(basicTabsConfig, container)
    tabs.render()

    const result = tabs.setActiveTab('tab3')

    expect(result).toBe(false)
    expect(tabs.getState().activeTabId).toBe('tab1')
  })

  it('should navigate to next tab', () => {
    const tabs = new Tabs(basicTabsConfig, container)
    tabs.render()

    const result = tabs.nextTab()

    expect(result).toBe(true)
    expect(tabs.getState().activeTabId).toBe('tab2')
  })

  it('should skip disabled tabs when navigating', () => {
    const tabs = new Tabs(basicTabsConfig, container)
    tabs.render()
    tabs.setActiveTab('tab2')

    const result = tabs.nextTab()

    // Should cycle back to tab1, skipping disabled tab3
    expect(result).toBe(true)
    expect(tabs.getState().activeTabId).toBe('tab1')
  })

  it('should navigate to previous tab', () => {
    const tabs = new Tabs(basicTabsConfig, container)
    tabs.render()
    tabs.setActiveTab('tab2')

    const result = tabs.previousTab()

    expect(result).toBe(true)
    expect(tabs.getState().activeTabId).toBe('tab1')
  })

  it('should get active tab', () => {
    const tabs = new Tabs(basicTabsConfig, container)
    tabs.render()

    const activeTab = tabs.getActiveTab()

    expect(activeTab?.id).toBe('tab1')
    expect(activeTab?.label).toBe('General')
  })

  it('should add tab', () => {
    const tabs = new Tabs(basicTabsConfig, container)
    tabs.render()

    tabs.addTab({ id: 'tab4', label: 'New Tab', content: '<p>New</p>' })

    expect(tabs.getState().tabs.length).toBe(4)
    expect(tabs.getState().tabs[3].id).toBe('tab4')
  })

  it('should add tab at specific index', () => {
    const tabs = new Tabs(basicTabsConfig, container)
    tabs.render()

    tabs.addTab({ id: 'tab4', label: 'New Tab', content: '<p>New</p>' }, 1)

    expect(tabs.getState().tabs[1].id).toBe('tab4')
  })

  it('should remove tab', () => {
    const tabs = new Tabs(basicTabsConfig, container)
    tabs.render()

    const result = tabs.removeTab('tab2')

    expect(result).toBe(true)
    expect(tabs.getState().tabs.length).toBe(2)
    expect(tabs.getState().tabs.find(t => t.id === 'tab2')).toBeUndefined()
  })

  it('should switch active tab when active tab is removed', () => {
    const tabs = new Tabs(basicTabsConfig, container)
    tabs.render()

    tabs.removeTab('tab1')

    expect(tabs.getState().activeTabId).toBe('tab2')
  })

  it('should update tab', () => {
    const tabs = new Tabs(basicTabsConfig, container)
    tabs.render()

    const result = tabs.updateTab('tab1', { label: 'Updated Label', badge: 5 })

    expect(result).toBe(true)
    expect(tabs.getState().tabs[0].label).toBe('Updated Label')
    expect(tabs.getState().tabs[0].badge).toBe(5)
  })

  it('should support different positions', () => {
    const tabs = new Tabs({ ...basicTabsConfig, position: 'left' }, container)
    tabs.render()

    // The position class is applied to the container itself
    expect(container.classList.contains('tabs-left')).toBe(true)
  })

  it('should support different variants', () => {
    const tabs = new Tabs({ ...basicTabsConfig, variant: 'pills' }, container)
    tabs.render()

    // The variant class is applied to the container itself
    expect(container.classList.contains('tabs-pills')).toBe(true)
  })

  it('should respect defaultActiveTab', () => {
    const tabs = new Tabs({ ...basicTabsConfig, defaultActiveTab: 'tab2' }, container)

    expect(tabs.getState().activeTabId).toBe('tab2')
  })

  describe('URL Hash Sync', () => {
    beforeEach(() => {
      // Clear hash before each test
      window.location.hash = ''
    })

    afterEach(() => {
      // Clear hash after each test
      window.location.hash = ''
    })

    it('should sync to URL hash when syncWithHash is enabled', () => {
      const tabs = new Tabs({ ...basicTabsConfig, syncWithHash: true }, container)
      tabs.render()
      tabs.setActiveTab('tab2')

      expect(window.location.hash).toBe('#tab2')
    })

    it('should not sync to URL hash when syncWithHash is disabled', () => {
      const tabs = new Tabs({ ...basicTabsConfig, syncWithHash: false }, container)
      tabs.render()
      tabs.setActiveTab('tab2')

      expect(window.location.hash).toBe('')
    })

    it('should initialize from URL hash when syncWithHash is enabled', () => {
      window.location.hash = '#tab2'
      const tabs = new Tabs({ ...basicTabsConfig, syncWithHash: true }, container)
      tabs.render()

      expect(tabs.getState().activeTabId).toBe('tab2')
    })

    it('should use custom hash prefix', () => {
      const tabs = new Tabs({
        ...basicTabsConfig,
        syncWithHash: true,
        hashPrefix: 'section-',
      }, container)
      tabs.render()
      tabs.setActiveTab('tab2')

      expect(window.location.hash).toBe('#section-tab2')
    })

    it('should respond to hashchange event', async () => {
      const tabs = new Tabs({ ...basicTabsConfig, syncWithHash: true }, container)
      tabs.render()

      // Simulate hash change
      window.location.hash = '#tab2'
      window.dispatchEvent(new HashChangeEvent('hashchange'))

      // Wait for async handling
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(tabs.getState().activeTabId).toBe('tab2')
    })

    it('should ignore invalid hash values', () => {
      window.location.hash = '#invalid-tab'
      const tabs = new Tabs({ ...basicTabsConfig, syncWithHash: true }, container)
      tabs.render()

      // Should fall back to default (first enabled tab)
      expect(tabs.getState().activeTabId).toBe('tab1')
    })

    it('should cleanup hashchange listener on destroy', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
      const tabs = new Tabs({ ...basicTabsConfig, syncWithHash: true }, container)
      tabs.render()
      tabs.destroy()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('hashchange', expect.any(Function))
      removeEventListenerSpy.mockRestore()
    })
  })

  describe('Lazy Loading', () => {
    it('should support lazy content loader', async () => {
      const lazyLoader = vi.fn().mockResolvedValue('<p>Loaded content</p>')
      const tabsConfig = {
        tabs: [
          { id: 'tab1', label: 'Tab 1', lazyLoad: lazyLoader },
          { id: 'tab2', label: 'Tab 2', content: '<p>Static content</p>' },
        ] as TabDefinition[],
      }

      const tabs = new Tabs(tabsConfig, container)
      tabs.render()

      // Should call lazy loader for the active tab
      await new Promise(resolve => setTimeout(resolve, 0))
      expect(lazyLoader).toHaveBeenCalledWith('tab1')
    })

    it('should cache lazy loaded content', async () => {
      const lazyLoader = vi.fn().mockResolvedValue('<p>Loaded content</p>')
      const tabsConfig = {
        tabs: [
          { id: 'tab1', label: 'Tab 1', lazyLoad: lazyLoader },
          { id: 'tab2', label: 'Tab 2', content: '<p>Static content</p>' },
        ] as TabDefinition[],
      }

      const tabs = new Tabs(tabsConfig, container)
      tabs.render()

      // Wait for initial load
      await new Promise(resolve => setTimeout(resolve, 0))
      expect(lazyLoader).toHaveBeenCalledTimes(1)

      // Switch away and back
      tabs.setActiveTab('tab2')
      tabs.setActiveTab('tab1')

      // Should not call lazy loader again (cached)
      await new Promise(resolve => setTimeout(resolve, 0))
      expect(lazyLoader).toHaveBeenCalledTimes(1)
    })

    it('should show loading indicator during lazy load', () => {
      const lazyLoader = vi.fn().mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve('<p>Loaded</p>'), 100)
      }))
      const tabsConfig = {
        tabs: [
          { id: 'tab1', label: 'Tab 1', lazyLoad: lazyLoader },
        ] as TabDefinition[],
      }

      const tabs = new Tabs(tabsConfig, container)
      tabs.render()

      expect(container.querySelector('.tab-loading')).toBeTruthy()
    })

    it('should handle lazy load errors gracefully', async () => {
      const lazyLoader = vi.fn().mockRejectedValue(new Error('Load failed'))
      const tabsConfig = {
        tabs: [
          { id: 'tab1', label: 'Tab 1', lazyLoad: lazyLoader },
        ] as TabDefinition[],
      }

      const tabs = new Tabs(tabsConfig, container)
      tabs.render()

      // Wait for load to fail
      await new Promise(resolve => setTimeout(resolve, 0))

      // Should show error message
      expect(container.querySelector('.tab-error')).toBeTruthy()
    })

    it('should reload content with refreshTabContent', async () => {
      const lazyLoader = vi.fn().mockResolvedValue('<p>Loaded content</p>')
      const tabsConfig = {
        tabs: [
          { id: 'tab1', label: 'Tab 1', lazyLoad: lazyLoader },
        ] as TabDefinition[],
      }

      const tabs = new Tabs(tabsConfig, container)
      tabs.render()

      // Wait for initial load
      await new Promise(resolve => setTimeout(resolve, 0))
      expect(lazyLoader).toHaveBeenCalledTimes(1)

      // Force refresh
      await tabs.refreshTabContent('tab1')
      expect(lazyLoader).toHaveBeenCalledTimes(2)
    })
  })
})

// =============================================================================
// Toggle Tests
// =============================================================================

describe('Toggle', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = createMockContainer()
  })

  afterEach(() => {
    cleanupContainer(container)
  })

  it('should initialize with default unchecked state', () => {
    const toggle = new Toggle(container)
    const state = toggle.getState()

    expect(state.checked).toBe(false)
    expect(state.disabled).toBe(false)
  })

  it('should initialize with configured checked state', () => {
    const toggle = new Toggle(container, { defaultChecked: true })

    expect(toggle.isChecked()).toBe(true)
  })

  it('should initialize as disabled', () => {
    const toggle = new Toggle(container, { disabled: true })

    expect(toggle.isDisabled()).toBe(true)
  })

  it('should render toggle with checkbox', () => {
    const toggle = new Toggle(container)
    toggle.render()

    expect(container.querySelector('.toggle-checkbox')).toBeTruthy()
    expect(container.querySelector('.toggle-switch')).toBeTruthy()
    expect(container.querySelector('.toggle-label')).toBeTruthy()
  })

  it('should render with correct label for unchecked state', () => {
    const toggle = new Toggle(container)
    toggle.render()

    const label = container.querySelector('.toggle-label')
    expect(label?.textContent).toBe('OFF')
    expect(label?.classList.contains('unchecked')).toBe(true)
  })

  it('should render with correct label for checked state', () => {
    const toggle = new Toggle(container, { defaultChecked: true })
    toggle.render()

    const label = container.querySelector('.toggle-label')
    expect(label?.textContent).toBe('ON')
    expect(label?.classList.contains('checked')).toBe(true)
  })

  it('should use custom labels', () => {
    const toggle = new Toggle(container, {
      checkedLabel: 'Active',
      uncheckedLabel: 'Inactive',
    })
    toggle.render()

    expect(container.querySelector('.toggle-label')?.textContent).toBe('Inactive')

    toggle.setChecked(true)
    expect(container.querySelector('.toggle-label')?.textContent).toBe('Active')
  })

  it('should toggle state', () => {
    const onChange = vi.fn()
    const toggle = new Toggle(container, {}, { onChange })
    toggle.render()

    toggle.toggle()

    expect(toggle.isChecked()).toBe(true)
    expect(onChange).toHaveBeenCalledWith(true, expect.any(Object))
  })

  it('should set checked state', () => {
    const onChange = vi.fn()
    const toggle = new Toggle(container, {}, { onChange })
    toggle.render()

    toggle.setChecked(true)

    expect(toggle.isChecked()).toBe(true)
    expect(onChange).toHaveBeenCalledWith(true, expect.any(Object))
  })

  it('should not change state when disabled', () => {
    const onChange = vi.fn()
    const toggle = new Toggle(container, { disabled: true }, { onChange })
    toggle.render()

    toggle.setChecked(true)

    expect(toggle.isChecked()).toBe(false)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('should not trigger onChange when setting same state', () => {
    const onChange = vi.fn()
    const toggle = new Toggle(container, { defaultChecked: true }, { onChange })
    toggle.render()

    toggle.setChecked(true)

    expect(onChange).not.toHaveBeenCalled()
  })

  it('should set disabled state', () => {
    const toggle = new Toggle(container)
    toggle.render()

    toggle.setDisabled(true)

    expect(toggle.isDisabled()).toBe(true)
    expect(container.querySelector('.toggle-switch')?.classList.contains('disabled')).toBe(true)
  })

  it('should render with checked class when checked', () => {
    const toggle = new Toggle(container, { defaultChecked: true })
    toggle.render()

    expect(container.querySelector('.toggle-switch')?.classList.contains('checked')).toBe(true)
  })

  it('should render with correct accessibility attributes', () => {
    const toggle = new Toggle(container, { defaultChecked: true })
    toggle.render()

    const checkbox = container.querySelector('.toggle-checkbox') as HTMLInputElement
    expect(checkbox.getAttribute('role')).toBe('switch')
    expect(checkbox.getAttribute('aria-checked')).toBe('true')
  })

  it('should render with data-state attribute', () => {
    const toggle = new Toggle(container, { defaultChecked: true })
    toggle.render()

    expect(container.getAttribute('data-state')).toBe('checked')
    expect(container.querySelector('.toggle-switch')?.getAttribute('data-state')).toBe('checked')

    toggle.setChecked(false)
    expect(container.getAttribute('data-state')).toBe('unchecked')
  })

  it('should render with data-disabled attribute when disabled', () => {
    const toggle = new Toggle(container, { disabled: true })
    toggle.render()

    expect(container.hasAttribute('data-disabled')).toBe(true)
    expect(container.querySelector('.toggle-switch')?.hasAttribute('data-disabled')).toBe(true)
  })

  it('should support onCheckedChange callback (Radix UI compatible)', () => {
    const onCheckedChange = vi.fn()
    const toggle = new Toggle(container, {}, { onCheckedChange })
    toggle.render()

    toggle.setChecked(true)

    expect(onCheckedChange).toHaveBeenCalledWith(true)
  })

  it('should render disabled accessibility attributes', () => {
    const toggle = new Toggle(container, { disabled: true })
    toggle.render()

    const checkbox = container.querySelector('.toggle-checkbox') as HTMLInputElement
    expect(checkbox.getAttribute('aria-disabled')).toBe('true')
    expect(checkbox.hasAttribute('disabled')).toBe(true)
  })

  it('should support different sizes', () => {
    const smallToggle = new Toggle(container, { size: 'small' })
    smallToggle.render()
    expect(container.classList.contains('toggle-small')).toBe(true)

    const largeToggle = new Toggle(container, { size: 'large' })
    largeToggle.render()
    expect(container.classList.contains('toggle-large')).toBe(true)
  })

  it('should create toggle via factory function', () => {
    const toggle = createToggle(container, { defaultChecked: true })

    expect(toggle.isChecked()).toBe(true)
    expect(container.querySelector('.toggle-switch')).toBeTruthy()
  })

  it('should get state correctly', () => {
    const toggle = new Toggle(container, { defaultChecked: true, disabled: false })
    toggle.render()

    const state = toggle.getState()

    expect(state.checked).toBe(true)
    expect(state.disabled).toBe(false)
  })

  it('should support name attribute for forms', () => {
    const toggle = new Toggle(container, { name: 'publish_toggle' })
    toggle.render()

    const checkbox = container.querySelector('.toggle-checkbox') as HTMLInputElement
    expect(checkbox.getAttribute('name')).toBe('publish_toggle')
  })

  // テスト
  describe('Switch Extensions', () => {
    it('should render with default label position (right)', () => {
      const toggle = new Toggle(container)
      toggle.render()

      expect(container.classList.contains('toggle-label-right')).toBe(true)
    })

    it('should render with label on the left', () => {
      const toggle = new Toggle(container, { labelPosition: 'left' })
      toggle.render()

      expect(container.classList.contains('toggle-label-left')).toBe(true)

      const wrapper = container.querySelector('.toggle-wrapper')
      const firstChild = wrapper?.firstChild as HTMLElement
      expect(firstChild.classList.contains('toggle-label')).toBe(true)
    })

    it('should render with label on the right', () => {
      const toggle = new Toggle(container, { labelPosition: 'right' })
      toggle.render()

      expect(container.classList.contains('toggle-label-right')).toBe(true)

      const wrapper = container.querySelector('.toggle-wrapper')
      const lastChild = wrapper?.lastChild as HTMLElement
      expect(lastChild.classList.contains('toggle-label')).toBe(true)
    })

    it('should maintain label position when toggling state', () => {
      const toggle = new Toggle(container, { labelPosition: 'left' })
      toggle.render()

      toggle.setChecked(true)
      expect(container.classList.contains('toggle-label-left')).toBe(true)

      const wrapper = container.querySelector('.toggle-wrapper')
      const firstChild = wrapper?.firstChild as HTMLElement
      expect(firstChild.classList.contains('toggle-label')).toBe(true)
    })

    it('should support small size variant', () => {
      const toggle = new Toggle(container, { size: 'small' })
      toggle.render()

      expect(container.classList.contains('toggle-small')).toBe(true)
    })

    it('should support medium size variant (default)', () => {
      const toggle = new Toggle(container)
      toggle.render()

      expect(container.classList.contains('toggle-medium')).toBe(true)
    })

    it('should combine size and label position correctly', () => {
      const toggle = new Toggle(container, {
        size: 'small',
        labelPosition: 'left',
      })
      toggle.render()

      expect(container.classList.contains('toggle-small')).toBe(true)
      expect(container.classList.contains('toggle-label-left')).toBe(true)
    })
  })
})

// =============================================================================
// Dummy Data Generator Tests
// =============================================================================

// =============================================================================
// Data Table Tests
// =============================================================================

describe('DataTable', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = createMockContainer()
  })

  afterEach(() => {
    cleanupContainer(container)
  })

  const sampleData: DataTableRow[] = [
    { id: '1', name: '施設A', address: '東京都渋谷区', station: '渋谷駅', status: 'published' },
    { id: '2', name: '施設B', address: '東京都新宿区', station: '新宿駅', status: 'draft' },
    { id: '3', name: '施設C', address: '東京都港区', station: '六本木駅', status: 'published' },
  ]

  const basicConfig: DataTableField = {
    id: 'facilities',
    type: 'data_table',
    label: '施設一覧',
    columns: [
      { id: 'name', field: 'name', label: '施設名', sortable: true },
      { id: 'address', field: 'address', label: '住所', sortable: true },
      { id: 'station', field: 'station', label: '最寄駅' },
      {
        id: 'status',
        field: 'status',
        label: '公開ステータス',
        format: 'status',
        status_map: {
          published: { label: '公開中', color: 'success' },
          draft: { label: '下書き', color: 'warning' },
        },
      },
    ],
    data: sampleData,
    selection: 'multiple',
    row_actions: [
      { id: 'edit', label: '編集', style: 'link' },
      { id: 'delete', label: '削除', style: 'danger', confirm: { title: '確認', message: '削除しますか？' } },
    ],
    pagination: {
      enabled: true,
      page_size: 10,
    },
    hoverable: true,
  }

  it('should initialize with correct state', () => {
        const table = new DataTable(basicConfig, container)
    const state = table.getState()

    expect(state.data.length).toBe(3)
    expect(state.originalData.length).toBe(3)
    expect(state.currentPage).toBe(0)
    expect(state.pageSize).toBe(10)
    expect(state.selectedRowIds.size).toBe(0)
  })

  it('should render table with headers and rows', () => {
        const table = new DataTable(basicConfig, container)
    table.render()

    expect(container.querySelector('.mokkun-data-table')).toBeTruthy()
    expect(container.querySelector('.data-table-thead')).toBeTruthy()
    expect(container.querySelectorAll('.data-table-th').length).toBeGreaterThan(0)
    expect(container.querySelectorAll('.data-table-tr').length).toBe(3)
  })

  it('should render column headers correctly', () => {
        const table = new DataTable(basicConfig, container)
    table.render()

    const headers = container.querySelectorAll('.data-table-th')
    const headerTexts = Array.from(headers).map(h => h.textContent?.trim())

    expect(headerTexts).toContain('施設名')
    expect(headerTexts).toContain('住所')
    expect(headerTexts).toContain('最寄駅')
    expect(headerTexts).toContain('公開ステータス')
  })

  it('should render status badges', () => {
        const table = new DataTable(basicConfig, container)
    table.render()

    expect(container.querySelector('.status-success')).toBeTruthy()
    expect(container.querySelector('.status-warning')).toBeTruthy()
  })

  it('should handle row selection', () => {
    const onSelectionChange = vi.fn()
        const table = new DataTable(basicConfig, container, { onSelectionChange })
    table.render()

    table.selectRow('1')

    expect(table.getState().selectedRowIds.has('1')).toBe(true)
    expect(onSelectionChange).toHaveBeenCalled()
  })

  it('should toggle row selection', () => {
        const table = new DataTable(basicConfig, container)
    table.render()

    table.selectRow('1')
    expect(table.getState().selectedRowIds.has('1')).toBe(true)

    table.selectRow('1')
    expect(table.getState().selectedRowIds.has('1')).toBe(false)
  })

  it('should select all rows', () => {
        const table = new DataTable(basicConfig, container)
    table.render()

    table.selectAll(true)

    expect(table.getState().selectedRowIds.size).toBe(3)
  })

  it('should deselect all rows', () => {
        const table = new DataTable(basicConfig, container)
    table.render()

    table.selectAll(true)
    table.selectAll(false)

    expect(table.getState().selectedRowIds.size).toBe(0)
  })

  it('should get selected rows', () => {
        const table = new DataTable(basicConfig, container)
    table.render()

    table.selectRow('1')
    table.selectRow('2')

    const selected = table.getSelectedRows()
    expect(selected.length).toBe(2)
    expect(selected.map((r: DataTableRow) => r.id)).toContain('1')
    expect(selected.map((r: DataTableRow) => r.id)).toContain('2')
  })

  it('should sort data ascending', () => {
    const onSortChange = vi.fn()
        const table = new DataTable(basicConfig, container, { onSortChange })
    table.render()

    table.setSort('name', 'asc')

    const state = table.getState()
    expect(state.sort?.column).toBe('name')
    expect(state.sort?.direction).toBe('asc')
    expect(state.data[0].name).toBe('施設A')
    expect(onSortChange).toHaveBeenCalled()
  })

  it('should sort data descending', () => {
        const table = new DataTable(basicConfig, container)
    table.render()

    table.setSort('name', 'desc')

    const state = table.getState()
    expect(state.data[0].name).toBe('施設C')
  })

  it('should handle pagination', () => {
    const configWithSmallPage: DataTableField = {
      ...basicConfig,
      pagination: {
        enabled: true,
        page_size: 2,
      },
    }
        const table = new DataTable(configWithSmallPage, container)
    table.render()

    expect(table.getState().data.length).toBe(2)
    expect(table.getState().totalCount).toBe(3)
  })

  it('should navigate pages', () => {
    const onPageChange = vi.fn()
    const configWithSmallPage: DataTableField = {
      ...basicConfig,
      pagination: {
        enabled: true,
        page_size: 2,
      },
    }
        const table = new DataTable(configWithSmallPage, container, { onPageChange })
    table.render()

    table.setPage(1)

    expect(table.getState().currentPage).toBe(1)
    expect(table.getState().data.length).toBe(1)
    expect(onPageChange).toHaveBeenCalledWith(1, expect.any(Object))
  })

  it('should change page size', () => {
    const onPageSizeChange = vi.fn()
        const table = new DataTable(basicConfig, container, { onPageSizeChange })
    table.render()

    table.setPageSize(5)

    expect(table.getState().pageSize).toBe(5)
    expect(onPageSizeChange).toHaveBeenCalledWith(5, expect.any(Object))
  })

  it('should set data externally', () => {
        const table = new DataTable(basicConfig, container)
    table.render()

    const newData: DataTableRow[] = [
      { id: '10', name: '新施設', address: '大阪府', station: '梅田駅', status: 'draft' },
    ]
    table.setData(newData)

    expect(table.getState().data.length).toBe(1)
    expect(table.getState().data[0].name).toBe('新施設')
  })

  it('should render empty state when no data', () => {
    const emptyConfig: DataTableField = {
      ...basicConfig,
      data: [],
      empty_state: {
        title: 'データなし',
        description: 'まだ施設が登録されていません',
        icon: '📭',
      },
    }
        const table = new DataTable(emptyConfig, container)
    table.render()

    expect(container.querySelector('.empty-state')).toBeTruthy()
    expect(container.querySelector('.empty-state-title')?.textContent).toBe('データなし')
  })

  it('should render row actions', () => {
        const table = new DataTable(basicConfig, container)
    table.render()

    const actionBtns = container.querySelectorAll('.row-action-btn')
    expect(actionBtns.length).toBeGreaterThan(0)
  })

  it('should handle filter values', () => {
    const configWithFilters: DataTableField = {
      ...basicConfig,
      filters: {
        fields: [
          { id: 'search', label: '検索', column: 'name', type: 'text' },
          {
            id: 'status_filter',
            label: 'ステータス',
            column: 'status',
            type: 'select',
            options: [
              { value: 'published', label: '公開中' },
              { value: 'draft', label: '下書き' },
            ],
          },
        ],
      },
    }
    const onFilterChange = vi.fn()
        const table = new DataTable(configWithFilters, container, { onFilterChange })
    table.render()

    table.setFilterValues({ status_filter: 'published' })

    const state = table.getState()
    expect(state.filterValues.status_filter).toBe('published')
    expect(state.data.length).toBe(2) // Only published items
    expect(onFilterChange).toHaveBeenCalled()
  })

  it('should reset filters', () => {
    const configWithFilters: DataTableField = {
      ...basicConfig,
      filters: {
        fields: [
          { id: 'status_filter', label: 'ステータス', column: 'status', type: 'select' },
        ],
      },
    }
        const table = new DataTable(configWithFilters, container)
    table.render()

    table.setFilterValues({ status_filter: 'published' })
    expect(table.getState().data.length).toBe(2)

    table.resetFilters()
    expect(table.getState().data.length).toBe(3)
    expect(table.getState().filterValues).toEqual({})
  })

  it('should handle loading state', () => {
        const table = new DataTable(basicConfig, container)
    table.render()

    table.setLoading(true)
    expect(table.getState().isLoading).toBe(true)
    expect(container.querySelector('.data-table-loading')).toBeTruthy()

    table.setLoading(false)
    expect(table.getState().isLoading).toBe(false)
  })

  it('should render single selection mode', () => {
    const singleSelectConfig: DataTableField = {
      ...basicConfig,
      selection: 'single',
    }
        const table = new DataTable(singleSelectConfig, container)
    table.render()

    expect(container.querySelectorAll('.row-radio').length).toBe(3)
  })

  it('should handle single selection correctly', () => {
    const singleSelectConfig: DataTableField = {
      ...basicConfig,
      selection: 'single',
    }
        const table = new DataTable(singleSelectConfig, container)
    table.render()

    table.selectRow('1')
    table.selectRow('2')

    expect(table.getState().selectedRowIds.size).toBe(1)
    expect(table.getState().selectedRowIds.has('2')).toBe(true)
    expect(table.getState().selectedRowIds.has('1')).toBe(false)
  })

  it('should apply default sort', () => {
    const sortedConfig: DataTableField = {
      ...basicConfig,
      default_sort: { column: 'name', direction: 'desc' },
    }
        const table = new DataTable(sortedConfig, container)
    table.render()

    expect(table.getState().sort?.column).toBe('name')
    expect(table.getState().sort?.direction).toBe('desc')
  })
})

// Static renderer test
describe('renderDataTableField', () => {
  it('should render static HTML for data table', () => {
        const config: DataTableField = {
      id: 'test_table',
      type: 'data_table',
      label: 'テストテーブル',
      columns: [
        { id: 'col1', field: 'col1', label: 'カラム1' },
        { id: 'col2', field: 'col2', label: 'カラム2' },
      ],
      data: [
        { id: '1', col1: 'A', col2: 'B' },
        { id: '2', col1: 'C', col2: 'D' },
      ],
    }

    const html = renderDataTableField(config)

    expect(html).toContain('mokkun-data-table')
    expect(html).toContain('テストテーブル')
    expect(html).toContain('カラム1')
    expect(html).toContain('カラム2')
    expect(html).toContain('data-row-id="1"')
    expect(html).toContain('data-row-id="2"')
  })

  it('should render dummy data when no data provided', () => {
        const config: DataTableField = {
      id: 'empty_table',
      type: 'data_table',
      label: '空テーブル',
      columns: [
        { id: 'col1', field: 'col1', label: 'カラム1' },
      ],
      data: [],
      empty_state: {
        title: '空です',
        description: 'データがありません',
      },
    }

    const html = renderDataTableField(config)

    // ダミーデータが生成されるため、行が表示される
    expect(html).toContain('data-table-tr')
    expect(html).toContain('data-row-id')
  })
})

describe('End-to-End: YAML to HTML Pipeline', () => {
  it('should render data_table from parsed YAML', async () => {
    const { parseYaml } = await import('../parser/yaml-parser')
    const { renderScreen } = await import('../renderer/screen-renderer')

    const yaml = `
view:
  customer_list:
    title: 顧客一覧
    fields:
      - id: customers
        type: data_table
        label: 顧客リスト
        columns:
          - id: name
            label: 名前
          - id: email
            label: メールアドレス
        data:
          - id: 1
            name: 田中太郎
            email: tanaka@example.com
          - id: 2
            name: 鈴木花子
            email: suzuki@example.com
`

    const result = parseYaml(yaml)
    expect(result.success).toBe(true)

    if (result.success) {
      const screen = result.data.view.customer_list
      expect(screen).toBeDefined()
      expect(screen.fields).toHaveLength(1)
      expect(screen.fields?.[0].type).toBe('data_table')

      // 画面全体をレンダリング
      const html = renderScreen(screen)

      // data_tableがレンダリングされていることを確認
      expect(html).toContain('mokkun-data-table')
      expect(html).toContain('名前')
      expect(html).toContain('メールアドレス')
      expect(html).toContain('田中太郎')
      expect(html).toContain('tanaka@example.com')
      expect(html).toContain('鈴木花子')
      expect(html).toContain('suzuki@example.com')
    }
  })
})

describe('generateDummyData', () => {
  it('should generate text dummy data', () => {
    const field: InputField = { id: 'name', type: 'text', label: 'Name' }
    const data = generateDummyData(field, 0)

    expect(typeof data).toBe('string')
    expect(data).toContain('Name')
  })

  it('should generate email dummy data', () => {
    const field: InputField = { id: 'email', type: 'text', label: 'Email', input_type: 'email' }
    const data = generateDummyData(field, 0)

    expect(data).toContain('@example.com')
  })

  it('should generate number dummy data', () => {
    const field: InputField = { id: 'quantity', type: 'number', label: 'Quantity', min: 1, max: 100 }
    const data = generateDummyData(field, 0)

    expect(typeof data).toBe('number')
    expect(data).toBeGreaterThanOrEqual(1)
    expect(data).toBeLessThanOrEqual(100)
  })

  it('should generate select dummy data', () => {
    const field: InputField = {
      id: 'category',
      type: 'select',
      label: 'Category',
      options: [
        { value: 'cat1', label: 'Category 1' },
        { value: 'cat2', label: 'Category 2' },
      ],
    }
    const data = generateDummyData(field, 0)

    expect(data).toBe('cat1')
  })

  it('should generate date dummy data', () => {
    const field: InputField = { id: 'date', type: 'date_picker', label: 'Date' }
    const data = generateDummyData(field, 0)

    expect(typeof data).toBe('string')
    expect(data).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('should generate repeater item dummy data', () => {
    const itemFields: InputField[] = [
      { id: 'name', type: 'text', label: 'Name' },
      { id: 'quantity', type: 'number', label: 'Quantity', min: 1, max: 10 },
    ]

    const data = generateRepeaterItemDummyData(itemFields, 0)

    expect(data.name).toBeDefined()
    expect(data.quantity).toBeDefined()
    expect(typeof data.name).toBe('string')
    expect(typeof data.quantity).toBe('number')
  })
})

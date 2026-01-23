/**
 * Mokkun Renderer Components
 * UIコンポーネントのエクスポート
 */

// Phase 2 exports (existing)
export * from './components/form-fields'
export * from './components/layout'
export * from './screen-renderer'

// Phase 3 exports (new)
export { Wizard, type WizardState } from './components/wizard'
export { Repeater, type RepeaterState, type RepeaterItem } from './components/repeater'
export { Tabs, type TabsState } from './components/tabs'
export { renderField } from './components/field-renderer'
export { generateDummyData } from './utils/dummy-data'

// DataTable component
export {
  DataTable,
  type DataTableState,
  type DataTableCallbacks,
  renderDataTableField,
} from './components/data-table'

// FormSection component
export {
  FormSection,
  type FormSectionConfig,
  type FormSectionState,
  type FormSectionCallbacks,
  createConfigFromSchema,
  renderFormSections,
  renderFormSectionsWithDividers,
} from './components/form-section'

// ActionButtonGroup component
export {
  ActionButtonGroup,
  type ActionButton,
  type ActionButtonGroupConfig,
  type ActionButtonGroupState,
  type ActionButtonGroupCallbacks,
  type ButtonAlignment,
} from './components/action-buttons'

// Phase 5 exports - Delete Confirm Dialog
export {
  DeleteConfirmDialog,
  type DeleteConfirmDialogConfig,
  type DeleteConfirmDialogCallbacks,
  type DeleteConfirmDialogState,
  type DependencyInfo,
} from './components/delete-confirm-dialog'

// Action Handler
export {
  ActionHandler,
  attachActionHandler,
  showDeleteConfirmDialog,
  type ActionHandlerCallbacks,
  type DeleteConfirmExtendedConfig,
} from './action-handler'

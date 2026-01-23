/**
 * Dialog Types
 * ダイアログシステムの共通型定義
 */

// =============================================================================
// Dialog Sizes
// =============================================================================

export type DialogSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'FULL'

// =============================================================================
// Base Dialog Types
// =============================================================================

export interface BaseDialogConfig {
  // Core control
  isOpen?: boolean // External control (default: managed internally)

  // Size
  size?: DialogSize

  // Accessibility
  ariaLabel?: string
  ariaLabelledby?: string
  ariaDescribedby?: string
  firstFocusTarget?: 'first' | 'confirm' | 'cancel'

  // User interaction
  onClickOverlay?: () => void | boolean // Return false to prevent close
  onPressEscape?: () => void | boolean // Return false to prevent close
  closeOnOverlayClick?: boolean // Default: true
  closeOnEscape?: boolean // Default: true

  // Styling
  contentPadding?: 'normal' | 'compact' | 'none'
  className?: string
}

export interface BaseDialogCallbacks {
  onOpen?: () => void
  onClose?: () => void
  onAfterClose?: () => void // After animation completes
}

export interface BaseDialogState {
  isOpen: boolean
  previouslyFocusedElement: Element | null
}

// =============================================================================
// Action Dialog Types
// =============================================================================

export type DialogIcon = 'warning' | 'error' | 'info' | 'success' | 'custom'

export interface ActionDialogConfig extends BaseDialogConfig {
  // Content
  title: string
  message?: string
  icon?: DialogIcon
  customIcon?: string // SVG markup

  // Actions
  confirmLabel?: string
  cancelLabel?: string
  confirmDisabled?: boolean
  danger?: boolean // Danger mode styling

  // Layout
  showSubActionArea?: boolean
  subActionContent?: HTMLElement | string
}

export interface ActionDialogCallbacks extends BaseDialogCallbacks {
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
}

// =============================================================================
// Message Dialog Types
// =============================================================================

export interface MessageDialogConfig extends BaseDialogConfig {
  title: string
  message: string
  icon?: Exclude<DialogIcon, 'custom'> | 'custom'
  customIcon?: string
  closeLabel?: string // Default: "OK"
}

export interface MessageDialogCallbacks extends BaseDialogCallbacks {
  onAcknowledge?: () => void
}

// =============================================================================
// Modeless Dialog Types
// =============================================================================

export interface ModelessDialogPosition {
  top: number
  left: number
}

export interface ModelessDialogConfig
  extends Omit<BaseDialogConfig, 'closeOnOverlayClick'> {
  title: string
  position?: 'auto' | ModelessDialogPosition
  draggable?: boolean
  width?: number | string
  height?: number | string
}

export interface ModelessDialogCallbacks extends BaseDialogCallbacks {
  onMove?: (position: ModelessDialogPosition) => void
}

// =============================================================================
// Form Dialog Types
// =============================================================================

export interface FormDialogConfig extends BaseDialogConfig {
  title: string
  submitLabel?: string
  cancelLabel?: string
  preventCloseOnSubmit?: boolean
  warnOnUnsavedChanges?: boolean
}

export interface FormDialogCallbacks extends BaseDialogCallbacks {
  onSubmit?: (formData: FormData) => void | Promise<void>
  onCancel?: () => void
  onFormChange?: (isDirty: boolean) => void
}

// =============================================================================
// Legacy Delete Confirm Dialog Types (for backward compatibility)
// =============================================================================

export interface DependencyInfo {
  type: string
  label: string
  count: number
}

export interface DeleteConfirmDialogConfig extends ActionDialogConfig {
  targetName: string
  targetType?: string
  dependencies?: DependencyInfo[]
  warningMessage?: string
}

export interface DeleteConfirmDialogCallbacks extends ActionDialogCallbacks {}

export interface DeleteConfirmDialogState extends BaseDialogState {}

import { createElement } from '../utils/dom'
import { escapeHtml, createFieldWrapper } from '../utils/field-helpers'
import type { InputField } from '../../types/schema'

/**
 * Chip component state
 */
export interface ChipState {
  /** Whether the chip is selected */
  selected: boolean
  /** Whether the chip is disabled */
  disabled: boolean
}

/**
 * Chip component callbacks
 */
export interface ChipCallbacks {
  /** Called when chip is clicked (selection toggle) */
  onClick?: (selected: boolean, state: ChipState) => void
  /** Called when delete button is clicked */
  onDelete?: (state: ChipState) => void
}

/**
 * Chip component configuration
 */
export interface ChipConfig {
  /** Label text for the chip */
  label: string
  /** Icon to display before the label (emoji, SVG path, or HTML string) */
  icon?: string
  /** Whether to show delete button */
  deletable?: boolean
  /** Whether the chip is selected by default */
  selected?: boolean
  /** Whether the chip is disabled */
  disabled?: boolean
  /** Size variant */
  size?: 'small' | 'medium' | 'large'
  /** Color variant */
  color?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'
  /** Accessible label for screen readers */
  ariaLabel?: string
}

/**
 * Chip component
 *
 * A small UI element for displaying tags, filter conditions, or categories.
 * Supports selection toggle, delete button, icons, and color variations.
 *
 * @example
 * ```typescript
 * const chip = createChip(container, {
 *   label: 'JavaScript',
 *   icon: '🚀',
 *   deletable: true,
 *   color: 'primary'
 * }, {
 *   onClick: (selected) => console.log('Selected:', selected),
 *   onDelete: () => console.log('Deleted')
 * })
 * ```
 */
export class Chip {
  private config: ChipConfig
  private state: ChipState
  private callbacks: ChipCallbacks
  private container: HTMLElement

  constructor(
    container: HTMLElement,
    config: ChipConfig,
    callbacks: ChipCallbacks = {}
  ) {
    this.container = container
    this.config = {
      size: 'medium',
      color: 'default',
      deletable: false,
      selected: false,
      disabled: false,
      ...config,
    }
    this.callbacks = callbacks
    this.state = this.createInitialState()
  }

  /**
   * Create initial component state
   */
  private createInitialState(): ChipState {
    return {
      selected: this.config.selected ?? false,
      disabled: this.config.disabled ?? false,
    }
  }

  /**
   * Render the chip component
   */
  render(): void {
    this.container.innerHTML = ''
    const chipElement = this.renderChip()
    this.container.appendChild(chipElement)
  }

  /**
   * Render the chip element
   */
  private renderChip(): HTMLElement {
    const chipWrapper = createElement('div', {
      className: `mokkun-chip chip-${this.config.size} chip-${this.config.color}`,
      attributes: {
        role: 'button',
        'aria-label': this.config.ariaLabel || this.config.label,
        'aria-pressed': String(this.state.selected),
        'aria-disabled': String(this.state.disabled),
        tabindex: this.state.disabled ? '-1' : '0',
        'data-selected': String(this.state.selected),
        'data-disabled': String(this.state.disabled),
        'data-color': this.config.color || 'default',
      },
    })

    // Add event listeners for selection toggle
    if (!this.state.disabled) {
      chipWrapper.addEventListener('click', (e) => {
        // Don't toggle if clicking delete button
        const target = e.target as HTMLElement
        if (target.closest('.chip-delete-button')) {
          return
        }
        this.handleChipClick()
      })

      chipWrapper.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          // Don't toggle if focus is on delete button
          const target = e.target as HTMLElement
          if (target.closest('.chip-delete-button')) {
            return
          }
          this.handleChipClick()
        }
      })
    }

    // Create chip content container
    const chipContent = createElement('div', {
      className: 'chip-content',
    })

    // Add icon if provided
    if (this.config.icon) {
      const iconElement = createElement('span', {
        className: 'chip-icon',
        attributes: {
          'aria-hidden': 'true',
        },
      })

      // Check if icon is an emoji or HTML
      if (this.config.icon.startsWith('<')) {
        iconElement.innerHTML = this.config.icon
      } else {
        iconElement.textContent = this.config.icon
      }

      chipContent.appendChild(iconElement)
    }

    // Add label
    const labelElement = createElement('span', {
      className: 'chip-label',
      textContent: this.config.label,
    })
    chipContent.appendChild(labelElement)

    chipWrapper.appendChild(chipContent)

    // Add delete button if deletable
    if (this.config.deletable) {
      const deleteButton = this.renderDeleteButton()
      chipWrapper.appendChild(deleteButton)
    }

    return chipWrapper
  }

  /**
   * Render the delete button
   */
  private renderDeleteButton(): HTMLElement {
    const deleteButton = createElement('button', {
      className: 'chip-delete-button',
      attributes: {
        type: 'button',
        'aria-label': `Delete ${this.config.label}`,
        tabindex: this.state.disabled ? '-1' : '0',
      },
    })

    // Delete icon (×)
    const deleteIcon = createElement('span', {
      className: 'chip-delete-icon',
      attributes: {
        'aria-hidden': 'true',
      },
      textContent: '×',
    })
    deleteButton.appendChild(deleteIcon)

    // Add click handler
    if (!this.state.disabled) {
      deleteButton.addEventListener('click', (e) => {
        e.stopPropagation() // Prevent chip click
        this.handleDelete()
      })

      deleteButton.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          e.stopPropagation()
          this.handleDelete()
        }
      })
    }

    return deleteButton
  }

  /**
   * Handle chip click (selection toggle)
   */
  private handleChipClick(): void {
    if (this.state.disabled) {
      return
    }

    const newSelected = !this.state.selected
    this.setState({ selected: newSelected })

    if (this.callbacks.onClick) {
      this.callbacks.onClick(newSelected, { ...this.state })
    }
  }

  /**
   * Handle delete button click
   */
  private handleDelete(): void {
    if (this.state.disabled) {
      return
    }

    if (this.callbacks.onDelete) {
      this.callbacks.onDelete({ ...this.state })
    }
  }

  /**
   * Set the selected state
   */
  setSelected(selected: boolean): void {
    this.setState({ selected })
  }

  /**
   * Set the disabled state
   */
  setDisabled(disabled: boolean): void {
    this.setState({ disabled })
  }

  /**
   * Update component state
   */
  private setState(updates: Partial<ChipState>): void {
    const newState = { ...this.state, ...updates }

    // Only update if state actually changed
    if (JSON.stringify(newState) === JSON.stringify(this.state)) {
      return
    }

    this.state = newState
    this.render()
  }

  /**
   * Get current component state
   */
  getState(): ChipState {
    return { ...this.state }
  }

  /**
   * Update chip configuration
   */
  updateConfig(config: Partial<ChipConfig>): void {
    this.config = { ...this.config, ...config }
    this.render()
  }

  // ===========================================================================
  // Static Field Renderer
  // ===========================================================================

  static renderField(field: InputField): string {
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
}

/**
 * Factory function to create a Chip component
 *
 * @param container - HTMLElement to render the chip into
 * @param config - Chip configuration
 * @param callbacks - Event callbacks
 * @returns Chip instance
 */
export function createChip(
  container: HTMLElement,
  config: ChipConfig,
  callbacks: ChipCallbacks = {}
): Chip {
  const chip = new Chip(container, config, callbacks)
  chip.render()
  return chip
}

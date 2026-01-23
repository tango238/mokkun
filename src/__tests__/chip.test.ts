import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Chip, createChip, type ChipCallbacks, type ChipConfig } from '../renderer/components/chip'

describe('Chip', () => {
  let container: HTMLElement

  const createMockContainer = (): HTMLElement => {
    return document.createElement('div')
  }

  const cleanupContainer = (container: HTMLElement): void => {
    container.innerHTML = ''
  }

  beforeEach(() => {
    container = createMockContainer()
  })

  afterEach(() => {
    cleanupContainer(container)
  })

  describe('Initialization', () => {
    it('should create chip with required config', () => {
      const config: ChipConfig = {
        label: 'Test Chip',
      }
      const chip = new Chip(container, config)
      chip.render()

      const chipElement = container.querySelector('.mokkun-chip')
      expect(chipElement).toBeTruthy()
      expect(chipElement?.textContent).toContain('Test Chip')
    })

    it('should apply default config values', () => {
      const chip = new Chip(container, { label: 'Test' })
      chip.render()

      const chipElement = container.querySelector('.mokkun-chip')
      expect(chipElement?.classList.contains('chip-medium')).toBe(true)
      expect(chipElement?.classList.contains('chip-default')).toBe(true)
      expect(chipElement?.getAttribute('data-selected')).toBe('false')
      expect(chipElement?.getAttribute('data-disabled')).toBe('false')
    })

    it('should initialize with selected state', () => {
      const chip = new Chip(container, { label: 'Test', selected: true })
      chip.render()

      const chipElement = container.querySelector('.mokkun-chip')
      expect(chipElement?.getAttribute('data-selected')).toBe('true')
      expect(chipElement?.getAttribute('aria-pressed')).toBe('true')
    })

    it('should initialize with disabled state', () => {
      const chip = new Chip(container, { label: 'Test', disabled: true })
      chip.render()

      const chipElement = container.querySelector('.mokkun-chip')
      expect(chipElement?.getAttribute('data-disabled')).toBe('true')
      expect(chipElement?.getAttribute('aria-disabled')).toBe('true')
      expect(chipElement?.getAttribute('tabindex')).toBe('-1')
    })
  })

  describe('Size Variants', () => {
    it('should apply small size class', () => {
      const chip = new Chip(container, { label: 'Test', size: 'small' })
      chip.render()

      const chipElement = container.querySelector('.mokkun-chip')
      expect(chipElement?.classList.contains('chip-small')).toBe(true)
    })

    it('should apply medium size class (default)', () => {
      const chip = new Chip(container, { label: 'Test' })
      chip.render()

      const chipElement = container.querySelector('.mokkun-chip')
      expect(chipElement?.classList.contains('chip-medium')).toBe(true)
    })

    it('should apply large size class', () => {
      const chip = new Chip(container, { label: 'Test', size: 'large' })
      chip.render()

      const chipElement = container.querySelector('.mokkun-chip')
      expect(chipElement?.classList.contains('chip-large')).toBe(true)
    })
  })

  describe('Color Variants', () => {
    const colors = ['default', 'primary', 'success', 'warning', 'error', 'info'] as const

    colors.forEach((color) => {
      it(`should apply ${color} color class`, () => {
        const chip = new Chip(container, { label: 'Test', color })
        chip.render()

        const chipElement = container.querySelector('.mokkun-chip')
        expect(chipElement?.classList.contains(`chip-${color}`)).toBe(true)
        expect(chipElement?.getAttribute('data-color')).toBe(color)
      })
    })
  })

  describe('Icon Support', () => {
    it('should render emoji icon', () => {
      const chip = new Chip(container, { label: 'Test', icon: '🚀' })
      chip.render()

      const iconElement = container.querySelector('.chip-icon')
      expect(iconElement).toBeTruthy()
      expect(iconElement?.textContent).toBe('🚀')
      expect(iconElement?.getAttribute('aria-hidden')).toBe('true')
    })

    it('should render HTML icon', () => {
      const chip = new Chip(container, {
        label: 'Test',
        icon: '<svg width="16" height="16"></svg>',
      })
      chip.render()

      const iconElement = container.querySelector('.chip-icon')
      expect(iconElement).toBeTruthy()
      expect(iconElement?.innerHTML).toContain('<svg')
    })

    it('should not render icon when not provided', () => {
      const chip = new Chip(container, { label: 'Test' })
      chip.render()

      const iconElement = container.querySelector('.chip-icon')
      expect(iconElement).toBeFalsy()
    })
  })

  describe('Delete Button', () => {
    it('should render delete button when deletable is true', () => {
      const chip = new Chip(container, { label: 'Test', deletable: true })
      chip.render()

      const deleteButton = container.querySelector('.chip-delete-button')
      expect(deleteButton).toBeTruthy()
      expect(deleteButton?.getAttribute('aria-label')).toBe('Delete Test')
    })

    it('should not render delete button when deletable is false', () => {
      const chip = new Chip(container, { label: 'Test', deletable: false })
      chip.render()

      const deleteButton = container.querySelector('.chip-delete-button')
      expect(deleteButton).toBeFalsy()
    })

    it('should call onDelete callback when delete button is clicked', () => {
      const onDelete = vi.fn()
      const chip = new Chip(
        container,
        { label: 'Test', deletable: true },
        { onDelete }
      )
      chip.render()

      const deleteButton = container.querySelector('.chip-delete-button') as HTMLElement
      deleteButton.click()

      expect(onDelete).toHaveBeenCalledTimes(1)
      expect(onDelete).toHaveBeenCalledWith({
        selected: false,
        disabled: false,
      })
    })

    it('should not call onDelete when disabled', () => {
      const onDelete = vi.fn()
      const chip = new Chip(
        container,
        { label: 'Test', deletable: true, disabled: true },
        { onDelete }
      )
      chip.render()

      const deleteButton = container.querySelector('.chip-delete-button') as HTMLElement
      deleteButton.click()

      expect(onDelete).not.toHaveBeenCalled()
    })

    it('should handle delete button keyboard events (Enter)', () => {
      const onDelete = vi.fn()
      const chip = new Chip(
        container,
        { label: 'Test', deletable: true },
        { onDelete }
      )
      chip.render()

      const deleteButton = container.querySelector('.chip-delete-button') as HTMLElement
      const event = new KeyboardEvent('keydown', { key: 'Enter' })
      deleteButton.dispatchEvent(event)

      expect(onDelete).toHaveBeenCalledTimes(1)
    })

    it('should handle delete button keyboard events (Space)', () => {
      const onDelete = vi.fn()
      const chip = new Chip(
        container,
        { label: 'Test', deletable: true },
        { onDelete }
      )
      chip.render()

      const deleteButton = container.querySelector('.chip-delete-button') as HTMLElement
      const event = new KeyboardEvent('keydown', { key: ' ' })
      deleteButton.dispatchEvent(event)

      expect(onDelete).toHaveBeenCalledTimes(1)
    })

    it('should not toggle selection when delete button is clicked', () => {
      const onClick = vi.fn()
      const onDelete = vi.fn()
      const chip = new Chip(
        container,
        { label: 'Test', deletable: true },
        { onClick, onDelete }
      )
      chip.render()

      const deleteButton = container.querySelector('.chip-delete-button') as HTMLElement
      deleteButton.click()

      expect(onClick).not.toHaveBeenCalled()
      expect(onDelete).toHaveBeenCalledTimes(1)
    })
  })

  describe('Selection Toggle', () => {
    it('should toggle selection when clicked', () => {
      const chip = new Chip(container, { label: 'Test' })
      chip.render()

      let chipElement = container.querySelector('.mokkun-chip') as HTMLElement

      // Initial state
      expect(chipElement.getAttribute('data-selected')).toBe('false')

      // Click to select
      chipElement.click()
      chipElement = container.querySelector('.mokkun-chip') as HTMLElement
      expect(chipElement.getAttribute('data-selected')).toBe('true')

      // Click to deselect
      chipElement.click()
      chipElement = container.querySelector('.mokkun-chip') as HTMLElement
      expect(chipElement.getAttribute('data-selected')).toBe('false')
    })

    it('should call onClick callback with new selected state', () => {
      const onClick = vi.fn()
      const chip = new Chip(container, { label: 'Test' }, { onClick })
      chip.render()

      const chipElement = container.querySelector('.mokkun-chip') as HTMLElement
      chipElement.click()

      expect(onClick).toHaveBeenCalledTimes(1)
      expect(onClick).toHaveBeenCalledWith(true, {
        selected: true,
        disabled: false,
      })
    })

    it('should not toggle selection when disabled', () => {
      const onClick = vi.fn()
      const chip = new Chip(
        container,
        { label: 'Test', disabled: true },
        { onClick }
      )
      chip.render()

      const chipElement = container.querySelector('.mokkun-chip') as HTMLElement
      chipElement.click()

      expect(onClick).not.toHaveBeenCalled()
      expect(chipElement.getAttribute('data-selected')).toBe('false')
    })

    it('should handle keyboard events (Enter)', () => {
      const onClick = vi.fn()
      const chip = new Chip(container, { label: 'Test' }, { onClick })
      chip.render()

      const chipElement = container.querySelector('.mokkun-chip') as HTMLElement
      const event = new KeyboardEvent('keydown', { key: 'Enter' })
      chipElement.dispatchEvent(event)

      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('should handle keyboard events (Space)', () => {
      const onClick = vi.fn()
      const chip = new Chip(container, { label: 'Test' }, { onClick })
      chip.render()

      const chipElement = container.querySelector('.mokkun-chip') as HTMLElement
      const event = new KeyboardEvent('keydown', { key: ' ' })
      chipElement.dispatchEvent(event)

      expect(onClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('State Management', () => {
    it('should set selected state via setSelected()', () => {
      const chip = new Chip(container, { label: 'Test' })
      chip.render()

      chip.setSelected(true)
      expect(chip.getState().selected).toBe(true)

      const chipElement = container.querySelector('.mokkun-chip')
      expect(chipElement?.getAttribute('data-selected')).toBe('true')
    })

    it('should set disabled state via setDisabled()', () => {
      const chip = new Chip(container, { label: 'Test' })
      chip.render()

      chip.setDisabled(true)
      expect(chip.getState().disabled).toBe(true)

      const chipElement = container.querySelector('.mokkun-chip')
      expect(chipElement?.getAttribute('data-disabled')).toBe('true')
    })

    it('should return current state via getState()', () => {
      const chip = new Chip(container, {
        label: 'Test',
        selected: true,
        disabled: false,
      })
      chip.render()

      const state = chip.getState()
      expect(state).toEqual({
        selected: true,
        disabled: false,
      })
    })

    it('should return a copy of state (immutability)', () => {
      const chip = new Chip(container, { label: 'Test' })
      chip.render()

      const state1 = chip.getState()
      state1.selected = true

      const state2 = chip.getState()
      expect(state2.selected).toBe(false)
    })

    it('should not re-render if state has not changed', () => {
      const chip = new Chip(container, { label: 'Test' })
      chip.render()

      const initialHTML = container.innerHTML

      chip.setSelected(false) // Already false
      expect(container.innerHTML).toBe(initialHTML)
    })
  })

  describe('Configuration Updates', () => {
    it('should update configuration via updateConfig()', () => {
      const chip = new Chip(container, { label: 'Test', color: 'default' })
      chip.render()

      chip.updateConfig({ color: 'primary', size: 'large' })

      const chipElement = container.querySelector('.mokkun-chip')
      expect(chipElement?.classList.contains('chip-primary')).toBe(true)
      expect(chipElement?.classList.contains('chip-large')).toBe(true)
    })

    it('should re-render after config update', () => {
      const chip = new Chip(container, { label: 'Old Label' })
      chip.render()

      chip.updateConfig({ label: 'New Label' })

      const labelElement = container.querySelector('.chip-label')
      expect(labelElement?.textContent).toBe('New Label')
    })

    it('should update icon via updateConfig()', () => {
      const chip = new Chip(container, { label: 'Test' })
      chip.render()

      expect(container.querySelector('.chip-icon')).toBeFalsy()

      chip.updateConfig({ icon: '🎉' })
      expect(container.querySelector('.chip-icon')?.textContent).toBe('🎉')
    })

    it('should update deletable state via updateConfig()', () => {
      const chip = new Chip(container, { label: 'Test', deletable: false })
      chip.render()

      expect(container.querySelector('.chip-delete-button')).toBeFalsy()

      chip.updateConfig({ deletable: true })
      expect(container.querySelector('.chip-delete-button')).toBeTruthy()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA role', () => {
      const chip = new Chip(container, { label: 'Test' })
      chip.render()

      const chipElement = container.querySelector('.mokkun-chip')
      expect(chipElement?.getAttribute('role')).toBe('button')
    })

    it('should have aria-pressed attribute reflecting selected state', () => {
      const chip = new Chip(container, { label: 'Test', selected: false })
      chip.render()

      let chipElement = container.querySelector('.mokkun-chip')
      expect(chipElement?.getAttribute('aria-pressed')).toBe('false')

      chip.setSelected(true)
      chipElement = container.querySelector('.mokkun-chip')
      expect(chipElement?.getAttribute('aria-pressed')).toBe('true')
    })

    it('should have aria-disabled attribute reflecting disabled state', () => {
      const chip = new Chip(container, { label: 'Test', disabled: false })
      chip.render()

      let chipElement = container.querySelector('.mokkun-chip')
      expect(chipElement?.getAttribute('aria-disabled')).toBe('false')

      chip.setDisabled(true)
      chipElement = container.querySelector('.mokkun-chip')
      expect(chipElement?.getAttribute('aria-disabled')).toBe('true')
    })

    it('should use custom aria-label when provided', () => {
      const chip = new Chip(container, {
        label: 'JS',
        ariaLabel: 'JavaScript',
      })
      chip.render()

      const chipElement = container.querySelector('.mokkun-chip')
      expect(chipElement?.getAttribute('aria-label')).toBe('JavaScript')
    })

    it('should fall back to label for aria-label', () => {
      const chip = new Chip(container, { label: 'TypeScript' })
      chip.render()

      const chipElement = container.querySelector('.mokkun-chip')
      expect(chipElement?.getAttribute('aria-label')).toBe('TypeScript')
    })

    it('should set tabindex to -1 when disabled', () => {
      const chip = new Chip(container, { label: 'Test', disabled: true })
      chip.render()

      const chipElement = container.querySelector('.mokkun-chip')
      expect(chipElement?.getAttribute('tabindex')).toBe('-1')
    })

    it('should set tabindex to 0 when not disabled', () => {
      const chip = new Chip(container, { label: 'Test', disabled: false })
      chip.render()

      const chipElement = container.querySelector('.mokkun-chip')
      expect(chipElement?.getAttribute('tabindex')).toBe('0')
    })

    it('should have aria-hidden on icon', () => {
      const chip = new Chip(container, { label: 'Test', icon: '🚀' })
      chip.render()

      const iconElement = container.querySelector('.chip-icon')
      expect(iconElement?.getAttribute('aria-hidden')).toBe('true')
    })

    it('should have descriptive aria-label on delete button', () => {
      const chip = new Chip(container, {
        label: 'JavaScript',
        deletable: true,
      })
      chip.render()

      const deleteButton = container.querySelector('.chip-delete-button')
      expect(deleteButton?.getAttribute('aria-label')).toBe('Delete JavaScript')
    })
  })

  describe('Factory Function', () => {
    it('should create and render chip via createChip()', () => {
      const chip = createChip(container, { label: 'Test' })

      expect(chip).toBeInstanceOf(Chip)
      expect(container.querySelector('.mokkun-chip')).toBeTruthy()
    })

    it('should pass callbacks to factory function', () => {
      const onClick = vi.fn()
      const onDelete = vi.fn()

      const chip = createChip(
        container,
        { label: 'Test', deletable: true },
        { onClick, onDelete }
      )

      const chipElement = container.querySelector('.mokkun-chip') as HTMLElement
      chipElement.click()

      expect(onClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('Integration Tests', () => {
    it('should handle rapid state changes', () => {
      const chip = new Chip(container, { label: 'Test' })
      chip.render()

      chip.setSelected(true)
      chip.setSelected(false)
      chip.setSelected(true)

      expect(chip.getState().selected).toBe(true)
    })

    it('should handle combination of selected and disabled states', () => {
      const chip = new Chip(container, {
        label: 'Test',
        selected: true,
        disabled: true,
      })
      chip.render()

      const chipElement = container.querySelector('.mokkun-chip')
      expect(chipElement?.getAttribute('data-selected')).toBe('true')
      expect(chipElement?.getAttribute('data-disabled')).toBe('true')
    })

    it('should maintain all features with full configuration', () => {
      const onClick = vi.fn()
      const onDelete = vi.fn()

      const chip = new Chip(
        container,
        {
          label: 'Premium Feature',
          icon: '⭐',
          deletable: true,
          selected: true,
          disabled: false,
          size: 'large',
          color: 'primary',
          ariaLabel: 'Premium feature chip',
        },
        { onClick, onDelete }
      )
      chip.render()

      const chipElement = container.querySelector('.mokkun-chip')
      expect(chipElement?.classList.contains('chip-large')).toBe(true)
      expect(chipElement?.classList.contains('chip-primary')).toBe(true)
      expect(chipElement?.getAttribute('data-selected')).toBe('true')
      expect(container.querySelector('.chip-icon')).toBeTruthy()
      expect(container.querySelector('.chip-delete-button')).toBeTruthy()
    })

    it('should properly separate delete and selection actions', () => {
      const onClick = vi.fn()
      const onDelete = vi.fn()

      const chip = new Chip(
        container,
        { label: 'Test', deletable: true },
        { onClick, onDelete }
      )
      chip.render()

      // Click chip (not delete button)
      const chipElement = container.querySelector('.mokkun-chip') as HTMLElement
      const chipContent = container.querySelector('.chip-content') as HTMLElement
      chipContent.click()

      expect(onClick).toHaveBeenCalledTimes(1)
      expect(onDelete).not.toHaveBeenCalled()

      onClick.mockClear()

      // Click delete button
      const deleteButton = container.querySelector('.chip-delete-button') as HTMLElement
      deleteButton.click()

      expect(onClick).not.toHaveBeenCalled()
      expect(onDelete).toHaveBeenCalledTimes(1)
    })

    it('should re-render correctly after multiple updates', () => {
      const chip = new Chip(container, { label: 'Test', color: 'default' })
      chip.render()

      chip.updateConfig({ color: 'primary' })
      chip.setSelected(true)
      chip.updateConfig({ size: 'large' })
      chip.setDisabled(true)

      const chipElement = container.querySelector('.mokkun-chip')
      expect(chipElement?.classList.contains('chip-primary')).toBe(true)
      expect(chipElement?.classList.contains('chip-large')).toBe(true)
      expect(chipElement?.getAttribute('data-selected')).toBe('true')
      expect(chipElement?.getAttribute('data-disabled')).toBe('true')
    })
  })
})

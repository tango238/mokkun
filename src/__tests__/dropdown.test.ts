/**
 * Dropdown Component Tests
 * ドロップダウンコンポーネントのテスト
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  Dropdown,
  createDropdown,
  createMenuButton,
  createFilterDropdown,
  createSortDropdown,
  type DropdownConfig,
  type DropdownCallbacks,
  type ActionMenuItem,
  type FilterMenuItem,
  type SortMenuItem,
  type MenuItem,
} from '../renderer/components/dropdown'

// =============================================================================
// Test Utilities
// =============================================================================

function createMockContainer(): HTMLElement {
  const container = document.createElement('div')
  document.body.appendChild(container)
  return container
}

function cleanupContainer(container: HTMLElement): void {
  container.remove()
}

// =============================================================================
// Dropdown Component Tests
// =============================================================================

describe('Dropdown Component', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = createMockContainer()
  })

  afterEach(() => {
    cleanupContainer(container)
  })

  // ===========================================================================
  // Initialization Tests
  // ===========================================================================

  describe('Initialization', () => {
    it('should initialize with default config', () => {
      const config: DropdownConfig = {
        triggerLabel: 'Menu',
        items: [],
      }
      const dropdown = new Dropdown(container, config)
      dropdown.render()

      expect(container.classList.contains('mokkun-dropdown')).toBe(true)
      expect(container.querySelector('.dropdown-wrapper')).toBeTruthy()
      expect(container.querySelector('.dropdown-trigger')).toBeTruthy()
    })

    it('should initialize closed by default', () => {
      const config: DropdownConfig = {
        triggerLabel: 'Menu',
        items: [],
      }
      const dropdown = new Dropdown(container, config)
      dropdown.render()

      expect(dropdown.getState().isOpen).toBe(false)
      expect(container.getAttribute('data-state')).toBe('closed')
      expect(container.querySelector('.dropdown-content')).toBeNull()
    })

    it('should initialize open with defaultOpen', () => {
      const config: DropdownConfig = {
        triggerLabel: 'Menu',
        items: [],
        defaultOpen: true,
      }
      const dropdown = new Dropdown(container, config)
      dropdown.render()

      expect(dropdown.getState().isOpen).toBe(true)
      expect(container.getAttribute('data-state')).toBe('open')
      expect(container.querySelector('.dropdown-content')).toBeTruthy()
    })

    it('should apply menu variant by default', () => {
      const config: DropdownConfig = {
        triggerLabel: 'Menu',
        items: [],
      }
      const dropdown = new Dropdown(container, config)
      dropdown.render()

      expect(container.classList.contains('dropdown-menu')).toBe(true)
    })
  })

  // ===========================================================================
  // Variant Tests
  // ===========================================================================

  describe('Variants', () => {
    it('should apply menu variant', () => {
      const config: DropdownConfig = {
        variant: 'menu',
        triggerLabel: 'Actions',
        items: [],
      }
      const dropdown = new Dropdown(container, config)
      dropdown.render()

      expect(container.classList.contains('dropdown-menu')).toBe(true)
    })

    it('should apply filter variant', () => {
      const config: DropdownConfig = {
        variant: 'filter',
        triggerLabel: 'Filter',
        items: [],
      }
      const dropdown = new Dropdown(container, config)
      dropdown.render()

      expect(container.classList.contains('dropdown-filter')).toBe(true)
    })

    it('should apply sort variant', () => {
      const config: DropdownConfig = {
        variant: 'sort',
        triggerLabel: 'Sort',
        items: [],
      }
      const dropdown = new Dropdown(container, config)
      dropdown.render()

      expect(container.classList.contains('dropdown-sort')).toBe(true)
    })
  })

  // ===========================================================================
  // Trigger Tests
  // ===========================================================================

  describe('Trigger Button', () => {
    it('should render trigger with label', () => {
      const config: DropdownConfig = {
        triggerLabel: 'Test Menu',
        items: [],
      }
      const dropdown = new Dropdown(container, config)
      dropdown.render()

      const trigger = container.querySelector('.dropdown-trigger')
      expect(trigger).toBeTruthy()
      expect(trigger?.textContent).toContain('Test Menu')
    })

    it('should render trigger with icon', () => {
      const config: DropdownConfig = {
        triggerLabel: 'Menu',
        triggerIcon: '⚙️',
        items: [],
      }
      const dropdown = new Dropdown(container, config)
      dropdown.render()

      const icon = container.querySelector('.dropdown-trigger-icon')
      expect(icon).toBeTruthy()
      expect(icon?.textContent).toBe('⚙️')
    })

    it('should render icon-only trigger', () => {
      const config: DropdownConfig = {
        triggerLabel: 'Menu',
        triggerIcon: '⚙️',
        onlyIconTrigger: true,
        items: [],
      }
      const dropdown = new Dropdown(container, config)
      dropdown.render()

      const label = container.querySelector('.dropdown-trigger-label')
      expect(label).toBeFalsy()
    })

    it('should apply small trigger size', () => {
      const config: DropdownConfig = {
        triggerLabel: 'Menu',
        triggerSize: 's',
        items: [],
      }
      const dropdown = new Dropdown(container, config)
      dropdown.render()

      const trigger = container.querySelector('.dropdown-trigger')
      expect(trigger?.classList.contains('dropdown-trigger-s')).toBe(true)
    })

    it('should apply filtered state', () => {
      const config: DropdownConfig = {
        triggerLabel: 'Filter',
        variant: 'filter',
        isFiltered: true,
        items: [],
      }
      const dropdown = new Dropdown(container, config)
      dropdown.render()

      const trigger = container.querySelector('.dropdown-trigger')
      expect(trigger?.classList.contains('is-filtered')).toBe(true)
    })

    it('should toggle dropdown on trigger click', () => {
      const config: DropdownConfig = {
        triggerLabel: 'Menu',
        items: [],
      }
      const dropdown = new Dropdown(container, config)
      dropdown.render()

      const trigger = container.querySelector('.dropdown-trigger') as HTMLElement
      expect(dropdown.getState().isOpen).toBe(false)

      trigger.click()
      expect(dropdown.getState().isOpen).toBe(true)

      trigger.click()
      expect(dropdown.getState().isOpen).toBe(false)
    })
  })

  // ===========================================================================
  // Menu Items Tests
  // ===========================================================================

  describe('Menu Items', () => {
    it('should render action menu items', () => {
      const items: ActionMenuItem[] = [
        { type: 'action', id: '1', label: 'Edit' },
        { type: 'action', id: '2', label: 'Delete' },
      ]
      const config: DropdownConfig = {
        triggerLabel: 'Actions',
        items,
        defaultOpen: true,
      }
      const dropdown = new Dropdown(container, config)
      dropdown.render()

      const menuItems = container.querySelectorAll('.dropdown-menu-item')
      expect(menuItems.length).toBe(2)
      expect(menuItems[0].textContent).toContain('Edit')
      expect(menuItems[1].textContent).toContain('Delete')
    })

    it('should render menu items with icons', () => {
      const items: ActionMenuItem[] = [
        { type: 'action', id: '1', label: 'Edit', icon: '✏️' },
        { type: 'action', id: '2', label: 'Delete', icon: '🗑️' },
      ]
      const config: DropdownConfig = {
        triggerLabel: 'Actions',
        items,
        defaultOpen: true,
      }
      const dropdown = new Dropdown(container, config)
      dropdown.render()

      const icons = container.querySelectorAll('.dropdown-menu-item-icon')
      expect(icons.length).toBe(2)
      expect(icons[0].textContent).toBe('✏️')
      expect(icons[1].textContent).toBe('🗑️')
    })

    it('should render dividers', () => {
      const items: MenuItem[] = [
        { type: 'action', id: '1', label: 'Edit' },
        { type: 'divider', id: 'div-1' },
        { type: 'action', id: '2', label: 'Delete' },
      ]
      const config: DropdownConfig = {
        triggerLabel: 'Actions',
        items,
        defaultOpen: true,
      }
      const dropdown = new Dropdown(container, config)
      dropdown.render()

      const dividers = container.querySelectorAll('.dropdown-divider')
      expect(dividers.length).toBe(1)
    })

    it('should render disabled items', () => {
      const items: ActionMenuItem[] = [
        { type: 'action', id: '1', label: 'Edit', disabled: true },
        { type: 'action', id: '2', label: 'Delete' },
      ]
      const config: DropdownConfig = {
        triggerLabel: 'Actions',
        items,
        defaultOpen: true,
      }
      const dropdown = new Dropdown(container, config)
      dropdown.render()

      const disabledItem = container.querySelector('.dropdown-menu-item.is-disabled')
      expect(disabledItem).toBeTruthy()
      expect(disabledItem?.getAttribute('aria-disabled')).toBe('true')
    })

    it('should call onAction when action item is clicked', () => {
      const onAction = vi.fn()
      const items: ActionMenuItem[] = [
        { type: 'action', id: 'edit', label: 'Edit', onAction },
      ]
      const config: DropdownConfig = {
        triggerLabel: 'Actions',
        items,
        defaultOpen: true,
      }
      const dropdown = new Dropdown(container, config)
      dropdown.render()

      const menuItem = container.querySelector('.dropdown-menu-item') as HTMLElement
      menuItem.click()

      expect(onAction).toHaveBeenCalledWith('edit')
    })

    it('should close dropdown after action item click', () => {
      const items: ActionMenuItem[] = [
        { type: 'action', id: '1', label: 'Edit' },
      ]
      const config: DropdownConfig = {
        triggerLabel: 'Actions',
        items,
        defaultOpen: true,
      }
      const dropdown = new Dropdown(container, config)
      dropdown.render()

      expect(dropdown.getState().isOpen).toBe(true)

      const menuItem = container.querySelector('.dropdown-menu-item') as HTMLElement
      menuItem.click()

      expect(dropdown.getState().isOpen).toBe(false)
    })
  })

  // ===========================================================================
  // Filter Dropdown Tests
  // ===========================================================================

  describe('Filter Dropdown', () => {
    it('should render filter items with checkboxes', () => {
      const items: FilterMenuItem[] = [
        { type: 'filter', id: '1', label: 'Active', value: 'active' },
        { type: 'filter', id: '2', label: 'Inactive', value: 'inactive' },
      ]
      const config: DropdownConfig = {
        variant: 'filter',
        triggerLabel: 'Filter',
        items,
        defaultOpen: true,
      }
      const dropdown = new Dropdown(container, config)
      dropdown.render()

      const checkboxes = container.querySelectorAll('.dropdown-filter-checkbox')
      expect(checkboxes.length).toBe(2)
    })

    it('should render filter action buttons', () => {
      const items: FilterMenuItem[] = [
        { type: 'filter', id: '1', label: 'Active', value: 'active' },
      ]
      const config: DropdownConfig = {
        variant: 'filter',
        triggerLabel: 'Filter',
        items,
        defaultOpen: true,
      }
      const dropdown = new Dropdown(container, config)
      dropdown.render()

      const resetButton = container.querySelector('.dropdown-filter-reset')
      const applyButton = container.querySelector('.dropdown-filter-apply')

      expect(resetButton).toBeTruthy()
      expect(applyButton).toBeTruthy()
      expect(resetButton?.textContent).toBe('クリア')
      expect(applyButton?.textContent).toBe('適用')
    })

    it('should handle filter selection', () => {
      const items: FilterMenuItem[] = [
        { type: 'filter', id: '1', label: 'Active', value: 'active' },
        { type: 'filter', id: '2', label: 'Inactive', value: 'inactive' },
      ]
      const config: DropdownConfig = {
        variant: 'filter',
        triggerLabel: 'Filter',
        items,
        defaultOpen: true,
      }
      const dropdown = new Dropdown(container, config)
      dropdown.render()

      const checkbox = container.querySelector('.dropdown-filter-checkbox') as HTMLInputElement
      expect(checkbox.checked).toBe(false)

      checkbox.click()
      expect(dropdown.getState().selectedFilters).toContain('active')
    })

    it('should call onApply when apply button is clicked', () => {
      const onApply = vi.fn()
      const items: FilterMenuItem[] = [
        { type: 'filter', id: '1', label: 'Active', value: 'active', selected: true },
      ]
      const callbacks: DropdownCallbacks = { onApply }
      const config: DropdownConfig = {
        variant: 'filter',
        triggerLabel: 'Filter',
        items,
        defaultOpen: true,
      }
      const dropdown = new Dropdown(container, config, callbacks)
      dropdown.render()

      const applyButton = container.querySelector('.dropdown-filter-apply') as HTMLElement
      applyButton.click()

      expect(onApply).toHaveBeenCalledWith(['active'])
    })

    it('should call onReset when reset button is clicked', () => {
      const onReset = vi.fn()
      const items: FilterMenuItem[] = [
        { type: 'filter', id: '1', label: 'Active', value: 'active', selected: true },
      ]
      const callbacks: DropdownCallbacks = { onReset }
      const config: DropdownConfig = {
        variant: 'filter',
        triggerLabel: 'Filter',
        items,
        defaultOpen: true,
      }
      const dropdown = new Dropdown(container, config, callbacks)
      dropdown.render()

      const resetButton = container.querySelector('.dropdown-filter-reset') as HTMLElement
      resetButton.click()

      expect(onReset).toHaveBeenCalled()
      expect(dropdown.getState().selectedFilters).toEqual([])
    })

    it('should close dropdown after apply', () => {
      const items: FilterMenuItem[] = [
        { type: 'filter', id: '1', label: 'Active', value: 'active' },
      ]
      const config: DropdownConfig = {
        variant: 'filter',
        triggerLabel: 'Filter',
        items,
        defaultOpen: true,
      }
      const dropdown = new Dropdown(container, config)
      dropdown.render()

      expect(dropdown.getState().isOpen).toBe(true)

      const applyButton = container.querySelector('.dropdown-filter-apply') as HTMLElement
      applyButton.click()

      expect(dropdown.getState().isOpen).toBe(false)
    })
  })

  // ===========================================================================
  // Sort Dropdown Tests
  // ===========================================================================

  describe('Sort Dropdown', () => {
    it('should render sort items', () => {
      const items: SortMenuItem[] = [
        { type: 'sort', id: '1', label: 'Name', field: 'name' },
        { type: 'sort', id: '2', label: 'Date', field: 'date' },
      ]
      const config: DropdownConfig = {
        variant: 'sort',
        triggerLabel: 'Sort',
        items,
        defaultOpen: true,
      }
      const dropdown = new Dropdown(container, config)
      dropdown.render()

      const menuItems = container.querySelectorAll('.dropdown-menu-item')
      expect(menuItems.length).toBe(2)
    })

    it('should call onSortChange when sort item is clicked', () => {
      const onSortChange = vi.fn()
      const items: SortMenuItem[] = [
        { type: 'sort', id: '1', label: 'Name', field: 'name' },
      ]
      const callbacks: DropdownCallbacks = { onSortChange }
      const config: DropdownConfig = {
        variant: 'sort',
        triggerLabel: 'Sort',
        items,
        defaultOpen: true,
      }
      const dropdown = new Dropdown(container, config, callbacks)
      dropdown.render()

      const menuItem = container.querySelector('.dropdown-menu-item') as HTMLElement
      menuItem.click()

      expect(onSortChange).toHaveBeenCalledWith('name', 'asc')
    })

    it('should toggle sort direction on repeated clicks', () => {
      const onSortChange = vi.fn()
      const items: SortMenuItem[] = [
        { type: 'sort', id: '1', label: 'Name', field: 'name' },
      ]
      const callbacks: DropdownCallbacks = { onSortChange }
      const config: DropdownConfig = {
        variant: 'sort',
        triggerLabel: 'Sort',
        items,
        defaultOpen: true,
      }
      const dropdown = new Dropdown(container, config, callbacks)
      dropdown.render()

      const menuItem = container.querySelector('.dropdown-menu-item') as HTMLElement

      // First click - ascending
      menuItem.click()
      expect(onSortChange).toHaveBeenCalledWith('name', 'asc')

      // Open again and click - descending
      dropdown.open()
      const menuItem2 = container.querySelector('.dropdown-menu-item') as HTMLElement
      menuItem2.click()
      expect(onSortChange).toHaveBeenCalledWith('name', 'desc')
    })

    it('should show sort direction indicator', () => {
      const items: SortMenuItem[] = [
        { type: 'sort', id: '1', label: 'Name', field: 'name' },
      ]
      const config: DropdownConfig = {
        variant: 'sort',
        triggerLabel: 'Sort',
        items,
        defaultOpen: true,
      }
      const dropdown = new Dropdown(container, config)
      dropdown.render()

      const menuItem = container.querySelector('.dropdown-menu-item') as HTMLElement
      menuItem.click()

      // Open again to see indicator
      dropdown.open()
      const indicator = container.querySelector('.dropdown-menu-item-sort-indicator')
      expect(indicator).toBeTruthy()
      expect(indicator?.textContent).toBe('↑') // ascending
    })

    it('should close dropdown after sort selection', () => {
      const items: SortMenuItem[] = [
        { type: 'sort', id: '1', label: 'Name', field: 'name' },
      ]
      const config: DropdownConfig = {
        variant: 'sort',
        triggerLabel: 'Sort',
        items,
        defaultOpen: true,
      }
      const dropdown = new Dropdown(container, config)
      dropdown.render()

      expect(dropdown.getState().isOpen).toBe(true)

      const menuItem = container.querySelector('.dropdown-menu-item') as HTMLElement
      menuItem.click()

      expect(dropdown.getState().isOpen).toBe(false)
    })
  })

  // ===========================================================================
  // Keyboard Navigation Tests
  // ===========================================================================

  describe('Keyboard Navigation', () => {
    it('should close on Escape key', async () => {
      const config: DropdownConfig = {
        triggerLabel: 'Menu',
        items: [{ type: 'action', id: '1', label: 'Edit' }],
        defaultOpen: true,
      }
      const dropdown = new Dropdown(container, config)
      dropdown.render()

      expect(dropdown.getState().isOpen).toBe(true)

      // Wait for event listeners to be attached (they use setTimeout(..., 0))
      await new Promise((resolve) => setTimeout(resolve, 10))

      const event = new KeyboardEvent('keydown', { key: 'Escape' })
      document.dispatchEvent(event)

      expect(dropdown.getState().isOpen).toBe(false)
    })

    it('should navigate with ArrowDown', () => {
      const items: ActionMenuItem[] = [
        { type: 'action', id: '1', label: 'Edit' },
        { type: 'action', id: '2', label: 'Delete' },
      ]
      const config: DropdownConfig = {
        triggerLabel: 'Menu',
        items,
        defaultOpen: true,
      }
      const dropdown = new Dropdown(container, config)
      dropdown.render()

      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' })
      document.dispatchEvent(event)

      expect(dropdown.getState().focusedIndex).toBeGreaterThanOrEqual(0)
    })

    it('should navigate with ArrowUp', () => {
      const items: ActionMenuItem[] = [
        { type: 'action', id: '1', label: 'Edit' },
        { type: 'action', id: '2', label: 'Delete' },
      ]
      const config: DropdownConfig = {
        triggerLabel: 'Menu',
        items,
        defaultOpen: true,
      }
      const dropdown = new Dropdown(container, config)
      dropdown.render()

      // First move down
      let event = new KeyboardEvent('keydown', { key: 'ArrowDown' })
      document.dispatchEvent(event)

      // Then move up
      event = new KeyboardEvent('keydown', { key: 'ArrowUp' })
      document.dispatchEvent(event)

      expect(dropdown.getState().focusedIndex).toBeGreaterThanOrEqual(0)
    })

    it('should skip dividers when navigating', () => {
      const items: MenuItem[] = [
        { type: 'action', id: '1', label: 'Edit' },
        { type: 'divider', id: 'div-1' },
        { type: 'action', id: '2', label: 'Delete' },
      ]
      const config: DropdownConfig = {
        triggerLabel: 'Menu',
        items,
        defaultOpen: true,
      }
      const dropdown = new Dropdown(container, config)
      dropdown.render()

      // Navigate down twice
      let event = new KeyboardEvent('keydown', { key: 'ArrowDown' })
      document.dispatchEvent(event)
      document.dispatchEvent(event)

      // Should skip divider
      const state = dropdown.getState()
      const focusedItem = state.items[state.focusedIndex]
      expect(focusedItem.type).not.toBe('divider')
    })

    it('should skip disabled items when navigating', () => {
      const items: ActionMenuItem[] = [
        { type: 'action', id: '1', label: 'Edit', disabled: true },
        { type: 'action', id: '2', label: 'Delete' },
      ]
      const config: DropdownConfig = {
        triggerLabel: 'Menu',
        items,
        defaultOpen: true,
      }
      const dropdown = new Dropdown(container, config)
      dropdown.render()

      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' })
      document.dispatchEvent(event)

      const state = dropdown.getState()
      const focusedItem = state.items[state.focusedIndex] as ActionMenuItem
      expect(focusedItem.disabled).not.toBe(true)
    })
  })

  // ===========================================================================
  // Callbacks Tests
  // ===========================================================================

  describe('Callbacks', () => {
    it('should call onOpenChange when dropdown is opened', () => {
      const onOpenChange = vi.fn()
      const callbacks: DropdownCallbacks = { onOpenChange }
      const config: DropdownConfig = {
        triggerLabel: 'Menu',
        items: [],
      }
      const dropdown = new Dropdown(container, config, callbacks)
      dropdown.render()

      dropdown.open()

      expect(onOpenChange).toHaveBeenCalledWith(true)
    })

    it('should call onOpenChange when dropdown is closed', () => {
      const onOpenChange = vi.fn()
      const callbacks: DropdownCallbacks = { onOpenChange }
      const config: DropdownConfig = {
        triggerLabel: 'Menu',
        items: [],
        defaultOpen: true,
      }
      const dropdown = new Dropdown(container, config, callbacks)
      dropdown.render()

      dropdown.close()

      expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    it('should call onSelect when item is selected', () => {
      const onSelect = vi.fn()
      const items: ActionMenuItem[] = [
        { type: 'action', id: '1', label: 'Edit' },
      ]
      const callbacks: DropdownCallbacks = { onSelect }
      const config: DropdownConfig = {
        triggerLabel: 'Menu',
        items,
        defaultOpen: true,
      }
      const dropdown = new Dropdown(container, config, callbacks)
      dropdown.render()

      const menuItem = container.querySelector('.dropdown-menu-item') as HTMLElement
      menuItem.click()

      expect(onSelect).toHaveBeenCalledWith(items[0])
    })
  })

  // ===========================================================================
  // Public API Tests
  // ===========================================================================

  describe('Public API', () => {
    it('should open dropdown', () => {
      const config: DropdownConfig = {
        triggerLabel: 'Menu',
        items: [],
      }
      const dropdown = new Dropdown(container, config)
      dropdown.render()

      expect(dropdown.getState().isOpen).toBe(false)

      dropdown.open()

      expect(dropdown.getState().isOpen).toBe(true)
    })

    it('should close dropdown', () => {
      const config: DropdownConfig = {
        triggerLabel: 'Menu',
        items: [],
        defaultOpen: true,
      }
      const dropdown = new Dropdown(container, config)
      dropdown.render()

      expect(dropdown.getState().isOpen).toBe(true)

      dropdown.close()

      expect(dropdown.getState().isOpen).toBe(false)
    })

    it('should toggle dropdown', () => {
      const config: DropdownConfig = {
        triggerLabel: 'Menu',
        items: [],
      }
      const dropdown = new Dropdown(container, config)
      dropdown.render()

      expect(dropdown.getState().isOpen).toBe(false)

      dropdown.toggle()
      expect(dropdown.getState().isOpen).toBe(true)

      dropdown.toggle()
      expect(dropdown.getState().isOpen).toBe(false)
    })

    it('should update items', () => {
      const config: DropdownConfig = {
        triggerLabel: 'Menu',
        items: [],
      }
      const dropdown = new Dropdown(container, config)
      dropdown.render()

      const newItems: ActionMenuItem[] = [
        { type: 'action', id: '1', label: 'Edit' },
        { type: 'action', id: '2', label: 'Delete' },
      ]

      dropdown.setItems(newItems)

      expect(dropdown.getState().items.length).toBe(2)
    })

    it('should get state', () => {
      const config: DropdownConfig = {
        triggerLabel: 'Menu',
        items: [],
      }
      const dropdown = new Dropdown(container, config)
      dropdown.render()

      const state = dropdown.getState()

      expect(state).toHaveProperty('isOpen')
      expect(state).toHaveProperty('items')
      expect(state).toHaveProperty('focusedIndex')
    })

    it('should destroy dropdown', () => {
      const config: DropdownConfig = {
        triggerLabel: 'Menu',
        items: [],
      }
      const dropdown = new Dropdown(container, config)
      dropdown.render()

      dropdown.destroy()

      expect(container.innerHTML).toBe('')
    })
  })

  // ===========================================================================
  // Factory Function Tests
  // ===========================================================================

  describe('Factory Functions', () => {
    it('should create dropdown with createDropdown', () => {
      const config: DropdownConfig = {
        triggerLabel: 'Menu',
        items: [],
      }
      const dropdown = createDropdown(container, config)

      expect(dropdown).toBeInstanceOf(Dropdown)
      expect(container.querySelector('.dropdown-trigger')).toBeTruthy()
    })

    it('should create menu button with createMenuButton', () => {
      const config: Omit<DropdownConfig, 'variant'> = {
        triggerLabel: 'Actions',
        items: [],
      }
      const dropdown = createMenuButton(container, config)

      expect(dropdown).toBeInstanceOf(Dropdown)
      expect(dropdown.getState()).toMatchObject({
        isOpen: false,
      })
    })

    it('should create filter dropdown with createFilterDropdown', () => {
      const config: Omit<DropdownConfig, 'variant'> = {
        triggerLabel: 'Filter',
        items: [],
      }
      const dropdown = createFilterDropdown(container, config)

      expect(dropdown).toBeInstanceOf(Dropdown)
    })

    it('should create sort dropdown with createSortDropdown', () => {
      const config: Omit<DropdownConfig, 'variant'> = {
        triggerLabel: 'Sort',
        items: [],
      }
      const dropdown = createSortDropdown(container, config)

      expect(dropdown).toBeInstanceOf(Dropdown)
    })
  })

  // ===========================================================================
  // Placement Tests
  // ===========================================================================

  describe('Placement', () => {
    it('should apply bottom-start placement by default', () => {
      const config: DropdownConfig = {
        triggerLabel: 'Menu',
        items: [],
        defaultOpen: true,
      }
      const dropdown = new Dropdown(container, config)
      dropdown.render()

      const content = container.querySelector('.dropdown-content')
      expect(content?.classList.contains('dropdown-content-bottom-start')).toBe(true)
    })

    it('should apply bottom-end placement', () => {
      const config: DropdownConfig = {
        triggerLabel: 'Menu',
        items: [],
        placement: 'bottom-end',
        defaultOpen: true,
      }
      const dropdown = new Dropdown(container, config)
      dropdown.render()

      const content = container.querySelector('.dropdown-content')
      expect(content?.classList.contains('dropdown-content-bottom-end')).toBe(true)
    })

    it('should apply top-start placement', () => {
      const config: DropdownConfig = {
        triggerLabel: 'Menu',
        items: [],
        placement: 'top-start',
        defaultOpen: true,
      }
      const dropdown = new Dropdown(container, config)
      dropdown.render()

      const content = container.querySelector('.dropdown-content')
      expect(content?.classList.contains('dropdown-content-top-start')).toBe(true)
    })

    it('should apply top-end placement', () => {
      const config: DropdownConfig = {
        triggerLabel: 'Menu',
        items: [],
        placement: 'top-end',
        defaultOpen: true,
      }
      const dropdown = new Dropdown(container, config)
      dropdown.render()

      const content = container.querySelector('.dropdown-content')
      expect(content?.classList.contains('dropdown-content-top-end')).toBe(true)
    })
  })

  // ===========================================================================
  // Accessibility Tests
  // ===========================================================================

  describe('Accessibility', () => {
    it('should have proper ARIA attributes on trigger', () => {
      const config: DropdownConfig = {
        triggerLabel: 'Menu',
        items: [],
      }
      const dropdown = new Dropdown(container, config)
      dropdown.render()

      const trigger = container.querySelector('.dropdown-trigger')
      expect(trigger?.getAttribute('aria-haspopup')).toBe('true')
      expect(trigger?.getAttribute('aria-expanded')).toBe('false')
      expect(trigger?.getAttribute('aria-controls')).toBeTruthy()
    })

    it('should update aria-expanded when opened', () => {
      const config: DropdownConfig = {
        triggerLabel: 'Menu',
        items: [],
      }
      const dropdown = new Dropdown(container, config)
      dropdown.render()

      let trigger = container.querySelector('.dropdown-trigger')
      expect(trigger?.getAttribute('aria-expanded')).toBe('false')

      dropdown.open()
      // Re-query trigger after open() since render() rebuilds the DOM
      trigger = container.querySelector('.dropdown-trigger')
      expect(trigger?.getAttribute('aria-expanded')).toBe('true')
    })

    it('should have role=menu on dropdown content', () => {
      const config: DropdownConfig = {
        triggerLabel: 'Menu',
        items: [],
        defaultOpen: true,
      }
      const dropdown = new Dropdown(container, config)
      dropdown.render()

      const content = container.querySelector('.dropdown-content')
      expect(content?.getAttribute('role')).toBe('menu')
    })

    it('should have role=menuitem on menu items', () => {
      const items: ActionMenuItem[] = [
        { type: 'action', id: '1', label: 'Edit' },
      ]
      const config: DropdownConfig = {
        triggerLabel: 'Menu',
        items,
        defaultOpen: true,
      }
      const dropdown = new Dropdown(container, config)
      dropdown.render()

      const menuItem = container.querySelector('.dropdown-menu-item')
      expect(menuItem?.getAttribute('role')).toBe('menuitem')
    })

    it('should have proper aria-disabled on disabled items', () => {
      const items: ActionMenuItem[] = [
        { type: 'action', id: '1', label: 'Edit', disabled: true },
      ]
      const config: DropdownConfig = {
        triggerLabel: 'Menu',
        items,
        defaultOpen: true,
      }
      const dropdown = new Dropdown(container, config)
      dropdown.render()

      const menuItem = container.querySelector('.dropdown-menu-item')
      expect(menuItem?.getAttribute('aria-disabled')).toBe('true')
    })
  })
})

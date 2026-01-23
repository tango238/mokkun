/**
 * ActionButtonGroup Tests
 * アクションボタングループコンポーネントのテスト
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  ActionButtonGroup,
  type ActionButtonGroupConfig,
  type ActionButtonGroupState,
  type ActionButtonGroupCallbacks,
  type ActionButton,
} from '../renderer/components/action-buttons'
import type { Action, SubmitAction, NavigateAction, CustomAction } from '../types/schema'

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
// ActionButtonGroup Tests
// =============================================================================

describe('ActionButtonGroup', () => {
  let container: HTMLElement

  const basicConfig: ActionButtonGroupConfig = {
    buttons: [
      { id: 'save', type: 'submit', label: '保存', style: 'primary' },
      { id: 'cancel', type: 'navigate', label: 'キャンセル', to: '/back', style: 'secondary' },
    ],
  }

  beforeEach(() => {
    container = createMockContainer()
  })

  afterEach(() => {
    cleanupContainer(container)
  })

  // ---------------------------------------------------------------------------
  // Initialization Tests
  // ---------------------------------------------------------------------------

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const group = new ActionButtonGroup(basicConfig, container)
      const state = group.getState()

      expect(state.buttons.length).toBe(2)
      expect(state.alignment).toBe('end')
      expect(state.overflowMenuOpen).toBe(false)
    })

    it('should accept custom alignment', () => {
      const group = new ActionButtonGroup(
        { ...basicConfig, alignment: 'start' },
        container
      )
      const state = group.getState()

      expect(state.alignment).toBe('start')
    })

    it('should accept custom gap', () => {
      const group = new ActionButtonGroup(
        { ...basicConfig, gap: '16px' },
        container
      )
      const state = group.getState()

      expect(state.gap).toBe('16px')
    })
  })

  // ---------------------------------------------------------------------------
  // Rendering Tests
  // ---------------------------------------------------------------------------

  describe('rendering', () => {
    it('should render button group container', () => {
      const group = new ActionButtonGroup(basicConfig, container)
      group.render()

      expect(container.querySelector('.action-button-group')).toBeTruthy()
    })

    it('should render all buttons', () => {
      const group = new ActionButtonGroup(basicConfig, container)
      group.render()

      const buttons = container.querySelectorAll('.action-btn')
      expect(buttons.length).toBe(2)
    })

    it('should apply correct button styles', () => {
      const group = new ActionButtonGroup(basicConfig, container)
      group.render()

      expect(container.querySelector('.action-btn-primary')).toBeTruthy()
      expect(container.querySelector('.action-btn-secondary')).toBeTruthy()
    })

    it('should render button labels', () => {
      const group = new ActionButtonGroup(basicConfig, container)
      group.render()

      expect(container.textContent).toContain('保存')
      expect(container.textContent).toContain('キャンセル')
    })

    it('should render button with icon', () => {
      const configWithIcon: ActionButtonGroupConfig = {
        buttons: [
          { id: 'add', type: 'custom', label: '追加', handler: 'add', icon: '➕' },
        ],
      }
      const group = new ActionButtonGroup(configWithIcon, container)
      group.render()

      expect(container.querySelector('.action-btn-icon')).toBeTruthy()
      expect(container.textContent).toContain('➕')
    })

    it('should apply alignment class', () => {
      const group = new ActionButtonGroup(
        { ...basicConfig, alignment: 'center' },
        container
      )
      group.render()

      expect(container.querySelector('.alignment-center')).toBeTruthy()
    })

    it('should apply spread layout', () => {
      const group = new ActionButtonGroup(
        { ...basicConfig, alignment: 'spread' },
        container
      )
      group.render()

      expect(container.querySelector('.alignment-spread')).toBeTruthy()
    })
  })

  // ---------------------------------------------------------------------------
  // Button States Tests
  // ---------------------------------------------------------------------------

  describe('button states', () => {
    it('should render disabled button', () => {
      const configWithDisabled: ActionButtonGroupConfig = {
        buttons: [
          { id: 'submit', type: 'submit', label: 'Submit', disabled: true },
        ],
      }
      const group = new ActionButtonGroup(configWithDisabled, container)
      group.render()

      const button = container.querySelector('.action-btn') as HTMLButtonElement
      expect(button.disabled).toBe(true)
    })

    it('should set button loading state', () => {
      const group = new ActionButtonGroup(basicConfig, container)
      group.render()

      group.setLoading('save', true)

      const button = container.querySelector('[data-button-id="save"]')
      expect(button?.classList.contains('is-loading')).toBe(true)
    })

    it('should clear button loading state', () => {
      const group = new ActionButtonGroup(basicConfig, container)
      group.render()

      group.setLoading('save', true)
      group.setLoading('save', false)

      const button = container.querySelector('[data-button-id="save"]')
      expect(button?.classList.contains('is-loading')).toBe(false)
    })

    it('should disable button when loading', () => {
      const group = new ActionButtonGroup(basicConfig, container)
      group.render()

      group.setLoading('save', true)

      const button = container.querySelector('[data-button-id="save"]') as HTMLButtonElement
      expect(button.disabled).toBe(true)
    })

    it('should enable/disable button', () => {
      const group = new ActionButtonGroup(basicConfig, container)
      group.render()

      group.setDisabled('save', true)
      const button = container.querySelector('[data-button-id="save"]') as HTMLButtonElement
      expect(button.disabled).toBe(true)

      group.setDisabled('save', false)
      expect(button.disabled).toBe(false)
    })
  })

  // ---------------------------------------------------------------------------
  // Danger Button Tests
  // ---------------------------------------------------------------------------

  describe('danger button', () => {
    it('should render danger styled button', () => {
      const configWithDanger: ActionButtonGroupConfig = {
        buttons: [
          { id: 'delete', type: 'custom', label: '削除', handler: 'delete', style: 'danger' },
        ],
      }
      const group = new ActionButtonGroup(configWithDanger, container)
      group.render()

      expect(container.querySelector('.action-btn-danger')).toBeTruthy()
    })
  })

  // ---------------------------------------------------------------------------
  // Link Style Tests
  // ---------------------------------------------------------------------------

  describe('link style', () => {
    it('should render link styled button', () => {
      const configWithLink: ActionButtonGroupConfig = {
        buttons: [
          { id: 'more', type: 'navigate', label: 'もっと見る', to: '/more', style: 'link' },
        ],
      }
      const group = new ActionButtonGroup(configWithLink, container)
      group.render()

      expect(container.querySelector('.action-btn-link')).toBeTruthy()
    })
  })

  // ---------------------------------------------------------------------------
  // Callback Tests
  // ---------------------------------------------------------------------------

  describe('callbacks', () => {
    it('should call onClick callback when button clicked', () => {
      const onClick = vi.fn()
      const group = new ActionButtonGroup(basicConfig, container, { onClick })
      group.render()

      const button = container.querySelector('[data-button-id="save"]') as HTMLButtonElement
      button.click()

      expect(onClick).toHaveBeenCalledWith('save', expect.any(Object))
    })

    it('should call onSubmit callback for submit button', () => {
      const onSubmit = vi.fn()
      const group = new ActionButtonGroup(basicConfig, container, { onSubmit })
      group.render()

      const button = container.querySelector('[data-button-id="save"]') as HTMLButtonElement
      button.click()

      expect(onSubmit).toHaveBeenCalledWith('save', expect.any(Object))
    })

    it('should call onNavigate callback for navigate button', () => {
      const onNavigate = vi.fn()
      const group = new ActionButtonGroup(basicConfig, container, { onNavigate })
      group.render()

      const button = container.querySelector('[data-button-id="cancel"]') as HTMLButtonElement
      button.click()

      expect(onNavigate).toHaveBeenCalledWith('/back', expect.any(Object))
    })

    it('should call onCustom callback for custom button', () => {
      const onCustom = vi.fn()
      const configWithCustom: ActionButtonGroupConfig = {
        buttons: [
          { id: 'custom', type: 'custom', label: 'Custom', handler: 'doSomething' },
        ],
      }
      const group = new ActionButtonGroup(configWithCustom, container, { onCustom })
      group.render()

      const button = container.querySelector('[data-button-id="custom"]') as HTMLButtonElement
      button.click()

      expect(onCustom).toHaveBeenCalledWith('doSomething', expect.any(Object))
    })
  })

  // ---------------------------------------------------------------------------
  // Responsive Tests
  // ---------------------------------------------------------------------------

  describe('responsive', () => {
    it('should apply stack class when stackOnMobile is true', () => {
      const group = new ActionButtonGroup(
        { ...basicConfig, stackOnMobile: true },
        container
      )
      group.render()

      expect(container.querySelector('.stack-on-mobile')).toBeTruthy()
    })

    it('should render overflow menu when maxVisibleButtons is set', () => {
      const configWithMany: ActionButtonGroupConfig = {
        buttons: [
          { id: 'b1', type: 'submit', label: 'Button 1' },
          { id: 'b2', type: 'submit', label: 'Button 2' },
          { id: 'b3', type: 'submit', label: 'Button 3' },
          { id: 'b4', type: 'submit', label: 'Button 4' },
        ],
        maxVisibleButtons: 2,
      }
      const group = new ActionButtonGroup(configWithMany, container)
      group.render()

      expect(container.querySelector('.overflow-menu-trigger')).toBeTruthy()
    })

    it('should show overflow menu when triggered', () => {
      const configWithMany: ActionButtonGroupConfig = {
        buttons: [
          { id: 'b1', type: 'submit', label: 'Button 1' },
          { id: 'b2', type: 'submit', label: 'Button 2' },
          { id: 'b3', type: 'submit', label: 'Button 3' },
        ],
        maxVisibleButtons: 2,
      }
      const group = new ActionButtonGroup(configWithMany, container)
      group.render()

      group.toggleOverflowMenu()

      expect(group.getState().overflowMenuOpen).toBe(true)
      expect(container.querySelector('.overflow-menu.is-open')).toBeTruthy()
    })

    it('should close overflow menu', () => {
      const configWithMany: ActionButtonGroupConfig = {
        buttons: [
          { id: 'b1', type: 'submit', label: 'Button 1' },
          { id: 'b2', type: 'submit', label: 'Button 2' },
          { id: 'b3', type: 'submit', label: 'Button 3' },
        ],
        maxVisibleButtons: 2,
      }
      const group = new ActionButtonGroup(configWithMany, container)
      group.render()

      group.toggleOverflowMenu()
      group.closeOverflowMenu()

      expect(group.getState().overflowMenuOpen).toBe(false)
    })
  })

  // ---------------------------------------------------------------------------
  // Button Management Tests
  // ---------------------------------------------------------------------------

  describe('button management', () => {
    it('should add button', () => {
      const group = new ActionButtonGroup(basicConfig, container)
      group.render()

      group.addButton({ id: 'new', type: 'submit', label: 'New' })

      expect(group.getState().buttons.length).toBe(3)
    })

    it('should add button at specific index', () => {
      const group = new ActionButtonGroup(basicConfig, container)
      group.render()

      group.addButton({ id: 'new', type: 'submit', label: 'New' }, 1)

      expect(group.getState().buttons[1].id).toBe('new')
    })

    it('should remove button', () => {
      const group = new ActionButtonGroup(basicConfig, container)
      group.render()

      const result = group.removeButton('save')

      expect(result).toBe(true)
      expect(group.getState().buttons.length).toBe(1)
    })

    it('should return false when removing non-existent button', () => {
      const group = new ActionButtonGroup(basicConfig, container)
      group.render()

      const result = group.removeButton('nonexistent')

      expect(result).toBe(false)
    })

    it('should update button', () => {
      const group = new ActionButtonGroup(basicConfig, container)
      group.render()

      const result = group.updateButton('save', { label: 'Save Changes' })

      expect(result).toBe(true)
      expect(group.getState().buttons[0].label).toBe('Save Changes')
    })

    it('should get button by id', () => {
      const config: ActionButtonGroupConfig = {
        buttons: [
          { id: 'get_test', type: 'submit', label: 'Get Test Label', style: 'primary' },
        ],
      }
      const group = new ActionButtonGroup(config, container)
      group.render()

      const button = group.getButton('get_test')

      expect(button?.id).toBe('get_test')
      expect(button?.label).toBe('Get Test Label')
    })
  })

  // ---------------------------------------------------------------------------
  // Confirm Dialog Tests
  // ---------------------------------------------------------------------------

  describe('confirm dialog', () => {
    it('should call onConfirm callback before executing action with confirm', () => {
      const onConfirm = vi.fn().mockResolvedValue(true)
      const onSubmit = vi.fn()
      const configWithConfirm: ActionButtonGroupConfig = {
        buttons: [
          {
            id: 'delete',
            type: 'submit',
            label: 'Delete',
            style: 'danger',
            confirm: {
              title: '削除確認',
              message: '本当に削除しますか？',
            },
          },
        ],
      }
      const group = new ActionButtonGroup(configWithConfirm, container, { onConfirm, onSubmit })
      group.render()

      const button = container.querySelector('[data-button-id="delete"]') as HTMLButtonElement
      button.click()

      expect(onConfirm).toHaveBeenCalledWith(
        expect.objectContaining({ title: '削除確認', message: '本当に削除しますか？' }),
        expect.any(Object)
      )
    })
  })

  // ---------------------------------------------------------------------------
  // Accessibility Tests
  // ---------------------------------------------------------------------------

  describe('accessibility', () => {
    it('should have proper button type attributes', () => {
      const group = new ActionButtonGroup(basicConfig, container)
      group.render()

      const submitBtn = container.querySelector('[data-button-id="save"]')
      const navBtn = container.querySelector('[data-button-id="cancel"]')

      expect(submitBtn?.getAttribute('type')).toBe('submit')
      expect(navBtn?.getAttribute('type')).toBe('button')
    })

    it('should have aria-disabled when button is disabled', () => {
      const configWithDisabled: ActionButtonGroupConfig = {
        buttons: [
          { id: 'submit', type: 'submit', label: 'Submit', disabled: true },
        ],
      }
      const group = new ActionButtonGroup(configWithDisabled, container)
      group.render()

      const button = container.querySelector('.action-btn')
      expect(button?.getAttribute('aria-disabled')).toBe('true')
    })

    it('should have aria-busy when button is loading', () => {
      const group = new ActionButtonGroup(basicConfig, container)
      group.render()

      group.setLoading('save', true)

      const button = container.querySelector('[data-button-id="save"]')
      expect(button?.getAttribute('aria-busy')).toBe('true')
    })
  })

  // ---------------------------------------------------------------------------
  // From Action Type Tests
  // ---------------------------------------------------------------------------

  describe('fromActions static method', () => {
    it('should create config from Action array', () => {
      const actions: Action[] = [
        { id: 'save', type: 'submit', label: 'Save', style: 'primary' } as SubmitAction,
        { id: 'back', type: 'navigate', label: 'Back', to: '/list' } as NavigateAction,
      ]

      const config = ActionButtonGroup.fromActions(actions)

      expect(config.buttons.length).toBe(2)
      expect(config.buttons[0].id).toBe('save')
      expect(config.buttons[1].id).toBe('back')
    })

    it('should handle custom actions', () => {
      const actions: Action[] = [
        { id: 'print', type: 'custom', label: 'Print', handler: 'printPage', icon: '🖨️' } as CustomAction,
      ]

      const config = ActionButtonGroup.fromActions(actions)

      expect(config.buttons[0].handler).toBe('printPage')
      expect(config.buttons[0].icon).toBe('🖨️')
    })
  })

  // ---------------------------------------------------------------------------
  // Destroy Tests
  // ---------------------------------------------------------------------------

  describe('destroy', () => {
    it('should clean up DOM on destroy', () => {
      const group = new ActionButtonGroup(basicConfig, container)
      group.render()

      group.destroy()

      expect(container.querySelector('.action-button-group')).toBeNull()
    })
  })
})

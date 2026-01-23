/**
 * StatusLabel Component Tests
 * ステータスラベルコンポーネントのテスト（）
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  StatusLabel,
  createStatusLabel,
  type StatusLabelConfig,
  type StatusLabelCallbacks,
} from '../renderer/components/status-label'

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
// StatusLabel Component Tests
// =============================================================================

describe('StatusLabel Component', () => {
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
    it('should initialize with required text config', () => {
      const config: StatusLabelConfig = { text: 'Active' }
      const statusLabel = new StatusLabel(container, config)
      statusLabel.render()

      expect(container.classList.contains('mokkun-status-label')).toBe(true)
      expect(container.querySelector('.status-label-content')).toBeTruthy()
    })

    it('should initialize with specified text', () => {
      const config: StatusLabelConfig = { text: 'Pending' }
      const statusLabel = new StatusLabel(container, config)
      statusLabel.render()

      expect(statusLabel.getText()).toBe('Pending')
      const textEl = container.querySelector('.status-label-text')
      expect(textEl?.textContent).toBe('Pending')
    })

    it('should initialize with default type (grey)', () => {
      const config: StatusLabelConfig = { text: 'Draft' }
      const statusLabel = new StatusLabel(container, config)
      statusLabel.render()

      expect(container.classList.contains('status-label-grey')).toBe(true)
      expect(container.getAttribute('data-type')).toBe('grey')
    })

    it('should initialize with default size (medium)', () => {
      const config: StatusLabelConfig = { text: 'Active' }
      const statusLabel = new StatusLabel(container, config)
      statusLabel.render()

      expect(container.classList.contains('status-label-medium')).toBe(true)
      expect(container.getAttribute('data-size')).toBe('medium')
    })

    it('should initialize with non-bold state by default', () => {
      const config: StatusLabelConfig = { text: 'Active' }
      const statusLabel = new StatusLabel(container, config)
      statusLabel.render()

      expect(statusLabel.isBold()).toBe(false)
      expect(container.classList.contains('status-label-bold')).toBe(false)
      expect(container.hasAttribute('data-bold')).toBe(false)
    })

    it('should initialize with bold state when specified', () => {
      const config: StatusLabelConfig = { text: 'Critical', bold: true }
      const statusLabel = new StatusLabel(container, config)
      statusLabel.render()

      expect(statusLabel.isBold()).toBe(true)
      expect(container.classList.contains('status-label-bold')).toBe(true)
      expect(container.hasAttribute('data-bold')).toBe(true)
    })
  })

  // ===========================================================================
  // Type Variants Tests
  // ===========================================================================

  describe('Type Variants', () => {
    const types = ['grey', 'blue', 'green', 'yellow', 'red', 'warning', 'error'] as const

    types.forEach((type) => {
      it(`should render ${type} type correctly`, () => {
        const config: StatusLabelConfig = { text: 'Status', type }
        const statusLabel = new StatusLabel(container, config)
        statusLabel.render()

        expect(container.classList.contains(`status-label-${type}`)).toBe(true)
        expect(container.getAttribute('data-type')).toBe(type)
      })
    })
  })

  // ===========================================================================
  // Size Variants Tests
  // ===========================================================================

  describe('Size Variants', () => {
    it('should render small size correctly', () => {
      const config: StatusLabelConfig = { text: 'Status', size: 'small' }
      const statusLabel = new StatusLabel(container, config)
      statusLabel.render()

      expect(container.classList.contains('status-label-small')).toBe(true)
      expect(container.getAttribute('data-size')).toBe('small')
    })

    it('should render medium size correctly', () => {
      const config: StatusLabelConfig = { text: 'Status', size: 'medium' }
      const statusLabel = new StatusLabel(container, config)
      statusLabel.render()

      expect(container.classList.contains('status-label-medium')).toBe(true)
      expect(container.getAttribute('data-size')).toBe('medium')
    })
  })

  // ===========================================================================
  // Icon Tests
  // ===========================================================================

  describe('Icon Support', () => {
    it('should render built-in check icon', () => {
      const config: StatusLabelConfig = { text: 'Complete', icon: 'check' }
      const statusLabel = new StatusLabel(container, config)
      statusLabel.render()

      const iconEl = container.querySelector('.status-label-icon')
      expect(iconEl).toBeTruthy()
      expect(iconEl?.querySelector('svg')).toBeTruthy()
      expect(iconEl?.getAttribute('aria-hidden')).toBe('true')
    })

    it('should render built-in warning icon', () => {
      const config: StatusLabelConfig = { text: 'Warning', icon: 'warning' }
      const statusLabel = new StatusLabel(container, config)
      statusLabel.render()

      const iconEl = container.querySelector('.status-label-icon')
      expect(iconEl).toBeTruthy()
      expect(iconEl?.querySelector('svg')).toBeTruthy()
    })

    it('should render built-in error icon', () => {
      const config: StatusLabelConfig = { text: 'Error', icon: 'error' }
      const statusLabel = new StatusLabel(container, config)
      statusLabel.render()

      const iconEl = container.querySelector('.status-label-icon')
      expect(iconEl).toBeTruthy()
    })

    it('should render built-in info icon', () => {
      const config: StatusLabelConfig = { text: 'Info', icon: 'info' }
      const statusLabel = new StatusLabel(container, config)
      statusLabel.render()

      const iconEl = container.querySelector('.status-label-icon')
      expect(iconEl).toBeTruthy()
    })

    it('should render built-in clock icon', () => {
      const config: StatusLabelConfig = { text: 'Pending', icon: 'clock' }
      const statusLabel = new StatusLabel(container, config)
      statusLabel.render()

      const iconEl = container.querySelector('.status-label-icon')
      expect(iconEl).toBeTruthy()
    })

    it('should render built-in circle icon', () => {
      const config: StatusLabelConfig = { text: 'Active', icon: 'circle' }
      const statusLabel = new StatusLabel(container, config)
      statusLabel.render()

      const iconEl = container.querySelector('.status-label-icon')
      expect(iconEl).toBeTruthy()
    })

    it('should render built-in dot icon', () => {
      const config: StatusLabelConfig = { text: 'Online', icon: 'dot' }
      const statusLabel = new StatusLabel(container, config)
      statusLabel.render()

      const iconEl = container.querySelector('.status-label-icon')
      expect(iconEl).toBeTruthy()
    })

    it('should render icon on the left by default', () => {
      const config: StatusLabelConfig = { text: 'Status', icon: 'check' }
      const statusLabel = new StatusLabel(container, config)
      statusLabel.render()

      const content = container.querySelector('.status-label-content')
      const children = content?.children
      expect(children?.[0]?.classList.contains('status-label-icon')).toBe(true)
      expect(children?.[1]?.classList.contains('status-label-text')).toBe(true)
    })

    it('should render icon on the right when specified', () => {
      const config: StatusLabelConfig = { text: 'Status', icon: 'check', iconPosition: 'right' }
      const statusLabel = new StatusLabel(container, config)
      statusLabel.render()

      const content = container.querySelector('.status-label-content')
      const children = content?.children
      expect(children?.[0]?.classList.contains('status-label-text')).toBe(true)
      expect(children?.[1]?.classList.contains('status-label-icon')).toBe(true)
    })

    it('should render custom SVG icon', () => {
      const customSvg = '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="3"/></svg>'
      const config: StatusLabelConfig = { text: 'Custom', icon: customSvg }
      const statusLabel = new StatusLabel(container, config)
      statusLabel.render()

      const iconEl = container.querySelector('.status-label-icon')
      expect(iconEl).toBeTruthy()
      expect(iconEl?.innerHTML).toContain('<svg')
    })

    it('should sanitize malicious custom icons with onerror', () => {
      const maliciousIcon = '<svg><image onerror="alert(1)" /></svg>'
      const config: StatusLabelConfig = { text: 'Status', icon: maliciousIcon }
      const statusLabel = new StatusLabel(container, config)
      statusLabel.render()

      const iconEl = container.querySelector('.status-label-icon')
      expect(iconEl?.innerHTML).not.toContain('onerror')
    })

    it('should sanitize malicious custom icons with onclick', () => {
      const maliciousIcon = '<svg onclick="alert(1)"><circle cx="8" cy="8" r="4"/></svg>'
      const config: StatusLabelConfig = { text: 'Status', icon: maliciousIcon }
      const statusLabel = new StatusLabel(container, config)
      statusLabel.render()

      const iconEl = container.querySelector('.status-label-icon')
      expect(iconEl?.innerHTML).not.toContain('onclick')
    })

    it('should reject non-SVG HTML in custom icons', () => {
      const divIcon = '<div>Not an SVG</div>'
      const config: StatusLabelConfig = { text: 'Status', icon: divIcon }
      const statusLabel = new StatusLabel(container, config)
      statusLabel.render()

      const iconEl = container.querySelector('.status-label-icon')
      expect(iconEl?.innerHTML).toBe('')
    })

    it('should reject img tags in custom icons', () => {
      const imgIcon = '<img src=x onerror="alert(1)">'
      const config: StatusLabelConfig = { text: 'Status', icon: imgIcon }
      const statusLabel = new StatusLabel(container, config)
      statusLabel.render()

      const iconEl = container.querySelector('.status-label-icon')
      expect(iconEl?.innerHTML).toBe('')
      expect(iconEl?.querySelector('img')).toBeFalsy()
    })

    it('should remove script tags from custom SVG icons', () => {
      const scriptIcon = '<svg><script>alert(1)</script><circle cx="8" cy="8" r="4"/></svg>'
      const config: StatusLabelConfig = { text: 'Status', icon: scriptIcon }
      const statusLabel = new StatusLabel(container, config)
      statusLabel.render()

      const iconEl = container.querySelector('.status-label-icon')
      expect(iconEl?.innerHTML).not.toContain('script')
      expect(iconEl?.innerHTML).toContain('<svg')
    })

    it('should remove foreignObject from custom SVG icons', () => {
      const foreignIcon = '<svg><foreignObject><div onclick="alert(1)">Danger</div></foreignObject></svg>'
      const config: StatusLabelConfig = { text: 'Status', icon: foreignIcon }
      const statusLabel = new StatusLabel(container, config)
      statusLabel.render()

      const iconEl = container.querySelector('.status-label-icon')
      expect(iconEl?.innerHTML).not.toContain('foreignObject')
    })

    it('should remove javascript: hrefs from custom SVG icons', () => {
      const jsHrefIcon = '<svg><a href="javascript:alert(1)"><circle cx="8" cy="8" r="4"/></a></svg>'
      const config: StatusLabelConfig = { text: 'Status', icon: jsHrefIcon }
      const statusLabel = new StatusLabel(container, config)
      statusLabel.render()

      const iconEl = container.querySelector('.status-label-icon')
      expect(iconEl?.innerHTML).not.toContain('javascript:')
    })
  })

  // ===========================================================================
  // State Management Tests
  // ===========================================================================

  describe('State Management', () => {
    it('should update text via setText', () => {
      const config: StatusLabelConfig = { text: 'Initial' }
      const statusLabel = new StatusLabel(container, config)
      statusLabel.render()

      expect(statusLabel.getText()).toBe('Initial')

      statusLabel.setText('Updated')

      expect(statusLabel.getText()).toBe('Updated')
      const textEl = container.querySelector('.status-label-text')
      expect(textEl?.textContent).toBe('Updated')
    })

    it('should not re-render when setting same text', () => {
      const config: StatusLabelConfig = { text: 'Status' }
      const statusLabel = new StatusLabel(container, config)
      statusLabel.render()

      const renderSpy = vi.spyOn(statusLabel, 'render')
      statusLabel.setText('Status')

      expect(renderSpy).not.toHaveBeenCalled()
    })

    it('should update bold state via setBold', () => {
      const config: StatusLabelConfig = { text: 'Status' }
      const statusLabel = new StatusLabel(container, config)
      statusLabel.render()

      expect(statusLabel.isBold()).toBe(false)
      expect(container.classList.contains('status-label-bold')).toBe(false)

      statusLabel.setBold(true)

      expect(statusLabel.isBold()).toBe(true)
      expect(container.classList.contains('status-label-bold')).toBe(true)
      expect(container.hasAttribute('data-bold')).toBe(true)
    })

    it('should not re-render when setting same bold state', () => {
      const config: StatusLabelConfig = { text: 'Status', bold: true }
      const statusLabel = new StatusLabel(container, config)
      statusLabel.render()

      const renderSpy = vi.spyOn(statusLabel, 'render')
      statusLabel.setBold(true)

      expect(renderSpy).not.toHaveBeenCalled()
    })

    it('should hide via setHidden', () => {
      const config: StatusLabelConfig = { text: 'Status' }
      const statusLabel = new StatusLabel(container, config)
      statusLabel.render()

      statusLabel.setHidden(true)

      expect(container.hasAttribute('data-hidden')).toBe(true)
      expect(container.style.display).toBe('none')
    })

    it('should show via setHidden(false)', () => {
      const config: StatusLabelConfig = { text: 'Status' }
      const statusLabel = new StatusLabel(container, config)
      statusLabel.render()
      statusLabel.setHidden(true)

      statusLabel.setHidden(false)

      expect(container.hasAttribute('data-hidden')).toBe(false)
      expect(container.style.display).toBe('')
    })

    it('should return correct state via getState', () => {
      const config: StatusLabelConfig = { text: 'Active', bold: true }
      const statusLabel = new StatusLabel(container, config)
      statusLabel.render()

      const state = statusLabel.getState()

      expect(state.text).toBe('Active')
      expect(state.bold).toBe(true)
      expect(state.hidden).toBe(false)
    })
  })

  // ===========================================================================
  // Click Handler Tests
  // ===========================================================================

  describe('Click Handler', () => {
    it('should be clickable when configured', () => {
      const config: StatusLabelConfig = { text: 'Status', clickable: true }
      const statusLabel = new StatusLabel(container, config)
      statusLabel.render()

      expect(container.classList.contains('status-label-clickable')).toBe(true)
    })

    it('should not be clickable by default', () => {
      const config: StatusLabelConfig = { text: 'Status' }
      const statusLabel = new StatusLabel(container, config)
      statusLabel.render()

      expect(container.classList.contains('status-label-clickable')).toBe(false)
    })

    it('should call onClick callback when clicked', () => {
      const onClick = vi.fn()
      const config: StatusLabelConfig = { text: 'Status', clickable: true }
      const callbacks: StatusLabelCallbacks = { onClick }
      const statusLabel = new StatusLabel(container, config, callbacks)
      statusLabel.render()

      container.click()

      expect(onClick).toHaveBeenCalledTimes(1)
      expect(onClick).toHaveBeenCalledWith(expect.any(MouseEvent))
    })

    it('should not call onClick if not clickable', () => {
      const onClick = vi.fn()
      const config: StatusLabelConfig = { text: 'Status' }
      const callbacks: StatusLabelCallbacks = { onClick }
      const statusLabel = new StatusLabel(container, config, callbacks)
      statusLabel.render()

      container.click()

      expect(onClick).not.toHaveBeenCalled()
    })

    it('should remove event listener on destroy', () => {
      const onClick = vi.fn()
      const config: StatusLabelConfig = { text: 'Status', clickable: true }
      const callbacks: StatusLabelCallbacks = { onClick }
      const statusLabel = new StatusLabel(container, config, callbacks)
      statusLabel.render()

      statusLabel.destroy()
      container.click()

      expect(onClick).not.toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // Accessibility Tests
  // ===========================================================================

  describe('Accessibility', () => {
    it('should have role="status"', () => {
      const config: StatusLabelConfig = { text: 'Active' }
      const statusLabel = new StatusLabel(container, config)
      statusLabel.render()

      const content = container.querySelector('.status-label-content')
      expect(content?.getAttribute('role')).toBe('status')
    })

    it('should have aria-label with text by default', () => {
      const config: StatusLabelConfig = { text: 'Pending Review' }
      const statusLabel = new StatusLabel(container, config)
      statusLabel.render()

      const content = container.querySelector('.status-label-content')
      expect(content?.getAttribute('aria-label')).toBe('Pending Review')
    })

    it('should use custom label when provided', () => {
      const config: StatusLabelConfig = {
        text: 'OK',
        label: 'Status is OK',
      }
      const statusLabel = new StatusLabel(container, config)
      statusLabel.render()

      const content = container.querySelector('.status-label-content')
      expect(content?.getAttribute('aria-label')).toBe('Status is OK')
    })

    it('should have aria-hidden on icon', () => {
      const config: StatusLabelConfig = { text: 'Status', icon: 'check' }
      const statusLabel = new StatusLabel(container, config)
      statusLabel.render()

      const iconEl = container.querySelector('.status-label-icon')
      expect(iconEl?.getAttribute('aria-hidden')).toBe('true')
    })
  })

  // ===========================================================================
  // Factory Function Tests
  // ===========================================================================

  describe('createStatusLabel Factory', () => {
    it('should create and render StatusLabel', () => {
      const statusLabel = createStatusLabel(container, { text: 'Active' })

      expect(container.classList.contains('mokkun-status-label')).toBe(true)
      expect(statusLabel.getText()).toBe('Active')
    })

    it('should pass callbacks correctly', () => {
      const onClick = vi.fn()
      const statusLabel = createStatusLabel(
        container,
        { text: 'Click', clickable: true },
        { onClick }
      )

      container.click()

      expect(onClick).toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // Destroy Tests
  // ===========================================================================

  describe('Destroy', () => {
    it('should clear container content', () => {
      const statusLabel = createStatusLabel(container, { text: 'Status' })

      expect(container.innerHTML).not.toBe('')

      statusLabel.destroy()

      expect(container.innerHTML).toBe('')
    })

    it('should remove click handler', () => {
      const onClick = vi.fn()
      const statusLabel = createStatusLabel(
        container,
        { text: 'Click', clickable: true },
        { onClick }
      )

      statusLabel.destroy()
      container.click()

      expect(onClick).not.toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // Combined Scenarios Tests
  // ===========================================================================

  describe('Combined Scenarios', () => {
    it('should render bold green with check icon', () => {
      const config: StatusLabelConfig = {
        text: 'Complete',
        type: 'green',
        bold: true,
        icon: 'check',
      }
      const statusLabel = createStatusLabel(container, config)

      expect(container.classList.contains('status-label-green')).toBe(true)
      expect(container.classList.contains('status-label-bold')).toBe(true)
      expect(container.querySelector('.status-label-icon')).toBeTruthy()
      expect(statusLabel.getText()).toBe('Complete')
    })

    it('should render small red error with error icon on right', () => {
      const config: StatusLabelConfig = {
        text: 'Failed',
        type: 'error',
        size: 'small',
        icon: 'error',
        iconPosition: 'right',
      }
      const statusLabel = createStatusLabel(container, config)

      expect(container.classList.contains('status-label-error')).toBe(true)
      expect(container.classList.contains('status-label-small')).toBe(true)

      const content = container.querySelector('.status-label-content')
      const children = content?.children
      expect(children?.[0]?.classList.contains('status-label-text')).toBe(true)
      expect(children?.[1]?.classList.contains('status-label-icon')).toBe(true)
    })

    it('should update text and bold state together', () => {
      const statusLabel = createStatusLabel(container, { text: 'Draft', type: 'grey' })

      expect(statusLabel.getText()).toBe('Draft')
      expect(statusLabel.isBold()).toBe(false)

      statusLabel.setText('Published')
      statusLabel.setBold(true)

      expect(statusLabel.getText()).toBe('Published')
      expect(statusLabel.isBold()).toBe(true)
      expect(container.classList.contains('status-label-bold')).toBe(true)
    })
  })
})

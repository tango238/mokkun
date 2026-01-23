/**
 * Tabs Component Tests
 * タブコンポーネントのテスト
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  Tabs,
  type TabsConfig,
  type TabDefinition,
} from '../renderer/components/tabs'

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
// Tabs Component Tests
// =============================================================================

describe('Tabs Component', () => {
  let container: HTMLElement

  const basicTabs: TabDefinition[] = [
    { id: 'tab1', label: 'Tab 1', content: '<p>Content 1</p>' },
    { id: 'tab2', label: 'Tab 2', content: '<p>Content 2</p>' },
    { id: 'tab3', label: 'Tab 3', content: '<p>Content 3</p>', disabled: true },
  ]

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
      const config: TabsConfig = { tabs: basicTabs }
      const tabs = new Tabs(config, container)
      tabs.render()

      expect(container.classList.contains('mokkun-tabs')).toBe(true)
      expect(container.querySelector('.tabs-list')).toBeTruthy()
      expect(container.querySelectorAll('.tab-button').length).toBe(3)
    })

    it('should set default active tab', () => {
      const config: TabsConfig = { tabs: basicTabs }
      const tabs = new Tabs(config, container)
      tabs.render()

      expect(tabs.getState().activeTabId).toBe('tab1')
      const activeButton = container.querySelector('.tab-button.active')
      expect(activeButton?.textContent).toContain('Tab 1')
    })

    it('should set custom default active tab', () => {
      const config: TabsConfig = {
        tabs: basicTabs,
        defaultActiveTab: 'tab2',
      }
      const tabs = new Tabs(config, container)
      tabs.render()

      expect(tabs.getState().activeTabId).toBe('tab2')
    })

    it('should skip disabled tabs when finding default', () => {
      const disabledFirst: TabDefinition[] = [
        { id: 'tab1', label: 'Tab 1', disabled: true },
        { id: 'tab2', label: 'Tab 2' },
      ]
      const config: TabsConfig = { tabs: disabledFirst }
      const tabs = new Tabs(config, container)
      tabs.render()

      expect(tabs.getState().activeTabId).toBe('tab2')
    })
  })

  // ===========================================================================
  // Variant Tests
  // ===========================================================================

  describe('Variants', () => {
    it('should render default variant', () => {
      const config: TabsConfig = {
        tabs: basicTabs,
        variant: 'default',
      }
      const tabs = new Tabs(config, container)
      tabs.render()

      expect(container.classList.contains('tabs-default')).toBe(true)
    })

    it('should render pills variant', () => {
      const config: TabsConfig = {
        tabs: basicTabs,
        variant: 'pills',
      }
      const tabs = new Tabs(config, container)
      tabs.render()

      expect(container.classList.contains('tabs-pills')).toBe(true)
    })

    it('should render underline variant', () => {
      const config: TabsConfig = {
        tabs: basicTabs,
        variant: 'underline',
      }
      const tabs = new Tabs(config, container)
      tabs.render()

      expect(container.classList.contains('tabs-underline')).toBe(true)
    })

    it('should render bordered variant ', () => {
      const config: TabsConfig = {
        tabs: basicTabs,
        variant: 'bordered',
      }
      const tabs = new Tabs(config, container)
      tabs.render()

      expect(container.classList.contains('tabs-bordered')).toBe(true)
    })

    it('should render segmented variant', () => {
      const config: TabsConfig = {
        tabs: basicTabs,
        variant: 'segmented',
      }
      const tabs = new Tabs(config, container)
      tabs.render()

      expect(container.classList.contains('tabs-segmented')).toBe(true)
    })

    it('should apply bordered class when bordered prop is true', () => {
      const config: TabsConfig = {
        tabs: basicTabs,
        bordered: true,
      }
      const tabs = new Tabs(config, container)
      tabs.render()

      expect(container.classList.contains('tabs-bordered')).toBe(true)
    })
  })

  // ===========================================================================
  // Position Tests
  // ===========================================================================

  describe('Position', () => {
    it('should render top position (default)', () => {
      const config: TabsConfig = { tabs: basicTabs }
      const tabs = new Tabs(config, container)
      tabs.render()

      expect(container.classList.contains('tabs-top')).toBe(true)
    })

    it('should render bottom position', () => {
      const config: TabsConfig = {
        tabs: basicTabs,
        position: 'bottom',
      }
      const tabs = new Tabs(config, container)
      tabs.render()

      expect(container.classList.contains('tabs-bottom')).toBe(true)
    })

    it('should render left position', () => {
      const config: TabsConfig = {
        tabs: basicTabs,
        position: 'left',
      }
      const tabs = new Tabs(config, container)
      tabs.render()

      expect(container.classList.contains('tabs-left')).toBe(true)
    })

    it('should render right position', () => {
      const config: TabsConfig = {
        tabs: basicTabs,
        position: 'right',
      }
      const tabs = new Tabs(config, container)
      tabs.render()

      expect(container.classList.contains('tabs-right')).toBe(true)
    })
  })

  // ===========================================================================
  // Scrollable Tests
  // ===========================================================================

  describe('Scrollable', () => {
    it('should apply scrollable class when scrollable is true', () => {
      const config: TabsConfig = {
        tabs: basicTabs,
        scrollable: true,
      }
      const tabs = new Tabs(config, container)
      tabs.render()

      expect(container.classList.contains('tabs-scrollable')).toBe(true)
    })

    it('should not apply scrollable class by default', () => {
      const config: TabsConfig = { tabs: basicTabs }
      const tabs = new Tabs(config, container)
      tabs.render()

      expect(container.classList.contains('tabs-scrollable')).toBe(false)
    })

    it('should handle many tabs with scrollable enabled', () => {
      const manyTabs: TabDefinition[] = Array.from({ length: 20 }, (_, i) => ({
        id: `tab${i + 1}`,
        label: `Tab ${i + 1}`,
        content: `<p>Content ${i + 1}</p>`,
      }))

      const config: TabsConfig = {
        tabs: manyTabs,
        scrollable: true,
      }
      const tabs = new Tabs(config, container)
      tabs.render()

      expect(container.querySelectorAll('.tab-button').length).toBe(20)
      expect(container.classList.contains('tabs-scrollable')).toBe(true)
    })
  })

  // ===========================================================================
  // Icon Tests
  // ===========================================================================

  describe('Icons', () => {
    it('should render tab with icon', () => {
      const tabsWithIcons: TabDefinition[] = [
        {
          id: 'tab1',
          label: 'Home',
          icon: '<svg><circle cx="12" cy="12" r="10"/></svg>',
          content: '<p>Home content</p>',
        },
      ]
      const config: TabsConfig = { tabs: tabsWithIcons }
      const tabs = new Tabs(config, container)
      tabs.render()

      const icon = container.querySelector('.tab-icon')
      expect(icon).toBeTruthy()
      expect(icon?.innerHTML).toContain('svg')
    })

    it('should render icon with accessibility label', () => {
      const tabsWithIcons: TabDefinition[] = [
        {
          id: 'tab1',
          label: 'Settings',
          icon: '<svg><circle cx="12" cy="12" r="10"/></svg>',
          iconLabel: 'Settings icon',
          content: '<p>Settings content</p>',
        },
      ]
      const config: TabsConfig = { tabs: tabsWithIcons }
      const tabs = new Tabs(config, container)
      tabs.render()

      const icon = container.querySelector('.tab-icon')
      expect(icon?.getAttribute('aria-label')).toBe('Settings icon')
      expect(icon?.getAttribute('role')).toBe('img')
    })

    it('should render tab without icon', () => {
      const config: TabsConfig = { tabs: basicTabs }
      const tabs = new Tabs(config, container)
      tabs.render()

      const icon = container.querySelector('.tab-icon')
      expect(icon).toBeFalsy()
    })
  })

  // ===========================================================================
  // Badge Tests
  // ===========================================================================

  describe('Badges', () => {
    it('should render numeric badge', () => {
      const tabsWithBadges: TabDefinition[] = [
        {
          id: 'tab1',
          label: 'Messages',
          badge: 5,
          content: '<p>Messages</p>',
        },
      ]
      const config: TabsConfig = { tabs: tabsWithBadges }
      const tabs = new Tabs(config, container)
      tabs.render()

      const badge = container.querySelector('.tab-badge')
      expect(badge).toBeTruthy()
      expect(badge?.textContent).toBe('5')
    })

    it('should render string badge', () => {
      const tabsWithBadges: TabDefinition[] = [
        {
          id: 'tab1',
          label: 'Notifications',
          badge: 'NEW',
          content: '<p>Notifications</p>',
        },
      ]
      const config: TabsConfig = { tabs: tabsWithBadges }
      const tabs = new Tabs(config, container)
      tabs.render()

      const badge = container.querySelector('.tab-badge')
      expect(badge?.textContent).toBe('NEW')
    })

    it('should not render badge when not provided', () => {
      const config: TabsConfig = { tabs: basicTabs }
      const tabs = new Tabs(config, container)
      tabs.render()

      const badge = container.querySelector('.tab-badge')
      expect(badge).toBeFalsy()
    })
  })

  // ===========================================================================
  // Tab Switching Tests
  // ===========================================================================

  describe('Tab Switching', () => {
    it('should switch tab on click', () => {
      const config: TabsConfig = { tabs: basicTabs }
      const tabs = new Tabs(config, container)
      tabs.render()

      const tabButtons = Array.from(container.querySelectorAll('.tab-button'))
      const tab2Button = tabButtons.find(
        btn => btn.textContent?.includes('Tab 2')
      ) as HTMLButtonElement

      expect(tab2Button).toBeTruthy()
      tab2Button.click()

      expect(tabs.getState().activeTabId).toBe('tab2')
    })

    it('should switch tab programmatically', () => {
      const config: TabsConfig = { tabs: basicTabs }
      const tabs = new Tabs(config, container)
      tabs.render()

      const result = tabs.setActiveTab('tab2')

      expect(result).toBe(true)
      expect(tabs.getState().activeTabId).toBe('tab2')
    })

    it('should not switch to disabled tab', () => {
      const config: TabsConfig = { tabs: basicTabs }
      const tabs = new Tabs(config, container)
      tabs.render()

      const result = tabs.setActiveTab('tab3')

      expect(result).toBe(false)
      expect(tabs.getState().activeTabId).toBe('tab1')
    })

    it('should not switch to non-existent tab', () => {
      const config: TabsConfig = { tabs: basicTabs }
      const tabs = new Tabs(config, container)
      tabs.render()

      const result = tabs.setActiveTab('nonexistent')

      expect(result).toBe(false)
      expect(tabs.getState().activeTabId).toBe('tab1')
    })

    it('should show/hide panels when switching tabs', () => {
      const config: TabsConfig = { tabs: basicTabs }
      const tabs = new Tabs(config, container)
      tabs.render()

      let panels = container.querySelectorAll('[role="tabpanel"]')
      const panel1 = panels[0] as HTMLElement
      const panel2 = panels[1] as HTMLElement

      expect(panel1.classList.contains('active')).toBe(true)
      expect(panel2.classList.contains('active')).toBe(false)
      expect(panel1.hasAttribute('hidden')).toBe(false)
      expect(panel2.hasAttribute('hidden')).toBe(true)

      tabs.setActiveTab('tab2')

      // Re-query after render
      panels = container.querySelectorAll('[role="tabpanel"]')
      const newPanel1 = panels[0] as HTMLElement
      const newPanel2 = panels[1] as HTMLElement

      expect(newPanel1.classList.contains('active')).toBe(false)
      expect(newPanel2.classList.contains('active')).toBe(true)
    })
  })

  // ===========================================================================
  // Keyboard Navigation Tests
  // ===========================================================================

  describe('Keyboard Navigation', () => {
    it('should navigate to next tab with ArrowRight', () => {
      const config: TabsConfig = { tabs: basicTabs }
      const tabs = new Tabs(config, container)
      tabs.render()

      tabs.nextTab()

      expect(tabs.getState().activeTabId).toBe('tab2')
    })

    it('should navigate to previous tab with ArrowLeft', () => {
      const config: TabsConfig = {
        tabs: basicTabs,
        defaultActiveTab: 'tab2',
      }
      const tabs = new Tabs(config, container)
      tabs.render()

      tabs.previousTab()

      expect(tabs.getState().activeTabId).toBe('tab1')
    })

    it('should skip disabled tabs when navigating', () => {
      const tabsWithDisabled: TabDefinition[] = [
        { id: 'tab1', label: 'Tab 1' },
        { id: 'tab2', label: 'Tab 2', disabled: true },
        { id: 'tab3', label: 'Tab 3' },
      ]
      const config: TabsConfig = { tabs: tabsWithDisabled }
      const tabs = new Tabs(config, container)
      tabs.render()

      tabs.nextTab()

      expect(tabs.getState().activeTabId).toBe('tab3')
    })

    it('should wrap around when reaching end', () => {
      const config: TabsConfig = {
        tabs: basicTabs,
        defaultActiveTab: 'tab2',
      }
      const tabs = new Tabs(config, container)
      tabs.render()

      tabs.nextTab()

      expect(tabs.getState().activeTabId).toBe('tab1')
    })
  })

  // ===========================================================================
  // Dynamic Tab Management Tests
  // ===========================================================================

  describe('Dynamic Tab Management', () => {
    it('should add new tab', () => {
      const config: TabsConfig = { tabs: basicTabs }
      const tabs = new Tabs(config, container)
      tabs.render()

      tabs.addTab({ id: 'tab4', label: 'Tab 4', content: '<p>Content 4</p>' })

      expect(tabs.getState().tabs.length).toBe(4)
      expect(container.querySelectorAll('.tab-button').length).toBe(4)
    })

    it('should remove tab', () => {
      const config: TabsConfig = { tabs: basicTabs }
      const tabs = new Tabs(config, container)
      tabs.render()

      const result = tabs.removeTab('tab2')

      expect(result).toBe(true)
      expect(tabs.getState().tabs.length).toBe(2)
      expect(container.querySelectorAll('.tab-button').length).toBe(2)
    })

    it('should update tab', () => {
      const config: TabsConfig = { tabs: basicTabs }
      const tabs = new Tabs(config, container)
      tabs.render()

      const result = tabs.updateTab('tab1', { label: 'Updated Tab 1' })

      expect(result).toBe(true)
      const tab1 = tabs.getState().tabs.find(t => t.id === 'tab1')
      expect(tab1?.label).toBe('Updated Tab 1')
    })
  })

  // ===========================================================================
  // Accessibility Tests
  // ===========================================================================

  describe('Accessibility', () => {
    it('should have proper ARIA roles', () => {
      const config: TabsConfig = { tabs: basicTabs }
      const tabs = new Tabs(config, container)
      tabs.render()

      expect(container.querySelector('[role="tablist"]')).toBeTruthy()
      expect(container.querySelector('[role="tab"]')).toBeTruthy()
      expect(container.querySelector('[role="tabpanel"]')).toBeTruthy()
    })

    it('should set aria-selected on active tab', () => {
      const config: TabsConfig = { tabs: basicTabs }
      const tabs = new Tabs(config, container)
      tabs.render()

      const activeTab = container.querySelector('.tab-button.active')
      expect(activeTab?.getAttribute('aria-selected')).toBe('true')

      const inactiveTabs = container.querySelectorAll('.tab-button:not(.active)')
      inactiveTabs.forEach(tab => {
        expect(tab.getAttribute('aria-selected')).toBe('false')
      })
    })

    it('should set aria-disabled on disabled tabs', () => {
      const config: TabsConfig = { tabs: basicTabs }
      const tabs = new Tabs(config, container)
      tabs.render()

      const disabledTab = container.querySelector('.tab-button.disabled')
      expect(disabledTab?.getAttribute('aria-disabled')).toBe('true')
    })

    it('should link tabs to panels with aria-controls', () => {
      const config: TabsConfig = { tabs: basicTabs }
      const tabs = new Tabs(config, container)
      tabs.render()

      const tabButtons = container.querySelectorAll('[role="tab"]')
      tabButtons.forEach(button => {
        const controlsId = button.getAttribute('aria-controls')
        expect(controlsId).toBeTruthy()
        expect(container.querySelector(`#${controlsId}`)).toBeTruthy()
      })
    })

    it('should set proper tabindex', () => {
      const config: TabsConfig = { tabs: basicTabs }
      const tabs = new Tabs(config, container)
      tabs.render()

      const activeTab = container.querySelector('.tab-button.active')
      expect(activeTab?.getAttribute('tabindex')).toBe('0')

      const inactiveTabs = container.querySelectorAll('.tab-button:not(.active)')
      inactiveTabs.forEach(tab => {
        expect(tab.getAttribute('tabindex')).toBe('-1')
      })
    })
  })

  // ===========================================================================
  // Cleanup Tests
  // ===========================================================================

  describe('Cleanup', () => {
    it('should cleanup resources on destroy', () => {
      const config: TabsConfig = { tabs: basicTabs }
      const tabs = new Tabs(config, container)
      tabs.render()

      tabs.destroy()

      expect(container.innerHTML).toBe('')
    })
  })
})

/**
 * Tabs Component Tests
 * タブコンポーネントのテスト
 */

import { parseYaml } from '../parser'
import { renderScreen } from '../renderer/screen-renderer'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  Tabs,
  attachTabsBehavior,
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

// =============================================================================
// Static renderField / attachTabsBehavior
// =============================================================================

describe('Tabs.renderField (static)', () => {
  const base = { id: 'my_tabs', label: 'Tabs', type: 'tabs' } as const

  it('items の label / content / fields を描画し、最初のタブをアクティブにする', () => {
    const html = Tabs.renderField({
      ...base,
      items: [
        { id: 'a', label: '概要', content: '概要の本文', badge: 3 },
        { id: 'b', label: '設定', fields: [{ id: 'name', type: 'text', label: '名前' }] },
      ],
    } as never)
    expect(html).toContain('概要')
    expect(html).toContain('設定')
    expect(html).toContain('概要の本文')
    expect(html).toContain('name="name"')
    expect(html).toContain('role="tablist"')
    expect(html).toContain('role="tabpanel"')
    expect(html).toContain('tab-badge')
    expect(html).not.toContain('タブ1')
    const el = document.createElement('div')
    el.innerHTML = html
    const tabs = el.querySelectorAll('[role="tab"]')
    expect(tabs[0].getAttribute('aria-selected')).toBe('true')
    expect(tabs[1].getAttribute('aria-selected')).toBe('false')
    const panels = el.querySelectorAll('[role="tabpanel"]')
    expect(panels[0].hasAttribute('hidden')).toBe(false)
    expect(panels[1].hasAttribute('hidden')).toBe(true)
    expect(tabs[0].getAttribute('aria-controls')).toBe(panels[0].id)
  })

  it('default 指定のタブをアクティブにし variant / position を反映する', () => {
    const html = Tabs.renderField({
      ...base,
      default: 'b',
      variant: 'pills',
      position: 'left',
      items: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }],
    } as never)
    const el = document.createElement('div')
    el.innerHTML = html
    expect(el.querySelectorAll('[role="tab"]')[1].getAttribute('aria-selected')).toBe('true')
    expect(el.querySelector('.mokkun-tabs')?.className).toContain('tabs-pills')
    expect(el.querySelector('.mokkun-tabs')?.className).toContain('tabs-left')
  })

  it('items が無い場合はダミーを出す', () => {
    const html = Tabs.renderField(base as never)
    expect(html).toContain('タブ1')
    expect(html).toContain('タブ3')
  })

  it('文字列を escapeHtml する', () => {
    const html = Tabs.renderField({
      ...base,
      items: [{ id: 'x', label: '<img src=x onerror=alert(1)>', content: '<script>bad()</script>' }],
    } as never)
    expect(html).not.toContain('<img src=x')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;img')
  })

  it('attachTabsBehavior でクリック・キーボード切替ができ、cleanup で解除される', () => {
    const container = document.createElement('div')
    container.innerHTML = Tabs.renderField({
      ...base,
      items: [{ id: 'a', label: 'A', content: 'pa' }, { id: 'b', label: 'B', content: 'pb' }, { id: 'c', label: 'C', content: 'pc' }],
    } as never)
    document.body.appendChild(container)
    const cleanup = attachTabsBehavior(container)
    const tabs = container.querySelectorAll<HTMLElement>('[role="tab"]')
    const panels = container.querySelectorAll<HTMLElement>('[role="tabpanel"]')

    tabs[1].click()
    expect(tabs[1].getAttribute('aria-selected')).toBe('true')
    expect(tabs[0].getAttribute('aria-selected')).toBe('false')
    expect(panels[1].hasAttribute('hidden')).toBe(false)
    expect(panels[0].hasAttribute('hidden')).toBe(true)

    tabs[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    expect(tabs[2].getAttribute('aria-selected')).toBe('true')
    tabs[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    expect(tabs[0].getAttribute('aria-selected')).toBe('true')

    cleanup()
    tabs[1].click()
    expect(tabs[0].getAttribute('aria-selected')).toBe('true')
    container.remove()
  })
})

describe('Tabs static: 追加ケース', () => {
  const base = { id: 'tt', label: 'T', type: 'tabs' } as const
  const mk = (field: object): HTMLElement => {
    const c = document.createElement('div')
    c.innerHTML = Tabs.renderField({ ...base, ...field } as never)
    document.body.appendChild(c)
    return c
  }
  const key = (el: Element, k: string) =>
    el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }))

  it('入れ子 tabs: 外側を切り替えても内側の状態が保たれる', () => {
    const inner = Tabs.renderField({
      id: 'inner', type: 'tabs', label: 'in',
      items: [{ id: 'x', label: 'X', content: 'cx' }, { id: 'y', label: 'Y', content: 'cy' }],
    } as never)
    const c = document.createElement('div')
    c.innerHTML = Tabs.renderField({
      ...base, id: 'outer',
      items: [{ id: 'o1', label: 'O1', content: 'c1' }, { id: 'o2', label: 'O2', content: 'c2' }],
    } as never)
    c.querySelector('#outer-panel-0')!.innerHTML = inner
    document.body.appendChild(c)
    const cleanup = attachTabsBehavior(c)
    c.querySelector<HTMLElement>('#outer-tab-1')!.click()
    expect(c.querySelector('#outer-panel-1')!.hasAttribute('hidden')).toBe(false)
    expect(c.querySelector('#outer-panel-0')!.hasAttribute('hidden')).toBe(true)
    expect(c.querySelector('#inner-tab-0')!.getAttribute('aria-selected')).toBe('true')
    expect(c.querySelector('#inner-panel-0')!.hasAttribute('hidden')).toBe(false)
    expect(c.querySelector('#inner-panel-1')!.hasAttribute('hidden')).toBe(true)
    c.querySelector<HTMLElement>('#outer-tab-0')!.click()
    c.querySelector<HTMLElement>('#inner-tab-1')!.click()
    expect(c.querySelector('#outer-panel-0')!.hasAttribute('hidden')).toBe(false)
    expect(c.querySelector('#inner-panel-1')!.hasAttribute('hidden')).toBe(false)
    cleanup(); c.remove()
  })

  it('tabs が配列でなくても例外にならずダミーを出す', () => {
    expect(Tabs.renderField({ ...base, tabs: 'abc' } as never)).toContain('タブ1')
  })

  it('ダミーの先頭パネルは active', () => {
    expect(Tabs.renderField(base as never)).toContain('class="tab-panel active"')
  })

  it('tabs キーでも描画できる', () => {
    expect(Tabs.renderField({ ...base, tabs: [{ id: 'a', label: 'AAA' }] } as never)).toContain('AAA')
  })

  it('default が存在しない値なら最初の有効タブ', () => {
    const c = mk({ default: 'nope', items: [{ id: 'a', label: 'A', disabled: true }, { id: 'b', label: 'B' }] })
    const tabs = c.querySelectorAll('[role="tab"]')
    expect(tabs[1].getAttribute('aria-selected')).toBe('true')
    c.remove()
  })

  it('disabled スキップ・Home/End・縦方向キー', () => {
    const c = mk({ items: [{ label: 'A' }, { label: 'B', disabled: true }, { label: 'C' }, { label: 'D' }] })
    const cleanup = attachTabsBehavior(c)
    const t = () => Array.from(c.querySelectorAll<HTMLElement>('[role="tab"]'))
    key(t()[0], 'ArrowRight')
    expect(t()[2].getAttribute('aria-selected')).toBe('true')
    key(t()[2], 'End')
    expect(t()[3].getAttribute('aria-selected')).toBe('true')
    key(t()[3], 'Home')
    expect(t()[0].getAttribute('aria-selected')).toBe('true')
    cleanup(); c.remove()

    const v = mk({ position: 'left', items: [{ label: 'A' }, { label: 'B' }] })
    const cl = attachTabsBehavior(v)
    const vt = Array.from(v.querySelectorAll<HTMLElement>('[role="tab"]'))
    key(vt[0], 'ArrowRight')
    expect(vt[0].getAttribute('aria-selected')).toBe('true')
    key(vt[0], 'ArrowDown')
    expect(vt[1].getAttribute('aria-selected')).toBe('true')
    key(vt[1], 'ArrowUp')
    expect(vt[0].getAttribute('aria-selected')).toBe('true')
    cl(); v.remove()
  })

  it('パーサ: items[].fields / tabs[].fields に ID が付き、描画できる', () => {
    const yaml = `
view:
  s:
    title: S
    fields:
      - type: tabs
        label: a
        items:
          - id: p
            label: P
            fields:
              - type: text
                label: 名前
      - type: tabs
        label: b
        tabs:
          - id: q
            label: Q
            fields:
              - type: text
                label: 年齢
`
    const r = parseYaml(yaml)
    expect(r.success).toBe(true)
    if (!r.success) return
    const fs = (r.data.view as any).s.fields
    expect(fs[0].items[0].fields[0].id).toBeTruthy()
    expect(fs[1].tabs[0].fields[0].id).toBeTruthy()
    const html = renderScreen((r.data.view as any).s)
    expect(html).toContain('名前')
    expect(html).toContain('年齢')
    expect(html).toContain('role="tabpanel"')
  })
})

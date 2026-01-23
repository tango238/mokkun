/**
 * DefinitionList Component Tests
 * 定義リストコンポーネントのテスト
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  DefinitionList,
  createDefinitionList,
  type DefinitionListConfig,
  type DefinitionListCallbacks,
  type DefinitionListItem,
  type DefinitionListGroup,
} from '../renderer/components/definition-list'

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
// DefinitionList Component Tests
// =============================================================================

describe('DefinitionList Component', () => {
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
      const list = new DefinitionList(container)
      list.render()

      expect(container.classList.contains('mokkun-definition-list')).toBe(true)
      expect(container.querySelector('.definition-list-content')).toBeTruthy()
    })

    it('should initialize with items', () => {
      const items: DefinitionListItem[] = [
        { term: '名前', description: '山田太郎' },
        { term: '部署', description: '開発部' },
      ]
      const config: DefinitionListConfig = { items }
      const list = new DefinitionList(container, config)
      list.render()

      const definitionItems = container.querySelectorAll('.definition-item')
      expect(definitionItems.length).toBe(2)
    })

    it('should initialize with groups', () => {
      const groups: DefinitionListGroup[] = [
        {
          title: '基本情報',
          items: [
            { term: '名前', description: '山田太郎' },
          ],
        },
        {
          title: '連絡先',
          items: [
            { term: 'メール', description: 'test@example.com' },
          ],
        },
      ]
      const config: DefinitionListConfig = { groups }
      const list = new DefinitionList(container, config)
      list.render()

      const groupElements = container.querySelectorAll('.definition-group')
      expect(groupElements.length).toBe(2)
    })
  })

  // ===========================================================================
  // Layout Tests
  // ===========================================================================

  describe('Layout', () => {
    it('should apply horizontal layout by default', () => {
      const list = new DefinitionList(container)
      list.render()

      expect(container.getAttribute('data-layout')).toBe('horizontal')
    })

    it('should apply vertical layout when specified', () => {
      const config: DefinitionListConfig = { layout: 'vertical' }
      const list = new DefinitionList(container, config)
      list.render()

      expect(container.getAttribute('data-layout')).toBe('vertical')
    })

    it('should apply maxColumns constraint', () => {
      const config: DefinitionListConfig = { maxColumns: 2 }
      const list = new DefinitionList(container, config)
      list.render()

      expect(container.getAttribute('data-columns')).toBe('2')
    })

    it('should apply full width to specific items', () => {
      const items: DefinitionListItem[] = [
        { term: '概要', description: '長いテキスト', fullWidth: true },
      ]
      const config: DefinitionListConfig = { items }
      const list = new DefinitionList(container, config)
      list.render()

      const item = container.querySelector('.definition-item')
      expect(item?.hasAttribute('data-full-width')).toBe(true)
    })
  })

  // ===========================================================================
  // Term Width Tests
  // ===========================================================================

  describe('Term Width', () => {
    it('should set custom term width as string', () => {
      const config: DefinitionListConfig = { termWidth: '200px' }
      const list = new DefinitionList(container, config)
      list.render()

      expect(container.style.getPropertyValue('--definition-term-width')).toBe('200px')
    })

    it('should set custom term width as number', () => {
      const config: DefinitionListConfig = { termWidth: 150 }
      const list = new DefinitionList(container, config)
      list.render()

      expect(container.style.getPropertyValue('--definition-term-width')).toBe('150px')
    })
  })

  // ===========================================================================
  // Term Style Type Tests
  // ===========================================================================

  describe('Term Style Type', () => {
    it('should apply blockTitle style type', () => {
      const items: DefinitionListItem[] = [
        { term: 'ラベル', description: '値' },
      ]
      const config: DefinitionListConfig = { items, termStyleType: 'blockTitle' }
      const list = new DefinitionList(container, config)
      list.render()

      const term = container.querySelector('.definition-term')
      expect(term?.classList.contains('term-blockTitle')).toBe(true)
    })

    it('should apply subBlockTitle style type', () => {
      const items: DefinitionListItem[] = [
        { term: 'ラベル', description: '値' },
      ]
      const config: DefinitionListConfig = { items, termStyleType: 'subBlockTitle' }
      const list = new DefinitionList(container, config)
      list.render()

      const term = container.querySelector('.definition-term')
      expect(term?.classList.contains('term-subBlockTitle')).toBe(true)
    })

    it('should apply subSubBlockTitle style type', () => {
      const items: DefinitionListItem[] = [
        { term: 'ラベル', description: '値' },
      ]
      const config: DefinitionListConfig = { items, termStyleType: 'subSubBlockTitle' }
      const list = new DefinitionList(container, config)
      list.render()

      const term = container.querySelector('.definition-term')
      expect(term?.classList.contains('term-subSubBlockTitle')).toBe(true)
    })
  })

  // ===========================================================================
  // Variant Tests
  // ===========================================================================

  describe('Variants', () => {
    it('should apply bordered variant', () => {
      const config: DefinitionListConfig = { bordered: true }
      const list = new DefinitionList(container, config)
      list.render()

      expect(container.classList.contains('definition-list-bordered')).toBe(true)
    })

    it('should apply striped variant', () => {
      const config: DefinitionListConfig = { striped: true }
      const list = new DefinitionList(container, config)
      list.render()

      expect(container.classList.contains('definition-list-striped')).toBe(true)
    })

    it('should apply compact variant', () => {
      const config: DefinitionListConfig = { compact: true }
      const list = new DefinitionList(container, config)
      list.render()

      expect(container.classList.contains('definition-list-compact')).toBe(true)
    })

    it('should combine multiple variants', () => {
      const config: DefinitionListConfig = { bordered: true, striped: true, compact: true }
      const list = new DefinitionList(container, config)
      list.render()

      expect(container.classList.contains('definition-list-bordered')).toBe(true)
      expect(container.classList.contains('definition-list-striped')).toBe(true)
      expect(container.classList.contains('definition-list-compact')).toBe(true)
    })
  })

  // ===========================================================================
  // Description Display Tests
  // ===========================================================================

  describe('Description Display', () => {
    it('should display string description', () => {
      const items: DefinitionListItem[] = [
        { term: '名前', description: '山田太郎' },
      ]
      const config: DefinitionListConfig = { items }
      const list = new DefinitionList(container, config)
      list.render()

      const description = container.querySelector('.definition-description')
      expect(description?.textContent).toBe('山田太郎')
    })

    it('should display array description as list', () => {
      const items: DefinitionListItem[] = [
        { term: '趣味', description: ['読書', '映画', '旅行'] },
      ]
      const config: DefinitionListConfig = { items }
      const list = new DefinitionList(container, config)
      list.render()

      const listItems = container.querySelectorAll('.definition-description-list li')
      expect(listItems.length).toBe(3)
      expect(listItems[0].textContent).toBe('読書')
      expect(listItems[1].textContent).toBe('映画')
      expect(listItems[2].textContent).toBe('旅行')
    })

    it('should display empty text for null description', () => {
      const items: DefinitionListItem[] = [
        { term: '備考', description: null },
      ]
      const config: DefinitionListConfig = { items }
      const list = new DefinitionList(container, config)
      list.render()

      const description = container.querySelector('.definition-description')
      expect(description?.textContent).toBe('-')
      expect(description?.classList.contains('definition-description-empty')).toBe(true)
    })

    it('should use custom empty text', () => {
      const items: DefinitionListItem[] = [
        { term: '備考', description: null },
      ]
      const config: DefinitionListConfig = { items, emptyText: '未設定' }
      const list = new DefinitionList(container, config)
      list.render()

      const description = container.querySelector('.definition-description')
      expect(description?.textContent).toBe('未設定')
    })

    it('should display empty text for empty array', () => {
      const items: DefinitionListItem[] = [
        { term: '趣味', description: [] },
      ]
      const config: DefinitionListConfig = { items }
      const list = new DefinitionList(container, config)
      list.render()

      const description = container.querySelector('.definition-description')
      expect(description?.textContent).toBe('-')
      expect(description?.classList.contains('definition-description-empty')).toBe(true)
    })
  })

  // ===========================================================================
  // State Management Tests
  // ===========================================================================

  describe('State Management', () => {
    it('should set items', () => {
      const list = new DefinitionList(container)
      list.render()

      const items: DefinitionListItem[] = [
        { term: '新しい項目', description: '新しい値' },
      ]
      list.setItems(items)

      const definitionItems = container.querySelectorAll('.definition-item')
      expect(definitionItems.length).toBe(1)
    })

    it('should set groups', () => {
      const list = new DefinitionList(container)
      list.render()

      const groups: DefinitionListGroup[] = [
        {
          title: '新しいグループ',
          items: [{ term: '項目', description: '値' }],
        },
      ]
      list.setGroups(groups)

      const groupElements = container.querySelectorAll('.definition-group')
      expect(groupElements.length).toBe(1)
    })

    it('should add item', () => {
      const items: DefinitionListItem[] = [
        { term: '項目1', description: '値1' },
      ]
      const config: DefinitionListConfig = { items }
      const list = new DefinitionList(container, config)
      list.render()

      list.addItem({ term: '項目2', description: '値2' })

      const definitionItems = container.querySelectorAll('.definition-item')
      expect(definitionItems.length).toBe(2)
    })

    it('should remove item', () => {
      const items: DefinitionListItem[] = [
        { term: '項目1', description: '値1' },
        { term: '項目2', description: '値2' },
      ]
      const config: DefinitionListConfig = { items }
      const list = new DefinitionList(container, config)
      list.render()

      list.removeItem(0)

      const definitionItems = container.querySelectorAll('.definition-item')
      expect(definitionItems.length).toBe(1)
    })

    it('should not remove item with invalid index', () => {
      const items: DefinitionListItem[] = [
        { term: '項目1', description: '値1' },
      ]
      const config: DefinitionListConfig = { items }
      const list = new DefinitionList(container, config)
      list.render()

      list.removeItem(-1)
      list.removeItem(5)

      const definitionItems = container.querySelectorAll('.definition-item')
      expect(definitionItems.length).toBe(1)
    })

    it('should update item', () => {
      const items: DefinitionListItem[] = [
        { term: '項目1', description: '値1' },
      ]
      const config: DefinitionListConfig = { items }
      const list = new DefinitionList(container, config)
      list.render()

      list.updateItem(0, { description: '更新された値' })

      const description = container.querySelector('.definition-description')
      expect(description?.textContent).toBe('更新された値')
    })

    it('should not update item with invalid index', () => {
      const items: DefinitionListItem[] = [
        { term: '項目1', description: '値1' },
      ]
      const config: DefinitionListConfig = { items }
      const list = new DefinitionList(container, config)
      list.render()

      list.updateItem(-1, { description: '更新' })
      list.updateItem(5, { description: '更新' })

      const description = container.querySelector('.definition-description')
      expect(description?.textContent).toBe('値1')
    })

    it('should get current state', () => {
      const items: DefinitionListItem[] = [
        { term: '項目1', description: '値1' },
      ]
      const config: DefinitionListConfig = { items }
      const list = new DefinitionList(container, config)
      list.render()

      const state = list.getState()
      expect(state.items.length).toBe(1)
      expect(state.isGrouped).toBe(false)
    })
  })

  // ===========================================================================
  // Callback Tests
  // ===========================================================================

  describe('Callbacks', () => {
    it('should call onItemClick when item is clicked', () => {
      const onItemClick = vi.fn()
      const items: DefinitionListItem[] = [
        { term: '項目', description: '値' },
      ]
      const config: DefinitionListConfig = { items, clickable: true }
      const callbacks: DefinitionListCallbacks = { onItemClick }
      const list = new DefinitionList(container, config, callbacks)
      list.render()

      const item = container.querySelector('.definition-item') as HTMLElement
      item.click()

      expect(onItemClick).toHaveBeenCalledTimes(1)
      expect(onItemClick).toHaveBeenCalledWith(items[0], 0)
    })

    it('should call onItemClick on Enter key', () => {
      const onItemClick = vi.fn()
      const items: DefinitionListItem[] = [
        { term: '項目', description: '値' },
      ]
      const config: DefinitionListConfig = { items, clickable: true }
      const callbacks: DefinitionListCallbacks = { onItemClick }
      const list = new DefinitionList(container, config, callbacks)
      list.render()

      const item = container.querySelector('.definition-item') as HTMLElement
      const event = new KeyboardEvent('keydown', { key: 'Enter' })
      item.dispatchEvent(event)

      expect(onItemClick).toHaveBeenCalledTimes(1)
    })

    it('should call onItemClick on Space key', () => {
      const onItemClick = vi.fn()
      const items: DefinitionListItem[] = [
        { term: '項目', description: '値' },
      ]
      const config: DefinitionListConfig = { items, clickable: true }
      const callbacks: DefinitionListCallbacks = { onItemClick }
      const list = new DefinitionList(container, config, callbacks)
      list.render()

      const item = container.querySelector('.definition-item') as HTMLElement
      const event = new KeyboardEvent('keydown', { key: ' ' })
      item.dispatchEvent(event)

      expect(onItemClick).toHaveBeenCalledTimes(1)
    })

    it('should not add click handler when not clickable', () => {
      const onItemClick = vi.fn()
      const items: DefinitionListItem[] = [
        { term: '項目', description: '値' },
      ]
      const config: DefinitionListConfig = { items, clickable: false }
      const callbacks: DefinitionListCallbacks = { onItemClick }
      const list = new DefinitionList(container, config, callbacks)
      list.render()

      const item = container.querySelector('.definition-item') as HTMLElement
      item.click()

      expect(onItemClick).not.toHaveBeenCalled()
    })

    it('should call onGroupClick when group is clicked', () => {
      const onGroupClick = vi.fn()
      const groups: DefinitionListGroup[] = [
        {
          title: 'グループ',
          items: [{ term: '項目', description: '値' }],
        },
      ]
      const config: DefinitionListConfig = { groups }
      const callbacks: DefinitionListCallbacks = { onGroupClick }
      const list = new DefinitionList(container, config, callbacks)
      list.render()

      const groupTitle = container.querySelector('.definition-group-title') as HTMLElement
      groupTitle.click()

      expect(onGroupClick).toHaveBeenCalledTimes(1)
      expect(onGroupClick).toHaveBeenCalledWith(groups[0], 0)
    })
  })

  // ===========================================================================
  // Clickable Tests
  // ===========================================================================

  describe('Clickable', () => {
    it('should add role="button" when clickable', () => {
      const items: DefinitionListItem[] = [
        { term: '項目', description: '値' },
      ]
      const config: DefinitionListConfig = { items, clickable: true }
      const callbacks: DefinitionListCallbacks = { onItemClick: vi.fn() }
      const list = new DefinitionList(container, config, callbacks)
      list.render()

      const item = container.querySelector('.definition-item')
      expect(item?.getAttribute('role')).toBe('button')
    })

    it('should add tabindex when clickable', () => {
      const items: DefinitionListItem[] = [
        { term: '項目', description: '値' },
      ]
      const config: DefinitionListConfig = { items, clickable: true }
      const callbacks: DefinitionListCallbacks = { onItemClick: vi.fn() }
      const list = new DefinitionList(container, config, callbacks)
      list.render()

      const item = container.querySelector('.definition-item')
      expect(item?.getAttribute('tabindex')).toBe('0')
    })
  })

  // ===========================================================================
  // Group Tests
  // ===========================================================================

  describe('Groups', () => {
    it('should render group title', () => {
      const groups: DefinitionListGroup[] = [
        {
          title: '基本情報',
          items: [{ term: '名前', description: '山田太郎' }],
        },
      ]
      const config: DefinitionListConfig = { groups }
      const list = new DefinitionList(container, config)
      list.render()

      const title = container.querySelector('.definition-group-title')
      expect(title?.textContent).toBe('基本情報')
    })

    it('should apply group-specific layout', () => {
      const groups: DefinitionListGroup[] = [
        {
          title: 'グループ',
          items: [{ term: '項目', description: '値' }],
          layout: 'vertical',
        },
      ]
      const config: DefinitionListConfig = { groups }
      const list = new DefinitionList(container, config)
      list.render()

      const listContent = container.querySelector('.definition-group .definition-list-content')
      expect(listContent?.getAttribute('data-layout')).toBe('vertical')
    })

    it('should apply group-specific maxColumns', () => {
      const groups: DefinitionListGroup[] = [
        {
          title: 'グループ',
          items: [{ term: '項目', description: '値' }],
          maxColumns: 3,
        },
      ]
      const config: DefinitionListConfig = { groups }
      const list = new DefinitionList(container, config)
      list.render()

      const listContent = container.querySelector('.definition-group .definition-list-content')
      expect(listContent?.getAttribute('data-columns')).toBe('3')
    })
  })

  // ===========================================================================
  // Custom Gap Tests
  // ===========================================================================

  describe('Custom Gap', () => {
    it('should set custom gap as string', () => {
      const config: DefinitionListConfig = { gap: '2rem' }
      const list = new DefinitionList(container, config)
      list.render()

      expect(container.style.getPropertyValue('--definition-gap')).toBe('2rem')
    })

    it('should set custom gap as number', () => {
      const config: DefinitionListConfig = { gap: 24 }
      const list = new DefinitionList(container, config)
      list.render()

      expect(container.style.getPropertyValue('--definition-gap')).toBe('24px')
    })
  })

  // ===========================================================================
  // Destroy Tests
  // ===========================================================================

  describe('Destroy', () => {
    it('should clear container content', () => {
      const items: DefinitionListItem[] = [
        { term: '項目', description: '値' },
      ]
      const config: DefinitionListConfig = { items }
      const list = new DefinitionList(container, config)
      list.render()

      list.destroy()
      expect(container.innerHTML).toBe('')
    })
  })

  // ===========================================================================
  // Factory Function Tests
  // ===========================================================================

  describe('createDefinitionList Factory', () => {
    it('should create and render definition list', () => {
      const items: DefinitionListItem[] = [
        { term: '項目', description: '値' },
      ]
      const config: DefinitionListConfig = { items, bordered: true }
      const list = createDefinitionList(container, config)

      expect(container.classList.contains('mokkun-definition-list')).toBe(true)
      expect(container.classList.contains('definition-list-bordered')).toBe(true)
      expect(list.getState().items.length).toBe(1)
    })

    it('should create definition list with callbacks', () => {
      const onItemClick = vi.fn()
      const items: DefinitionListItem[] = [
        { term: '項目', description: '値' },
      ]
      const config: DefinitionListConfig = { items, clickable: true }
      const callbacks: DefinitionListCallbacks = { onItemClick }
      createDefinitionList(container, config, callbacks)

      const item = container.querySelector('.definition-item') as HTMLElement
      item.click()

      expect(onItemClick).toHaveBeenCalledTimes(1)
    })
  })

  // ===========================================================================
  // Custom Class Tests
  // ===========================================================================

  describe('Custom Class', () => {
    it('should apply custom class to item', () => {
      const items: DefinitionListItem[] = [
        { term: '項目', description: '値', className: 'custom-item' },
      ]
      const config: DefinitionListConfig = { items }
      const list = new DefinitionList(container, config)
      list.render()

      const item = container.querySelector('.definition-item')
      expect(item?.classList.contains('custom-item')).toBe(true)
    })
  })

  // ===========================================================================
  // Security Tests
  // ===========================================================================

  describe('Security', () => {
    it('should escape HTML in term text', () => {
      const items: DefinitionListItem[] = [
        { term: '<script>alert("xss")</script>', description: 'Value' },
      ]
      const config: DefinitionListConfig = { items }
      const list = new DefinitionList(container, config)
      list.render()

      const term = container.querySelector('.definition-term')
      expect(term?.textContent).toBe('<script>alert("xss")</script>')
      expect(term?.innerHTML).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;')
    })

    it('should escape HTML in description text', () => {
      const items: DefinitionListItem[] = [
        { term: 'Term', description: '<img src=x onerror=alert(1)>' },
      ]
      const config: DefinitionListConfig = { items }
      const list = new DefinitionList(container, config)
      list.render()

      const description = container.querySelector('.definition-description')
      expect(description?.textContent).toBe('<img src=x onerror=alert(1)>')
      expect(description?.innerHTML).not.toContain('<img')
    })

    it('should sanitize className to prevent CSS injection', () => {
      const items: DefinitionListItem[] = [
        { term: 'Term', description: 'Value', className: 'valid-class <script>xss()</script> {color:red}' },
      ]
      const config: DefinitionListConfig = { items }
      const list = new DefinitionList(container, config)
      list.render()

      const item = container.querySelector('.definition-item')
      // valid-class should remain
      expect(item?.className).toContain('valid-class')
      // HTML tags should be stripped (< and > removed)
      expect(item?.className).not.toContain('<')
      expect(item?.className).not.toContain('>')
      // CSS injection characters should be stripped
      expect(item?.className).not.toContain('{')
      expect(item?.className).not.toContain('}')
      expect(item?.className).not.toContain(':')
      expect(item?.className).not.toContain('(')
      expect(item?.className).not.toContain(')')
    })
  })

  // ===========================================================================
  // Accessibility Tests
  // ===========================================================================

  describe('Accessibility', () => {
    it('should have aria-label on dl element', () => {
      const items: DefinitionListItem[] = [
        { term: '項目', description: '値' },
      ]
      const config: DefinitionListConfig = { items }
      const list = new DefinitionList(container, config)
      list.render()

      const dl = container.querySelector('.definition-list-content')
      expect(dl?.getAttribute('aria-label')).toBe('Definition list')
    })

    it('should have aria-label on group dl element matching group title', () => {
      const groups: DefinitionListGroup[] = [
        {
          title: '基本情報',
          items: [{ term: '名前', description: '山田太郎' }],
        },
      ]
      const config: DefinitionListConfig = { groups }
      const list = new DefinitionList(container, config)
      list.render()

      const dl = container.querySelector('.definition-group .definition-list-content')
      expect(dl?.getAttribute('aria-label')).toBe('基本情報')
    })
  })

  // ===========================================================================
  // Edge Cases
  // ===========================================================================

  describe('Edge Cases', () => {
    it('should handle empty items array', () => {
      const config: DefinitionListConfig = { items: [] }
      const list = new DefinitionList(container, config)
      list.render()

      const definitionItems = container.querySelectorAll('.definition-item')
      expect(definitionItems.length).toBe(0)
    })

    it('should handle empty groups array', () => {
      const config: DefinitionListConfig = { groups: [] }
      const list = new DefinitionList(container, config)
      list.render()

      const groupElements = container.querySelectorAll('.definition-group')
      expect(groupElements.length).toBe(0)
    })

    it('should handle very long term text', () => {
      const longTerm = '非常に長いラベルテキストで、通常よりもかなり長くなっています'
      const items: DefinitionListItem[] = [
        { term: longTerm, description: '値' },
      ]
      const config: DefinitionListConfig = { items }
      const list = new DefinitionList(container, config)
      list.render()

      const term = container.querySelector('.definition-term')
      expect(term?.textContent).toBe(longTerm)
    })

    it('should handle very long description text', () => {
      const longDescription = '非常に長い説明テキストで、通常よりもかなり長くなっています。これは複数行にまたがる可能性があります。'
      const items: DefinitionListItem[] = [
        { term: '項目', description: longDescription },
      ]
      const config: DefinitionListConfig = { items }
      const list = new DefinitionList(container, config)
      list.render()

      const description = container.querySelector('.definition-description')
      expect(description?.textContent).toBe(longDescription)
    })

    it('should handle rapid state changes', () => {
      const list = new DefinitionList(container)
      list.render()

      list.setItems([{ term: '項目1', description: '値1' }])
      list.addItem({ term: '項目2', description: '値2' })
      list.removeItem(0)
      list.updateItem(0, { description: '更新' })

      const state = list.getState()
      expect(state.items.length).toBe(1)
      expect(state.items[0].description).toBe('更新')
    })

    it('should switch from items to groups', () => {
      const items: DefinitionListItem[] = [
        { term: '項目', description: '値' },
      ]
      const config: DefinitionListConfig = { items }
      const list = new DefinitionList(container, config)
      list.render()

      const groups: DefinitionListGroup[] = [
        {
          title: 'グループ',
          items: [{ term: 'グループ項目', description: 'グループ値' }],
        },
      ]
      list.setGroups(groups)

      const state = list.getState()
      expect(state.isGrouped).toBe(true)
      expect(state.groups.length).toBe(1)
      expect(state.items.length).toBe(0)
    })

    it('should switch from groups to items', () => {
      const groups: DefinitionListGroup[] = [
        {
          title: 'グループ',
          items: [{ term: 'グループ項目', description: 'グループ値' }],
        },
      ]
      const config: DefinitionListConfig = { groups }
      const list = new DefinitionList(container, config)
      list.render()

      const items: DefinitionListItem[] = [
        { term: '項目', description: '値' },
      ]
      list.setItems(items)

      const state = list.getState()
      expect(state.isGrouped).toBe(false)
      expect(state.items.length).toBe(1)
      expect(state.groups.length).toBe(0)
    })
  })
})

/**
 * Data Table Component Tests
 * データテーブル（拡張機能）のテスト
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { JSDOM } from 'jsdom'
import { DataTable, renderDataTableField } from '../renderer/components/data-table'
import type { DataTableField, DataTableRow, DataTableColumn } from '../types/schema'

describe('DataTable', () => {
  let dom: JSDOM
  let document: Document
  let container: HTMLElement

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><html><body><div id="container"></div></body></html>')
    document = dom.window.document
    container = document.getElementById('container')!
    // グローバルにdocumentを設定
    ;(global as Record<string, unknown>).document = document
    ;(global as Record<string, unknown>).window = dom.window
  })

  afterEach(() => {
    dom.window.close()
  })

  const createBasicConfig = (): DataTableField => ({
    id: 'test-table',
    type: 'data_table',
    label: 'テストテーブル',
    columns: [
      { id: 'name', label: '名前' },
      { id: 'email', label: 'メール' },
      { id: 'status', label: 'ステータス' },
    ],
    data: [
      { id: 1, name: '山田太郎', email: 'yamada@example.com', status: 'active' },
      { id: 2, name: '佐藤花子', email: 'sato@example.com', status: 'inactive' },
      { id: 3, name: '鈴木一郎', email: 'suzuki@example.com', status: 'active' },
    ],
  })

  describe('Basic Rendering', () => {
    it('should render table with data', () => {
      const config = createBasicConfig()
      const table = new DataTable(config, container)
      table.render()

      expect(container.querySelector('.mokkun-data-table')).toBeTruthy()
      expect(container.querySelector('.data-table-thead')).toBeTruthy()
      expect(container.querySelector('.data-table-tbody')).toBeTruthy()
      expect(container.querySelectorAll('.data-table-tr').length).toBe(3)
    })

    it('should render header cells correctly', () => {
      const config = createBasicConfig()
      const table = new DataTable(config, container)
      table.render()

      const headers = container.querySelectorAll('.data-table-th')
      expect(headers.length).toBe(3)
      expect(headers[0].textContent).toContain('名前')
      expect(headers[1].textContent).toContain('メール')
      expect(headers[2].textContent).toContain('ステータス')
    })
  })

  describe('Fixed Header', () => {
    it('should add fixed-header class when enabled', () => {
      const config: DataTableField = {
        ...createBasicConfig(),
        fixed_header: true,
      }
      const table = new DataTable(config, container)
      table.render()

      expect(container.querySelector('.mokkun-data-table.fixed-header')).toBeTruthy()
    })

    it('should add sticky-header class to thead', () => {
      const config: DataTableField = {
        ...createBasicConfig(),
        fixed_header: { enabled: true, offset: 50 },
      }
      const table = new DataTable(config, container)
      table.render()

      const thead = container.querySelector('.data-table-thead')
      expect(thead?.classList.contains('sticky-header')).toBe(true)
      expect((thead as HTMLElement)?.style.top).toBe('50px')
    })

    it('should not have fixed header when disabled', () => {
      const config: DataTableField = {
        ...createBasicConfig(),
        fixed_header: false,
      }
      const table = new DataTable(config, container)
      table.render()

      expect(container.querySelector('.mokkun-data-table.fixed-header')).toBeFalsy()
    })
  })

  describe('Column Resize', () => {
    it('should add resizable-columns class when enabled', () => {
      const config: DataTableField = {
        ...createBasicConfig(),
        column_resize: true,
      }
      const table = new DataTable(config, container)
      table.render()

      expect(container.querySelector('.mokkun-data-table.resizable-columns')).toBeTruthy()
    })

    it('should render resize handles for columns', () => {
      const config: DataTableField = {
        ...createBasicConfig(),
        column_resize: { enabled: true },
      }
      const table = new DataTable(config, container)
      table.render()

      const handles = container.querySelectorAll('.column-resize-handle')
      expect(handles.length).toBe(3) // 3 columns
    })

    it('should not render resize handle when column resizable is false', () => {
      const config: DataTableField = {
        ...createBasicConfig(),
        columns: [
          { id: 'name', label: '名前', resizable: false },
          { id: 'email', label: 'メール' },
        ],
        column_resize: true,
      }
      const table = new DataTable(config, container)
      table.render()

      const handles = container.querySelectorAll('.column-resize-handle')
      expect(handles.length).toBe(1) // Only email column
    })

    it('should update column width via setColumnWidth', () => {
      const config: DataTableField = {
        ...createBasicConfig(),
        column_resize: true,
      }
      const table = new DataTable(config, container)
      table.render()

      table.setColumnWidth('name', 200)

      const state = table.getState()
      expect(state.columnWidths['name']).toBe(200)
    })

    it('should clamp column width to min/max', () => {
      const config: DataTableField = {
        ...createBasicConfig(),
        column_resize: { enabled: true, min_width: 100, max_width: 300 },
      }
      const table = new DataTable(config, container)
      table.render()

      table.setColumnWidth('name', 50) // Below min
      expect(table.getState().columnWidths['name']).toBe(100)

      table.setColumnWidth('name', 500) // Above max
      expect(table.getState().columnWidths['name']).toBe(300)
    })
  })

  describe('Cell Merge', () => {
    it('should render colspan correctly', () => {
      const config: DataTableField = {
        ...createBasicConfig(),
        data: [
          {
            id: 1,
            name: '山田太郎',
            email: 'yamada@example.com',
            status: 'active',
            _cellMerge: {
              name: { colspan: 2 },
              email: { hidden: true },
            },
          },
        ],
      }
      const table = new DataTable(config, container)
      table.render()

      const cells = container.querySelectorAll('.data-table-td')
      const mergedCell = Array.from(cells).find(c => c.getAttribute('colspan') === '2')
      expect(mergedCell).toBeTruthy()
    })

    it('should not render hidden cells', () => {
      const config: DataTableField = {
        ...createBasicConfig(),
        data: [
          {
            id: 1,
            name: '山田太郎',
            email: 'yamada@example.com',
            status: 'active',
            _cellMerge: {
              email: { hidden: true },
            },
          },
        ],
      }
      const table = new DataTable(config, container)
      table.render()

      const row = container.querySelector('.data-table-tr')
      const cells = row?.querySelectorAll('.data-table-td')
      // Name + Status = 2 cells (email is hidden)
      expect(cells?.length).toBe(2)
    })
  })

  describe('Row Grouping', () => {
    const createGroupedConfig = (): DataTableField => ({
      ...createBasicConfig(),
      grouping: { enabled: true, field: 'department' },
      data: [
        { id: 1, name: '山田太郎', email: 'yamada@example.com', status: 'active', department: '営業部' },
        { id: 2, name: '佐藤花子', email: 'sato@example.com', status: 'inactive', department: '営業部' },
        { id: 3, name: '鈴木一郎', email: 'suzuki@example.com', status: 'active', department: '開発部' },
      ],
    })

    it('should add grouped class when grouping enabled', () => {
      const config = createGroupedConfig()
      const table = new DataTable(config, container)
      table.render()

      expect(container.querySelector('.mokkun-data-table.grouped')).toBeTruthy()
    })

    it('should render group headers', () => {
      const config = createGroupedConfig()
      const table = new DataTable(config, container)
      table.render()

      const groupHeaders = container.querySelectorAll('.data-table-group-header')
      expect(groupHeaders.length).toBe(2) // 営業部, 開発部
    })

    it('should show group name in header', () => {
      const config = createGroupedConfig()
      const table = new DataTable(config, container)
      table.render()

      const groupNames = container.querySelectorAll('.group-name')
      const names = Array.from(groupNames).map(el => el.textContent)
      expect(names).toContain('営業部')
      expect(names).toContain('開発部')
    })

    it('should toggle group collapse', () => {
      const config = createGroupedConfig()
      const table = new DataTable(config, container)
      table.render()

      // Initially all groups are expanded
      expect(table.getState().collapsedGroups.size).toBe(0)

      // Collapse a group
      table.toggleGroup('営業部')
      expect(table.getState().collapsedGroups.has('営業部')).toBe(true)

      // Expand the group
      table.toggleGroup('営業部')
      expect(table.getState().collapsedGroups.has('営業部')).toBe(false)
    })

    it('should collapse all groups', () => {
      const config = createGroupedConfig()
      const table = new DataTable(config, container)
      table.render()

      table.collapseAllGroups()

      const state = table.getState()
      expect(state.collapsedGroups.has('営業部')).toBe(true)
      expect(state.collapsedGroups.has('開発部')).toBe(true)
    })

    it('should expand all groups', () => {
      const config = createGroupedConfig()
      const table = new DataTable(config, container)
      table.render()

      table.collapseAllGroups()
      table.expandAllGroups()

      expect(table.getState().collapsedGroups.size).toBe(0)
    })

    it('should start collapsed when default_expanded is false', () => {
      const config: DataTableField = {
        ...createGroupedConfig(),
        grouping: { enabled: true, field: 'department', default_expanded: false },
      }
      const table = new DataTable(config, container)
      table.render()

      const state = table.getState()
      expect(state.collapsedGroups.has('営業部')).toBe(true)
      expect(state.collapsedGroups.has('開発部')).toBe(true)
    })
  })

  describe('Empty State', () => {
    it('should render empty state when no data', () => {
      const config: DataTableField = {
        ...createBasicConfig(),
        data: [],
        empty_state: {
          title: 'データがありません',
          description: '新しいデータを追加してください',
          icon: '📭',
        },
      }
      const table = new DataTable(config, container)
      table.render()

      expect(container.querySelector('.empty-state')).toBeTruthy()
      expect(container.querySelector('.empty-state-title')?.textContent).toBe('データがありません')
      expect(container.querySelector('.empty-state-description')?.textContent).toBe('新しいデータを追加してください')
    })

    it('should render empty state with action button', () => {
      const config: DataTableField = {
        ...createBasicConfig(),
        data: [],
        empty_state: {
          title: 'データがありません',
          action: {
            label: '新規作成',
            handler: 'createNew',
          },
        },
      }
      const table = new DataTable(config, container)
      table.render()

      const actionBtn = container.querySelector('.empty-state-action')
      expect(actionBtn).toBeTruthy()
      expect(actionBtn?.textContent).toBe('新規作成')
    })

    it('should have proper empty state structure', () => {
      const config: DataTableField = {
        ...createBasicConfig(),
        data: [],
      }
      const table = new DataTable(config, container)
      table.render()

      expect(container.querySelector('.empty-state-icon-wrapper')).toBeTruthy()
      expect(container.querySelector('.empty-state-content')).toBeTruthy()
    })
  })

  describe('Table Layout', () => {
    it('should add layout-fixed class when layout is fixed', () => {
      const config: DataTableField = {
        ...createBasicConfig(),
        layout: 'fixed',
      }
      const table = new DataTable(config, container)
      table.render()

      expect(container.querySelector('.mokkun-data-table.layout-fixed')).toBeTruthy()
    })

    it('should not add layout-fixed class when layout is auto', () => {
      const config: DataTableField = {
        ...createBasicConfig(),
        layout: 'auto',
      }
      const table = new DataTable(config, container)
      table.render()

      expect(container.querySelector('.mokkun-data-table.layout-fixed')).toBeFalsy()
    })
  })

  describe('Fixed Columns', () => {
    it('should add fixed-left class to column', () => {
      const config: DataTableField = {
        ...createBasicConfig(),
        columns: [
          { id: 'name', label: '名前', fixed: 'left' },
          { id: 'email', label: 'メール' },
        ],
      }
      const table = new DataTable(config, container)
      table.render()

      const fixedHeader = container.querySelector('.data-table-th.fixed-left')
      expect(fixedHeader).toBeTruthy()
    })

    it('should add fixed-right class to column', () => {
      const config: DataTableField = {
        ...createBasicConfig(),
        columns: [
          { id: 'name', label: '名前' },
          { id: 'actions', label: '操作', fixed: 'right' },
        ],
      }
      const table = new DataTable(config, container)
      table.render()

      const fixedHeader = container.querySelector('.data-table-th.fixed-right')
      expect(fixedHeader).toBeTruthy()
    })
  })

  describe('Static Renderer', () => {
    it('should render static table HTML', () => {
      const config = createBasicConfig()
      const html = renderDataTableField(config)

      expect(html).toContain('mokkun-data-table')
      expect(html).toContain('data-table-thead')
      expect(html).toContain('data-table-tbody')
    })

    it('should include fixed-header class in static render', () => {
      const config: DataTableField = {
        ...createBasicConfig(),
        fixed_header: true,
      }
      const html = renderDataTableField(config)

      expect(html).toContain('fixed-header')
      expect(html).toContain('sticky-header')
    })

    it('should include resize handles in static render', () => {
      const config: DataTableField = {
        ...createBasicConfig(),
        column_resize: true,
      }
      const html = renderDataTableField(config)

      expect(html).toContain('column-resize-handle')
      expect(html).toContain('resizable-columns')
    })
  })

  describe('Callbacks', () => {
    it('should call onGroupToggle callback', () => {
      const onGroupToggle = vi.fn()
      const config: DataTableField = {
        ...createBasicConfig(),
        grouping: { enabled: true, field: 'department' },
        data: [
          { id: 1, name: '山田太郎', department: '営業部' },
        ],
      }
      const table = new DataTable(config, container, { onGroupToggle })
      table.render()

      table.toggleGroup('営業部')

      expect(onGroupToggle).toHaveBeenCalledWith('営業部', false, expect.any(Object))
    })

    it('should call onColumnResize callback', () => {
      const onColumnResize = vi.fn()
      const config: DataTableField = {
        ...createBasicConfig(),
        column_resize: true,
      }
      const table = new DataTable(config, container, { onColumnResize })
      table.render()

      table.setColumnWidth('name', 200)

      expect(onColumnResize).toHaveBeenCalledWith('name', 200, expect.any(Object))
    })
  })

  describe('State Management', () => {
    it('should include collapsedGroups in state', () => {
      const config = createBasicConfig()
      const table = new DataTable(config, container)

      const state = table.getState()
      expect(state.collapsedGroups).toBeDefined()
      expect(state.collapsedGroups instanceof Set).toBe(true)
    })

    it('should include columnWidths in state', () => {
      const config = createBasicConfig()
      const table = new DataTable(config, container)

      const state = table.getState()
      expect(state.columnWidths).toBeDefined()
      expect(typeof state.columnWidths).toBe('object')
    })
  })

  describe('Input Validation', () => {
    it('should ignore invalid column width (NaN)', () => {
      const config: DataTableField = {
        ...createBasicConfig(),
        column_resize: true,
      }
      const table = new DataTable(config, container)
      table.render()

      table.setColumnWidth('name', NaN)

      const state = table.getState()
      expect(state.columnWidths['name']).toBeUndefined()
    })

    it('should ignore invalid column width (negative)', () => {
      const config: DataTableField = {
        ...createBasicConfig(),
        column_resize: true,
      }
      const table = new DataTable(config, container)
      table.render()

      table.setColumnWidth('name', -100)

      const state = table.getState()
      expect(state.columnWidths['name']).toBeUndefined()
    })

    it('should ignore invalid column width (Infinity)', () => {
      const config: DataTableField = {
        ...createBasicConfig(),
        column_resize: true,
      }
      const table = new DataTable(config, container)
      table.render()

      table.setColumnWidth('name', Infinity)

      const state = table.getState()
      expect(state.columnWidths['name']).toBeUndefined()
    })

    it('should render rowspan correctly', () => {
      const config: DataTableField = {
        ...createBasicConfig(),
        data: [
          {
            id: 1,
            name: '山田太郎',
            email: 'yamada@example.com',
            status: 'active',
            _cellMerge: {
              name: { rowspan: 2 },
            },
          },
          {
            id: 2,
            name: '佐藤花子',
            email: 'sato@example.com',
            status: 'inactive',
            _cellMerge: {
              name: { hidden: true },
            },
          },
        ],
      }
      const table = new DataTable(config, container)
      table.render()

      const cells = container.querySelectorAll('.data-table-td')
      const rowspanCell = Array.from(cells).find(c => c.getAttribute('rowspan') === '2')
      expect(rowspanCell).toBeTruthy()
    })

    it('should not render colspan/rowspan for invalid values', () => {
      const config: DataTableField = {
        ...createBasicConfig(),
        data: [
          {
            id: 1,
            name: '山田太郎',
            email: 'yamada@example.com',
            status: 'active',
            _cellMerge: {
              name: { colspan: -1 }, // Invalid
              email: { rowspan: 0 }, // Invalid
            },
          },
        ],
      }
      const table = new DataTable(config, container)
      table.render()

      const cells = container.querySelectorAll('.data-table-td')
      const invalidColspan = Array.from(cells).find(c => c.getAttribute('colspan') === '-1')
      const invalidRowspan = Array.from(cells).find(c => c.getAttribute('rowspan') === '0')
      expect(invalidColspan).toBeFalsy()
      expect(invalidRowspan).toBeFalsy()
    })
  })

  describe('Combined Features', () => {
    it('should work with fixed header and grouping', () => {
      const config: DataTableField = {
        ...createBasicConfig(),
        fixed_header: true,
        grouping: { enabled: true, field: 'status' },
      }
      const table = new DataTable(config, container)
      table.render()

      expect(container.querySelector('.mokkun-data-table.fixed-header')).toBeTruthy()
      expect(container.querySelector('.mokkun-data-table.grouped')).toBeTruthy()
      expect(container.querySelector('.data-table-thead.sticky-header')).toBeTruthy()
    })

    it('should work with fixed header and column resize', () => {
      const config: DataTableField = {
        ...createBasicConfig(),
        fixed_header: true,
        column_resize: true,
      }
      const table = new DataTable(config, container)
      table.render()

      expect(container.querySelector('.mokkun-data-table.fixed-header')).toBeTruthy()
      expect(container.querySelector('.mokkun-data-table.resizable-columns')).toBeTruthy()
      expect(container.querySelectorAll('.column-resize-handle').length).toBe(3)
    })
  })
})

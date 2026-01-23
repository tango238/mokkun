/**
 * Data Table Component
 * データテーブル（一覧表示）コンポーネント
 */

import type {
  DataTableField,
  DataTableColumn,
  DataTableRow,
  DataTableSortConfig,
  DataTableRowAction,
  DataTableFilterField,
  DataTableCellMerge,
  SelectOption,
} from '../../types/schema'
import { generateDataTableDummyData } from '../utils/dummy-data'

// =============================================================================
// Types
// =============================================================================

/**
 * データテーブルの状態
 */
export interface DataTableState {
  /** 現在のデータ */
  data: DataTableRow[]
  /** 元のデータ（フィルタリング・ソート前） */
  originalData: DataTableRow[]
  /** 現在のソート設定 */
  sort: DataTableSortConfig | null
  /** 現在のフィルター値 */
  filterValues: Record<string, unknown>
  /** 選択された行ID */
  selectedRowIds: Set<string | number>
  /** 現在のページ（0始まり） */
  currentPage: number
  /** 1ページあたりの行数 */
  pageSize: number
  /** 総件数 */
  totalCount: number
  /** ローディング状態 */
  isLoading: boolean
  /** 折りたたまれたグループ名のセット */
  collapsedGroups: Set<string>
  /** カラム幅の状態（リサイズ用） */
  columnWidths: Record<string, number>
}

/**
 * データテーブルのコールバック
 */
export interface DataTableCallbacks {
  /** ソート変更時 */
  onSortChange?: (sort: DataTableSortConfig, state: DataTableState) => void
  /** フィルター変更時 */
  onFilterChange?: (filters: Record<string, unknown>, state: DataTableState) => void
  /** 行選択時 */
  onSelectionChange?: (selectedIds: Set<string | number>, state: DataTableState) => void
  /** 行アクション実行時 */
  onRowAction?: (actionId: string, row: DataTableRow, state: DataTableState) => void
  /** ページ変更時 */
  onPageChange?: (page: number, state: DataTableState) => void
  /** ページサイズ変更時 */
  onPageSizeChange?: (pageSize: number, state: DataTableState) => void
  /** グループ展開/折りたたみ時 */
  onGroupToggle?: (groupName: string, isExpanded: boolean, state: DataTableState) => void
  /** 列リサイズ時 */
  onColumnResize?: (columnId: string, width: number, state: DataTableState) => void
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * HTML特殊文字をエスケープ
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * ユニークIDを生成
 */
function generateId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 11)}`
}

/**
 * セルの値をフォーマット
 */
function formatCellValue(
  value: unknown,
  column: DataTableColumn
): string {
  if (value === undefined || value === null) {
    return '-'
  }

  switch (column.format) {
    case 'number':
      return Number(value).toLocaleString('ja-JP')

    case 'currency': {
      const locale = column.currency_format?.locale ?? 'ja-JP'
      const currency = column.currency_format?.currency ?? 'JPY'
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
      }).format(Number(value))
    }

    case 'date': {
      const date = new Date(String(value))
      return isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('ja-JP')
    }

    case 'datetime': {
      const datetime = new Date(String(value))
      return isNaN(datetime.getTime()) ? String(value) : datetime.toLocaleString('ja-JP')
    }

    case 'status': {
      const statusMap = column.status_map ?? {}
      const statusInfo = statusMap[String(value)]
      if (statusInfo) {
        return statusInfo.label
      }
      return String(value)
    }

    case 'text':
    default:
      return String(value)
  }
}

/**
 * ステータスバッジのクラスを取得
 */
function getStatusBadgeClass(
  value: unknown,
  column: DataTableColumn
): string {
  if (column.format !== 'status' || !column.status_map) {
    return ''
  }

  const statusInfo = column.status_map[String(value)]
  if (!statusInfo) {
    return 'status-badge status-default'
  }

  return `status-badge status-${statusInfo.color}`
}

/**
 * データをソート
 */
function sortData(
  data: DataTableRow[],
  sort: DataTableSortConfig | null,
  columns: DataTableColumn[]
): DataTableRow[] {
  if (!sort) {
    return [...data]
  }

  const column = columns.find(c => c.id === sort.column)
  if (!column) {
    return [...data]
  }

  const fieldKey = column.field ?? column.id
  return [...data].sort((a, b) => {
    const aValue = a[fieldKey]
    const bValue = b[fieldKey]

    if (aValue === bValue) return 0
    if (aValue === undefined || aValue === null) return 1
    if (bValue === undefined || bValue === null) return -1

    let comparison = 0
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      comparison = aValue - bValue
    } else if (typeof aValue === 'string' && typeof bValue === 'string') {
      comparison = aValue.localeCompare(bValue, 'ja-JP')
    } else {
      comparison = String(aValue).localeCompare(String(bValue), 'ja-JP')
    }

    return sort.direction === 'asc' ? comparison : -comparison
  })
}

/**
 * データをフィルター
 */
function filterData(
  data: DataTableRow[],
  filterValues: Record<string, unknown>,
  filterFields: DataTableFilterField[]
): DataTableRow[] {
  return data.filter(row => {
    return filterFields.every(filter => {
      const filterValue = filterValues[filter.id]
      if (filterValue === undefined || filterValue === null || filterValue === '') {
        return true
      }

      const column = filter.column
      const rowValue = row[column]

      switch (filter.type) {
        case 'text':
          return String(rowValue ?? '')
            .toLowerCase()
            .includes(String(filterValue).toLowerCase())

        case 'select':
          return String(rowValue) === String(filterValue)

        case 'number_range': {
          const range = filterValue as { min?: number; max?: number }
          const numValue = Number(rowValue)
          if (range.min !== undefined && numValue < range.min) return false
          if (range.max !== undefined && numValue > range.max) return false
          return true
        }

        case 'date_range': {
          const range = filterValue as { start?: string; end?: string }
          const dateValue = new Date(String(rowValue))
          if (range.start && dateValue < new Date(range.start)) return false
          if (range.end && dateValue > new Date(range.end)) return false
          return true
        }

        default:
          return true
      }
    })
  })
}

/**
 * ページネーションを適用
 */
function paginateData(
  data: DataTableRow[],
  currentPage: number,
  pageSize: number
): DataTableRow[] {
  const start = currentPage * pageSize
  return data.slice(start, start + pageSize)
}

// =============================================================================
// Renderer Functions
// =============================================================================

/**
 * フィルターUIをレンダリング
 */
function renderFilterUI(
  config: DataTableField,
  state: DataTableState,
  tableId: string
): string {
  if (!config.filters?.fields || config.filters.fields.length === 0) {
    return ''
  }

  const layout = config.filters.layout ?? 'inline'
  const fields = config.filters.fields

  const fieldsHtml = fields.map(filter => {
    const currentValue = state.filterValues[filter.id] ?? ''

    switch (filter.type) {
      case 'text':
        return `
          <div class="filter-field">
            <label class="filter-label" for="${tableId}-filter-${escapeHtml(filter.id)}">${escapeHtml(filter.label)}</label>
            <input
              type="text"
              id="${tableId}-filter-${escapeHtml(filter.id)}"
              class="form-input filter-input"
              data-filter-id="${escapeHtml(filter.id)}"
              value="${escapeHtml(String(currentValue))}"
              placeholder="${escapeHtml(filter.placeholder ?? '')}"
            />
          </div>
        `

      case 'select': {
        const options = filter.options ?? []
        const optionsHtml = options.map((opt: SelectOption) => {
          const selected = String(currentValue) === String(opt.value) ? 'selected' : ''
          return `<option value="${escapeHtml(String(opt.value))}" ${selected}>${escapeHtml(opt.label)}</option>`
        }).join('')

        return `
          <div class="filter-field">
            <label class="filter-label" for="${tableId}-filter-${escapeHtml(filter.id)}">${escapeHtml(filter.label)}</label>
            <select
              id="${tableId}-filter-${escapeHtml(filter.id)}"
              class="form-select filter-select"
              data-filter-id="${escapeHtml(filter.id)}"
            >
              <option value="">すべて</option>
              ${optionsHtml}
            </select>
          </div>
        `
      }

      default:
        return ''
    }
  }).join('')

  return `
    <div class="data-table-filters layout-${layout}">
      <div class="filter-fields">
        ${fieldsHtml}
      </div>
      <div class="filter-actions">
        <button type="button" class="btn btn-primary filter-apply-btn">検索</button>
        <button type="button" class="btn btn-secondary filter-reset-btn">クリア</button>
      </div>
    </div>
  `
}

/**
 * 固定ヘッダー設定を取得
 */
function getFixedHeaderConfig(config: DataTableField): { enabled: boolean; offset: number } {
  if (typeof config.fixed_header === 'boolean') {
    return { enabled: config.fixed_header, offset: 0 }
  }
  if (config.fixed_header) {
    return {
      enabled: config.fixed_header.enabled !== false,
      offset: config.fixed_header.offset ?? 0,
    }
  }
  return { enabled: false, offset: 0 }
}

/**
 * カラムリサイズ設定を取得
 */
function getResizeConfig(config: DataTableField): { enabled: boolean; minWidth: number; maxWidth: number } {
  if (typeof config.column_resize === 'boolean') {
    return { enabled: config.column_resize, minWidth: 50, maxWidth: 500 }
  }
  if (config.column_resize) {
    return {
      enabled: config.column_resize.enabled !== false,
      minWidth: config.column_resize.min_width ?? 50,
      maxWidth: config.column_resize.max_width ?? 500,
    }
  }
  return { enabled: false, minWidth: 50, maxWidth: 500 }
}

/**
 * テーブルヘッダーをレンダリング
 */
function renderTableHeader(
  config: DataTableField,
  state: DataTableState
): string {
  const columns = config.columns
  const fixedHeaderConfig = getFixedHeaderConfig(config)
  const resizeConfig = getResizeConfig(config)

  const headerCells = columns.map(column => {
    const sortable = column.sortable !== false
    const isSorted = state.sort?.column === column.id
    const sortDirection = isSorted ? state.sort?.direction : null
    const nextDirection = sortDirection === 'asc' ? 'desc' : 'asc'

    const sortIcon = isSorted
      ? sortDirection === 'asc'
        ? ' ↑'
        : ' ↓'
      : ''

    const sortableClass = sortable ? 'sortable' : ''
    const sortedClass = isSorted ? `sorted sorted-${sortDirection}` : ''
    const alignClass = column.align ? `align-${column.align}` : ''
    const fixedClass = column.fixed ? `fixed-${column.fixed}` : ''

    // カラム幅の計算（state優先、次にcolumn.width、最後にデフォルト）
    const stateWidth = state.columnWidths[column.id]
    let widthStyle = ''
    if (stateWidth) {
      widthStyle = `width: ${stateWidth}px; min-width: ${stateWidth}px;`
    } else if (column.width) {
      widthStyle = `width: ${column.width};`
    }

    // リサイズハンドル
    const isResizable = resizeConfig.enabled && (column.resizable !== false)
    const resizeHandle = isResizable
      ? `<span class="column-resize-handle" data-column-id="${escapeHtml(column.id)}"></span>`
      : ''

    // colspan/rowspan (整数のみ許可)
    const colspanAttr = column.colspan && Number.isInteger(column.colspan) && column.colspan > 0
      ? `colspan="${column.colspan}"`
      : ''
    const rowspanAttr = column.rowspan && Number.isInteger(column.rowspan) && column.rowspan > 0
      ? `rowspan="${column.rowspan}"`
      : ''

    return `
      <th
        class="data-table-th ${sortableClass} ${sortedClass} ${alignClass} ${fixedClass}"
        data-column-id="${escapeHtml(column.id)}"
        data-sort-direction="${nextDirection}"
        style="${widthStyle}"
        ${colspanAttr}
        ${rowspanAttr}
      >
        <span class="th-content">
          ${escapeHtml(column.label)}${sortIcon}
        </span>
        ${resizeHandle}
      </th>
    `
  }).join('')

  // 選択カラム
  const selectionHeader = config.selection === 'multiple'
    ? `<th class="data-table-th selection-header">
        <input type="checkbox" class="select-all-checkbox" ${state.selectedRowIds.size === state.data.length && state.data.length > 0 ? 'checked' : ''} />
      </th>`
    : config.selection === 'single'
      ? '<th class="data-table-th selection-header"></th>'
      : ''

  // アクションカラム
  const actionsHeader = config.row_actions && config.row_actions.length > 0
    ? '<th class="data-table-th actions-header">操作</th>'
    : ''

  // 固定ヘッダー用のスタイル
  const stickyStyle = fixedHeaderConfig.enabled
    ? `top: ${fixedHeaderConfig.offset}px;`
    : ''
  const stickyClass = fixedHeaderConfig.enabled ? 'sticky-header' : ''

  return `
    <thead class="data-table-thead ${stickyClass}" style="${stickyStyle}">
      <tr>
        ${selectionHeader}
        ${headerCells}
        ${actionsHeader}
      </tr>
    </thead>
  `
}

/**
 * 行をグループ化して取得
 */
function groupRows(
  data: DataTableRow[],
  config: DataTableField
): Map<string, DataTableRow[]> {
  const groups = new Map<string, DataTableRow[]>()
  const groupField = config.grouping?.field ?? '_group'

  for (const row of data) {
    const groupName = String(row[groupField] ?? '')
    if (!groups.has(groupName)) {
      groups.set(groupName, [])
    }
    groups.get(groupName)!.push(row)
  }

  return groups
}

/**
 * グループヘッダー行をレンダリング
 */
function renderGroupHeader(
  groupName: string,
  rowCount: number,
  columnCount: number,
  config: DataTableField,
  isCollapsed: boolean
): string {
  if (!groupName) return ''

  const collapsible = config.grouping?.collapsible !== false
  const toggleIcon = collapsible
    ? `<span class="group-toggle-icon">${isCollapsed ? '▶' : '▼'}</span>`
    : ''
  const toggleClass = collapsible ? 'collapsible' : ''
  const collapsedClass = isCollapsed ? 'collapsed' : ''

  return `
    <tr class="data-table-group-header ${toggleClass} ${collapsedClass}" data-group-name="${escapeHtml(groupName)}">
      <td colspan="${columnCount}" class="group-header-cell">
        ${toggleIcon}
        <span class="group-name">${escapeHtml(groupName)}</span>
        <span class="group-count">(${rowCount}件)</span>
      </td>
    </tr>
  `
}

/**
 * セル結合を考慮してセルをレンダリング
 */
function renderCellWithMerge(
  row: DataTableRow,
  column: DataTableColumn,
  _value: unknown,
  formattedValue: string,
  statusClass: string,
  alignClass: string
): string | null {
  const cellMerge = row._cellMerge?.[column.id] as DataTableCellMerge | undefined

  // このセルが他のセルに結合されている場合はnullを返す
  if (cellMerge?.hidden) {
    return null
  }

  const colspanAttr = cellMerge?.colspan && Number.isInteger(cellMerge.colspan) && cellMerge.colspan > 0
    ? `colspan="${cellMerge.colspan}"`
    : ''
  const rowspanAttr = cellMerge?.rowspan && Number.isInteger(cellMerge.rowspan) && cellMerge.rowspan > 0
    ? `rowspan="${cellMerge.rowspan}"`
    : ''
  const fixedClass = column.fixed ? `fixed-${column.fixed}` : ''

  const cellContent = statusClass
    ? `<span class="${statusClass}">${escapeHtml(formattedValue)}</span>`
    : escapeHtml(formattedValue)

  return `<td class="data-table-td ${alignClass} ${fixedClass}" ${colspanAttr} ${rowspanAttr}>${cellContent}</td>`
}

/**
 * テーブルボディをレンダリング
 */
function renderTableBody(
  config: DataTableField,
  state: DataTableState,
  tableId: string
): string {
  const columns = config.columns
  const displayData = state.data

  if (displayData.length === 0) {
    return renderEmptyState(config, columns.length)
  }

  // 選択カラムとアクションカラムを考慮した総カラム数
  let totalColumns = columns.length
  if (config.selection && config.selection !== 'none') totalColumns++
  if (config.row_actions && config.row_actions.length > 0) totalColumns++

  // グループ化が有効な場合
  if (config.grouping?.enabled) {
    const groups = groupRows(displayData, config)
    const rowsHtml: string[] = []

    for (const [groupName, groupRows] of groups) {
      const isCollapsed = state.collapsedGroups.has(groupName)

      // グループヘッダー
      if (groupName) {
        rowsHtml.push(renderGroupHeader(groupName, groupRows.length, totalColumns, config, isCollapsed))
      }

      // グループの行（折りたたまれている場合は非表示）
      if (!isCollapsed || !groupName) {
        for (const row of groupRows) {
          rowsHtml.push(renderTableRow(row, displayData.indexOf(row), config, state, tableId, columns))
        }
      }
    }

    return `<tbody class="data-table-tbody">${rowsHtml.join('')}</tbody>`
  }

  // 通常のレンダリング
  const rows = displayData.map((row, rowIndex) => {
    return renderTableRow(row, rowIndex, config, state, tableId, columns)
  }).join('')

  return `
    <tbody class="data-table-tbody">
      ${rows}
    </tbody>
  `
}

/**
 * テーブル行をレンダリング
 */
function renderTableRow(
  row: DataTableRow,
  rowIndex: number,
  config: DataTableField,
  state: DataTableState,
  tableId: string,
  columns: DataTableColumn[]
): string {
  const rowId = row.id
  const isSelected = state.selectedRowIds.has(rowId)
  const selectedClass = isSelected ? 'selected' : ''

  const cells = columns.map(column => {
    const fieldKey = column.field ?? column.id
    const value = row[fieldKey]
    const formattedValue = formatCellValue(value, column)
    const statusClass = getStatusBadgeClass(value, column)
    const alignClass = column.align ? `align-${column.align}` : ''

    return renderCellWithMerge(row, column, value, formattedValue, statusClass, alignClass)
  }).filter(cell => cell !== null).join('')

  // 選択セル
  const selectionCell = config.selection === 'multiple'
    ? `<td class="data-table-td selection-cell">
        <input type="checkbox" class="row-checkbox" data-row-id="${escapeHtml(String(rowId))}" ${isSelected ? 'checked' : ''} />
      </td>`
    : config.selection === 'single'
      ? `<td class="data-table-td selection-cell">
          <input type="radio" name="${tableId}-selection" class="row-radio" data-row-id="${escapeHtml(String(rowId))}" ${isSelected ? 'checked' : ''} />
        </td>`
      : ''

  // アクションセル
  const actionsCell = config.row_actions && config.row_actions.length > 0
    ? `<td class="data-table-td actions-cell">
        ${renderRowActions(config.row_actions, row)}
      </td>`
    : ''

  return `
    <tr class="data-table-tr ${selectedClass}" data-row-id="${escapeHtml(String(rowId))}" data-row-index="${rowIndex}">
      ${selectionCell}
      ${cells}
      ${actionsCell}
    </tr>
  `
}

/**
 * 行アクションをレンダリング
 */
function renderRowActions(
  actions: DataTableRowAction[],
  row: DataTableRow
): string {
  return actions.map(action => {
    const styleClass = action.style ? `btn-${action.style}` : 'btn-link'
    const iconHtml = action.icon ? `<span class="action-icon">${escapeHtml(action.icon)}</span>` : ''

    return `
      <button
        type="button"
        class="btn btn-sm ${styleClass} row-action-btn"
        data-action-id="${escapeHtml(action.id)}"
        data-row-id="${escapeHtml(String(row.id))}"
        ${action.confirm ? `data-confirm-title="${escapeHtml(action.confirm.title)}" data-confirm-message="${escapeHtml(action.confirm.message)}"` : ''}
      >
        ${iconHtml}
        <span class="action-label">${escapeHtml(action.label)}</span>
      </button>
    `
  }).join('')
}

/**
 * 空状態をレンダリング（）
 */
function renderEmptyState(
  config: DataTableField,
  columnCount: number
): string {
  const emptyState = config.empty_state ?? {}
  const title = emptyState.title ?? 'データがありません'
  const description = emptyState.description ?? ''
  const icon = emptyState.icon ?? '📭'

  // 選択カラムとアクションカラムを考慮
  let totalColumns = columnCount
  if (config.selection && config.selection !== 'none') totalColumns++
  if (config.row_actions && config.row_actions.length > 0) totalColumns++

  // プライマリアクションボタン
  const actionHtml = emptyState.action
    ? `<button type="button" class="btn btn-primary empty-state-action" data-handler="${escapeHtml(emptyState.action.handler)}">${escapeHtml(emptyState.action.label)}</button>`
    : ''

  return `
    <tbody class="data-table-tbody data-table-empty-tbody">
      <tr class="empty-state-row">
        <td colspan="${totalColumns}" class="empty-state-cell">
          <div class="empty-state">
            <div class="empty-state-icon-wrapper">
              <span class="empty-state-icon">${escapeHtml(icon)}</span>
            </div>
            <div class="empty-state-content">
              <h4 class="empty-state-title">${escapeHtml(title)}</h4>
              ${description ? `<p class="empty-state-description">${escapeHtml(description)}</p>` : ''}
            </div>
            ${actionHtml ? `<div class="empty-state-actions">${actionHtml}</div>` : ''}
          </div>
        </td>
      </tr>
    </tbody>
  `
}

/**
 * ページネーションUIをレンダリング
 */
function renderPaginationUI(
  config: DataTableField,
  state: DataTableState,
  tableId: string
): string {
  if (!config.pagination?.enabled) {
    return ''
  }

  const totalPages = Math.ceil(state.totalCount / state.pageSize)
  const currentPage = state.currentPage
  const pageSizeOptions = config.pagination.page_size_options ?? [10, 25, 50, 100]

  const pageSizeSelect = `
    <select class="form-select page-size-select" data-table-id="${tableId}">
      ${pageSizeOptions.map(size =>
        `<option value="${size}" ${size === state.pageSize ? 'selected' : ''}>${size}件</option>`
      ).join('')}
    </select>
  `

  const pageInfo = `
    <span class="page-info">
      ${state.totalCount}件中 ${currentPage * state.pageSize + 1}-${Math.min((currentPage + 1) * state.pageSize, state.totalCount)}件を表示
    </span>
  `

  const prevDisabled = currentPage === 0 ? 'disabled' : ''
  const nextDisabled = currentPage >= totalPages - 1 ? 'disabled' : ''

  return `
    <div class="data-table-pagination">
      <div class="pagination-left">
        <label class="page-size-label">表示件数:</label>
        ${pageSizeSelect}
      </div>
      <div class="pagination-center">
        ${pageInfo}
      </div>
      <div class="pagination-right">
        <button type="button" class="btn btn-secondary btn-sm pagination-prev" ${prevDisabled}>
          前へ
        </button>
        <span class="page-numbers">
          ${currentPage + 1} / ${totalPages}
        </span>
        <button type="button" class="btn btn-secondary btn-sm pagination-next" ${nextDisabled}>
          次へ
        </button>
      </div>
    </div>
  `
}

/**
 * ローディング状態をレンダリング
 */
function renderLoadingOverlay(): string {
  return `
    <div class="data-table-loading">
      <div class="loading-spinner"></div>
      <span class="loading-text">読み込み中...</span>
    </div>
  `
}

// =============================================================================
// Data Table Class
// =============================================================================

/**
 * データテーブルコンポーネント
 */
export class DataTable {
  private config: DataTableField
  private container: HTMLElement
  private callbacks: DataTableCallbacks
  private state: DataTableState
  private tableId: string
  private boundHandleClick: (e: Event) => void
  private boundHandleChange: (e: Event) => void
  private boundHandleKeypress: (e: Event) => void
  private boundHandleMouseDown: (e: Event) => void
  private boundHandleMouseMove: (e: Event) => void
  private boundHandleMouseUp: (e: Event) => void

  // リサイズ関連の状態
  private resizingColumnId: string | null = null
  private resizeStartX: number = 0
  private resizeStartWidth: number = 0

  constructor(
    config: DataTableField,
    container: HTMLElement,
    callbacks: DataTableCallbacks = {}
  ) {
    this.config = config
    this.container = container
    this.callbacks = callbacks
    this.tableId = generateId('data-table')

    // イベントハンドラーをバインド（クリーンアップ用）
    this.boundHandleClick = this.handleClick.bind(this)
    this.boundHandleChange = this.handleChange.bind(this)
    this.boundHandleKeypress = this.handleKeypress.bind(this)
    this.boundHandleMouseDown = this.handleMouseDown.bind(this)
    this.boundHandleMouseMove = this.handleMouseMove.bind(this)
    this.boundHandleMouseUp = this.handleMouseUp.bind(this)

    // 初期状態を設定
    const initialData = config.data ?? []
    const pageSize = config.pagination?.page_size ?? 10

    // グループ化の初期状態を計算
    const collapsedGroups = new Set<string>()
    if (config.grouping?.enabled && config.grouping.default_expanded === false) {
      // デフォルトで折りたたむ場合、全グループを折りたたむ
      const groupField = config.grouping.field ?? '_group'
      for (const row of initialData) {
        const groupName = String(row[groupField] ?? '')
        if (groupName) {
          collapsedGroups.add(groupName)
        }
      }
    }

    this.state = {
      data: initialData,
      originalData: initialData,
      sort: config.default_sort ?? null,
      filterValues: {},
      selectedRowIds: new Set(),
      currentPage: config.pagination?.current_page ?? 0,
      pageSize,
      totalCount: config.pagination?.total_count ?? initialData.length,
      isLoading: false,
      collapsedGroups,
      columnWidths: {},
    }

    // 初期変換を適用（ソート、ページネーション）
    if (this.state.sort || this.config.pagination?.enabled) {
      this.applyDataTransformations()
    }
  }

  /**
   * 現在の状態を取得
   */
  getState(): DataTableState {
    return { ...this.state }
  }

  /**
   * データを設定
   */
  setData(data: DataTableRow[], totalCount?: number): void {
    this.state = {
      ...this.state,
      originalData: data,
      totalCount: totalCount ?? data.length,
      currentPage: 0,
      selectedRowIds: new Set(),
    }
    this.applyDataTransformations()
    this.render()
  }

  /**
   * データ変換（フィルター、ソート、ページネーション）を適用
   */
  private applyDataTransformations(): void {
    let data = [...this.state.originalData]

    // フィルター適用
    if (this.config.filters?.fields) {
      data = filterData(data, this.state.filterValues, this.config.filters.fields)
    }

    // ソート適用
    data = sortData(data, this.state.sort, this.config.columns)

    // 総件数を更新
    const totalCount = data.length

    // ページネーション適用
    if (this.config.pagination?.enabled) {
      data = paginateData(data, this.state.currentPage, this.state.pageSize)
    }

    this.state = {
      ...this.state,
      data,
      totalCount,
    }
  }

  /**
   * ソートを設定
   */
  setSort(column: string, direction: 'asc' | 'desc'): void {
    this.state = {
      ...this.state,
      sort: { column, direction },
      currentPage: 0,
    }
    this.applyDataTransformations()
    this.render()
    this.callbacks.onSortChange?.(this.state.sort!, this.state)
  }

  /**
   * フィルター値を設定
   */
  setFilterValues(values: Record<string, unknown>): void {
    this.state = {
      ...this.state,
      filterValues: values,
      currentPage: 0,
    }
    this.applyDataTransformations()
    this.render()
    this.callbacks.onFilterChange?.(values, this.state)
  }

  /**
   * フィルターをリセット
   */
  resetFilters(): void {
    this.setFilterValues({})
  }

  /**
   * 行を選択
   */
  selectRow(rowId: string | number): void {
    const newSelected = new Set(this.state.selectedRowIds)

    if (this.config.selection === 'single') {
      newSelected.clear()
      newSelected.add(rowId)
    } else if (this.config.selection === 'multiple') {
      if (newSelected.has(rowId)) {
        newSelected.delete(rowId)
      } else {
        newSelected.add(rowId)
      }
    }

    this.state = {
      ...this.state,
      selectedRowIds: newSelected,
    }
    this.render()
    this.callbacks.onSelectionChange?.(newSelected, this.state)
  }

  /**
   * 全行を選択/解除
   */
  selectAll(selected: boolean): void {
    const newSelected = selected
      ? new Set(this.state.data.map(row => row.id))
      : new Set<string | number>()

    this.state = {
      ...this.state,
      selectedRowIds: newSelected,
    }
    this.render()
    this.callbacks.onSelectionChange?.(newSelected, this.state)
  }

  /**
   * 選択された行を取得
   */
  getSelectedRows(): DataTableRow[] {
    return this.state.originalData.filter(row =>
      this.state.selectedRowIds.has(row.id)
    )
  }

  /**
   * ページを変更
   */
  setPage(page: number): void {
    const totalPages = Math.ceil(this.state.totalCount / this.state.pageSize)
    const newPage = Math.max(0, Math.min(page, totalPages - 1))

    this.state = {
      ...this.state,
      currentPage: newPage,
    }
    this.applyDataTransformations()
    this.render()
    this.callbacks.onPageChange?.(newPage, this.state)
  }

  /**
   * ページサイズを変更
   */
  setPageSize(pageSize: number): void {
    this.state = {
      ...this.state,
      pageSize,
      currentPage: 0,
    }
    this.applyDataTransformations()
    this.render()
    this.callbacks.onPageSizeChange?.(pageSize, this.state)
  }

  /**
   * ローディング状態を設定
   */
  setLoading(isLoading: boolean): void {
    this.state = {
      ...this.state,
      isLoading,
    }
    this.render()
  }

  /**
   * コンポーネントをレンダリング
   */
  render(): void {
    const classes = ['mokkun-data-table']
    if (this.config.striped) classes.push('striped')
    if (this.config.hoverable !== false) classes.push('hoverable')
    if (this.config.bordered) classes.push('bordered')
    if (this.config.compact) classes.push('compact')
    if (this.config.responsive !== false) classes.push('responsive')

    // 固定ヘッダー
    const fixedHeaderConfig = getFixedHeaderConfig(this.config)
    if (fixedHeaderConfig.enabled) classes.push('fixed-header')

    // 列リサイズ
    const resizeConfig = getResizeConfig(this.config)
    if (resizeConfig.enabled) classes.push('resizable-columns')

    // グループ化
    if (this.config.grouping?.enabled) classes.push('grouped')

    // テーブルレイアウト
    if (this.config.layout === 'fixed') classes.push('layout-fixed')

    const heightStyle = this.config.height ? `max-height: ${this.config.height};` : ''

    const html = `
      <div class="${classes.join(' ')}" data-table-id="${this.tableId}">
        ${this.config.label ? `<div class="data-table-header">
          <h3 class="data-table-title">${escapeHtml(this.config.label)}</h3>
          ${this.config.description ? `<p class="data-table-description">${escapeHtml(this.config.description)}</p>` : ''}
        </div>` : ''}
        ${renderFilterUI(this.config, this.state, this.tableId)}
        <div class="data-table-wrapper" style="${heightStyle}">
          ${this.state.isLoading ? renderLoadingOverlay() : ''}
          <table class="data-table">
            ${renderTableHeader(this.config, this.state)}
            ${renderTableBody(this.config, this.state, this.tableId)}
          </table>
        </div>
        ${renderPaginationUI(this.config, this.state, this.tableId)}
      </div>
    `

    this.detachEventListeners()
    this.container.innerHTML = html
    this.attachEventListeners()
  }

  /**
   * イベントリスナーを削除（メモリリーク防止）
   */
  private detachEventListeners(): void {
    this.container.removeEventListener('click', this.boundHandleClick)
    this.container.removeEventListener('change', this.boundHandleChange)
    this.container.removeEventListener('keypress', this.boundHandleKeypress)
    this.container.removeEventListener('mousedown', this.boundHandleMouseDown)
    document.removeEventListener('mousemove', this.boundHandleMouseMove)
    document.removeEventListener('mouseup', this.boundHandleMouseUp)
  }

  /**
   * イベントリスナーをアタッチ（イベント委譲パターン）
   */
  private attachEventListeners(): void {
    this.container.addEventListener('click', this.boundHandleClick)
    this.container.addEventListener('change', this.boundHandleChange)
    this.container.addEventListener('keypress', this.boundHandleKeypress)
    this.container.addEventListener('mousedown', this.boundHandleMouseDown)
    // マウスムーブとマウスアップはドキュメントレベルでリッスン（ドラッグ中にコンテナ外に出ても追従）
    document.addEventListener('mousemove', this.boundHandleMouseMove)
    document.addEventListener('mouseup', this.boundHandleMouseUp)
  }

  /**
   * クリックイベントハンドラー（イベント委譲）
   */
  private handleClick(e: Event): void {
    const target = e.target as HTMLElement

    // グループヘッダーのクリック（折りたたみ/展開）
    const groupHeader = target.closest('.data-table-group-header.collapsible')
    if (groupHeader) {
      const groupName = groupHeader.getAttribute('data-group-name')
      if (groupName) {
        this.toggleGroup(groupName)
      }
      return
    }

    // ソートヘッダー（リサイズハンドルは除外）
    if (!target.classList.contains('column-resize-handle')) {
      const sortableHeader = target.closest('.data-table-th.sortable')
      if (sortableHeader) {
        const columnId = sortableHeader.getAttribute('data-column-id')
        const direction = sortableHeader.getAttribute('data-sort-direction') as 'asc' | 'desc'
        if (columnId) {
          this.setSort(columnId, direction)
        }
        return
      }
    }

    // 行アクションボタン
    const actionBtn = target.closest('.row-action-btn')
    if (actionBtn) {
      const actionId = actionBtn.getAttribute('data-action-id')
      const rowId = actionBtn.getAttribute('data-row-id')
      const confirmTitle = actionBtn.getAttribute('data-confirm-title')

      if (actionId && rowId) {
        const row = this.state.originalData.find(r => String(r.id) === rowId)
        if (row) {
          if (confirmTitle) {
            const confirmMessage = actionBtn.getAttribute('data-confirm-message') ?? ''
            if (window.confirm(`${confirmTitle}\n\n${confirmMessage}`)) {
              this.callbacks.onRowAction?.(actionId, row, this.state)
            }
          } else {
            this.callbacks.onRowAction?.(actionId, row, this.state)
          }
        }
      }
      return
    }

    // フィルター適用ボタン
    if (target.closest('.filter-apply-btn')) {
      this.applyFiltersFromInputs()
      return
    }

    // フィルターリセットボタン
    if (target.closest('.filter-reset-btn')) {
      this.resetFilters()
      return
    }

    // 前ページボタン
    if (target.closest('.pagination-prev')) {
      this.setPage(this.state.currentPage - 1)
      return
    }

    // 次ページボタン
    if (target.closest('.pagination-next')) {
      this.setPage(this.state.currentPage + 1)
      return
    }
  }

  /**
   * 変更イベントハンドラー（イベント委譲）
   */
  private handleChange(e: Event): void {
    const target = e.target as HTMLElement

    // 行選択（チェックボックス）
    if (target.classList.contains('row-checkbox')) {
      const rowId = target.getAttribute('data-row-id')
      if (rowId) {
        this.selectRow(rowId)
      }
      return
    }

    // 行選択（ラジオボタン）
    if (target.classList.contains('row-radio')) {
      const rowId = target.getAttribute('data-row-id')
      if (rowId) {
        this.selectRow(rowId)
      }
      return
    }

    // 全選択チェックボックス
    if (target.classList.contains('select-all-checkbox')) {
      this.selectAll((target as HTMLInputElement).checked)
      return
    }

    // ページサイズ変更
    if (target.classList.contains('page-size-select')) {
      const pageSize = parseInt((target as HTMLSelectElement).value, 10)
      this.setPageSize(pageSize)
      return
    }
  }

  /**
   * キープレスイベントハンドラー（イベント委譲）
   */
  private handleKeypress(e: Event): void {
    const target = e.target as HTMLElement
    const keyEvent = e as KeyboardEvent

    // フィルター入力でEnterキー
    if (target.classList.contains('filter-input') && keyEvent.key === 'Enter') {
      this.applyFiltersFromInputs()
      return
    }
  }

  /**
   * グループを展開/折りたたみ
   */
  toggleGroup(groupName: string): void {
    const newCollapsed = new Set(this.state.collapsedGroups)
    const isCurrentlyCollapsed = newCollapsed.has(groupName)

    if (isCurrentlyCollapsed) {
      newCollapsed.delete(groupName)
    } else {
      newCollapsed.add(groupName)
    }

    this.state = {
      ...this.state,
      collapsedGroups: newCollapsed,
    }
    this.render()
    this.callbacks.onGroupToggle?.(groupName, isCurrentlyCollapsed, this.state)
  }

  /**
   * 全グループを展開
   */
  expandAllGroups(): void {
    this.state = {
      ...this.state,
      collapsedGroups: new Set(),
    }
    this.render()
  }

  /**
   * 全グループを折りたたむ
   */
  collapseAllGroups(): void {
    const groupField = this.config.grouping?.field ?? '_group'
    const allGroups = new Set<string>()

    for (const row of this.state.originalData) {
      const groupName = String(row[groupField] ?? '')
      if (groupName) {
        allGroups.add(groupName)
      }
    }

    this.state = {
      ...this.state,
      collapsedGroups: allGroups,
    }
    this.render()
  }

  /**
   * カラム幅を設定
   */
  setColumnWidth(columnId: string, width: number): void {
    // 入力の検証
    if (!Number.isFinite(width) || width < 0) {
      return
    }

    const resizeConfig = getResizeConfig(this.config)
    const clampedWidth = Math.max(
      resizeConfig.minWidth,
      Math.min(resizeConfig.maxWidth, width)
    )

    this.state = {
      ...this.state,
      columnWidths: {
        ...this.state.columnWidths,
        [columnId]: clampedWidth,
      },
    }
    this.render()
    this.callbacks.onColumnResize?.(columnId, clampedWidth, this.state)
  }

  /**
   * マウスダウンイベントハンドラー（リサイズ開始）
   */
  private handleMouseDown(e: Event): void {
    const target = e.target as HTMLElement

    // リサイズハンドル
    if (target.classList.contains('column-resize-handle')) {
      e.preventDefault()
      const columnId = target.getAttribute('data-column-id')
      if (columnId) {
        this.resizingColumnId = columnId

        const mouseEvent = e as MouseEvent
        this.resizeStartX = mouseEvent.clientX

        // 現在のカラム幅を取得
        const th = target.closest('.data-table-th') as HTMLElement
        if (th) {
          this.resizeStartWidth = th.offsetWidth
        }

        // リサイズ中のクラスを追加
        this.container.classList.add('resizing')
      }
    }
  }

  /**
   * マウスムーブイベントハンドラー（リサイズ中）
   */
  private handleMouseMove(e: Event): void {
    if (!this.resizingColumnId) return

    const mouseEvent = e as MouseEvent
    const delta = mouseEvent.clientX - this.resizeStartX
    const newWidth = this.resizeStartWidth + delta

    // リアルタイムでカラム幅を更新（パフォーマンスのためDOMを直接操作）
    const th = this.container.querySelector(
      `.data-table-th[data-column-id="${this.resizingColumnId}"]`
    ) as HTMLElement
    if (th) {
      const resizeConfig = getResizeConfig(this.config)
      const clampedWidth = Math.max(
        resizeConfig.minWidth,
        Math.min(resizeConfig.maxWidth, newWidth)
      )
      th.style.width = `${clampedWidth}px`
      th.style.minWidth = `${clampedWidth}px`
    }
  }

  /**
   * マウスアップイベントハンドラー（リサイズ終了）
   */
  private handleMouseUp(_e: Event): void {
    if (!this.resizingColumnId) return

    // リサイズ中のクラスを削除
    this.container.classList.remove('resizing')

    // 最終的な幅を取得してstateに保存
    const th = this.container.querySelector(
      `.data-table-th[data-column-id="${this.resizingColumnId}"]`
    ) as HTMLElement
    if (th) {
      const finalWidth = th.offsetWidth
      this.state = {
        ...this.state,
        columnWidths: {
          ...this.state.columnWidths,
          [this.resizingColumnId]: finalWidth,
        },
      }
      this.callbacks.onColumnResize?.(this.resizingColumnId, finalWidth, this.state)
    }

    this.resizingColumnId = null
  }

  /**
   * コンポーネントを破棄（クリーンアップ）
   */
  destroy(): void {
    this.detachEventListeners()
    this.container.innerHTML = ''
  }

  /**
   * 入力からフィルター値を適用
   */
  private applyFiltersFromInputs(): void {
    const filterValues: Record<string, unknown> = {}

    this.container.querySelectorAll('[data-filter-id]').forEach(element => {
      const filterId = element.getAttribute('data-filter-id')
      if (filterId) {
        const value = (element as HTMLInputElement | HTMLSelectElement).value
        if (value) {
          filterValues[filterId] = value
        }
      }
    })

    this.setFilterValues(filterValues)
  }
}

// =============================================================================
// Static Renderer for form-fields.ts integration
// =============================================================================

/**
 * データテーブルフィールドを静的HTMLとしてレンダリング
 * form-fields.ts から呼び出される
 */
export function renderDataTableField(field: DataTableField): string {
  const classes = ['mokkun-data-table']
  if (field.striped) classes.push('striped')
  if (field.hoverable !== false) classes.push('hoverable')
  if (field.bordered) classes.push('bordered')
  if (field.compact) classes.push('compact')
  if (field.responsive !== false) classes.push('responsive')

  // 新機能のクラス
  const fixedHeaderConfig = getFixedHeaderConfig(field)
  if (fixedHeaderConfig.enabled) classes.push('fixed-header')

  const resizeConfig = getResizeConfig(field)
  if (resizeConfig.enabled) classes.push('resizable-columns')

  if (field.grouping?.enabled) classes.push('grouped')
  if (field.layout === 'fixed') classes.push('layout-fixed')

  const tableId = generateId('data-table')

  // データが空の場合はダミーデータを生成
  let data = field.data ?? []
  if (data.length === 0 && field.columns.length > 0) {
    const dummyRowCount = field.pagination?.page_size ?? 10
    data = generateDataTableDummyData(field.columns, dummyRowCount) as DataTableRow[]
  }

  const heightStyle = field.height ? `max-height: ${field.height};` : ''

  // 簡易的な静的レンダリング（ソート・フィルターはJSで動的に）
  const headerCells = field.columns.map(column => {
    const sortable = column.sortable !== false ? 'sortable' : ''
    const alignClass = column.align ? `align-${column.align}` : ''
    const fixedClass = column.fixed ? `fixed-${column.fixed}` : ''
    const widthStyle = column.width ? `width: ${column.width};` : ''

    // リサイズハンドル
    const isResizable = resizeConfig.enabled && (column.resizable !== false)
    const resizeHandle = isResizable
      ? `<span class="column-resize-handle" data-column-id="${escapeHtml(column.id)}"></span>`
      : ''

    // colspan/rowspan (整数のみ許可)
    const colspanAttr = column.colspan && Number.isInteger(column.colspan) && column.colspan > 0
      ? `colspan="${column.colspan}"`
      : ''
    const rowspanAttr = column.rowspan && Number.isInteger(column.rowspan) && column.rowspan > 0
      ? `rowspan="${column.rowspan}"`
      : ''

    return `
      <th class="data-table-th ${sortable} ${alignClass} ${fixedClass}" data-column-id="${escapeHtml(column.id)}" style="${widthStyle}" ${colspanAttr} ${rowspanAttr}>
        <span class="th-content">${escapeHtml(column.label)}</span>
        ${resizeHandle}
      </th>
    `
  }).join('')

  // 選択ヘッダー
  const selectionHeader = field.selection === 'multiple'
    ? '<th class="data-table-th selection-header"><input type="checkbox" class="select-all-checkbox" /></th>'
    : field.selection === 'single'
      ? '<th class="data-table-th selection-header"></th>'
      : ''

  // アクションヘッダー
  const actionsHeader = field.row_actions && field.row_actions.length > 0
    ? '<th class="data-table-th actions-header">操作</th>'
    : ''

  // 行のレンダリング
  let bodyContent: string
  if (data.length === 0) {
    const emptyState = field.empty_state ?? {}
    const title = emptyState.title ?? 'データがありません'
    const description = emptyState.description ?? ''
    const icon = emptyState.icon ?? '📭'

    let totalColumns = field.columns.length
    if (field.selection && field.selection !== 'none') totalColumns++
    if (field.row_actions && field.row_actions.length > 0) totalColumns++

    // プライマリアクションボタン
    const actionHtml = emptyState.action
      ? `<button type="button" class="btn btn-primary empty-state-action" data-handler="${escapeHtml(emptyState.action.handler)}">${escapeHtml(emptyState.action.label)}</button>`
      : ''

    bodyContent = `
      <tr class="empty-state-row">
        <td colspan="${totalColumns}" class="empty-state-cell">
          <div class="empty-state">
            <div class="empty-state-icon-wrapper">
              <span class="empty-state-icon">${escapeHtml(icon)}</span>
            </div>
            <div class="empty-state-content">
              <h4 class="empty-state-title">${escapeHtml(title)}</h4>
              ${description ? `<p class="empty-state-description">${escapeHtml(description)}</p>` : ''}
            </div>
            ${actionHtml ? `<div class="empty-state-actions">${actionHtml}</div>` : ''}
          </div>
        </td>
      </tr>
    `
  } else {
    bodyContent = data.map(row => {
      const cells = field.columns.map(column => {
        const fieldKey = column.field ?? column.id
        const value = row[fieldKey]
        const formattedValue = formatCellValue(value, column)
        const statusClass = getStatusBadgeClass(value, column)
        const alignClass = column.align ? `align-${column.align}` : ''
        const fixedClass = column.fixed ? `fixed-${column.fixed}` : ''

        // セル結合
        const cellMerge = row._cellMerge?.[column.id] as DataTableCellMerge | undefined
        if (cellMerge?.hidden) {
          return '' // 結合されて非表示のセルはスキップ
        }

        const colspanAttr = cellMerge?.colspan && Number.isInteger(cellMerge.colspan) && cellMerge.colspan > 0
          ? `colspan="${cellMerge.colspan}"`
          : ''
        const rowspanAttr = cellMerge?.rowspan && Number.isInteger(cellMerge.rowspan) && cellMerge.rowspan > 0
          ? `rowspan="${cellMerge.rowspan}"`
          : ''

        const cellContent = statusClass
          ? `<span class="${statusClass}">${escapeHtml(formattedValue)}</span>`
          : escapeHtml(formattedValue)

        return `<td class="data-table-td ${alignClass} ${fixedClass}" ${colspanAttr} ${rowspanAttr}>${cellContent}</td>`
      }).join('')

      const selectionCell = field.selection === 'multiple'
        ? `<td class="data-table-td selection-cell"><input type="checkbox" class="row-checkbox" data-row-id="${escapeHtml(String(row.id))}" /></td>`
        : field.selection === 'single'
          ? `<td class="data-table-td selection-cell"><input type="radio" name="${tableId}-selection" class="row-radio" data-row-id="${escapeHtml(String(row.id))}" /></td>`
          : ''

      const actionsCell = field.row_actions && field.row_actions.length > 0
        ? `<td class="data-table-td actions-cell">${renderRowActions(field.row_actions, row)}</td>`
        : ''

      return `
        <tr class="data-table-tr" data-row-id="${escapeHtml(String(row.id))}">
          ${selectionCell}
          ${cells}
          ${actionsCell}
        </tr>
      `
    }).join('')
  }

  const requiredMark = field.required ? '<span class="required-mark">*</span>' : ''
  const description = field.description
    ? `<p class="field-description">${escapeHtml(field.description)}</p>`
    : ''

  // 固定ヘッダー用のクラスとスタイル
  const stickyStyle = fixedHeaderConfig.enabled
    ? `top: ${fixedHeaderConfig.offset}px;`
    : ''
  const theadClass = fixedHeaderConfig.enabled ? 'data-table-thead sticky-header' : 'data-table-thead'

  // 空状態のtbodyクラス
  const tbodyClass = data.length === 0 ? 'data-table-tbody data-table-empty-tbody' : 'data-table-tbody'

  return `
    <div class="form-field field-type-data_table" data-field-id="${escapeHtml(field.id)}">
      <label class="field-label">${escapeHtml(field.label)}${requiredMark}</label>
      ${description}
      <div class="${classes.join(' ')}" data-table-id="${tableId}">
        <div class="data-table-wrapper" style="${heightStyle}">
          <table class="data-table">
            <thead class="${theadClass}" style="${stickyStyle}">
              <tr>
                ${selectionHeader}
                ${headerCells}
                ${actionsHeader}
              </tr>
            </thead>
            <tbody class="${tbodyClass}">
              ${bodyContent}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
}

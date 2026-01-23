/**
 * Pagination Component Tests
 * ページネーションコンポーネントのテスト
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  Pagination,
  createPagination,
  type PaginationConfig,
  type PaginationCallbacks,
} from '../renderer/components/pagination'

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
// Pagination Component Tests
// =============================================================================

describe('Pagination Component', () => {
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
      const config: PaginationConfig = { totalItems: 100 }
      const pagination = new Pagination(container, config)
      pagination.render()

      expect(container.classList.contains('mokkun-pagination')).toBe(true)
      expect(container.querySelector('.pagination-wrapper')).toBeTruthy()
      expect(container.querySelector('.pagination-navigation')).toBeTruthy()
    })

    it('should initialize with correct state', () => {
      const config: PaginationConfig = { totalItems: 100 }
      const pagination = new Pagination(container, config)

      const state = pagination.getState()
      expect(state.currentPage).toBe(1)
      expect(state.pageSize).toBe(10)
      expect(state.totalItems).toBe(100)
      expect(state.totalPages).toBe(10)
    })

    it('should initialize with custom page size', () => {
      const config: PaginationConfig = {
        totalItems: 100,
        initialPageSize: 25,
      }
      const pagination = new Pagination(container, config)

      const state = pagination.getState()
      expect(state.pageSize).toBe(25)
      expect(state.totalPages).toBe(4)
    })

    it('should initialize with custom initial page', () => {
      const config: PaginationConfig = {
        totalItems: 100,
        initialPage: 5,
      }
      const pagination = new Pagination(container, config)

      expect(pagination.getCurrentPage()).toBe(5)
    })

    it('should clamp initial page to valid range', () => {
      const config: PaginationConfig = {
        totalItems: 100,
        initialPage: 999,
      }
      const pagination = new Pagination(container, config)

      expect(pagination.getCurrentPage()).toBe(10) // max page
    })
  })

  // ===========================================================================
  // Page Navigation Tests
  // ===========================================================================

  describe('Page Navigation', () => {
    it('should navigate to next page', () => {
      const config: PaginationConfig = { totalItems: 100 }
      const pagination = new Pagination(container, config)

      pagination.nextPage()
      expect(pagination.getCurrentPage()).toBe(2)
    })

    it('should navigate to previous page', () => {
      const config: PaginationConfig = {
        totalItems: 100,
        initialPage: 5,
      }
      const pagination = new Pagination(container, config)

      pagination.previousPage()
      expect(pagination.getCurrentPage()).toBe(4)
    })

    it('should navigate to first page', () => {
      const config: PaginationConfig = {
        totalItems: 100,
        initialPage: 5,
      }
      const pagination = new Pagination(container, config)

      pagination.firstPage()
      expect(pagination.getCurrentPage()).toBe(1)
    })

    it('should navigate to last page', () => {
      const config: PaginationConfig = { totalItems: 100 }
      const pagination = new Pagination(container, config)

      pagination.lastPage()
      expect(pagination.getCurrentPage()).toBe(10)
    })

    it('should go to specific page', () => {
      const config: PaginationConfig = { totalItems: 100 }
      const pagination = new Pagination(container, config)

      pagination.goToPage(7)
      expect(pagination.getCurrentPage()).toBe(7)
    })

    it('should not navigate beyond first page', () => {
      const config: PaginationConfig = { totalItems: 100 }
      const pagination = new Pagination(container, config)

      pagination.previousPage()
      expect(pagination.getCurrentPage()).toBe(1)
    })

    it('should not navigate beyond last page', () => {
      const config: PaginationConfig = {
        totalItems: 100,
        initialPage: 10,
      }
      const pagination = new Pagination(container, config)

      pagination.nextPage()
      expect(pagination.getCurrentPage()).toBe(10)
    })
  })

  // ===========================================================================
  // Page Size Tests
  // ===========================================================================

  describe('Page Size', () => {
    it('should change page size', () => {
      const config: PaginationConfig = { totalItems: 100 }
      const pagination = new Pagination(container, config)

      pagination.setPageSize(25)

      const state = pagination.getState()
      expect(state.pageSize).toBe(25)
      expect(state.totalPages).toBe(4)
    })

    it('should preserve view position when changing page size', () => {
      const config: PaginationConfig = {
        totalItems: 100,
        initialPage: 3, // items 21-30
        initialPageSize: 10,
      }
      const pagination = new Pagination(container, config)

      // Change to page size 25 - item 21 should now be on page 1
      pagination.setPageSize(25)
      expect(pagination.getCurrentPage()).toBe(1)

      const range = pagination.getItemRange()
      expect(range.start).toBe(1)
      expect(range.end).toBe(25)
    })

    it('should reset to page 1 when page size increases beyond total pages', () => {
      const config: PaginationConfig = {
        totalItems: 100,
        initialPage: 5,
        initialPageSize: 10,
      }
      const pagination = new Pagination(container, config)

      pagination.setPageSize(100)
      expect(pagination.getCurrentPage()).toBe(1)
    })
  })

  // ===========================================================================
  // Total Items Tests
  // ===========================================================================

  describe('Total Items', () => {
    it('should update total items', () => {
      const config: PaginationConfig = { totalItems: 100 }
      const pagination = new Pagination(container, config)

      pagination.setTotalItems(200)

      const state = pagination.getState()
      expect(state.totalItems).toBe(200)
      expect(state.totalPages).toBe(20)
    })

    it('should clamp current page when total items decrease', () => {
      const config: PaginationConfig = {
        totalItems: 100,
        initialPage: 10,
      }
      const pagination = new Pagination(container, config)

      pagination.setTotalItems(50) // now only 5 pages
      expect(pagination.getCurrentPage()).toBe(5)
    })
  })

  // ===========================================================================
  // Item Range Tests
  // ===========================================================================

  describe('Item Range', () => {
    it('should calculate correct item range for first page', () => {
      const config: PaginationConfig = { totalItems: 100 }
      const pagination = new Pagination(container, config)

      const range = pagination.getItemRange()
      expect(range.start).toBe(1)
      expect(range.end).toBe(10)
    })

    it('should calculate correct item range for middle page', () => {
      const config: PaginationConfig = {
        totalItems: 100,
        initialPage: 5,
      }
      const pagination = new Pagination(container, config)

      const range = pagination.getItemRange()
      expect(range.start).toBe(41)
      expect(range.end).toBe(50)
    })

    it('should calculate correct item range for last page', () => {
      const config: PaginationConfig = {
        totalItems: 95,
        initialPage: 10,
      }
      const pagination = new Pagination(container, config)

      const range = pagination.getItemRange()
      expect(range.start).toBe(91)
      expect(range.end).toBe(95)
    })
  })

  // ===========================================================================
  // Callback Tests
  // ===========================================================================

  describe('Callbacks', () => {
    it('should call onPageChange when page changes', () => {
      const onPageChange = vi.fn()
      const config: PaginationConfig = { totalItems: 100 }
      const callbacks: PaginationCallbacks = { onPageChange }

      const pagination = new Pagination(container, config, callbacks)
      pagination.goToPage(5)

      expect(onPageChange).toHaveBeenCalledWith(5, expect.any(Object))
    })

    it('should call onPageSizeChange when page size changes', () => {
      const onPageSizeChange = vi.fn()
      const config: PaginationConfig = { totalItems: 100 }
      const callbacks: PaginationCallbacks = { onPageSizeChange }

      const pagination = new Pagination(container, config, callbacks)
      pagination.setPageSize(25)

      expect(onPageSizeChange).toHaveBeenCalledWith(25, expect.any(Object))
    })

    it('should not call callbacks when value does not change', () => {
      const onPageChange = vi.fn()
      const config: PaginationConfig = { totalItems: 100 }
      const callbacks: PaginationCallbacks = { onPageChange }

      const pagination = new Pagination(container, config, callbacks)
      pagination.goToPage(1) // already on page 1

      expect(onPageChange).not.toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // Rendering Tests
  // ===========================================================================

  describe('Rendering', () => {
    it('should render page size selector by default', () => {
      const config: PaginationConfig = { totalItems: 100 }
      const pagination = new Pagination(container, config)
      pagination.render()

      expect(container.querySelector('.pagination-page-size-selector')).toBeTruthy()
      expect(container.querySelector('.page-size-select')).toBeTruthy()
    })

    it('should hide page size selector when disabled', () => {
      const config: PaginationConfig = {
        totalItems: 100,
        showPageSizeSelector: false,
      }
      const pagination = new Pagination(container, config)
      pagination.render()

      expect(container.querySelector('.pagination-page-size-selector')).toBeFalsy()
    })

    it('should render item count by default', () => {
      const config: PaginationConfig = { totalItems: 100 }
      const pagination = new Pagination(container, config)
      pagination.render()

      expect(container.querySelector('.pagination-item-count')).toBeTruthy()
      expect(container.textContent).toContain('100件中 1-10件を表示')
    })

    it('should hide item count when disabled', () => {
      const config: PaginationConfig = {
        totalItems: 100,
        showItemCount: false,
      }
      const pagination = new Pagination(container, config)
      pagination.render()

      expect(container.querySelector('.pagination-item-count')).toBeFalsy()
    })

    it('should render jump buttons by default', () => {
      const config: PaginationConfig = { totalItems: 100 }
      const pagination = new Pagination(container, config)
      pagination.render()

      expect(container.querySelector('.pagination-button-first')).toBeTruthy()
      expect(container.querySelector('.pagination-button-last')).toBeTruthy()
    })

    it('should hide jump buttons when disabled', () => {
      const config: PaginationConfig = {
        totalItems: 100,
        showJumpButtons: false,
      }
      const pagination = new Pagination(container, config)
      pagination.render()

      expect(container.querySelector('.pagination-button-first')).toBeFalsy()
      expect(container.querySelector('.pagination-button-last')).toBeFalsy()
    })

    it('should render prev and next buttons', () => {
      const config: PaginationConfig = { totalItems: 100 }
      const pagination = new Pagination(container, config)
      pagination.render()

      expect(container.querySelector('.pagination-button-prev')).toBeTruthy()
      expect(container.querySelector('.pagination-button-next')).toBeTruthy()
    })

    it('should disable prev button on first page', () => {
      const config: PaginationConfig = { totalItems: 100 }
      const pagination = new Pagination(container, config)
      pagination.render()

      const prevButton = container.querySelector('.pagination-button-prev')
      expect(prevButton?.hasAttribute('disabled')).toBe(true)
    })

    it('should disable next button on last page', () => {
      const config: PaginationConfig = {
        totalItems: 100,
        initialPage: 10,
      }
      const pagination = new Pagination(container, config)
      pagination.render()

      const nextButton = container.querySelector('.pagination-button-next')
      expect(nextButton?.hasAttribute('disabled')).toBe(true)
    })

    it('should render page number buttons', () => {
      const config: PaginationConfig = { totalItems: 100 }
      const pagination = new Pagination(container, config)
      pagination.render()

      const pageButtons = container.querySelectorAll('.pagination-page-button')
      expect(pageButtons.length).toBeGreaterThan(0)
    })

    it('should mark current page button as active', () => {
      const config: PaginationConfig = {
        totalItems: 100,
        initialPage: 5,
      }
      const pagination = new Pagination(container, config)
      pagination.render()

      const activeButton = container.querySelector('.pagination-page-button.active')
      expect(activeButton?.textContent).toBe('5')
      expect(activeButton?.getAttribute('aria-current')).toBe('page')
    })

    it('should apply compact class when enabled', () => {
      const config: PaginationConfig = {
        totalItems: 100,
        compact: true,
      }
      const pagination = new Pagination(container, config)
      pagination.render()

      expect(container.classList.contains('pagination-compact')).toBe(true)
    })

    it('should apply alignment class', () => {
      const config: PaginationConfig = {
        totalItems: 100,
        align: 'right',
      }
      const pagination = new Pagination(container, config)
      pagination.render()

      expect(container.classList.contains('pagination-align-right')).toBe(true)
    })
  })

  // ===========================================================================
  // Visible Pages Calculation Tests
  // ===========================================================================

  describe('Visible Pages Calculation', () => {
    it('should show all pages when total is less than max', () => {
      const config: PaginationConfig = {
        totalItems: 50, // 5 pages
        maxPageButtons: 7,
      }
      const pagination = new Pagination(container, config)
      pagination.render()

      const pageButtons = container.querySelectorAll('.pagination-page-button')
      expect(pageButtons.length).toBe(5)
    })

    it('should show ellipsis when pages exceed max', () => {
      const config: PaginationConfig = {
        totalItems: 200, // 20 pages
        maxPageButtons: 7,
      }
      const pagination = new Pagination(container, config)
      pagination.render()

      const ellipsis = container.querySelectorAll('.pagination-ellipsis')
      expect(ellipsis.length).toBeGreaterThan(0)
    })
  })

  // ===========================================================================
  // Edge Cases
  // ===========================================================================

  describe('Edge Cases', () => {
    it('should handle zero items', () => {
      const config: PaginationConfig = { totalItems: 0 }
      const pagination = new Pagination(container, config)
      pagination.render()

      expect(pagination.getCurrentPage()).toBe(1)
      expect(pagination.getState().totalPages).toBe(0)
      expect(container.textContent).toContain('0件')
    })

    it('should handle single item', () => {
      const config: PaginationConfig = { totalItems: 1 }
      const pagination = new Pagination(container, config)

      const state = pagination.getState()
      expect(state.totalPages).toBe(1)

      const range = pagination.getItemRange()
      expect(range.start).toBe(1)
      expect(range.end).toBe(1)
    })

    it('should handle exact page boundary', () => {
      const config: PaginationConfig = { totalItems: 100 }
      const pagination = new Pagination(container, config)

      expect(pagination.getState().totalPages).toBe(10)
    })

    it('should handle items not on page boundary', () => {
      const config: PaginationConfig = { totalItems: 95 }
      const pagination = new Pagination(container, config)

      expect(pagination.getState().totalPages).toBe(10)
    })
  })

  // ===========================================================================
  // Factory Function Tests
  // ===========================================================================

  describe('Factory Function', () => {
    it('should create and render pagination', () => {
      const config: PaginationConfig = { totalItems: 100 }
      const pagination = createPagination(container, config)

      expect(pagination).toBeInstanceOf(Pagination)
      expect(container.classList.contains('mokkun-pagination')).toBe(true)
    })

    it('should accept callbacks', () => {
      const onPageChange = vi.fn()
      const config: PaginationConfig = { totalItems: 100 }
      const callbacks: PaginationCallbacks = { onPageChange }

      const pagination = createPagination(container, config, callbacks)
      pagination.nextPage()

      expect(onPageChange).toHaveBeenCalled()
    })
  })
})

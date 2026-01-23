/**
 * Pagination Component
 * ページネーションコンポーネント
 *
 * 機能:
 * - ページ番号表示
 * - 前後ボタン
 * - 最初/最後へのジャンプ
 * - ページサイズ選択
 * - 表示件数表示
 * - コンパクト表示モード
 */

import { createElement, generateId } from '../utils/dom'

// =============================================================================
// Types
// =============================================================================

/**
 * ページネーションの状態
 */
export interface PaginationState {
  /** 現在のページ（1始まり） */
  currentPage: number
  /** 1ページあたりのアイテム数 */
  pageSize: number
  /** 総アイテム数 */
  totalItems: number
  /** 総ページ数 */
  totalPages: number
}

/**
 * ページネーションのコールバック
 */
export interface PaginationCallbacks {
  /** ページ変更時 */
  onPageChange?: (page: number, state: PaginationState) => void
  /** ページサイズ変更時 */
  onPageSizeChange?: (pageSize: number, state: PaginationState) => void
}

/**
 * ページネーションの設定
 */
export interface PaginationConfig {
  /** 総アイテム数 */
  totalItems: number
  /** 初期ページ（1始まり、デフォルト: 1） */
  initialPage?: number
  /** 初期ページサイズ（デフォルト: 10） */
  initialPageSize?: number
  /** ページサイズの選択肢（デフォルト: [10, 25, 50, 100]） */
  pageSizeOptions?: number[]
  /** ページサイズ選択を表示するか（デフォルト: true） */
  showPageSizeSelector?: boolean
  /** 表示件数を表示するか（デフォルト: true） */
  showItemCount?: boolean
  /** 最初/最後へのジャンプボタンを表示するか（デフォルト: true） */
  showJumpButtons?: boolean
  /** ページ番号ボタンの最大表示数（デフォルト: 7） */
  maxPageButtons?: number
  /** コンパクトモード（デフォルト: false） */
  compact?: boolean
  /** 位置（デフォルト: 'center'） */
  align?: 'left' | 'center' | 'right'
}

// =============================================================================
// Pagination Class
// =============================================================================

/**
 * ページネーションコンポーネント
 */
export class Pagination {
  private config: PaginationConfig
  private state: PaginationState
  private callbacks: PaginationCallbacks
  private container: HTMLElement
  private instanceId: string

  constructor(
    container: HTMLElement,
    config: PaginationConfig,
    callbacks: PaginationCallbacks = {}
  ) {
    this.config = config
    this.container = container
    this.callbacks = callbacks
    this.instanceId = generateId('pagination')
    this.state = this.createInitialState()
  }

  // ===========================================================================
  // Public Methods
  // ===========================================================================

  /**
   * ページネーションをレンダリング
   */
  render(): void {
    this.container.innerHTML = ''

    const align = this.config.align ?? 'center'
    const compact = this.config.compact ?? false
    this.container.className = `mokkun-pagination pagination-align-${align} ${compact ? 'pagination-compact' : ''}`

    const wrapper = createElement('div', { className: 'pagination-wrapper' })

    // ページサイズ選択
    if (this.config.showPageSizeSelector !== false) {
      const pageSizeSelector = this.renderPageSizeSelector()
      wrapper.appendChild(pageSizeSelector)
    }

    // ページナビゲーション
    const navigation = this.renderNavigation()
    wrapper.appendChild(navigation)

    // 表示件数
    if (this.config.showItemCount !== false) {
      const itemCount = this.renderItemCount()
      wrapper.appendChild(itemCount)
    }

    this.container.appendChild(wrapper)
  }

  /**
   * 指定したページへ移動
   */
  goToPage(page: number): void {
    const newPage = this.clampPage(page)
    if (this.state.currentPage === newPage) {
      return
    }

    this.state = {
      ...this.state,
      currentPage: newPage,
    }

    this.render()
    this.callbacks.onPageChange?.(newPage, this.state)
  }

  /**
   * 次のページへ移動
   */
  nextPage(): void {
    this.goToPage(this.state.currentPage + 1)
  }

  /**
   * 前のページへ移動
   */
  previousPage(): void {
    this.goToPage(this.state.currentPage - 1)
  }

  /**
   * 最初のページへ移動
   */
  firstPage(): void {
    this.goToPage(1)
  }

  /**
   * 最後のページへ移動
   */
  lastPage(): void {
    this.goToPage(this.state.totalPages)
  }

  /**
   * ページサイズを設定
   */
  setPageSize(pageSize: number): void {
    if (this.state.pageSize === pageSize) {
      return
    }

    // 現在表示している最初のアイテムのインデックスを保持
    const firstItemIndex = (this.state.currentPage - 1) * this.state.pageSize

    // 新しいページサイズで同じアイテムが表示されるページを計算
    const newPage = Math.floor(firstItemIndex / pageSize) + 1

    const totalPages = Math.ceil(this.state.totalItems / pageSize)

    this.state = {
      ...this.state,
      pageSize,
      totalPages,
      currentPage: this.clampPage(newPage, totalPages),
    }

    this.render()
    this.callbacks.onPageSizeChange?.(pageSize, this.state)
  }

  /**
   * 総アイテム数を更新
   */
  setTotalItems(totalItems: number): void {
    const totalPages = Math.ceil(totalItems / this.state.pageSize)

    this.state = {
      ...this.state,
      totalItems,
      totalPages,
      currentPage: this.clampPage(this.state.currentPage, totalPages),
    }

    this.render()
  }

  /**
   * 現在の状態を取得
   */
  getState(): PaginationState {
    return { ...this.state }
  }

  /**
   * 現在のページを取得
   */
  getCurrentPage(): number {
    return this.state.currentPage
  }

  /**
   * ページサイズを取得
   */
  getPageSize(): number {
    return this.state.pageSize
  }

  /**
   * 表示中のアイテム範囲を取得
   */
  getItemRange(): { start: number; end: number } {
    const start = (this.state.currentPage - 1) * this.state.pageSize + 1
    const end = Math.min(this.state.currentPage * this.state.pageSize, this.state.totalItems)
    return { start, end }
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  /**
   * 初期状態を作成
   */
  private createInitialState(): PaginationState {
    const pageSize = this.config.initialPageSize ?? 10
    const totalPages = Math.ceil(this.config.totalItems / pageSize)
    const currentPage = this.clampPage(this.config.initialPage ?? 1, totalPages)

    return {
      currentPage,
      pageSize,
      totalItems: this.config.totalItems,
      totalPages,
    }
  }

  /**
   * ページ番号を有効範囲内にクランプ
   */
  private clampPage(page: number, totalPages?: number): number {
    const maxPage = totalPages ?? this.state.totalPages
    return Math.max(1, Math.min(page, maxPage))
  }

  /**
   * ページサイズセレクターをレンダリング
   */
  private renderPageSizeSelector(): HTMLElement {
    const container = createElement('div', { className: 'pagination-page-size-selector' })

    const label = createElement('label', {
      className: 'page-size-label',
      textContent: '表示件数:',
      attributes: {
        for: `${this.instanceId}-page-size`,
      },
    })

    const select = createElement('select', {
      className: 'page-size-select',
      attributes: {
        id: `${this.instanceId}-page-size`,
        'aria-label': 'ページサイズ選択',
      },
    }) as HTMLSelectElement

    const options = this.config.pageSizeOptions ?? [10, 25, 50, 100]
    options.forEach(size => {
      const option = createElement('option', {
        textContent: `${size}件`,
        attributes: {
          value: String(size),
        },
      }) as HTMLOptionElement

      if (size === this.state.pageSize) {
        option.selected = true
      }

      select.appendChild(option)
    })

    select.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement
      this.setPageSize(parseInt(target.value, 10))
    })

    container.appendChild(label)
    container.appendChild(select)

    return container
  }

  /**
   * ナビゲーションをレンダリング
   */
  private renderNavigation(): HTMLElement {
    const container = createElement('div', { className: 'pagination-navigation' })

    const { currentPage, totalPages } = this.state
    const showJumpButtons = this.config.showJumpButtons !== false

    // 最初へボタン
    if (showJumpButtons) {
      const firstButton = this.createButton('最初', 'first', currentPage === 1)
      firstButton.addEventListener('click', () => this.firstPage())
      container.appendChild(firstButton)
    }

    // 前へボタン
    const prevButton = this.createButton('前へ', 'prev', currentPage === 1)
    prevButton.addEventListener('click', () => this.previousPage())
    container.appendChild(prevButton)

    // ページ番号ボタン
    const pageButtons = this.renderPageButtons()
    pageButtons.forEach(button => container.appendChild(button))

    // 次へボタン
    const nextButton = this.createButton('次へ', 'next', currentPage === totalPages)
    nextButton.addEventListener('click', () => this.nextPage())
    container.appendChild(nextButton)

    // 最後へボタン
    if (showJumpButtons) {
      const lastButton = this.createButton('最後', 'last', currentPage === totalPages)
      lastButton.addEventListener('click', () => this.lastPage())
      container.appendChild(lastButton)
    }

    return container
  }

  /**
   * ページ番号ボタンをレンダリング
   */
  private renderPageButtons(): HTMLElement[] {
    const { currentPage, totalPages } = this.state
    const maxButtons = this.config.maxPageButtons ?? 7

    if (totalPages === 0) {
      return []
    }

    const buttons: HTMLElement[] = []
    const pages = this.calculateVisiblePages(currentPage, totalPages, maxButtons)

    let previousPage = 0
    pages.forEach(page => {
      // 省略記号を追加
      if (previousPage > 0 && page > previousPage + 1) {
        const ellipsis = createElement('span', {
          className: 'pagination-ellipsis',
          textContent: '...',
          attributes: {
            'aria-hidden': 'true',
          },
        })
        buttons.push(ellipsis)
      }

      const button = this.createPageButton(page, page === currentPage)
      button.addEventListener('click', () => this.goToPage(page))
      buttons.push(button)

      previousPage = page
    })

    return buttons
  }

  /**
   * 表示するページ番号を計算
   */
  private calculateVisiblePages(currentPage: number, totalPages: number, maxButtons: number): number[] {
    if (totalPages <= maxButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const pages: number[] = []
    const sideButtons = Math.floor((maxButtons - 3) / 2) // 3 = 最初 + 最後 + 現在

    // 常に最初のページを含める
    pages.push(1)

    if (currentPage <= sideButtons + 2) {
      // 先頭に近い場合
      for (let i = 2; i < maxButtons - 1; i++) {
        pages.push(i)
      }
    } else if (currentPage >= totalPages - sideButtons - 1) {
      // 末尾に近い場合
      for (let i = totalPages - maxButtons + 2; i < totalPages; i++) {
        pages.push(i)
      }
    } else {
      // 中央の場合
      for (let i = currentPage - sideButtons; i <= currentPage + sideButtons; i++) {
        if (i > 1 && i < totalPages) {
          pages.push(i)
        }
      }
    }

    // 常に最後のページを含める（totalPages > 1の場合）
    if (totalPages > 1 && !pages.includes(totalPages)) {
      pages.push(totalPages)
    }

    return pages.sort((a, b) => a - b)
  }

  /**
   * ボタンを作成
   */
  private createButton(label: string, type: string, disabled: boolean): HTMLElement {
    const button = createElement('button', {
      className: `pagination-button pagination-button-${type}`,
      textContent: label,
      attributes: {
        type: 'button',
        'aria-label': label,
      },
    })

    if (disabled) {
      button.setAttribute('disabled', 'disabled')
      button.setAttribute('aria-disabled', 'true')
    }

    return button
  }

  /**
   * ページ番号ボタンを作成
   */
  private createPageButton(page: number, isActive: boolean): HTMLElement {
    const button = createElement('button', {
      className: `pagination-button pagination-page-button ${isActive ? 'active' : ''}`,
      textContent: String(page),
      attributes: {
        type: 'button',
        'aria-label': `ページ ${page}`,
        'aria-current': isActive ? 'page' : 'false',
      },
    })

    if (isActive) {
      button.setAttribute('data-active', '')
    }

    return button
  }

  /**
   * 表示件数をレンダリング
   */
  private renderItemCount(): HTMLElement {
    const { start, end } = this.getItemRange()
    const { totalItems } = this.state

    const container = createElement('div', { className: 'pagination-item-count' })

    const text = totalItems > 0
      ? `${totalItems}件中 ${start}-${end}件を表示`
      : '0件'

    const span = createElement('span', {
      className: 'item-count-text',
      textContent: text,
      attributes: {
        'aria-live': 'polite',
        'aria-atomic': 'true',
      },
    })

    container.appendChild(span)

    return container
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Paginationを作成するファクトリ関数
 */
export function createPagination(
  container: HTMLElement,
  config: PaginationConfig,
  callbacks: PaginationCallbacks = {}
): Pagination {
  const pagination = new Pagination(container, config, callbacks)
  pagination.render()
  return pagination
}

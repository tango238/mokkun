/**
 * Calendar Component
 * カレンダーを表示し日付を選択するためのコンポーネント
 *
 * Features:
 * - 月表示カレンダー
 * - 日付選択
 * - 選択可能な日付範囲の制限 (from/to)
 * - 月移動ナビゲーション
 * - 今日の日付ハイライト
 * - キーボードナビゲーション
 */

import { createElement } from '../utils/dom'

// =============================================================================
// Types
// =============================================================================

/**
 * カレンダーの状態
 */
export interface CalendarState {
  /** 現在選択されている日付 */
  value: Date | null
  /** 表示中の年月 */
  displayedMonth: Date
  /** フォーカスされている日付 */
  focusedDate: Date | null
  /** 無効化状態 */
  disabled: boolean
}

/**
 * カレンダーのコールバック
 */
export interface CalendarCallbacks {
  /** 日付選択時 */
  onSelectDate: (event: MouseEvent, date: Date, state: CalendarState) => void
  /** 月変更時 */
  onMonthChange?: (date: Date, state: CalendarState) => void
}

/**
 * カレンダーの設定
 */
export interface CalendarConfig {
  /** 初期選択日付 */
  value?: Date
  /** 選択可能な日付範囲の開始日 */
  from?: Date
  /** 選択可能な日付範囲の終了日 */
  to?: Date
  /** 無効化 */
  disabled?: boolean
  /** 週の開始曜日 (0: 日曜, 1: 月曜) */
  weekStartsOn?: 0 | 1
  /** ロケール */
  locale?: string
  /** aria-label */
  ariaLabel?: string
}

// =============================================================================
// Calendar Class
// =============================================================================

/**
 * カレンダーコンポーネント
 */
export class Calendar {
  private config: CalendarConfig
  private state: CalendarState
  private callbacks: CalendarCallbacks
  private container: HTMLElement
  private calendarElement: HTMLElement | null = null

  constructor(
    container: HTMLElement,
    config: CalendarConfig = {},
    callbacks: CalendarCallbacks
  ) {
    this.config = config
    this.container = container
    this.callbacks = callbacks
    this.state = this.createInitialState()
  }

  // ===========================================================================
  // Public Methods
  // ===========================================================================

  /**
   * カレンダーをレンダリング
   */
  render(): void {
    this.container.innerHTML = ''
    this.container.className = 'mokkun-calendar'

    if (this.state.disabled) {
      this.container.setAttribute('data-disabled', '')
    } else {
      this.container.removeAttribute('data-disabled')
    }

    const calendar = createElement('div', {
      className: 'calendar-container',
      attributes: {
        role: 'application',
        'aria-label': this.config.ariaLabel ?? 'カレンダー',
      },
    })

    // ヘッダー（月ナビゲーション）
    const header = this.renderHeader()
    calendar.appendChild(header)

    // カレンダーグリッド
    const grid = this.renderGrid()
    calendar.appendChild(grid)

    this.container.appendChild(calendar)
    this.calendarElement = calendar

    // キーボードイベント
    this.setupKeyboardNavigation()
  }

  /**
   * 選択日付を設定
   */
  setValue(value: Date | null): void {
    this.state = {
      ...this.state,
      value: value ? this.normalizeDate(value) : null,
    }
    if (value) {
      this.state.displayedMonth = this.getFirstDayOfMonth(value)
    }
    this.render()
  }

  /**
   * 選択日付を取得
   */
  getValue(): Date | null {
    return this.state.value
  }

  /**
   * 表示月を設定
   */
  setDisplayedMonth(date: Date): void {
    this.state = {
      ...this.state,
      displayedMonth: this.getFirstDayOfMonth(date),
    }
    this.render()
    this.callbacks.onMonthChange?.(this.state.displayedMonth, this.state)
  }

  /**
   * 無効化状態を設定
   */
  setDisabled(disabled: boolean): void {
    if (this.state.disabled === disabled) {
      return
    }
    this.state = {
      ...this.state,
      disabled,
    }
    this.render()
  }

  /**
   * 選択可能範囲を設定
   */
  setRange(from?: Date, to?: Date): void {
    this.config = {
      ...this.config,
      from: from ? this.normalizeDate(from) : undefined,
      to: to ? this.normalizeDate(to) : undefined,
    }
    this.render()
  }

  /**
   * 状態を取得
   */
  getState(): CalendarState {
    return { ...this.state }
  }

  /**
   * 破棄
   */
  destroy(): void {
    this.container.innerHTML = ''
    this.calendarElement = null
  }

  // ===========================================================================
  // Private Methods
  // ===========================================================================

  /**
   * 初期状態を作成
   */
  private createInitialState(): CalendarState {
    const value = this.config.value ? this.normalizeDate(this.config.value) : null
    const displayedMonth = value
      ? this.getFirstDayOfMonth(value)
      : this.getFirstDayOfMonth(new Date())

    return {
      value,
      displayedMonth,
      focusedDate: null,
      disabled: this.config.disabled ?? false,
    }
  }

  /**
   * ヘッダーをレンダリング
   */
  private renderHeader(): HTMLElement {
    const header = createElement('div', { className: 'calendar-header' })

    // 前月ボタン
    const prevButton = createElement('button', {
      className: 'calendar-nav-button calendar-prev',
      attributes: {
        type: 'button',
        'aria-label': '前の月',
        ...(this.state.disabled && { disabled: 'disabled' }),
      },
    })
    prevButton.innerHTML = this.getChevronLeftIcon()
    prevButton.addEventListener('click', this.handlePrevMonth.bind(this))

    // 年月表示
    const monthLabel = createElement('div', {
      className: 'calendar-month-label',
      attributes: {
        'aria-live': 'polite',
      },
    })
    monthLabel.textContent = this.formatMonthYear(this.state.displayedMonth)

    // 次月ボタン
    const nextButton = createElement('button', {
      className: 'calendar-nav-button calendar-next',
      attributes: {
        type: 'button',
        'aria-label': '次の月',
        ...(this.state.disabled && { disabled: 'disabled' }),
      },
    })
    nextButton.innerHTML = this.getChevronRightIcon()
    nextButton.addEventListener('click', this.handleNextMonth.bind(this))

    header.appendChild(prevButton)
    header.appendChild(monthLabel)
    header.appendChild(nextButton)

    return header
  }

  /**
   * カレンダーグリッドをレンダリング
   */
  private renderGrid(): HTMLElement {
    const grid = createElement('div', {
      className: 'calendar-grid',
      attributes: {
        role: 'grid',
        'aria-label': this.formatMonthYear(this.state.displayedMonth),
      },
    })

    // 曜日ヘッダー
    const weekdayRow = this.renderWeekdayHeader()
    grid.appendChild(weekdayRow)

    // 日付セル
    const weeks = this.getCalendarWeeks()
    for (const week of weeks) {
      const weekRow = this.renderWeekRow(week)
      grid.appendChild(weekRow)
    }

    return grid
  }

  /**
   * 曜日ヘッダーをレンダリング
   */
  private renderWeekdayHeader(): HTMLElement {
    const row = createElement('div', {
      className: 'calendar-weekdays',
      attributes: { role: 'row' },
    })

    const weekdays = this.getWeekdayLabels()
    for (const weekday of weekdays) {
      const cell = createElement('div', {
        className: 'calendar-weekday',
        attributes: {
          role: 'columnheader',
          'aria-label': weekday.full,
        },
        textContent: weekday.short,
      })
      row.appendChild(cell)
    }

    return row
  }

  /**
   * 週の行をレンダリング
   */
  private renderWeekRow(week: (Date | null)[]): HTMLElement {
    const row = createElement('div', {
      className: 'calendar-week',
      attributes: { role: 'row' },
    })

    for (const date of week) {
      const cell = this.renderDateCell(date)
      row.appendChild(cell)
    }

    return row
  }

  /**
   * 日付セルをレンダリング
   */
  private renderDateCell(date: Date | null): HTMLElement {
    if (!date) {
      return createElement('div', {
        className: 'calendar-day calendar-day-empty',
        attributes: { role: 'gridcell' },
      })
    }

    const isToday = this.isToday(date)
    const isSelected = this.isSelected(date)
    const isDisabled = this.isDateDisabled(date)
    const isOutOfRange = !this.isDateInRange(date)
    const isCurrentMonth = date.getMonth() === this.state.displayedMonth.getMonth()

    const classNames = ['calendar-day']
    if (isToday) classNames.push('calendar-day-today')
    if (isSelected) classNames.push('calendar-day-selected')
    if (isDisabled || isOutOfRange) classNames.push('calendar-day-disabled')
    if (!isCurrentMonth) classNames.push('calendar-day-outside')

    const cell = createElement('button', {
      className: classNames.join(' '),
      attributes: {
        type: 'button',
        role: 'gridcell',
        tabindex: isSelected ? '0' : '-1',
        'aria-label': this.formatDateFull(date),
        'aria-selected': isSelected ? 'true' : 'false',
        'aria-disabled': (isDisabled || isOutOfRange) ? 'true' : 'false',
        'data-date': date.toISOString().split('T')[0],
        ...(isToday && { 'data-today': '' }),
        ...((isDisabled || isOutOfRange || this.state.disabled) && { disabled: 'disabled' }),
      },
      textContent: date.getDate().toString(),
    })

    if (!isDisabled && !isOutOfRange && !this.state.disabled) {
      cell.addEventListener('click', (e) => this.handleDateClick(e as MouseEvent, date))
    }

    return cell
  }

  /**
   * キーボードナビゲーションを設定
   */
  private setupKeyboardNavigation(): void {
    if (!this.calendarElement) return

    this.calendarElement.addEventListener('keydown', (e) => {
      if (this.state.disabled) return

      const key = e.key
      let newDate: Date | null = null
      const baseDate = this.state.focusedDate || this.state.value || new Date()

      switch (key) {
        case 'ArrowLeft':
          e.preventDefault()
          newDate = this.addDays(baseDate, -1)
          break
        case 'ArrowRight':
          e.preventDefault()
          newDate = this.addDays(baseDate, 1)
          break
        case 'ArrowUp':
          e.preventDefault()
          newDate = this.addDays(baseDate, -7)
          break
        case 'ArrowDown':
          e.preventDefault()
          newDate = this.addDays(baseDate, 7)
          break
        case 'Enter':
        case ' ':
          e.preventDefault()
          if (this.state.focusedDate && this.isDateInRange(this.state.focusedDate)) {
            const button = this.calendarElement?.querySelector(
              `[data-date="${this.state.focusedDate.toISOString().split('T')[0]}"]`
            ) as HTMLButtonElement
            if (button) {
              button.click()
            }
          }
          break
      }

      if (newDate) {
        this.focusDate(newDate)
      }
    })
  }

  /**
   * 日付にフォーカス
   */
  private focusDate(date: Date): void {
    // 月が変わる場合は表示月も変更
    if (date.getMonth() !== this.state.displayedMonth.getMonth() ||
        date.getFullYear() !== this.state.displayedMonth.getFullYear()) {
      this.state.displayedMonth = this.getFirstDayOfMonth(date)
      this.state.focusedDate = date
      this.render()
    } else {
      this.state.focusedDate = date
    }

    // ボタンにフォーカス
    const button = this.container.querySelector(
      `[data-date="${date.toISOString().split('T')[0]}"]`
    ) as HTMLButtonElement
    if (button) {
      button.focus()
      button.setAttribute('tabindex', '0')
      // 他のボタンのtabindexを-1に
      this.container.querySelectorAll('.calendar-day:not([data-date="' + date.toISOString().split('T')[0] + '"])').forEach((el) => {
        el.setAttribute('tabindex', '-1')
      })
    }
  }

  // ===========================================================================
  // Event Handlers
  // ===========================================================================

  /**
   * 前月クリック
   */
  private handlePrevMonth(): void {
    if (this.state.disabled) return

    const newMonth = new Date(this.state.displayedMonth)
    newMonth.setMonth(newMonth.getMonth() - 1)
    this.state.displayedMonth = newMonth
    this.render()
    this.callbacks.onMonthChange?.(newMonth, this.state)
  }

  /**
   * 次月クリック
   */
  private handleNextMonth(): void {
    if (this.state.disabled) return

    const newMonth = new Date(this.state.displayedMonth)
    newMonth.setMonth(newMonth.getMonth() + 1)
    this.state.displayedMonth = newMonth
    this.render()
    this.callbacks.onMonthChange?.(newMonth, this.state)
  }

  /**
   * 日付クリック
   */
  private handleDateClick(event: MouseEvent, date: Date): void {
    if (this.state.disabled) return
    if (!this.isDateInRange(date)) return

    this.state = {
      ...this.state,
      value: date,
      focusedDate: date,
    }
    this.render()
    this.callbacks.onSelectDate(event, date, this.state)
  }

  // ===========================================================================
  // Utility Methods
  // ===========================================================================

  /**
   * 日付を正規化（時刻を0時0分0秒に）
   */
  private normalizeDate(date: Date): Date {
    const normalized = new Date(date)
    normalized.setHours(0, 0, 0, 0)
    return normalized
  }

  /**
   * 月の最初の日を取得
   */
  private getFirstDayOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1)
  }

  /**
   * カレンダーの週を取得
   */
  private getCalendarWeeks(): (Date | null)[][] {
    const weeks: (Date | null)[][] = []
    const firstDay = this.getFirstDayOfMonth(this.state.displayedMonth)
    const lastDay = new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0)
    const weekStartsOn = this.config.weekStartsOn ?? 0

    // 月の最初の週の開始日を計算
    let startDate = new Date(firstDay)
    const dayOfWeek = startDate.getDay()
    const diff = (dayOfWeek - weekStartsOn + 7) % 7
    startDate.setDate(startDate.getDate() - diff)

    // 6週分のカレンダーを生成
    for (let week = 0; week < 6; week++) {
      const weekDays: (Date | null)[] = []
      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(startDate)
        currentDate.setDate(startDate.getDate() + (week * 7) + day)

        // 表示月外の日付も含める
        weekDays.push(currentDate)
      }
      weeks.push(weekDays)

      // 次の週が完全に次月の場合は終了
      const lastDayOfWeek = new Date(startDate)
      lastDayOfWeek.setDate(startDate.getDate() + (week * 7) + 6)
      if (lastDayOfWeek > lastDay && week >= 3) {
        const firstDayOfNextWeek = new Date(startDate)
        firstDayOfNextWeek.setDate(startDate.getDate() + ((week + 1) * 7))
        if (firstDayOfNextWeek.getMonth() !== firstDay.getMonth()) {
          break
        }
      }
    }

    return weeks
  }

  /**
   * 曜日ラベルを取得
   */
  private getWeekdayLabels(): { short: string; full: string }[] {
    const locale = this.config.locale ?? 'ja-JP'
    const weekStartsOn = this.config.weekStartsOn ?? 0
    const labels: { short: string; full: string }[] = []

    for (let i = 0; i < 7; i++) {
      const dayIndex = (i + weekStartsOn) % 7
      // 2024年1月7日は日曜日
      const date = new Date(2024, 0, 7 + dayIndex)
      labels.push({
        short: date.toLocaleDateString(locale, { weekday: 'short' }),
        full: date.toLocaleDateString(locale, { weekday: 'long' }),
      })
    }

    return labels
  }

  /**
   * 年月をフォーマット
   */
  private formatMonthYear(date: Date): string {
    const locale = this.config.locale ?? 'ja-JP'
    return date.toLocaleDateString(locale, { year: 'numeric', month: 'long' })
  }

  /**
   * 日付をフルフォーマット
   */
  private formatDateFull(date: Date): string {
    const locale = this.config.locale ?? 'ja-JP'
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    })
  }

  /**
   * 今日かどうか
   */
  private isToday(date: Date): boolean {
    const today = this.normalizeDate(new Date())
    return date.getTime() === today.getTime()
  }

  /**
   * 選択されているかどうか
   */
  private isSelected(date: Date): boolean {
    if (!this.state.value) return false
    return date.getTime() === this.state.value.getTime()
  }

  /**
   * 日付が無効化されているかどうか
   */
  private isDateDisabled(_date: Date): boolean {
    return this.state.disabled
  }

  /**
   * 日付が範囲内かどうか
   */
  private isDateInRange(date: Date): boolean {
    const normalizedDate = this.normalizeDate(date)

    if (this.config.from) {
      const from = this.normalizeDate(this.config.from)
      if (normalizedDate < from) return false
    }

    if (this.config.to) {
      const to = this.normalizeDate(this.config.to)
      if (normalizedDate > to) return false
    }

    return true
  }

  /**
   * 日数を加算
   */
  private addDays(date: Date, days: number): Date {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return this.normalizeDate(result)
  }

  /**
   * 左矢印アイコン
   */
  private getChevronLeftIcon(): string {
    return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`
  }

  /**
   * 右矢印アイコン
   */
  private getChevronRightIcon(): string {
    return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 12L10 8L6 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * カレンダーコンポーネントを作成
 */
export function createCalendar(
  container: HTMLElement,
  config: CalendarConfig = {},
  callbacks: CalendarCallbacks
): Calendar {
  const calendar = new Calendar(container, config, callbacks)
  calendar.render()
  return calendar
}

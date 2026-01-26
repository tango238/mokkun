/**
 * DateRangePicker Component
 * 日付範囲を選択するためのコンポーネント
 *
 * Features:
 * - 開始日・終了日の選択
 * - プリセット (Last 7 days, Last 30 days等)
 * - カレンダーUI（デュアルカレンダー表示）
 * - キーボードナビゲーション
 */

import { createElement, generateId } from '../utils/dom'

// =============================================================================
// Types
// =============================================================================

/**
 * 日付範囲
 */
export interface DateRange {
  /** 開始日 */
  from: Date | null
  /** 終了日 */
  to: Date | null
}

/**
 * プリセット項目
 */
export interface DateRangePreset {
  /** プリセットID */
  id: string
  /** 表示ラベル */
  label: string
  /** 範囲を計算する関数 */
  getRange: () => DateRange
}

/**
 * DateRangePickerの状態
 */
export interface DateRangePickerState {
  /** 現在選択されている日付範囲 */
  value: DateRange
  /** ドロップダウンの開閉状態 */
  isOpen: boolean
  /** 左カレンダーの表示月 */
  leftDisplayedMonth: Date
  /** 右カレンダーの表示月 */
  rightDisplayedMonth: Date
  /** 範囲選択中の仮開始日 */
  selectionStart: Date | null
  /** ホバー中の日付 */
  hoveredDate: Date | null
  /** 無効化状態 */
  disabled: boolean
  /** 選択中のプリセットID */
  selectedPresetId: string | null
}

/**
 * DateRangePickerのコールバック
 */
export interface DateRangePickerCallbacks {
  /** 日付範囲変更時 */
  onChange: (range: DateRange, presetId: string | null, state: DateRangePickerState) => void
  /** ドロップダウン開閉時 */
  onOpenChange?: (isOpen: boolean, state: DateRangePickerState) => void
  /** 適用ボタンクリック時 */
  onApply?: (range: DateRange, state: DateRangePickerState) => void
  /** キャンセルボタンクリック時 */
  onCancel?: (state: DateRangePickerState) => void
}

/**
 * DateRangePickerの設定
 */
export interface DateRangePickerConfig {
  /** 初期選択日付範囲 */
  value?: DateRange
  /** 選択可能な日付範囲の開始日 */
  minDate?: Date
  /** 選択可能な日付範囲の終了日 */
  maxDate?: Date
  /** 無効化 */
  disabled?: boolean
  /** プリセット一覧 */
  presets?: DateRangePreset[]
  /** プリセットを表示するかどうか */
  showPresets?: boolean
  /** 週の開始曜日 (0: 日曜, 1: 月曜) */
  weekStartsOn?: 0 | 1
  /** ロケール */
  locale?: string
  /** トリガーのプレースホルダー */
  placeholder?: string
  /** 日付フォーマット関数 */
  formatDate?: (date: Date) => string
  /** 適用ボタンを表示するか */
  showApplyButton?: boolean
  /** キャンセルボタンを表示するか */
  showCancelButton?: boolean
}

// =============================================================================
// Default Presets
// =============================================================================

/**
 * デフォルトのプリセット
 */
export function getDefaultPresets(): DateRangePreset[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return [
    {
      id: 'today',
      label: '今日',
      getRange: () => {
        const now = new Date()
        now.setHours(0, 0, 0, 0)
        return { from: now, to: now }
      },
    },
    {
      id: 'yesterday',
      label: '昨日',
      getRange: () => {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        yesterday.setHours(0, 0, 0, 0)
        return { from: yesterday, to: yesterday }
      },
    },
    {
      id: 'last7days',
      label: '過去7日間',
      getRange: () => {
        const now = new Date()
        now.setHours(0, 0, 0, 0)
        const from = new Date(now)
        from.setDate(from.getDate() - 6)
        return { from, to: now }
      },
    },
    {
      id: 'last30days',
      label: '過去30日間',
      getRange: () => {
        const now = new Date()
        now.setHours(0, 0, 0, 0)
        const from = new Date(now)
        from.setDate(from.getDate() - 29)
        return { from, to: now }
      },
    },
    {
      id: 'thisMonth',
      label: '今月',
      getRange: () => {
        const now = new Date()
        now.setHours(0, 0, 0, 0)
        const from = new Date(now.getFullYear(), now.getMonth(), 1)
        const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        return { from, to }
      },
    },
    {
      id: 'lastMonth',
      label: '先月',
      getRange: () => {
        const now = new Date()
        const from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const to = new Date(now.getFullYear(), now.getMonth(), 0)
        return { from, to }
      },
    },
  ]
}

// =============================================================================
// DateRangePicker Class
// =============================================================================

/**
 * DateRangePickerコンポーネント
 */
export class DateRangePicker {
  private config: DateRangePickerConfig
  private state: DateRangePickerState
  private callbacks: DateRangePickerCallbacks
  private container: HTMLElement
  private instanceId: string
  private triggerElement: HTMLElement | null = null
  private dropdownElement: HTMLElement | null = null
  private clickOutsideHandler: ((e: MouseEvent) => void) | null = null
  private keyboardHandler: ((e: KeyboardEvent) => void) | null = null
  private savedValue: DateRange | null = null

  constructor(
    container: HTMLElement,
    config: DateRangePickerConfig = {},
    callbacks: DateRangePickerCallbacks
  ) {
    this.config = config
    this.container = container
    this.callbacks = callbacks
    this.instanceId = generateId('date-range-picker')
    this.state = this.createInitialState()
  }

  // ===========================================================================
  // Public Methods
  // ===========================================================================

  /**
   * コンポーネントをレンダリング
   */
  render(): void {
    this.container.innerHTML = ''
    this.container.className = 'mokkun-date-range-picker'

    if (this.state.disabled) {
      this.container.setAttribute('data-disabled', '')
    } else {
      this.container.removeAttribute('data-disabled')
    }

    if (this.state.isOpen) {
      this.container.setAttribute('data-state', 'open')
    } else {
      this.container.setAttribute('data-state', 'closed')
    }

    // トリガーボタン
    this.triggerElement = this.renderTrigger()
    this.container.appendChild(this.triggerElement)

    // ドロップダウン
    if (this.state.isOpen) {
      this.dropdownElement = this.renderDropdown()
      this.container.appendChild(this.dropdownElement)
      this.attachEventListeners()
    } else {
      this.dropdownElement = null
      this.detachEventListeners()
    }
  }

  /**
   * 日付範囲を設定
   */
  setValue(value: DateRange): void {
    this.state = {
      ...this.state,
      value: {
        from: value.from ? this.normalizeDate(value.from) : null,
        to: value.to ? this.normalizeDate(value.to) : null,
      },
      selectedPresetId: null,
    }
    this.updateDisplayedMonths()
    this.render()
  }

  /**
   * 日付範囲を取得
   */
  getValue(): DateRange {
    return { ...this.state.value }
  }

  /**
   * 開閉状態を切り替え
   */
  toggle(): void {
    this.setOpen(!this.state.isOpen)
  }

  /**
   * 開く
   */
  open(): void {
    this.setOpen(true)
  }

  /**
   * 閉じる
   */
  close(): void {
    this.setOpen(false)
  }

  /**
   * 開閉状態を設定
   */
  setOpen(isOpen: boolean): void {
    if (this.state.isOpen === isOpen) {
      return
    }

    if (isOpen) {
      this.savedValue = { ...this.state.value }
    }

    this.state = {
      ...this.state,
      isOpen,
      selectionStart: null,
      hoveredDate: null,
    }

    this.render()
    this.callbacks.onOpenChange?.(isOpen, this.state)
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
   * 状態を取得
   */
  getState(): DateRangePickerState {
    return { ...this.state }
  }

  /**
   * 破棄
   */
  destroy(): void {
    this.detachEventListeners()
    this.container.innerHTML = ''
  }

  // ===========================================================================
  // Private Methods - Initialization
  // ===========================================================================

  private createInitialState(): DateRangePickerState {
    const value = this.config.value ?? { from: null, to: null }
    const normalizedValue = {
      from: value.from ? this.normalizeDate(value.from) : null,
      to: value.to ? this.normalizeDate(value.to) : null,
    }

    const today = new Date()
    const leftMonth = normalizedValue.from
      ? this.getFirstDayOfMonth(normalizedValue.from)
      : this.getFirstDayOfMonth(today)

    const rightMonth = new Date(leftMonth)
    rightMonth.setMonth(rightMonth.getMonth() + 1)

    return {
      value: normalizedValue,
      isOpen: false,
      leftDisplayedMonth: leftMonth,
      rightDisplayedMonth: rightMonth,
      selectionStart: null,
      hoveredDate: null,
      disabled: this.config.disabled ?? false,
      selectedPresetId: null,
    }
  }

  private updateDisplayedMonths(): void {
    const from = this.state.value.from
    if (from) {
      this.state.leftDisplayedMonth = this.getFirstDayOfMonth(from)
      const rightMonth = new Date(this.state.leftDisplayedMonth)
      rightMonth.setMonth(rightMonth.getMonth() + 1)
      this.state.rightDisplayedMonth = rightMonth
    }
  }

  // ===========================================================================
  // Private Methods - Rendering
  // ===========================================================================

  private renderTrigger(): HTMLElement {
    const button = createElement('button', {
      className: 'date-range-picker-trigger',
      attributes: {
        type: 'button',
        'aria-haspopup': 'dialog',
        'aria-expanded': String(this.state.isOpen),
        'aria-controls': `${this.instanceId}-dropdown`,
        id: `${this.instanceId}-trigger`,
        ...(this.state.disabled && { disabled: 'disabled' }),
      },
    })

    // カレンダーアイコン
    const icon = createElement('span', { className: 'date-range-picker-icon' })
    icon.innerHTML = this.getCalendarIcon()
    button.appendChild(icon)

    // 日付表示
    const label = createElement('span', { className: 'date-range-picker-label' })
    label.textContent = this.formatRangeLabel()
    button.appendChild(label)

    // キャレット
    const caret = createElement('span', { className: 'date-range-picker-caret' })
    caret.innerHTML = this.getChevronDownIcon()
    button.appendChild(caret)

    button.addEventListener('click', () => {
      if (!this.state.disabled) {
        this.toggle()
      }
    })

    return button
  }

  private renderDropdown(): HTMLElement {
    const dropdown = createElement('div', {
      className: 'date-range-picker-dropdown',
      attributes: {
        role: 'dialog',
        'aria-modal': 'true',
        'aria-labelledby': `${this.instanceId}-trigger`,
        id: `${this.instanceId}-dropdown`,
      },
    })

    const content = createElement('div', { className: 'date-range-picker-content' })

    // プリセット（左側）
    const showPresets = this.config.showPresets !== false
    if (showPresets) {
      const presets = this.renderPresets()
      content.appendChild(presets)
    }

    // カレンダー部分（右側）
    const calendars = createElement('div', { className: 'date-range-picker-calendars' })

    // 左カレンダー
    const leftCalendar = this.renderCalendar('left', this.state.leftDisplayedMonth)
    calendars.appendChild(leftCalendar)

    // 右カレンダー
    const rightCalendar = this.renderCalendar('right', this.state.rightDisplayedMonth)
    calendars.appendChild(rightCalendar)

    content.appendChild(calendars)
    dropdown.appendChild(content)

    // フッター（適用・キャンセルボタン）
    const showApply = this.config.showApplyButton !== false
    const showCancel = this.config.showCancelButton !== false
    if (showApply || showCancel) {
      const footer = this.renderFooter()
      dropdown.appendChild(footer)
    }

    return dropdown
  }

  private renderPresets(): HTMLElement {
    const presets = this.config.presets ?? getDefaultPresets()

    const container = createElement('div', { className: 'date-range-picker-presets' })

    const list = createElement('ul', {
      className: 'date-range-picker-preset-list',
      attributes: { role: 'listbox' },
    })

    for (const preset of presets) {
      const item = createElement('li', {
        className: `date-range-picker-preset-item${this.state.selectedPresetId === preset.id ? ' is-selected' : ''}`,
        attributes: {
          role: 'option',
          'aria-selected': this.state.selectedPresetId === preset.id ? 'true' : 'false',
          'data-preset-id': preset.id,
        },
      })

      const button = createElement('button', {
        className: 'date-range-picker-preset-button',
        textContent: preset.label,
        attributes: { type: 'button' },
      })

      button.addEventListener('click', () => this.handlePresetClick(preset))

      item.appendChild(button)
      list.appendChild(item)
    }

    container.appendChild(list)
    return container
  }

  private renderCalendar(side: 'left' | 'right', displayedMonth: Date): HTMLElement {
    const calendar = createElement('div', {
      className: `date-range-picker-calendar date-range-picker-calendar-${side}`,
    })

    // ヘッダー
    const header = this.renderCalendarHeader(side, displayedMonth)
    calendar.appendChild(header)

    // グリッド
    const grid = this.renderCalendarGrid(displayedMonth)
    calendar.appendChild(grid)

    return calendar
  }

  private renderCalendarHeader(side: 'left' | 'right', displayedMonth: Date): HTMLElement {
    const header = createElement('div', { className: 'date-range-picker-calendar-header' })

    // 前月ボタン（左カレンダーのみ）
    if (side === 'left') {
      const prevButton = createElement('button', {
        className: 'date-range-picker-nav-button date-range-picker-prev',
        attributes: {
          type: 'button',
          'aria-label': '前の月',
        },
      })
      prevButton.innerHTML = this.getChevronLeftIcon()
      prevButton.addEventListener('click', () => this.handlePrevMonth())
      header.appendChild(prevButton)
    } else {
      header.appendChild(createElement('div', { className: 'date-range-picker-nav-spacer' }))
    }

    // 月表示
    const monthLabel = createElement('div', {
      className: 'date-range-picker-month-label',
      textContent: this.formatMonthYear(displayedMonth),
    })
    header.appendChild(monthLabel)

    // 次月ボタン（右カレンダーのみ）
    if (side === 'right') {
      const nextButton = createElement('button', {
        className: 'date-range-picker-nav-button date-range-picker-next',
        attributes: {
          type: 'button',
          'aria-label': '次の月',
        },
      })
      nextButton.innerHTML = this.getChevronRightIcon()
      nextButton.addEventListener('click', () => this.handleNextMonth())
      header.appendChild(nextButton)
    } else {
      header.appendChild(createElement('div', { className: 'date-range-picker-nav-spacer' }))
    }

    return header
  }

  private renderCalendarGrid(displayedMonth: Date): HTMLElement {
    const grid = createElement('div', {
      className: 'date-range-picker-grid',
      attributes: { role: 'grid' },
    })

    // 曜日ヘッダー
    const weekdayRow = this.renderWeekdayHeader()
    grid.appendChild(weekdayRow)

    // 日付セル
    const weeks = this.getCalendarWeeks(displayedMonth)
    for (const week of weeks) {
      const weekRow = this.renderWeekRow(week, displayedMonth)
      grid.appendChild(weekRow)
    }

    return grid
  }

  private renderWeekdayHeader(): HTMLElement {
    const row = createElement('div', {
      className: 'date-range-picker-weekdays',
      attributes: { role: 'row' },
    })

    const weekdays = this.getWeekdayLabels()
    for (const weekday of weekdays) {
      const cell = createElement('div', {
        className: 'date-range-picker-weekday',
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

  private renderWeekRow(week: Date[], displayedMonth: Date): HTMLElement {
    const row = createElement('div', {
      className: 'date-range-picker-week',
      attributes: { role: 'row' },
    })

    for (const date of week) {
      const cell = this.renderDateCell(date, displayedMonth)
      row.appendChild(cell)
    }

    return row
  }

  private renderDateCell(date: Date, displayedMonth: Date): HTMLElement {
    const isCurrentMonth = date.getMonth() === displayedMonth.getMonth()
    const isToday = this.isToday(date)
    const isDisabled = this.isDateDisabled(date)
    const isSelected = this.isDateSelected(date)
    const isRangeStart = this.isRangeStart(date)
    const isRangeEnd = this.isRangeEnd(date)
    const isInRange = this.isInRange(date)
    const isHovered = this.isHovered(date)
    const isInHoverRange = this.isInHoverRange(date)

    const classNames = ['date-range-picker-day']
    if (!isCurrentMonth) classNames.push('date-range-picker-day-outside')
    if (isToday) classNames.push('date-range-picker-day-today')
    if (isDisabled) classNames.push('date-range-picker-day-disabled')
    if (isSelected) classNames.push('date-range-picker-day-selected')
    if (isRangeStart) classNames.push('date-range-picker-day-range-start')
    if (isRangeEnd) classNames.push('date-range-picker-day-range-end')
    if (isInRange) classNames.push('date-range-picker-day-in-range')
    if (isHovered) classNames.push('date-range-picker-day-hovered')
    if (isInHoverRange) classNames.push('date-range-picker-day-in-hover-range')

    const cell = createElement('button', {
      className: classNames.join(' '),
      attributes: {
        type: 'button',
        role: 'gridcell',
        tabindex: '-1',
        'aria-label': this.formatDateFull(date),
        'aria-selected': isSelected ? 'true' : 'false',
        'aria-disabled': isDisabled ? 'true' : 'false',
        'data-date': this.formatDateISO(date),
        ...(isDisabled && { disabled: 'disabled' }),
      },
      textContent: date.getDate().toString(),
    })

    if (!isDisabled) {
      cell.addEventListener('click', () => this.handleDateClick(date))
      cell.addEventListener('mouseenter', () => this.handleDateHover(date))
      cell.addEventListener('mouseleave', () => this.handleDateLeave())
    }

    return cell
  }

  private renderFooter(): HTMLElement {
    const footer = createElement('div', { className: 'date-range-picker-footer' })

    // 選択中の範囲表示
    const rangeDisplay = createElement('div', {
      className: 'date-range-picker-range-display',
      textContent: this.formatRangeLabel(),
    })
    footer.appendChild(rangeDisplay)

    // ボタングループ
    const buttons = createElement('div', { className: 'date-range-picker-buttons' })

    const showCancel = this.config.showCancelButton !== false
    if (showCancel) {
      const cancelButton = createElement('button', {
        className: 'date-range-picker-button date-range-picker-cancel',
        textContent: 'キャンセル',
        attributes: { type: 'button' },
      })
      cancelButton.addEventListener('click', () => this.handleCancel())
      buttons.appendChild(cancelButton)
    }

    const showApply = this.config.showApplyButton !== false
    if (showApply) {
      const applyButton = createElement('button', {
        className: 'date-range-picker-button date-range-picker-apply',
        textContent: '適用',
        attributes: { type: 'button' },
      })
      applyButton.addEventListener('click', () => this.handleApply())
      buttons.appendChild(applyButton)
    }

    footer.appendChild(buttons)
    return footer
  }

  // ===========================================================================
  // Private Methods - Event Handlers
  // ===========================================================================

  private handlePresetClick(preset: DateRangePreset): void {
    const range = preset.getRange()
    this.state = {
      ...this.state,
      value: range,
      selectedPresetId: preset.id,
      selectionStart: null,
    }
    this.updateDisplayedMonths()
    this.render()
    this.callbacks.onChange(range, preset.id, this.state)
  }

  private handleDateClick(date: Date): void {
    if (this.state.selectionStart === null) {
      // 範囲選択開始
      this.state = {
        ...this.state,
        selectionStart: date,
        value: { from: date, to: null },
        selectedPresetId: null,
      }
      this.render()
    } else {
      // 範囲選択完了
      const start = this.state.selectionStart
      let from: Date
      let to: Date

      if (date < start) {
        from = date
        to = start
      } else {
        from = start
        to = date
      }

      const range = { from, to }
      this.state = {
        ...this.state,
        value: range,
        selectionStart: null,
        hoveredDate: null,
        selectedPresetId: null,
      }
      this.render()
      this.callbacks.onChange(range, null, this.state)
    }
  }

  private handleDateHover(date: Date): void {
    if (this.state.selectionStart !== null) {
      this.state = {
        ...this.state,
        hoveredDate: date,
      }
      this.updateHoverStyles()
    }
  }

  private handleDateLeave(): void {
    if (this.state.hoveredDate !== null) {
      this.state = {
        ...this.state,
        hoveredDate: null,
      }
      this.updateHoverStyles()
    }
  }

  private updateHoverStyles(): void {
    if (!this.dropdownElement) return

    const dayCells = this.dropdownElement.querySelectorAll('.date-range-picker-day')
    dayCells.forEach((cell) => {
      const dateStr = cell.getAttribute('data-date')
      if (!dateStr) return

      const date = new Date(dateStr + 'T00:00:00')
      const isHovered = this.isHovered(date)
      const isInHoverRange = this.isInHoverRange(date)

      cell.classList.toggle('date-range-picker-day-hovered', isHovered)
      cell.classList.toggle('date-range-picker-day-in-hover-range', isInHoverRange)
    })
  }

  private handlePrevMonth(): void {
    const newLeftMonth = new Date(this.state.leftDisplayedMonth)
    newLeftMonth.setMonth(newLeftMonth.getMonth() - 1)

    const newRightMonth = new Date(this.state.rightDisplayedMonth)
    newRightMonth.setMonth(newRightMonth.getMonth() - 1)

    this.state = {
      ...this.state,
      leftDisplayedMonth: newLeftMonth,
      rightDisplayedMonth: newRightMonth,
    }
    this.render()
  }

  private handleNextMonth(): void {
    const newLeftMonth = new Date(this.state.leftDisplayedMonth)
    newLeftMonth.setMonth(newLeftMonth.getMonth() + 1)

    const newRightMonth = new Date(this.state.rightDisplayedMonth)
    newRightMonth.setMonth(newRightMonth.getMonth() + 1)

    this.state = {
      ...this.state,
      leftDisplayedMonth: newLeftMonth,
      rightDisplayedMonth: newRightMonth,
    }
    this.render()
  }

  private handleApply(): void {
    this.callbacks.onApply?.(this.state.value, this.state)
    this.close()
  }

  private handleCancel(): void {
    if (this.savedValue) {
      this.state = {
        ...this.state,
        value: this.savedValue,
      }
    }
    this.callbacks.onCancel?.(this.state)
    this.close()
  }

  private handleClickOutside(event: MouseEvent): void {
    const target = event.target as Node
    // ターゲットがDOMから削除されている場合（再レンダリングで削除された場合）は無視
    if (!document.body.contains(target)) {
      return
    }
    if (!this.container.contains(target)) {
      this.close()
    }
  }

  private handleKeyboard(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.state.isOpen) {
      event.preventDefault()
      this.handleCancel()
    }
  }

  // ===========================================================================
  // Private Methods - Event Listeners
  // ===========================================================================

  private attachEventListeners(): void {
    this.clickOutsideHandler = this.handleClickOutside.bind(this)
    this.keyboardHandler = this.handleKeyboard.bind(this)

    setTimeout(() => {
      document.addEventListener('click', this.clickOutsideHandler!)
      document.addEventListener('keydown', this.keyboardHandler!)
    }, 0)
  }

  private detachEventListeners(): void {
    if (this.clickOutsideHandler) {
      document.removeEventListener('click', this.clickOutsideHandler)
      this.clickOutsideHandler = null
    }
    if (this.keyboardHandler) {
      document.removeEventListener('keydown', this.keyboardHandler)
      this.keyboardHandler = null
    }
  }

  // ===========================================================================
  // Private Methods - Date Utilities
  // ===========================================================================

  private normalizeDate(date: Date): Date {
    const normalized = new Date(date)
    normalized.setHours(0, 0, 0, 0)
    return normalized
  }

  private getFirstDayOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1)
  }

  private getCalendarWeeks(displayedMonth: Date): Date[][] {
    const weeks: Date[][] = []
    const firstDay = this.getFirstDayOfMonth(displayedMonth)
    const lastDay = new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0)
    const weekStartsOn = this.config.weekStartsOn ?? 0

    let startDate = new Date(firstDay)
    const dayOfWeek = startDate.getDay()
    const diff = (dayOfWeek - weekStartsOn + 7) % 7
    startDate.setDate(startDate.getDate() - diff)

    for (let week = 0; week < 6; week++) {
      const weekDays: Date[] = []
      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(startDate)
        currentDate.setDate(startDate.getDate() + week * 7 + day)
        weekDays.push(currentDate)
      }
      weeks.push(weekDays)

      const lastDayOfWeek = new Date(startDate)
      lastDayOfWeek.setDate(startDate.getDate() + week * 7 + 6)
      if (lastDayOfWeek > lastDay && week >= 3) {
        const firstDayOfNextWeek = new Date(startDate)
        firstDayOfNextWeek.setDate(startDate.getDate() + (week + 1) * 7)
        if (firstDayOfNextWeek.getMonth() !== firstDay.getMonth()) {
          break
        }
      }
    }

    return weeks
  }

  private getWeekdayLabels(): { short: string; full: string }[] {
    const locale = this.config.locale ?? 'ja-JP'
    const weekStartsOn = this.config.weekStartsOn ?? 0
    const labels: { short: string; full: string }[] = []

    for (let i = 0; i < 7; i++) {
      const dayIndex = (i + weekStartsOn) % 7
      const date = new Date(2024, 0, 7 + dayIndex)
      labels.push({
        short: date.toLocaleDateString(locale, { weekday: 'short' }),
        full: date.toLocaleDateString(locale, { weekday: 'long' }),
      })
    }

    return labels
  }

  private formatMonthYear(date: Date): string {
    const locale = this.config.locale ?? 'ja-JP'
    return date.toLocaleDateString(locale, { year: 'numeric', month: 'long' })
  }

  private formatDateFull(date: Date): string {
    const locale = this.config.locale ?? 'ja-JP'
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    })
  }

  private formatDateISO(date: Date): string {
    return date.toISOString().split('T')[0]
  }

  private formatDate(date: Date): string {
    if (this.config.formatDate) {
      return this.config.formatDate(date)
    }
    const locale = this.config.locale ?? 'ja-JP'
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  private formatRangeLabel(): string {
    const { from, to } = this.state.value

    if (!from && !to) {
      return this.config.placeholder ?? '日付範囲を選択'
    }

    if (from && !to) {
      return `${this.formatDate(from)} - `
    }

    if (from && to) {
      if (this.formatDateISO(from) === this.formatDateISO(to)) {
        return this.formatDate(from)
      }
      return `${this.formatDate(from)} - ${this.formatDate(to)}`
    }

    return this.config.placeholder ?? '日付範囲を選択'
  }

  // ===========================================================================
  // Private Methods - Date Checks
  // ===========================================================================

  private isToday(date: Date): boolean {
    const today = this.normalizeDate(new Date())
    return this.formatDateISO(date) === this.formatDateISO(today)
  }

  private isDateDisabled(date: Date): boolean {
    if (this.state.disabled) return true

    const normalized = this.normalizeDate(date)

    if (this.config.minDate) {
      const minDate = this.normalizeDate(this.config.minDate)
      if (normalized < minDate) return true
    }

    if (this.config.maxDate) {
      const maxDate = this.normalizeDate(this.config.maxDate)
      if (normalized > maxDate) return true
    }

    return false
  }

  private isDateSelected(date: Date): boolean {
    const iso = this.formatDateISO(date)
    const { from, to } = this.state.value

    if (from && this.formatDateISO(from) === iso) return true
    if (to && this.formatDateISO(to) === iso) return true

    return false
  }

  private isRangeStart(date: Date): boolean {
    const { from } = this.state.value
    return from !== null && this.formatDateISO(from) === this.formatDateISO(date)
  }

  private isRangeEnd(date: Date): boolean {
    const { to } = this.state.value
    return to !== null && this.formatDateISO(to) === this.formatDateISO(date)
  }

  private isInRange(date: Date): boolean {
    const { from, to } = this.state.value
    if (!from || !to) return false

    const normalized = this.normalizeDate(date)
    return normalized > from && normalized < to
  }

  private isHovered(date: Date): boolean {
    return (
      this.state.hoveredDate !== null &&
      this.formatDateISO(this.state.hoveredDate) === this.formatDateISO(date)
    )
  }

  private isInHoverRange(date: Date): boolean {
    if (!this.state.selectionStart || !this.state.hoveredDate) return false

    const start = this.state.selectionStart
    const end = this.state.hoveredDate
    const normalized = this.normalizeDate(date)

    const rangeStart = start < end ? start : end
    const rangeEnd = start < end ? end : start

    return normalized > rangeStart && normalized < rangeEnd
  }

  // ===========================================================================
  // Private Methods - Icons
  // ===========================================================================

  private getCalendarIcon(): string {
    return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.667 2.667H3.333C2.597 2.667 2 3.264 2 4v9.333c0 .737.597 1.334 1.333 1.334h9.334c.736 0 1.333-.597 1.333-1.334V4c0-.736-.597-1.333-1.333-1.333z" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M10.667 1.333v2.667M5.333 1.333v2.667M2 6.667h12" stroke="currentColor" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`
  }

  private getChevronLeftIcon(): string {
    return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`
  }

  private getChevronRightIcon(): string {
    return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 12L10 8L6 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`
  }

  private getChevronDownIcon(): string {
    return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * DateRangePickerコンポーネントを作成
 */
export function createDateRangePicker(
  container: HTMLElement,
  config: DateRangePickerConfig = {},
  callbacks: DateRangePickerCallbacks
): DateRangePicker {
  const picker = new DateRangePicker(container, config, callbacks)
  picker.render()
  return picker
}

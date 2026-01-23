/**
 * Stepper Component
 * 
 *
 * 連続する操作をステップごとにグルーピングするコンポーネント
 * ステップの進行状況に応じて現在地や完了のステータスを表現
 */

import { createElement, clearElement } from '../utils/dom'

// =============================================================================
// Types
// =============================================================================

/**
 * ステップのステータス
 * - completed: 完了（チェックアイコン）
 * - closed: 中断（×アイコン）
 */
export type StepperStatus = 'completed' | 'closed'

/**
 * 拡張ステータス（カスタムテキスト付き）
 */
export interface StepperStatusWithText {
  type: StepperStatus
  text: string
}

/**
 * 基本ステップ定義
 */
export interface Step {
  /** ステップのラベル */
  label: string
  /** ステータス（オプション） */
  status?: StepperStatus | StepperStatusWithText
}

/**
 * 水平ステップ（HorizontalStepper用）
 */
export type HorizontalStep = Step

/**
 * 垂直ステップ（VerticalStepper用）- 子要素を持てる
 */
export interface VerticalStep extends Step {
  /** 子要素のHTML */
  children?: string
}

/**
 * Stepperの設定
 */
export interface StepperConfig {
  /** レイアウトタイプ */
  type: 'horizontal' | 'vertical'
  /** ステップ配列 */
  steps: HorizontalStep[] | VerticalStep[]
  /** 現在のステップインデックス（0始まり） */
  activeIndex?: number
}

/**
 * Stepperの状態
 */
export interface StepperState {
  /** 現在のステップインデックス */
  activeIndex: number
  /** レイアウトタイプ */
  type: 'horizontal' | 'vertical'
}

/**
 * Stepperのコールバック
 */
export interface StepperCallbacks {
  /** ステップクリック時（過去のステップのみ） */
  onStepClick?: (index: number) => void
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * ステータスタイプを取得
 */
function getStatusType(status: StepperStatus | StepperStatusWithText | undefined): StepperStatus | undefined {
  if (!status) return undefined
  if (typeof status === 'string') return status
  return status.type
}

/**
 * ステータスのaltテキストを取得
 */
function getStatusAltText(status: StepperStatus | StepperStatusWithText | undefined): string {
  if (!status) return ''
  if (typeof status === 'string') {
    return status === 'completed' ? '完了' : '中断'
  }
  return status.text || (status.type === 'completed' ? '完了' : '中断')
}

/**
 * チェックアイコンSVGを作成
 */
function createCheckIcon(): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 512 512')
  svg.setAttribute('width', '1em')
  svg.setAttribute('height', '1em')
  svg.setAttribute('fill', 'currentColor')
  svg.setAttribute('aria-hidden', 'true')
  svg.classList.add('stepper-icon', 'stepper-icon-check')

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('d', 'M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z')
  svg.appendChild(path)

  return svg
}

/**
 * ×アイコンSVGを作成
 */
function createCloseIcon(): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 512 512')
  svg.setAttribute('width', '1em')
  svg.setAttribute('height', '1em')
  svg.setAttribute('fill', 'currentColor')
  svg.setAttribute('aria-hidden', 'true')
  svg.classList.add('stepper-icon', 'stepper-icon-close')

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('d', 'M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM175 175c9.4-9.4 24.6-9.4 33.9 0l47 47 47-47c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-47 47 47 47c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-47-47-47 47c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l47-47-47-47c-9.4-9.4-9.4-24.6 0-33.9z')
  svg.appendChild(path)

  return svg
}

// =============================================================================
// Stepper Component
// =============================================================================

/**
 * Stepperコンポーネント
 * 
 */
export class Stepper {
  private config: StepperConfig
  private container: HTMLElement
  private state: StepperState

  constructor(
    config: StepperConfig,
    container: HTMLElement,
    _callbacks: StepperCallbacks = {}
  ) {
    this.config = config
    this.container = container
    // callbacks will be used for future event handling
    void _callbacks
    this.state = this.createInitialState()
  }

  /**
   * 初期状態を作成
   */
  private createInitialState(): StepperState {
    return {
      activeIndex: this.config.activeIndex ?? 0,
      type: this.config.type,
    }
  }

  /**
   * 状態を取得
   */
  getState(): StepperState {
    return { ...this.state }
  }

  /**
   * 現在のステップを設定
   */
  setActiveIndex(index: number): void {
    if (index >= 0 && index < this.config.steps.length) {
      this.state = {
        ...this.state,
        activeIndex: index,
      }
      this.render()
    }
  }

  /**
   * レンダリング
   */
  render(): void {
    clearElement(this.container)
    this.container.className = `mokkun-stepper stepper-${this.state.type}`

    if (this.state.type === 'horizontal') {
      this.renderHorizontal()
    } else {
      this.renderVertical()
    }
  }

  /**
   * 水平レイアウトをレンダリング
   */
  private renderHorizontal(): void {
    const ol = createElement('ol', {
      className: 'stepper-list stepper-list-horizontal',
    })
    ol.setAttribute('role', 'list')

    const steps = this.config.steps as HorizontalStep[]
    steps.forEach((step, index) => {
      const li = this.renderHorizontalStep(step, index)
      ol.appendChild(li)
    })

    this.container.appendChild(ol)
  }

  /**
   * 水平ステップアイテムをレンダリング
   */
  private renderHorizontalStep(step: HorizontalStep, index: number): HTMLElement {
    const isCurrent = index === this.state.activeIndex
    const isPast = index < this.state.activeIndex
    const statusType = getStatusType(step.status)
    const isCompleted = statusType === 'completed' || (isPast && !statusType)
    const isClosed = statusType === 'closed'
    const isPrevCompleted = index > 0 && (
      getStatusType(this.config.steps[index - 1].status) === 'completed' ||
      (index - 1 < this.state.activeIndex)
    )

    const li = createElement('li', {
      className: [
        'stepper-item',
        'stepper-item-horizontal',
        isCurrent ? 'is-current' : '',
        isCompleted ? 'is-completed' : '',
        isClosed ? 'is-closed' : '',
      ].filter(Boolean).join(' '),
    })

    if (isCurrent) {
      li.setAttribute('aria-current', 'step')
    }

    // ラベルラッパー
    const labelWrapper = createElement('div', { className: 'stepper-label-wrapper' })

    // カウンターラッパー（線 + カウンター + 線）
    const counterWrapper = createElement('div', { className: 'stepper-counter-wrapper' })

    // 前の線
    const beforeLine = createElement('span', {
      className: [
        'stepper-line',
        'stepper-line-before',
        isPrevCompleted ? 'is-completed' : '',
        index === 0 ? 'is-hidden' : '',
      ].filter(Boolean).join(' '),
    })
    counterWrapper.appendChild(beforeLine)

    // ステップカウンター
    const counter = this.renderStepCounter(index, isCurrent, step.status)
    counterWrapper.appendChild(counter)

    // 後の線
    const afterLine = createElement('span', {
      className: [
        'stepper-line',
        'stepper-line-after',
        isCompleted ? 'is-completed' : '',
        index === this.config.steps.length - 1 ? 'is-hidden' : '',
      ].filter(Boolean).join(' '),
    })
    counterWrapper.appendChild(afterLine)

    labelWrapper.appendChild(counterWrapper)

    // ラベル
    const label = createElement('span', {
      className: [
        'stepper-label',
        isCurrent ? 'is-current' : '',
        isClosed ? 'is-closed' : '',
      ].filter(Boolean).join(' '),
      textContent: step.label,
    })
    labelWrapper.appendChild(label)

    li.appendChild(labelWrapper)

    return li
  }

  /**
   * 垂直レイアウトをレンダリング
   */
  private renderVertical(): void {
    const ol = createElement('ol', {
      className: 'stepper-list stepper-list-vertical',
    })
    ol.setAttribute('role', 'list')

    const steps = this.config.steps as VerticalStep[]
    steps.forEach((step, index) => {
      const li = this.renderVerticalStep(step, index)
      ol.appendChild(li)
    })

    this.container.appendChild(ol)
  }

  /**
   * 垂直ステップアイテムをレンダリング
   */
  private renderVerticalStep(step: VerticalStep, index: number): HTMLElement {
    const isCurrent = index === this.state.activeIndex
    const isPast = index < this.state.activeIndex
    const statusType = getStatusType(step.status)
    const isCompleted = statusType === 'completed' || (isPast && !statusType)
    const isClosed = statusType === 'closed'
    const isLast = index === this.config.steps.length - 1

    const li = createElement('li', {
      className: [
        'stepper-item',
        'stepper-item-vertical',
        isCurrent ? 'is-current' : '',
        isCompleted ? 'is-completed' : '',
        isClosed ? 'is-closed' : '',
        isLast ? 'is-last' : '',
      ].filter(Boolean).join(' '),
    })

    if (isCurrent) {
      li.setAttribute('aria-current', 'step')
    }

    // セクション
    const section = createElement('div', { className: 'stepper-section' })

    // カウンター（縦線はCSSのafter疑似要素で実装）
    const counterArea = createElement('div', { className: 'stepper-counter-area' })
    const counter = this.renderStepCounter(index, isCurrent, step.status)
    counterArea.appendChild(counter)
    section.appendChild(counterArea)

    // ボディ
    const body = createElement('div', { className: 'stepper-body' })

    // ヘッダー（ラベル）
    const heading = createElement('div', {
      className: [
        'stepper-heading',
        isCurrent ? 'is-current' : '',
        (isCompleted || isClosed) && !isCurrent ? 'is-inactive' : '',
      ].filter(Boolean).join(' '),
      textContent: step.label,
    })
    body.appendChild(heading)

    // 子要素
    if (step.children) {
      const inner = createElement('div', { className: 'stepper-inner' })
      inner.innerHTML = step.children
      body.appendChild(inner)
    }

    section.appendChild(body)
    li.appendChild(section)

    return li
  }

  /**
   * ステップカウンターをレンダリング
   */
  private renderStepCounter(
    index: number,
    isCurrent: boolean,
    status?: StepperStatus | StepperStatusWithText
  ): HTMLElement {
    const statusType = getStatusType(status)
    const hasStatus = statusType === 'completed' || statusType === 'closed'

    const counter = createElement('span', {
      className: [
        'stepper-counter',
        isCurrent ? 'is-current' : '',
        statusType === 'completed' ? 'is-completed' : '',
        statusType === 'closed' ? 'is-closed' : '',
      ].filter(Boolean).join(' '),
    })

    // 番号
    const number = createElement('span', {
      className: 'stepper-number',
      textContent: String(index + 1),
    })
    number.setAttribute('aria-hidden', 'true')
    counter.appendChild(number)

    // ステータスアイコン
    if (hasStatus) {
      const iconWrapper = createElement('span', {
        className: 'stepper-status-icon',
      })
      iconWrapper.setAttribute('role', 'img')
      iconWrapper.setAttribute('aria-label', getStatusAltText(status))

      if (statusType === 'completed') {
        iconWrapper.appendChild(createCheckIcon())
      } else if (statusType === 'closed') {
        iconWrapper.appendChild(createCloseIcon())
      }

      counter.appendChild(iconWrapper)
    }

    return counter
  }

  /**
   * クリーンアップ
   */
  destroy(): void {
    clearElement(this.container)
  }
}

/**
 * Stepperを作成するファクトリ関数
 */
export function createStepper(
  config: StepperConfig,
  container: HTMLElement,
  callbacks: StepperCallbacks = {}
): Stepper {
  const stepper = new Stepper(config, container, callbacks)
  stepper.render()
  return stepper
}

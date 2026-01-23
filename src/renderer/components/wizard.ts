/**
 * Wizard Component
 * ウィザード/ステップインジケーター
 * 
 */

import type {
  WizardConfig,
  WizardStep,
  InputField,
  StepperLayoutType,
  StepStatus,
  StepStatusWithText,
} from '../../types'
import { createElement, clearElement } from '../utils/dom'

// =============================================================================
// Types
// =============================================================================

/**
 * ウィザードの状態
 */
export interface WizardState {
  /** 現在のステップインデックス */
  currentStep: number
  /** 総ステップ数 */
  totalSteps: number
  /** 各ステップのデータ */
  stepData: Record<string, Record<string, unknown>>
  /** スキップされたステップ */
  skippedSteps: Set<number>
  /** 完了したステップ */
  completedSteps: Set<number>
  /** 各ステップのステータス */
  stepStatuses: Map<number, StepStatus | StepStatusWithText>
  /** レイアウトタイプ */
  layout: StepperLayoutType
}

/**
 * ウィザードのコールバック
 */
export interface WizardCallbacks {
  /** ステップ変更時 */
  onStepChange?: (step: number, state: WizardState) => void
  /** 完了時 */
  onComplete?: (data: Record<string, Record<string, unknown>>) => void
  /** フィールドレンダラー */
  renderFields?: (fields: InputField[], container: HTMLElement) => void
  /** バリデーション */
  validateStep?: (stepIndex: number, stepId: string) => boolean
  /** ステップクリック時 */
  onStepClick?: (stepIndex: number, state: WizardState) => void
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * ステップステータスからステータス文字列を取得
 */
function getStatusType(status: StepStatus | StepStatusWithText | undefined): StepStatus {
  if (!status) return 'pending'
  if (typeof status === 'string') return status
  return status.type
}

/**
 * ステップステータスからテキストを取得
 */
function getStatusText(status: StepStatus | StepStatusWithText | undefined): string | undefined {
  if (!status) return undefined
  if (typeof status === 'string') return undefined
  return status.text
}

// =============================================================================
// Wizard Class
// =============================================================================

/**
 * ウィザードコンポーネント
 */
export class Wizard {
  private config: WizardConfig
  private state: WizardState
  private callbacks: WizardCallbacks
  private container: HTMLElement

  constructor(
    config: WizardConfig,
    container: HTMLElement,
    callbacks: WizardCallbacks = {}
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
   * ウィザードをレンダリング
   */
  render(): void {
    clearElement(this.container)
    this.container.className = `mokkun-wizard wizard-${this.state.layout}`

    const wrapper = createElement('div', { className: 'wizard-wrapper' })

    // ステップインジケーター
    if (this.config.show_progress !== false) {
      wrapper.appendChild(this.renderStepIndicator())
    }

    // コンテンツエリア
    wrapper.appendChild(this.renderStepContent())

    // ナビゲーションボタン
    wrapper.appendChild(this.renderNavigation())

    this.container.appendChild(wrapper)
  }

  /**
   * 次のステップへ進む
   */
  nextStep(): boolean {
    // バリデーション
    if (this.config.validate_on_step && this.callbacks.validateStep) {
      const currentStepConfig = this.config.steps[this.state.currentStep]
      if (!this.callbacks.validateStep(this.state.currentStep, currentStepConfig.id)) {
        return false
      }
    }

    // 完了マーク（イミュータブルに更新）
    const newCompletedSteps = new Set(this.state.completedSteps)
    newCompletedSteps.add(this.state.currentStep)

    if (this.state.currentStep < this.state.totalSteps - 1) {
      this.state = {
        ...this.state,
        currentStep: this.state.currentStep + 1,
        completedSteps: newCompletedSteps,
      }
      this.render()
      this.callbacks.onStepChange?.(this.state.currentStep, this.state)
      return true
    }

    // 最終ステップ完了
    this.state = {
      ...this.state,
      completedSteps: newCompletedSteps,
    }
    this.callbacks.onComplete?.(this.state.stepData)
    return true
  }

  /**
   * 前のステップへ戻る
   */
  previousStep(): boolean {
    if (this.config.allow_back !== false && this.state.currentStep > 0) {
      this.state = {
        ...this.state,
        currentStep: this.state.currentStep - 1,
      }
      this.render()
      this.callbacks.onStepChange?.(this.state.currentStep, this.state)
      return true
    }
    return false
  }

  /**
   * 特定のステップへジャンプ（完了済みのステップのみ）
   */
  goToStep(stepIndex: number): boolean {
    if (
      stepIndex >= 0 &&
      stepIndex < this.state.totalSteps &&
      (stepIndex <= this.state.currentStep || this.state.completedSteps.has(stepIndex))
    ) {
      this.state = {
        ...this.state,
        currentStep: stepIndex,
      }
      this.render()
      this.callbacks.onStepChange?.(this.state.currentStep, this.state)
      return true
    }
    return false
  }

  /**
   * 現在のステップをスキップ
   */
  skipStep(): boolean {
    const currentStepConfig = this.config.steps[this.state.currentStep]

    if (currentStepConfig.skippable && this.state.currentStep < this.state.totalSteps - 1) {
      const newSkippedSteps = new Set(this.state.skippedSteps)
      newSkippedSteps.add(this.state.currentStep)
      this.state = {
        ...this.state,
        currentStep: this.state.currentStep + 1,
        skippedSteps: newSkippedSteps,
      }
      this.render()
      this.callbacks.onStepChange?.(this.state.currentStep, this.state)
      return true
    }
    return false
  }

  /**
   * 現在の状態を取得
   */
  getState(): WizardState {
    return { ...this.state }
  }

  /**
   * ステップデータを更新
   */
  updateStepData(stepId: string, data: Record<string, unknown>): void {
    this.state = {
      ...this.state,
      stepData: {
        ...this.state.stepData,
        [stepId]: data,
      },
    }
  }

  /**
   * 現在のステップ設定を取得
   */
  getCurrentStepConfig(): WizardStep {
    return this.config.steps[this.state.currentStep]
  }

  // ===========================================================================
  // Private Methods - Rendering
  // ===========================================================================

  /**
   * 初期状態を作成
   */
  private createInitialState(): WizardState {
    const stepData: Record<string, Record<string, unknown>> = {}
    const stepStatuses = new Map<number, StepStatus | StepStatusWithText>()

    this.config.steps.forEach((step, index) => {
      stepData[step.id] = {}
      if (step.status) {
        stepStatuses.set(index, step.status)
      }
    })

    // activeIndexの境界チェック
    const activeIndex = this.config.activeIndex ?? 0
    const validIndex = Math.max(0, Math.min(activeIndex, this.config.steps.length - 1))

    return {
      currentStep: validIndex,
      totalSteps: this.config.steps.length,
      stepData,
      skippedSteps: new Set(),
      completedSteps: new Set(),
      stepStatuses,
      layout: this.config.layout ?? 'horizontal',
    }
  }

  /**
   * レイアウトを設定
   */
  setLayout(layout: StepperLayoutType): void {
    this.state = {
      ...this.state,
      layout,
    }
    this.render()
  }

  /**
   * ステップのステータスを設定
   */
  setStepStatus(stepIndex: number, status: StepStatus | StepStatusWithText): void {
    const newStatuses = new Map(this.state.stepStatuses)
    newStatuses.set(stepIndex, status)
    this.state = {
      ...this.state,
      stepStatuses: newStatuses,
    }
    this.render()
  }

  /**
   * ステップのステータスを取得
   */
  getStepStatus(stepIndex: number): StepStatus | StepStatusWithText | undefined {
    return this.state.stepStatuses.get(stepIndex)
  }

  /**
   * ステップインジケーターをレンダリング
   */
  private renderStepIndicator(): HTMLElement {
    const indicator = createElement('div', {
      className: `wizard-indicator wizard-indicator-${this.state.layout}`,
    })

    // プログレスバー（水平レイアウトのみ）
    if (this.state.layout === 'horizontal') {
      const progressBar = createElement('div', { className: 'wizard-progress-bar' })
      const progress = createElement('div', { className: 'wizard-progress' })
      const progressPercent = ((this.state.currentStep) / (this.state.totalSteps - 1)) * 100
      progress.style.width = `${Math.min(progressPercent, 100)}%`
      progressBar.appendChild(progress)
      indicator.appendChild(progressBar)
    }

    // ステップマーカー
    const steps = createElement('div', {
      className: `wizard-steps wizard-steps-${this.state.layout}`,
    })

    this.config.steps.forEach((step, index) => {
      const stepEl = this.renderStepMarker(step, index)
      steps.appendChild(stepEl)

      // 垂直レイアウトの場合、コネクターを追加（最後のステップ以外）
      if (this.state.layout === 'vertical' && index < this.config.steps.length - 1) {
        const connector = createElement('div', { className: 'wizard-step-connector' })
        steps.appendChild(connector)
      }
    })

    indicator.appendChild(steps)
    return indicator
  }

  /**
   * 個別のステップマーカーをレンダリング
   */
  private renderStepMarker(step: WizardStep, index: number): HTMLElement {
    const isCurrent = index === this.state.currentStep
    const isCompleted = this.state.completedSteps.has(index)
    const isSkipped = this.state.skippedSteps.has(index)

    // ステータスを取得（明示的なステータス > 完了状態 > スキップ > pending）
    const explicitStatus = this.state.stepStatuses.get(index) || step.status
    const statusType = getStatusType(explicitStatus)
    const statusText = getStatusText(explicitStatus)

    // クリック可能かどうかの判定
    const clickableStepsEnabled = this.config.clickable_steps !== false
    const isClickable = clickableStepsEnabled && (isCompleted || index <= this.state.currentStep)

    const classNames = [
      'wizard-step',
      `wizard-step-${this.state.layout}`,
      isCurrent ? 'current' : '',
      isCompleted || statusType === 'completed' ? 'completed' : '',
      isSkipped ? 'skipped' : '',
      isClickable ? 'clickable' : '',
      statusType !== 'pending' ? `status-${statusType}` : '',
    ].filter(Boolean).join(' ')

    const stepEl = createElement('div', { className: classNames })
    stepEl.setAttribute('data-step-index', String(index))
    stepEl.setAttribute('data-step-status', statusType)

    // ステップ番号/アイコン
    const marker = createElement('div', { className: 'step-marker' })
    marker.appendChild(this.renderStepIcon(index, isCompleted, isSkipped, statusType))
    stepEl.appendChild(marker)

    // ラベルコンテナ
    const labelContainer = createElement('div', { className: 'step-label-container' })

    // ステップ名（メインラベル）
    const label = createElement('div', { className: 'step-label', textContent: step.title })
    labelContainer.appendChild(label)

    // サブタイトル
    if (step.subtitle) {
      const subtitle = createElement('div', {
        className: 'step-subtitle',
        textContent: step.subtitle,
      })
      labelContainer.appendChild(subtitle)
    }

    // ステータステキスト（エラー/警告メッセージなど）
    if (statusText) {
      const statusLabel = createElement('div', {
        className: `step-status-text status-${statusType}`,
        textContent: statusText,
      })
      labelContainer.appendChild(statusLabel)
    }

    stepEl.appendChild(labelContainer)

    // クリックイベント
    if (isClickable) {
      stepEl.addEventListener('click', () => {
        this.callbacks.onStepClick?.(index, this.state)
        this.goToStep(index)
      })
    }

    return stepEl
  }

  /**
   * ステップアイコンをレンダリング
   */
  private renderStepIcon(
    index: number,
    isCompleted: boolean,
    isSkipped: boolean,
    statusType: StepStatus
  ): HTMLElement | Text {
    // ステータスに基づいてアイコンを選択
    if (statusType === 'error') {
      const icon = document.createElement('span')
      icon.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>'
      return icon.firstChild as HTMLElement
    }

    if (statusType === 'warning') {
      const icon = document.createElement('span')
      icon.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>'
      return icon.firstChild as HTMLElement
    }

    if (isCompleted || statusType === 'completed') {
      const icon = document.createElement('span')
      icon.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>'
      return icon.firstChild as HTMLElement
    }

    if (statusType === 'closed') {
      const icon = document.createElement('span')
      icon.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>'
      return icon.firstChild as HTMLElement
    }

    if (isSkipped) {
      return document.createTextNode('-')
    }

    // デフォルト：ステップ番号
    return document.createTextNode(String(index + 1))
  }

  /**
   * ステップコンテンツをレンダリング
   */
  private renderStepContent(): HTMLElement {
    const content = createElement('div', { className: 'wizard-content' })
    const currentStepConfig = this.config.steps[this.state.currentStep]

    // ステップヘッダー
    const header = createElement('div', { className: 'wizard-step-header' })
    const title = createElement('h2', {
      className: 'wizard-step-title',
      textContent: currentStepConfig.title,
    })
    header.appendChild(title)

    // サブタイトル
    if (currentStepConfig.subtitle) {
      const subtitle = createElement('p', {
        className: 'wizard-step-subtitle',
        textContent: currentStepConfig.subtitle,
      })
      header.appendChild(subtitle)
    }

    if (currentStepConfig.description) {
      const description = createElement('p', {
        className: 'wizard-step-description',
        textContent: currentStepConfig.description,
      })
      header.appendChild(description)
    }

    // スキップ可能バッジ
    if (currentStepConfig.skippable) {
      const badge = createElement('span', {
        className: 'skippable-badge',
        textContent: 'Optional',
      })
      header.appendChild(badge)
    }

    // 現在のステータスバッジ
    const currentStatus = this.state.stepStatuses.get(this.state.currentStep)
    if (currentStatus) {
      const statusType = getStatusType(currentStatus)
      const statusText = getStatusText(currentStatus)
      if (statusType !== 'pending' && statusType !== 'completed') {
        const statusBadge = createElement('span', {
          className: `wizard-status-badge status-${statusType}`,
          textContent: statusText || statusType.charAt(0).toUpperCase() + statusType.slice(1),
        })
        header.appendChild(statusBadge)
      }
    }

    content.appendChild(header)

    // フィールドコンテナ
    const fieldsContainer = createElement('div', { className: 'wizard-fields' })
    if (this.callbacks.renderFields) {
      this.callbacks.renderFields(currentStepConfig.fields, fieldsContainer)
    }
    content.appendChild(fieldsContainer)

    return content
  }

  /**
   * ナビゲーションボタンをレンダリング
   */
  private renderNavigation(): HTMLElement {
    const nav = createElement('div', { className: 'wizard-navigation' })
    const currentStepConfig = this.config.steps[this.state.currentStep]
    const isFirstStep = this.state.currentStep === 0
    const isLastStep = this.state.currentStep === this.state.totalSteps - 1

    // 戻るボタン
    if (this.config.allow_back !== false && !isFirstStep) {
      const backBtn = createElement('button', {
        className: 'wizard-btn wizard-btn-back',
        textContent: 'Back',
      })
      backBtn.addEventListener('click', () => this.previousStep())
      nav.appendChild(backBtn)
    }

    // スペーサー
    const spacer = createElement('div', { className: 'wizard-nav-spacer' })
    nav.appendChild(spacer)

    // スキップボタン
    if (currentStepConfig.skippable && !isLastStep) {
      const skipBtn = createElement('button', {
        className: 'wizard-btn wizard-btn-skip',
        textContent: 'Skip',
      })
      skipBtn.addEventListener('click', () => this.skipStep())
      nav.appendChild(skipBtn)
    }

    // 次へ/完了ボタン
    const nextBtn = createElement('button', {
      className: `wizard-btn wizard-btn-next ${isLastStep ? 'wizard-btn-complete' : ''}`,
      textContent: isLastStep ? 'Complete' : 'Next',
    })
    nextBtn.addEventListener('click', () => this.nextStep())
    nav.appendChild(nextBtn)

    return nav
  }
}

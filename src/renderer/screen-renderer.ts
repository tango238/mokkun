/**
 * Screen Renderer
 * 画面全体のレンダリングを担当
 */

import type { ScreenDefinition, LayoutConfig, InputField } from '../types/schema'
import { renderFields } from './components/form-fields'
import { renderActions } from './components/layout'
import { SectionNav, type SectionDefinition } from './components/section-nav'

/**
 * HTML特殊文字をエスケープ
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * レイアウト設定からCSSスタイルを生成
 */
function getLayoutStyle(layout?: LayoutConfig): string {
  if (!layout) {
    return ''
  }

  const styles: string[] = []

  if (layout.columns && layout.columns > 1) {
    styles.push(`display: grid`)
    styles.push(`grid-template-columns: repeat(${layout.columns}, 1fr)`)
  }

  if (layout.gap) {
    styles.push(`gap: ${layout.gap}`)
  }

  return styles.length > 0 ? `style="${styles.join('; ')}"` : ''
}

/**
 * 画面ヘッダーをレンダリング
 */
function renderScreenHeader(screen: ScreenDefinition): string {
  const descriptionHtml = screen.description
    ? `<p class="screen-description">${escapeHtml(screen.description)}</p>`
    : ''

  return `
    <header class="screen-header">
      <h1 class="screen-title">${escapeHtml(screen.title)}</h1>
      ${descriptionHtml}
    </header>
  `
}

/**
 * フォームフィールドセクションをレンダリング
 */
function renderFieldsSection(screen: ScreenDefinition): string {
  if (!screen.fields || screen.fields.length === 0) {
    return ''
  }

  const layoutStyle = getLayoutStyle(screen.layout)
  const fieldsHtml = renderFields(screen.fields)

  return `
    <div class="fields-section" ${layoutStyle}>
      ${fieldsHtml}
    </div>
  `
}

/**
 * アクションセクションをレンダリング
 */
function renderActionsSection(screen: ScreenDefinition): string {
  if (!screen.actions || screen.actions.length === 0) {
    return ''
  }

  return `
    <div class="actions-section">
      ${renderActions(screen.actions)}
    </div>
  `
}

/**
 * ウィザードプログレスバーをレンダリング
 */
function renderWizardProgress(
  screen: ScreenDefinition,
  currentStepIndex: number
): string {
  if (!screen.wizard || !screen.wizard.show_progress) {
    return ''
  }

  const steps = screen.wizard.steps
  const stepsHtml = steps.map((step, index) => {
    const classes = ['wizard-progress-step']
    if (index < currentStepIndex) {
      classes.push('completed')
    } else if (index === currentStepIndex) {
      classes.push('current')
    }

    return `
      <div class="${classes.join(' ')}" data-step-index="${index}">
        <span class="step-number">${index + 1}</span>
        <span class="step-title">${escapeHtml(step.title)}</span>
      </div>
    `
  }).join('')

  return `
    <div class="wizard-progress">
      ${stepsHtml}
    </div>
  `
}

/**
 * ウィザードステップをレンダリング
 */
function renderWizardStep(
  screen: ScreenDefinition,
  stepIndex: number
): string {
  if (!screen.wizard) {
    return ''
  }

  const step = screen.wizard.steps[stepIndex]
  if (!step) {
    return '<div class="error">無効なステップです</div>'
  }

  const isFirstStep = stepIndex === 0
  const isLastStep = stepIndex === screen.wizard.steps.length - 1
  const allowBack = screen.wizard.allow_back ?? true

  const descriptionHtml = step.description
    ? `<p class="wizard-step-description">${escapeHtml(step.description)}</p>`
    : ''

  const fieldsHtml = renderFields(step.fields)

  const backButton = !isFirstStep && allowBack
    ? `<button type="button" class="btn btn-secondary wizard-back" data-step="${stepIndex - 1}">戻る</button>`
    : ''

  const nextButton = !isLastStep
    ? `<button type="button" class="btn btn-primary wizard-next" data-step="${stepIndex + 1}">次へ</button>`
    : ''

  const submitButton = isLastStep
    ? `<button type="submit" class="btn btn-primary wizard-submit">送信</button>`
    : ''

  return `
    <div class="wizard-step" data-step-id="${escapeHtml(step.id)}" data-step-index="${stepIndex}">
      <h2 class="wizard-step-title">${escapeHtml(step.title)}</h2>
      ${descriptionHtml}
      <div class="wizard-step-fields">
        ${fieldsHtml}
      </div>
      <div class="wizard-navigation">
        ${backButton}
        ${nextButton}
        ${submitButton}
      </div>
    </div>
  `
}

/**
 * ウィザード画面をレンダリング
 */
export function renderWizardScreen(
  screen: ScreenDefinition,
  currentStepIndex: number = 0
): string {
  if (!screen.wizard) {
    return renderScreen(screen)
  }

  const progressHtml = renderWizardProgress(screen, currentStepIndex)
  const stepHtml = renderWizardStep(screen, currentStepIndex)

  return `
    <div class="screen wizard-screen">
      ${renderScreenHeader(screen)}
      ${progressHtml}
      <form class="wizard-form" data-current-step="${currentStepIndex}">
        ${stepHtml}
      </form>
    </div>
  `
}

/**
 * セクションIDを生成（セクション名から安全なIDを生成）
 */
function generateSectionId(sectionName: string, index: number): string {
  const safeName = sectionName
    .toLowerCase()
    .replace(/[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
  return `section-${safeName || index}`
}

/**
 * セクション付き画面をレンダリング（SectionNav使用）
 */
function renderSectionsScreen(screen: ScreenDefinition): string {
  if (!screen.sections || screen.sections.length === 0) {
    return renderScreen(screen)
  }

  const headerHtml = renderScreenHeader(screen)
  const actionsHtml = renderActionsSection(screen)

  // セクションのHTMLを生成
  const sectionsHtml = screen.sections.map((section, index) => {
    const sectionId = generateSectionId(section.section_name, index)
    const fields = section.input_fields as InputField[] | undefined

    const fieldsHtml = fields && fields.length > 0
      ? renderFields(fields)
      : ''

    const publishToggleHtml = section.publish_toggle
      ? `<div class="section-publish-toggle">
           <label class="checkbox-option">
             <input type="checkbox" name="${sectionId}_publish" />
             <span>このセクションを公開する</span>
           </label>
         </div>`
      : ''

    return `
      <section id="${escapeHtml(sectionId)}" class="form-section">
        <h2 class="section-title">
          ${section.icon ? `<span class="section-icon">${escapeHtml(section.icon)}</span>` : ''}
          ${escapeHtml(section.section_name)}
        </h2>
        ${publishToggleHtml}
        <div class="section-fields">
          ${fieldsHtml}
        </div>
      </section>
    `
  }).join('')

  return `
    <div class="screen screen-with-sections">
      ${headerHtml}
      <div id="section-nav-container" class="section-nav-container"></div>
      <form class="screen-form">
        ${sectionsHtml}
        ${actionsHtml}
      </form>
    </div>
  `
}

/**
 * 通常画面をレンダリング
 */
export function renderScreen(screen: ScreenDefinition): string {
  // ウィザード画面の場合は専用レンダラーを使用
  if (screen.wizard) {
    return renderWizardScreen(screen, 0)
  }

  // セクション付き画面の場合
  if (screen.sections && screen.sections.length > 0) {
    return renderSectionsScreen(screen)
  }

  const headerHtml = renderScreenHeader(screen)
  const fieldsHtml = renderFieldsSection(screen)
  const actionsHtml = renderActionsSection(screen)

  return `
    <div class="screen">
      ${headerHtml}
      <form class="screen-form">
        ${fieldsHtml}
        ${actionsHtml}
      </form>
    </div>
  `
}

/**
 * 画面をDOMにマウント
 */
export function mountScreen(
  container: HTMLElement,
  screen: ScreenDefinition
): SectionNavController | null {
  container.innerHTML = renderScreen(screen)

  // セクション付き画面の場合はSectionNavを初期化
  if (screen.sections && screen.sections.length > 0) {
    return initializeSectionNav(container, screen)
  }

  return null
}

/**
 * セクションナビゲーションを初期化
 */
export function initializeSectionNav(
  container: HTMLElement,
  screen: ScreenDefinition
): SectionNavController | null {
  if (!screen.sections || screen.sections.length === 0) {
    return null
  }

  const navContainer = container.querySelector<HTMLElement>('#section-nav-container')
  if (!navContainer) {
    return null
  }

  // セクション定義を生成
  const sections: SectionDefinition[] = screen.sections.map((section, index) => ({
    id: generateSectionId(section.section_name, index),
    label: section.section_name,
    icon: section.icon,
  }))

  const sectionNav = new SectionNav(
    {
      sections,
      scrollOffset: 120, // ヘッダー + ナビの高さ
      mobileMode: 'scroll',
      stickyTop: '60px', // ヘッダーの下に配置
    },
    navContainer
  )

  sectionNav.render()

  return {
    getActiveSection: () => sectionNav.getActiveSection(),
    scrollToSection: (sectionId: string) => sectionNav.scrollToSection(sectionId),
    destroy: () => sectionNav.destroy(),
  }
}

/**
 * セクションナビコントローラーインターフェース
 */
export interface SectionNavController {
  getActiveSection: () => SectionDefinition | undefined
  scrollToSection: (sectionId: string) => void
  destroy: () => void
}

/**
 * ウィザード画面をDOMにマウント（ステップ管理付き）
 */
export function mountWizardScreen(
  container: HTMLElement,
  screen: ScreenDefinition,
  initialStep: number = 0
): WizardController {
  let currentStep = initialStep

  function render(): void {
    container.innerHTML = renderWizardScreen(screen, currentStep)
    attachWizardEventListeners()
  }

  function attachWizardEventListeners(): void {
    // 次へボタン
    container.querySelectorAll('.wizard-next').forEach(btn => {
      btn.addEventListener('click', () => {
        if (screen.wizard && currentStep < screen.wizard.steps.length - 1) {
          currentStep++
          render()
        }
      })
    })

    // 戻るボタン
    container.querySelectorAll('.wizard-back').forEach(btn => {
      btn.addEventListener('click', () => {
        if (currentStep > 0) {
          currentStep--
          render()
        }
      })
    })
  }

  render()

  return {
    getCurrentStep: () => currentStep,
    goToStep: (step: number) => {
      if (screen.wizard && step >= 0 && step < screen.wizard.steps.length) {
        currentStep = step
        render()
      }
    },
    nextStep: () => {
      if (screen.wizard && currentStep < screen.wizard.steps.length - 1) {
        currentStep++
        render()
      }
    },
    prevStep: () => {
      if (currentStep > 0) {
        currentStep--
        render()
      }
    },
  }
}

/**
 * ウィザードコントローラーインターフェース
 */
export interface WizardController {
  getCurrentStep: () => number
  goToStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
}

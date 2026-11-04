/**
 * Screen Renderer
 * 画面全体のレンダリングを担当
 */

import type { ScreenDefinition, InputField } from '../types/schema'
import { renderFields } from './components/form-fields'
import { HEADING_LABEL_TYPES } from './utils/field-helpers'
import { renderAction, renderActions } from './components/layout'
import { AppHeader, type AppHeaderConfig, type NavItem, type NavDropdownItem } from './components/app-header'
import { AppNavi, type AppNaviItem, type AppNaviButtonItem, type AppNaviAnchorItem, type AppNaviDropdownItem } from './components/app-navi'
import { shellLayout, type LayoutHelpers, type RenderedSection } from './layouts'
import type { Action } from '../types/schema'

/**
 * HTML特殊文字をエスケープ
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
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

  // screen.actions: submit 以外は全ステップ、submit は最終ステップのみ描画する
  const screenActions = (screen.actions ?? []).filter(
    a => a.type !== 'submit' || isLastStep
  )
  const hasScreenSubmit = isLastStep && screenActions.some(a => a.type === 'submit')
  const screenActionsHtml = screenActions.length > 0
    ? `<div class="actions wizard-screen-actions">${screenActions.map(renderAction).join('')}</div>`
    : ''

  const submitButton = isLastStep && !hasScreenSubmit
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
        ${screenActionsHtml}
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
      ${renderAppLayoutContainers(screen)}
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
  return `section-${index}-${safeName || 'section'}`
}

/**
 * セクション名と重複する見出しを抑止する。
 * - 先頭が heading で label がセクション名と同一ならスキップ
 * - 見出しラベル型(data_table/browser 等)でラベルがセクション名と同一ならラベルを空にする
 */
function dedupeSectionHeading(fields: InputField[] | undefined, sectionName: string): InputField[] | undefined {
  if (!fields || fields.length === 0) return fields
  const name = sectionName.trim()
  let result = fields
  if (result[0].type === 'heading' && (result[0].label ?? '').trim() === name) {
    result = result.slice(1)
  }
  return result.map(f =>
    HEADING_LABEL_TYPES.has(f.type) && (f.label ?? '').trim() === name ? ({ ...f, label: '' } as InputField) : f
  )
}

/**
 * sections を描画済み部品に分解する（レイアウト実装から再利用する）
 */
function renderSectionParts(screen: ScreenDefinition): RenderedSection[] {
  if (!screen.sections || screen.sections.length === 0) return []
  return screen.sections.map((section, index) => {
    const sectionId = generateSectionId(section.section_name, index)
    const fields = dedupeSectionHeading(section.input_fields as InputField[] | undefined, section.section_name)
    const fieldsHtml = fields && fields.length > 0 ? renderFields(fields) : ''
    const publishToggleHtml = section.publish_toggle
      ? `<div class="section-publish-toggle">
           <label class="checkbox-option">
             <input type="checkbox" name="${sectionId}_publish" />
             <span>このセクションを公開する</span>
           </label>
         </div>`
      : ''
    return { id: sectionId, title: section.section_name, icon: section.icon, fieldsHtml, publishToggleHtml }
  })
}

/**
 * レイアウト実装に渡すヘルパー
 */
const layoutHelpers: LayoutHelpers = {
  renderScreenHeader,
  renderAppLayoutContainers,
  renderFields: (fields: InputField[]) => renderFields(fields),
  renderActions: (actions: Action[]) => renderActions(actions),
  renderSections: renderSectionParts,
  generateSectionId,
  escapeHtml,
}

/**
 * AppHeader/AppNaviのコンテナをレンダリング
 */
function renderAppLayoutContainers(screen: ScreenDefinition): string {
  const appHeaderHtml = screen.app_header
    ? '<div id="app-header-container" class="app-header-container"></div>'
    : ''

  const appNaviHtml = screen.app_navi
    ? '<div id="app-navi-container" class="app-navi-container"></div>'
    : ''

  return appHeaderHtml + appNaviHtml
}

/**
 * 通常画面をレンダリング（shell レイアウト固定）
 */
export function renderScreen(screen: ScreenDefinition): string {
  // ウィザード画面の場合は専用レンダラーを使用
  if (screen.wizard) {
    return renderWizardScreen(screen, 0)
  }
  return shellLayout.render(screen, layoutHelpers)
}

/**
 * 画面コントローラーインターフェース
 */
export interface ScreenController {
  /** AppHeaderインスタンス（存在する場合） */
  appHeader?: AppHeader
  /** AppNaviインスタンス（存在する場合） */
  appNavi?: AppNavi
  /** 全コンポーネントを破棄 */
  destroy: () => void
}

/**
 * 画面をDOMにマウント
 */
export function mountScreen(
  container: HTMLElement,
  screen: ScreenDefinition
): ScreenController {
  container.innerHTML = renderScreen(screen)

  const controller: ScreenController = {
    destroy: () => {
      controller.appHeader?.destroy()
      controller.appNavi?.destroy()
    },
  }

  // AppHeader / AppNavi の初期化（mountAppChrome に統一）
  const chrome = mountAppChrome(container, screen)
  controller.appHeader = chrome.appHeader
  controller.appNavi = chrome.appNavi

  return controller
}

/**
 * AppHeader / AppNavi のみをマウントする（renderScreen の文字列出力を使う呼び出し側用）
 */
export interface AppChromeController {
  appHeader?: AppHeader
  appNavi?: AppNavi
  destroy: () => void
}

export function mountAppChrome(
  container: HTMLElement,
  screen: ScreenDefinition
): AppChromeController {
  const controller: AppChromeController = {
    destroy: () => {
      controller.appHeader?.destroy()
      controller.appNavi?.destroy()
    },
  }
  if (screen.app_header) {
    const el = container.querySelector<HTMLElement>('#app-header-container')
    if (el) controller.appHeader = initializeAppHeader(el, screen)
  }
  if (screen.app_navi) {
    const el = container.querySelector<HTMLElement>('#app-navi-container')
    if (el) controller.appNavi = initializeAppNavi(el, screen)
  }
  return controller
}

/**
 * AppHeaderを初期化
 */
function initializeAppHeader(
  container: HTMLElement,
  screen: ScreenDefinition
): AppHeader | undefined {
  if (!screen.app_header) {
    return undefined
  }

  const config = screen.app_header

  // スキーマ型からコンポーネント設定に変換
  const appHeaderConfig: AppHeaderConfig = {
    logo: config.logo,
    logoAlt: config.logoAlt,
    logoHref: config.logoHref,
    systemName: config.systemName,
    appName: config.appName,
    tenants: config.tenants,
    currentTenantId: config.currentTenantId,
    userInfo: {
      name: config.userInfo.name,
      email: config.userInfo.email,
      avatarUrl: config.userInfo.avatarUrl,
    },
    navigations: config.navigations?.map((nav): NavItem => ({
      id: nav.id,
      label: nav.label,
      href: nav.href,
      active: nav.active,
      disabled: nav.disabled,
      dropdown: nav.dropdown?.map((item): NavDropdownItem => ({
        id: item.id,
        label: item.label,
        href: item.href,
        divider: item.divider,
      })),
    })),
    appLauncher: config.appLauncher,
    helpPageUrl: config.helpPageUrl,
    showReleaseNote: config.showReleaseNote,
    releaseNoteText: config.releaseNoteText,
    showDataSync: config.showDataSync,
  }

  const appHeader = new AppHeader(container, appHeaderConfig)
  appHeader.render()

  return appHeader
}

/**
 * AppNaviを初期化
 */
function initializeAppNavi(
  container: HTMLElement,
  screen: ScreenDefinition
): AppNavi | undefined {
  if (!screen.app_navi) {
    return undefined
  }

  const config = screen.app_navi

  // スキーマ型からコンポーネント設定に変換
  const items: AppNaviItem[] = config.items.map((item) => {
    switch (item.type) {
      case 'button':
        return {
          type: 'button',
          id: item.id,
          label: item.label,
          icon: item.icon,
          disabled: item.disabled,
          current: item.current,
        } as AppNaviButtonItem

      case 'anchor':
        return {
          type: 'anchor',
          id: item.id,
          label: item.label,
          icon: item.icon,
          disabled: item.disabled,
          current: item.current,
          href: item.href ?? '#',
          target: item.target,
        } as AppNaviAnchorItem

      case 'dropdown':
        return {
          type: 'dropdown',
          id: item.id,
          label: item.label,
          icon: item.icon,
          disabled: item.disabled,
          current: item.current,
          dropdownItems: item.dropdownItems?.map((dropdownItem) => ({
            id: dropdownItem.id,
            label: dropdownItem.label,
            icon: dropdownItem.icon,
            disabled: dropdownItem.disabled,
            href: dropdownItem.href,
          })) ?? [],
        } as AppNaviDropdownItem

      default:
        return {
          type: 'button',
          id: item.id,
          label: item.label,
          icon: item.icon,
          disabled: item.disabled,
          current: item.current,
        } as AppNaviButtonItem
    }
  })

  const appNavi = new AppNavi(container, {
    label: config.label,
    items,
  })
  appNavi.render()

  return appNavi
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
  let chrome: AppChromeController | null = null

  function render(): void {
    // innerHTML 差し替えの前に AppHeader / AppNavi を破棄し、差し替え後に再マウントする
    chrome?.destroy()
    container.innerHTML = renderWizardScreen(screen, currentStep)
    chrome = mountAppChrome(container, screen)
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
    destroy: () => {
      chrome?.destroy()
      chrome = null
    },
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
  destroy: () => void
  goToStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
}

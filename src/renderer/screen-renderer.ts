/**
 * Screen Renderer
 * 画面全体のレンダリングを担当
 */

import type {
  ScreenDefinition,
  LayoutConfig,
  InputField,
  ScreenContentState,
  EmptyStateConfig,
  ErrorStateConfig,
  LoadingStateConfig,
} from '../types/schema'
import { renderFields } from './components/form-fields'
import { renderActions } from './components/layout'
import { SectionNav, type SectionDefinition } from './components/section-nav'
import { AppHeader, type AppHeaderConfig, type NavItem, type NavDropdownItem } from './components/app-header'
import { AppNavi, type AppNaviItem, type AppNaviButtonItem, type AppNaviAnchorItem, type AppNaviDropdownItem } from './components/app-navi'
import { EmptyState } from './components/empty-state'
import { ErrorState } from './components/error-state'

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

// =============================================================================
// Content State Rendering / コンテンツ状態レンダリング
// =============================================================================

/**
 * 空状態をレンダリング
 */
function renderEmptyState(config: EmptyStateConfig): string {
  return EmptyState.renderStatic(config)
}

/**
 * エラー状態をレンダリング
 */
function renderErrorState(config: ErrorStateConfig): string {
  return ErrorState.renderStatic(config, config.show_details ?? false)
}

/**
 * ローディング状態をレンダリング
 */
function renderLoadingState(config: LoadingStateConfig): string {
  const {
    title = '読み込み中...',
    description,
    size = 'medium',
    overlay = false,
  } = config

  const sizeClass = `loading-state-${size}`
  const overlayClass = overlay ? 'loading-state-overlay' : ''

  const titleHtml = title
    ? `<p class="loading-state-title">${escapeHtml(title)}</p>`
    : ''

  const descriptionHtml = description
    ? `<p class="loading-state-description">${escapeHtml(description)}</p>`
    : ''

  return `
    <div class="loading-state ${sizeClass} ${overlayClass}" role="status" aria-live="polite" aria-busy="true">
      <div class="loading-state-spinner" aria-hidden="true">
        <svg class="loading-spinner" viewBox="0 0 24 24">
          <circle class="loading-spinner-track" cx="12" cy="12" r="10" fill="none" stroke-width="2"/>
          <circle class="loading-spinner-progress" cx="12" cy="12" r="10" fill="none" stroke-width="2"/>
        </svg>
      </div>
      <div class="loading-state-content">
        ${titleHtml}
        ${descriptionHtml}
      </div>
    </div>
  `
}

/**
 * 状態に応じたコンテンツをレンダリング
 */
function renderStateContent(
  screen: ScreenDefinition,
  state: ScreenContentState
): string {
  const states = screen.states

  switch (state) {
    case 'empty':
      if (states?.empty) {
        return renderEmptyState(states.empty)
      }
      // デフォルトの空状態
      return renderEmptyState({
        title: 'データがありません',
        icon: '📭',
      })

    case 'error':
      if (states?.error) {
        return renderErrorState(states.error)
      }
      // デフォルトのエラー状態
      return renderErrorState({
        title: 'エラーが発生しました',
        icon: '⚠️',
      })

    case 'loading':
      if (states?.loading) {
        return renderLoadingState(states.loading)
      }
      // デフォルトのローディング状態
      return renderLoadingState({})

    case 'default':
    default:
      return ''
  }
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

  const appLayoutHtml = renderAppLayoutContainers(screen)
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
      ${appLayoutHtml}
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
 * 画面レンダリングオプション
 */
export interface RenderScreenOptions {
  /** 画面の表示状態 */
  state?: ScreenContentState
}

/**
 * 通常画面をレンダリング
 */
export function renderScreen(
  screen: ScreenDefinition,
  options: RenderScreenOptions = {}
): string {
  const { state = 'default' } = options

  // 状態に応じたコンテンツをレンダリング（default以外）
  if (state !== 'default') {
    const appLayoutHtml = renderAppLayoutContainers(screen)
    const headerHtml = renderScreenHeader(screen)
    const stateContentHtml = renderStateContent(screen, state)

    return `
      <div class="screen screen-state-${state}">
        ${appLayoutHtml}
        ${headerHtml}
        <div class="screen-state-container">
          ${stateContentHtml}
        </div>
      </div>
    `
  }

  // ウィザード画面の場合は専用レンダラーを使用
  if (screen.wizard) {
    return renderWizardScreen(screen, 0)
  }

  // セクション付き画面の場合
  if (screen.sections && screen.sections.length > 0) {
    return renderSectionsScreen(screen)
  }

  const appLayoutHtml = renderAppLayoutContainers(screen)
  const headerHtml = renderScreenHeader(screen)
  const fieldsHtml = renderFieldsSection(screen)
  const actionsHtml = renderActionsSection(screen)

  return `
    <div class="screen">
      ${appLayoutHtml}
      ${headerHtml}
      <form class="screen-form">
        ${fieldsHtml}
        ${actionsHtml}
      </form>
    </div>
  `
}

/**
 * 状態コールバック
 */
export interface ScreenStateCallbacks {
  /** 空状態のアクション */
  onEmptyAction?: (handler: string) => void
  /** 空状態のセカンダリアクション */
  onEmptySecondaryAction?: (handler: string) => void
  /** エラー状態のリトライ */
  onErrorRetry?: (handler: string) => void
  /** エラー状態のナビゲーション */
  onErrorNavigate?: (handler: string) => void
}

/**
 * 画面コントローラーインターフェース
 */
export interface ScreenController {
  /** AppHeaderインスタンス（存在する場合） */
  appHeader?: AppHeader
  /** AppNaviインスタンス（存在する場合） */
  appNavi?: AppNavi
  /** SectionNavコントローラー（存在する場合） */
  sectionNav?: SectionNavController
  /** EmptyStateインスタンス（存在する場合） */
  emptyState?: EmptyState
  /** ErrorStateインスタンス（存在する場合） */
  errorState?: ErrorState
  /** 現在の画面状態 */
  currentState: ScreenContentState
  /** 状態を変更 */
  setState: (state: ScreenContentState) => void
  /** 全コンポーネントを破棄 */
  destroy: () => void
}

/**
 * マウントオプション
 */
export interface MountScreenOptions extends RenderScreenOptions {
  /** 状態コールバック */
  stateCallbacks?: ScreenStateCallbacks
}

/**
 * 画面をDOMにマウント
 */
export function mountScreen(
  container: HTMLElement,
  screen: ScreenDefinition,
  options: MountScreenOptions = {}
): ScreenController {
  const { state = 'default', stateCallbacks } = options

  const controller: ScreenController = {
    currentState: state,
    setState: (newState: ScreenContentState) => {
      controller.currentState = newState
      // 再レンダリング
      controller.emptyState?.destroy()
      controller.errorState?.destroy()
      controller.emptyState = undefined
      controller.errorState = undefined

      container.innerHTML = renderScreen(screen, { state: newState })

      // 状態コンポーネントの初期化
      if (newState === 'empty' && screen.states?.empty) {
        const stateContainer = container.querySelector<HTMLElement>('.screen-state-container')
        if (stateContainer) {
          controller.emptyState = new EmptyState(
            stateContainer,
            screen.states.empty,
            {
              onAction: stateCallbacks?.onEmptyAction,
              onSecondaryAction: stateCallbacks?.onEmptySecondaryAction,
            }
          )
          controller.emptyState.render()
        }
      } else if (newState === 'error' && screen.states?.error) {
        const stateContainer = container.querySelector<HTMLElement>('.screen-state-container')
        if (stateContainer) {
          controller.errorState = new ErrorState(
            stateContainer,
            screen.states.error,
            {
              onRetry: stateCallbacks?.onErrorRetry,
              onNavigate: stateCallbacks?.onErrorNavigate,
            }
          )
          controller.errorState.render()
        }
      }

      // AppHeader/AppNaviの再初期化
      if (screen.app_header) {
        const appHeaderContainer = container.querySelector<HTMLElement>('#app-header-container')
        if (appHeaderContainer) {
          controller.appHeader = initializeAppHeader(appHeaderContainer, screen)
        }
      }
      if (screen.app_navi) {
        const appNaviContainer = container.querySelector<HTMLElement>('#app-navi-container')
        if (appNaviContainer) {
          controller.appNavi = initializeAppNavi(appNaviContainer, screen)
        }
      }
    },
    destroy: () => {
      controller.appHeader?.destroy()
      controller.appNavi?.destroy()
      controller.sectionNav?.destroy()
      controller.emptyState?.destroy()
      controller.errorState?.destroy()
    },
  }

  container.innerHTML = renderScreen(screen, { state })

  // 状態に応じたコンポーネント初期化
  if (state === 'empty' && screen.states?.empty) {
    const stateContainer = container.querySelector<HTMLElement>('.screen-state-container')
    if (stateContainer) {
      controller.emptyState = new EmptyState(
        stateContainer,
        screen.states.empty,
        {
          onAction: stateCallbacks?.onEmptyAction,
          onSecondaryAction: stateCallbacks?.onEmptySecondaryAction,
        }
      )
      controller.emptyState.render()
    }
  } else if (state === 'error' && screen.states?.error) {
    const stateContainer = container.querySelector<HTMLElement>('.screen-state-container')
    if (stateContainer) {
      controller.errorState = new ErrorState(
        stateContainer,
        screen.states.error,
        {
          onRetry: stateCallbacks?.onErrorRetry,
          onNavigate: stateCallbacks?.onErrorNavigate,
        }
      )
      controller.errorState.render()
    }
  }

  // AppHeaderの初期化
  if (screen.app_header) {
    const appHeaderContainer = container.querySelector<HTMLElement>('#app-header-container')
    if (appHeaderContainer) {
      controller.appHeader = initializeAppHeader(appHeaderContainer, screen)
    }
  }

  // AppNaviの初期化
  if (screen.app_navi) {
    const appNaviContainer = container.querySelector<HTMLElement>('#app-navi-container')
    if (appNaviContainer) {
      controller.appNavi = initializeAppNavi(appNaviContainer, screen)
    }
  }

  // セクション付き画面の場合はSectionNavを初期化
  if (screen.sections && screen.sections.length > 0 && state === 'default') {
    controller.sectionNav = initializeSectionNav(container, screen) ?? undefined
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

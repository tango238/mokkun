/**
 * Form Section Component
 * フォームセクションコンポーネント
 * 統合フォーム内のセクションを構造化して表示する
 */

import type { FormSection as FormSectionSchema, InputFieldRaw } from '../../types/schema'
import { createElement, clearElement, generateId } from '../utils/dom'

// =============================================================================
// Types
// =============================================================================

/**
 * フォームセクションの設定
 */
export interface FormSectionConfig {
  /** セクション名 */
  sectionName: string
  /** アイコン（HTML文字列またはアイコンクラス） */
  icon?: string
  /** 公開設定トグルを表示 */
  publishToggle?: boolean
  /** 初期の公開設定状態 */
  publishToggleInitial?: boolean
  /** 折りたたみ可能 */
  collapsible?: boolean
  /** 初期の折りたたみ状態 */
  collapsed?: boolean
  /** 入力フィールド */
  fields?: InputFieldRaw[]
  /** カスタムコンテンツ（HTML文字列） */
  content?: string
  /** セクションの説明 */
  description?: string
}

/**
 * フォームセクションの状態
 */
export interface FormSectionState {
  /** 公開設定状態 */
  isPublished: boolean
  /** 折りたたみ状態 */
  isCollapsed: boolean
  /** セクション名 */
  sectionName: string
}

/**
 * フォームセクションのコールバック
 */
export interface FormSectionCallbacks {
  /** 公開設定変更時 */
  onPublishToggle?: (isPublished: boolean, state: FormSectionState) => void
  /** 折りたたみ状態変更時 */
  onCollapseToggle?: (isCollapsed: boolean, state: FormSectionState) => void
  /** フィールドレンダラー */
  renderFields?: (fields: InputFieldRaw[], container: HTMLElement) => void
}

// =============================================================================
// FormSection Class
// =============================================================================

/**
 * フォームセクションコンポーネント
 */
export class FormSection {
  private config: FormSectionConfig
  private state: FormSectionState
  private callbacks: FormSectionCallbacks
  private container: HTMLElement
  private instanceId: string

  constructor(
    config: FormSectionConfig,
    container: HTMLElement,
    callbacks: FormSectionCallbacks = {}
  ) {
    this.config = config
    this.container = container
    this.callbacks = callbacks
    this.instanceId = generateId('form-section')
    this.state = this.createInitialState()
  }

  // ===========================================================================
  // Public Methods
  // ===========================================================================

  /**
   * セクションをレンダリング
   */
  render(): void {
    clearElement(this.container)

    const classes = ['mokkun-form-section']
    if (this.config.collapsible) {
      classes.push('collapsible')
    }
    if (this.state.isCollapsed) {
      classes.push('collapsed')
    }
    if (this.config.publishToggle && !this.state.isPublished) {
      classes.push('unpublished')
    }

    this.container.className = classes.join(' ')
    this.container.setAttribute('data-section-id', this.instanceId)

    // ヘッダー
    const header = this.renderHeader()
    this.container.appendChild(header)

    // コンテンツエリア
    const contentWrapper = this.renderContent()
    this.container.appendChild(contentWrapper)
  }

  /**
   * 公開設定を切り替え
   */
  setPublished(isPublished: boolean): void {
    if (!this.config.publishToggle) {
      return
    }

    this.state = {
      ...this.state,
      isPublished,
    }

    this.render()
    this.callbacks.onPublishToggle?.(isPublished, this.state)
  }

  /**
   * 公開設定を取得
   */
  isPublished(): boolean {
    return this.state.isPublished
  }

  /**
   * 折りたたみ状態を切り替え
   */
  setCollapsed(isCollapsed: boolean): void {
    if (!this.config.collapsible) {
      return
    }

    this.state = {
      ...this.state,
      isCollapsed,
    }

    this.render()
    this.callbacks.onCollapseToggle?.(isCollapsed, this.state)
  }

  /**
   * 折りたたみ状態を取得
   */
  isCollapsed(): boolean {
    return this.state.isCollapsed
  }

  /**
   * 折りたたみをトグル
   */
  toggleCollapsed(): void {
    this.setCollapsed(!this.state.isCollapsed)
  }

  /**
   * 現在の状態を取得
   */
  getState(): FormSectionState {
    return { ...this.state }
  }

  /**
   * セクション名を取得
   */
  getSectionName(): string {
    return this.state.sectionName
  }

  // ===========================================================================
  // Private Methods - Rendering
  // ===========================================================================

  /**
   * 初期状態を作成
   */
  private createInitialState(): FormSectionState {
    return {
      isPublished: this.config.publishToggleInitial ?? true,
      isCollapsed: this.config.collapsed ?? false,
      sectionName: this.config.sectionName,
    }
  }

  /**
   * ヘッダーをレンダリング
   */
  private renderHeader(): HTMLElement {
    const header = createElement('div', {
      className: 'section-header',
    })

    // 左側: アイコン + セクション名
    const titleArea = createElement('div', {
      className: 'section-title-area',
    })

    // 折りたたみ可能な場合はクリッカブルに
    if (this.config.collapsible) {
      titleArea.style.cursor = 'pointer'
      titleArea.addEventListener('click', (e) => {
        // トグルボタン以外をクリックした場合に折りたたみをトグル
        if (!(e.target as HTMLElement).closest('.publish-toggle')) {
          this.toggleCollapsed()
        }
      })
    }

    // アイコン
    if (this.config.icon) {
      const iconWrapper = createElement('span', {
        className: 'section-icon',
      })
      iconWrapper.innerHTML = this.config.icon
      titleArea.appendChild(iconWrapper)
    }

    // セクション名
    const title = createElement('h3', {
      className: 'section-title',
      textContent: this.config.sectionName,
    })
    titleArea.appendChild(title)

    // 折りたたみインジケーター
    if (this.config.collapsible) {
      const collapseIndicator = createElement('span', {
        className: `section-collapse-indicator ${this.state.isCollapsed ? 'collapsed' : 'expanded'}`,
      })
      collapseIndicator.innerHTML = this.state.isCollapsed ? '▶' : '▼'
      titleArea.appendChild(collapseIndicator)
    }

    header.appendChild(titleArea)

    // 右側: 公開設定トグル
    if (this.config.publishToggle) {
      const toggleArea = createElement('div', {
        className: 'publish-toggle',
      })

      const toggleId = `${this.instanceId}-publish-toggle`

      const toggleLabel = createElement('label', {
        className: 'toggle-label',
        attributes: { for: toggleId },
        textContent: '公開',
      })
      toggleArea.appendChild(toggleLabel)

      const toggleSwitch = createElement('label', {
        className: 'toggle-switch',
      })

      const toggleInput = createElement('input', {
        attributes: {
          type: 'checkbox',
          id: toggleId,
        },
      })
      toggleInput.checked = this.state.isPublished
      toggleInput.addEventListener('change', () => {
        this.setPublished(toggleInput.checked)
      })
      toggleSwitch.appendChild(toggleInput)

      const slider = createElement('span', {
        className: 'toggle-slider',
      })
      toggleSwitch.appendChild(slider)

      toggleArea.appendChild(toggleSwitch)
      header.appendChild(toggleArea)
    }

    return header
  }

  /**
   * コンテンツをレンダリング
   */
  private renderContent(): HTMLElement {
    const contentWrapper = createElement('div', {
      className: 'section-content',
    })

    // 折りたたみ中は非表示
    if (this.state.isCollapsed) {
      contentWrapper.style.display = 'none'
    }

    // 説明
    if (this.config.description) {
      const description = createElement('p', {
        className: 'section-description',
        textContent: this.config.description,
      })
      contentWrapper.appendChild(description)
    }

    // フィールド
    if (this.config.fields && this.config.fields.length > 0) {
      const fieldsContainer = createElement('div', {
        className: 'section-fields',
      })

      if (this.callbacks.renderFields) {
        this.callbacks.renderFields(this.config.fields, fieldsContainer)
      } else {
        // デフォルトのプレースホルダー
        for (const field of this.config.fields) {
          const fieldEl = createElement('div', {
            className: 'field-placeholder',
            textContent: `[${field.type}] ${field.label ?? field.field_name ?? 'Unknown Field'}`,
          })
          fieldsContainer.appendChild(fieldEl)
        }
      }

      contentWrapper.appendChild(fieldsContainer)
    }

    // カスタムコンテンツ
    if (this.config.content) {
      const customContent = createElement('div', {
        className: 'section-custom-content',
      })
      customContent.innerHTML = this.config.content
      contentWrapper.appendChild(customContent)
    }

    return contentWrapper
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * FormSectionSchemaからFormSectionConfigに変換
 */
export function createConfigFromSchema(schema: FormSectionSchema): FormSectionConfig {
  return {
    sectionName: schema.section_name,
    icon: schema.icon,
    publishToggle: schema.publish_toggle ?? false,
    fields: schema.input_fields,
  }
}

/**
 * 複数のセクションをレンダリング
 */
export function renderFormSections(
  sections: FormSectionConfig[],
  container: HTMLElement,
  callbacks: FormSectionCallbacks = {}
): FormSection[] {
  clearElement(container)

  const instances: FormSection[] = []

  for (const config of sections) {
    const sectionContainer = createElement('div', {
      className: 'form-section-wrapper',
    })
    container.appendChild(sectionContainer)

    const section = new FormSection(config, sectionContainer, callbacks)
    section.render()
    instances.push(section)
  }

  return instances
}

/**
 * セクション間の区切り線を追加
 */
export function renderFormSectionsWithDividers(
  sections: FormSectionConfig[],
  container: HTMLElement,
  callbacks: FormSectionCallbacks = {}
): FormSection[] {
  clearElement(container)

  const instances: FormSection[] = []

  for (let i = 0; i < sections.length; i++) {
    const config = sections[i]

    // 最初のセクション以外は区切り線を追加
    if (i > 0) {
      const divider = createElement('hr', {
        className: 'section-divider',
      })
      container.appendChild(divider)
    }

    const sectionContainer = createElement('div', {
      className: 'form-section-wrapper',
    })
    container.appendChild(sectionContainer)

    const section = new FormSection(config, sectionContainer, callbacks)
    section.render()
    instances.push(section)
  }

  return instances
}

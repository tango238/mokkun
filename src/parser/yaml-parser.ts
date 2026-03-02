/**
 * Mokkun YAML Parser
 * YAMLテキストを型安全にパースする
 */

import yaml from 'js-yaml'
import type {
  MokkunSchema,
  MokkunSchemaRaw,
  ScreenDefinition,
  ScreenDefinitionRaw,
  InputField,
  InputFieldRaw,
  InputFieldType,
  CommonComponent,
  CommonComponentRaw,
  ValidationRule,
  ValidationRuleRaw,
  FormSection,
  SelectOption,
} from '../types/schema'

// =============================================================================
// Error Types / エラー型
// =============================================================================

/**
 * パースエラーの種類
 */
export type ParseErrorType =
  | 'YAML_SYNTAX_ERROR'
  | 'SCHEMA_VALIDATION_ERROR'
  | 'MISSING_REQUIRED_FIELD'
  | 'INVALID_FIELD_TYPE'
  | 'INVALID_VALUE'

/**
 * パースエラー
 */
export interface ParseError {
  type: ParseErrorType
  message: string
  path?: string
  line?: number
  column?: number
}

/**
 * パース結果
 */
export type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; errors: ParseError[] }

// =============================================================================
// Validation Helpers / バリデーションヘルパー
// =============================================================================

export const VALID_FIELD_TYPES: InputFieldType[] = [
  'text',
  'number',
  'textarea',
  'select',
  'multi_select',
  'combobox',
  'radio_group',
  'checkbox',
  'checkbox_group',
  'date_picker',
  'time_picker',
  'duration_picker',
  'duration_input',
  'file_upload',
  'repeater',
  'data_table',
  'google_map_embed',
  'photo_manager',
  'toggle',
  'image_uploader',
  'badge',
  'browser',
  'calendar',
  'heading',
  'tooltip',
  'pagination',
  'float_area',
  'loader',
  'notification_bar',
  'response_message',
  'timeline',
  'chip',
  'status_label',
  'segmented_control',
  'tabs',
  'line_clamp',
  'disclosure',
  'accordion_panel',
  'section_nav',
  'stepper',
  'information_panel',
  'dropdown',
  'delete_confirm_dialog',
  'definition_list',
]


const VALID_ACTION_TYPES = ['submit', 'navigate', 'custom', 'reset'] as const

const VALID_COMPONENT_TYPES = ['field_group', 'action_group', 'layout', 'template'] as const

/**
 * 値が存在するかチェック
 */
function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null
}

/**
 * オブジェクトかどうかチェック
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * 配列かどうかチェック
 */
function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

/**
 * 文字列かどうかチェック
 */
function isString(value: unknown): value is string {
  return typeof value === 'string'
}

// =============================================================================
// Normalizers / 正規化関数
// =============================================================================

const RESERVED_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

/**
 * 文字列を安全なキーに変換（スペースをアンダースコアに、特殊文字を削除）
 */
function toSafeKey(name: string): string {
  const key = name
    .toLowerCase()
    .replace(/[（）()]/g, '')
    .replace(/[・]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g, '')
  if (!key) return '_unnamed'
  return RESERVED_KEYS.has(key) ? `_${key}` : key
}

/**
 * id 未指定フィールド用の連番 ID 生成関数を作成（クロージャでカウンターを保持）
 */
function createAutoFieldIdGenerator(): () => string {
  let counter = 0
  return () => {
    counter++
    return `__auto_field_${counter}`
  }
}

/**
 * 配列形式の入力フィールドを正規化
 */
function normalizeInputField(raw: InputFieldRaw, generateId: () => string): InputField {
  const id = raw.id ?? raw.field_name ?? generateId()
  const label = raw.label ?? raw.field_name ?? id

  // 配列形式のオプションをSelectOption形式に変換（文字列/オブジェクト混在配列にも対応）
  let options: SelectOption[] | string | undefined
  if (raw.options) {
    if (isArray(raw.options) && raw.options.length > 0) {
      options = (raw.options as unknown[]).map(opt => {
        if (isString(opt)) {
          return { value: opt, label: opt }
        }
        if (isObject(opt) && isDefined(opt.value)) {
          return {
            ...opt,
            label: (opt.label ?? opt.value) as string,
          } as unknown as SelectOption
        }
        // value がないオブジェクトや予期しない型は文字列化してフォールバック
        const fallback = String(opt)
        return { value: fallback, label: fallback }
      })
    } else if (isString(raw.options)) {
      options = raw.options
    }
  }

  // 基本的なフィールドを構築
  const base = {
    id,
    label,
    description: raw.description,
    required: raw.required,
    placeholder: raw.placeholder,
    ...(raw.visible_when ? { visible_when: raw.visible_when as import('../types/schema').Condition } : {}),
  }

  // フィールドタイプに応じて変換
  const fieldType = raw.type as InputFieldType

  switch (fieldType) {
    case 'text':
      return {
        ...base,
        type: 'text',
        input_type: raw.input_type as 'text' | 'email' | 'url' | 'tel' | 'password' | undefined,
      }
    case 'number':
      return {
        ...base,
        type: 'number',
        min: raw.min as number | undefined,
        max: raw.max as number | undefined,
        unit: raw.unit,
      }
    case 'textarea':
      return {
        ...base,
        type: 'textarea',
        rows: raw.rows as number | undefined,
      }
    case 'select':
      return {
        ...base,
        type: 'select',
        options: options ?? [],
      }
    case 'multi_select':
      return {
        ...base,
        type: 'multi_select',
        options: options ?? [],
      }
    case 'radio_group':
      return {
        ...base,
        type: 'radio_group',
        options: options ?? [],
      }
    case 'checkbox_group':
      return {
        ...base,
        type: 'checkbox_group',
        options: options ?? [],
      }
    case 'date_picker':
      return {
        ...base,
        type: 'date_picker',
      }
    case 'time_picker':
      return {
        ...base,
        type: 'time_picker',
      }
    case 'duration_picker':
      return {
        ...base,
        type: 'duration_picker',
        units: raw.units as ('hours' | 'minutes' | 'seconds' | 'days')[] | undefined,
      }
    case 'duration_input':
      return {
        ...base,
        type: 'duration_input',
        display_unit: raw.unit as 'hours' | 'minutes' | 'seconds' | undefined,
      }
    case 'file_upload':
      return {
        ...base,
        type: 'file_upload',
        accept: raw.accepted_types?.split(',').map(t => t.trim()) ?? raw.accept as string[] | undefined,
        multiple: raw.multiple as boolean | undefined,
      }
    case 'repeater':
      return {
        ...base,
        type: 'repeater',
        item_fields: (raw.item_fields as InputFieldRaw[] | undefined)?.map(f => normalizeInputField(f, generateId)) ?? [],
      }
    case 'data_table': {
      // data行にidがない場合は自動生成
      const rawData = raw.data as import('../types/schema').DataTableRow[] | undefined
      const normalizedData = rawData?.map((row, index) => {
        if (!isDefined(row.id)) {
          return { ...row, id: `row-${index}` }
        }
        return row
      })
      return {
        ...base,
        type: 'data_table',
        columns: (raw.columns ?? []) as import('../types/schema').DataTableColumn[],
        data: normalizedData,
        selection: raw.selection as 'none' | 'single' | 'multiple' | undefined,
        row_actions: raw.row_actions as import('../types/schema').DataTableRowAction[] | undefined,
        default_sort: raw.default_sort as import('../types/schema').DataTableSortConfig | undefined,
        pagination: raw.pagination as import('../types/schema').DataTablePaginationConfig | undefined,
        filters: raw.filters as import('../types/schema').DataTableFilterConfig | undefined,
        empty_state: raw.empty_state as import('../types/schema').DataTableEmptyState | undefined,
        height: raw.height as string | undefined,
        striped: raw.striped as boolean | undefined,
        hoverable: raw.hoverable as boolean | undefined,
        bordered: raw.bordered as boolean | undefined,
        compact: raw.compact as boolean | undefined,
        responsive: raw.responsive as boolean | undefined,
      }
    }
    case 'google_map_embed':
      return {
        ...base,
        type: 'google_map_embed',
        height: raw.height as string | undefined,
        width: raw.width as string | undefined,
        show_open_link: raw.show_open_link as boolean | undefined,
        zoom: raw.zoom as number | undefined,
      }
    case 'photo_manager':
      return {
        ...base,
        type: 'photo_manager',
        photos: raw.photos as import('../types/schema').PhotoConfig[] | undefined,
        max_photos: raw.max_photos as number | undefined,
        max_file_size: raw.max_file_size as number | undefined,
        accepted_formats: raw.accepted_formats as string[] | undefined,
        columns: raw.columns as number | undefined,
      }
    case 'image_uploader':
      return {
        ...base,
        type: 'image_uploader',
        accepted_formats: raw.accepted_formats as string[] | undefined,
        max_file_size: raw.max_file_size as number | undefined,
        max_files: raw.max_files as number | undefined,
        min_files: raw.min_files as number | undefined,
      }
    case 'browser':
      return {
        ...base,
        type: 'browser',
        items: (raw.browser_items ?? raw.items) as import('../types/schema').BrowserItemSchema[] | undefined ?? [],
        default: (raw.default_value ?? raw.default) as string | undefined,
        maxColumns: raw.max_columns as number | undefined,
        height: raw.height as string | undefined,
      }
    case 'calendar':
      return {
        ...base,
        type: 'calendar',
        default: raw.default as string | undefined,
        from: (raw.calendar_from ?? raw.from) as string | undefined,
        to: (raw.calendar_to ?? raw.to) as string | undefined,
        weekStartsOn: raw.week_starts_on as 0 | 1 | undefined,
        locale: raw.locale as string | undefined,
      }
    case 'combobox':
      return {
        ...base,
        type: 'combobox',
        mode: raw.mode as 'single' | 'multi' | undefined,
        options: options,
        searchable: raw.searchable as boolean | undefined,
        async_loader: raw.async_loader as string | undefined,
        min_search_length: raw.min_search_length as number | undefined,
        debounce_ms: raw.debounce_ms as number | undefined,
        clearable: raw.clearable as boolean | undefined,
        max_selections: raw.max_selections as number | undefined,
      }
    case 'checkbox':
      return {
        ...base,
        type: 'checkbox',
        checked_label: raw.checked_label as string | undefined,
        unchecked_label: raw.unchecked_label as string | undefined,
        size: raw.size as 'small' | 'medium' | 'large' | undefined,
        name: raw.name as string | undefined,
        label_position: raw.label_position as 'left' | 'right' | undefined,
      }
    case 'toggle':
      return {
        ...base,
        type: 'toggle',
        checked_label: raw.checked_label as string | undefined,
        unchecked_label: raw.unchecked_label as string | undefined,
        size: raw.size as 'small' | 'medium' | 'large' | undefined,
        name: raw.name as string | undefined,
        label_position: raw.label_position as 'left' | 'right' | undefined,
      }
    case 'badge':
      return {
        ...base,
        type: 'badge',
        color: raw.color as 'gray' | 'blue' | 'green' | 'yellow' | 'red' | undefined,
        size: raw.size as 'small' | 'medium' | undefined,
        dot: raw.dot as boolean | undefined,
        count: raw.count as number | undefined,
        max_count: raw.max_count as number | undefined,
        text: raw.text as string | undefined,
      }
    case 'heading':
      return {
        ...base,
        type: 'heading',
        level: (raw.level ?? 2) as 1 | 2 | 3 | 4 | 5 | 6,
        text: (raw.label ?? raw.text ?? '') as string,
        size: raw.size as 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | undefined,
        align: raw.align as 'left' | 'center' | 'right' | undefined,
        color: raw.color as 'default' | 'primary' | 'secondary' | 'muted' | 'danger' | 'success' | 'warning' | undefined,
        icon: raw.icon as string | undefined,
      }
    case 'tooltip':
      return {
        ...base,
        type: 'tooltip',
        content: (raw.content ?? '') as string,
        position: raw.position as 'top' | 'bottom' | 'left' | 'right' | undefined,
        delay: raw.delay as number | undefined,
        show_arrow: raw.show_arrow as boolean | undefined,
        is_html: raw.is_html as boolean | undefined,
        max_width: raw.max_width as string | undefined,
      }
    case 'pagination':
      return {
        ...base,
        type: 'pagination',
        total_items: (raw.total_items ?? 0) as number,
        current_page: raw.current_page as number | undefined,
        page_size: raw.page_size as number | undefined,
        page_size_options: raw.page_size_options as number[] | undefined,
        show_page_size_selector: raw.show_page_size_selector as boolean | undefined,
        show_item_count: raw.show_item_count as boolean | undefined,
        show_jump_buttons: raw.show_jump_buttons as boolean | undefined,
        max_page_buttons: raw.max_page_buttons as number | undefined,
        compact: raw.compact as boolean | undefined,
        align: raw.align as 'left' | 'center' | 'right' | undefined,
      }
    case 'float_area':
      return {
        ...base,
        type: 'float_area',
        position: raw.position as 'top' | 'bottom' | undefined,
        show_shadow: raw.show_shadow as boolean | undefined,
        show_border: raw.show_border as boolean | undefined,
        z_index: raw.z_index as number | undefined,
        responsive: raw.responsive as boolean | undefined,
        sticky: raw.sticky as boolean | undefined,
        align: (raw.float_align ?? raw.align) as 'left' | 'center' | 'right' | 'space-between' | undefined,
        padding: raw.padding as string | undefined,
        gap: raw.gap as string | undefined,
        aria_label: raw.aria_label as string | undefined,
      }
    case 'loader':
      return {
        ...base,
        type: 'loader',
        size: (raw.loader_size ?? raw.size) as 'small' | 'medium' | 'large' | undefined,
        loaderType: (raw.loader_type ?? raw.loaderType) as 'primary' | 'light' | undefined,
        overlay: raw.overlay as boolean | undefined,
        showProgress: (raw.show_progress ?? raw.showProgress) as boolean | undefined,
        initialProgress: (raw.initial_progress ?? raw.initialProgress) as number | undefined,
      }
    default:
      // 未知のタイプは前方互換のためそのまま保持する（意図的な設計）
      // バリデーションは validateInputField で実施済み
      // レンダリング時に form-fields.ts の default ケースでフォールバック表示される
      return {
        ...base,
        type: fieldType as InputFieldType,
      } as InputField
  }
}


/**
 * display_fieldsからDataTableFieldを生成
 */
function createDataTableFromDisplayFields(
  displayFields: string[],
  filters?: string[],
  screenName?: string
): InputField {
  // カラム定義を生成
  const columns: import('../types/schema').DataTableColumn[] = displayFields.map((fieldName, index) => ({
    id: `col_${index}`,
    label: fieldName,
    sortable: true,
  }))

  // フィルター設定を生成
  let filterConfig: import('../types/schema').DataTableFilterConfig | undefined
  if (filters && filters.length > 0) {
    filterConfig = {
      enabled: true,
      show_search: filters.some(f => f.includes('キーワード') || f.includes('検索')),
      fields: filters
        .filter(f => !f.includes('キーワード') && !f.includes('検索'))
        .map((filterName, index) => ({
          id: `filter_${index}`,
          label: filterName,
          column: `col_${index}`, // 対応するカラムIDを設定
          type: 'select' as const,
          options: [] as import('../types/schema').SelectOption[],
        })),
    }
  }

  const dataTableField: InputField = {
    id: screenName ? toSafeKey(screenName) + '_table' : 'data_table',
    type: 'data_table',
    label: screenName ?? '一覧',
    columns,
    data: [], // データは空（実際のデータは外部から注入）
    selection: 'single',
    pagination: {
      enabled: true,
      page_size: 10,
      page_size_options: [10, 25, 50, 100],
    },
    filters: filterConfig,
    empty_state: {
      title: 'データがありません',
      description: '表示するデータが存在しません',
      icon: '📭',
    },
    hoverable: true,
    striped: true,
  }

  return dataTableField
}

/**
 * セクションを正規化（フィールドを正規化しつつセクション構造を保持）
 */
function normalizeSection(rawSection: FormSection, generateId: () => string): FormSection {
  return {
    ...rawSection,
    input_fields: rawSection.input_fields?.map(f => normalizeInputField(f, generateId)) as InputFieldRaw[] | undefined,
  }
}

/**
 * YAML形式のAppHeader設定を正規化（snake_case → camelCase）
 */
function normalizeAppHeader(
  raw: Record<string, unknown> | undefined
): import('../types/schema').AppHeaderConfigSchema | undefined {
  if (!raw) return undefined

  return {
    logo: raw.logo as string | undefined,
    logoAlt: raw.logo_alt as string | undefined,
    logoHref: raw.logo_href as string | undefined,
    appName: (raw.app_name ?? raw.appName ?? '') as string,
    tenants: raw.tenants as import('../types/schema').TenantSchema[] | undefined,
    currentTenantId: (raw.current_tenant_id ?? raw.currentTenantId) as string | undefined,
    userInfo: raw.user_info
      ? {
          name: (raw.user_info as Record<string, unknown>).name as string,
          email: (raw.user_info as Record<string, unknown>).email as string | undefined,
          avatarUrl: ((raw.user_info as Record<string, unknown>).avatar_url ??
            (raw.user_info as Record<string, unknown>).avatarUrl) as string | undefined,
        }
      : { name: '' },
    navigations: (raw.navigations as Record<string, unknown>[] | undefined)?.map((nav) => ({
      id: nav.id as string,
      label: nav.label as string,
      href: nav.href as string | undefined,
      active: nav.active as boolean | undefined,
      disabled: nav.disabled as boolean | undefined,
      dropdown: (nav.dropdown as Record<string, unknown>[] | undefined)?.map((item) => ({
        id: item.id as string,
        label: item.label as string,
        href: item.href as string | undefined,
        divider: item.divider as boolean | undefined,
      })),
    })),
    appLauncher: (raw.app_launcher ?? raw.appLauncher) as import('../types/schema').AppLauncherItemSchema[] | undefined,
    helpPageUrl: (raw.help_page_url ?? raw.helpPageUrl) as string | undefined,
    showReleaseNote: (raw.show_release_note ?? raw.showReleaseNote) as boolean | undefined,
    releaseNoteText: (raw.release_note_text ?? raw.releaseNoteText) as string | undefined,
    showDataSync: (raw.show_data_sync ?? raw.showDataSync) as boolean | undefined,
  }
}

/**
 * YAML形式のAppNavi設定を正規化（snake_case → camelCase）
 */
function normalizeAppNavi(
  raw: Record<string, unknown> | undefined
): import('../types/schema').AppNaviConfigSchema | undefined {
  if (!raw) return undefined

  const items = (raw.items as Record<string, unknown>[] | undefined)?.map((item) => ({
    id: item.id as string,
    label: item.label as string,
    type: item.type as 'button' | 'anchor' | 'dropdown',
    icon: item.icon as string | undefined,
    disabled: item.disabled as boolean | undefined,
    current: item.current as boolean | undefined,
    href: item.href as string | undefined,
    target: item.target as '_blank' | '_self' | '_parent' | '_top' | undefined,
    dropdownItems: ((item.dropdown_items ?? item.dropdownItems) as Record<string, unknown>[] | undefined)?.map(
      (dropdownItem) => ({
        id: dropdownItem.id as string,
        label: dropdownItem.label as string,
        icon: dropdownItem.icon as string | undefined,
        disabled: dropdownItem.disabled as boolean | undefined,
        href: dropdownItem.href as string | undefined,
      })
    ),
  })) ?? []

  return {
    label: raw.label as string | undefined,
    items,
  }
}

/**
 * ウィザード設定を正規化（ステップ内のフィールドにIDを付与）
 */
function normalizeWizard(
  wizard: import('../types/schema').WizardConfig,
  generateId: () => string
): import('../types/schema').WizardConfig {
  return {
    ...wizard,
    steps: wizard.steps.map(step => ({
      ...step,
      fields: ((step.fields ?? []) as InputFieldRaw[]).map(f => normalizeInputField(f, generateId)),
    })),
  }
}

/**
 * 配列形式の画面定義を正規化
 */
function normalizeScreenDefinition(raw: ScreenDefinitionRaw, generateId: () => string): ScreenDefinition {
  // タイトルを決定（name, title, purposeの順で優先）
  const title = raw.title ?? raw.name ?? 'Untitled'

  // セクションと フィールドを正規化
  let sections: FormSection[] | undefined
  let fields: InputField[] | undefined

  if (raw.sections && raw.sections.length > 0) {
    // セクションを正規化して保持（SectionNavで使用）
    sections = raw.sections.map(s => normalizeSection(s, generateId))
    // 正規化済みセクションからフィールドを抽出（二重正規化を回避）
    fields = []
    for (const section of sections) {
      if (section.input_fields) {
        for (const field of section.input_fields) {
          fields.push(field as InputField)
        }
      }
    }
  } else if (raw.fields) {
    // 通常のfieldsを使用
    fields = (raw.fields as InputFieldRaw[]).map(f => normalizeInputField(f, generateId))
  } else if (raw.display_fields && isArray(raw.display_fields)) {
    // display_fieldsがある場合はdata_tableフィールドを自動生成
    const dataTableField = createDataTableFromDisplayFields(
      raw.display_fields as string[],
      raw.filters as string[] | undefined,
      raw.name
    )
    fields = [dataTableField]
  }

  // input_fieldsがある場合（配列形式でのフィールド定義）
  if (!fields && raw.input_fields && isArray(raw.input_fields)) {
    fields = (raw.input_fields as InputFieldRaw[]).map(f => normalizeInputField(f, generateId))
  }

  // アクションを正規化（文字列配列の場合も対応）
  let actions = raw.actions
  if (actions && isArray(actions)) {
    actions = actions.map((action, index) => {
      if (isString(action)) {
        // 文字列の場合はボタンラベルとして扱う
        return {
          id: `action_${index}`,
          type: 'submit' as const,
          label: action,
          style: index === 0 ? 'primary' as const : 'secondary' as const,
        }
      }
      return action
    })
  }

  return {
    title,
    description: raw.description ?? raw.purpose,
    app_header: normalizeAppHeader(raw.app_header as Record<string, unknown> | undefined),
    app_navi: normalizeAppNavi(raw.app_navi as Record<string, unknown> | undefined),
    sections,
    fields,
    actions,
    wizard: raw.wizard ? normalizeWizard(raw.wizard, generateId) : undefined,
    layout: raw.layout,
  }
}

/**
 * 配列形式のviewを正規化
 */
function normalizeView(
  view: Record<string, ScreenDefinitionRaw> | ScreenDefinitionRaw[],
  generateId: () => string
): Record<string, ScreenDefinition> {
  if (isArray(view)) {
    // 配列形式の場合、オブジェクト形式に変換
    const result: Record<string, ScreenDefinition> = {}

    for (const screen of view) {
      const key = screen.name ? toSafeKey(screen.name) : `screen_${Object.keys(result).length}`
      result[key] = normalizeScreenDefinition(screen, generateId)
    }

    return result
  }

  // オブジェクト形式の場合、各画面を正規化
  const result: Record<string, ScreenDefinition> = {}

  for (const [key, screen] of Object.entries(view)) {
    result[key] = normalizeScreenDefinition(screen as ScreenDefinitionRaw, generateId)
  }

  return result
}

/**
 * 配列形式のcommon_componentsを正規化
 */
function normalizeCommonComponents(
  components: Record<string, CommonComponent> | CommonComponentRaw[] | undefined,
  generateId: () => string
): Record<string, CommonComponent> | undefined {
  if (!components) return undefined

  if (isArray(components)) {
    const result: Record<string, CommonComponent> = {}

    for (const comp of components) {
      const componentName = comp.component_name ?? (comp as Record<string, unknown>).name as string
      const key = toSafeKey(componentName)
      result[key] = {
        name: componentName,
        description: comp.description,
        type: 'field_group', // デフォルト
      }
    }

    return result
  }

  // オブジェクト形式: fields を正規化してIDを付与
  const result: Record<string, CommonComponent> = {}
  for (const [key, comp] of Object.entries(components)) {
    result[key] = {
      ...comp,
      fields: comp.fields
        ? (comp.fields as InputFieldRaw[]).map(f => normalizeInputField(f, generateId))
        : undefined,
    }
  }
  return result
}

/**
 * 配列形式のvalidationsを正規化
 */
function normalizeValidations(
  validations: Record<string, ValidationRule> | ValidationRuleRaw[] | undefined
): Record<string, ValidationRule> | undefined {
  if (!validations) return undefined

  if (isArray(validations)) {
    const result: Record<string, ValidationRule> = {}

    for (const rule of validations) {
      const key = toSafeKey(rule.field)
      result[key] = {
        name: rule.field,
        rules: {
          message: rule.rule,
        },
        message: rule.rule,
      }
    }

    return result
  }

  // オブジェクト形式 → name が未設定ならキーを name として補完
  const result: Record<string, ValidationRule> = {}
  for (const [key, rule] of Object.entries(validations)) {
    result[key] = {
      ...rule,
      name: rule.name ?? key,
    }
  }
  return result
}

/**
 * 生のスキーマデータを正規化されたMokkunSchemaに変換
 */
function normalizeSchema(raw: MokkunSchemaRaw): MokkunSchema {
  const generateId = createAutoFieldIdGenerator()
  return {
    view: normalizeView(raw.view, generateId),
    common_components: normalizeCommonComponents(raw.common_components, generateId),
    validations: normalizeValidations(raw.validations),
  }
}

// =============================================================================
// Validators / バリデーター
// =============================================================================

/**
 * 入力フィールドをバリデート
 */
function validateInputField(
  field: unknown,
  path: string
): ParseError[] {
  const errors: ParseError[] = []

  if (!isObject(field)) {
    errors.push({
      type: 'INVALID_VALUE',
      message: 'Field must be an object',
      path,
    })
    return errors
  }

  // JSON Schema では InputField の required は ["type"] のみ
  if (!isDefined(field.type)) {
    errors.push({
      type: 'MISSING_REQUIRED_FIELD',
      message: 'Field must have a "type"',
      path,
    })
  }

  // badge, pagination, float_area は label が必須（JSON Schema allOf if/then）
  const labelRequiredTypes = ['badge', 'pagination', 'float_area']
  if (labelRequiredTypes.includes(field.type as string) && !isDefined(field.label)) {
    errors.push({
      type: 'MISSING_REQUIRED_FIELD',
      message: `Field type "${field.type}" requires a "label"`,
      path,
    })
  }

  // Validate options for select-like fields
  const selectTypes = ['select', 'multi_select', 'radio_group', 'checkbox_group']
  if (selectTypes.includes(field.type as string)) {
    if (!isDefined(field.options)) {
      errors.push({
        type: 'MISSING_REQUIRED_FIELD',
        message: `Field type "${field.type}" requires "options"`,
        path,
      })
    } else if (!isArray(field.options) && !isString(field.options)) {
      errors.push({
        type: 'INVALID_VALUE',
        message: 'Options must be an array or a reference string',
        path: `${path}.options`,
      })
    } else if (isArray(field.options)) {
      field.options.forEach((option, index) => {
        errors.push(...validateSelectOption(option, `${path}.options[${index}]`))
      })
    }
  }

  // Validate repeater item_fields
  if (field.type === 'repeater') {
    if (!isDefined(field.item_fields)) {
      errors.push({
        type: 'MISSING_REQUIRED_FIELD',
        message: 'Repeater field must have "item_fields"',
        path,
      })
    } else if (!isArray(field.item_fields)) {
      errors.push({
        type: 'INVALID_VALUE',
        message: 'item_fields must be an array',
        path: `${path}.item_fields`,
      })
    } else {
      (field.item_fields as unknown[]).forEach((itemField, index) => {
        errors.push(...validateInputField(itemField, `${path}.item_fields[${index}]`))
      })
    }
  }

  return errors
}

/**
 * 選択肢をバリデート
 */
function validateSelectOption(
  option: unknown,
  path: string
): ParseError[] {
  const errors: ParseError[] = []

  // 文字列の場合はそのまま有効（JSON Schema: SelectOption | string の oneOf）
  if (isString(option)) {
    return errors
  }

  if (!isObject(option)) {
    errors.push({
      type: 'INVALID_VALUE',
      message: 'Option must be an object or string',
      path,
    })
    return errors
  }

  if (!isDefined(option.value)) {
    errors.push({
      type: 'MISSING_REQUIRED_FIELD',
      message: 'Option must have a "value"',
      path,
    })
  }

  if (!isDefined(option.label)) {
    errors.push({
      type: 'MISSING_REQUIRED_FIELD',
      message: 'Option must have a "label"',
      path,
    })
  }

  return errors
}

/**
 * アクションをバリデート
 */
function validateAction(
  action: unknown,
  path: string,
  options: { allowString?: boolean } = {}
): ParseError[] {
  const allowString = options.allowString ?? true
  const errors: ParseError[] = []

  // 文字列の場合はラベルとして扱う（JSON Schema: Action | string の oneOf、ノーマライザで変換される）
  // ただし action_group 等のコンテキストでは文字列を許可しない
  if (isString(action)) {
    if (allowString) {
      return errors
    }
    errors.push({
      type: 'INVALID_VALUE',
      message: 'Action must be an object',
      path,
    })
    return errors
  }

  if (!isObject(action)) {
    errors.push({
      type: 'INVALID_VALUE',
      message: 'Action must be an object or string',
      path,
    })
    return errors
  }

  if (!isDefined(action.id)) {
    errors.push({
      type: 'MISSING_REQUIRED_FIELD',
      message: 'Action must have an "id"',
      path,
    })
  }

  if (!isDefined(action.type)) {
    errors.push({
      type: 'MISSING_REQUIRED_FIELD',
      message: 'Action must have a "type"',
      path,
    })
  } else if (!VALID_ACTION_TYPES.includes(action.type as typeof VALID_ACTION_TYPES[number])) {
    errors.push({
      type: 'INVALID_FIELD_TYPE',
      message: `Invalid action type: "${action.type}". Valid types are: ${VALID_ACTION_TYPES.join(', ')}`,
      path: `${path}.type`,
    })
  }

  if (!isDefined(action.label)) {
    errors.push({
      type: 'MISSING_REQUIRED_FIELD',
      message: 'Action must have a "label"',
      path,
    })
  }

  // Type-specific validation
  if (action.type === 'navigate' && !isDefined(action.to)) {
    errors.push({
      type: 'MISSING_REQUIRED_FIELD',
      message: 'Navigate action must have a "to" destination',
      path,
    })
  }

  // Note: handler is optional for custom actions - it can be provided at runtime via callbacks
  // if (action.type === 'custom' && !isDefined(action.handler)) { ... }

  return errors
}

/**
 * ウィザード設定をバリデート
 */
function validateWizard(
  wizard: unknown,
  path: string
): ParseError[] {
  const errors: ParseError[] = []

  if (!isObject(wizard)) {
    errors.push({
      type: 'INVALID_VALUE',
      message: 'Wizard must be an object',
      path,
    })
    return errors
  }

  if (!isDefined(wizard.steps)) {
    errors.push({
      type: 'MISSING_REQUIRED_FIELD',
      message: 'Wizard must have "steps"',
      path,
    })
    return errors
  }

  if (!isArray(wizard.steps)) {
    errors.push({
      type: 'INVALID_VALUE',
      message: 'Wizard steps must be an array',
      path: `${path}.steps`,
    })
    return errors
  }

  (wizard.steps as unknown[]).forEach((step, index) => {
    errors.push(...validateWizardStep(step, `${path}.steps[${index}]`))
  })

  return errors
}

/**
 * ウィザードステップをバリデート
 */
function validateWizardStep(
  step: unknown,
  path: string
): ParseError[] {
  const errors: ParseError[] = []

  if (!isObject(step)) {
    errors.push({
      type: 'INVALID_VALUE',
      message: 'Wizard step must be an object',
      path,
    })
    return errors
  }

  if (!isDefined(step.id)) {
    errors.push({
      type: 'MISSING_REQUIRED_FIELD',
      message: 'Wizard step must have an "id"',
      path,
    })
  }

  if (!isDefined(step.title)) {
    errors.push({
      type: 'MISSING_REQUIRED_FIELD',
      message: 'Wizard step must have a "title"',
      path,
    })
  }

  if (!isDefined(step.fields)) {
    errors.push({
      type: 'MISSING_REQUIRED_FIELD',
      message: 'Wizard step must have "fields"',
      path,
    })
  } else if (!isArray(step.fields)) {
    errors.push({
      type: 'INVALID_VALUE',
      message: 'Wizard step fields must be an array',
      path: `${path}.fields`,
    })
  } else {
    (step.fields as unknown[]).forEach((field, index) => {
      errors.push(...validateInputField(field, `${path}.fields[${index}]`))
    })
  }

  return errors
}

/**
 * 画面定義をバリデート
 */
function validateScreenDefinition(
  screen: unknown,
  path: string
): ParseError[] {
  const errors: ParseError[] = []

  if (!isObject(screen)) {
    errors.push({
      type: 'INVALID_VALUE',
      message: 'Screen definition must be an object',
      path,
    })
    return errors
  }

  if (!isDefined(screen.title)) {
    errors.push({
      type: 'MISSING_REQUIRED_FIELD',
      message: 'Screen must have a "title"',
      path,
    })
  }

  // Validate wizard if present
  if (isDefined(screen.wizard)) {
    errors.push(...validateWizard(screen.wizard, `${path}.wizard`))
  }

  // Validate fields if present
  if (isDefined(screen.fields)) {
    if (!isArray(screen.fields)) {
      errors.push({
        type: 'INVALID_VALUE',
        message: 'Screen fields must be an array',
        path: `${path}.fields`,
      })
    } else {
      (screen.fields as unknown[]).forEach((field, index) => {
        errors.push(...validateInputField(field, `${path}.fields[${index}]`))
      })
    }
  }

  // Validate actions if present
  if (isDefined(screen.actions)) {
    if (!isArray(screen.actions)) {
      errors.push({
        type: 'INVALID_VALUE',
        message: 'Screen actions must be an array',
        path: `${path}.actions`,
      })
    } else {
      (screen.actions as unknown[]).forEach((action, index) => {
        errors.push(...validateAction(action, `${path}.actions[${index}]`))
      })
    }
  }

  return errors
}

/**
 * 共通コンポーネントをバリデート
 */
function validateCommonComponent(
  component: unknown,
  path: string
): ParseError[] {
  const errors: ParseError[] = []

  if (!isObject(component)) {
    errors.push({
      type: 'INVALID_VALUE',
      message: 'Common component must be an object',
      path,
    })
    return errors
  }

  if (!isDefined(component.name)) {
    errors.push({
      type: 'MISSING_REQUIRED_FIELD',
      message: 'Common component must have a "name"',
      path,
    })
  }

  if (!isDefined(component.type)) {
    errors.push({
      type: 'MISSING_REQUIRED_FIELD',
      message: 'Common component must have a "type"',
      path,
    })
  } else if (!VALID_COMPONENT_TYPES.includes(component.type as typeof VALID_COMPONENT_TYPES[number])) {
    errors.push({
      type: 'INVALID_FIELD_TYPE',
      message: `Invalid component type: "${component.type}". Valid types are: ${VALID_COMPONENT_TYPES.join(', ')}`,
      path: `${path}.type`,
    })
  }

  // Validate fields for field_group type
  if (component.type === 'field_group' && isDefined(component.fields)) {
    if (!isArray(component.fields)) {
      errors.push({
        type: 'INVALID_VALUE',
        message: 'Component fields must be an array',
        path: `${path}.fields`,
      })
    } else {
      (component.fields as unknown[]).forEach((field, index) => {
        errors.push(...validateInputField(field, `${path}.fields[${index}]`))
      })
    }
  }

  // Validate actions for action_group type
  // action_group では文字列アクションを許可しない（JSON Schema: Action オブジェクトのみ）
  if (component.type === 'action_group' && isDefined(component.actions)) {
    if (!isArray(component.actions)) {
      errors.push({
        type: 'INVALID_VALUE',
        message: 'Component actions must be an array',
        path: `${path}.actions`,
      })
    } else {
      (component.actions as unknown[]).forEach((action, index) => {
        errors.push(...validateAction(action, `${path}.actions[${index}]`, { allowString: false }))
      })
    }
  }

  return errors
}

/**
 * バリデーションルールをバリデート
 */
function validateValidationRule(
  rule: unknown,
  path: string
): ParseError[] {
  const errors: ParseError[] = []

  if (!isObject(rule)) {
    errors.push({
      type: 'INVALID_VALUE',
      message: 'Validation rule must be an object',
      path,
    })
    return errors
  }

  if (!isDefined(rule.rules)) {
    errors.push({
      type: 'MISSING_REQUIRED_FIELD',
      message: 'Validation rule must have "rules"',
      path,
    })
  }

  return errors
}

/**
 * 配列形式の画面定義をバリデート（緩いバリデーション）
 */
function validateScreenDefinitionArray(
  screen: unknown,
  path: string
): ParseError[] {
  const errors: ParseError[] = []

  if (!isObject(screen)) {
    errors.push({
      type: 'INVALID_VALUE',
      message: 'Screen definition must be an object',
      path,
    })
    return errors
  }

  // 配列形式の場合はnameまたはtitleが必須
  if (!isDefined(screen.name) && !isDefined(screen.title)) {
    errors.push({
      type: 'MISSING_REQUIRED_FIELD',
      message: 'Screen must have a "name" or "title"',
      path,
    })
  }

  // セクションがある場合は各セクションをバリデート
  if (isDefined(screen.sections)) {
    if (!isArray(screen.sections)) {
      errors.push({
        type: 'INVALID_VALUE',
        message: 'sections must be an array',
        path: `${path}.sections`,
      })
    }
    // 配列形式のフィールドは緩くバリデート（field_nameベースでもOK）
  }

  return errors
}

/**
 * 配列形式の共通コンポーネントをバリデート
 */
function validateCommonComponentArray(
  component: unknown,
  path: string
): ParseError[] {
  const errors: ParseError[] = []

  if (!isObject(component)) {
    errors.push({
      type: 'INVALID_VALUE',
      message: 'Common component must be an object',
      path,
    })
    return errors
  }

  if (!isDefined(component.component_name) && !isDefined(component.name)) {
    errors.push({
      type: 'MISSING_REQUIRED_FIELD',
      message: 'Common component must have a "component_name" or "name"',
      path,
    })
  }

  return errors
}

/**
 * 配列形式のバリデーションルールをバリデート
 */
function validateValidationRuleArray(
  rule: unknown,
  path: string
): ParseError[] {
  const errors: ParseError[] = []

  if (!isObject(rule)) {
    errors.push({
      type: 'INVALID_VALUE',
      message: 'Validation rule must be an object',
      path,
    })
    return errors
  }

  if (!isDefined(rule.field)) {
    errors.push({
      type: 'MISSING_REQUIRED_FIELD',
      message: 'Validation rule must have a "field"',
      path,
    })
  }

  if (!isDefined(rule.rule)) {
    errors.push({
      type: 'MISSING_REQUIRED_FIELD',
      message: 'Validation rule must have a "rule"',
      path,
    })
  }

  return errors
}

/**
 * スキーマ全体をバリデート（配列形式もサポート）
 */
function validateSchema(data: unknown): ParseError[] {
  const errors: ParseError[] = []

  if (!isObject(data)) {
    errors.push({
      type: 'SCHEMA_VALIDATION_ERROR',
      message: 'Root must be an object',
      path: '',
    })
    return errors
  }

  // view is required
  if (!isDefined(data.view)) {
    errors.push({
      type: 'MISSING_REQUIRED_FIELD',
      message: 'Schema must have a "view" section',
      path: '',
    })
  } else if (isArray(data.view)) {
    // 配列形式のviewをバリデート
    (data.view as unknown[]).forEach((screen, index) => {
      errors.push(...validateScreenDefinitionArray(screen, `view[${index}]`))
    })
  } else if (isObject(data.view)) {
    // オブジェクト形式のviewをバリデート
    for (const [screenName, screen] of Object.entries(data.view)) {
      errors.push(...validateScreenDefinition(screen, `view.${screenName}`))
    }
  } else {
    errors.push({
      type: 'INVALID_VALUE',
      message: '"view" must be an object or array',
      path: 'view',
    })
  }

  // Validate common_components if present
  if (isDefined(data.common_components)) {
    if (isArray(data.common_components)) {
      // 配列形式
      (data.common_components as unknown[]).forEach((component, index) => {
        errors.push(...validateCommonComponentArray(component, `common_components[${index}]`))
      })
    } else if (isObject(data.common_components)) {
      // オブジェクト形式
      for (const [componentName, component] of Object.entries(data.common_components)) {
        errors.push(...validateCommonComponent(component, `common_components.${componentName}`))
      }
    } else {
      errors.push({
        type: 'INVALID_VALUE',
        message: '"common_components" must be an object or array',
        path: 'common_components',
      })
    }
  }

  // Validate validations if present
  if (isDefined(data.validations)) {
    if (isArray(data.validations)) {
      // 配列形式
      (data.validations as unknown[]).forEach((rule, index) => {
        errors.push(...validateValidationRuleArray(rule, `validations[${index}]`))
      })
    } else if (isObject(data.validations)) {
      // オブジェクト形式
      for (const [ruleName, rule] of Object.entries(data.validations)) {
        errors.push(...validateValidationRule(rule, `validations.${ruleName}`))
      }
    } else {
      errors.push({
        type: 'INVALID_VALUE',
        message: '"validations" must be an object or array',
        path: 'validations',
      })
    }
  }

  return errors
}

// =============================================================================
// Parser / パーサー
// =============================================================================

/**
 * YAMLテキストをパースしてMokkunSchemaに変換
 */
export function parseYaml(yamlText: string): ParseResult<MokkunSchema> {
  try {
    // Parse YAML
    const data = yaml.load(yamlText)

    // Validate schema
    const errors = validateSchema(data)

    if (errors.length > 0) {
      return { success: false, errors }
    }

    // 正規化（配列形式をオブジェクト形式に変換）
    const normalizedData = normalizeSchema(data as MokkunSchemaRaw)

    return { success: true, data: normalizedData }
  } catch (error) {
    if (error instanceof yaml.YAMLException) {
      return {
        success: false,
        errors: [
          {
            type: 'YAML_SYNTAX_ERROR',
            message: error.message,
            line: error.mark?.line,
            column: error.mark?.column,
          },
        ],
      }
    }

    return {
      success: false,
      errors: [
        {
          type: 'YAML_SYNTAX_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      ],
    }
  }
}

/**
 * パースエラーを整形して文字列に変換
 */
export function formatParseErrors(errors: ParseError[]): string {
  return errors
    .map((error) => {
      let location = ''
      if (error.path) {
        location = ` at "${error.path}"`
      }
      if (error.line !== undefined) {
        location += ` (line ${error.line + 1}`
        if (error.column !== undefined) {
          location += `, column ${error.column + 1}`
        }
        location += ')'
      }
      return `[${error.type}]${location}: ${error.message}`
    })
    .join('\n')
}

// =============================================================================
// Utility Functions / ユーティリティ関数
// =============================================================================

/**
 * 画面定義を取得
 */
export function getScreen(
  schema: MokkunSchema,
  screenName: string
): ScreenDefinition | undefined {
  return schema.view[screenName]
}

/**
 * 全ての画面名を取得
 */
export function getScreenNames(schema: MokkunSchema): string[] {
  return Object.keys(schema.view)
}

/**
 * フィールドをIDで検索
 */
export function findFieldById(
  fields: InputField[],
  fieldId: string
): InputField | undefined {
  for (const field of fields) {
    if (field.id === fieldId) {
      return field
    }
    // Repeater内のフィールドも検索
    if (field.type === 'repeater') {
      const found = findFieldById(field.item_fields, fieldId)
      if (found) return found
    }
  }
  return undefined
}

/**
 * 共通コンポーネントを取得
 */
export function getCommonComponent(
  schema: MokkunSchema,
  componentName: string
): CommonComponent | undefined {
  return schema.common_components?.[componentName]
}

/**
 * バリデーションルールを取得
 */
export function getValidationRule(
  schema: MokkunSchema,
  ruleName: string
): ValidationRule | undefined {
  return schema.validations?.[ruleName]
}

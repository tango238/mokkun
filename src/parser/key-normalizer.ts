/**
 * YAML キー正規化
 *
 * YAML の正規形は camelCase。内部表現は snake_case のまま維持するため、
 * パーサーの入口で camelCase キーを内部の snake_case キーへ変換する。
 * snake_case の YAML（teamkit generate-ui の出力など）は変換せずそのまま通す（後方互換）。
 */

/**
 * 内部で使用する snake_case キーの完全な集合（ソート済み、113 個）。
 * schema.json のプロパティ名 / src/types/schema.ts のプロパティ名 /
 * yaml-parser.ts が読むキーの和集合。key-normalizer.test.ts で schema.json と突き合わせる。
 *
 * 注意: 内部で元から camelCase のプロパティ（dropdownItems, maxColumns, weekStartsOn, loaderType,
 * showProgress, initialProgress, ariaLabel, defaultValue）は snake_case 版と衝突するため、パーサーは snake 形で読む。
 * definition_list の group/item の maxColumns はレンダラーが camelCase で読むが、静的 renderField では無視される。
 */
export const KNOWN_KEYS: readonly string[] = [
  'accepted_formats',
  'accepted_types',
  'add_button_label',
  'allow_back',
  'app_header',
  'app_launcher',
  'app_name',
  'app_navi',
  'aria_label',
  'async_loader',
  'avatar_url',
  'browser_items',
  'calendar_from',
  'calendar_to',
  'cancel_label',
  'checked_label',
  'clickable_steps',
  'column_resize',
  'common_components',
  'component_name',
  'confirm_label',
  'currency_format',
  'current_page',
  'current_tenant_id',
  'debounce_ms',
  'default_expanded',
  'default_sort',
  'default_value',
  'disabled_when',
  'display_fields',
  'display_unit',
  'drag_drop',
  'dropdown_items',
  'empty_state',
  'field_name',
  'fixed_header',
  'float_align',
  'header_renderer',
  'help_page_url',
  'hide_on_zero',
  'include_time',
  'initial_progress',
  'input_fields',
  'input_type',
  'is_html',
  'is_main',
  'item_fields',
  'label_position',
  'loader_size',
  'loader_type',
  'loading_message',
  'logo_alt',
  'logo_href',
  'max_columns',
  'max_count',
  'max_date',
  'max_duration',
  'max_file_size',
  'max_files',
  'max_items',
  'max_length',
  'max_page_buttons',
  'max_photos',
  'max_selections',
  'max_size',
  'max_width',
  'min_date',
  'min_duration',
  'min_files',
  'min_items',
  'min_length',
  'min_search_length',
  'min_selections',
  'min_width',
  'minute_step',
  'next_condition',
  'no_options_message',
  'on_error',
  'on_resize',
  'on_success',
  'page_size',
  'page_size_options',
  'publish_toggle',
  'related_models',
  'related_usecases',
  'release_note_text',
  'row_actions',
  'section_name',
  'show_arrow',
  'show_border',
  'show_data_sync',
  'show_item_count',
  'show_jump_buttons',
  'show_open_link',
  'show_page_size_selector',
  'show_progress',
  'show_release_note',
  'show_remove_button',
  'show_search',
  'show_shadow',
  'status_map',
  'system_name',
  'table_layout',
  'total_count',
  'total_items',
  'unchecked_label',
  'use_24_hour',
  'used_in',
  'user_info',
  'validate_on_step',
  'visible_when',
  'week_starts_on',
  'z_index',
]

/** snake_case を camelCase に変換（use_24_hour → use24Hour） */
export function toCamel(snake: string): string {
  return snake.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase())
}

/** camelCase を snake_case に変換（use24Hour → use_24_hour） */
export function toSnake(camel: string): string {
  return camel
    .replace(/([a-z])(\d+)/g, '$1_$2')
    .replace(/([A-Z])/g, (c) => `_${c.toLowerCase()}`)
}

/** camelCase キー → 内部 snake_case キー */
export const CAMEL_TO_SNAKE: Record<string, string> = Object.fromEntries(
  KNOWN_KEYS.map((k) => [toCamel(k), k])
)

/**
 * 直下のキーがユーザー定義（画面名・列 id・状態名など）のため変換しないマップのキー名。
 * 値には再帰する。
 */
const VERBATIM_KEY_MAPS = new Set([
  'view',
  'common_components',
  'commonComponents',
  'validations',
  'status_map',
  'statusMap',
  'default_value',
  'defaultValue',
  'params',
  'selected_values',
  'selectedValues',
  'value',
  '_cellMerge',
])

/** 値がユーザー定義キーの行オブジェクトの配列になりうるキー（要素の直下キーは変換しない） */
const VERBATIM_ROW_ARRAYS = new Set([
  'data',
  'rows',
  'default',
  'default_value',
  'defaultValue',
  'selected_values',
  'selectedValues',
  'value',
])

/** 直下のキーが画面名・部品名などのユーザー定義名で、その値は通常の構造として扱うマップ */
const USER_NAMED_MAPS = new Set(['view', 'common_components', 'commonComponents', 'validations'])

function isPlainObject(v: unknown): v is Record<string, unknown> {
  if (typeof v !== 'object' || v === null) return false
  const proto = Object.getPrototypeOf(v)
  return proto === Object.prototype || proto === null
}

/**
 * オブジェクトを再帰的に走査し、camelCase の既知キーを snake_case に付け替える。
 * - 両方存在する場合は snake_case 側を優先し camelCase 側は捨てる
 * - view / common_components / validations / status_map / default_value / params /
 *   selected_values / value（オブジェクトのとき）の直下キーは変換しない
 * - data / rows / default / default_value / value などの配列の各オブジェクト要素（列 id などがキー）の
 *   直下キーは変換しない
 * - view 等のユーザー定義名マップの子（画面定義など）は、名前が params / value 等でも通常の構造として扱う
 * - Date など素のオブジェクト以外はそのまま返す
 */
/** プロトタイプ汚染につながる予約キー（出力から除外する） */
const RESERVED_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

export function normalizeKeysDeep(
  value: unknown,
  parentKey?: string,
  verbatimSelf = false,
  isNamedEntry = false
): unknown {
  if (Array.isArray(value)) {
    const rowItems = parentKey !== undefined && VERBATIM_ROW_ARRAYS.has(parentKey)
    return value.map((v) => normalizeKeysDeep(v, undefined, rowItems && isPlainObject(v)))
  }
  if (!isPlainObject(value)) return value

  const verbatim =
    verbatimSelf || (!isNamedEntry && parentKey !== undefined && VERBATIM_KEY_MAPS.has(parentKey))
  const childIsEntry = parentKey !== undefined && USER_NAMED_MAPS.has(parentKey) && !isNamedEntry
  const out: Record<string, unknown> = {}
  const deferred: [string, unknown][] = []
  for (const [key, v] of Object.entries(value)) {
    if (RESERVED_KEYS.has(key)) continue
    const snake =
      !verbatim && Object.prototype.hasOwnProperty.call(CAMEL_TO_SNAKE, key) ? CAMEL_TO_SNAKE[key] : key
    const child = normalizeKeysDeep(v, key, false, childIsEntry)
    if (snake !== key) {
      deferred.push([snake, child])
    } else {
      out[key] = child
    }
  }
  for (const [snake, child] of deferred) {
    if (!Object.prototype.hasOwnProperty.call(out, snake)) out[snake] = child
  }
  return out
}

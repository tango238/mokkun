/**
 * 各オブジェクトに書けるキー（schema-v2.json の additionalProperties: false と同じ）
 */

export const TOP_KEYS = ['mokkun', 'app', 'flows', 'views', 'patterns', 'rules']
export const APP_KEYS = ['name', 'layout', 'header', 'roles', 'navigation', 'notifications']
export const HEADER_KEYS = ['systemName', 'userName', 'userEmail', 'tenantName', 'helpUrl']
export const NOTICE_KEYS = ['variant', 'message', 'dismissible', 'role', 'until']
export const NAV_GROUP_KEYS = ['group', 'items', 'role']
export const NAV_ITEM_KEYS = ['view', 'label', 'icon']
export const FLOW_KEYS = ['name', 'outcome', 'role', 'steps', 'progress', 'resumable']
export const FLOW_STEP_KEYS = ['view', 'label']
export const VIEW_KEYS = ['title', 'goal', 'nav', 'role', 'layout', 'description', 'primaryAction', 'secondaryActions', 'states', 'sections']
export const STATE_KEYS = ['empty', 'loading', 'success', 'error']
export const STATE_MESSAGE_KEYS = ['message']
export const SECTION_KEYS = ['id', 'title', 'purpose', 'kind', 'reveal', 'repeatable', 'note', 'columns', 'visibleWhen', 'use', 'fields', 'list', 'actions']
export const REPEATABLE_KEYS = ['min', 'max', 'addLabel']
export const ACTION_KEYS = ['id', 'label', 'kind', 'to', 'placement', 'style', 'confirm', 'role']
/** list.rowActions[] は id / label / kind / to だけ（role・confirm・style・placement は持てない） */
export const ROW_ACTION_KEYS = ['id', 'label', 'kind', 'to']
export const CONFIRM_KEYS = ['message', 'danger']
export const LIST_KEYS = ['columns', 'rowActions', 'search', 'paging', 'selection', 'empty', 'bulkActions', 'rows']
export const COLUMN_KEYS = ['id', 'label', 'sortable', 'type', 'to', 'field']
export const PAGING_KEYS = ['pageSize']
export const CONDITION_ALLOWED_KEYS = ['item', 'equals', 'notEquals', 'in']
export const OPTION_KEYS = ['value', 'label']
export const FIELD_KEYS = [
  'item', 'label', 'component', 'required', 'whyRequired', 'example', 'help', 'format', 'default', 'options', 'multiple',
  'variant', 'inline', 'accept', 'maxSize', 'unit', 'precision', 'autocomplete', 'links', 'requiredWhen', 'to', 'value',
  'readonly', 'rules', 'visibleWhen', 'width', 'props',
]
/** 一覧セルの入力欄: item / label / 条件 / to / links / precision / accept / maxSize / rules / whyRequired / example / format は持てない */
export const COLUMN_FIELD_KEYS = [
  'component', 'required', 'help', 'default', 'options', 'multiple', 'variant', 'inline', 'unit', 'autocomplete', 'value',
  'readonly', 'width', 'props',
]
export const LINK_KEYS = ['label', 'href']

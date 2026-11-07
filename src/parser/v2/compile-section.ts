/**
 * v2 の Section を旧フォーマットの FormSection に変換する
 */

import type { DataTableColumn, DataTableField, FormSection, InputField } from '../../types/schema'
import type { FieldV2, ListColumnV2, ListV2, MokkunV2Schema, SectionV2, ViewV2 } from '../../types/schema-v2'
import { expandSectionFields, SYNTH_PREFIX } from './compile-expand'
import { applySectionCondition, compileField, type LooseField } from './compile-field'

/** 一覧セルの型 → 旧 data_table の format */
const COLUMN_FORMAT: Record<string, DataTableColumn['format']> = { text: 'text', status: 'status', date: 'date', number: 'number' }

/**
 * 列を旧 data_table の列にする。type は format に対応づけ、number は右寄せ。
 * `to`（リンク）と `field`（セルの入力欄）は旧スキーマに受け皿がないため落とす（compileV2Warnings が警告する）。
 * 旧スキーマの `field`（データキー）と取り違えないよう、キーを明示して写す。
 */
function compileColumn(c: ListColumnV2): DataTableColumn {
  // v1 の data_table は sortable 未指定を「ソート可」とみなすため、明示的に false にする
  const out: DataTableColumn = { id: c.id, label: c.label, sortable: c.sortable ?? false }
  if (c.type && COLUMN_FORMAT[c.type]) out.format = COLUMN_FORMAT[c.type]
  if (c.type === 'number') out.align = 'right'
  return out
}

function compileList(section: SectionV2, list: ListV2, emptyFallback: string | undefined): DataTableField {
  const field: DataTableField = {
    id: `${SYNTH_PREFIX}s_${section.id}`,
    type: 'data_table',
    label: section.title,
    columns: list.columns.map(compileColumn),
  }
  if (list.rows && list.rows.length > 0) {
    // 旧 data_table の行は id が必須。rows に id が無ければ 1 始まりの通し番号
    field.data = list.rows.map((r, i) => ({ id: i + 1, ...r })) as unknown as DataTableField['data']
  }
  if (list.selection) field.selection = list.selection
  if (list.rowActions && list.rowActions.length > 0) {
    field.row_actions = list.rowActions.map(a => ({ id: a.id, label: a.label, style: 'link' as const }))
  }
  if (list.paging) {
    field.pagination = { enabled: true, ...(list.paging.pageSize ? { page_size: list.paging.pageSize } : {}) }
  }
  if (list.search) field.filters = { enabled: true, show_search: true }
  const empty = list.empty ?? emptyFallback
  if (empty) field.empty_state = { title: empty }
  return field
}

/** 表示値を文字列にする（options があればラベルに置換。timeline の構造化 value は「日時 ラベル」を / でつなぐ） */
function displayValue(f: FieldV2): string {
  const raw = f.value !== undefined ? f.value : f.default
  if (raw === undefined || raw === null || raw === '') return '-'
  if (Array.isArray(raw)) {
    return raw
      .map(e => (typeof e === 'object' && e !== null ? [(e as Obj).at, (e as Obj).label, (e as Obj).text].filter(Boolean).join(' ') : String(e)))
      .join(' / ')
  }
  const hit = f.options?.find(o => String(o.value) === String(raw))
  return String(hit ? hit.label : raw)
}

type Obj = Record<string, unknown>

export function compileSection(section: SectionV2, v2: MokkunV2Schema, view: ViewV2): FormSection {
  const kind = section.kind ?? 'form'
  const expanded = expandSectionFields(section, v2.patterns)
  const pattern = section.use && v2.patterns && Object.hasOwn(v2.patterns, section.use) ? v2.patterns[section.use] : undefined
  const note = section.note ?? pattern?.note
  const body: InputField[] = []

  if (note) {
    body.push({
      id: `${SYNTH_PREFIX}n_${section.id}`,
      type: 'information_panel',
      label: '',
      description: note,
      variant: 'info',
    } as InputField)
  }

  if (kind === 'list' && section.list) {
    body.push(compileList(section, section.list, view.states?.empty?.message))
  } else if (kind === 'readonly' || kind === 'summary') {
    body.push({
      id: `${SYNTH_PREFIX}s_${section.id}`,
      type: 'definition_list',
      label: section.title,
      items: expanded.map(ef => ({ term: ef.field.label, description: displayValue(ef.field) })),
    } as InputField)
  } else {
    let inner = expanded.map(ef => compileField(ef, v2.rules))
    if (section.repeatable) {
      const r = section.repeatable
      const repeater: LooseField = {
        id: `${SYNTH_PREFIX}s_${section.id}`,
        type: 'repeater',
        // セクション名と二重にならないよう、見出しはセクション側に任せる
        label: '',
        item_fields: inner,
      }
      if (r.min !== undefined) repeater.min_items = r.min
      if (r.max !== undefined) repeater.max_items = r.max
      if (r.addLabel) repeater.add_button_label = r.addLabel
      inner = [repeater as unknown as InputField]
    }
    if (section.reveal === 'collapsed') {
      inner = [
        {
          id: `${SYNTH_PREFIX}p_${section.id}`,
          type: 'accordion_panel',
          // カードの見出しがセクション名を表示するため、トリガーには繰り返さない
          label: '入力欄を開く',
          fields: inner,
        } as InputField,
      ]
    }
    body.push(...inner)
  }

  return {
    section_name: section.title,
    input_fields: applySectionCondition(body, section.visibleWhen) as FormSection['input_fields'],
  }
}

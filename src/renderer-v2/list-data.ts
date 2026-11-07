/**
 * 一覧（kind: list）の行データと、セルの型ごとの値の整形
 * 行は list.rows（代表行）が優先。なければ列の id / ラベル / type からダミーを作る。
 */

import type { InputField } from '../types/schema'
import type { ListColumnV2, ListV2 } from '../types/schema-v2'
import { generateDummyData } from '../renderer/utils/dummy-data'
import type { ViewContext } from './context'
import { str } from './util'

const DUMMY_ROWS = 3
/** 状態の選択肢が見つからないときのダミー（従来の既定） */
const STATUS_SAMPLES = ['処理中', '出荷済み', '完了']

export type CellKind = 'id' | 'date' | 'number' | 'status' | 'text'

/** 列の種類。type があればそれに従い、なければ id / ラベルから推測する（従来どおり） */
export function columnKind(col: ListColumnV2): CellKind {
  if (col.type === 'status' || col.type === 'date' || col.type === 'number') return col.type
  const key = `${col.id} ${col.label}`
  const inferred = col.type === undefined
  if (inferred && /status|ステータス|状態/i.test(key)) return 'status'
  if (inferred && (/date|日|時刻/i.test(key) || /(At|_at)$/.test(col.id))) return 'date'
  if (inferred && /total|price|amount|qty|quantity|count|金額|単価|数量|合計|件数/i.test(key)) return 'number'
  if (/(Id|_id)$/.test(col.id) || col.id === 'id' || /ID|番号/.test(col.label)) return 'id'
  return 'text'
}

function dummyField(type: string, id: string, extra: Record<string, unknown> = {}): InputField {
  return { id, type, label: id, ...extra } as unknown as InputField
}

/**
 * 状態列のダミー値に使うラベル。同じ view の status / select / radio などの選択肢から借りる
 * （項目 id が列 id と同じか、列 id を含むもの。「すべて」は除く）。無ければ undefined
 */
export function statusLabelsFor(col: ListColumnV2, ctx: ViewContext): string[] | undefined {
  const key = col.id.toLowerCase()
  const candidates = [...ctx.fields.entries()].filter(([, f]) => (f.options?.length ?? 0) > 0)
  const hit = candidates.find(([id]) => id === col.id) ?? candidates.find(([id]) => id.toLowerCase().includes(key))
  const labels = (hit?.[1].options ?? []).filter(o => str(o.value) !== 'all' && !o.label.startsWith('すべて')).map(o => o.label)
  return labels.length > 0 ? labels : undefined
}

/** 列の id / ラベルから推測したダミー値 */
export function dummyCell(col: ListColumnV2, row: number, ctx?: ViewContext): string {
  switch (columnKind(col)) {
    case 'status': {
      const labels = (ctx && statusLabelsFor(col, ctx)) || STATUS_SAMPLES
      return labels[row % labels.length]
    }
    case 'date':
      return String(generateDummyData(dummyField('date_picker', col.id), -row * 3))
    case 'number': {
      const base = Number(generateDummyData(dummyField('number', col.id, { min: 12000, max: 9999999 }), row))
      return (base + row * 8400).toLocaleString('ja-JP')
    }
    case 'id':
      return String(10230 - row)
    default:
      return String(generateDummyData(dummyField('text', col.label), row))
  }
}

export interface ListRow {
  /** 行 ID（行の `id`、なければ先頭列の値、なければ 1 始まりの通し番号）。選択行の payload と入力欄の name に使う */
  id: string
  values: Record<string, unknown>
}

function rowIdOf(values: Record<string, unknown>, columns: ListColumnV2[], index: number): string {
  for (const v of [values.id, values[columns[0]?.id ?? '']]) {
    if ((typeof v === 'string' && v !== '') || typeof v === 'number') return String(v)
  }
  return String(index + 1)
}

/** 表示する行。empty 状態では 0 行。rows があればそれを（pageSize があれば 1 ページ目の分だけ）、なければダミー行 */
export function listRows(list: ListV2, ctx: ViewContext): { rows: ListRow[]; total: number; given: boolean } {
  const given = Array.isArray(list.rows) && list.rows.length > 0
  const source: Array<Record<string, unknown>> = given
    ? list.rows!
    : Array.from({ length: DUMMY_ROWS }, (_, r) => Object.fromEntries(list.columns.map(c => [c.id, c.field ? undefined : dummyCell(c, r, ctx)])))
  const total = source.length
  if (ctx.state === 'empty') return { rows: [], total: 0, given }
  const pageSize = list.paging?.pageSize
  const shown = given && pageSize ? source.slice(0, pageSize) : source
  return { rows: shown.map((values, i) => ({ id: rowIdOf(values, list.columns, i), values })), total, given }
}

// ---- セルの値の整形 ----

/** 日付を「2026年11月7日」にする。YYYY-MM は「2026年11月」。解釈できない値はそのまま */
export function formatDateCell(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    // YAML の日付リテラルは UTC 0 時の Date になる
    return `${value.getUTCFullYear()}年${value.getUTCMonth() + 1}月${value.getUTCDate()}日`
  }
  const m = /^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?$/.exec(str(value).trim())
  if (!m) return str(value)
  return m[3] ? `${m[1]}年${Number(m[2])}月${Number(m[3])}日` : `${m[1]}年${Number(m[2])}月`
}

/** 数値セル: 数値（と数字だけの文字列）は桁区切りにする。単位付きの文字列はそのまま */
export function formatNumberCell(value: unknown): string {
  if (typeof value === 'number') return value.toLocaleString('ja-JP')
  const text = str(value).trim()
  return /^-?\d+(\.\d+)?$/.test(text) ? Number(text).toLocaleString('ja-JP') : text
}

/** 状態ラベル → チップの色（R-I12 の割当: 完了・承認＝緑、要対応・却下＝赤、処理中＝水色、注意＝黄、その他＝灰） */
export function statusColor(label: string): string {
  if (/間近|注意|期限|保留|差戻/.test(label)) return 'yellow'
  if (/要対応|却下|不承諾|不可|失敗|エラー|欠品|廃番|無効|取下|取り下げ|キャンセル/.test(label)) return 'red'
  if (/完了|承認|内定|出荷済|発送済|登録済|有効|適正|販売中|成功|受理/.test(label)) return 'green'
  if (/処理中|審査中|確認中|準備中|対応中|配送中|進行中/.test(label)) return 'light-blue'
  return 'gray'
}

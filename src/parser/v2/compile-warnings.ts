/**
 * v2 → 旧フォーマットの変換で、旧スキーマ／旧レンダラーが表現できずに落ちるキーの一覧。
 * ビューアーはコンソールにだけ出す（画面には出さない）。仕様の「コンパイル規則」の「未対応」と対応する。
 */

import type { ActionV2, FieldV2, ListV2, MokkunV2Schema, SectionKindV2, SectionV2 } from '../../types/schema-v2'

export interface V2CompileWarning {
  /** 対象の位置（パーサーのエラーと同じ書き方。例 views.order_form.sections[0].fields[1]） */
  path: string
  /** 落ちるキー（例 unit、list.bulkActions） */
  key: string
  message: string
}

type Push = (path: string, key: string, message?: string) => void

function checkAction(a: ActionV2, path: string, push: Push): void {
  if (a.placement !== undefined) push(path, 'placement', 'placement は旧レンダラーでは無視されます（全アクションを画面ヘッダーに置きます）')
  if (a.role !== undefined) push(path, 'role')
}

/** 各キーを描画に使う component（02-schema-v2.md の表と同じ） */
const UNIT_COMPONENTS = ['text', 'number', 'time', 'combobox', 'duration']
const AUTOCOMPLETE_COMPONENTS = ['text', 'number', 'time', 'combobox', 'textarea', 'select', 'browser', 'date']
const FILE_COMPONENTS = ['file', 'photo_grid']

/**
 * 項目の警告。v2 レンダラーでも使われないキー（component が使わない）と、旧フォーマットへの変換で落ちるキーを分けて挙げる。
 * kind は Section の種類（readonly / summary では unit は number の値にだけ付く）
 */
function checkField(f: FieldV2, path: string, push: Push, kind: SectionKindV2 = 'form'): void {
  const ignored = (key: string, why: string) => push(path, key, `${key} は component "${f.component}" では使われません（${why}）`)
  if (f.width !== undefined) push(path, 'width', 'width は旧レンダラーでは無視されます')

  // unit
  if (f.unit !== undefined) {
    const display = kind === 'readonly' || kind === 'summary'
    if (!UNIT_COMPONENTS.includes(f.component)) ignored('unit', `使えるのは ${UNIT_COMPONENTS.join(' / ')}`)
    else if (display && f.component !== 'number') ignored('unit', 'readonly / summary では number の値にだけ付きます')
    else if (f.component !== 'number') push(path, 'unit', 'unit は旧スキーマでは number だけが持ちます')
  }
  // autocomplete
  if (f.autocomplete !== undefined) {
    if (!AUTOCOMPLETE_COMPONENTS.includes(f.component)) ignored('autocomplete', `使えるのは ${AUTOCOMPLETE_COMPONENTS.join(' / ')}`)
    else if (f.component === 'date' && f.autocomplete !== 'bday') ignored('autocomplete', 'date で使えるのは bday だけ')
    else push(path, 'autocomplete')
  }
  // precision
  if (f.precision === 'month') {
    if (f.inline) ignored('precision', 'inline（カレンダー表示）では年月だけの入力にならない')
    else push(path, 'precision')
  }
  // file: accept / maxSize / multiple
  for (const key of ['accept', 'maxSize'] as const) {
    if (f[key] !== undefined && !FILE_COMPONENTS.includes(f.component)) ignored(key, '使えるのは file / photo_grid')
  }
  if (f.component === 'file' && f.accept === 'image') {
    for (const key of ['multiple', 'maxSize'] as const) {
      if (f[key] !== undefined) push(path, key, `accept: image は旧フォーマットで image_uploader になり、${key} を持てないため落ちます`)
    }
  }
  if (f.component === 'photo_grid') {
    for (const key of ['accept', 'maxSize'] as const) {
      if (f[key] !== undefined) push(path, key, `${key} は旧フォーマットの photo_manager に受け皿がないため落ちます`)
    }
  }
  if (f.links !== undefined) push(path, 'links')
  if (f.requiredWhen !== undefined) push(path, 'requiredWhen')
  if (f.to !== undefined) push(path, 'to')
}

function checkList(list: ListV2, path: string, push: Push): void {
  list.columns.forEach((c, i) => {
    if (c.to !== undefined) push(`${path}.columns[${i}]`, 'to')
    if (c.field !== undefined) push(`${path}.columns[${i}]`, 'field')
  })
  list.rowActions?.forEach((a, i) => {
    if (a.to !== undefined) push(`${path}.rowActions[${i}]`, 'to', 'rowActions[].to は旧 data_table の行アクションに遷移先がないため落ちます')
  })
  if (list.bulkActions !== undefined) push(path, 'bulkActions')
}

function checkSection(section: SectionV2, path: string, push: Push): void {
  if (section.purpose !== undefined) push(path, 'purpose', 'purpose は旧スキーマに出力先がないため落ちます')
  if (section.columns !== undefined) push(path, 'columns', 'columns は旧スキーマの FormSection にレイアウト指定がないため落ちます')
  if (section.actions !== undefined) push(path, 'actions')
  if (section.list) checkList(section.list, `${path}.list`, push)
  section.fields?.forEach((f, i) => checkField(f, `${path}.fields[${i}]`, push, section.kind ?? 'form'))
}

/** 既定の文言: 「<key> は旧レンダラーでは表現できず、無視されます」 */
function defaultMessage(key: string): string {
  return `${key} は旧フォーマットに受け皿がないため、変換時に無視されます`
}

/**
 * compileV2 が旧フォーマットへ変換するときに無視するキーを列挙する（検証済みの v2 スキーマを渡す）。
 * 変換結果は変えない。
 */
export function compileV2Warnings(schema: MokkunV2Schema): V2CompileWarning[] {
  const out: V2CompileWarning[] = []
  const push: Push = (path, key, message) => out.push({ path, key, message: message ?? defaultMessage(key) })

  schema.app.navigation?.forEach((g, i) => {
    if (g.role !== undefined) push(`app.navigation[${i}]`, 'role')
  })
  schema.app.notifications?.forEach((n, i) => {
    if (n.role !== undefined) push(`app.notifications[${i}]`, 'role')
    if (n.until !== undefined) push(`app.notifications[${i}]`, 'until')
  })
  for (const [name, view] of Object.entries(schema.views)) {
    const vp = `views.${name}`
    if (view.primaryAction) checkAction(view.primaryAction, `${vp}.primaryAction`, push)
    view.secondaryActions?.forEach((a, i) => checkAction(a, `${vp}.secondaryActions[${i}]`, push))
    if (view.states?.loading) push(`${vp}.states`, 'loading', 'states.loading は旧レンダラーでは描画されません')
    view.sections.forEach((s, i) => checkSection(s, `${vp}.sections[${i}]`, push))
  }
  for (const [name, pattern] of Object.entries(schema.patterns ?? {})) {
    pattern.fields?.forEach((f, i) => checkField(f, `patterns.${name}.fields[${i}]`, push))
  }
  return out
}

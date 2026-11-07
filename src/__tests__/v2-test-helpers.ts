/**
 * v2 の新しいキーのテストで共有する最小ドキュメントの組み立て
 */

import { parseYamlV2 } from '../parser/yaml-parser'
import { parseV2, parseV2Document } from '../parser/v2/parse-v2'
import type { MokkunV2Schema } from '../types/schema-v2'

/** 最小の有効な v2 ドキュメント。over で app / views などを、viewOver で view を上書きする */
export function mk(over: Record<string, any> = {}, viewOver: Record<string, any> = {}): Record<string, any> {
  return {
    mokkun: 2,
    app: { name: 'A' },
    views: {
      v: {
        title: 'V',
        goal: 'g',
        sections: [{ id: 's', title: 'S', fields: [{ item: 'a', label: 'A', component: 'text' }] }],
        ...viewOver,
      },
      w: { title: 'W', goal: 'g', sections: [{ id: 's', title: 'S', fields: [] }] },
    },
    ...over,
  }
}

export function field(over: Record<string, any> = {}): Record<string, any> {
  return { item: 'f', label: 'F', component: 'text', ...over }
}

/** 検証済みの v2 スキーマ（失敗したら例外） */
export function load(doc: Record<string, any>): MokkunV2Schema {
  const r = parseV2Document(doc)
  if (!r.success) throw new Error(JSON.stringify(r.errors))
  return r.data
}

/** エラーの path 一覧（成功なら空） */
export function errorPaths(doc: unknown): string[] {
  const r = parseV2(doc)
  return r.success ? [] : r.errors.map(e => e.path)
}

export function errorMessages(doc: unknown): string[] {
  const r = parseV2(doc)
  return r.success ? [] : r.errors.map(e => `${e.path}: ${e.message}`)
}

export function parseText(text: string) {
  return parseYamlV2(text)
}

/** 1 つの form セクションに field を置いた view を持つスキーマ */
export function withFields(fields: Array<Record<string, any>>, viewOver: Record<string, any> = {}, over: Record<string, any> = {}): MokkunV2Schema {
  return load(mk(over, { sections: [{ id: 's', title: 'S', fields }], ...viewOver }))
}

/** list セクションを持つ view のスキーマ */
export function withList(list: Record<string, any>, viewOver: Record<string, any> = {}, over: Record<string, any> = {}): MokkunV2Schema {
  return load(mk(over, { sections: [{ id: 'l', title: 'L', kind: 'list', list }], ...viewOver }))
}

export function dom(html: string): HTMLElement {
  const el = document.createElement('div')
  el.innerHTML = html
  return el
}

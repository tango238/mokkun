/**
 * Design System Types
 * デザインシステムの切り替えを可能にするインターフェース定義
 */

import type { InputField, InputFieldType } from '../types/schema'

/**
 * フィールドレンダラー関数の型
 * InputFieldを受け取りHTML文字列を返す
 */
export type FieldRenderer = (field: InputField) => string

/**
 * デザインシステムインターフェース
 *
 * 各デザインシステム（デフォルト、Material Design等）は
 * このインターフェースを実装する。
 *
 * @example
 * ```typescript
 * const materialDesign: DesignSystem = {
 *   name: 'material',
 *   renderField(field) {
 *     // Material Design風のHTMLを生成
 *     return `<div class="mdc-text-field">...</div>`
 *   },
 * }
 * ```
 */
export interface DesignSystem {
  /** デザインシステムの識別名 */
  readonly name: string

  /**
   * フィールドをHTMLにレンダリング
   * 全フィールドタイプのレンダリングを担当する
   */
  renderField(field: InputField): string

  /**
   * 複数フィールドをまとめてレンダリング（オプション）
   * 未定義の場合、renderFieldを繰り返し呼ぶデフォルト実装が使われる
   */
  renderFields?(fields: InputField[]): string
}

/**
 * 部分的なデザインシステム定義
 * 特定のフィールドタイプのみオーバーライドし、
 * 残りはベースデザインシステムにフォールバックする
 */
export interface PartialDesignSystem {
  /** デザインシステムの識別名 */
  readonly name: string

  /**
   * フィールドタイプごとのレンダラーマップ
   * 定義されていないタイプはベースデザインシステムにフォールバック
   */
  readonly fieldRenderers: Partial<Record<InputFieldType, FieldRenderer>>

  /**
   * 複数フィールドをまとめてレンダリング（オプション）
   */
  renderFields?(fields: InputField[]): string
}

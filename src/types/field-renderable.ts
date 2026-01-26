/**
 * Field Renderable Interface
 * 静的renderFieldメソッドを持つコンポーネントの共通インターフェース
 */

import type { InputField } from './schema'

/**
 * 静的renderFieldメソッドを持つコンポーネントのインターフェース
 *
 * このインターフェースは、フォームフィールドをHTMLとしてレンダリングする
 * 静的メソッドを持つコンポーネントクラスに実装されます。
 *
 * @template T - 対応するInputFieldの型（例: TextField, SelectField）
 *
 * @example
 * ```typescript
 * export class Input implements FieldRenderable<TextField> {
 *   static renderField(field: TextField): string {
 *     // HTML生成ロジック
 *     return '<input type="text" ... />'
 *   }
 * }
 * ```
 */
export interface FieldRenderable<T extends InputField = InputField> {
  /**
   * フィールド定義からHTMLを生成する静的メソッド
   *
   * @param field - フィールド定義オブジェクト
   * @returns 生成されたHTML文字列
   */
  renderField(field: T): string
}

/**
 * FieldRenderableを実装するクラスの型
 * staticメソッドを持つクラスの型チェックに使用
 */
export interface FieldRenderableClass<T extends InputField = InputField> {
  new (...args: unknown[]): unknown
  renderField(field: T): string
}

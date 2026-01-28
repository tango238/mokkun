/**
 * Design System Registry
 * デザインシステムの登録・切り替えを管理するレジストリ
 */

import type { InputField } from '../types/schema'
import type { DesignSystem, PartialDesignSystem } from './types'

/**
 * デザインシステムレジストリ
 *
 * 複数のデザインシステムを登録し、アクティブなシステムを切り替える。
 * デフォルトデザインシステムが常にフォールバックとして機能する。
 *
 * @example
 * ```typescript
 * import { designSystemRegistry } from './design-system'
 *
 * // デザインシステムを登録
 * designSystemRegistry.register(materialDesignSystem)
 *
 * // アクティブなシステムを切り替え
 * designSystemRegistry.setActive('material')
 *
 * // フィールドをレンダリング（アクティブなシステムが使われる）
 * const html = designSystemRegistry.renderField(field)
 * ```
 */
class DesignSystemRegistry {
  private systems = new Map<string, DesignSystem>()
  private activeSystemName: string | null = null

  /**
   * デザインシステムを登録
   */
  register(system: DesignSystem): void {
    this.systems.set(system.name, system)
  }

  /**
   * 部分的なデザインシステムを登録
   * 定義されていないフィールドタイプはベースにフォールバックする
   *
   * @param partial - 部分的なデザインシステム定義
   * @param baseName - フォールバック先のデザインシステム名（デフォルト: 'default'）
   */
  registerPartial(partial: PartialDesignSystem, baseName: string = 'default'): void {
    const registry = this

    const system: DesignSystem = {
      name: partial.name,

      renderField(field: InputField): string {
        const renderer = partial.fieldRenderers[field.type]
        if (renderer) {
          return renderer(field)
        }
        // フォールバック: ベースデザインシステムを使用
        const base = registry.systems.get(baseName)
        if (base) {
          return base.renderField(field)
        }
        return `<div class="unknown-field">不明なフィールドタイプ: ${field.type}</div>`
      },

      renderFields: partial.renderFields,
    }

    this.systems.set(system.name, system)
  }

  /**
   * アクティブなデザインシステムを設定
   *
   * @param name - デザインシステム名
   * @throws 未登録のデザインシステム名が指定された場合
   */
  setActive(name: string): void {
    if (!this.systems.has(name)) {
      throw new Error(
        `[Mokkun] Design system not found: '${name}'. ` +
        `Available: ${this.getAvailable().join(', ')}`
      )
    }
    this.activeSystemName = name
  }

  /**
   * アクティブなデザインシステムを取得
   * 未設定の場合は 'default' を返す
   */
  getActive(): DesignSystem | null {
    const name = this.activeSystemName ?? 'default'
    return this.systems.get(name) ?? null
  }

  /**
   * アクティブなデザインシステム名を取得
   */
  getActiveName(): string {
    return this.activeSystemName ?? 'default'
  }

  /**
   * 登録済みのデザインシステム名一覧を取得
   */
  getAvailable(): string[] {
    return Array.from(this.systems.keys())
  }

  /**
   * 指定されたデザインシステムを取得
   */
  get(name: string): DesignSystem | undefined {
    return this.systems.get(name)
  }

  /**
   * デザインシステムの登録を解除
   * 'default' は解除不可
   */
  unregister(name: string): boolean {
    if (name === 'default') {
      return false
    }
    if (this.activeSystemName === name) {
      this.activeSystemName = null
    }
    return this.systems.delete(name)
  }

  /**
   * アクティブなデザインシステムでフィールドをレンダリング
   */
  renderField(field: InputField): string {
    const system = this.getActive()
    if (!system) {
      return `<div class="unknown-field">デザインシステムが設定されていません</div>`
    }
    return system.renderField(field)
  }

  /**
   * アクティブなデザインシステムで複数フィールドをレンダリング
   */
  renderFields(fields: InputField[]): string {
    const system = this.getActive()
    if (!system) {
      return ''
    }
    if (system.renderFields) {
      return system.renderFields(fields)
    }
    return fields.map((field) => system.renderField(field)).join('')
  }
}

/**
 * グローバルデザインシステムレジストリ（シングルトン）
 */
export const designSystemRegistry = new DesignSystemRegistry()

/**
 * Design System Module
 * デザインシステムの切り替え機能を提供
 */

export type { DesignSystem, PartialDesignSystem, FieldRenderer } from './types'
export { designSystemRegistry } from './registry'
export { defaultDesignSystem } from './default'

// デフォルトデザインシステムを自動登録
import { designSystemRegistry } from './registry'
import { defaultDesignSystem } from './default'

designSystemRegistry.register(defaultDesignSystem)

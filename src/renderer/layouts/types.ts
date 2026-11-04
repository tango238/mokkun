/**
 * Screen Layout — 画面全体の骨格（ヘッダ・セクション・アクションの配置）。layout は shell のみ
 */
import type { ScreenDefinition, InputField, Action } from '../../types/schema'

/*
 * base との約束事（レイアウト実装者向け）
 * - sticky 要素の top には `var(--viewer-header-height, 0)` を使う（ビューアは .mk-canvas 内でスクロールし、.main-content は overflow: visible。ルートの --viewer-header-height は契約として維持されるが、.mk-canvas 内では 0）。
 * - 連続する badge / chip / status_label は renderFields により <div class="form-field-inline-group"> で包まれる。
 * - generateSectionId は `section-<index>-<name>` で同名セクションでも一意。
 * - セクション先頭の heading（label がセクション名と同一）はスキップされ、data_table/browser 等のラベルがセクション名と同一ならラベルが空になる。
 */

/** セクション1つ分の描画済み部品 */
export interface RenderedSection {
  id: string
  title: string
  icon?: string
  fieldsHtml: string
  publishToggleHtml: string
}

/** レイアウト実装が利用できるヘルパー群 */
export interface LayoutHelpers {
  /** 画面タイトル＋説明文 */
  renderScreenHeader(screen: ScreenDefinition): string
  /** app_header / app_navi のマウント先コンテナ */
  renderAppLayoutContainers(screen: ScreenDefinition): string
  /** 任意のフィールド配列を描画 */
  renderFields(fields: InputField[]): string
  /** 任意のアクション配列を描画 */
  renderActions(actions: Action[]): string
  /** sections を部品に分解したもの（sections が無い画面では空配列） */
  renderSections(screen: ScreenDefinition): RenderedSection[]
  /** セクションIDを生成 */
  generateSectionId(sectionName: string, index: number): string
  escapeHtml(text: string): string
}

export interface ScreenLayout {
  /** レイアウトID */
  id: string
  /** 画面全体のHTMLを返す（`.screen` 要素を含むこと） */
  render(screen: ScreenDefinition, helpers: LayoutHelpers): string
}

/**
 * App 層: ヘッダー、グローバルナビ、パンくず、通知
 */

import type { NavGroupV2, NoticeVariantV2 } from '../types/schema-v2'
import type { ViewContext } from './context'
import { bannerIcons, breadcrumbSeparator, chevronDown, closeIcon } from './icons'
import { isExpired, visibleForRole } from './role'
import { attrs, esc, safeUrl } from './util'

const USER_ICON =
  '<svg class="dads-utility-link__lead-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentcolor" aria-hidden="true"><path d="M12 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4Zm0 2c-2.7 0-8 1.3-8 4v2h16v-2c0-2.7-5.3-4-8-4Z"/></svg>'
const TENANT_ICON =
  '<svg class="dads-utility-link__lead-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentcolor" aria-hidden="true"><path d="M4 21V5l8-2v6h8v12H4Zm2-2h3v-3H6v3Zm0-5h3v-3H6v3Zm0-5h3V6H6v3Zm5 10h3v-3h-3v3Zm0-5h3v-3h-3v3Zm5 5h2v-3h-2v3Zm0-5h2v-3h-2v3Z"/></svg>'
const EXTERNAL_ICON =
  '<svg class="dads-utility-link__tail-icon" width="16" height="16" viewBox="0 0 48 48" fill="currentcolor" role="img" aria-label="新規タブで開きます"><path d="M22 6V9H9V39H39V26H42V42H6V6H22ZM42 6V20H39V11.2L21 29L19 27L36.8 9H28V6H42Z"/></svg>'

const BANNER_TYPE: Record<NoticeVariantV2, keyof typeof bannerIcons> = {
  info: 'info-1',
  success: 'success',
  warning: 'warning',
  error: 'error',
}

/** notification-banner（app.notifications / view.states 共通） */
export function renderBanner(id: string, variant: NoticeVariantV2, message: string, dismissible = false): string {
  const type = BANNER_TYPE[variant]
  const close = dismissible
    ? `\n  <button class="dads-notification-banner__close" type="button" aria-labelledby="${esc(id)}-close" data-banner-close>
    ${closeIcon}
    <span id="${esc(id)}-close" class="dads-notification-banner__close-label">閉じる</span>
  </button>`
    : ''
  return `<div id="${esc(id)}" class="dads-notification-banner" data-style="standard" data-type="${type}">
  <h2 class="dads-notification-banner__heading">
    ${bannerIcons[type]}
    <span class="dads-notification-banner__heading-text">${esc(message)}</span>
  </h2>${close}
</div>`
}

/** 共通通知。現在のロールに向けたもので、掲示期限（until）が今日より前でないものだけ。id は定義順の通し番号 */
export function renderNotifications(ctx: ViewContext): string {
  return (ctx.schema.app.notifications ?? [])
    .map((n, i) => ({ n, i }))
    .filter(({ n }) => visibleForRole(n.role, ctx.role) && !isExpired(n.until, ctx.today))
    .map(({ n, i }) => renderBanner(`${ctx.viewName}-notice-${i + 1}`, n.variant ?? 'info', n.message, n.dismissible === true))
    .join('\n')
}

/** 現在のロールに表示するナビ group */
function navGroups(ctx: ViewContext): NavGroupV2[] {
  return (ctx.schema.app.navigation ?? []).filter(g => visibleForRole(g.role, ctx.role))
}

function viewLabel(ctx: ViewContext, view: string, label?: string): string {
  return label ?? ctx.schema.views[view]?.title ?? view
}

function navLink(ctx: ViewContext, cls: string, view: string, label: string | undefined, current: boolean, extra = ''): string {
  return `<a${attrs({ class: cls, href: `#${view}`, 'data-nav-view': view, 'aria-current': current ? 'page' : undefined })}${extra}>${esc(viewLabel(ctx, view, label))}</a>`
}

/** グローバルナビ: group が 1 項目ならリンク、複数ならサブメニューボタン + menu-list。現在地は aria-current="page" */
export function renderGlobalNav(ctx: ViewContext): string {
  const groups = navGroups(ctx)
  if (groups.length === 0) return ''
  const current = ctx.view.nav
  const items = groups.map((g, gi) => {
    if (g.items.length === 1) {
      const it = g.items[0]
      return `<li class="dads-horizontal-menu__item">${navLink(ctx, 'dads-horizontal-menu__item-inner', it.view, it.label, it.view === current)}</li>`
    }
    const menuId = `${ctx.viewName}-nav-menu-${gi + 1}`
    const hasCurrent = g.items.some(it => it.view === current)
    const links = g.items
      .map(
        it =>
          `<li>${navLink(ctx, 'dads-menu-list__item', it.view, it.label, it.view === current, ' data-type="standard" data-size="regular"')}</li>`,
      )
      .join('')
    return `<li class="dads-horizontal-menu__item">
      <button${attrs({ class: 'dads-horizontal-menu__item-inner', type: 'button', 'aria-expanded': 'false', 'aria-controls': menuId, 'aria-current': hasCurrent ? 'true' : undefined, 'data-submenu-toggle': true })}>
        <span class="dads-horizontal-menu__label">${esc(g.group)}</span>
        ${chevronDown('dads-horizontal-menu__chevron')}
      </button>
      <div id="${esc(menuId)}" class="mk2-submenu" hidden><ul class="dads-menu-list">${links}</ul></div>
    </li>`
  })
  return `<nav class="mk2-globalnav" aria-label="グローバルナビゲーション">
  <ul class="dads-horizontal-menu">
    ${items.join('\n    ')}
  </ul>
</nav>`
}

/** ヘッダー: 左にシステム名とアプリ名、右に利用者名とテナント名（utility-link） */
export function renderHeader(ctx: ViewContext): string {
  const { app } = ctx.schema
  const h = app.header ?? {}
  const meta = (icon: string, text: string, title?: string) =>
    `<span class="mk2-header__meta"${title ? ` title="${esc(title)}"` : ''}>${icon}<span class="dads-utility-link__label">${esc(text)}</span></span>`
  const right = [
    h.userName ? meta(USER_ICON, h.userName, h.userEmail) : '',
    h.tenantName ? meta(TENANT_ICON, h.tenantName) : '',
    h.helpUrl
      ? `<a class="dads-utility-link" href="${esc(safeUrl(h.helpUrl))}" target="_blank" rel="noopener noreferrer"><span class="dads-utility-link__label">ヘルプ</span> ${EXTERNAL_ICON}</a>`
      : '',
  ].join('')
  return `<header class="mk2-header">
  <div class="mk2-header__inner">
    <div class="mk2-header__brand">
      ${h.systemName ? `<span class="mk2-header__system">${esc(h.systemName)}</span>` : ''}
      <span class="mk2-header__app">${esc(app.name)}</span>
    </div>
    <div class="mk2-header__utility">${right}</div>
  </div>
  ${renderGlobalNav(ctx)}
</header>`
}

/** パンくず: アプリ名 › グループ › 画面タイトル */
export function renderBreadcrumb(ctx: ViewContext): string {
  const { app } = ctx.schema
  const groups = app.navigation ?? []
  const target = ctx.view.nav ?? ctx.viewName
  const group = groups.find(g => g.items.some(it => it.view === target))
  // アプリ名のリンク先は、現在のロールに見える最初の group の先頭
  const first = navGroups(ctx)[0]?.items[0]?.view
  const crumbs: Array<{ label: string; view?: string }> = [{ label: app.name, view: first }]
  if (group) crumbs.push({ label: group.group, view: group.items[0].view })
  const item = (label: string, view?: string) => {
    const link = view
      ? `<a class="dads-breadcrumb__link" href="#${esc(view)}" data-nav-view="${esc(view)}">${esc(label)}</a>`
      : `<span class="dads-breadcrumb__link">${esc(label)}</span>`
    return `<span class="dads-breadcrumb__item">${link}<span class="dads-breadcrumb__separator">${breadcrumbSeparator}</span></span>`
  }
  return `<nav class="dads-breadcrumb" aria-labelledby="${esc(ctx.viewName)}-breadcrumb-label">
  <span id="${esc(ctx.viewName)}-breadcrumb-label" class="dads-u-visually-hidden">現在位置</span>
  <p class="dads-breadcrumb__list">
    ${crumbs.map(c => item(c.label, c.view)).join('\n    ')}
    <span class="dads-breadcrumb__item" aria-current="page">${esc(ctx.view.title)}</span>
  </p>
</nav>`
}

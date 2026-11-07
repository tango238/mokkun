/**
 * DADS が使う SVG アイコン
 * 取得元: design-system-example-components-html の各コンポーネント HTML（dads/NOTICE.md 参照）
 */

/** select / horizontal-menu の下向きシェブロン */
export const chevronDown = (cls: string): string =>
  `<svg class="${cls}" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 17L3 8L4 7L12 15L20 7L21 8L12 17Z" fill="currentcolor"/></svg>`

export const breadcrumbSeparator =
  '<svg class="dads-breadcrumb__separator-icon" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M4.5 11L4 10.5L8 6.5L4 2.5L4.5 2L9 6.5L4.5 11Z" fill="currentcolor" /></svg>'

export const accordionChevron =
  '<svg class="dads-accordion__icon-svg" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M3.3 7.3L12 16L20.7 7.3" fill="none" stroke="currentcolor" stroke-width="2"/></svg>'

export const closeIcon =
  '<svg class="dads-notification-banner__close-icon" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="m6.4 18.6-1-1 5.5-5.6-5.6-5.6 1.1-1 5.6 5.5 5.6-5.6 1 1.1L13 12l5.6 5.6-1 1L12 13l-5.6 5.6Z" fill="currentcolor"/></svg>'

export const modalCloseIcon =
  '<svg class="dads-modal-dialog__close-icon" width="24" height="24" viewBox="0 0 120 120" aria-hidden="true"><path d="M32 95L25 88L53 60L25 32L32 25L60 53L88 25L95 32L67 60L95 88L88 95L60 67L32 95Z" fill="currentcolor"/></svg>'

/** notification-banner の種別アイコン */
export const bannerIcons = {
  'info-1':
    '<svg class="dads-notification-banner__icon" width="24" height="24" viewBox="0 0 24 24" role="img" aria-label="インフォメーション"><circle cx="12" cy="12" r="10" fill="currentcolor"/><circle cx="12" cy="8" r="1" fill="Canvas"/><path d="M11 11h2v6h-2z" fill="Canvas"/></svg>',
  success:
    '<svg class="dads-notification-banner__icon" width="24" height="24" viewBox="0 0 24 24" role="img" aria-label="成功"><circle cx="12" cy="12" r="10" fill="currentcolor"/><path d="m17.6 9.6-7 7-4.3-4.3L7.7 11l2.9 2.9 5.7-5.6 1.3 1.4Z" fill="Canvas"/></svg>',
  warning:
    '<svg class="dads-notification-banner__icon" width="24" height="24" viewBox="0 0 24 24" role="img" aria-label="警告"><path d="M1 21 12 2l11 19H1Z" fill="currentcolor"/><path d="M13 15h-2v-5h2v5Z" fill="Canvas"/><circle cx="12" cy="17" r="1" fill="Canvas"/></svg>',
  error:
    '<svg class="dads-notification-banner__icon" width="24" height="24" viewBox="0 0 24 24" role="img" aria-label="エラー"><path d="M8.25 21 3 15.75v-7.5L8.25 3h7.5L21 8.25v7.5L15.75 21h-7.5Z" fill="currentcolor"/><path d="m12 13.4-2.85 2.85-1.4-1.4L10.6 12 7.75 9.15l1.4-1.4L12 10.6l2.85-2.85 1.4 1.4L13.4 12l2.85 2.85-1.4 1.4L12 13.4Z" fill="Canvas"/></svg>',
} as const

/** step-navigation の完了アイコン（DADS 原文のまま） */
export const stepCompleted =
  '<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#666"/><path d="M10 17.5 19.8 8l-1.5-1.5-8.1 8-4.1-4L4.5 12l5.6 5.5Z" fill="#fff"/></svg>'

export const pageNavPrev =
  '<svg class="dads-button__icon" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="m7.9 12 8-8-1.4-1.4L5.1 12l9.4 9.4 1.4-1.4z" fill="currentcolor"/></svg>'
export const pageNavNext =
  '<svg class="dads-button__icon" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 2.6 7.6 4l8 8-8 8L9 21.4l9.4-9.4z" fill="currentcolor"/></svg>'

/** table の並べ替えアイコン（none / ascending / descending） */
export const sortIcons = {
  none: 'M17 18.11L21.27 14L22 14.7L16.5 20L11 14.7L11.73 14L16 18.12V4H17V18.12ZM8 5.88L12.27 10L13 9.3L7.5 4L2 9.3L2.73 10L7 5.88V20H8V5.88Z',
  ascending:
    'M17 18.12L21.27 14L22 14.7L16.5 20L11 14.7L11.73 14L16 18.12V4H17V18.12ZM14 8.92L11.73 11L9 8.52V20H6V8.52L3.27 11L1 8.93L7.5 3L14 8.93Z',
  descending:
    'M7 5.88L2.73 10L2 9.3L7.5 4L13 9.3L12.27 10L8 5.88V20H7V5.88ZM10 15.08L12.27 13L15 15.48V4H18V15.48L20.73 13L23 15.07L16.5 21L10 15.07Z',
} as const

export const sortSvg = (path: string): string =>
  `<svg class="dads-table__sort-svg" width="24" height="24" fill="currentcolor" aria-hidden="true"><path d="${path}"/></svg>`

export const calendarPrev =
  '<svg width="16" height="16" viewBox="0 0 16 16" role="img" aria-label="前の月"><path d="m5.27 8 5.33-5.33-.93-.94L3.4 8l6.27 6.27.93-.94L5.27 8Z" fill="currentcolor" /></svg>'
export const calendarNext =
  '<svg width="16" height="16" viewBox="0 0 16 16" role="img" aria-label="次の月"><path d="m6 1.73-.93.94L10.4 8l-5.33 5.33.93.94L12.27 8 6 1.73Z" fill="currentcolor" /></svg>'

export const switchCheck =
  '<svg class="dads-switch-on-off__icon" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="m10.4 16.3-4.1-4.1 1.2-1.3 2.9 2.9 6-6.1 1.3 1.2z" fill="currentcolor"/></svg>'

export const disclosureIcon =
  '<svg class="dads-disclosure__icon" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="currentcolor"/><circle class="dads-disclosure__icon-circle" cx="12" cy="12" r="8" fill="currentcolor"/><path class="dads-disclosure__icon-triangle" d="M17 10H7L12 15L17 10Z" fill="Canvas"/></svg>'

export const calendarButtonIcon =
  '<svg class="dads-date-picker__calendar-icon" width="24" height="24" viewBox="0 0 24 24" role="img" aria-label="カレンダー"><rect x="5" y="10" width="14" height="10" fill="Canvas"/><path d="M9 16.5C7.62 16.5 6.5 15.38 6.5 14C6.5 12.62 7.62 11.5 9 11.5C10.38 11.5 11.5 12.62 11.5 14C11.5 15.38 10.38 16.5 9 16.5ZM5 22C3.9 22 3 21.09 3 20V6C3 4.91 3.91 4 5 4H6V2H8V4H16V2H18V4H19C20.09 4 21 4.91 21 6V20C21 21.09 20.09 22 19 22H5ZM5 20H19V10H5V20Z" fill="currentcolor"/></svg><svg class="dads-date-picker__calendar-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 17.1L3 8L4 7L12 15L20 7L21 8L12 17.1Z" fill="currentcolor" /></svg>'

/** 新規タブで開くリンクのアイコン（上流 link/new-tab.html） */
export const externalIcon =
  '<svg class="dads-link__icon" width="16" height="16" viewBox="0 0 48 48" role="img" aria-label="新規タブで開きます"><path d="M22 6V9H9V39H39V26H42V42H6V6H22ZM42 6V20H39V11.2L21 29L19 27L36.8 9H28V6H42Z" fill="currentcolor"/></svg>'

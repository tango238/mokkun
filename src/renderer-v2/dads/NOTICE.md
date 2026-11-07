# NOTICE

このディレクトリの CSS は、デジタル庁デザインシステム（DADS）の公式 HTML 参照実装から**無改変**で取り込んだものです。
mokkun 側の都合によるスタイルは `../mokkun-v2.css` に書き、ここのファイルは編集しないでください。

- 取得元リポジトリ: https://github.com/digital-go-jp/design-system-example-components-html
- 取得元コミット: `caa50d731cf515cfa5eae0093121f11ac5299235`
- デザイントークン: `@digital-go-jp/design-tokens` 2.1.0（`global.css` が同じトークンを含む）
- ライセンス: MIT（`LICENSE` に原文。Copyright (c) 2025 デジタル庁）

## 取り込んだファイル

| ファイル | 取得元パス（`src/` 以下） |
|---|---|
| global.css | global.css |
| accordion.css | components/accordion/accordion.css |
| breadcrumb.css | components/breadcrumb/breadcrumb.css |
| button.css | components/button/button.css |
| calendar.css | components/calendar/calendar.css |
| checkbox.css | components/checkbox/checkbox.css |
| chip-label.css | components/chip-label/chip-label.css |
| date-picker.css | components/date-picker/date-picker.css |
| description-list.css | components/description-list/description-list.css |
| divider.css | components/divider/divider.css |
| disclosure.css | components/disclosure/disclosure.css |
| file-upload.css | components/file-upload/file-upload.css |
| form-control-label.css | components/form-control-label/form-control-label.css |
| heading.css | components/heading/heading.css |
| horizontal-menu.css | components/horizontal-menu/horizontal-menu.css |
| image.css | components/image/image.css |
| input-text.css | components/input-text/input-text.css |
| link.css | components/link/link.css |
| list.css | components/list/list.css |
| menu-list.css | components/menu-list/menu-list.css |
| modal-dialog.css | components/modal-dialog/modal-dialog.css |
| notification-banner.css | components/notification-banner/notification-banner.css |
| page-navigation.css | components/page-navigation/page-navigation.css |
| progress-indicator.css | components/progress-indicator/progress-indicator.css |
| radio.css | components/radio/radio.css |
| select.css | components/select/select.css |
| step-navigation.css | components/step-navigation/step-navigation.css |
| switch-on-off.css | components/switch/switch-on-off.css |
| tab.css | components/tab/tab.css |
| table.css | components/table/table.css |
| textarea.css | components/textarea/textarea.css |
| toc.css | components/toc/toc.css |
| utility-link.css | components/utility-link/utility-link.css |

HTML 参照実装の JavaScript（カスタム要素）は取り込んでいません。必要な挙動は `../mount.ts` で実装しています。

/**
 * file → file-upload / photo_grid → file-upload + 画像グリッド
 * DADS の file-upload は JS（カスタム要素）で一覧を更新する。選択ボタンと一覧更新は mount.ts で行う。
 */

import { attrs, esc, propNumber } from '../util'
import { wrapSingle, type Ctl } from './control-label'

function acceptFor(accept: string | undefined): string | undefined {
  if (!accept) return undefined
  return accept === 'image' ? 'image/*' : accept
}

function uploader(c: Ctl, accept: string | undefined, multiple: boolean): string {
  const inputId = c.domId
  const selectedId = `${c.domId}-selected`
  const labelId = `${c.domId}-label`
  const described = [selectedId, c.errorId, c.supportId].filter(Boolean).join(' ')
  return `<dads-file-upload class="dads-file-upload">
      <input${attrs({
        id: inputId,
        class: 'dads-file-upload__input',
        type: 'file',
        name: c.name,
        multiple,
        accept: acceptFor(accept),
        'data-js-input': true,
      })}>
      <div class="dads-file-upload__inner">
        <div class="dads-file-upload__drop-area" data-js-drop-area>
          <div class="dads-file-upload__button-area">
            <button${attrs({
              id: `${c.domId}-button`,
              class: 'dads-button',
              type: 'button',
              'data-type': 'outline',
              'data-size': 'md',
              'aria-labelledby': `${labelId} ${c.domId}-button`,
              'aria-describedby': described,
              'data-js-select-button': true,
            })}>ファイルを選択</button>
            <p>または、このエリア内にドラッグ＆ドロップ</p>
          </div>
          <p id="${esc(selectedId)}" class="dads-file-upload__select-summary" data-js-select-summary></p>
          <ul${attrs({ id: c.errorId, class: 'dads-file-upload__error-messages', 'data-js-error-messages': true })}>${c.error ? `<li>${esc(c.error)}</li>` : ''}</ul>
        </div>
        <p class="dads-file-upload__empty-message" data-js-empty-message>ファイルが選択されていません</p>
        <ul class="dads-file-upload__file-list" data-js-file-list hidden></ul>
      </div>
    </dads-file-upload>`
}

/** file-upload は label が for で input を指す。ボタンのラベル参照用に label へ id を付ける */
export function renderFile(c: Ctl): string {
  const html = wrapSingle(c, uploader(c, typeof c.f.accept === 'string' ? c.f.accept : undefined, c.f.multiple === true))
  return html.replace('<label class="dads-form-control-label__label"', `<label id="${esc(c.domId)}-label" class="dads-form-control-label__label"`)
}

interface Photo {
  src: string
  alt?: string
}

/** 画像グリッド（props.photos: [{ src, alt }]）+ 追加用 file-upload */
export function renderPhotoGrid(c: Ctl): string {
  const photos = Array.isArray(c.f.props?.photos) ? (c.f.props.photos as Photo[]) : []
  const cols = propNumber(c.f.props, 'columns') ?? 3
  const items = photos
    .filter(p => typeof p?.src === 'string')
    .map(p => `<li class="mk2-photo"><img src="${esc(p.src)}" alt="${esc(p.alt ?? '')}"></li>`)
    .join('')
  const grid = `<ul class="mk2-photo-grid" data-columns="${cols}" aria-label="${esc(c.f.label)}の一覧">${items}</ul>`
  const html = wrapSingle(c, `${grid}${uploader(c, 'image', true)}`)
  return html.replace('<label class="dads-form-control-label__label"', `<label id="${esc(c.domId)}-label" class="dads-form-control-label__label"`)
}

/**
 * repeatable: グループの追加・削除、添字の再採番、min / max の反映
 */

/** 添字トークン `__<n>`。id / name の末尾か、`-` / 空白の直前にあるものだけを対象にする */
const INDEX_TOKEN = /__\d+(?=$|[-\s])/
const INDEX_TOKEN_G = /__\d+(?=$|[-\s])/g
const INDEX_ATTRS = ['id', 'for', 'name', 'list', 'aria-describedby', 'aria-labelledby', 'aria-controls']

/** DOM id / name に付く `__<n>` を新しい番号へ置き換え、見出しの番号も更新する */
function reindex(group: HTMLElement, n: number): void {
  const nodes = [group, ...Array.from(group.querySelectorAll<HTMLElement>('*'))]
  for (const el of nodes) {
    for (const name of INDEX_ATTRS) {
      const v = el.getAttribute(name)
      if (v && INDEX_TOKEN.test(v)) el.setAttribute(name, v.replace(INDEX_TOKEN_G, `__${n}`))
    }
  }
  group.querySelectorAll('[data-group-no]').forEach(el => {
    el.textContent = String(n)
  })
}

function groupsOf(rep: HTMLElement): HTMLElement[] {
  const list = rep.querySelector('[data-repeat-groups]')
  return list ? Array.from(list.children).filter((c): c is HTMLElement => c instanceof HTMLElement && c.hasAttribute('data-repeat-group')) : []
}

/** 追加ボタンは max で無効に、削除ボタンは min 件のときは隠す（DADS: 使えない操作は出さない） */
function sync(rep: HTMLElement): void {
  const count = groupsOf(rep).length
  const max = rep.dataset.max ? Number(rep.dataset.max) : Infinity
  const min = Number(rep.dataset.min ?? 0)
  rep.querySelector<HTMLButtonElement>('[data-repeat-add]')!.disabled = count >= max
  rep.querySelectorAll<HTMLButtonElement>('[data-repeat-remove]').forEach(b => {
    b.hidden = count <= min
  })
}

export function syncAllRepeatables(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>('[data-repeatable]').forEach(sync)
}

/** クリックされたボタンが追加 / 削除なら処理して true を返す */
export function handleRepeatClick(target: Element): boolean {
  const add = target.closest<HTMLElement>('[data-repeat-add]')
  const remove = target.closest<HTMLElement>('[data-repeat-remove]')
  const rep = (add ?? remove)?.closest<HTMLElement>('[data-repeatable]')
  if (!rep) return false
  const list = rep.querySelector('[data-repeat-groups]')
  if (!list) return false

  if (add) {
    const max = rep.dataset.max ? Number(rep.dataset.max) : Infinity
    if (groupsOf(rep).length >= max) return true
    const template = rep.querySelector<HTMLTemplateElement>('template[data-repeat-template]')
    const group = (template?.content.cloneNode(true) as DocumentFragment | undefined)?.firstElementChild
    if (!(group instanceof HTMLElement)) return true
    reindex(group, groupsOf(rep).length + 1)
    list.appendChild(group)
  } else if (remove) {
    if (groupsOf(rep).length <= Number(rep.dataset.min ?? 0)) return true
    remove.closest('[data-repeat-group]')?.remove()
    groupsOf(rep).forEach((g, i) => reindex(g, i + 1))
  }
  sync(rep)
  return true
}

/** フォームのリセット後: 繰り返しグループを min 件に戻す（超過分は削除） */
export function resetRepeatables(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>('[data-repeatable]').forEach(rep => {
    const min = Number(rep.dataset.min ?? 0)
    groupsOf(rep)
      .slice(min)
      .forEach(g => g.remove())
    sync(rep)
  })
}

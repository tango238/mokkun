/**
 * YAML 原文表示用の軽量シンタックスハイライト（ビューアー専用・依存なし）
 */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function span(cls: string, text: string): string {
  return `<span class="mk-${cls}">${escapeHtml(text)}</span>`
}

/** クォート外の最初の `#`（直前が空白または行頭）の位置。無ければ -1 */
function findCommentStart(text: string): number {
  let quote: string | null = null
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quote) {
      if (quote === '"' && c === '\\') i++
      else if (c === quote) quote = null
    } else if (c === '"' || c === "'") {
      // 値の先頭付近のクォートのみ文字列開始とみなす（it's のような裸の値を避ける）
      const prev = text.slice(0, i).trimEnd()
      if (prev === '' || /[:\-[{,]$/.test(prev)) quote = c
    } else if (c === '#' && (i === 0 || /\s/.test(text[i - 1]))) {
      return i
    }
  }
  return -1
}

function highlightScalar(value: string): string {
  if (value === '') return ''
  const lead = value.match(/^\s*/)?.[0] ?? ''
  const body = value.slice(lead.length)
  const trail = body.match(/\s*$/)?.[0] ?? ''
  const core = body.slice(0, body.length - trail.length)
  if (core === '') return escapeHtml(value)
  let out: string
  const anchor = core.match(/^([&*][\w-]+)(\s+)?([\s\S]*)$/)
  if (anchor) {
    out = span('anchor', anchor[1]) + escapeHtml(anchor[2] ?? '') + highlightScalar(anchor[3])
  } else if (/^("(?:[^"\\]|\\.)*"|'(?:[^']|'')*')$/.test(core)) {
    out = span('str', core)
  } else if (/^(true|false|null|~|True|False|Null|TRUE|FALSE|NULL)$/.test(core)) {
    out = span('bool', core)
  } else if (/^[-+]?(\d[\d_]*)(\.\d+)?([eE][-+]?\d+)?$/.test(core) || /^0x[0-9a-fA-F]+$/.test(core)) {
    out = span('num', core)
  } else if (/^[|>][-+0-9]*$/.test(core)) {
    out = span('anchor', core)
  } else if (/^[[{]/.test(core)) {
    out = escapeHtml(core)
      .replace(/(&quot;(?:[^&]|&(?!quot;))*?&quot;|&#39;[^&]*?&#39;)/g, '<span class="mk-str">$1</span>')
  } else {
    out = span('str', core)
  }
  return escapeHtml(lead) + out + escapeHtml(trail)
}

function highlightLine(line: string): string {
  if (/^(---|\.\.\.)\s*$/.test(line)) return span('comment', line)
  const ci = findCommentStart(line)
  const code = ci >= 0 ? line.slice(0, ci) : line
  const comment = ci >= 0 ? line.slice(ci) : ''

  let out: string
  const m = code.match(/^(\s*)((?:-\s+)*)(?:("(?:[^"\\]|\\.)*"|'(?:[^']|'')*'|[^:#\s][^:#]*?)(:)(?=\s|$))?([\s\S]*)$/)
  if (m) {
    const [, indent, dashes, key, colon, rest] = m
    out = escapeHtml(indent) + escapeHtml(dashes)
    if (key !== undefined) out += span('key', key) + escapeHtml(colon)
    out += highlightScalar(rest)
  } else {
    out = escapeHtml(code)
  }
  if (comment) out += span('comment', comment)
  return out
}

/** YAML 原文を行ごとの `<span class="mk-line" data-line="n">` に変換する（HTML エスケープ済み） */
export function highlightYaml(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line, i) => `<span class="mk-line" data-line="${i + 1}">${highlightLine(line)}</span>`)
    .join('\n')
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * `view:` 直下の `<screenName>:` ブロックの行範囲（1 始まり・両端含む）を返す。
 * インデント幅は `view:` 直下の最初の子キーのものを採用する。
 */
export function findScreenRange(text: string, screenName: string): { start: number; end: number } | null {
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  const viewIdx = lines.findIndex(l => /^view:\s*(#.*)?$/.test(l))
  if (viewIdx < 0) return null

  const isBlank = (l: string): boolean => /^\s*(#.*)?$/.test(l)
  let childIndent = -1
  let viewEnd = lines.length // exclusive index
  for (let i = viewIdx + 1; i < lines.length; i++) {
    const l = lines[i]
    if (isBlank(l)) continue
    const indent = l.length - l.trimStart().length
    if (indent === 0) { viewEnd = i; break }
    if (childIndent < 0) childIndent = indent
  }
  if (childIndent < 0) return null

  const keyRe = new RegExp(
    `^ {${childIndent}}(?:${escapeRegExp(screenName)}|"${escapeRegExp(screenName)}"|'${escapeRegExp(screenName)}'):\\s*(#.*)?$`
  )
  let start = -1
  for (let i = viewIdx + 1; i < viewEnd; i++) {
    if (keyRe.test(lines[i])) { start = i; break }
  }
  if (start < 0) return null

  let end = viewEnd - 1
  for (let i = start + 1; i < viewEnd; i++) {
    const l = lines[i]
    if (isBlank(l)) continue
    const indent = l.length - l.trimStart().length
    if (indent <= childIndent) { end = i - 1; break }
  }
  // 末尾の空行・コメントのみ行は範囲に含めない
  while (end > start && isBlank(lines[end])) end--
  return { start: start + 1, end: end + 1 }
}

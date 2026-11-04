import { describe, it, expect } from 'vitest'
import { highlightYaml, findScreenRange } from '../viewer/yaml-highlight'

describe('highlightYaml', () => {
  it('escapes HTML', () => {
    const html = highlightYaml('title: "<script>alert(1)</script>"')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('wraps each line with data-line', () => {
    const html = highlightYaml('a: 1\nb: 2')
    expect(html).toContain('data-line="1"')
    expect(html).toContain('data-line="2"')
  })

  it('highlights key, string, number, bool, comment', () => {
    const html = highlightYaml('- id: foo # note\n  count: 12\n  on: true\n  label: "x # y"')
    expect(html).toContain('<span class="mk-key">id</span>')
    expect(html).toContain('<span class="mk-str">foo</span>')
    expect(html).toContain('<span class="mk-comment"># note</span>')
    expect(html).toContain('<span class="mk-num">12</span>')
    expect(html).toContain('<span class="mk-bool">true</span>')
    expect(html).toContain('<span class="mk-str">&quot;x # y&quot;</span>')
  })

  it('highlights anchors and aliases', () => {
    const html = highlightYaml('base: &b\n  x: 1\nref: *b')
    expect(html).toContain('<span class="mk-anchor">&amp;b</span>')
    expect(html).toContain('<span class="mk-anchor">*b</span>')
  })
})

describe('findScreenRange', () => {
  const yaml = [
    '# head',            // 1
    'view:',             // 2
    '  login:',          // 3
    '    title: a',      // 4
    '',                  // 5
    '  dashboard:',      // 6
    '    title: b',      // 7
    '    fields: []',    // 8
    '',                  // 9
    'other: 1',          // 10
  ].join('\n')

  it('finds the block range', () => {
    expect(findScreenRange(yaml, 'login')).toEqual({ start: 3, end: 4 })
    expect(findScreenRange(yaml, 'dashboard')).toEqual({ start: 6, end: 8 })
  })

  it('returns null when missing', () => {
    expect(findScreenRange(yaml, 'nope')).toBeNull()
    expect(findScreenRange('a: 1', 'login')).toBeNull()
  })

  it('adopts the indent width of the first child', () => {
    const y = 'view:\n    one:\n        t: 1\n    two:\n        t: 2\n'
    expect(findScreenRange(y, 'one')).toEqual({ start: 2, end: 3 })
    expect(findScreenRange(y, 'two')).toEqual({ start: 4, end: 5 })
  })

  it('escapes regex characters in screen names', () => {
    const y = 'view:\n  a.b:\n    t: 1\n  axb:\n    t: 2\n'
    expect(findScreenRange(y, 'a.b')).toEqual({ start: 2, end: 3 })
  })
})

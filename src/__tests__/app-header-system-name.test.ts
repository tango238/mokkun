/**
 * AppHeader: system_name（既定ロゴのテキスト）テスト
 */
import { parseYaml } from '../parser'
import { createAppHeader } from '../renderer/components/app-header'

describe('AppHeader system_name', () => {
  it('parser maps system_name to systemName', () => {
    const result = parseYaml(`
view:
  home:
    title: "Home"
    app_header:
      system_name: "サンプル業務システム"
      app_name: "管理コンソール"
    fields: []
`)
    expect(result.success).toBe(true)
    const header = (result as any).data.view.home.app_header
    expect(header.systemName).toBe('サンプル業務システム')
    expect(header.appName).toBe('管理コンソール')
  })

  it('renders and escapes the system name', () => {
    const el = document.createElement('div')
    createAppHeader(el, { appName: 'app', userInfo: { name: 'U' }, systemName: '<b>Sys</b>' })
    const name = el.querySelector('.app-header-logo-name')!
    expect(name.textContent).toBe('<b>Sys</b>')
    expect(name.querySelector('b')).toBeNull()
  })

  it('falls back to mokkun', () => {
    const el = document.createElement('div')
    createAppHeader(el, { appName: 'app', userInfo: { name: 'U' } })
    expect(el.querySelector('.app-header-logo-name')!.textContent).toBe('mokkun')
  })
})

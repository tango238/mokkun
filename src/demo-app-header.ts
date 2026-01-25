/**
 * AppHeader Component Demo
 */

import './style.css'
import { createAppHeader, type AppHeaderConfig, type AppHeaderCallbacks } from './renderer/components/app-header'

// =============================================================================
// Demo Setup
// =============================================================================

const container = document.getElementById('app-header-container')
const eventLog = document.getElementById('event-log')

if (!container) {
  throw new Error('Container element not found')
}

// Event logger
function logEvent(message: string): void {
  if (!eventLog) return

  const time = new Date().toLocaleTimeString()
  const entry = document.createElement('div')
  entry.textContent = `[${time}] ${message}`
  eventLog.insertBefore(entry, eventLog.firstChild)

  // Keep only last 50 entries
  while (eventLog.children.length > 50) {
    eventLog.removeChild(eventLog.lastChild!)
  }
}

// =============================================================================
// AppHeader Configuration
// =============================================================================

const config: AppHeaderConfig = {
  appName: '従業員管理',
  logoHref: '/',
  helpPageUrl: 'https://example.com/help',
  showReleaseNote: true,
  releaseNoteText: 'v2.1.0',
  showDataSync: true,
  dataSyncing: false,

  // Tenants
  tenants: [
    { id: 'tenant-1', name: '株式会社サンプル' },
    { id: 'tenant-2', name: 'テスト企業株式会社' },
    { id: 'tenant-3', name: 'デモ株式会社' },
  ],
  currentTenantId: 'tenant-1',

  // User Info
  userInfo: {
    name: '山田 太郎',
    email: 'taro.yamada@example.com',
  },

  // Navigation
  navigations: [
    { id: 'dashboard', label: 'ダッシュボード', href: '/dashboard', active: true },
    { id: 'employees', label: '従業員', href: '/employees' },
    {
      id: 'settings',
      label: '設定',
      dropdown: [
        { id: 'general', label: '一般設定' },
        { id: 'notifications', label: '通知設定' },
        { id: 'divider-1', label: '', divider: true },
        { id: 'advanced', label: '詳細設定' },
      ],
    },
    { id: 'reports', label: 'レポート', href: '/reports', disabled: true },
  ],

  // App Launcher
  appLauncher: [
    {
      id: 'hr',
      name: '人事管理',
      url: '/apps/hr',
      icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        <circle cx="10" cy="6" r="4"/>
        <path d="M2 18C2 14 5.58 11 10 11s8 3 8 7H2z"/>
      </svg>`,
    },
    {
      id: 'payroll',
      name: '給与計算',
      url: '/apps/payroll',
      icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        <rect x="2" y="4" width="16" height="12" rx="2"/>
        <text x="10" y="13" text-anchor="middle" font-size="8">¥</text>
      </svg>`,
    },
    {
      id: 'attendance',
      name: '勤怠管理',
      url: '/apps/attendance',
      icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="2"/>
        <path d="M10 5v5l3 3" stroke="currentColor" stroke-width="2" fill="none"/>
      </svg>`,
    },
    {
      id: 'workflow',
      name: 'ワークフロー',
      url: '/apps/workflow',
      icon: `<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        <rect x="2" y="3" width="6" height="4" rx="1"/>
        <rect x="12" y="3" width="6" height="4" rx="1"/>
        <rect x="7" y="13" width="6" height="4" rx="1"/>
        <path d="M5 7v3h5v3M15 7v3h-5" stroke="currentColor" stroke-width="1.5" fill="none"/>
      </svg>`,
    },
  ],
}

// =============================================================================
// Callbacks
// =============================================================================

const callbacks: AppHeaderCallbacks = {
  onTenantChange: (tenantId) => {
    logEvent(`Tenant changed: ${tenantId}`)
  },

  onNavClick: (navId, href) => {
    logEvent(`Navigation clicked: ${navId} (href: ${href ?? 'none'})`)
  },

  onDropdownItemClick: (navId, itemId, href) => {
    logEvent(`Dropdown item clicked: ${navId} > ${itemId} (href: ${href ?? 'none'})`)
  },

  onUserMenuClick: (action) => {
    logEvent(`User menu action: ${action}`)
    if (action === 'logout') {
      if (confirm('ログアウトしますか？')) {
        logEvent('User confirmed logout')
      } else {
        logEvent('User cancelled logout')
      }
    }
  },

  onAppLauncherClick: (appId, url) => {
    logEvent(`App launcher clicked: ${appId} (url: ${url})`)
  },

  onHelpClick: () => {
    logEvent('Help clicked')
  },

  onLogoClick: () => {
    logEvent('Logo clicked')
  },
}

// =============================================================================
// Create AppHeader
// =============================================================================

const appHeader = createAppHeader(container, config, callbacks)

logEvent('AppHeader initialized')

// Export for debugging
declare global {
  interface Window {
    appHeader: typeof appHeader
    appHeaderConfig: typeof config
  }
}

window.appHeader = appHeader
window.appHeaderConfig = config

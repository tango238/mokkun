/**
 * SearchInput Component Demo
 */

import './style.css'
import { createSearchInput, type SearchInput } from './renderer/components/search-input'

// =============================================================================
// Event Logger
// =============================================================================

const eventLog = document.getElementById('event-log')

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
// Basic SearchInput
// =============================================================================

const basicContainer = document.getElementById('search-basic')
if (basicContainer) {
  createSearchInput(basicContainer, {
    placeholder: 'Search...',
    size: 'medium',
  }, {
    onChange: (value) => {
      logEvent(`Basic - onChange: "${value}"`)
    },
    onSearch: (value) => {
      logEvent(`Basic - onSearch: "${value}"`)
    },
    onClear: () => {
      logEvent('Basic - onClear')
    },
  })
}

// =============================================================================
// Size Variations
// =============================================================================

const smallContainer = document.getElementById('search-small')
if (smallContainer) {
  createSearchInput(smallContainer, {
    placeholder: 'Small search...',
    size: 'small',
  }, {
    onChange: (value) => {
      logEvent(`Small - onChange: "${value}"`)
    },
  })
}

const mediumContainer = document.getElementById('search-medium')
if (mediumContainer) {
  createSearchInput(mediumContainer, {
    placeholder: 'Medium search...',
    size: 'medium',
  }, {
    onChange: (value) => {
      logEvent(`Medium - onChange: "${value}"`)
    },
  })
}

const largeContainer = document.getElementById('search-large')
if (largeContainer) {
  createSearchInput(largeContainer, {
    placeholder: 'Large search...',
    size: 'large',
  }, {
    onChange: (value) => {
      logEvent(`Large - onChange: "${value}"`)
    },
  })
}

// =============================================================================
// Keyboard Shortcut
// =============================================================================

const shortcutContainer = document.getElementById('search-with-shortcut')
if (shortcutContainer) {
  createSearchInput(shortcutContainer, {
    placeholder: 'Press ⌘K or Ctrl+K to focus...',
    shortcut: { modifier: 'cmd', key: 'k' },
  }, {
    onFocus: () => {
      logEvent('Shortcut - onFocus (triggered by keyboard shortcut)')
    },
    onChange: (value) => {
      logEvent(`Shortcut - onChange: "${value}"`)
    },
    onSearch: (value) => {
      logEvent(`Shortcut - onSearch: "${value}"`)
    },
  })
}

// =============================================================================
// Debounce Search
// =============================================================================

const debounceContainer = document.getElementById('search-debounce')
if (debounceContainer) {
  createSearchInput(debounceContainer, {
    placeholder: 'Type to search (300ms debounce)...',
    debounceMs: 300,
  }, {
    onChange: (value) => {
      logEvent(`Debounce - onChange: "${value}"`)
    },
    onSearch: (value) => {
      logEvent(`Debounce - onSearch (after 300ms): "${value}"`)
    },
  })
}

// =============================================================================
// Loading State
// =============================================================================

const loadingContainer = document.getElementById('search-loading')
let loadingInstance: SearchInput | null = null

if (loadingContainer) {
  loadingInstance = createSearchInput(loadingContainer, {
    placeholder: 'Searching...',
    loading: true,
  }, {
    onSearch: (value) => {
      logEvent(`Loading - onSearch: "${value}"`)
      if (loadingInstance) {
        loadingInstance.setLoading(true)
        setTimeout(() => {
          if (loadingInstance) {
            loadingInstance.setLoading(false)
            logEvent('Loading - Search completed')
          }
        }, 2000)
      }
    },
  })
}

// Global functions for loading controls
declare global {
  interface Window {
    toggleLoading: () => void
    simulateSearch: () => void
    toggleDisabled: () => void
    searchTableInstance: SearchInput | null
  }
}

window.toggleLoading = () => {
  if (loadingInstance) {
    const currentState = loadingInstance.getState()
    loadingInstance.setLoading(!currentState.loading)
    logEvent(`Loading - toggled to ${!currentState.loading}`)
  }
}

window.simulateSearch = () => {
  if (loadingInstance) {
    loadingInstance.setLoading(true)
    logEvent('Loading - Simulating search...')
    setTimeout(() => {
      if (loadingInstance) {
        loadingInstance.setLoading(false)
        logEvent('Loading - Search completed')
      }
    }, 2000)
  }
}

// =============================================================================
// Disabled State
// =============================================================================

const disabledContainer = document.getElementById('search-disabled')
let disabledInstance: SearchInput | null = null

if (disabledContainer) {
  disabledInstance = createSearchInput(disabledContainer, {
    placeholder: 'This input is disabled',
    disabled: true,
    defaultValue: 'Disabled search input',
  })
}

window.toggleDisabled = () => {
  if (disabledInstance) {
    const currentState = disabledInstance.getState()
    disabledInstance.setDisabled(!currentState.disabled)
    logEvent(`Disabled - toggled to ${!currentState.disabled}`)
  }
}

// =============================================================================
// Table Search Example
// =============================================================================

const tableContainer = document.getElementById('search-table')
const userTable = document.getElementById('user-table')
const noResults = document.getElementById('no-results')

interface TableRow {
  id: string
  name: string
  email: string
  department: string
  element: HTMLTableRowElement
}

let tableData: TableRow[] = []

if (userTable) {
  const tbody = userTable.querySelector('tbody')
  if (tbody) {
    const rows = Array.from(tbody.querySelectorAll('tr')) as HTMLTableRowElement[]
    tableData = rows.map((row) => {
      const cells = row.querySelectorAll('td')
      return {
        id: cells[0]?.textContent?.trim() ?? '',
        name: cells[1]?.textContent?.trim() ?? '',
        email: cells[2]?.textContent?.trim() ?? '',
        department: cells[3]?.textContent?.trim() ?? '',
        element: row,
      }
    })
  }
}

function filterTable(searchValue: string): void {
  const query = searchValue.toLowerCase().trim()

  if (!query) {
    // Show all rows
    tableData.forEach(row => {
      row.element.classList.remove('hidden')
    })
    if (noResults) {
      noResults.style.display = 'none'
    }
    return
  }

  let visibleCount = 0

  tableData.forEach(row => {
    const matches =
      row.id.toLowerCase().includes(query) ||
      row.name.toLowerCase().includes(query) ||
      row.email.toLowerCase().includes(query) ||
      row.department.toLowerCase().includes(query)

    if (matches) {
      row.element.classList.remove('hidden')
      visibleCount++
    } else {
      row.element.classList.add('hidden')
    }
  })

  if (noResults) {
    noResults.style.display = visibleCount === 0 ? 'block' : 'none'
  }
}

if (tableContainer) {
  const tableSearchInstance = createSearchInput(tableContainer, {
    placeholder: 'ユーザー名、メール、部署で検索...',
    debounceMs: 200,
    shortcut: { modifier: 'cmd', key: 'f' },
  }, {
    onChange: (value) => {
      filterTable(value)
      logEvent(`Table - Filtering with: "${value}"`)
    },
    onSearch: (value) => {
      logEvent(`Table - Search executed: "${value}"`)
    },
    onClear: () => {
      filterTable('')
      logEvent('Table - Cleared filters')
    },
  })

  window.searchTableInstance = tableSearchInstance
}

// =============================================================================
// Initialization
// =============================================================================

logEvent('SearchInput demos initialized')
logEvent('Try using keyboard shortcuts: ⌘K (or Ctrl+K) and ⌘F (or Ctrl+F)')

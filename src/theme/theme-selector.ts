/**
 * Theme Selector UI Component
 * テーマ選択UIコンポーネント
 */

import { themeManager, onThemeChange } from './theme-manager'
import type { ThemeDefinition, ThemeChangeEventDetail } from '../types/theme'

/**
 * Render theme selector dropdown HTML
 */
export function renderThemeSelector(): string {
  const themes = themeManager.getAvailableThemes()
  const currentTheme = themeManager.getCurrentTheme()

  const options = themes
    .map(theme => {
      const selected = theme.id === currentTheme ? 'selected' : ''
      return `<option value="${theme.id}" ${selected}>${theme.name}</option>`
    })
    .join('')

  return `
    <div class="theme-selector-wrapper">
      <label for="theme-selector" class="theme-selector-label">テーマ:</label>
      <select id="theme-selector" class="theme-selector">
        ${options}
      </select>
    </div>
  `
}

/**
 * Render theme selector with preview
 */
export function renderThemeSelectorWithPreview(): string {
  const themes = themeManager.getAvailableThemes()
  const currentTheme = themeManager.getCurrentTheme()

  const themeCards = themes
    .map(theme => renderThemeCard(theme, theme.id === currentTheme))
    .join('')

  return `
    <div class="theme-selector-preview">
      <h3 class="theme-selector-title">テーマ選択</h3>
      <div class="theme-cards">
        ${themeCards}
      </div>
    </div>
  `
}

/**
 * Render a single theme card
 */
function renderThemeCard(theme: ThemeDefinition, isActive: boolean): string {
  const activeClass = isActive ? 'active' : ''

  return `
    <button
      class="theme-card ${activeClass}"
      data-theme-id="${theme.id}"
      type="button"
      aria-pressed="${isActive}"
    >
      <div class="theme-card-preview theme-preview-${theme.id}">
        <div class="preview-header"></div>
        <div class="preview-content">
          <div class="preview-sidebar"></div>
          <div class="preview-main">
            <div class="preview-line"></div>
            <div class="preview-line short"></div>
          </div>
        </div>
      </div>
      <div class="theme-card-info">
        <span class="theme-card-name">${theme.name}</span>
        ${theme.description ? `<span class="theme-card-description">${theme.description}</span>` : ''}
      </div>
      ${isActive ? '<span class="theme-card-check">✓</span>' : ''}
    </button>
  `
}

/**
 * Attach event listeners to theme selector
 */
export function attachThemeSelectorListeners(): void {
  // Dropdown selector
  const selector = document.getElementById('theme-selector') as HTMLSelectElement
  if (selector) {
    selector.addEventListener('change', () => {
      themeManager.applyTheme(selector.value)
    })
  }

  // Theme cards
  const themeCards = document.querySelectorAll('.theme-card')
  themeCards.forEach(card => {
    card.addEventListener('click', () => {
      const themeId = card.getAttribute('data-theme-id')
      if (themeId) {
        themeManager.applyTheme(themeId)
        updateThemeCardsState(themeId)
      }
    })
  })
}

/**
 * Update theme cards active state
 */
function updateThemeCardsState(activeThemeId: string): void {
  const themeCards = document.querySelectorAll('.theme-card')
  themeCards.forEach(card => {
    const cardThemeId = card.getAttribute('data-theme-id')
    const isActive = cardThemeId === activeThemeId

    card.classList.toggle('active', isActive)
    card.setAttribute('aria-pressed', String(isActive))

    // Update check mark
    const existingCheck = card.querySelector('.theme-card-check')
    if (isActive && !existingCheck) {
      const check = document.createElement('span')
      check.className = 'theme-card-check'
      check.textContent = '✓'
      card.appendChild(check)
    } else if (!isActive && existingCheck) {
      existingCheck.remove()
    }
  })
}

/**
 * Sync dropdown selector with current theme
 */
export function syncThemeSelectorDropdown(): void {
  const selector = document.getElementById('theme-selector') as HTMLSelectElement
  const currentTheme = themeManager.getCurrentTheme()

  if (selector && currentTheme) {
    selector.value = currentTheme
  }
}

/**
 * Auto-sync selector when theme changes
 */
export function setupThemeSelectorSync(): () => void {
  return onThemeChange((detail: ThemeChangeEventDetail) => {
    syncThemeSelectorDropdown()
    updateThemeCardsState(detail.currentTheme)
  })
}

/**
 * Loader Component Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Loader, createLoader } from '../renderer/components/loader'
import type { LoaderConfig, LoaderCallbacks } from '../types/schema'

describe('Loader Component', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    container.remove()
    // Clean up any overlay elements
    document.querySelectorAll('.loader-overlay').forEach((el) => el.remove())
    document.body.classList.remove('loader-open')
  })

  // ===========================================================================
  // Initialization Tests
  // ===========================================================================

  describe('Initialization', () => {
    it('should initialize with default config', () => {
      const loader = new Loader(container)
      const state = loader.getState()

      expect(state.isVisible).toBe(false)
      expect(state.progress).toBeUndefined()
      expect(state.text).toBeUndefined()
    })

    it('should initialize in hidden state', () => {
      const loader = new Loader(container, { size: 'medium' })
      const state = loader.getState()

      expect(state.isVisible).toBe(false)
      expect(container.children.length).toBe(0)
    })

    it('should auto-show if autoShow is true', async () => {
      const loader = new Loader(container, { autoShow: true })

      // Wait for setTimeout to execute
      await new Promise((resolve) => setTimeout(resolve, 10))

      const state = loader.getState()
      expect(state.isVisible).toBe(true)
      expect(container.querySelector('.mokkun-loader')).toBeTruthy()
    })

    it('should accept null container for overlay mode', () => {
      const loader = new Loader(null, { overlay: true })
      expect(loader).toBeTruthy()
    })

    it('should create loader with factory function', () => {
      const loader = createLoader(container)
      expect(loader).toBeInstanceOf(Loader)
    })
  })

  // ===========================================================================
  // Size Variant Tests
  // ===========================================================================

  describe('Size Variants', () => {
    it('should render small size (16px)', () => {
      const loader = new Loader(container, { size: 'small' })
      loader.show()

      const spinner = container.querySelector('.loader-spinner')
      expect(spinner).toBeTruthy()
      expect(spinner?.getAttribute('data-size')).toBe('small')
    })

    it('should render medium size (32px, default)', () => {
      const loader = new Loader(container)
      loader.show()

      const spinner = container.querySelector('.loader-spinner')
      expect(spinner).toBeTruthy()
      expect(spinner?.getAttribute('data-size')).toBe('medium')
    })

    it('should render large size (48px)', () => {
      const loader = new Loader(container, { size: 'large' })
      loader.show()

      const spinner = container.querySelector('.loader-spinner')
      expect(spinner).toBeTruthy()
      expect(spinner?.getAttribute('data-size')).toBe('large')
    })

    it('should apply correct data-size attribute', () => {
      const loader = new Loader(container, { size: 'large' })
      loader.show()

      const spinner = container.querySelector('.loader-spinner')
      expect(spinner?.getAttribute('data-size')).toBe('large')
    })
  })

  // ===========================================================================
  // Type Variant Tests
  // ===========================================================================

  describe('Type Variants', () => {
    it('should render primary type (default)', () => {
      const loader = new Loader(container)
      loader.show()

      const spinner = container.querySelector('.loader-spinner')
      expect(spinner?.getAttribute('data-type')).toBe('primary')
    })

    it('should render light type', () => {
      const loader = new Loader(container, { type: 'light' })
      loader.show()

      const spinner = container.querySelector('.loader-spinner')
      expect(spinner?.getAttribute('data-type')).toBe('light')
    })

    it('should apply correct data-type attribute', () => {
      const loader = new Loader(container, { type: 'light' })
      loader.show()

      const spinner = container.querySelector('.loader-spinner')
      expect(spinner?.getAttribute('data-type')).toBe('light')
    })
  })

  // ===========================================================================
  // Display Mode Tests
  // ===========================================================================

  describe('Display Modes', () => {
    it('should render inline mode in container', () => {
      const loader = new Loader(container, { overlay: false })
      loader.show()

      expect(container.querySelector('.mokkun-loader')).toBeTruthy()
      expect(document.querySelector('.loader-overlay')).toBeFalsy()
    })

    it('should render overlay mode appended to body', () => {
      const loader = new Loader(null, { overlay: true })
      loader.show()

      const overlay = document.querySelector('.loader-overlay')
      expect(overlay).toBeTruthy()
      expect(overlay?.parentElement).toBe(document.body)
    })

    it('should prevent body scroll in overlay mode', () => {
      const loader = new Loader(null, { overlay: true })
      loader.show()

      expect(document.body.classList.contains('loader-open')).toBe(true)
    })

    it('should have correct z-index for overlay (9999)', () => {
      const loader = new Loader(null, { overlay: true })
      loader.show()

      const overlay = document.querySelector('.loader-overlay') as HTMLElement
      expect(overlay).toBeTruthy()
      // Note: z-index is set via CSS, not inline style
      expect(overlay.classList.contains('loader-overlay')).toBe(true)
    })
  })

  // ===========================================================================
  // Show/Hide Tests
  // ===========================================================================

  describe('Show/Hide', () => {
    it('should make loader visible when show() is called', () => {
      const loader = new Loader(container)
      loader.show()

      const state = loader.getState()
      expect(state.isVisible).toBe(true)
      expect(container.querySelector('.mokkun-loader')).toBeTruthy()
    })

    it('should make loader hidden when hide() is called', () => {
      const loader = new Loader(container)
      loader.show()
      loader.hide()

      const state = loader.getState()
      expect(state.isVisible).toBe(false)
      expect(container.querySelector('.mokkun-loader')).toBeFalsy()
    })

    it('should restore body scroll when overlay is hidden', () => {
      const loader = new Loader(null, { overlay: true })
      loader.show()
      expect(document.body.classList.contains('loader-open')).toBe(true)

      loader.hide()
      expect(document.body.classList.contains('loader-open')).toBe(false)
    })

    it('should remove overlay from body when hidden', () => {
      const loader = new Loader(null, { overlay: true })
      loader.show()
      expect(document.querySelector('.loader-overlay')).toBeTruthy()

      loader.hide()
      expect(document.querySelector('.loader-overlay')).toBeFalsy()
    })

    it('should call onShow callback', () => {
      const onShow = vi.fn()
      const loader = new Loader(container, {}, { onShow })

      loader.show()
      expect(onShow).toHaveBeenCalledTimes(1)
    })

    it('should call onHide callback', () => {
      const onHide = vi.fn()
      const loader = new Loader(container, {}, { onHide })

      loader.show()
      loader.hide()
      expect(onHide).toHaveBeenCalledTimes(1)
    })

    it('should handle rapid show/hide calls', () => {
      const loader = new Loader(container)

      loader.show()
      loader.show() // Should not error
      expect(loader.getState().isVisible).toBe(true)

      loader.hide()
      loader.hide() // Should not error
      expect(loader.getState().isVisible).toBe(false)
    })
  })

  // ===========================================================================
  // Progress Tests
  // ===========================================================================

  describe('Progress', () => {
    it('should render progress bar when progress is set', () => {
      const loader = new Loader(container, { progress: 50 })
      loader.show()

      const progressBar = container.querySelector('.loader-progress')
      expect(progressBar).toBeTruthy()
    })

    it('should update progress bar width with setProgress()', () => {
      const loader = new Loader(container, { progress: 0 })
      loader.show()

      loader.setProgress(75)

      const progressFill = container.querySelector('.loader-progress-fill') as HTMLElement
      expect(progressFill?.style.width).toBe('75%')
    })

    it('should clamp progress values to 0-100', () => {
      const loader = new Loader(container, { progress: 0 })
      loader.show()

      loader.setProgress(150)
      expect(loader.getState().progress).toBe(100)

      loader.setProgress(-50)
      expect(loader.getState().progress).toBe(0)
    })

    it('should have role="progressbar" on progress bar', () => {
      const loader = new Loader(container, { progress: 50 })
      loader.show()

      const progressBar = container.querySelector('.loader-progress')
      expect(progressBar?.getAttribute('role')).toBe('progressbar')
    })

    it('should update aria-valuenow when progress changes', () => {
      const loader = new Loader(container, { progress: 0 })
      loader.show()

      loader.setProgress(60)

      const progressBar = container.querySelector('.loader-progress')
      expect(progressBar?.getAttribute('aria-valuenow')).toBe('60')
    })

    it('should have correct aria-valuemin and aria-valuemax', () => {
      const loader = new Loader(container, { progress: 50 })
      loader.show()

      const progressBar = container.querySelector('.loader-progress')
      expect(progressBar?.getAttribute('aria-valuemin')).toBe('0')
      expect(progressBar?.getAttribute('aria-valuemax')).toBe('100')
    })

    it('should call onProgressUpdate callback', () => {
      const onProgressUpdate = vi.fn()
      const loader = new Loader(container, { progress: 0 }, { onProgressUpdate })

      loader.setProgress(80)
      expect(onProgressUpdate).toHaveBeenCalledWith(80)
    })

    it('should handle progress updates while hidden', () => {
      const loader = new Loader(container, { progress: 0 })

      loader.setProgress(50)
      expect(loader.getState().progress).toBe(50)

      // Should not error even though loader is not visible
      loader.show()
      const progressFill = container.querySelector('.loader-progress-fill') as HTMLElement
      expect(progressFill?.style.width).toBe('50%')
    })
  })

  // ===========================================================================
  // Text Tests
  // ===========================================================================

  describe('Text', () => {
    it('should render text when provided in config', () => {
      const loader = new Loader(container, { text: 'Loading data...' })
      loader.show()

      const textElement = container.querySelector('.loader-text')
      expect(textElement?.textContent).toBe('Loading data...')
    })

    it('should update text with setText()', () => {
      const loader = new Loader(container, { text: 'Loading...' })
      loader.show()

      loader.setText('Almost done...')

      const textElement = container.querySelector('.loader-text')
      expect(textElement?.textContent).toBe('Almost done...')
    })

    it('should have aria-live="polite" on text element', () => {
      const loader = new Loader(container, { text: 'Loading...' })
      loader.show()

      const textElement = container.querySelector('.loader-text')
      expect(textElement?.getAttribute('aria-live')).toBe('polite')
    })

    it('should handle text updates while hidden', () => {
      const loader = new Loader(container, { text: 'Loading...' })

      loader.setText('Updated text')
      expect(loader.getState().text).toBe('Updated text')

      // Text should appear when shown
      loader.show()
      const textElement = container.querySelector('.loader-text')
      expect(textElement?.textContent).toBe('Updated text')
    })

    it('should not render text element when text is not provided', () => {
      const loader = new Loader(container)
      loader.show()

      const textElement = container.querySelector('.loader-text')
      expect(textElement).toBeFalsy()
    })
  })

  // ===========================================================================
  // Accessibility Tests
  // ===========================================================================

  describe('Accessibility', () => {
    it('should have role="status" on inline loader', () => {
      const loader = new Loader(container)
      loader.show()

      const loaderElement = container.querySelector('.mokkun-loader')
      expect(loaderElement?.getAttribute('role')).toBe('status')
    })

    it('should have aria-label attribute', () => {
      const loader = new Loader(container, { ariaLabel: 'Loading content' })
      loader.show()

      const loaderElement = container.querySelector('.mokkun-loader')
      expect(loaderElement?.getAttribute('aria-label')).toBe('Loading content')
    })

    it('should have default aria-label if not provided', () => {
      const loader = new Loader(container)
      loader.show()

      const loaderElement = container.querySelector('.mokkun-loader')
      expect(loaderElement?.getAttribute('aria-label')).toBe('Loading')
    })

    it('should have aria-modal="true" on overlay', () => {
      const loader = new Loader(null, { overlay: true })
      loader.show()

      const overlay = document.querySelector('.loader-overlay')
      expect(overlay?.getAttribute('aria-modal')).toBe('true')
    })

    it('should have aria-busy="true" on overlay', () => {
      const loader = new Loader(null, { overlay: true })
      loader.show()

      const overlay = document.querySelector('.loader-overlay')
      expect(overlay?.getAttribute('aria-busy')).toBe('true')
    })

    it('should have aria-hidden="true" on spinner (decorative)', () => {
      const loader = new Loader(container)
      loader.show()

      const spinner = container.querySelector('.loader-spinner')
      expect(spinner?.getAttribute('aria-hidden')).toBe('true')
    })

    it('should announce text updates via aria-live', () => {
      const loader = new Loader(container, { text: 'Loading...' })
      loader.show()

      const textElement = container.querySelector('.loader-text')
      expect(textElement?.getAttribute('aria-live')).toBe('polite')

      loader.setText('Almost done...')
      expect(textElement?.textContent).toBe('Almost done...')
    })
  })

  // ===========================================================================
  // State Management Tests
  // ===========================================================================

  describe('State Management', () => {
    it('should return current state with getState()', () => {
      const loader = new Loader(container, { progress: 50, text: 'Loading...' })
      const state = loader.getState()

      expect(state.isVisible).toBe(false)
      expect(state.progress).toBe(50)
      expect(state.text).toBe('Loading...')
    })

    it('should return immutable state (new object on update)', () => {
      const loader = new Loader(container)
      const state1 = loader.getState()

      loader.show()
      const state2 = loader.getState()

      expect(state1).not.toBe(state2) // Different object references
      expect(state1.isVisible).toBe(false)
      expect(state2.isVisible).toBe(true)
    })

    it('should update state immutably when setting progress', () => {
      const loader = new Loader(container, { progress: 0 })
      const state1 = loader.getState()

      loader.setProgress(50)
      const state2 = loader.getState()

      expect(state1).not.toBe(state2) // Different object references
      expect(state1.progress).toBe(0)
      expect(state2.progress).toBe(50)
    })

    it('should update state immutably when setting text', () => {
      const loader = new Loader(container)
      const state1 = loader.getState()

      loader.setText('New text')
      const state2 = loader.getState()

      expect(state1).not.toBe(state2) // Different object references
      expect(state1.text).toBeUndefined()
      expect(state2.text).toBe('New text')
    })
  })

  // ===========================================================================
  // Cleanup Tests
  // ===========================================================================

  describe('Cleanup', () => {
    it('should remove all DOM elements on destroy()', () => {
      const loader = new Loader(container)
      loader.show()
      expect(container.querySelector('.mokkun-loader')).toBeTruthy()

      loader.destroy()
      expect(container.querySelector('.mokkun-loader')).toBeFalsy()
    })

    it('should restore body scroll on destroy()', () => {
      const loader = new Loader(null, { overlay: true })
      loader.show()
      expect(document.body.classList.contains('loader-open')).toBe(true)

      loader.destroy()
      expect(document.body.classList.contains('loader-open')).toBe(false)
    })

    it('should cleanup overlay from body on destroy()', () => {
      const loader = new Loader(null, { overlay: true })
      loader.show()
      expect(document.querySelector('.loader-overlay')).toBeTruthy()

      loader.destroy()
      expect(document.querySelector('.loader-overlay')).toBeFalsy()
    })

    it('should set state to hidden on destroy()', () => {
      const loader = new Loader(container)
      loader.show()
      expect(loader.getState().isVisible).toBe(true)

      loader.destroy()
      expect(loader.getState().isVisible).toBe(false)
    })

    it('should not error when destroy() is called multiple times', () => {
      const loader = new Loader(container)
      loader.show()

      expect(() => {
        loader.destroy()
        loader.destroy()
      }).not.toThrow()
    })
  })

  // ===========================================================================
  // Edge Cases
  // ===========================================================================

  describe('Edge Cases', () => {
    it('should handle null container for overlay mode gracefully', () => {
      const loader = new Loader(null, { overlay: true })
      expect(() => loader.show()).not.toThrow()
      expect(document.querySelector('.loader-overlay')).toBeTruthy()
    })

    it('should warn when null container is used for inline mode', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const loader = new Loader(null, { overlay: false })
      loader.show()

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('No container provided for inline mode')
      )

      consoleSpy.mockRestore()
    })

    it('should handle rapid show/hide/show cycles', () => {
      const loader = new Loader(container)

      loader.show()
      expect(loader.getState().isVisible).toBe(true)

      loader.hide()
      expect(loader.getState().isVisible).toBe(false)

      loader.show()
      expect(loader.getState().isVisible).toBe(true)
      expect(container.querySelector('.mokkun-loader')).toBeTruthy()
    })

    it('should handle progress updates while hidden', () => {
      const loader = new Loader(container, { progress: 0 })

      // Update progress while hidden
      loader.setProgress(75)
      expect(loader.getState().progress).toBe(75)

      // Show and verify progress is rendered correctly
      loader.show()
      const progressFill = container.querySelector('.loader-progress-fill') as HTMLElement
      expect(progressFill?.style.width).toBe('75%')
    })

    it('should handle text updates while hidden', () => {
      const loader = new Loader(container)

      // Set text while hidden
      loader.setText('Loading data...')
      expect(loader.getState().text).toBe('Loading data...')

      // Show and verify text is rendered
      loader.show()
      const textElement = container.querySelector('.loader-text')
      expect(textElement?.textContent).toBe('Loading data...')
    })

    it('should handle multiple loaders in the same container', () => {
      const loader1 = new Loader(container, { size: 'small' })
      loader1.show()
      loader1.hide()

      const loader2 = new Loader(container, { size: 'large' })
      loader2.show()

      const spinner = container.querySelector('.loader-spinner')
      expect(spinner?.getAttribute('data-size')).toBe('large')
    })

    it('should handle multiple overlay loaders', () => {
      const loader1 = new Loader(null, { overlay: true })
      const loader2 = new Loader(null, { overlay: true })

      loader1.show()
      loader2.show()

      const overlays = document.querySelectorAll('.loader-overlay')
      expect(overlays.length).toBe(2)

      loader1.destroy()
      loader2.destroy()
    })
  })

  // ===========================================================================
  // Integration Tests
  // ===========================================================================

  describe('Integration', () => {
    it('should work with all features combined', () => {
      const callbacks: LoaderCallbacks = {
        onShow: vi.fn(),
        onHide: vi.fn(),
        onProgressUpdate: vi.fn(),
      }

      const config: LoaderConfig = {
        size: 'large',
        type: 'primary',
        overlay: false,
        progress: 0,
        text: 'Loading data...',
        ariaLabel: 'Loading application data',
      }

      const loader = new Loader(container, config, callbacks)
      loader.show()

      expect(callbacks.onShow).toHaveBeenCalled()
      expect(container.querySelector('.loader-spinner')).toBeTruthy()
      expect(container.querySelector('.loader-text')).toBeTruthy()
      expect(container.querySelector('.loader-progress')).toBeTruthy()

      loader.setProgress(50)
      expect(callbacks.onProgressUpdate).toHaveBeenCalledWith(50)

      loader.setText('Almost done...')
      expect(loader.getState().text).toBe('Almost done...')

      loader.hide()
      expect(callbacks.onHide).toHaveBeenCalled()
    })
  })
})

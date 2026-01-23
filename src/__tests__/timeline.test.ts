/**
 * Timeline Component Tests
 * タイムラインコンポーネントのテスト（）
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  Timeline,
  createTimeline,
  type TimelineConfig,
  type TimelineCallbacks,
  type TimelineItemConfig,
} from '../renderer/components/timeline'

// =============================================================================
// Test Utilities
// =============================================================================

function createMockContainer(): HTMLElement {
  const container = document.createElement('div')
  document.body.appendChild(container)
  return container
}

function cleanupContainer(container: HTMLElement): void {
  container.remove()
}

function createBasicConfig(): TimelineConfig {
  return {
    items: [
      {
        datetime: '2024-01-15T10:30:00',
        content: 'First event content',
        title: 'First Event',
      },
      {
        datetime: '2024-01-16T14:00:00',
        content: 'Second event content',
        title: 'Second Event',
      },
    ],
  }
}

// =============================================================================
// Timeline Component Tests
// =============================================================================

describe('Timeline Component', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = createMockContainer()
  })

  afterEach(() => {
    cleanupContainer(container)
  })

  // ===========================================================================
  // Initialization Tests
  // ===========================================================================

  describe('Initialization', () => {
    it('should initialize with items config', () => {
      const config = createBasicConfig()
      const timeline = new Timeline(container, config)
      timeline.render()

      expect(container.classList.contains('mokkun-timeline')).toBe(true)
      expect(container.getAttribute('role')).toBe('list')
    })

    it('should render all items', () => {
      const config = createBasicConfig()
      const timeline = new Timeline(container, config)
      timeline.render()

      const items = container.querySelectorAll('.timeline-item')
      expect(items.length).toBe(2)
    })

    it('should set aria-label on container', () => {
      const config = createBasicConfig()
      const timeline = new Timeline(container, config)
      timeline.render()

      expect(container.getAttribute('aria-label')).toBe('タイムライン')
    })

    it('should mark first item with is-first class', () => {
      const config = createBasicConfig()
      const timeline = new Timeline(container, config)
      timeline.render()

      const firstItem = container.querySelector('.timeline-item:first-child')
      expect(firstItem?.classList.contains('is-first')).toBe(true)
    })

    it('should mark last item with is-last class', () => {
      const config = createBasicConfig()
      const timeline = new Timeline(container, config)
      timeline.render()

      const lastItem = container.querySelector('.timeline-item:last-child')
      expect(lastItem?.classList.contains('is-last')).toBe(true)
    })
  })

  // ===========================================================================
  // Date/Time Display Tests
  // ===========================================================================

  describe('Date/Time Display', () => {
    it('should format date as YYYY/MM/DD by default', () => {
      const config: TimelineConfig = {
        items: [
          {
            datetime: '2024-01-15T10:30:00',
            content: 'Content',
          },
        ],
      }
      const timeline = new Timeline(container, config)
      timeline.render()

      const dateEl = container.querySelector('.timeline-date')
      expect(dateEl?.textContent).toBe('2024/01/15')
    })

    it('should use custom dateLabel when provided', () => {
      const config: TimelineConfig = {
        items: [
          {
            datetime: '2024-01-15T10:30:00',
            dateLabel: '昨日',
            content: 'Content',
          },
        ],
      }
      const timeline = new Timeline(container, config)
      timeline.render()

      const dateEl = container.querySelector('.timeline-date')
      expect(dateEl?.textContent).toBe('昨日')
    })

    it('should set datetime attribute with ISO string', () => {
      const config: TimelineConfig = {
        items: [
          {
            datetime: new Date('2024-01-15T10:30:00Z'),
            content: 'Content',
          },
        ],
      }
      const timeline = new Timeline(container, config)
      timeline.render()

      const dateEl = container.querySelector('.timeline-date')
      expect(dateEl?.getAttribute('datetime')).toContain('2024-01-15')
    })

    it('should show time in HH:mm format by default', () => {
      const config: TimelineConfig = {
        items: [
          {
            datetime: '2024-01-15T10:30:00',
            content: 'Content',
          },
        ],
      }
      const timeline = new Timeline(container, config)
      timeline.render()

      const timeEl = container.querySelector('.timeline-time')
      expect(timeEl?.textContent).toBe('10:30')
    })

    it('should show time in HH:mm:ss format when specified', () => {
      const config: TimelineConfig = {
        items: [
          {
            datetime: '2024-01-15T10:30:45',
            timeFormat: 'HH:mm:ss',
            content: 'Content',
          },
        ],
      }
      const timeline = new Timeline(container, config)
      timeline.render()

      const timeEl = container.querySelector('.timeline-time')
      expect(timeEl?.textContent).toBe('10:30:45')
    })

    it('should hide time when timeFormat is none', () => {
      const config: TimelineConfig = {
        items: [
          {
            datetime: '2024-01-15T10:30:00',
            timeFormat: 'none',
            content: 'Content',
          },
        ],
      }
      const timeline = new Timeline(container, config)
      timeline.render()

      const timeEl = container.querySelector('.timeline-time')
      expect(timeEl).toBeNull()
    })
  })

  // ===========================================================================
  // Current Item Tests
  // ===========================================================================

  describe('Current Item', () => {
    it('should highlight current item', () => {
      const config: TimelineConfig = {
        items: [
          {
            datetime: '2024-01-15T10:30:00',
            content: 'First',
          },
          {
            datetime: '2024-01-16T14:00:00',
            content: 'Current',
            current: true,
          },
        ],
      }
      const timeline = new Timeline(container, config)
      timeline.render()

      const items = container.querySelectorAll('.timeline-item')
      expect(items[0].classList.contains('is-current')).toBe(false)
      expect(items[1].classList.contains('is-current')).toBe(true)
    })

    it('should add is-current class to icon of current item', () => {
      const config: TimelineConfig = {
        items: [
          {
            datetime: '2024-01-15T10:30:00',
            content: 'Current',
            current: true,
          },
        ],
      }
      const timeline = new Timeline(container, config)
      timeline.render()

      const icon = container.querySelector('.timeline-icon')
      expect(icon?.classList.contains('is-current')).toBe(true)
    })

    it('should add is-current class to date of current item', () => {
      const config: TimelineConfig = {
        items: [
          {
            datetime: '2024-01-15T10:30:00',
            content: 'Current',
            current: true,
          },
        ],
      }
      const timeline = new Timeline(container, config)
      timeline.render()

      const date = container.querySelector('.timeline-date')
      expect(date?.classList.contains('is-current')).toBe(true)
    })

    it('should track current index in state', () => {
      const config: TimelineConfig = {
        items: [
          { datetime: '2024-01-15', content: 'First' },
          { datetime: '2024-01-16', content: 'Current', current: true },
          { datetime: '2024-01-17', content: 'Third' },
        ],
      }
      const timeline = new Timeline(container, config)
      timeline.render()

      const state = timeline.getState()
      expect(state.currentIndex).toBe(1)
    })

    it('should return -1 for currentIndex when no current item', () => {
      const config = createBasicConfig()
      const timeline = new Timeline(container, config)
      timeline.render()

      const state = timeline.getState()
      expect(state.currentIndex).toBe(-1)
    })
  })

  // ===========================================================================
  // Icon Tests
  // ===========================================================================

  describe('Icon Support', () => {
    it('should render default dot icon', () => {
      const config: TimelineConfig = {
        items: [
          {
            datetime: '2024-01-15T10:30:00',
            content: 'Content',
          },
        ],
      }
      const timeline = new Timeline(container, config)
      timeline.render()

      const icon = container.querySelector('.timeline-icon')
      expect(icon?.querySelector('svg')).toBeTruthy()
    })

    it('should render built-in check icon', () => {
      const config: TimelineConfig = {
        items: [
          {
            datetime: '2024-01-15T10:30:00',
            content: 'Content',
            icon: 'check',
          },
        ],
      }
      const timeline = new Timeline(container, config)
      timeline.render()

      const icon = container.querySelector('.timeline-icon')
      expect(icon?.querySelector('svg')).toBeTruthy()
    })

    it('should render built-in warning icon', () => {
      const config: TimelineConfig = {
        items: [
          {
            datetime: '2024-01-15T10:30:00',
            content: 'Content',
            icon: 'warning',
          },
        ],
      }
      const timeline = new Timeline(container, config)
      timeline.render()

      const icon = container.querySelector('.timeline-icon')
      expect(icon?.innerHTML).toContain('svg')
    })

    it('should apply custom icon color', () => {
      const config: TimelineConfig = {
        items: [
          {
            datetime: '2024-01-15T10:30:00',
            content: 'Content',
            icon: 'star',
            iconColor: '#ff0000',
          },
        ],
      }
      const timeline = new Timeline(container, config)
      timeline.render()

      const icon = container.querySelector('.timeline-icon') as HTMLElement
      expect(icon?.style.color).toBe('rgb(255, 0, 0)')
    })

    it('should render custom SVG icon', () => {
      const customSvg = '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="3"/></svg>'
      const config: TimelineConfig = {
        items: [
          {
            datetime: '2024-01-15T10:30:00',
            content: 'Content',
            icon: customSvg,
          },
        ],
      }
      const timeline = new Timeline(container, config)
      timeline.render()

      const icon = container.querySelector('.timeline-icon')
      expect(icon?.innerHTML).toContain('<svg')
      expect(icon?.innerHTML).toContain('circle')
    })

    it('should sanitize malicious custom icons', () => {
      const maliciousIcon = '<svg><script>alert(1)</script><circle cx="8" cy="8" r="4"/></svg>'
      const config: TimelineConfig = {
        items: [
          {
            datetime: '2024-01-15T10:30:00',
            content: 'Content',
            icon: maliciousIcon,
          },
        ],
      }
      const timeline = new Timeline(container, config)
      timeline.render()

      const icon = container.querySelector('.timeline-icon')
      expect(icon?.innerHTML).not.toContain('script')
    })

    it('should fall back to dot icon for invalid custom icons', () => {
      const invalidIcon = '<div>Not an SVG</div>'
      const config: TimelineConfig = {
        items: [
          {
            datetime: '2024-01-15T10:30:00',
            content: 'Content',
            icon: invalidIcon,
          },
        ],
      }
      const timeline = new Timeline(container, config)
      timeline.render()

      const icon = container.querySelector('.timeline-icon')
      expect(icon?.querySelector('svg')).toBeTruthy()
    })
  })

  // ===========================================================================
  // Content Tests
  // ===========================================================================

  describe('Content', () => {
    it('should render title when provided', () => {
      const config: TimelineConfig = {
        items: [
          {
            datetime: '2024-01-15T10:30:00',
            title: 'Event Title',
            content: 'Content',
          },
        ],
      }
      const timeline = new Timeline(container, config)
      timeline.render()

      const title = container.querySelector('.timeline-title')
      expect(title?.textContent).toBe('Event Title')
    })

    it('should not render title when not provided', () => {
      const config: TimelineConfig = {
        items: [
          {
            datetime: '2024-01-15T10:30:00',
            content: 'Content only',
          },
        ],
      }
      const timeline = new Timeline(container, config)
      timeline.render()

      const title = container.querySelector('.timeline-title')
      expect(title).toBeNull()
    })

    it('should render HTML content', () => {
      const config: TimelineConfig = {
        items: [
          {
            datetime: '2024-01-15T10:30:00',
            content: '<p>Paragraph content</p>',
          },
        ],
      }
      const timeline = new Timeline(container, config)
      timeline.render()

      const content = container.querySelector('.timeline-content')
      expect(content?.querySelector('p')).toBeTruthy()
      expect(content?.querySelector('p')?.textContent).toBe('Paragraph content')
    })

    it('should render dateSuffixArea', () => {
      const config: TimelineConfig = {
        items: [
          {
            datetime: '2024-01-15T10:30:00',
            dateSuffixArea: '<span class="badge">New</span>',
            content: 'Content',
          },
        ],
      }
      const timeline = new Timeline(container, config)
      timeline.render()

      const suffix = container.querySelector('.timeline-date-suffix')
      expect(suffix?.innerHTML).toContain('badge')
    })

    it('should render sideActionArea', () => {
      const config: TimelineConfig = {
        items: [
          {
            datetime: '2024-01-15T10:30:00',
            sideActionArea: '<a href="#">Edit</a>',
            content: 'Content',
          },
        ],
      }
      const timeline = new Timeline(container, config)
      timeline.render()

      const sideAction = container.querySelector('.timeline-side-action')
      expect(sideAction?.querySelector('a')).toBeTruthy()
    })
  })

  // ===========================================================================
  // Connection Line Tests
  // ===========================================================================

  describe('Connection Line', () => {
    it('should render connection line between items', () => {
      const config = createBasicConfig()
      const timeline = new Timeline(container, config)
      timeline.render()

      const lines = container.querySelectorAll('.timeline-line')
      expect(lines.length).toBe(1) // Last item doesn't have line
    })

    it('should not render line for last item', () => {
      const config = createBasicConfig()
      const timeline = new Timeline(container, config)
      timeline.render()

      const lastItem = container.querySelector('.timeline-item.is-last')
      const line = lastItem?.querySelector('.timeline-line')
      expect(line).toBeNull()
    })
  })

  // ===========================================================================
  // Item Management Tests
  // ===========================================================================

  describe('Item Management', () => {
    it('should add item', () => {
      const config = createBasicConfig()
      const timeline = new Timeline(container, config)
      timeline.render()

      expect(timeline.getItemCount()).toBe(2)

      timeline.addItem({
        datetime: '2024-01-17T09:00:00',
        content: 'Third event',
      })

      expect(timeline.getItemCount()).toBe(3)
      const items = container.querySelectorAll('.timeline-item')
      expect(items.length).toBe(3)
    })

    it('should remove item by index', () => {
      const config = createBasicConfig()
      const timeline = new Timeline(container, config)
      timeline.render()

      expect(timeline.getItemCount()).toBe(2)

      timeline.removeItem(0)

      expect(timeline.getItemCount()).toBe(1)
      const items = container.querySelectorAll('.timeline-item')
      expect(items.length).toBe(1)
    })

    it('should not remove item with invalid index', () => {
      const config = createBasicConfig()
      const timeline = new Timeline(container, config)
      timeline.render()

      timeline.removeItem(-1)
      timeline.removeItem(10)

      expect(timeline.getItemCount()).toBe(2)
    })

    it('should update item by index', () => {
      const config = createBasicConfig()
      const timeline = new Timeline(container, config)
      timeline.render()

      timeline.updateItem(0, { title: 'Updated Title' })

      const title = container.querySelector('.timeline-title')
      expect(title?.textContent).toBe('Updated Title')
    })

    it('should not update item with invalid index', () => {
      const config = createBasicConfig()
      const timeline = new Timeline(container, config)
      timeline.render()

      const originalTitle = container.querySelector('.timeline-title')?.textContent

      timeline.updateItem(-1, { title: 'Should not change' })
      timeline.updateItem(10, { title: 'Should not change' })

      const title = container.querySelector('.timeline-title')
      expect(title?.textContent).toBe(originalTitle)
    })
  })

  // ===========================================================================
  // State Management Tests
  // ===========================================================================

  describe('State Management', () => {
    it('should return correct state', () => {
      const config = createBasicConfig()
      const timeline = new Timeline(container, config)
      timeline.render()

      const state = timeline.getState()

      expect(state.itemCount).toBe(2)
      expect(state.currentIndex).toBe(-1)
    })

    it('should return immutable state', () => {
      const config = createBasicConfig()
      const timeline = new Timeline(container, config)
      timeline.render()

      const state1 = timeline.getState()
      const state2 = timeline.getState()

      expect(state1).not.toBe(state2)
      expect(state1).toEqual(state2)
    })
  })

  // ===========================================================================
  // Callback Tests
  // ===========================================================================

  describe('Callbacks', () => {
    it('should call onItemClick when item is clicked', () => {
      const onItemClick = vi.fn()
      const config = createBasicConfig()
      const callbacks: TimelineCallbacks = { onItemClick }
      const timeline = new Timeline(container, config, callbacks)
      timeline.render()

      const contentArea = container.querySelector('.timeline-content-area')
      contentArea?.dispatchEvent(new MouseEvent('click', { bubbles: true }))

      expect(onItemClick).toHaveBeenCalledTimes(1)
      expect(onItemClick).toHaveBeenCalledWith(0, expect.any(MouseEvent))
    })

    it('should add is-clickable class when onItemClick is provided', () => {
      const onItemClick = vi.fn()
      const config = createBasicConfig()
      const callbacks: TimelineCallbacks = { onItemClick }
      const timeline = new Timeline(container, config, callbacks)
      timeline.render()

      const contentArea = container.querySelector('.timeline-content-area')
      expect(contentArea?.classList.contains('is-clickable')).toBe(true)
    })

    it('should not add is-clickable class when no callback', () => {
      const config = createBasicConfig()
      const timeline = new Timeline(container, config)
      timeline.render()

      const contentArea = container.querySelector('.timeline-content-area')
      expect(contentArea?.classList.contains('is-clickable')).toBe(false)
    })
  })

  // ===========================================================================
  // Accessibility Tests
  // ===========================================================================

  describe('Accessibility', () => {
    it('should have role="list" on container', () => {
      const config = createBasicConfig()
      const timeline = new Timeline(container, config)
      timeline.render()

      expect(container.getAttribute('role')).toBe('list')
    })

    it('should have role="listitem" on each item', () => {
      const config = createBasicConfig()
      const timeline = new Timeline(container, config)
      timeline.render()

      const items = container.querySelectorAll('.timeline-item')
      items.forEach((item) => {
        expect(item.getAttribute('role')).toBe('listitem')
      })
    })

    it('should have aria-hidden on icon', () => {
      const config = createBasicConfig()
      const timeline = new Timeline(container, config)
      timeline.render()

      const icon = container.querySelector('.timeline-icon')
      expect(icon?.getAttribute('aria-hidden')).toBe('true')
    })

    it('should use time element for date', () => {
      const config = createBasicConfig()
      const timeline = new Timeline(container, config)
      timeline.render()

      const dateEl = container.querySelector('.timeline-date')
      expect(dateEl?.tagName.toLowerCase()).toBe('time')
    })
  })

  // ===========================================================================
  // Factory Function Tests
  // ===========================================================================

  describe('createTimeline Factory', () => {
    it('should create and render Timeline', () => {
      const config = createBasicConfig()
      const timeline = createTimeline(container, config)

      expect(container.classList.contains('mokkun-timeline')).toBe(true)
      expect(timeline.getItemCount()).toBe(2)
    })

    it('should pass callbacks correctly', () => {
      const onItemClick = vi.fn()
      const config = createBasicConfig()
      createTimeline(container, config, { onItemClick })

      const contentArea = container.querySelector('.timeline-content-area')
      contentArea?.dispatchEvent(new MouseEvent('click', { bubbles: true }))

      expect(onItemClick).toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // Destroy Tests
  // ===========================================================================

  describe('Destroy', () => {
    it('should clear container content', () => {
      const config = createBasicConfig()
      const timeline = createTimeline(container, config)

      expect(container.innerHTML).not.toBe('')

      timeline.destroy()

      expect(container.innerHTML).toBe('')
    })
  })

  // ===========================================================================
  // XSS Protection Tests
  // ===========================================================================

  describe('XSS Protection', () => {
    it('should sanitize script tags in content', () => {
      const config: TimelineConfig = {
        items: [
          {
            datetime: '2024-01-15T10:30:00',
            content: '<script>alert("XSS")</script><p>Safe content</p>',
          },
        ],
      }
      const timeline = new Timeline(container, config)
      timeline.render()

      const content = container.querySelector('.timeline-content')
      expect(content?.innerHTML).not.toContain('<script>')
      expect(content?.innerHTML).toContain('Safe content')
    })

    it('should sanitize onclick attributes in content', () => {
      const config: TimelineConfig = {
        items: [
          {
            datetime: '2024-01-15T10:30:00',
            content: '<div onclick="alert(\'XSS\')">Click me</div>',
          },
        ],
      }
      const timeline = new Timeline(container, config)
      timeline.render()

      const content = container.querySelector('.timeline-content')
      expect(content?.innerHTML).not.toContain('onclick')
    })

    it('should sanitize onerror attributes in content', () => {
      const config: TimelineConfig = {
        items: [
          {
            datetime: '2024-01-15T10:30:00',
            content: '<img src="x" onerror="alert(\'XSS\')">',
          },
        ],
      }
      const timeline = new Timeline(container, config)
      timeline.render()

      const content = container.querySelector('.timeline-content')
      expect(content?.innerHTML).not.toContain('onerror')
    })

    it('should sanitize javascript: URLs in content', () => {
      const config: TimelineConfig = {
        items: [
          {
            datetime: '2024-01-15T10:30:00',
            content: '<a href="javascript:alert(\'XSS\')">Link</a>',
          },
        ],
      }
      const timeline = new Timeline(container, config)
      timeline.render()

      const content = container.querySelector('.timeline-content')
      expect(content?.innerHTML).not.toContain('javascript:')
    })

    it('should sanitize iframe in content', () => {
      const config: TimelineConfig = {
        items: [
          {
            datetime: '2024-01-15T10:30:00',
            content: '<iframe src="https://evil.com"></iframe>',
          },
        ],
      }
      const timeline = new Timeline(container, config)
      timeline.render()

      const content = container.querySelector('.timeline-content')
      expect(content?.innerHTML).not.toContain('iframe')
    })

    it('should sanitize script tags in dateSuffixArea', () => {
      const config: TimelineConfig = {
        items: [
          {
            datetime: '2024-01-15T10:30:00',
            content: 'Content',
            dateSuffixArea: '<script>alert("XSS")</script><span>Badge</span>',
          },
        ],
      }
      const timeline = new Timeline(container, config)
      timeline.render()

      const suffix = container.querySelector('.timeline-date-suffix')
      expect(suffix?.innerHTML).not.toContain('<script>')
      expect(suffix?.innerHTML).toContain('Badge')
    })

    it('should sanitize onclick in dateSuffixArea', () => {
      const config: TimelineConfig = {
        items: [
          {
            datetime: '2024-01-15T10:30:00',
            content: 'Content',
            dateSuffixArea: '<span onclick="alert(\'XSS\')">Badge</span>',
          },
        ],
      }
      const timeline = new Timeline(container, config)
      timeline.render()

      const suffix = container.querySelector('.timeline-date-suffix')
      expect(suffix?.innerHTML).not.toContain('onclick')
    })

    it('should sanitize script tags in sideActionArea', () => {
      const config: TimelineConfig = {
        items: [
          {
            datetime: '2024-01-15T10:30:00',
            content: 'Content',
            sideActionArea: '<script>alert("XSS")</script><a>Edit</a>',
          },
        ],
      }
      const timeline = new Timeline(container, config)
      timeline.render()

      const sideAction = container.querySelector('.timeline-side-action')
      expect(sideAction?.innerHTML).not.toContain('<script>')
      expect(sideAction?.innerHTML).toContain('Edit')
    })

    it('should sanitize javascript: URLs in sideActionArea', () => {
      const config: TimelineConfig = {
        items: [
          {
            datetime: '2024-01-15T10:30:00',
            content: 'Content',
            sideActionArea: '<a href="javascript:alert(\'XSS\')">Edit</a>',
          },
        ],
      }
      const timeline = new Timeline(container, config)
      timeline.render()

      const sideAction = container.querySelector('.timeline-side-action')
      expect(sideAction?.innerHTML).not.toContain('javascript:')
    })

    it('should allow safe HTML in content', () => {
      const config: TimelineConfig = {
        items: [
          {
            datetime: '2024-01-15T10:30:00',
            content: '<p><strong>Bold</strong> and <em>italic</em> text</p>',
          },
        ],
      }
      const timeline = new Timeline(container, config)
      timeline.render()

      const content = container.querySelector('.timeline-content')
      expect(content?.innerHTML).toContain('<strong>Bold</strong>')
      expect(content?.innerHTML).toContain('<em>italic</em>')
    })

    it('should allow safe anchor tags with http URLs', () => {
      const config: TimelineConfig = {
        items: [
          {
            datetime: '2024-01-15T10:30:00',
            content: '<a href="https://example.com">Safe link</a>',
          },
        ],
      }
      const timeline = new Timeline(container, config)
      timeline.render()

      const content = container.querySelector('.timeline-content')
      const link = content?.querySelector('a')
      expect(link?.getAttribute('href')).toBe('https://example.com')
    })
  })

  // ===========================================================================
  // Combined Scenarios Tests
  // ===========================================================================

  describe('Combined Scenarios', () => {
    it('should render activity log with various icons', () => {
      const config: TimelineConfig = {
        items: [
          {
            datetime: '2024-01-15T10:30:00',
            title: 'User registered',
            content: 'New user account created',
            icon: 'user',
          },
          {
            datetime: '2024-01-15T11:00:00',
            title: 'Email verified',
            content: 'Email address confirmed',
            icon: 'check',
            current: true,
          },
          {
            datetime: '2024-01-15T12:00:00',
            title: 'Pending approval',
            content: 'Awaiting admin approval',
            icon: 'clock',
          },
        ],
      }
      const timeline = createTimeline(container, config)

      expect(timeline.getItemCount()).toBe(3)
      expect(timeline.getState().currentIndex).toBe(1)

      const currentItem = container.querySelector('.timeline-item.is-current')
      expect(currentItem).toBeTruthy()
    })

    it('should render history with custom date labels', () => {
      const config: TimelineConfig = {
        items: [
          {
            datetime: new Date(),
            dateLabel: '今日',
            content: 'Today event',
          },
          {
            datetime: new Date(Date.now() - 86400000),
            dateLabel: '昨日',
            content: 'Yesterday event',
          },
          {
            datetime: new Date(Date.now() - 172800000),
            dateLabel: '一昨日',
            content: 'Day before yesterday',
          },
        ],
      }
      createTimeline(container, config)

      const dates = container.querySelectorAll('.timeline-date')
      expect(dates[0].textContent).toBe('今日')
      expect(dates[1].textContent).toBe('昨日')
      expect(dates[2].textContent).toBe('一昨日')
    })

    it('should render progress timeline', () => {
      const config: TimelineConfig = {
        items: [
          {
            datetime: '2024-01-10',
            title: 'Order placed',
            content: 'Your order has been placed',
            icon: 'check',
            timeFormat: 'none',
          },
          {
            datetime: '2024-01-12',
            title: 'Processing',
            content: 'Your order is being processed',
            icon: 'check',
            current: true,
            timeFormat: 'none',
          },
          {
            datetime: '2024-01-15',
            title: 'Shipping',
            content: 'Estimated delivery date',
            icon: 'circle',
            timeFormat: 'none',
          },
        ],
      }
      createTimeline(container, config)

      const items = container.querySelectorAll('.timeline-item')
      expect(items.length).toBe(3)

      // No time elements when timeFormat is 'none'
      const times = container.querySelectorAll('.timeline-time')
      expect(times.length).toBe(0)
    })
  })
})

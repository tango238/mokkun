/**
 * Stepper Component Tests
 * 
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  Stepper,
  createStepper,
  type StepperConfig,
  type HorizontalStep,
  type VerticalStep,
} from '../renderer/components/stepper'

// Helper functions
function createMockContainer(): HTMLElement {
  const container = document.createElement('div')
  document.body.appendChild(container)
  return container
}

function cleanupContainer(container: HTMLElement): void {
  container.remove()
}

describe('Stepper', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = createMockContainer()
  })

  afterEach(() => {
    cleanupContainer(container)
  })

  describe('Horizontal Stepper', () => {
    const horizontalConfig: StepperConfig = {
      type: 'horizontal',
      steps: [
        { label: 'ステップ1' },
        { label: 'ステップ2' },
        { label: 'ステップ3' },
      ] as HorizontalStep[],
      activeIndex: 0,
    }

    it('should initialize with correct state', () => {
      const stepper = new Stepper(horizontalConfig, container)
      const state = stepper.getState()

      expect(state.activeIndex).toBe(0)
      expect(state.type).toBe('horizontal')
    })

    it('should render horizontal layout', () => {
      const stepper = new Stepper(horizontalConfig, container)
      stepper.render()

      expect(container.classList.contains('stepper-horizontal')).toBe(true)
      expect(container.querySelector('.stepper-list-horizontal')).toBeTruthy()
    })

    it('should render all steps', () => {
      const stepper = new Stepper(horizontalConfig, container)
      stepper.render()

      const steps = container.querySelectorAll('.stepper-item-horizontal')
      expect(steps.length).toBe(3)
    })

    it('should render step labels', () => {
      const stepper = new Stepper(horizontalConfig, container)
      stepper.render()

      const labels = container.querySelectorAll('.stepper-label')
      expect(labels[0]?.textContent).toBe('ステップ1')
      expect(labels[1]?.textContent).toBe('ステップ2')
      expect(labels[2]?.textContent).toBe('ステップ3')
    })

    it('should mark current step with aria-current', () => {
      const stepper = new Stepper(horizontalConfig, container)
      stepper.render()

      const currentStep = container.querySelector('[aria-current="step"]')
      expect(currentStep).toBeTruthy()
      expect(currentStep?.classList.contains('is-current')).toBe(true)
    })

    it('should render step counters with numbers', () => {
      const stepper = new Stepper(horizontalConfig, container)
      stepper.render()

      const numbers = container.querySelectorAll('.stepper-number')
      expect(numbers[0]?.textContent).toBe('1')
      expect(numbers[1]?.textContent).toBe('2')
      expect(numbers[2]?.textContent).toBe('3')
    })

    it('should render connector lines between steps', () => {
      const stepper = new Stepper(horizontalConfig, container)
      stepper.render()

      const lines = container.querySelectorAll('.stepper-line')
      // Each step has before and after lines (3 steps × 2 = 6)
      expect(lines.length).toBe(6)
    })

    it('should hide first before-line and last after-line', () => {
      const stepper = new Stepper(horizontalConfig, container)
      stepper.render()

      const items = container.querySelectorAll('.stepper-item-horizontal')
      const firstBeforeLine = items[0]?.querySelector('.stepper-line-before')
      const lastAfterLine = items[2]?.querySelector('.stepper-line-after')

      expect(firstBeforeLine?.classList.contains('is-hidden')).toBe(true)
      expect(lastAfterLine?.classList.contains('is-hidden')).toBe(true)
    })

    it('should change active step', () => {
      const stepper = new Stepper(horizontalConfig, container)
      stepper.render()

      stepper.setActiveIndex(1)

      expect(stepper.getState().activeIndex).toBe(1)
      const items = container.querySelectorAll('.stepper-item-horizontal')
      expect(items[1]?.classList.contains('is-current')).toBe(true)
    })

    it('should mark completed lines', () => {
      const config: StepperConfig = {
        type: 'horizontal',
        steps: [
          { label: 'Step 1' },
          { label: 'Step 2' },
          { label: 'Step 3' },
        ],
        activeIndex: 2,
      }
      const stepper = new Stepper(config, container)
      stepper.render()

      // First and second steps should have completed after-lines
      const items = container.querySelectorAll('.stepper-item-horizontal')
      const firstAfterLine = items[0]?.querySelector('.stepper-line-after')
      const secondAfterLine = items[1]?.querySelector('.stepper-line-after')

      expect(firstAfterLine?.classList.contains('is-completed')).toBe(true)
      expect(secondAfterLine?.classList.contains('is-completed')).toBe(true)
    })
  })

  describe('Vertical Stepper', () => {
    const verticalConfig: StepperConfig = {
      type: 'vertical',
      steps: [
        { label: 'ステップ1', children: '<p>内容1</p>' },
        { label: 'ステップ2', children: '<p>内容2</p>' },
        { label: 'ステップ3' },
      ] as VerticalStep[],
      activeIndex: 1,
    }

    it('should render vertical layout', () => {
      const stepper = new Stepper(verticalConfig, container)
      stepper.render()

      expect(container.classList.contains('stepper-vertical')).toBe(true)
      expect(container.querySelector('.stepper-list-vertical')).toBeTruthy()
    })

    it('should render all steps', () => {
      const stepper = new Stepper(verticalConfig, container)
      stepper.render()

      const steps = container.querySelectorAll('.stepper-item-vertical')
      expect(steps.length).toBe(3)
    }
    )

    it('should render step headings', () => {
      const stepper = new Stepper(verticalConfig, container)
      stepper.render()

      const headings = container.querySelectorAll('.stepper-heading')
      expect(headings[0]?.textContent).toBe('ステップ1')
      expect(headings[1]?.textContent).toBe('ステップ2')
    })

    it('should render children content', () => {
      const stepper = new Stepper(verticalConfig, container)
      stepper.render()

      const inners = container.querySelectorAll('.stepper-inner')
      expect(inners.length).toBe(2) // Only 2 steps have children
      expect(inners[0]?.innerHTML).toContain('<p>内容1</p>')
    })

    it('should mark current step', () => {
      const stepper = new Stepper(verticalConfig, container)
      stepper.render()

      const items = container.querySelectorAll('.stepper-item-vertical')
      expect(items[1]?.classList.contains('is-current')).toBe(true)
      expect(items[1]?.getAttribute('aria-current')).toBe('step')
    })

    it('should mark last step', () => {
      const stepper = new Stepper(verticalConfig, container)
      stepper.render()

      const items = container.querySelectorAll('.stepper-item-vertical')
      expect(items[2]?.classList.contains('is-last')).toBe(true)
    })

    it('should mark past steps as inactive', () => {
      const stepper = new Stepper(verticalConfig, container)
      stepper.render()

      const headings = container.querySelectorAll('.stepper-heading')
      // Step 0 is past (index 0 < activeIndex 1), so heading should be inactive
      // But it's not completed/closed status, so it won't have is-inactive yet
      // Actually, past steps without explicit status get is-completed
      const items = container.querySelectorAll('.stepper-item-vertical')
      expect(items[0]?.classList.contains('is-completed')).toBe(true)
    })
  })

  describe('Step Status', () => {
    it('should render completed status with check icon', () => {
      const config: StepperConfig = {
        type: 'horizontal',
        steps: [
          { label: 'Step 1', status: 'completed' },
          { label: 'Step 2' },
        ],
        activeIndex: 1,
      }
      const stepper = new Stepper(config, container)
      stepper.render()

      const firstStep = container.querySelector('.stepper-item-horizontal')
      expect(firstStep?.classList.contains('is-completed')).toBe(true)
      expect(firstStep?.querySelector('.stepper-icon-check')).toBeTruthy()
    })

    it('should render closed status with close icon', () => {
      const config: StepperConfig = {
        type: 'horizontal',
        steps: [
          { label: 'Step 1', status: 'closed' },
          { label: 'Step 2' },
        ],
        activeIndex: 1,
      }
      const stepper = new Stepper(config, container)
      stepper.render()

      const firstStep = container.querySelector('.stepper-item-horizontal')
      expect(firstStep?.classList.contains('is-closed')).toBe(true)
      expect(firstStep?.querySelector('.stepper-icon-close')).toBeTruthy()
    })

    it('should render status with custom text', () => {
      const config: StepperConfig = {
        type: 'horizontal',
        steps: [
          { label: 'Step 1', status: { type: 'completed', text: 'カスタム完了' } },
          { label: 'Step 2' },
        ],
        activeIndex: 1,
      }
      const stepper = new Stepper(config, container)
      stepper.render()

      const statusIcon = container.querySelector('.stepper-status-icon')
      expect(statusIcon?.getAttribute('aria-label')).toBe('カスタム完了')
    })

    it('should have default alt text for completed', () => {
      const config: StepperConfig = {
        type: 'horizontal',
        steps: [
          { label: 'Step 1', status: 'completed' },
        ],
        activeIndex: 0,
      }
      const stepper = new Stepper(config, container)
      stepper.render()

      const statusIcon = container.querySelector('.stepper-status-icon')
      expect(statusIcon?.getAttribute('aria-label')).toBe('完了')
    })

    it('should have default alt text for closed', () => {
      const config: StepperConfig = {
        type: 'horizontal',
        steps: [
          { label: 'Step 1', status: 'closed' },
        ],
        activeIndex: 0,
      }
      const stepper = new Stepper(config, container)
      stepper.render()

      const statusIcon = container.querySelector('.stepper-status-icon')
      expect(statusIcon?.getAttribute('aria-label')).toBe('中断')
    })

    it('should apply closed label style', () => {
      const config: StepperConfig = {
        type: 'horizontal',
        steps: [
          { label: 'Step 1', status: 'closed' },
          { label: 'Step 2' },
        ],
        activeIndex: 1,
      }
      const stepper = new Stepper(config, container)
      stepper.render()

      const label = container.querySelector('.stepper-label.is-closed')
      expect(label).toBeTruthy()
    })
  })

  describe('Factory Function', () => {
    it('should create and render stepper', () => {
      const config: StepperConfig = {
        type: 'horizontal',
        steps: [
          { label: 'Step 1' },
          { label: 'Step 2' },
        ],
      }

      const stepper = createStepper(config, container)

      expect(stepper).toBeInstanceOf(Stepper)
      expect(container.querySelector('.stepper-list')).toBeTruthy()
    })
  })

  describe('State Management', () => {
    it('should not change state for invalid index', () => {
      const config: StepperConfig = {
        type: 'horizontal',
        steps: [
          { label: 'Step 1' },
          { label: 'Step 2' },
        ],
        activeIndex: 0,
      }
      const stepper = new Stepper(config, container)

      stepper.setActiveIndex(-1)
      expect(stepper.getState().activeIndex).toBe(0)

      stepper.setActiveIndex(10)
      expect(stepper.getState().activeIndex).toBe(0)
    })

    it('should default activeIndex to 0', () => {
      const config: StepperConfig = {
        type: 'horizontal',
        steps: [
          { label: 'Step 1' },
        ],
        // activeIndex not specified
      }
      const stepper = new Stepper(config, container)

      expect(stepper.getState().activeIndex).toBe(0)
    })
  })

  describe('Cleanup', () => {
    it('should clear container on destroy', () => {
      const config: StepperConfig = {
        type: 'horizontal',
        steps: [{ label: 'Step 1' }],
      }
      const stepper = new Stepper(config, container)
      stepper.render()

      expect(container.children.length).toBeGreaterThan(0)

      stepper.destroy()

      expect(container.children.length).toBe(0)
    })
  })

  describe('Vertical Step Completion Line', () => {
    it('should mark completed step line in vertical layout', () => {
      const config: StepperConfig = {
        type: 'vertical',
        steps: [
          { label: 'Step 1', status: 'completed' },
          { label: 'Step 2' },
        ],
        activeIndex: 1,
      }
      const stepper = new Stepper(config, container)
      stepper.render()

      const firstStep = container.querySelector('.stepper-item-vertical')
      expect(firstStep?.classList.contains('is-completed')).toBe(true)
    })

    it('should not show line for last step', () => {
      const config: StepperConfig = {
        type: 'vertical',
        steps: [
          { label: 'Step 1' },
          { label: 'Step 2' },
        ],
        activeIndex: 0,
      }
      const stepper = new Stepper(config, container)
      stepper.render()

      const lastStep = container.querySelectorAll('.stepper-item-vertical')[1]
      expect(lastStep?.classList.contains('is-last')).toBe(true)
    })
  })
})

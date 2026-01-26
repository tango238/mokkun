
export type AlertBannerType = 'info' | 'success' | 'warning' | 'error'

export interface AlertBannerState {
  message: string
  visible: boolean
}

export interface AlertBannerCallbacks {
  onClose?: () => void
  onAction?: () => void
}

export interface AlertBannerConfig {
  message: string
  type?: AlertBannerType
  actionLabel?: string
  closable?: boolean
  visible?: boolean
  role?: 'alert' | 'status'
  ariaLabel?: string
}

const BUILTIN_ICONS: Record<AlertBannerType, string> = {
  info: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="2" fill="none"/>
    <path d="M10 6V10M10 14H10.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>`,
  success: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="2" fill="none"/>
    <path d="M6 10L9 13L14 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  warning: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 2L2 17H18L10 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M10 8V11M10 14H10.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>`,
  error: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="2" fill="none"/>
    <path d="M7 7L13 13M13 7L7 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>`,
}

const CLOSE_ICON = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
</svg>`

export class AlertBanner {
  private config: AlertBannerConfig
  private state: AlertBannerState
  private callbacks: AlertBannerCallbacks
  private container: HTMLElement
  private closeHandler: ((event: Event) => void) | null = null
  private actionHandler: ((event: Event) => void) | null = null

  constructor(
    container: HTMLElement,
    config: AlertBannerConfig,
    callbacks: AlertBannerCallbacks = {}
  ) {
    this.container = container
    this.config = {
      type: 'info',
      closable: true,
      visible: true,
      ...config,
    }
    this.state = {
      message: config.message,
      visible: this.config.visible ?? true,
    }
    this.callbacks = callbacks
  }

  render(): void {
    this.cleanup()

    const type = this.config.type ?? 'info'
    const { role: customRole, ariaLabel } = this.config

    // Determine ARIA role based on type
    const role = customRole ?? (type === 'error' || type === 'warning' ? 'alert' : 'status')
    const ariaLive = role === 'alert' ? 'assertive' : 'polite'

    // Set container classes
    this.container.className = [
      'mokkun-alert-banner',
      `alert-banner-${type}`,
      !this.state.visible ? 'alert-banner-hidden' : '',
    ]
      .filter(Boolean)
      .join(' ')

    // Set ARIA attributes
    this.container.setAttribute('role', role)
    this.container.setAttribute('aria-live', ariaLive)
    this.container.setAttribute('aria-label', ariaLabel ?? this.state.message)
    this.container.setAttribute('data-type', type)

    // Build content
    const content = this.renderContent()
    this.container.innerHTML = ''
    this.container.appendChild(content)
  }

  private renderContent(): HTMLElement {
    const wrapper = document.createElement('div')
    wrapper.className = 'alert-banner-content'

    // Icon
    const icon = document.createElement('div')
    icon.className = 'alert-banner-icon'
    icon.innerHTML = BUILTIN_ICONS[this.config.type ?? 'info']
    wrapper.appendChild(icon)

    // Message
    const message = document.createElement('div')
    message.className = 'alert-banner-message'
    message.textContent = this.state.message
    wrapper.appendChild(message)

    // Action button
    if (this.config.actionLabel) {
      const actionButton = this.renderActionButton()
      wrapper.appendChild(actionButton)
    }

    // Close button
    if (this.config.closable) {
      const closeButton = this.renderCloseButton()
      wrapper.appendChild(closeButton)
    }

    return wrapper
  }

  private renderActionButton(): HTMLElement {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'alert-banner-action'
    button.textContent = this.config.actionLabel ?? ''

    this.actionHandler = (event: Event) => this.handleAction(event)
    button.addEventListener('click', this.actionHandler)

    return button
  }

  private renderCloseButton(): HTMLElement {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'alert-banner-close'
    button.setAttribute('aria-label', 'Close alert')
    button.innerHTML = CLOSE_ICON

    this.closeHandler = (event: Event) => this.handleClose(event)
    button.addEventListener('click', this.closeHandler)

    return button
  }

  private handleAction(event: Event): void {
    event.preventDefault()

    if (this.callbacks.onAction) {
      this.callbacks.onAction()
    }
  }

  private handleClose(event: Event): void {
    event.preventDefault()

    this.setVisible(false)

    if (this.callbacks.onClose) {
      this.callbacks.onClose()
    }
  }

  private cleanup(): void {
    if (this.closeHandler) {
      const closeButton = this.container.querySelector('.alert-banner-close')
      if (closeButton) {
        closeButton.removeEventListener('click', this.closeHandler)
      }
      this.closeHandler = null
    }

    if (this.actionHandler) {
      const actionButton = this.container.querySelector('.alert-banner-action')
      if (actionButton) {
        actionButton.removeEventListener('click', this.actionHandler)
      }
      this.actionHandler = null
    }
  }

  // Public methods for state management
  setMessage(message: string): void {
    if (this.state.message === message) return

    this.state = {
      ...this.state,
      message,
    }

    this.render()
  }

  setVisible(visible: boolean): void {
    if (this.state.visible === visible) return

    this.state = {
      ...this.state,
      visible,
    }

    if (visible) {
      this.container.classList.remove('alert-banner-hidden')
    } else {
      this.container.classList.add('alert-banner-hidden')
    }

    this.container.setAttribute('aria-label', this.config.ariaLabel ?? this.state.message)
  }

  show(): void {
    this.setVisible(true)
  }

  hide(): void {
    this.setVisible(false)
  }

  getMessage(): string {
    return this.state.message
  }

  isVisible(): boolean {
    return this.state.visible
  }

  getState(): Readonly<AlertBannerState> {
    return { ...this.state }
  }

  destroy(): void {
    this.cleanup()
    this.container.innerHTML = ''
    this.container.className = ''
    this.container.removeAttribute('role')
    this.container.removeAttribute('aria-live')
    this.container.removeAttribute('aria-label')
    this.container.removeAttribute('data-type')
  }
}

export function createAlertBanner(
  container: HTMLElement,
  config: AlertBannerConfig,
  callbacks: AlertBannerCallbacks = {}
): AlertBanner {
  const alertBanner = new AlertBanner(container, config, callbacks)
  alertBanner.render()
  return alertBanner
}

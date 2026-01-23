/**
 * File Loader Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  isValidFileName,
  isValidFileType,
  readFile,
  loadFromUrl,
  getYamlUrlFromParams,
  formatFileLoadError,
  setupDropZone,
  createFileInput,
} from '../loader/file-loader'

// =============================================================================
// Test Data
// =============================================================================

const validYamlContent = `
view:
  test:
    title: Test Form
    fields:
      - id: name
        type: text
        label: Name
`

const invalidYamlContent = `
view:
  test:
    title: Test Form
    fields:
      - id: name
        type: invalid_type
        label: Name
`

const yamlSyntaxError = `
view:
  test:
    title: Test Form
      fields:  # bad indentation
`

// =============================================================================
// Mock Setup
// =============================================================================

function createMockFile(name: string, content: string, type = 'text/plain'): File {
  return new File([content], name, { type })
}

// =============================================================================
// Tests: File Name Validation
// =============================================================================

describe('isValidFileName', () => {
  it('should accept .yaml files', () => {
    expect(isValidFileName('form.yaml')).toBe(true)
  })

  it('should accept .yml files', () => {
    expect(isValidFileName('form.yml')).toBe(true)
  })

  it('should accept .YAML files (case insensitive)', () => {
    expect(isValidFileName('FORM.YAML')).toBe(true)
  })

  it('should accept .YML files (case insensitive)', () => {
    expect(isValidFileName('FORM.YML')).toBe(true)
  })

  it('should reject .json files', () => {
    expect(isValidFileName('form.json')).toBe(false)
  })

  it('should reject .txt files', () => {
    expect(isValidFileName('form.txt')).toBe(false)
  })

  it('should reject files without extension', () => {
    expect(isValidFileName('form')).toBe(false)
  })

  it('should accept files with path', () => {
    expect(isValidFileName('path/to/form.yaml')).toBe(true)
  })
})

// =============================================================================
// Tests: File Type Validation
// =============================================================================

describe('isValidFileType', () => {
  it('should accept file with valid extension', () => {
    const file = createMockFile('form.yaml', validYamlContent)
    expect(isValidFileType(file)).toBe(true)
  })

  it('should accept file with application/yaml mime type', () => {
    const file = createMockFile('form.yaml', validYamlContent, 'application/yaml')
    expect(isValidFileType(file)).toBe(true)
  })

  it('should accept file with text/yaml mime type', () => {
    const file = createMockFile('form.yaml', validYamlContent, 'text/yaml')
    expect(isValidFileType(file)).toBe(true)
  })

  it('should reject file with invalid extension', () => {
    const file = createMockFile('form.json', validYamlContent, 'application/json')
    expect(isValidFileType(file)).toBe(false)
  })

  it('should accept text/plain mime type if extension is valid', () => {
    const file = createMockFile('form.yaml', validYamlContent, 'text/plain')
    expect(isValidFileType(file)).toBe(true)
  })
})

// =============================================================================
// Tests: File Reading
// =============================================================================

describe('readFile', () => {
  it('should successfully read valid YAML file', async () => {
    const file = createMockFile('form.yaml', validYamlContent)
    const result = await readFile(file, 'file')

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.fileName).toBe('form.yaml')
      expect(result.source).toBe('file')
      expect(result.schema.view.test).toBeDefined()
    }
  })

  it('should return error for file exceeding size limit', async () => {
    // Create a large content (>10MB)
    const largeContent = 'a'.repeat(11 * 1024 * 1024)
    const file = createMockFile('large.yaml', largeContent)
    const result = await readFile(file, 'file')

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.type).toBe('FILE_READ_ERROR')
      expect(result.error.message).toContain('ファイルサイズ')
    }
  })

  it('should return error for invalid file type', async () => {
    const file = createMockFile('form.json', validYamlContent, 'application/json')
    const result = await readFile(file, 'file')

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.type).toBe('INVALID_FILE_TYPE')
    }
  })

  it('should return error for invalid YAML field type', async () => {
    const file = createMockFile('form.yaml', invalidYamlContent)
    const result = await readFile(file, 'file')

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.type).toBe('YAML_PARSE_ERROR')
      expect(result.error.parseErrors).toBeDefined()
    }
  })

  it('should return error for YAML syntax error', async () => {
    const file = createMockFile('form.yaml', yamlSyntaxError)
    const result = await readFile(file, 'file')

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.type).toBe('YAML_PARSE_ERROR')
    }
  })

  it('should correctly report source as drop', async () => {
    const file = createMockFile('form.yaml', validYamlContent)
    const result = await readFile(file, 'drop')

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.source).toBe('drop')
    }
  })
})

// =============================================================================
// Tests: URL Loading
// =============================================================================

describe('loadFromUrl', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('should successfully load YAML from URL', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(validYamlContent),
    })
    vi.stubGlobal('fetch', mockFetch)

    const result = await loadFromUrl('https://example.com/form.yaml')

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.fileName).toBe('form.yaml')
      expect(result.source).toBe('url')
    }
  })

  it('should return error for invalid file extension in URL', async () => {
    const result = await loadFromUrl('https://example.com/form.json')

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.type).toBe('INVALID_FILE_TYPE')
    }
  })

  it('should return error for invalid protocol', async () => {
    const result = await loadFromUrl('file:///etc/passwd.yaml')

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.type).toBe('FETCH_ERROR')
      expect(result.error.message).toContain('プロトコル')
    }
  })

  it('should return error for HTTP error response', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    })
    vi.stubGlobal('fetch', mockFetch)

    const result = await loadFromUrl('https://example.com/form.yaml')

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.type).toBe('FETCH_ERROR')
      expect(result.error.details).toContain('404')
    }
  })

  it('should return error for network failure', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'))
    vi.stubGlobal('fetch', mockFetch)

    const result = await loadFromUrl('https://example.com/form.yaml')

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.type).toBe('NETWORK_ERROR')
    }
  })

  it('should handle relative URLs', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(validYamlContent),
    })
    vi.stubGlobal('fetch', mockFetch)

    const result = await loadFromUrl('/forms/test.yaml')

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.fileName).toBe('test.yaml')
    }
  })
})

// =============================================================================
// Tests: URL Parameter Handling
// =============================================================================

describe('getYamlUrlFromParams', () => {
  const originalLocation = window.location

  beforeEach(() => {
    // @ts-expect-error - mocking window.location
    delete window.location
  })

  afterEach(() => {
    window.location = originalLocation
  })

  it('should return yaml parameter value', () => {
    // @ts-expect-error - mocking window.location
    window.location = new URL('https://example.com/?yaml=form.yaml')

    const result = getYamlUrlFromParams()
    expect(result).toBe('form.yaml')
  })

  it('should return null when no yaml parameter', () => {
    // @ts-expect-error - mocking window.location
    window.location = new URL('https://example.com/')

    const result = getYamlUrlFromParams()
    expect(result).toBeNull()
  })

  it('should handle URL encoded paths', () => {
    // @ts-expect-error - mocking window.location
    window.location = new URL('https://example.com/?yaml=path%2Fto%2Fform.yaml')

    const result = getYamlUrlFromParams()
    expect(result).toBe('path/to/form.yaml')
  })
})

// =============================================================================
// Tests: Error Formatting
// =============================================================================

describe('formatFileLoadError', () => {
  it('should format error message', () => {
    const error = {
      type: 'INVALID_FILE_TYPE' as const,
      message: 'Invalid file',
    }

    const formatted = formatFileLoadError(error)
    expect(formatted).toContain('Invalid file')
  })

  it('should include details if present', () => {
    const error = {
      type: 'FETCH_ERROR' as const,
      message: 'Failed to fetch',
      details: 'HTTP 404',
    }

    const formatted = formatFileLoadError(error)
    expect(formatted).toContain('Failed to fetch')
    expect(formatted).toContain('HTTP 404')
  })
})

// =============================================================================
// Tests: Drop Zone Setup
// =============================================================================

// Helper to create mock drag event (DragEvent not available in jsdom)
function createMockDragEvent(type: string): Event {
  const event = new Event(type, { bubbles: true, cancelable: true })
  // Add dataTransfer property
  Object.defineProperty(event, 'dataTransfer', {
    value: { dropEffect: 'none', files: [] },
    writable: true,
  })
  return event
}

describe('setupDropZone', () => {
  let element: HTMLDivElement
  let callback: ReturnType<typeof vi.fn>
  let cleanup: () => void

  beforeEach(() => {
    element = document.createElement('div')
    callback = vi.fn()
    cleanup = setupDropZone({
      element,
      onLoad: callback,
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('should add drag-over class on dragover', () => {
    const event = createMockDragEvent('dragover')
    element.dispatchEvent(event)

    expect(element.classList.contains('drag-over')).toBe(true)
  })

  it('should remove drag-over class on dragleave', () => {
    element.classList.add('drag-over')

    const event = createMockDragEvent('dragleave')
    element.dispatchEvent(event)

    expect(element.classList.contains('drag-over')).toBe(false)
  })

  it('should remove event listeners on cleanup', () => {
    cleanup()

    const event = createMockDragEvent('dragover')
    element.dispatchEvent(event)

    // Should not add class after cleanup
    expect(element.classList.contains('drag-over')).toBe(false)
  })
})

// =============================================================================
// Tests: File Input Creation
// =============================================================================

describe('createFileInput', () => {
  it('should create input element with correct attributes', () => {
    const callback = vi.fn()
    const input = createFileInput({ onLoad: callback })

    expect(input.type).toBe('file')
    expect(input.accept).toBe('.yaml,.yml')
    expect(input.multiple).toBe(false)
  })

  it('should create multiple input when option is true', () => {
    const callback = vi.fn()
    const input = createFileInput({ onLoad: callback, multiple: true })

    expect(input.multiple).toBe(true)
  })
})

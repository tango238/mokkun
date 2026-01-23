/**
 * ImageUploader Component Tests
 * 画像アップローダーコンポーネントのテスト
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  ImageUploader,
  type ImageUploaderConfig,
  type ImageUploaderState,
  type ImageItem,
  type ImageUploaderCallbacks,
  type ValidationResult,
  type UploadStatus,
  type RejectedFile,
  validateFile,
  formatFileSize,
} from '../renderer/components/image-uploader'

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

function createMockFile(
  name: string = 'test.jpg',
  size: number = 1024 * 1024,
  type: string = 'image/jpeg'
): File {
  // Create a blob with the correct size by using ArrayBuffer
  const buffer = new ArrayBuffer(size)
  const blob = new Blob([buffer], { type })
  return new File([blob], name, { type })
}

// =============================================================================
// ImageUploader Tests
// =============================================================================

describe('ImageUploader', () => {
  let container: HTMLElement

  const defaultConfig: ImageUploaderConfig = {
    id: 'facility-images',
    label: 'Facility Images',
    acceptedFormats: ['image/jpeg', 'image/png', 'image/webp'],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 10,
    minFiles: 0,
  }

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
    it('should initialize with empty state', () => {
      const uploader = new ImageUploader(defaultConfig, container)
      const state = uploader.getState()

      expect(state.images).toEqual([])
      expect(state.mainImageId).toBeNull()
      expect(state.isDraggingOver).toBe(false)
      expect(state.uploadProgress).toEqual({})
      expect(state.uploadStatus).toEqual({})
      expect(state.rejectedFiles).toEqual([])
    })

    it('should initialize with provided images', () => {
      const initialImages: ImageItem[] = [
        { id: 'img1', file: null, previewUrl: 'https://example.com/1.jpg', name: 'image1.jpg', size: 1000, isMain: true },
        { id: 'img2', file: null, previewUrl: 'https://example.com/2.jpg', name: 'image2.jpg', size: 2000, isMain: false },
      ]
      const uploader = new ImageUploader(defaultConfig, container, {}, initialImages)
      const state = uploader.getState()

      expect(state.images.length).toBe(2)
      expect(state.mainImageId).toBe('img1')
    })

    it('should set first image as main if none specified', () => {
      const initialImages: ImageItem[] = [
        { id: 'img1', file: null, previewUrl: 'https://example.com/1.jpg', name: 'image1.jpg', size: 1000, isMain: false },
        { id: 'img2', file: null, previewUrl: 'https://example.com/2.jpg', name: 'image2.jpg', size: 2000, isMain: false },
      ]
      const uploader = new ImageUploader(defaultConfig, container, {}, initialImages)

      expect(uploader.getState().mainImageId).toBe('img1')
    })
  })

  // ===========================================================================
  // Rendering Tests
  // ===========================================================================

  describe('Rendering', () => {
    it('should render upload zone', () => {
      const uploader = new ImageUploader(defaultConfig, container)
      uploader.render()

      // Container itself gets the class
      expect(container.classList.contains('image-uploader')).toBe(true)
      expect(container.querySelector('.upload-dropzone')).toBeTruthy()
    })

    it('should render header with label', () => {
      const uploader = new ImageUploader(defaultConfig, container)
      uploader.render()

      const header = container.querySelector('.uploader-header')
      expect(header).toBeTruthy()
      expect(header?.textContent).toContain('Facility Images')
    })

    it('should render image count', () => {
      const uploader = new ImageUploader(defaultConfig, container)
      uploader.render()

      const counter = container.querySelector('.uploader-counter')
      expect(counter?.textContent).toContain('0 / 10')
    })

    it('should render image grid when images exist', () => {
      const initialImages: ImageItem[] = [
        { id: 'img1', file: null, previewUrl: 'https://example.com/1.jpg', name: 'image1.jpg', size: 1000, isMain: true },
      ]
      const uploader = new ImageUploader(defaultConfig, container, {}, initialImages)
      uploader.render()

      expect(container.querySelector('.image-grid')).toBeTruthy()
      expect(container.querySelectorAll('.image-item').length).toBe(1)
    })

    it('should show main badge on main image', () => {
      const initialImages: ImageItem[] = [
        { id: 'img1', file: null, previewUrl: 'https://example.com/1.jpg', name: 'image1.jpg', size: 1000, isMain: true },
      ]
      const uploader = new ImageUploader(defaultConfig, container, {}, initialImages)
      uploader.render()

      expect(container.querySelector('.main-badge')).toBeTruthy()
    })

    it('should render description if provided', () => {
      const config = { ...defaultConfig, description: 'Upload facility photos' }
      const uploader = new ImageUploader(config, container)
      uploader.render()

      expect(container.textContent).toContain('Upload facility photos')
    })

    it('should render file size hint', () => {
      const uploader = new ImageUploader(defaultConfig, container)
      uploader.render()

      expect(container.textContent).toContain('5.0 MB')
    })

    it('should render accepted formats hint', () => {
      const uploader = new ImageUploader(defaultConfig, container)
      uploader.render()

      expect(container.textContent).toContain('JPEG')
      expect(container.textContent).toContain('PNG')
      expect(container.textContent).toContain('WebP')
    })
  })

  // ===========================================================================
  // File Validation Tests
  // ===========================================================================

  describe('File Validation', () => {
    it('should validate file format - valid jpeg', () => {
      const file = createMockFile('test.jpg', 1024, 'image/jpeg')
      const result = validateFile(file, defaultConfig)

      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('should validate file format - valid png', () => {
      const file = createMockFile('test.png', 1024, 'image/png')
      const result = validateFile(file, defaultConfig)

      expect(result.valid).toBe(true)
    })

    it('should validate file format - valid webp', () => {
      const file = createMockFile('test.webp', 1024, 'image/webp')
      const result = validateFile(file, defaultConfig)

      expect(result.valid).toBe(true)
    })

    it('should reject invalid file format', () => {
      const file = createMockFile('test.gif', 1024, 'image/gif')
      const result = validateFile(file, defaultConfig)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('対応していないファイル形式です。JPEG, PNG, WebPのみ対応しています。')
    })

    it('should reject file exceeding max size', () => {
      const file = createMockFile('test.jpg', 10 * 1024 * 1024, 'image/jpeg') // 10MB
      const result = validateFile(file, defaultConfig)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('5.0 MB'))).toBe(true)
    })

    it('should accept file within size limit', () => {
      const file = createMockFile('test.jpg', 4 * 1024 * 1024, 'image/jpeg') // 4MB
      const result = validateFile(file, defaultConfig)

      expect(result.valid).toBe(true)
    })
  })

  // ===========================================================================
  // Add Image Tests
  // ===========================================================================

  describe('Add Images', () => {
    it('should add single image', () => {
      const onAdd = vi.fn()
      const uploader = new ImageUploader(defaultConfig, container, { onAdd })
      uploader.render()

      const file = createMockFile('test.jpg', 1024, 'image/jpeg')
      const result = uploader.addFiles([file])

      expect(result.added.length).toBe(1)
      expect(result.rejected.length).toBe(0)
      expect(uploader.getState().images.length).toBe(1)
      expect(onAdd).toHaveBeenCalled()
    })

    it('should add multiple images', () => {
      const uploader = new ImageUploader(defaultConfig, container)
      uploader.render()

      const files = [
        createMockFile('test1.jpg', 1024, 'image/jpeg'),
        createMockFile('test2.png', 2048, 'image/png'),
        createMockFile('test3.webp', 3072, 'image/webp'),
      ]
      const result = uploader.addFiles(files)

      expect(result.added.length).toBe(3)
      expect(uploader.getState().images.length).toBe(3)
    })

    it('should set first image as main when adding to empty list', () => {
      const uploader = new ImageUploader(defaultConfig, container)
      uploader.render()

      const file = createMockFile('test.jpg', 1024, 'image/jpeg')
      uploader.addFiles([file])

      const state = uploader.getState()
      expect(state.mainImageId).toBe(state.images[0].id)
      expect(state.images[0].isMain).toBe(true)
    })

    it('should reject files when max count reached', () => {
      const config = { ...defaultConfig, maxFiles: 2 }
      const uploader = new ImageUploader(config, container)
      uploader.render()

      const files = [
        createMockFile('test1.jpg', 1024, 'image/jpeg'),
        createMockFile('test2.jpg', 1024, 'image/jpeg'),
        createMockFile('test3.jpg', 1024, 'image/jpeg'),
      ]
      const result = uploader.addFiles(files)

      expect(result.added.length).toBe(2)
      expect(result.rejected.length).toBe(1)
      expect(result.rejected[0].reason).toContain('最大枚数')
    })

    it('should reject invalid files and accept valid ones', () => {
      const uploader = new ImageUploader(defaultConfig, container)
      uploader.render()

      const files = [
        createMockFile('valid.jpg', 1024, 'image/jpeg'),
        createMockFile('invalid.gif', 1024, 'image/gif'),
        createMockFile('toolarge.jpg', 10 * 1024 * 1024, 'image/jpeg'),
      ]
      const result = uploader.addFiles(files)

      expect(result.added.length).toBe(1)
      expect(result.rejected.length).toBe(2)
    })

    it('should call onError callback for rejected files', () => {
      const onError = vi.fn()
      const uploader = new ImageUploader(defaultConfig, container, { onError })
      uploader.render()

      const file = createMockFile('invalid.gif', 1024, 'image/gif')
      uploader.addFiles([file])

      expect(onError).toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // Remove Image Tests
  // ===========================================================================

  describe('Remove Images', () => {
    it('should remove image by id', () => {
      const initialImages: ImageItem[] = [
        { id: 'img1', file: null, previewUrl: 'https://example.com/1.jpg', name: 'image1.jpg', size: 1000, isMain: true },
        { id: 'img2', file: null, previewUrl: 'https://example.com/2.jpg', name: 'image2.jpg', size: 2000, isMain: false },
      ]
      const onRemove = vi.fn()
      const uploader = new ImageUploader(defaultConfig, container, { onRemove }, initialImages)
      uploader.render()

      const result = uploader.removeImage('img2')

      expect(result).toBe(true)
      expect(uploader.getState().images.length).toBe(1)
      expect(onRemove).toHaveBeenCalledWith('img2', expect.any(Object))
    })

    it('should update main image when main is removed', () => {
      const initialImages: ImageItem[] = [
        { id: 'img1', file: null, previewUrl: 'https://example.com/1.jpg', name: 'image1.jpg', size: 1000, isMain: true },
        { id: 'img2', file: null, previewUrl: 'https://example.com/2.jpg', name: 'image2.jpg', size: 2000, isMain: false },
      ]
      const uploader = new ImageUploader(defaultConfig, container, {}, initialImages)
      uploader.render()

      uploader.removeImage('img1')

      const state = uploader.getState()
      expect(state.mainImageId).toBe('img2')
      expect(state.images[0].isMain).toBe(true)
    })

    it('should clear main image when last image is removed', () => {
      const initialImages: ImageItem[] = [
        { id: 'img1', file: null, previewUrl: 'https://example.com/1.jpg', name: 'image1.jpg', size: 1000, isMain: true },
      ]
      const uploader = new ImageUploader(defaultConfig, container, {}, initialImages)
      uploader.render()

      uploader.removeImage('img1')

      expect(uploader.getState().mainImageId).toBeNull()
    })

    it('should return false for non-existent image', () => {
      const uploader = new ImageUploader(defaultConfig, container)
      uploader.render()

      const result = uploader.removeImage('non-existent')

      expect(result).toBe(false)
    })

    it('should respect minFiles constraint', () => {
      const config = { ...defaultConfig, minFiles: 1 }
      const initialImages: ImageItem[] = [
        { id: 'img1', file: null, previewUrl: 'https://example.com/1.jpg', name: 'image1.jpg', size: 1000, isMain: true },
      ]
      const uploader = new ImageUploader(config, container, {}, initialImages)
      uploader.render()

      const result = uploader.removeImage('img1')

      expect(result).toBe(false)
      expect(uploader.getState().images.length).toBe(1)
    })
  })

  // ===========================================================================
  // Reorder Tests
  // ===========================================================================

  describe('Reorder Images', () => {
    it('should move image up', () => {
      const initialImages: ImageItem[] = [
        { id: 'img1', file: null, previewUrl: 'url1', name: 'image1.jpg', size: 1000, isMain: true },
        { id: 'img2', file: null, previewUrl: 'url2', name: 'image2.jpg', size: 2000, isMain: false },
        { id: 'img3', file: null, previewUrl: 'url3', name: 'image3.jpg', size: 3000, isMain: false },
      ]
      const onReorder = vi.fn()
      const uploader = new ImageUploader(defaultConfig, container, { onReorder }, initialImages)
      uploader.render()

      const result = uploader.moveImage('img2', 'up')

      expect(result).toBe(true)
      expect(uploader.getState().images[0].id).toBe('img2')
      expect(uploader.getState().images[1].id).toBe('img1')
      expect(onReorder).toHaveBeenCalled()
    })

    it('should move image down', () => {
      const initialImages: ImageItem[] = [
        { id: 'img1', file: null, previewUrl: 'url1', name: 'image1.jpg', size: 1000, isMain: true },
        { id: 'img2', file: null, previewUrl: 'url2', name: 'image2.jpg', size: 2000, isMain: false },
      ]
      const uploader = new ImageUploader(defaultConfig, container, {}, initialImages)
      uploader.render()

      const result = uploader.moveImage('img1', 'down')

      expect(result).toBe(true)
      expect(uploader.getState().images[0].id).toBe('img2')
      expect(uploader.getState().images[1].id).toBe('img1')
    })

    it('should not move first image up', () => {
      const initialImages: ImageItem[] = [
        { id: 'img1', file: null, previewUrl: 'url1', name: 'image1.jpg', size: 1000, isMain: true },
        { id: 'img2', file: null, previewUrl: 'url2', name: 'image2.jpg', size: 2000, isMain: false },
      ]
      const uploader = new ImageUploader(defaultConfig, container, {}, initialImages)
      uploader.render()

      const result = uploader.moveImage('img1', 'up')

      expect(result).toBe(false)
      expect(uploader.getState().images[0].id).toBe('img1')
    })

    it('should not move last image down', () => {
      const initialImages: ImageItem[] = [
        { id: 'img1', file: null, previewUrl: 'url1', name: 'image1.jpg', size: 1000, isMain: true },
        { id: 'img2', file: null, previewUrl: 'url2', name: 'image2.jpg', size: 2000, isMain: false },
      ]
      const uploader = new ImageUploader(defaultConfig, container, {}, initialImages)
      uploader.render()

      const result = uploader.moveImage('img2', 'down')

      expect(result).toBe(false)
      expect(uploader.getState().images[1].id).toBe('img2')
    })

    it('should reorder images to specific positions', () => {
      const initialImages: ImageItem[] = [
        { id: 'img1', file: null, previewUrl: 'url1', name: 'image1.jpg', size: 1000, isMain: true },
        { id: 'img2', file: null, previewUrl: 'url2', name: 'image2.jpg', size: 2000, isMain: false },
        { id: 'img3', file: null, previewUrl: 'url3', name: 'image3.jpg', size: 3000, isMain: false },
      ]
      const uploader = new ImageUploader(defaultConfig, container, {}, initialImages)
      uploader.render()

      uploader.reorderImages(['img3', 'img1', 'img2'])

      const state = uploader.getState()
      expect(state.images[0].id).toBe('img3')
      expect(state.images[1].id).toBe('img1')
      expect(state.images[2].id).toBe('img2')
    })
  })

  // ===========================================================================
  // Main Image Selection Tests
  // ===========================================================================

  describe('Main Image Selection', () => {
    it('should set main image', () => {
      const initialImages: ImageItem[] = [
        { id: 'img1', file: null, previewUrl: 'url1', name: 'image1.jpg', size: 1000, isMain: true },
        { id: 'img2', file: null, previewUrl: 'url2', name: 'image2.jpg', size: 2000, isMain: false },
      ]
      const onMainChange = vi.fn()
      const uploader = new ImageUploader(defaultConfig, container, { onMainChange }, initialImages)
      uploader.render()

      const result = uploader.setMainImage('img2')

      expect(result).toBe(true)
      const state = uploader.getState()
      expect(state.mainImageId).toBe('img2')
      expect(state.images[0].isMain).toBe(false)
      expect(state.images[1].isMain).toBe(true)
      expect(onMainChange).toHaveBeenCalledWith('img2', expect.any(Object))
    })

    it('should return false for non-existent image', () => {
      const uploader = new ImageUploader(defaultConfig, container)
      uploader.render()

      const result = uploader.setMainImage('non-existent')

      expect(result).toBe(false)
    })
  })

  // ===========================================================================
  // Upload Progress Tests
  // ===========================================================================

  describe('Upload Progress', () => {
    it('should track upload progress', () => {
      const initialImages: ImageItem[] = [
        { id: 'img1', file: null, previewUrl: 'url1', name: 'image1.jpg', size: 1000, isMain: true },
      ]
      const uploader = new ImageUploader(defaultConfig, container, {}, initialImages)
      uploader.render()

      uploader.setUploadProgress('img1', 50)

      expect(uploader.getState().uploadProgress['img1']).toBe(50)
    })

    it('should remove progress when complete', () => {
      const initialImages: ImageItem[] = [
        { id: 'img1', file: null, previewUrl: 'url1', name: 'image1.jpg', size: 1000, isMain: true },
      ]
      const uploader = new ImageUploader(defaultConfig, container, {}, initialImages)
      uploader.render()

      uploader.setUploadProgress('img1', 50)
      uploader.setUploadProgress('img1', 100)

      expect(uploader.getState().uploadProgress['img1']).toBeUndefined()
    })

    it('should call onProgress callback', () => {
      const onProgress = vi.fn()
      const initialImages: ImageItem[] = [
        { id: 'img1', file: null, previewUrl: 'url1', name: 'image1.jpg', size: 1000, isMain: true },
      ]
      const uploader = new ImageUploader(defaultConfig, container, { onProgress }, initialImages)
      uploader.render()

      uploader.setUploadProgress('img1', 50)

      expect(onProgress).toHaveBeenCalledWith('img1', 50)
    })
  })

  // ===========================================================================
  // Get Value Tests
  // ===========================================================================

  describe('Get Value', () => {
    it('should return all images in order', () => {
      const initialImages: ImageItem[] = [
        { id: 'img1', file: null, previewUrl: 'url1', name: 'image1.jpg', size: 1000, isMain: true },
        { id: 'img2', file: null, previewUrl: 'url2', name: 'image2.jpg', size: 2000, isMain: false },
      ]
      const uploader = new ImageUploader(defaultConfig, container, {}, initialImages)

      const value = uploader.getValue()

      expect(value.length).toBe(2)
      expect(value[0].id).toBe('img1')
      expect(value[0].isMain).toBe(true)
    })

    it('should return main image id', () => {
      const initialImages: ImageItem[] = [
        { id: 'img1', file: null, previewUrl: 'url1', name: 'image1.jpg', size: 1000, isMain: true },
      ]
      const uploader = new ImageUploader(defaultConfig, container, {}, initialImages)

      expect(uploader.getMainImageId()).toBe('img1')
    })
  })

  // ===========================================================================
  // Clear Tests
  // ===========================================================================

  describe('Clear', () => {
    it('should clear all images', () => {
      const initialImages: ImageItem[] = [
        { id: 'img1', file: null, previewUrl: 'url1', name: 'image1.jpg', size: 1000, isMain: true },
        { id: 'img2', file: null, previewUrl: 'url2', name: 'image2.jpg', size: 2000, isMain: false },
      ]
      const uploader = new ImageUploader(defaultConfig, container, {}, initialImages)
      uploader.render()

      uploader.clear()

      const state = uploader.getState()
      expect(state.images.length).toBe(0)
      expect(state.mainImageId).toBeNull()
      expect(state.uploadProgress).toEqual({})
      expect(state.uploadStatus).toEqual({})
      expect(state.rejectedFiles).toEqual([])
    })
  })

  // ===========================================================================
  // DropZone Extended Features Tests
  // ===========================================================================

  describe('DropZone Extended Features', () => {
    describe('Error State', () => {
      it('should render with error state when error prop is true', () => {
        const config = { ...defaultConfig, error: true }
        const uploader = new ImageUploader(config, container)
        uploader.render()

        expect(container.classList.contains('has-error')).toBe(true)
        expect(container.querySelector('.upload-dropzone.has-error')).toBeTruthy()
      })

      it('should not have error class when error prop is false', () => {
        const config = { ...defaultConfig, error: false }
        const uploader = new ImageUploader(config, container)
        uploader.render()

        expect(container.classList.contains('has-error')).toBe(false)
      })
    })

    describe('Multiple File Selection', () => {
      it('should allow multiple file selection by default', () => {
        const uploader = new ImageUploader(defaultConfig, container)
        uploader.render()

        const input = container.querySelector('input[type="file"]') as HTMLInputElement
        expect(input.multiple).toBe(true)
      })

      it('should allow single file selection when multiple is false', () => {
        const config = { ...defaultConfig, multiple: false }
        const uploader = new ImageUploader(config, container)
        uploader.render()

        const input = container.querySelector('input[type="file"]') as HTMLInputElement
        expect(input.multiple).toBe(false)
      })
    })

    describe('Decorators', () => {
      it('should render custom dropzone text', () => {
        const config = {
          ...defaultConfig,
          decorators: {
            dropzoneText: 'カスタムテキスト',
            dropzoneHint: 'カスタムヒント',
          },
        }
        const uploader = new ImageUploader(config, container)
        uploader.render()

        expect(container.textContent).toContain('カスタムテキスト')
        expect(container.textContent).toContain('カスタムヒント')
      })
    })

    describe('Show Type Hint In Dropzone', () => {
      it('should show file type hint in dropzone when enabled', () => {
        const config = { ...defaultConfig, showTypeHintInDropzone: true }
        const uploader = new ImageUploader(config, container)
        uploader.render()

        const typeHint = container.querySelector('.dropzone-type-hint')
        expect(typeHint).toBeTruthy()
        expect(typeHint?.textContent).toContain('JPEG')
        expect(typeHint?.textContent).toContain('5.0 MB')
      })
    })

    describe('onSelectFiles Callback', () => {
      it('should call onSelectFiles when files are added', () => {
        const onSelectFiles = vi.fn()
        const uploader = new ImageUploader(defaultConfig, container, { onSelectFiles })
        uploader.render()

        const file = createMockFile('test.jpg', 1024, 'image/jpeg')
        uploader.addFiles([file])

        expect(onSelectFiles).toHaveBeenCalledWith([file], expect.any(Object))
      })
    })

    describe('Rejected Files Display', () => {
      it('should store rejected files in state', () => {
        const uploader = new ImageUploader(defaultConfig, container)
        uploader.render()

        const file = createMockFile('invalid.gif', 1024, 'image/gif')
        uploader.addFiles([file])

        const state = uploader.getState()
        expect(state.rejectedFiles.length).toBe(1)
        expect(state.rejectedFiles[0].reasonCode).toBe('invalid-format')
      })

      it('should render rejected files section', () => {
        const uploader = new ImageUploader(defaultConfig, container)
        uploader.render()

        const file = createMockFile('invalid.gif', 1024, 'image/gif')
        uploader.addFiles([file])

        expect(container.querySelector('.rejected-files')).toBeTruthy()
        expect(container.querySelector('.rejected-list')).toBeTruthy()
      })

      it('should clear rejected files', () => {
        const uploader = new ImageUploader(defaultConfig, container)
        uploader.render()

        const file = createMockFile('invalid.gif', 1024, 'image/gif')
        uploader.addFiles([file])

        expect(uploader.getState().rejectedFiles.length).toBe(1)

        uploader.clearRejectedFiles()

        expect(uploader.getState().rejectedFiles.length).toBe(0)
        expect(container.querySelector('.rejected-files')).toBeFalsy()
      })
    })
  })

  // ===========================================================================
  // Upload Status Tests
  // ===========================================================================

  describe('Upload Status', () => {
    it('should set upload status', () => {
      const initialImages: ImageItem[] = [
        { id: 'img1', file: null, previewUrl: 'url1', name: 'image1.jpg', size: 1000, isMain: true },
      ]
      const uploader = new ImageUploader(defaultConfig, container, {}, initialImages)
      uploader.render()

      uploader.setUploadStatus('img1', 'uploading')

      expect(uploader.getState().uploadStatus['img1']).toBe('uploading')
    })

    it('should set status to completed when progress reaches 100', () => {
      const initialImages: ImageItem[] = [
        { id: 'img1', file: null, previewUrl: 'url1', name: 'image1.jpg', size: 1000, isMain: true },
      ]
      const onUploadComplete = vi.fn()
      const uploader = new ImageUploader(defaultConfig, container, { onUploadComplete }, initialImages)
      uploader.render()

      uploader.setUploadProgress('img1', 50)
      expect(uploader.getState().uploadStatus['img1']).toBe('uploading')

      uploader.setUploadProgress('img1', 100)
      expect(uploader.getState().uploadStatus['img1']).toBe('completed')
      expect(onUploadComplete).toHaveBeenCalledWith('img1', expect.any(Object))
    })

    it('should call onUploadError when status is set to error', () => {
      const initialImages: ImageItem[] = [
        { id: 'img1', file: null, previewUrl: 'url1', name: 'image1.jpg', size: 1000, isMain: true },
      ]
      const onUploadError = vi.fn()
      const uploader = new ImageUploader(defaultConfig, container, { onUploadError }, initialImages)
      uploader.render()

      uploader.setUploadStatus('img1', 'error', 'Network error')

      expect(uploader.getState().uploadStatus['img1']).toBe('error')
      expect(onUploadError).toHaveBeenCalledWith('img1', 'Network error', expect.any(Object))
    })

    it('should start batch upload', () => {
      const initialImages: ImageItem[] = [
        { id: 'img1', file: null, previewUrl: 'url1', name: 'image1.jpg', size: 1000, isMain: true },
        { id: 'img2', file: null, previewUrl: 'url2', name: 'image2.jpg', size: 2000, isMain: false },
      ]
      const uploader = new ImageUploader(defaultConfig, container, {}, initialImages)
      uploader.render()

      uploader.startBatchUpload(['img1', 'img2'])

      const state = uploader.getState()
      expect(state.uploadStatus['img1']).toBe('uploading')
      expect(state.uploadStatus['img2']).toBe('uploading')
      expect(state.uploadProgress['img1']).toBe(0)
      expect(state.uploadProgress['img2']).toBe(0)
    })

    it('should detect active uploads', () => {
      const initialImages: ImageItem[] = [
        { id: 'img1', file: null, previewUrl: 'url1', name: 'image1.jpg', size: 1000, isMain: true },
      ]
      const uploader = new ImageUploader(defaultConfig, container, {}, initialImages)
      uploader.render()

      expect(uploader.hasActiveUploads()).toBe(false)

      uploader.setUploadStatus('img1', 'uploading')
      expect(uploader.hasActiveUploads()).toBe(true)

      uploader.setUploadProgress('img1', 100)
      expect(uploader.hasActiveUploads()).toBe(false)
    })
  })

  // ===========================================================================
  // Destroy Tests
  // ===========================================================================

  describe('Destroy', () => {
    it('should cleanup resources and clear DOM', () => {
      const initialImages: ImageItem[] = [
        { id: 'img1', file: null, previewUrl: 'url1', name: 'image1.jpg', size: 1000, isMain: true },
      ]
      const uploader = new ImageUploader(defaultConfig, container, {}, initialImages)
      uploader.render()

      uploader.destroy()

      const state = uploader.getState()
      expect(state.images.length).toBe(0)
      expect(state.mainImageId).toBeNull()
      expect(container.children.length).toBe(0)
    })
  })
})

// =============================================================================
// Utility Function Tests
// =============================================================================

describe('Utility Functions', () => {
  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(500)).toBe('500 B')
    })

    it('should format kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1.0 KB')
      expect(formatFileSize(1536)).toBe('1.5 KB')
    })

    it('should format megabytes', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1.0 MB')
      expect(formatFileSize(5.5 * 1024 * 1024)).toBe('5.5 MB')
    })

    it('should format gigabytes', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.0 GB')
    })
  })
})

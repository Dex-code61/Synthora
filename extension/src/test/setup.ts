import { vi } from 'vitest'

// Mock DOM APIs that might be used in webview HTML generation
global.document = {
  createElement: vi.fn().mockReturnValue({
    textContent: '',
    innerHTML: ''
  })
} as any

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn()
}
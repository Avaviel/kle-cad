import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import KeyboardToolbar from '../KeyboardToolbar.vue'

// Stores are mocked so this spec does not depend on browser storage; it only
// asserts the companion-link rendering of the toolbar.
vi.mock('@/stores/keyboard', () => ({
  useKeyboardStore: () => ({}),
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ isSignedIn: false }),
}))

vi.mock('@/stores/short-links', () => ({
  useShortLinksStore: () => ({ busy: false }),
}))

vi.mock('@/composables/useToast', () => ({
  toast: {
    showError: vi.fn(),
    showSuccess: vi.fn(),
    showInfo: vi.fn(),
    removeToast: vi.fn(),
  },
}))

vi.mock('@/composables/useKeyboardExport', () => ({
  useKeyboardExport: () => ({
    canExportVia: false,
    canExportQmk: false,
    downloadJson: vi.fn(),
    downloadKleInternalJson: vi.fn(),
    downloadViaJson: vi.fn(),
    downloadQmkJson: vi.fn(),
    exportToErgogenWebGui: vi.fn(),
    exportToZmkWizard: vi.fn(),
    downloadPng: vi.fn(),
    downloadHtmlFile: vi.fn(),
    downloadSvgFile: vi.fn(),
  }),
}))

vi.mock('@/composables/useKeyboardImport', () => ({
  useKeyboardImport: () => ({
    triggerFileUpload: vi.fn(),
    handleFileUpload: vi.fn(),
  }),
}))

const MODAL_STUBS = {
  UrlImportModal: true,
  QmkImportModal: true,
  ViaImportModal: true,
  MyLayoutsModal: true,
  ShortLinkConfirmModal: true,
}

describe('KeyboardToolbar YAKB link', () => {
  const mountToolbar = () => mount(KeyboardToolbar, { global: { stubs: MODAL_STUBS } })

  it('links to YAKB CAD in a new tab', () => {
    const link = mountToolbar().find('[data-testid="link-yakb-cad"]')
    expect(link.exists()).toBe(true)
    expect(link.element.tagName).toBe('A')
    expect(link.attributes('href')).toBe('https://avaviel.com/YAKB-cad')
    expect(link.attributes('target')).toBe('_blank')
    expect(link.attributes('rel')).toContain('noopener')
    expect(link.text()).toContain('YAKB')
  })

  it('sits left of Copy in the layout clipboard group', () => {
    const group = mountToolbar().find('.layout-clipboard-group')
    const buttons = group.findAll('.btn')
    expect(buttons.length).toBeGreaterThanOrEqual(3)
    expect(buttons[0]!.attributes('data-testid')).toBe('link-yakb-cad')
    expect(buttons[1]!.attributes('data-testid')).toBe('button-copy-layout')
    expect(buttons[2]!.attributes('data-testid')).toBe('button-paste-layout')
  })
})

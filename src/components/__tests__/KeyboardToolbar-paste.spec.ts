import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import KeyboardToolbar from '../KeyboardToolbar.vue'
import { toast } from '@/composables/useToast'

// Stores are mocked so this spec does not depend on browser storage; it only
// asserts the paste button's clipboard handling.
const loadKLELayout = vi.fn()
const loadKeyboard = vi.fn()

vi.mock('@/stores/keyboard', () => ({
  useKeyboardStore: () => ({ loadKLELayout, loadKeyboard }),
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

describe('KeyboardToolbar paste', () => {
  const mountToolbar = () => mount(KeyboardToolbar, { global: { stubs: MODAL_STUBS } })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('explains a browser-blocked clipboard read', async () => {
    const denied = new DOMException('Clipboard read was blocked', 'NotAllowedError')
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn(), readText: vi.fn().mockRejectedValue(denied) },
      configurable: true,
    })

    await mountToolbar().find('[data-testid="button-paste-layout"]').trigger('click')
    await flushPromises()

    expect(toast.showError).toHaveBeenCalledWith(
      'Browser blocked clipboard access — paste into the JSON panel instead.',
      'Paste failed',
    )
    expect(loadKLELayout).not.toHaveBeenCalled()
    expect(loadKeyboard).not.toHaveBeenCalled()
  })

  it('loads pasted KLE JSON through the store', async () => {
    const layout = [{ name: 'Pasted layout' }, ['New']]
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn(), readText: vi.fn().mockResolvedValue(JSON.stringify(layout)) },
      configurable: true,
    })

    await mountToolbar().find('[data-testid="button-paste-layout"]').trigger('click')
    await flushPromises()

    expect(loadKLELayout).toHaveBeenCalledTimes(1)
    expect(toast.showSuccess).toHaveBeenCalledWith(
      'Layout JSON pasted',
      'Pasted',
      expect.objectContaining({ duration: 2000 }),
    )
  })
});

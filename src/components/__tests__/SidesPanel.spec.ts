import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SidesPanel from '../SidesPanel.vue'
import { useKeyboardStore } from '@/stores/keyboard'

describe('SidesPanel', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('shows empty copy when there are no corners', () => {
    const wrapper = mount(SidesPanel, { global: { plugins: [createPinia()] } })
    expect(wrapper.text()).toContain('No sides yet')
  })

  it('lists a side after Add Corner', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useKeyboardStore()
    store.clearLayout()
    store.addCorner(1)

    const wrapper = mount(SidesPanel, { global: { plugins: [pinia] } })
    expect(wrapper.text()).toContain('Side 1')
    expect(wrapper.text()).toContain('1 corner')
  })
})

import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ModulesPanel from '../ModulesPanel.vue'
import { useKeyboardStore } from '@/stores/keyboard'

describe('ModulesPanel', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('shows empty copy when there are no corners', () => {
    const wrapper = mount(ModulesPanel, { global: { plugins: [createPinia()] } })
    expect(wrapper.text()).toContain('No modules yet')
  })

  it('lists Module N after Add Corner', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useKeyboardStore()
    store.clearLayout()
    store.addCorner(1)

    const wrapper = mount(ModulesPanel, { global: { plugins: [pinia] } })
    expect(wrapper.text()).toContain('Module 1')
    expect(wrapper.text()).toContain('1 corner')
  })

  it('writes the module name into _zones JSON', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useKeyboardStore()
    store.clearLayout()
    store.addCorner(2)
    store.updateZoneSetting(2, { name: 'Left alphas' })

    const compact = JSON.stringify(store.getSerializedData('kle'))
    expect(compact).toContain('_zones')
    expect(compact).toContain('Left alphas')
  })
})

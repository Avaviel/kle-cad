import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppFooter from '../AppFooter.vue'

const ABOUT_URL = 'https://avaviel.github.io/kle-cad/about.html'

const aboutHtml = () =>
  readFileSync(join(process.cwd(), 'public/about.html'), 'utf-8')

describe('AppFooter How it works', () => {
  it('links to the standalone explainer page', () => {
    const link = mount(AppFooter).find('[data-testid="footer-how-it-works"]')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe(ABOUT_URL)
    expect(link.text()).toContain('How it works')
  })

  it('explainer page covers editor, YAKB, Fusion 360, and YouTube', () => {
    const html = aboutHtml()
    expect(html).toContain('https://avaviel.com/kle-cad')
    expect(html).toContain('https://avaviel.com/yacb')
    expect(html).toContain('https://youtube.com/@avaviel')
    expect(html).toContain('https://avaviel.github.io/kle-cad')
    expect(html).toContain('https://avaviel.github.io/yacb')
    expect(html).toContain('Fusion 360')
    expect(html).toContain('KLE-CAD')
    expect(html).toContain('YACB')
  })
})

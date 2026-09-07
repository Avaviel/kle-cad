import { test, expect } from '@playwright/test'
import { KeyboardEditorPage } from './pages/KeyboardEditorPage'
import { CanvasTestHelper } from './helpers/canvas-test-helpers'
import { PlateGeneratorHelper } from './helpers/plate-generator-helpers'
import { SELECTORS } from './constants/selectors'

const PG = SELECTORS.PLATE_GENERATOR

test.describe.skip('Plate Generator (removed from this fork; YAKB is the plate engine)', () => {
  test('shows idle state when section is expanded', async ({ page }) => {
    const editor = new KeyboardEditorPage(page)
    await editor.goto()

    const helper = new PlateGeneratorHelper(page)
    await helper.expandSection()

    // Idle message should be shown before any generation
    await expect(page.locator(PG.IDLE_MESSAGE)).toBeVisible()
    // Generate button should be present (disabled because layout is empty)
    await expect(page.locator(PG.GENERATE_BTN)).toBeVisible()
  })

  test('generates plate from simple layout and shows SVG preview', async ({ page }) => {
    const editor = new KeyboardEditorPage(page)
    await editor.goto()

    // Load a minimal 3-key layout
    const canvas = new CanvasTestHelper(page)
    await canvas.loadJsonLayout(JSON.stringify([['A', 'B', 'C']]))

    const helper = new PlateGeneratorHelper(page)
    await helper.expandSection()
    await helper.generateAndWait()

    // SVG preview must be present
    await expect(page.locator(PG.SVG_PREVIEW)).toBeVisible()

    // Download buttons must appear after successful generation
    await expect(page.locator(PG.DOWNLOAD_SVG)).toBeVisible()
    await expect(page.locator(PG.DOWNLOAD_DXF)).toBeVisible()
  })

  test('generates 3D preview when outline is enabled', async ({ page }) => {
    const editor = new KeyboardEditorPage(page)
    await editor.goto()

    const canvas = new CanvasTestHelper(page)
    await canvas.loadJsonLayout(JSON.stringify([['A', 'B', 'C']]))

    const helper = new PlateGeneratorHelper(page)
    await helper.expandSection()
    await helper.enableOutline('rectangular')
    await helper.generateAndWait()

    // Switch to 3D tab in the results panel
    await page.locator(PG.RESULTS_TAB_3D).click()

    // Three.js canvas must be visible (shown once STL data is ready and threeReady=true)
    await expect(page.locator(PG.THREE_CANVAS)).toBeVisible({ timeout: 15000 })
  })
})

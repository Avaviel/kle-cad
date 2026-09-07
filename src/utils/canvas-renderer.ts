import type { Key, KeyboardMetadata } from '@adamws/kle-serial'
import { D } from './decimal-math'
import { parseBorderRadius, createRoundedRectanglePath } from './border-radius'
import { svgCache } from './caches/SVGCache'
import { parseCache } from './caches/ParseCache'
import { imageCache } from './caches/ImageCache'
import { labelParser } from './parsers/LabelParser'
import { keyRenderer } from './renderers/KeyRenderer'
import { LabelRenderer } from './renderers/LabelRenderer'
import { rotationRenderer } from './renderers/RotationRenderer'
import { LinkTracker, linkTracker } from './renderers/LinkTracker'
import { BoundsCalculator } from './utils/BoundsCalculator'
import { HitTester } from './utils/HitTester'
import type { LabelNode } from './parsers/LabelAST'
import {
  buildZoneOutline,
  getCornerIndex,
  getCornerZone,
  getZoneSettings,
  isCorner,
  roundedPolygonCommands,
  zoneColor,
} from './cad-corners'

export interface RenderOptions {
  unit: number
  background: string
  showGrid?: boolean
  gridStep?: number
  highlightColor?: string
  scale?: number
  fontFamily?: string
  allowLabelOverflow?: boolean
  showCornerMarkers?: boolean
}

export interface KeyRenderParams {
  // Overall dimensions
  capwidth: number
  capheight: number
  capx: number
  capy: number
  capwidth2?: number
  capheight2?: number
  capx2?: number
  capy2?: number

  // Outer border dimensions
  outercapwidth: number
  outercapheight: number
  outercapx: number
  outercapy: number
  outercapwidth2?: number
  outercapheight2?: number
  outercapx2?: number
  outercapy2?: number

  // Inner surface dimensions
  innercapwidth: number
  innercapheight: number
  innercapx: number
  innercapy: number
  innercapwidth2?: number
  innercapheight2?: number
  innercapx2?: number
  innercapy2?: number

  // Text area dimensions
  textcapwidth: number
  textcapheight: number
  textcapx: number
  textcapy: number

  // Colors
  darkColor: string
  lightColor: string

  // Flags
  nonRectangular: boolean

  // Origin for rotation
  origin_x: number
  origin_y: number
}

/**
 * Optional collaborators a CanvasRenderer can be constructed with.
 *
 * Every renderer collaborator is otherwise a module-level singleton. That is
 * fine for content-keyed caches (`svgCache`, `parseCache`, `imageCache`) but
 * not for the LinkTracker, which is *cleared on every render*. A second
 * renderer drawing to an offscreen canvas would wipe the visible editor's link
 * hit boxes, so offscreen callers pass their own tracker here.
 */
export interface CanvasRendererDeps {
  linkTracker?: LinkTracker
}

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D
  private options: RenderOptions
  private onImageLoadCallback?: () => void
  private onImageErrorCallback?: (url: string) => void
  private boundsCalculator: BoundsCalculator
  private hitTester: HitTester
  private linkTracker: LinkTracker
  private labelRenderer: LabelRenderer

  constructor(canvas: HTMLCanvasElement, options: RenderOptions, deps?: CanvasRendererDeps) {
    this.ctx = canvas.getContext('2d')!
    this.options = options
    this.boundsCalculator = new BoundsCalculator(options.unit)
    this.hitTester = new HitTester(options.unit, (key, opts) =>
      keyRenderer.getRenderParams(key, opts),
    )
    // Defaults to the shared singleton so existing callers keep today's behaviour
    this.linkTracker = deps?.linkTracker ?? linkTracker
    this.labelRenderer = new LabelRenderer(this.linkTracker)
  }

  /**
   * Set a callback to be called when any image loads
   */
  public setImageLoadCallback(callback: () => void): void {
    this.onImageLoadCallback = callback
  }

  /**
   * Set a callback to be called when any image fails to load
   */
  public setImageErrorCallback(callback: (url: string) => void): void {
    this.onImageErrorCallback = callback
  }

  public getContext(): CanvasRenderingContext2D {
    return this.ctx
  }

  public getOptions(): RenderOptions {
    return this.options
  }

  public updateOptions(options: RenderOptions): void {
    this.options = options
    this.boundsCalculator.setUnit(options.unit)
    this.hitTester.setUnit(options.unit)
    // The shared keyRenderer colour cache is deliberately NOT cleared here.
    // It memoizes a pure function under a key that contains both its inputs
    // (`${color}-${factor}`), so an entry can never go stale and options have
    // no bearing on it. Clearing it was also a cross-renderer side effect:
    // every offscreen render (import previews, thumbnails) calls this, and
    // would have wiped the cache the visible editor depends on.
  }

  /**
   * Get SVG cache statistics (for performance monitoring)
   */
  public getSVGCacheStats() {
    return svgCache.getStats()
  }

  /**
   * Clear SVG cache (called on layout changes)
   */
  public clearSVGCache(): void {
    svgCache.clear()
  }

  /**
   * Get image cache statistics (for performance monitoring)
   */
  public getImageCacheStats() {
    return imageCache.getStats()
  }

  /**
   * Clear image cache (called on layout changes)
   */
  public clearImageCache(): void {
    imageCache.clear()
  }

  /**
   * Convert inline SVG string to a data URL that can be used as an image source
   * Uses SVGCache to avoid redundant encoding operations
   */
  private svgToDataUrl(svgContent: string): string {
    return svgCache.toDataUrl(svgContent)
  }

  /**
   * Load an image from a URL and cache it
   * Tested formats: PNG, SVG
   * Other formats may work but are not officially tested
   */
  private loadImage(url: string, onLoad?: () => void): void {
    imageCache.loadImage(url, onLoad, this.onImageErrorCallback)
  }

  /**
   * Get a loaded image from cache
   */
  private getImage(url: string): HTMLImageElement | null {
    return imageCache.getImage(url)
  }

  private getKeycapColor(params: KeyRenderParams): string {
    // Always return the light color - no gradients
    return params.lightColor
  }

  private alignToPixel(value: number): number {
    // Align to pixel boundary for crisp 1px strokes
    return Math.round(value) + 0.5
  }

  private drawRotationOriginIndicator(key: Key) {
    rotationRenderer.drawRotationOriginIndicator(this.ctx, key, this.options.unit)
  }

  private drawRotationPoints(
    selectedKeys: Key[],
    hoveredPointId?: string,
    selectedRotationOrigin?: { x: number; y: number } | null,
  ) {
    rotationRenderer.drawRotationPoints(
      this.ctx,
      selectedKeys,
      this.options.unit,
      hoveredPointId,
      selectedRotationOrigin,
    )
  }

  public getRotationPointAtPosition(
    canvasX: number,
    canvasY: number,
  ): { id: string; x: number; y: number; type: 'corner' | 'center' } | null {
    return rotationRenderer.getRotationPointAtPosition(canvasX, canvasY)
  }

  private drawKey(
    key: Key,
    isSelected = false,
    isHovered = false,
    hoveredLinkHref?: string | null,
    isSearchMatch = false,
    isPreview = false,
  ) {
    // Use KeyRenderer for shape rendering
    keyRenderer.drawKey(this.ctx, key, {
      unit: this.options.unit,
      isSelected,
      isHovered,
      isSearchMatch,
      selectionColor: this.options.highlightColor,
      isPreview,
    })

    // Get params for label rendering
    const params = keyRenderer.getRenderParams(key, { unit: this.options.unit })
    const isRotaryEncoder = key.sm === 'rot_ec11'

    // Labels need same transformations
    this.ctx.save()
    if (key.rotation_angle) {
      this.ctx.translate(params.origin_x, params.origin_y)
      this.ctx.rotate(D.degreesToRadians(key.rotation_angle))
      this.ctx.translate(-params.origin_x, -params.origin_y)
    }
    if (key.ghost) {
      this.ctx.globalAlpha = 0.3
    } else if (isPreview) {
      this.ctx.globalAlpha = 0.4
    }

    // Prepare label options and callbacks
    const labelOptions = {
      unit: this.options.unit,
      fontFamily: this.options.fontFamily,
      allowOverflow: this.options.allowLabelOverflow,
    }

    const getImageFn = (url: string) => this.getImage(url)
    const loadImageFn = (url: string, onLoad?: () => void) => this.loadImage(url, onLoad)

    // Draw labels using LabelRenderer
    if (isRotaryEncoder) {
      this.labelRenderer.drawRotaryEncoderLabels(
        this.ctx,
        key,
        params,
        labelOptions,
        getImageFn,
        loadImageFn,
        this.onImageLoadCallback,
        hoveredLinkHref,
      )
    } else {
      this.labelRenderer.drawKeyLabels(
        this.ctx,
        key,
        params,
        labelOptions,
        getImageFn,
        loadImageFn,
        this.onImageLoadCallback,
        hoveredLinkHref,
      )
    }
    this.ctx.restore()
  }

  /**
   * Parse text with HTML formatting tags and extract AST nodes.
   * Supports: <b>, <strong>, <i>, <em>, <u>, <a>, <img>, <svg>
   *
   * Uses ParseCache to avoid redundant parsing for the same label content.
   *
   * Image formats:
   * - External images: <img src="path/to/image.png"> or <img src="path/to/image.svg">
   * - Inline SVG: <svg width="32" height="32">...</svg>
   *
   * Tested formats: PNG (external), SVG (external and inline)
   * Other raster formats (JPG, GIF, WebP) may work but are not officially tested
   *
   * SVG Requirements (both external and inline):
   * - Must have explicit width and height attributes (not percentages)
   * - External resources (CSS, images) must be inlined as data URLs
   * - Server must support CORS for cross-origin SVG files (external only)
   */
  private parseHtmlText(text: string): LabelNode[] {
    return labelParser.parse(text)
  }

  /**
   * Get parse cache statistics (for performance monitoring)
   */
  public getParseCacheStats() {
    return parseCache.getStats()
  }

  /**
   * Clear parse cache (called on layout changes)
   */
  public clearParseCache(): void {
    parseCache.clear()
  }

  public render(
    keys: Key[],
    selectedKeys: Key[],
    metadata: KeyboardMetadata,
    clearCanvas: boolean = true,
    showRotationPoints: boolean = false,
    hoveredRotationPointId?: string,
    selectedRotationOrigin?: { x: number; y: number } | null,
    popupHoveredKey?: Key | null,
    hoveredLinkHref?: string | null,
    searchMatchKeys: Key[] = [],
    previewKeys: Key[] = [],
  ) {
    // Clear link tracker at start of each render
    this.linkTracker.clear()

    // Clear canvas if requested
    if (clearCanvas) {
      this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)

      // Fill with background color, applying border radius (default 6px like original KLE)
      this.ctx.fillStyle = this.options.background

      const radiiValue = metadata.radii?.trim() || '6px'
      const corners = parseBorderRadius(radiiValue, this.ctx.canvas.width, this.ctx.canvas.height)
      createRoundedRectanglePath(
        this.ctx,
        0,
        0,
        this.ctx.canvas.width,
        this.ctx.canvas.height,
        corners,
      )
      this.ctx.fill()
    }

    this.ctx.save()

    if (this.options.showGrid) {
      this.drawGrid()
    }

    const showCornerMarkers = this.options.showCornerMarkers !== false
    const drawableKeys = showCornerMarkers ? keys : keys.filter((key) => !isCorner(key))
    const drawableSelected = showCornerMarkers
      ? selectedKeys
      : selectedKeys.filter((key) => !isCorner(key))

    // Create sets for efficient lookup
    const selectedKeySet = new Set(drawableSelected)
    const searchMatchSet = new Set(searchMatchKeys)

    // Separate keys into selected and non-selected. Draw non-corners first so
    // outline markers sit on top of keycaps.
    const nonSelectedKeys = drawableKeys.filter((key) => !selectedKeySet.has(key))

    // Sort both groups by row/column for proper rendering order within each group
    const sortedNonSelectedKeys = [...nonSelectedKeys].sort((a, b) => {
      return (
        (a.rotation_angle || 0) - (b.rotation_angle || 0) ||
        (a.rotation_x || 0) - (b.rotation_x || 0) ||
        (a.rotation_y || 0) - (b.rotation_y || 0) ||
        a.y - b.y ||
        a.x - b.x
      )
    })

    const sortedSelectedKeys = [...selectedKeys].sort((a, b) => {
      return (
        (a.rotation_angle || 0) - (b.rotation_angle || 0) ||
        (a.rotation_x || 0) - (b.rotation_x || 0) ||
        (a.rotation_y || 0) - (b.rotation_y || 0) ||
        a.y - b.y ||
        a.x - b.x
      )
    })

    // Partition non-selected keys in a single pass to preserve layer order:
    // regular keys drawn first (bottom), then match keys on top so the amber
    // border is never occluded by a neighbouring regular key. Corners are
    // painted after the dashed overlay so they sit on keycaps.
    const regularKeys: Key[] = []
    const matchKeys: Key[] = []
    const cornerKeys: Key[] = []
    for (const key of sortedNonSelectedKeys) {
      if (isCorner(key)) cornerKeys.push(key)
      else if (searchMatchSet.has(key)) matchKeys.push(key)
      else regularKeys.push(key)
    }
    const selectedNonCorners: Key[] = []
    const selectedCorners: Key[] = []
    for (const key of sortedSelectedKeys) {
      if (isCorner(key)) selectedCorners.push(key)
      else selectedNonCorners.push(key)
    }

    regularKeys.forEach((key) => this.drawKey(key, false, false, hoveredLinkHref, false))
    matchKeys.forEach((key) => this.drawKey(key, false, false, hoveredLinkHref, true))

    selectedNonCorners.forEach((key) => {
      this.drawKey(key, true, false, hoveredLinkHref)
    })

    this.drawZoneOverlay(keys, metadata)

    if (showCornerMarkers) {
      cornerKeys.forEach((key) => this.drawKey(key, false, false, hoveredLinkHref, false))
      selectedCorners.forEach((key) => this.drawKey(key, true, false, hoveredLinkHref))
    }

    // Draw popup-hovered key on top with blue highlight (for overlapping key disambiguation)
    if (popupHoveredKey) {
      this.drawKey(popupHoveredKey, false, true, hoveredLinkHref)
    }

    // Draw transient tool-preview keys (e.g. mirror result) on top of everything else
    previewKeys.forEach((key) => this.drawKey(key, false, false, undefined, false, true))

    // Draw rotation origin indicators on top of all keys for selected keys
    selectedKeys.forEach((key) => {
      const hasRotation = key.rotation_angle && key.rotation_angle !== 0
      const hasNonZeroOrigin =
        (key.rotation_x && key.rotation_x !== 0) || (key.rotation_y && key.rotation_y !== 0)
      if (hasRotation || hasNonZeroOrigin) {
        this.drawRotationOriginIndicator(key)
      }
    })

    // Draw rotation points if requested
    if (showRotationPoints && selectedKeys.length > 0) {
      this.drawRotationPoints(selectedKeys, hoveredRotationPointId, selectedRotationOrigin)
    }

    this.ctx.restore()
  }

  private keyCenter(key: Key): { x: number; y: number } {
    const params = keyRenderer.getRenderParams(key, { unit: this.options.unit })
    let x = params.capx + params.capwidth / 2
    let y = params.capy + params.capheight / 2
    if (key.rotation_angle) {
      const rad = (key.rotation_angle * Math.PI) / 180
      const ox = params.origin_x
      const oy = params.origin_y
      const dx = x - ox
      const dy = y - oy
      x = ox + dx * Math.cos(rad) - dy * Math.sin(rad)
      y = oy + dx * Math.sin(rad) + dy * Math.cos(rad)
    }
    return { x, y }
  }

  private drawZoneOverlay(keys: Key[], metadata: KeyboardMetadata): void {
    const byZone = new Map<number, { index: number; x: number; y: number }[]>()
    for (const key of keys) {
      if (!isCorner(key)) continue
      const zone = getCornerZone(key)
      const center = this.keyCenter(key)
      const list = byZone.get(zone) || []
      list.push({ index: getCornerIndex(key), ...center })
      byZone.set(zone, list)
    }

    const mmToPx = this.options.unit / 19.05
    const ctx = this.ctx
    for (const [zone, raw] of byZone) {
      raw.sort((a, b) => a.index - b.index)
      if (raw.length < 2) continue
      const settings = getZoneSettings(metadata, zone)
      const outline = buildZoneOutline(
        raw.map((p) => ({ x: p.x, y: p.y })),
        settings,
        mmToPx,
      )
      const filletPx = settings.fillet * mmToPx
      const cmds = roundedPolygonCommands(outline, filletPx)
      if (cmds.length === 0) continue
      ctx.save()
      ctx.setLineDash([6, 4])
      ctx.strokeStyle = zoneColor(zone)
      ctx.lineWidth = 2
      ctx.beginPath()
      for (const cmd of cmds) {
        if (cmd.type === 'move') ctx.moveTo(cmd.x, cmd.y)
        else if (cmd.type === 'line') ctx.lineTo(cmd.x, cmd.y)
        else ctx.quadraticCurveTo(cmd.cx, cmd.cy, cmd.x, cmd.y)
      }
      ctx.closePath()
      ctx.stroke()
      ctx.restore()
    }
  }

  private drawGrid(): void {
    const ctx = this.ctx
    const unit = this.options.unit
    const gridStep = this.options.gridStep ?? 1
    const transform = ctx.getTransform()
    const scale = transform.a // zoom * dpr

    // Compute visible range in keyboard units, aligned to gridStep boundaries
    const startKX = Math.floor((0 - transform.e) / (scale * unit) / gridStep) * gridStep - gridStep
    const endKX =
      Math.ceil((ctx.canvas.width - transform.e) / (scale * unit) / gridStep) * gridStep + gridStep
    const startKY = Math.floor((0 - transform.f) / (scale * unit) / gridStep) * gridStep - gridStep
    const endKY =
      Math.ceil((ctx.canvas.height - transform.f) / (scale * unit) / gridStep) * gridStep + gridStep

    // 1 device pixel expressed in ctx coordinates
    const px = 1 / scale

    ctx.save()
    ctx.beginPath()
    ctx.setLineDash([4 * px, 4 * px])
    ctx.lineWidth = px
    ctx.strokeStyle = 'rgba(128, 128, 128, 0.35)'

    const nX = Math.round((endKX - startKX) / gridStep)
    for (let i = 0; i <= nX; i++) {
      const kx = startKX + i * gridStep
      ctx.moveTo(kx * unit, startKY * unit)
      ctx.lineTo(kx * unit, endKY * unit)
    }
    const nY = Math.round((endKY - startKY) / gridStep)
    for (let i = 0; i <= nY; i++) {
      const ky = startKY + i * gridStep
      ctx.moveTo(startKX * unit, ky * unit)
      ctx.lineTo(endKX * unit, ky * unit)
    }

    ctx.stroke()
    ctx.restore()
  }

  public calculateBounds(keys: Key[]) {
    return this.boundsCalculator.calculateBounds(keys)
  }

  public calculateRotatedKeyBounds(key: Key): {
    minX: number
    minY: number
    maxX: number
    maxY: number
  } {
    return this.boundsCalculator.calculateRotatedKeyBounds(key)
  }

  public getKeyAtPosition(x: number, y: number, keys: Key[]): Key | null {
    return this.hitTester.getKeyAtPosition(x, y, keys)
  }

  public getAllKeysAtPosition(x: number, y: number, keys: Key[]): Key[] {
    return this.hitTester.getAllKeysAtPosition(x, y, keys)
  }

  /**
   * Get the link at a canvas position (for click/hover detection)
   * @param x - X coordinate in canvas pixels
   * @param y - Y coordinate in canvas pixels
   * @returns The link at this position, or null if none
   */
  public getLinkAtPosition(x: number, y: number) {
    return this.linkTracker.getLinkAtPosition(x, y)
  }
}

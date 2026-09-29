import { describe, it, expect } from 'vitest'
import { Key } from '@adamws/kle-serial'
import {
  applyCornerFields,
  buildZoneOutline,
  concaveHull,
  convexHull,
  cornerLabel,
  DEFAULT_ZONE_SETTINGS,
  getZoneSettings,
  hydrateCorners,
  injectCadCornerProps,
  isCorner,
  isSimplePolygon,
  nextCornerIndex,
  nextNewZone,
  offsetPolygon,
  orderRing,
  parseCornerLegend,
  roundedPolygonCommands,
  usedZones,
  cornersInZone,
  zoneColor,
} from '../cad-corners'

describe('cad-corners', () => {
  it('parses Z#.# legends', () => {
    expect(parseCornerLegend('Z1.0')).toEqual({ zone: 1, index: 0 })
    expect(parseCornerLegend('z3.12')).toEqual({ zone: 3, index: 12 })
    expect(parseCornerLegend('Enter')).toBeNull()
  })

  it('identifies corners from _z or legends', () => {
    const fromField = new Key()
    applyCornerFields(fromField, 2, 4)
    expect(isCorner(fromField)).toBe(true)

    const fromLegend = new Key()
    fromLegend.labels[4] = 'Z1.0'
    expect(isCorner(fromLegend)).toBe(true)

    expect(isCorner(new Key())).toBe(false)
  })

  it('hydrates _z/_zi from legends after kle-serial drops them', () => {
    const key = new Key()
    key.decal = true
    key.labels[4] = 'Z6.2'
    hydrateCorners([key])
    expect((key as Key & { _z?: number })._z).toBe(6)
    expect((key as Key & { _zi?: number })._zi).toBe(2)
  })

  it('assigns next index and zone', () => {
    const a = new Key()
    applyCornerFields(a, 1, 0)
    const b = new Key()
    applyCornerFields(b, 1, 2)
    expect(nextCornerIndex([a, b], 1)).toBe(3)
    expect(nextNewZone([a, b])).toBe(2)
    expect(usedZones([a, b])).toEqual([1])
    expect(cornersInZone([a, b], 1)).toBe(2)
    expect(cornersInZone([a, b], 2)).toBe(0)
  })

  it('injects _z/_zi onto compact KLE next to Z#.# legends', () => {
    const injected = injectCadCornerProps([
      { name: 'desk' },
      [{ d: true, w: 0.5, h: 0.5 }, 'Z1.0', 'A'],
    ]) as unknown[]
    const row = injected[1] as unknown[]
    expect(row[0]).toMatchObject({ d: true, _z: 1, _zi: 0 })
    expect(row[1]).toBe('Z1.0')
  })

  it('round-trips an optional module name on zone settings', () => {
    const named = getZoneSettings(
      { _zones: { '1': { fillet: 6, offset: 16, shape: 'convex', name: 'Nav block' } } } as never,
      1,
    )
    expect(named.name).toBe('Nav block')
    expect(getZoneSettings({} as never, 1).name).toBeUndefined()
  })

  it('uses a stable palette', () => {
    expect(zoneColor(1)).toBe('#e91e63')
    expect(zoneColor(9)).toBe(zoneColor(1))
    expect(cornerLabel(1, 0)).toBe('Z1.0')
  })

  it('convex hull drops interior points', () => {
    const hull = convexHull([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
      { x: 5, y: 5 },
    ])
    expect(hull).toHaveLength(4)
    expect(hull.some((p) => p.x === 5 && p.y === 5)).toBe(false)
  })

  it('offsetPolygon grows a square outward', () => {
    const grown = offsetPolygon(
      [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ],
      1,
    )
    const xs = grown.map((p) => p.x)
    const ys = grown.map((p) => p.y)
    expect(Math.min(...xs)).toBeLessThan(0)
    expect(Math.max(...xs)).toBeGreaterThan(10)
    expect(Math.min(...ys)).toBeLessThan(0)
    expect(Math.max(...ys)).toBeGreaterThan(10)
  })

  it('roundedPolygonCommands uses quadratic fillets', () => {
    const cmds = roundedPolygonCommands(
      [
        { x: 0, y: 0 },
        { x: 20, y: 0 },
        { x: 20, y: 20 },
        { x: 0, y: 20 },
      ],
      4,
    )
    expect(cmds.some((c) => c.type === 'quad')).toBe(true)
    expect(cmds[0]?.type).toBe('move')
  })

  it('concaveHull keeps walked-in corners instead of ballooning over them', () => {
    // L-shaped module: (100,100) is the reflex corner of the notch.
    const hull = concaveHull(
      [
        { x: 0, y: 0 },
        { x: 200, y: 0 },
        { x: 200, y: 100 },
        { x: 100, y: 100 },
        { x: 100, y: 200 },
        { x: 0, y: 200 },
      ],
      57.15,
    )
    expect(hull).toHaveLength(6)
    const order = hull.map((p) => `${p.x},${p.y}`)
    expect(order).toEqual(['0,0', '200,0', '200,100', '100,100', '100,200', '0,200'])
  })

  it('buildZoneOutline convex mode cuts concave corners in like YAKB', () => {
    const outline = buildZoneOutline(
      [
        { x: 0, y: 0 },
        { x: 200, y: 0 },
        { x: 200, y: 100 },
        { x: 100, y: 100 },
        { x: 100, y: 200 },
        { x: 0, y: 200 },
      ],
      { ...DEFAULT_ZONE_SETTINGS, shape: 'convex', offset: 10, fillet: 0 },
      1,
    )
    // Reflex corner (100,100) offsets into the notch instead of being bridged over.
    expect(outline).toHaveLength(6)
    expect(outline.some((p) => Math.abs(p.x - 110) < 1e-6 && Math.abs(p.y - 110) < 1e-6)).toBe(
      true,
    )
  })

  it('buildZoneOutline convex mode presses every walked corner in', () => {
    // Tight 2U-mouth notch: hull heuristics alone spike here, but walked
    // order is a clean ring so every corner lands on the outline.
    const walked = [
      [0, 0],
      [1, 0],
      [1, 1],
      [3, 1],
      [3, 0],
      [4, 0],
      [4, 4],
      [0, 4],
    ].map(([x, y]) => ({ x: (x || 0) * 19.05, y: (y || 0) * 19.05 }))
    const outline = buildZoneOutline(
      walked,
      { ...DEFAULT_ZONE_SETTINGS, shape: 'convex', offset: 0, fillet: 0 },
      1,
    )
    expect(outline.map((p) => `${p.x},${p.y}`)).toEqual(
      walked.map((p) => `${p.x},${p.y}`),
    )
  })

  it('buildZoneOutline convex mode wraps self-crossing walked order', () => {
    const outline = buildZoneOutline(
      [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
        { x: 10, y: 0 },
        { x: 0, y: 10 },
      ],
      { ...DEFAULT_ZONE_SETTINGS, shape: 'convex', offset: 0, fillet: 0 },
      1,
    )
    expect(outline).toHaveLength(4)
    expect(isSimplePolygon(outline)).toBe(true)
  })

  it('buildZoneOutline applies default offset in px', () => {
    const outline = buildZoneOutline(
      [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ],
      DEFAULT_ZONE_SETTINGS,
      1,
    )
    expect(outline.length).toBeGreaterThanOrEqual(4)
    expect(Math.min(...outline.map((p) => p.x))).toBeLessThan(0)
  })

  it('orderRing sorts click order into a perimeter ring', () => {
    // Zone-4-like: corners clicked BL, TL, TR, BR, then a mid-left indent.
    const clicked: ({ x: number; y: number } & { zi: number })[] = [
      { x: 35, y: 7.75, zi: 0 },
      { x: 35, y: 3.25, zi: 1 },
      { x: 38.5, y: 3.25, zi: 2 },
      { x: 38.5, y: 7.75, zi: 3 },
      { x: 35.5, y: 5.5, zi: 4 },
    ]
    expect(orderRing(clicked).map((pt) => (pt as typeof clicked[number]).zi)).toEqual([1, 2, 3, 0, 4])
  })

  it('buildZoneOutline follows the larger-area ring, not click order', () => {
    // Same corners: walked _zi order slashes the indent across the bottom,
    // but the position-derived ring puts it on the side it was placed on.
    const clicked = [
      { x: 35, y: 7.75 },
      { x: 35, y: 3.25 },
      { x: 38.5, y: 3.25 },
      { x: 38.5, y: 7.75 },
      { x: 35.5, y: 5.5 },
    ]
    const outline = buildZoneOutline(
      clicked,
      { ...DEFAULT_ZONE_SETTINGS, shape: 'convex', offset: 0, fillet: 0 },
      1,
    )
    expect(outline).toHaveLength(5)
    const at = (x: number, y: number) => outline.findIndex((pt) => pt.x === x && pt.y === y)
    const mid = at(35.5, 5.5)
    expect(mid).toBeGreaterThanOrEqual(0)
    const neighbours = new Set([
      `${outline[(mid + outline.length - 1) % outline.length]!.x},${outline[(mid + outline.length - 1) % outline.length]!.y}`,
      `${outline[(mid + 1) % outline.length]!.x},${outline[(mid + 1) % outline.length]!.y}`,
    ])
    expect(neighbours).toEqual(new Set(['35,7.75', '35,3.25']))
  })

  it('buildZoneOutline keeps every corner of a self-crossing click order', () => {
    const outline = buildZoneOutline(
      [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
        { x: 10, y: 0 },
        { x: 0, y: 10 },
      ],
      { ...DEFAULT_ZONE_SETTINGS, shape: 'convex', offset: 0, fillet: 0 },
      1,
    )
    expect(outline).toHaveLength(4)
    expect(isSimplePolygon(outline)).toBe(true)
    const coords = new Set(outline.map((pt) => `${pt.x},${pt.y}`))
    expect(coords).toEqual(new Set(['0,0', '10,10', '10,0', '0,10']))
  })

  it('buildZoneOutline survives degenerate collinear corners via the hull', () => {
    const clicked = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 5, y: 0 },
      { x: 7, y: 0 },
    ]
    const outline = buildZoneOutline(
      clicked,
      { ...DEFAULT_ZONE_SETTINGS, shape: 'convex', offset: 0, fillet: 0 },
      1,
    )
    expect(outline.length).toBeGreaterThanOrEqual(2)
    for (const pt of outline) {
      expect(clicked.some((c) => c.x === pt.x && c.y === pt.y)).toBe(true)
      expect(Number.isFinite(pt.x) && Number.isFinite(pt.y)).toBe(true)
    }
  })

  it('offsetPolygon bevels needle corners instead of spiking', () => {
    // 19-degree apex: a raw miter would spike 6x the offset off the tip.
    const grown = offsetPolygon(
      [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0.5, y: 3 },
      ],
      1,
    )
    // Bevel replaces the apex miter with two flat points, base miters stay.
    expect(grown).toHaveLength(4)
    expect(Math.max(...grown.map((pt) => pt.y))).toBeLessThan(5)
    for (const pt of grown) {
      expect(Number.isFinite(pt.x) && Number.isFinite(pt.y)).toBe(true)
    }
  })

  it('offsetPolygon keeps ordinary 90-degree miters sharp', () => {
    const grown = offsetPolygon(
      [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ],
      1,
    )
    expect(grown).toHaveLength(4)
    const coords = new Set(grown.map((pt) => `${pt.x},${pt.y}`))
    expect(coords).toEqual(new Set(['-1,-1', '11,-1', '11,11', '-1,11']))
  })
})

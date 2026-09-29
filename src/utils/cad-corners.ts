import type { Array12, Key, KeyboardMetadata } from '@adamws/kle-serial'
import { createEmptyLabels } from './array-helpers'

/** Extra CAD fields kle-serial2 does not model. Kept on key objects in the editor. */
export type CadKey = Key & { _z?: number; _zi?: number }

export type ZoneShape = 'convex' | 'path'

export interface ZoneSettings {
  fillet: number
  offset: number
  shape: ZoneShape
  /** Optional label for this plate island. Omitted from JSON when blank. */
  name?: string
}

export const DEFAULT_ZONE_SETTINGS: ZoneSettings = { fillet: 6, offset: 16, shape: 'convex' }

export const CORNER_ZONE_CHOICES = [1, 2, 3, 4, 5, 6, 7, 8]

const ZONE_PALETTE = [
  '#e91e63',
  '#2196f3',
  '#4caf50',
  '#ff9800',
  '#9c27b0',
  '#00bcd4',
  '#795548',
  '#607d8b',
]

const CORNER_LEGEND = /^Z(\d+)\.(\d+)$/i

export function cornerLabel(zone: number, index: number): string {
  return `Z${zone}.${index}`
}

export function parseCornerLegend(text: string | undefined | null): { zone: number; index: number } | null {
  const match = String(text || '')
    .trim()
    .match(CORNER_LEGEND)
  if (!match) return null
  return { zone: parseInt(match[1]!, 10), index: parseInt(match[2]!, 10) }
}

export function parseCornerLabel(key: Key): { zone: number; index: number } | null {
  const cad = key as CadKey
  if ((cad._z || 0) > 0) {
    return { zone: cad._z as number, index: cad._zi || 0 }
  }
  for (const label of key.labels || []) {
    const parsed = parseCornerLegend(label)
    if (parsed) return parsed
  }
  return null
}

export function isCorner(key: Key | null | undefined): boolean {
  return !!key && parseCornerLabel(key) != null
}

export function getCornerZone(key: Key): number {
  return parseCornerLabel(key)?.zone || 0
}

export function getCornerIndex(key: Key): number {
  return parseCornerLabel(key)?.index || 0
}

export function zoneColor(zone: number): string {
  const i = (((zone || 1) - 1) % ZONE_PALETTE.length + ZONE_PALETTE.length) % ZONE_PALETTE.length
  return ZONE_PALETTE[i]!
}

export function nextCornerIndex(keys: Key[], zone: number): number {
  let max = -1
  for (const key of keys) {
    if (getCornerZone(key) === zone) {
      max = Math.max(max, getCornerIndex(key))
    }
  }
  return max + 1
}

export function nextNewZone(keys: Key[]): number {
  let max = 0
  for (const key of keys) {
    max = Math.max(max, getCornerZone(key))
  }
  return max + 1
}

export function usedZones(keys: Key[]): number[] {
  const set = new Set<number>()
  for (const key of keys) {
    const zone = getCornerZone(key)
    if (zone > 0) set.add(zone)
  }
  return [...set].sort((a, b) => a - b)
}

export function cornersInZone(keys: Key[], zone: number): number {
  let n = 0
  for (const key of keys) {
    if (getCornerZone(key) === zone) n++
  }
  return n
}

export function cornerLabelsFor(zone: number, index: number): Array12<string> {
  const labels = createEmptyLabels()
  labels[4] = cornerLabel(zone, index)
  return labels
}

export function applyCornerFields(key: Key, zone: number, index: number): void {
  const cad = key as CadKey
  cad._z = zone
  cad._zi = index
  key.decal = true
}

/**
 * After kle-serial2 load (which drops _z/_zi), restore them from Z#.# legends
 * so the editor can treat CAD-desk corners as corners.
 */
export function hydrateCorners(keys: Key[]): void {
  for (const key of keys) {
    const parsed = parseCornerLabel(key)
    if (!parsed) continue
    applyCornerFields(key, parsed.zone, parsed.index)
  }
}

export function ensureZoneMeta(meta: KeyboardMetadata, zone: number): void {
  const rec = meta as KeyboardMetadata & { _zones?: Record<string, ZoneSettings> }
  if (!rec._zones) rec._zones = {}
  const z = String(zone)
  if (!rec._zones[z]) {
    rec._zones[z] = { ...DEFAULT_ZONE_SETTINGS }
  }
}

/**
 * kle-serial2 will not emit _z/_zi. After compact serialize, stamp them onto
 * the property object that precedes each Z#.# legend so Copy/YACB get typed fields.
 */
export function injectCadCornerProps(data: unknown): unknown {
  if (!Array.isArray(data)) return data
  return data.map((row) => {
    if (!Array.isArray(row)) return row
    const out: unknown[] = []
    for (const item of row) {
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        out.push({ ...(item as Record<string, unknown>) })
        continue
      }
      if (typeof item === 'string') {
        const parsed = parseCornerLegend(item)
        if (parsed) {
          const prev = out[out.length - 1]
          if (prev && typeof prev === 'object' && !Array.isArray(prev)) {
            const rec = prev as Record<string, unknown>
            if (rec._z == null) rec._z = parsed.zone
            if (rec._zi == null) rec._zi = parsed.index
          } else {
            out.push({ _z: parsed.zone, _zi: parsed.index })
          }
        }
        out.push(item)
        continue
      }
      out.push(item)
    }
    return out
  })
}

export interface Point {
  x: number
  y: number
}

export function getZoneSettings(
  meta: KeyboardMetadata | null | undefined,
  zone: number,
): ZoneSettings {
  const rec = meta as (KeyboardMetadata & { _zones?: Record<string, Partial<ZoneSettings>> }) | null
  const raw = rec?._zones?.[String(zone)]
  const fillet = raw?.fillet != null ? Number(raw.fillet) : DEFAULT_ZONE_SETTINGS.fillet
  const offset = raw?.offset != null ? Number(raw.offset) : DEFAULT_ZONE_SETTINGS.offset
  const name = typeof raw?.name === 'string' ? raw.name : ''
  return {
    fillet: Number.isFinite(fillet) && fillet >= 0 ? fillet : DEFAULT_ZONE_SETTINGS.fillet,
    offset: Number.isFinite(offset) ? offset : DEFAULT_ZONE_SETTINGS.offset,
    shape: raw?.shape === 'path' ? 'path' : 'convex',
    ...(name ? { name } : {}),
  }
}

function cross(o: Point, a: Point, b: Point): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
}

/** Andrew's monotone chain. Clockwise or counter-clockwise depending on input; we CCW-normalize after. */
export function convexHull(points: Point[]): Point[] {
  if (points.length <= 2) return points.slice()
  const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y)
  const lower: Point[] = []
  for (const pt of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, pt) <= 0) {
      lower.pop()
    }
    lower.push(pt)
  }
  const upper: Point[] = []
  for (let i = sorted.length - 1; i >= 0; i--) {
    const pt = sorted[i]!
    while (upper.length >= 2 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, pt) <= 0) {
      upper.pop()
    }
    upper.push(pt)
  }
  lower.pop()
  upper.pop()
  return lower.concat(upper)
}

const MM_PER_UNIT = 19.05
/** YACB only splits hull edges at least this long (KLE units) when conforming. */
const CONCAVE_MAX_EDGE_UNITS = 3

function uniquePoints(points: Point[], eps: number): Point[] {
  const out: Point[] = []
  const lim = eps * eps
  for (const p of points || []) {
    if (
      !out.some((q) => {
        const dx = p.x - q.x
        const dy = p.y - q.y
        return dx * dx + dy * dy < lim
      })
    ) {
      out.push(p)
    }
  }
  return out
}

function pointInPoly(p: Point, poly: Point[]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i]!.x
    const yi = poly[i]!.y
    const xj = poly[j]!.x
    const yj = poly[j]!.y
    if (yi > p.y !== (yj > p.y) && p.x < ((xj - xi) * (p.y - yi)) / (yj - yi || 1e-12) + xi) {
      inside = !inside
    }
  }
  return inside
}

/**
 * YACB-compatible concave hull: start from the convex hull, then splice
 * walked-in corners back onto the long edges they sit behind. Same insertion
 * rules as YACB's PlateBuilder so the overlay previews the DXF outline.
 * maxEdge is in the same units as the points.
 */
export function concaveHull(points: Point[], maxEdge: number): Point[] {
  const pxPerUnit = maxEdge / CONCAVE_MAX_EDGE_UNITS
  const deduped = uniquePoints(points, 0.02 * pxPerUnit)
  if (deduped.length <= 2 || !(maxEdge > 0)) return convexHull(deduped)
  // YACB-style hull: keep collinear edge points (`< 0`), unlike convexHull above.
  const sorted = [...deduped].sort((a, b) => a.x - b.x || a.y - b.y)
  const build = (list: Point[]): Point[] => {
    const hull: Point[] = []
    for (const p of list) {
      while (
        hull.length >= 2 &&
        cross(hull[hull.length - 2]!, hull[hull.length - 1]!, p) < 0
      ) {
        hull.pop()
      }
      hull.push(p)
    }
    return hull
  }
  const lower = build(sorted)
  const upper = build([...sorted].reverse())
  lower.pop()
  upper.pop()
  const poly = lower.concat(upper)
  if (poly.length < 3) return poly
  const pid = (p: Point) =>
    `${Math.round((p.x * 100) / pxPerUnit)}:${Math.round((p.y * 100) / pxPerUnit)}`
  const used = new Set<string>()
  for (const p of poly) used.add(pid(p))
  const interior = deduped.filter((p) => !used.has(pid(p)))
  let guard = 0
  while (interior.length > 0 && guard++ < deduped.length * 5) {
    let bestI = -1
    let bestJ = -1
    let bestScore = Infinity
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i]!
      const b = poly[(i + 1) % poly.length]!
      const abx = b.x - a.x
      const aby = b.y - a.y
      const elen = hypot(abx, aby)
      if (elen < maxEdge) continue
      for (let j = 0; j < interior.length; j++) {
        const p = interior[j]!
        if (!pointInPoly(p, poly)) continue
        const t = ((p.x - a.x) * abx + (p.y - a.y) * aby) / (elen * elen || 1)
        if (t <= 0.08 || t >= 0.92) continue
        const qx = a.x + t * abx
        const qy = a.y + t * aby
        const d = hypot(p.x - qx, p.y - qy)
        if (d > elen * 0.7) continue
        if (d < bestScore) {
          bestScore = d
          bestI = i
          bestJ = j
        }
      }
    }
    if (bestI < 0) break
    poly.splice(bestI + 1, 0, interior[bestJ]!)
    interior.splice(bestJ, 1)
  }
  return poly
}

function signedArea(points: Point[]): number {
  let area = 0
  const n = points.length
  for (let i = 0; i < n; i++) {
    const a = points[i]!
    const b = points[(i + 1) % n]!
    area += a.x * b.y - b.x * a.y
  }
  return area / 2
}

function hypot(x: number, y: number): number {
  return Math.sqrt(x * x + y * y)
}

/**
 * Parallel-offset a closed polygon. Positive distance grows the silhouette
 * (away from the interior). Used so the dashed overlay sits outside the keys
 * the way zone offset mm does in YACB.
 */
export function offsetPolygon(points: Point[], distance: number): Point[] {
  const n = points.length
  if (n < 3 || distance === 0) return points.slice()
  const area = signedArea(points)
  // Canvas y-down: positive area → left-of-edge points inward, so outward is the right normal.
  const outwardSign = area >= 0 ? 1 : -1
  const out: Point[] = []
  for (let i = 0; i < n; i++) {
    const prev = points[(i + n - 1) % n]!
    const cur = points[i]!
    const next = points[(i + 1) % n]!
    const inDx = cur.x - prev.x
    const inDy = cur.y - prev.y
    const outDx = next.x - cur.x
    const outDy = next.y - cur.y
    const inLen = hypot(inDx, inDy) || 1
    const outLen = hypot(outDx, outDy) || 1
    const n1x = (outwardSign * inDy) / inLen
    const n1y = (-outwardSign * inDx) / inLen
    const n2x = (outwardSign * outDy) / outLen
    const n2y = (-outwardSign * outDx) / outLen
    let bx = n1x + n2x
    let by = n1y + n2y
    const bLen = hypot(bx, by)
    if (bLen < 1e-6) {
      out.push({ x: cur.x + n1x * distance, y: cur.y + n1y * distance })
      continue
    }
    bx /= bLen
    by /= bLen
    const cos = Math.max(bx * n1x + by * n1y, 0.2)
    const scale = distance / cos
    out.push({ x: cur.x + bx * scale, y: cur.y + by * scale })
  }
  return out
}

export type PathCmd =
  | { type: 'move'; x: number; y: number }
  | { type: 'line'; x: number; y: number }
  | { type: 'quad'; cx: number; cy: number; x: number; y: number }

/** Quadratic fillets at each vertex. radius 0 is a sharp closed polygon. */
export function roundedPolygonCommands(points: Point[], radius: number): PathCmd[] {
  const n = points.length
  if (n < 2) return []
  if (n === 2 || radius <= 0.5) {
    const cmds: PathCmd[] = [{ type: 'move', x: points[0]!.x, y: points[0]!.y }]
    for (let i = 1; i < n; i++) {
      cmds.push({ type: 'line', x: points[i]!.x, y: points[i]!.y })
    }
    return cmds
  }
  const cmds: PathCmd[] = []
  for (let i = 0; i < n; i++) {
    const prev = points[(i + n - 1) % n]!
    const cur = points[i]!
    const next = points[(i + 1) % n]!
    const d1x = cur.x - prev.x
    const d1y = cur.y - prev.y
    const d2x = next.x - cur.x
    const d2y = next.y - cur.y
    const l1 = hypot(d1x, d1y) || 1
    const l2 = hypot(d2x, d2y) || 1
    const r = Math.min(radius, l1 / 2, l2 / 2)
    const p1x = cur.x - (d1x / l1) * r
    const p1y = cur.y - (d1y / l1) * r
    const p2x = cur.x + (d2x / l2) * r
    const p2y = cur.y + (d2y / l2) * r
    if (i === 0) {
      cmds.push({ type: 'move', x: p1x, y: p1y })
    } else {
      cmds.push({ type: 'line', x: p1x, y: p1y })
    }
    cmds.push({ type: 'quad', cx: cur.x, cy: cur.y, x: p2x, y: p2y })
  }
  return cmds
}

function orient(a: Point, b: Point, c: Point): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
}

function onSegment(a: Point, b: Point, c: Point): boolean {
  const eps = 1e-9
  return (
    Math.min(a.x, c.x) - eps <= b.x &&
    b.x <= Math.max(a.x, c.x) + eps &&
    Math.min(a.y, c.y) - eps <= b.y &&
    b.y <= Math.max(a.y, c.y) + eps
  )
}

function segmentsCross(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
  const d1 = orient(p3, p4, p1)
  const d2 = orient(p3, p4, p2)
  const d3 = orient(p1, p2, p3)
  const d4 = orient(p1, p2, p4)
  if (d1 * d2 < 0 && d3 * d4 < 0) return true
  if (d1 === 0 && onSegment(p3, p1, p4)) return true
  if (d2 === 0 && onSegment(p3, p2, p4)) return true
  if (d3 === 0 && onSegment(p1, p3, p2)) return true
  if (d4 === 0 && onSegment(p1, p4, p2)) return true
  return false
}

/** True when the walked corner order forms a non-self-intersecting ring. */
export function isSimplePolygon(points: Point[]): boolean {
  const n = points.length
  if (n < 3) return true
  for (let i = 0; i < n; i++) {
    const a1 = points[i]!
    const a2 = points[(i + 1) % n]!
    for (let j = i + 1; j < n; j++) {
      // Adjacent edges (including the first/last wrap) share a vertex.
      if (j === (i + 1) % n || i === (j + 1) % n) continue
      const b1 = points[j]!
      const b2 = points[(j + 1) % n]!
      if (segmentsCross(a1, a2, b1, b2)) return false
    }
  }
  return true
}

/**
 * Order corners into a ring by angle around their centroid. Corner _zi
 * values record click order, not ring order, so Outer wrap derives the
 * ring from positions; correct whenever the corners surround their
 * centroid (the usual module outline). Always simplicity-check the
 * result: degenerate sets can still self-overlap.
 */
export function orderRing(points: Point[]): Point[] {
  if (points.length < 3) return points.slice()
  const cx = points.reduce((sum, pt) => sum + pt.x, 0) / points.length
  const cy = points.reduce((sum, pt) => sum + pt.y, 0) / points.length
  return [...points].sort((a, b) => {
    const da = Math.atan2(a.y - cy, a.x - cx)
    const db = Math.atan2(b.y - cy, b.x - cx)
    if (da !== db) return da - db
    const ra = (a.x - cx) * (a.x - cx) + (a.y - cy) * (a.y - cy)
    const rb = (b.x - cx) * (b.x - cx) + (b.y - cy) * (b.y - cy)
    return ra - rb
  })
}

function perimeter(points: Point[]): number {
  let total = 0
  for (let i = 0; i < points.length; i++) {
    const a = points[i]!
    const b = points[(i + 1) % points.length]!
    total += hypot(b.x - a.x, b.y - a.y)
  }
  return total
}

export function buildZoneOutline(points: Point[], settings: ZoneSettings, mmToPx: number): Point[] {
  if (points.length < 2) return points.slice()
  let pts = points.slice()
  if (settings.shape !== 'path' && pts.length >= 3) {
    // Outer wrap derives the ring from corner positions (_zi is click
    // order, not ring order). A misordered ring cuts area away with
    // diagonal shortcuts, so the larger-area simple ring wins; ties
    // (spikes enclose no area) go to the tighter ring. When neither
    // order forms a clean ring, wrap the extremes like YACB.
    const ring = orderRing(pts)
    const walkedSimple = isSimplePolygon(pts)
    const ringSimple = isSimplePolygon(ring)
    if (walkedSimple && ringSimple) {
      const walkedArea = Math.abs(signedArea(pts))
      const ringArea = Math.abs(signedArea(ring))
      const eps = 1e-9 * Math.max(1, walkedArea + ringArea)
      if (
        ringArea > walkedArea + eps ||
        (Math.abs(ringArea - walkedArea) <= eps && perimeter(ring) < perimeter(pts))
      ) {
        pts = ring
      }
    } else if (ringSimple) {
      pts = ring
    } else if (!walkedSimple) {
      pts = concaveHull(pts, CONCAVE_MAX_EDGE_UNITS * MM_PER_UNIT * mmToPx)
    }
  }
  const offsetPx = settings.offset * mmToPx
  if (offsetPx !== 0 && pts.length >= 3) {
    pts = offsetPolygon(pts, offsetPx)
  }
  return pts
}

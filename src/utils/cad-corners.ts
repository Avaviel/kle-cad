import type { Array12, Key, KeyboardMetadata } from '@adamws/kle-serial'
import { createEmptyLabels } from './array-helpers'

/** Extra CAD fields kle-serial2 does not model. Kept on key objects in the editor. */
export type CadKey = Key & { _z?: number; _zi?: number }

export type ZoneShape = 'convex' | 'path'

export interface ZoneSettings {
  fillet: number
  offset: number
  shape: ZoneShape
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
 * the property object that precedes each Z#.# legend so Copy/YAKB get typed fields.
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
  return {
    fillet: Number.isFinite(fillet) && fillet >= 0 ? fillet : DEFAULT_ZONE_SETTINGS.fillet,
    offset: Number.isFinite(offset) ? offset : DEFAULT_ZONE_SETTINGS.offset,
    shape: raw?.shape === 'path' ? 'path' : 'convex',
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
 * the way zone offset mm does in YAKB.
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

export function buildZoneOutline(points: Point[], settings: ZoneSettings, mmToPx: number): Point[] {
  if (points.length < 2) return points.slice()
  let pts = points.slice()
  if (settings.shape !== 'path' && pts.length >= 3) {
    pts = convexHull(pts)
  }
  const offsetPx = settings.offset * mmToPx
  if (offsetPx !== 0 && pts.length >= 3) {
    pts = offsetPolygon(pts, offsetPx)
  }
  return pts
}

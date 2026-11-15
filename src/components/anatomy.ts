// Geometry of the body map figure (viewBox 0 0 220 470), front and back. Stylized muscle groups and
// organ zones, drawn from simple shapes so the figure stays light and readable at small sizes.
// Kept out of the component file for fast refresh.
import type { RegionId, View } from '../orbit/regions'

export type Shape = { e: [number, number, number, number] } | { r: [number, number, number, number, number] } | { p: string }

type Pt = [number, number]
const path = (pts: Pt[]) => 'M' + pts.map(([x, y]) => `${x},${y}`).join(' L') + ' Z'
const mirror = (pts: Pt[]): Pt[] => pts.map(([x, y]) => [220 - x, y])
/** The same polygon on both sides of the body. */
const pair = (pts: Pt[]): Shape[] => [{ p: path(pts) }, { p: path(mirror(pts)) }]
/** The same ellipse on both sides of the body. */
const pairE = (cx: number, cy: number, rx: number, ry: number): Shape[] => [{ e: [cx, cy, rx, ry] }, { e: [220 - cx, cy, rx, ry] }]

const NECK: Shape = { p: path([[99, 70], [121, 70], [123, 86], [97, 86]]) }
const HEAD: Shape = { e: [110, 42, 24, 30] }
const FOREARMS = [...pair([[49, 178], [65, 178], [61, 234], [48, 232]]), ...pairE(52, 251, 8, 12)]

export interface Part {
  /** null: decorative (knees). */
  region: RegionId | null
  shapes: Shape[]
}

export const ANATOMY: Record<View, Part[]> = {
  front: [
    { region: 'head', shapes: [HEAD] },
    { region: 'eyes', shapes: [{ e: [100, 40, 5, 3] }, { e: [120, 40, 5, 3] }] },
    { region: 'vestibular', shapes: pairE(85, 44, 3.5, 7) },
    { region: 'neck', shapes: [NECK] },
    { region: 'shoulders', shapes: [...pairE(66, 108, 15, 19), ...pair([[98, 84], [75, 95], [84, 100], [104, 90]])] },
    { region: 'chest', shapes: pair([[108, 96], [82, 98], [75, 124], [89, 134], [107, 132]]) },
    { region: 'arms', shapes: pairE(58, 152, 10, 24) },
    { region: 'forearms', shapes: FOREARMS },
    {
      region: 'abdomen',
      shapes: [
        { r: [96, 138, 12, 17, 4] }, { r: [112, 138, 12, 17, 4] },
        { r: [96, 158, 12, 17, 4] }, { r: [112, 158, 12, 17, 4] },
        { r: [96, 178, 12, 17, 4] }, { r: [112, 178, 12, 17, 4] },
        { r: [96, 198, 28, 20, 6] },
        ...pair([[78, 132], [92, 138], [92, 214], [82, 204]]),
      ],
    },
    { region: 'hips', shapes: [{ p: path([[84, 222], [136, 222], [122, 244], [98, 244]]) }] },
    { region: 'thighs', shapes: [...pair([[78, 228], [100, 242], [103, 328], [84, 330]]), ...pair([[102, 246], [108, 252], [107, 292], [104, 290]])] },
    { region: null, shapes: pairE(93, 341, 8, 8) },
    { region: 'shins', shapes: pair([[86, 352], [100, 352], [98, 428], [88, 428]]) },
    { region: 'feet', shapes: pairE(92, 446, 12, 7) },
  ],
  back: [
    { region: 'head', shapes: [HEAD] },
    { region: 'neck', shapes: [NECK] },
    { region: 'upperback', shapes: [{ p: path([[110, 70], [76, 98], [110, 168], [144, 98]]) }, ...pair([[80, 110], [102, 150], [99, 204], [82, 190]])] },
    { region: 'shoulders', shapes: pairE(66, 108, 15, 19) },
    { region: 'arms', shapes: pairE(58, 152, 10, 24) },
    { region: 'forearms', shapes: FOREARMS },
    { region: 'lowerback', shapes: [{ r: [101, 168, 8, 56, 4] }, { r: [111, 168, 8, 56, 4] }] },
    { region: 'kidneys', shapes: pairE(90, 192, 6, 10) },
    { region: 'hips', shapes: pairE(96, 246, 16, 20) },
    { region: 'thighs', shapes: pair([[80, 266], [104, 266], [102, 332], [84, 332]]) },
    { region: null, shapes: pairE(93, 341, 8, 8) },
    { region: 'calves', shapes: pairE(93, 384, 12, 34) },
    { region: 'feet', shapes: pairE(93, 446, 9, 7) },
  ],
}

/** Where to put the symptom count of a region on each view (first shape's center). */
export function anchor(view: View, region: RegionId): Pt | undefined {
  const part = ANATOMY[view].find((p) => p.region === region)
  const s = part?.shapes[0]
  if (!s) return undefined
  if ('e' in s) return [s.e[0], s.e[1]]
  if ('r' in s) return [s.r[0] + s.r[2] / 2, s.r[1] + s.r[3] / 2]
  const nums = s.p.match(/-?\d+(\.\d+)?/g)!.map(Number)
  const xs = nums.filter((_, i) => i % 2 === 0)
  const ys = nums.filter((_, i) => i % 2 === 1)
  return [xs.reduce((a, b) => a + b, 0) / xs.length, ys.reduce((a, b) => a + b, 0) / ys.length]
}

// Symptom history as a heat map on the body. Every symptom she logged (pain marked on a muscle or
// painted, and the symptom buttons of the body map) warms its zone. The warmth cools down day by day
// unless she logs that zone again: logging it again starts it warm. Display only: the engine and its
// rules do not use the warmth.
// The cooling numbers and the place of each button symptom are team criterion (engineering proposal,
// pending review by Psychology 1). Days are mission days: the logs carry no clock time.
import type { SymptomLog } from './body'
import {
  INTENSITY_COLORS,
  OFF_FIGURE,
  painDay,
  regionSymptom,
  VIEW_PARTS,
  zoneOf,
  type BodySide,
  type BodyView,
  type BrushSize,
  type PainLog,
  type Slug,
} from './pain'

export const HEAT = {
  /** Warmth halves every this many days without a new log of that zone. */
  halfLifeDays: 2,
  /** Below this warmth the zone shows cold again. */
  minWarmth: 0.1,
  /** Days of history that can still be warm. */
  windowDays: 14,
  /** Symptom buttons carry no intensity: they count as a 5 of 10. */
  buttonIntensity: 5,
}

/** Where a symptom button shows on the figure. Symptoms not listed here have no place (listed apart). */
export const SYMPTOM_ZONES: Record<string, Slug[]> = {
  'severe headache': ['head'],
  headache: ['head'],
  dizziness: ['head'],
  fainting: ['head'],
  'vision change': ['head'],
  'eye irritation': ['head'],
  'chest pain': ['chest'],
  'shortness of breath': ['chest'],
  palpitations: ['chest'],
  'back pain': ['upper-back', 'lower-back'],
  'sore throat or congestion': ['neck'],
  nausea: ['abs'],
  'stomach pain': ['abs', 'obliques'],
}

/** Color of a warmth (0 to 1) on the pain palette: deep red when hot, pale amber when it has cooled. */
export const heatColor = (w: number) => INTENSITY_COLORS[Math.min(Math.max(Math.round(w * 10), 1), 10) - 1]

/** How warm a log of this intensity (1 to 10) still is after `age` days. */
export const warmth = (intensity: number, age: number) =>
  age < 0 ? 0 : (Math.min(Math.max(intensity, 0), 10) / 10) * 0.5 ** (age / HEAT.halfLifeDays)

export interface ZoneHeat {
  zone: Slug
  /** 0 to 1. */
  warmth: number
  /** Mission day of the log that gives this warmth (the warmest one). */
  day: number
  intensity: number
  /** What was logged there that day (symptom text, or "pain"). */
  what: string[]
  /** Her side, when every warm log of this zone was on that same side (a picked muscle); else the whole zone. */
  side?: BodySide
}

export interface DotHeat {
  key: string
  x: number
  y: number
  size: BrushSize
  warmth: number
}

export interface HeatMap {
  zones: ZoneHeat[]
  dots: DotHeat[]
  /** Symptoms logged with no place on the figure (skin rash, pain in the eyes or skin, joint or muscle pain from a button). */
  noPlace: { symptom: string; day: number }[]
}

/** The zone as the figure draws it on this view (the back view draws the head as hair), if it does. */
const onView = (zone: Slug, view: BodyView): Slug | undefined => {
  if (!VIEW_PARTS[view].includes(zone)) return undefined
  return zone === 'head' && view === 'back' ? 'hair' : zone
}

/**
 * The heat map of one view on `day`: every log from the last `windowDays` days, cooled by its age.
 * Each zone keeps its warmest log, so logging a zone again makes it warm again.
 */
export function heatOn(day: number, view: BodyView, pain: PainLog, symptoms: SymptomLog): HeatMap {
  const byZone = new Map<Slug, ZoneHeat>()
  const sides = new Map<Slug, Set<BodySide | 'both'>>()
  const dots: DotHeat[] = []
  const noPlace: HeatMap['noPlace'] = []
  const warm = (zone: Slug, d: number, intensity: number, what: string, side?: BodySide) => {
    const w = warmth(intensity, day - d)
    if (w < HEAT.minWarmth) return
    sides.set(zone, (sides.get(zone) ?? new Set()).add(side ?? 'both'))
    const prev = byZone.get(zone)
    if (!prev || w > prev.warmth) byZone.set(zone, { zone, warmth: w, day: d, intensity, what: [what] })
    else if (prev.day === d && !prev.what.includes(what)) prev.what.push(what)
  }

  for (let d = day - HEAT.windowDays + 1; d <= day; d++) {
    for (const e of painDay(pain[d]).events) {
      if (e.intensity <= 0) continue
      for (const m of e.muscles) if (m.view === view) warm(m.slug, d, e.intensity, 'pain', m.side)
      for (const s of e.strokes) {
        // Painted strokes belong to the view they were painted on; whole zones show on any view that draws them.
        if (s.dots.length && s.view !== view) continue
        for (const z of s.zones) warm(zoneOf(z), d, e.intensity, 'pain')
        const w = warmth(e.intensity, day - d)
        if (s.view === view && w >= HEAT.minWarmth) {
          s.dots.forEach(([x, y], i) => dots.push({ key: `${e.id}-${s.id}-${i}`, x, y, size: s.size, warmth: w }))
        }
      }
      // Eyes and skin have no zone on the figure.
      for (const r of e.regions.filter((r) => OFF_FIGURE.includes(r))) {
        if (warmth(e.intensity, day - d) >= HEAT.minWarmth) noPlace.push({ symptom: regionSymptom(r), day: d })
      }
    }
    for (const symptom of symptoms[d] ?? []) {
      const zones = SYMPTOM_ZONES[symptom]
      if (!zones) {
        if (warmth(HEAT.buttonIntensity, day - d) >= HEAT.minWarmth) noPlace.push({ symptom, day: d })
        continue
      }
      for (const z of zones) warm(z, d, HEAT.buttonIntensity, symptom)
    }
  }

  const zones = [...byZone.values()]
    .map((z) => {
      const s = [...(sides.get(z.zone) ?? [])]
      const side = s.length === 1 && s[0] !== 'both' ? s[0] : undefined
      return { ...z, zone: onView(z.zone, view), ...(side ? { side } : {}) }
    })
    .filter((z): z is ZoneHeat => !!z.zone)
    .sort((a, b) => b.warmth - a.warmth)
  return { zones, dots, noPlace }
}

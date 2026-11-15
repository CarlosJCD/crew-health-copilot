// Where it hurts (body map). Two ways to log pain, both turned into the fixed symptom vocabulary of
// orbit-indicators.json, so the engine never depends on a drawing or on free text for an alarm:
//  1. She is sure it is muscle pain: she picks the muscle (and the side).
//  2. She is not sure: she paints the area where she feels it; ORBIT reads the zone under the paint.
// The zone-to-symptom table below is an engineering proposal (team criterion), pending review by
// Psychology 1. Open decisions: does the chest muscle count as "chest pain" (alarm) when she is sure
// it is muscular (safe default: yes), and from what intensity a headache counts as "severe headache".
// Data stays on the device. Pain is Body data, so it reaches the crew medical officer like other symptoms.
import type { Slug } from 'react-muscle-highlighter'
import type { DemoData } from './demoData'
import { VOCABULARY } from './body'

export type { Slug }
export type BodyView = 'front' | 'back'
/** Her own left or right (anatomical), not the viewer's. */
export type BodySide = 'left' | 'right'
export type BrushSize = 's' | 'm' | 'l'

/** A muscle she picked because she is sure the pain is muscular. */
export interface MuscleMark {
  slug: Slug
  side?: BodySide
  view: BodyView
  /** 1 to 10. */
  intensity: number
}

/** One painted area. `dots` are brush positions as fractions (0 to 1) of the figure's box. */
export interface PaintStroke {
  id: string
  view: BodyView
  intensity: number
  size: BrushSize
  dots: [x: number, y: number][]
  /** Zones under the paint. A stroke with no dots fills these zones whole (keyboard path). */
  zones: Slug[]
}

export interface PainDay {
  muscles: MuscleMark[]
  strokes: PaintStroke[]
}

/** Pain logged on the body map, by mission day. */
export type PainLog = Record<string, PainDay>

export const EMPTY_PAIN: PainDay = { muscles: [], strokes: [] }
export const INTENSITY = { min: 1, max: 10, start: 5 }
export const MAX_STROKES = 20
export const MAX_DOTS = 80

/** Brush diameter as a fraction of the figure's width. */
export const BRUSH: Record<BrushSize, number> = { s: 0.09, m: 0.15, l: 0.23 }

/** Intensity 1 to 10, light amber to deep red (display only: no clinical categories). */
export const INTENSITY_COLORS = [
  '#f7e08a', '#f5cc6b', '#f3b450', '#f09a3e', '#ea7f33',
  '#e0652e', '#d34c2b', '#c3352a', '#b02229', '#9a1426',
] as const

export const intensityColor = (n: number) => INTENSITY_COLORS[Math.min(Math.max(Math.round(n), 1), 10) - 1]

/** Zones the figure draws on each side (female model of react-muscle-highlighter 1.2.0). */
export const VIEW_PARTS: Record<BodyView, Slug[]> = {
  front: [
    'head', 'neck', 'trapezius', 'deltoids', 'chest', 'biceps', 'triceps', 'forearm', 'hands', 'abs', 'obliques',
    'adductors', 'quadriceps', 'knees', 'tibialis', 'calves', 'ankles', 'feet',
  ],
  back: [
    'head', 'neck', 'trapezius', 'deltoids', 'upper-back', 'triceps', 'forearm', 'hands', 'lower-back', 'gluteal',
    'adductors', 'hamstring', 'calves', 'feet',
  ],
}

/** Not muscles: disabled when she picks a specific muscle. */
export const NOT_MUSCLES: Slug[] = ['hair', 'head', 'hands', 'feet', 'knees', 'ankles']

export const musclesOf = (view: BodyView) => VIEW_PARTS[view].filter((s) => !NOT_MUSCLES.includes(s))

/** The figure draws the hair as its own zone; for pain it is the head. */
export const zoneOf = (slug: Slug): Slug => (slug === 'hair' ? 'head' : slug)

const BACK: Slug[] = ['upper-back', 'lower-back', 'trapezius']

/** She is sure it is muscular. */
export function muscleSymptom(slug: Slug): string {
  if (slug === 'chest') return 'chest pain'
  if (BACK.includes(slug)) return 'back pain'
  return 'joint or muscle pain'
}

/** She is not sure: the symptom that the painted zone stands for. */
export function zoneSymptom(slug: Slug): string {
  const zone = zoneOf(slug)
  if (zone === 'head') return 'headache'
  if (zone === 'chest') return 'chest pain'
  if (zone === 'abs' || zone === 'obliques') return 'stomach pain'
  if (BACK.includes(zone)) return 'back pain'
  return 'joint or muscle pain'
}

/** Symptoms of the vocabulary that a day's pain log stands for (unique, in order). */
export function painSymptoms(day: PainDay | undefined): string[] {
  if (!day) return []
  const out = [...day.muscles.map((m) => muscleSymptom(m.slug)), ...day.strokes.flatMap((s) => s.zones.map(zoneSymptom))]
  return [...new Set(out)]
}

/** Every symptom this file can produce, checked against the vocabulary by the tests. */
export const PAIN_SYMPTOMS = [
  ...new Set([...(Object.values(VIEW_PARTS).flat() as Slug[]).flatMap((s) => [muscleSymptom(s), zoneSymptom(s)])]),
]

/** Problems with the vocabulary of the rules file (tests require none). */
export function checkPainVocabulary(): string[] {
  const words = new Set(VOCABULARY.map((v) => v.text))
  return PAIN_SYMPTOMS.filter((s) => !words.has(s)).map((s) => `"${s}" is not in symptoms.params.vocabulary.`)
}

/** Adds the symptoms of the logged pain to each day's record, so the engine evaluates them. */
export function applyPain(data: DemoData, log: PainLog): DemoData {
  if (!Object.values(log).some((d) => d.muscles.length || d.strokes.length)) return data
  return {
    ...data,
    days: data.days.map((d) => {
      const extra = painSymptoms(log[d.day])
      return extra.length ? { ...d, symptoms: [...new Set([...d.symptoms, ...extra])] } : d
    }),
  }
}

/** The figure's left/right is the viewer's; from the front, her left is on the viewer's right. */
export const toHerSide = (viewerSide: BodySide, view: BodyView): BodySide =>
  view === 'front' ? (viewerSide === 'left' ? 'right' : 'left') : viewerSide
export const toViewerSide = toHerSide

/** Adds or removes a muscle (same muscle, side and view). */
export function toggleMuscle(day: PainDay, mark: MuscleMark): PainDay {
  const same = (m: MuscleMark) => m.slug === mark.slug && m.side === mark.side && m.view === mark.view
  return day.muscles.some(same)
    ? { ...day, muscles: day.muscles.filter((m) => !same(m)) }
    : { ...day, muscles: [...day.muscles, mark] }
}

/**
 * What the figure library should color for one view: one entry per muscle. Both sides picked
 * (or a muscle without sides) = the whole muscle; one side = that side only. Highest intensity wins.
 */
export function muscleHighlights(marks: MuscleMark[], view: BodyView) {
  const bySlug = new Map<Slug, MuscleMark[]>()
  for (const m of marks.filter((m) => m.view === view)) bySlug.set(m.slug, [...(bySlug.get(m.slug) ?? []), m])
  return [...bySlug.entries()].map(([slug, ms]) => {
    const sides = new Set(ms.map((m) => m.side))
    const one = sides.size === 1 && !sides.has(undefined) ? [...sides][0] : undefined
    const intensity = Math.max(...ms.map((m) => m.intensity))
    return { slug, intensity, ...(one ? { side: toViewerSide(one, view) } : {}) }
  })
}

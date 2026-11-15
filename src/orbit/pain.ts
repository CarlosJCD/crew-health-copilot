// Pain events (body map), following Psychology's pain-spec.json v0.1 (copied unchanged):
//  where (figure zone, side, front or back), what it feels like (up to 3 words), how strong (NRS 0 to 10),
//  when it started and whether it is constant, what was happening, and whether moving or pressing makes it
//  worse. She describes; ORBIT never classifies tissue or names a cause (that is the medical officer's job).
// Two ways to say where: she can point to the exact muscle, or paint the area when she cannot.
// A region that matches an alarm sign (head, eyes, chest) asks the alarm question before saving.
// Rules: a pain in the same region on more than 2 days in a row is yellow (existing symptoms rule); red only
// for the alarm signs of orbit-indicators.json. Region, intensity, words, timing and "worse on move or press"
// are Body and reach the crew medical officer; the "Stressful moment today" context is Mind (private).
import type { Slug } from 'react-muscle-highlighter'
import { list } from './config'
import type { DemoData } from './demoData'
import spec from './pain-spec.json'

export type { Slug }
export type BodyView = 'front' | 'back'
/** Her own left or right (anatomical), not the viewer's. */
export type BodySide = 'left' | 'right'
export type BrushSize = 's' | 'm' | 'l'

export interface PainRegion {
  id: string
  label_en: string
  /** Body system key, as in the symptom vocabulary (brain_mood, eyes, heart_vessels, bone_muscle, immune_skin, gut). */
  system: string
  sided: boolean
}
export interface PainQuality {
  id: string
  label_en: string
  es: string
  family: string
  nerve_like: boolean
}
export interface PainContext {
  id: string
  label_en: string
  /** "mind": private unless she shares Mind. */
  domain?: string
}
interface Source {
  cite: string
  url: string | null
}

/** Psychology's pain spec, read as is. */
export const PAIN_SPEC = spec as unknown as {
  version: string
  disclaimer_en: string
  intensity: { prompt_en: string; anchors_en: Record<string, string>; verbal_label_en: Record<string, string>; sources: Source[] }
  regions: PainRegion[]
  qualities: PainQuality[]
  qualities_max_choices: number
  contexts: PainContext[]
  report_flow: { id: string; prompt_en: string; options_en?: string[]; also_en?: string }[]
  safety: { nerve_like_rule: { if_selected_gte: number; text_en: string }; co2_source: Source }
}

export const REGIONS = PAIN_SPEC.regions
export const QUALITIES = PAIN_SPEC.qualities
export const CONTEXTS = PAIN_SPEC.contexts
export const MAX_QUALITIES = PAIN_SPEC.qualities_max_choices
export const NERVE_RULE = PAIN_SPEC.safety.nerve_like_rule
export const CO2_SOURCE = PAIN_SPEC.safety.co2_source
export const region = (id: string) => REGIONS.find((r) => r.id === id)

/** NRS 0 to 10 (0 = no pain). */
export const INTENSITY = { min: 0, max: 10, start: 5 }

/** Verbal label shown under the number (display only; scoring uses the number). */
export function verbalLabel(n: number): 'none' | 'mild' | 'moderate' | 'severe' {
  for (const [range, label] of Object.entries(PAIN_SPEC.intensity.verbal_label_en)) {
    const [lo, hi = lo] = range.split('-').map(Number)
    if (n >= lo && n <= hi) return label.toLowerCase() as 'none' | 'mild' | 'moderate' | 'severe'
  }
  return 'none'
}

/** Answers of the timing and mechanics steps (report_flow steps 4 and 6). */
export const STARTED = ['today', '1_2_days', 'over_2_days'] as const
export const COURSE = ['constant', 'comes_and_goes'] as const
export const WORSE = ['yes', 'no', 'not_sure'] as const
export type Started = (typeof STARTED)[number]
export type Course = (typeof COURSE)[number]
export type Worse = (typeof WORSE)[number]

/** Brush diameter as a fraction of the figure's width. */
export const BRUSH: Record<BrushSize, number> = { s: 0.09, m: 0.15, l: 0.23 }
export const MAX_STROKES = 20
export const MAX_DOTS = 400
/** Space between brush dabs, as a share of the brush size (smaller = smoother line). */
export const DAB_SPACING = 0.18

/** Body figure she draws on (the library has a female and a male model). */
export type FigureKind = 'female' | 'male'

/** Intensity 1 to 10, light amber to deep red (display only). */
export const INTENSITY_COLORS = [
  '#f7e08a', '#f5cc6b', '#f3b450', '#f09a3e', '#ea7f33',
  '#e0652e', '#d34c2b', '#c3352a', '#b02229', '#9a1426',
] as const
export const intensityColor = (n: number) => INTENSITY_COLORS[Math.min(Math.max(Math.round(n), 1), 10) - 1]
/** Color of what she is marking before she rates it. */
export const MARK_COLOR = '#7cc4ff'

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

/** Not muscles: she paints them instead of picking a muscle. */
export const NOT_MUSCLES: Slug[] = ['hair', 'head', 'hands', 'feet', 'knees', 'ankles']
export const musclesOf = (view: BodyView) => VIEW_PARTS[view].filter((s) => !NOT_MUSCLES.includes(s))

/** The figure draws the hair as its own zone; for pain it is the head. */
export const zoneOf = (slug: Slug): Slug => (slug === 'hair' ? 'head' : slug)

/** Regions of the spec that the figure does not draw: she picks them with a button. */
export const OFF_FIGURE = ['eyes', 'skin']

/**
 * Region of the spec for a zone of the figure (engineering mapping, team criterion). The trapezius reads as
 * the neck from the front and as the upper back from behind.
 */
export function regionOfZone(slug: Slug, view: BodyView): string {
  switch (zoneOf(slug)) {
    case 'head': return 'head'
    case 'neck': return 'neck'
    case 'trapezius': return view === 'front' ? 'neck' : 'upper_back'
    case 'deltoids': return 'shoulder'
    case 'chest': return 'chest'
    case 'upper-back': return 'upper_back'
    case 'lower-back': return 'lower_back'
    case 'abs':
    case 'obliques': return 'abdomen'
    case 'biceps':
    case 'triceps':
    case 'forearm': return 'arm'
    case 'hands': return 'hand_wrist'
    case 'gluteal':
    case 'adductors': return 'hip'
    case 'ankles':
    case 'feet': return 'foot_ankle'
    default: return 'leg' // quadriceps, hamstring, knees, tibialis, calves
  }
}

/**
 * Symptoms of the fixed vocabulary (orbit-indicators.json) she can log where she feels them, besides pain.
 * Pain words (headache, back pain, stomach pain...) are the pain itself; alarm signs come in the alarm
 * question. Engineering mapping, team criterion pending Psychology 1 review.
 */
export const REGION_SYMPTOMS: Record<string, string[]> = {
  head: ['dizziness'],
  eyes: ['eye irritation'],
  neck: ['sore throat or congestion'],
  chest: ['palpitations'],
  abdomen: ['nausea'],
  skin: ['skin rash'],
}
export const symptomsFor = (regions: string[]) => [...new Set(regions.flatMap((r) => REGION_SYMPTOMS[r] ?? []))]

/** Alarm signs (red flags of orbit-indicators.json) asked about before saving pain in these regions. */
export const ALARM_CHECK: Record<string, string[]> = {
  head: ['severe headache', 'vision change'],
  eyes: ['vision change'],
  chest: ['chest pain', 'shortness of breath', 'fainting'],
}
export const alarmCheckFor = (regions: string[]) => [...new Set(regions.flatMap((r) => ALARM_CHECK[r] ?? []))]
export const isAlarm = (symptom: string) => list('symptoms', 'red_flags').includes(symptom.toLowerCase())

/** A muscle she pointed to. */
export interface MuscleMark {
  slug: Slug
  side?: BodySide
  view: BodyView
}

/** One painted area. `dots` are brush positions as fractions (0 to 1) of the figure's box. */
export interface PaintStroke {
  id: string
  view: BodyView
  size: BrushSize
  dots: [x: number, y: number][]
  /** Zones under the paint. A stroke with no dots fills these zones whole (keyboard path). */
  zones: Slug[]
  /** Zones under the paint with her side, when the zone has a left and a right half (only the painted half counts). */
  parts?: { zone: Slug; side?: BodySide }[]
  /** Figure it was painted on: the dots only line up on the same figure. */
  figure?: FigureKind
}

/** One pain report: the six steps of the spec's report_flow, plus the alarm signs she confirmed. */
export interface PainEvent {
  id: string
  muscles: MuscleMark[]
  strokes: PaintStroke[]
  /** Regions of the spec: from the figure, plus eyes or skin picked with a button. */
  regions: string[]
  side?: BodySide | 'both'
  qualities: string[]
  intensity: number
  started?: Started
  course?: Course
  contexts: string[]
  worse?: Worse
  /** Alarm signs she confirmed in the safety question. */
  alarms: string[]
  /** She feels pain or an ache there (reports before symptoms existed count as pain). */
  pain?: boolean
  /** Other symptoms she feels in that zone, from the fixed vocabulary (REGION_SYMPTOMS). */
  symptoms?: string[]
}

export const isPain = (e: Pick<PainEvent, 'pain'>) => e.pain !== false

export interface PainDay {
  events: PainEvent[]
}

/** Steps 2 to 6 of the report, while she fills them in. */
export type PainDetailsValue = Pick<PainEvent, 'qualities' | 'intensity' | 'started' | 'course' | 'contexts' | 'worse'>
export const EMPTY_DETAILS: PainDetailsValue = { qualities: [], intensity: INTENSITY.start, contexts: [] }

/** Pain events by mission day. */
export type PainLog = Record<string, PainDay>

export const EMPTY_PAIN: PainDay = { events: [] }

/** A day of the log as stored; anything older or malformed reads as no events. */
export const painDay = (x: unknown): PainDay =>
  x && typeof x === 'object' && Array.isArray((x as PainDay).events) ? (x as PainDay) : EMPTY_PAIN

/** The figure's left/right is the viewer's; from the front, her left is on the viewer's right. */
export const toHerSide = (viewerSide: BodySide, view: BodyView): BodySide =>
  view === 'front' ? (viewerSide === 'left' ? 'right' : 'left') : viewerSide
export const toViewerSide = toHerSide

/** Adds or removes a muscle (same muscle, side and view). */
export function toggleMuscle(marks: MuscleMark[], mark: MuscleMark): MuscleMark[] {
  const same = (m: MuscleMark) => m.slug === mark.slug && m.side === mark.side && m.view === mark.view
  return marks.some(same) ? marks.filter((m) => !same(m)) : [...marks, mark]
}

/** What the figure library should color for one view: one entry per muscle, one side only if only one was marked. */
export function muscleHighlights(marks: MuscleMark[], view: BodyView, color: string) {
  const bySlug = new Map<Slug, Set<BodySide | undefined>>()
  for (const m of marks.filter((m) => m.view === view)) bySlug.set(m.slug, (bySlug.get(m.slug) ?? new Set()).add(m.side))
  return [...bySlug.entries()].map(([slug, sides]) => {
    const one = sides.size === 1 && !sides.has(undefined) ? [...sides][0] : undefined
    return { slug, color, ...(one ? { side: toViewerSide(one, view) } : {}) }
  })
}

/** Her side of a painted stroke, from where the dots fall (the figure's midline is at 0.5). */
function strokeSide(s: PaintStroke): BodySide | 'both' | undefined {
  if (!s.dots.length) return undefined
  if (s.parts?.length) {
    const sides = new Set(s.parts.flatMap((p) => (p.side ? [p.side] : [])))
    return sides.size === 0 ? undefined : sides.size === 1 ? [...sides][0] : 'both'
  }
  const left = s.dots.every(([x]) => x < 0.47)
  const right = s.dots.every(([x]) => x > 0.53)
  return left ? toHerSide('left', s.view) : right ? toHerSide('right', s.view) : 'both'
}

/** Where a report is: regions of the spec and her side (only for sided regions). */
export function whereOf(muscles: MuscleMark[], strokes: PaintStroke[], extra: string[]): Pick<PainEvent, 'regions' | 'side'> {
  const regions = [
    ...new Set([
      ...muscles.map((m) => regionOfZone(m.slug, m.view)),
      ...strokes.flatMap((s) => s.zones.map((z) => regionOfZone(z, s.view))),
      ...extra,
    ]),
  ]
  const sided = regions.some((r) => region(r)?.sided)
  const sides = new Set([...muscles.map((m) => m.side), ...strokes.map(strokeSide)].filter((x) => x !== undefined))
  const side = !sided || !sides.size ? undefined : sides.size === 1 ? [...sides][0] : 'both'
  return { regions, ...(side ? { side } : {}) }
}

/** Nerve-like words: 3 or more get "Worth mentioning to your medical officer" (not an alarm). */
export const nerveLike = (qualities: string[]) =>
  qualities.filter((q) => QUALITIES.find((x) => x.id === q)?.nerve_like).length >= NERVE_RULE.if_selected_gte

/** Symptom the engine sees for pain in a region ("pain in lower back"). */
export const regionSymptom = (id: string) => `pain in ${(region(id)?.label_en ?? id).toLowerCase()}`

/** Body system key of a pain symptom, or undefined if it is not one. */
export const painSystem = (symptom: string) => REGIONS.find((r) => regionSymptom(r.id) === symptom)?.system

/** Symptoms a day of pain stands for: one per region, plus the alarm signs she confirmed. */
export function painSymptoms(day: PainDay | undefined): string[] {
  const events = painDay(day).events
  return [
    ...new Set(
      events.flatMap((e) => [...(isPain(e) && e.intensity > 0 ? e.regions : []).map(regionSymptom), ...(e.symptoms ?? []), ...e.alarms]),
    ),
  ]
}

/** Adds the symptoms of the logged pain to each day's record, so the engine evaluates them. */
export function applyPain(data: DemoData, log: PainLog): DemoData {
  if (!Object.values(log).some((d) => painDay(d).events.length)) return data
  return {
    ...data,
    days: data.days.map((d) => {
      const extra = painSymptoms(log[d.day])
      return extra.length ? { ...d, symptoms: [...new Set([...d.symptoms, ...extra])] } : d
    }),
  }
}

const STARTED_EN: Record<Started, string> = { today: 'started today', '1_2_days': 'started 1 to 2 days ago', over_2_days: 'started more than 2 days ago' }
const COURSE_EN: Record<Course, string> = { constant: 'constant', comes_and_goes: 'comes and goes' }

/** One line per event for the crew medical officer (Body). The stress context is Mind: only if she shares Mind. */
export function painPacketLines(day: PainDay | undefined, shareMind: boolean): string[] {
  return painDay(day).events.map((e) => {
    const where = e.regions.map((r) => region(r)?.label_en ?? r).join(', ') + (e.side ? ` (${e.side === 'both' ? 'both sides' : e.side})` : '')
    const words = e.qualities.map((q) => QUALITIES.find((x) => x.id === q)?.label_en ?? q).join(', ')
    const contexts = e.contexts
      .map((c) => CONTEXTS.find((x) => x.id === c))
      .filter((c): c is PainContext => !!c && (shareMind || c.domain !== 'mind'))
      .map((c) => c.label_en.toLowerCase())
    const parts = [
      `${isPain(e) ? 'Pain' : 'Symptom'}: ${where}, ${e.intensity}/10 ${verbalLabel(e.intensity)}`,
      e.symptoms?.length ? `symptoms: ${e.symptoms.join(', ')}` : '',
      words,
      [e.started && STARTED_EN[e.started], e.course && COURSE_EN[e.course]].filter(Boolean).join(', '),
      e.worse && `worse on move or press: ${e.worse.replace('_', ' ')}`,
      contexts.length ? `context: ${contexts.join(', ')}` : '',
      e.alarms.length ? `alarm signs: ${e.alarms.join(', ')}` : '',
    ]
    return parts.filter(Boolean).join('; ') + '.'
  })
}

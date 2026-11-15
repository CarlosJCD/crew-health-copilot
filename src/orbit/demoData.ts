// Demo data contract (handoff section 2.3) and the built-in copy of the demo story.
// Data science generates public/data/demo-data.json; when it exists and is valid the app uses it.
// Until then the app uses BUILT_IN_DEMO: the mission starts on day 1; days 23 to 30 carry the exact
// values of handoff section 4 (handoff days 121 to 128, renumbered), and days 1 to 22 are small seeded
// noise around the baseline (always green).
import { KNOWLEDGE } from '../data/knowledge'

/** [mean, standard deviation] */
export type MeanSd = [number, number]

export interface Persona {
  name: string
  role: string
  scenario: string
  mission_length_days: number
  baseline: {
    sleep_h: MeanSd
    hr: MeanSd
    sbp: MeanSd
    dbp: MeanSd
    /** In-flight baseline (body runs about 1 °C warmer in flight). */
    temp: MeanSd
    mood: MeanSd
    stress: MeanSd
    fatigue: MeanSd
    crew_climate: MeanSd
    pulse_ms: MeanSd
    contact: MeanSd
    exercise_prescription_min: number
  }
}

export interface DayRecord {
  day: number
  sleep_h: number | null
  hr: number | null
  sbp: number | null
  dbp: number | null
  temp: number | null
  mood: number | null
  stress: number | null
  fatigue: number | null
  crew_climate: number | null
  /** Median reaction time of the day's pulse session; null = no session. */
  pulse_ms: number | null
  /** Messages in the previous 24 h, counted in the morning. */
  contact: number | null
  exercise_min: number | null
  /** Fasting glucose, weekly; null on other days. Not in the handoff example: proposed addition. */
  glucose?: number | null
  /** Symptoms tapped on the body map that day. */
  symptoms: string[]
  /** Weekly PHQ-2 / GAD-2; null on other days. */
  screen: { phq2: number; gad2: number } | null
  /** Story events shown in the day log. */
  events: string[]
  /** She tapped "I want to talk to someone today". Proposed addition for the red psych state. */
  talk_request?: boolean
}

export interface DemoData {
  synthetic: boolean
  persona: Persona
  days: DayRecord[]
}

export type NumericField =
  | 'sleep_h' | 'hr' | 'sbp' | 'dbp' | 'temp' | 'mood' | 'stress' | 'fatigue'
  | 'crew_climate' | 'pulse_ms' | 'contact' | 'exercise_min' | 'glucose'

export const NUMERIC_FIELDS: NumericField[] = [
  'sleep_h', 'hr', 'sbp', 'dbp', 'temp', 'mood', 'stress', 'fatigue',
  'crew_climate', 'pulse_ms', 'contact', 'exercise_min', 'glucose',
]

/** Story days of the demo (handoff days 121 to 128, renumbered so the mission starts on day 1). */
export const STORY_DAYS = { first: 23, last: 30 }

/**
 * Days the day control can reach: every day in the loaded file (1 to 30 in the data team's file), so
 * testers can also visit her history before the story.
 */
export function dayRange(data: DemoData): { first: number; last: number } {
  const days = data.days.map((d) => d.day)
  return days.length ? { first: Math.min(...days), last: Math.max(...days) } : STORY_DAYS
}

/** The first numbering of the data (story on days 121 to 128) minus this is the current one (23 to 30). */
export const LEGACY_DAY_OFFSET = 98

/**
 * The day a link asks for, as a day of the file. Links from the first numbering (the script, the test
 * cases and the deck say `day=125`) go to the same story day now (27); any other day outside the file goes
 * to the nearest day it has. `moved` says why the day shown is not the one asked for.
 */
export function resolveDay(
  requested: number,
  range: { first: number; last: number },
): { day: number; moved?: 'legacy' | 'clamped' } {
  if (requested >= range.first && requested <= range.last) return { day: requested }
  const legacy = requested - LEGACY_DAY_OFFSET
  if (legacy >= range.first && legacy <= range.last) return { day: legacy, moved: 'legacy' }
  return { day: Math.min(range.last, Math.max(range.first, requested)), moved: 'clamped' }
}

// ---------------------------------------------------------------------------------------------
// Built-in demo (handoff sections 2.3 and 4)

const PERSONA: Persona = {
  name: 'Lena Ortiz',
  role: 'Mission specialist',
  scenario: 'mars_transit',
  mission_length_days: 180,
  baseline: {
    sleep_h: [6.5, 0.3],
    hr: [58, 2],
    sbp: [112, 3],
    dbp: [72, 3],
    temp: [37.9, 0.1],
    mood: [7, 0.6],
    stress: [4, 0.7],
    fatigue: [4, 0.7],
    crew_climate: [7, 0.5],
    pulse_ms: [320, 12],
    contact: [2, 0.6],
    exercise_prescription_min: 120,
  },
}

type StoryRow = [day: number, sleep: number, hr: number, sbp: number, dbp: number, temp: number, mood: number,
  stress: number, fatigue: number, climate: number, pulse: number, contact: number, exercise: number]

// Handoff section 4, exact values.
const STORY: StoryRow[] = [
  [23, 6.6, 58, 114, 73, 38.0, 7, 4, 4, 7, 318, 2, 120],
  [24, 6.4, 59, 113, 72, 37.9, 7, 5, 4, 7, 322, 0, 110],
  [25, 5.2, 62, 115, 74, 37.9, 6, 5, 5, 7, 352, 0, 115],
  [26, 5.4, 69, 117, 75, 38.0, 5, 7, 6, 6, 356, 0, 100],
  [27, 5.3, 70, 118, 76, 38.0, 4, 7, 6, 6, 360, 0, 90],
  [28, 6.3, 63, 115, 74, 37.9, 6, 5, 5, 7, 338, 2, 120],
  [29, 6.5, 60, 113, 73, 37.9, 6, 4, 4, 7, 325, 2, 120],
  [30, 6.6, 59, 112, 72, 37.9, 7, 4, 4, 7, 320, 2, 120],
]

// Story events in English (app text), from Psychology's package of Nov 14, 20:45 (section 2.3).
// Her adult sister replaces the daughter of the first script (2026 guide: no persons under 18).
const EVENTS: Record<number, string[]> = {
  24: ["Tomorrow her shift moves 3 hours earlier"],
  25: ["Shift change"],
  27: ["Early signal. She says she missed her sister's birthday call; she picks a protected sleep window and a video message with a puzzle for her sister"],
  28: ["Her sister's reply arrives"],
  29: ["ORBIT asks: did it help?"],
  30: ["Weekly check: PHQ-2 = 1, GAD-2 = 2", "Weekly summary: one early signal, resolved onboard"],
}

// Weekly fasting glucose (synthetic, inside the green range). Proposed: the handoff example has no glucose.
const GLUCOSE: Record<number, number> = { 2: 89, 9: 88, 16: 90, 23: 89, 30: 87 }

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const round = (x: number, decimals = 0) => Number(x.toFixed(decimals))

function buildDemo(): DemoData {
  const rand = mulberry32(121) // same seed as before: the background noise keeps its values
  const b = PERSONA.baseline
  // Noise of at most ±0.5 SD keeps every pre-story day green.
  const near = ([m, sd]: MeanSd, decimals = 0) => round(m + (rand() * 2 - 1) * 0.5 * sd, decimals)
  const days: DayRecord[] = []
  for (let day = 1; day < STORY_DAYS.first; day++) {
    days.push({
      day,
      sleep_h: near(b.sleep_h, 1),
      hr: near(b.hr),
      sbp: near(b.sbp),
      dbp: near(b.dbp),
      temp: near(b.temp, 1),
      mood: near(b.mood),
      stress: near(b.stress),
      fatigue: near(b.fatigue),
      crew_climate: near(b.crew_climate),
      // Handoff: the two days before the story (21 and 22) sit inside the band (319 and 321 ms) with contact 2.
      pulse_ms: day === 21 ? 319 : day === 22 ? 321 : near(b.pulse_ms),
      contact: day >= 21 ? 2 : near(b.contact),
      exercise_min: round(b.exercise_prescription_min + (rand() * 2 - 1) * 5),
      glucose: GLUCOSE[day] ?? null,
      symptoms: [],
      screen: null,
      events: [],
    })
  }
  for (const [day, sleep, hr, sbp, dbp, temp, mood, stress, fatigue, climate, pulse, contact, exercise] of STORY) {
    days.push({
      day,
      sleep_h: sleep,
      hr,
      sbp,
      dbp,
      temp,
      mood,
      stress,
      fatigue,
      crew_climate: climate,
      pulse_ms: pulse,
      contact,
      exercise_min: exercise,
      glucose: GLUCOSE[day] ?? null,
      symptoms: [],
      screen: day === 30 ? { phq2: 1, gad2: 2 } : null,
      events: EVENTS[day] ?? [],
    })
  }
  return { synthetic: true, persona: PERSONA, days }
}

export const BUILT_IN_DEMO = buildDemo()

// ---------------------------------------------------------------------------------------------
// Loading and checking the data team's file

export const DEMO_DATA_URL = './data/demo-data.json'

/** Plausible ranges from the data team's reference catalog (knowledge.json), by demo field. */
const CATALOG_ID: Partial<Record<NumericField, string>> = {
  sleep_h: 'sleep', hr: 'hr', sbp: 'sbp', dbp: 'dbp', temp: 'temp', mood: 'mood', stress: 'stress',
  pulse_ms: 'rt', exercise_min: 'exercise', glucose: 'glucose',
}
const FALLBACK_RANGE: Partial<Record<NumericField, [number, number]>> = {
  fatigue: [0, 10], crew_climate: [0, 10], contact: [0, 500],
}

export function plausibleRange(field: NumericField): [number, number] | undefined {
  const id = CATALOG_ID[field]
  const k = id ? KNOWLEDGE.indicators.find((i) => i.id === id) : undefined
  return k ? [k.plausible_min, k.plausible_max] : FALLBACK_RANGE[field]
}

const isMeanSd = (x: unknown): x is MeanSd =>
  Array.isArray(x) && x.length === 2 && x.every((n) => typeof n === 'number' && Number.isFinite(n))

const MAX_REPORTED = 20

/** Checks a demo-data.json against the contract. Bad days are dropped and explained. */
export function validateDemoData(input: unknown): { data?: DemoData; errors: string[] } {
  const errors: string[] = []
  const note = (msg: string) => {
    if (errors.length < MAX_REPORTED) errors.push(msg)
  }
  if (typeof input !== 'object' || input === null) return { errors: ['The file must contain a JSON object.'] }
  const o = input as Record<string, unknown>
  const p = o.persona as Persona | undefined
  if (!p || typeof p.name !== 'string' || typeof p.baseline !== 'object' || p.baseline === null) {
    return { errors: ['"persona" with "name" and "baseline" is required.'] }
  }
  for (const k of ['sleep_h', 'hr', 'sbp', 'dbp', 'temp', 'mood', 'stress', 'fatigue', 'crew_climate', 'pulse_ms', 'contact'] as const) {
    if (!isMeanSd(p.baseline[k])) note(`persona.baseline.${k} must be [mean, sd].`)
  }
  if (typeof p.baseline.exercise_prescription_min !== 'number') note('persona.baseline.exercise_prescription_min must be a number.')
  if (errors.length) return { errors }
  if (!Array.isArray(o.days)) return { errors: ['"days" must be a list.'] }

  const days: DayRecord[] = []
  const seen = new Set<number>()
  o.days.forEach((raw: unknown, i) => {
    if (typeof raw !== 'object' || raw === null) return note(`days[${i}]: not an object.`)
    const d = raw as Record<string, unknown>
    if (typeof d.day !== 'number' || !Number.isInteger(d.day)) return note(`days[${i}]: "day" must be an integer.`)
    if (seen.has(d.day)) return note(`days[${i}]: day ${d.day} appears twice.`)
    for (const f of NUMERIC_FIELDS) {
      const v = d[f]
      if (v === undefined || v === null) continue
      if (typeof v !== 'number' || !Number.isFinite(v)) return note(`day ${d.day}: "${f}" must be a number or null.`)
      const r = plausibleRange(f)
      if (r && (v < r[0] || v > r[1])) return note(`day ${d.day}: ${f} = ${v} is outside the plausible range ${r[0]} to ${r[1]}.`)
    }
    seen.add(d.day)
    const num = (f: NumericField) => (typeof d[f] === 'number' ? (d[f] as number) : null)
    const screen = d.screen as DayRecord['screen']
    days.push({
      day: d.day,
      sleep_h: num('sleep_h'), hr: num('hr'), sbp: num('sbp'), dbp: num('dbp'), temp: num('temp'),
      mood: num('mood'), stress: num('stress'), fatigue: num('fatigue'), crew_climate: num('crew_climate'),
      pulse_ms: num('pulse_ms'), contact: num('contact'), exercise_min: num('exercise_min'), glucose: num('glucose'),
      symptoms: Array.isArray(d.symptoms) ? d.symptoms.map(String) : [],
      screen: screen && typeof screen.phq2 === 'number' && typeof screen.gad2 === 'number' ? screen : null,
      events: Array.isArray(d.events) ? d.events.map(String) : [],
      talk_request: d.talk_request === true,
    })
  })
  if (!days.length) return { errors: [...errors, 'No valid days.'] }
  days.sort((a, b) => a.day - b.day)
  return { data: { synthetic: o.synthetic !== false, persona: p, days }, errors }
}

export interface LoadedDemo {
  data: DemoData
  origin: 'file' | 'built-in'
  errors: string[]
}

/** The data team's demo-data.json if present and valid; otherwise the built-in story. */
export async function loadDemoData(fetchImpl: typeof fetch = fetch): Promise<LoadedDemo> {
  const builtIn = (errors: string[] = []): LoadedDemo => ({ data: BUILT_IN_DEMO, origin: 'built-in', errors })
  let res: Response
  try {
    res = await fetchImpl(DEMO_DATA_URL, { cache: 'no-cache' })
  } catch {
    return builtIn()
  }
  // Dev servers answer missing files with HTML: anything that is not JSON counts as missing.
  if (!res.ok || !(res.headers.get('content-type') ?? '').includes('json')) return builtIn()
  let json: unknown
  try {
    json = await res.json()
  } catch {
    return builtIn([`${DEMO_DATA_URL} is not valid JSON.`])
  }
  const { data, errors } = validateDemoData(json)
  return data ? { data, origin: 'file', errors } : builtIn(errors)
}

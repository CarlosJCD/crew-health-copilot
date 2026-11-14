import type { Measurement } from './types'
import { INDICATORS } from './indicators'
import { validateMeasurements } from './validate'

// PLACEHOLDER synthetic data so the UI works before the data-science dataset lands.
// When public/data/synthetic.json exists, `loadMeasurements` uses it instead (see validate.ts).
// Story baked in: 7 pre-flight baseline days, then from mission day 8 a slow,
// cross-domain drift (less sleep, lower mood, higher stress, slower reactions, less contact).

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface Profile {
  base: number
  noise: number
  /** Change per day once the drift starts (day >= DRIFT_START). */
  drift: number
}

const DRIFT_START = 8
const FIRST_DAY = -7
const LAST_DAY = 14

const PROFILES: Record<string, Profile> = {
  sleep: { base: 7.0, noise: 0.35, drift: -0.15 },
  hr: { base: 58, noise: 2, drift: 0.5 },
  sbp: { base: 116, noise: 3.5, drift: 0 },
  glucose: { base: 88, noise: 4, drift: 0 },
  temp: { base: 36.6, noise: 0.12, drift: 0 },
  mood: { base: 7.5, noise: 0.7, drift: -0.2 },
  stress: { base: 3.5, noise: 0.7, drift: 0.2 },
  rt: { base: 265, noise: 12, drift: 5 },
  contact: { base: 12, noise: 2, drift: -0.8 },
  exercise: { base: 120, noise: 10, drift: -6 },
}

export function generateSample(astronautId = 'demo-astronaut'): Measurement[] {
  const rand = mulberry32(42)
  const rows: Measurement[] = []
  for (let day = FIRST_DAY; day <= LAST_DAY; day++) {
    for (const def of INDICATORS) {
      const p = PROFILES[def.id]
      if (!p) continue
      const driftDays = Math.max(0, day - DRIFT_START + 1)
      const noise = (rand() * 2 - 1) * p.noise
      const raw = p.base + p.drift * driftDays + noise
      const value = def.unit === '/10' ? Math.min(10, Math.max(0, raw)) : raw
      rows.push({ astronautId, day, indicatorId: def.id, value, unit: def.unit, source: 'synthetic' })
    }
  }
  return rows
}

export const MISSION_DAYS = { first: FIRST_DAY, last: LAST_DAY }

export const DATASET_URL = './data/synthetic.json'

export interface LoadedData {
  rows: Measurement[]
  /** 'file' = public/data/synthetic.json; 'generated' = built-in placeholder. */
  origin: 'file' | 'generated'
  errors: string[]
}

/**
 * Loads the data-science dataset if it exists and is valid, otherwise the built-in placeholder.
 * A missing file is normal until the dataset is delivered; dev servers answer it with HTML, so
 * anything that is not JSON counts as missing.
 */
export async function loadMeasurements(fetchImpl: typeof fetch = fetch): Promise<LoadedData> {
  let res: Response
  try {
    res = await fetchImpl(DATASET_URL, { cache: 'no-cache' })
  } catch {
    return { rows: generateSample(), origin: 'generated', errors: [] }
  }
  const type = res.headers.get('content-type') ?? ''
  if (!res.ok || !type.includes('json')) return { rows: generateSample(), origin: 'generated', errors: [] }

  let json: unknown
  try {
    json = await res.json()
  } catch {
    return { rows: generateSample(), origin: 'generated', errors: [`${DATASET_URL} is not valid JSON.`] }
  }
  const { rows, errors } = validateMeasurements(json)
  if (!rows.length) {
    return { rows: generateSample(), origin: 'generated', errors: [`${DATASET_URL} has no valid rows.`, ...errors] }
  }
  // The app follows one astronaut for now; extra astronauts are ignored but reported.
  const ids = [...new Set(rows.map((r) => r.astronautId))]
  const notes = ids.length > 1 ? [`Found ${ids.length} astronauts; showing "${ids[0]}".`] : []
  return { rows: rows.filter((r) => r.astronautId === ids[0]), origin: 'file', errors: [...notes, ...errors] }
}

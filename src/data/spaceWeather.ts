// NASA DONKI space-weather snapshot (public/data/space-weather.json), written by
// scripts/fetch-space-weather.mjs in CI. Shown as context for the space-radiation hazard only:
// the app does not estimate radiation dose.

export interface Flare {
  id: string
  time: string
  classType: string | null
  link?: string
}

export interface SepEvent {
  id: string
  time: string
  link?: string
}

export interface SpaceWeatherSnapshot {
  fetchedAt: string
  complete?: boolean
  windowDays: number
  startDate: string
  endDate: string
  source: { name: string; url: string; api?: string }
  flares: Flare[]
  sep: SepEvent[]
}

export interface SpaceWeatherSummary {
  flares: number
  /** M-class or stronger. */
  strongFlares: number
  sep: number
  strongest?: Flare
  latestSep?: SepEvent
}

const CLASS_RANK: Record<string, number> = { A: 0, B: 1, C: 2, M: 3, X: 4 }

/** Comparable number for a GOES class like "M2.4" (letter first, then magnitude). */
export function flareRank(classType: string | null | undefined): number {
  const m = /^([ABCMX])(\d+(?:\.\d+)?)?/.exec(classType ?? '')
  if (!m) return -1
  return CLASS_RANK[m[1]] * 100 + Number(m[2] ?? 0)
}

export function summarize(s: SpaceWeatherSnapshot): SpaceWeatherSummary {
  const strongest = s.flares.reduce<Flare | undefined>(
    (best, f) => (flareRank(f.classType) > flareRank(best?.classType) ? f : best),
    undefined,
  )
  const latestSep = s.sep.reduce<SepEvent | undefined>((last, e) => (!last || e.time > last.time ? e : last), undefined)
  return {
    flares: s.flares.length,
    strongFlares: s.flares.filter((f) => flareRank(f.classType) >= CLASS_RANK.M * 100).length,
    sep: s.sep.length,
    strongest,
    latestSep,
  }
}

export const SPACE_WEATHER_URL = './data/space-weather.json'

/** Snapshot or undefined if it has not been generated yet (local dev) or cannot be read. */
export async function loadSpaceWeather(fetchImpl: typeof fetch = fetch): Promise<SpaceWeatherSnapshot | undefined> {
  try {
    const res = await fetchImpl(SPACE_WEATHER_URL)
    if (!res.ok || !(res.headers.get('content-type') ?? '').includes('json')) return undefined
    const json = (await res.json()) as SpaceWeatherSnapshot
    return Array.isArray(json.flares) && Array.isArray(json.sep) ? json : undefined
  } catch {
    return undefined
  }
}

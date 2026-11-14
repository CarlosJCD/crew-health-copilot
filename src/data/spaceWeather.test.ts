import { describe, expect, it } from 'vitest'
import { flareRank, loadSpaceWeather, summarize, type SpaceWeatherSnapshot } from './spaceWeather'

const snapshot: SpaceWeatherSnapshot = {
  fetchedAt: '2026-11-14T12:00:00Z',
  windowDays: 30,
  startDate: '2026-10-15',
  endDate: '2026-11-14',
  source: { name: 'NASA DONKI', url: 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/' },
  flares: [
    { id: 'f1', time: '2026-10-20T01:00Z', classType: 'C3.1' },
    { id: 'f2', time: '2026-11-02T05:00Z', classType: 'M1.4' },
    { id: 'f3', time: '2026-11-09T09:00Z', classType: 'X1.1' },
    { id: 'f4', time: '2026-11-10T09:00Z', classType: 'M9.9' },
    { id: 'f5', time: '2026-11-11T09:00Z', classType: null },
  ],
  sep: [
    { id: 's1', time: '2026-11-03T00:00Z' },
    { id: 's2', time: '2026-11-10T00:00Z' },
  ],
}

describe('flareRank', () => {
  it('orders by class letter, then magnitude', () => {
    expect(flareRank('X1.1')).toBeGreaterThan(flareRank('M9.9'))
    expect(flareRank('M2')).toBeGreaterThan(flareRank('M1.4'))
    expect(flareRank(null)).toBe(-1)
  })
})

describe('summarize', () => {
  it('counts flares, strong flares and SEP events, and finds the extremes', () => {
    const s = summarize(snapshot)
    expect(s).toMatchObject({ flares: 5, strongFlares: 3, sep: 2 })
    expect(s.strongest?.id).toBe('f3')
    expect(s.latestSep?.id).toBe('s2')
  })

  it('handles an empty snapshot', () => {
    expect(summarize({ ...snapshot, flares: [], sep: [] })).toEqual({ flares: 0, strongFlares: 0, sep: 0, strongest: undefined, latestSep: undefined })
  })
})

describe('loadSpaceWeather', () => {
  const respond = (body: string, status = 200, type = 'application/json') =>
    (async () => new Response(body, { status, headers: { 'content-type': type } })) as unknown as typeof fetch

  it('returns the snapshot when present', async () => {
    expect((await loadSpaceWeather(respond(JSON.stringify(snapshot))))?.flares).toHaveLength(5)
  })

  it('returns undefined when missing, HTML or malformed', async () => {
    expect(await loadSpaceWeather(respond('nope', 404, 'text/plain'))).toBeUndefined()
    expect(await loadSpaceWeather(respond('<!doctype html>', 200, 'text/html'))).toBeUndefined()
    expect(await loadSpaceWeather(respond('{"flares": 3}'))).toBeUndefined()
  })
})

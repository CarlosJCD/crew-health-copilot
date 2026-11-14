// Fetches recent solar flares (FLR) and solar energetic particle events (SEP) from NASA DONKI
// and writes a small snapshot the app ships with: public/data/space-weather.json.
//
// Why a snapshot and not a live call from the browser: the app must work offline (on a Mars
// mission space weather would be uplinked, not browsed), and the shared DEMO_KEY is heavily
// rate-limited. CI runs this before every build and on a daily schedule.
//
// Usage: NASA_API_KEY=your_key node scripts/fetch-space-weather.mjs   (falls back to DEMO_KEY)
// Get a free key at https://api.nasa.gov/. Never commit a key; in CI it comes from a repo secret.
// On any failure the previous snapshot is kept, so a NASA outage never breaks the deploy.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../public/data/space-weather.json')
const KEY = process.env.NASA_API_KEY || 'DEMO_KEY'
// 30 days is the DONKI default window. A 90-day SEP request returned HTTP 400 in testing (cause not confirmed).
const WINDOW_DAYS = 30
const day = (d) => d.toISOString().slice(0, 10)

const end = new Date()
const start = new Date(end.getTime() - WINDOW_DAYS * 86_400_000)
const previous = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : undefined

async function get(type) {
  const url = `https://api.nasa.gov/DONKI/${type}?startDate=${day(start)}&endDate=${day(end)}&api_key=${KEY}`
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) })
  const body = await res.text()
  if (!res.ok) throw new Error(`${type}: HTTP ${res.status} ${body.replace(/\s+/g, ' ').slice(0, 160)}`)
  return body.trim() ? JSON.parse(body) : []
}

/** Fetch one event type; on failure keep that type from the previous snapshot. */
async function fetchType(type, map, prevKey) {
  try {
    return { items: (await get(type)).map(map), fresh: true }
  } catch (err) {
    console.warn(`space-weather: ${err.message}`)
    return { items: previous?.[prevKey] ?? [], fresh: false }
  }
}

// Sequential on purpose: the shared DEMO_KEY rejects bursts.
const flares = await fetchType(
  'FLR',
  (f) => ({ id: f.flrID, time: f.peakTime ?? f.beginTime, classType: f.classType, link: f.link }),
  'flares',
)
const sep = await fetchType('SEP', (s) => ({ id: s.sepID, time: s.eventTime, link: s.link }), 'sep')

if (!flares.fresh && !sep.fresh) {
  console.warn(`space-weather: nothing fetched; ${previous ? 'keeping previous snapshot' : 'no snapshot written'}`)
} else {
  const snapshot = {
    fetchedAt: new Date().toISOString(),
    complete: flares.fresh && sep.fresh,
    windowDays: WINDOW_DAYS,
    startDate: day(start),
    endDate: day(end),
    source: {
      name: 'NASA DONKI (Space Weather Database Of Notifications, Knowledge, Information)',
      url: 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/',
      api: 'https://api.nasa.gov/',
    },
    flares: flares.items,
    sep: sep.items,
  }
  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, JSON.stringify(snapshot, null, 2) + '\n')
  console.log(`space-weather: ${snapshot.flares.length} flares, ${snapshot.sep.length} SEP events (${snapshot.startDate} to ${snapshot.endDate})`)
}

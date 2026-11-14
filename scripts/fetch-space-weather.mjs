// Fetches recent solar flares (FLR) and solar energetic particle events (SEP) from NASA DONKI
// and writes a small snapshot the app ships with: public/data/space-weather.json.
//
// Why a snapshot and not a live call from the browser: the app must work offline (on a Mars
// mission space weather would be uplinked, not browsed), and the shared DEMO_KEY is heavily
// rate-limited. CI runs this before every build and on a daily schedule.
//
// Usage: NASA_API_KEY=your_key node scripts/fetch-space-weather.mjs   (falls back to DEMO_KEY)
// Get a free key at https://api.nasa.gov/. Never commit a key; in CI it comes from a repo secret.
// A NASA outage never breaks the deploy: if both lists fail, the previous snapshot is kept (CI
// restores the last published one first); if only one fails, it is written as null so the app
// says "not downloaded" instead of showing a misleading zero.

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
const hasPrevious = existsSync(OUT) && readFileSync(OUT, 'utf8').trim().startsWith('{')

const query = `startDate=${day(start)}&endDate=${day(end)}`
// api.nasa.gov first; the CCMC host is the same DONKI service without a key. On 2026-11-14 the
// api.nasa.gov FLR request answered HTTP 404 in CI and CCMC timed out from a local machine.
const endpoints = (type) => [
  { name: 'api.nasa.gov', url: `https://api.nasa.gov/DONKI/${type}?${query}&api_key=${KEY}` },
  { name: 'CCMC', url: `https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/${type}?${query}` },
]

async function get(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) })
  const body = await res.text()
  if (!res.ok) throw new Error(`HTTP ${res.status} ${body.replace(/\s+/g, ' ').slice(0, 160)}`)
  const json = body.trim() ? JSON.parse(body) : []
  if (!Array.isArray(json)) throw new Error(`unexpected answer ${body.slice(0, 160)}`)
  return json
}

/** Items of one event type, or null if no endpoint answered. Messages never include the key. */
async function fetchType(type, map) {
  for (const { name, url } of endpoints(type)) {
    try {
      const items = (await get(url)).map(map)
      console.log(`space-weather: ${type} from ${name}`)
      return items
    } catch (err) {
      console.warn(`space-weather: ${type} via ${name} failed: ${err.message}`)
    }
  }
  return null
}

// Sequential on purpose: the shared DEMO_KEY rejects bursts.
const flares = await fetchType('FLR', (f) => ({
  id: f.flrID,
  time: f.peakTime ?? f.beginTime,
  classType: f.classType,
  link: f.link,
}))
const sep = await fetchType('SEP', (s) => ({ id: s.sepID, time: s.eventTime, link: s.link }))

if (!flares && !sep) {
  console.warn(`space-weather: nothing fetched; ${hasPrevious ? 'keeping previous snapshot' : 'no snapshot written'}`)
} else {
  const snapshot = {
    fetchedAt: new Date().toISOString(),
    complete: Boolean(flares && sep),
    windowDays: WINDOW_DAYS,
    startDate: day(start),
    endDate: day(end),
    source: {
      name: 'NASA DONKI (Space Weather Database Of Notifications, Knowledge, Information)',
      url: 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/',
      api: 'https://api.nasa.gov/',
    },
    flares, // null = not downloaded
    sep,
  }
  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, JSON.stringify(snapshot, null, 2) + '\n')
  const n = (list) => (list ? list.length : 'not downloaded')
  console.log(`space-weather: flares ${n(flares)}, SEP ${n(sep)} (${snapshot.startDate} to ${snapshot.endDate})`)
}

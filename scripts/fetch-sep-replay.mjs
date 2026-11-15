// Saves the real solar energetic particle (SEP) events of May 2024 from NASA DONKI to
// public/data/donki-sep-2024-05.json, for the radiation layer's "solar particle event replay"
// (handoff section 6). Historical data does not change, so the file is committed and the build
// never depends on NASA for it. Run again only to refresh: node scripts/fetch-sep-replay.mjs
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../public/data/donki-sep-2024-05.json')
const URL = 'https://ccmc.gsfc.nasa.gov/DONKI-API/get/SEP?startDate=2024-05-01&endDate=2024-05-31'

const res = await fetch(URL, { signal: AbortSignal.timeout(30_000) })
if (!res.ok) throw new Error(`DONKI SEP: HTTP ${res.status}`)
const raw = await res.json()
const sep = raw.map((e) => ({
  id: e.sepID,
  time: e.eventTime,
  instruments: (e.instruments ?? []).map((i) => i.displayName),
  linkedEvents: (e.linkedEvents ?? []).map((l) => l.activityID),
  link: e.link,
}))
mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(
  OUT,
  JSON.stringify(
    {
      fetchedAt: new Date().toISOString(),
      startDate: '2024-05-01',
      endDate: '2024-05-31',
      source: { name: 'NASA DONKI (CCMC)', url: 'https://ccmc.gsfc.nasa.gov/tools/DONKI/', api: URL },
      sep,
    },
    null,
    2,
  ) + '\n',
)
console.log(`sep-replay: ${sep.length} SEP events in May 2024; May 9: ${sep.filter((e) => e.time.startsWith('2024-05-09')).length}`)

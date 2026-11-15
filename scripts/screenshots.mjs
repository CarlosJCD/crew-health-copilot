// Deck screenshots with headless Chrome, using the app's deep links (#/today?day=125&why=temp).
// Usage: node scripts/screenshots.mjs [base URL]   (default: the public app)
// Needs Google Chrome; set CHROME_PATH if it is not in the default macOS location.
// Runs in a throwaway profile, so it never touches your own Chrome. Output: screenshots/*.png
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const BASE = (process.argv[2] ?? 'https://carlosjcd.github.io/orbit/').replace(/\/?$/, '/')
const CHROME = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../screenshots')

// Handoff, 08:00 list. Add the body map and free mode here once they exist.
const SHOTS = [
  { name: '01-today-day125-early-signal', hash: '#/today?day=125' },
  { name: '02-today-day121-why-temperature', hash: '#/today?day=121&why=temp' },
  { name: '03-today-day123-sleep-only', hash: '#/today?day=123' },
  { name: '04-boost-day125-choose-two', hash: '#/boost?day=125' },
  { name: '04b-transmit-day125-delay', hash: '#/transmit?day=125' },
  { name: '05-mind-day125-checkin', hash: '#/mind?day=125' },
  { name: '06-today-day128-green', hash: '#/today?day=128' },
]

mkdirSync(OUT, { recursive: true })
const profile = mkdtempSync(join(tmpdir(), 'orbit-shots-'))
try {
  for (const shot of SHOTS) {
    const file = join(OUT, `${shot.name}.png`)
    execFileSync(CHROME, [
      '--headless=new',
      `--user-data-dir=${profile}`,
      '--hide-scrollbars',
      '--window-size=1280,1600',
      '--force-device-scale-factor=2',
      '--virtual-time-budget=6000',
      `--screenshot=${file}`,
      `${BASE}${shot.hash}`,
    ], { stdio: 'ignore' })
    console.log(`screenshot: ${file}`)
  }
} finally {
  rmSync(profile, { recursive: true, force: true })
}

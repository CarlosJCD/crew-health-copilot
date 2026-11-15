import { describe, expect, it } from 'vitest'
import { BUILT_IN_DEMO } from './demoData'
import { evaluateDay } from './engine'
import { applyPulse, isPractice, nextInterval, PULSE, PULSE_SPEC, scoreSession, type PulseSession, type Trial } from './pulse'
import { DICTIONARIES } from '../i18n/strings'

const rts = (...ms: number[]): Trial[] => ms.map((rtMs) => ({ rtMs }))
const many = (n: number, ms: number) => rts(...Array.from({ length: n }, () => ms))

describe('pulse task settings (pulse-spec.json and orbit-indicators.json)', () => {
  it('run 3 minutes with a 1 to 4 s wait, 100 ms false-start and 355 ms lapse limits', () => {
    expect(PULSE).toMatchObject({ durationMs: 180_000, isiMs: [1000, 4000], falseStartLtMs: 100, lapseGteMs: 355, practiceSessions: 5, minValid: 20 })
    expect(nextInterval(() => 0)).toBe(1000)
    expect(nextInterval(() => 0.999999)).toBeCloseTo(4000, 0)
  })
})

describe('scoreSession', () => {
  it('takes the median of valid responses, lapses included, false starts excluded', () => {
    const r = scoreSession([...many(19, 300), ...rts(400, 500), { early: true }, ...rts(80)])
    expect(r.valid).toBe(21)
    expect(r.median_ms).toBe(300)
    expect(r.lapses).toBe(2)
    expect(r.false_starts).toBe(2)
    expect(r.response_speed).toBeGreaterThan(3)
  })

  it('leaves the session without a result under 20 valid responses', () => {
    const r = scoreSession(many(19, 300))
    expect(r.median_ms).toBeNull()
    expect(r.valid).toBe(19)
  })
})

describe('sessions feed the engine', () => {
  const session = (day: number, median: number | null, practice = false): PulseSession => ({
    id: `s${day}${median}`, day, at: day, practice,
    result: { median_ms: median, response_speed: null, lapses: 0, false_starts: 0, valid: median ? 30 : 5 },
  })

  it("replaces that day's pulse value with her latest real session", () => {
    const data = applyPulse(BUILT_IN_DEMO, [session(23, 380), session(24, 390)])
    expect(data.days.find((d) => d.day === 24)?.pulse_ms).toBe(390)
    expect(evaluateDay(data, 24).indicators.pulse.color).toBe('yellow') // 2 of the last 3 above 344 ms
  })

  it('ignores practice sessions and sessions without a result', () => {
    expect(applyPulse(BUILT_IN_DEMO, [session(23, 380, true), session(24, null)])).toBe(BUILT_IN_DEMO)
  })

  it('counts practice only until 5 scored sessions, and never when a baseline exists', () => {
    const four = [1, 2, 3, 4].map((d) => session(d, 300, true))
    expect(isPractice(four, false)).toBe(true)
    expect(isPractice([...four, session(5, 300, true)], false)).toBe(false)
    expect(isPractice([], true)).toBe(false)
  })
})

describe('words the pulse screen never shows (pulse-spec.json never_show_en)', () => {
  it('are absent from the English pulse texts', () => {
    const texts = [
      ...Object.entries(DICTIONARIES.en).filter(([k]) => k.startsWith('pulse.')).map(([, v]) => v),
      PULSE_SPEC.intro_en, PULSE_SPEC.after_session_en, PULSE_SPEC.after_practice_session_en, PULSE_SPEC.after_skip_en,
    ]
    for (const word of PULSE_SPEC.never_show_en) {
      for (const t of texts) expect(new RegExp(`\\b${word}\\b`, 'i').test(t), `"${word}" in "${t}"`).toBe(false)
    }
  })
})

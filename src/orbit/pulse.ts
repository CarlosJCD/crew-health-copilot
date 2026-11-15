// Pulse mode: 3-minute PVT-B-style alertness task (Psychology 1, pulse-spec.json, unchanged).
// Numbers the engine shares come from orbit-indicators.json (pulse.params); texts and task
// details from pulse-spec.json. Our implementation copies the format; it is not a validated PVT-B.
import spec from './pulse-spec.json'
import { getIndicator, num } from './config'
import type { DemoData } from './demoData'

export const PULSE_SPEC = spec

const isi = getIndicator('pulse').params.isi_s as [number, number]
export const PULSE = {
  durationMs: num('pulse', 'duration_s') * 1000,
  isiMs: [isi[0] * 1000, isi[1] * 1000] as [number, number],
  falseStartLtMs: num('pulse', 'false_start_lt_ms'),
  lapseGteMs: num('pulse', 'lapse_gte_ms'),
  practiceSessions: num('pulse', 'practice_sessions'),
  minValid: spec.minimum_valid_responses,
  feedbackMs: spec.feedback_display_ms,
}

/** One response: a reaction time, or a tap before the counter appeared. */
export type Trial = { rtMs: number } | { early: true }

export interface PulseResult {
  /** Median of valid reaction times (lapses included); null when there are too few valid responses. */
  median_ms: number | null
  /** Mean of 1000/RT over valid responses (responses per second). */
  response_speed: number | null
  lapses: number
  false_starts: number
  valid: number
}

/** Next wait before the counter appears: uniform between the two bounds, re-drawn after every response. */
export function nextInterval(rand: () => number = Math.random): number {
  const [lo, hi] = PULSE.isiMs
  return lo + rand() * (hi - lo)
}

export function scoreSession(trials: Trial[]): PulseResult {
  const rts = trials.flatMap((t) => ('rtMs' in t ? [t.rtMs] : []))
  const valid = rts.filter((rt) => rt >= PULSE.falseStartLtMs).sort((a, b) => a - b)
  const falseStarts = trials.length - valid.length
  const lapses = valid.filter((rt) => rt >= PULSE.lapseGteMs).length
  if (valid.length < PULSE.minValid) {
    return { median_ms: null, response_speed: null, lapses, false_starts: falseStarts, valid: valid.length }
  }
  const mid = Math.floor(valid.length / 2)
  const median = valid.length % 2 ? valid[mid] : (valid[mid - 1] + valid[mid]) / 2
  const speed = valid.reduce((s, rt) => s + 1000 / rt, 0) / valid.length
  return {
    median_ms: Math.round(median),
    response_speed: Math.round(speed * 100) / 100,
    lapses,
    false_starts: falseStarts,
    valid: valid.length,
  }
}

export interface PulseSession {
  id: string
  /** Mission day it belongs to. */
  day: number
  at: number
  practice: boolean
  result: PulseResult
}

/** A session is practice while she has fewer than `practice_sessions` scored sessions and no baseline yet. */
export function isPractice(sessions: PulseSession[], hasBaseline: boolean): boolean {
  if (hasBaseline) return false
  return sessions.filter((s) => s.result.median_ms !== null).length < PULSE.practiceSessions
}

/** Her latest scored, non-practice session of a day replaces that day's pulse value. */
export function applyPulse(data: DemoData, sessions: PulseSession[]): DemoData {
  const byDay = new Map<number, number>()
  for (const s of [...sessions].sort((a, b) => a.at - b.at)) {
    if (!s.practice && s.result.median_ms !== null) byDay.set(s.day, s.result.median_ms)
  }
  if (!byDay.size) return data
  return { ...data, days: data.days.map((d) => (byDay.has(d.day) ? { ...d, pulse_ms: byDay.get(d.day)! } : d)) }
}

/** Fill "{name}" placeholders in a spec text. */
export const fill = (text: string, vars: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m))

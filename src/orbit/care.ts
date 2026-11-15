// Gamification without punishment (phase 4): the "protective factors used" tank of
// orbit-indicators.json (no color, it only fills up, positive feedback only). Points come only from
// looking after yourself, never from performance; no comparison between crew members; nothing resets.
import type { BoostLog } from './boost'
import type { Checkins } from './checkin'
import type { PulseSession } from './pulse'

/** Care actions per tank (app design, team criterion). */
export const TANK_SIZE = 10

export interface CareInput {
  checkins: Checkins
  boostLog: BoostLog
  pulseSessions: PulseSession[]
  boardsDone: number
}

export interface CareSummary {
  actions: number
  /** Days with at least one care action (it never resets). */
  days: number
  tanksFilled: number
  /** Care actions in the tank being filled now (0 to TANK_SIZE - 1). */
  level: number
  /** Boost cards she said helped ("Yes" or "A little"), most often first. */
  helped: string[]
}

export function careSummary({ checkins, boostLog, pulseSessions, boardsDone }: CareInput): CareSummary {
  const days = new Set<string>()
  let actions = 0
  for (const day of Object.keys(checkins)) {
    actions += 1
    days.add(day)
  }
  const helpedCount = new Map<string, number>()
  for (const [day, log] of Object.entries(boostLog)) {
    if (log.chosen.length) days.add(day)
    actions += log.chosen.length
    for (const [id, answer] of Object.entries(log.helped)) {
      if (answer === 'Skip') continue
      actions += 1
      if (answer === 'Yes' || answer === 'A little') helpedCount.set(id, (helpedCount.get(id) ?? 0) + 1)
    }
  }
  for (const s of pulseSessions) {
    actions += 1
    days.add(String(s.day))
  }
  actions += boardsDone
  return {
    actions,
    days: days.size,
    tanksFilled: Math.floor(actions / TANK_SIZE),
    level: actions % TANK_SIZE,
    helped: [...helpedCount].sort((a, b) => b[1] - a[1]).map(([id]) => id),
  }
}

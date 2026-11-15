import { describe, expect, it } from 'vitest'
import { careSummary, TANK_SIZE } from './care'

const empty = { checkins: {}, boostLog: {}, pulseSessions: [], boardsDone: 0 }

describe('care tank (protective factors used)', () => {
  it('starts empty', () => {
    expect(careSummary(empty)).toEqual({ actions: 0, days: 0, tanksFilled: 0, level: 0, helped: [] })
  })

  it('counts only looking-after-yourself actions, and the days they happened', () => {
    const s = careSummary({
      checkins: { 124: { mood: 5, stress: 7, fatigue: 6, crew_climate: 6 } },
      boostLog: {
        125: { chosen: ['sleep_window', 'message_home'], helped: { sleep_window: 'Yes', message_home: 'Skip' } },
        126: { chosen: ['sleep_window'], helped: { sleep_window: 'A little' } },
      },
      pulseSessions: [{ id: 'p', day: 125, at: 1, practice: false, result: { median_ms: 330, response_speed: 3, lapses: 0, false_starts: 0, valid: 40 } }],
      boardsDone: 1,
    })
    // 1 check-in + 3 chosen + 2 answers (Skip does not count) + 1 pulse session + 1 board
    expect(s.actions).toBe(8)
    expect(s.days).toBe(3)
    expect(s.helped).toEqual(['sleep_window'])
  })

  it('fills one tank every 10 actions and never empties', () => {
    const s = careSummary({ ...empty, boardsDone: TANK_SIZE + 3 })
    expect([s.tanksFilled, s.level]).toEqual([1, 3])
  })
})

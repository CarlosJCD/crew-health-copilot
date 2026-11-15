import { describe, expect, it } from 'vitest'
import { applyCheckins } from './checkin'
import { BUILT_IN_DEMO } from './demoData'
import { evaluateDay } from './engine'

describe('check-in', () => {
  it('leaves the demo data untouched when there are no check-ins', () => {
    expect(applyCheckins(BUILT_IN_DEMO, {})).toBe(BUILT_IN_DEMO)
  })

  it("replaces that day's answers so the engine uses them", () => {
    const low = applyCheckins(BUILT_IN_DEMO, { 121: { mood: 4, stress: 4, fatigue: 4, crew_climate: 7 } })
    expect(evaluateDay(BUILT_IN_DEMO, 121).indicators.checkin.color).toBe('green')
    expect(evaluateDay(low, 121).indicators.checkin.color).toBe('yellow')
  })

  it('turns the day red (psych) when she asks to talk to someone', () => {
    const talk = applyCheckins(BUILT_IN_DEMO, { 122: { mood: 7, stress: 5, fatigue: 4, crew_climate: 7, talk_to: 'psych_conference' } })
    expect(evaluateDay(talk, 122).state).toBe('RED_PSYCH')
  })
})

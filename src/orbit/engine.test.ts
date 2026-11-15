import { describe, expect, it } from 'vitest'
import { RULES_ERRORS } from './config'
import { ACCEPTANCE } from './acceptance'
import { BUILT_IN_DEMO, type DayRecord, type DemoData } from './demoData'
import { evaluateDay, pulseBaseline } from './engine'

describe('orbit-indicators.json', () => {
  it('has every rule, param and text the engine reads', () => {
    expect(RULES_ERRORS).toEqual([])
  })
})

describe('acceptance: Lena, Mars transit, days 23 to 30 (handoff section 5)', () => {
  it.each(ACCEPTANCE)('day %i is %s', (day, state, body, mind, crew, yellow) => {
    const r = evaluateDay(BUILT_IN_DEMO, day)
    expect(r.state).toBe(state)
    expect(r.domains).toEqual({ body, mind, crew })
    expect([...r.flagged].sort()).toEqual([...yellow].sort())
  })

  it('explains that 38.0 °C on day 23 is her in-flight normal, not a fever', () => {
    const r = evaluateDay(BUILT_IN_DEMO, 23).indicators.temp
    expect(r.color).toBe('green')
    expect(r.reason).toMatch(/normal for you in flight/)
  })

  it('keeps the noise days before the story green', () => {
    for (let day = 1; day <= 22; day++) expect(evaluateDay(BUILT_IN_DEMO, day).state, `day ${day}`).toBe('GREEN')
  })
})

// Rules the demo story does not exercise.
const base = BUILT_IN_DEMO.days.find((d) => d.day === 23) as DayRecord
const withDays = (...changes: Partial<DayRecord>[]): DemoData => ({
  ...BUILT_IN_DEMO,
  days: changes.map((c, i) => ({ ...base, events: [], ...c, day: 200 + i })),
})
const lastDay = (data: DemoData) => evaluateDay(data, data.days.at(-1)!.day)

describe('v0.3 rules (questions 18 and 19)', () => {
  const day = (d: number, change: Partial<DayRecord> = {}): DayRecord => ({ ...base, events: [], ...change, day: d })

  it('says how many days in a row she has been without contact (4 on day 27)', () => {
    expect(evaluateDay(BUILT_IN_DEMO, 27).indicators.contact.reason).toBe('4 days in a row without contact.')
  })

  it('one missing day does not break a run; two missing days start it again', () => {
    const short = { sleep_h: 4.8 }
    const oneGap = { ...BUILT_IN_DEMO, days: [day(200, short), day(201, short), day(203, short)] }
    const twoGap = { ...BUILT_IN_DEMO, days: [day(200, short), day(201, short), day(204, short)] }
    expect(evaluateDay(oneGap, 203).indicators.sleep.color).toBe('red')
    expect(evaluateDay(twoGap, 204).indicators.sleep.color).toBe('yellow')
  })

  it('a single yellow blood pressure reading does not count toward the early signal; two in a row do', () => {
    // Mind yellow (stress 7) on both days; Body yellow only from blood pressure.
    const mind = { stress: 7 }
    const single = { ...BUILT_IN_DEMO, days: [day(200, { ...mind, sbp: 125 }), day(201, { ...mind, sbp: 112 }), day(202, { ...mind, sbp: 125 })] }
    const repeated = { ...BUILT_IN_DEMO, days: [day(200, { ...mind, sbp: 125 }), day(201, { ...mind, sbp: 126 }), day(202, { ...mind, sbp: 125 })] }
    expect(evaluateDay(single, 202).indicators.bp.color).toBe('yellow')
    expect(evaluateDay(single, 202).state).toBe('YELLOW')
    expect(evaluateDay(repeated, 202).state).toBe('EARLY_SIGNAL')
  })
})

describe('rules outside the demo story', () => {
  it('sleep is red after 3 nights of 5 h or less', () => {
    expect(lastDay(withDays({ sleep_h: 5 }, { sleep_h: 4.8 }, { sleep_h: 5 })).indicators.sleep.color).toBe('red')
    expect(lastDay(withDays({ sleep_h: 6.5 }, { sleep_h: 4.8 }, { sleep_h: 5 })).indicators.sleep.color).toBe('yellow')
  })

  it('blood pressure needs a second high reading before red', () => {
    expect(lastDay(withDays({ sbp: 118, dbp: 75 }, { sbp: 145, dbp: 85 })).indicators.bp.color).toBe('yellow')
    const r = lastDay(withDays({ sbp: 142, dbp: 85 }, { sbp: 145, dbp: 85 }))
    expect(r.indicators.bp.color).toBe('red')
    expect(r.state).toBe('RED_PHYSICAL')
  })

  it('temperature is red only at 38 °C or more, over 0.5 °C above in-flight normal, with symptoms', () => {
    expect(lastDay(withDays({ temp: 38.6 })).indicators.temp.color).toBe('yellow')
    expect(lastDay(withDays({ temp: 38.6, symptoms: ['sore throat'] })).indicators.temp.color).toBe('red')
  })

  it('a red-flag symptom goes straight to red; others turn yellow after 2 days', () => {
    expect(lastDay(withDays({ symptoms: ['chest pain'] })).state).toBe('RED_PHYSICAL')
    const cough = { symptoms: ['cough'] }
    expect(lastDay(withDays(cough, cough)).indicators.symptoms.color).toBe('green')
    expect(lastDay(withDays(cough, cough, cough)).indicators.symptoms.color).toBe('yellow')
  })

  it('asking to talk to someone is red psych, and she chooses who', () => {
    expect(lastDay(withDays({ talk_request: true })).state).toBe('RED_PSYCH')
  })

  it('glucose follows the ADA ranges', () => {
    const color = (g: number) => lastDay(withDays({ glucose: g })).indicators.glucose.color
    expect([color(50), color(60), color(85), color(110), color(130)]).toEqual(['red', 'yellow', 'green', 'yellow', 'yellow'])
    expect(lastDay(withDays({ glucose: 130 }, { glucose: 128 })).indicators.glucose.color).toBe('red')
  })

  it('exercise is yellow under 75 % of the prescription and never red', () => {
    expect(lastDay(withDays({ exercise_min: 85 })).indicators.exercise.color).toBe('yellow')
    expect(lastDay(withDays({ exercise_min: 0 })).indicators.exercise.color).toBe('yellow')
  })

  it('the weekly check is yellow at 3 or more on either scale', () => {
    expect(lastDay(withDays({ screen: { phq2: 3, gad2: 0 } })).indicators.screen.color).toBe('yellow')
  })

  it('after two positive weekly checks in a row, ORBIT offers an earlier private conference (never red)', () => {
    const week = (phq2: number, day: number): DayRecord => ({ ...base, events: [], day, screen: { phq2, gad2: 0 } })
    const one = { ...BUILT_IN_DEMO, days: [week(1, 300), week(3, 307)] }
    const two = { ...BUILT_IN_DEMO, days: [week(3, 300), week(4, 307)] }
    expect(evaluateDay(one, 307).indicators.screen.offer).toBeUndefined()
    const r = evaluateDay(two, 307).indicators.screen
    expect([r.color, r.offer]).toEqual(['yellow', 'earlier_conference'])
  })

  it('the pulse baseline skips the 5 practice sessions', () => {
    expect(pulseBaseline([400, 380, 360, 340, 330, 320, 322])).toBeUndefined()
    const b = pulseBaseline([400, 380, 360, 340, 330, 320, 322, 318])
    expect(b?.[0]).toBeCloseTo(320)
  })
})

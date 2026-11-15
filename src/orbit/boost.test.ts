import { describe, expect, it } from 'vitest'
import { activeTriggers, boostPlan, checkBoost, downrankedCards, protectiveCount } from './boost'
import { BUILT_IN_DEMO, type DayRecord, type DemoData } from './demoData'
import { evaluateDay } from './engine'

const plan = (data: DemoData, day: number, downranked: string[] = []) => {
  const r = evaluateDay(data, day)
  const rec = data.days.find((d) => d.day === day)
  return boostPlan(r, rec, data.persona, downranked, data.days.filter((d) => d.day <= day))
}

describe('Boost files from Psychology', () => {
  it('reference only cards and questions that exist', () => {
    expect(checkBoost()).toEqual([])
  })
})

describe('Boost on the demo story', () => {
  it('day 27 (early signal) offers sleep window, message home, move and breathe, in that order', () => {
    const p = plan(BUILT_IN_DEMO, 27)
    expect(p.triggers[0]).toBe('early_signal')
    expect(p.offered.map((c) => c.id)).toEqual(['sleep_window', 'message_home', 'move', 'breathe'])
    expect(p.red).toBe(false)
  })

  it('asks the heart-rate safety question first when heart rate is yellow', () => {
    const p = plan(BUILT_IN_DEMO, 27)
    expect(p.safetyQuestion?.id).toBe('hr_red_flags')
    expect(p.safetyQuestion?.if_yes).toBe('cmo_now')
    expect(p.checkFirst.map((c) => c.id)).toEqual(['recheck_hr', 'context_check'])
  })

  it('day 25 (sleep only) offers sleep cards', () => {
    expect(plan(BUILT_IN_DEMO, 25).offered.map((c) => c.id)).toEqual(['sleep_window', 'caffeine_cutoff', 'wind_down', 'strategic_nap'])
  })

  it('a green day offers connection cards', () => {
    expect(activeTriggers(evaluateDay(BUILT_IN_DEMO, 23), undefined, BUILT_IN_DEMO.persona)).toEqual(['green'])
  })
})

describe('red states replace self-care with escalation', () => {
  const base = BUILT_IN_DEMO.days.find((d) => d.day === 23) as DayRecord
  it('a red-flag symptom shows "contact your crew medical officer now" and no self-care', () => {
    const data: DemoData = { ...BUILT_IN_DEMO, days: [{ ...base, day: 300, symptoms: ['chest pain'] }] }
    const p = plan(data, 300)
    expect(p.red).toBe(true)
    expect(p.escalate.map((c) => c.id)).toEqual(['cmo_now'])
    expect(p.offered).toEqual([])
  })

  it('asking to talk shows "talk to someone today"', () => {
    const data: DemoData = { ...BUILT_IN_DEMO, days: [{ ...base, day: 300, talk_request: true }] }
    expect(plan(data, 300).escalate.map((c) => c.id)).toEqual(['talk_now'])
  })
})

describe('Iterate and the protective tank', () => {
  it('moves a card rated "No" twice to the end', () => {
    const log = { 26: { chosen: ['sleep_window'], helped: { sleep_window: 'No' } }, 27: { chosen: ['sleep_window'], helped: { sleep_window: 'No' } } }
    expect(downrankedCards(log)).toEqual(['sleep_window'])
    expect(plan(BUILT_IN_DEMO, 27, downrankedCards(log)).offered.map((c) => c.id)[0]).toBe('message_home')
    expect(protectiveCount(log)).toBe(2)
  })
})

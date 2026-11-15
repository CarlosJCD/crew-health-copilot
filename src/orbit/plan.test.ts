import { describe, expect, it } from 'vitest'
import { boostPlan, CARDS, TRIGGERS, type BoostPlan } from './boost'
import { BUILT_IN_DEMO } from './demoData'
import { evaluateDay } from './engine'
import { CONTEXTS, type PainEvent, type PainLog } from './pain'
import { PAIN_CONTEXT_TRIGGERS, painSuggestions, remindersFor, todaySuggestions, triggerLabel } from './plan'

const event = (patch: Partial<PainEvent>): PainEvent => ({
  id: 'e',
  muscles: [],
  strokes: [],
  regions: ['lower_back'],
  qualities: [],
  intensity: 5,
  contexts: [],
  alarms: [],
  ...patch,
})
const planOf = (day: number): BoostPlan => {
  const data = BUILT_IN_DEMO
  const record = data.days.find((d) => d.day === day)
  return boostPlan(evaluateDay(data, day), record, data.persona, [], data.days.filter((d) => d.day < day))
}
const empty: BoostPlan = { triggers: [], red: false, checkFirst: [], escalate: [], offered: [] }

describe('suggestions when she logs a pain', () => {
  it('only maps contexts of the spec to triggers of the Boost library', () => {
    for (const [context, trigger] of Object.entries(PAIN_CONTEXT_TRIGGERS)) {
      expect(CONTEXTS.some((c) => c.id === context), context).toBe(true)
      expect(TRIGGERS.some((t) => t.trigger === trigger), trigger).toBe(true)
    }
  })

  it('suggests the self-care of the matching trigger, never an invented treatment', () => {
    const cards = painSuggestions(event({ contexts: ['stress'] })).map((c) => c.id)
    expect(cards.length).toBeGreaterThan(0)
    expect(cards).toContain('breathe')
    for (const id of cards) expect(TRIGGERS.find((t) => t.trigger === 'checkin.stress_yellow')!.offered_cards).toContain(id)
  })

  it('suggests nothing when no context matches, and the medical officer when she confirmed an alarm sign', () => {
    expect(painSuggestions(event({ contexts: ['impact'] }))).toEqual([])
    expect(painSuggestions(event({ regions: ['chest'], alarms: ['chest pain'], contexts: ['stress'] })).map((c) => c.id)).toEqual(['cmo_now'])
  })
})

describe('self-care for today, next to the body', () => {
  it("starts from Boost's plan for the day, with the trigger that offers each card", () => {
    const s = todaySuggestions(planOf(27), 27, {})
    expect(s.red).toBe(false)
    expect(s.items.length).toBeGreaterThan(0)
    expect(s.items.length).toBeLessThanOrEqual(4)
    expect(s.items[0].because.some((b) => b.kind === 'trigger')).toBe(true)
  })

  it('adds the cards of a recent pain report, with the pain as the reason', () => {
    const log: PainLog = { 26: { events: [event({ contexts: ['short_sleep'] })] } }
    const s = todaySuggestions(empty, 27, log)
    expect(s.items.map((i) => i.card.id)).toContain('sleep_window')
    expect(s.items.find((i) => i.card.id === 'sleep_window')!.because).toMatchObject([{ kind: 'pain', day: 26 }])
    expect(todaySuggestions(empty, 30, log).items).toEqual([]) // more than 2 days ago
  })

  it('shows only the medical officer on a red day or after a confirmed alarm sign today', () => {
    const log: PainLog = { 27: { events: [event({ regions: ['chest'], alarms: ['chest pain'] })] } }
    const s = todaySuggestions(planOf(27), 27, log)
    expect(s).toMatchObject({ red: true })
    expect(s.items.map((i) => i.card.id)).toEqual(['cmo_now'])
  })

  it('names triggers in plain words', () => {
    expect(triggerLabel('sleep.yellow')).toMatch(/^Sleep.*: yellow$/)
    expect(triggerLabel('checkin.stress_yellow')).toMatch(/: stress yellow$/)
    expect(triggerLabel('early_signal').length).toBeGreaterThan(0)
  })
})

describe('reminders', () => {
  const base = { day: 27, checkins: {}, pulseSessions: [], boostLog: {}, painLog: {}, plan: empty }

  it('reminds the daily check-in and pulse mode until she does them', () => {
    expect(remindersFor(base).map((r) => r.id)).toEqual(['checkin', 'pulse'])
    const done = remindersFor({
      ...base,
      checkins: { 27: { mood: 7, stress: 4, fatigue: 4, crew_climate: 7 } },
      pulseSessions: [{ id: 'p', day: 26, at: 0, practice: false, result: {} as never }],
    })
    expect(done.map((r) => r.id)).toEqual([])
  })

  it("asks whether yesterday's choices helped, and for the safety question first", () => {
    const r = remindersFor({ ...base, plan: { ...empty, safetyQuestion: { id: 'q', text_en: '', if_yes: '', sources: [] } }, boostLog: { 26: { chosen: ['breathe'], helped: {} } } })
    expect(r.map((x) => x.id)).toEqual(['safety', 'checkin', 'pulse', 'did_it_help'])
  })

  it('reminds a pain from the last 2 days that she has not logged again today', () => {
    const painLog: PainLog = { 25: { events: [event({})] } }
    expect(remindersFor({ ...base, painLog }).some((r) => r.id === 'pain_again')).toBe(true)
    const again: PainLog = { ...painLog, 27: { events: [event({ id: 'today' })] } }
    expect(remindersFor({ ...base, painLog: again }).some((r) => r.id === 'pain_again')).toBe(false)
    expect(CARDS.cmo_now).toBeDefined()
  })
})

describe('when everything is fine', () => {
  it('suggests nothing on a green day (Psychology 1, Nov 15)', () => {
    const plan = planOf(23)
    expect(plan.triggers).toEqual(['green'])
    expect(todaySuggestions(plan, 23, {}).items).toEqual([])
  })

  it('still suggests the cards of a pain she logged on a green day', () => {
    const log: PainLog = { 23: { events: [event({ contexts: ['stress'] })] } }
    expect(todaySuggestions(planOf(23), 23, log).items.map((i) => i.card.id)).toContain('breathe')
  })
})

describe('pulse reminder', () => {
  it('clears with a practice session too, since she did the task', () => {
    const r = remindersFor({ day: 27, checkins: {}, boostLog: {}, painLog: {}, plan: empty, pulseSessions: [{ id: 'p', day: 27, at: 0, practice: true, result: {} as never }] })
    expect(r.some((x) => x.id === 'pulse')).toBe(false)
  })
})

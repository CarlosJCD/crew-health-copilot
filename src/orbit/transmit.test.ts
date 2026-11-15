import { describe, expect, it } from 'vitest'
import { SCENARIOS } from './config'
import { BUILT_IN_DEMO, type DayRecord, type DemoData } from './demoData'
import { evaluateDay } from './engine'
import { cmoShare, DEFAULT_SHARE, earliestReply, escalationPacket, queuePacket, sharedDomains, weeklySummary } from './transmit'

const mars = SCENARIOS.find((s) => s.id === 'mars_transit')!
const iss = SCENARIOS.find((s) => s.id === 'iss')!

describe('privacy', () => {
  it('shares only Body by default; Mind and Crew only if she switches them on', () => {
    expect(sharedDomains(DEFAULT_SHARE)).toEqual(['body'])
    expect(sharedDomains({ mind: true, crew: false })).toEqual(['body', 'mind'])
  })

  it('leaves Mind and Crew out of the crew medical officer packet unless shared', () => {
    const day27 = evaluateDay(BUILT_IN_DEMO, 27)
    const closed = cmoShare(day27, DEFAULT_SHARE).lines.join('\n')
    expect(closed).toMatch(/Body: yellow \(Sleep, Resting heart rate\)/)
    expect(closed).not.toMatch(/^Mind:/m)
    expect(closed).toMatch(/Not shared, by choice: Mind, Crew/)
    expect(cmoShare(day27, { mind: true, crew: true }).lines.join('\n')).toMatch(/Mind: yellow/)
  })
})

describe('weekly summary (day 30)', () => {
  it('reports one early signal, resolved onboard', () => {
    const lines = weeklySummary(BUILT_IN_DEMO, 30, DEFAULT_SHARE).lines.join('\n')
    expect(lines).toMatch(/Early cross-domain signals: 1 \(day 27, resolved onboard\)/)
    expect(lines).toMatch(/Red days: 0/)
  })
})

describe('escalation packet', () => {
  it('exists only for a red physical safety rail', () => {
    expect(escalationPacket(evaluateDay(BUILT_IN_DEMO, 27))).toBeUndefined()
    const base = BUILT_IN_DEMO.days.find((d) => d.day === 23) as DayRecord
    const data: DemoData = { ...BUILT_IN_DEMO, days: [{ ...base, day: 300, sbp: 145 }, { ...base, day: 301, sbp: 146 }] }
    const p = escalationPacket(evaluateDay(data, 301))
    expect(p?.to).toBe('flight_surgeons')
    expect(p?.lines[0]).toMatch(/Blood pressure: 146\/73 mmHg, confirmed/)
  })
})

describe('delay', () => {
  const draft = weeklySummary(BUILT_IN_DEMO, 30, DEFAULT_SHARE)
  it('takes the one-way delay to Earth (12 min in Mars transit), sped up in demo mode', () => {
    expect(queuePacket(draft, mars, 0).arrivesAt).toBe(720_000)
    expect(queuePacket(draft, mars, 0, 60).arrivesAt).toBe(12_000)
    expect(earliestReply(queuePacket(draft, mars, 0), mars)).toBe(1_440_000)
  })

  it('arrives at once onboard, and near real time at the station', () => {
    expect(queuePacket(cmoShare(evaluateDay(BUILT_IN_DEMO, 27), DEFAULT_SHARE), mars, 0).arrivesAt).toBe(0)
    expect(queuePacket(draft, iss, 0).arrivesAt).toBe(0)
  })
})

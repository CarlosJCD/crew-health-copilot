import { describe, expect, it } from 'vitest'
import type { IndicatorDef, Measurement } from '../data/types'
import { getIndicator } from '../data/indicators'
import { computeBaseline, evaluateDay, worst } from './status'

// Uses the real catalog settings (knowledge.json). If the data team changes a cut-off used
// here, update the numbers in the test to match.

const rows = (values: number[], startDay = -values.length): Measurement[] =>
  values.map((value, i) => ({
    astronautId: 'a',
    day: startDay + i,
    indicatorId: 'x',
    value,
    unit: 'u',
    source: 'synthetic',
  }))

const get = (id: string) => getIndicator(id) as IndicatorDef
const sleep = get('sleep')
const hr = get('hr')
const sbp = get('sbp')
const temp = get('temp')
const bodyMass = get('body_mass')

describe('computeBaseline', () => {
  it('needs at least 3 pre-flight days', () => {
    expect(computeBaseline(rows([7, 7]))).toBeUndefined()
  })

  it('uses only pre-flight days (day < 0) with the sample SD', () => {
    expect(computeBaseline([...rows([6, 7, 8]), ...rows([100], 0)])).toEqual({ mean: 7, sd: 1, n: 3 })
  })

  it('never lets the SD fall below the catalog floor', () => {
    expect(computeBaseline(rows([7, 7, 7]), 0.5)?.sd).toBe(0.5)
  })
})

describe('evaluateDay', () => {
  it('returns no-data when there is no reading that day', () => {
    expect(evaluateDay(sleep, rows([7, 7, 7]), 0).status).toBe('no-data')
  })

  it('applies categories with min included and max excluded', () => {
    // Systolic: < 120 normal, 120 to < 130 elevated (watch), > 180 severe (act, 1 reading).
    expect(evaluateDay(sbp, rows([119.9], 0), 0).status).toBe('nominal')
    expect(evaluateDay(sbp, rows([120], 0), 0).category?.label.en).toBe('Elevated blood pressure')
    expect(evaluateDay(sbp, rows([118, 185], 0), 1).status).toBe('act')
  })

  it('waits for the readings a category asks for before alerting', () => {
    // "Elevated" needs 2 readings: one high reading after a normal one does not count yet.
    expect(evaluateDay(sbp, rows([118, 125], 0), 1).status).toBe('nominal')
    expect(evaluateDay(sbp, rows([125, 125], 0), 1).status).toBe('watch')
  })

  it('averages the last readings when the catalog says so (sleep: 3 nights)', () => {
    const ev = evaluateDay(sleep, rows([7.5, 7.5, 4.5], 0), 2)
    expect(ev.observed).toBeCloseTo(6.5)
    expect(ev.status).toBe('watch') // the 3-night average is 6.5 h, not a single 4.5 h night
  })

  it('compares in-flight readings with the expected in-flight change', () => {
    // Systolic is expected to drop about 8 mmHg in flight (Norsk 2015, catalog CAR-08).
    const ev = evaluateDay(sbp, [...rows([116, 116, 116]), ...rows([108, 108], 0)], 1)
    expect(ev.expected).toBe(108)
    expect(ev.z).toBe(0)
    expect(ev.status).toBe('nominal')
  })

  it('ignores changes in the harmless direction', () => {
    // Temperature only worries when it goes up.
    expect(evaluateDay(temp, [...rows([36.5, 36.6, 36.7]), ...rows([35.9], 0)], 0).status).toBe('nominal')
    expect(evaluateDay(temp, [...rows([36.5, 36.6, 36.7]), ...rows([37.2], 0)], 0).status).toBe('act')
  })

  it('needs consecutive readings for the personal rule when the catalog asks for them', () => {
    // Resting heart rate: confirm 2. A one-day spike is not an alert; two days in a row are.
    const pre = rows([58, 58, 58])
    expect(evaluateDay(hr, [...pre, ...rows([70], 0)], 0).status).toBe('nominal')
    expect(evaluateDay(hr, [...pre, ...rows([70, 70], 0)], 1).status).toBe('act')
  })

  it('uses % change from pre-flight when the catalog says so (body mass)', () => {
    const data = [...rows([70, 70, 70]), ...rows([66, 66], 0)]
    const ev = evaluateDay(bodyMass, data, 1)
    expect(ev.changePct).toBeCloseTo(-5.71, 1)
    expect(ev.category?.label.en).toBe('Loss larger than the typical range')
    expect(ev.status).toBe('act')
  })
})

describe('worst', () => {
  it('orders act > watch > nominal > no-data', () => {
    expect(worst('watch', 'act')).toBe('act')
    expect(worst('nominal', 'no-data')).toBe('nominal')
  })
})

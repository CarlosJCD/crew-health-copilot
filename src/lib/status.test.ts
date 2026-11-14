import { describe, expect, it } from 'vitest'
import type { IndicatorDef, Measurement } from '../data/types'
import { getIndicator } from '../data/indicators'
import { computeBaseline, evaluate, worst } from './status'

const rows = (values: number[], startDay = -values.length): Measurement[] =>
  values.map((value, i) => ({
    astronautId: 'a',
    day: startDay + i,
    indicatorId: 'x',
    value,
    unit: 'u',
    source: 'synthetic',
  }))

const sleep = getIndicator('sleep') as IndicatorDef
const hr = getIndicator('hr') as IndicatorDef

describe('computeBaseline', () => {
  it('needs at least 3 pre-flight days', () => {
    expect(computeBaseline(rows([7, 7]))).toBeUndefined()
  })

  it('uses only pre-flight days (day < 0) with the sample SD', () => {
    const b = computeBaseline([...rows([6, 7, 8]), ...rows([100], 0)])
    expect(b).toEqual({ mean: 7, sd: 1, n: 3 })
  })
})

describe('evaluate', () => {
  it('returns no-data without a value', () => {
    expect(evaluate(sleep, undefined)).toBe('no-data')
  })

  it('applies absolute bands on a single day (sleep < 6 h watch, < 5 h act)', () => {
    expect(evaluate(sleep, 6.5)).toBe('nominal')
    expect(evaluate(sleep, 5.5)).toBe('watch')
    expect(evaluate(sleep, 4.9)).toBe('act')
  })

  it('ignores changes in the harmless direction', () => {
    const baseline = { mean: 60, sd: 2, n: 7 }
    // Heart rate only worries when it goes up.
    expect(evaluate(hr, 50, baseline, 50)).toBe('nominal')
    expect(evaluate(hr, 64, baseline, 64)).toBe('watch')
    expect(evaluate(hr, 66, baseline, 66)).toBe('act')
  })

  it('needs two consecutive off-baseline days for the personal rule', () => {
    const baseline = { mean: 60, sd: 2, n: 7 }
    expect(evaluate(hr, 66, baseline, 60)).toBe('nominal') // one-day spike
    expect(evaluate(hr, 66, baseline, 64)).toBe('watch') // yesterday watch, today act -> watch
    expect(evaluate(hr, 66, baseline)).toBe('act') // no previous day: single-day rule
  })

  it('takes the worse of absolute and personal rules', () => {
    const baseline = { mean: 7, sd: 0.3, n: 7 }
    expect(evaluate(sleep, 6.2, baseline, 6.2)).toBe('act') // 2.7 SD below normal
    expect(evaluate(sleep, 5.8, { mean: 6, sd: 1, n: 7 }, 5.8)).toBe('watch') // band only
  })
})

describe('worst', () => {
  it('orders act > watch > nominal > no-data', () => {
    expect(worst('watch', 'act')).toBe('act')
    expect(worst('nominal', 'no-data')).toBe('nominal')
  })
})

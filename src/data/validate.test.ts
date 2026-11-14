import { describe, expect, it } from 'vitest'
import { dayRange, validateMeasurements } from './validate'

const good = { astronautId: 'a1', day: -1, indicatorId: 'sleep', value: 7.1, unit: 'h', source: 'synthetic' }

describe('validateMeasurements', () => {
  it('accepts rows that follow the contract', () => {
    const r = validateMeasurements([good, { ...good, day: 0 }])
    expect(r.rows).toHaveLength(2)
    expect(r.errors).toEqual([])
  })

  it('rejects a non-array file', () => {
    expect(validateMeasurements({ rows: [] }).errors[0]).toMatch(/JSON array/)
  })

  it('drops bad rows, keeps good ones and explains why', () => {
    const r = validateMeasurements([
      good,
      { ...good, day: 1.5 },
      { ...good, day: 2, indicatorId: 'steps' },
      { ...good, day: 3, value: 'high' },
      { ...good, day: 4, unit: 'hours' },
      { ...good, day: 5, source: 'guess' },
      { ...good }, // duplicate of the first row
    ])
    expect(r.rows).toHaveLength(1)
    expect(r.rejected).toBe(6)
    expect(r.errors.join('\n')).toMatch(/integer/)
    expect(r.errors.join('\n')).toMatch(/unknown "indicatorId"/)
    expect(r.errors.join('\n')).toMatch(/finite number/)
    expect(r.errors.join('\n')).toMatch(/must be "h"/)
    expect(r.errors.join('\n')).toMatch(/"source"/)
    expect(r.errors.join('\n')).toMatch(/duplicate/)
  })

  it('caps the error list and adds a summary line', () => {
    const bad = Array.from({ length: 30 }, (_, i) => ({ ...good, day: i, value: null }))
    const r = validateMeasurements(bad)
    expect(r.rejected).toBe(30)
    expect(r.errors).toHaveLength(21)
    expect(r.errors.at(-1)).toMatch(/10 more/)
  })
})

describe('dayRange', () => {
  it('returns first and last day, or undefined when empty', () => {
    expect(dayRange([])).toBeUndefined()
    const { rows } = validateMeasurements([good, { ...good, day: 9 }, { ...good, day: -7 }])
    expect(dayRange(rows)).toEqual({ first: -7, last: 9 })
  })
})

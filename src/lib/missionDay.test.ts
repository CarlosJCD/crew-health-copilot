import { describe, expect, it } from 'vitest'
import { missionDayCode } from './missionDay'

describe('missionDayCode', () => {
  it('counts down to launch with a minus sign', () => {
    expect(missionDayCode(-7)).toBe('L−7')
  })
  it('numbers mission days from launch day, padded on request', () => {
    expect(missionDayCode(0)).toBe('MD 0')
    expect(missionDayCode(14)).toBe('MD 14')
    expect(missionDayCode(14, true)).toBe('MD 014')
  })
})

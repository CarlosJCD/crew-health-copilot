import { describe, expect, it } from 'vitest'
import { BUILT_IN_DEMO, STORY_DAYS } from '../orbit/demoData'
import { evaluateDay } from '../orbit/engine'
import { ORBIT_STEPS, orbitStep } from './orbit'

describe('orbitStep', () => {
  it('spells ORBIT in order', () => {
    expect(ORBIT_STEPS.map((s) => s[0].toUpperCase()).join('')).toBe('ORBIT')
  })

  it('maps every engine state onto the loop', () => {
    expect(orbitStep('GREEN')).toBe('observe')
    expect(orbitStep('YELLOW')).toBe('boost')
    expect(orbitStep('EARLY_SIGNAL')).toBe('boost')
    expect(orbitStep('RED_PHYSICAL')).toBe('transmit')
    expect(orbitStep('RED_PSYCH')).toBe('transmit')
  })

  it('never highlights Read or Iterate on its own across the demo story', () => {
    for (let day = STORY_DAYS.first; day <= STORY_DAYS.last; day++) {
      expect(['observe', 'boost', 'transmit']).toContain(orbitStep(evaluateDay(BUILT_IN_DEMO, day).state))
    }
  })
})

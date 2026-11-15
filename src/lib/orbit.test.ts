import { describe, expect, it } from 'vitest'
import { ORBIT_STEPS, orbitStep } from './orbit'

describe('orbitStep', () => {
  it('spells ORBIT in order', () => {
    expect(ORBIT_STEPS.map((s) => s[0].toUpperCase()).join('')).toBe('ORBIT')
  })
  it('follows the escalation mapping: Act → Transmit, Watch → Boost, otherwise Observe', () => {
    expect(orbitStep('act')).toBe('transmit')
    expect(orbitStep('watch')).toBe('boost')
    expect(orbitStep('nominal')).toBe('observe')
    expect(orbitStep('no-data')).toBe('observe')
  })
})

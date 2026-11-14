import { describe, expect, it } from 'vitest'
import { SCENARIOS } from '../data/scenarios'
import { escalationPlan, overallStatus } from './escalation'

const iss = SCENARIOS.find((s) => s.id === 'iss')!
const mars = SCENARIOS.find((s) => s.id === 'mars-transit')!

describe('overallStatus', () => {
  it('is the worst status, or no-data for an empty list', () => {
    expect(overallStatus([])).toBe('no-data')
    expect(overallStatus(['nominal', 'watch', 'nominal'])).toBe('watch')
    expect(overallStatus(['watch', 'act'])).toBe('act')
  })
})

describe('escalationPlan', () => {
  it('recommends nothing when all is nominal', () => {
    const p = escalationPlan(['nominal', 'nominal'], iss)
    expect(p.recommended).toBeUndefined()
    expect(p.notifyGround).toBe(false)
  })

  it('maps watch to self-care and act to the Crew Medical Officer plus ground', () => {
    expect(escalationPlan(['watch'], iss).recommended).toBe('self-care')
    const act = escalationPlan(['watch', 'act'], iss)
    expect(act.recommended).toBe('crew-medical-officer')
    expect(act.notifyGround).toBe(true)
  })

  it('queues ground contact when the round trip is long', () => {
    expect(escalationPlan(['act'], iss).groundMode).toBe('live')
    const p = escalationPlan(['act'], mars)
    expect(p.groundMode).toBe('queued')
    expect(p.roundTripMin).toBe(mars.worstRoundTripMin)
  })
})

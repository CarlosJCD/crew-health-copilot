import type { OrbitState } from '../orbit/engine'

// ORBIT is the daily loop the app is named after: Observe, Read, Boost, Iterate, Transmit.
// The engine's states map onto it (escalation texts in orbit-indicators.json):
//   GREEN → Observe (keep logging); YELLOW and EARLY_SIGNAL → Boost (self-care, then Iterate in 24 h);
//   RED_PHYSICAL and RED_PSYCH → Transmit (a person is told, or the astronaut chooses who to talk to).
// Read is the act of looking at Today itself, so it is never the highlighted step.

export const ORBIT_STEPS = ['observe', 'read', 'boost', 'iterate', 'transmit'] as const
export type OrbitStep = (typeof ORBIT_STEPS)[number]

const STEP: Record<OrbitState, OrbitStep> = {
  GREEN: 'observe',
  YELLOW: 'boost',
  EARLY_SIGNAL: 'boost',
  RED_PHYSICAL: 'transmit',
  RED_PSYCH: 'transmit',
}

/** Step to highlight today, from the ORBIT state of the day. */
export const orbitStep = (state: OrbitState): OrbitStep => STEP[state]

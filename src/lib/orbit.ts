import type { Status } from '../data/types'

// ORBIT is the daily loop the app is named after: Observe, Read, Boost, Iterate, Transmit.
// The escalation ladder maps onto it: self-care = Boost (then Iterate: re-measure tomorrow);
// Crew Medical Officer and the ground = Transmit. Read is the act of looking at Today itself.

export const ORBIT_STEPS = ['observe', 'read', 'boost', 'iterate', 'transmit'] as const
export type OrbitStep = (typeof ORBIT_STEPS)[number]

/** Step to highlight today, from the overall status of all indicators. */
export function orbitStep(overall: Status): OrbitStep {
  if (overall === 'act') return 'transmit'
  if (overall === 'watch') return 'boost'
  return 'observe' // all nominal, or nothing measured yet
}

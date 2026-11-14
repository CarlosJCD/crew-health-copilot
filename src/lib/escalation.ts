import type { Scenario, Status } from '../data/types'
import { worst } from './status'

// Escalation ladder from the team brief: self-care -> Crew Medical Officer -> flight surgeons,
// adapted to the communication delay of the mission.
// ASSUMPTION (pending the Phase 2 model): Watch -> self-care, Act -> Crew Medical Officer and
// notify the ground. Change the mapping here only; the UI reads it from `escalationPlan`.

export type Step = 'self-care' | 'crew-medical-officer'

/** Round trips at or above this many minutes count as "delayed": act on board first, queue for the ground. */
export const DELAYED_ROUND_TRIP_MIN = 5

export interface EscalationPlan {
  overall: Status
  /** Step to highlight now; undefined when everything is nominal or there is no data. */
  recommended?: Step
  /** Whether the ground should be informed now. */
  notifyGround: boolean
  /** 'live' = talk in near real time; 'queued' = send a summary and expect a late reply. */
  groundMode: 'live' | 'queued'
  roundTripMin: number
}

export function overallStatus(statuses: Status[]): Status {
  return statuses.reduce<Status>((acc, s) => worst(acc, s), 'no-data')
}

export function escalationPlan(statuses: Status[], scenario: Scenario): EscalationPlan {
  const overall = overallStatus(statuses)
  const recommended: Step | undefined =
    overall === 'act' ? 'crew-medical-officer' : overall === 'watch' ? 'self-care' : undefined
  return {
    overall,
    recommended,
    notifyGround: overall === 'act',
    groundMode: scenario.worstRoundTripMin >= DELAYED_ROUND_TRIP_MIN ? 'queued' : 'live',
    roundTripMin: scenario.worstRoundTripMin,
  }
}

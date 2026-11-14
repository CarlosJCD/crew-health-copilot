import type { Scenario } from './types'

// Delay figures are placeholders until the science team verifies them (Phase 2/3).
const pending = { label: 'Pending verification (science team)', verified: false }

export const SCENARIOS: Scenario[] = [
  {
    id: 'iss',
    name: 'Space station (low Earth orbit)',
    short: 'LEO station',
    oneWayDelay: 'under 1 s',
    worstRoundTripMin: 0,
    notes: 'Near real-time contact with the ground, with periodic loss-of-signal windows.',
    delaySource: pending,
  },
  {
    id: 'lunar',
    name: 'Lunar orbit',
    short: 'Lunar orbit',
    oneWayDelay: 'about 1.3 s',
    worstRoundTripMin: 0.05,
    notes: 'Short delay; voice works, but the far side of the Moon blocks direct contact.',
    delaySource: pending,
  },
  {
    id: 'mars-transit',
    name: 'Mars transit',
    short: 'Mars transit',
    oneWayDelay: 'about 3 to 22 min',
    worstRoundTripMin: 44,
    notes: 'No live conversation with the ground. The crew must act first and confirm later.',
    delaySource: pending,
  },
  {
    id: 'mars-base',
    name: 'Planetary base (Mars surface)',
    short: 'Mars base',
    oneWayDelay: 'about 3 to 22 min, with conjunction blackouts',
    worstRoundTripMin: 44,
    notes: 'Highest autonomy: weeks without contact are possible during solar conjunction.',
    delaySource: pending,
  },
]

export const DEFAULT_SCENARIO_ID = 'mars-transit'

// Shared data contracts. The data-science teammate's synthetic JSON must match `Measurement`.

export type Domain = 'biological' | 'cognitive-emotional' | 'social' | 'protective'

/** One of the five NASA Human Research Program hazards (https://www.nasa.gov/hrp/hazards/). */
export type Hazard = 'radiation' | 'isolation' | 'distance' | 'gravity' | 'environment'

export type Status = 'nominal' | 'watch' | 'act' | 'no-data'

/** Where a number in the app comes from. `verified: false` is shown in the UI as "source pending". */
export interface SourceRef {
  label: string
  url?: string
  verified: boolean
}

/**
 * Alert bands. A value below `actBelow` or above `actAbove` is "act" (red);
 * below `watchBelow` or above `watchAbove` is "watch" (amber); otherwise "nominal".
 */
export interface Bands {
  watchBelow?: number
  actBelow?: number
  watchAbove?: number
  actAbove?: number
}

export interface IndicatorDef {
  id: string
  label: string
  unit: string
  domain: Domain
  hazards: Hazard[]
  /** How it is measured in space: device, self-report or task. */
  method: string
  /** Two-line explanation for the astronaut. */
  explainer: string
  /** Absolute bands (population or operational). Optional when only the personal baseline is used. */
  bands?: Bands
  bandsSource: SourceRef
  /** Deviation from personal pre-flight baseline, in SDs, that triggers watch / act. */
  baselineSd?: { watch: number; act: number }
  /** Which direction of change from baseline is a concern. Default 'both'. */
  worseWhen?: 'low' | 'high' | 'both'
  decimals?: number
}

/** Row format of the synthetic dataset (one value per astronaut, mission day and indicator). */
export interface Measurement {
  astronautId: string
  /** Mission day. Negative = pre-flight baseline, 0 = launch. */
  day: number
  indicatorId: string
  value: number
  unit: string
  source: 'device' | 'self-report' | 'task' | 'synthetic'
}

export interface Scenario {
  id: string
  name: string
  short: string
  /** One-way signal delay to Earth, human readable. */
  oneWayDelay: string
  /** Worst-case round trip in minutes, used to tell the crew how long a ground answer may take. */
  worstRoundTripMin: number
  notes: string
  delaySource: SourceRef
}

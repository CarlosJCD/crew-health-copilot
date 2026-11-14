// Shared data contracts. The data-science teammate's synthetic JSON must match `Measurement`;
// indicator settings and thresholds come from their catalog (knowledge.json, see knowledge.ts).
// Human-readable text is `Localized` ({ en, es }); ids, units and numbers are language-neutral.
import type { Localized } from '../i18n/strings'

export type Domain = 'biological' | 'cognitive-emotional' | 'social' | 'protective'

/** One of the five NASA Human Research Program hazards (https://www.nasa.gov/hrp/hazards/). */
export type Hazard = 'radiation' | 'isolation' | 'distance' | 'gravity' | 'environment'

export type Status = 'nominal' | 'watch' | 'act' | 'no-data'

/** Where a number in the app comes from. `verified: false` is shown in the UI as "source pending". */
export interface SourceRef {
  label: Localized
  url?: string
  verified: boolean
}

/**
 * A reference category from the data team's catalog, e.g. "Stage 1 hypertension" for systolic
 * 130 to <140 mmHg. `min` is inclusive and `max` exclusive; a missing bound means open-ended.
 */
export interface Category {
  status: Exclude<Status, 'no-data'>
  min?: number
  max?: number
  /** Consecutive readings in this category (or worse) before it counts. */
  confirmN: number
  label: Localized
  source: SourceRef
  /** Short quote from the source that backs the cut-off. */
  quote?: string
}

export interface IndicatorDef {
  id: string
  label: Localized
  unit: string
  domain: Domain
  hazards: Hazard[]
  /** How it is measured in space: device, self-report or task. */
  method: Localized
  /** Two-line explanation for the astronaut. */
  explainer: Localized
  /** Reference categories. Empty = only the personal baseline is used. */
  categories: Category[]
  /** Sources behind the indicator (typical in-flight values, method). */
  sources: SourceRef[]
  /** Deviation from the personal pre-flight baseline, in SDs, that triggers watch / act. */
  baselineSd: { watch: number; act: number }
  /** Which direction of change from baseline is a concern. */
  worseWhen: 'low' | 'high' | 'both'
  /** Minimum SD for the personal baseline, so a very steady pre-flight week does not cause false alarms. */
  sdFloor: number
  /** Rules look at the average of the last N readings. */
  smoothN: number
  /** Consecutive readings needed to confirm a personal-baseline alert. */
  confirmN: number
  /** Expected in-flight change vs. pre-flight (e.g. -8 mmHg systolic). Applied to the baseline from launch day. */
  inflightShift: number
  /** 'changePct' = categories apply to the % change vs. the pre-flight baseline (body mass). */
  evaluateOn: 'value' | 'changePct'
  /** Values outside this range are rejected as data errors. */
  plausible: { min: number; max: number }
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
  name: Localized
  short: Localized
  /** One-way signal delay to Earth, human readable. */
  oneWayDelay: Localized
  /** Worst-case round trip in minutes, used to tell the crew how long a ground answer may take. */
  worstRoundTripMin: number
  notes: Localized
  delaySource: SourceRef
}

// ORBIT's single source of rules, sources and texts: orbit-indicators.json (from Psychology 1 and 2,
// copied unchanged). Nobody changes thresholds outside that file; P1 approves changes.
// Replace the JSON to update rules or texts, then run `npm test`: RULES_ERRORS lists anything the
// engine can no longer read.
import raw from './orbit-indicators.json'
import scenariosRaw from './scenarios.json'

export type Color = 'green' | 'yellow' | 'red' | 'none'
export type DomainId = 'body' | 'mind' | 'crew'
export const DOMAIN_IDS: DomainId[] = ['body', 'mind', 'crew']

export interface OrbitSource {
  cite: string
  url?: string
}

export interface OrbitIndicator {
  id: string
  label_en: string
  domain: string
  unit: string
  input: string
  frequency: string
  params: Record<string, unknown>
  /** Names of params that are team design choices, pending validation. */
  team_criterion: string[]
  rule_en: string
  action_en: string
  hrp_risk: string
  hrp_url: string
  sources: OrbitSource[]
  why_en: string
}

export type EscalationKey = 'green' | 'yellow' | 'early_signal' | 'red_physical' | 'red_psych'

export interface OrbitRules {
  version: string
  disclaimer_en: string
  domains: Record<DomainId, string[]>
  convergence: { min_yellow_domains: number; consecutive_days: number; label_en: string; team_criterion: boolean }
  /** "In a row" = consecutive records, with at most this many days without data between them (v0.3, question 19). */
  consecutive_rule?: { counts: string; max_gap_days_without_data: number; text_en: string }
  escalation: Record<EscalationKey, { en: string; to: string; offer_share_with?: string; ground_packet?: boolean }>
  indicators: OrbitIndicator[]
}

export interface Scenario {
  id: string
  label_en: string
  one_way_delay_s: number
  /** Estimated mission dose; null = not verified for this scenario ("not shown"). */
  dose_mSv_day: number | null
  first_responder: string
  ground_contact: string
}

export const RULES = raw as unknown as OrbitRules
export const SCENARIOS = scenariosRaw as Scenario[]
export const DEFAULT_SCENARIO_ID = 'mars_transit'

/** Params the engine reads, per indicator. Kept here so a renamed field fails a test, not the demo. */
export const REQUIRED_PARAMS: Record<string, string[]> = {
  sleep: ['population_min_h', 'yellow_below_baseline_gt_h', 'red_lte_h', 'red_consecutive_nights'],
  checkin: ['yellow_worse_than_baseline_points', 'items', 'worse_direction'],
  crew_climate: ['yellow_worse_than_baseline_points'],
  screen: ['yellow_gte', 'offer_conference_if_weeks_gte'],
  pulse: [
    'practice_sessions', 'yellow_sd_above_baseline', 'yellow_sessions_needed', 'yellow_window_sessions',
    'duration_s', 'isi_s', 'false_start_lt_ms', 'lapse_gte_ms',
  ],
  bp: ['green_sys_lt', 'green_dia_lt', 'red_sys_gte', 'red_dia_gte', 'red_needs_confirmation', 'convergence_requires_consecutive_readings'],
  hr: ['yellow_above_baseline_bpm', 'red_gt', 'red_low_lt_with_symptoms'],
  temp: ['yellow_above_inflight_baseline_gt', 'red_gte', 'red_above_inflight_baseline_gt', 'red_requires_symptoms'],
  glucose: ['green_min', 'green_max', 'yellow_low_min', 'red_high_gte', 'red_high_occasions', 'red_low_lt'],
  exercise: ['prescription_min_iss', 'yellow_below_fraction'],
  contact: ['yellow_days_without_contact', 'yellow_drop_fraction_vs_14d'],
  symptoms: ['yellow_duration_days_gt', 'red_flags'],
}

export function getIndicator(id: string): OrbitIndicator {
  const found = RULES.indicators.find((i) => i.id === id)
  if (!found) throw new Error(`orbit-indicators.json has no indicator "${id}"`)
  return found
}

/** Numeric param of an indicator. */
export function num(id: string, key: string): number {
  const v = getIndicator(id).params[key]
  if (typeof v !== 'number') throw new Error(`orbit-indicators.json: ${id}.params.${key} must be a number`)
  return v
}

export function flag(id: string, key: string): boolean {
  return getIndicator(id).params[key] === true
}

export function list(id: string, key: string): string[] {
  const v = getIndicator(id).params[key]
  return Array.isArray(v) ? v.map(String) : []
}

/** Problems that would stop the engine from reading the rules. Tests require this to be empty. */
export function checkRules(rules: OrbitRules = RULES): string[] {
  const errors: string[] = []
  const ids = new Set(rules.indicators?.map((i) => i.id))
  for (const d of DOMAIN_IDS) {
    if (!Array.isArray(rules.domains?.[d])) errors.push(`domains.${d} must list indicator ids.`)
    for (const id of rules.domains?.[d] ?? []) if (!ids.has(id)) errors.push(`domains.${d}: unknown indicator "${id}".`)
  }
  for (const i of rules.indicators ?? []) {
    for (const k of ['label_en', 'rule_en', 'why_en', 'action_en', 'hrp_risk'] as const) {
      if (typeof i[k] !== 'string' || !i[k]) errors.push(`${i.id}.${k} is missing.`)
    }
  }
  for (const [id, keys] of Object.entries(REQUIRED_PARAMS)) {
    const ind = rules.indicators?.find((i) => i.id === id)
    if (!ind) {
      errors.push(`indicator "${id}" is missing.`)
      continue
    }
    for (const k of keys) if (!(k in (ind.params ?? {}))) errors.push(`${id}.params.${k} is missing.`)
  }
  const c = rules.convergence
  if (typeof c?.min_yellow_domains !== 'number' || typeof c?.consecutive_days !== 'number') {
    errors.push('convergence needs min_yellow_domains and consecutive_days.')
  }
  for (const k of ['green', 'yellow', 'early_signal', 'red_physical', 'red_psych'] as const) {
    if (!rules.escalation?.[k]?.en) errors.push(`escalation.${k}.en is missing.`)
  }
  return errors
}

export const RULES_ERRORS = checkRules()

/** "12 min", "1.3 s", "near real time". */
export function delayText(seconds: number): { en: string; es: string } {
  if (seconds < 1) return { en: 'near real time', es: 'casi en tiempo real' }
  if (seconds < 60) return { en: `${seconds} s`, es: `${seconds} s` }
  const min = Math.round(seconds / 6) / 10
  return { en: `${min} min`, es: `${min} min` }
}

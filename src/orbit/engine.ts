// ORBIT engine (handoff section 3): pure functions, no UI. Every number comes from
// orbit-indicators.json through config.ts; the personal baseline comes from persona.baseline.
//
//   color[i]  = rule(i, value, baseline, history)
//   Body      = worst(sleep, bp, hr, temp, glucose, exercise, symptoms)   (lists from rules.domains)
//   Mind      = worst(checkin, screen, pulse)
//   Crew      = worst(crew_climate, contact)
//   RED_PHYSICAL  if Body has red
//   RED_PSYCH     if she asked to talk to someone today
//   EARLY_SIGNAL  if >= 2 domains yellow-or-red today and on the previous day (convergence params)
//   YELLOW        if anything is yellow
//   GREEN         otherwise
import { DOMAIN_IDS, flag, list, num, RULES, type Color, type DomainId } from './config'
import type { DayRecord, DemoData, NumericField } from './demoData'

export type OrbitState = 'GREEN' | 'YELLOW' | 'EARLY_SIGNAL' | 'RED_PHYSICAL' | 'RED_PSYCH'

export interface IndicatorResult {
  color: Color
  /** Short, plain explanation of why it has this color (English, app text). */
  reason: string
  /** Something ORBIT offers her (never imposes): an earlier private psychological conference. */
  offer?: 'earlier_conference'
}

export interface DayResult {
  day: number
  state: OrbitState
  domains: Record<DomainId, Color>
  indicators: Record<string, IndicatorResult>
  /** Indicator ids in yellow or red, in rules order. */
  flagged: string[]
  /** Domains in yellow or red. */
  flaggedDomains: DomainId[]
}

const RANK: Record<Color, number> = { none: 0, green: 1, yellow: 2, red: 3 }
export const worstColor = (colors: Color[]): Color => colors.reduce<Color>((a, c) => (RANK[c] > RANK[a] ? c : a), 'none')

const r2 = (x: number) => Math.round(x * 100) / 100
const fmt = (x: number) => String(r2(x))
const res = (color: Color, reason: string): IndicatorResult => ({ color, reason })
const NO_DATA = res('none', 'No reading today.')

/** Records up to and including `day`, oldest first. */
function history(data: DemoData, day: number): DayRecord[] {
  return data.days.filter((d) => d.day <= day).sort((a, b) => a.day - b.day)
}

const lastN = (h: DayRecord[], n: number) => h.slice(Math.max(0, h.length - n))
const values = (h: DayRecord[], f: NumericField) => h.map((d) => d[f]).filter((v): v is number => typeof v === 'number')

type Rule = (h: DayRecord[], data: DemoData) => IndicatorResult

const RULE_FNS: Record<string, Rule> = {
  sleep(h, data) {
    const v = h.at(-1)?.sleep_h
    if (typeof v !== 'number') return NO_DATA
    const base = data.persona.baseline.sleep_h[0]
    const nights = num('sleep', 'red_consecutive_nights')
    const recent = lastN(h, nights).map((d) => d.sleep_h)
    if (recent.length === nights && recent.every((x) => typeof x === 'number' && x <= num('sleep', 'red_lte_h'))) {
      return res('red', `${num('sleep', 'red_lte_h')} h or less for ${nights} nights in a row.`)
    }
    const below = r2(base - v)
    if (v < num('sleep', 'population_min_h') && below > num('sleep', 'yellow_below_baseline_gt_h')) {
      return res('yellow', `${v.toFixed(1)} h: ${fmt(below)} h below your usual ${base} h.`)
    }
    return res('green', `${v.toFixed(1)} h, within your usual range (${base} h).`)
  },

  checkin(h, data) {
    const today = h.at(-1)
    if (!today) return NO_DATA
    if (today.talk_request) return res('red', 'You asked to talk to someone today.')
    const dirs = getDirections()
    const limit = num('checkin', 'yellow_worse_than_baseline_points')
    const worse: string[] = []
    let any = false
    for (const item of list('checkin', 'items')) {
      const v = today[item as NumericField]
      const base = data.persona.baseline[item as keyof typeof data.persona.baseline]
      if (typeof v !== 'number' || !Array.isArray(base)) continue
      any = true
      const delta = dirs[item] === 'down' ? base[0] - v : v - base[0]
      if (delta >= limit) worse.push(`${item} ${v} (usual ${base[0]})`)
    }
    if (!any) return NO_DATA
    return worse.length
      ? res('yellow', `${limit} or more points worse than usual: ${worse.join(', ')}.`)
      : res('green', `Within ${limit} points of your usual.`)
  },

  crew_climate(h, data) {
    const v = h.at(-1)?.crew_climate
    if (typeof v !== 'number') return NO_DATA
    const base = data.persona.baseline.crew_climate[0]
    const limit = num('crew_climate', 'yellow_worse_than_baseline_points')
    return base - v >= limit
      ? res('yellow', `${v}: ${limit} or more points below your usual ${base}.`)
      : res('green', `${v}, close to your usual ${base}.`)
  },

  screen(h) {
    // Weekly: use the latest check in the last 7 days.
    const day = h.at(-1)?.day ?? 0
    const latest = [...h].reverse().find((d) => d.screen && day - d.day < 7)
    if (!latest?.screen) return res('none', 'No weekly check this week.')
    const { phq2, gad2 } = latest.screen
    const limit = num('screen', 'yellow_gte')
    const positive = (d: DayRecord) => !!d.screen && (d.screen.phq2 >= limit || d.screen.gad2 >= limit)
    if (!positive(latest)) return res('green', `PHQ-2 ${phq2}, GAD-2 ${gad2} (day ${latest.day}).`)
    // No red: after N weeks in a row with a positive check, ORBIT offers an earlier private conference.
    const weeks = num('screen', 'offer_conference_if_weeks_gte')
    const checks = h.filter((d) => d.screen && d.day <= latest.day).slice(-weeks)
    const inARow = checks.length === weeks && checks.every(positive) &&
      checks.every((d, i) => i === 0 || d.day - checks[i - 1].day <= 7)
    return inARow
      ? { ...res('yellow', `PHQ-2 ${phq2}, GAD-2 ${gad2}, ${weeks} weeks in a row: ORBIT offers an earlier private conference.`), offer: 'earlier_conference' }
      : res('yellow', `PHQ-2 ${phq2}, GAD-2 ${gad2}: worth talking to someone (not a diagnosis).`)
  },

  pulse(h, data) {
    if (typeof h.at(-1)?.pulse_ms !== 'number') return NO_DATA
    const [mean, sd] = data.persona.baseline.pulse_ms
    const threshold = mean + num('pulse', 'yellow_sd_above_baseline') * sd
    const sessions = values(h, 'pulse_ms').slice(-num('pulse', 'yellow_window_sessions'))
    const slow = sessions.filter((v) => v > threshold).length
    const needed = num('pulse', 'yellow_sessions_needed')
    return slow >= needed
      ? res('yellow', `Slower than ${fmt(threshold)} ms in ${slow} of the last ${sessions.length} sessions.`)
      : res('green', `${slow} of the last ${sessions.length} sessions slower than ${fmt(threshold)} ms.`)
  },

  bp(h) {
    const today = h.at(-1)
    const sys = today?.sbp
    const dia = today?.dbp
    if (typeof sys !== 'number' || typeof dia !== 'number') return NO_DATA
    const high = (d?: DayRecord) =>
      !!d && typeof d.sbp === 'number' && typeof d.dbp === 'number' &&
      (d.sbp >= num('bp', 'red_sys_gte') || d.dbp >= num('bp', 'red_dia_gte'))
    const reading = `${sys}/${dia} mmHg`
    if (high(today)) {
      const confirmed = !flag('bp', 'red_needs_confirmation') || high(h.at(-2))
      return confirmed
        ? res('red', `${reading}, confirmed on a second reading.`)
        : res('yellow', `${reading}: repeat the reading to confirm.`)
    }
    if (sys < num('bp', 'green_sys_lt') && dia < num('bp', 'green_dia_lt')) return res('green', `${reading}, under 120/80.`)
    return res('yellow', `${reading}: elevated or stage 1 range.`)
  },

  hr(h, data) {
    const today = h.at(-1)
    const v = today?.hr
    if (!today || typeof v !== 'number') return NO_DATA
    const base = data.persona.baseline.hr[0]
    const redGt = num('hr', 'red_gt')
    const prev = h.at(-2)?.hr
    if (v > redGt && typeof prev === 'number' && prev > redGt) return res('red', `Over ${redGt} bpm at rest on repeated days.`)
    const dizzy = today.symptoms.some((s) => /dizz|faint/i.test(s))
    if (v < num('hr', 'red_low_lt_with_symptoms') && dizzy) return res('red', `Under ${num('hr', 'red_low_lt_with_symptoms')} bpm with dizziness or fainting.`)
    const above = v - base
    return above >= num('hr', 'yellow_above_baseline_bpm')
      ? res('yellow', `${v} bpm: ${above} above your usual ${base}.`)
      : res('green', `${v} bpm, near your usual ${base}.`)
  },

  temp(h, data) {
    const today = h.at(-1)
    const v = today?.temp
    if (!today || typeof v !== 'number') return NO_DATA
    const base = data.persona.baseline.temp[0]
    const above = r2(v - base)
    const hasSymptoms = today.symptoms.length > 0
    if (
      v >= num('temp', 'red_gte') &&
      above > num('temp', 'red_above_inflight_baseline_gt') &&
      (!flag('temp', 'red_requires_symptoms') || hasSymptoms)
    ) {
      return res('red', `${v.toFixed(1)} °C with symptoms, ${fmt(above)} °C above your in-flight normal.`)
    }
    if (above > num('temp', 'yellow_above_inflight_baseline_gt')) {
      return res('yellow', `${v.toFixed(1)} °C: ${fmt(above)} °C above your in-flight normal of ${base} °C.`)
    }
    return res('green', `${v.toFixed(1)} °C is normal for you in flight (${base} °C), even if it would count as fever on Earth.`)
  },

  glucose(h) {
    // Weekly: latest reading in the last 7 days.
    const day = h.at(-1)?.day ?? 0
    const readings = h.filter((d) => typeof d.glucose === 'number')
    const latest = readings.at(-1)
    if (!latest || typeof latest.glucose !== 'number' || day - latest.day >= 7) return res('none', 'No reading this week.')
    const v = latest.glucose
    const when = latest.day === day ? '' : ` (day ${latest.day})`
    if (v < num('glucose', 'red_low_lt')) return res('red', `${v} mg/dL${when}: level 2 hypoglycemia range.`)
    const highN = num('glucose', 'red_high_occasions')
    const lastHigh = readings.slice(-highN).filter((d) => (d.glucose as number) >= num('glucose', 'red_high_gte'))
    if (lastHigh.length >= highN) return res('red', `${num('glucose', 'red_high_gte')} mg/dL or more on ${highN} occasions.`)
    if (v >= num('glucose', 'green_min') && v <= num('glucose', 'green_max')) return res('green', `${v} mg/dL${when}, in the 70 to 99 range.`)
    if (v >= num('glucose', 'red_high_gte')) return res('yellow', `${v} mg/dL${when}: repeat to confirm.`)
    return res('yellow', `${v} mg/dL${when}: outside 70 to 99.`)
  },

  exercise(h, data) {
    const v = h.at(-1)?.exercise_min
    if (typeof v !== 'number') return NO_DATA
    const plan = data.persona.baseline.exercise_prescription_min ?? num('exercise', 'prescription_min_iss')
    const min = num('exercise', 'yellow_below_fraction') * plan
    return v < min
      ? res('yellow', `${v} of ${plan} min planned: under ${Math.round(num('exercise', 'yellow_below_fraction') * 100)} %.`)
      : res('green', `${v} of ${plan} min planned.`)
  },

  contact(h) {
    const v = h.at(-1)?.contact
    if (typeof v !== 'number') return NO_DATA
    const days = num('contact', 'yellow_days_without_contact')
    const recent = lastN(h, days).map((d) => d.contact)
    if (recent.length === days && recent.every((x) => x === 0)) return res('yellow', `${days} days in a row without contact.`)
    // "Drop of 50 % or more versus the previous 14 days", read as the last 14 days against the
    // 14 before them (a slow trend). Shorter windows contradict the acceptance table (handoff
    // section 5): pending confirmation by P1.
    const counts = h.map((d) => d.contact)
    const recent14 = counts.slice(-14).filter((x): x is number => typeof x === 'number')
    const prev14 = counts.slice(-28, -14).filter((x): x is number => typeof x === 'number')
    if (recent14.length >= 7 && prev14.length >= 7) {
      const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length
      const before = mean(prev14)
      if (before > 0 && 1 - mean(recent14) / before >= num('contact', 'yellow_drop_fraction_vs_14d')) {
        return res('yellow', 'Contact dropped by half or more compared with the previous two weeks.')
      }
    }
    return res('green', `${v} messages in the previous 24 h.`)
  },

  symptoms(h) {
    const today = h.at(-1)
    if (!today) return NO_DATA
    if (!today.symptoms.length) return res('green', 'No symptoms logged.')
    const flags = list('symptoms', 'red_flags').map((s) => s.toLowerCase())
    const red = today.symptoms.find((s) => flags.includes(s.toLowerCase()))
    if (red) return res('red', `${red}: goes straight to your medical officer.`)
    const limit = num('symptoms', 'yellow_duration_days_gt')
    const lasting = today.symptoms.find((s) => {
      let n = 0
      for (let i = h.length - 1; i >= 0 && h[i].symptoms.includes(s); i--) n++
      return n > limit
    })
    return lasting
      ? res('yellow', `${lasting} for more than ${limit} days.`)
      : res('green', `Logged: ${today.symptoms.join(', ')}.`)
  },
}

function getDirections(): Record<string, 'up' | 'down'> {
  const raw = RULES.indicators.find((i) => i.id === 'checkin')?.params.worse_direction
  return (raw ?? {}) as Record<string, 'up' | 'down'>
}

/**
 * Pulse baseline from her own sessions (live use, not the demo): the first `practice_sessions`
 * are practice and do not count, because reaction time improves with practice (Basner et al., 2015).
 * Returns undefined until there are at least 3 sessions after practice.
 */
export function pulseBaseline(sessionsMs: number[]): [mean: number, sd: number] | undefined {
  const counted = sessionsMs.slice(num('pulse', 'practice_sessions'))
  if (counted.length < 3) return undefined
  const mean = counted.reduce((a, b) => a + b, 0) / counted.length
  const sd = Math.sqrt(counted.reduce((a, b) => a + (b - mean) ** 2, 0) / (counted.length - 1))
  return [mean, sd]
}

/** Indicator ids the engine evaluates (those with a rule and listed under a domain). */
export const EVALUATED = DOMAIN_IDS.flatMap((d) => RULES.domains[d]).filter((id) => RULE_FNS[id])

function colorsFor(data: DemoData, day: number) {
  const h = history(data, day)
  const indicators: Record<string, IndicatorResult> = {}
  for (const id of EVALUATED) indicators[id] = h.at(-1)?.day === day ? RULE_FNS[id](h, data) : NO_DATA
  const domains = Object.fromEntries(
    DOMAIN_IDS.map((d) => [d, worstColor(RULES.domains[d].map((id) => indicators[id]?.color ?? 'none'))]),
  ) as Record<DomainId, Color>
  const flaggedDomains = DOMAIN_IDS.filter((d) => domains[d] === 'yellow' || domains[d] === 'red')
  return { h, indicators, domains, flaggedDomains }
}

export function evaluateDay(data: DemoData, day: number): DayResult {
  const { h, indicators, domains, flaggedDomains } = colorsFor(data, day)
  const flagged = EVALUATED.filter((id) => indicators[id].color === 'yellow' || indicators[id].color === 'red')
  const { min_yellow_domains: minDomains, consecutive_days: daysNeeded } = RULES.convergence

  let state: OrbitState = 'GREEN'
  if (domains.body === 'red') state = 'RED_PHYSICAL'
  else if (h.at(-1)?.day === day && h.at(-1)?.talk_request) state = 'RED_PSYCH'
  else if (
    flaggedDomains.length >= minDomains &&
    Array.from({ length: daysNeeded - 1 }, (_, k) => colorsFor(data, day - 1 - k).flaggedDomains.length).every((n) => n >= minDomains)
  ) {
    state = 'EARLY_SIGNAL'
  } else if (flagged.length) state = 'YELLOW'

  return { day, state, domains, indicators, flagged, flaggedDomains }
}

/** Escalation text key for a state. */
export const STATE_ESCALATION = {
  GREEN: 'green',
  YELLOW: 'yellow',
  EARLY_SIGNAL: 'early_signal',
  RED_PHYSICAL: 'red_physical',
  RED_PSYCH: 'red_psych',
} as const satisfies Record<OrbitState, keyof typeof RULES.escalation>

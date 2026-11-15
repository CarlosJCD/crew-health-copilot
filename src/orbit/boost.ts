// Boost (ORBIT stage B): protective actions she chooses. Content and rules come from Psychology,
// copied unchanged: boost/orbit-boost-library.json (cards, triggers, display rules, safety question)
// and boost/boost-cards.json (the offerable cards with priority and confidence in English).
// Display rules: safety question first, then "check first" cards, then up to 4 offered cards;
// she chooses up to 2; "Did it help?" afterwards. A red state replaces self-care with escalation.
import library from './boost/orbit-boost-library.json'
import offerable from './boost/boost-cards.json'
import { num, RULES } from './config'
import type { DayRecord, Persona } from './demoData'
import type { DayResult } from './engine'

export interface BoostSource {
  cite: string
  url?: string
}

export interface BoostCard {
  id: string
  kind: 'self_care' | 'connect' | 'check' | 'escalate'
  status: 'mvp' | 'roadmap'
  minutes: number
  title_en: string
  what_en: string
  why_en: string
  sources: BoostSource[]
  priority?: 'P0' | 'P1'
  confidence_en?: string
}

export interface Trigger {
  trigger: string
  safety_question: string | null
  safety_first_cards: string[]
  offered_cards: string[]
}

export interface SafetyQuestion {
  id: string
  text_en: string
  if_yes: string
  sources: BoostSource[]
}

type RawCard = Omit<BoostCard, 'priority' | 'confidence_en'>
const extra = new Map((offerable as { id: string; priority: 'P0' | 'P1'; confidence_en: string }[]).map((c) => [c.id, c]))

export const CARDS: Record<string, BoostCard> = Object.fromEntries(
  (library.cards as unknown as RawCard[]).map((c) => {
    const e = extra.get(c.id)
    return [c.id, { ...c, priority: e?.priority, confidence_en: e?.confidence_en }]
  }),
)

export const TRIGGERS = library.triggers as unknown as Trigger[]
export const DISPLAY = library.display_rules as {
  max_cards_shown: number
  max_choices: number
  did_it_help: { options_en: string[]; ask_after_minutes: number }
  red_overrides_self_care: boolean
  roadmap_cards_hidden_in_mvp: boolean
}
const SAFETY = library.safety_questions as unknown as Record<string, Omit<SafetyQuestion, 'id'>>
export const BOOST_DISCLAIMER = library.disclaimer_en as string

/** Problems in the Boost files the app would trip over. Tests require this to be empty. */
export function checkBoost(): string[] {
  const errors: string[] = []
  for (const t of TRIGGERS) {
    for (const id of [...t.safety_first_cards, ...t.offered_cards]) if (!CARDS[id]) errors.push(`${t.trigger}: unknown card "${id}".`)
    if (t.safety_question && !SAFETY[t.safety_question]) errors.push(`${t.trigger}: unknown safety question "${t.safety_question}".`)
  }
  for (const id of extra.keys()) if (!CARDS[id]) errors.push(`boost-cards.json: "${id}" is not in the library.`)
  for (const c of Object.values(CARDS)) if (!c.title_en || !c.what_en || !c.why_en) errors.push(`${c.id}: missing text.`)
  return errors
}

/** Check-in items that are 2 or more points worse than her baseline (mood down; stress and fatigue up). */
function checkinTriggers(record: DayRecord | undefined, persona: Persona): string[] {
  if (!record) return []
  const limit = num('checkin', 'yellow_worse_than_baseline_points')
  const dirs = (RULES.indicators.find((i) => i.id === 'checkin')?.params.worse_direction ?? {}) as Record<string, string>
  return (['mood', 'stress', 'fatigue'] as const).flatMap((item) => {
    const v = record[item]
    if (typeof v !== 'number') return []
    const base = persona.baseline[item][0]
    const worse = dirs[item] === 'down' ? base - v : v - base
    return worse >= limit ? [`checkin.${item}_yellow`] : []
  })
}

/** Library triggers active on a day, early signal first. `history` = records up to that day (weekly glucose). */
export function activeTriggers(result: DayResult, record: DayRecord | undefined, persona: Persona, history: DayRecord[] = []): string[] {
  const out: string[] = []
  if (result.state === 'EARLY_SIGNAL') out.push('early_signal')
  for (const id of result.flagged) {
    const color = result.indicators[id].color
    if (id === 'checkin') out.push(...(color === 'red' ? ['checkin.red'] : checkinTriggers(record, persona)))
    else if (id === 'glucose' && color === 'yellow') {
      const g = [...history, ...(record ? [record] : [])].reverse().find((r) => typeof r.glucose === 'number')?.glucose
      out.push(typeof g === 'number' && g < num('glucose', 'green_min') ? 'glucose.low_yellow' : 'glucose.high_yellow')
    } else out.push(`${id}.${color}`)
  }
  if (!out.length && result.state === 'GREEN') out.push('green')
  return out.filter((t) => TRIGGERS.some((x) => x.trigger === t))
}

export interface BoostPlan {
  triggers: string[]
  red: boolean
  safetyQuestion?: SafetyQuestion
  checkFirst: BoostCard[]
  /** Escalation cards (red states). */
  escalate: BoostCard[]
  /** Up to max_cards_shown self-care or connect cards she can choose from. */
  offered: BoostCard[]
}

/**
 * Cards for the day. `downranked` = card ids she rated "No" twice (Iterate): they move to the end.
 */
export function boostPlan(
  result: DayResult,
  record: DayRecord | undefined,
  persona: Persona,
  downranked: string[] = [],
  history: DayRecord[] = [],
): BoostPlan {
  const triggers = activeTriggers(result, record, persona, history)
  const rules = triggers.map((t) => TRIGGERS.find((x) => x.trigger === t)!)
  const red = triggers.some((t) => t.endsWith('.red'))
  const usable = (id: string) => CARDS[id] && !(DISPLAY.roadmap_cards_hidden_in_mvp && CARDS[id].status === 'roadmap')
  const unique = (ids: string[]) => [...new Set(ids)].filter(usable).map((id) => CARDS[id])

  const sq = rules.find((r) => r.safety_question)?.safety_question
  const allOffered = unique(rules.flatMap((r) => r.offered_cards))
  const escalate = allOffered.filter((c) => c.kind === 'escalate')
  const checkFirst = red ? [] : unique(rules.flatMap((r) => r.safety_first_cards))
  let selfCare = allOffered.filter((c) => c.kind !== 'escalate' && !checkFirst.includes(c))
  if (red && DISPLAY.red_overrides_self_care) {
    // Only self-care that a red trigger itself names (e.g. 15-15 for very low glucose).
    const fromRed = new Set(rules.filter((r) => r.trigger.endsWith('.red')).flatMap((r) => r.offered_cards))
    selfCare = selfCare.filter((c) => fromRed.has(c.id))
  }
  selfCare = [...selfCare.filter((c) => !downranked.includes(c.id)), ...selfCare.filter((c) => downranked.includes(c.id))]

  return {
    triggers,
    red,
    safetyQuestion: !red && sq ? { id: sq, ...SAFETY[sq] } : undefined,
    checkFirst,
    escalate,
    offered: selfCare.slice(0, DISPLAY.max_cards_shown),
  }
}

/** What she did with Boost on one day (stored on the device). */
export interface BoostDay {
  chosen: string[]
  helped: Record<string, string>
  safety?: 'yes' | 'no'
}

export type BoostLog = Record<string, BoostDay>

/** Cards rated "No" at least twice (display_rules.did_it_help.use: Iterate reordering). */
export function downrankedCards(log: BoostLog): string[] {
  const no = new Map<string, number>()
  for (const d of Object.values(log)) for (const [id, a] of Object.entries(d.helped)) if (a === 'No') no.set(id, (no.get(id) ?? 0) + 1)
  return [...no].filter(([, n]) => n >= 2).map(([id]) => id)
}

/** Protective factors used so far (the "tank": no color, it only fills up). */
export function protectiveCount(log: BoostLog): number {
  return Object.values(log).reduce((n, d) => n + d.chosen.length, 0)
}

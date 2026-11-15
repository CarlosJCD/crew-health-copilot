// "For today", next to the body: reminders of what she has not logged yet, and the self-care she can
// choose. ORBIT does not prescribe treatment: every suggestion is a card of Psychology's Boost library
// (with its evidence), chosen by her, and a confirmed alarm sign replaces self-care with the crew
// medical officer. Suggestions come from two places:
//  1. Boost's plan for the day (the engine's triggers, which already include a symptom lasting > 2 days).
//  2. Recent pain reports: the context she marked maps to an existing Boost trigger
//     (PAIN_CONTEXT_TRIGGERS, team criterion pending Psychology 1 review).
import { CARDS, DISPLAY, TRIGGERS, type BoostCard, type BoostLog, type BoostPlan } from './boost'
import type { Checkins } from './checkin'
import { getIndicator, RULES } from './config'
import { painDay, type PainEvent, type PainLog } from './pain'
import type { PulseSession } from './pulse'

/** Contexts of a pain report that match a Boost trigger's own situation (team criterion). */
export const PAIN_CONTEXT_TRIGGERS: Record<string, string> = {
  stress: 'checkin.stress_yellow',
  short_sleep: 'sleep.yellow',
  workstation: 'checkin.fatigue_yellow',
}

/** Days back that a pain report still drives suggestions and reminders. */
export const PAIN_RECENT_DAYS = 2

const usable = (id: string) => !!CARDS[id] && !(DISPLAY.roadmap_cards_hidden_in_mvp && CARDS[id].status === 'roadmap')
const offeredBy = (trigger: string) => TRIGGERS.find((t) => t.trigger === trigger)?.offered_cards ?? []

/**
 * Cards to suggest right after she logs a pain: the crew medical officer if she confirmed an alarm sign;
 * otherwise the self-care of the triggers her context matches (at most `max_cards_shown`). Can be empty.
 */
export function painSuggestions(e: PainEvent): BoostCard[] {
  if (e.alarms.length) return [CARDS.cmo_now]
  const ids = e.contexts.flatMap((c) => (PAIN_CONTEXT_TRIGGERS[c] ? offeredBy(PAIN_CONTEXT_TRIGGERS[c]) : []))
  return [...new Set(ids)]
    .filter(usable)
    .map((id) => CARDS[id])
    .filter((c) => c.kind !== 'escalate')
    .slice(0, DISPLAY.max_cards_shown)
}

/** Why a card is suggested: an engine trigger of today, or a recent pain report. */
export type Because = { kind: 'trigger'; trigger: string } | { kind: 'pain'; day: number; event: PainEvent }

export interface Suggestion {
  card: BoostCard
  because: Because[]
}

/** Readable name of a Boost trigger ("Sleep: yellow", "Mood, stress and fatigue: stress yellow"). */
export function triggerLabel(trigger: string): string {
  if (trigger === 'early_signal') return RULES.convergence.label_en
  if (trigger === 'green') return 'Everything in your usual range'
  const [indicator, rest = ''] = trigger.split('.')
  let label = indicator
  try {
    label = getIndicator(indicator).label_en
  } catch {
    /* unknown indicator: keep the id */
  }
  return `${label}: ${rest.replace(/_/g, ' ')}`
}

/** Pain reports from the last `PAIN_RECENT_DAYS` days up to `day`, newest first. */
export function recentPain(day: number, log: PainLog): { day: number; event: PainEvent }[] {
  const out: { day: number; event: PainEvent }[] = []
  for (let d = day; d >= day - PAIN_RECENT_DAYS; d--) for (const event of painDay(log[d]).events) out.push({ day: d, event })
  return out
}

/**
 * Self-care for today, next to the body. A red day shows only the escalation cards. Otherwise Boost's
 * offered cards come first (Psychology's order), then the cards of recent pain contexts; at most
 * `max_cards_shown`, each with the reasons it is there. When everything is in her usual range (only the
 * library's "green" trigger) nothing is suggested here: Psychology 1, testing on Nov 15, asked that
 * recommendations stop appearing when all is well. The green cards stay in Boost, which she opens herself.
 */
export function todaySuggestions(plan: BoostPlan, day: number, painLog: PainLog): { red: boolean; items: Suggestion[] } {
  const recent = recentPain(day, painLog)
  const alarm = recent.some((r) => r.day === day && r.event.alarms.length)
  if (plan.red || alarm) {
    const cards = plan.escalate.length ? plan.escalate : [CARDS.cmo_now]
    return { red: true, items: cards.map((card) => ({ card, because: [] })) }
  }
  const items = new Map<string, Suggestion>()
  const add = (card: BoostCard, because: Because) => {
    const s = items.get(card.id) ?? { card, because: [] }
    s.because.push(because)
    items.set(card.id, s)
  }
  const reasons = plan.triggers.filter((t) => t !== 'green')
  for (const card of plan.offered) {
    for (const t of reasons) if (offeredBy(t).includes(card.id)) add(card, { kind: 'trigger', trigger: t })
  }
  for (const r of recent) for (const card of painSuggestions(r.event)) add(card, { kind: 'pain', day: r.day, event: r.event })
  return { red: false, items: [...items.values()].slice(0, DISPLAY.max_cards_shown) }
}

export type Reminder =
  | { id: 'checkin' }
  | { id: 'pulse' }
  | { id: 'safety' }
  | { id: 'did_it_help'; cards: string[] }
  | { id: 'pain_again'; day: number; event: PainEvent }

interface ReminderInput {
  day: number
  checkins: Checkins
  pulseSessions: PulseSession[]
  boostLog: BoostLog
  painLog: PainLog
  plan: BoostPlan
}

/**
 * What she has not done yet today: the daily check-in, pulse mode (daily or every other day; a practice
 * session counts, since she did the task), the
 * safety question of Boost, "Did it help?" for yesterday's choices, and pain from the last days that
 * she has not logged again (it cools down on the heat map unless she does).
 */
/**
 * The reminder the main button of Today pushes on a green day: the first one that is not pulse mode. Pulse
 * is a 3-minute task due every other day, so it stays a reminder in "For today" and never becomes the
 * main action (team decision, Nov 15). Undefined: nothing left for the main button ("All done for today").
 */
export const mainReminder = (reminders: Reminder[]): Reminder | undefined => reminders.find((r) => r.id !== 'pulse')

export function remindersFor({ day, checkins, pulseSessions, boostLog, painLog, plan }: ReminderInput): Reminder[] {
  const out: Reminder[] = []
  if (plan.safetyQuestion && !boostLog[day]?.safety) out.push({ id: 'safety' })
  if (!checkins[day]) out.push({ id: 'checkin' })
  if (!pulseSessions.some((s) => s.day === day || s.day === day - 1)) out.push({ id: 'pulse' })
  const y = boostLog[day - 1]
  const unrated = y ? y.chosen.filter((id) => !y.helped[id]) : []
  if (unrated.length) out.push({ id: 'did_it_help', cards: unrated })
  const today = new Set(painDay(painLog[day]).events.flatMap((e) => e.regions))
  for (const r of recentPain(day, painLog)) {
    if (r.day === day || r.event.alarms.length) continue
    if (r.event.regions.some((reg) => !today.has(reg)) && !out.some((o) => o.id === 'pain_again' && o.event.regions.join() === r.event.regions.join())) {
      out.push({ id: 'pain_again', day: r.day, event: r.event })
    }
  }
  return out
}

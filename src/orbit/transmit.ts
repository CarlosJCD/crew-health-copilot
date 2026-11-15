// Transmit (ORBIT stage T): what Orbit would send, to whom, and when it arrives given the delay.
// Privacy rule (phase 4, section 9; NASA-STD-3001 medical communication is private):
//  - Body status and red physical safety rails always go to the crew medical officer (agreed before the mission).
//  - Mind and Crew go out only if she switches them on.
//  - Check-in answers, journal and game content never leave the device.
// Packet text is app content, in English.
import { DOMAIN_IDS, getIndicator, RULES, type DomainId, type Scenario } from './config'
import type { DemoData } from './demoData'
import { evaluateDay, type DayResult, type OrbitState } from './engine'

export interface ShareSettings {
  mind: boolean
  crew: boolean
}

export const DEFAULT_SHARE: ShareSettings = { mind: false, crew: false }

export type Recipient = 'crew_medical_officer' | 'flight_surgeons'
export type PacketKind = 'cmo_share' | 'escalation' | 'weekly_summary'

export interface PacketDraft {
  kind: PacketKind
  to: Recipient
  day: number
  title: string
  lines: string[]
}

export interface Packet extends PacketDraft {
  id: string
  queuedAt: number
  /** Epoch ms when it reaches the recipient (onboard = immediately). */
  arrivesAt: number
}

const STATE_EN: Record<OrbitState, string> = {
  GREEN: 'Green',
  YELLOW: 'Yellow (self-care)',
  EARLY_SIGNAL: RULES.convergence.label_en,
  RED_PHYSICAL: 'Red, physical',
  RED_PSYCH: 'Red, asked to talk',
}

const DOMAIN_EN: Record<DomainId, string> = { body: 'Body', mind: 'Mind', crew: 'Crew' }

/** Domains that leave the device. Body always does. */
export function sharedDomains(share: ShareSettings): DomainId[] {
  return DOMAIN_IDS.filter((d) => d === 'body' || share[d])
}

/** "Body: yellow (Sleep, Resting heart rate)" for each shared domain. */
function domainLines(result: DayResult, share: ShareSettings): string[] {
  return sharedDomains(share).map((d) => {
    const flagged = result.flagged.filter((id) => RULES.domains[d].includes(id)).map((id) => getIndicator(id).label_en)
    return `${DOMAIN_EN[d]}: ${result.domains[d]}${flagged.length ? ` (${flagged.join(', ')})` : ''}`
  })
}

const notShared = (share: ShareSettings) =>
  DOMAIN_IDS.filter((d) => !sharedDomains(share).includes(d)).map((d) => DOMAIN_EN[d])

function privacyLine(share: ShareSettings): string {
  const hidden = notShared(share)
  return hidden.length ? `Not shared by her choice: ${hidden.join(', ')}.` : 'She chose to share Body, Mind and Crew.'
}

/** Onboard packet she chooses to send to the crew medical officer. */
export function cmoShare(result: DayResult, share: ShareSettings): PacketDraft {
  return {
    kind: 'cmo_share',
    to: 'crew_medical_officer',
    day: result.day,
    title: `Day ${result.day} status, shared by the astronaut`,
    lines: [`Orbit state: ${STATE_EN[result.state]}`, ...domainLines(result, share), privacyLine(share)],
  }
}

/** Escalation packet to Earth: only for a red physical safety rail. */
export function escalationPacket(result: DayResult): PacketDraft | undefined {
  if (result.state !== 'RED_PHYSICAL') return undefined
  const reds = RULES.domains.body
    .filter((id) => result.indicators[id]?.color === 'red')
    .map((id) => `${getIndicator(id).label_en}: ${result.indicators[id].reason}`)
  return {
    kind: 'escalation',
    to: 'flight_surgeons',
    day: result.day,
    title: `Day ${result.day} escalation: physical safety rail in red`,
    lines: [...reds, 'The crew medical officer was notified onboard first.'],
  }
}

/** Weekly summary for the private medical conference (last 7 days up to `day`). */
export function weeklySummary(data: DemoData, day: number, share: ShareSettings): PacketDraft {
  const days = data.days.map((d) => d.day).filter((d) => d <= day && d > day - 7)
  const results = days.map((d) => evaluateDay(data, d))
  // Consecutive early-signal days count as one episode.
  const episodes: number[][] = []
  results.forEach((r, i) => {
    if (r.state !== 'EARLY_SIGNAL') return
    if (i > 0 && results[i - 1].state === 'EARLY_SIGNAL') episodes.at(-1)!.push(r.day)
    else episodes.push([r.day])
  })
  const resolved = (ep: number[]) => results.some((r) => r.day > ep.at(-1)! && r.state === 'GREEN')
  const reds = results.filter((r) => r.state === 'RED_PHYSICAL' || r.state === 'RED_PSYCH').length
  const today = results.at(-1)
  const signalLine = episodes.length
    ? `Early cross-domain signals: ${episodes.length} (${episodes
        .map((ep) => `day ${ep.join(' and ')}${resolved(ep) ? ', resolved onboard' : ', still open'}`)
        .join('; ')})`
    : 'Early cross-domain signals: none'
  return {
    kind: 'weekly_summary',
    to: 'flight_surgeons',
    day,
    title: `Weekly summary, days ${days[0] ?? day} to ${day}`,
    lines: [
      signalLine,
      `Red days: ${reds}`,
      ...(today ? domainLines(today, share).map((l) => `Today, ${l}`) : []),
      privacyLine(share),
      'Check-in answers, journal and game content stay on the device.',
    ],
  }
}

/** Onboard packets arrive at once; packets to Earth take the one-way delay (sped up by `speed` in the demo). */
export function queuePacket(draft: PacketDraft, scenario: Scenario, now: number, speed = 1): Packet {
  const delayMs = draft.to === 'flight_surgeons' ? (scenario.one_way_delay_s * 1000) / speed : 0
  return { ...draft, id: `${draft.kind}-${draft.day}-${now}`, queuedAt: now, arrivesAt: now + delayMs }
}

/** Earliest time a reply from Earth can arrive (round trip). */
export function earliestReply(packet: Packet, scenario: Scenario, speed = 1): number {
  return packet.arrivesAt + (scenario.one_way_delay_s * 1000) / speed
}

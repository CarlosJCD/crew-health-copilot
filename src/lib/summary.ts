import type { Domain, Status } from '../data/types'

// Pure helpers behind the Today summary: counts per status and per domain, which cards come first,
// and the plain-text summary the crew can paste for the Crew Medical Officer.

export type StatusCounts = Record<Status, number>

export function countStatuses(statuses: Status[]): StatusCounts {
  const counts: StatusCounts = { act: 0, watch: 0, nominal: 0, 'no-data': 0 }
  for (const s of statuses) counts[s]++
  return counts
}

/** Worst status present, ignoring "no data" unless nothing else is there. */
export function worstOf(counts: StatusCounts): Status {
  if (counts.act) return 'act'
  if (counts.watch) return 'watch'
  if (counts.nominal) return 'nominal'
  return 'no-data'
}

export interface DomainSummary {
  domain: Domain
  counts: StatusCounts
  worst: Status
}

export function summarizeDomains(items: { domain: Domain; status: Status }[], domains: readonly Domain[]): DomainSummary[] {
  return domains
    .map((domain) => {
      const counts = countStatuses(items.filter((i) => i.domain === domain).map((i) => i.status))
      return { domain, counts, worst: worstOf(counts) }
    })
    .filter((d) => d.counts.act + d.counts.watch + d.counts.nominal + d.counts['no-data'] > 0)
}

/**
 * Cards that need attention go first as full cards (Act, then Watch; catalog order kept inside each).
 * Nominal and no-data indicators go to the compact list.
 */
export function splitByAttention<T extends { status: Status }>(items: T[]): { attention: T[]; rest: T[] } {
  return {
    attention: [...items.filter((i) => i.status === 'act'), ...items.filter((i) => i.status === 'watch')],
    rest: items.filter((i) => i.status === 'nominal' || i.status === 'no-data'),
  }
}

export interface ShareLine {
  label: string
  value: string
  detail: string
}

/** Plain text for the crew channel: header lines, then one block per status group, then the disclaimer. */
export function shareText(header: string[], groups: { title: string; lines: ShareLine[] }[], empty: string, footer: string): string {
  const blocks = groups
    .filter((g) => g.lines.length)
    .map((g) => [g.title, ...g.lines.map((l) => `- ${l.label}: ${l.value} (${l.detail})`)].join('\n'))
  return [header.join('\n'), ...(blocks.length ? blocks : [empty]), footer].join('\n\n')
}

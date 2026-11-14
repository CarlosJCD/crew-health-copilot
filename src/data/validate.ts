import type { Measurement } from './types'
import { INDICATORS } from './indicators'

const SOURCES: Measurement['source'][] = ['device', 'self-report', 'task', 'synthetic']
const MAX_REPORTED = 20

export interface ValidationResult {
  rows: Measurement[]
  /** Human-readable problems, at most MAX_REPORTED (plus a summary line if there were more). */
  errors: string[]
  rejected: number
}

/**
 * Checks the data-science JSON against the `Measurement` contract. Bad rows are dropped and
 * reported, good rows are kept, so one typo does not blank the whole demo.
 */
export function validateMeasurements(input: unknown): ValidationResult {
  const errors: string[] = []
  const rows: Measurement[] = []
  let rejected = 0
  const report = (msg: string) => {
    rejected++
    if (errors.length < MAX_REPORTED) errors.push(msg)
  }

  if (!Array.isArray(input)) {
    return { rows, errors: ['The file must contain a JSON array of rows.'], rejected: 0 }
  }

  const units = new Map(INDICATORS.map((d) => [d.id, d.unit]))
  const seen = new Set<string>()

  input.forEach((raw: unknown, i) => {
    const where = `Row ${i}`
    if (typeof raw !== 'object' || raw === null) return report(`${where}: not an object.`)
    const r = raw as Record<string, unknown>

    if (typeof r.astronautId !== 'string' || !r.astronautId) return report(`${where}: "astronautId" must be a non-empty string.`)
    if (typeof r.day !== 'number' || !Number.isInteger(r.day)) return report(`${where}: "day" must be an integer (negative = pre-flight).`)
    if (typeof r.indicatorId !== 'string' || !units.has(r.indicatorId)) {
      return report(`${where}: unknown "indicatorId" ${JSON.stringify(r.indicatorId)}. Valid: ${[...units.keys()].join(', ')}.`)
    }
    if (typeof r.value !== 'number' || !Number.isFinite(r.value)) return report(`${where}: "value" must be a finite number.`)
    const expectedUnit = units.get(r.indicatorId)
    if (r.unit !== expectedUnit) return report(`${where}: "unit" for ${r.indicatorId} must be "${expectedUnit}", got ${JSON.stringify(r.unit)}.`)
    if (!SOURCES.includes(r.source as Measurement['source'])) {
      return report(`${where}: "source" must be one of ${SOURCES.join(', ')}.`)
    }
    const key = `${r.astronautId}|${r.day}|${r.indicatorId}`
    if (seen.has(key)) return report(`${where}: duplicate value for ${r.astronautId}, day ${r.day}, ${r.indicatorId}.`)
    seen.add(key)

    rows.push({
      astronautId: r.astronautId,
      day: r.day,
      indicatorId: r.indicatorId,
      value: r.value,
      unit: r.unit as string,
      source: r.source as Measurement['source'],
    })
  })

  if (rejected > errors.length) errors.push(`…and ${rejected - errors.length} more problems.`)
  return { rows, errors, rejected }
}

/** First and last day present in the data, for the replay slider. */
export function dayRange(rows: Measurement[]): { first: number; last: number } | undefined {
  if (!rows.length) return undefined
  let first = Infinity
  let last = -Infinity
  for (const r of rows) {
    if (r.day < first) first = r.day
    if (r.day > last) last = r.day
  }
  return { first, last }
}

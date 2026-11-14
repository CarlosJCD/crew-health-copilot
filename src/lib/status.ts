import type { IndicatorDef, Measurement, Status } from '../data/types'

export interface Baseline {
  mean: number
  sd: number
  n: number
}

const RANK: Record<Status, number> = { 'no-data': 0, nominal: 1, watch: 2, act: 3 }

export function worst(a: Status, b: Status): Status {
  return RANK[a] >= RANK[b] ? a : b
}

function best(a: Status, b: Status): Status {
  return RANK[a] <= RANK[b] ? a : b
}

/** Personal baseline from pre-flight days (day < 0). */
export function computeBaseline(rows: Measurement[]): Baseline | undefined {
  const pre = rows.filter((r) => r.day < 0).map((r) => r.value)
  if (pre.length < 3) return undefined
  const mean = pre.reduce((s, v) => s + v, 0) / pre.length
  const variance = pre.reduce((s, v) => s + (v - mean) ** 2, 0) / (pre.length - 1)
  return { mean, sd: Math.sqrt(variance), n: pre.length }
}

function fromBands(def: IndicatorDef, v: number): Status {
  const b = def.bands
  if (!b) return 'no-data'
  if ((b.actBelow !== undefined && v < b.actBelow) || (b.actAbove !== undefined && v > b.actAbove)) return 'act'
  if ((b.watchBelow !== undefined && v < b.watchBelow) || (b.watchAbove !== undefined && v > b.watchAbove)) return 'watch'
  return 'nominal'
}

export function zScore(v: number, baseline: Baseline): number {
  return baseline.sd > 0 ? (v - baseline.mean) / baseline.sd : 0
}

function fromBaseline(def: IndicatorDef, v: number, baseline?: Baseline): Status {
  if (!def.baselineSd || !baseline || baseline.sd === 0) return 'no-data'
  const z = zScore(v, baseline)
  const dir = def.worseWhen ?? 'both'
  const concern = dir === 'both' ? Math.abs(z) : dir === 'high' ? z : -z
  if (concern >= def.baselineSd.act) return 'act'
  if (concern >= def.baselineSd.watch) return 'watch'
  return 'nominal'
}

/**
 * Status for today's value: the worse of
 *  - the absolute bands (single day), and
 *  - the personal-baseline rule, which must hold on two consecutive days (today and `previous`)
 *    to cut false alarms from day-to-day noise.
 */
export function evaluate(def: IndicatorDef, v: number | undefined, baseline?: Baseline, previous?: number): Status {
  if (v === undefined || Number.isNaN(v)) return 'no-data'
  let personal = fromBaseline(def, v, baseline)
  if (previous !== undefined && !Number.isNaN(previous)) personal = best(personal, fromBaseline(def, previous, baseline))
  return worst(fromBands(def, v), personal)
}

/** Shape that goes with each status so it can be read without color. Words come from i18n (`status.*`). */
export const STATUS_SYMBOL: Record<Status, string> = {
  nominal: '●',
  watch: '▲',
  act: '■',
  'no-data': '○',
}

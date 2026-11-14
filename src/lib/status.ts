import type { Category, IndicatorDef, Measurement, Status } from '../data/types'

// Traffic-light rules. Settings per indicator come from the data team's catalog (knowledge.json):
//  - smoothN: the rules look at the average of the last N readings;
//  - categories: reference ranges (clinical or operational), each with its own confirmN;
//  - personal baseline: pre-flight mean and SD (never below sdFloor), shifted by the expected
//    in-flight change from launch day; must hold for confirmN consecutive readings.
// The day's status is the worse of the category and the personal-baseline result.

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

const mean = (xs: number[]) => xs.reduce((s, v) => s + v, 0) / xs.length

/** Personal baseline from pre-flight days (day < 0), with the SD raised to `sdFloor` if lower. */
export function computeBaseline(rows: Measurement[], sdFloor = 0): Baseline | undefined {
  const pre = rows.filter((r) => r.day < 0).map((r) => r.value)
  if (pre.length < 3) return undefined
  const m = mean(pre)
  const variance = pre.reduce((s, v) => s + (v - m) ** 2, 0) / (pre.length - 1)
  return { mean: m, sd: Math.max(Math.sqrt(variance), sdFloor), n: pre.length }
}

/** Category that contains `x` (min inclusive, max exclusive). */
export function categoryOf(def: IndicatorDef, x: number): Category | undefined {
  return def.categories.find((c) => (c.min === undefined || x >= c.min) && (c.max === undefined || x < c.max))
}

/** Baseline mean the reading on `day` is compared with: shifted by the expected in-flight change. */
export function expectedMean(def: IndicatorDef, baseline: Baseline, day: number): number {
  return baseline.mean + (day >= 0 ? def.inflightShift : 0)
}

/** A level counts only if the readings in the window were all at that level or worse. */
const confirmed = (levels: Status[]) => levels.reduce(best)

export interface Evaluation {
  status: Status
  /** Value the rules looked at: average of the last `smoothN` readings. */
  observed?: number
  /** % change vs. the pre-flight baseline (indicators with evaluateOn 'changePct'). */
  changePct?: number
  /** Reference category of the observed value, if the indicator has categories. */
  category?: Category
  baseline?: Baseline
  /** Baseline mean adjusted for the expected in-flight change. */
  expected?: number
  /** SDs from the expected mean. */
  z?: number
}

interface ReadingCheck {
  observed: number
  changePct?: number
  category?: Category
  categoryLevel: Status
  personalLevel: Status
  expected?: number
  z?: number
}

function check(def: IndicatorDef, readings: Measurement[], i: number, baseline?: Baseline): ReadingCheck {
  const observed = mean(readings.slice(Math.max(0, i - def.smoothN + 1), i + 1).map((r) => r.value))
  const changePct = baseline && baseline.mean !== 0 ? (100 * (observed - baseline.mean)) / baseline.mean : undefined
  const x = def.evaluateOn === 'changePct' ? changePct : observed
  const category = x === undefined ? undefined : categoryOf(def, x)

  let personalLevel: Status = 'no-data'
  let expected: number | undefined
  let z: number | undefined
  if (baseline && baseline.sd > 0) {
    expected = expectedMean(def, baseline, readings[i].day)
    z = (observed - expected) / baseline.sd
    const concern = def.worseWhen === 'both' ? Math.abs(z) : def.worseWhen === 'high' ? z : -z
    personalLevel = concern >= def.baselineSd.act ? 'act' : concern >= def.baselineSd.watch ? 'watch' : 'nominal'
  }
  return { observed, changePct, category, categoryLevel: category?.status ?? 'no-data', personalLevel, expected, z }
}

/** Status of one indicator on `day`, with the numbers behind it. No reading that day = 'no-data'. */
export function evaluateDay(def: IndicatorDef, rows: Measurement[], day: number): Evaluation {
  const baseline = computeBaseline(rows, def.sdFloor)
  const readings = rows.filter((r) => r.day <= day).sort((a, b) => a.day - b.day)
  const last = readings.length - 1
  if (last < 0 || readings[last].day !== day) return { status: 'no-data', baseline }

  const today = check(def, readings, last, baseline)
  const window = (n: number) =>
    readings.slice(Math.max(0, last - n + 1), last).map((_, k, arr) => check(def, readings, last - arr.length + k, baseline))

  const catN = today.category?.confirmN ?? 1
  const categoryStatus = confirmed([...window(catN).map((c) => c.categoryLevel), today.categoryLevel])
  const personalStatus = confirmed([...window(def.confirmN).map((c) => c.personalLevel), today.personalLevel])

  return {
    status: worst(categoryStatus, personalStatus),
    observed: today.observed,
    changePct: today.changePct,
    category: today.category,
    baseline,
    expected: today.expected,
    z: today.z,
  }
}

/** Shape that goes with each status so it can be read without color. Words come from i18n (`status.*`). */
export const STATUS_SYMBOL: Record<Status, string> = {
  nominal: '●',
  watch: '▲',
  act: '■',
  'no-data': '○',
}

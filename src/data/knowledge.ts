// Reference catalog from the data-science team: src/data/knowledge.json (their datos_nasav1.json,
// copied unchanged). ORBIT's alert colors come from orbit-indicators.json (see src/orbit); this
// catalog is reference material: plausible ranges used to check demo-data.json, NASA sources and
// mission physics. To update it, replace the JSON file; `npm test` checks it still fits this contract.
//
// Nothing in the file is verified yet ("Extraído (revisar página)").
import { indicators, clinical_categories, sources, physics, generated_at } from './knowledge.json'

export type Traffic = 'verde' | 'amarillo' | 'rojo'

export interface KnowledgeIndicator {
  id: string
  /** Spanish name. */
  name: string
  unit: string
  domain: string
  direction: 'low_bad' | 'high_bad' | 'both'
  how_measured: string
  frequency: string
  typical_inflight: string | null
  /** Expected in-flight change vs. pre-flight, in the indicator's unit (null = none). */
  expected_inflight_shift: number | null
  /** Minimum day-to-day SD used for the personal baseline. */
  sd_floor: number
  plausible_min: number
  plausible_max: number
  /** Average of the last N readings before applying the rules. */
  smooth_n: number
  /** Consecutive readings needed to confirm a personal-baseline alert. */
  confirm_n: number
  /** 'valor' = the value itself; 'cambio_pct' = % change vs. the pre-flight baseline. */
  evaluate_on: 'valor' | 'cambio_pct'
  /** Source codes separated by "; " (see `sources`), or a note such as "(pendiente psicólogas)". */
  sources: string
  provenance: string
}

export interface KnowledgeCategory {
  indicator: string
  order: number
  /** Spanish label, e.g. "Hipertensión etapa 1". */
  category: string
  status: Traffic
  /** Inclusive lower bound (null = none). */
  min: number | null
  /** Exclusive upper bound (null = none). */
  max: number | null
  confirm_n: number
  source: string
  quote: string | null
  note: string | null
  url: string | null
}

export interface KnowledgeSource {
  code: string
  title: string
  identifier: string | null
  url: string | null
}

export interface KnowledgeScenario {
  label_es: string
  one_way_delay_s_range: [number, number]
}

export interface Knowledge {
  generatedAt: string
  indicators: KnowledgeIndicator[]
  categories: KnowledgeCategory[]
  sources: KnowledgeSource[]
  scenarios: Record<string, KnowledgeScenario>
}

const isNum = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x)
const isNumOrNull = (x: unknown) => x === null || isNum(x)
const isStr = (x: unknown): x is string => typeof x === 'string' && x.length > 0
const isStrOrNull = (x: unknown) => x === null || typeof x === 'string'
const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null

/** Keeps the entries that fit the contract and explains the ones that do not. */
function pick<T>(section: string, list: unknown, check: (x: Record<string, unknown>) => string | undefined, errors: string[]): T[] {
  if (!Array.isArray(list)) {
    errors.push(`"${section}" must be a list.`)
    return []
  }
  return list.filter((x, i) => {
    const problem = isObj(x) ? check(x) : 'not an object'
    if (problem) errors.push(`${section}[${i}]${isObj(x) && x.id ? ` (${String(x.id)})` : ''}: ${problem}.`)
    return !problem
  }) as T[]
}

function checkIndicator(x: Record<string, unknown>): string | undefined {
  if (!isStr(x.id) || !isStr(x.name) || !isStr(x.unit)) return 'needs id, name and unit'
  if (!['low_bad', 'high_bad', 'both'].includes(x.direction as string)) return 'direction must be low_bad, high_bad or both'
  if (!['valor', 'cambio_pct'].includes(x.evaluate_on as string)) return 'evaluate_on must be valor or cambio_pct'
  for (const k of ['sd_floor', 'plausible_min', 'plausible_max', 'smooth_n', 'confirm_n'] as const) {
    if (!isNum(x[k])) return `${k} must be a number`
  }
  if ((x.smooth_n as number) < 1 || (x.confirm_n as number) < 1) return 'smooth_n and confirm_n must be at least 1'
  if ((x.plausible_min as number) >= (x.plausible_max as number)) return 'plausible_min must be below plausible_max'
  if (!isNumOrNull(x.expected_inflight_shift)) return 'expected_inflight_shift must be a number or null'
  if (!isStrOrNull(x.how_measured) || !isStrOrNull(x.sources)) return 'how_measured and sources must be text'
  return undefined
}

function checkCategory(x: Record<string, unknown>): string | undefined {
  if (!isStr(x.indicator) || !isStr(x.category)) return 'needs indicator and category'
  if (!['verde', 'amarillo', 'rojo'].includes(x.status as string)) return 'status must be verde, amarillo or rojo'
  if (!isNumOrNull(x.min) || !isNumOrNull(x.max)) return 'min and max must be numbers or null'
  if (x.min !== null && x.max !== null && (x.min as number) >= (x.max as number)) return 'min must be below max'
  if (!isNum(x.confirm_n) || (x.confirm_n as number) < 1) return 'confirm_n must be at least 1'
  if (!isNum(x.order)) return 'order must be a number'
  return undefined
}

const checkSource = (x: Record<string, unknown>) => (isStr(x.code) && isStr(x.title) && isStrOrNull(x.url) ? undefined : 'needs code, title and url')

export function parseKnowledge(input: {
  generated_at?: unknown
  indicators?: unknown
  clinical_categories?: unknown
  sources?: unknown
  physics?: unknown
}): { knowledge: Knowledge; errors: string[] } {
  const errors: string[] = []
  const ind = pick<KnowledgeIndicator>('indicators', input.indicators, checkIndicator, errors)
  const ids = new Set(ind.map((i) => i.id))
  const cats = pick<KnowledgeCategory>('clinical_categories', input.clinical_categories, checkCategory, errors).filter((c) => {
    if (!ids.has(c.indicator)) errors.push(`clinical_categories: unknown indicator "${c.indicator}".`)
    return ids.has(c.indicator)
  })
  const src = pick<KnowledgeSource>('sources', input.sources, checkSource, errors)

  // Categories of one indicator must not overlap, or the result would depend on their order.
  for (const id of ids) {
    const list = cats.filter((c) => c.indicator === id).sort((a, b) => (a.min ?? -Infinity) - (b.min ?? -Infinity))
    for (let i = 1; i < list.length; i++) {
      if ((list[i - 1].max ?? Infinity) > (list[i].min ?? -Infinity)) {
        errors.push(`clinical_categories: "${list[i - 1].category}" and "${list[i].category}" overlap (${id}).`)
      }
    }
  }

  const scenarios: Record<string, KnowledgeScenario> = {}
  const rawScenarios = isObj(input.physics) && isObj(input.physics.scenarios) ? input.physics.scenarios : {}
  for (const [id, s] of Object.entries(rawScenarios)) {
    const r = isObj(s) ? s.one_way_delay_s_range : undefined
    if (isObj(s) && Array.isArray(r) && r.length === 2 && r.every(isNum)) {
      scenarios[id] = { label_es: String(s.label_es ?? id), one_way_delay_s_range: [r[0], r[1]] }
    } else errors.push(`physics.scenarios.${id}: one_way_delay_s_range must be [min, max] in seconds.`)
  }

  return {
    knowledge: {
      generatedAt: typeof input.generated_at === 'string' ? input.generated_at : '',
      indicators: ind,
      categories: cats,
      sources: src,
      scenarios,
    },
    errors,
  }
}

const parsed = parseKnowledge({ generated_at, indicators, clinical_categories, sources, physics })

export const KNOWLEDGE = parsed.knowledge
/** Problems found in knowledge.json. Tests require this to be empty. */
export const KNOWLEDGE_ERRORS = parsed.errors

/** Source codes listed in a field like "AASM2015; BARGER2014; JONES2022". */
export function sourceCodes(field: string | null | undefined): string[] {
  return (field ?? '')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
}

export function findSource(code: string): KnowledgeSource | undefined {
  return KNOWLEDGE.sources.find((s) => s.code === code)
}

import type { Category, Domain, Hazard, IndicatorDef, SourceRef } from './types'
import type { Localized } from '../i18n/strings'
import { findSource, KNOWLEDGE, sourceCodes, TRAFFIC_STATUS, type KnowledgeIndicator } from './knowledge'
import { KNOWLEDGE_EN } from './knowledge.en'

// Indicators come from the data team's catalog (knowledge.json): name, unit, how to measure,
// thresholds, smoothing, confirmation and sources. This file adds what belongs to the app's
// model: the domain it is grouped under, the HRP hazards, and the "why it matters" text.
// A catalog indicator without an entry here is not shown (a test reports it).

interface ModelInfo {
  domain: Domain
  hazards: Hazard[]
  explainer: Localized
  decimals?: number
  /** Personal-baseline cut-offs in SDs. Design choice of the app, not from the catalog. */
  baselineSd?: { watch: number; act: number }
}

const DEFAULT_BASELINE_SD = { watch: 1.5, act: 2.5 }

const MODEL: Record<string, ModelInfo> = {
  // Body
  sleep: {
    domain: 'biological',
    hazards: ['isolation', 'environment'],
    explainer: {
      en: 'Sleep supports mood, focus and recovery. Short nights add up over a mission.',
      es: 'Dormir bien sostiene el ánimo, la concentración y la recuperación. Las noches cortas se acumulan.',
    },
    decimals: 1,
  },
  hr: {
    domain: 'biological',
    hazards: ['gravity', 'environment'],
    explainer: {
      en: 'A resting rate well above your usual can mean poor recovery, stress or illness.',
      es: 'Un pulso en reposo muy por encima de lo habitual puede indicar mala recuperación, estrés o enfermedad.',
    },
  },
  sbp: {
    domain: 'biological',
    hazards: ['gravity'],
    explainer: {
      en: 'Fluids shift toward the head in microgravity. Track changes against your own normal.',
      es: 'En microgravedad los líquidos se desplazan hacia la cabeza. Compara los cambios con tu propio normal.',
    },
  },
  dbp: {
    domain: 'biological',
    hazards: ['gravity'],
    explainer: {
      en: 'The lower number of your blood pressure. Read it together with the systolic value.',
      es: 'Es el número de abajo de tu presión. Léelo junto con el valor sistólico.',
    },
  },
  glucose: {
    domain: 'biological',
    hazards: ['environment', 'gravity'],
    explainer: {
      en: 'Inactivity and diet changes can affect how your body handles sugar.',
      es: 'La inactividad y los cambios en la dieta pueden alterar cómo tu cuerpo maneja el azúcar.',
    },
  },
  temp: {
    domain: 'biological',
    hazards: ['environment', 'radiation'],
    explainer: {
      en: 'Immune changes in flight can make infections more likely. A rise is an early clue.',
      es: 'Los cambios inmunes en vuelo pueden facilitar infecciones. Un aumento es una pista temprana.',
    },
    decimals: 1,
    baselineSd: { watch: 2, act: 3 },
  },
  body_mass: {
    domain: 'biological',
    hazards: ['distance', 'gravity'],
    explainer: {
      en: 'Many crew members lose 2 to 5% of their body mass in flight. Weekly weighing catches it early.',
      es: 'Muchos tripulantes pierden del 2 al 5 % de su masa corporal en vuelo. Pesarte cada semana lo detecta a tiempo.',
    },
    decimals: 1,
  },
  spo2: {
    domain: 'biological',
    hazards: ['environment'],
    explainer: {
      en: 'How much oxygen your blood carries. Cabin air problems or illness can lower it.',
      es: 'Cuánto oxígeno lleva tu sangre. Problemas del aire de la cabina o una enfermedad pueden bajarlo.',
    },
  },
  // Mind
  mood: {
    domain: 'cognitive-emotional',
    hazards: ['isolation', 'distance'],
    explainer: {
      en: 'Low days happen. A run of them is worth acting on early, before it grows.',
      es: 'Los días bajos pasan. Si se encadenan, conviene actuar pronto, antes de que crezca.',
    },
    decimals: 1,
  },
  stress: {
    domain: 'cognitive-emotional',
    hazards: ['isolation', 'distance'],
    explainer: {
      en: 'Stress that stays high for days affects sleep, focus and immunity.',
      es: 'El estrés que se mantiene alto varios días afecta el sueño, la concentración y la inmunidad.',
    },
    decimals: 1,
  },
  rt: {
    domain: 'cognitive-emotional',
    hazards: ['isolation', 'gravity'],
    explainer: {
      en: 'Slower reactions often show fatigue before you feel it. Compared only with yourself.',
      es: 'Las reacciones lentas suelen mostrar fatiga antes de que la sientas. Solo se compara contigo.',
    },
  },
  pvt_lapses: {
    domain: 'cognitive-emotional',
    hazards: ['isolation', 'environment'],
    explainer: {
      en: 'Responses slower than 355 ms. More lapses mean tired attention, even if you feel fine.',
      es: 'Respuestas de más de 355 ms. Más lapsos indican atención cansada, aunque te sientas bien.',
    },
  },
  // Connection
  contact: {
    domain: 'social',
    hazards: ['isolation', 'distance'],
    explainer: {
      en: 'Staying connected protects mood. A drop in contact is a gentle nudge, not a warning.',
      es: 'Mantenerte en contacto protege el ánimo. Una baja es un recordatorio amable, no una advertencia.',
    },
  },
  // Protective habits (the catalog files exercise under "biological"; the app's model treats it as protective)
  exercise: {
    domain: 'protective',
    hazards: ['gravity'],
    explainer: {
      en: 'Exercise protects bone, muscle and heart in low gravity, and lifts mood. The ISS reference is about 600 min a week.',
      es: 'El ejercicio protege hueso, músculo y corazón en baja gravedad, y mejora el ánimo. La referencia en la ISS es de unos 600 min por semana.',
    },
  },
}

/** Spanish catalog text with its English translation (falls back to Spanish if missing). */
const both = (es: string): Localized => ({ en: KNOWLEDGE_EN[es] ?? es, es })

const PENDING_PSYCHOLOGY: SourceRef = {
  label: { en: 'Source pending (psychology team)', es: 'Fuente pendiente (equipo de psicología)' },
  verified: false,
}
const PENDING_CLINICAL: SourceRef = {
  label: { en: 'Clinical source pending (data team)', es: 'Fuente clínica pendiente (equipo de datos)' },
  verified: false,
}

/** Every catalog source is still "Extraído (revisar página)", so none is marked verified. */
function sourceRef(code: string, url?: string | null): SourceRef | undefined {
  const s = findSource(code)
  if (!s) return undefined
  return { label: { en: s.title, es: s.title }, url: url ?? s.url ?? undefined, verified: false }
}

function indicatorSources(k: KnowledgeIndicator): SourceRef[] {
  const refs = sourceCodes(k.sources)
    .map((code) => sourceRef(code))
    .filter((s): s is SourceRef => !!s)
  if (refs.length) return refs
  return [k.sources?.includes('psicólog') ? PENDING_PSYCHOLOGY : PENDING_CLINICAL]
}

function categoriesFor(id: string): Category[] {
  return KNOWLEDGE.categories
    .filter((c) => c.indicator === id)
    .sort((a, b) => a.order - b.order)
    .map((c) => ({
      status: TRAFFIC_STATUS[c.status],
      min: c.min ?? undefined,
      max: c.max ?? undefined,
      confirmN: c.confirm_n,
      label: both(c.category),
      source: sourceRef(c.source, c.url) ?? PENDING_CLINICAL,
      quote: c.quote ?? undefined,
    }))
}

const WORSE_WHEN = { low_bad: 'low', high_bad: 'high', both: 'both' } as const

function build(k: KnowledgeIndicator, m: ModelInfo): IndicatorDef {
  const how = both(k.how_measured)
  const freq = k.frequency ? both(k.frequency) : undefined
  return {
    id: k.id,
    label: both(k.name),
    unit: k.unit,
    domain: m.domain,
    hazards: m.hazards,
    method: freq ? { en: `${how.en} · ${freq.en}`, es: `${how.es} · ${freq.es}` } : how,
    explainer: m.explainer,
    categories: categoriesFor(k.id),
    sources: indicatorSources(k),
    baselineSd: m.baselineSd ?? DEFAULT_BASELINE_SD,
    worseWhen: WORSE_WHEN[k.direction],
    sdFloor: k.sd_floor,
    smoothN: k.smooth_n,
    confirmN: k.confirm_n,
    inflightShift: k.expected_inflight_shift ?? 0,
    evaluateOn: k.evaluate_on === 'cambio_pct' ? 'changePct' : 'value',
    plausible: { min: k.plausible_min, max: k.plausible_max },
    decimals: m.decimals,
  }
}

export const INDICATORS: IndicatorDef[] = KNOWLEDGE.indicators.filter((k) => MODEL[k.id]).map((k) => build(k, MODEL[k.id]))

/** Catalog indicators the app does not show yet because they have no entry in MODEL. */
export const UNMODELED_INDICATORS = KNOWLEDGE.indicators.filter((k) => !MODEL[k.id]).map((k) => k.id)

export function getIndicator(id: string): IndicatorDef | undefined {
  return INDICATORS.find((i) => i.id === id)
}

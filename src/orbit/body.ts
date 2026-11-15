// Body map (phase 4: six clickable systems). Each system groups indicators from
// orbit-indicators.json, so its state, "how it is measured" and HRP risk all come from that file.
// Symptoms are logged with the fixed vocabulary of the rules file (symptoms.params.vocabulary, v0.3:
// 15 buttons, 5 alarm signs), so the engine never depends on free text for an alarm.
import type { Slug } from 'react-muscle-highlighter'
import { getIndicator, list, type Color } from './config'
import type { DemoData } from './demoData'
import { worstColor, type DayResult } from './engine'
import { painSystem } from './pain'

export type SystemId = 'brain' | 'eyes' | 'heart' | 'musculoskeletal' | 'immune' | 'gut'

export interface BodySystem {
  id: SystemId
  /** Indicators the system shows, by id in orbit-indicators.json. */
  indicators: string[]
  /** Fixed symptom buttons from the vocabulary (alarm signs go straight to the crew medical officer). */
  symptoms: string[]
  /** HRP risk names that apply even without an indicator of their own (eyes: SANS). */
  extraRisks: string[]
  /**
   * Zones of the anatomical figure (react-muscle-highlighter, front view) painted with the system's state.
   * Eyes and the immune system have no zone of their own: only their marker shows them. The hair is not
   * painted (a tap on it still opens the brain). Bone and muscle
   * uses the legs (weight-bearing bones and muscles), so a yellow there does not paint the whole body.
   */
  zones: Slug[]
}

interface VocabularyItem {
  text: string
  system: string
  red_flag: boolean
}

export const VOCABULARY = (getIndicator('symptoms').params.vocabulary ?? []) as VocabularyItem[]

/** System key used in the vocabulary of the rules file. */
const VOCAB_SYSTEM: Record<SystemId, string> = {
  brain: 'brain_mood',
  eyes: 'eyes',
  heart: 'heart_vessels',
  musculoskeletal: 'bone_muscle',
  immune: 'immune_skin',
  gut: 'gut',
}

const vocab = (id: SystemId) => VOCABULARY.filter((v) => v.system === VOCAB_SYSTEM[id]).map((v) => v.text)
const SANS = 'Risk of Spaceflight Associated Neuro-ocular Syndrome (SANS)'

export const SYSTEMS: BodySystem[] = [
  { id: 'brain', indicators: ['sleep', 'checkin', 'pulse', 'screen'], symptoms: vocab('brain'), extraRisks: [], zones: ['head'] },
  { id: 'eyes', indicators: [], symptoms: vocab('eyes'), extraRisks: [SANS], zones: [] },
  { id: 'heart', indicators: ['hr', 'bp'], symptoms: vocab('heart'), extraRisks: [], zones: ['chest'] },
  {
    id: 'musculoskeletal',
    indicators: ['exercise'],
    symptoms: vocab('musculoskeletal'),
    extraRisks: [],
    zones: ['adductors', 'quadriceps', 'knees', 'tibialis', 'calves', 'ankles', 'feet'],
  },
  { id: 'immune', indicators: ['temp'], symptoms: vocab('immune'), extraRisks: [], zones: [] },
  { id: 'gut', indicators: ['glucose'], symptoms: vocab('gut'), extraRisks: [], zones: ['abs', 'obliques'] },
]

/** The system a zone of the figure belongs to (arms, shoulders and neck belong to none; the hair is the head). */
export const systemOfZone = (slug: Slug): SystemId | undefined =>
  SYSTEMS.find((s) => s.zones.includes(slug === 'hair' ? 'head' : slug))?.id

/** Every fixed symptom button (the vocabulary of the rules file). */
export const FIXED_SYMPTOMS = VOCABULARY.map((v) => v.text)

export const isRedFlag = (symptom: string) => list('symptoms', 'red_flags').includes(symptom.toLowerCase())

/** HRP risks of a system, from its indicators (unique, in order). */
export function systemRisks(system: BodySystem): string[] {
  return [...new Set([...system.indicators.map((id) => getIndicator(id).hrp_risk), ...system.extraRisks])]
}

/**
 * A system's color: worst of its indicators; red if one of its alarm signs was logged that day;
 * yellow if one of its symptoms has lasted long enough to turn the symptoms rule yellow.
 */
export function systemColor(system: BodySystem, result: DayResult, symptomsToday: string[]): Color {
  // Its own symptom buttons, plus pain logged in a region of this system (pain-spec.json regions).
  const own = symptomsToday.filter((s) => system.symptoms.includes(s.toLowerCase()) || painSystem(s) === VOCAB_SYSTEM[system.id])
  const lasting = own.length > 0 && result.indicators.symptoms?.color === 'yellow'
  const fromSymptoms: Color = own.some(isRedFlag) ? 'red' : lasting ? 'yellow' : 'green'
  const colors = system.indicators.map((id) => result.indicators[id]?.color ?? 'none')
  return worstColor([...colors, system.indicators.length || own.length ? fromSymptoms : 'green'])
}

/** Symptoms she logged on the body map, by mission day. */
export type SymptomLog = Record<string, string[]>

/** Adds the logged symptoms to each day's record, so the engine evaluates them. */
export function applySymptoms(data: DemoData, log: SymptomLog): DemoData {
  if (!Object.values(log).some((l) => l.length)) return data
  return {
    ...data,
    days: data.days.map((d) => {
      const extra = log[d.day] ?? []
      return extra.length ? { ...d, symptoms: [...new Set([...d.symptoms, ...extra])] } : d
    }),
  }
}

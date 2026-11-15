// Body map (phase 4: six clickable systems). Each system groups indicators from
// orbit-indicators.json, so its state, "how it is measured" and HRP risk all come from that file.
// Symptoms are logged with the fixed vocabulary of the rules file (symptoms.params.vocabulary, v0.3:
// 15 buttons, 5 alarm signs), so the engine never depends on free text for an alarm.
import { getIndicator, list, type Color } from './config'
import type { DemoData } from './demoData'
import { worstColor, type DayResult } from './engine'

export type SystemId = 'brain' | 'eyes' | 'heart' | 'musculoskeletal' | 'immune' | 'gut'

export interface BodySystem {
  id: SystemId
  /** Indicators the system shows, by id in orbit-indicators.json. */
  indicators: string[]
  /** Fixed symptom buttons from the vocabulary (alarm signs go straight to the crew medical officer). */
  symptoms: string[]
  /** HRP risk names that apply even without an indicator of their own (eyes: SANS). */
  extraRisks: string[]
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
  { id: 'brain', indicators: ['sleep', 'checkin', 'pulse', 'screen'], symptoms: vocab('brain'), extraRisks: [] },
  { id: 'eyes', indicators: [], symptoms: vocab('eyes'), extraRisks: [SANS] },
  { id: 'heart', indicators: ['hr', 'bp'], symptoms: vocab('heart'), extraRisks: [] },
  { id: 'musculoskeletal', indicators: ['exercise'], symptoms: vocab('musculoskeletal'), extraRisks: [] },
  { id: 'immune', indicators: ['temp'], symptoms: vocab('immune'), extraRisks: [] },
  { id: 'gut', indicators: ['glucose'], symptoms: vocab('gut'), extraRisks: [] },
]

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
  const own = symptomsToday.filter((s) => system.symptoms.includes(s.toLowerCase()))
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

// Body map (phase 4: six clickable systems). Each system groups indicators from
// orbit-indicators.json, so its state, "how it is measured" and HRP risk all come from that file.
// Symptoms are logged with fixed buttons (the red_flags of the rules file plus "dizziness", as
// Psychology asked), so the engine never depends on free text for an alarm. Grouping = app design.
import { getIndicator, list, type Color } from './config'
import type { DemoData } from './demoData'
import { worstColor, type DayResult } from './engine'

export type SystemId = 'brain' | 'eyes' | 'heart' | 'musculoskeletal' | 'immune' | 'gut'

export interface BodySystem {
  id: SystemId
  /** Indicators the system shows, by id in orbit-indicators.json. */
  indicators: string[]
  /** Fixed symptom buttons (alarm signs go straight to the crew medical officer). */
  symptoms: string[]
  /** HRP risk names that apply even without an indicator of their own (eyes: SANS). */
  extraRisks: string[]
}

const SANS = 'Risk of Spaceflight Associated Neuro-ocular Syndrome (SANS)'

export const SYSTEMS: BodySystem[] = [
  { id: 'brain', indicators: ['sleep', 'checkin', 'pulse', 'screen'], symptoms: ['severe headache', 'dizziness', 'fainting'], extraRisks: [] },
  { id: 'eyes', indicators: [], symptoms: ['vision change'], extraRisks: [SANS] },
  { id: 'heart', indicators: ['hr', 'bp'], symptoms: ['chest pain', 'shortness of breath'], extraRisks: [] },
  { id: 'musculoskeletal', indicators: ['exercise'], symptoms: [], extraRisks: [] },
  { id: 'immune', indicators: ['temp'], symptoms: [], extraRisks: [] },
  { id: 'gut', indicators: ['glucose'], symptoms: [], extraRisks: [] },
]

/** Every fixed symptom button: the rules file's red flags plus "dizziness" (Psychology, answer of Nov 14). */
export const FIXED_SYMPTOMS = [...new Set([...list('symptoms', 'red_flags'), 'dizziness'])]

export const isRedFlag = (symptom: string) => list('symptoms', 'red_flags').includes(symptom.toLowerCase())

/** HRP risks of a system, from its indicators (unique, in order). */
export function systemRisks(system: BodySystem): string[] {
  return [...new Set([...system.indicators.map((id) => getIndicator(id).hrp_risk), ...system.extraRisks])]
}

/** A system's color: worst of its indicators, red if one of its alarm symptoms was logged that day. */
export function systemColor(system: BodySystem, result: DayResult, symptomsToday: string[]): Color {
  const own = symptomsToday.filter((s) => system.symptoms.includes(s.toLowerCase()))
  const fromSymptoms: Color = own.some(isRedFlag) ? 'red' : own.length ? 'yellow' : 'green'
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

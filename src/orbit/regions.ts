// Body map 2.0: 17 regions of the body, front and back, on top of the six systems of body.ts.
// Rules that keep it honest:
//  - A region's state is only the state of its systems (worst of them). No state is made up per muscle.
//  - Context (bone-loss zones, fluid shift, balance, kidneys) is shown as context, never as a state.
//  - The symptom buttons are the fixed vocabulary of the rules file; a region only adds where it is felt.
import type { Localized } from '../i18n/strings'
import { SYSTEMS, systemColor, type SymptomLog, type SystemId } from './body'
import type { Color } from './config'
import type { DemoData } from './demoData'
import { worstColor, type DayResult } from './engine'

export type RegionId =
  | 'head'
  | 'eyes'
  | 'vestibular'
  | 'neck'
  | 'chest'
  | 'shoulders'
  | 'arms'
  | 'forearms'
  | 'abdomen'
  | 'upperback'
  | 'lowerback'
  | 'kidneys'
  | 'hips'
  | 'thighs'
  | 'calves'
  | 'shins'
  | 'feet'

export type View = 'front' | 'back'

/** Spaceflight context shown on a region. Text lives in strings.ts (body.ctx.*); sources pending P1. */
export type ContextNote = 'bone' | 'vestibular' | 'kidney' | 'fluid'

export interface Region {
  id: RegionId
  label: Localized
  views: View[]
  /** Systems whose state the region shows. Empty: ORBIT has no indicator or symptom there yet. */
  systems: SystemId[]
  /** Symptom buttons offered here: a subset of the fixed vocabulary of its systems. */
  symptoms: string[]
  /** A muscle group that exercise protects (muscle and bone layer). */
  muscle: boolean
  /** Headward fluid shift, 0 (none) to 3 (most), for the fluids layer. */
  fluid: 0 | 1 | 2 | 3
  context: ContextNote[]
}

const r = (
  id: RegionId,
  en: string,
  es: string,
  views: View[],
  systems: SystemId[],
  symptoms: string[],
  extra: Partial<Pick<Region, 'muscle' | 'fluid' | 'context'>> = {},
): Region => ({ id, label: { en, es }, views, systems, symptoms, muscle: false, fluid: 0, context: [], ...extra })

const PAIN = 'joint or muscle pain'
const RASH = 'skin rash'

export const REGIONS: Region[] = [
  r('head', 'Head and brain', 'Cabeza y cerebro', ['front', 'back'], ['brain'], ['severe headache', 'headache'], { fluid: 3, context: ['fluid'] }),
  r('eyes', 'Eyes', 'Ojos', ['front'], ['eyes'], ['vision change', 'eye irritation'], { fluid: 3, context: ['fluid'] }),
  r('vestibular', 'Inner ear (balance)', 'Oído interno (equilibrio)', ['front'], ['brain'], ['dizziness'], { fluid: 2, context: ['vestibular'] }),
  r('neck', 'Neck and throat', 'Cuello y garganta', ['front', 'back'], ['musculoskeletal', 'immune'], [PAIN, 'sore throat or congestion'], { muscle: true, fluid: 2 }),
  r('chest', 'Chest and heart', 'Pecho y corazón', ['front'], ['heart'], ['chest pain', 'shortness of breath', 'fainting', 'palpitations'], { muscle: true, fluid: 2 }),
  r('shoulders', 'Shoulders', 'Hombros', ['front', 'back'], ['musculoskeletal'], [PAIN], { muscle: true, fluid: 1 }),
  r('arms', 'Upper arms', 'Brazos', ['front', 'back'], ['musculoskeletal'], [PAIN], { muscle: true }),
  r('forearms', 'Forearms and hands', 'Antebrazos y manos', ['front', 'back'], ['musculoskeletal', 'immune'], [PAIN, RASH], { muscle: true }),
  r('abdomen', 'Abdomen and gut', 'Abdomen e intestino', ['front'], ['gut'], ['nausea', 'stomach pain'], { muscle: true, fluid: 1 }),
  r('upperback', 'Upper back', 'Espalda alta', ['back'], ['musculoskeletal'], ['back pain', PAIN], { muscle: true }),
  r('lowerback', 'Lower back and spine', 'Espalda baja y columna', ['back'], ['musculoskeletal'], ['back pain', PAIN], { muscle: true, context: ['bone'] }),
  r('kidneys', 'Kidneys', 'Riñones', ['back'], [], [], { context: ['kidney'] }),
  r('hips', 'Hips and glutes', 'Cadera y glúteos', ['front', 'back'], ['musculoskeletal'], [PAIN], { muscle: true, context: ['bone'] }),
  r('thighs', 'Thighs', 'Muslos', ['front', 'back'], ['musculoskeletal'], [PAIN], { muscle: true }),
  r('calves', 'Calves', 'Pantorrillas', ['back'], ['musculoskeletal'], [PAIN], { muscle: true }),
  r('shins', 'Shins', 'Espinillas', ['front'], ['musculoskeletal', 'immune'], [PAIN, RASH], { muscle: true }),
  r('feet', 'Feet', 'Pies', ['front', 'back'], ['musculoskeletal', 'immune'], [PAIN, RASH]),
]

export const getRegion = (id: RegionId) => REGIONS.find((g) => g.id === id)!

/** A region's color: the worst color of its systems; no systems means no data. */
export function regionColor(region: Region, result: DayResult, symptomsToday: string[]): Color {
  if (!region.systems.length) return 'none'
  return worstColor(region.systems.map((id) => systemColor(SYSTEMS.find((s) => s.id === id)!, result, symptomsToday)))
}

/** Where a symptom was felt, by mission day: symptom → regions. Kept apart from the log so the engine is unchanged. */
export type SymptomPlaces = Record<string, Record<string, RegionId[]>>

/** Regions that offer a symptom button. */
export const regionsForSymptom = (symptom: string) => REGIONS.filter((g) => g.symptoms.includes(symptom)).map((g) => g.id)

/** Where a symptom of a day was felt: its tags, or its only possible region when there is just one. */
export function placesOf(symptom: string, day: number, places: SymptomPlaces): RegionId[] {
  const tagged = places[day]?.[symptom]
  if (tagged?.length) return tagged
  const only = regionsForSymptom(symptom)
  return only.length === 1 ? only : []
}

/** Whether a symptom is logged on that day and felt in that region (pressed state of its button). */
export function loggedIn(symptom: string, region: RegionId, day: number, log: SymptomLog, places: SymptomPlaces): boolean {
  return (log[day] ?? []).includes(symptom) && placesOf(symptom, day, places).includes(region)
}

/** Logs a symptom in a region: adds it to the day (so the engine sees it) and tags the region. */
export function logInRegion(
  symptom: string,
  region: RegionId,
  day: number,
  log: SymptomLog,
  places: SymptomPlaces,
): { log: SymptomLog; places: SymptomPlaces } {
  const logged = log[day] ?? []
  const dayPlaces = places[day] ?? {}
  const tags = dayPlaces[symptom] ?? []
  return {
    log: logged.includes(symptom) ? log : { ...log, [day]: [...logged, symptom] },
    places: tags.includes(region) ? places : { ...places, [day]: { ...dayPlaces, [symptom]: [...tags, region] } },
  }
}

/** Removes a symptom from a region; the symptom leaves the day when no region keeps it. */
export function unlogInRegion(
  symptom: string,
  region: RegionId,
  day: number,
  log: SymptomLog,
  places: SymptomPlaces,
): { log: SymptomLog; places: SymptomPlaces } {
  const dayPlaces = { ...(places[day] ?? {}) }
  const rest = (dayPlaces[symptom] ?? []).filter((g) => g !== region)
  if (rest.length) dayPlaces[symptom] = rest
  else delete dayPlaces[symptom]
  return {
    log: rest.length ? log : { ...log, [day]: (log[day] ?? []).filter((s) => s !== symptom) },
    places: { ...places, [day]: dayPlaces },
  }
}

/** Days with a symptom felt in each region, over the `window` days up to `day` (symptoms layer). */
export function symptomDays(data: DemoData, places: SymptomPlaces, day: number, window = 7): Partial<Record<RegionId, number>> {
  const counts: Partial<Record<RegionId, number>> = {}
  for (const d of data.days) {
    if (d.day > day || d.day <= day - window) continue
    const regions = new Set(d.symptoms.flatMap((s) => placesOf(s, d.day, places)))
    for (const g of regions) counts[g] = (counts[g] ?? 0) + 1
  }
  return counts
}

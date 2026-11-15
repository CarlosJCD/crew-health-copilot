// Small display helpers shared by components (kept out of component files for fast refresh).
import type { Lang, Localized, StringKey } from '../i18n/strings'
import type { Color, Scenario } from './config'
import { CONTEXTS, QUALITIES, region, zoneOf, type Slug } from './pain'

/** UI string key of a body zone (`part.lower-back`); the hair counts as the head. */
export const partKey = (slug: Slug) => `part.${zoneOf(slug)}` as StringKey

/**
 * Colors of the body figure (the figure library takes plain colors, not CSS variables). `fill` is the
 * gray of the library's female model, so a zone we restyle keeps the same base color as the rest.
 */
export const FIGURE = { fill: '#454545', border: '#9aa6c3', outline: '#e8ecf6' }

/** Fill of a system's zones on the figure: green is muted so yellow and red stand out. */
export const STATUS_FILL: Record<Color, string> = { green: '#2f7d62', yellow: '#f2b84b', red: '#ef5a5a', none: FIGURE.fill }

/** Shape that goes with each color so the traffic light reads without color. */
export const COLOR_SYMBOL: Record<Color, string> = { green: '●', yellow: '▲', red: '■', none: '○' }

// Scenario names for the Spanish interface; English comes from scenarios.json.
const NAME_ES: Record<string, string> = {
  iss: 'Estación espacial',
  lunar_orbit: 'Órbita lunar',
  mars_transit: 'Tránsito a Marte',
  mars_base: 'Base en Marte',
}

export const scenarioName = (s: Scenario): Localized => ({ en: s.label_en, es: NAME_ES[s.id] ?? s.label_en })

// Spanish labels for pain-spec.json, which is in English (its qualities carry their own Spanish).
const REGION_ES: Record<string, string> = {
  head: 'Cabeza', eyes: 'Ojos', neck: 'Cuello', shoulder: 'Hombro', chest: 'Pecho', upper_back: 'Espalda alta',
  lower_back: 'Espalda baja', abdomen: 'Abdomen', arm: 'Brazo o codo', hand_wrist: 'Mano o muñeca',
  hip: 'Cadera o pelvis', leg: 'Pierna o rodilla', foot_ankle: 'Pie o tobillo', skin: 'Piel (cualquier zona)',
}
const CONTEXT_ES: Record<string, string> = {
  exercise: 'Durante o después del ejercicio', eva: 'Durante o después de una EVA',
  translation: 'Al moverte entre módulos o mover carga', impact: 'Golpe o impacto',
  waking: 'Al despertar o por la posición al dormir', workstation: 'Tarea larga en una estación de trabajo',
  stress: 'Momento de estrés hoy', short_sleep: 'Dormí poco anoche', unknown: 'No sé',
}
const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1)

export const regionLabel = (id: string, lang: Lang) => (lang === 'es' ? REGION_ES[id] : region(id)?.label_en) ?? id
export const contextLabel = (id: string, lang: Lang) =>
  (lang === 'es' ? CONTEXT_ES[id] : CONTEXTS.find((c) => c.id === id)?.label_en) ?? id
export const qualityLabel = (id: string, lang: Lang) => {
  const q = QUALITIES.find((x) => x.id === id)
  return q ? (lang === 'es' ? cap(q.es) : q.label_en) : id
}

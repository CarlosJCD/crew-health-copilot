// Small display helpers shared by components (kept out of component files for fast refresh).
import type { Localized, StringKey } from '../i18n/strings'
import type { Color, Scenario } from './config'
import { zoneOf, type Slug } from './pain'

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

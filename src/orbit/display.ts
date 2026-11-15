// Small display helpers shared by components (kept out of component files for fast refresh).
import type { Localized } from '../i18n/strings'
import type { Color, Scenario } from './config'

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

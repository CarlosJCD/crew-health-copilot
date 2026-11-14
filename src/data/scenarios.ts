import type { Localized } from '../i18n/strings'
import type { Scenario, SourceRef } from './types'
import { findSource, KNOWLEDGE } from './knowledge'

// Signal delays come from the data team's catalog (physics.scenarios: distance ÷ speed of light,
// distances from the NASA Planetary Fact Sheet, marked "por verificar" there).
const fact = findSource('FACT')
const delaySource: SourceRef = {
  label: {
    en: `${fact?.title ?? 'NASA Planetary Fact Sheet'} (distance ÷ speed of light)`,
    es: `${fact?.title ?? 'NASA Planetary Fact Sheet'} (distancia ÷ velocidad de la luz)`,
  },
  url: fact?.url ?? undefined,
  verified: false,
}

/** Catalog key for each app scenario. */
const CATALOG_ID: Record<string, string> = {
  iss: 'iss',
  lunar: 'lunar_base',
  'mars-transit': 'mars_transit',
  'mars-base': 'mars_base',
}

const range = (id: string): [number, number] => KNOWLEDGE.scenarios[CATALOG_ID[id]]?.one_way_delay_s_range ?? [0, 0]

const r1 = (x: number) => Math.round(x * 10) / 10

/** One-way delay as text, e.g. "3.0 to 22.3 min". `extra` is appended (e.g. blackouts). */
function oneWay(id: string, extra?: Localized): Localized {
  const [min, max] = range(id)
  let text: Localized
  if (max < 1) text = { en: 'under 1 s', es: 'menos de 1 s' }
  else if (max < 60) text = { en: `about ${r1(max)} s`, es: `cerca de ${r1(max)} s` }
  else {
    const a = (min / 60).toFixed(1)
    const b = (max / 60).toFixed(1)
    text = { en: `${a} to ${b} min`, es: `de ${a} a ${b} min` }
  }
  return extra ? { en: `${text.en}, ${extra.en}`, es: `${text.es}, ${extra.es}` } : text
}

/** Worst-case round trip in minutes. */
const worstRoundTrip = (id: string) => r1((2 * range(id)[1]) / 60)

export const SCENARIOS: Scenario[] = [
  {
    id: 'iss',
    name: { en: 'Space station (low Earth orbit)', es: 'Estación espacial (órbita baja)' },
    short: { en: 'LEO station', es: 'Estación LEO' },
    oneWayDelay: oneWay('iss'),
    worstRoundTripMin: worstRoundTrip('iss'),
    notes: {
      en: 'Near real-time contact with the ground through relay satellites, which add some delay, with periodic loss-of-signal windows.',
      es: 'Contacto casi en tiempo real con Tierra mediante satélites de enlace, que suman algo de retraso, con ventanas periódicas sin señal.',
    },
    delaySource,
  },
  {
    id: 'lunar',
    name: { en: 'Lunar orbit', es: 'Órbita lunar' },
    short: { en: 'Lunar orbit', es: 'Órbita lunar' },
    oneWayDelay: oneWay('lunar'),
    worstRoundTripMin: worstRoundTrip('lunar'),
    notes: {
      en: 'Short delay; voice works, but the far side of the Moon blocks direct contact.',
      es: 'Retraso corto; la voz funciona, pero la cara oculta de la Luna bloquea el contacto directo.',
    },
    delaySource,
  },
  {
    id: 'mars-transit',
    name: { en: 'Mars transit', es: 'Tránsito a Marte' },
    short: { en: 'Mars transit', es: 'Tránsito a Marte' },
    oneWayDelay: oneWay('mars-transit'),
    worstRoundTripMin: worstRoundTrip('mars-transit'),
    notes: {
      en: 'No live conversation with the ground. The crew must act first and confirm later.',
      es: 'No hay conversación en vivo con Tierra. La tripulación actúa primero y confirma después.',
    },
    delaySource,
  },
  {
    id: 'mars-base',
    name: { en: 'Planetary base (Mars surface)', es: 'Base planetaria (superficie de Marte)' },
    short: { en: 'Mars base', es: 'Base en Marte' },
    oneWayDelay: oneWay('mars-base', { en: 'with conjunction blackouts', es: 'con apagones por conjunción' }),
    worstRoundTripMin: worstRoundTrip('mars-base'),
    notes: {
      en: 'Highest autonomy: weeks without contact are possible during solar conjunction.',
      es: 'Máxima autonomía: durante la conjunción solar puede haber semanas sin contacto.',
    },
    delaySource,
  },
]

export const DEFAULT_SCENARIO_ID = 'mars-transit'

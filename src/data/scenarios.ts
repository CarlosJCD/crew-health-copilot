import type { Scenario } from './types'

// Delay figures are placeholders until the science team verifies them (Phase 2/3).
const pending = {
  label: { en: 'Pending verification (science team)', es: 'Pendiente de verificar (equipo científico)' },
  verified: false,
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'iss',
    name: { en: 'Space station (low Earth orbit)', es: 'Estación espacial (órbita baja)' },
    short: { en: 'LEO station', es: 'Estación LEO' },
    oneWayDelay: { en: 'under 1 s', es: 'menos de 1 s' },
    worstRoundTripMin: 0,
    notes: {
      en: 'Near real-time contact with the ground, with periodic loss-of-signal windows.',
      es: 'Contacto casi en tiempo real con Tierra, con ventanas periódicas sin señal.',
    },
    delaySource: pending,
  },
  {
    id: 'lunar',
    name: { en: 'Lunar orbit', es: 'Órbita lunar' },
    short: { en: 'Lunar orbit', es: 'Órbita lunar' },
    oneWayDelay: { en: 'about 1.3 s', es: 'cerca de 1.3 s' },
    worstRoundTripMin: 0.05,
    notes: {
      en: 'Short delay; voice works, but the far side of the Moon blocks direct contact.',
      es: 'Retraso corto; la voz funciona, pero la cara oculta de la Luna bloquea el contacto directo.',
    },
    delaySource: pending,
  },
  {
    id: 'mars-transit',
    name: { en: 'Mars transit', es: 'Tránsito a Marte' },
    short: { en: 'Mars transit', es: 'Tránsito a Marte' },
    oneWayDelay: { en: 'about 3 to 22 min', es: 'de 3 a 22 min aprox.' },
    worstRoundTripMin: 44,
    notes: {
      en: 'No live conversation with the ground. The crew must act first and confirm later.',
      es: 'No hay conversación en vivo con Tierra. La tripulación actúa primero y confirma después.',
    },
    delaySource: pending,
  },
  {
    id: 'mars-base',
    name: { en: 'Planetary base (Mars surface)', es: 'Base planetaria (superficie de Marte)' },
    short: { en: 'Mars base', es: 'Base en Marte' },
    oneWayDelay: {
      en: 'about 3 to 22 min, with conjunction blackouts',
      es: 'de 3 a 22 min aprox., con apagones por conjunción',
    },
    worstRoundTripMin: 44,
    notes: {
      en: 'Highest autonomy: weeks without contact are possible during solar conjunction.',
      es: 'Máxima autonomía: durante la conjunción solar puede haber semanas sin contacto.',
    },
    delaySource: pending,
  },
]

export const DEFAULT_SCENARIO_ID = 'mars-transit'

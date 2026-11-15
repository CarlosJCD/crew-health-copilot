// Module list drives the navigation (ORBIT product structure, phase 4 and handoff section 1).
// Each planned module names its owner so the team can work in parallel.
// Text fields are { en, es }: keep both in sync when editing.
import type { Localized } from '../i18n/strings'

export interface ModuleInfo {
  id: string
  label: Localized
  summary: Localized
  owner: Localized
  planned: Localized[]
}

export const MODULES: ModuleInfo[] = [
  {
    id: 'body',
    label: { en: 'Body map', es: 'Figura humana' },
    summary: {
      en: 'Home screen: today\'s state, the human figure with six systems, and where it hurts (pick the muscle or paint the area).',
      es: 'Pantalla de inicio: el estado del día, la figura humana con seis sistemas y dónde duele (elegir el músculo o pintar el área).',
    },
    owner: { en: 'Engineering', es: 'Ingeniería' },
    planned: [
      { en: 'Clickable SVG figure with HRP risks', es: 'Figura SVG que se puede tocar, con riesgos HRP' },
      { en: 'Tap to log a symptom', es: 'Tocar para registrar un síntoma' },
    ],
  },
  {
    id: 'today',
    label: { en: 'Metrics', es: 'Métricas' },
    summary: {
      en: 'Every number one tap away: Body, Mind and Crew rings, the ORBIT state and each indicator against your own baseline.',
      es: 'Todos los números a un toque: anillos de Cuerpo, Mente y Tripulación, el estado ORBIT y cada indicador frente a tu propia línea base.',
    },
    owner: { en: 'Engineering', es: 'Ingeniería' },
    planned: [],
  },
  {
    id: 'boost',
    label: { en: 'Boost', es: 'Boost' },
    summary: {
      en: 'Protective actions from the Psychology library: up to 4 cards for the day, with evidence and confidence. You choose up to two.',
      es: 'Acciones protectoras de la biblioteca de Psicología: hasta 4 tarjetas por día, con evidencia y confianza. Tú eliges hasta dos.',
    },
    owner: { en: 'Engineering (texts: Psychology 2)', es: 'Ingeniería (textos: Psicología 2)' },
    planned: [
      { en: '8 Boost cards, choose up to 2', es: '8 tarjetas de Boost, elige hasta 2' },
      { en: 'Follow-up at 24 h: what helped?', es: 'Seguimiento a las 24 h: ¿qué ayudó?' },
    ],
  },
  {
    id: 'transmit',
    label: { en: 'Transmit', es: 'Transmit' },
    summary: {
      en: 'Outbox with the signal-delay timer of the mission and switches for what you share.',
      es: 'Bandeja de salida con el temporizador del retraso de la misión e interruptores de lo que compartes.',
    },
    owner: { en: 'Engineering', es: 'Ingeniería' },
    planned: [
      { en: 'Outbox with delay countdown', es: 'Bandeja con cuenta regresiva del retraso' },
      { en: 'Privacy switches: Body by default, Mind and Crew only if you choose', es: 'Interruptores de privacidad: Cuerpo por defecto; Mente y Tripulación solo si tú eliges' },
    ],
  },
  {
    id: 'mind',
    label: { en: 'Mind', es: 'Mente' },
    summary: {
      en: 'Daily check-in with 4 sliders (60 s or less) and pulse mode, a 60 to 90 s reaction task.',
      es: 'Check-in diario de 4 deslizadores (60 s o menos) y modo pulso, una tarea de reacción de 60 a 90 s.',
    },
    owner: { en: 'Engineering (spec: Psychology 1)', es: 'Ingeniería (especificación: Psicología 1)' },
    planned: [
      { en: 'Check-in: mood, stress, fatigue, crew climate', es: 'Check-in: ánimo, estrés, fatiga y clima de tripulación' },
      { en: 'Pulse mode with 5 practice sessions', es: 'Modo pulso con 5 sesiones de práctica' },
    ],
  },
  {
    id: 'play',
    label: { en: 'Constellations', es: 'Constellations' },
    summary: {
      en: 'Free mode: group 16 tiles into 4 sets with NASA Planetary Fact Sheet data. Never scores.',
      es: 'Modo libre: agrupar 16 fichas en 4 grupos con datos del Planetary Fact Sheet de NASA. Nunca puntúa.',
    },
    owner: { en: 'Engineering (content: Psychology 1)', es: 'Ingeniería (contenido: Psicología 1)' },
    planned: [{ en: 'Crew mode and family puzzle (roadmap)', es: 'Modo tripulación y acertijo con la familia (hoja de ruta)' }],
  },
]

// The body is the first screen: astronauts have little medical background and little time to read numbers.
export const DEFAULT_MODULE = 'body'

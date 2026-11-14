// Module list drives the navigation. Each planned module names its owner so
// the team can work in parallel without touching the same files.
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
    id: 'today',
    label: { en: 'Today', es: 'Hoy' },
    summary: {
      en: 'Trends and traffic-light status for every indicator, against your own pre-flight normal.',
      es: 'Tendencias y semáforo de cada indicador, comparados con tu propio normal previo al vuelo.',
    },
    owner: { en: 'Engineering', es: 'Ingeniería' },
    planned: [],
  },
  {
    id: 'body',
    label: { en: 'Body', es: 'Cuerpo' },
    summary: {
      en: 'Interactive human figure: tap a body system to see its function, status and why it changes in space.',
      es: 'Figura humana interactiva: toca un sistema del cuerpo para ver su función, su estado y por qué cambia en el espacio.',
    },
    owner: { en: 'Data science + Engineering', es: 'Ciencia de datos + Ingeniería' },
    planned: [
      { en: 'Clickable SVG body by system', es: 'Cuerpo en SVG con sistemas que se pueden tocar' },
      {
        en: 'Hazard links (radiation, gravity, closed environment)',
        es: 'Vínculos con los peligros (radiación, gravedad, ambiente cerrado)',
      },
    ],
  },
  {
    id: 'mind',
    label: { en: 'Mind', es: 'Mente' },
    summary: {
      en: 'Daily mood, stress and fatigue check-in, plus cognitive signal from mini-games in check mode.',
      es: 'Registro diario de ánimo, estrés y fatiga, más la señal cognitiva de los minijuegos en modo chequeo.',
    },
    owner: { en: 'Psychology 1', es: 'Psicología 1' },
    planned: [
      { en: 'One-tap evening check-in', es: 'Registro nocturno de un toque' },
      {
        en: 'Reaction-time trend vs personal baseline',
        es: 'Tendencia del tiempo de reacción frente a la línea base personal',
      },
    ],
  },
  {
    id: 'crew',
    label: { en: 'Crew & Family', es: 'Tripulación y familia' },
    summary: {
      en: 'Asynchronous messages and recorded check-ins with the support network, showing the real signal delay.',
      es: 'Mensajes asíncronos y mensajes grabados con la red de apoyo, mostrando el retraso real de la señal.',
    },
    owner: { en: 'Psychology 2', es: 'Psicología 2' },
    planned: [
      { en: 'Message queue with delay countdown', es: 'Cola de mensajes con cuenta regresiva del retraso' },
      { en: 'Crew cohesion pulse', es: 'Pulso de cohesión de la tripulación' },
    ],
  },
  {
    id: 'recharge',
    label: { en: 'Recharge', es: 'Recarga' },
    summary: {
      en: 'Leisure and coping: original mini-games (free play), breathing, music, plants, journaling.',
      es: 'Ocio y afrontamiento: minijuegos originales (juego libre), respiración, música, plantas y diario.',
    },
    owner: { en: 'Psychology 1 + 2', es: 'Psicología 1 + 2' },
    planned: [
      {
        en: 'Two original mini-games (free play vs check mode)',
        es: 'Dos minijuegos originales (juego libre y modo chequeo)',
      },
      { en: 'Coping menu feasible on board', es: 'Menú de afrontamiento viable a bordo' },
    ],
  },
  {
    id: 'routine',
    label: { en: 'Routine', es: 'Rutina' },
    summary: {
      en: 'Measurement reminders and small health quests that fit the mission timeline.',
      es: 'Recordatorios de medición y pequeños retos de salud que encajan en el horario de la misión.',
    },
    owner: { en: 'Engineering', es: 'Ingeniería' },
    planned: [
      { en: 'Daily schedule of prompts', es: 'Agenda diaria de recordatorios' },
      { en: 'Streaks without punishing missed days', es: 'Rachas que no castigan los días perdidos' },
    ],
  },
]

export const DEFAULT_MODULE = 'today'

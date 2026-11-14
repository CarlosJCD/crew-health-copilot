import type { IndicatorDef, SourceRef } from './types'

// Every threshold carries a source. Anything not yet checked by the science team
// stays `verified: false` and the UI says so. Do not mark a source as verified
// unless someone on the team has opened it.
// Text fields are { en, es }: keep both in sync when editing.
const pending: SourceRef = {
  label: {
    en: 'Threshold pending verification (Phase 3 matrix)',
    es: 'Umbral pendiente de verificar (matriz de la Fase 3)',
  },
  verified: false,
}

const jones2022: SourceRef = {
  label: {
    en: 'Jones et al. (2022), Sleep 45(3): ISS astronauts, sleep < 6 h linked to slower response speed',
    es: 'Jones et al. (2022), Sleep 45(3): en astronautas de la ISS, dormir < 6 h se asoció con respuestas más lentas',
  },
  url: 'https://doi.org/10.1093/sleep/zsac006',
  verified: true,
}

export const INDICATORS: IndicatorDef[] = [
  // Biological
  {
    id: 'sleep',
    label: { en: 'Sleep', es: 'Sueño' },
    unit: 'h',
    domain: 'biological',
    hazards: ['isolation', 'environment'],
    method: { en: 'Wearable or sleep log', es: 'Dispositivo portátil o diario de sueño' },
    explainer: {
      en: 'Sleep supports mood, focus and recovery. Short nights add up over a mission.',
      es: 'Dormir bien sostiene el ánimo, la concentración y la recuperación. Las noches cortas se acumulan.',
    },
    bands: { watchBelow: 6, actBelow: 5 },
    bandsSource: jones2022,
    baselineSd: { watch: 1.5, act: 2.5 },
    worseWhen: 'low',
    decimals: 1,
  },
  {
    id: 'hr',
    label: { en: 'Resting heart rate', es: 'Frecuencia cardiaca en reposo' },
    unit: 'bpm',
    domain: 'biological',
    hazards: ['gravity', 'environment'],
    method: { en: 'Wearable or chest strap, on waking', es: 'Dispositivo portátil o banda de pecho, al despertar' },
    explainer: {
      en: 'A resting rate well above your usual can mean poor recovery, stress or illness.',
      es: 'Un pulso en reposo muy por encima de lo habitual puede indicar mala recuperación, estrés o enfermedad.',
    },
    bandsSource: pending,
    baselineSd: { watch: 1.5, act: 2.5 },
    worseWhen: 'high',
  },
  {
    id: 'sbp',
    label: { en: 'Blood pressure (systolic)', es: 'Presión arterial (sistólica)' },
    unit: 'mmHg',
    domain: 'biological',
    hazards: ['gravity'],
    method: {
      en: 'Arm cuff, seated, same time each day',
      es: 'Baumanómetro de brazo, sentado, a la misma hora cada día',
    },
    explainer: {
      en: 'Fluids shift toward the head in microgravity. Track changes against your own normal.',
      es: 'En microgravedad los líquidos se desplazan hacia la cabeza. Compara los cambios con tu propio normal.',
    },
    bandsSource: pending,
    baselineSd: { watch: 1.5, act: 2.5 },
  },
  {
    id: 'glucose',
    label: { en: 'Blood glucose (fasting)', es: 'Glucosa en sangre (ayuno)' },
    unit: 'mg/dL',
    domain: 'biological',
    hazards: ['environment', 'gravity'],
    method: { en: 'Finger-stick glucometer, before breakfast', es: 'Glucómetro capilar, antes del desayuno' },
    explainer: {
      en: 'Inactivity and diet changes can affect how your body handles sugar.',
      es: 'La inactividad y los cambios en la dieta pueden alterar cómo tu cuerpo maneja el azúcar.',
    },
    bandsSource: pending,
    baselineSd: { watch: 1.5, act: 2.5 },
  },
  {
    id: 'temp',
    label: { en: 'Body temperature', es: 'Temperatura corporal' },
    unit: '°C',
    domain: 'biological',
    hazards: ['environment', 'radiation'],
    method: { en: 'Thermometer, on waking', es: 'Termómetro, al despertar' },
    explainer: {
      en: 'Immune changes in flight can make infections more likely. A rise is an early clue.',
      es: 'Los cambios inmunes en vuelo pueden facilitar infecciones. Un aumento es una pista temprana.',
    },
    bandsSource: pending,
    baselineSd: { watch: 2, act: 3 },
    worseWhen: 'high',
    decimals: 1,
  },
  // Cognitive-emotional
  {
    id: 'mood',
    label: { en: 'Mood', es: 'Estado de ánimo' },
    unit: '/10',
    domain: 'cognitive-emotional',
    hazards: ['isolation', 'distance'],
    method: { en: 'One-tap self-report, evening', es: 'Autorreporte de un toque, por la noche' },
    explainer: {
      en: 'Low days happen. A run of them is worth acting on early, before it grows.',
      es: 'Los días bajos pasan. Si se encadenan, conviene actuar pronto, antes de que crezca.',
    },
    bandsSource: pending,
    baselineSd: { watch: 1.5, act: 2.5 },
    worseWhen: 'low',
  },
  {
    id: 'stress',
    label: { en: 'Perceived stress', es: 'Estrés percibido' },
    unit: '/10',
    domain: 'cognitive-emotional',
    hazards: ['isolation', 'distance'],
    method: { en: 'One-tap self-report, evening', es: 'Autorreporte de un toque, por la noche' },
    explainer: {
      en: 'Stress that stays high for days affects sleep, focus and immunity.',
      es: 'El estrés que se mantiene alto varios días afecta el sueño, la concentración y la inmunidad.',
    },
    bandsSource: pending,
    baselineSd: { watch: 1.5, act: 2.5 },
    worseWhen: 'high',
  },
  {
    id: 'rt',
    label: { en: 'Reaction time', es: 'Tiempo de reacción' },
    unit: 'ms',
    domain: 'cognitive-emotional',
    hazards: ['isolation', 'gravity'],
    method: {
      en: '3-minute vigilance mini-game (check mode)',
      es: 'Minijuego de vigilancia de 3 minutos (modo chequeo)',
    },
    explainer: {
      en: 'Slower reactions often show fatigue before you feel it. Compared only with yourself.',
      es: 'Las reacciones lentas suelen mostrar fatiga antes de que la sientas. Solo se compara contigo.',
    },
    bandsSource: pending,
    baselineSd: { watch: 1.5, act: 2.5 },
    worseWhen: 'high',
  },
  // Social
  {
    id: 'contact',
    label: { en: 'Contact with family and friends', es: 'Contacto con familia y amistades' },
    unit: 'msgs/wk',
    domain: 'social',
    hazards: ['isolation', 'distance'],
    method: {
      en: 'Counted automatically from the Crew & Family module',
      es: 'Se cuenta automáticamente desde el módulo Tripulación y familia',
    },
    explainer: {
      en: 'Staying connected protects mood. A drop in contact is a gentle nudge, not a warning.',
      es: 'Mantenerte en contacto protege el ánimo. Una baja es un recordatorio amable, no una advertencia.',
    },
    bandsSource: pending,
    baselineSd: { watch: 1.5, act: 2.5 },
    worseWhen: 'low',
  },
  // Protective
  {
    id: 'exercise',
    label: { en: 'Exercise', es: 'Ejercicio' },
    unit: 'min',
    domain: 'protective',
    hazards: ['gravity'],
    method: { en: 'Logged from exercise device or by hand', es: 'Registrado desde el equipo de ejercicio o a mano' },
    explainer: {
      en: 'Exercise protects bone, muscle and heart in low gravity, and lifts mood.',
      es: 'El ejercicio protege hueso, músculo y corazón en baja gravedad, y mejora el ánimo.',
    },
    bandsSource: pending,
    baselineSd: { watch: 1.5, act: 2.5 },
    worseWhen: 'low',
  },
]

export function getIndicator(id: string): IndicatorDef | undefined {
  return INDICATORS.find((i) => i.id === id)
}
